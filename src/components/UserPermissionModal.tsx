import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  UserCheck, 
  UserPlus, 
  Check, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  LogIn, 
  Trash2, 
  Info, 
  Sparkles,
  FolderKanban,
  FileSpreadsheet,
  LayoutDashboard,
  Save,
  CheckCircle2,
  ChevronRight,
  User as UserIcon,
  HelpCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  UserRole, 
  FeaturePermissionKey, 
  FEATURE_DEFINITIONS, 
  FEATURE_CATEGORIES, 
  ROLE_INFO,
  DEFAULT_ROLE_PERMISSIONS 
} from '../types/auth';

interface UserPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPermissionModal: React.FC<UserPermissionModalProps> = ({ isOpen, onClose }) => {
  const { 
    user: currentUser, 
    allUsers, 
    updateUserPermissions, 
    updateUserRole, 
    resetUserPermissions,
    addUser,
    deleteUser,
    loginAsDemo
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'add_user'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    // Select first non-admin user or current user
    const firstOther = allUsers.find(u => u.id !== currentUser?.id);
    return firstOther ? firstOther.id : (currentUser?.id || allUsers[0]?.id || '');
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New user form state
  const [newUserData, setNewUserData] = useState<{
    name: string;
    username: string;
    email: string;
    phone: string;
    department: string;
    role: UserRole;
    permissions: FeaturePermissionKey[];
  }>({
    name: '',
    username: '',
    email: '',
    phone: '',
    department: 'Phòng Thẩm định 1',
    role: 'APPRAISER',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.APPRAISER]
  });
  const [addUserError, setAddUserError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedUser = allUsers.find(u => u.id === selectedUserId) || allUsers[0];

  // Filtered users list
  const filteredUsers = allUsers.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.roleName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Current user permissions set
  const currentPermissions: FeaturePermissionKey[] = selectedUser
    ? (selectedUser.permissions || DEFAULT_ROLE_PERMISSIONS[selectedUser.role] || [])
    : [];

  const handleTogglePermission = (key: FeaturePermissionKey) => {
    if (!selectedUser) return;
    let next: FeaturePermissionKey[];
    if (currentPermissions.includes(key)) {
      next = currentPermissions.filter(k => k !== key);
    } else {
      next = [...currentPermissions, key];
    }
    updateUserPermissions(selectedUser.id, next);
    showSaveNotification(`Đã cập nhật quyền cho ${selectedUser.name}`);
  };

  const handleGrantAll = () => {
    if (!selectedUser) return;
    const allKeys = FEATURE_DEFINITIONS.map(f => f.key);
    updateUserPermissions(selectedUser.id, allKeys);
    showSaveNotification(`Đã cấp toàn bộ quyền cho ${selectedUser.name}`);
  };

  const handleRevokeAll = () => {
    if (!selectedUser) return;
    updateUserPermissions(selectedUser.id, []);
    showSaveNotification(`Đã thu hồi tất cả quyền của ${selectedUser.name}`);
  };

  const handleResetToRoleDefault = () => {
    if (!selectedUser) return;
    resetUserPermissions(selectedUser.id);
    showSaveNotification(`Đã khôi phục quyền mặc định theo vai trò ${ROLE_INFO[selectedUser.role]?.label}`);
  };

  const handleChangeRole = (newRole: UserRole) => {
    if (!selectedUser) return;
    updateUserRole(selectedUser.id, newRole);
    showSaveNotification(`Đã đổi vai trò sang [${ROLE_INFO[newRole]?.label}] và tải quyền mặc định`);
  };

  const handleSwitchToThisUser = (userToSwitch: User) => {
    loginAsDemo(userToSwitch);
    onClose();
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản người dùng này khỏi hệ thống?')) {
      const res = deleteUser(userId);
      if (res.error) {
        alert(res.error);
      } else {
        const remaining = allUsers.filter(u => u.id !== userId);
        if (remaining.length > 0) {
          setSelectedUserId(remaining[0].id);
        }
        showSaveNotification('Đã xóa người dùng thành công');
      }
    }
  };

