import { DossierStatus, AssetCategory, ValuationPurpose, PaymentStatus, DossierPriority } from '../types/dossier';

/**
 * Clean up Vietnamese text formatting, removing extra spaces and normalizing Unicode NFC.
 * Crucial: Re-attaches detached tone marks (dấu huyền, dấu sắc, hỏi, ngã, nặng) that
 * often become detached from vowels during OCR, PDF, or Excel imports.
 */
export function cleanVietnameseText(str?: string): string {
  if (!str) return '';
  let s = String(str);

  // 1. First Unicode NFC normalize to ensure precomposed vowels where possible
  s = s.normalize('NFC');

  // 2. Convert standalone acute/grave/accent modifier symbols (often output by OCR/PDF fonts)
  s = s.replace(/[\u00b4\u02ca]/g, '\u0301'); // acute (dấu sắc)
  s = s.replace(/[\u0060\u02cb]/g, '\u0300'); // grave (dấu huyền)

  // 3. Re-attach detached combining tone marks if space was accidentally inserted before mark:
  // e.g. "Viê ́ t" -> "Viết", "Huyê ̀ n" -> "Huyền", "đâ ́ t" -> "đất", "quyê ̀ n" -> "quyền"
  s = s.replace(/([a-zA-Z\u00C0-\u1EF9])\s*([\u0300-\u036f]+)/gu, '$1$2');

  // Re-compose to NFC after combining mark attachment
  s = s.normalize('NFC');

  // 4. Remove any remaining orphaned floating combining tone marks
  s = s.replace(/[\u0300-\u036f\u02ca\u02cb\u00b4\u0060]+/g, '');

  // 5. Fix split syllables with detached consonants common in legacy Word/OCR documents:
  // e.g. "Đă c" -> "Đặc", "điê m" -> "điểm", "hiê n" -> "hiện", "tra ng" -> "trạng", "tri nh" -> "trình", "dư ng" -> "dựng"
  s = s.replace(/Đă\s+c/g, 'Đặc').replace(/đă\s+c/g, 'đặc');
  s = s.replace(/điê\s+m/g, 'điểm').replace(/Điê\s+m/g, 'Điểm');
  s = s.replace(/hiê\s+n/g, 'hiện').replace(/Hiê\s+n/g, 'Hiện');
  s = s.replace(/tra\s+ng/g, 'trạng').replace(/Tra\s+ng/g, 'Trạng');
  s = s.replace(/tri\s+nh/g, 'trình').replace(/Tri\s+nh/g, 'Trình');
  s = s.replace(/dư\s+ng/g, 'dựng').replace(/Dư\s+ng/g, 'Dựng');
  s = s.replace(/quyê\s+n/g, 'quyền').replace(/Quyê\s+n/g, 'Quyền');
  s = s.replace(/tiê\s+n/g, 'tiền').replace(/Tiê\s+n/g, 'Tiền');
  s = s.replace(/pha\s+p/g, 'pháp').replace(/Pha\s+p/g, 'Pháp');
  s = s.replace(/kha\s+ch/g, 'khách').replace(/Kha\s+ch/g, 'Khách');
  s = s.replace(/ha\s+ng/g, 'hàng').replace(/Ha\s+ng/g, 'Hàng');
  s = s.replace(/nha\s+nh/g, 'nhánh').replace(/Nha\s+nh/g, 'Nhánh');
  s = s.replace(/tha\s+ng/g, 'tháng').replace(/Tha\s+ng/g, 'Tháng');
  s = s.replace(/đa\s+t/g, 'đất').replace(/Đa\s+t/g, 'Đất');
  s = s.replace(/xuâ\s+t/g, 'xuất').replace(/Xuâ\s+t/g, 'Xuất');
  s = s.replace(/thư\s+c/g, 'thực').replace(/Thư\s+c/g, 'Thực');
  s = s.replace(/viê\s+c/g, 'việc').replace(/Viê\s+c/g, 'Việc');
  s = s.replace(/chu\s+c/g, 'chức').replace(/Chu\s+c/g, 'Chức');
  s = s.replace(/mư\s+c/g, 'mức').replace(/Mư\s+c/g, 'Mức');
  s = s.replace(/luâ\s+t/g, 'luật').replace(/Luâ\s+t/g, 'Luật');
  s = s.replace(/quyê\s+t/g, 'quyết').replace(/Quyê\s+t/g, 'Quyết');
  s = s.replace(/chuâ\s+n/g, 'chuẩn').replace(/Chuâ\s+n/g, 'Chuẩn');
  // Only fix split "chi nh" -> "chính" if NOT followed by another letter (prevents corrupting "Chi nhánh" into "Chínhánh")
  s = s.replace(/(?<!\p{L})chi\s+nh(?!\p{L})/gu, 'chính');
  s = s.replace(/(?<!\p{L})Chi\s+nh(?!\p{L})/gu, 'Chính');
  s = s.replace(/(?<!\p{L})CHI\s+NH(?!\p{L})/gu, 'CHÍNH');

  // Fix any accidental "Chínhánh" / "chínhánh" -> "Chi nhánh" / "chi nhánh"
  s = s.replace(/Chính\s*ánh/g, 'Chi nhánh');
  s = s.replace(/chính\s*ánh/g, 'chi nhánh');
  s = s.replace(/CHÍNH\s*ÁNH/g, 'CHI NHÁNH');

  // 6. Fix common OCR, Cadastral, and template typos for grave (huyền) and acute (sắc) marks
  s = s.replace(/quyển\s+sở\s+hữu/gi, 'quyền sở hữu');
  s = s.replace(/quyển\s+sỡ\s+hữu/gi, 'quyền sở hữu');
  s = s.replace(/quyền\s+sỡ\s+hữu/gi, 'quyền sở hữu');
  s = s.replace(/quyền\s+sở\s+hữà/gi, 'quyền sở hữu');
  s = s.replace(/sỡ\s+hữu/gi, 'sở hữu');
  s = s.replace(/an\s+nình/gi, 'an ninh');
  s = s.replace(/huyện\s+Thang\s+Trì/gi, 'huyện Thanh Trì');
  s = s.replace(/Thang\s+Trì/gi, 'Thanh Trì');
  s = s.replace(/khách\s+hàng\s+yêầu/gi, 'khách hàng yêu cầu');
  s = s.replace(/Sau\s+khi\s+trình\s+thu\s+thập/gi, 'Sau khi quá trình thu thập');
  s = s.replace(/thông\s+báo\s+tới\s+để\s+Quý\s+Khách\s+hàng/gi, 'thông báo tới Quý Khách hàng');
  s = s.replace(/Toạ\s+[Đđ]ộ/gi, 'Tọa độ');
  s = s.replace(/toạ\s+độ/gi, 'tọa độ');
  s = s.replace(/CAN\s+HỘ/g, 'CĂN HỘ');
  s = s.replace(/can\s+hộ/gi, 'căn hộ');
  s = s.replace(/Trọng\s+tượng/gi, 'Trọng lượng');
  s = s.replace(/GIA\s+TRỊ/g, 'GIÁ TRỊ');
  s = s.replace(/THÔN\s+SỐ\s+KÝ\s+THUẬT/gi, 'THÔNG SỐ KỸ THUẬT');
  s = s.replace(/Ngân\s+hàng\s+TMCP\s+Bắc\s+A\b/g, 'Ngân hàng TMCP Bắc Á');
  s = s.replace(/Hà\s+Nôi\b/g, 'Hà Nội');
  s = s.replace(/Thửa\s+đất\s+số\s*:\s*Thửa\s+đất\s+số\s*/gi, 'Thửa đất số: ');
  s = s.replace(/GCN\s+Thửa\s+Thửa\s*/gi, 'GCN Thửa ');
  s = s.replace(/\bThửa\s+Thửa\b/gi, 'Thửa');
  s = s.replace(/\(GCN\s*số\s*:\s*GCN\s*/gi, '(GCN số: ');
  s = s.replace(/GCN\s+số\s*:\s*GCN\s*/gi, 'GCN số: ');
  s = s.replace(/,\s*,+/g, ',');
  s = s.replace(/[ \t]{2,}/g, ' ');

  return s.trim();
}

/**
 * Format Chi nhánh name cleanly, preventing "CN Chi nhánh ..." duplicates
 */
export function formatBranchName(str?: string): string {
  if (!str) return 'Hà Nội';
  let s = cleanVietnameseText(str);
  s = s.replace(/Chính\s*ánh/gi, 'Chi nhánh');
  s = s.replace(/^Ngân\s+hàng\s+TMCP\s+Bắc\s+Á\s*[-–—:]*\s*/i, '');
  s = s.replace(/^(?:Chi\s+nhánh|CN)\s*[-–—:]*\s*/i, '');
  return s.trim() || 'Hà Nội';
}

/**
 * Intelligently parse land plot number and map sheet number from potentially merged strings
 */
export function extractPlotAndMap(landPlot?: string, mapSheet?: string): { plot: string; sheet: string } {
  let plot = cleanVietnameseText(landPlot);
  let sheet = cleanVietnameseText(mapSheet);

  const combined = `${plot} ${sheet}`;

  const plotMatch = combined.match(/(?:thửa\s*đất\s*số|thửa\s*số|thửa)\s*[:.]?\s*(\d+[a-zA-Z]?)/i);
  if (plotMatch) {
    plot = plotMatch[1];
  } else if (plot.toLowerCase().startsWith('thửa đất số:')) {
    plot = plot.replace(/thửa\s*đất\s*số\s*:\s*/i, '').trim();
  }

  const mapMatch = combined.match(/(?:tờ\s*bản\s*đồ\s*số|tờ\s*bản\s*đồ|tbđ|bản\s*đồ\s*số)\s*[:.]?\s*(\d+[a-zA-Z]?)/i);
  if (mapMatch) {
    sheet = mapMatch[1];
  } else if (sheet.length > 25 || sheet.toLowerCase().includes('giấy chứng nhận') || sheet.toLowerCase().includes('quyền sử dụng')) {
    sheet = '---';
  }

  return { 
    plot: plot || '---', 
    sheet: sheet || '---' 
  };
}

/**
 * Format currency number with dots as thousands separator (e.g. 2.978.000.000)
 */
export function formatCurrencyNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return Math.round(amount).toLocaleString('vi-VN');
}

