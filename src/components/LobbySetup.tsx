import React, { useState } from 'react';
import { SubjectId, Team, Student } from '../types';
import { SUBJECT_INFO } from '../services/questionsData';
import { Play, Users, BookOpen, Settings2, Sparkles, Copy, ExternalLink, Bot, Check, Share2, Smartphone, Monitor } from 'lucide-react';

interface LobbySetupProps {
  roomPin: string;
  selectedSubject: SubjectId;
  onSelectSubject: (sub: SubjectId) => void;
  totalTeams: number;
  onChangeTotalTeams: (num: number) => void;
  teams: Team[];
  students: Student[];
  autoPlayBots: boolean;
  onToggleBots: (enabled: boolean) => void;
  onOpenQuestionBank: () => void;
  onStartRace: () => void;
  onOpenStudentTab: () => void;
}

export const LobbySetup: React.FC<LobbySetupProps> = ({
  roomPin,
  selectedSubject,
  onSelectSubject,
  totalTeams,
  onChangeTotalTeams,
  teams,
  students,
  autoPlayBots,
  onToggleBots,
  onOpenQuestionBank,
  onStartRace,
  onOpenStudentTab,
}) => {
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedStudentLink, setCopiedStudentLink] = useState(false);

  // Compute absolute student link
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const studentInviteLink = `${origin}/?role=student&pin=${roomPin}`;
  const teacherHostLink = `${origin}/?role=host`;

  const copyPin = () => {
    navigator.clipboard.writeText(roomPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const copyStudentLink = () => {
    navigator.clipboard.writeText(studentInviteLink);
    setCopiedStudentLink(true);
    setTimeout(() => setCopiedStudentLink(false), 2500);
  };

  const openStudentNewTab = () => {
    window.open(studentInviteLink, '_blank');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* SECTION: 2 DEDICATED SEPARATE LINKS (TEACHER vs STUDENT) */}
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              🔗
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                2 ĐƯỜNG LINK RIÊNG BIỆT CHO PHÒNG THI #{roomPin}
              </h2>
              <p className="text-xs text-slate-300">
                Phân định rõ ràng: Link gửi cho Học sinh và Link hiển thị Màn chiếu Giáo viên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold">MÃ PHÒNG (PIN):</span>
            <span className="text-xl font-mono font-black text-amber-400 tracking-wider">{roomPin}</span>
            <button
              onClick={copyPin}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
              title="Sao chép PIN"
            >
              {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2 Separate Link Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          
          {/* Card 1: Student Link (Highlighted) */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>ĐƯỜNG LINK GỬI CHO HỌC SINH (SĨ TỬ)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Không cần đăng ký
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all flex items-center justify-between gap-2">
              <span className="truncate">{studentInviteLink}</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              👉 <strong>Cách dùng:</strong> Giáo viên gửi link này qua Zalo/Classroom. Học sinh bấm vào sẽ <strong>vào thẳng giao diện làm bài</strong>, mã PIN tự động điền, không vào trang giáo viên!
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={copyStudentLink}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
              >
                {copiedStudentLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ĐÃ SAO CHÉP LINK HỌC SINH!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>SAO CHÉP LINK MỜI HỌC SINH</span>
                  </>
                )}
              </button>

              <button
                onClick={openStudentNewTab}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
                title="Mở tab học sinh mới để thử"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Thử tab mới</span>
              </button>
            </div>
          </div>

          {/* Card 2: Teacher Host Link */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-blue-950/40 to-slate-950 border border-blue-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Monitor className="w-4 h-4" />
                <span>ĐƯỜNG LINK MÀN CHIẾU GIÁO VIÊN (HOST)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Dành cho Giáo viên
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 break-all select-all">
              {teacherHostLink}
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              👉 Dùng trên máy tính kết nối Máy chiếu / Smart TV trong lớp để chiếu 3D trường đua, âm thanh kèn lệnh, điều khiển câu hỏi và bảng xếp hạng.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(teacherHostLink);
                  alert('Đã sao chép Link Giáo viên!');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Copy className="w-4 h-4" />
                <span>Sao chép Link Giáo viên</span>
              </button>

              <button
                onClick={onOpenStudentTab}
                className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition"
              >
                <span>Xem Chia Đôi Màn Hình (Demo)</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Subject & Question Bank */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>1. Chọn Môn Thi THPT</span>
            </h3>
            <button
              onClick={onOpenQuestionBank}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition"
            >
              Ngân hàng câu hỏi
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SUBJECT_INFO) as SubjectId[]).map((subjKey) => {
              const info = SUBJECT_INFO[subjKey];
              const isSelected = selectedSubject === subjKey;
              return (
                <button
                  key={subjKey}
                  onClick={() => onSelectSubject(subjKey)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="text-xs">{info.name}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Phân hóa 4 cấp độ tư duy:</span>
            <span className="text-xs font-semibold text-emerald-400">Bloom Chuẩn BGD</span>
          </div>
        </div>

        {/* Col 2: Number of Teams & Simulation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span>2. Tùy Chọn Đội Đua (2 - 8 Đội)</span>
          </h3>

          <div>
            <label className="text-xs text-slate-400 block mb-2">
              Số lượng đội chiến mã tham gia thi đấu:
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                <button
                  key={num}
                  onClick={() => onChangeTotalTeams(num)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    totalTeams === num
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Bot simulation toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Mô phỏng sĩ tử Bot tự động</span>
              </span>
              <button
                onClick={() => onToggleBots(!autoPlayBots)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoPlayBots ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoPlayBots ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Bật tính năng này nếu giáo viên muốn thử nghiệm ngay cuộc đua 8 đội kịch tính khi chưa có đủ học sinh kết nối!
            </p>
          </div>
        </div>

        {/* Col 3: Connected Students & Start Race */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>3. Sĩ Tử Đã Vào Phòng</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold">
                {students.length} thí sinh
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {students.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic leading-relaxed">
                  Đang chờ học sinh quét mã hoặc bấm link để vào phòng...<br />
                  <span className="text-[11px] text-amber-400">💡 Thầy cô gửi link ở trên cho các em nhé!</span>
                </div>
              ) : (
                students.map((s) => {
                  const team = teams.find((t) => t.id === s.teamId);
                  return (
                    <div
                      key={s.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-200">{s.name} ({s.className})</span>
                      {team && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: team.colorHex }}
                        >
                          {team.name}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={onStartRace}
            className="w-full py-4 rounded-xl bg-linear-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>KÈN LỆNH XUẤT TRẬN & BẮT ĐẦU ĐUA</span>
          </button>
        </div>

      </div>

      {/* Teams Lineup Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Danh Sách {totalTeams} Chiến Mã Xuất Phát Trên Đường Đua 3D
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {teams.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-center space-y-1"
            >
              <div
                className="w-4 h-4 rounded-full mx-auto"
                style={{ backgroundColor: t.colorHex }}
              />
              <div className="text-xs font-black text-white">{t.name}</div>
              <div className="text-[10px] text-slate-400">Làn {t.laneIndex + 1}</div>
              <div className="text-[10px] text-amber-400/90 font-mono">
                {t.members.length} sĩ tử
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
