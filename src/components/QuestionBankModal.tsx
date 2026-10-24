import React, { useState } from 'react';
import { BloomLevel, Question, SubjectId } from '../types';
import { SUBJECT_INFO } from '../services/questionsData';
import { X, Plus, Search, BookOpen, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onUpdateQuestions: (newQuestions: Question[]) => void;
  currentSubject: SubjectId;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  questions,
  onUpdateQuestions,
  currentSubject,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(currentSubject);
  const [filterBloom, setFilterBloom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New question form state
  const [newText, setNewText] = useState('');
  const [newBloom, setNewBloom] = useState<BloomLevel>('Nhận biết');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIdx, setCorrectIdx] = useState<number>(0);
  const [explanation, setExplanation] = useState('');

  if (!isOpen) return null;

  const filteredQuestions = questions.filter((q) => {
    const matchSubject = q.subject === selectedSubject;
    const matchBloom = filterBloom === 'all' || q.bloomLevel === filterBloom;
    const matchText = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchBloom && matchText;
  });

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Vui lòng điền đầy đủ nội dung câu hỏi và 4 phương án lựa chọn!');
      return;
    }

    const newQ: Question = {
      id: `custom-${Date.now()}`,
      subject: selectedSubject,
      subjectName: SUBJECT_INFO[selectedSubject].name,
      bloomLevel: newBloom,
      text: newText,
      options: [optA, optB, optC, optD],
      correctIndex: correctIdx,
      explanation: explanation.trim() || 'Lời giải chi tiết do giáo viên biên soạn.',
      sourceExam: 'Đề biên soạn bởi Giáo viên',
    };

    onUpdateQuestions([...questions, newQ]);
    setIsAddingNew(false);
    // Reset form
    setNewText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectIdx(0);
    setExplanation('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi không?')) {
      onUpdateQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const getBloomBadge = (level: BloomLevel) => {
    switch (level) {
      case 'Nhận biết':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Thông hiểu':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Vận dụng':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Vận dụng cao':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-900/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Ngân Hàng Câu Hỏi Ôn Thi THPT
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal border border-slate-700">
                  {questions.length} câu trong đề
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Phân loại theo 4 cấp độ tư duy Bloom. Câu Vận Dụng Cao kích hoạt vượt rào 3D.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject Navigation Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2 overflow-x-auto">
          {(Object.keys(SUBJECT_INFO) as SubjectId[]).map((subjKey) => {
            const info = SUBJECT_INFO[subjKey];
            const isActive = selectedSubject === subjKey;
            const count = questions.filter((q) => q.subject === subjKey).length;
            return (
              <button
                key={subjKey}
                onClick={() => setSelectedSubject(subjKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <span>{info.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-950/30 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls Bar: Search, Bloom Filter, Add button */}
        <div className="p-4 px-6 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kiếm nội dung câu hỏi, từ khóa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={filterBloom}
              onChange={(e) => setFilterBloom(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Tất cả cấp độ tư duy</option>
              <option value="Nhận biết">Nhận biết</option>
              <option value="Thông hiểu">Thông hiểu</option>
              <option value="Vận dụng">Vận dụng</option>
              <option value="Vận dụng cao">⚡ Vận dụng cao (Vượt rào)</option>
            </select>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingNew ? 'Đóng biểu mẫu' : 'Thêm câu hỏi mới'}</span>
          </button>
        </div>

        {/* Add Question Form Modal/Drawer */}
        {isAddingNew && (
          <form onSubmit={handleAddNew} className="p-6 bg-slate-950 border-b border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <span>➕ Soạn Thảo Câu Hỏi Mới Cho Môn {SUBJECT_INFO[selectedSubject].name}</span>
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Cấp độ tư duy:</label>
                <select
                  value={newBloom}
                  onChange={(e) => setNewBloom(e.target.value as BloomLevel)}
                  className="bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold focus:outline-none"
                >
                  <option value="Nhận biết">Nhận biết</option>
                  <option value="Thông hiểu">Thông hiểu</option>
                  <option value="Vận dụng">Vận dụng</option>
                  <option value="Vận dụng cao">⚡ Vận dụng cao (Có Vượt Rào)</option>
                </select>
              </div>
            </div>

            <div>
              <textarea
                placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'A', val: optA, set: setOptA },
                { label: 'B', val: optB, set: setOptB },
                { label: 'C', val: optC, set: setOptC },
                { label: 'D', val: optD, set: setOptD },
              ].map((opt, i) => (
                <div key={opt.label} className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                  <button
                    type="button"
                    onClick={() => setCorrectIdx(i)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                      correctIdx === i
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                  <input
                    type="text"
                    placeholder={`Phương án ${opt.label}...`}
                    value={opt.val}
                    onChange={(e) => opt.set(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-xs text-white focus:outline-none"
                  />
                  {correctIdx === i && (
                    <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Đáp án đúng
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Lời giải thích chi tiết và căn cứ lý thuyết..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Lưu vào Đề Thi
              </button>
            </div>
          </form>
        )}

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${getBloomBadge(q.bloomLevel)}`}>
                      {q.bloomLevel === 'Vận dụng cao' ? '⚡ VẬN DỤNG CAO (VƯỢT RÀO)' : q.bloomLevel}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {q.sourceExam}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm font-medium text-slate-100 leading-relaxed mb-3">
                  {q.text}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctIndex;
                    const letter = ['A', 'B', 'C', 'D'][optIdx];
                    return (
                      <div
                        key={optIdx}
                        className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {letter}
                        </span>
                        <span className="truncate">{opt}</span>
                        {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Lời giải chi tiết:</span> {q.explanation}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Tổng số câu hỏi sẵn sàng cho vòng đua: <strong className="text-amber-400">{filteredQuestions.length} câu</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
