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

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or restricted, falling back to storage events', e);
      }
    }

    // Storage fallback for cross-tab or older environments
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
    // Send via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('Failed to postMessage on BroadcastChannel', e);
      }
    }

    // Send via localStorage event trigger
    try {
      localStorage.setItem('THPT_SYNC_EVENT_' + Date.now(), JSON.stringify(msg));
      // Cleanup older events
      setTimeout(() => {
        try {
          const keys = Object.keys(localStorage).filter(k => k.startsWith('THPT_SYNC_EVENT_'));
          if (keys.length > 5) {
            keys.slice(0, keys.length - 3).forEach(k => localStorage.removeItem(k));
          }
        } catch {
          // ignore
        }
      }, 500);
    } catch {
      // ignore
    }

    // Also notify local listeners in the same window
    this.notifyListeners(msg);
  }

  public saveRoomToStorage(room: RoomState) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + room.roomPin, JSON.stringify(room));
      localStorage.setItem('THPT_LATEST_ROOM_PIN', room.roomPin);
    } catch (e) {
      console.warn('Failed to save room state to storage', e);
    }
  }

  public getRoomFromStorage(roomPin: string): RoomState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + roomPin);
      if (data) {
        return JSON.parse(data) as RoomState;
      }
    } catch (e) {
      console.warn('Failed to parse room from storage', e);
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
