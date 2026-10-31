import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  KeyRound, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  UserCheck, 
  UserPlus, 
  FileText, 
  Phone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers,
  Award,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, User } from '../types/auth';

export const LoginPage: React.FC = () => {
  const { login, register, loginAsDemo, allUsers } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginUsernameOrEmail, setLoginUsernameOrEmail] = useState('thu.tran@valumanager.vn');
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsernameOrEmail.trim()) {
      setErrorMsg('Vui lòng nhập Tên đăng nhập hoặc Email');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    setTimeout(() => {
      const res = login(loginUsernameOrEmail, loginPassword);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      }
    }, 250);
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
    setIsSubmitting(true);
    setTimeout(() => {
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
        setIsSubmitting(false);
      }
    }, 250);
  };

  const handleSelectDemoUser = (demoUser: User) => {
    loginAsDemo(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">ValuManager</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Hệ thống 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Hệ thống Quản lý & Thẩm định giá Tài sản Doanh nghiệp
              </p>
            </div>
          </div>

          {/* Right badges */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-medium">Hệ thống bảo mật trực tuyến</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">ISO/IEC 27001 Security</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
        
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: System Overview & Value Highlights */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Nền tảng Thẩm định giá Chuyên nghiệp</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Quản lý & Giám sát <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400 bg-clip-text text-transparent">
                  Quy trình Định giá 4.0
                </span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Cổng nghiệp vụ bảo mật dành cho Hội đồng Thẩm định, Ban Giám đốc và Chuyên viên thẩm định giá. Chuẩn hóa quy trình, kiểm soát SLA chặt chẽ, ứng dụng AI Vision OCR bóc tách giấy tờ pháp lý và tự động xuất Báo cáo tư vấn / Chứng thư thẩm định giá.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1">Quản lý Tiến độ & SLA</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bảng Kanban & Bảng tính trực quan từ Mới giao đến Đã phát hành, cảnh báo hồ sơ quá hạn thời gian thực.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1">AI Vision OCR Thông Minh</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nhận diện & trích xuất chính xác CCCD 12 số, Sổ đỏ/Sổ hồng, Cà vẹt xe, tự động điền hồ sơ thẩm định.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1">Xuất Báo cáo & Chứng thư</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tự động lập Chứng thư số, Thông báo phí dịch vụ và Báo cáo kết quả tư vấn theo 3 biểu mẫu quy chuẩn.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1">Phân quyền 4 Cấp Độ</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Admin, Trưởng phòng, Thẩm định viên và Trợ lý với 12 đặc quyền tính năng kiểm soát truy cập nghiêm ngặt.
                </p>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Dữ liệu hồ sơ khách hàng và kết quả định giá được bảo mật tuyệt đối theo Tiêu chuẩn Thẩm định giá Việt Nam.</span>
            </div>

          </div>

          {/* Right Column: Interactive Login & Quick Switcher Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative">
              
              {/* Form Navigation Tabs */}
              <div className="flex border-b border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
                    mode === 'login'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Đăng nhập hệ thống</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
                    mode === 'register'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Đăng ký tài khoản</span>
                </button>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="mb-5 p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {mode === 'login' && (
                <div>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Tên đăng nhập hoặc Email công việc
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={loginUsernameOrEmail}
                          onChange={(e) => setLoginUsernameOrEmail(e.target.value)}
                          placeholder="VD: thu.tran@valumanager.vn"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center space-x-2 text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500/50"
                        />
                        <span>Ghi nhớ phiên đăng nhập</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => alert('Vui lòng liên hệ Quản trị viên (Admin) hoặc Hotline 1900 6868 để đặt lại mật khẩu.')}
                        className="text-amber-400 hover:text-amber-300 hover:underline font-medium"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-[0.99] flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Quick One-Click Demo Role Accounts */}
                  <div className="mt-6 pt-5 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Tài khoản mẫu thử nghiệm theo vai trò:
                      </span>
                      <span className="text-[10px] text-amber-400 font-medium">Nhấn để vào ngay</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allUsers.map((u) => {
                        const roleColor = 
                          u.role === 'ADMIN' ? 'border-purple-500/40 hover:border-purple-400 bg-purple-950/20 text-purple-200' :
                          u.role === 'MANAGER' ? 'border-blue-500/40 hover:border-blue-400 bg-blue-950/20 text-blue-200' :
                          u.role === 'APPRAISER' ? 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20 text-emerald-200' :
                          'border-amber-500/40 hover:border-amber-400 bg-amber-950/20 text-amber-200';

                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectDemoUser(u)}
                            className={`flex items-center space-x-2.5 p-2.5 rounded-xl border transition text-left group bg-slate-800/40 hover:bg-slate-800 ${roleColor}`}
                            title={`Đăng nhập nhanh với quyền ${u.roleName}`}
                          >
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                              alt={u.name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                                {u.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {u.roleName}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition shrink-0" />
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
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Họ và tên <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tên đăng nhập <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="nguyenvana"
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Email cơ quan <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="a.nguyen@valumanager.vn"
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="text"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Phòng ban
                        </label>
                        <select
                          value={regDepartment}
                          onChange={(e) => setRegDepartment(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        >
                          <option value="Phòng Thẩm định 1">Phòng Thẩm định 1</option>
                          <option value="Phòng Thẩm định 2">Phòng Thẩm định 2</option>
                          <option value="Phòng Thẩm định Giá Bất Động Sản">Phòng Thẩm định Giá Bất Động Sản</option>
                          <option value="Phòng Thẩm định Động Sản & Máy Móc">Phòng Thẩm định Động Sản & Máy Móc</option>
                          <option value="Ban Giám đốc">Ban Giám đốc</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Vai trò / Chức danh
                        </label>
                        <select
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        >
                          <option value="APPRAISER">Chuyên viên Thẩm định (Appraiser)</option>
                          <option value="MANAGER">Trưởng phòng Thẩm định (Manager)</option>
                          <option value="ADMIN">Quản trị viên Hệ thống (Admin)</option>
                          <option value="STAFF">Nhân viên Tiếp nhận (Staff)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Mật khẩu <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Xác nhận mật khẩu <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & Đăng nhập ngay'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 ValuManager. Hệ thống Thẩm định giá Tiêu chuẩn Quốc gia & Quốc tế.</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Hotline Kỹ thuật: <strong className="text-amber-400">1900 6868</strong></span>
            <span>•</span>
            <span>contact@valumanager.vn</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
