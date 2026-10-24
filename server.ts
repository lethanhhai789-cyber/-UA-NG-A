import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOMS_CACHE_FILE = path.join(__dirname, '.rooms_cache.json');
const TEACHERS_CACHE_FILE = path.join(__dirname, '.teachers_cache.json');

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

interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  school: string;
  subject: string;
  phone: string;
  password: string;
  status: 'approved' | 'pending' | 'rejected';
  isMasterAdmin: boolean;
  createdAt: number;
}

// In-memory caches
const rooms = new Map<string, RoomData>();
const teachers = new Map<string, TeacherRecord>();
const sseClients = new Map<string, Set<express.Response>>();

// Load initial caches from disk
function loadCachesFromDisk() {
  try {
    if (fs.existsSync(ROOMS_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(ROOMS_CACHE_FILE, 'utf-8'));
      for (const [pin, room] of Object.entries(data)) {
        rooms.set(pin.toUpperCase(), room as RoomData);
      }
      console.log(`Loaded ${rooms.size} cached rooms from disk.`);
    }
  } catch (e) {
    console.warn('Failed to load rooms cache from disk', e);
  }

  try {
    if (fs.existsSync(TEACHERS_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TEACHERS_CACHE_FILE, 'utf-8'));
      for (const [id, t] of Object.entries(data)) {
        teachers.set(id, t as TeacherRecord);
      }
      console.log(`Loaded ${teachers.size} teachers from disk.`);
    }
  } catch (e) {
    console.warn('Failed to load teachers cache from disk', e);
  }

  // Pre-seed Master Admin Teacher: lethanhhai2905@gmail.com
  const masterEmail = 'lethanhhai2905@gmail.com';
  let masterExists = false;
  for (const t of teachers.values()) {
    if (t.email.toLowerCase() === masterEmail.toLowerCase()) {
      masterExists = true;
      t.status = 'approved';
      t.isMasterAdmin = true;
      break;
    }
  }

  if (!masterExists) {
    const masterTeacher: TeacherRecord = {
      id: 'teacher_master_01',
      name: 'Thầy Lê Thanh Hải (Chủ Tọa Quản Trị)',
      email: masterEmail,
      school: 'Trường THPT Chuyên',
      subject: 'Toán học & Công nghệ',
      phone: '0901234567',
      password: 'giaovien2026', // Default password
      status: 'approved',
      isMasterAdmin: true,
      createdAt: Date.now(),
    };
    teachers.set(masterTeacher.id, masterTeacher);
  }

  // Pre-seed a convenient demo teacher for instant test
  const demoEmail = 'giaovien@thpt.edu.vn';
  let demoExists = false;
  for (const t of teachers.values()) {
    if (t.email.toLowerCase() === demoEmail.toLowerCase()) {
      demoExists = true;
      break;
    }
  }
  if (!demoExists) {
    const demoTeacher: TeacherRecord = {
      id: 'teacher_demo_02',
      name: 'Cô Nguyễn Thu Hằng',
      email: demoEmail,
      school: 'THPT Chu Văn An',
      subject: 'Vật lý & Hóa học',
      phone: '0988776655',
      password: '123456',
      status: 'approved',
      isMasterAdmin: false,
      createdAt: Date.now(),
    };
    teachers.set(demoTeacher.id, demoTeacher);
  }

  persistTeachersToDisk();
}

