import React, { useState, useEffect } from 'react';
import { RoomState, Student, Team } from '../types';
import { syncChannel } from '../services/syncChannel';
import { sound } from '../services/soundEffects';
import { RaceTrack3D } from './3d/RaceTrack3D';
import { CheckCircle2, XCircle, Zap, Eye, Smartphone, Radio, UserCheck } from 'lucide-react';

interface StudentMobileViewProps {
  initialRoomPin?: string;
  onBackToHost?: () => void;
}

export const StudentMobileView: React.FC<StudentMobileViewProps> = ({
  initialRoomPin = '',
  onBackToHost,
}) => {
  const [roomPin, setRoomPin] = useState(initialRoomPin || syncChannel.getLatestRoomPin() || '');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('12A1');
  const [isJoined, setIsJoined] = useState(false);
  const [studentId, setStudentId] = useState<string>('');
  const [assignedTeam, setAssignedTeam] = useState<Team | null>(null);

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [chosenAnswer, setChosenAnswer] = useState<number | null>(null);
  const [answeredTimeSec, setAnsweredTimeSec] = useState<number>(0);
  const [show3DTrack, setShow3DTrack] = useState(false);

  // Subscribe to real-time room updates
  useEffect(() => {
    const unsub = syncChannel.subscribe((msg) => {
      if (msg.type === 'STATE_UPDATE') {
        if (!roomPin || msg.state.roomPin === roomPin) {
          setRoomState(msg.state);
        }
      }
    });

    // Check localStorage initial
    if (roomPin) {
      const stored = syncChannel.getRoomFromStorage(roomPin);
      if (stored) {
        setRoomState(stored);
      }
    }

    return () => unsub();
  }, [roomPin]);

  // Update assigned team whenever room state changes
  useEffect(() => {
    if (roomState && studentId) {
      const team = roomState.teams.find((t) => t.members.some((m) => m.id === studentId));
      if (team) {
        setAssignedTeam(team);
      }
    }
  }, [roomState, studentId]);

  // Reset chosen answer on new question
  useEffect(() => {
    setChosenAnswer(null);
  }, [roomState?.currentQuestionIndex]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !roomPin.trim()) {
      alert('Vui lòng nhập đầy đủ Mã phòng PIN và Họ tên!');
      return;
    }

    const sId = `student_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setStudentId(sId);

    syncChannel.broadcast({
      type: 'STUDENT_JOIN',
      student: {
        id: sId,
        name: studentName.trim(),
        className: className.trim() || '12A',
        roomPin: roomPin.trim(),
      },
    });

    setIsJoined(true);
    sound.playCorrectSound();
  };

  const handleSelectOption = (optionIndex: number) => {
    if (!roomState || chosenAnswer !== null) return;
    if (roomState.status !== 'question_active') return;

    setChosenAnswer(optionIndex);
    const timeSpent = roomState.initialTimeLimit - roomState.timeRemaining;
    setAnsweredTimeSec(Math.max(1, timeSpent));

    const currentQ = roomState.questions[roomState.currentQuestionIndex];
    if (currentQ) {
      syncChannel.broadcast({
        type: 'STUDENT_ANSWER',
        roomPin: roomState.roomPin,
        studentId: studentId,
        questionId: currentQ.id,
        chosenIndex: optionIndex,
        responseTimeSec: timeSpent,
      });
    }

    sound.playHoofClick();
  };

  const currentQ = roomState?.questions[roomState?.currentQuestionIndex || 0];
  const isQuestionActive = roomState?.status === 'question_active';
  const isRevealed = roomState?.status === 'revealed' || roomState?.status === 'hurdle_replay';
  const isCorrect = chosenAnswer !== null && currentQ && chosenAnswer === currentQ.correctIndex;

  // LOBBY / JOIN FORM
  if (!isJoined || !roomState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl" />

          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-3">
              <Smartphone className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              CỔNG THI ĐUA NGỰA 3D
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dành cho Sĩ tử THPT ôn luyện trực tuyến qua điện thoại & laptop
            </p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mã Phòng Thi (Room PIN):
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="VD: 889988"
                value={roomPin}
                onChange={(e) => setRoomPin(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Họ và Tên Sĩ Tử:
              </label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn An"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lớp / Trường THPT:
              </label>
              <input
                type="text"
                placeholder="VD: 12A1 - THPT Chuyên"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition active:scale-98"
            >
              VÀO PHÒNG THI & NHẬN CHIẾN MÃ
            </button>
          </form>

          {onBackToHost && (
            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <button
                onClick={onBackToHost}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                ← Quay lại Màn hình Giáo viên (Host / Máy chiếu)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ACTIVE STUDENT RACING SCREEN
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Header Bar */}
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {assignedTeam ? (
            <div
              className="px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm text-white"
              style={{ backgroundColor: assignedTeam.colorHex }}
            >
              <span>{assignedTeam.name}</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full">
                Làn {assignedTeam.laneIndex + 1}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Đang gán đội...</span>
          )}
          <span className="text-xs text-slate-400 hidden sm:inline">
            | {studentName} ({className})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShow3DTrack(!show3DTrack)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 text-amber-300 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{show3DTrack ? 'Làm bài' : 'Xem 3D'}</span>
          </button>
          {onBackToHost && (
            <button
              onClick={onBackToHost}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white transition"
            >
              Màn chiếu
            </button>
          )}
        </div>
      </header>

      {/* 3D Track Overlay if toggled */}
      {show3DTrack && (
        <div className="w-full h-64 border-b border-slate-800 relative">
          <RaceTrack3D
            teams={roomState.teams}
            isRacing={roomState.status === 'question_active' || roomState.status === 'hurdle_replay'}
            cameraMode="broadcast"
            totalLanes={roomState.totalTeams}
          />
          <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-black/70 text-[10px] text-amber-300 font-mono">
            Trực tiếp đường đua 3D
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 flex flex-col justify-between">
        
        {/* Waiting in Lobby State */}
        {roomState.status === 'lobby' && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-bounce">
              <Radio className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">ĐÃ VÀO PHÒNG THI THÀNH CÔNG</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sĩ tử: <strong className="text-white">{studentName}</strong> ({className}). Hãy chờ giáo viên bấm nút xuất phát trên màn chiếu lớp học!
            </p>
            {assignedTeam && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 inline-block text-center">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">Chiến mã đại diện</span>
                <span className="text-lg font-black" style={{ color: assignedTeam.colorHex }}>
                  🐎 {assignedTeam.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Finished State */}
        {roomState.status === 'finished' && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-3xl mx-auto flex items-center justify-center shadow-lg">
              🏆
            </div>
            <h2 className="text-2xl font-black text-white">VÒNG ĐUA KẾT THÚC</h2>
            <p className="text-xs text-slate-300">
              Chúc mừng các sĩ tử đã hoàn thành bài thi ôn luyện THPT! Xem bảng xếp hạng chung cuộc trên màn hình giáo viên.
            </p>
          </div>
        )}

        {/* Active Question or Answer Revealed */}
        {(isQuestionActive || isRevealed) && currentQ && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            
            {/* Question Info Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400">
                    Câu {roomState.currentQuestionIndex + 1}/{roomState.questions.length}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    currentQ.bloomLevel === 'Vận dụng cao'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {currentQ.bloomLevel === 'Vận dụng cao' ? '⚡ VẬN DỤNG CAO (VƯỢT RÀO)' : currentQ.bloomLevel}
                  </span>
                </div>

                {isQuestionActive && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400">
                    <span>⏳ {roomState.timeRemaining}s</span>
                  </div>
                )}
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                  {currentQ.text}
                </p>
              </div>
            </div>

            {/* Answer Options Grid (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
              {currentQ.options.map((optText, optIdx) => {
                const letter = ['A', 'B', 'C', 'D'][optIdx];
                const isSelected = chosenAnswer === optIdx;
                const isTheCorrectAnswer = isRevealed && optIdx === currentQ.correctIndex;
                const isSelectedAndWrong = isRevealed && isSelected && !isCorrect;

                // Color themes
                const getBtnStyle = () => {
                  if (isRevealed) {
                    if (isTheCorrectAnswer) {
                      return 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/50 scale-[1.02]';
                    }
                    if (isSelectedAndWrong) {
                      return 'bg-rose-700 text-white border-rose-500 opacity-90';
                    }
                    return 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-40';
                  }

                  if (isSelected) {
                    return 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-lg shadow-amber-500/20 scale-[1.01]';
                  }

                  // Default options styled by letter
                  switch (letter) {
                    case 'A': return 'bg-blue-950/70 hover:bg-blue-900/80 border-blue-800/80 text-blue-100';
                    case 'B': return 'bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-800/80 text-emerald-100';
                    case 'C': return 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-800/80 text-amber-100';
                    case 'D': return 'bg-purple-950/70 hover:bg-purple-900/80 border-purple-800/80 text-purple-100';
                    default: return 'bg-slate-900 border-slate-800 text-white';
                  }
                };

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={!isQuestionActive || chosenAnswer !== null}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all relative overflow-hidden ${getBtnStyle()}`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center font-black text-sm shrink-0">
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-snug pt-0.5">
                      {optText}
                    </span>

                    {isSelected && !isRevealed && (
                      <span className="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40">
                        Đã chọn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-Answer Feedback & Explanation */}
            {isRevealed && (
              <div className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
                isCorrect
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1 text-sm">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>CHÍNH XÁC! {currentQ.bloomLevel === 'Vận dụng cao' && '⚡ CHIẾN MÃ VƯỢT RÀO THÀNH CÔNG!'}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span>CHƯA CHÍNH XÁC. Cố gắng ở câu tiếp theo nhé!</span>
                    </>
                  )}
                </div>
                <p className="text-slate-300 mt-1">
                  <strong className="text-white">Lời giải chi tiết: </strong>{currentQ.explanation}
                </p>
              </div>
            )}

            {/* Answer submission status bar */}
            {chosenAnswer !== null && isQuestionActive && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-center text-xs text-amber-300 font-medium">
                ✓ Đã ghi nhận câu trả lời trong {answeredTimeSec}s! Đang chờ hết thời gian để xem kết quả...
              </div>
            )}

          </div>
        )}

      </main>

      {/* Bottom Status bar */}
      <footer className="px-4 py-2.5 bg-slate-950 border-t border-slate-900 text-center text-[11px] text-slate-500">
        Hệ thống thi trắc nghiệm Game Đua Ngựa 3D - Bộ môn Ôn thi THPT Quốc Gia
      </footer>
    </div>
  );
};
