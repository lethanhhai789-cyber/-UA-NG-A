import React from 'react';
import { RaceReportData } from '../types';
import { ExportService } from '../services/exportService';
import { Trophy, FileSpreadsheet, FileText, X, AlertTriangle, Zap, CheckCircle2, Award } from 'lucide-react';

interface RaceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: RaceReportData;
}

export const RaceReportModal: React.FC<RaceReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  if (!isOpen) return null;

  const handleDownloadExcel = () => {
    ExportService.exportToExcel(report);
  };

  const handleDownloadPDF = () => {
    ExportService.exportToPDF(report);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-linear-to-br from-amber-500 to-yellow-600 text-slate-950 shadow-md">
              <Trophy className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Báo Cáo Phân Tích Sư Phạm & Kết Quả Vòng Đua THPT
              </h2>
              <p className="text-xs text-slate-400">
                Phòng thi PIN: <strong className="text-amber-400">{report.roomPin}</strong> | Môn: <strong className="text-white">{report.subjectName}</strong> | Ngày: {report.dateStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <FileText className="w-4 h-4" />
              <span>Xuất PDF Sư Phạm</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Winner Showcase Banner */}
          <div className="p-5 rounded-2xl bg-linear-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Đội Quán Quân Vòng Đua</span>
                <h3 className="text-2xl font-black text-white">
                  {report.winningTeam.name}
                </h3>
                <p className="text-xs text-slate-300">
                  Tổng điểm: <strong className="text-amber-400">{report.winningTeam.score} điểm</strong> | Vượt rào thành công: <strong className="text-emerald-400">{report.winningTeam.hurdlesCleared} lần</strong> | Tiến độ về đích: 100%
                </p>
              </div>
            </div>

            <div className="flex gap-4 text-center">
              <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-lg font-bold text-white">{report.totalStudents}</div>
                <div className="text-[11px] text-slate-400">Sĩ tử dự thi</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-lg font-bold text-white">{report.totalQuestions}</div>
                <div className="text-[11px] text-slate-400">Câu hỏi phân hóa</div>
              </div>
            </div>
          </div>

          {/* Section 1: Team Standings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span>1. Bảng Xếp Hạng Các Chiến Mã</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Hạng</th>
                    <th className="py-3 px-4">Chiến Mã & Đội Đua</th>
                    <th className="py-3 px-4 text-center">Tiến Độ</th>
                    <th className="py-3 px-4 text-center">Điểm Số</th>
                    <th className="py-3 px-4 text-center">Vượt Rào Cao</th>
                    <th className="py-3 px-4 text-center">Số Sĩ Tử</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.teams
                    .sort((a, b) => b.score - a.score || b.progress - a.progress)
                    .map((team, idx) => (
                      <tr key={team.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-bold text-white">
                          {idx === 0 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black">1</span>
                          ) : idx === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-bold">2</span>
                          ) : idx === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold">3</span>
                          ) : (
                            <span className="text-slate-400 ml-2">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: team.colorHex }}
                            />
                            <span className="font-bold text-slate-100">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${Math.min(100, team.progress)}%` }}
                              />
                            </div>
                            <span className="text-slate-300 font-semibold">{Math.round(team.progress)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-400">
                          {team.score}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold">
                            <Zap className="w-3 h-3" />
                            {team.hurdlesCleared} lần
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {team.members.length} em
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Bloom Taxonomy Performance Analysis */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span>2. Phân Tích Năng Lực Theo 4 Cấp Độ Tư Duy Bloom</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {report.bloomStats.map((bloom) => {
                const getColors = () => {
                  switch (bloom.level) {
                    case 'Nhận biết': return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400';
                    case 'Thông hiểu': return 'border-blue-500/30 bg-blue-950/20 text-blue-400';
                    case 'Vận dụng': return 'border-amber-500/30 bg-amber-950/20 text-amber-400';
                    case 'Vận dụng cao': return 'border-rose-500/30 bg-rose-950/20 text-rose-400';
                  }
                };

                return (
                  <div key={bloom.level} className={`p-4 rounded-xl border ${getColors()}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs">{bloom.level}</span>
                      <span className="text-xs font-black">{bloom.accuracyPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                      <div
                        className="h-full bg-current rounded-full"
                        style={{ width: `${bloom.accuracyPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Đúng {bloom.correct}/{bloom.total} lượt trả lời
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Difficult Questions Matrix (Củng cố kiến thức) */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>3. Ma Trận Câu Hỏi Cần Củng Cố Gấp (Tỷ Lệ Sai Cao Nhất)</span>
            </h3>

            {report.difficultQuestions.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                Cả lớp đạt kết quả tuyệt đối! Không có câu hỏi nào có tỷ lệ sai vượt ngưỡng cảnh báo.
              </div>
            ) : (
              <div className="space-y-3">
                {report.difficultQuestions.map((item, idx) => (
                  <div key={item.question.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">{item.question.bloomLevel}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          Tỷ lệ sai: {item.wrongPercent}% ({item.wrongCount}/{item.totalAnswers} lượt)
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{item.question.sourceExam}</span>
                    </div>

                    <p className="text-xs font-medium text-slate-200 mb-2">
                      {item.question.text}
                    </p>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-400">Đáp án chuẩn: </strong>
                        {['A', 'B', 'C', 'D'][item.question.correctIndex]}. {item.question.options[item.question.correctIndex]}
                        <div className="mt-1 text-slate-400">
                          <strong>Ghi chú sư phạm: </strong>{item.question.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <span>Hệ thống hỗ trợ xuất bảng tính Excel đa sheet và bản in PDF có dấu xác nhận của Giáo viên.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Đóng Báo Cáo
          </button>
        </div>

      </div>
    </div>
  );
};
