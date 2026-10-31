import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { ValuationDossier } from '../types/dossier';
import { 
  STATUS_CONFIG, 
  getStatusConfig, 
  ASSET_CATEGORY_CONFIG, 
  formatVNDCompact, 
  formatVND 
} from '../utils/formatters';
import { 
  UserCheck, 
  PieChart as PieIcon, 
  BarChart3, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  FileText 
} from 'lucide-react';

interface DashboardViewProps {
  dossiers: ValuationDossier[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ dossiers }) => {
  // Operational counts
  const totalDossiers = dossiers.length || 1;
  const { completedCount, inProgressCount } = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    dossiers.forEach(d => {
      const norm = d.status;
      if (
        norm === 'DA_DUYET_BAO_CAO' ||
        norm === 'DA_GUI_BAO_CAO_CHO_CHI_NHANH' ||
        norm === 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH'
      ) {
        completed += 1;
      } else {
        inProgress += 1;
      }
    });
    return { completedCount: completed, inProgressCount: inProgress };
  }, [dossiers]);

  // 1. Data for Branch Pie Chart & Workload Monitoring
  const BRANCH_PALETTE = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#64748b', // Slate
  ];

  const branchList = useMemo(() => {
    const branchMap: Record<string, {
      count: number;
      completed: number;
      inProgress: number;
    }> = {};

    dossiers.forEach(d => {
      let rawBranch = d.branch?.trim() || d.businessUnit?.trim() || 'Chi nhánh khác';
      // Ensure "Chi nhánh" is correctly preserved and never "Chínhánh"
      rawBranch = rawBranch.replace(/Chính\s*ánh/gi, 'Chi nhánh');
      rawBranch = rawBranch.replace(/^Ngân\s+hàng\s+TMCP\s+Bắc\s+Á\s*[-–—:]*\s*/i, '');
      if (!rawBranch.toLowerCase().startsWith('chi nhánh') && !rawBranch.toLowerCase().startsWith('cn')) {
        rawBranch = `Chi nhánh ${rawBranch}`;
      }

      if (!branchMap[rawBranch]) {
        branchMap[rawBranch] = {
          count: 0,
          completed: 0,
          inProgress: 0,
        };
      }
      branchMap[rawBranch].count += 1;

      const norm = d.status;
      if (
        norm === 'DA_DUYET_BAO_CAO' ||
        norm === 'DA_GUI_BAO_CAO_CHO_CHI_NHANH' ||
        norm === 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH'
      ) {
        branchMap[rawBranch].completed += 1;
      } else {
        branchMap[rawBranch].inProgress += 1;
      }
    });

    const entries = Object.entries(branchMap).map(([name, data], idx) => {
      const countPercent = Math.round((data.count / totalDossiers) * 100);
      const completionRate = data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0;
      return {
        name,
        count: data.count,
        countPercent,
        completed: data.completed,
        inProgress: data.inProgress,
        completionRate,
        color: BRANCH_PALETTE[idx % BRANCH_PALETTE.length],
        value: data.count,
      };
    });

    return entries.sort((a, b) => b.count - a.count);
  }, [dossiers, totalDossiers]);

  // 2. Data for Status Pie Chart
  const statusCounts: Record<string, number> = {};
  dossiers.forEach(d => {
    const config = getStatusConfig(d.status);
    const label = config?.label || d.status;
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  });

  const COLOR_MAP: Record<string, string> = {
    'Mới giao': '#3b82f6',
    'Khách hàng hủy': '#f43f5e',
    'Đã hẹn lịch khảo sát': '#0284c7',
    'Đã khảo sát': '#06b6d4',
    'Khách hàng chưa thanh toán': '#f97316',
    'Khách hàng đã thanh toán': '#14b8a6',
    'Đã lên báo cáo chờ duyệt': '#f59e0b',
    'Từ chối duyệt báo cáo': '#e11d48',
    'Đã duyệt báo cáo': '#6366f1',
    'Đã gửi báo cáo cho chi nhánh': '#a855f7',
    'Đã gửi hồ sơ bản cứng cho chi nhánh': '#10b981'
  };

  const statusPieData = Object.entries(statusCounts).map(([label, count]) => ({
    name: label,
    value: count,
    color: COLOR_MAP[label] || '#a855f7'
  }));

  // 3. Data for Asset Category Bar Chart (Value in Billion VND)
  const categoryValues: Record<string, { count: number; totalValue: number }> = {};
  dossiers.forEach(d => {
    const catLabel = ASSET_CATEGORY_CONFIG[d.assetCategory]?.label || d.assetCategory;
    if (!categoryValues[catLabel]) {
      categoryValues[catLabel] = { count: 0, totalValue: 0 };
    }
    categoryValues[catLabel].count += 1;
    categoryValues[catLabel].totalValue += (d.approvedValue || d.estimatedValue || 0);
  });

  const barData = Object.entries(categoryValues).map(([catName, data]) => ({
    name: catName,
    "Giá trị (Tỷ VNĐ)": Number((data.totalValue / 1_000_000_000).toFixed(2)),
    "Số hồ sơ": data.count
  }));

  // 4. Appraiser Performance Leaderboard
  const appraiserStats: Record<string, { count: number; completed: number; totalFee: number; totalValue: number }> = {};
  dossiers.forEach(d => {
    const name = d.assignedAppraiser || 'Chưa phân công';
    if (!appraiserStats[name]) {
      appraiserStats[name] = { count: 0, completed: 0, totalFee: 0, totalValue: 0 };
    }
    appraiserStats[name].count += 1;
    if (
      d.status === 'DA_DUYET_BAO_CAO' ||
      d.status === 'DA_GUI_BAO_CAO_CHO_CHI_NHANH' ||
      d.status === 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH'
    ) {
      appraiserStats[name].completed += 1;
    }
    appraiserStats[name].totalFee += (d.serviceFee || 0);
    appraiserStats[name].totalValue += (d.approvedValue || d.estimatedValue || 0);
  });

  const appraiserLeaderboard = Object.entries(appraiserStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalFee - a.totalFee);

  // Custom Tooltip for Branch Pie Chart
  const CustomBranchTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-2 min-w-[200px]">
          <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-800">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <p className="font-bold text-sm text-white truncate">{item.name}</p>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between items-center">
              <span>Khối lượng hồ sơ:</span>
              <span className="font-bold text-amber-400">{item.count} hồ sơ ({item.countPercent}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Đang xử lý:</span>
              <span className="font-semibold text-blue-400">{item.inProgress} hồ sơ</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Đã hoàn thành:</span>
              <span className="font-semibold text-emerald-400">{item.completed} hồ sơ ({item.completionRate}%)</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Summary Cards (Operational Metrics without financial totals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng Hồ Sơ</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{dossiers.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đang Xử Lý</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{inProgressCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đã Hoàn Thành</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Mạng Lưới Chi Nhánh</p>
            <p className="text-xl font-black text-purple-700 mt-0.5">{branchList.length} Chi nhánh</p>
          </div>
        </div>
      </div>

      {/* Row 1: Dual Pie Charts (Branch Workload Distribution & Status Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Branch Workload Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center space-x-1.5">
                    <span>Phân Bổ Hồ Sơ Theo Chi Nhánh</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Giám sát khối lượng công việc theo từng đơn vị</p>
                </div>
              </div>

              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {dossiers.length} hồ sơ
              </span>
            </div>

            {/* Donut Chart Container */}
            <div className="relative h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchList}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {branchList.map((entry, index) => (
                      <Cell 
                        key={`branch-pie-cell-${index}`} 
                        fill={entry.color} 
                        stroke="#ffffff" 
                        strokeWidth={2} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomBranchTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40} 
                    iconType="circle"
                    formatter={(val: any) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut Badge */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tổng Hồ Sơ
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {dossiers.length}
                </span>
                <span className="text-[10px] text-blue-600 font-bold mt-0.5">
                  {branchList.length} Chi nhánh
                </span>
              </div>
            </div>
          </div>

          {/* Quick Summary Chips for Top Branches */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            {branchList.slice(0, 4).map((b, idx) => (
              <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center justify-center space-x-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="text-[11px] font-bold text-slate-700 truncate max-w-[90px]" title={b.name}>
                    {b.name}
                  </span>
                </div>
                <p className="font-extrabold text-slate-900 text-xs">
                  {b.count} HS <span className="text-slate-400 font-normal">({b.countPercent}%)</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <PieIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Trạng Thái Hồ Sơ Định Giá</h3>
                  <p className="text-[11px] text-slate-500">Phân loại theo quy trình xử lý</p>
                </div>
              </div>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                {dossiers.length} hồ sơ
              </span>
            </div>

            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} hồ sơ`, 'Số lượng']}
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40} 
                    iconType="circle"
                    formatter={(val: any) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-500">
            Theo dõi tiến trình từ Mới giao, Khảo sát, Trình duyệt đến Hoàn thành
          </div>
        </div>

      </div>

      {/* Row 2: Asset Category Bar Chart & Detailed Branch Workload Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Value by Asset Category Bar Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Giá Trị Theo Loại Tài Sản</h3>
                <p className="text-[11px] text-slate-500">Phân bố giá trị thẩm định theo danh mục tài sản</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">Đơn vị: Tỷ VNĐ</span>
          </div>

          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val: any, name: any) => [
                    name === 'Giá trị (Tỷ VNĐ)' ? `${val} Tỷ ₫` : `${val} hồ sơ`, 
                    name
                  ]}
                  contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '13px' }}
                />
                <Bar dataKey="Giá trị (Tỷ VNĐ)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Branch Workload Monitor (1 column) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Khối Lượng Chi Nhánh</h3>
                  <p className="text-[11px] text-slate-500">Tiến độ & Tải công việc</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{branchList.length} đơn vị</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[290px] pr-1">
              {branchList.map((branchItem) => (
                <div key={branchItem.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/60 transition">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
                    <span className="flex items-center space-x-1.5 truncate max-w-[170px]" title={branchItem.name}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: branchItem.color }} />
                      <span className="truncate">{branchItem.name}</span>
                    </span>
                    <span className="font-mono text-slate-900 font-bold shrink-0">
                      {branchItem.count} HS <span className="text-blue-600">({branchItem.countPercent}%)</span>
                    </span>
                  </div>

                  {/* Progress Bar of Completion */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1.5">
                    <div 
                      className="h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${branchItem.countPercent}%`,
                        backgroundColor: branchItem.color
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                    <span className="text-blue-600 font-medium">Đang xử lý: {branchItem.inProgress}</span>
                    <span className="text-emerald-700 font-semibold">Đã xong: {branchItem.completed} ({branchItem.completionRate}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Dữ liệu đồng bộ trực tiếp từ danh mục hồ sơ
          </div>
        </div>

      </div>

      {/* Row 3: Appraisers Performance Leaderboard */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Hiệu Suất Chuyên Viên Thẩm Định Giá</h3>
              <p className="text-[11px] text-slate-500">Đánh giá theo năng suất hồ sơ, giá trị định giá và doanh thu phí</p>
            </div>
          </div>
          <span className="text-xs text-slate-500">Xếp hạng theo Doanh thu phí</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Chuyên viên</th>
                <th className="py-2.5 px-3 text-center">Tổng HS</th>
                <th className="py-2.5 px-3 text-center">Hoàn thành</th>
                <th className="py-2.5 px-3 text-right">Tổng giá trị định giá</th>
                <th className="py-2.5 px-3 text-right">Doanh thu phí dịch vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appraiserLeaderboard.map((app, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-800 flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      idx === 1 ? 'bg-slate-200 text-slate-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span>{app.name}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-slate-700">{app.count}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      {app.completed} / {app.count}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">{formatVNDCompact(app.totalValue)}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700">{formatVND(app.totalFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
