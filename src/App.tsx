import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { isDossierLocked } from './utils/formatters';
import { ValuationDossier, DossierStatus } from './types/dossier';
import { fetchDossiers, createDossier, updateDossier, deleteDossier, bulkImportDossiers, resetDossiers } from './utils/dossierApi';
import { exportDossiersToExcel } from './utils/excel';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { TableView } from './components/TableView';
import { KanbanView } from './components/KanbanView';
import { DashboardView } from './components/DashboardView';
import { DossierFormModal } from './components/DossierFormModal';
import { DossierDetailModal } from './components/DossierDetailModal';
import { ValuationCertificateModal } from './components/ValuationCertificateModal';
import { FeeNoticeModal } from './components/FeeNoticeModal';
import { AdvisoryExportModal, ReportTemplateType } from './components/AdvisoryExportModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { AiValuationAssistant } from './components/AiValuationAssistant';
import { AuthModal } from './components/AuthModal';
import { UserPermissionModal } from './components/UserPermissionModal';
import { DocumentOcrScannerModal, ExtractedOcrData } from './components/DocumentOcrScannerModal';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getStatusConfig } from './utils/formatters';

function MainAppContent() {
  const { 
    user, 
    logout,
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    isPermissionModalOpen, 
    setIsPermissionModalOpen, 
    hasPermission, 
    isAdmin 
  } = useAuth();
  const [dossiers, setDossiers] = useState<ValuationDossier[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback to table if user lacks permission for kanban or dashboard
  useEffect(() => {
    if (activeView === 'kanban' && !hasPermission('view_kanban')) {
      setActiveView('table');
    } else if (activeView === 'dashboard' && !hasPermission('view_dashboard')) {
      setActiveView('table');
    }
  }, [activeView, user]);

  // Modals & Drawers
  const [selectedDossier, setSelectedDossier] = useState<ValuationDossier | null>(null);
  const [editingDossier, setEditingDossier] = useState<ValuationDossier | null>(null);
  const [certificateDossier, setCertificateDossier] = useState<ValuationDossier | null>(null);
  const [feeNoticeDossier, setFeeNoticeDossier] = useState<ValuationDossier | null>(null);
  const [exportDocState, setExportDocState] = useState<{ dossier: ValuationDossier; template?: ReportTemplateType } | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isGlobalOcrOpen, setIsGlobalOcrOpen] = useState(false);

  // Fast auto-create dossier from standalone OCR scan
  const handleGlobalOcrApply = (extracted: ExtractedOcrData, docImage?: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const randNum = Math.floor(100 + Math.random() * 900);

    const prefilledDossier: ValuationDossier = {
      id: `HS-${Date.now()}`,
      code: `DG.${year}.${month}.${randNum}`,
      clientName: extracted.clientName || '',
      clientCccd: extracted.clientCccd || '',
      clientAddress: extracted.clientAddress || '',
      clientPhone: extracted.clientPhone || '0908 123 456',
      clientEmail: extracted.clientEmail || '',
      assetName: extracted.assetName || (extracted.area ? `Thửa đất số ${extracted.landPlotNumber || ''} TBĐ ${extracted.mapSheetNumber || ''}` : 'Tài sản thẩm định giá'),
      assetCategory: extracted.assetCategory || 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT',
      assetAddress: extracted.assetAddress || '',
      legalDocNumber: extracted.legalDocNumber || '',
      area: extracted.area,
      landPlotNumber: extracted.landPlotNumber,
      mapSheetNumber: extracted.mapSheetNumber,
      landUseForm: extracted.landUseForm,
      landUsePurpose: extracted.landUsePurpose,
      landUseTerm: extracted.landUseTerm,
      houseNumber: extracted.houseNumber,
      ward: extracted.ward,
      district: extracted.district,
      province: extracted.province,
      constructionType: extracted.constructionType,
      constructionArea: extracted.constructionArea,
      constructionUsableArea: extracted.constructionUsableArea,
      floorsCount: extracted.floorsCount,
      buildingYear: extracted.buildingYear,
      purpose: 'VAY_VON_NGAN_HANG',
      receivedDate: today.toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assignedAppraiser: user?.name || 'Lê Văn Nam',
      branch: 'Chi nhánh TP. Hồ Chí Minh',
      estimatedValue: extracted.estimatedValue || 5000000000,
      approvedValue: extracted.estimatedValue ? Math.round(extracted.estimatedValue * 0.98 / 1000000) * 1000000 : 4900000000,
      serviceFee: extracted.serviceFee || 12000000,
      paymentStatus: 'CHUA_THANH_TOAN',
      status: 'MOI_GIAO',
      priority: 'NORMAL',
      methodUsed: 'Phương pháp so sánh',
      notes: 'Hồ sơ được khởi tạo tự động từ quét OCR tài liệu pháp lý',
      assetImages: docImage ? [docImage] : [],
      documents: [
        {
          id: `doc-ocr-${Date.now()}`,
          name: extracted.legalDocNumber ? `Giấy tờ OCR: ${extracted.legalDocNumber}` : 'Tài liệu quét OCR',
          status: 'DA_NOP'
        }
      ],
      statusHistory: [
        {
          status: 'MOI_GIAO',
          note: 'Khởi tạo hồ sơ tự động qua tính năng Quét AI OCR',
          updatedAt: new Date().toLocaleString('vi-VN'),
          updatedBy: user ? `${user.name} (${user.roleName})` : 'AI OCR'
        }
      ]
    };

    setEditingDossier(prefilledDossier);
    setIsFormModalOpen(true);
  };

  // Load dossiers on startup
  useEffect(() => {
    fetchDossiers()
      .then(setDossiers)
      .catch((err) => {
        console.error(err);
        alert('Không thể tải dữ liệu hồ sơ từ server. Vui lòng kiểm tra MongoDB và server đã chạy.');
      });
  }, []);

  // Update local UI state only; persistence is handled per-operation below
  const updateDossiersState = (newDossiers: ValuationDossier[]) => {
    setDossiers(newDossiers);
  };

  // Add / Edit Dossier
  const handleSaveDossier = async (savedItem: ValuationDossier) => {
    const exists = dossiers.some(d => d.id === savedItem.id);
    const previous = dossiers;
    let updated: ValuationDossier[];
    let withUser: ValuationDossier;
    if (exists) {
      withUser = savedItem;
      updated = dossiers.map(d => d.id === savedItem.id ? savedItem : d);
    } else {
      // Set assigned appraiser to current user if not set
      withUser = {
        ...savedItem,
        assignedAppraiser: savedItem.assignedAppraiser || user?.name || 'Lê Văn Nam'
      };
      updated = [withUser, ...dossiers];
    }
    updateDossiersState(updated);

    try {
      if (exists) {
        await updateDossier(withUser.id, withUser);
      } else {
        await createDossier(withUser);
      }
    } catch (err: any) {
      setDossiers(previous);
      alert('Lưu hồ sơ thất bại: ' + (err?.message || err));
    }
  };

  // Update Status & Audit Log
  const handleUpdateStatus = async (id: string, newStatus: DossierStatus, reason?: string) => {
    const previous = dossiers;
    const nowStr = new Date().toLocaleString('vi-VN');
    const updated = dossiers.map(item => {
      if (item.id === id) {
        const oldStatusLabel = getStatusConfig(item.status)?.label || item.status;
        const newStatusLabel = getStatusConfig(newStatus)?.label || newStatus;

        let noteText = `Chuyển trạng thái từ [${oldStatusLabel}] sang [${newStatusLabel}]`;
        if (reason) {
          if (newStatus === 'TU_CHOI_BAO_CAO') {
            noteText += ` - Lý do từ chối: ${reason}`;
          } else if (newStatus === 'DA_LEN_BAO_CAO_CHO_DUYET') {
            noteText += ` - Ghi chú trình duyệt: ${reason}`;
          } else {
            noteText += ` - Ghi chú: ${reason}`;
          }
        }

        const newHistoryItem = {
          status: newStatus,
          note: noteText,
          updatedAt: nowStr,
          updatedBy: user ? `${user.name} (${user.roleName})` : 'Thẩm định viên'
        };

        return {
          ...item,
          status: newStatus,
          approvalRejectionReason: newStatus === 'TU_CHOI_BAO_CAO' ? reason : (newStatus === 'DA_DUYET_BAO_CAO' ? undefined : item.approvalRejectionReason),
          submittedForApprovalAt: newStatus === 'DA_LEN_BAO_CAO_CHO_DUYET' ? nowStr : item.submittedForApprovalAt,
          submissionNote: newStatus === 'DA_LEN_BAO_CAO_CHO_DUYET' ? (reason || item.submissionNote) : item.submissionNote,
          approvedAt: newStatus === 'DA_DUYET_BAO_CAO' ? nowStr : (newStatus === 'TU_CHOI_BAO_CAO' ? undefined : item.approvedAt),
          approvedBy: newStatus === 'DA_DUYET_BAO_CAO' ? (user ? user.name : 'Lãnh đạo phê duyệt') : (newStatus === 'TU_CHOI_BAO_CAO' ? undefined : item.approvedBy),
          statusHistory: [newHistoryItem, ...(item.statusHistory || [])]
        };
      }
      return item;
    });

    updateDossiersState(updated);

    // Keep selected drawer in sync if open
    if (selectedDossier && selectedDossier.id === id) {
      const refreshed = updated.find(d => d.id === id);
      if (refreshed) setSelectedDossier(refreshed);
    }
    // Keep exportDocState in sync if open
    if (exportDocState && exportDocState.dossier.id === id) {
      const refreshed = updated.find(d => d.id === id);
      if (refreshed) {
        setExportDocState(prev => prev ? { ...prev, dossier: refreshed } : null);
      }
    }

    try {
      const refreshed = updated.find(d => d.id === id);
      if (refreshed) {
        await updateDossier(id, refreshed);
      }
    } catch (err: any) {
      setDossiers(previous);
      alert('Cập nhật trạng thái thất bại: ' + (err?.message || err));
    }
  };

  // Delete Dossier
  const handleDeleteDossier = async (id: string) => {
    const previous = dossiers;
    const updated = dossiers.filter(d => d.id !== id);
    updateDossiersState(updated);

    try {
      await deleteDossier(id);
    } catch (err: any) {
      setDossiers(previous);
      alert('Xóa hồ sơ thất bại: ' + (err?.message || err));
    }
  };

  // Import Dossiers from Excel / Google Sheets
  const handleImportSuccess = async (newImportedDossiers: ValuationDossier[]) => {
    const previous = dossiers;
    const merged = [...newImportedDossiers, ...dossiers];
    updateDossiersState(merged);

    try {
      await bulkImportDossiers(newImportedDossiers);
    } catch (err: any) {
      setDossiers(previous);
      alert('Import hồ sơ thất bại: ' + (err?.message || err));
    }
  };

  // Reset Data to Default Mock Data
  const handleResetData = async () => {
    if (confirm('Khôi phục dữ liệu mẫu ban đầu? (Thao tác này sẽ ghi đè dữ liệu hiện tại)')) {
      try {
        const reset = await resetDossiers();
        setDossiers(reset);
      } catch (err: any) {
        alert('Khôi phục dữ liệu thất bại: ' + (err?.message || err));
      }
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    exportDossiersToExcel(dossiers);
  };

  // If not logged in, return to the Login Page / Home Portal and DO NOT show any other data
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Header Bar */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewModal={() => {
          setEditingDossier(null);
          setIsFormModalOpen(true);
        }}
        onOpenOcrModal={() => setIsGlobalOcrOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportExcel={handleExportExcel}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onResetData={handleResetData}
        dossiers={dossiers}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* User Role & Permission Indicator Banner */}
        {user && (
          <div className="mb-4 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                alt={user.name}
                className="w-7 h-7 rounded-md object-cover border border-purple-500/40"
              />
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-slate-600">Đang thao tác với quyền:</span>
                <strong className="text-slate-900 font-bold">{user.name}</strong>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                  user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  user.role === 'APPRAISER' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {user.roleName}
                </span>
                <span className="text-slate-500 font-medium">
                  ({user.role === 'ADMIN' ? 'Toàn quyền 12/12 tính năng' : `Được cấp ${user.permissions?.length || 0}/12 tính năng`})
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {(isAdmin || hasPermission('manage_permissions')) && (
                <button
                  onClick={() => setIsPermissionModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-2xs"
                >
                  <span>⚙️ Quản lý Phân quyền (Admin)</span>
                </button>
              )}

              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition font-medium"
                title="Đổi tài khoản khác để thử nghiệm các phân quyền đã thiết lập"
              >
                Đổi tài khoản kiểm tra ↗
              </button>

              <button
                onClick={logout}
                className="text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition font-semibold text-xs flex items-center space-x-1 border border-rose-200"
                title="Đăng xuất khỏi hệ thống và quay về trang chủ đăng nhập"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}

        {/* KPI Summary Cards */}
        <StatsCards dossiers={dossiers} />

        {/* View Switcher: Table / Kanban / Dashboard */}
        {activeView === 'table' && (
          <TableView
            dossiers={dossiers}
            onSelectDossier={(d) => setSelectedDossier(d)}
            onEditDossier={(d) => {
              if (isDossierLocked(d.status)) {
                alert('Hồ sơ đã được Lãnh đạo duyệt báo cáo. Bản ghi đã bị khóa, không thể chỉnh sửa!');
                return;
              }
              setEditingDossier(d);
              setIsFormModalOpen(true);
            }}
            onDeleteDossier={handleDeleteDossier}
            onUpdateStatus={handleUpdateStatus}
            onOpenCertificate={(d) => setCertificateDossier(d)}
            onOpenFeeNotice={(d) => setFeeNoticeDossier(d)}
            onOpenExportDoc={(d, template) => setExportDocState({ dossier: d, template })}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeView === 'kanban' && (
          <KanbanView
            dossiers={dossiers}
            onSelectDossier={(d) => setSelectedDossier(d)}
            onUpdateStatus={handleUpdateStatus}
            onOpenCertificate={(d) => setCertificateDossier(d)}
            onOpenFeeNotice={(d) => setFeeNoticeDossier(d)}
            onOpenExportDoc={(d, template) => setExportDocState({ dossier: d, template })}
            onOpenNewModal={() => {
              setEditingDossier(null);
              setIsFormModalOpen(true);
            }}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView dossiers={dossiers} />
        )}

      </main>

      {/* Modals & Drawers */}
      
      {/* Auth Modal (Login / Demo switcher) */}
      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* User Permission Management Modal (Admin Feature Access Control) */}
      <UserPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
      />

      {/* Form Modal (Create / Edit) */}
      <DossierFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveDossier}
        initialData={editingDossier}
      />

      {/* Detail Modal (Inspection Drawer) */}
      <DossierDetailModal
        isOpen={!!selectedDossier}
        dossier={selectedDossier}
        onClose={() => setSelectedDossier(null)}
        onEdit={(d) => {
          if (isDossierLocked(d.status)) {
            alert('Hồ sơ đã được Lãnh đạo duyệt báo cáo. Bản ghi đã bị khóa, không thể chỉnh sửa!');
            return;
          }
          setSelectedDossier(null);
          setEditingDossier(d);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteDossier}
        onUpdateStatus={handleUpdateStatus}
        onOpenCertificate={(d) => {
          setSelectedDossier(null);
          setCertificateDossier(d);
        }}
        onOpenFeeNotice={(d) => {
          setSelectedDossier(null);
          setFeeNoticeDossier(d);
        }}
        onOpenExportDoc={(d, template) => {
          setSelectedDossier(null);
          setExportDocState({ dossier: d, template });
        }}
        onUpdateDossier={(updated) => {
          handleSaveDossier(updated);
          setSelectedDossier(updated);
        }}
      />

      {/* Valuation Certificate Modal */}
      <ValuationCertificateModal
        isOpen={!!certificateDossier}
        dossier={certificateDossier}
        onClose={() => setCertificateDossier(null)}
      />

      {/* Fee Notice Modal */}
      <FeeNoticeModal
        isOpen={!!feeNoticeDossier}
        dossier={feeNoticeDossier}
        onClose={() => setFeeNoticeDossier(null)}
      />

      {/* Advisory Report Export Modal (Báo Cáo Kết Quả Tư Vấn Giá - Chuẩn 4 Loại Tài Sản) */}
      <AdvisoryExportModal
        isOpen={!!exportDocState}
        dossier={exportDocState?.dossier || null}
        defaultTemplate={exportDocState?.template || 1}
        onClose={() => setExportDocState(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateDossier={(updated) => {
          handleSaveDossier(updated);
          if (exportDocState) {
            setExportDocState({ ...exportDocState, dossier: updated });
          }
        }}
        onEditDossier={(d) => {
          setExportDocState(null);
          setEditingDossier(d);
          setIsFormModalOpen(true);
        }}
      />

      {/* Excel & Google Sheets Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* AI Assistant Drawer */}
      <AiValuationAssistant
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        currentDossier={selectedDossier}
      />

      {/* Standalone Quick OCR Document Scanner */}
      <DocumentOcrScannerModal
        isOpen={isGlobalOcrOpen}
        onClose={() => setIsGlobalOcrOpen(false)}
        onApply={handleGlobalOcrApply}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
