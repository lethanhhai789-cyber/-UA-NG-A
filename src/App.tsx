import React, { useState, useEffect, useCallback } from 'react';
import { CameraMode, Question, RaceReportData, RoomState, Student, SubjectId, Team } from './types';
import { DEFAULT_TEAMS_CONFIG, SAMPLE_QUESTIONS } from './services/questionsData';
import { syncChannel } from './services/syncChannel';
import { sound } from './services/soundEffects';
import { LobbySetup } from './components/LobbySetup';
import { TeacherHostView } from './components/TeacherHostView';
import { StudentMobileView } from './components/StudentMobileView';
import { QuestionBankModal } from './components/QuestionBankModal';
import { RaceReportModal } from './components/RaceReportModal';
import { Monitor, Smartphone, BookOpen, Layers } from 'lucide-react';

export default function App() {
  // Navigation / View mode: 'host' (Teacher/Projector), 'student' (Mobile exam app), 'split' (Host + Student side by side)
  const [viewMode, setViewMode] = useState<'host' | 'student' | 'split'>('host');

  // Question bank state
  const [allQuestions, setAllQuestions] = useState<Question[]>(SAMPLE_QUESTIONS);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);

  // Report Modal state
  const [reportModalData, setReportModalData] = useState<RaceReportData | null>(null);

  // Generate initial room
  const generateInitialRoom = useCallback((subject: SubjectId = 'toan', teamCount: number = 4): RoomState => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    const subjectQuestions = allQuestions.filter((q) => q.subject === subject);
    const questionsToUse = subjectQuestions.length > 0 ? subjectQuestions : allQuestions.slice(0, 5);

    const initialTeams: Team[] = DEFAULT_TEAMS_CONFIG.slice(0, teamCount).map((cfg, idx) => ({
      id: `team_${idx + 1}`,
      index: idx,
      name: cfg.name,
      colorHex: cfg.colorHex,
      clothColorHex: cfg.clothColorHex,
      jockeyColorHex: cfg.jockeyColorHex,
      horseColor: cfg.horseColor,
      progress: 0,
      score: 0,
      speed: 0,
      consecutiveCorrect: 0,
      hurdlesCleared: 0,
      isJumpingHurdle: false,
      jumpProgress: 0,
      laneIndex: idx,
      currentRank: idx + 1,
      members: [],
    }));

    return {
      roomPin: randomPin,
      title: 'Vòng Đua Khởi Động Ôn Thi THPT Quốc Gia',
      subject: subject,
      totalTeams: teamCount,
      currentQuestionIndex: 0,
      status: 'lobby',
      timeRemaining: 25,
      initialTimeLimit: 25,
      questions: questionsToUse,
      teams: initialTeams,
      cameraMode: 'broadcast' as CameraMode,
      autoPlayBots: true,
      lastUpdated: Date.now(),
    };
  }, [allQuestions]);

  const [roomState, setRoomState] = useState<RoomState>(() => generateInitialRoom('toan', 4));

  // Sync state broadcast whenever roomState changes
  useEffect(() => {
    syncChannel.broadcast({
      type: 'STATE_UPDATE',
      state: roomState,
    });
    syncChannel.saveRoomToStorage(roomState);
  }, [roomState]);

  // Subscribe to real-time sync events (Student Join & Student Answer)
  useEffect(() => {
    const unsub = syncChannel.subscribe((msg) => {
      if (msg.type === 'STUDENT_JOIN') {
        const studentData = msg.student;
        if (studentData.roomPin === roomState.roomPin) {
          setRoomState((prev) => {
            // Check if already in
            let allMembers = prev.teams.flatMap((t) => t.members);
            if (allMembers.some((m) => m.id === studentData.id)) {
              return prev;
            }

            // Assign to team with fewest members
            const sortedTeams = [...prev.teams].sort((a, b) => a.members.length - b.members.length);
            const targetTeam = sortedTeams[0] || prev.teams[0];

            const newStudent: Student = {
              id: studentData.id,
              name: studentData.name,
              className: studentData.className,
              teamId: targetTeam.id,
              joinedAt: Date.now(),
              answers: {},
            };

            const updatedTeams = prev.teams.map((t) => {
              if (t.id === targetTeam.id) {
                return {
                  ...t,
                  members: [...t.members, newStudent],
                };
              }
              return t;
            });

            return {
              ...prev,
              teams: updatedTeams,
              lastUpdated: Date.now(),
            };
          });
        }
      } else if (msg.type === 'STUDENT_ANSWER') {
        if (msg.roomPin === roomState.roomPin) {
          setRoomState((prev) => {
            const currentQ = prev.questions[prev.currentQuestionIndex];
            if (!currentQ || currentQ.id !== msg.questionId) return prev;

            const isCorrect = msg.chosenIndex === currentQ.correctIndex;

            const updatedTeams = prev.teams.map((t) => {
              const updatedMembers = t.members.map((m) => {
                if (m.id === msg.studentId) {
                  return {
                    ...m,
                    answers: {
                      ...m.answers,
                      [msg.questionId]: {
                        chosenIndex: msg.chosenIndex,
                        isCorrect,
                        responseTimeSec: msg.responseTimeSec,
                        bloomLevel: currentQ.bloomLevel,
                        timestamp: Date.now(),
                      },
                    },
                  };
                }
                return m;
              });

              return {
                ...t,
                members: updatedMembers,
              };
            });

            return {
              ...prev,
              teams: updatedTeams,
              lastUpdated: Date.now(),
            };
          });
        }
      }
    });

    return () => unsub();
  }, [roomState.roomPin]);

  // Handle Subject change
  const handleSelectSubject = (subj: SubjectId) => {
    const subjectQuestions = allQuestions.filter((q) => q.subject === subj);
    setRoomState((prev) => ({
      ...prev,
      subject: subj,
      questions: subjectQuestions.length > 0 ? subjectQuestions : prev.questions,
      currentQuestionIndex: 0,
    }));
  };

  // Handle Team Count change
  const handleChangeTotalTeams = (count: number) => {
    const newTeams: Team[] = DEFAULT_TEAMS_CONFIG.slice(0, count).map((cfg, idx) => ({
      id: `team_${idx + 1}`,
      index: idx,
      name: cfg.name,
      colorHex: cfg.colorHex,
      clothColorHex: cfg.clothColorHex,
      jockeyColorHex: cfg.jockeyColorHex,
      horseColor: cfg.horseColor,
      progress: 0,
      score: 0,
      speed: 0,
      consecutiveCorrect: 0,
      hurdlesCleared: 0,
      isJumpingHurdle: false,
      jumpProgress: 0,
      laneIndex: idx,
      currentRank: idx + 1,
      members: [],
    }));

    setRoomState((prev) => ({
      ...prev,
      totalTeams: count,
      teams: newTeams,
    }));
  };

  // Start Race: sound fanfare + transition to first question
  const handleStartRace = () => {
    sound.playCallToThePost();
    setTimeout(() => {
      sound.startGallopSound();
      setRoomState((prev) => ({
        ...prev,
        status: 'question_active',
        timeRemaining: prev.initialTimeLimit,
        currentQuestionIndex: 0,
      }));
    }, 1800);
  };

  const handleResetToLobby = () => {
    setRoomState((prev) => ({
      ...prev,
      status: 'lobby',
      currentQuestionIndex: 0,
      teams: prev.teams.map((t) => ({
        ...t,
        progress: 0,
        score: 0,
        hurdlesCleared: 0,
        consecutiveCorrect: 0,
      })),
    }));
  };

  const allConnectedStudents = roomState.teams.flatMap((t) => t.members);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Application Navigation Bar */}
      <header className="h-[68px] px-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between z-30 select-none">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 via-yellow-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
            🏇
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <span>Đua Ngựa Tri Thức THPT</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                3D EdTech
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Hệ thống trắc nghiệm phân hóa Bloom & vượt rào Vận dụng cao
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Host vs Student vs Split) */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('host')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              viewMode === 'host'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Màn Hình Giáo Viên (Host)</span>
            <span className="sm:hidden">Host</span>
          </button>

          <button
            onClick={() => setViewMode('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              viewMode === 'student'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Giao Diện Sĩ Tử (Mobile)</span>
            <span className="sm:hidden">Sĩ tử</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              viewMode === 'split'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Xem đồng thời màn hình Giáo viên và Sĩ tử để đánh giá tương tác thời gian thực"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xem Đồng Thời (Split)</span>
          </button>
        </div>

        {/* Right Action: Open Question Bank */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuestionBankOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Ngân Hàng Đề Thi</span>
          </button>
        </div>

      </header>

      {/* Main View Container */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* VIEW 1: HOST TEACHER SCREEN */}
        {viewMode === 'host' && (
          <div className="flex-1 flex flex-col">
            {roomState.status === 'lobby' ? (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <LobbySetup
                  roomPin={roomState.roomPin}
                  selectedSubject={roomState.subject}
                  onSelectSubject={handleSelectSubject}
                  totalTeams={roomState.totalTeams}
                  onChangeTotalTeams={handleChangeTotalTeams}
                  teams={roomState.teams}
                  students={allConnectedStudents}
                  autoPlayBots={roomState.autoPlayBots}
                  onToggleBots={(enabled) => setRoomState((p) => ({ ...p, autoPlayBots: enabled }))}
                  onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
                  onStartRace={handleStartRace}
                  onOpenStudentTab={() => setViewMode('split')}
                />
              </div>
            ) : (
              <TeacherHostView
                roomState={roomState}
                onUpdateRoom={setRoomState}
                onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
                onOpenReportModal={(report) => setReportModalData(report)}
                onResetToLobby={handleResetToLobby}
              />
            )}
          </div>
        )}

        {/* VIEW 2: STUDENT MOBILE APP SCREEN */}
        {viewMode === 'student' && (
          <div className="flex-1 flex flex-col">
            <StudentMobileView
              initialRoomPin={roomState.roomPin}
              onBackToHost={() => setViewMode('host')}
            />
          </div>
        )}

        {/* VIEW 3: SPLIT DEMO VIEW (Host on left, Student Phone on right) */}
        {viewMode === 'split' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Host half (8 cols) */}
            <div className="lg:col-span-8 border-r border-slate-800 flex flex-col h-[calc(100vh-68px)] overflow-hidden">
              <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>MÀN CHIẾU GIÁO VIÊN (PROJECTOR / HOST)</span>
                <span className="text-slate-400 text-[11px]">Mã PIN: {roomState.roomPin}</span>
              </div>
              <div className="flex-1 relative overflow-hidden">
                {roomState.status === 'lobby' ? (
                  <div className="p-4 overflow-y-auto h-full">
                    <LobbySetup
                      roomPin={roomState.roomPin}
                      selectedSubject={roomState.subject}
                      onSelectSubject={handleSelectSubject}
                      totalTeams={roomState.totalTeams}
                      onChangeTotalTeams={handleChangeTotalTeams}
                      teams={roomState.teams}
                      students={allConnectedStudents}
                      autoPlayBots={roomState.autoPlayBots}
                      onToggleBots={(enabled) => setRoomState((p) => ({ ...p, autoPlayBots: enabled }))}
                      onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
                      onStartRace={handleStartRace}
                      onOpenStudentTab={() => {}}
                    />
                  </div>
                ) : (
                  <TeacherHostView
                    roomState={roomState}
                    onUpdateRoom={setRoomState}
                    onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
                    onOpenReportModal={(report) => setReportModalData(report)}
                    onResetToLobby={handleResetToLobby}
                  />
                )}
              </div>
            </div>

            {/* Student half (4 cols) - phone simulator */}
            <div className="lg:col-span-4 bg-slate-950 flex flex-col h-[calc(100vh-68px)] overflow-y-auto border-t lg:border-t-0 border-slate-800">
              <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span>THIẾT BỊ SĨ TỬ (SMARTPHONE SIMULATOR)</span>
                <span className="text-[11px] text-slate-400">Đồng bộ tức thì</span>
              </div>
              <div className="flex-1">
                <StudentMobileView initialRoomPin={roomState.roomPin} />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Question Bank Modal */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        questions={allQuestions}
        onUpdateQuestions={(newQs) => {
          setAllQuestions(newQs);
          // Update room questions as well
          setRoomState((prev) => ({
            ...prev,
            questions: newQs.filter((q) => q.subject === prev.subject),
          }));
        }}
        currentSubject={roomState.subject}
      />

      {/* Race Pedagogical Report Modal */}
      {reportModalData && (
        <RaceReportModal
          isOpen={Boolean(reportModalData)}
          onClose={() => setReportModalData(null)}
          report={reportModalData}
        />
      )}

    </div>
  );
}
