export type BloomLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export type SubjectId = 
  | 'toan'
  | 'vat_ly'
  | 'hoa_hoc'
  | 'sinh_hoc'
  | 'lich_su'
  | 'dia_ly'
  | 'tieng_anh';

export interface Question {
  id: string;
  subject: SubjectId;
  subjectName: string;
  bloomLevel: BloomLevel;
  text: string;
  options: [string, string, string, string]; // [A, B, C, D]
  correctIndex: number; // 0, 1, 2, 3
  explanation: string;
  sourceExam?: string;
}

export interface Team {
  id: string;
  index: number;
  name: string;
  colorHex: string;
  clothColorHex: string;
  jockeyColorHex: string;
  horseColor: string; // 'white' | 'red_chestnut' | 'gold' | 'black' | 'brown' | 'dappled' | 'grey' | 'palomino'
  progress: number; // 0 to 100 (%)
  score: number;
  speed: number;
  consecutiveCorrect: number;
  hurdlesCleared: number;
  isJumpingHurdle: boolean;
  jumpProgress: number; // 0 to 1
  laneIndex: number;
  currentRank: number;
  members: Student[];
}

export interface Student {
  id: string;
  name: string;
  className: string;
  teamId: string;
  joinedAt: number;
  answers: Record<string, {
    chosenIndex: number;
    isCorrect: boolean;
    responseTimeSec: number;
    bloomLevel: BloomLevel;
    timestamp: number;
  }>;
}

export type RaceStatus = 
  | 'lobby'
  | 'countdown'
  | 'question_active'
  | 'revealed'
  | 'hurdle_replay'
  | 'finished';

export type CameraMode = 'broadcast' | 'chase' | 'overhead' | 'dynamic';

export interface RoomState {
  roomPin: string;
  title: string;
  subject: SubjectId;
  totalTeams: number;
  currentQuestionIndex: number;
  status: RaceStatus;
  timeRemaining: number;
  initialTimeLimit: number;
  questions: Question[];
  teams: Team[];
  cameraMode: CameraMode;
  autoPlayBots: boolean;
  lastUpdated: number;
  hurdleQuestionIndex?: number;
}

export interface RaceReportData {
  roomPin: string;
  title: string;
  subjectName: string;
  dateStr: string;
  totalQuestions: number;
  totalStudents: number;
  winningTeam: Team;
  teams: Team[];
  students: Student[];
  questions: Question[];
  bloomStats: {
    level: BloomLevel;
    total: number;
    correct: number;
    accuracyPercent: number;
  }[];
  difficultQuestions: {
    question: Question;
    wrongCount: number;
    totalAnswers: number;
    wrongPercent: number;
  }[];
}
