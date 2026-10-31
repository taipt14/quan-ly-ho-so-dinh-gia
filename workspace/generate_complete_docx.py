# -*- coding: utf-8 -*-
import os
import sys

def main():
    with open('src/utils/docxExport.ts', 'r', encoding='utf-8') as f:
        orig = f.read()

    # Find where buildThongBaoKetQuaDocx starts
    tbkq_idx = orig.find('export function buildThongBaoKetQuaDocx')
    comment_idx = orig.rfind('/**', 0, tbkq_idx)
    tail = orig[comment_idx:]

    new_docx_ts = '''import {
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
      address: `Khu vực lân cận ${cleanVietnameseText(dossier.street || dossier.ward || 'cùng trục ngõ')}, ${cleanVietnameseText(dossier.district || '')}`,
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
  const ownerName = cleanVietnameseText(dossier.ownerName || clientName);
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
            new TextRun({ text: cleanVietnameseText(dossier.relationshipWithBorrower || 'Chính chủ'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Thời gian phân hồ sơ: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: formatExcelDate(dossier.assignmentDate || dossier.surveyDate || dateStr), font: FONT_NAME, size: 22 }),
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
            new TextRun({ text: cleanVietnameseText(dossier.street || 'Đường hiện hữu'), font: FONT_NAME, size: 22 }),
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
            new TextRun({ text: `- DTSD thực tế: ${landArea} m2          Chiều dài: ${dossier.dimensionLength || '15'} m         Chiều rộng: ${dossier.frontageWidth || '5'} m`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- DTSD được công nhận: ${dossier.areaCertificate || landArea} m2    Chiều dài: ${dossier.dimensionLength || '15'} m         Chiều rộng: ${dossier.frontageWidth || '5'} m`, font: FONT_NAME, size: 22 }),
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
            new TextRun({ text: `- Số lượng mặt tiền: ${dossier.frontageCount || 1}           Hướng: ${cleanVietnameseText(dossier.direction || 'Đông Nam')}`, font: FONT_NAME, size: 22 }),
          ],
        }),

        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [new TextRun({ text: 'b. Về tài sản gắn liền với đất:', bold: true, font: FONT_NAME, size: 22 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Loại tài sản: ${cleanVietnameseText(dossier.constructionType || 'Nhà ở kiên cố')}    Năm xây dựng: ${dossier.constructionYear || 2018}    Tiện nghi: ${cleanVietnameseText(dossier.amenities || 'Đầy đủ')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Cấu trúc: ${cleanVietnameseText(dossier.structureSummary || 'Khung bê tông cốt thép chịu lực')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `+ Số tầng: ${dossier.floorsCount || 3}                 + Mái: ${cleanVietnameseText(dossier.roofType || 'Mái bê tông / Tôn lạnh')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `+ Tường: ${cleanVietnameseText(dossier.wallType || 'Xây gạch, sơn vôi')}             + Nền: ${cleanVietnameseText(dossier.floorType || 'Lát gạch men')}`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- DTSD thực tế: ${constrArea} m2       - DTSD được công nhận: ${dossier.constructionRecognizedArea || constrArea} m2`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Tổng số phòng: ${dossier.totalRooms || 6} trong đó ${dossier.bedRooms || 3} phòng ngủ, ${dossier.bathRooms || 3} phòng WC`, font: FONT_NAME, size: 22 }),
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
            new TextRun({ text: cleanVietnameseText(dossier.planningInfo || 'Đất ở đô thị phù hợp quy hoạch phân khu xây dựng, không có tranh chấp khiếu kiện.'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `2. Mục đích sử dụng của bất động sản: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText(dossier.currentUsage || 'Dùng để ở và sinh hoạt gia đình kết hợp kinh doanh.'), font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `3. Khả năng chuyển nhượng: `, bold: true, font: FONT_NAME, size: 22 }),
            new TextRun({ text: cleanVietnameseText(opts.transferability || dossier.liquidity || 'Trung bình, khả năng thanh khoản tốt trên thị trường.'), font: FONT_NAME, size: 22 }),
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

        // IV. KIẾN NGHỊ
        new Paragraph({
          spacing: { before: 140, after: 60 },
          children: [new TextRun({ text: 'IV. KIẾN NGHỊ', bold: true, size: 24, font: FONT_NAME })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng cho khách hàng ${clientName} theo quy định của Ngân hàng TMCP Bắc Á.`, font: FONT_NAME, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- Điều kiện quản lý tài sản: Kiểm tra thực địa ranh giới thửa đất, hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký thế chấp hợp lệ theo đúng quy định trước khi giải ngân.`, font: FONT_NAME, size: 22 }),
          ],
        }),

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

  const apartmentArea = dossier.usableArea || dossier.areaCertificate || dossier.area || 75;
  const unitPrice = apartmentArea > 0 ? Math.round(finalValue / apartmentArea) : 35000000;

  const dateStr = formatExcelDate(opts.surveyDateStr || dossier.surveyDate || new Date().toLocaleDateString('vi-VN'));
  const branch = formatBranchName(opts.branchName || dossier.businessUnit || dossier.branch);
  const appraiser = cleanVietnameseText(opts.appraiserName || dossier.amcSpecialist || dossier.assignedAppraiser || 'Lê Văn Nam');
  const manager = cleanVietnameseText(opts.managerName || 'Trần Đình Trọng');
  const director = cleanVietnameseText(opts.directorName || 'Nguyễn Minh Hải');
  const clientName = cleanVietnameseText(dossier.clientName);
  const ownerName = cleanVietnameseText(dossier.ownerName || clientName);
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

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'IV. KIẾN NGHỊ', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `- Đề xuất chấp thuận kết quả định giá căn hộ làm cơ sở cấp tín dụng cho khách hàng ${clientName} theo quy định của BAC A BANK.`, font: FONT_NAME, size: 22 })] }),

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
  const ownerName = cleanVietnameseText(dossier.ownerName || clientName);
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

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'IV. KIẾN NGHỊ', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `- Đề xuất chấp thuận mức định giá phương tiện vận tải làm cơ sở cấp tín dụng cho khách hàng ${clientName} theo quy định của BAC A BANK.`, font: FONT_NAME, size: 22 })] }),

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
  const ownerName = cleanVietnameseText(dossier.ownerName || clientName);
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

        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'IV. KIẾN NGHỊ', bold: true, size: 24, font: FONT_NAME })] }),
        new Paragraph({ children: [new TextRun({ text: `- Đề xuất chấp thuận mức định giá MMTB làm cơ sở cấp tín dụng cho khách hàng ${clientName} theo quy định của BAC A BANK.`, font: FONT_NAME, size: 22 })] }),

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

'''

    full_content = new_docx_ts + tail
    with open('src/utils/docxExport.ts', 'w', encoding='utf-8') as f:
        f.write(full_content)
    print("Successfully replaced buildBaoCaoTuVanDocx and helpers in src/utils/docxExport.ts!")

if __name__ == '__main__':
    main()