/**
 * Format date string or Excel serial number (e.g. 46225) into standard Vietnamese DD/MM/YYYY
 */
export function formatExcelDate(val: any): string {
  if (val == null || val === '') return '';
  const num = Number(val);
  if (!isNaN(num) && num > 10000 && num < 90000) {
    // Excel serial date (e.g. 46225 -> 22/07/2026)
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    }
  }
  const str = String(val).trim();
  // If ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[3].padStart(2, '0')}/${isoMatch[2].padStart(2, '0')}/${isoMatch[1]}`;
  }
  return cleanVietnameseText(str);
}

/**
 * Parse Vietnamese currency / number with dots as thousands separators.
 * e.g. "2.978.000.000" -> 2978000000, "500.000" -> 500000
 */
export function parseVietnameseNumber(val: any): number {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).trim();

  // If format is like '2.978.000.000' or '2.978.000.000,50'
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, '');
  } else {
    // Generic check: count dots
    const dots = (s.match(/\./g) || []).length;
    if (dots > 1) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (dots === 1 && s.includes(',')) {
      s = s.replace('.', '').replace(',', '.');
    } else if (dots === 1) {
      const parts = s.split('.');
      if (parts[1].length === 3 && parts[0].length >= 1) {
        // e.g. 500.000 -> 500000
        s = parts.join('');
      }
    }
  }
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