  const showSaveNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 2800);
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);
    const res = addUser(newUserData);
    if (!res.success) {
      setAddUserError(res.error || 'Có lỗi xảy ra khi tạo người dùng');
    } else {
      showSaveNotification(`Đã tạo tài khoản ${newUserData.name} thành công`);
      // Reset form
      setNewUserData({
        name: '',
        username: '',
        email: '',
        phone: '',
        department: 'Phòng Thẩm định 1',
        role: 'APPRAISER',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.APPRAISER]
      });
      setActiveTab('users');
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'FolderKanban': return <FolderKanban className="w-4 h-4 text-amber-500" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'LayoutDashboard': return <LayoutDashboard className="w-4 h-4 text-blue-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Shield className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Quản lý Phân quyền Người dùng & Tính năng
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Dành riêng Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cấu hình chi tiết các quyền thêm, sửa, xóa hồ sơ, xuất báo cáo, nhập Excel và sử dụng AI cho từng nhân sự
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Live Toast */}
            {saveSuccessMsg && (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-purple-600 text-purple-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Phân quyền theo Người dùng ({allUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
                activeTab === 'matrix'
                  ? 'border-purple-600 text-purple-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ma trận Quyền mặc định theo Vai trò</span>
            </button>

            <button
              onClick={() => setActiveTab('add_user')}
              className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
                activeTab === 'add_user'
                  ? 'border-purple-600 text-purple-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Thành viên mới</span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500">
            <span>Đang đăng nhập: <strong>{currentUser?.name}</strong></span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold text-[11px]">
              {currentUser?.roleName}
            </span>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          
          {/* TAB 1: User Permission Configuration */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: User Selection & Filters */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-full max-h-[640px]">
                
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, chức danh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Role Filter Chips */}
                <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b border-slate-100">
                  <button
                    onClick={() => setRoleFilter('ALL')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      roleFilter === 'ALL'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({allUsers.length})
                  </button>
                  {(['ADMIN', 'MANAGER', 'APPRAISER', 'STAFF'] as UserRole[]).map(r => {
                    const count = allUsers.filter(u => u.role === r).length;
                    return (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                          roleFilter === r
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r === 'ADMIN' ? 'Admin' : r === 'MANAGER' ? 'Trưởng phòng' : r === 'APPRAISER' ? 'Thẩm định' : 'Tiếp nhận'} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Không tìm thấy người dùng phù hợp với từ khóa
                    </div>
                  ) : (
                    filteredUsers.map(u => {
                      const isSelected = selectedUserId === u.id;
                      const uPerms = u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || [];
                      const isMe = currentUser?.id === u.id;

                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-purple-50/70 border-purple-500 shadow-xs ring-1 ring-purple-500'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                              alt={u.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <h4 className="text-xs font-bold text-slate-900 truncate">{u.name}</h4>
                                {isMe && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                    Tôi
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{u.department}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${ROLE_INFO[u.role]?.badge}`}>
                                  {ROLE_INFO[u.role]?.label || u.role}
                                </span>
                                <span className="text-[10px] text-purple-700 font-semibold bg-purple-100/60 px-1.5 py-0.5 rounded">
                                  {u.role === 'ADMIN' ? 'Toàn quyền (12/12)' : `${uPerms.length}/12 quyền`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight className={`w-4 h-4 shrink-0 transition ${isSelected ? 'text-purple-600 translate-x-0.5' : 'text-slate-300'}`} />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add User Quick Trigger */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab('add_user')}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Thêm người dùng mới</span>
                  </button>
                </div>

              </div>

              {/* Right Column: Selected User Permissions Matrix */}
              <div className="lg:col-span-8 space-y-4">
                
                {selectedUser ? (
                  <>
                    {/* User Profile Card & Role Selector */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        
                        <div className="flex items-center space-x-4">
                          <img
                            src={selectedUser.avatarUrl}
                            alt={selectedUser.name}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-purple-500/40 shadow-sm"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-base font-bold text-slate-900">{selectedUser.name}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${ROLE_INFO[selectedUser.role]?.badge}`}>
                                {ROLE_INFO[selectedUser.role]?.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              @{selectedUser.username} • {selectedUser.email} • {selectedUser.phone || '0900 000 000'}
                            </p>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                              Đơn vị công tác: <strong className="text-slate-800">{selectedUser.department}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Role Change & Switch Account */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex flex-col">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Vai trò hệ thống:
                            </label>
                            <select
                              value={selectedUser.role}
                              onChange={(e) => handleChangeRole(e.target.value as UserRole)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
                            >
                              <option value="ADMIN">Quản trị viên (Admin)</option>
                              <option value="MANAGER">Trưởng phòng Thẩm định</option>
                              <option value="APPRAISER">Chuyên viên Thẩm định</option>
                              <option value="STAFF">Nhân viên Tiếp nhận</option>
                            </select>
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Thao tác:
                            </label>
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleSwitchToThisUser(selectedUser)}
                                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
                                title="Đăng nhập thử tài khoản này để kiểm tra giao diện và quyền"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Đăng nhập thử</span>
                              </button>

                              {currentUser?.id !== selectedUser.id && (
                                <button
                                  onClick={() => handleDeleteUser(selectedUser.id)}
                                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                                  title="Xóa người dùng"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                        </div>

                      </div>

                      {/* Quick Bulk Action Bar */}
                      <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500 font-medium">Số tính năng được cấp:</span>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 text-xs">
                            {selectedUser.role === 'ADMIN' ? '12/12 (Toàn quyền Admin)' : `${currentPermissions.length} / 12 tính năng`}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={handleGrantAll}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold transition"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Cấp tất cả</span>
                          </button>

                          <button
                            onClick={handleRevokeAll}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold transition"
                          >
                            <Square className="w-3.5 h-3.5" />
                            <span>Thu hồi hết</span>
                          </button>

                          <button
                            onClick={handleResetToRoleDefault}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold transition"
                            title="Khôi phục quyền mặc định theo vai trò chức danh"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Theo vai trò ({selectedUser.role})</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Admin Privilege Alert Notice */}
                    {selectedUser.role === 'ADMIN' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-purple-900">
                        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <strong>Lưu ý về tài khoản Quản trị viên (Admin):</strong>
                          <p className="text-purple-700 mt-0.5 leading-relaxed">
                            Người dùng có vai trò Admin được hệ thống cấp toàn quyền sử dụng tất cả tính năng mặc định. Để giới hạn quyền của người dùng này, bạn có thể chuyển vai trò sang <em>Trưởng phòng</em> hoặc <em>Chuyên viên Thẩm định</em> và tích chọn các tính năng cụ thể bên dưới.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Feature Permissions Grouped by Categories */}
                    <div className="space-y-4">
                      {FEATURE_CATEGORIES.map(category => {
                        const items = FEATURE_DEFINITIONS.filter(f => f.category === category.id);
                        if (items.length === 0) return null;

                        return (
                          <div key={category.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Category Header */}
                            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getCategoryIcon(category.icon)}
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                  {category.name}
                                </h4>
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {category.description}
                              </span>
                            </div>

                            {/* Permissions List */}
                            <div className="divide-y divide-slate-100">
                              {items.map(feature => {
                                const isChecked = selectedUser.role === 'ADMIN' || currentPermissions.includes(feature.key);

                                return (
                                  <div
                                    key={feature.key}
                                    onClick={() => handleTogglePermission(feature.key)}
                                    className="p-3.5 flex items-start justify-between hover:bg-purple-50/30 transition cursor-pointer gap-4"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-slate-900">
                                          {feature.label}
                                        </span>
                                        <code className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 py-0.5 rounded">
                                          {feature.key}
                                        </code>
                                      </div>
                                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        {feature.description}
                                      </p>
                                    </div>

                                    {/* Toggle Switch */}
                                    <div className="flex items-center pt-1 shrink-0">
                                      <button
                                        type="button"
                                        aria-label={feature.label}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                          isChecked ? 'bg-purple-600' : 'bg-slate-300'
                                        }`}
                                      >
                                        <span
                                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            isChecked ? 'translate-x-5' : 'translate-x-0'
                                          }`}
                                        />
                                      </button>
                                    </div>

                                  </div>
                                );
                              })}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                    Chọn một người dùng ở danh sách bên trái để bắt đầu phân quyền
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 2: Role Permission Matrix Overview */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bảng so sánh Quyền hạn tiêu chuẩn theo Vai trò
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đây là cấu hình phân quyền mẫu áp dụng khi người dùng đăng ký mới hoặc khi bấm "Khôi phục theo vai trò"
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Có quyền</span>
                  </span>
                  <span className="flex items-center space-x-1 text-slate-400">
                    <X className="w-4 h-4 text-slate-400" />
                    <span>Không có quyền</span>
                  </span>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left font-bold uppercase tracking-wider">
                        Tính năng hệ thống
                      </th>
                      <th className="py-3 px-3 text-center font-bold text-purple-300">
                        Admin<br />
                        <span className="text-[10px] font-normal text-slate-400">Quản trị viên</span>
                      </th>
                      <th className="py-3 px-3 text-center font-bold text-blue-300">
                        Manager<br />
                        <span className="text-[10px] font-normal text-slate-400">Trưởng phòng</span>
                      </th>
                      <th className="py-3 px-3 text-center font-bold text-emerald-300">
                        Appraiser<br />
                        <span className="text-[10px] font-normal text-slate-400">Thẩm định viên</span>
                      </th>
                      <th className="py-3 px-3 text-center font-bold text-amber-300">
                        Staff<br />
                        <span className="text-[10px] font-normal text-slate-400">Nhân viên</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {FEATURE_DEFINITIONS.map((feat, idx) => {
                      const roles: UserRole[] = ['ADMIN', 'MANAGER', 'APPRAISER', 'STAFF'];
                      return (
                        <tr key={feat.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-3 px-4 text-slate-800">
                            <div className="font-bold text-slate-900">{feat.label}</div>
                            <div className="text-[11px] text-slate-500">{feat.shortDesc}</div>
                          </td>

                          {roles.map(role => {
                            const has = DEFAULT_ROLE_PERMISSIONS[role].includes(feat.key);
                            return (
                              <td key={role} className="py-3 px-3 text-center">
                                {has ? (
                                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                                    <X className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </td>
                            );
                          })}

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Explanation Note */}
              <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 flex items-start space-x-3">
                <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  <strong>Khả năng tùy biến linh hoạt:</strong> Bảng trên là cấu hình mặc định (template). Là Quản trị viên, bạn hoàn toàn có thể cấp thêm quyền hoặc thu hồi bất kỳ quyền nào của từng cá nhân ở tab <em>"Phân quyền theo Người dùng"</em> mà không bị ràng buộc bởi chức danh mặc định.
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Add New User */}
          {activeTab === 'add_user' && (
            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              
              <div className="pb-4 mb-5 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  Khởi tạo Tài khoản Nhân sự Mới
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thêm thành viên vào hệ thống và phân quyền tính năng ban đầu cho nhân sự
                </p>
              </div>

              {addUserError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{addUserError}</span>
                </div>
              )}

              <form onSubmit={handleCreateNewUser} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ và tên nhân sự <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Hoàng Tuấn Anh"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên đăng nhập (Username) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: hoangtuananh"
                      value={newUserData.username}
                      onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email công việc <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="anh.hoang@valumanager.vn"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="text"
                      placeholder="0912 888 999"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phòng ban / Đơn vị
                    </label>
                    <select
                      value={newUserData.department}
                      onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    >
                      <option value="Phòng Thẩm định 1">Phòng Thẩm định 1</option>
                      <option value="Phòng Thẩm định 2">Phòng Thẩm định 2</option>
                      <option value="Ban Giám đốc">Ban Giám đốc</option>
                      <option value="Phòng Kiểm soát rủi ro">Phòng Kiểm soát rủi ro</option>
                      <option value="Bộ phận Tiếp nhận hồ sơ">Bộ phận Tiếp nhận hồ sơ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vai trò chức danh ban đầu
                    </label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => {
                        const r = e.target.value as UserRole;
                        setNewUserData({
                          ...newUserData,
                          role: r,
                          permissions: [...(DEFAULT_ROLE_PERMISSIONS[r] || [])]
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    >
                      <option value="APPRAISER">Chuyên viên Thẩm định</option>
                      <option value="MANAGER">Trưởng phòng Thẩm định</option>
                      <option value="STAFF">Nhân viên Tiếp nhận</option>
                      <option value="ADMIN">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                </div>

                {/* Initial permissions preview */}
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Các quyền tính năng sẽ được kích hoạt ban đầu ({newUserData.permissions.length} tính năng):
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {FEATURE_DEFINITIONS.map(feat => {
                      const isChecked = newUserData.permissions.includes(feat.key);
                      return (
                        <label
                          key={feat.key}
                          className="flex items-center space-x-2 text-xs text-slate-700 p-1.5 hover:bg-white rounded cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewUserData({ ...newUserData, permissions: [...newUserData.permissions, feat.key] });
                              } else {
                                setNewUserData({ ...newUserData, permissions: newUserData.permissions.filter(k => k !== feat.key) });
                              }
                            }}
                            className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                          />
                          <span className="font-medium truncate">{feat.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo Tài Khoản Mới</span>
                  </button>
                </div>

              </form>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 text-slate-300 px-6 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Phân quyền được áp dụng ngay lập tức cho các phiên làm việc của người dùng</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};
