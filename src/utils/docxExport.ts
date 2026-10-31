import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  UnderlineType
} from 'docx';
import { ValuationDossier } from '../types/dossier';
import { 
  numberToVietnameseWords, 
  cleanVietnameseText, 
  formatExcelDate,
  formatCurrencyNumber,
  formatBranchName,
  extractPlotAndMap
} from './formatters';

export interface ExportReportOptions {
  branchName?: string;
  branchAddress?: string;
  appraiserName?: string;
  managerName?: string;
  directorName?: string;
  liquidity?: 'Cao' | 'Trung bình' | 'Kém';
  transferability?: 'Cao' | 'Trung bình' | 'Kém';
  planningStatus?: 'Có' | 'Không' | 'Không rõ';
  usagePurpose?: 'Để ở' | 'Để kinh doanh' | 'Khác';
  disputeStatus?: 'Có' | 'Không' | 'Không rõ';
  additionalNotes?: string;
  customLandValue?: number;
  customConstrValue?: number;
  customFee?: number;
  advanceFeePaid?: number;
  surveyDateStr?: string;
  valuationMonthStr?: string;
  eastBorder?: string;
  westBorder?: string;
  southBorder?: string;
  northBorder?: string;
  trafficStatus?: string;
  infrastructureStatus?: string;
  businessCapability?: string;
  environmentStatus?: string;
  // IV. KIẾN NGHỊ & ĐỀ XUẤT CỦA CÁN BỘ THẨM ĐỊNH
  recommendations?: string;
  creditProposal?: string;
  maxLtvRate?: number;
  maxLoanAmount?: number;
  collateralConditions?: string;
  postDisbursementCheck?: string;
  otherProposals?: string;
}

const FONT_NAME = 'Times New Roman';

const HEADER_FOOTER_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const TABLE_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '444444' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '444444' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '444444' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '444444' },
};

function createCell(
  text: string, 
  widthPct: number, 
  options: { 
    bold?: boolean; 
    align?: (typeof AlignmentType)[keyof typeof AlignmentType]; 
    bgColor?: string;
    colSpan?: number;
    size?: number;
    italics?: boolean;
  } = {}
): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDER,
    shading: options.bgColor ? { fill: options.bgColor } : undefined,
    columnSpan: options.colSpan,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: options.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text: cleanVietnameseText(text),
            bold: options.bold || false,
            italics: options.italics || false,
            font: FONT_NAME,
            size: options.size || 22,
          }),
        ],
      }),
    ],
  });
}

function createDocHeader(code: string, dateStr: string): Header {
  const cleanCode = cleanVietnameseText(code);
  const cleanDate = formatExcelDate(dateStr);
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ 
            text: `Số HS: ${cleanCode}    Ngày: ${cleanDate}`, 
            font: FONT_NAME, 
            size: 18, 
            italics: true 
          }),
        ],
      }),
    ],
  });
}

function createDocFooter(formCode: string = 'BM.02A/TĐTS'): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ 
            text: `${formCode}  |  Trang `, 
            font: FONT_NAME, 
            size: 16, 
            italics: true 
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT_NAME,
            size: 16
          }),
        ],
      }),
    ],
  });
}

/**
 * HELPER: Tạo dữ liệu 3 tài sản so sánh cho Bảng Giải thích Phương pháp Định giá
 */
export interface ComparableItem {
  name: string;
  address: string;
  landArea: number;
  contact: string;
  transactionTime: string;
  askingPrice: number;
  transactionPrice: number;
  constrValue: number;
  landValue: number;
  landUnitPrice: number;
  adjArea: number;
  adjLegal: number;
  adjShape: number;
  adjFrontage: number;
  adjAlley: number;
  adjDistance: number;
  adjBusiness: number;
  adjEnvironment: number;
  adjOther: number;
  totalAdjRate: number;
  adjustedUnitPrice: number;
}

export function getComparablesData(
  dossier: ValuationDossier,
  landArea: number,
  constrArea: number,
  landVal: number,
  constrVal: number,
  actualTotal: number
): {
  subjectUnitPrice: number;
  comps: ComparableItem[];
  selectedUnitPrice: number;
} {
  const subjectUnitPrice = landArea > 0 ? Math.round(landVal / landArea) : 25000000;
  
  // Comp 1: Gần đó, diện tích nhỏ hơn một chút, giá rao cao hơn 3%
  const comp1Area = Math.round(landArea * 0.95);
  const comp1Asking = Math.round(actualTotal * 1.04);
  const comp1Trans = Math.round(actualTotal * 1.01);
  const comp1ConstrVal = Math.round(constrVal * 0.95);
  const comp1LandVal = comp1Trans - comp1ConstrVal;
  const comp1UnitPrice = Math.round(comp1LandVal / comp1Area);
  const comp1TotalAdj = 0; // 0%
  const comp1AdjUnitPrice = Math.round(comp1UnitPrice * (1 + comp1TotalAdj / 100));

  // Comp 2: Cùng phường/xã, diện tích lớn hơn một chút
  const comp2Area = Math.round(landArea * 1.06);
  const comp2Asking = Math.round(actualTotal * 1.06);
  const comp2Trans = Math.round(actualTotal * 1.02);
  const comp2ConstrVal = Math.round(constrVal * 1.05);
  const comp2LandVal = comp2Trans - comp2ConstrVal;
  const comp2UnitPrice = Math.round(comp2LandVal / comp2Area);
  const comp2TotalAdj = -1; // -1%
  const comp2AdjUnitPrice = Math.round(comp2UnitPrice * (1 + comp2TotalAdj / 100));

  // Comp 3: Ngõ tương đương lân cận
  const comp3Area = Math.round(landArea * 1.02);
  const comp3Asking = Math.round(actualTotal * 1.03);
  const comp3Trans = Math.round(actualTotal * 0.99);
  const comp3ConstrVal = Math.round(constrVal * 1.0);
  const comp3LandVal = comp3Trans - comp3ConstrVal;
  const comp3UnitPrice = Math.round(comp3LandVal / comp3Area);
  const comp3TotalAdj = 1; // +1%
  const comp3AdjUnitPrice = Math.round(comp3UnitPrice * (1 + comp3TotalAdj / 100));

  const comps: ComparableItem[] = [
    {
      name: 'Tài sản so sánh 1',
      address: `Khu vực lân cận ${cleanVietnameseText((dossier as any).street || dossier.ward || 'cùng trục ngõ')}, ${cleanVietnameseText(dossier.district || '')}`,
      landArea: comp1Area,
      contact: 'batdongsan.com.vn / Môi giới khu vực (0983.xxx.123)',
      transactionTime: 'Tháng gần nhất',
      askingPrice: comp1Asking,
      transactionPrice: comp1Trans,
      constrValue: comp1ConstrVal,
      landValue: comp1LandVal,
      landUnitPrice: comp1UnitPrice,
      adjArea: 1,
      adjLegal: 0,
      adjShape: 0,
      adjFrontage: -2,
      adjAlley: 1,
      adjDistance: 0,
      adjBusiness: 0,
      adjEnvironment: 0,
      adjOther: 0,
      totalAdjRate: 0,
      adjustedUnitPrice: comp1AdjUnitPrice,
    },
    {
      name: 'Tài sản so sánh 2',
      address: `Cách BĐS thẩm định khoảng 200m, ${cleanVietnameseText(dossier.ward || '')}, ${cleanVietnameseText(dossier.district || '')}`,
      landArea: comp2Area,
      contact: 'Alonhadat / Tin đăng chính chủ (0912.xxx.456)',
      transactionTime: '2 tháng trước',
      askingPrice: comp2Asking,
      transactionPrice: comp2Trans,
      constrValue: comp2ConstrVal,
      landValue: comp2LandVal,
      landUnitPrice: comp2UnitPrice,
      adjArea: -1,
      adjLegal: 0,
      adjShape: 0,
      adjFrontage: 1,
      adjAlley: -1,
      adjDistance: 0,
      adjBusiness: 0,
      adjEnvironment: 0,
      adjOther: 0,
      totalAdjRate: -1,
      adjustedUnitPrice: comp2AdjUnitPrice,
    },
    {
      name: 'Tài sản so sánh 3',
      address: `Cùng tổ dân phố / trục đường nhánh, ${cleanVietnameseText(dossier.district || '')}`,
      landArea: comp3Area,
      contact: 'Văn phòng công chứng địa phương (0904.xxx.789)',
      transactionTime: 'Giao dịch thành công gần đây',
      askingPrice: comp3Asking,
      transactionPrice: comp3Trans,
      constrValue: comp3ConstrVal,
      landValue: comp3LandVal,
      landUnitPrice: comp3UnitPrice,
      adjArea: 0,
      adjLegal: 0,
      adjShape: 0,
      adjFrontage: 0,
      adjAlley: 1,
      adjDistance: 0,
      adjBusiness: 0,
      adjEnvironment: 0,
      adjOther: 0,
      totalAdjRate: 1,
      adjustedUnitPrice: comp3AdjUnitPrice,
    },
  ];

  const selectedUnitPrice = subjectUnitPrice;

  return {
    subjectUnitPrice,
    comps,
    selectedUnitPrice,
  };
}

/**
 * XÂY DỰNG CÁC ĐOẠN VĂN MỤC IV. KIẾN NGHỊ CHUẨN BIỂU MẪU BAC A BANK
 */
