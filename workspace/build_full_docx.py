import os

generator_code = r'''# -*- coding: utf-8 -*-
import sys

def main():
    # Read original docxExport.ts to get buildThongBaoKetQuaDocx and buildThongBaoPhiDocx
    with open('src/utils/docxExport.ts', 'r', encoding='utf-8') as f:
        orig = f.read()

    tbkq_idx = orig.find('export function buildThongBaoKetQuaDocx')
    if tbkq_idx == -1:
        print("Error: Could not find buildThongBaoKetQuaDocx")
        sys.exit(1)
    
    # Extract the tail from comment before buildThongBaoKetQuaDocx
    comment_idx = orig.rfind('/**', 0, tbkq_idx)
    tail = orig[comment_idx:]

    header_code = """import {
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
"""

    with open('src/utils/docxExport.ts', 'w', encoding='utf-8') as f:
        # Write header, form implementations, and the existing tail
        pass

if __name__ == '__main__':
    main()
'''

with open('workspace/build_full_docx.py', 'w', encoding='utf-8') as f:
    f.write(generator_code)

print("Saved generator helper")
