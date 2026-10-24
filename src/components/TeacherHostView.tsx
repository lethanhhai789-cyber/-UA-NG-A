import React, { useState, useEffect } from 'react';
import { CameraMode, Question, RaceReportData, RoomState, Student, Team } from '../types';
import { sound } from '../services/soundEffects';
import { syncChannel } from '../services/syncChannel';
import { RaceTrack3D } from './3d/RaceTrack3D';
import {
  Trophy,
  Volume2,
  VolumeX,
  Camera,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Award,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeacherHostViewProps {
  roomState: RoomState;
  onUpdateRoom: (updater: (prev: RoomState) => RoomState) => void;
  onOpenQuestionBank: () => void;
  onOpenReportModal: (report: RaceReportData) => void;
  onResetToLobby: () => void;
}

export const TeacherHostView: React.FC<TeacherHostViewProps> = ({
  roomState,
  onUpdateRoom,
  onOpenQuestionBank,
  onOpenReportModal,
  onResetToLobby,
}) => {
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [hurdleJumpTeamId, setHurdleJumpTeamId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  const currentQ = roomState.questions[roomState.currentQuestionIndex];
  const isQuestionActive = roomState.status === 'question_active';
  const isRevealed = roomState.status === 'revealed' || roomState.status === 'hurdle_replay';
  const isFinished = roomState.status === 'finished';

  // Countdown timer loop
  useEffect(() => {
    let timer: number;
    if (isQuestionActive && roomState.timeRemaining > 0) {
      timer = window.setInterval(() => {
        onUpdateRoom((prev) => {
          if (prev.timeRemaining <= 1) {
            // Auto reveal when timer hits 0
            return {
              ...prev,
              timeRemaining: 0,
              status: 'revealed',
            };
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isQuestionActive, roomState.timeRemaining]);

  // Handle Hurdle jump sound when hurdle team triggers
  useEffect(() => {
    if (hurdleJumpTeamId) {
      sound.playHurdleJumpSound();
    }
  }, [hurdleJumpTeamId]);

  // Handle race finish celebration
  useEffect(() => {
    if (isFinished) {
      sound.stopGallopSound();
      sound.playVictoryMelody();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [isFinished]);

  // Reveal Answer & Calculate Team Progress
  const handleRevealAnswer = () => {
    if (!currentQ) return;

    sound.playCorrectSound();

    onUpdateRoom((prev) => {
      let jumpingTeam: string | null = null;
      const isVdc = currentQ.bloomLevel === 'Vận dụng cao';

      // Update teams progress and scores
      const updatedTeams = prev.teams.map((t) => {
        // Collect answers from team members
        const memberAnswers = t.members.map((m) => m.answers[currentQ.id]).filter(Boolean);
        let correctCount = memberAnswers.filter((a) => a.isCorrect).length;

        // If bot simulation is enabled and no real member answered, simulate
        if (prev.autoPlayBots && memberAnswers.length === 0) {
          // Simulation probability: Bloom level based
          const accuracyChance = isVdc ? 0.65 : 0.85;
          const isBotCorrect = Math.random() < accuracyChance;
          if (isBotCorrect) correctCount = 1;

          // Register bot student answer into members
          const botId = `bot_${t.id}`;
          let botStudent = t.members.find((m) => m.id === botId);
          if (!botStudent) {
            botStudent = {
              id: botId,
              name: `Sĩ tử ${t.name}`,
              className: '12 Bot',
              teamId: t.id,
              joinedAt: Date.now(),
              answers: {},
            };
            t.members.push(botStudent);
          }
          botStudent.answers[currentQ.id] = {
            chosenIndex: isBotCorrect ? currentQ.correctIndex : (currentQ.correctIndex + 1) % 4,
            isCorrect: isBotCorrect,
            responseTimeSec: Math.floor(Math.random() * 8) + 3,
            bloomLevel: currentQ.bloomLevel,
            timestamp: Date.now(),
          };
        }

        const teamGotCorrect = correctCount > 0;
        let scoreGain = 0;
        let progressGain = 0;

        if (teamGotCorrect) {
          // Bloom based score and progress points
          switch (currentQ.bloomLevel) {
            case 'Nhận biết':
              scoreGain = 100;
              progressGain = 10;
              break;
            case 'Thông hiểu':
              scoreGain = 150;
              progressGain = 15;
              break;
            case 'Vận dụng':
              scoreGain = 200;
              progressGain = 20;
              break;
            case 'Vận dụng cao':
              scoreGain = 350;
              progressGain = 30; // Huge sprint jump!
              break;
          }

          if (isVdc && !jumpingTeam) {
            jumpingTeam = t.id; // Trigger hurdle jump for leading correct horse
          }
        }

        const newProgress = Math.min(100, t.progress + progressGain);
        const newScore = t.score + scoreGain;
        const newHurdles = isVdc && teamGotCorrect ? t.hurdlesCleared + 1 : t.hurdlesCleared;

        return {
          ...t,
          score: newScore,
          progress: newProgress,
          hurdlesCleared: newHurdles,
          consecutiveCorrect: teamGotCorrect ? t.consecutiveCorrect + 1 : 0,
        };
      });

      // Check if any horse reached 100% or end of questions
      const hasWinner = updatedTeams.some((t) => t.progress >= 100);
      const isLastQ = prev.currentQuestionIndex >= prev.questions.length - 1;
      const nextStatus = isVdc && jumpingTeam ? 'hurdle_replay' : 'revealed';

      if (jumpingTeam) {
        setHurdleJumpTeamId(jumpingTeam);
      }

      return {
        ...prev,
        teams: updatedTeams,
        status: hasWinner && isLastQ ? 'finished' : nextStatus,
      };
    });
  };

  const handleNextQuestion = () => {
    sound.startGallopSound();
    setHurdleJumpTeamId(null);

    onUpdateRoom((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return {
          ...prev,
          status: 'finished',
        };
      }
      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        timeRemaining: prev.initialTimeLimit,
        status: 'question_active',
      };
    });
  };

  const handleFinishRace = () => {
    onUpdateRoom((prev) => ({ ...prev, status: 'finished' }));
  };

  const handleShowReport = () => {
    const sortedTeams = [...roomState.teams].sort((a, b) => b.score - a.score || b.progress - a.progress);
    const winningTeam = sortedTeams[0] || roomState.teams[0];

    // Gather all students
    const allStudents: Student[] = [];
    roomState.teams.forEach((t) => {
      allStudents.push(...t.members);
    });

    // Calculate Bloom stats
    const bloomLevels: ('Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao')[] = [
      'Nhận biết',
      'Thông hiểu',
      'Vận dụng',
      'Vận dụng cao',
    ];

    const bloomStats = bloomLevels.map((lvl) => {
      let total = 0;
      let correct = 0;
      allStudents.forEach((s) => {
        Object.values(s.answers).forEach((a) => {
          if (a.bloomLevel === lvl) {
            total++;
            if (a.isCorrect) correct++;
          }
        });
      });
      return {
        level: lvl,
        total: total || 1,
        correct,
        accuracyPercent: total > 0 ? Math.round((correct / total) * 100) : 85,
      };
    });

    // Calculate difficult questions
    const difficultQuestions = roomState.questions
      .map((q) => {
        let total = 0;
        let wrong = 0;
        allStudents.forEach((s) => {
          const a = s.answers[q.id];
          if (a) {
            total++;
            if (!a.isCorrect) wrong++;
          }
        });
        const wrongPercent = total > 0 ? Math.round((wrong / total) * 100) : 0;
        return {
          question: q,
          wrongCount: wrong,
          totalAnswers: total,
          wrongPercent,
        };
      })
      .filter((item) => item.wrongPercent > 0)
      .sort((a, b) => b.wrongPercent - a.wrongPercent);

    const reportData: RaceReportData = {
      roomPin: roomState.roomPin,
      title: roomState.title,
      subjectName: currentQ ? currentQ.subjectName : 'THPT Quốc Gia',
      dateStr: new Date().toLocaleDateString('vi-VN'),
      totalQuestions: roomState.questions.length,
      totalStudents: allStudents.length,
      winningTeam,
      teams: roomState.teams,
      students: allStudents,
      questions: roomState.questions,
      bloomStats,
      difficultQuestions,
    };

    onOpenReportModal(reportData);
  };

  const sortedTeams = [...roomState.teams].sort((a, b) => b.progress - a.progress);

  return (
    <div className="relative w-full h-[calc(100vh-68px)] bg-slate-950 overflow-hidden flex flex-col">
      
      {/* 3D RACING VIEWPORT (100% full screen presence) */}
      <div className="absolute inset-0 z-0">
        <RaceTrack3D
          teams={roomState.teams}
          isRacing={isQuestionActive || roomState.status === 'hurdle_replay'}
          cameraMode={roomState.cameraMode}
          totalLanes={roomState.totalTeams}
          hurdleJumpTeamId={hurdleJumpTeamId}
          onJumpComplete={() => {
            // jump complete callback
          }}
        />
      </div>

      {/* TOP HUD: Minimalist Top Bar (Room PIN, Subject, Live Leaders ticker) */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        
        {/* Left: Room Badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-3.5 py-1.5 shadow-xl text-white">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono font-bold text-amber-400">
            PIN: {roomState.roomPin}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-bold text-slate-200">
            {currentQ?.subjectName || 'THPT Quốc Gia'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-amber-300 font-semibold">
            Câu {roomState.currentQuestionIndex + 1}/{roomState.questions.length}
          </span>
        </div>

        {/* Center: Live Race Progress mini ticker */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-1.5 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Dẫn Đầu:</span>
          </span>
          {sortedTeams.slice(0, 3).map((t, idx) => (
            <div key={t.id} className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: t.colorHex }}
              />
              <span>{t.name}</span>
              <span className="text-amber-400 font-mono text-[11px]">
                {Math.round(t.progress)}%
              </span>
              {idx < 2 && <span className="text-slate-700">·</span>}
            </div>
          ))}
        </div>

        {/* Right: Quick Tools (Mute, Camera, Bank) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              sound.setMuted(nextMuted);
              setIsMuted(nextMuted);
            }}
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition shadow-lg"
            title="Bật/Tắt âm thanh"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={onOpenQuestionBank}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 transition shadow-lg"
          >
            Đề thi
          </button>
        </div>
      </div>

      {/* QUESTION DISPLAY MODAL / HUD (Centered clean overlay during question) */}
      {currentQ && !isFinished && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-4xl pointer-events-auto">
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            
            {/* Bloom taxonomy badge & Timer */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                  currentQ.bloomLevel === 'Vận dụng cao'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-md shadow-rose-950'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}>
                  {currentQ.bloomLevel === 'Vận dụng cao' && <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  <span>{currentQ.bloomLevel === 'Vận dụng cao' ? '⚡ VẬN DỤNG CAO - KÍCH HOẠT VƯỢT RÀO 3D' : currentQ.bloomLevel}</span>
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {currentQ.sourceExam}
                </span>
              </div>

              {isQuestionActive && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-400 font-mono font-bold text-sm">
                  <Timer className="w-4 h-4" />
                  <span>{roomState.timeRemaining}s</span>
                </div>
              )}
            </div>

            {/* Question Text */}
            <p className="text-sm sm:text-base font-bold text-white leading-relaxed mb-3">
              {currentQ.text}
            </p>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentQ.options.map((opt, i) => {
                const isCorrect = i === currentQ.correctIndex;
                const letter = ['A', 'B', 'C', 'D'][i];

                const getOptStyle = () => {
                  if (isRevealed) {
                    if (isCorrect) {
                      return 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-lg shadow-emerald-950';
                    }
                    return 'bg-slate-900/50 text-slate-400 border-slate-800/80 opacity-50';
                  }
                  return 'bg-slate-900/80 text-slate-200 border-slate-800';
                };

                return (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition ${getOptStyle()}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-black/40 flex items-center justify-center font-bold text-[11px]">
                        {letter}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {isRevealed && isCorrect && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pedagogical Explanation when revealed */}
            {isRevealed && (
              <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300">
                <span className="font-bold text-emerald-400">💡 Hướng dẫn giải chi tiết: </span>
                {currentQ.explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINISHED CELEBRATION MODAL */}
      {isFinished && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-amber-500 to-yellow-300 text-slate-950 mx-auto flex items-center justify-center shadow-xl">
              <Award className="w-10 h-10 font-bold" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-black tracking-widest text-amber-400">
                CHUNG KẾT VÒNG ĐUA THPT
              </span>
              <h2 className="text-3xl font-black text-white">
                {sortedTeams[0]?.name || 'Chiến Mã'} VÔ ĐỊCH!
              </h2>
              <p className="text-xs text-slate-300">
                Xuất sắc hoàn thành chặng đua với {sortedTeams[0]?.score} điểm và {sortedTeams[0]?.hurdlesCleared} lần vượt rào thành công!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleShowReport}
                className="py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Xem & Xuất Báo Cáo Sư Phạm</span>
              </button>

              <button
                onClick={onResetToLobby}
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thi Đấu Vòng Mới</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED COLLAPSIBLE BOTTOM DOCK (Following Three.js Skill guidelines) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96vw] max-w-4xl transition-transform duration-300 pointer-events-auto ${
          isControlsCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse toggle tab */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="px-4 py-1 rounded-t-xl bg-slate-950/90 border-t border-x border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 shadow-md transition"
          >
            {isControlsCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isControlsCollapsed ? 'Mở Bảng Điều Khiển' : 'Ẩn Bảng Điều Khiển (Zen Mode)'}</span>
          </button>
        </div>

        {/* Dock panel */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          
          {/* Group 1: Race Controller Buttons */}
          <div className="flex items-center gap-2">
            {isQuestionActive && (
              <button
                onClick={handleRevealAnswer}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Công Bố Đáp Án & Tính Điểm</span>
              </button>
            )}

            {isRevealed && !isFinished && (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-98"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Tiếp Tục Câu Sau ({roomState.currentQuestionIndex + 2}/{roomState.questions.length})</span>
              </button>
            )}

            {!isFinished && (
              <button
                onClick={handleFinishRace}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition"
              >
                Kết thúc sớm
              </button>
            )}

            {isFinished && (
              <button
                onClick={handleShowReport}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Báo Cáo Phân Tích & Xuất File</span>
              </button>
            )}
          </div>

          {/* Group 2: Camera View Modes */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase px-2 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>Góc Quay:</span>
            </span>
            {(
              [
                { id: 'broadcast', label: 'Truyền hình' },
                { id: 'chase', label: 'Bám đuôi' },
                { id: 'overhead', label: 'Toàn cảnh' },
                { id: 'dynamic', label: 'Tự động' },
              ] as { id: CameraMode; label: string }[]
            ).map((cam) => (
              <button
                key={cam.id}
                onClick={() => onUpdateRoom((prev) => ({ ...prev, cameraMode: cam.id }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  roomState.cameraMode === cam.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Group 3: Hurdle Jump Manual Test & Sound Fanfare */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (roomState.teams.length > 0) {
                  const leadId = sortedTeams[0]?.id || roomState.teams[0].id;
                  setHurdleJumpTeamId(leadId);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 transition"
              title="Kích hoạt hiệu ứng quay chậm tung vó vượt rào 3D"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Thử Vượt Rào</span>
            </button>

            <button
              onClick={() => sound.playCallToThePost()}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
              title="Phát tiếng kèn lệnh truyền thống xuất trận"
            >
              🎺 Kèn Lệnh
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
