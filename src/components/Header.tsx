import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  LayoutDashboard, 
  Table, 
  Kanban, 
  Bell, 
  Sparkles, 
  RefreshCw,
  Search,
  Filter,
  LogOut,
  LogIn,
  User as UserIcon,
  ChevronDown,
  Shield,
  UserCheck,
  Scan
} from 'lucide-react';
import { ValuationDossier } from '../types/dossier';
import { getSLADaysInfo } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeView: 'dashboard' | 'table' | 'kanban';
  setActiveView: (view: 'dashboard' | 'table' | 'kanban') => void;
  onOpenNewModal: () => void;
  onOpenOcrModal?: () => void;
  onOpenImportModal: () => void;
  onExportExcel: () => void;
  onOpenAiAssistant: () => void;
  onResetData: () => void;
  dossiers: ValuationDossier[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenNewModal,
  onOpenOcrModal,
  onOpenImportModal,
  onExportExcel,
  onOpenAiAssistant,
  onResetData,
  dossiers,
  searchQuery,
  setSearchQuery
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { 
    user, 
    isLoggedIn, 
    logout, 
    setIsLoginModalOpen, 
    hasPermission, 
    isAdmin, 
    setIsPermissionModalOpen 
  } = useAuth();

  // Filter overdue or urgent dossiers
  const overdueDossiers = dossiers.filter(d => {
    const sla = getSLADaysInfo(d.dueDate, d.status);
    return sla.status === 'OVERDUE' || sla.status === 'DUE_24H';
  });

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">ValuManager</h1>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Định giá 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Quản lý Thông tin & Trạng thái Hồ sơ Thẩm định giá
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mã hồ sơ, tên khách hàng, tài sản, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Admin Permission Management Button */}
            {(isAdmin || hasPermission('manage_permissions')) && (
              <button
                onClick={() => setIsPermissionModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs sm:text-sm font-semibold shadow-xs transition transform active:scale-95"
                title="Quản lý Phân quyền người dùng & tính năng (Dành cho Admin)"
              >
                <Shield className="w-4 h-4 text-purple-300" />
                <span className="hidden sm:inline">Phân quyền</span>
              </button>
            )}

            {/* AI Assistant Button */}
            {hasPermission('use_ai_assistant') && (
              <button
                onClick={onOpenAiAssistant}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium shadow-sm transition transform active:scale-95"
                title="Mở Trợ lý AI Thẩm định"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                <span className="hidden sm:inline">Trợ lý AI</span>
              </button>
            )}

            {/* Overdue Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition relative"
                title="Cảnh báo quá hạn"
              >
                <Bell className="w-5 h-5" />
                {overdueDossiers.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {overdueDossiers.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Cảnh báo SLA ({overdueDossiers.length})</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                    {overdueDossiers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Không có hồ sơ nào quá hạn. Mọi thứ đang đúng tiến độ! ✨
                      </div>
                    ) : (
                      overdueDossiers.map(item => {
                        const sla = getSLADaysInfo(item.dueDate, item.status);
                        return (
                          <div key={item.id} className="p-3 hover:bg-slate-800/80 transition text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-amber-400">{item.code}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] ${sla.color}`}>
                                {sla.text}
                              </span>
                            </div>
                            <p className="text-slate-200 font-medium truncate">{item.assetName}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">Khách: {item.clientName} • CV: {item.assignedAppraiser}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Excel Actions */}
            {(hasPermission('import_excel') || hasPermission('export_excel')) && (
              <div className="hidden lg:flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                {hasPermission('import_excel') && (
                  <button
                    onClick={onOpenImportModal}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                    title="Nhập dữ liệu từ Excel / Google Sheets"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nhập Excel</span>
                  </button>
                )}

                {hasPermission('export_excel') && (
                  <button
                    onClick={onExportExcel}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                    title="Xuất file Excel báo cáo"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Xuất Excel</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick OCR Scanner Button */}
            {hasPermission('create_dossier') && onOpenOcrModal && (
              <button
                onClick={onOpenOcrModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs sm:text-sm font-semibold shadow-xs transition transform active:scale-95"
                title="Quét tài liệu CCCD, Sổ đỏ, Đăng ký xe tự động khởi tạo hồ sơ"
              >
                <Scan className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
                <span className="hidden sm:inline">Quét OCR</span>
              </button>
            )}

            {/* New Dossier Button */}
            {hasPermission('create_dossier') && (
              <button
                onClick={onOpenNewModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-md transition transform active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Thêm Hồ Sơ</span>
              </button>
            )}

            {/* User Account / Login & Logout Dropdown */}
            <div className="relative border-l border-slate-800 pl-2 ml-1">
              {isLoggedIn && user ? (
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 pr-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
                    title="Tài khoản cá nhân"
                  >
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                      alt={user.name}
                      className="w-7 h-7 rounded-md object-cover border border-amber-500/50"
                    />
                    <div className="hidden xl:block text-left">
                      <p className="text-xs font-bold leading-tight text-white">{user.name}</p>
                      <p className="text-[10px] text-amber-400 font-semibold leading-none mt-0.5">{user.roleName}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-slate-800 flex items-center space-x-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-lg object-cover border border-amber-500/50"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">{user.name}</p>
                          <p className="text-xs text-amber-400 font-semibold">{user.roleName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="py-1 px-2 border-b border-slate-800 text-xs">
                        <div className="px-2 py-1 text-slate-400 flex justify-between">
                          <span>Đơn vị:</span>
                          <span className="text-slate-200 font-medium">{user.department}</span>
                        </div>
                        <div className="px-2 py-1 text-slate-400 flex justify-between">
                          <span>Quyền hạn:</span>
                          <span className="text-emerald-400 font-semibold">{user.role}</span>
                        </div>
                      </div>

                      <div className="p-1 space-y-1">
                        {/* Admin Permission Management Option */}
                        {(isAdmin || hasPermission('manage_permissions')) && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setIsPermissionModalOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-purple-300 hover:bg-purple-900/30 rounded-lg flex items-center space-x-2 transition font-semibold"
                          >
                            <Shield className="w-4 h-4 text-purple-400" />
                            <span>Quản lý phân quyền tính năng</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setIsLoginModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center space-x-2 transition"
                        >
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          <span>Chuyển đổi tài khoản khác</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg flex items-center space-x-2 transition font-semibold"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Đăng xuất khỏi hệ thống</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md transition transform active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* View Selector Tabs & Mobile Actions */}
      <div className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-12">
          
          {/* Tabs */}
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === 'table'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Bảng tính (Spreadsheet)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {dossiers.length}
              </span>
            </button>

            {hasPermission('view_kanban') && (
              <button
                onClick={() => setActiveView('kanban')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeView === 'kanban'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span>Quy trình Kanban</span>
              </button>
            )}

            {hasPermission('view_dashboard') && (
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeView === 'dashboard'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Thống kê & Báo cáo</span>
              </button>
            )}
          </div>

          {/* Right Mobile Actions & Reset Button */}
          <div className="flex items-center space-x-2">
            {hasPermission('import_excel') && (
              <button
                onClick={onOpenImportModal}
                className="lg:hidden p-1.5 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700"
                title="Nhập Excel"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}

            {hasPermission('reset_data') && (
              <button
                onClick={onResetData}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition"
                title="Khôi phục dữ liệu mẫu ban đầu"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Dữ liệu mẫu</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