// Format Vietnamese Currency (e.g. 5.800.000.000 ₫)
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

// Compact currency (e.g., 5.8 tỷ, 450 triệu)
export function formatVNDCompact(amount: number): string {
  if (!amount || isNaN(amount)) return '0 ₫';
  if (amount >= 1_000_000_000) {
    const bill = amount / 1_000_000_000;
    return `${bill % 1 === 0 ? bill.toFixed(0) : bill.toFixed(2)} Tỷ`;
  }
  if (amount >= 1_000_000) {
    const mill = amount / 1_000_000;
    return `${mill % 1 === 0 ? mill.toFixed(0) : mill.toFixed(1)} Tr`;
  }
  return formatVND(amount);
}

// Date formatter DD/MM/YYYY
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '--/--/----';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

export interface SLAInfo {
  status: 'OVERDUE' | 'DUE_24H' | 'DUE_SOON' | 'ON_TIME' | 'DONE';
  text: string;
  subText?: string;
  days: number;
  hoursRemaining?: number;
  isOverdue: boolean;
  isDueWithin24h: boolean;
  color: string;           // Badge classes
  rowBgClass: string;      // Table row bg tint
  rowBorderClass: string;  // Table row left border
  cardClass: string;       // Kanban card outline & background
  badgeText: string;       // Short badge e.g. "QUÁ HẠN" / "GẤP < 24H"
  bannerText: string;      // Banner text e.g. "Cảnh báo quá hạn SLA"
}

