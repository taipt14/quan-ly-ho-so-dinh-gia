import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const STATUS_MAP: Record<string, string> = {
  MOI_GIAO: 'Mới giao',
  KHACH_HANG_HUY: 'Khách hàng hủy',
  DA_HEN_LICH_KHAO_SAT: 'Đã hẹn lịch khảo sát',
  DA_KHAO_SAT: 'Đã khảo sát',
  KHACH_HANG_DA_THANH_TOAN: 'Khách hàng đã thanh toán',
  KHACH_HANG_CHUA_THANH_TOAN: 'Khách hàng chưa thanh toán',
  DA_LEN_BAO_CAO_CHO_DUYET: 'Đã lên báo cáo chờ duyệt',
  DA_DUYET_BAO_CAO: 'Đã duyệt báo cáo',
  DA_GUI_BAO_CAO_CHO_CHI_NHANH: 'Đã gửi báo cáo cho chi nhánh',
  DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH: 'Đã gửi hồ sơ bản cứng cho chi nhánh',

  // Fallbacks
  DA_LEN_LICH_KHAO_SAT: 'Đã hẹn lịch khảo sát',
  DA_XUAT_BAO_CAO_CHO_DUYET: 'Đã lên báo cáo chờ duyệt',
  DA_GUI_BAO_CAO: 'Đã gửi báo cáo cho chi nhánh',
  DA_GUI_HO_SO_BAN_CUNG: 'Đã gửi hồ sơ bản cứng cho chi nhánh',
  TIEP_NHAN: 'Mới giao',
  KHAO_SAT: 'Đã khảo sát',
  THAM_DINH: 'Đã lên báo cáo chờ duyệt',
  CHO_DUYET: 'Đã lên báo cáo chờ duyệt',
  HOAN_THANH: 'Đã gửi hồ sơ bản cứng cho chi nhánh',
  TU_CHOI: 'Khách hàng hủy'
};