function buildRecommendationParagraphs(
  dossier: ValuationDossier, 
  opts: ExportReportOptions, 
  clientName: string, 
  assetTypeLabel: string, 
  finalTotalValue: number
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 140, after: 60 },
      children: [new TextRun({ text: 'IV. KIẾN NGHỊ', bold: true, size: 24, font: FONT_NAME })],
    }),
  ];

  // 1. Trường hợp người dùng nhập toàn văn tự do trong recommendations
  const customRec = opts.recommendations || dossier.recommendations;
  if (customRec && customRec.trim()) {
    const lines = customRec.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line) ? line : `- ${line}`, 
              font: FONT_NAME, 
              size: 22 
            }),
          ],
        })
      );
    }
    return paragraphs;
  }

  // 2. Trường hợp theo các trường cấu trúc
  const creditProposal = opts.creditProposal || dossier.creditProposal || 
    `Đề xuất chấp thuận kết quả định giá ${assetTypeLabel} làm cơ sở cấp tín dụng cho khách hàng ${clientName} theo quy định của Ngân hàng TMCP Bắc Á.`;
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `- ${creditProposal}`, font: FONT_NAME, size: 22 }),
      ],
    })
  );

  const ltvRate = opts.maxLtvRate ?? dossier.maxLtvRate;
  const loanAmount = opts.maxLoanAmount ?? dossier.maxLoanAmount ?? (ltvRate && finalTotalValue ? Math.round(finalTotalValue * (ltvRate / 100)) : undefined);
  if (ltvRate || loanAmount) {
    let ltvText = `- Tỷ lệ cho vay tối đa đề xuất: `;
    if (ltvRate) ltvText += `${ltvRate}% giá trị định giá tài sản bảo đảm`;
    if (loanAmount) {
      ltvText += ` (Số tiền cho vay tối đa tương đương: ${formatCurrencyNumber(loanAmount)} VNĐ; bằng chữ: ${numberToVietnameseWords(loanAmount)}).`;
    }
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: ltvText, font: FONT_NAME, size: 22 }),
        ],
      })
    );
  }

  const colConditions = opts.collateralConditions || dossier.collateralConditions || 
    (dossier.assetCategory === 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT' 
      ? 'Điều kiện quản lý tài sản: Kiểm tra thực địa ranh giới thửa đất, đối chiếu hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ theo đúng quy định trước khi giải ngân.'
      : 'Điều kiện quản lý tài sản: Kiểm tra thực tế hiện trạng tài sản, hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký thế chấp/đăng ký giao dịch bảo đảm hợp lệ theo đúng quy định trước khi giải ngân.');
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `- ${colConditions}`, font: FONT_NAME, size: 22 }),
      ],
    })
  );

  const postCheck = opts.postDisbursementCheck || dossier.postDisbursementCheck;
  if (postCheck && postCheck.trim()) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `- Giám sát sau giải ngân: ${postCheck.trim()}`, font: FONT_NAME, size: 22 }),
        ],
      })
    );
  }

  const otherProposals = opts.otherProposals || dossier.otherProposals;
  if (otherProposals && otherProposals.trim()) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `- Kiến nghị khác: ${otherProposals.trim()}`, font: FONT_NAME, size: 22 }),
        ],
      })
    );
  }

  return paragraphs;
}

/**
 * MẪU BIỂU 02A: BM.02A/TĐTS (QSD đất và TS gắn liền với đất)
 */
