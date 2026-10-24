import React from 'react';
import { SubjectId, Team, Student } from '../types';
import { SUBJECT_INFO } from '../services/questionsData';
import { Play, Users, BookOpen, Settings2, Sparkles, Copy, ExternalLink, Bot } from 'lucide-react';

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
  const [copied, setCopied] = React.useState(false);

  const copyPin = () => {
    navigator.clipboard.writeText(roomPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Top Hero Banner & Room PIN Projector Display */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Màn Hình Máy Chiếu Lớp Học (Host Teacher)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ĐUA NGỰA TRI THỨC THPT 3D
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Học sinh quét mã hoặc truy cập màn hình Sĩ tử, nhập mã PIN để tham gia thi đấu thời gian thực. Câu hỏi "Vận dụng cao" kích hoạt chiến mã tung vó vượt rào!
          </p>
        </div>

        {/* Big PIN Display */}
        <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl p-5 text-center min-w-[240px] shadow-xl relative group">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Mã Phòng Thi (Room PIN)
          </span>
          <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-amber-400">
            {roomPin}
          </div>
          
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={copyPin}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1 border border-slate-800 transition"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Đã sao chép' : 'Sao chép PIN'}</span>
            </button>
            <button
              onClick={onOpenStudentTab}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs text-amber-300 flex items-center gap-1 border border-amber-500/30 transition"
              title="Mở thêm tab học sinh để thử nghiệm trực tiếp"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Thử tab Học sinh</span>
            </button>
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
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  Đang chờ học sinh quét mã và nhập Room PIN...
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
            className="w-full py-4 rounded-xl bg-linear-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-98"
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