// Calculate days remaining, overdue, or approaching within 24 hours
export function getSLADaysInfo(dueDateStr?: string, status?: string): SLAInfo {
  const norm = normalizeDossierStatus(status || '');
  const isDone = norm === 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH' || norm === 'KHACH_HANG_HUY';

  if (isDone) {
    return { 
      status: 'DONE', 
      text: 'Đã đóng', 
      subText: 'Hồ sơ đã hoàn tất/đóng',
      days: 0, 
      isOverdue: false,
      isDueWithin24h: false,
      color: 'text-slate-500 bg-slate-100 border-slate-200',
      rowBgClass: '',
      rowBorderClass: '',
      cardClass: '',
      badgeText: 'Đã đóng',
      bannerText: ''
    };
  }
  
  if (!dueDateStr) {
    return {
      status: 'ON_TIME',
      text: 'Chưa đặt hạn',
      subText: 'Chưa cập nhật ngày hẹn',
      days: 99,
      isOverdue: false,
      isDueWithin24h: false,
      color: 'text-slate-500 bg-slate-100 border-slate-200',
      rowBgClass: '',
      rowBorderClass: '',
      cardClass: '',
      badgeText: '',
      bannerText: ''
    };
  }

  // Parse due date robustly (DD/MM/YYYY or YYYY-MM-DD or ISO timestamp)
  let due: Date | null = null;
  const trimmed = dueDateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    // End of that date
    due = new Date(y, m - 1, d, 23, 59, 59, 999);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    due = new Date(y, m - 1, d, 23, 59, 59, 999);
  } else {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      due = parsed;
    }
  }

  if (!due || isNaN(due.getTime())) {
    return {
      status: 'ON_TIME',
      text: dueDateStr,
      subText: '',
      days: 99,
      isOverdue: false,
      isDueWithin24h: false,
      color: 'text-slate-500 bg-slate-100 border-slate-200',
      rowBgClass: '',
      rowBorderClass: '',
      cardClass: '',
      badgeText: '',
      bannerText: ''
    };
  }

  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 1. OVERDUE: Due date has passed
  if (diffMs < 0) {
    const absDays = Math.max(1, Math.abs(diffDays));
    return { 
      status: 'OVERDUE', 
      text: `Quá hạn ${absDays} ngày`, 
      subText: `${Math.abs(diffHours)} giờ trước`,
      days: diffDays, 
      hoursRemaining: diffHours,
      isOverdue: true,
      isDueWithin24h: false,
      color: 'text-rose-700 bg-rose-100/90 border-rose-300 font-bold',
      rowBgClass: 'bg-rose-50/80 hover:bg-rose-100/70',
      rowBorderClass: 'border-l-4 border-l-rose-600',
      cardClass: 'ring-2 ring-rose-500 bg-rose-50/40 border-l-4 border-l-rose-600 shadow-sm shadow-rose-200/50',
      badgeText: '🔴 QUÁ HẠN SLA',
      bannerText: `CẢNH BÁO QUÁ HẠN (${absDays} ngày)`
    };
  } 
  
  // 2. DUE WITHIN 24 HOURS: Approaching within 24h
  if (diffMs <= 24 * 60 * 60 * 1000) {
    const hoursLeft = Math.max(1, diffHours);
    const displayText = hoursLeft <= 1 ? 'Hạn chót < 1 giờ!' : `Hạn chót còn ${hoursLeft}h`;
    return { 
      status: 'DUE_24H', 
      text: displayText, 
      subText: 'Đến hạn trong vòng 24h',
      days: diffDays, 
      hoursRemaining: hoursLeft,
      isOverdue: false,
      isDueWithin24h: true,
      color: 'text-amber-900 bg-amber-100/90 border-amber-400 font-bold',
      rowBgClass: 'bg-amber-50/80 hover:bg-amber-100/70',
      rowBorderClass: 'border-l-4 border-l-amber-500',
      cardClass: 'ring-2 ring-amber-400 bg-amber-50/40 border-l-4 border-l-amber-500 shadow-sm shadow-amber-200/50',
      badgeText: '⚡ HẠN CHÓT < 24H',
      bannerText: `SẮP ĐẾN HẠN (< ${hoursLeft}h)`
    };
  } 
  
  // 3. DUE SOON: Within 48 hours
  if (diffDays <= 2) {
    return { 
      status: 'DUE_SOON', 
      text: `Còn ${diffDays} ngày`, 
      subText: 'Sắp đến hạn',
      days: diffDays, 
      hoursRemaining: diffHours,
      isOverdue: false,
      isDueWithin24h: false,
      color: 'text-amber-700 bg-amber-50 border-amber-200 font-medium',
      rowBgClass: '',
      rowBorderClass: '',
      cardClass: '',
      badgeText: 'Sắp đến hạn',
      bannerText: ''
    };
  } 
  
  // 4. ON TIME
  return { 
    status: 'ON_TIME', 
    text: `Còn ${diffDays} ngày`, 
    subText: 'Đúng tiến độ',
    days: diffDays, 
    hoursRemaining: diffHours,
    isOverdue: false,
    isDueWithin24h: false,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-medium',
    rowBgClass: '',
    rowBorderClass: '',
    cardClass: '',
    badgeText: 'Đúng tiến độ',
    bannerText: ''
  };
}

