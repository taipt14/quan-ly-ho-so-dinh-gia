export type DossierStatus = 
  | 'MOI_GIAO'                            // Mới giao
  | 'KHACH_HANG_HUY'                      // Khách hàng hủy
  | 'DA_HEN_LICH_KHAO_SAT'                // Đã hẹn lịch khảo sát
  | 'DA_KHAO_SAT'                         // Đã khảo sát
  | 'KHACH_HANG_CHUA_THANH_TOAN'          // Khách hàng chưa thanh toán
  | 'KHACH_HANG_DA_THANH_TOAN'            // Khách hàng đã thanh toán
  | 'DA_LEN_BAO_CAO_CHO_DUYET'            // Đã lên báo cáo chờ duyệt
  | 'DA_DUYET_BAO_CAO'                    // Đã duyệt báo cáo
  | 'DA_GUI_BAO_CAO_CHO_CHI_NHANH'        // Đã gửi báo cáo cho chi nhánh
  | 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH'
  | 'TU_CHOI_BAO_CAO'; // Đã gửi hồ sơ bản cứng cho chi nhánh


export type AssetCategory = 
  | 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT' // 1. Đất và tài sản gắn liền với đất
  | 'CAN_HO_CHUNG_CU'                 // 2. Căn hộ chung cư / Căn hộ tập thể
  | 'PHUONG_TIEN_VAN_TAI'             // 3. Phương tiện vận tải
  | 'MAY_MOC_THIET_BI';               // 4. Máy móc thiết bị

export type ValuationPurpose = 
  | 'VAY_VON_NGAN_HANG' // Vay vốn thế chấp ngân hàng
  | 'MUA_BAN_SAP_NHAP'  // Mua bán, sáp nhập M&A
  | 'BAO_CAO_TAI_CHINH' // Báo cáo tài chính, hạch toán
  | 'THI_HANH_AN'       // Tòa án, thi hành án
  | 'KHAC';              // Mục đích khác

export type PaymentStatus = 
  | 'CHUA_THANH_TOAN'  // Chưa thanh toán
  | 'DA_TAM_UNG'       // Đã tạm ứng
  | 'DA_THANH_TOAN';   // Đã thanh toán đủ

export type DossierPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface LegalDocument {
  id: string;
  name: string;
  status: 'DA_NOP' | 'CHUA_NOP' | 'CAN_BO_SUNG';
  note?: string;
}

