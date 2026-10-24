import { RoomState, Student } from '../types';

export type SyncMessage = 
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'STUDENT_JOIN'; student: Omit<Student, 'teamId' | 'answers' | 'joinedAt'> & { roomPin: string } }
  | { type: 'STUDENT_ANSWER'; roomPin: string; studentId: string; questionId: string; chosenIndex: number; responseTimeSec: number }
  | { type: 'REQUEST_SYNC'; roomPin: string };

const CHANNEL_NAME = 'THPT_HORSE_RACE_SYNC_V1';
const STORAGE_KEY_PREFIX = 'THPT_RACE_ROOM_';

class SyncChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((msg: SyncMessage) => void)[] = [];
  private activeEventSource: EventSource | null = null;
  private activeSsePin: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('THPT_SYNC_EVENT_') && e.newValue) {
          try {
            const data: SyncMessage = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public broadcast(msg: SyncMessage) {
    // 1. BroadcastChannel for local tabs
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        // ignore
      }
    }

    // 2. Storage event
    try {
      localStorage.setItem('THPT_SYNC_EVENT_' + Date.now(), JSON.stringify(msg));
    } catch {
      // ignore
    }

    // 3. Server HTTP Sync
    if (msg.type === 'STATE_UPDATE') {
      this.saveRoomToServer(msg.state);
    } else if (msg.type === 'STUDENT_JOIN') {
      this.joinRoomOnServer(msg.student);
    } else if (msg.type === 'STUDENT_ANSWER') {
      this.submitAnswerToServer(msg);
    }

    // 4. Local listeners in same tab
    this.notifyListeners(msg);
  }

  // --- SERVER INTEGRATIONS ---

  public async saveRoomToServer(state: RoomState) {
    try {
      await fetch('/api/room/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
    } catch (e) {
      // offline/fallback to local
    }
  }

  public async fetchRoomFromServer(pin: string): Promise<RoomState | null> {
    try {
      const res = await fetch(`/api/room/${pin.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        return data.room as RoomState;
      }
    } catch (e) {
      // fallback
    }
    return null;
  }

  public async joinRoomOnServer(student: Omit<Student, 'teamId' | 'answers' | 'joinedAt'> & { roomPin: string }) {
    try {
      const res = await fetch(`/api/room/${student.roomPin.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          this.notifyListeners({ type: 'STATE_UPDATE', state: data.room });
        }
        return data.student;
      }
    } catch (e) {
      console.warn('Failed to join on server, using local fallback', e);
    }
    return null;
  }

  public async submitAnswerToServer(data: {
    roomPin: string;
    studentId: string;
    questionId: string;
    chosenIndex: number;
    responseTimeSec: number;
  }) {
    try {
      await fetch(`/api/room/${data.roomPin.toUpperCase()}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Failed to submit answer to server', e);
    }
  }

  /**
   * Connect to Server-Sent Events stream for real-time mobile push
   */
  public connectSse(pin: string) {
    const formattedPin = pin.toUpperCase();
    if (this.activeSsePin === formattedPin && this.activeEventSource) {
      return;
    }

    this.disconnectSse();
    this.activeSsePin = formattedPin;

    try {
      const es = new EventSource(`/api/room/${formattedPin}/stream`);
      this.activeEventSource = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'STATE_UPDATE') {
            this.notifyListeners(data);
          }
        } catch (e) {
          // ignore
        }
      };

      es.onerror = () => {
        // SSE disconnected, will retry automatically or fallback to polling
      };
    } catch (e) {
      console.warn('Failed to start EventSource', e);
    }
  }

  public disconnectSse() {
    if (this.activeEventSource) {
      this.activeEventSource.close();
      this.activeEventSource = null;
      this.activeSsePin = null;
    }
  }

  public saveRoomToStorage(room: RoomState) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + room.roomPin, JSON.stringify(room));
      localStorage.setItem('THPT_LATEST_ROOM_PIN', room.roomPin);
    } catch (e) {
      // ignore
    }
  }

  public getRoomFromStorage(roomPin: string): RoomState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + roomPin);
      if (data) {
        return JSON.parse(data) as RoomState;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public getLatestRoomPin(): string | null {
    try {
      return localStorage.getItem('THPT_LATEST_ROOM_PIN');
    } catch {
      return null;
    }
  }

  private notifyListeners(msg: SyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in sync listener', err);
      }
    });
  }
}

export const syncChannel = new SyncChannelService();
