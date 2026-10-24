import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AnswerRecord {
  chosenIndex: number;
  isCorrect: boolean;
  responseTimeSec: number;
  bloomLevel: string;
  timestamp: number;
}

interface StudentData {
  id: string;
  name: string;
  className: string;
  teamId: string;
  joinedAt: number;
  answers: Record<string, AnswerRecord>;
}

interface RoomData {
  roomPin: string;
  title: string;
  subject: string;
  totalTeams: number;
  currentQuestionIndex: number;
  status: string;
  timeRemaining: number;
  initialTimeLimit: number;
  questions: any[];
  teams: any[];
  cameraMode: string;
  autoPlayBots: boolean;
  lastUpdated: number;
  hurdleJumpTeamId?: string | null;
}

const rooms = new Map<string, RoomData>();
const sseClients = new Map<string, Set<express.Response>>();

function broadcastRoomUpdate(roomPin: string, room: RoomData) {
  const clients = sseClients.get(roomPin);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify({ type: 'STATE_UPDATE', state: room })}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch (err) {
        clients.delete(res);
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '2mb' }));

  // API Routes
  // 1. Get room state
  app.get('/api/room/:pin', (req, res) => {
    const pin = req.params.pin.toUpperCase();
    const room = rooms.get(pin);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ room });
  });

  // 2. Sync / update room state (from Host Teacher)
  app.post('/api/room/sync', (req, res) => {
    const { state } = req.body;
    if (!state || !state.roomPin) {
      return res.status(400).json({ error: 'Invalid room state' });
    }

    const pin = state.roomPin.toUpperCase();
    const existing = rooms.get(pin);

    // Merge students from existing room if any were already connected
    if (existing && existing.teams) {
      state.teams.forEach((newTeam: any) => {
        const oldTeam = existing.teams.find((t: any) => t.id === newTeam.id);
        if (oldTeam && oldTeam.members) {
          // Keep members that might have joined on server
          const memberMap = new Map();
          newTeam.members.forEach((m: any) => memberMap.set(m.id, m));
          oldTeam.members.forEach((m: any) => {
            if (!memberMap.has(m.id)) {
              newTeam.members.push(m);
            } else {
              // merge answers
              const current = memberMap.get(m.id);
              current.answers = { ...m.answers, ...current.answers };
            }
          });
        }
      });
    }

    state.lastUpdated = Date.now();
    rooms.set(pin, state);
    broadcastRoomUpdate(pin, state);

    res.json({ success: true, room: state });
  });

  // 3. Student join room
  app.post('/api/room/:pin/join', (req, res) => {
    const pin = req.params.pin.toUpperCase();
    const { student } = req.body;

    if (!student || !student.name) {
      return res.status(400).json({ error: 'Missing student details' });
    }

    let room = rooms.get(pin);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if student already in room
    let allMembers: any[] = room.teams.flatMap((t: any) => t.members || []);
    let existingStudent = allMembers.find((m: any) => m.id === student.id);

    if (!existingStudent) {
      // Assign student to the team with least members
      const sortedTeams = [...room.teams].sort((a: any, b: any) => (a.members?.length || 0) - (b.members?.length || 0));
      const targetTeam = sortedTeams[0] || room.teams[0];

      const newStudent: StudentData = {
        id: student.id || `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: student.name.trim(),
        className: student.className?.trim() || '12A',
        teamId: targetTeam.id,
        joinedAt: Date.now(),
        answers: {},
      };

      if (!targetTeam.members) targetTeam.members = [];
      targetTeam.members.push(newStudent);
      existingStudent = newStudent;
    }

    room.lastUpdated = Date.now();
    rooms.set(pin, room);
    broadcastRoomUpdate(pin, room);

    res.json({ success: true, student: existingStudent, room });
  });

  // 4. Student submit answer
  app.post('/api/room/:pin/answer', (req, res) => {
    const pin = req.params.pin.toUpperCase();
    const { studentId, questionId, chosenIndex, responseTimeSec } = req.body;

    const room = rooms.get(pin);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ) {
      return res.status(400).json({ error: 'No active question' });
    }

    const isCorrect = chosenIndex === currentQ.correctIndex;

    // Find student and record answer
    let found = false;
    for (const team of room.teams) {
      if (team.members) {
        for (const member of team.members) {
          if (member.id === studentId) {
            member.answers = member.answers || {};
            member.answers[questionId] = {
              chosenIndex,
              isCorrect,
              responseTimeSec: responseTimeSec || 1,
              bloomLevel: currentQ.bloomLevel,
              timestamp: Date.now(),
            };
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }

    room.lastUpdated = Date.now();
    rooms.set(pin, room);
    broadcastRoomUpdate(pin, room);

    res.json({ success: true, isCorrect });
  });

  // 5. Server-Sent Events stream for real-time push to students
  app.get('/api/room/:pin/stream', (req, res) => {
    const pin = req.params.pin.toUpperCase();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!sseClients.has(pin)) {
      sseClients.set(pin, new Set());
    }
    const clientSet = sseClients.get(pin)!;
    clientSet.add(res);

    // Send immediate state if room exists
    const room = rooms.get(pin);
    if (room) {
      res.write(`data: ${JSON.stringify({ type: 'STATE_UPDATE', state: room })}\n\n`);
    }

    // Ping to keep connection alive
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (e) {
        clearInterval(pingInterval);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      clientSet.delete(res);
      if (clientSet.size === 0) {
        sseClients.delete(pin);
      }
    });
  });

  // Vite Integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