export interface StatusHistoryItem {
  status: DossierStatus;
  note: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DynamicImportField {
  colIndex: number;
  headerName: string;
  categoryGroup?: string;
  row1?: string;
  row2?: string;
  row3?: string;
  value: any;
}

export interface MarketComparable {
  id: string;
  name: string;                   // Tên tài sản so sánh (VD: Căn hộ 905 Tòa CT1 Tả Thanh Oai)
  source: string;                 // Nguồn thông tin (VD: batdongsan.com.vn / Môi giới)
  contactPhone?: string;          // Số điện thoại liên hệ
  surveyDate?: string;            // Thời điểm thu thập thông tin
  address?: string;               // Vị trí / Địa chỉ
  area: number;                   // Diện tích (m2)
  floorsOrFloorLevel?: string;    // Tầng / Vị trí tầng
  direction?: string;             // Hướng / Hướng ban công
  legalStatus?: string;           // Tình trạng pháp lý (Đã có Sổ đỏ / HĐMB)
  askingPrice: number;            // Giá rao bán / Chào bán (VNĐ)
  askingUnitPrice?: number;       // Đơn giá rao bán (VNĐ/m2)
  negotiationRate?: number;       // Tỷ lệ thương lượng (%) (VD: -3% hoặc -5%)
  transactionUnitPrice?: number;  // Đơn giá sau thương lượng (VNĐ/m2)
  adjustmentRate?: number;        // Tổng tỷ lệ điều chỉnh các yếu tố (%)
  adjustedUnitPrice: number;      // Đơn giá chỉ dẫn sau điều chỉnh (VNĐ/m2)
  notes?: string;                 // Ghi chú đặc điểm khác biệt
}

export interface BuildingComponentQuality {
  id: string;
  componentName: string;          // Tên kết cấu bộ phận (VD: Khung BTCT, Tường xây, Sàn...)
  weightRate: number;             // Tỷ trọng kết cấu (%)
  actualQualityRate: number;      // Tỷ lệ chất lượng còn lại thực tế (%)
  weightedQuality: number;        // Điểm đánh giá (Tỷ trọng x Tỷ lệ CLCL)
  conditionDescription?: string;  // Mô tả hiện trạng thực tế
}

export interface ClclCalculationSheet {
  buildingClassification?: string;// Cấp công trình (VD: Công trình Cấp II)
  designLifespanYears?: number;   // Niên hạn sử dụng chuẩn (năm, VD: 50 năm)
  constructionYear?: number;      // Năm hoàn thành xây dựng (VD: 2020)
  appraisalYear?: number;         // Năm thẩm định (VD: 2024)
  usedYears?: number;             // Số năm đã sử dụng (VD: 4 năm)
  baseDepreciationRate?: number;  // Tỷ lệ hao mòn thời gian cơ sở (%)
  components?: BuildingComponentQuality[]; // Đánh giá từng kết cấu bộ phận
  finalClclRate?: number;         // Tỷ lệ CLCL tổng hợp áp dụng (%) (VD: 85%)
  newConstructionUnitPrice?: number; // Suất vốn đầu tư xây dựng mới (VNĐ/m2)
  usableFloorArea?: number;       // Diện tích sàn sử dụng thực tế (m2)
  newReplacementValue?: number;   // Giá trị xây dựng mới 100% (VNĐ)
  remainingStructureValue?: number;// Giá trị công trình còn lại sau CLCL (VNĐ)
}

export interface LandPlanningValuationRow {
  landType: string;        // 'Diện tích phù hợp với quy hoạch' | 'Diện tích không phù hợp với quy hoạch'
  unit: string;            // 'm²'
  quantity?: number;       // Số lượng (m²)
  unitPrice?: number;      // Đơn giá thẩm định (VNĐ/m²)
  totalPrice?: number;     // Giá thẩm định (VNĐ)
  notes?: string;
}

export interface LandPlanningValuation {
  plannedArea: LandPlanningValuationRow;
  unplannedArea: LandPlanningValuationRow;
  totalQuantity?: number;
  totalPrice?: number;
}

export interface LandValuationTableData {
  totalArea: { subject: number; comp1: number; comp2: number; comp3: number };
  referencePrice: { subject: string; comp1: string; comp2: string; comp3: string };
  unitPrice: { subject: number; comp1: number; comp2: number; comp3: number };
  transactionDate: { subject: string; comp1: string; comp2: string; comp3: string };
  marketFactor: { subject: string; comp1: string; comp2: string; comp3: string };
  marketAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  legalStatus: { subject: string; comp1: string; comp2: string; comp3: string };
  legalAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  interior: { subject: string; comp1: string; comp2: string; comp3: string };
  interiorAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  floorPosition: { subject: string; comp1: string; comp2: string; comp3: string };
  floorAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  bedWc: { subject: string; comp1: string; comp2: string; comp3: string };
  bedWcAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  apartmentDirection: { subject: string; comp1: string; comp2: string; comp3: string };
  apartmentDirectionAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  apartmentPosition: { subject: string; comp1: string; comp2: string; comp3: string };
  apartmentPositionAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  balconyDirection: { subject: string; comp1: string; comp2: string; comp3: string };
  balconyDirectionAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  areaFactor: { subject: string; comp1: string; comp2: string; comp3: string };
  areaAdjRate: { subject: number; comp1: number; comp2: number; comp3: number };
  selectedUnitPrice: number;
}

export interface ValuationDossier {
  id: string;
  code: string;                  // Mã hồ sơ (VD: 2024TĐ-AMC5864)
  status: DossierStatus;         // Trạng thái hồ sơ
  businessUnit?: string;         // ĐƠN VỊ KINH DOANH
  clientName: string;            // KHÁCH HÀNG
  clientCccd?: string;           // CCCD / CMND
  clientPhone?: string;          // SĐT khách hàng
  clientEmail?: string;          // Email khách hàng
  clientAddress?: string;        // Địa chỉ thường trú khách hàng
  receivedDate: string;          // NGÀY TIẾP NHẬN (YYYY-MM-DD hoặc DD/MM/YYYY)
  receivedTime?: string;         // Giờ tiếp nhận
  assignedDate?: string;         // NGÀY PHÂN CÔNG
  assignedTime?: string;         // Giờ phân công
  amcSpecialist?: string;        // CHUYÊN VIÊN AMC
  advanceFee?: number;           // PHÍ TẠM ỨNG (VNĐ)
  surveyDate?: string;           // NGÀY KHẢO SÁT
  surveyTime?: string;           // Giờ khảo sát
  approvalDate?: string;         // NGÀY PHÊ DUYỆT
  businessUnitSpecialist?: string; // CHUYÊN VIÊN ĐƠN VỊ KINH DOANH (Cán bộ tín dụng)
  creditOfficer?: string;        // CHUYÊN VIÊN TÍN DỤNG
  totalValuationFee?: number;    // TỔNG PHÍ THẨM ĐỊNH (VNĐ)
  