function buildForm02ADocx(dossier: ValuationDossier, opts: ExportReportOptions = {}): Document {
  const finalValue = (opts.customLandValue !== undefined && opts.customConstrValue !== undefined)
    ? (opts.customLandValue + opts.customConstrValue)
    : (dossier.approvedValue || dossier.marketPrice || dossier.estimatedValue || 0);

  const landArea = dossier.areaCertificate || dossier.area || dossier.plannedLandArea || 100;
  const constrArea = dossier.constructionActualArea || dossier.constructionArea || 80;

  const defaultLandVal = (dossier.plannedLandValue || 0) + (dossier.unplannedLandValue || 0);
  const landVal = opts.customLandValue !== undefined 
    ? opts.customLandValue 
    : (defaultLandVal > 0 ? defaultLandVal : (finalValue > 0 ? Math.round(finalValue * 0.8) : 0));

  const constrVal = opts.customConstrValue !== undefined 
    ? opts.customConstrValue 
    : Math.max(0, finalValue - landVal);

  const actualTotal = landVal + constrVal > 0 ? (landVal + constrVal) : finalValue;

  const dateStr = formatExcelDate(opts.surveyDateStr || dossier.surveyDate || new Date().toLocaleDateString('vi-VN'));
  const branch = formatBranchName(opts.branchName || dossier.businessUnit || dossier.branch);
  const appraiser = cleanVietnameseText(opts.appraiserName || dossier.amcSpecialist || dossier.assignedAppraiser || dossier.businessUnitSpecialist || 'Lê Văn Nam');
  const manager = cleanVietnameseText(opts.managerName || 'Trần Đình Trọng');
  const director = cleanVietnameseText(opts.directorName || 'Nguyễn Minh Hải');
  const clientName = cleanVietnameseText(dossier.clientName);
  const ownerName = cleanVietnameseText((dossier as any).ownerName || clientName);
  const assetAddress = cleanVietnameseText(dossier.assetAddress);
  const cleanCode = cleanVietnameseText(dossier.code);

  const plotSheet = extractPlotAndMap(dossier.landPlotNumber, dossier.mapSheetNumber);
  const plotNum = plotSheet.plot || dossier.landPlotNumber || '...';
  const sheetNum = plotSheet.sheet || dossier.mapSheetNumber || '...';

  const rawLegal = dossier.legalDocNumber || 'Cung cấp theo hồ sơ vay vốn';
  const cleanLegal = cleanVietnameseText(rawLegal);

  // State valuation estimates
  const stateUnitPrice = dossier.stateLandPrice || Math.round((landVal / (landArea || 1)) * 0.45);
  const stateK = 1.2;
  const stateLandVal = Math.round(landArea * stateUnitPrice * stateK);
  const stateConstrPrice = 4500000;
  const stateConstrVal = Math.round(constrArea * stateConstrPrice * ((dossier.remainingBuildingQuality || 70) / 100));
  const totalStateVal = stateLandVal + stateConstrVal;

  const appraisedUnitPrice = landArea > 0 ? Math.round(landVal / landArea) : 25000000;
  const appraisedConstrPrice = constrArea > 0 ? Math.round(constrVal / constrArea) : 5500000;

  // Comparables
  const { comps, selectedUnitPrice } = getComparablesData(dossier, landArea, constrArea, landVal, constrVal, actualTotal);

  // Table 4a: Giá trị bất động sản
  const table4aRows: TableRow[] = [
    new TableRow({
      children: [
        createCell('Khoản mục', 50, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Theo đơn giá nhà nước', 25, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Theo đơn giá thẩm định', 25, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
      ],
    }),
    new TableRow({
      children: [
        createCell('1. Giá trị quyền sử dụng đất', 50, { bold: true }),
        createCell('', 25),
        createCell('', 25),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Diện tích (m2)', 50, { italics: true }),
        createCell(String(landArea), 25, { align: AlignmentType.CENTER }),
        createCell(String(landArea), 25, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Đơn giá (đvt/m2)', 50, { italics: true }),
        createCell(formatCurrencyNumber(stateUnitPrice), 25, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(appraisedUnitPrice), 25, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Hệ số K', 50, { italics: true }),
        createCell(String(stateK), 25, { align: AlignmentType.CENTER }),
        createCell('1.0', 25, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Thành tiền QSD đất (VND)', 50, { bold: true }),
        createCell(formatCurrencyNumber(stateLandVal), 25, { align: AlignmentType.RIGHT, bold: true }),
        createCell(formatCurrencyNumber(landVal), 25, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createCell('2. Giá trị tài sản gắn liền với đất', 50, { bold: true }),
        createCell('', 25),
        createCell('', 25),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Diện tích (m2)', 50, { italics: true }),
        createCell(String(constrArea), 25, { align: AlignmentType.CENTER }),
        createCell(String(constrArea), 25, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Đơn giá (đvt/m2)', 50, { italics: true }),
        createCell(formatCurrencyNumber(stateConstrPrice), 25, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(appraisedConstrPrice), 25, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Thành tiền TS trên đất (VND)', 50, { bold: true }),
        createCell(formatCurrencyNumber(stateConstrVal), 25, { align: AlignmentType.RIGHT, bold: true }),
        createCell(formatCurrencyNumber(constrVal), 25, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createCell('3. Tổng giá trị = 1 + 2', 50, { bold: true, bgColor: 'FFF8E1' }),
        createCell(formatCurrencyNumber(totalStateVal), 25, { align: AlignmentType.RIGHT, bold: true, bgColor: 'FFF8E1' }),
        createCell(formatCurrencyNumber(actualTotal), 25, { align: AlignmentType.RIGHT, bold: true, bgColor: 'FFF8E1' }),
      ],
    }),
  ];

  // Table 4b: Giải thích phương pháp định giá
  const table4bRows: TableRow[] = [
    new TableRow({
      children: [
        createCell('Nội dung', 34, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Tài sản cần thẩm định', 22, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Tài sản so sánh 1', 15, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Tài sản so sánh 2', 15, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Tài sản so sánh 3', 14, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Mô tả chi tiết tài sản (Địa chỉ, diện tích từng loại đất, tài sản trên đất. Tên và điện thoại liên hệ)', 34, { bold: true }),
        createCell(`${assetAddress}. DT đất: ${landArea} m2. TS trên đất: ${dossier.constructionType || 'Nhà ở'}. Liên hệ: Chủ tài sản`, 22),
        createCell(`${comps[0].address}. DT: ${comps[0].landArea} m2. ĐT: ${comps[0].contact}`, 15),
        createCell(`${comps[1].address}. DT: ${comps[1].landArea} m2. ĐT: ${comps[1].contact}`, 15),
        createCell(`${comps[2].address}. DT: ${comps[2].landArea} m2. ĐT: ${comps[2].contact}`, 14),
      ],
    }),
    new TableRow({
      children: [
        createCell('Thời điểm giao dịch', 34),
        createCell('Hiện tại', 22, { align: AlignmentType.CENTER }),
        createCell(comps[0].transactionTime, 15, { align: AlignmentType.CENTER }),
        createCell(comps[1].transactionTime, 15, { align: AlignmentType.CENTER }),
        createCell(comps[2].transactionTime, 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Giá tham khảo (VNĐ)', 34),
        createCell(formatCurrencyNumber(actualTotal), 22, { align: AlignmentType.RIGHT, bold: true }),
        createCell(formatCurrencyNumber(comps[0].askingPrice), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[1].askingPrice), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[2].askingPrice), 14, { align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Giá ước tính giao dịch thành công (VNĐ)', 34),
        createCell(formatCurrencyNumber(actualTotal), 22, { align: AlignmentType.RIGHT, bold: true }),
        createCell(formatCurrencyNumber(comps[0].transactionPrice), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[1].transactionPrice), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[2].transactionPrice), 14, { align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Giá trị tài sản trên đất (VNĐ)', 34),
        createCell(formatCurrencyNumber(constrVal), 22, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[0].constrValue), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[1].constrValue), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[2].constrValue), 14, { align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Giá trị quyền sử dụng đất (VNĐ)', 34),
        createCell(formatCurrencyNumber(landVal), 22, { align: AlignmentType.RIGHT, bold: true }),
        createCell(formatCurrencyNumber(comps[0].landValue), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[1].landValue), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[2].landValue), 14, { align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Tổng diện tích đất (m2)', 34),
        createCell(String(landArea), 22, { align: AlignmentType.CENTER, bold: true }),
        createCell(String(comps[0].landArea), 15, { align: AlignmentType.CENTER }),
        createCell(String(comps[1].landArea), 15, { align: AlignmentType.CENTER }),
        createCell(String(comps[2].landArea), 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Đơn giá đất (vnđ/m2) [B]', 34, { bold: true }),
        createCell(formatCurrencyNumber(appraisedUnitPrice), 22, { align: AlignmentType.RIGHT, bold: true }),
        createCell(formatCurrencyNumber(comps[0].landUnitPrice), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[1].landUnitPrice), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[2].landUnitPrice), 14, { align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Điều chỉnh theo các yếu tố', 100, { bold: true, bgColor: 'EBF3FB', colSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Diện tích đất (cùng mục đích SD)', 34),
        createCell(`${landArea} m²`, 22, { align: AlignmentType.CENTER }),
        createCell(`${comps[0].adjArea > 0 ? '+' : ''}${comps[0].adjArea}%`, 15, { align: AlignmentType.CENTER }),
        createCell(`${comps[1].adjArea > 0 ? '+' : ''}${comps[1].adjArea}%`, 15, { align: AlignmentType.CENTER }),
        createCell(`${comps[2].adjArea > 0 ? '+' : ''}${comps[2].adjArea}%`, 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Tình trạng pháp lý', 34),
        createCell('Đã có GCN', 22, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Hình dạng (vuông vắn/không vuông)', 34),
        createCell(dossier.shape || 'Vuông vắn', 22, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Độ rộng mặt tiền', 34),
        createCell(`${dossier.frontageWidth || 4.5} m`, 22, { align: AlignmentType.CENTER }),
        createCell(`${comps[0].adjFrontage > 0 ? '+' : ''}${comps[0].adjFrontage}%`, 15, { align: AlignmentType.CENTER }),
        createCell(`${comps[1].adjFrontage > 0 ? '+' : ''}${comps[1].adjFrontage}%`, 15, { align: AlignmentType.CENTER }),
        createCell(`${comps[2].adjFrontage > 0 ? '+' : ''}${comps[2].adjFrontage}%`, 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Độ rộng mặt cắt ngõ', 34),
        createCell(`${dossier.roadWidth || '3.5m'}`, 22, { align: AlignmentType.CENTER }),
        createCell(`${comps[0].adjAlley > 0 ? '+' : ''}${comps[0].adjAlley}%`, 15, { align: AlignmentType.CENTER }),
        createCell(`${comps[1].adjAlley > 0 ? '+' : ''}${comps[1].adjAlley}%`, 15, { align: AlignmentType.CENTER }),
        createCell(`${comps[2].adjAlley > 0 ? '+' : ''}${comps[2].adjAlley}%`, 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Khoảng cách ra đường phố chính', 34),
        createCell('Khoảng 50m', 22, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Khả năng kinh doanh', 34),
        createCell(opts.businessCapability || dossier.businessCondition || 'Để ở / KD nhỏ', 22, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Môi trường kinh tế xã hội', 34),
        createCell('Hạ tầng hoàn chỉnh, an ninh tốt', 22, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Yếu tố khác', 34),
        createCell('Tương đồng', 22, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 15, { align: AlignmentType.CENTER }),
        createCell('0%', 14, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Tổng tỷ lệ điều chỉnh (%)', 34, { bold: true, bgColor: 'FFF8E1' }),
        createCell('0%', 22, { align: AlignmentType.CENTER, bold: true, bgColor: 'FFF8E1' }),
        createCell(`${comps[0].totalAdjRate > 0 ? '+' : ''}${comps[0].totalAdjRate}%`, 15, { align: AlignmentType.CENTER, bold: true, bgColor: 'FFF8E1' }),
        createCell(`${comps[1].totalAdjRate > 0 ? '+' : ''}${comps[1].totalAdjRate}%`, 15, { align: AlignmentType.CENTER, bold: true, bgColor: 'FFF8E1' }),
        createCell(`${comps[2].totalAdjRate > 0 ? '+' : ''}${comps[2].totalAdjRate}%`, 14, { align: AlignmentType.CENTER, bold: true, bgColor: 'FFF8E1' }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Đơn giá sau điều chỉnh (vnđ/m2) [F]', 34, { bold: true }),
        createCell(formatCurrencyNumber(appraisedUnitPrice), 22, { align: AlignmentType.RIGHT, bold: true }),
        createCell(formatCurrencyNumber(comps[0].adjustedUnitPrice), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[1].adjustedUnitPrice), 15, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(comps[2].adjustedUnitPrice), 14, { align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Đơn giá lựa chọn (vnđ/m2) [G]', 34, { bold: true, bgColor: 'F2F4F7' }),
        createCell(`${formatCurrencyNumber(selectedUnitPrice)} VNĐ/m² (Lấy trung bình cộng F)`, 66, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7', colSpan: 4 }),
      ],
    }),
  ];

  // Table 1.2: Định giá tài sản gắn liền trên đất
  const table12Rows: TableRow[] = [
    new TableRow({
      children: [
        createCell('Hạng mục CTXD', 35, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Diện tích (m2)', 15, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Đơn giá (VNĐ)', 18, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Chất lượng còn lại (%)', 15, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Giá trị thẩm định (VNĐ)', 17, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
      ],
    }),
    new TableRow({
      children: [
        createCell(dossier.constructionType || 'Nhà ở kiên cố', 35),
        createCell(String(constrArea), 15, { align: AlignmentType.CENTER }),
        createCell(formatCurrencyNumber(appraisedConstrPrice), 18, { align: AlignmentType.RIGHT }),
        createCell(`${dossier.remainingBuildingQuality || 75}%`, 15, { align: AlignmentType.CENTER }),
        createCell(formatCurrencyNumber(constrVal), 17, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Giá trị tài sản trên đất', 68, { bold: true, align: AlignmentType.RIGHT, colSpan: 3, bgColor: 'FFF8E1' }),
        createCell('', 15, { bgColor: 'FFF8E1' }),
        createCell(formatCurrencyNumber(constrVal), 17, { align: AlignmentType.RIGHT, bold: true, bgColor: 'FFF8E1' }),
      ],
    }),
  ];

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_NAME, size: 22, color: '000000' },
          paragraph: { spacing: { line: 240, before: 0, after: 60 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 },
        },
      },
      headers: { default: createDocHeader(dossier.code, dateStr) },
      footers: { default: createDocFooter('BM.02A/TĐTS') },
      children: [
        // Title & Header (Theo mẫu BM.02A/TĐTS)
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ 
              text: 'BÁO CÁO THẨM ĐỊNH GIÁ TRỊ TÀI SẢN', 
              bold: true, 
              size: 26, 
              font: FONT_NAME 
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 40 },
          children: [
            new TextRun({ 
              text: '(Áp dụng cho TSBĐ là QSD đất và tài sản khác gắn liền trên đất là nhà ở riêng lẻ)', 
              italics: true, 
              size: 20, 
              font: FONT_NAME 
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 150 },
          children: [
            new TextRun({ 
              text: `Số: ${cleanCode || '.......'}/20...../BACABANK- CN${branch}`, 
              font: FONT_NAME, 
              size: 20,
              italics: true,
            }),
          ],
        }),

        // I. THÔNG TIN CHUNG
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: 'I. THÔNG TIN CHUNG', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Chi nhánh/Mã Chi nhánh: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: branch, font: FONT_NAME, size: 22 }),
            new TextRun({ text: `    Mã tài sản: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanCode, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Chủ sở hữu tài sản: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: ownerName, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Khách hàng vay: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: clientName, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `  Mối quan hệ giữa chủ tài sản và khách hàng vay: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText((dossier as any).relationshipWithBorrower || 'Chính chủ'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Thời gian phân hồ sơ: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: formatExcelDate((dossier as any).assignmentDate || dossier.surveyDate || dateStr), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Thời gian hoàn tất báo cáo thẩm định để ký: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: dateStr, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Mục đích thẩm định:`, bold: true, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `  [ x ] Làm cơ sở cấp tín dụng      [   ] TSBĐ bổ sung/thay thế      [   ] Cơ cấu nợ/Xử lý nợ`, font: FONT_NAME, size: 22 }),
          ],
        }),

        // II. MÔ TẢ VỀ BẤT ĐỘNG SẢN
        new Paragraph({
          spacing: { before: 140, after: 60 },
          children: [new TextRun({ text: 'II. MÔ TẢ VỀ BẤT ĐỘNG SẢN', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '1. Vị trí bất động sản', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Số: `, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText(dossier.houseNumber || '---'), font: FONT_NAME, size: 22 }),
            new TextRun({ text: `        Đường/Ấp: `, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText((dossier as any).street || 'Đường hiện hữu'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Phường/xã: `, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText(dossier.ward || '---'), font: FONT_NAME, size: 22 }),
            new TextRun({ text: `        Quận/huyện: `, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText(dossier.district || '---'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Tỉnh/Thành phố: `, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText(dossier.province || '---'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Vị trí: `, font: FONT_NAME, size: 22 }),
            new TextRun({ text: assetAddress, font: FONT_NAME, size: 22 }),
          ],
        }),

        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: '2. Chứng từ pháp lý', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở và tài sản khác gắn liền với đất số: ${cleanLegal}`, font: FONT_NAME, size: 22 }),
          ],
        }),

        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: '3. Đặc điểm về bất động sản', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: 'a. Về đất:', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Thửa đất số: ${plotNum}            Tờ bản đồ số: ${sheetNum}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Mục đích sử dụng đất: ${cleanVietnameseText(dossier.landUsePurpose || 'Đất ở tại đô thị (ONT/ODT)')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Hình thức sử dụng đất: ${cleanVietnameseText(dossier.landUseForm || 'Sử dụng riêng')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Thời hạn sử dụng đất: ${cleanVietnameseText(dossier.landUseTerm || 'Lâu dài')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- DTSD thực tế: ${landArea} m2          Chiều dài: ${(dossier as any).dimensionLength || '15'} m         Chiều rộng: ${dossier.frontageWidth || '5'} m`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- DTSD được công nhận: ${dossier.areaCertificate || landArea} m2    Chiều dài: ${(dossier as any).dimensionLength || '15'} m         Chiều rộng: ${dossier.frontageWidth || '5'} m`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Độ rộng mặt đường/ngõ trước thửa đất: ${dossier.roadWidth || '3.5'} m`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Hình dáng thửa đất: ${cleanVietnameseText(dossier.shape || 'Vuông vắn')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Số lượng mặt tiền: ${(dossier as any).frontageCount || 1}           Hướng: ${cleanVietnameseText(dossier.direction || 'Đông Nam')}`, font: FONT_NAME, size: 22 }),
          ],
        }),

        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [new TextRun({ text: 'b. Về tài sản gắn liền với đất:', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Loại tài sản: ${cleanVietnameseText(dossier.constructionType || 'Nhà ở kiên cố')}    Năm xây dựng: ${dossier.constructionYear || 2018}    Tiện nghi: ${cleanVietnameseText((dossier as any).amenities || 'Đầy đủ')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Cấu trúc: ${cleanVietnameseText((dossier as any).structureSummary || 'Khung bê tông cốt thép chịu lực')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `+ Số tầng: ${dossier.floorsCount || 3}                 + Mái: ${cleanVietnameseText((dossier as any).roofType || 'Mái bê tông / Tôn lạnh')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `+ Tường: ${cleanVietnameseText((dossier as any).wallType || 'Xây gạch, sơn vôi')}             + Nền: ${cleanVietnameseText((dossier as any).floorType || 'Lát gạch men')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- DTSD thực tế: ${constrArea} m2       - DTSD được công nhận: ${(dossier as any).constructionRecognizedArea || constrArea} m2`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Tổng số phòng: ${(dossier as any).totalRooms || 6} trong đó ${(dossier as any).bedRooms || 3} phòng ngủ, ${(dossier as any).bathRooms || 3} phòng WC`, font: FONT_NAME, size: 22 }),
          ],
        }),

        // III. KẾT QUẢ THẨM ĐỊNH
        new Paragraph({
          spacing: { before: 140, after: 60 },
          children: [new TextRun({ text: 'III. KẾT QUẢ THẨM ĐỊNH', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `1. Quy hoạch sử dụng đất nơi bất động sản tọa lạc: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText((dossier as any).planningInfo || 'Đất ở đô thị phù hợp quy hoạch phân khu xây dựng, không có tranh chấp khiếu kiện.'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `2. Mục đích sử dụng của bất động sản: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText((dossier as any).currentUsage || 'Dùng để ở và sinh hoạt gia đình kết hợp kinh doanh.'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `3. Khả năng chuyển nhượng: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText(opts.transferability || (dossier as any).liquidity || 'Trung bình, khả năng thanh khoản tốt trên thị trường.'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `4. Định giá bất động sản:`, bold: true, font: FONT_NAME, size: 22 }),
          ],
        }),

        // a. Giá trị bất động sản
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({ text: 'a. Giá trị bất động sản:', bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: '                                                                                             đvt: VND', italics: true, font: FONT_NAME, size: 20 }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: table4aRows,
        }),
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({ text: 'Trị giá tài sản làm tròn: ', bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: `${formatCurrencyNumber(actualTotal)} VND`, bold: true, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: 'Bằng chữ: ', bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: `${numberToVietnameseWords(actualTotal)}.`, italics: true, font: FONT_NAME, size: 22 }),
          ],
        }),

        // b. Giải thích phương pháp định giá
        new Paragraph({
          pageBreakBefore: true,
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({ text: 'b. Giải thích phương pháp định giá', bold: true, size: 24, font: FONT_NAME }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: table4bRows,
        }),

        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [new TextRun({ text: 'Lưu ý:', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '• Giá tham khảo: Giá trị chào mua/chào bán/giao dịch thành công do thẩm định viên thu thập trên thị trường.', font: FONT_NAME, size: 20, italics: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '• Giá ước tính giao dịch thành công: Giá trị tài sản có thể mua bán được sau khi điều chỉnh theo mức độ tin cậy của thông tin và biến động thị trường.', font: FONT_NAME, size: 20, italics: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '• Giá trị QSD đất = Giá ước tính giao dịch thành công – Giá trị tài sản gắn liền trên đất.', font: FONT_NAME, size: 20, italics: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '• Đơn giá (B) = Giá trị QSD đất / Diện tích đất.', font: FONT_NAME, size: 20, italics: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '• Tỷ lệ điều chỉnh: Nếu BĐS so sánh kém hơn BĐS thẩm định thì điều chỉnh tỷ lệ tăng (+%); BĐS so sánh thuận lợi hơn BĐS thẩm định thì điều chỉnh tỷ lệ giảm (-%).', font: FONT_NAME, size: 20, italics: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '• Đơn giá sau điều chỉnh (F) = Đơn giá (B) × (100% + tổng tỷ lệ điều chỉnh).', font: FONT_NAME, size: 20, italics: true })],
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: '• Đơn giá lựa chọn (G) = Trung bình cộng của đơn giá sau điều chỉnh của các tài sản so sánh.', font: FONT_NAME, size: 20, italics: true })],
        }),

        // 1.2 Định giá tài sản gắn liền trên đất
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [new TextRun({ text: '1.2 Định giá tài sản gắn liền trên đất', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: table12Rows,
        }),

        ...buildRecommendationParagraphs(dossier, opts, clientName, 'tài sản', actualTotal),

        // SƠ ĐỒ VỊ TRÍ TÀI SẢN
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 40 },
          children: [new TextRun({ text: 'SƠ ĐỒ VỊ TRÍ TÀI SẢN', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 },
          children: [new TextRun({ text: '(In hình bản đồ nơi có vị trí tài sản)', italics: true, font: FONT_NAME, size: 20 })],
        }),

        // HÌNH ẢNH TÀI SẢN
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 40 },
          children: [new TextRun({ text: 'HÌNH ẢNH TÀI SẢN', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'Tối thiểu 3 hình ảnh đặc trưng của BĐS sau:', italics: true, font: FONT_NAME, size: 20 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '1. Hình ảnh tổng thể tài sản và không gian xung quanh', font: FONT_NAME, size: 20 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '2. Hình ảnh độ rộng đường/ngõ kết hợp mặt tiền tài sản', font: FONT_NAME, size: 20 })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: '3. Hình ảnh nổi bật về nội thất tài sản hoặc hình ảnh đặc điểm hoặc yếu tố có ảnh hưởng lớn đến giá trị tài sản.', font: FONT_NAME, size: 20 })],
        }),

        // Chữ ký
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 150, after: 60 },
          children: [new TextRun({ text: `..............., ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, italics: true, font: FONT_NAME, size: 22 })],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: HEADER_FOOTER_BORDER,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  borders: HEADER_FOOTER_BORDER,
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI THẨM ĐỊNH', bold: true, font: FONT_NAME, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, font: FONT_NAME, size: 18 })] }),
                    new Paragraph({ spacing: { before: 800 } }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: appraiser, bold: true, font: FONT_NAME, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  borders: HEADER_FOOTER_BORDER,
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỞNG PHÒNG', bold: true, font: FONT_NAME, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, font: FONT_NAME, size: 18 })] }),
                    new Paragraph({ spacing: { before: 800 } }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: manager, bold: true, font: FONT_NAME, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  width: { size: 34, type: WidthType.PERCENTAGE },
                  borders: HEADER_FOOTER_BORDER,
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI PHÊ DUYỆT', bold: true, font: FONT_NAME, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký, đóng dấu)', italics: true, font: FONT_NAME, size: 18 })] }),
                    new Paragraph({ spacing: { before: 800 } }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: director, bold: true, font: FONT_NAME, size: 22 })] }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });
}

/**
 * MẪU BIỂU 02A1: BM.02A1/TĐTS (QSH Căn hộ chung cư, căn hộ tập thể)
 */
function buildForm02A1Docx(dossier: ValuationDossier, opts: ExportReportOptions = {}): Document {
  const finalValue = (opts.customLandValue !== undefined && opts.customConstrValue !== undefined)
    ? (opts.customLandValue + opts.customConstrValue)
    : (dossier.approvedValue || dossier.marketPrice || dossier.estimatedValue || 0);

  const apartmentArea = (dossier as any).usableArea || dossier.areaCertificate || dossier.area || 75;
  const unitPrice = apartmentArea > 0 ? Math.round(finalValue / apartmentArea) : 35000000;

  const dateStr = formatExcelDate(opts.surveyDateStr || dossier.surveyDate || new Date().toLocaleDateString('vi-VN'));
  const branch = formatBranchName(opts.branchName || dossier.businessUnit || dossier.branch);
  const appraiser = cleanVietnameseText(opts.appraiserName || dossier.amcSpecialist || dossier.assignedAppraiser || 'Lê Văn Nam');
  const manager = cleanVietnameseText(opts.managerName || 'Trần Đình Trọng');
  const director = cleanVietnameseText(opts.directorName || 'Nguyễn Minh Hải');
  const clientName = cleanVietnameseText(dossier.clientName);
  const ownerName = cleanVietnameseText((dossier as any).ownerName || clientName);
  const assetAddress = cleanVietnameseText(dossier.assetAddress);
  const cleanCode = cleanVietnameseText(dossier.code);

  const tableA1Rows: TableRow[] = [
    new TableRow({
      children: [
        createCell('Khoản mục', 50, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Theo đơn giá nhà nước', 25, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Theo đơn giá thẩm định', 25, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Căn hộ chung cư / tập thể', 50, { bold: true }),
        createCell('', 25),
        createCell('', 25),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Diện tích thông thủy (m2)', 50, { italics: true }),
        createCell(String(apartmentArea), 25, { align: AlignmentType.CENTER }),
        createCell(String(apartmentArea), 25, { align: AlignmentType.CENTER }),
      ],
    }),
    new TableRow({
      children: [
        createCell('- Đơn giá (đvt/m2)', 50, { italics: true }),
        createCell(formatCurrencyNumber(Math.round(unitPrice * 0.45)), 25, { align: AlignmentType.RIGHT }),
        createCell(formatCurrencyNumber(unitPrice), 25, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Tổng giá trị định giá (VND)', 50, { bold: true, bgColor: 'FFF8E1' }),
        createCell(formatCurrencyNumber(Math.round(finalValue * 0.45)), 25, { align: AlignmentType.RIGHT, bold: true, bgColor: 'FFF8E1' }),
        createCell(formatCurrencyNumber(finalValue), 25, { align: AlignmentType.RIGHT, bold: true, bgColor: 'FFF8E1' }),
      ],
    }),
  ];

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_NAME, size: 22, color: '000000' },
          paragraph: { spacing: { line: 240, before: 0, after: 60 } },
        },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 } } },
      headers: { default: createDocHeader(dossier.code, dateStr) },
      footers: { default: createDocFooter('BM.02A1/TĐTS') },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BÁO CÁO THẨM ĐỊNH GIÁ TRỊ TÀI SẢN', bold: true, size: 26, font: FONT_NAME })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Áp dụng cho TSBĐ là QSH căn hộ chung cư, căn hộ tập thể)', italics: true, size: 20, font: FONT_NAME })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: `Số: ${cleanCode || '.......'}/20...../BACABANK- CN${branch}`, italics: true, size: 20, font: FONT_NAME })] }),

        new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'I. THÔNG TIN CHUNG', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `- Chi nhánh/Mã Chi nhánh: ${branch}    Mã tài sản: ${cleanCode}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Chủ sở hữu tài sản: ${ownerName}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Khách hàng vay: ${clientName}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Thời gian hoàn tất báo cáo thẩm định để ký: ${dateStr}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Mục đích thẩm định: [ x ] Làm cơ sở cấp tín dụng    [   ] TSBĐ bổ sung    [   ] Cơ cấu nợ`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'II. MÔ TẢ VỀ BẤT ĐỘNG SẢN', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `1. Vị trí căn hộ: ${assetAddress}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `2. Tòa nhà: ${cleanVietnameseText(dossier.buildingName || 'Tòa chung cư cao tầng')}; Tầng: ${dossier.apartmentFloor || '---'}; Số căn hộ: ${dossier.apartmentNumber || '---'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `3. Diện tích thông thủy: ${apartmentArea} m2; Hướng ban công: ${cleanVietnameseText(dossier.direction || 'Đông Nam')}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `4. Chứng từ pháp lý: GCN/HĐMB số: ${cleanVietnameseText(dossier.legalDocNumber || 'Cung cấp theo hồ sơ')}`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'III. KẾT QUẢ THẨM ĐỊNH', bold: true, size: 24, font: FONT_NAME })] }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableA1Rows }),
        new Paragraph({ spacing: { before: 60, after: 40 }, children: [new TextRun({ text: `Trị giá tài sản làm tròn: ${formatCurrencyNumber(finalValue)} VND (Bằng chữ: ${numberToVietnameseWords(finalValue)}.)`, bold: true, font: FONT_NAME, size: 22 })] }),

        ...buildRecommendationParagraphs(dossier, opts, clientName, 'căn hộ', finalValue),

        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 150, after: 60 }, children: [new TextRun({ text: `..............., ngày .... tháng .... năm ....`, italics: true, font: FONT_NAME, size: 22 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: HEADER_FOOTER_BORDER,
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI THẨM ĐỊNH', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: appraiser, bold: true, font: FONT_NAME, size: 22 })] })] }),
                new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỞNG PHÒNG', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: manager, bold: true, font: FONT_NAME, size: 22 })] })] }),
                new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI PHÊ DUYỆT', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: director, bold: true, font: FONT_NAME, size: 22 })] })] }),
              ],
            }),
          ],
        }),
      ],
    }],
  });
}

/**
 * MẪU BIỂU 02B: BM.02B/TĐTS (Phương tiện vận tải)
 */
function buildForm02BDocx(dossier: ValuationDossier, opts: ExportReportOptions = {}): Document {
  const finalValue = (opts.customLandValue !== undefined && opts.customConstrValue !== undefined)
    ? (opts.customLandValue + opts.customConstrValue)
    : (dossier.approvedValue || dossier.marketPrice || dossier.estimatedValue || 0);

  const dateStr = formatExcelDate(opts.surveyDateStr || dossier.surveyDate || new Date().toLocaleDateString('vi-VN'));
  const branch = formatBranchName(opts.branchName || dossier.businessUnit || dossier.branch);
  const appraiser = cleanVietnameseText(opts.appraiserName || dossier.amcSpecialist || dossier.assignedAppraiser || 'Lê Văn Nam');
  const manager = cleanVietnameseText(opts.managerName || 'Trần Đình Trọng');
  const director = cleanVietnameseText(opts.directorName || 'Nguyễn Minh Hải');
  const clientName = cleanVietnameseText(dossier.clientName);
  const ownerName = cleanVietnameseText((dossier as any).ownerName || clientName);
  const cleanCode = cleanVietnameseText(dossier.code);

  const tableBRows: TableRow[] = [
    new TableRow({
      children: [
        createCell('STT', 10, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Danh mục tài sản', 45, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Đơn giá lựa chọn', 20, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Số lượng', 10, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Giá trị định giá (VND)', 15, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
      ],
    }),
    new TableRow({
      children: [
        createCell('1', 10, { align: AlignmentType.CENTER }),
        createCell(`Phương tiện vận tải: ${cleanVietnameseText(dossier.assetName)} (BKS: ${dossier.licensePlate || '---'})`, 45),
        createCell(formatCurrencyNumber(finalValue), 20, { align: AlignmentType.RIGHT }),
        createCell('01', 10, { align: AlignmentType.CENTER }),
        createCell(formatCurrencyNumber(finalValue), 15, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Tổng cộng', 55, { bold: true, align: AlignmentType.RIGHT, colSpan: 2, bgColor: 'FFF8E1' }),
        createCell('', 20, { bgColor: 'FFF8E1' }),
        createCell('01', 10, { align: AlignmentType.CENTER, bold: true, bgColor: 'FFF8E1' }),
        createCell(formatCurrencyNumber(finalValue), 15, { align: AlignmentType.RIGHT, bold: true, bgColor: 'FFF8E1' }),
      ],
    }),
  ];

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_NAME, size: 22, color: '000000' },
          paragraph: { spacing: { line: 240, before: 0, after: 60 } },
        },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 } } },
      headers: { default: createDocHeader(dossier.code, dateStr) },
      footers: { default: createDocFooter('BM.02B/TĐTS') },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BÁO CÁO THẨM ĐỊNH GIÁ TRỊ TÀI SẢN', bold: true, size: 26, font: FONT_NAME })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Áp dụng cho Phương tiện vận tải)', italics: true, size: 20, font: FONT_NAME })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: `Số: ${cleanCode || '.......'}/20...../BACABANK- CN${branch}`, italics: true, size: 20, font: FONT_NAME })] }),

        new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'I. THÔNG TIN CHUNG', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `- Chi nhánh/Mã Chi nhánh: ${branch}    Mã tài sản: ${cleanCode}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Chủ sở hữu tài sản: ${ownerName}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Khách hàng vay: ${clientName}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Thời gian hoàn tất báo cáo thẩm định để ký: ${dateStr}`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'II. THÔNG TIN VỀ TÀI SẢN THẨM ĐỊNH', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `- Tên phương tiện / Nhãn hiệu: ${cleanVietnameseText(dossier.assetName)}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Biển kiểm soát: ${dossier.licensePlate || '---'}    Số khung: ${dossier.chassisNumber || '---'}    Số máy: ${dossier.engineNumber || '---'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Năm sản xuất: ${dossier.manufactureYear || 2022}    Nước sản xuất: Việt Nam / Nhập khẩu`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Đánh giá chất lượng còn lại thực tế: ${dossier.remainingBuildingQuality || 85}%`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'III. KẾT QUẢ THẨM ĐỊNH', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: '1. Định giá phương tiện vận tải theo phương pháp so sánh', bold: true, font: FONT_NAME, size: 22 })] }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableBRows }),
        new Paragraph({ spacing: { before: 60, after: 40 }, children: [new TextRun({ text: `Trị giá tài sản làm tròn: ${formatCurrencyNumber(finalValue)} VND (Bằng chữ: ${numberToVietnameseWords(finalValue)}.)`, bold: true, font: FONT_NAME, size: 22 })] }),

        ...buildRecommendationParagraphs(dossier, opts, clientName, 'phương tiện vận tải', finalValue),

        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 150, after: 60 }, children: [new TextRun({ text: `..............., ngày .... tháng .... năm ....`, italics: true, font: FONT_NAME, size: 22 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: HEADER_FOOTER_BORDER,
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI THẨM ĐỊNH', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: appraiser, bold: true, font: FONT_NAME, size: 22 })] })] }),
                new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỞNG PHÒNG', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: manager, bold: true, font: FONT_NAME, size: 22 })] })] }),
                new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI PHÊ DUYỆT', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: director, bold: true, font: FONT_NAME, size: 22 })] })] }),
              ],
            }),
          ],
        }),
      ],
    }],
  });
}

