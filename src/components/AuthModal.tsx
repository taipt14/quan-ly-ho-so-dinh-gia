import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building2, 
  CheckCircle2, 
  KeyRound, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  UserPlus,
  Phone,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, User } from '../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loginAsDemo, user, allUsers } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginUsernameOrEmail, setLoginUsernameOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('123456');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('Phòng Thẩm định 1');
  const [regRole, setRegRole] = useState<UserRole>('APPRAISER');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsernameOrEmail.trim()) {
      setErrorMsg('Vui lòng nhập Tên đăng nhập hoặc Email');
      return;
    }
    setErrorMsg('');
    const res = login(loginUsernameOrEmail, loginPassword);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMsg('Vui lòng nhập Tên đăng nhập');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Vui lòng nhập Email công việc hợp lệ');
      return;
    }
    if (!regPassword) {
      setErrorMsg('Vui lòng nhập Mật khẩu');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setErrorMsg('');
    const res = register({
      name: regName,
      username: regUsername,
      email: regEmail,
      phone: regPhone,
      department: regDepartment,
      role: regRole,
      password: regPassword
    });

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  const handleSelectDemoUser = (demoUser: User) => {
    loginAsDemo(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Branding Side */}
        <div className="md:w-5/12 bg-slate-900 p-6 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          {/* Subtle Background Accent */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">ValuManager</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 leading-snug">
              Hệ thống Định giá & Thẩm định 4.0
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Quản lý quy trình định giá, kiểm soát SLA, xuất báo cáo tự động và tra cứu chứng thư thẩm định bảo mật.
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Bảo mật dữ liệu thẩm định theo chuẩn ngân hàng.</span>
              </div>
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>Tích hợp AI phân tích tài sản & tự động xuất chứng thư.</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Phiên bản 4.2 Pro</span>
            <span className="text-amber-400 font-semibold">Active Session</span>
          </div>
        </div>

        {/* Right Form & Mode Switcher Side */}
        <div className="md:w-7/12 p-6 flex flex-col justify-between bg-white relative overflow-y-auto">
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition z-10"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            {/* Navigation Tabs (Đăng nhập / Đăng ký) */}
            <div className="flex border-b border-slate-200 mb-5 pr-8">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
                  mode === 'login'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
                  mode === 'register'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Đăng ký tài khoản</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <span className="font-semibold shrink-0">Lỗi:</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <div>
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên đăng nhập / Email
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={loginUsernameOrEmail}
                        onChange={(e) => setLoginUsernameOrEmail(e.target.value)}
                        placeholder="VD: hai.nguyen@valumanager.vn"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Ghi nhớ đăng nhập</span>
                    </label>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-amber-600 hover:underline font-medium">
                      Quên mật khẩu?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md transition flex items-center justify-center space-x-2 text-xs"
                  >
                    <span>Xác nhận đăng nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Switcher to register */}
                <div className="mt-4 text-center text-xs text-slate-500">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg('');
                    }}
                    className="text-amber-600 font-bold hover:underline ml-1"
                  >
                    Tạo tài khoản mới ngay
                  </button>
                </div>

                {/* Quick Demo Login Accounts */}
                <div className="mt-5 pt-4 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Hoặc chọn tài khoản mẫu khả dụng:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {allUsers.map((u) => {
                      const isCurrent = user?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectDemoUser(u)}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg border text-left transition ${
                            isCurrent
                              ? 'border-amber-500 bg-amber-50/70 text-slate-900 ring-1 ring-amber-500'
                              : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold truncate text-slate-900">{u.name}</p>
                              {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 ml-1 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-amber-700 font-semibold truncate">{u.roleName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.department}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <div>
                <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Họ và tên <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tên đăng nhập <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="nguyenvana"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email công việc <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="a.nguyen@valumanager.vn"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Đơn vị / Phòng ban
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={regDepartment}
                          onChange={(e) => setRegDepartment(e.target.value)}
                          placeholder="Phòng Thẩm định 1 / VPBank"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vai trò hệ thống
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-medium"
                      >
                        <option value="APPRAISER">Chuyên viên Thẩm định</option>
                        <option value="MANAGER">Trưởng phòng Thẩm định</option>
                        <option value="STAFF">Nhân viên Tiếp nhận</option>
                        <option value="ADMIN">Quản trị viên Hệ thống</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mật khẩu <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Xác nhận mật khẩu <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold rounded-lg shadow-md transition flex items-center justify-center space-x-2 text-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo tài khoản & Đăng nhập</span>
                  </button>
                </form>

                <div className="mt-4 text-center text-xs text-slate-500">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-amber-600 font-bold hover:underline ml-1"
                  >
                    Đăng nhập tại đây
                  </button>
                </div>
              </div>
            )}

          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Hệ thống định giá trực thuộc Ngân hàng & Công ty Thẩm định
          </div>

        </div>

      </div>
    </div>
  );
};