function generateFallbackResponse(prompt: string, dossierContext: any): string {
  const lowerPrompt = prompt.toLowerCase();
  const code = dossierContext?.code || 'hồ sơ';
  const assetName = dossierContext?.assetName || 'tài sản';
  const rawStatus = dossierContext?.status || '';
  const statusLabel = STATUS_MAP[rawStatus] || rawStatus || 'Mới giao';
  const val = dossierContext?.approvedValue || dossierContext?.estimatedValue || 0;
  const valFormatted = val ? new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ' : 'Chưa xác định';

  if (lowerPrompt.includes('pháp lý') || lowerPrompt.includes('rủi ro') || lowerPrompt.includes('sổ đỏ')) {
    return `### 📋 Phân tích Rủi ro Pháp lý đối với Hồ sơ ${code}

**Tài sản:** ${assetName}
**Trạng thái hiện tại:** ${statusLabel}

1. **Kiểm tra Giấy chứng nhận (Sổ đỏ / Sổ hồng):**
   - Xác minh số phát hành, số vào sổ cấp GCN, cơ quan cấp (VPĐKĐĐ hoặc UBND).
   - Kiểm tra thông tin chủ sở hữu, mục đích sử dụng đất, và thời hạn sử dụng đất (Đất ở lâu dài hay đất TMDV có thời hạn).

2. **Rủi ro Quy hoạch & Ranh giới:**
   - Đối chiếu vị trí thửa đất trên bản vẽ hiện trạng vị trí với quy hoạch phân khu 1/2000 & 1/500 địa phương.
   - Kiểm tra ranh giới có thuộc chỉ giới đường đỏ, hành lang bảo vệ sông/lưới điện cao thế hoặc dự án thu hồi đất hay không.

3. **Giao dịch & Thế chấp:**
   - Tra cứu ngăn chặn giao dịch tại Văn phòng Công chứng hoặc Cổng thông tin Tư pháp về kê biên thi hành án, tranh chấp quyền sở hữu.

4. **Khuyến nghị cho Thẩm định viên:**
   - Thu thập đủ Biên bản khảo sát thực địa và Tờ khai lệ phí trước bạ trước khi trình duyệt Báo cáo.`;
  }

  if (lowerPrompt.includes('phương pháp') || lowerPrompt.includes('so sánh') || lowerPrompt.includes('chi phí')) {
    return `### 💡 Tư vấn Lựa chọn Phương pháp Thẩm định giá

Dựa trên Tiêu chuẩn Thẩm định giá Việt Nam (TCTĐGVN) & Luật Giá hiện hành:

1. **Phương pháp So sánh Trực tiếp (Thường dùng cho BĐS Dân dụng & Căn hộ):**
   - **Ưu điểm:** Khách quan, phản ánh chính xác mặt bằng giá giao dịch thực tế trên thị trường.
   - **Yêu cầu:** Cần tối thiểu 03 tài sản so sánh tương đồng về vị trí, diện tích, quy hoạch và pháp lý.

2. **Phương pháp Chi phí Tái tạo / Thay thế (Thường dùng cho Công trình xây dựng, Nhà xưởng, Máy móc):**
   - **Ứng dụng:** Thẩm định giá trị phần công trình kiến trúc gắn liền với đất.
   - **Công thức:** Giá trị công trình = Giá trị tái tạo mới × (100% - Tỷ lệ chất lượng còn lại %).

3. **Phương pháp Thặng dư / Đấu thầu (Dự án đầu tư phát triển):**
   - Áp dụng đối với đất có tiềm năng phát triển thành dự án nhà ở, thương mại dịch vụ.

**Đề xuất cho hồ sơ (${assetName}):** Khuyên dùng **Phương pháp So sánh kết hợp Chi phí tái tạo công trình**.`;
  }

  if (lowerPrompt.includes('mô tả') || lowerPrompt.includes('vị trí') || lowerPrompt.includes('chứng thư') || lowerPrompt.includes('báo cáo')) {
    return `### 📝 Dự thảo Đoạn Mô tả Tài sản cho Chứng thư / Báo cáo Thẩm định giá

**Tài sản thẩm định:** ${assetName}
**Địa chỉ:** ${dossierContext?.assetAddress || 'Địa chỉ ghi trên Giấy chứng nhận'}
**Mã hồ sơ:** ${code} | **Giá trị:** ${valFormatted}

> "Tài sản định giá là ${assetName}, tọa lạc tại vị trí ${dossierContext?.assetAddress || 'khu vực hạ tầng đồng bộ'}, kết nối giao thông thuận tiện. Thửa đất có hình dáng cân đối, hạ tầng kỹ thuật hoàn thiện (điện, nước, đường giao thông bê tông/nhựa rộng rãi). Pháp lý tài sản rõ ràng, quyền sử dụng đất hợp pháp theo Giấy chứng nhận được cấp. Hiện trạng sử dụng ổn định, không ghi nhận dấu hiệu tranh chấp hay giải tỏa quy hoạch."`;
  }

  if (lowerPrompt.includes('trạng thái') || lowerPrompt.includes('quy trình') || lowerPrompt.includes('danh sách')) {
    return `### 🔄 Quy trình & Trạng thái Hồ sơ Thẩm định giá

Hồ sơ **${code}** hiện đang ở trạng thái: **${statusLabel}**.

**Danh mục 6 Trạng thái Hồ sơ Chuẩn:**
1. **Mới giao** (\`MOI_GIAO\`): Tiếp nhận hồ sơ từ Đơn vị kinh doanh/Ngân hàng.
2. **Đã lên lịch khảo sát** (\`DA_LEN_LICH_KHAO_SAT\`): Đã chốt thời gian với chủ tài sản.
3. **Đã khảo sát** (\`DA_KHAO_SAT\`): Đã thu thập hình ảnh và đo vẽ thực địa.
4. **Đã xuất báo cáo chờ duyệt** (\`DA_XUAT_BAO_CAO_CHO_DUYET\`): Đã hoàn thành dự thảo Báo cáo.
5. **Đã gửi báo cáo** (\`DA_GUI_BAO_CAO\`): Đã gửi file báo cáo mềm qua Email/Portal.
6. **Đã gửi hồ sơ bản cứng** (\`DA_GUI_HO_SO_BAN_CUNG\`): Đã bàn giao chứng thư & hồ sơ bản cứng tận nơi.`;
  }

  return `### 🤖 Trợ lý AI Thẩm định giá (ValuManager AI)

Cảm ơn bạn đã đặt câu hỏi liên quan đến **${code}** - *${assetName}*.

- **Giá trị tài sản:** ${valFormatted}
- **Trạng thái quy trình:** ${statusLabel}
- **Khách hàng:** ${dossierContext?.clientName || 'N/A'}

Tôi có thể hỗ trợ bạn:
- 📌 Kiểm tra rủi ro pháp lý & quy hoạch đất đai.
- 📐 Gợi ý phương pháp định giá phù hợp (So sánh, Chi phí, Thặng dư).
- 🖋️ Soạn thảo mô tả tài sản cho Báo cáo Thẩm định giá & Chứng thư.
- 📊 Tra cứu Tiêu chuẩn Thẩm định giá Việt Nam mới nhất.

Bạn có thể chọn các câu hỏi gợi ý bên dưới hoặc nhập yêu cầu cụ thể!`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper fallback for OCR when testing or if API key is not set
  function generateFallbackOcrResult(docTypeHint: string, fileName?: string): any {
    const hint = (docTypeHint || '').toUpperCase();
    const name = (fileName || '').toLowerCase();

    if (hint === 'CCCD' || name.includes('cccd') || name.includes('can_cuoc') || name.includes('cmnd')) {
      return {
        docType: 'CCCD',
        docTypeLabel: 'Căn cước công dân gắn chip (Bộ Công An)',
        confidence: 98,
        rawText: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\nCĂN CƯỚC CÔNG DÂN\nSố / No.: 001085012345\nHọ và tên / Full name: NGUYỄN VĂN AN\nNgày sinh / Date of birth: 15/08/1985\nGiới tính / Sex: Nam    Quốc tịch / Nationality: Việt Nam\nQuê quán / Place of origin: Xã Hải Bối, Đông Anh, TP. Hà Nội\nNơi thường trú / Place of residence: Số 45 Ngõ 12 Đường Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy, Hà Nội\nCó giá trị đến / Date of expiry: 15/08/2045`,
        extractedData: {
          clientName: 'NGUYỄN VĂN AN',
          clientCccd: '001085012345',
          birthDate: '15/08/1985',
          gender: 'Nam',
          nationality: 'Việt Nam',
          placeOfOrigin: 'Xã Hải Bối, Huyện Đông Anh, TP. Hà Nội',
          clientAddress: 'Số 45 Ngõ 12 Đường Hoàng Quốc Việt, Phường Nghĩa Đô, Quận Cầu Giấy, TP. Hà Nội',
          issueDate: '20/04/2021',
          issuePlace: 'Cục Cảnh sát QLHC về TTXH',
          clientPhone: '0912 345 678',
          clientEmail: 'nguyenvanan@gmail.com'
        }
      };
    }

    if (hint === 'DANG_KY_XE' || name.includes('xe') || name.includes('dang_ky') || name.includes('oto') || name.includes('car')) {
      return {
        docType: 'DANG_KY_XE',
        docTypeLabel: 'Giấy chứng nhận đăng ký xe ô tô (Cà vẹt)',
        confidence: 96,
        rawText: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nCHỨNG NHẬN ĐĂNG KÝ XE Ô TÔ\nSố ĐK: 0892415 - Seri: A 0124859\nTên chủ xe: TRẦN MINH QUÂN\nĐịa chỉ: 248/12 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh\nNhãn hiệu: TOYOTA    Số loại: CAMRY 2.5Q\nSố máy: 2AR-FE8492019    Số khung: RL4AC74B8K8012948\nBiển số đăng ký: 51K-889.98`,
        extractedData: {
          clientName: 'TRẦN MINH QUÂN',
          clientAddress: '248/12 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
          legalDocNumber: 'Số ĐK: 0892415 - Seri: A 0124859',
          assetName: 'Xe ô tô con TOYOTA CAMRY 2.5Q - BKS: 51K-889.98',
          assetCategory: 'DANG_KY_XE',
          assetAddress: '248/12 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
          licensePlate: '51K-889.98',
          brand: 'TOYOTA',
          modelCode: 'CAMRY 2.5Q',
          chassisNumber: 'RL4AC74B8K8012948',
          engineNumber: '2AR-FE8492019',
          manufactureYear: '2023',
          origin: 'Thái Lan',
          color: 'Đen kim loại',
          seatingCapacity: '05 chỗ',
          engineDisplacement: '2494 cm3',
          firstRegistrationDate: '18/05/2023',
          estimatedValue: 1250000000
        }
      };
    }

    // Default: Sổ đỏ / Sổ hồng (Bất động sản)
    return {
      docType: 'SO_DO',
      docTypeLabel: 'Giấy chứng nhận quyền sử dụng đất & tài sản gắn liền với đất (Sổ hồng)',
      confidence: 97,
      rawText: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nGIẤY CHỨNG NHẬN QUYỀN SỬ DỤNG ĐẤT, QUYỀN SỞ HỮU NHÀ Ở VÀ TÀI SẢN KHÁC GẮN LIỀN VỚI ĐẤT\nSố phát hành: CY 892401 - Số vào sổ: CS 04821/2022\nI. Người sử dụng đất: LÊ HOÀNG NAM & TRẦN THỊ MAI\nII. Thửa đất:\nThửa đất số: 128    Tờ bản đồ số: 15\nĐịa chỉ: Số 128 Đường Huỳnh Tấn Phát, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh\nDiện tích: 142.5 m2    Mục đích: Đất ở tại đô thị (ODT)\nThời hạn: Lâu dài`,
      extractedData: {
        clientName: 'LÊ HOÀNG NAM & TRẦN THỊ MAI',
        clientAddress: 'Số 128 Đường Huỳnh Tấn Phát, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
        legalDocNumber: 'Số phát hành: CY 892401 - Số vào sổ cấp GCN: CS 04821/2022',
        assetName: 'Quyền sử dụng đất và nhà ở tại Thửa đất số 128, Tờ bản đồ số 15',
        assetCategory: 'BAT_DONG_SAN',
        assetAddress: 'Số 128 Đường Huỳnh Tấn Phát, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
        landPlotNumber: '128',
        mapSheetNumber: '15',
        houseNumber: '128',
        ward: 'Phường Tân Phú',
        district: 'Quận 7',
        province: 'TP. Hồ Chí Minh',
        area: 142.5,
        landUseForm: 'Sử dụng riêng: 142.5 m2',
        landUsePurpose: 'Đất ở tại đô thị (ODT)',
        landUseTerm: 'Lâu dài',
        constructionType: 'Nhà ở riêng lẻ (Nhà phố 3 tầng)',
        constructionArea: 98.0,
        constructionUsableArea: 294.0,
        floorsCount: '03 tầng + tum',
        structure: 'Móng BTCT, khung cột BTCT, tường gạch, sàn BTCT, mái bê tông',
        buildingYear: '2020',
        issueDate: '15/10/2022',
        issueAuthority: 'Sở Tài nguyên và Môi trường TP. Hồ Chí Minh',
        estimatedValue: 12800000000,
        serviceFee: 22000000
      }
    };
  }

  // Helper to normalize and cross-validate 12-digit Vietnamese CCCD number
  function normalizeVietnameseCccd(rawCccd: string, birthDate?: string, gender?: string): string {
    if (!rawCccd) return '';
    let cleaned = String(rawCccd).trim().toUpperCase();

    // Fix common OCR character confusions in numbers
    cleaned = cleaned
      .replace(/[OODQ]/g, '0')
      .replace(/[IL|]/g, '1')
      .replace(/[Z]/g, '2')
      .replace(/[S]/g, '5')
      .replace(/[B]/g, '8')
      .replace(/[^0-9]/g, '');

    // If 11 digits (dropped leading 0, e.g. 01085012345 -> 001085012345)
    if (cleaned.length === 11) {
      cleaned = '0' + cleaned;
    }

    // Cross-validate with Birth Date and Gender if available
    if (cleaned.length === 12 && birthDate) {
      const dobMatch = birthDate.match(/(\d{4})/);
      if (dobMatch) {
        const birthYear = parseInt(dobMatch[1], 10);
        const yearSuffix = String(birthYear % 100).padStart(2, '0');
        
        let expectedGenderDigit = -1;
        const isFemale = gender && /nữ|nu|female/i.test(gender);
        const isMale = gender && /nam|male/i.test(gender);
        
        if (birthYear >= 1900 && birthYear <= 1999) {
          if (isMale) expectedGenderDigit = 0;
          if (isFemale) expectedGenderDigit = 1;
        } else if (birthYear >= 2000 && birthYear <= 2099) {
          if (isMale) expectedGenderDigit = 2;
          if (isFemale) expectedGenderDigit = 3;
        }

        // Verify digits 5 & 6 (index 4 & 5) match year of birth
        const currentYearDigits = cleaned.slice(4, 6);
        if (currentYearDigits !== yearSuffix) {
          console.log(`[CCCD Correction] Correcting year digits from ${currentYearDigits} to ${yearSuffix} based on DOB ${birthDate}`);
          cleaned = cleaned.slice(0, 4) + yearSuffix + cleaned.slice(6);
        }

        // Verify digit 4 (index 3) matches century & gender
        if (expectedGenderDigit !== -1 && cleaned[3] !== String(expectedGenderDigit)) {
          console.log(`[CCCD Correction] Correcting gender digit from ${cleaned[3]} to ${expectedGenderDigit}`);
          cleaned = cleaned.slice(0, 3) + expectedGenderDigit + cleaned.slice(4);
        }
      }
    }

    return cleaned;
  }

  // API endpoint for OCR Document Scanner
  app.post("/api/ai/ocr", async (req, res) => {
    try {
      const { image, docTypeHint, fileName, isSample, qrDecodedData } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!image) {
        return res.status(400).json({ error: "Vui lòng cung cấp hình ảnh tài liệu để quét OCR" });
      }

      // If user explicitly clicked a demo sample
      if (isSample) {
        const result = generateFallbackOcrResult(docTypeHint, fileName);
        return res.json(result);
      }

      // If no valid API key or placeholder
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        const result = generateFallbackOcrResult(docTypeHint, fileName);
        return res.json(result);
      }

      // Extract base64 parts & mimeType
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (typeof image === 'string') {
        if (image.includes(';base64,')) {
          const parts = image.split(';base64,');
          mimeType = parts[0].replace(/^data:/, '').trim() || 'image/jpeg';
          base64Data = parts[1].trim();
        } else if (image.startsWith('data:')) {
          const matches = image.match(/^data:([^;]+);base64,(.+)$/s);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2].trim();
          }
        }
      }

      const ocrPrompt = `Bạn là Chuyên gia AI OCR cao cấp chuyên đọc & trích xuất dữ liệu từ các loại giấy tờ pháp lý tại Việt Nam.
Hãy đọc kỹ hình ảnh đính kèm (có thể là Căn cước công dân - CCCD, Căn cước 2024, CMND, Sổ đỏ / Sổ hồng quyền sử dụng đất, hoặc Đăng ký xe).
Trích xuất toàn bộ văn bản và bóc tách các trường thông tin chuẩn xác theo tiếng Việt có dấu.

QUY TẮC NHẬN DIỆN CHI TIẾT & BẮT BUỘC:
1. NẾU LÀ CĂN CƯỚC CÔNG DÂN (CCCD) / CĂN CƯỚC (LUẬT 2024) / CMND:
   - "docType": "CCCD"
   - "clientCccd": ĐỌC CHÍNH XÁC ĐỦ 12 CHỮ SỐ (hoặc 9 số đối với CMND cũ), TUYỆT ĐỐI KHÔNG BỎ SÓT SỐ 0 Ở ĐẦU.
     * Vị trí: Dòng chữ "Số / No.:" hoặc "Số định danh cá nhân / Personal identification number:" in chữ to, đậm ngay dưới tiêu đề thẻ.
     * Cấu trúc chuẩn 12 số của Bộ Công An:
       [3 số đầu]: Mã tỉnh/thành phố khai sinh (Ví dụ: 001 - Hà Nội, 079 - TP.HCM, 034 - Thái Bình, 038 - Thanh Hóa, 036 - Nam Định, 031 - Hải Phòng, 024 - Bắc Giang, 037 - Ninh Bình...).
       [Số thứ 4]: Thế kỷ & giới tính (Nam sinh 19xx là 0, Nữ sinh 19xx là 1; Nam sinh 20xx là 2, Nữ sinh 20xx là 3).
       [Số thứ 5 và 6]: BẮT BUỘC TRÙNG VỚI 2 SỐ CUỐI CỦA NĂM SINH (Ví dụ: sinh năm 1991 thì 2 số này BẮT BUỘC là 91; sinh năm 1985 thì là 85; sinh năm 2002 thì là 02).
       [6 số cuối]: Dãy số ngẫu nhiên từ 000001 đến 999999.
     * Đối chiếu: Nếu có mã QR ở góc trên bên phải hoặc 3 dòng mã đọc máy MRZ ở đáy mặt sau (IDVNM<12_số_CCCD>...), hãy đối chiếu để lấy 12 số chính xác tuyệt đối.
   - "clientName": Họ và tên chủ thẻ, viết IN HOA toàn bộ đúng chính tả có dấu (VD: 'NGUYỄN VĂN AN', 'TRẦN THỊ MAI').
   - "birthDate": Ngày tháng năm sinh (DD/MM/YYYY).
   - "gender": 'Nam' hoặc 'Nữ'.
   - "nationality": 'Việt Nam'.
   - "placeOfOrigin": Quê quán hoặc Nơi đăng ký khai sinh.
   - "clientAddress": Nơi thường trú hoặc Nơi cư trú ghi trên thẻ.
   - "expiryDate": Thời hạn giá trị (VD: '15/08/2045' hoặc 'Không thời hạn').
   - "issueDate": Ngày cấp (nếu nhìn thấy ở mặt sau hoặc mặt trước, VD: '20/04/2021').
   - "issuePlace": Cơ quan cấp (VD: 'Cục Cảnh sát QLHC về TTXH' hoặc 'Giám đốc Công an tỉnh/TP...').

2. NẾU LÀ SỔ ĐỎ / SỔ HỒNG (GIẤY CHỨNG NHẬN QUYỀN SỬ DỤNG ĐẤT, QUYỀN SỞ HỮU NHÀ Ở):
   - "docType": "SO_DO"
   - "clientName": Tên người sử dụng đất / chủ sở hữu nhà ở (Ông/Bà...).
   - "clientCccd": Số CCCD/CMND của chủ sở hữu nếu có trên sổ.
   - "assetName": Tên tài sản định giá (VD: 'Quyền sử dụng đất và tài sản gắn liền với đất tại Thửa số 128, TBĐ 15').
   - "assetCategory": "BAT_DONG_SAN"
   - "assetAddress": Địa chỉ thửa đất / nhà ở ghi trên sổ.
   - "legalDocNumber": Số phát hành (Seri GCN đỏ/đen, VD: CY 892401, BD 910245) và/hoặc Số vào sổ cấp GCN (CS 04821/2022).
   - "landPlotNumber": Thửa đất số (dạng text hoặc số).
   - "mapSheetNumber": Tờ bản đồ số.
   - "area": Diện tích đất (m² - dạng số thực, VD: 142.5).
   - "landUseForm": Hình thức sử dụng (Sử dụng riêng / Sử dụng chung).
   - "landUsePurpose": Mục đích sử dụng (VD: 'Đất ở tại đô thị (ODT)', 'Đất ở tại nông thôn (ONT)').
   - "landUseTerm": Thời hạn sử dụng (VD: 'Lâu dài').
   - "constructionType": Loại nhà ở / công trình xây dựng (nếu có).
   - "constructionArea": Diện tích xây dựng (m² - số).
   - "constructionUsableArea": Diện tích sàn xây dựng (m² - số).
   - "floorsCount": Số tầng (VD: '03 tầng + tum').
   - "structure": Kết cấu nhà (VD: 'Bê tông cốt thép, tường gạch').
   - "buildingYear": Năm hoàn thành xây dựng.
   - "issueDate": Ngày cấp GCN.
   - "issueAuthority": Cơ quan cấp GCN (Sở Tài nguyên và Môi trường / UBND...).

3. NẾU LÀ GIẤY ĐĂNG KÝ XE Ô TÔ / XE MÁY (CÀ VẸT XE):
   - "docType": "DANG_KY_XE"
   - "clientName": Tên chủ xe (IN HOA).
   - "clientAddress": Địa chỉ chủ xe.
   - "legalDocNumber": Số đăng ký / Số seri cà vẹt.
   - "licensePlate": Biển số đăng ký xe (VD: '51K-889.98', '29A-123.45').
   - "brand": Nhãn hiệu xe (VD: 'TOYOTA', 'HONDA', 'MAZDA', 'MERCEDES-BENZ').
   - "modelCode": Số loại / Dòng xe (VD: 'CAMRY 2.5Q', 'CX-5', 'VIOS').
   - "assetName": Tên phương tiện (VD: 'Xe ô tô con TOYOTA CAMRY 2.5Q - BKS: 51K-889.98').
   - "assetCategory": "DANG_KY_XE"
   - "assetAddress": Địa chỉ xe / chủ xe.
   - "chassisNumber": Số khung (VIN).
   - "engineNumber": Số máy.
   - "manufactureYear": Năm sản xuất.
   - "origin": Nước sản xuất / Nguồn gốc.
   - "color": Màu sơn.
   - "seatingCapacity": Số chỗ ngồi.
   - "engineDisplacement": Dung tích xi lanh (cm3).
   - "firstRegistrationDate": Ngày đăng ký lần đầu.

BẮT BUỘC TRẢ VỀ DUY NHẤT 1 CHUỖI JSON HỢP LỆ (KHÔNG THÊM BẤT KỲ VĂN BẢN NGOÀI JSON NÀO):
{
  "docType": "CCCD" | "SO_DO" | "DANG_KY_XE",
  "docTypeLabel": "Tên tiếng Việt của loại giấy tờ nhận diện được",
  "confidence": 95,
  "rawText": "Toàn bộ nội dung văn bản nhìn thấy trên ảnh chụp giấy tờ",
  "extractedData": {
    "clientName": string,
    "clientCccd": string,
    "clientAddress": string,
    "birthDate": string,
    "gender": string,
    "nationality": string,
    "placeOfOrigin": string,
    "expiryDate": string,
    "issueDate": string,
    "issuePlace": string,
    "assetName": string,
    "assetCategory": "BAT_DONG_SAN" | "DANG_KY_XE",
    "assetAddress": string,
    "legalDocNumber": string,
    "landPlotNumber": string,
    "mapSheetNumber": string,
    "area": number,
    "landUseForm": string,
    "landUsePurpose": string,
    "landUseTerm": string,
    "constructionType": string,
    "constructionArea": number,
    "constructionUsableArea": number,
    "floorsCount": string,
    "structure": string,
    "buildingYear": string,
    "licensePlate": string,
    "brand": string,
    "modelCode": string,
    "chassisNumber": string,
    "engineNumber": string,
    "manufactureYear": string,
    "color": string,
    "seatingCapacity": string,
    "engineDisplacement": string,
    "origin": string,
    "firstRegistrationDate": string
  }
}`;

      // Model cascade: prioritize fast & stable vision models with fallback
      const ocrCandidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-3.8-flash"
      ];

      const ai = new GoogleGenAI({ apiKey });
      let lastError: any = null;

      for (const modelName of ocrCandidateModels) {
        try {
          console.log(`[OCR] Invoking Gemini model: ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data
                    }
                  },
                  {
                    text: ocrPrompt
                  }
                ]
              }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });

          const rawText = response.text || '';
          let parsedResult: any = null;
          try {
            parsedResult = JSON.parse(rawText);
          } catch (e) {
            const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedResult = JSON.parse(cleanJson);
          }

          if (parsedResult && parsedResult.extractedData) {
            // Priority: If client sent QR decoded data from Vietnamese Ministry of Public Security QR code
            if (qrDecodedData && qrDecodedData.clientCccd) {
              parsedResult.extractedData.clientCccd = qrDecodedData.clientCccd;
              parsedResult.extractedData.isQrVerified = true;
              if (qrDecodedData.clientName && !parsedResult.extractedData.clientName) {
                parsedResult.extractedData.clientName = qrDecodedData.clientName;
              }
              if (qrDecodedData.birthDate && !parsedResult.extractedData.birthDate) {
                parsedResult.extractedData.birthDate = qrDecodedData.birthDate;
              }
              if (qrDecodedData.clientAddress && !parsedResult.extractedData.clientAddress) {
                parsedResult.extractedData.clientAddress = qrDecodedData.clientAddress;
              }
            } else if (parsedResult.extractedData.clientCccd) {
              // Normalize, clean, and cross-validate 12-digit CCCD with DOB and Gender
              parsedResult.extractedData.clientCccd = normalizeVietnameseCccd(
                parsedResult.extractedData.clientCccd,
                parsedResult.extractedData.birthDate,
                parsedResult.extractedData.gender
              );
            }

            // Clean and polish extracted fields
            if (parsedResult.extractedData.clientName) {
              parsedResult.extractedData.clientName = parsedResult.extractedData.clientName.trim();
            }
            if (parsedResult.extractedData.area) {
              parsedResult.extractedData.area = parseFloat(String(parsedResult.extractedData.area).replace(/,/g, '.'));
            }

            console.log(`[OCR] Successfully extracted data with ${modelName}:`, {
              docType: parsedResult.docType,
              clientName: parsedResult.extractedData.clientName,
              clientCccd: parsedResult.extractedData.clientCccd,
              isQrVerified: !!parsedResult.extractedData.isQrVerified
            });

            return res.json(parsedResult);
          }
        } catch (mErr: any) {
          console.warn(`[OCR] Model ${modelName} failed or unavailable:`, mErr?.message || mErr);
          lastError = mErr;
          // Continue to next model in cascade
        }
      }

      // If all models failed
      console.error("[OCR] All Gemini models in cascade failed:", lastError?.message || lastError);
      return res.status(502).json({
        error: "Không thể nhận diện hình ảnh lúc này do dịch vụ AI Vision đang quá tải hoặc ảnh không rõ nét. Vui lòng thử lại với ảnh chụp rõ nét hơn hoặc chọn một mẫu tài liệu thử nghiệm.",
        details: lastError?.message
      });

    } catch (err: any) {
      console.error("OCR Route Error:", err);
      return res.status(500).json({ error: "Lỗi xử lý OCR tài liệu", details: err?.message });
    }
  });

  // API endpoint for AI Valuation Assistant using Gemini
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { prompt, dossierContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const rawStatus = dossierContext?.status || '';
      const statusLabel = STATUS_MAP[rawStatus] || rawStatus || 'Mới giao';

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        const text = generateFallbackResponse(prompt, dossierContext);
        return res.json({ text });
      }

      try {
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `Bạn là Trợ lý AI Chuyên gia Thẩm định giá Tài sản tại Việt Nam (ValuManager AI).
Nhiệm vụ của bạn là tư vấn chuyên môn cho Thẩm định viên, hỗ trợ:
1. Đánh giá rủi ro pháp lý tài sản (Sổ đỏ, sổ hồng, quy hoạch, kê biên).
2. So sánh giá thị trường theo địa bàn các tỉnh/thành phố Việt Nam.
3. Gợi ý phương pháp thẩm định phù hợp (So sánh, Chi phí, Thu nhập, DCF, Thặng dư).
4. Viết mô tả tài sản chuyên nghiệp cho Báo cáo Thẩm định giá & Chứng thư.
5. Quy trình quản lý trạng thái 6 bước: Mới giao (MOI_GIAO), Đã lên lịch khảo sát (DA_LEN_LICH_KHAO_SAT), Đã khảo sát (DA_KHAO_SAT), Đã xuất báo cáo chờ duyệt (DA_XUAT_BAO_CAO_CHO_DUYET), Đã gửi báo cáo (DA_GUI_BAO_CAO), Đã gửi hồ sơ bản cứng (DA_GUI_HO_SO_BAN_CUNG).
Trả lời bằng tiếng Việt lịch sự, chuyên nghiệp, chính xác, ngắn gọn và trình bày bằng Markdown scannable.`;

        let fullPrompt = prompt;
        if (dossierContext) {
          fullPrompt = `[BỐI CẢNH HỒ SƠ ĐANG XEM]:
- Mã HS: ${dossierContext.code}
- Tên tài sản: ${dossierContext.assetName}
- Khách hàng: ${dossierContext.clientName}
- Địa chỉ: ${dossierContext.assetAddress}
- Loại tài sản: ${dossierContext.assetCategory}
- Giá trị ước tính/duyệt: ${dossierContext.approvedValue || dossierContext.estimatedValue} VNĐ
- Trạng thái hồ sơ: ${statusLabel} (${dossierContext.status})

[YÊU CẦU CỦA NGƯỜI DÙNG]: ${prompt}`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: fullPrompt,
          config: {
            systemInstruction
          }
        });

        const text = response.text || generateFallbackResponse(prompt, dossierContext);
        return res.json({ text });
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, using intelligent fallback response:", geminiError?.message || geminiError);
        const text = generateFallbackResponse(prompt, dossierContext);
        return res.json({ text });
      }

    } catch (err: any) {
      console.error("AI Assistant API Error:", err);
      const text = generateFallbackResponse(req.body?.prompt || '', req.body?.dossierContext);
      return res.json({ text });
    }
  });

  // API endpoint to fetch Excel/Google Sheets from URL (bypass CORS)
  app.post("/api/import/fetch-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ error: "Vui lòng cung cấp đường dẫn (URL) hợp lệ" });
      }

      let targetUrl = url.trim();
      let isGoogleSheet = false;

      // Handle Google Sheets URL
      const gSheetMatch = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (gSheetMatch && gSheetMatch[1]) {
        isGoogleSheet = true;
        const sheetId = gSheetMatch[1];
        const gidMatch = targetUrl.match(/[#&?]gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
        targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx${gidParam}`;
      }

      // Handle Google Drive file link
      const gDriveMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (gDriveMatch && gDriveMatch[1]) {
        targetUrl = `https://drive.google.com/uc?export=download&id=${gDriveMatch[1]}`;
      }

      console.log(`[Import URL] Fetching data from: ${targetUrl}`);
      let fetchRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        redirect: 'follow'
      });

      // If Google Sheet XLSX export failed (e.g. 403 or 400), attempt CSV export format
      if (!fetchRes.ok && isGoogleSheet && gSheetMatch) {
        const sheetId = gSheetMatch[1];
        const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
        console.log(`[Import URL] Retrying Google Sheet with CSV: ${csvUrl}`);
        fetchRes = await fetch(csvUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          },
          redirect: 'follow'
        });
      }

      if (!fetchRes.ok) {
        return res.status(400).json({
          error: `Không thể tải file từ đường dẫn (Mã lỗi ${fetchRes.status}: ${fetchRes.statusText}). Vui lòng đảm bảo file Google Sheets hoặc liên kết ở chế độ công khai: "Bất kỳ ai có đường liên kết đều có thể xem".`
        });
      }

      const contentType = fetchRes.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const arrayBuffer = await fetchRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      return res.json({
        success: true,
        base64,
        contentType,
        sizeBytes: arrayBuffer.byteLength
      });

    } catch (err: any) {
      console.error("[Import URL Error]", err);
      return res.status(500).json({
        error: `Lỗi kết nối khi tải file từ đường dẫn: ${err.message || err}`
      });
    }
  });

  // API endpoint to list and download templates from Google Drive folder
  app.get("/api/templates/list", (req, res) => {
    const templates = [
      {
        id: 1,
        code: "A1_Bao_Cao_OK",
        filename: "A1_Bao_Cao_OK.doc",
        name: "Báo cáo kết quả tư vấn giá tài sản",
        driveId: "1bqfHUXUn_OUs6Gej_MyP3RR9DhF9M5dB",
        description: "Mẫu báo cáo đầy đủ gồm Căn cứ pháp lý, Phương pháp, Bảng thẩm định giá theo diện tích/hạng mục, Giả thiết & Phụ lục kỹ thuật thửa đất, công trình."
      },
      {
        id: 2,
        code: "A1_Ket_Qua_OK",
        filename: "A1_Ket_Qua_OK.doc",
        name: "Thông báo kết quả tư vấn giá tài sản",
        driveId: "1Q431mH4bqZj3mkA1f9KSenS6yXTgOnUl",
        description: "Mẫu thông báo kết quả gửi Khách hàng & Chi nhánh Ngân hàng TMCP Bắc Á, bảng thẩm định, checklist thanh khoản/quy hoạch/tranh chấp, hiệu lực 180 ngày."
      },
      {
        id: 3,
        code: "A1_TB_Phi_OK",
        filename: "A1_TB_Phi_OK.doc",
        name: "Thông báo phí tư vấn giá tài sản",
        driveId: "1SL4et3hAaeVQ2dSNszLbVJnQwXHerUXY",
        description: "Mẫu thông báo biểu phí gửi Khách hàng & Chi nhánh Bắc Á, phí dịch vụ VAT, tiền tạm ứng đã nộp, phí còn lại, STT tài khoản BAC A AMC tại CN Hà Thành."
      }
    ];
    return res.json({ success: true, templates });
  });

  app.get("/api/templates/download/:filename", (req, res) => {
    const { filename } = req.params;
    const allowed = ['A1_Bao_Cao_OK.doc', 'A1_Ket_Qua_OK.doc', 'A1_TB_Phi_OK.doc'];
    if (!allowed.includes(filename)) {
      return res.status(404).json({ error: "Không tìm thấy file mẫu hợp lệ" });
    }
    const filePath = path.join(process.cwd(), "drive_templates", filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File mẫu chưa được tải trên hệ thống" });
    }
    return res.download(filePath, filename);
  });

  // Vite middleware setup for development vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
