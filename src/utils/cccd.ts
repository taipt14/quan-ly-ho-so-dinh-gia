import jsQR from 'jsqr';
import { ExtractedOcrData } from '../components/DocumentOcrScannerModal';

// Danh mục 63 mã tỉnh/thành phố theo quy chuẩn Căn cước công dân Bộ Công An
export const CCCD_PROVINCES: Record<string, string> = {
  '001': 'Hà Nội',
  '002': 'Hà Giang',
  '004': 'Cao Bằng',
  '006': 'Bắc Kạn',
  '008': 'Tuyên Quang',
  '010': 'Lào Cai',
  '011': 'Điện Biên',
  '012': 'Lai Châu',
  '014': 'Sơn La',
  '015': 'Yên Bái',
  '017': 'Hòa Bình',
  '019': 'Thái Nguyên',
  '020': 'Lạng Sơn',
  '022': 'Quảng Ninh',
  '024': 'Bắc Giang',
  '025': 'Phú Thọ',
  '026': 'Vĩnh Phúc',
  '027': 'Bắc Ninh',
  '030': 'Hải Dương',
  '031': 'Hải Phòng',
  '033': 'Hưng Yên',
  '034': 'Thái Bình',
  '035': 'Hà Nam',
  '036': 'Nam Định',
  '037': 'Ninh Bình',
  '038': 'Thanh Hóa',
  '040': 'Nghệ An',
  '042': 'Hà Tĩnh',
  '044': 'Quảng Bình',
  '045': 'Quảng Trị',
  '046': 'Thừa Thiên Huế',
  '048': 'Đà Nẵng',
  '049': 'Quảng Nam',
  '051': 'Quảng Ngãi',
  '052': 'Bình Định',
  '054': 'Phú Yên',
  '056': 'Khánh Hòa',
  '058': 'Ninh Thuận',
  '060': 'Bình Thuận',
  '062': 'Kon Tum',
  '064': 'Gia Lai',
  '066': 'Đắk Lắk',
  '067': 'Đắk Nông',
  '068': 'Lâm Đồng',
  '070': 'Bình Phước',
  '072': 'Tây Ninh',
  '074': 'Bình Dương',
  '075': 'Đồng Nai',
  '077': 'Bà Rịa - Vũng Tàu',
  '079': 'TP. Hồ Chí Minh',
  '080': 'Long An',
  '082': 'Tiền Giang',
  '083': 'Bến Tre',
  '084': 'Trà Vinh',
  '086': 'Vĩnh Long',
  '087': 'Đồng Tháp',
  '089': 'An Giang',
  '091': 'Kiên Giang',
  '092': 'Cần Thơ',
  '093': 'Hậu Giang',
  '094': 'Sóc Trăng',
  '095': 'Bạc Liêu',
  '096': 'Cà Mau'
};