  // Tài sản chung
  assetName: string;             // Tên tài sản định giá
  assetCategory: AssetCategory;  // LOẠI TÀI SẢN (BĐS/ĐS/Chung cư/Ô tô...)
  assetAddress: string;          // Địa chỉ đầy đủ / Vị trí tài sản
  
  // ĐỊA CHỈ THỬA ĐẤT / CĂN HỘ CHUNG CƯ
  landPlotNumber?: string;       // THỬA ĐẤT SỐ
  mapSheetNumber?: string;       // TỜ BẢN ĐỒ SỐ
  apartmentNumber?: string;      // SỐ CĂN HỘ (VD: Căn 1208, Tầng 12)
  buildingName?: string;         // TÒA NHÀ / TÊN DỰ ÁN (VD: Tòa CT1, Dự án Tổ hợp căn hộ)
  houseNumber?: string;          // SỐ NHÀ, NGÕ, NGÁCH, HẺM / SỐ CĂN HỘ, TÒA NHÀ
  ward?: string;                 // XÃ/THỊ TRẤN/PHƯỜNG
  district?: string;             // HUYỆN/THỊ XÃ/QUẬN
  province?: string;             // TỈNH/TP

  // THÔNG SỐ KỸ THUẬT CHI TIẾT
  constructionYear?: string;     // NĂM XÂY DỰNG CHUNG CƯ/NĂM SẢN XUẤT
  floorsCount?: string;          // SỐ TẦNG/NƠI SẢN XUẤT
  areaCertificate?: number;      // DIỆN TÍCH THEO SỔ ĐỎ (m2) / SỐ LƯỢNG
  areaExpanded?: number;         // DIỆN TÍCH CƠI NỚI (m2)
  landUseForm?: string;          // HÌNH THỨC SỬ DỤNG ĐẤT / DIỆN TÍCH TỪNG LOẠI ĐẤT
  landUsePurpose?: string;       // MỤC ĐÍCH SỬ DỤNG ĐẤT (Đất ở tại đô thị ODT...)
  landUseTerm?: string;          // THỜI HẠN SỬ DỤNG ĐẤT / ĐỒNG HỒ KM
  roadAccessLevel?: string;      // ĐƯỜNG VÀO TÀI SẢN (Cấp độ đường / Số chỗ ngồi)
  roadType?: string;             // Loại đường / Trọng lượng bản thân (kg)
  roadWidth?: string;            // Độ rộng đường (m) / Trọng lượng toàn bộ (kg)
  direction?: string;            // HƯỚNG / HƯỚNG BAN CÔNG
  shape?: string;                // HÌNH DẠNG (Vuông vắn, Cân đối, Nở hậu, Thóp hậu, Đa giác)
  frontageWidth?: number;        // ĐỘ RỘNG MẶT TIỀN (m)
  dimension?: string;            // DÀI X RỘNG (TB)
  businessCondition?: string;    // ĐIỀU KIỆN KINH DOANH
  infrastructure?: string;       // CS HẠ TẦNG (Thành phố, Thị xã, Thị trấn, Thị tứ, Nông thôn)
  carQuality?: number;           // CLCL ĐỐI VỚI XE Ô TÔ (%)
  licensePlate?: string;         // BIỂN KIỂM SOÁT (Phương tiện vận tải)
  chassisNumber?: string;        // SỐ KHUNG
  engineNumber?: string;         // SỐ MÁY
  manufactureYear?: number | string; // NĂM SẢN XUẤT
  apartmentFloor?: string | number;  // TẦNG SỐ CĂN HỘ CHUNG CƯ
  otherFactors?: string;         // YẾU TỐ KHÁC
  googleMapCoords?: string;      // TỌA ĐỘ ĐỊNH VỊ THEO GOOGLE MAP