// Labels dictionary
export const STATUS_CONFIG: Record<DossierStatus, { label: string; color: string; badge: string; border: string }> = {
  MOI_GIAO: {
    label: 'Mới giao',
    color: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-l-4 border-l-blue-500'
  },
  KHACH_HANG_HUY: {
    label: 'Khách hàng hủy',
    color: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-l-4 border-l-rose-500'
  },
  DA_HEN_LICH_KHAO_SAT: {
    label: 'Đã hẹn lịch khảo sát',
    color: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    border: 'border-l-4 border-l-sky-500'
  },
  DA_KHAO_SAT: {
    label: 'Đã khảo sát',
    color: 'bg-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    border: 'border-l-4 border-l-cyan-500'
  },
  KHACH_HANG_CHUA_THANH_TOAN: {
    label: 'Khách hàng chưa thanh toán',
    color: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    border: 'border-l-4 border-l-orange-500'
  },
  KHACH_HANG_DA_THANH_TOAN: {
    label: 'Khách hàng đã thanh toán',
    color: 'bg-teal-500',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    border: 'border-l-4 border-l-teal-500'
  },
  DA_LEN_BAO_CAO_CHO_DUYET: {
    label: 'Đã lên báo cáo chờ duyệt',
    color: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-l-4 border-l-amber-500'
  },
  DA_DUYET_BAO_CAO: {
    label: 'Đã duyệt báo cáo',
    color: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    border: 'border-l-4 border-l-indigo-500'
  },
  DA_GUI_BAO_CAO_CHO_CHI_NHANH: {
    label: 'Đã gửi báo cáo cho chi nhánh',
    color: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    border: 'border-l-4 border-l-purple-500'
  },
  DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH: {
    label: 'Đã gửi hồ sơ bản cứng cho chi nhánh',
    color: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-l-4 border-l-emerald-500'
  },
  TU_CHOI_BAO_CAO: {
    label: 'Từ chối duyệt báo cáo',
    color: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-l-4 border-l-rose-500'
  }
};

export function normalizeDossierStatus(statusStr?: string): DossierStatus {
  if (statusStr && statusStr in STATUS_CONFIG) {
    return statusStr as DossierStatus;
  }
  const clean = (statusStr || '').trim();
  if (clean === 'DA_LEN_LICH_KHAO_SAT') return 'DA_HEN_LICH_KHAO_SAT';
  if (clean === 'DA_XUAT_BAO_CAO_CHO_DUYET' || clean === 'THAM_DINH' || clean === 'CHO_DUYET') return 'DA_LEN_BAO_CAO_CHO_DUYET';
  if (clean === 'DA_GUI_BAO_CAO') return 'DA_GUI_BAO_CAO_CHO_CHI_NHANH';
  if (clean === 'DA_GUI_HO_SO_BAN_CUNG' || clean === 'HOAN_THANH') return 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH';
  if (clean === 'TIEP_NHAN') return 'MOI_GIAO';
  if (clean === 'KHAO_SAT') return 'DA_KHAO_SAT';
  if (clean === 'TU_CHOI_BAO_CAO' || clean === 'TU_CHOI_DUYET') return 'TU_CHOI_BAO_CAO';
  if (clean === 'TU_CHOI') return 'KHACH_HANG_HUY';
  return 'MOI_GIAO';
}

export function getStatusConfig(statusStr?: string) {
  const norm = normalizeDossierStatus(statusStr);
  return STATUS_CONFIG[norm] || STATUS_CONFIG.MOI_GIAO;
}

