import React from 'react';
import { 
  FileCheck2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Award,
  Layers
} from 'lucide-react';
import { ValuationDossier } from '../types/dossier';
import { getSLADaysInfo, normalizeDossierStatus } from '../utils/formatters';

interface StatsCardsProps {
  dossiers: ValuationDossier[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ dossiers }) => {
  const totalDossiers = dossiers.length;
  
  // Status counts (Completed: Approved or Sent to branch)
  const completedCount = dossiers.filter(d => {
    const norm = normalizeDossierStatus(d.status);
    return (
      norm === 'DA_DUYET_BAO_CAO' ||
      norm === 'DA_GUI_BAO_CAO_CHO_CHI_NHANH' ||
      norm === 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH'
    );
  }).length;

  const inProgressCount = dossiers.filter(d => {
    const norm = normalizeDossierStatus(d.status);
    return (
      norm !== 'DA_DUYET_BAO_CAO' &&
      norm !== 'DA_GUI_BAO_CAO_CHO_CHI_NHANH' &&
      norm !== 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH' &&
      norm !== 'KHACH_HANG_HUY'
    );
  }).length;

  // Overdue count
  const overdueCount = dossiers.filter(d => {
    const sla = getSLADaysInfo(d.dueDate, d.status);
    return sla.status === 'OVERDUE';
  }).length;

  // SLA On-time percentage
  const slaPercentage = totalDossiers > 0 
    ? Math.round(((totalDossiers - overdueCount) / totalDossiers) * 100) 
    : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Total Dossiers */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Hồ Sơ</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalDossiers} <span className="text-xs font-normal text-slate-500">hồ sơ</span></h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center space-x-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <span className="inline-flex items-center text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {completedCount} Đã xong
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-amber-600 font-medium">{inProgressCount} Đang xử lý</span>
        </div>
      </div>

      {/* 2. In Progress Dossiers */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang Xử Lý</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {inProgressCount} <span className="text-xs font-normal text-slate-500">hồ sơ</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Khảo sát, định giá & chờ duyệt</span>
          <span className="font-semibold text-amber-600">
            {totalDossiers > 0 ? `${Math.round((inProgressCount / totalDossiers) * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* 3. Completed Dossiers */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã Hoàn Thành</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {completedCount} <span className="text-xs font-normal text-slate-500">hồ sơ</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Đã duyệt & gửi chi nhánh</span>
          <span className="font-semibold text-emerald-600">
            {totalDossiers > 0 ? `${Math.round((completedCount / totalDossiers) * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* 4. SLA Performance Rate */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiến Độ SLA</p>
            <h3 className="text-2xl font-bold text-indigo-700 mt-1">
              {slaPercentage}% <span className="text-xs font-normal text-slate-500">đúng hạn</span>
            </h3>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
            overdueCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
          }`}>
            {overdueCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <Award className="w-6 h-6" />}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          {overdueCount > 0 ? (
            <span className="text-rose-600 font-semibold flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {overdueCount} hồ sơ quá hạn SLA!
            </span>
          ) : (
            <span className="text-emerald-600 font-medium flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Tất cả hồ sơ đúng tiến độ
            </span>
          )}
          <span className="text-slate-400">Chỉ số SLA</span>
        </div>
      </div>

    </div>
  );
};