  // KẾT QUẢ THẨM ĐỊNH GIÁ
  stateLandPrice?: number;       // GIÁ NHÀ NƯỚC ĐỐI VỚI ĐẤT Ở (VNĐ/m2)
  statePriceYear?: string;       // NĂM BAN HÀNH ĐƠN GIÁ NN
  kCoefficient?: number;         // HỆ SỐ K
  proposedUnitPrice?: number;    // ĐƠN GIÁ ĐỀ NGHỊ (VNĐ/m2)
  appraisedUnitPrice?: number;   // ĐƠN GIÁ THẨM ĐỊNH (VNĐ/m2)
  marketPrice?: number;          // GIÁ THỊ TRƯỜNG / TỔNG GIÁ TRỊ THẨM ĐỊNH (VNĐ)

  // THÔNG TIN ĐỊNH GIÁ ĐẤT THEO QUY HOẠCH (Dành riêng cho Bất Động Sản)
  // Bảng: Loại Đất | ĐVT | Số lượng | Giá thẩm định (VND)
  plannedLandUnit?: string;       // ĐVT đất phù hợp quy hoạch (mặc định m2)
  plannedLandArea?: number;       // Số lượng DT phù hợp quy hoạch (m2)
  plannedLandUnitPrice?: number;  // Đơn giá DT phù hợp quy hoạch (VNĐ/m2)
  plannedLandValue?: number;      // Giá thẩm định DT phù hợp quy hoạch (VNĐ)

  unplannedLandUnit?: string;     // ĐVT đất không phù hợp quy hoạch (mặc định m2)
  unplannedLandArea?: number;     // Số lượng DT không phù hợp quy hoạch (m2)
  unplannedLandUnitPrice?: number;// Đơn giá DT không phù hợp quy hoạch (VNĐ/m2)
  unplannedLandValue?: number;    // Giá thẩm định DT không phù hợp quy hoạch (VNĐ)

  landPlanningValuation?: LandPlanningValuation;

  // CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT / THÙNG XE
  constructionType?: string;     // LOẠI CÔNG TRÌNH / LOẠI THÙNG XE
  constructionArea?: number;     // DIỆN TÍCH XÂY DỰNG / NƠI SẢN XUẤT
  constructionUsableArea?: number; // DIỆN TÍCH SỬ DỤNG THEO SỔ ĐỎ (m2)
  constructionActualArea?: number; // DIỆN TÍCH SỬ DỤNG THỰC TẾ (m2)
  buildingFloorsMaterial?: string; // SỐ TẦNG / NGUYÊN LIỆU GIA CÔNG
  buildingYear?: string;         // NĂM XÂY DỰNG / NĂM SẢN XUẤT
  remainingBuildingQuality?: number; // CHẤT LƯỢNG CÒN LẠI NHÀ Ở / CLCL THÙNG XE (%)
  constructionUnitPrice?: number; // ĐƠN GIÁ XÂY DỰNG / GIÁ TRỊ THÙNG XE (VNĐ/m2)

