import * as XLSX from 'xlsx';
import { ValuationDossier, DossierStatus, AssetCategory, ValuationPurpose, PaymentStatus, DynamicImportField } from '../types/dossier';
import { 
  STATUS_CONFIG, 
  ASSET_CATEGORY_CONFIG, 
  PURPOSE_CONFIG, 
  PAYMENT_STATUS_CONFIG, 
  formatDate,
  cleanVietnameseText,
  formatExcelDate,
  parseVietnameseNumber,
  extractPlotAndMap
} from './formatters';

// Convert Google Sheets URL to exportable CSV URL
export function convertGoogleSheetsUrlToCsv(url: string): string | null {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const spreadsheetId = match[1];
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    }
  } catch (e) {
    console.error('Error parsing Google Sheets URL:', e);
  }
  return null;
}

// Map Vietnamese status names to DossierStatus
function parseStatus(statusStr?: string): DossierStatus {
  if (!statusStr) return 'MOI_GIAO';
  const clean = statusStr.trim().toLowerCase();
  if (clean.includes('hủy') || clean.includes('tu choi')) return 'KHACH_HANG_HUY';
  if (clean.includes('bản cứng') || clean.includes('hồ sơ bản cứng')) return 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH';
  if (clean.includes('gửi báo cáo')) return 'DA_GUI_BAO_CAO_CHO_CHI_NHANH';
  if (clean.includes('duyệt báo cáo') || clean.includes('đã duyệt')) return 'DA_DUYET_BAO_CAO';
  if (clean.includes('lên báo cáo') || clean.includes('xuất báo cáo') || clean.includes('chờ duyệt')) return 'DA_LEN_BAO_CAO_CHO_DUYET';
  if (clean.includes('đã thanh toán') && !clean.includes('chưa')) return 'KHACH_HANG_DA_THANH_TOAN';
  if (clean.includes('chưa thanh toán')) return 'KHACH_HANG_CHUA_THANH_TOAN';
  if (clean.includes('đã khảo sát')) return 'DA_KHAO_SAT';
  if (clean.includes('hẹn lịch') || clean.includes('lên lịch')) return 'DA_HEN_LICH_KHAO_SAT';
  if (clean.includes('mới giao') || clean.includes('tiếp nhận') || clean.includes('mới')) return 'MOI_GIAO';
  return 'MOI_GIAO';
}

// Map Vietnamese asset category names to AssetCategory
function parseCategory(catStr?: string): AssetCategory {
  if (!catStr) return 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT';
  const clean = catStr.trim().toLowerCase();
  if (clean.includes('chung cư') || clean.includes('tập thể') || clean.includes('căn hộ')) return 'CAN_HO_CHUNG_CU';
  if (clean.includes('xe') || clean.includes('phương tiện') || clean.includes('ô tô') || clean.includes('vận tải')) return 'PHUONG_TIEN_VAN_TAI';
  if (clean.includes('máy móc') || clean.includes('thiết bị') || clean.includes('dây chuyền')) return 'MAY_MOC_THIET_BI';
  return 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT';
}