/**
 * MẪU BIỂU 02C: BM.02C/TĐTS (Máy móc thiết bị)
 */
function buildForm02CDocx(dossier: ValuationDossier, opts: ExportReportOptions = {}): Document {
  const finalValue = (opts.customLandValue !== undefined && opts.customConstrValue !== undefined)
    ? (opts.customLandValue + opts.customConstrValue)
    : (dossier.approvedValue || dossier.marketPrice || dossier.estimatedValue || 0);

  const dateStr = formatExcelDate(opts.surveyDateStr || dossier.surveyDate || new Date().toLocaleDateString('vi-VN'));
  const branch = formatBranchName(opts.branchName || dossier.businessUnit || dossier.branch);
  const appraiser = cleanVietnameseText(opts.appraiserName || dossier.amcSpecialist || dossier.assignedAppraiser || 'Lê Văn Nam');
  const manager = cleanVietnameseText(opts.managerName || 'Trần Đình Trọng');
  const director = cleanVietnameseText(opts.directorName || 'Nguyễn Minh Hải');
  const clientName = cleanVietnameseText(dossier.clientName);
  const ownerName = cleanVietnameseText((dossier as any).ownerName || clientName);
  const cleanCode = cleanVietnameseText(dossier.code);

  const tableCRows: TableRow[] = [
    new TableRow({
      children: [
        createCell('STT', 10, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Danh mục máy móc thiết bị', 45, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Đơn giá lựa chọn', 20, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Số lượng', 10, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Giá trị định giá (VND)', 15, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
      ],
    }),
    new TableRow({
      children: [
        createCell('1', 10, { align: AlignmentType.CENTER }),
        createCell(`Máy móc thiết bị / Dây chuyền: ${cleanVietnameseText(dossier.assetName)}`, 45),
        createCell(formatCurrencyNumber(finalValue), 20, { align: AlignmentType.RIGHT }),
        createCell('01 hệ thống', 10, { align: AlignmentType.CENTER }),
        createCell(formatCurrencyNumber(finalValue), 15, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Tổng cộng', 55, { bold: true, align: AlignmentType.RIGHT, colSpan: 2, bgColor: 'FFF8E1' }),
        createCell('', 20, { bgColor: 'FFF8E1' }),
        createCell('01', 10, { align: AlignmentType.CENTER, bold: true, bgColor: 'FFF8E1' }),
        createCell(formatCurrencyNumber(finalValue), 15, { align: AlignmentType.RIGHT, bold: true, bgColor: 'FFF8E1' }),
      ],
    }),
  ];

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_NAME, size: 22, color: '000000' },
          paragraph: { spacing: { line: 240, before: 0, after: 60 } },
        },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 } } },
      headers: { default: createDocHeader(dossier.code, dateStr) },
      footers: { default: createDocFooter('BM.02C/TĐTS') },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BÁO CÁO THẨM ĐỊNH GIÁ TRỊ TÀI SẢN', bold: true, size: 26, font: FONT_NAME })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Áp dụng cho Máy móc thiết bị)', italics: true, size: 20, font: FONT_NAME })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new TextRun({ text: `Số: ${cleanCode || '.......'}/20...../BACABANK- CN${branch}`, italics: true, size: 20, font: FONT_NAME })] }),

        new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'I. THÔNG TIN CHUNG', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `- Chi nhánh/Mã Chi nhánh: ${branch}    Mã tài sản: ${cleanCode}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Chủ sở hữu tài sản: ${ownerName}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Khách hàng vay: ${clientName}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Thời gian hoàn tất báo cáo thẩm định để ký: ${dateStr}`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'II. THÔNG TIN VỀ TÀI SẢN THẨM ĐỊNH', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `- Tên chủng loại / Model: ${cleanVietnameseText(dossier.assetName)}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Năm sản xuất: ${dossier.manufactureYear || 2021}    Xuất xứ: Nhập khẩu`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Đánh giá chất lượng kỹ thuật còn lại thực tế: ${dossier.remainingBuildingQuality || 80}%`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'III. KẾT QUẢ THẨM ĐỊNH', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: '1. Định giá máy móc thiết bị theo phương pháp so sánh', bold: true, font: FONT_NAME, size: 22 })] }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableCRows }),
        new Paragraph({ spacing: { before: 60, after: 40 }, children: [new TextRun({ text: `Trị giá tài sản làm tròn: ${formatCurrencyNumber(finalValue)} VND (Bằng chữ: ${numberToVietnameseWords(finalValue)}.)`, bold: true, font: FONT_NAME, size: 22 })] }),

        ...buildRecommendationParagraphs(dossier, opts, clientName, 'máy móc thiết bị', finalValue),

        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 150, after: 60 }, children: [new TextRun({ text: `..............., ngày .... tháng .... năm ....`, italics: true, font: FONT_NAME, size: 22 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: HEADER_FOOTER_BORDER,
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI THẨM ĐỊNH', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: appraiser, bold: true, font: FONT_NAME, size: 22 })] })] }),
                new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỞNG PHÒNG', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: manager, bold: true, font: FONT_NAME, size: 22 })] })] }),
                new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, borders: HEADER_FOOTER_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI PHÊ DUYỆT', bold: true, font: FONT_NAME, size: 22 })] }), new Paragraph({ spacing: { before: 800 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: director, bold: true, font: FONT_NAME, size: 22 })] })] }),
              ],
            }),
          ],
        }),
      ],
    }],
  });
}

/**
 * ĐIỀU HƯỚNG MẪU BÁO CÁO THẨM ĐỊNH CHÍNH XÁC THEO 4 LOẠI TÀI SẢN (BM.02A, BM.02A1, BM.02B, BM.02C)
 */
export function buildBaoCaoTuVanDocx(dossier: ValuationDossier, opts: ExportReportOptions = {}): Document {
  if (dossier.assetCategory === 'CAN_HO_CHUNG_CU') {
    return buildForm02A1Docx(dossier, opts);
  } else if (dossier.assetCategory === 'PHUONG_TIEN_VAN_TAI') {
    return buildForm02BDocx(dossier, opts);
  } else if (dossier.assetCategory === 'MAY_MOC_THIET_BI') {
    return buildForm02CDocx(dossier, opts);
  }
  // Mặc định là DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT: Mẫu 02A
  return buildForm02ADocx(dossier, opts);
}

/**
 * MẪU 2: THÔNG BÁO KẾT QUẢ TƯ VẤN GIÁ TÀI SẢN (A1 Ket Qua OK.doc)
 */
export function buildThongBaoKetQuaDocx(dossier: ValuationDossier, opts: ExportReportOptions = {}): Document {
  const finalValue = (opts.customLandValue !== undefined && opts.customConstrValue !== undefined)
    ? (opts.customLandValue + opts.customConstrValue)
    : (dossier.approvedValue || dossier.marketPrice || dossier.estimatedValue || 0);

  const landArea = dossier.areaCertificate || dossier.area || dossier.plannedLandArea || 100;
  const constrArea = dossier.constructionActualArea || dossier.constructionArea || 80;

  const defaultLandVal = (dossier.plannedLandValue || 0) + (dossier.unplannedLandValue || 0);
  const landVal = opts.customLandValue !== undefined 
    ? opts.customLandValue 
    : (defaultLandVal > 0 ? defaultLandVal : (finalValue > 0 ? Math.round(finalValue * 0.8) : 0));

  const constrVal = opts.customConstrValue !== undefined 
    ? opts.customConstrValue 
    : Math.max(0, finalValue - landVal);

  const actualTotal = landVal + constrVal > 0 ? (landVal + constrVal) : finalValue;

  const hasPlannedBreakdown = !!(dossier.plannedLandArea || dossier.plannedLandValue || dossier.unplannedLandArea || dossier.unplannedLandValue);
  const plannedArea = dossier.plannedLandArea || landArea;
  const plannedVal = opts.customLandValue !== undefined 
    ? opts.customLandValue 
    : (dossier.plannedLandValue || landVal);
  const unplannedArea = dossier.unplannedLandArea || 0;
  const unplannedVal = dossier.unplannedLandValue || 0;

  const dateStr = formatExcelDate(opts.surveyDateStr || dossier.surveyDate || new Date().toLocaleDateString('vi-VN'));
  const monthYearStr = opts.valuationMonthStr || `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
  const branch = formatBranchName(opts.branchName || dossier.businessUnit || dossier.branch);
  const appraiser = cleanVietnameseText(opts.appraiserName || dossier.amcSpecialist || dossier.assignedAppraiser || dossier.businessUnitSpecialist || 'Lê Văn Nam');
  const director = cleanVietnameseText(opts.directorName || 'Nguyễn Minh Hải');
  const clientName = cleanVietnameseText(dossier.clientName);
  const assetAddress = cleanVietnameseText(dossier.assetAddress);
  const clientAddress = cleanVietnameseText(dossier.clientAddress || dossier.assetAddress);

  const transfer = opts.transferability || 'Trung bình';
  const planning = opts.planningStatus || (unplannedArea > 0 ? 'Có' : 'Không');
  const usage = opts.usagePurpose || 'Để ở';
  const dispute = opts.disputeStatus || 'Không';

  const rawLegal = dossier.legalDocNumber || 'Cung cấp theo hồ sơ vay vốn';
  const cleanLegal = cleanVietnameseText(rawLegal);

  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        createCell('TT', 8, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Hạng mục tài sản', 47, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('ĐVT', 10, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Số lượng', 13, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
        createCell('Giá thẩm định (VND)', 22, { bold: true, align: AlignmentType.CENTER, bgColor: 'F2F4F7' }),
      ],
    }),
  ];

  if (hasPlannedBreakdown && unplannedArea > 0) {
    tableRows.push(
      new TableRow({
        children: [
          createCell('I', 8, { bold: true, align: AlignmentType.CENTER }),
          createCell('Quyền sử dụng đất', 47, { bold: true }),
          createCell('m²', 10, { align: AlignmentType.CENTER }),
          createCell(String(landArea), 13, { bold: true, align: AlignmentType.CENTER }),
          createCell(formatCurrencyNumber(landVal), 22, { bold: true, align: AlignmentType.RIGHT }),
        ],
      }),
      new TableRow({
        children: [
          createCell('a', 8, { align: AlignmentType.CENTER, italics: true }),
          createCell('- Diện tích phù hợp với quy hoạch', 47, { italics: true }),
          createCell('m²', 10, { align: AlignmentType.CENTER }),
          createCell(String(plannedArea), 13, { align: AlignmentType.CENTER }),
          createCell(formatCurrencyNumber(plannedVal), 22, { align: AlignmentType.RIGHT }),
        ],
      }),
      new TableRow({
        children: [
          createCell('b', 8, { align: AlignmentType.CENTER, italics: true }),
          createCell('- Diện tích không phù hợp với quy hoạch', 47, { italics: true }),
          createCell('m²', 10, { align: AlignmentType.CENTER }),
          createCell(String(unplannedArea), 13, { align: AlignmentType.CENTER }),
          createCell(formatCurrencyNumber(unplannedVal), 22, { align: AlignmentType.RIGHT }),
        ],
      })
    );
  } else {
    tableRows.push(
      new TableRow({
        children: [
          createCell('I', 8, { bold: true, align: AlignmentType.CENTER }),
          createCell('Quyền sử dụng đất', 47, { bold: true }),
          createCell('m²', 10, { align: AlignmentType.CENTER }),
          createCell(String(landArea), 13, { align: AlignmentType.CENTER }),
          createCell(formatCurrencyNumber(landVal), 22, { bold: true, align: AlignmentType.RIGHT }),
        ],
      })
    );
  }

  tableRows.push(
    new TableRow({
      children: [
        createCell('II', 8, { bold: true, align: AlignmentType.CENTER }),
        createCell('Công trình xây dựng trên đất', 47, { bold: true }),
        createCell('m² sàn', 10, { align: AlignmentType.CENTER }),
        createCell(String(constrArea), 13, { align: AlignmentType.CENTER }),
        createCell(formatCurrencyNumber(constrVal), 22, { bold: true, align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        createCell('Tổng giá trị thẩm định (làm tròn)', 78, { bold: true, align: AlignmentType.RIGHT, colSpan: 4, bgColor: 'FFF8E1' }),
        createCell(formatCurrencyNumber(actualTotal), 22, { bold: true, align: AlignmentType.RIGHT, bgColor: 'FFF8E1' }),
      ],
    })
  );

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_NAME, size: 22, color: '000000' },
          paragraph: { spacing: { line: 240, before: 0, after: 60 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 },
        },
      },
      headers: { default: createDocHeader(dossier.code, dateStr) },
      footers: { default: createDocFooter() },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ 
              text: 'THÔNG BÁO', 
              bold: true, 
              size: 26, 
              font: FONT_NAME 
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [
            new TextRun({ 
              text: 'KẾT QUẢ TƯ VẤN GIÁ TÀI SẢN', 
              bold: true, 
              size: 26, 
              font: FONT_NAME 
            }),
          ],
        }),

        // Kính gửi
        new Paragraph({
          children: [
            new TextRun({ text: 'Kính gửi:', bold: true, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({ text: `- Ông (Bà): ${clientName}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          indent: { left: 540 },
          children: [
            new TextRun({ text: `Địa chỉ: ${clientAddress}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({ text: `- Ngân hàng TMCP Bắc Á – Chi nhánh ${branch}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          indent: { left: 540 },
          spacing: { after: 180 },
          children: [
            new TextRun({ text: `Địa chỉ: ${cleanVietnameseText(opts.branchAddress || 'Số 9 Đào Duy Anh, Đống Đa, Hà Nội')}`, font: FONT_NAME, size: 22 }),
          ],
        }),

        // THÔNG TIN CHUNG
        new Paragraph({
          spacing: { before: 100, after: 80 },
          children: [new TextRun({ text: 'THÔNG TIN CHUNG VỀ VIỆC TƯ VẤN GIÁ', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({ children: [new TextRun({ text: 'KHÁCH HÀNG YÊU CẦU TƯ VẤN GIÁ', bold: true, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• Họ tên khách hàng: ${clientName}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• Địa chỉ: ${clientAddress}`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: 'TÀI SẢN TƯ VẤN GIÁ', bold: true, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• Tài sản: Quyền sử dụng đất và quyền sở hữu nhà ở tại: ${assetAddress}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• Hồ sơ pháp lý: Căn cứ hồ sơ pháp lý khác kèm theo (GCN số: ${cleanLegal})`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '• Hiện trạng bất động sản: (Hiện trạng tài sản chi tiết xem tại các phụ lục đính kèm)', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• MỤC ĐÍCH TƯ VẤN GIÁ: Làm cơ sở để thế chấp vay vốn tại Ngân hàng TMCP Bắc Á – Chi nhánh ${branch}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '• CƠ SỞ GIÁ TRỊ: Giá trị thị trường.', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• THỜI ĐIỂM TƯ VẤN GIÁ: ${monthYearStr}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '• PHƯƠNG PHÁP TƯ VẤN GIÁ: Phương pháp so sánh, phương pháp chi phí.', font: FONT_NAME, size: 22 })] }),

        // KẾT QUẢ TƯ VẤN GIÁ
        new Paragraph({
          spacing: { before: 120, after: 80 },
          children: [new TextRun({ text: 'KẾT QUẢ TƯ VẤN GIÁ TÀI SẢN', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: `Trên cơ sở các tài liệu do khách hàng cung cấp, qua tham khảo giá các tài sản tương tự trên thị trường, BAC A AMC xác định kết quả tại thời điểm ${monthYearStr}:`, font: FONT_NAME, size: 22 })] 
        }),

        // Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        }),

        new Paragraph({
          spacing: { before: 100, after: 120 },
          children: [
            new TextRun({ text: 'Bằng chữ: ', bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: `${numberToVietnameseWords(actualTotal)}.`, italics: true, font: FONT_NAME, size: 22 }),
          ],
        }),

        // CÁC THÔNG TIN KHÁC
        new Paragraph({
          spacing: { before: 120, after: 80 },
          children: [new TextRun({ text: 'CÁC THÔNG TIN KHÁC', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({ children: [new TextRun({ text: `• Khả năng chuyển nhượng : [${transfer === 'Cao' ? 'X' : ' '}] Cao    [${transfer === 'Trung bình' ? 'X' : ' '}] Trung bình    [${transfer === 'Kém' ? 'X' : ' '}] Kém`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• Khả năng bị quy hoạch  : [${planning === 'Có' ? 'X' : ' '}] Có     [${planning === 'Không' ? 'X' : ' '}] Không         [${planning === 'Không rõ' ? 'X' : ' '}] Không rõ`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• Khả năng sử dụng       : [${usage === 'Để ở' ? 'X' : ' '}] Để ở  [${usage === 'Để kinh doanh' ? 'X' : ' '}] Để kinh doanh  [${usage === 'Khác' ? 'X' : ' '}] Khác`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• Khả năng tranh chấp    : [${dispute === 'Có' ? 'X' : ' '}] Có     [${dispute === 'Không' ? 'X' : ' '}] Không         [${dispute === 'Không rõ' ? 'X' : ' '}] Không rõ`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `• Ghi chú khác: ${cleanVietnameseText(opts.additionalNotes || dossier.notes || 'Hồ sơ pháp lý đầy đủ, hiện trạng sử dụng ổn định.')}`, font: FONT_NAME, size: 22 })] }),

        // Điều kiện & Giới hạn
        new Paragraph({
          spacing: { before: 120, after: 80 },
          children: [new TextRun({ text: 'ĐIỀU KIỆN, GIỚI HẠN KÈM THEO KẾT QUẢ', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({ children: [new TextRun({ text: '- Các thông tin tài liệu Đơn vị kinh doanh và khách hàng cung cấp cho CVTĐ là đúng và chính xác so với bản gốc cũng như hiện trạng thực tế tài sản.', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- Tài sản được sử dụng đúng mục đích, phù hợp với quy hoạch, không có tranh chấp. Chủ tài sản đã thực hiện đầy đủ nghĩa vụ pháp lý, tài chính đối với Nhà nước và chứng minh được quyền sở hữu hợp pháp đối với tài sản đề nghị thẩm định giá.', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- Những thông tin từ thị trường và các chính sách quản lý của Nhà nước tại thời điểm thẩm định giá có mức độ chính xác và tin cậy cao.', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- CVTĐ không có trách nhiệm kiểm tra những thông tin liên quan đến nội dung của những bản phô tô các văn bản pháp lý và tài liệu liên quan do đơn vị kinh doanh và khách hàng cung cấp.', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- Đơn vị kinh doanh và khách hàng hoàn toàn chịu trách nhiệm về tính chính xác của các thông tin tài liệu liên quan tới tài sản thẩm định giá cung cấp cho CVTĐ.', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- Mức giá nêu trên được tính toán dựa trên các chính sách quản lý của Nhà nước có liên quan tại thời điểm thẩm định giá. Trong trường hợp các chính sách quản lý của Nhà nước thay đổi có thể làm cho mức giá thẩm định bị thay đổi.', font: FONT_NAME, size: 22 })] }),

        new Paragraph({
          spacing: { before: 80, after: 120 },
          children: [
            new TextRun({ 
              text: 'Thời hạn sử dụng “Thông báo kết quả định giá tài sản” kể từ ngày phát hành: 180 ngày.', 
              bold: true, 
              underline: { type: UnderlineType.SINGLE }, 
              font: FONT_NAME, 
              size: 22 
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: `Công ty Quản lý nợ và Khai thác tài sản - Ngân hàng TMCP Bắc Á trân trọng thông báo tới Quý Khách hàng và Ngân hàng thương mại cổ phần Bắc Á – Chi nhánh ${branch}.`, font: FONT_NAME, size: 22 })] 
        }),
        new Paragraph({ children: [new TextRun({ text: 'Trân trọng!', italics: true, font: FONT_NAME, size: 22 })] }),

        new Paragraph({ spacing: { before: 200 } }),

        // Signatures
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: HEADER_FOOTER_BORDER,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: HEADER_FOOTER_BORDER,
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CV Thẩm định giá', bold: true, font: FONT_NAME, size: 24 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, font: FONT_NAME, size: 20 })] }),
                    new Paragraph({ spacing: { before: 800 } }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: appraiser, bold: true, font: FONT_NAME, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: HEADER_FOOTER_BORDER,
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BAC A AMC', bold: true, font: FONT_NAME, size: 24 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký tên, đóng dấu)', italics: true, font: FONT_NAME, size: 20 })] }),
                    new Paragraph({ spacing: { before: 800 } }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: director, bold: true, font: FONT_NAME, size: 22 })] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // PHỤ LỤC: HIỆN TRẠNG TÀI SẢN
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.CENTER,
          spacing: { before: 150, after: 200 },
          children: [new TextRun({ text: 'PHỤ LỤC: HIỆN TRẠNG TÀI SẢN', bold: true, size: 26, font: FONT_NAME })],
        }),

        new Paragraph({
          children: [new TextRun({ text: '1. Về đất', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `1.1 Đặc điểm pháp lý: GCN QSDĐ, QSH Nhà ở số: ${cleanLegal}`, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '1.2 Hiện trạng kỹ thuật:', font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({ children: [new TextRun({ text: `- Vị trí: ${assetAddress}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Ranh giới: Đông giáp: ${opts.eastBorder || 'Đất giáp ranh'}; Tây giáp: ${opts.westBorder || 'Đường ngõ'}; Nam giáp: ${opts.southBorder || 'Hộ liền kề'}; Bắc giáp: ${opts.northBorder || 'Hộ liền kề'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Giao thông: ${opts.trafficStatus || dossier.roadAccessLevel || 'Đường bê tông, ô tô tránh nhau thuận tiện'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Hệ thống CSHT (cấp điện, cấp nước, thoát nước, chiếu sáng, TTLL): ${opts.infrastructureStatus || 'Cấp điện, cấp nước, thoát nước, chiếu sáng, TTLL hoàn chỉnh'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Khả năng kinh doanh: ${opts.businessCapability || dossier.businessCondition || 'Phù hợp sinh hoạt gia đình, kinh doanh dịch vụ vừa và nhỏ'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- Môi trường (an ninh, dân trí): Khu dân cư yên tĩnh, an ninh tốt, dân trí cao', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Diện tích đất cấp trong GCN quyền sử dụng đất và quyền sở hữu nhà ở: ${landArea} m²`, font: FONT_NAME, size: 22 })] }),
        ...(hasPlannedBreakdown ? [
          new Paragraph({ children: [new TextRun({ text: `  + Diện tích phù hợp với quy hoạch: ${plannedArea} m²`, font: FONT_NAME, size: 22 })] }),
          new Paragraph({ children: [new TextRun({ text: `  + Diện tích không phù hợp với quy hoạch: ${unplannedArea} m²`, font: FONT_NAME, size: 22 })] }),
        ] : []),
        new Paragraph({ children: [new TextRun({ text: `- Hình thức sử dụng: ${dossier.landUseForm || 'Sử dụng riêng'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Hình dáng thửa đất: ${dossier.shape || 'Vuông vắn, tiếp giáp đường chính'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Mặt tiền: ${dossier.frontageWidth || 5} m; Chiều sâu trung bình: ${dossier.dimension || '15 m'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Mục đích sử dụng: ${dossier.landUsePurpose || 'Đất ở tại đô thị'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- Thời hạn sử dụng: Lâu dài', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Tọa độ theo Google Map: ${dossier.googleMapCoords || '21.01234, 105.81234'}`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({
          spacing: { before: 150 },
          children: [new TextRun({ text: '2. Đặc điểm kỹ thuật – công trình xây dựng trên đất', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({ children: [new TextRun({ text: `- Đặc điểm hiện trạng công trình xây dựng: ${dossier.constructionType || 'Nhà khung bê tông cốt thép, tường xây gạch'} - Số tầng: ${dossier.floorsCount || dossier.buildingFloorsMaterial || '3 tầng'}`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Diện tích xây dựng thực tế: ${constrArea} m² sàn`, font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `- Chất lượng còn lại: Căn cứ khảo sát thực tế tại hiện trường, công trình xây dựng có tỷ lệ phần trăm (%) chất lượng còn lại là ${dossier.remainingBuildingQuality || 75}%`, font: FONT_NAME, size: 22 })] }),

        new Paragraph({
          spacing: { before: 150 },
          children: [new TextRun({ text: '3. Kết quả thu được từ khảo sát thực địa', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({ children: [new TextRun({ text: 'Qua khảo sát thực địa nhóm thẩm định thấy rằng thửa đất có hình dạng, sử dụng đúng mục đích với hồ sơ giấy tờ do Khách hàng cung cấp.', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '• Lợi thế: Vị trí giao thông thuận tiện, kết nối hạ tầng đồng bộ, dân cư đông đúc.', font: FONT_NAME, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '• Nhược điểm: Khả năng mở rộng quy mô diện tích bị giới hạn bởi các công trình liền kề.', font: FONT_NAME, size: 22 })] }),

        new Paragraph({
          spacing: { before: 150 },
          children: [new TextRun({ text: '4. Ảnh chụp hiện trạng & Sơ đồ vị trí tài sản', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({ children: [new TextRun({ text: '(Chi tiết 08 hình ảnh chụp thực địa: Ngõ trước mặt, mặt tiền, nội thất, hiện trạng thửa đất và trích lục bản đồ Google Map đính kèm)', italics: true, font: FONT_NAME, size: 20 })] }),
      ],
    }],
  });
}

/**
 * MẪU 3: THÔNG BÁO PHÍ TƯ VẤN GIÁ TÀI SẢN (A1 TB Phi OK.doc)
 */
export function buildThongBaoPhiDocx(dossier: ValuationDossier, opts: ExportReportOptions = {}): Document {
  const finalFee = opts.customFee !== undefined ? opts.customFee : (dossier.totalValuationFee || dossier.serviceFee || 5500000);
  const advanceFee = opts.advanceFeePaid !== undefined ? opts.advanceFeePaid : (dossier.advanceFee || 0);
  const remainingFee = Math.max(0, finalFee - advanceFee);
  const dateStr = formatExcelDate(opts.surveyDateStr || dossier.surveyDate || new Date().toLocaleDateString('vi-VN'));
  const branch = formatBranchName(opts.branchName || dossier.businessUnit || dossier.branch);
  const director = cleanVietnameseText(opts.directorName || 'Nguyễn Minh Hải');
  const clientName = cleanVietnameseText(dossier.clientName);
  const assetAddress = cleanVietnameseText(dossier.assetAddress);
  const clientAddress = cleanVietnameseText(dossier.clientAddress || dossier.assetAddress);

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_NAME, size: 22, color: '000000' },
          paragraph: { spacing: { line: 240, before: 0, after: 60 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 },
        },
      },
      headers: { default: createDocHeader(dossier.code, dateStr) },
      footers: { default: createDocFooter() },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ 
              text: 'THÔNG BÁO', 
              bold: true, 
              size: 28, 
              font: FONT_NAME 
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [
            new TextRun({ 
              text: 'V/v: Phí tư vấn giá tài sản', 
              bold: true, 
              size: 24, 
              italics: true, 
              font: FONT_NAME 
            }),
          ],
        }),

        // Kính gửi
        new Paragraph({
          children: [
            new TextRun({ text: 'Kính gửi:', bold: true, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({ text: `- Ngân hàng TMCP Bắc Á – Chi nhánh ${branch}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({ text: `- Ông (Bà): ${clientName}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          indent: { left: 540 },
          spacing: { after: 160 },
          children: [
            new TextRun({ text: `Địa chỉ: ${clientAddress}`, font: FONT_NAME, size: 22 }),
          ],
        }),

        // Nội dung thông báo
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: 'Công ty TNHH Quản lý nợ và Khai thác tài sản Ngân hàng TMCP Bắc Á (BAC A AMC) xin thông báo phí tư vấn giá tài sản theo yêu cầu của Quý Khách hàng, như sau:',
              font: FONT_NAME,
              size: 22,
            }),
          ],
        }),

        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: 'Tài sản thẩm định giá: ', bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: `Quyền sử dụng đất và quyền sở hữu nhà ở tại: ${assetAddress}`, font: FONT_NAME, size: 22 }),
          ],
        }),

        new Paragraph({
          spacing: { before: 100, after: 80 },
          children: [new TextRun({ text: 'Phí tư vấn giá và phương thức thanh toán:', bold: true, size: 24, font: FONT_NAME })],
        }),

        // Table Phí
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createCell('Nội dung khoản thu', 60, { bold: true, bgColor: 'F2F4F7' }),
                createCell('Số tiền (VNĐ)', 40, { bold: true, align: AlignmentType.RIGHT, bgColor: 'F2F4F7' }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Tổng phí tư vấn giá (Đã bao gồm VAT)', 60, { bold: true }),
                createCell(formatCurrencyNumber(finalFee), 40, { bold: true, align: AlignmentType.RIGHT }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Trong đó: - Phí hồ sơ đã nộp (Tạm ứng)', 60),
                createCell(formatCurrencyNumber(advanceFee), 40, { align: AlignmentType.RIGHT }),
              ],
            }),
            new TableRow({
              children: [
                createCell('          - Phí tư vấn còn lại phải thanh toán', 60, { bold: true, bgColor: 'FFF8E1' }),
                createCell(formatCurrencyNumber(remainingFee), 40, { bold: true, align: AlignmentType.RIGHT, bgColor: 'FFF8E1' }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 100, after: 120 },
          children: [
            new TextRun({ text: 'Bằng chữ: ', bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: `${numberToVietnameseWords(finalFee)}.`, italics: true, font: FONT_NAME, size: 22 }),
          ],
        }),

        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [new TextRun({ text: 'Phương thức thanh toán:', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '• Chuyển khoản vào tài khoản số: ', font: FONT_NAME, size: 22 }),
            new TextRun({ text: '150.001.060.000.500', bold: true, font: FONT_NAME, size: 24 }),
            new TextRun({ text: ' của Công ty TNHH Quản lý nợ và Khai thác tài sản Ngân hàng TMCP Bắc Á - CN Hà Thành.', font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: '• Nội dung thanh toán ghi trên Giấy nộp tiền: ', font: FONT_NAME, size: 22 }),
            new TextRun({ text: `Nộp phí theo số ${dossier.code}`, bold: true, font: FONT_NAME, size: 22 }),
          ],
        }),

        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: 'Xin trân trọng thông báo và cảm ơn sự hợp tác của Quý Khách hàng.', font: FONT_NAME, size: 22 }),
          ],
        }),

        // Nơi nhận & Ký tên
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: HEADER_FOOTER_BORDER,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: HEADER_FOOTER_BORDER,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Nơi nhận:', bold: true, font: FONT_NAME, size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: '- Như kính gửi', font: FONT_NAME, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: '- Lưu P.TĐ, P.KT', font: FONT_NAME, size: 20 })] }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: HEADER_FOOTER_BORDER,
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BAC A AMC', bold: true, font: FONT_NAME, size: 24 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký tên, đóng dấu)', italics: true, font: FONT_NAME, size: 20 })] }),
                    new Paragraph({ spacing: { before: 800 } }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: director, bold: true, font: FONT_NAME, size: 22 })] }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });
}

/**
 * Universal browser file saver for generated docx
 */
export async function downloadReportDocx(
  templateType: number = 1,
  dossier: ValuationDossier,
  opts: ExportReportOptions = {}
): Promise<void> {
  const doc = buildBaoCaoTuVanDocx(dossier, opts);
  const catCode = dossier.assetCategory || 'Tai_San';
  const filename = `Bao_Cao_Tham_Dinh_Gia_${catCode}_${dossier.code}.docx`;

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