  // Trường bổ sung quản lý
  area?: number;                 // Tổng diện tích (m2)
  legalDocNumber?: string;       // Cơ sở pháp lý / Giấy chứng nhận số
  purpose?: ValuationPurpose;    // Mục đích định giá
  dueDate?: string;              // Ngày hẹn trả (YYYY-MM-DD)
  completedDate?: string;        // Ngày hoàn thành (YYYY-MM-DD)
  assignedAppraiser?: string;    // Chuyên viên định giá phụ trách
  branch?: string;               // Chi nhánh / Phòng nghiệp vụ
  estimatedValue?: number;       // Giá trị đề xuất (VNĐ)
  approvedValue?: number;        // Giá trị định giá phê duyệt (VNĐ)
  serviceFee?: number;           // Phí dịch vụ định giá (VNĐ)
  paymentStatus?: PaymentStatus; // Trạng thái thanh toán
  priority?: DossierPriority;    // Mức độ ưu tiên
  methodUsed?: string;           // Phương pháp định giá
  notes?: string;                // Ghi chú thêm
  assetImages?: string[];        // Danh sách link/base64 ảnh tài sản (mặt tiền, ngõ, sổ đỏ...)
  documents?: LegalDocument[];   // Danh mục hồ sơ pháp lý đính kèm
  statusHistory?: StatusHistoryItem[]; // Lịch sử thay đổi trạng thái
  approvalRejectionReason?: string; // Lý do từ chối duyệt báo cáo
  submittedForApprovalAt?: string;  // Thời điểm gửi trình duyệt báo cáo
  submissionNote?: string;          // Ghi chú khi gửi trình duyệt
  approvedAt?: string;             // Thời điểm lãnh đạo phê duyệt
  approvedBy?: string;             // Tên lãnh đạo phê duyệt

  // IV. KIẾN NGHỊ & ĐỀ XUẤT CỦA CÁN BỘ THẨM ĐỊNH (Xuất báo cáo BM.02A, BM.02A1, BM.02B, BM.02C)
  creditProposal?: string;          // Đề xuất chấp thuận kết quả định giá / cấp tín dụng
  maxLtvRate?: number;              // Tỷ lệ cho vay tối đa đề xuất (% LTV, VD: 70%, 75%)
  maxLoanAmount?: number;           // Số tiền cho vay tối đa đề xuất (VNĐ)
  collateralConditions?: string;    // Điều kiện quản lý tài sản bảo đảm trước giải ngân
  postDisbursementCheck?: string;   // Kiểm tra, giám sát tài sản sau khi cấp tín dụng
  otherProposals?: string;          // Kiến nghị / Lưu ý khác của cán bộ định giá
  recommendations?: string;         // Toàn văn nội dung phần kiến nghị tổng hợp

  // Dữ liệu chuyên sâu 4 Sheet chuẩn theo chung cu.xlsx
  marketComparables?: MarketComparable[]; // Sheet: thuthapthongtin (Tài sản so sánh thị trường)
  clclCalculation?: ClclCalculationSheet; // Sheet: bang tinh clcl (Bảng tính chất lượng còn lại)
  landValuationTable?: LandValuationTableData; // Sheet: Bang tinh gia dat (Bảng tính giá đất / định giá theo phương pháp so sánh)

  // Toàn bộ các trường dữ liệu động đọc từ file import (bao nhiêu cột thì có bấy nhiêu trường)
  importedColumnsData?: DynamicImportField[];
  customFields?: Record<string, any>;
  totalImportedColumns?: number;
}

export interface FilterState {
  searchQuery: string;
  status: DossierStatus | 'ALL';
  category: AssetCategory | 'ALL';
  branch: string;
  appraiser: string;
  creditOfficer?: string;
  urgency: 'ALL' | 'OVERDUE' | 'DUE_SOON' | 'ON_TIME';
  paymentStatus: PaymentStatus | 'ALL';
  dateRange: {
    start: string;
    end: string;
  };
}