export const ASSET_CATEGORY_CONFIG: Record<AssetCategory, { label: string; icon: string }> = {
  DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT: { label: 'Đất và tài sản gắn liền với đất', icon: 'Building2' },
  CAN_HO_CHUNG_CU: { label: 'Căn hộ chung cư / Căn hộ tập thể', icon: 'Building' },
  PHUONG_TIEN_VAN_TAI: { label: 'Phương tiện vận tải', icon: 'Car' },
  MAY_MOC_THIET_BI: { label: 'Máy móc thiết bị', icon: 'Cog' }
};

export const PURPOSE_CONFIG: Record<ValuationPurpose, string> = {
  VAY_VON_NGAN_HANG: 'Vay thế chấp ngân hàng',
  MUA_BAN_SAP_NHAP: 'Mua bán & Sáp nhập (M&A)',
  BAO_CAO_TAI_CHINH: 'Báo cáo tài chính & Kiểm toán',
  THI_HANH_AN: 'Tòa án & Thi hành án',
  KHAC: 'Mục đích khác'
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; badge: string }> = {
  CHUA_THANH_TOAN: { label: 'Chưa thanh toán', badge: 'bg-rose-100 text-rose-800' },
  DA_TAM_UNG: { label: 'Đã tạm ứng', badge: 'bg-amber-100 text-amber-800' },
  DA_THANH_TOAN: { label: 'Đã thanh toán đủ', badge: 'bg-emerald-100 text-emerald-800' }
};

export const PRIORITY_CONFIG: Record<DossierPriority, { label: string; badge: string }> = {
  LOW: { label: 'Thấp', badge: 'bg-gray-100 text-gray-700' },
  NORMAL: { label: 'Bình thường', badge: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'Cao', badge: 'bg-amber-100 text-amber-800 font-medium' },
  URGENT: { label: 'Gấp!', badge: 'bg-red-100 text-red-800 font-bold border border-red-300' }
};

// Converts number to Vietnamese currency words for Official Valuation Certificates
export function numberToVietnameseWords(num: number): string {
  if (num === 0 || !num || isNaN(num)) return 'Không đồng';
  const n = Math.round(Math.abs(num));
  if (n === 0) return 'Không đồng';

  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(group: number, hasHigherGroup: boolean): string {
    const h = Math.floor(group / 100);
    const t = Math.floor((group % 100) / 10);
    const u = group % 10;
    let s = '';

    if (h > 0 || hasHigherGroup) {
      s += digits[h] + ' trăm ';
    }

    if (t > 1) {
      s += digits[t] + ' mươi ';
      if (u === 1) s += 'mốt';
      else if (u === 4) s += 'tư';
      else if (u === 5) s += 'lăm';
      else if (u > 0) s += digits[u];
    } else if (t === 1) {
      s += 'mười ';
      if (u === 5) s += 'lăm';
      else if (u > 0) s += digits[u];
    } else if (t === 0 && u > 0) {
      if (h > 0 || hasHigherGroup) s += 'lẻ ';
      s += digits[u];
    }

    return s.trim();
  }

  const groups: number[] = [];
  let temp = n;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const hasHigher = i < groups.length - 1 && groups.slice(i + 1).some(v => v > 0);
    const gText = readGroup(g, hasHigher);
    
    let unit = '';
    if (i > 0) {
      const uIdx = i % 3;
      const billions = Math.floor(i / 3);
      if (uIdx === 0) {
        unit = 'tỷ '.repeat(billions).trim();
      } else if (uIdx === 1) {
        unit = 'nghìn' + (billions > 0 ? ' ' + 'tỷ '.repeat(billions).trim() : '');
      } else if (uIdx === 2) {
        unit = 'triệu' + (billions > 0 ? ' ' + 'tỷ '.repeat(billions).trim() : '');
      }
    }
    words.push(gText + (unit ? ' ' + unit : ''));
  }

  let res = words.join(' ').replace(/\s+/g, ' ').trim() + ' đồng';
  return res.charAt(0).toUpperCase() + res.slice(1);
}


export function isDossierLocked(status?: string): boolean {
  const norm = normalizeDossierStatus(status);
  return norm === 'DA_DUYET_BAO_CAO' || norm === 'DA_GUI_BAO_CAO_CHO_CHI_NHANH' || norm === 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH';
}
