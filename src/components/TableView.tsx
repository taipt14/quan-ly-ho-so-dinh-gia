import { isDossierLocked } from '../utils/formatters';
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  FileText, 
  Edit3,
  Lock, 
  Trash2, 
  ChevronDown, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  Building2,
  Phone,
  Calendar,
  DollarSign,
  MoreVertical,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Receipt,
  Award,
  FileSpreadsheet,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { ValuationDossier, DossierStatus, AssetCategory, PaymentStatus, FilterState } from '../types/dossier';
import { ExportDocumentType } from './AdvisoryExportModal';
import { 
  formatVND, 
  formatDate, 
  getSLADaysInfo, 
  STATUS_CONFIG, 
  getStatusConfig,
  normalizeDossierStatus,
  ASSET_CATEGORY_CONFIG, 
  PAYMENT_STATUS_CONFIG, 
  PRIORITY_CONFIG 
} from '../utils/formatters';
import { exportDossiersToExcel } from '../utils/excel';
import { useAuth } from '../context/AuthContext';

interface TableViewProps {
  dossiers: ValuationDossier[];
  onSelectDossier: (dossier: ValuationDossier) => void;
  onEditDossier: (dossier: ValuationDossier) => void;
  onDeleteDossier: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: DossierStatus) => void;
  onOpenCertificate: (dossier: ValuationDossier) => void;
  onOpenFeeNotice?: (dossier: ValuationDossier) => void;
  onOpenExportDoc?: (dossier: ValuationDossier, docType?: ExportDocumentType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  dossiers,
  onSelectDossier,
  onEditDossier,
  onDeleteDossier,
  onUpdateStatus,
  onOpenCertificate,
  onOpenFeeNotice,
  onOpenExportDoc,
  searchQuery,
  setSearchQuery
}) => {
  const { hasPermission } = useAuth();

  // Filters State for all columns
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedAppraiser, setSelectedAppraiser] = useState<string>('ALL');
  const [selectedCreditOfficer, setSelectedCreditOfficer] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<string>('ALL');
  const [selectedValueRange, setSelectedValueRange] = useState<string>('ALL');
  const [colFilterCode, setColFilterCode] = useState<string>('');
  const [colFilterClient, setColFilterClient] = useState<string>('');
  const [colFilterAsset, setColFilterAsset] = useState<string>('');
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(true);

  // Sort State
  const [sortField, setSortField] = useState<keyof ValuationDossier>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Selected Row IDs for bulk operations
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  // Expand row to view all dynamic imported fields
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Unique lists for dropdowns
  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    dossiers.forEach(d => {
      let b = d.branch?.trim() || d.businessUnit?.trim();
      if (b) {
        b = b.replace(/Chính\s*ánh/gi, 'Chi nhánh');
        set.add(b);
      }
    });
    return Array.from(set).sort();
  }, [dossiers]);

  const uniqueAppraisers = useMemo(() => {
    const set = new Set<string>();
    dossiers.forEach(d => {
      const name = (d.assignedAppraiser || d.amcSpecialist)?.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [dossiers]);

  const uniqueCreditOfficers = useMemo(() => {
    const set = new Set<string>();
    dossiers.forEach(d => {
      const name = (d.creditOfficer || d.businessUnitSpecialist)?.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [dossiers]);

  // Urgency counters for quick filter alerts
  const overdueCount = useMemo(() => {
    return dossiers.filter(d => getSLADaysInfo(d.dueDate, d.status).isOverdue).length;
  }, [dossiers]);

  const dueWithin24hCount = useMemo(() => {
    return dossiers.filter(d => getSLADaysInfo(d.dueDate, d.status).isDueWithin24h).length;
  }, [dossiers]);

  // Filter Logic across all columns
  const filteredDossiers = dossiers.filter(item => {
    // 1. Global text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchText = (
        item.code.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.assetName.toLowerCase().includes(q) ||
        item.assetAddress.toLowerCase().includes(q) ||
        (item.clientCccd && item.clientCccd.toLowerCase().includes(q)) ||
        (item.clientPhone && item.clientPhone.toLowerCase().includes(q)) ||
        (item.assignedAppraiser && item.assignedAppraiser.toLowerCase().includes(q)) ||
        (item.amcSpecialist && item.amcSpecialist.toLowerCase().includes(q)) ||
        (item.creditOfficer && item.creditOfficer.toLowerCase().includes(q)) ||
        (item.businessUnitSpecialist && item.businessUnitSpecialist.toLowerCase().includes(q)) ||
        (item.legalDocNumber && item.legalDocNumber.toLowerCase().includes(q)) ||
        (item.importedColumnsData && item.importedColumnsData.some(f => 
          String(f.value || '').toLowerCase().includes(q) ||
          f.headerName.toLowerCase().includes(q) ||
          (f.categoryGroup && f.categoryGroup.toLowerCase().includes(q))
        ))
      );
      if (!matchText) return false;
    }

    // 2. Per-column: Mã HS
    if (colFilterCode.trim()) {
      const q = colFilterCode.toLowerCase().trim();
      if (!item.code.toLowerCase().includes(q)) return false;
    }

    // 3. Per-column: Khách hàng (Tên, SĐT, CCCD)
    if (colFilterClient.trim()) {
      const q = colFilterClient.toLowerCase().trim();
      const matchClient = (
        item.clientName.toLowerCase().includes(q) ||
        (item.clientPhone && item.clientPhone.toLowerCase().includes(q)) ||
        (item.clientCccd && item.clientCccd.toLowerCase().includes(q))
      );
      if (!matchClient) return false;
    }

    // 4. Per-column: Tài sản & Địa chỉ
    if (colFilterAsset.trim()) {
      const q = colFilterAsset.toLowerCase().trim();
      const matchAsset = (
        item.assetName.toLowerCase().includes(q) ||
        item.assetAddress.toLowerCase().includes(q) ||
        (item.landPlotNumber && item.landPlotNumber.toLowerCase().includes(q)) ||
        (item.mapSheetNumber && item.mapSheetNumber.toLowerCase().includes(q)) ||
        (item.legalDocNumber && item.legalDocNumber.toLowerCase().includes(q))
      );
      if (!matchAsset) return false;
    }

    // 5. Per-column: Loại tài sản
    if (selectedCategory !== 'ALL' && item.assetCategory !== selectedCategory) return false;

    // 6. Per-column: Giá trị định giá phê duyệt range
    if (selectedValueRange !== 'ALL') {
      const val = Number(item.approvedValue || item.estimatedValue || item.marketPrice || 0);
      if (selectedValueRange === 'UNDER_1B' && val >= 1_000_000_000) return false;
      if (selectedValueRange === '1B_5B' && (val < 1_000_000_000 || val > 5_000_000_000)) return false;
      if (selectedValueRange === '5B_20B' && (val < 5_000_000_000 || val > 20_000_000_000)) return false;
      if (selectedValueRange === 'OVER_20B' && val <= 20_000_000_000) return false;
    }

    // 7. Per-column: Chi nhánh / Đơn vị
    if (selectedBranch !== 'ALL' && item.branch !== selectedBranch && item.businessUnit !== selectedBranch) return false;
    
    // 8. Per-column: Chuyên viên thẩm định
    if (selectedAppraiser !== 'ALL') {
      const appraiser = (item.assignedAppraiser || item.amcSpecialist)?.trim();
      if (appraiser !== selectedAppraiser) return false;
    }

    // 9. Per-column: Chuyên viên tín dụng
    if (selectedCreditOfficer !== 'ALL') {
      const officer = (item.creditOfficer || item.businessUnitSpecialist)?.trim();
      if (officer !== selectedCreditOfficer) return false;
    }

    // 10. Per-column: Trạng thái thanh toán phí
    if (selectedPayment !== 'ALL' && item.paymentStatus !== selectedPayment) return false;

    // 11. Per-column: Tiến độ SLA (Quá hạn, Đến hạn trong 24h, Sắp đến hạn, Đúng hạn)
    if (selectedUrgency !== 'ALL') {
      const sla = getSLADaysInfo(item.dueDate, item.status);
      if (selectedUrgency === 'OVERDUE' && !sla.isOverdue) return false;
      if (selectedUrgency === 'DUE_24H' && !sla.isDueWithin24h) return false;
      if (selectedUrgency === 'DUE_SOON' && sla.status !== 'DUE_SOON') return false;
      if (selectedUrgency === 'ON_TIME' && sla.status !== 'ON_TIME' && sla.status !== 'DONE') return false;
    }

    // 12. Per-column: Trạng thái quy trình hồ sơ
    if (selectedStatus !== 'ALL' && normalizeDossierStatus(item.status) !== selectedStatus) return false;

    return true;
  });

  // Sort Logic
  const sortedDossiers = [...filteredDossiers].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB || '').toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof ValuationDossier) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedRowIds.length === sortedDossiers.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(sortedDossiers.map(d => d.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Total sums of filtered dossiers
  const sumFilteredApprovedValue = filteredDossiers.reduce((acc, d) => acc + (d.approvedValue || d.estimatedValue || 0), 0);
  const sumFilteredServiceFee = filteredDossiers.reduce((acc, d) => acc + (d.serviceFee || 0), 0);

  // Check if any filter is active
  const hasAnyFilter = Boolean(
    selectedStatus !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedBranch !== 'ALL' ||
    selectedAppraiser !== 'ALL' ||
    selectedCreditOfficer !== 'ALL' ||
    selectedUrgency !== 'ALL' ||
    selectedPayment !== 'ALL' ||
    selectedValueRange !== 'ALL' ||
    colFilterCode.trim() !== '' ||
    colFilterClient.trim() !== '' ||
    colFilterAsset.trim() !== '' ||
    searchQuery.trim() !== ''
  );

  const activeFilterCount = [
    selectedStatus !== 'ALL',
    selectedCategory !== 'ALL',
    selectedBranch !== 'ALL',
    selectedAppraiser !== 'ALL',
    selectedCreditOfficer !== 'ALL',
    selectedUrgency !== 'ALL',
    selectedPayment !== 'ALL',
    selectedValueRange !== 'ALL',
    colFilterCode.trim() !== '',
    colFilterClient.trim() !== '',
    colFilterAsset.trim() !== '',
    searchQuery.trim() !== '',
  ].filter(Boolean).length;

  const handleClearAllFilters = () => {
    setSelectedStatus('ALL');
    setSelectedCategory('ALL');
    setSelectedBranch('ALL');
    setSelectedAppraiser('ALL');
    setSelectedCreditOfficer('ALL');
    setSelectedUrgency('ALL');
    setSelectedPayment('ALL');
    setSelectedValueRange('ALL');
    setColFilterCode('');
    setColFilterClient('');
    setColFilterAsset('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Bar Covering All Columns */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        
        {/* Header of Filter Panel */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>Bộ lọc chi tiết theo tất cả các cột</span>
            {activeFilterCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {activeFilterCount} đang bật
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={() => setShowColumnFilters(!showColumnFilters)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-medium transition ${
                showColumnFilters 
                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showColumnFilters ? 'Đang hiện hàng lọc ở bảng' : 'Bật hàng lọc ở bảng'}</span>
            </button>
            {hasAnyFilter && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Filters Grid - Row 1 & 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 pt-1">
          
          {/* Cột 1: Mã HS */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Mã hồ sơ
            </label>
            <input
              type="text"
              placeholder="VD: HS-2026..."
              value={colFilterCode}
              onChange={e => setColFilterCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Cột 2: Khách hàng & SĐT */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Khách hàng / SĐT
            </label>
            <input
              type="text"
              placeholder="Tên, SĐT, CCCD..."
              value={colFilterClient}
              onChange={e => setColFilterClient(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Cột 3: Tài sản & Địa chỉ */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tài sản / Địa chỉ
            </label>
            <input
              type="text"
              placeholder="Tên TS, số nhà, thửa..."
              value={colFilterAsset}
              onChange={e => setColFilterAsset(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Cột 4: Loại tài sản */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Loại tài sản
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Tất cả loại tài sản</option>
              {Object.entries(ASSET_CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Cột 5: Giá trị phê duyệt */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Khoảng giá trị định giá
            </label>
            <select
              value={selectedValueRange}
              onChange={(e) => setSelectedValueRange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Tất cả khoảng giá</option>
              <option value="UNDER_1B">Dưới 1 Tỷ ₫</option>
              <option value="1B_5B">Từ 1 - 5 Tỷ ₫</option>
              <option value="5B_20B">Từ 5 - 20 Tỷ ₫</option>
              <option value="OVER_20B">Trên 20 Tỷ ₫</option>
            </select>
          </div>

          {/* Cột 6: Chi nhánh */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Chi nhánh
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              {uniqueBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Cột 7: CV Thẩm định */}
          <div>
            <label className="block text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
              CV Thẩm định
            </label>
            <select
              value={selectedAppraiser}
              onChange={(e) => setSelectedAppraiser(e.target.value)}
              className="w-full bg-blue-50/50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả CV thẩm định</option>
              {uniqueAppraisers.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Cột 8: CV Tín dụng */}
          <div>
            <label className="block text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              CV Tín dụng
            </label>
            <select
              value={selectedCreditOfficer}
              onChange={(e) => setSelectedCreditOfficer(e.target.value)}
              className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả CV tín dụng</option>
              {uniqueCreditOfficers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Cột 9: Tiến độ / SLA */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tiến độ / SLA
            </label>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Tất cả tiến độ</option>
              <option value="OVERDUE">🔴 Quá hạn SLA</option>
              <option value="DUE_SOON">🟡 Sắp đến hạn (&lt;2 ngày)</option>
              <option value="ON_TIME">🟢 Đúng tiến độ</option>
            </select>
          </div>

          {/* Cột 10: Thanh toán phí */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Thanh toán phí
            </label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Tất cả trạng thái phí</option>
              {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Cột 11: Trạng thái hồ sơ */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Trạng thái hồ sơ
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Tất cả trạng thái quy trình</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Clear Filters Indicator Bar */}
        {hasAnyFilter && (
          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
            <span className="text-slate-600 font-medium flex items-center space-x-1.5">
              <span>Đang lọc theo các cột:</span>
              <strong className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {filteredDossiers.length}
              </strong>
              <span>/ {dossiers.length} hồ sơ</span>
            </span>
            <button
              onClick={handleClearAllFilters}
              className="text-amber-600 hover:text-amber-800 font-bold underline flex items-center space-x-1 text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa tất cả các bộ lọc</span>
            </button>
          </div>
        )}

      </div>

      {/* Table Toolbar & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
          <span>Tổng số: <strong className="text-slate-900 font-bold">{sortedDossiers.length}</strong> hồ sơ</span>
          {selectedRowIds.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
              Đã chọn: {selectedRowIds.length}
            </span>
          )}
          
          {/* Quick Urgency Filter Pills */}
          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedUrgency(selectedUrgency === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition shadow-2xs ${
                selectedUrgency === 'OVERDUE'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400 ring-offset-1'
                  : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
              }`}
              title="Nhấn để chỉ hiển thị các hồ sơ đã quá hạn SLA"
            >
              <AlertTriangle className="w-3 h-3 text-rose-600 group-hover:scale-110" />
              <span>Quá hạn: {overdueCount}</span>
            </button>
          )}

          {dueWithin24hCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedUrgency(selectedUrgency === 'DUE_24H' ? 'ALL' : 'DUE_24H')}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition shadow-2xs ${
                selectedUrgency === 'DUE_24H'
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-1'
                  : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
              }`}
              title="Nhấn để chỉ hiển thị các hồ sơ sắp đến hạn trong vòng 24 giờ"
            >
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Hạn &lt; 24h: {dueWithin24hCount}</span>
            </button>
          )}

          {hasAnyFilter && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
              Bộ lọc cột: Đang áp dụng
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle in-table column filters button */}
          <button
            type="button"
            onClick={() => setShowColumnFilters(!showColumnFilters)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-2xs transition ${
              showColumnFilters
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Bật/Tắt hàng ô lọc trực tiếp ngay bên dưới từng cột của bảng"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span>{showColumnFilters ? 'Ẩn ô lọc trên từng cột' : 'Hiện ô lọc trên từng cột'}</span>
          </button>

          {hasPermission('export_excel') && (
            <button
              onClick={() => {
                const exportList = selectedRowIds.length > 0
                  ? sortedDossiers.filter(d => selectedRowIds.includes(d.id))
                  : sortedDossiers;
                exportDossiersToExcel(exportList);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition transform active:scale-95"
              title="Xuất file Excel báo cáo chuẩn định giá"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất Excel {selectedRowIds.length > 0 ? `(${selectedRowIds.length} HS đã chọn)` : `(${sortedDossiers.length} HS)`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Row 1: Main Header Labels with Sorting */}
              <tr className="bg-slate-900 text-slate-300 text-xs uppercase tracking-wider font-semibold border-b border-slate-800 select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.length === sortedDossiers.length && sortedDossiers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th 
                  onClick={() => handleSort('code')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Mã HS</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('clientName')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Khách hàng / Yêu cầu</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[340px] max-w-[480px]">Tài sản & Địa chỉ</th>
                <th 
                  onClick={() => handleSort('approvedValue')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Giá trị phê duyệt</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('serviceFee')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Phí dịch vụ</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">SLA Hạn trả</th>
                <th className="py-3 px-3 text-center">Chuyên viên</th>
                <th className="py-3 px-1 text-center w-28 whitespace-nowrap">Trạng thái</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>

              {/* Row 2: In-Table Per-Column Filters Row */}
              {showColumnFilters && (
                <tr className="bg-slate-800 text-slate-300 text-xs border-b border-slate-700">
                  {/* Select Col */}
                  <th className="py-2 px-2 text-center">
                    <Filter className="w-3.5 h-3.5 mx-auto text-amber-400" />
                  </th>
                  {/* Mã HS */}
                  <th className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Lọc mã..."
                      value={colFilterCode}
                      onChange={e => setColFilterCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </th>
                  {/* Khách hàng */}
                  <th className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Lọc KH, SĐT..."
                      value={colFilterClient}
                      onChange={e => setColFilterClient(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </th>
                  {/* Tài sản & Địa chỉ */}
                  <th className="py-2 px-2">
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        placeholder="Lọc tài sản, địa chỉ..."
                        value={colFilterAsset}
                        onChange={e => setColFilterAsset(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-32 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="ALL">Tất cả loại TS</option>
                        {Object.entries(ASSET_CATEGORY_CONFIG).map(([k, cfg]) => (
                          <option key={k} value={k}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                  {/* Giá trị phê duyệt */}
                  <th className="py-2 px-2 text-right">
                    <select
                      value={selectedValueRange}
                      onChange={e => setSelectedValueRange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="ALL">Tất cả giá trị</option>
                      <option value="UNDER_1B">&lt; 1 Tỷ ₫</option>
                      <option value="1B_5B">1 - 5 Tỷ ₫</option>
                      <option value="5B_20B">5 - 20 Tỷ ₫</option>
                      <option value="OVER_20B">&gt; 20 Tỷ ₫</option>
                    </select>
                  </th>
                  {/* Phí dịch vụ */}
                  <th className="py-2 px-2 text-right">
                    <select
                      value={selectedPayment}
                      onChange={e => setSelectedPayment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="ALL">Tất cả TT phí</option>
                      {Object.entries(PAYMENT_STATUS_CONFIG).map(([k, cfg]) => (
                        <option key={k} value={k}>{cfg.label}</option>
                      ))}
                    </select>
                  </th>
                  {/* SLA Hạn trả */}
                  <th className="py-2 px-2 text-center">
                    <select
                      value={selectedUrgency}
                      onChange={e => setSelectedUrgency(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="ALL">Tất cả SLA</option>
                      <option value="OVERDUE">🔴 Quá hạn SLA</option>
                      <option value="DUE_24H">⚡ Hạn chót &lt; 24h</option>
                      <option value="DUE_SOON">⏳ Sắp đến hạn (&lt; 48h)</option>
                      <option value="ON_TIME">✅ Đúng tiến độ</option>
                    </select>
                  </th>
                  {/* Chuyên viên (CV Thẩm định / CV Tín dụng) */}
                  <th className="py-2 px-2 text-center">
                    <div className="flex flex-col space-y-1">
                      <select
                        value={selectedAppraiser}
                        onChange={e => setSelectedAppraiser(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-blue-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        title="Lọc chuyên viên thẩm định"
                      >
                        <option value="ALL">ĐG: Tất cả</option>
                        {uniqueAppraisers.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <select
                        value={selectedCreditOfficer}
                        onChange={e => setSelectedCreditOfficer(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-emerald-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        title="Lọc chuyên viên tín dụng"
                      >
                        <option value="ALL">TĐ: Tất cả</option>
                        {uniqueCreditOfficers.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                  {/* Trạng thái */}
                  <th className="py-2 px-1 text-center w-28">
                    <select
                      value={selectedStatus}
                      onChange={e => setSelectedStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                        <option key={k} value={k}>{cfg.label}</option>
                      ))}
                    </select>
                  </th>
                  {/* Reset action */}
                  <th className="py-2 px-2 text-right">
                    {hasAnyFilter && (
                      <button
                        onClick={handleClearAllFilters}
                        title="Xóa tất cả bộ lọc"
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline whitespace-nowrap"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </th>
                </tr>
              )}
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {sortedDossiers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Search className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">Không tìm thấy hồ sơ phù hợp</p>
                      <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedDossiers.map(item => {
                  const statusInfo = getStatusConfig(item.status);
                  const slaInfo = getSLADaysInfo(item.dueDate, item.status);
                  const paymentInfo = PAYMENT_STATUS_CONFIG[item.paymentStatus];
                  const priorityInfo = PRIORITY_CONFIG[item.priority];
                  const isSelected = selectedRowIds.includes(item.id);

                  const rowHighlightClass = isSelected 
                    ? 'bg-amber-100/50' 
                    : slaInfo.isOverdue 
                    ? 'bg-rose-50/85 hover:bg-rose-100/70 border-l-4 border-l-rose-600' 
                    : slaInfo.isDueWithin24h 
                    ? 'bg-amber-50/85 hover:bg-amber-100/70 border-l-4 border-l-amber-500' 
                    : 'hover:bg-slate-50/90';

                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`transition-colors ${rowHighlightClass}`}
                      >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                      </td>

                      {/* Code & Priority Badge */}
                      <td className="py-3 px-3 font-mono font-bold text-amber-600 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-slate-900 font-bold hover:underline cursor-pointer" onClick={() => onSelectDossier(item)}>
                              {item.code}
                            </span>
                            {slaInfo.isOverdue && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-2xs animate-pulse" title="Hồ sơ đã quá hạn SLA!">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                QUÁ HẠN
                              </span>
                            )}
                            {slaInfo.isDueWithin24h && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-2xs" title="Hạn chót trong vòng 24 giờ!">
                                <Clock className="w-2.5 h-2.5" />
                                &lt; 24H
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatDate(item.receivedDate)}
                          </span>

                          {/* Quick Expand Button to view all imported columns/fields */}
                          {item.importedColumnsData && item.importedColumnsData.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center space-x-1 mt-1 transition w-fit ${
                                expandedRowId === item.id
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                              title="Bấm để xem tất cả các cột dữ liệu từ file import"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>{item.importedColumnsData.length} cột</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedRowId === item.id ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Client Info */}
                      <td className="py-3 px-3 font-medium text-slate-800 min-w-[160px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 line-clamp-1">{item.clientName}</span>
                          <span className="text-[11px] text-slate-500 flex items-center mt-0.5">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            {item.clientPhone}
                          </span>
                        </div>
                      </td>

                      {/* Asset & Location */}
                      <td className="py-3 px-4 min-w-[360px] max-w-[500px]">
                        <div className="flex flex-col">
                          <span 
                            className="font-semibold text-slate-800 line-clamp-2 hover:text-amber-600 cursor-pointer leading-snug"
                            onClick={() => onSelectDossier(item)}
                            title={item.assetName}
                          >
                            {item.assetName}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug" title={item.assetAddress}>
                            📍 {item.assetAddress}
                          </span>
                        </div>
                      </td>

                      {/* Approved Value */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {item.approvedValue ? formatVND(item.approvedValue) : (
                          <span className="text-slate-400 font-normal text-xs">Chờ duyệt</span>
                        )}
                      </td>

                      {/* Service Fee & Payment status */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-800">{formatVND(item.serviceFee)}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${paymentInfo?.badge}`}>
                            {paymentInfo?.label}
                          </span>
                        </div>
                      </td>

                      {/* SLA Due Date & Urgency Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center space-y-1">
                          <span className={`text-xs font-semibold ${slaInfo.isOverdue ? 'text-rose-700' : slaInfo.isDueWithin24h ? 'text-amber-800' : 'text-slate-700'}`}>
                            {formatDate(item.dueDate)}
                          </span>
                          {slaInfo.isOverdue ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                              </span>
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{slaInfo.text}</span>
                            </span>
                          ) : slaInfo.isDueWithin24h ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{slaInfo.text}</span>
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] border font-medium ${slaInfo.color}`}>
                              {slaInfo.text}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Appraiser, Credit Officer & Branch */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center space-y-0.5">
                          <span className="font-semibold text-slate-800 text-xs" title="Chuyên viên thẩm định">
                            {item.assignedAppraiser || item.amcSpecialist || '---'}
                          </span>
                          {(item.creditOfficer || item.businessUnitSpecialist) && (
                            <span className="text-[10px] text-blue-700 font-medium bg-blue-50/70 px-1.5 py-0.2 rounded border border-blue-100" title="Chuyên viên tín dụng">
                              TĐ: {item.creditOfficer || item.businessUnitSpecialist}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{item.branch}</span>
                        </div>
                      </td>

                      {/* Status Dropdown / Badge (Compacted) */}
                      <td className="py-3 px-1 text-center whitespace-nowrap w-28">
                        {hasPermission('update_status') ? (
                          <select
                            value={item.status}
                            onChange={(e) => onUpdateStatus(item.id, e.target.value as DossierStatus)}
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer max-w-[110px] truncate ${statusInfo?.badge}`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border max-w-[110px] truncate ${statusInfo?.badge}`}>
                            {statusInfo?.label}
                          </span>
                        )}
                      </td>

                      {/* Action Menu Buttons */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          
                          {/* View Detail */}
                          <button
                            onClick={() => onSelectDossier(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Document Exports */}
                          {hasPermission('export_report') && onOpenExportDoc && (
                            <button
                              onClick={() => onOpenExportDoc(item)}
                              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition"
                              title="Xuất Báo cáo định giá (3 mẫu chuẩn Google Drive: Word .docx, In/PDF)"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          {hasPermission('edit_dossier') && (
                            isDossierLocked(item.status) ? (
                              <span className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed" title="Hồ sơ đã được Lãnh đạo duyệt (Khóa chỉnh sửa)">
                                <Lock className="w-4 h-4 text-slate-400" />
                              </span>
                            ) : (
                              <button
                                onClick={() => onEditDossier(item)}
                                className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )
                          )}

                          {/* Delete */}
                          {hasPermission('delete_dossier') && (
                            <button
                              onClick={() => onDeleteDossier(item.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                              title="Xóa hồ sơ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>

                    {/* Expanded Subrow: View All Dynamic Imported Fields */}
                    {expandedRowId === item.id && item.importedColumnsData && item.importedColumnsData.length > 0 && (
                      <tr className="bg-emerald-50/60 border-b-2 border-emerald-300">
                        <td colSpan={10} className="p-4">
                          <div className="bg-white rounded-xl border border-emerald-300 p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-100">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                  <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                                    <span>Toàn Bộ {item.importedColumnsData.length} Trường Dữ Liệu Từ File Import</span>
                                    <span className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      {item.code}
                                    </span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[10px]">
                                      100% Cột Đã Nhập
                                    </span>
                                  </h5>
                                  <p className="text-[11px] text-slate-500">
                                    Khách hàng: <strong>{item.clientName}</strong> • File đã nạp đủ {item.importedColumnsData.length} cột tương ứng {item.importedColumnsData.length} trường thông tin.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => onSelectDossier(item)}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                                >
                                  Xem & Chỉnh Sửa Chi Tiết
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedRowId(null)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                                >
                                  Thu gọn
                                </button>
                              </div>
                            </div>

                            {/* Responsive Grid of all imported fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                              {item.importedColumnsData.map((f) => {
                                const hasVal = f.value !== undefined && f.value !== null && String(f.value).trim() !== '';
                                return (
                                  <div 
                                    key={f.colIndex} 
                                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 transition text-xs"
                                  >
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                                      <span className="font-mono font-bold text-emerald-700">
                                        Cột #{f.colIndex + 1}
                                      </span>
                                      {f.categoryGroup && (
                                        <span className="text-amber-700 font-semibold truncate max-w-[120px]" title={f.categoryGroup}>
                                          {f.categoryGroup}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-bold text-slate-900 truncate text-[11px]" title={f.headerName}>
                                      {f.headerName}
                                    </p>
                                    <p 
                                      className={`mt-1 font-mono text-[11px] truncate ${
                                        hasVal ? 'text-slate-900 font-medium' : 'text-slate-300 italic'
                                      }`} 
                                      title={String(f.value)}
                                    >
                                      {hasVal ? String(f.value) : '--'}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="bg-slate-900 text-slate-300 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-800">
          <div className="flex items-center space-x-4">
            <span>Hiển thị <strong>{filteredDossiers.length}</strong> / {dossiers.length} hồ sơ</span>
            {selectedRowIds.length > 0 && (
              <span className="text-amber-400 font-semibold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                Đã chọn {selectedRowIds.length} dòng
              </span>
            )}
          </div>

          <div className="flex items-center space-x-6 font-medium">
            <div>
              <span className="text-slate-400">Giá trị lọc: </span>
              <strong className="text-emerald-400 font-bold text-sm ml-1">{formatVND(sumFilteredApprovedValue)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Doanh thu phí: </span>
              <strong className="text-amber-400 font-bold text-sm ml-1">{formatVND(sumFilteredServiceFee)}</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