// Export dossiers to Excel file supporting dynamic imported columns (N columns in => N columns out)
export function exportDossiersToExcel(dossiers: ValuationDossier[], filename = 'Bao_Cao_Tham_Dinh_Gia_Full.xlsx') {
  // If dossiers have dynamic imported columns, export with exactly those columns!
  if (dossiers.length > 0 && dossiers[0].importedColumnsData && dossiers[0].importedColumnsData.length > 0) {
    const sampleCols = dossiers[0].importedColumnsData;
    const row0 = sampleCols.map(f => f.row1 || f.categoryGroup || '');
    const row1 = sampleCols.map(f => f.row2 || f.headerName || '');
    const row2 = sampleCols.map(f => f.row3 || '');

    const dataRows = dossiers.map(item => {
      if (item.importedColumnsData && item.importedColumnsData.length === sampleCols.length) {
        return item.importedColumnsData.map(f => f.value ?? '');
      }
      return sampleCols.map(f => item.customFields?.[f.headerName] ?? item.customFields?.[`col_${f.colIndex + 1}`] ?? '');
    });

    const worksheet = XLSX.utils.aoa_to_sheet([row0, row1, row2, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo Thẩm Định Giá');
    XLSX.writeFile(workbook, filename);
    return;
  }

  // Fallback to standard 54-column template structure
  // Row 0: Section Group Headers
  const row0 = [
    'THÔNG TIN CHUNG', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'ĐỊA CHỈ THỬA ĐẤT', '', '', '', '', '',
    'THÔNG SỐ KÝ THUẬT CHI TIẾT', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'KẾT QUẢ THẨM ĐỊNH GIÁ', '', '', '', '', '',
    'ĐỊNH GIÁ ĐẤT THEO QUY HOẠCH', '', '', '',
    'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT/ THÙNG GẮN LIỀN VỚI XE Ô TÔ', '', '', '', '', '', '', ''
  ];

  // Row 1: Main Headers
  const row1 = [
    'SỐ HỒ SƠ', 'Trạng thái hồ sơ', 'ĐƠN VỊ KINH DOANH', 'KHÁCH HÀNG', 'CCCD', 'NGÀY TIẾP NHẬN', '', 'NGÀY PHÂN CÔNG', '', 'CHUYÊN VIÊN AMC', 'PHÍ TẠM ỨNG', 'NGÀY KHẢO SÁT', 'NGÀY PHÊ DUYỆT', 'CHUYÊN VIÊN ĐƠN VỊ KINH DOANH', 'TỔNG PHÍ THẨM ĐỊNH', 'LOẠI TÀI SẢN (BĐS/ĐS)',
    'THỬA ĐẤT SỐ', 'TỜ BẢN ĐỒ', 'SỐ NHÀ, CĂN HỘ', 'XÃ/THỊ TRẤN/PHƯỜNG', 'HUYỆN/THỊ XÃ/QUẬN', 'TỈNH/TP',
    'NĂM XÂY DỰNG CHUNG CƯ/NĂM SẢN XUẤT', 'SỐ TẦNG/NƠI SẢN XUẤT', 'DIỆN TÍCH THEO SỔ ĐỎ(m2)/SỐ LƯỢNG', 'DIỆN TÍCH CƠI NỚI', 'HÌNH THỨC SỬ DỤNG ĐẤT', 'THỜI HẠN SỬ DỤNG ĐẤT/ ĐỒNG HỒ KM', 'ĐƯỜNG VÀO TÀI SẢN', '', '', 'HƯỚNG/ HƯỚNG BAN CÔNG', 'HÌNH DẠNG', 'ĐỘ RỘNG MẶT TIỀN (m)', 'DÀI X RỘNG (TB)', 'ĐIỀU KIỆN KINH DOANH', 'CS HẠ TẦNG', 'CLCL ĐỐI VỚI XE Ô TÔ (%)', 'YẾU TỐ KHÁC', 'TỌA ĐỘ ĐỊNH VỊ GOOGLE MAP',
    'GIÁ NHÀ NƯỚC ĐỐI VỚI ĐẤT Ở', 'NĂM BAN HÀNH ĐƠN GIÁ NN', 'HỆ SỐ K', 'ĐƠN GIÁ ĐỀ NGHỊ', 'ĐƠN GIÁ THẨM ĐỊNH', 'GIÁ THỊ TRƯỜNG',
    'DIỆN TÍCH PHÙ HỢP QUY HOẠCH', 'GIÁ THẨM ĐỊNH PHÙ HỢP QUY HOẠCH', 'DIỆN TÍCH KHÔNG PHÙ HỢP QUY HOẠCH', 'GIÁ THẨM ĐỊNH KHÔNG PHÙ HỢP QUY HOẠCH',
    'LOẠI CÔNG TRÌNH/LOẠI THÙNG', 'DIỆN TÍCH XÂY DỰNG', 'DIỆN TÍCH SỬ DỤNG', '', 'SỐ TẦNG/NGUYÊN LIỆU GIA CÔNG', 'NĂM XÂY DỰNG/NĂM SẢN XUẤT', 'CHẤT LƯỢNG CÒN LẠI NHÀ Ở (%)', 'ĐƠN GIÁ XÂY DỰNG'
  ];

  // Row 2: Sub Headers
  const row2 = [
    '', '', '', '', '', 'Giờ', 'Ngày', 'Giờ', 'Ngày', '', '', '', '', '', '', '',
    '', '', '', '', '', '',
    '', '', '', '', '', '', 'Cấp độ đường', 'Loại đường', 'Độ rộng đường', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '',
    'm2', 'VNĐ', 'm2', 'VNĐ',
    '', '', 'Diện tích theo sổ', 'Diện tích thực tế', '', '', '', ''
  ];

  const dataRows = dossiers.map(item => [
    item.code || '',
    STATUS_CONFIG[item.status]?.label || item.status,
    item.businessUnit || '',
    item.clientName || '',
    item.clientCccd || '',
    item.receivedTime || '',
    item.receivedDate || '',
    item.assignedTime || '',
    item.assignedDate || '',
    item.amcSpecialist || item.assignedAppraiser || '',
    item.advanceFee || 0,
    item.surveyDate || '',
    item.approvalDate || '',
    item.businessUnitSpecialist || '',
    item.totalValuationFee || item.serviceFee || 0,
    ASSET_CATEGORY_CONFIG[item.assetCategory]?.label || item.assetCategory,

    item.landPlotNumber || '',
    item.mapSheetNumber || '',
    item.houseNumber || '',
    item.ward || '',
    item.district || '',
    item.province || '',

    item.constructionYear || '',
    item.floorsCount || '',
    item.areaCertificate || item.area || '',
    item.areaExpanded || 0,
    item.landUseForm || '',
    item.landUseTerm || '',
    item.roadAccessLevel || '',
    item.roadType || '',
    item.roadWidth || '',
    item.direction || '',
    item.shape || '',
    item.frontageWidth || '',
    item.dimension || '',
    item.businessCondition || '',
    item.infrastructure || '',
    item.carQuality || '',
    item.otherFactors || '',
    item.googleMapCoords || '',

    item.stateLandPrice || '',
    item.statePriceYear || '',
    item.kCoefficient || '',
    item.proposedUnitPrice || '',
    item.appraisedUnitPrice || '',
    item.marketPrice || item.approvedValue || item.estimatedValue || 0,

    item.plannedLandArea || '',
    item.plannedLandValue || '',
    item.unplannedLandArea || '',
    item.unplannedLandValue || '',

    item.constructionType || '',
    item.constructionArea || '',
    item.constructionUsableArea || '',
    item.constructionActualArea || '',
    item.buildingFloorsMaterial || '',
    item.buildingYear || '',
    item.remainingBuildingQuality || '',
    item.constructionUnitPrice || ''
  ]);

  const worksheet1 = XLSX.utils.aoa_to_sheet([row0, row1, row2, ...dataRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet1, 'ĐẶC ĐIỂM CHUNG,CHI TIẾT');

  // Sheet 2: thuthapthongtin (Thu thập thông tin so sánh thị trường)
  const sheet2Header = [
    'SỐ HỒ SƠ', 'STT TSSS', 'TÊN TÀI SẢN SO SÁNH', 'NGUỒN THÔNG TIN', 'SỐ ĐT LIÊN HỆ', 
    'NGÀY KHẢO SÁT', 'ĐỊA CHỈ', 'DIỆN TÍCH (m2)', 'VỊ TRÍ TẦNG/TÒA', 'HƯỚNG', 'PHÁP LÝ', 
    'GIÁ RAO BÁN (VNĐ)', 'ĐƠN GIÁ RAO BÁN (VNĐ/m2)', 'TỶ LỆ THƯƠNG LƯỢNG (%)', 
    'ĐƠN GIÁ GIAO DỊCH (VNĐ/m2)', 'TỶ LỆ ĐIỀU CHỈNH (%)', 'ĐƠN GIÁ CHỈ DẪN (VNĐ/m2)', 'GHI CHÚ ĐẶC ĐIỂM'
  ];
  const sheet2Rows: any[][] = [];
  dossiers.forEach(d => {
    const comps = d.marketComparables || [];
    comps.forEach((c, idx) => {
      sheet2Rows.push([
        d.code || '',
        idx + 1,
        c.name || '',
        c.source || '',
        c.contactPhone || '',
        c.surveyDate || '',
        c.address || '',
        c.area || 0,
        c.floorsOrFloorLevel || '',
        c.direction || '',
        c.legalStatus || '',
        c.askingPrice || 0,
        c.askingUnitPrice || (c.askingPrice && c.area ? Math.round(c.askingPrice / c.area) : 0),
        c.negotiationRate || 0,
        c.transactionUnitPrice || 0,
        c.adjustmentRate || 0,
        c.adjustedUnitPrice || 0,
        c.notes || ''
      ]);
    });
  });
  const worksheet2 = XLSX.utils.aoa_to_sheet([sheet2Header, ...sheet2Rows]);
  XLSX.utils.book_append_sheet(workbook, worksheet2, 'thuthapthongtin');

  // Sheet 3: Bang tinh gia dat (Bảng tính giá đất, quy hoạch & tổng giá trị)
  const sheet3Header = [
    'SỐ HỒ SƠ', 'STT', 'HẠNG MỤC TÀI SẢN / CHỈ TIÊU', 'ĐVT', 
    'SỐ LƯỢNG / DIỆN TÍCH', 'ĐƠN GIÁ THẨM ĐỊNH (VNĐ/m2)', 'THÀNH TIỀN (VNĐ)', 'GHI CHÚ / CƠ SỞ TÍNH TOÁN'
  ];
  const sheet3Rows: any[][] = [];
  dossiers.forEach(d => {
    const area = d.areaCertificate || d.area || 0;
    const unitPrice = d.appraisedUnitPrice || d.proposedUnitPrice || 0;
    const plannedArea = d.plannedLandArea || area;
    const plannedVal = d.plannedLandValue || Math.round(plannedArea * unitPrice);
    const unplannedArea = d.unplannedLandArea || 0;
    const unplannedVal = d.unplannedLandValue || 0;
    const totalVal = d.approvedValue || d.marketPrice || (plannedVal + unplannedVal);

    sheet3Rows.push([d.code || '', 'I', 'GIÁ TRỊ QUYỀN SỬ DỤNG ĐẤT / ĐẤT Ở', '', '', '', '', '']);
    sheet3Rows.push([d.code || '', '1.1', 'Diện tích đất phù hợp quy hoạch', 'm2', plannedArea, unitPrice, plannedVal, `Đơn giá theo phương pháp so sánh (K=${d.kCoefficient || 1.0})`]);
    sheet3Rows.push([d.code || '', '1.2', 'Diện tích đất không phù hợp quy hoạch', 'm2', unplannedArea, d.unplannedLandUnitPrice || 0, unplannedVal, 'Ngoài chỉ giới quy hoạch']);
    sheet3Rows.push([d.code || '', 'II', 'GIÁ TRỊ CÔNG TRÌNH XÂY DỰNG / NHÀ Ở TRÊN ĐẤT', '', '', '', '', '']);
    sheet3Rows.push([d.code || '', '2.1', 'Giá trị công trình xây dựng (CLCL)', 'VNĐ', 1, Math.round(totalVal * 0.15), Math.round(totalVal * 0.15), 'Phương pháp chi phí']);
    sheet3Rows.push([d.code || '', 'III', 'TỔNG GIÁ TRỊ THẨM ĐỊNH (LÀM TRÒN)', 'VNĐ', 1, totalVal, totalVal, 'Làm tròn theo quy định tài sản bảo đảm']);
  });
  const worksheet3 = XLSX.utils.aoa_to_sheet([sheet3Header, ...sheet3Rows]);
  XLSX.utils.book_append_sheet(workbook, worksheet3, 'Bang tinh gia dat');

  // Sheet 4: bang tinh clcl (Bảng tính chất lượng còn lại công trình)
  const sheet4Header = [
    'SỐ HỒ SƠ', 'LOẠI CÔNG TRÌNH / KẾT CẤU', 'CẤP CÔNG TRÌNH', 'NIÊN HẠN CHUẨN (NĂM)', 
    'NĂM XÂY DỰNG', 'SỐ NĂM ĐÃ SỬ DỤNG', 'TỶ LỆ CLCL TỔNG HỢP (%)', 
    'SUẤT VỐN ĐẦU TƯ (VNĐ/m2)', 'DIỆN TÍCH SỬ DỤNG (m2)', 'GIÁ TRỊ XÂY MỚI (VNĐ)', 
    'GIÁ TRỊ CÒN LẠI (VNĐ)'
  ];
  const sheet4Rows = dossiers.map(d => {
    const cl = d.clclCalculation || {};
    return [
      d.code || '',
      d.constructionType || cl.buildingClassification || '',
      cl.buildingClassification || 'Công trình Cấp II',
      cl.designLifespanYears || 50,
      d.constructionYear || cl.constructionYear || '',
      cl.usedYears || 4,
      cl.finalClclRate || d.remainingBuildingQuality || 85,
      cl.newConstructionUnitPrice || d.constructionUnitPrice || 6500000,
      cl.usableFloorArea || d.constructionUsableArea || d.areaCertificate || 0,
      cl.newReplacementValue || 0,
      cl.remainingStructureValue || 0
    ];
  });
  const worksheet4 = XLSX.utils.aoa_to_sheet([sheet4Header, ...sheet4Rows]);
  XLSX.utils.book_append_sheet(workbook, worksheet4, 'bang tinh clcl');

  XLSX.writeFile(workbook, filename);
}

// Generate template Excel file for blank import
export function downloadExcelTemplate() {
  exportDossiersToExcel([], 'Mau_File_Nhap_Tham_Dinh_Gia.xlsx');
}

// Options for Excel parsing
export interface ExcelParseOptions {
  headerStartRow?: number; // 1-indexed, default 1
  headerEndRow?: number;   // 1-indexed, default 3
  dataStartRow?: number;    // 1-indexed, default 4
  useLines1to3?: boolean;  // default true
}

export interface HeaderColumnInfo {
  colIndex: number;
  row1: string;
  row2: string;
  row3: string;
  combinedName: string;
  categoryGroup: string;
}

export interface ParsedExcelResult {
  headers: HeaderColumnInfo[];
  dossiers: ValuationDossier[];
  totalRows: number;
  skippedEmptyRows: number;
  sheetName: string;
}

// Parse Excel or CSV (ArrayBuffer or Base64 or String) with configurable rows (default: Headers 1-3, Data 4)
export function parseExcelDetailed(
  input: ArrayBuffer | string,
  options: ExcelParseOptions = {}
): ParsedExcelResult {
  const headerStartRow = options.headerStartRow ?? 1; // 1-indexed
  const headerEndRow = options.headerEndRow ?? 3;     // 1-indexed
  const dataStartRow = options.dataStartRow ?? 4;       // 1-indexed

  let workbook: XLSX.WorkBook;

  if (typeof input === 'string') {
    // Check if base64 or raw string
    const cleanStr = input.replace(/^data:[^;]+;base64,/, '').trim();
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(cleanStr.slice(0, 100).replace(/\s/g, ''));
    if (isBase64) {
      workbook = XLSX.read(cleanStr, { type: 'base64' });
    } else {
      workbook = XLSX.read(input, { type: 'string' });
    }
  } else {
    workbook = XLSX.read(input, { type: 'array' });
  }

  const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    return { headers: [], dossiers: [], totalRows: 0, skippedEmptyRows: 0, sheetName: firstSheetName };
  }

  // Get raw matrix (array of arrays)
  const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!matrix || matrix.length === 0) {
    return { headers: [], dossiers: [], totalRows: 0, skippedEmptyRows: 0, sheetName: firstSheetName };
  }

  // Determine exact max column count across all rows in the file (no hardcoded cap)
  let maxCols = 0;

  // 1. Check worksheet dimension ref if available
  if (worksheet['!ref']) {
    try {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      if (range && typeof range.e.c === 'number' && range.e.c + 1 > maxCols) {
        maxCols = range.e.c + 1;
      }
    } catch {
      // ignore
    }
  }

  // 2. Check all rows in matrix to find the true widest row (both length and non-empty cells)
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    if (row && Array.isArray(row)) {
      if (row.length > maxCols) maxCols = row.length;
      for (let c = row.length - 1; c >= 0; c--) {
        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
          if (c + 1 > maxCols) maxCols = c + 1;
          break;
        }
      }
    }
  }

  // 3. Check header rows specifically (Rows 1 to 3)
  const headerColsLen = Math.max(
    (matrix[headerStartRow - 1] || []).length,
    (matrix[headerStartRow] || []).length,
    (matrix[headerEndRow - 1] || []).length
  );
  maxCols = Math.max(maxCols, headerColsLen);

  if (maxCols === 0 && matrix.length > 0) {
    maxCols = (matrix[0] || []).length || 1;
  }

  // Row 1 (index 0), Row 2 (index 1), Row 3 (index 2)
  const row0 = matrix[headerStartRow - 1] || []; // Dòng 1: Nhóm thông tin
  const row1 = matrix[headerStartRow] || [];     // Dòng 2: Tên cột chính
  const row2 = matrix[headerEndRow - 1] || [];   // Dòng 3: Tên cột chi tiết

  // Forward fill group & main headers for merged cells
  let currentGroup = '';
  let currentMain = '';

  const headerCols: HeaderColumnInfo[] = [];

  for (let c = 0; c < maxCols; c++) {
    const raw0 = String(row0[c] !== undefined ? row0[c] : '').trim();
    const raw1 = String(row1[c] !== undefined ? row1[c] : '').trim();
    const raw2 = String(row2[c] !== undefined ? row2[c] : '').trim();

    if (raw0) {
      currentGroup = raw0;
    }
    if (raw1) {
      currentMain = raw1;
    }

    // Build combined name from Rows 1-3
    let combinedName = '';
    if (raw1 && raw2) {
      combinedName = `${raw1} (${raw2})`;
    } else if (!raw1 && currentMain && raw2) {
      combinedName = `${currentMain} (${raw2})`;
    } else if (raw1) {
      combinedName = raw1;
    } else if (raw2) {
      combinedName = raw2;
    } else if (raw0) {
      combinedName = raw0;
    } else if (currentGroup && !raw1 && !raw2) {
      combinedName = `${currentGroup} - Cột ${c + 1}`;
    } else {
      combinedName = `Cột ${c + 1}`;
    }

    headerCols.push({
      colIndex: c,
      row1: raw0 || currentGroup,
      row2: raw1,
      row3: raw2,
      combinedName,
      categoryGroup: currentGroup
    });
  }

  // Process data rows starting from dataStartRow (Row 4 => index 3)
  const imported: ValuationDossier[] = [];
  const startRowIdx = Math.max(0, dataStartRow - 1); // 4 - 1 = 3 (Dòng 4)
  let skippedEmptyRows = 0;

  for (let r = startRowIdx; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || !Array.isArray(row)) {
      skippedEmptyRows++;
      continue;
    }

    // Filter non-empty cells
    const nonEmptyCells = row
      .map((cell, idx) => ({ idx, val: cell !== undefined && cell !== null ? String(cell).trim() : '' }))
      .filter(c => c.val.length > 0);

    // Skip row if completely empty
    if (nonEmptyCells.length === 0) {
      skippedEmptyRows++;
      continue;
    }

    // Skip row if it only has an STT (Order number: 1, 2, 3...) or small sequence number in a single cell
    if (nonEmptyCells.length === 1 && /^\d{1,5}$/.test(nonEmptyCells[0].val)) {
      skippedEmptyRows++;
      continue;
    }

    const getColVal = (colIndex: number, ...searchKeywords: string[]): string => {
      // 1. Prioritize finding the exact column by matching keywords against detected combined headers (Rows 1-3)
      if (searchKeywords.length > 0) {
        for (const h of headerCols) {
          const hName = h.combinedName.toLowerCase();
          for (const kw of searchKeywords) {
            const kwClean = kw.toLowerCase();
            if (hName.includes(kwClean) || (h.row2 && h.row2.toLowerCase().includes(kwClean))) {
              const val = row[h.colIndex] !== undefined ? String(row[h.colIndex]).trim() : '';
              if (val) return val;
            }
          }
        }
      }

      // 2. Fallback to default positional index
      const direct = row[colIndex] !== undefined ? String(row[colIndex]).trim() : '';
      return direct;
    };

    // 1. Thông tin chung
    const rawCode = getColVal(0, 'số hồ sơ', 'mã hồ sơ', 'mã hs');
    let rawClientName = getColVal(3, 'khách hàng', 'tên khách', 'chủ sở hữu');
    const isPureSeqCode = /^\d{1,4}$/.test(rawCode.trim());
    const code = (rawCode.trim() && !isPureSeqCode) ? rawCode.trim() : `2026TĐ-IMP-${r + 1}`;

    const rawStatus = getColVal(1, 'trạng thái');
    const status = parseStatus(rawStatus);
    const businessUnit = cleanVietnameseText(getColVal(2, 'đơn vị kinh doanh', 'đvkd', 'chi nhánh'));
    const clientCccd = getColVal(4, 'cccd', 'cmnd', 'căn cước', 'định danh');
    const receivedTime = getColVal(5, 'tiếp nhận (giờ)', 'giờ tiếp nhận');
    const receivedDate = formatExcelDate(getColVal(6, 'tiếp nhận (ngày)', 'ngày tiếp nhận')) || new Date().toISOString().split('T')[0];
    const assignedTime = getColVal(7, 'phân công (giờ)', 'giờ phân công');
    const assignedDate = formatExcelDate(getColVal(8, 'phân công (ngày)', 'ngày phân công'));
    let amcSpecialist = cleanVietnameseText(getColVal(9, 'chuyên viên amc', 'thẩm định viên', 'chuyên viên định giá'));
    
    let advanceFee = parseVietnameseNumber(getColVal(10, 'phí tạm ứng'));
    const surveyDate = formatExcelDate(getColVal(11, 'ngày khảo sát'));
    const approvalDate = formatExcelDate(getColVal(12, 'ngày phê duyệt', 'ngày duyệt'));
    const businessUnitSpecialist = cleanVietnameseText(getColVal(13, 'chuyên viên đơn vị', 'cán bộ tín dụng'));
    let totalValuationFee = parseVietnameseNumber(getColVal(14, 'tổng phí', 'phí thẩm định'));
    const assetCategory = parseCategory(getColVal(15, 'loại tài sản', 'bđs/đs'));

    // 2. Địa chỉ thửa đất
    let landPlotNumber = getColVal(16, 'thửa đất số', 'thửa đất', 'thửa số');
    let mapSheetNumber = getColVal(17, 'tờ bản đồ', 'tbđ', 'tờ bđ');
    const houseNumber = getColVal(18, 'số nhà', 'căn hộ');
    const ward = getColVal(19, 'xã', 'phường', 'thị trấn');
    const district = getColVal(20, 'huyện', 'thị xã', 'quận');
    const province = getColVal(21, 'tỉnh', 'thành phố', 'tp');

    // 3. Thông số kỹ thuật chi tiết
    const constructionYear = getColVal(22, 'năm xây dựng chung cư', 'năm sản xuất');
    const floorsCount = getColVal(23, 'số tầng', 'nơi sản xuất');
    const areaCertificate = parseVietnameseNumber(getColVal(24, 'diện tích theo sổ', 'diện tích (m2)')) || 0;
    const areaExpanded = parseVietnameseNumber(getColVal(25, 'diện tích cơi nới')) || 0;
    const landUseForm = cleanVietnameseText(getColVal(26, 'hình thức sử dụng đất', 'hình thức'));
    const landUseTerm = cleanVietnameseText(getColVal(27, 'thời hạn sử dụng đất', 'thời hạn'));
    const roadAccessLevel = cleanVietnameseText(getColVal(28, 'cấp độ đường'));
    const roadType = cleanVietnameseText(getColVal(29, 'loại đường'));
    const roadWidth = getColVal(30, 'độ rộng đường');
    const direction = cleanVietnameseText(getColVal(31, 'hướng', 'hướng ban công'));
    const shape = cleanVietnameseText(getColVal(32, 'hình dạng'));
    const frontageWidth = parseVietnameseNumber(getColVal(33, 'độ rộng mặt tiền')) || undefined;
    const dimension = getColVal(34, 'dài x rộng', 'kích thước');
    const businessCondition = cleanVietnameseText(getColVal(35, 'điều kiện kinh doanh'));
    const infrastructure = cleanVietnameseText(getColVal(36, 'cs hạ tầng', 'hạ tầng'));
    const carQuality = parseVietnameseNumber(getColVal(37, 'clcl đối với xe')) || undefined;
    const otherFactors = cleanVietnameseText(getColVal(38, 'yếu tố khác'));
    const googleMapCoords = getColVal(39, 'tọa độ định vị', 'google map');

    // 4. Kết quả thẩm định giá
    const stateLandPrice = parseVietnameseNumber(getColVal(40, 'giá nhà nước')) || undefined;
    const statePriceYear = getColVal(41, 'năm ban hành đơn giá');
    const kCoefficient = parseVietnameseNumber(getColVal(42, 'hệ số k')) || undefined;
    const proposedUnitPrice = parseVietnameseNumber(getColVal(43, 'đơn giá đề nghị')) || undefined;
    const appraisedUnitPrice = parseVietnameseNumber(getColVal(44, 'đơn giá thẩm định')) || undefined;
    let marketPrice = parseVietnameseNumber(getColVal(45, 'giá thị trường', 'giá phê duyệt', 'tổng giá trị')) || 0;

    // 4B. Thông tin định giá đất theo quy hoạch
    const rawPlannedArea = getColVal(-1, 'diện tích phù hợp với quy hoạch', 'phù hợp quy hoạch', 'phù hợp qh');
    const plannedLandArea = rawPlannedArea ? (parseVietnameseNumber(rawPlannedArea) || undefined) : undefined;
    const rawPlannedUnitPrice = getColVal(-1, 'đơn giá phù hợp quy hoạch', 'đơn giá phù hợp qh');
    const plannedLandUnitPrice = rawPlannedUnitPrice ? (parseVietnameseNumber(rawPlannedUnitPrice) || undefined) : undefined;
    const rawPlannedValue = getColVal(-1, 'giá thẩm định (phù hợp quy hoạch)', 'giá thẩm định phù hợp quy hoạch', 'thành tiền phù hợp qh');
    const plannedLandValue = rawPlannedValue 
      ? (parseVietnameseNumber(rawPlannedValue) || undefined)
      : (plannedLandArea && plannedLandUnitPrice ? Math.round(plannedLandArea * plannedLandUnitPrice) : undefined);

    const rawUnplannedArea = getColVal(-1, 'diện tích không phù hợp với quy hoạch', 'không phù hợp quy hoạch', 'không phù hợp qh');
    const unplannedLandArea = rawUnplannedArea ? (parseVietnameseNumber(rawUnplannedArea) || undefined) : undefined;
    const rawUnplannedUnitPrice = getColVal(-1, 'đơn giá không phù hợp quy hoạch', 'đơn giá không phù hợp qh');
    const unplannedLandUnitPrice = rawUnplannedUnitPrice ? (parseVietnameseNumber(rawUnplannedUnitPrice) || undefined) : undefined;
    const rawUnplannedValue = getColVal(-1, 'giá thẩm định (không phù hợp quy hoạch)', 'giá thẩm định không phù hợp quy hoạch', 'thành tiền không phù hợp qh');
    const unplannedLandValue = rawUnplannedValue 
      ? (parseVietnameseNumber(rawUnplannedValue) || undefined)
      : (unplannedLandArea && unplannedLandUnitPrice ? Math.round(unplannedLandArea * unplannedLandUnitPrice) : undefined);

    // 5. Công trình gắn liền với đất
    const constructionType = cleanVietnameseText(getColVal(46, 'loại công trình', 'loại thùng'));
    const constructionArea = parseVietnameseNumber(getColVal(47, 'diện tích xây dựng')) || undefined;
    const constructionUsableArea = parseVietnameseNumber(getColVal(48, 'diện tích theo sổ', 'diện tích sử dụng')) || undefined;
    const constructionActualArea = parseVietnameseNumber(getColVal(49, 'diện tích thực tế')) || undefined;
    const buildingFloorsMaterial = cleanVietnameseText(getColVal(50, 'số tầng/nguyên liệu', 'vật liệu'));
    const buildingYear = getColVal(51, 'năm xây dựng/năm sản xuất', 'năm hoàn thành');
    const remainingBuildingQuality = parseVietnameseNumber(getColVal(52, 'chất lượng còn lại')) || undefined;
    const constructionUnitPrice = parseVietnameseNumber(getColVal(53, 'đơn giá xây dựng')) || undefined;

    // --- Intelligent Disambiguation & Self-Healing for Displaced Columns ---
    let detectedLegalDoc = '';
    // 1. If clientName is actually a currency value (e.g. "2.978.000.000")
    if (/^[\d.,\s]+$/.test(rawClientName.trim()) && parseVietnameseNumber(rawClientName) > 100000) {
      if (!marketPrice || marketPrice === 0) {
        marketPrice = parseVietnameseNumber(rawClientName);
      }
      rawClientName = '';
    }

    // 2. Scan row cells for full legal doc or client owner name
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] !== undefined && row[c] !== null ? row[c] : '').trim();
      if (!cellVal) continue;

      // Detect legal document certificate text
      if (
        cellVal.includes('DO 665708') || 
        cellVal.toLowerCase().includes('giấy chứng nhận') || 
        cellVal.toLowerCase().includes('quyền sử dụng đất') ||
        cellVal.toLowerCase().includes('số vào sổ')
      ) {
        detectedLegalDoc = cleanVietnameseText(cellVal);

        // If amcSpecialist was accidentally set to this legal doc text, reset it
        if (amcSpecialist.includes('DO 665708') || amcSpecialist.toLowerCase().includes('giấy chứng nhận')) {
          amcSpecialist = '';
        }

        // Extract client name if missing
        if (!rawClientName) {
          const ownerMatch = cellVal.match(/cấp cho (?:ông|bà)?\s*([^\d,.]+?)(?: Ngày| Số| do|\.|$)/i);
          if (ownerMatch && ownerMatch[1]) {
            rawClientName = cleanVietnameseText(ownerMatch[1].trim());
          }
        }
      }

      // Check for advance fee text + number displacement
      if (cellVal.toLowerCase().includes('năm trăm nghìn') || cellVal.toLowerCase().includes('đồng chẵn')) {
        const nextCell = String(row[c + 1] || '').trim();
        const nextNum = parseVietnameseNumber(nextCell);
        if (nextNum > 0 && advanceFee === 0) {
          advanceFee = nextNum;
        }
      }

      // Detect land plot & map sheet numbers if embedded in text
      const cleanCell = cleanVietnameseText(cellVal);
      const plotMatch = cleanCell.match(/(?:Thửa\s*đất\s*số|Thửa\s*số|Thửa)\s*[:.]?\s*(\d+[a-zA-Z]?)/i);
      const mapMatch = cleanCell.match(/(?:Tờ\s*bản\s*đồ\s*số|Tờ\s*bản\s*đồ|TBĐ|Bản\s*đồ\s*số)\s*[:.]?\s*(\d+[a-zA-Z]?)/i);
      if (plotMatch && (!landPlotNumber || isNaN(Number(landPlotNumber)))) {
        landPlotNumber = plotMatch[1];
      }
      if (mapMatch && (!mapSheetNumber || isNaN(Number(mapSheetNumber)))) {
        mapSheetNumber = mapMatch[1];
      }
    }

    // Intelligently parse landPlotNumber & mapSheetNumber if still containing merged text
    const cleanPlotInfo = extractPlotAndMap(landPlotNumber, mapSheetNumber);
    if (cleanPlotInfo.plot && cleanPlotInfo.plot !== '---') {
      landPlotNumber = cleanPlotInfo.plot;
    }
    if (cleanPlotInfo.sheet && cleanPlotInfo.sheet !== '---') {
      mapSheetNumber = cleanPlotInfo.sheet;
    }

    // Default specialist fallback if empty or still invalid
    if (!amcSpecialist || amcSpecialist.length < 3 || amcSpecialist.toLowerCase().includes('giấy chứng nhận')) {
      amcSpecialist = businessUnitSpecialist || 'Lê Văn Nam';
    }

    const clientName = cleanVietnameseText(rawClientName.trim() || `Khách hàng HS ${code}`);

    // Full Address
    const addrParts = [houseNumber, ward, district, province].filter(Boolean);
    const assetAddress = addrParts.join(', ') || 'Chưa cập nhật địa chỉ';

    // Asset Name
    let assetName = '';
    if (assetCategory === 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT') {
      assetName = landPlotNumber 
        ? `Đất và tài sản gắn liền với đất tại Thửa ${landPlotNumber}, TBĐ ${mapSheetNumber || '---'}`
        : `Bất động sản tại ${assetAddress}`;
    } else if (assetCategory === 'CAN_HO_CHUNG_CU') {
      assetName = `Căn hộ chung cư / Căn hộ tập thể tại ${assetAddress}`;
    } else if (assetCategory === 'PHUONG_TIEN_VAN_TAI') {
      assetName = `Phương tiện vận tải - Hồ sơ ${code}`;
    } else {
      assetName = `Máy móc thiết bị - Hồ sơ ${code}`;
    }

    // Helper: detect if a string is merely a template placeholder or table header repetition
    const isPlaceholderOrHeader = (val: string): boolean => {
      if (!val) return true;
      const lower = val.toLowerCase().trim();
      return (
        lower === '-' ||
        lower === '--' ||
        lower === '---' ||
        lower === 'n/a' ||
        lower === 'na' ||
        lower === 'none' ||
        lower === 'null' ||
        lower === 'undefined' ||
        lower === '0' ||
        lower === '0.0' ||
        lower === 'chưa cập nhật' ||
        lower === 'chưa có' ||
        lower === 'không có' ||
        lower === 'khách hàng' ||
        lower === 'họ và tên' ||
        lower === 'tên khách hàng' ||
        lower === 'tên khách' ||
        lower === 'chủ tài sản' ||
        lower === 'chủ sở hữu' ||
        lower === 'stt' ||
        lower === 'số thứ tự' ||
        lower === 'mã hồ sơ' ||
        lower === 'mã hs' ||
        lower === 'số hồ sơ'
      );
    };

    // Rigorous verification: Verify this row contains genuine dossier data, not empty template rows (e.g. STT formulas, borders)
    const cleanClient = rawClientName ? rawClientName.trim() : '';
    const cleanCode = rawCode ? rawCode.trim() : '';
    const cleanCccd = clientCccd ? clientCccd.trim() : '';
    const cleanPlot = landPlotNumber ? landPlotNumber.trim() : '';
    const cleanHouse = houseNumber ? houseNumber.trim() : '';

    const hasValidClient = cleanClient.length >= 2 && !isPlaceholderOrHeader(cleanClient);
    const hasValidCode = cleanCode.length >= 2 && !/^\d{1,4}$/.test(cleanCode) && !isPlaceholderOrHeader(cleanCode);
    const hasValidCccd = cleanCccd.length >= 6 && /\d{6,12}/.test(cleanCccd);
    const hasValidLandPlot = cleanPlot.length >= 1 && !isPlaceholderOrHeader(cleanPlot);
    const hasValidHouse = cleanHouse.length >= 1 && !isPlaceholderOrHeader(cleanHouse);
    const hasValidFinancial = marketPrice > 0 || totalValuationFee > 0 || advanceFee > 0 || (proposedUnitPrice !== undefined && proposedUnitPrice > 0) || (appraisedUnitPrice !== undefined && appraisedUnitPrice > 0);
    const hasValidArea = areaCertificate > 0 || areaExpanded > 0 || (constructionArea !== undefined && constructionArea > 0);

    // Check if the row has any substantive non-template text in multiple columns (excluding pure STT and short flags)
    const substantiveCells = nonEmptyCells.filter(c => {
      const v = c.val.trim();
      return v.length >= 2 && !/^\d{1,4}$/.test(v) && !isPlaceholderOrHeader(v);
    });

    // A REAL valuation record MUST have at least one genuine core identifier:
    // 1. A valid Client Name OR
    // 2. A valid Dossier Code (not just row STT 1, 2, 3...) OR
    // 3. A valid CCCD/CMND OR
    // 4. A specific Land Plot Number / House Number with financial or area data OR
    // 5. At least 3 substantive non-placeholder cells with financial or client data
    const isGenuineDossier = 
      hasValidClient || 
      hasValidCode || 
      hasValidCccd || 
      (hasValidLandPlot && (hasValidFinancial || hasValidArea)) || 
      (hasValidHouse && (hasValidFinancial || hasValidArea)) ||
      (substantiveCells.length >= 3 && (hasValidFinancial || hasValidArea));

    // If none of these exist, this is an empty template row or formula filler (e.g. rows 5-100 with only STT or default status)
    if (!isGenuineDossier) {
      skippedEmptyRows++;
      continue;
    }

    // Collect every single column from the file into dynamic imported fields (exactly maxCols columns)
    const importedColumnsData: DynamicImportField[] = [];
    const customFields: Record<string, any> = {};

    for (let c = 0; c < maxCols; c++) {
      const cellRaw = row[c];
      const cellVal = cellRaw !== undefined && cellRaw !== null ? String(cellRaw).trim() : '';
      const colHeader = headerCols[c];
      const hName = colHeader ? colHeader.combinedName : `Cột ${c + 1}`;
      const catGroup = colHeader ? colHeader.categoryGroup : '';

      customFields[hName] = cellVal;
      customFields[`col_${c + 1}`] = cellVal;

      importedColumnsData.push({
        colIndex: c,
        headerName: hName,
        categoryGroup: catGroup,
        row1: colHeader ? colHeader.row1 : '',
        row2: colHeader ? colHeader.row2 : '',
        row3: colHeader ? colHeader.row3 : '',
        value: cellVal
      });
    }

    imported.push({
      id: `HS-IMP-${Date.now()}-${r + 1}`,
      code,
      status,
      businessUnit,
      clientName,
      clientCccd,
      clientPhone: '',
      clientEmail: '',
      clientAddress: assetAddress,
      receivedDate,
      receivedTime,
      assignedDate,
      assignedTime,
      amcSpecialist,
      advanceFee,
      surveyDate,
      approvalDate,
      businessUnitSpecialist,
      totalValuationFee,
      
      assetName,
      assetCategory,
      assetAddress,

      landPlotNumber,
      mapSheetNumber,
      apartmentNumber: houseNumber?.includes('Căn') ? houseNumber : undefined,
      buildingName: (houseNumber?.includes('Tòa') || houseNumber?.includes('Dự án')) ? houseNumber : undefined,
      houseNumber,
      ward,
      district,
      province,

      constructionYear,
      floorsCount,
      areaCertificate,
      areaExpanded,
      landUseForm,
      landUseTerm,
      roadAccessLevel,
      roadType,
      roadWidth,
      direction,
      shape,
      frontageWidth,
      dimension,
      businessCondition,
      infrastructure,
      carQuality,
      otherFactors,
      googleMapCoords,

      stateLandPrice,
      statePriceYear,
      kCoefficient,
      proposedUnitPrice,
      appraisedUnitPrice,
      marketPrice,
      approvedValue: marketPrice > 0 
        ? marketPrice 
        : (plannedLandValue ? (plannedLandValue + (unplannedLandValue || 0)) : (appraisedUnitPrice && areaCertificate ? Math.round(appraisedUnitPrice * areaCertificate) : undefined)),
      estimatedValue: marketPrice > 0 
        ? marketPrice 
        : (proposedUnitPrice && areaCertificate ? Math.round(proposedUnitPrice * areaCertificate) : undefined),

      // Thông tin định giá đất theo quy hoạch
      plannedLandUnit: 'm²',
      plannedLandArea,
      plannedLandUnitPrice,
      plannedLandValue,

      unplannedLandUnit: 'm²',
      unplannedLandArea,
      unplannedLandUnitPrice,
      unplannedLandValue,

      constructionType,
      constructionArea,
      constructionUsableArea,
      constructionActualArea,
      buildingFloorsMaterial,
      buildingYear,
      remainingBuildingQuality,
      constructionUnitPrice,

      area: areaCertificate || undefined,
      legalDocNumber: detectedLegalDoc || (landPlotNumber ? `GCN Thửa ${landPlotNumber}, TBĐ ${mapSheetNumber || ''}` : ''),
      purpose: 'VAY_VON_NGAN_HANG',
      assignedAppraiser: amcSpecialist,
      creditOfficer: businessUnitSpecialist,
      branch: province ? `Chi nhánh ${cleanVietnameseText(province)}` : 'Chi nhánh Hà Nội',
      serviceFee: totalValuationFee || advanceFee || 0,
      paymentStatus: advanceFee > 0 ? 'DA_TAM_UNG' : 'CHUA_THANH_TOAN',
      priority: 'NORMAL',
      notes: `Nhập tự động từ bảng tính. Tên cột dòng 1-3, Dữ liệu dòng 4. ${otherFactors}`,
      documents: [
        { id: `doc-imp-${r + 1}`, name: 'Tài liệu thẩm định từ file', status: 'DA_NOP' }
      ],
      statusHistory: [
        { 
          status, 
          note: `Khởi tạo từ Import (Tên cột Dòng 1-3, Dữ liệu Dòng 4 - Dòng Excel ${r + 1})`, 
          updatedAt: new Date().toLocaleString('vi-VN'), 
          updatedBy: 'Hệ thống Import' 
        }
      ],
      totalImportedColumns: maxCols,
      importedColumnsData,
      customFields
    });
  }

  return {
    headers: headerCols,
    dossiers: imported,
    totalRows: imported.length,
    skippedEmptyRows,
    sheetName: firstSheetName
  };
}

// Parse Excel or CSV ArrayBuffer into Dossier objects supporting multi-row format (backward-compatible)
export function parseExcelToDossiers(
  buffer: ArrayBuffer | string,
  options: ExcelParseOptions = {}
): ValuationDossier[] {
  const result = parseExcelDetailed(buffer, options);
  return result.dossiers;
}
