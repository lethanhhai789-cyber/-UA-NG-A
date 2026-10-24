import React, { useState, useEffect } from 'react';
import { Teacher } from '../types';
import { Lock, UserCheck, ShieldCheck, UserPlus, X, LogIn, AlertCircle, CheckCircle2, Clock, School, Phone, Mail, Award } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeacher: Teacher | null;
  onLoginSuccess: (teacher: Teacher, token: string) => void;
  onLogout: () => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  currentTeacher,
  onLoginSuccess,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin_approvals'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regSubject, setRegSubject] = useState('Toán học');
  const [regPassword, setRegPassword] = useState('');
  const [regMessage, setRegMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Admin approvals list
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchTeachersList = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/auth/teacher/list');
      if (res.ok) {
        const data = await res.json();
        setTeachersList(data.teachers || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentTeacher?.isMasterAdmin) {
      fetchTeachersList();
    }
  }, [isOpen, currentTeacher]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message || data.error || 'Đăng nhập thất bại.');
        setIsLoggingIn(false);
        return;
      }

      onLoginSuccess(data.teacher, data.token);
      onClose();
    } catch (err) {
      setLoginError('Lỗi kết nối tới máy chủ. Vui lòng thử lại!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage(null);
    setIsRegistering(true);

    try {
      const res = await fetch('/api/auth/teacher/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          school: regSchool,
          subject: regSubject,
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegMessage({ type: 'error', text: data.error || 'Đăng ký không thành công.' });
        setIsRegistering(false);
        return;
      }

      setRegMessage({ type: 'success', text: data.message });
      // Reset form
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegSchool('');
      setRegPassword('');
    } catch (err) {
      setRegMessage({ type: 'error', text: 'Lỗi mạng khi đăng ký. Vui lòng thử lại!' });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      const res = await fetch('/api/auth/teacher/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
      });
      if (res.ok) {
        fetchTeachersList();
      }
    } catch {
      // ignore
    }
  };

  const handleRejectTeacher = async (teacherId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi quyền của giáo viên này không?')) return;
    try {
      const res = await fetch('/api/auth/teacher/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
      });
      if (res.ok) {
        fetchTeachersList();
      }
    } catch {
      // ignore
    }
  };

  const fillQuickMaster = () => {
    setLoginEmail('lethanhhai2905@gmail.com');
    setLoginPassword('giaovien2026');
  };

  const fillQuickDemo = () => {
    setLoginEmail('giaovien@thpt.edu.vn');
    setLoginPassword('123456');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Cổng Xác Thực & Quản Trị Giáo Viên</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Chỉ giáo viên đã được phê duyệt mới được quyền tạo phòng và điều khiển game
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

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          {!currentTeacher ? (
            <>
              <button
                onClick={() => { setActiveTab('login'); setLoginError(''); }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập Giáo Viên</span>
              </button>

              <button
                onClick={() => { setActiveTab('register'); setRegMessage(null); }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng Ký Tài Khoản Mới</span>
              </button>
            </>
          ) : (
            <>
              <div className="pb-2.5 px-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã đăng nhập: {currentTeacher.name}</span>
              </div>

              {currentTeacher.isMasterAdmin && (
                <button
                  onClick={() => { setActiveTab('admin_approvals'); fetchTeachersList(); }}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'admin_approvals'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Duyệt Giáo Viên ({teachersList.filter(t => t.status === 'pending').length} chờ)</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && !currentTeacher && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Giáo Viên:
                </label>
                <input
                  type="email"
                  placeholder="VD: giaovien@thpt.edu.vn"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mật Khẩu:
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                {isLoggingIn ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP VÀO QUYỀN QUẢN TRỊ GAME'}
              </button>

              {/* Quick test credentials */}
              <div className="pt-3 border-t border-slate-800 text-center space-y-2">
                <span className="text-[11px] text-slate-400 block">Đăng nhập nhanh cho Quản trị viên & Giáo viên mẫu:</span>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={fillQuickMaster}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition"
                  >
                    👑 Tài khoản Chủ Tọa (lethanhhai2905@gmail.com)
                  </button>
                  <button
                    type="button"
                    onClick={fillQuickDemo}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                  >
                    🧑‍🏫 Giáo viên mẫu (123456)
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && !currentTeacher && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-[11px] text-blue-300 leading-relaxed">
                ℹ️ <strong>Quy trình phê duyệt:</strong> Sau khi đăng ký, hồ sơ giáo viên của bạn sẽ ở trạng thái <em>"Chờ xác nhận"</em>. Quản trị viên (Thầy Lê Thanh Hải) sẽ duyệt thông tin trường lớp trước khi bạn có thể bắt đầu tạo phòng thi.
              </div>

              {regMessage && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 leading-relaxed ${
                  regMessage.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  {regMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{regMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Họ và Tên Giáo Viên:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Thầy Nguyễn Văn Nam"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Công Tác:
                  </label>
                  <input
                    type="email"
                    placeholder="VD: nam.nv@thpt.edu.vn"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Trường THPT Đang Công Tác:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: THPT Chuyên Lê Hồng Phong"
                    value={regSchool}
                    onChange={(e) => setRegSchool(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Số Điện Thoại Xác Nhận:
                  </label>
                  <input
                    type="tel"
                    placeholder="VD: 0988123456"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Môn Học Giảng Dạy:
                  </label>
                  <select
                    value={regSubject}
                    onChange={(e) => setRegSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lý">Địa lý</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mật Khẩu Đăng Nhập:
                  </label>
                  <input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs tracking-wider shadow-lg transition cursor-pointer"
              >
                {isRegistering ? 'ĐANG GỬI HỒ SƠ...' : 'GỬI HỒ SƠ ĐĂNG KÝ XÁC NHẬN GIÁO VIÊN'}
              </button>
            </form>
          )}

          {/* LOGGED IN TEACHER PROFILE */}
          {currentTeacher && activeTab !== 'admin_approvals' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl">
                  {currentTeacher.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentTeacher.name}</span>
                    {currentTeacher.isMasterAdmin && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        Quản trị viên
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">{currentTeacher.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div>Trường: <strong>{currentTeacher.school}</strong></div>
                <div>Bộ môn: <strong>{currentTeacher.subject}</strong></div>
                <div>Trạng thái: <strong className="text-emerald-400">Đã phê duyệt tư cách</strong></div>
                <div>Điện thoại: <strong>{currentTeacher.phone || 'Chưa cung cấp'}</strong></div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition"
                >
                  Đăng Xuất
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                >
                  Tiếp Tục Điều Khiển Game
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN APPROVAL PANEL (ONLY FOR MASTER ADMIN) */}
          {currentTeacher?.isMasterAdmin && activeTab === 'admin_approvals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Danh Sách Giáo Viên Đăng Ký Xác Nhận ({teachersList.length})
                </span>
                <button
                  onClick={fetchTeachersList}
                  className="text-[11px] text-slate-400 hover:text-white underline"
                >
                  Làm mới danh sách
                </button>
              </div>

              {loadingList ? (
                <div className="text-center py-8 text-xs text-slate-400">Đang tải danh sách...</div>
              ) : teachersList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Chưa có giáo viên nào đăng ký thêm.</div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {teachersList.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{t.name}</span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                            t.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : t.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {t.status === 'approved' ? '✓ Đã duyệt' : t.status === 'pending' ? '⏳ Chờ duyệt' : 'Đã thu hồi'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {t.school} • Môn: {t.subject} • SĐT: {t.phone} • {t.email}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.status === 'pending' ? (
                          <button
                            onClick={() => handleApproveTeacher(t.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
                          >
                            Duyệt Ngay ✓
                          </button>
                        ) : !t.isMasterAdmin ? (
                          <button
                            onClick={() => handleRejectTeacher(t.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 text-[11px] transition"
                          >
                            Thu hồi
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-bold px-2 py-1">Chủ Tọa</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <span>Người copy link chia sẻ mặc định luôn là Học sinh và không có quyền truy cập trang này.</span>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
