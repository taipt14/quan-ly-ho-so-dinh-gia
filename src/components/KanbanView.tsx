import React from 'react';
import { 
  Building2, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  ShieldCheck, 
  AlertTriangle,
  User,
  Plus,
  Receipt,
  FileText,
  Award
} from 'lucide-react';
import { ValuationDossier, DossierStatus } from '../types/dossier';
import { ExportDocumentType } from './AdvisoryExportModal';
import { 
  STATUS_CONFIG, 
  getStatusConfig,
  normalizeDossierStatus,
  formatVNDCompact, 
  formatDate, 
  getSLADaysInfo, 
  PRIORITY_CONFIG,
  ASSET_CATEGORY_CONFIG 
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface KanbanViewProps {
  dossiers: ValuationDossier[];
  onSelectDossier: (dossier: ValuationDossier) => void;
  onUpdateStatus: (id: string, newStatus: DossierStatus) => void;
  onOpenCertificate: (dossier: ValuationDossier) => void;
  onOpenFeeNotice?: (dossier: ValuationDossier) => void;
  onOpenExportDoc?: (dossier: ValuationDossier, docType?: ExportDocumentType) => void;
  onOpenNewModal: () => void;
}

const KANBAN_STAGES: DossierStatus[] = [
  'MOI_GIAO',
  'DA_HEN_LICH_KHAO_SAT',
  'DA_KHAO_SAT',
  'KHACH_HANG_CHUA_THANH_TOAN',
  'KHACH_HANG_DA_THANH_TOAN',
  'DA_LEN_BAO_CAO_CHO_DUYET',
  'TU_CHOI_BAO_CAO',
  'DA_DUYET_BAO_CAO',
  'DA_GUI_BAO_CAO_CHO_CHI_NHANH',
  'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH',
  'KHACH_HANG_HUY'
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  dossiers,
  onSelectDossier,
  onUpdateStatus,
  onOpenCertificate,
  onOpenFeeNotice,
  onOpenExportDoc,
  onOpenNewModal
}) => {
  const { hasPermission } = useAuth();
  // Get next/prev stage for quick status transition buttons
  const getNextStage = (current: DossierStatus): DossierStatus | null => {
    const idx = KANBAN_STAGES.indexOf(current);
    if (idx >= 0 && idx < KANBAN_STAGES.length - 1) {
      return KANBAN_STAGES[idx + 1];
    }
    return null;
  };

  const getPrevStage = (current: DossierStatus): DossierStatus | null => {
    const idx = KANBAN_STAGES.indexOf(current);
    if (idx > 0) {
      return KANBAN_STAGES[idx - 1];
    }
    return null;
  };

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex space-x-4 min-w-[1280px]">
        
        {KANBAN_STAGES.map((stage) => {
          const config = getStatusConfig(stage);
          const stageDossiers = dossiers.filter(d => normalizeDossierStatus(d.status) === stage);
          const totalStageValue = stageDossiers.reduce((acc, d) => acc + (d.approvedValue || d.estimatedValue || 0), 0);

          return (
            <div 
              key={stage} 
              className="flex-1 min-w-[300px] max-w-[340px] bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[calc(100vh-220px)]"
            >
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <h3 className="font-bold text-slate-800 text-sm">{config.label}</h3>
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {stageDossiers.length}
                  </span>
                </div>

                {stage === 'MOI_GIAO' && hasPermission('create_dossier') && (
                  <button
                    onClick={onOpenNewModal}
                    className="p-1 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-amber-600 hover:border-amber-400 transition"
                    title="Thêm mới"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Total Value Sub-header */}
              <div className="text-[11px] text-slate-500 font-medium mb-3 flex items-center justify-between px-1">
                <span>Tổng giá trị:</span>
                <span className="font-bold text-slate-800">{formatVNDCompact(totalStageValue)}</span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {stageDossiers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    Không có hồ sơ
                  </div>
                ) : (
                  stageDossiers.map(item => {
                    const sla = getSLADaysInfo(item.dueDate, item.status);
                    const priority = PRIORITY_CONFIG[item.priority];
                    const category = ASSET_CATEGORY_CONFIG[item.assetCategory];
                    const nextStage = getNextStage(item.status);
                    const prevStage = getPrevStage(item.status);

                    const cardHighlightClass = sla.isOverdue 
                      ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500 border-l-4 border-l-rose-600 shadow-md shadow-rose-100/60'
                      : sla.isDueWithin24h 
                      ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400 border-l-4 border-l-amber-500 shadow-md shadow-amber-100/60'
                      : `bg-white border-slate-200 shadow-sm hover:shadow-md ${config.border}`;

                    return (
                      <div 
                        key={item.id}
                        className={`rounded-xl p-3.5 border transition group ${cardHighlightClass}`}
                      >
                        {/* Urgent Top Alert Banner */}
                        {sla.isOverdue && (
                          <div className="flex items-center justify-between text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-600 text-white mb-2.5 shadow-2xs animate-pulse">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">CẢNH BÁO: {sla.text.toUpperCase()}</span>
                            </div>
                            <span className="text-[9px] bg-rose-800/90 px-1.5 py-0.5 rounded font-mono shrink-0 uppercase tracking-wider">
                              QUÁ HẠN
                            </span>
                          </div>
                        )}

                        {sla.isDueWithin24h && (
                          <div className="flex items-center justify-between text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white mb-2.5 shadow-2xs">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                              <span className="truncate">GẤP: {sla.text.toUpperCase()}</span>
                            </div>
                            <span className="text-[9px] bg-amber-700/90 px-1.5 py-0.5 rounded font-mono shrink-0 uppercase tracking-wider">
                              &lt; 24H
                            </span>
                          </div>
                        )}

                        {/* Card Top Row: Code & Priority */}
                        <div className="flex items-center justify-between mb-2">
                          <span 
                            onClick={() => onSelectDossier(item)}
                            className="font-mono font-bold text-xs text-slate-900 hover:text-amber-600 cursor-pointer"
                          >
                            {item.code}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${priority.badge}`}>
                              {priority.label}
                            </span>
                            {sla.isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                                </span>
                                {sla.text}
                              </span>
                            ) : sla.isDueWithin24h ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                </span>
                                {sla.text}
                              </span>
                            ) : (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${sla.color}`}>
                                {sla.text}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Due Date Info Line */}
                        <div className="text-[10px] text-slate-500 flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1">
                            <Clock className={`w-3 h-3 ${sla.isOverdue ? 'text-rose-500' : sla.isDueWithin24h ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span>Hạn: <strong className={sla.isOverdue ? 'text-rose-700 font-bold' : sla.isDueWithin24h ? 'text-amber-800 font-bold' : 'text-slate-700'}>{formatDate(item.dueDate)}</strong></span>
                          </span>
                          {sla.subText && (
                            <span className={`text-[9px] font-medium ${sla.isOverdue ? 'text-rose-600' : sla.isDueWithin24h ? 'text-amber-700' : 'text-slate-400'}`}>
                              {sla.subText}
                            </span>
                          )}
                        </div>

                        {/* Asset Title */}
                        <h4 
                          onClick={() => onSelectDossier(item)}
                          className="font-bold text-slate-800 text-xs line-clamp-2 hover:text-amber-600 cursor-pointer mb-1"
                        >
                          {item.assetName}
                        </h4>

                        {/* Location */}
                        <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                          📍 {item.assetAddress}
                        </p>

                        {/* Client & Appraiser */}
                        <div className="text-[11px] text-slate-600 mb-3 space-y-0.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Khách hàng:</span>
                            <span className="font-semibold text-slate-800 line-clamp-1">{item.clientName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Chuyên viên:</span>
                            <span className="font-medium text-slate-700">{item.assignedAppraiser}</span>
                          </div>
                        </div>

                        {/* Approved Value & Service Fee */}
                        <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between text-xs mb-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Giá trị định giá</span>
                            <span className="font-bold text-emerald-700">
                              {item.approvedValue ? formatVNDCompact(item.approvedValue) : 'Chờ duyệt'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Phí dịch vụ</span>
                            <span className="font-semibold text-slate-800">
                              {formatVNDCompact(item.serviceFee)}
                            </span>
                          </div>
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onSelectDossier(item)}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {hasPermission('export_report') && onOpenExportDoc && (
                              <button
                                onClick={() => onOpenExportDoc(item)}
                                className="p-1 rounded text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                title="Xuất Báo cáo định giá (3 mẫu chuẩn Google Drive: Word .docx, In/PDF)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Stage Navigation */}
                          {hasPermission('update_status') && (
                            <div className="flex items-center space-x-1">
                              {prevStage && (
                                <button
                                  onClick={() => onUpdateStatus(item.id, prevStage)}
                                  className="px-1.5 py-0.5 rounded text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center space-x-0.5"
                                  title="Lùi lại bước trước"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}

                              {nextStage && (
                                <button
                                  onClick={() => onUpdateStatus(item.id, nextStage)}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-white bg-amber-500 hover:bg-amber-600 flex items-center space-x-1 shadow-sm"
                                  title={`Chuyển sang: ${STATUS_CONFIG[nextStage].label}`}
                                >
                                  <span>Chuyển</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
};