function persistRoomsToDisk() {
  try {
    const obj: Record<string, RoomData> = {};
    for (const [pin, room] of rooms.entries()) {
      obj[pin] = room;
    }
    fs.writeFileSync(ROOMS_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save rooms to disk', e);
  }
}

function persistTeachersToDisk() {
  try {
    const obj: Record<string, TeacherRecord> = {};
    for (const [id, t] of teachers.entries()) {
      obj[id] = t;
    }
    fs.writeFileSync(TEACHERS_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save teachers to disk', e);
  }
}

loadCachesFromDisk();

function broadcastRoomUpdate(roomPin: string, room: RoomData) {
  const cleanPin = roomPin.toUpperCase();
  const clients = sseClients.get(cleanPin);
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

  // --- TEACHER AUTH & APPROVAL API ---

  // 1. Teacher Register
  app.post('/api/auth/teacher/register', (req, res) => {
    const { name, email, school, subject, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    for (const existing of teachers.values()) {
      if (existing.email.toLowerCase() === cleanEmail) {
        return res.status(400).json({ error: 'Email này đã được đăng ký trên hệ thống!' });
      }
    }

    const isMaster = cleanEmail === 'lethanhhai2905@gmail.com';
    const newTeacher: TeacherRecord = {
      id: `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      school: school?.trim() || 'Trường THPT',
      subject: subject?.trim() || 'Giáo viên THPT',
      phone: phone?.trim() || '',
      password: password.trim(),
      // Master email is automatically approved; others require admin approval!
      status: isMaster ? 'approved' : 'pending',
      isMasterAdmin: isMaster,
      createdAt: Date.now(),
    };

    teachers.set(newTeacher.id, newTeacher);
    persistTeachersToDisk();

    const { password: _, ...safeTeacher } = newTeacher;
    res.json({
      success: true,
      teacher: safeTeacher,
      message: isMaster
        ? 'Đăng ký thành công với quyền Quản trị viên!'
        : 'Đăng ký thành công! Thông tin của bạn đã được chuyển đến Quản trị viên để xác nhận tư cách Giáo viên. Vui lòng chờ phê duyệt để đăng nhập.',
    });
  });

  // 2. Teacher Login
  app.post('/api/auth/teacher/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập Email và Mật khẩu!' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let foundTeacher: TeacherRecord | null = null;

    for (const t of teachers.values()) {
      if (t.email.toLowerCase() === cleanEmail) {
        foundTeacher = t;
        break;
      }
    }

    if (!foundTeacher) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại. Vui lòng đăng ký tài khoản Giáo viên trước!' });
    }

    if (foundTeacher.password !== password.trim()) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác!' });
    }

    if (foundTeacher.status === 'pending') {
      return res.status(403).json({
        error: 'pending',
        message: 'Tài khoản của thầy/cô đã gửi thông tin và đang CHỜ QUẢN TRỊ VIÊN XÁC NHẬN quyền Giáo viên. Vui lòng liên hệ Admin (lethanhhai2905@gmail.com) để được duyệt vào hệ thống!',
      });
    }

    if (foundTeacher.status === 'rejected') {
      return res.status(403).json({
        error: 'rejected',
        message: 'Tài khoản này chưa được cấp quyền quản trị phòng thi. Vui lòng liên hệ Quản trị viên!',
      });
    }

    const { password: _, ...safeTeacher } = foundTeacher;
    res.json({
      success: true,
      teacher: safeTeacher,
      token: `token_${safeTeacher.id}_${Date.now()}`,
    });
  });

  // 3. Teacher List (For Admin Approval)
  app.get('/api/auth/teacher/list', (req, res) => {
    const teacherList = Array.from(teachers.values()).map(({ password: _, ...t }) => t);
    res.json({ teachers: teacherList });
  });

  // 4. Approve Teacher
  app.post('/api/auth/teacher/approve', (req, res) => {
    const { teacherId } = req.body;
    const t = teachers.get(teacherId);
    if (!t) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên' });
    }

    t.status = 'approved';
    persistTeachersToDisk();
    const { password: _, ...safeTeacher } = t;
    res.json({ success: true, teacher: safeTeacher });
  });

  // 5. Reject / Revoke Teacher
  app.post('/api/auth/teacher/reject', (req, res) => {
    const { teacherId } = req.body;
    const t = teachers.get(teacherId);
    if (!t) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên' });
    }

    t.status = 'rejected';
    persistTeachersToDisk();
    const { password: _, ...safeTeacher } = t;
    res.json({ success: true, teacher: safeTeacher });
  });

  // --- ROOM MANAGEMENT API ---

  // 1. Get room state by PIN
  app.get('/api/room/:pin', (req, res) => {
    const rawPin = req.params.pin || '';
    const pin = rawPin.trim().toUpperCase();

    let room = rooms.get(pin);
    if (!room) {
      // Try finding case-insensitive or trimmed in map
      for (const [k, v] of rooms.entries()) {
        if (k.trim().toUpperCase() === pin) {
          room = v;
          break;
        }
      }
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found', pin });
    }
    res.json({ room });
  });

  // 2. Sync / update room state (from Host Teacher)
  app.post('/api/room/sync', (req, res) => {
    const { state } = req.body;
    if (!state || !state.roomPin) {
      return res.status(400).json({ error: 'Invalid room state' });
    }

    const pin = String(state.roomPin).trim().toUpperCase();
    const existing = rooms.get(pin);

    // Merge students from existing room if any were already connected
    if (existing && existing.teams) {
      state.teams.forEach((newTeam: any) => {
        const oldTeam = existing.teams.find((t: any) => t.id === newTeam.id);
        if (oldTeam && oldTeam.members) {
          const memberMap = new Map();
          newTeam.members.forEach((m: any) => memberMap.set(m.id, m));
          oldTeam.members.forEach((m: any) => {
            if (!memberMap.has(m.id)) {
              newTeam.members.push(m);
            } else {
              const current = memberMap.get(m.id);
              current.answers = { ...m.answers, ...current.answers };
            }
          });
        }
      });
    }

    state.lastUpdated = Date.now();
    rooms.set(pin, state);
    persistRoomsToDisk();
    broadcastRoomUpdate(pin, state);

    res.json({ success: true, room: state });
  });

  // 3. Student join room
  app.post('/api/room/:pin/join', (req, res) => {
    const rawPin = req.params.pin || '';
    const pin = rawPin.trim().toUpperCase();
    const { student } = req.body;

    if (!student || !student.name) {
      return res.status(400).json({ error: 'Missing student details' });
    }

    let room = rooms.get(pin);
    if (!room) {
      for (const [k, v] of rooms.entries()) {
        if (k.trim().toUpperCase() === pin) {
          room = v;
          break;
        }
      }
    }

    if (!room) {
      return res.status(404).json({ error: `Phòng thi ${pin} chưa được giáo viên khởi tạo trên hệ thống!` });
    }

    let allMembers: any[] = room.teams.flatMap((t: any) => t.members || []);
    let existingStudent = allMembers.find((m: any) => m.id === student.id);

    if (!existingStudent) {
      const sortedTeams = [...room.teams].sort((a: any, b: any) => (a.members?.length || 0) - (b.members?.length || 0));
      const targetTeam = sortedTeams[0] || room.teams[0];

      const newStudent: StudentData = {
        id: student.id || `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    persistRoomsToDisk();
    broadcastRoomUpdate(pin, room);

    res.json({ success: true, student: existingStudent, room });
  });

  // 4. Student submit answer
  app.post('/api/room/:pin/answer', (req, res) => {
    const pin = (req.params.pin || '').trim().toUpperCase();
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
    persistRoomsToDisk();
    broadcastRoomUpdate(pin, room);

    res.json({ success: true, isCorrect });
  });

  // 5. Server-Sent Events stream for real-time mobile push
  app.get('/api/room/:pin/stream', (req, res) => {
    const pin = (req.params.pin || '').trim().toUpperCase();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!sseClients.has(pin)) {
      sseClients.set(pin, new Set());
    }
    const clientSet = sseClients.get(pin)!;
    clientSet.add(res);

    const room = rooms.get(pin);
    if (room) {
      res.write(`data: ${JSON.stringify({ type: 'STATE_UPDATE', state: room })}\n\n`);
    }

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