// Chuẩn hóa và khắc phục các ký tự nhận dạng sai phổ biến trong OCR số CCCD
export function cleanCccdDigits(raw: string): string {
  if (!raw) return '';
  let cleaned = String(raw).trim().toUpperCase();

  // Khắc phục các ký tự OCR nhận nhầm phổ biến:
  cleaned = cleaned
    .replace(/[OODQ]/g, '0')
    .replace(/[IL|]/g, '1')
    .replace(/[Z]/g, '2')
    .replace(/[S]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/[^0-9]/g, '');

  // Nếu bị rớt số 0 ở đầu (11 chữ số):
  if (cleaned.length === 11) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

export interface CccdInspectionResult {
  isValid: boolean;
  length: number;
  formatted: string;
  provinceCode?: string;
  provinceName?: string;
  genderCenturyCode?: string;
  genderDescription?: string;
  yearDigits?: string;
  randomDigits?: string;
  hasDobMismatch?: boolean;
  suggestedYearDigits?: string;
  hasGenderMismatch?: boolean;
  suggestedGenderDigit?: string;
}

// Phân tích chi tiết cấu trúc 12 số CCCD
export function inspectCccdNumber(
  cccdRaw: string,
  birthDate?: string,
  gender?: string
): CccdInspectionResult {
  const digits = cleanCccdDigits(cccdRaw);
  const length = digits.length;

  if (length !== 12) {
    return {
      isValid: false,
      length,
      formatted: digits
    };
  }

  const pCode = digits.slice(0, 3);
  const gCode = digits.slice(3, 4);
  const yDigits = digits.slice(4, 6);
  const rDigits = digits.slice(6, 12);

  const provinceName = CCCD_PROVINCES[pCode] || 'Mã tỉnh: ' + pCode;

  let genderDesc = '';
  switch (gCode) {
    case '0': genderDesc = 'Nam (sinh 1900-1999)'; break;
    case '1': genderDesc = 'Nữ (sinh 1900-1999)'; break;
    case '2': genderDesc = 'Nam (sinh 2000-2099)'; break;
    case '3': genderDesc = 'Nữ (sinh 2000-2099)'; break;
    default: genderDesc = 'Mã thế kỷ/giới tính: ' + gCode; break;
  }

  let hasDobMismatch = false;
  let suggestedYearDigits: string | undefined;
  let hasGenderMismatch = false;
  let suggestedGenderDigit: string | undefined;

  if (birthDate) {
    const dobMatch = birthDate.match(/(\d{4})/);
    if (dobMatch) {
      const birthYear = parseInt(dobMatch[1], 10);
      const expectedYDigits = String(birthYear % 100).padStart(2, '0');

      if (yDigits !== expectedYDigits) {
        hasDobMismatch = true;
        suggestedYearDigits = expectedYDigits;
      }

      const isFemale = gender && /nữ|nu|female/i.test(gender);
      const isMale = gender && /nam|male/i.test(gender);

      let expectedG = '';
      if (birthYear >= 1900 && birthYear <= 1999) {
        if (isMale) expectedG = '0';
        if (isFemale) expectedG = '1';
      } else if (birthYear >= 2000 && birthYear <= 2099) {
        if (isMale) expectedG = '2';
        if (isFemale) expectedG = '3';
      }

      if (expectedG && gCode !== expectedG) {
        hasGenderMismatch = true;
        suggestedGenderDigit = expectedG;
      }
    }
  }

  return {
    isValid: true,
    length: 12,
    formatted: `${pCode} ${gCode} ${yDigits} ${rDigits}`,
    provinceCode: pCode,
    provinceName,
    genderCenturyCode: gCode,
    genderDescription: genderDesc,
    yearDigits: yDigits,
    randomDigits: rDigits,
    hasDobMismatch,
    suggestedYearDigits,
    hasGenderMismatch,
    suggestedGenderDigit
  };
}

// Bóc tách chuỗi mã QR của Căn cước công dân gắn chip / Căn cước 2024
export function parseCccdQrPayload(raw: string): ExtractedOcrData | null {
  if (!raw || !raw.includes('|')) return null;
  const parts = raw.split('|');

  let cccd = '';
  let name = '';
  let dob = '';
  let gender = '';
  let address = '';
  let issueDate = '';

  for (const p of parts) {
    const trimmed = p.trim();
    if (!cccd && /^\d{12}$/.test(trimmed)) {
      cccd = trimmed;
    } else if (!dob && /^\d{8}$/.test(trimmed)) {
      const d = trimmed.slice(0, 2);
      const m = trimmed.slice(2, 4);
      const y = trimmed.slice(4, 8);
      dob = `${d}/${m}/${y}`;
    } else if (!gender && /^(nam|nữ|nu|male|female)$/i.test(trimmed)) {
      gender = /nữ|nu|female/i.test(trimmed) ? 'Nữ' : 'Nam';
    } else if (!name && /^[A-ZÀ-Ỹ\s]{3,}$/i.test(trimmed) && trimmed.length < 50 && !/\d/.test(trimmed)) {
      name = trimmed.toUpperCase();
    } else if (trimmed.length > 8 && !address) {
      address = trimmed;
    } else if (!issueDate && /^\d{8}$/.test(trimmed)) {
      const d = trimmed.slice(0, 2);
      const m = trimmed.slice(2, 4);
      const y = trimmed.slice(4, 8);
      issueDate = `${d}/${m}/${y}`;
    }
  }

  if (cccd && /^\d{12}$/.test(cccd)) {
    return {
      clientCccd: cccd,
      clientName: name || undefined,
      birthDate: dob || undefined,
      gender: gender || undefined,
      clientAddress: address || undefined,
      issueDate: issueDate || undefined,
      rawText: `[MÃ QR BỘ CÔNG AN ĐÃ GIẢI MÃ]:\nSố CCCD: ${cccd}\nHọ và tên: ${name || 'N/A'}\nNgày sinh: ${dob || 'N/A'}\nGiới tính: ${gender || 'N/A'}\nĐịa chỉ thường trú: ${address || 'N/A'}`
    };
  }

  return null;
}

// Quét mã QR trực tiếp trên Canvas đa tầng (Original, Top-Right Crop, Multi-Scale)
export async function scanCccdQrCode(imageDataUrl: string): Promise<ExtractedOcrData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        if (!origW || !origH) {
          resolve(null);
          return;
        }

        // Tạo canvas
        const canvas = document.createElement('canvas');
        canvas.width = origW;
        canvas.height = origH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }

        // 1. Quét toàn bộ ảnh nguyên bản
        ctx.drawImage(img, 0, 0);
        let imgData = ctx.getImageData(0, 0, origW, origH);
        let qr = jsQR(imgData.data, origW, origH, { inversionAttempts: 'attemptBoth' });

        if (qr && qr.data) {
          const parsed = parseCccdQrPayload(qr.data);
          if (parsed) {
            resolve(parsed);
            return;
          }
        }

        // 2. Quét góc trên bên phải (Nơi đặt mã QR chuẩn trên CCCD Việt Nam)
        const subW = Math.round(origW * 0.55);
        const subH = Math.round(origH * 0.55);
        const subX = Math.round(origW * 0.45);
        const subY = 0;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = subW;
        cropCanvas.height = subH;
        const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
        if (cropCtx) {
          cropCtx.drawImage(canvas, subX, subY, subW, subH, 0, 0, subW, subH);
          const cropData = cropCtx.getImageData(0, 0, subW, subH);
          qr = jsQR(cropData.data, subW, subH, { inversionAttempts: 'attemptBoth' });
          if (qr && qr.data) {
            const parsed = parseCccdQrPayload(qr.data);
            if (parsed) {
              resolve(parsed);
              return;
            }
          }
        }

        // 3. Quét tỷ lệ thu nhỏ nếu ảnh quá lớn (> 1600px)
        if (origW > 1600) {
          const targetW = 1200;
          const targetH = Math.round((origH * 1200) / origW);
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = targetW;
          scaledCanvas.height = targetH;
          const scaledCtx = scaledCanvas.getContext('2d', { willReadFrequently: true });
          if (scaledCtx) {
            scaledCtx.drawImage(img, 0, 0, targetW, targetH);
            const scaledData = scaledCtx.getImageData(0, 0, targetW, targetH);
            qr = jsQR(scaledData.data, targetW, targetH, { inversionAttempts: 'attemptBoth' });
            if (qr && qr.data) {
              const parsed = parseCccdQrPayload(qr.data);
              if (parsed) {
                resolve(parsed);
                return;
              }
            }
          }
        }

        resolve(null);
      } catch (err) {
        console.warn('Lỗi khi quét QR CCCD:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
}
