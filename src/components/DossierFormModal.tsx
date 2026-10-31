import { isDossierLocked } from '../utils/formatters';
import React, { useState, useEffect } from 'react';
import {
 
  X, 
  Building2, 
  Calculator, 
  Check, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Link as LinkIcon, 
  Scan, 
  Sparkles,
  FileText,
  MapPin,
  Sliders,
  ChevronRight,
  ChevronLeft,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Layers,
  Search,
  Percent,
  TrendingUp,
  Wrench,
  RotateCcw,
  Award,
  ShieldCheck
} from 'lucide-react';
import { 
  ValuationDossier, 
  DossierStatus, 
  AssetCategory, 
  ValuationPurpose, 
  PaymentStatus, 
  DossierPriority, 
  LegalDocument,
  MarketComparable,
  BuildingComponentQuality,
  ClclCalculationSheet,
  LandValuationTableData
} from '../types/dossier';
import { 
  STATUS_CONFIG, 
  ASSET_CATEGORY_CONFIG, 
  PURPOSE_CONFIG, 
  PAYMENT_STATUS_CONFIG, 
  PRIORITY_CONFIG, 
  formatVND,
  formatCurrencyNumber,
  parseVietnameseNumber,
  formatDate,
  numberToVietnameseWords
} from '../utils/formatters';
import { DocumentOcrScannerModal, ExtractedOcrData } from './DocumentOcrScannerModal';

interface DossierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dossier: ValuationDossier) => void;
  initialData?: ValuationDossier | null;
}

export type FormSheetTab = 
  | 'dac_diem_chung_chi_tiet' 
  | 'thuthapthongtin' 
  | 'bang_tinh_gia_dat' 
  | 'bang_tinh_clcl' 
  | 'phap_ly_va_anh'
  | 'kien_nghi';

interface SheetTabConfig {
  id: FormSheetTab;
  sheetNumber: number;
  label: string;
  shortLabel: string;
  exactSheetName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SHEET_TABS: SheetTabConfig[] = [
  {
    id: 'dac_diem_chung_chi_tiet',
    sheetNumber: 1,
    label: 'ĐẶC ĐIỂM CHUNG,CHI TIẾT',
    shortLabel: 'ĐẶC ĐIỂM CHUNG,CHI TIẾT',
    exactSheetName: 'ĐẶC ĐIỂM CHUNG,CHI TIẾT',
    icon: FileText,
    description: 'Thông tin hồ sơ, khách hàng, địa chỉ thửa đất/căn hộ & thông số kỹ thuật chi tiết'
  },
  {
    id: 'thuthapthongtin',
    sheetNumber: 2,
    label: 'thuthapthongtin',
    shortLabel: 'thuthapthongtin',
    exactSheetName: 'thuthapthongtin',
    icon: Search,
    description: 'Khảo sát thị trường, thu thập thông tin các tài sản so sánh & đơn giá chỉ dẫn'
  },
  {
    id: 'bang_tinh_gia_dat',
    sheetNumber: 3,
    label: 'Bang tinh gia dat',
    shortLabel: 'Bang tinh gia dat',
    exactSheetName: 'Bang tinh gia dat',
    icon: Calculator,
    description: 'Bảng tính giá đất / căn hộ, giá Nhà nước, hệ số K, phân bổ quy hoạch & tổng giá trị'
  },
  {
    id: 'bang_tinh_clcl',
    sheetNumber: 4,
    label: 'bang tinh clcl',
    shortLabel: 'bang tinh clcl',
    exactSheetName: 'bang tinh clcl',
    icon: Percent,
    description: 'Bảng tính chất lượng còn lại công trình (CLCL %), phân tích kết cấu & suất vốn đầu tư'
  },
  {
    id: 'phap_ly_va_anh',
    sheetNumber: 5,
    label: 'Pháp lý & Ảnh hiện trạng',
    shortLabel: 'Pháp lý & Ảnh',
    exactSheetName: 'Hồ sơ pháp lý & Hình ảnh',
    icon: ImageIcon,
    description: 'Cơ sở pháp lý, Quét OCR AI & Thư viện hình ảnh khảo sát hiện trạng tài sản'
  },
  {
    id: 'kien_nghi',
    sheetNumber: 6,
    label: 'IV. KIẾN NGHỊ & ĐỀ XUẤT',
    shortLabel: 'Kiến nghị',
    exactSheetName: 'IV. KIẾN NGHỊ',
    icon: Award,
    description: 'Đề xuất cấp tín dụng, Tỷ lệ LTV tối đa, Điều kiện quản lý TSBĐ & Giám sát sau giải ngân'
  }
];


const DEFAULT_LAND_VALUATION_TABLE: LandValuationTableData = {
  totalArea: { subject: 102, comp1: 102, comp2: 98.5, comp3: 106 },
  referencePrice: { subject: "---", comp1: "28.000.000", comp2: "27.800.000", comp3: "28.100.000" },
  unitPrice: { subject: 28500000, comp1: 28000000, comp2: 27800000, comp3: 28100000 },
  transactionDate: { subject: "Hiện tại", comp1: "Tháng 9/2024", comp2: "Tháng 8/2024", comp3: "Tháng 10/2024" },
  marketFactor: { subject: "Ổn định", comp1: "Ổn định", comp2: "Ổn định", comp3: "Ổn định" },
  marketAdjRate: { subject: 0, comp1: 0, comp2: 0, comp3: 0 },
  legalStatus: { subject: "Đã có Sổ đỏ", comp1: "Đã có Sổ đỏ", comp2: "Đã có Sổ đỏ", comp3: "HĐMB" },
  legalAdjRate: { subject: 0, comp1: 0, comp2: 0, comp3: 1.0 },
  interior: { subject: "Hoàn thiện cơ bản", comp1: "Hoàn thiện cơ bản", comp2: "Đầy đủ nội thất", comp3: "Hoàn thiện cơ bản" },
  interiorAdjRate: { subject: 0, comp1: 0, comp2: -1.0, comp3: 0 },
  floorPosition: { subject: "Tầng 12", comp1: "Tầng 12", comp2: "Tầng 8", comp3: "Tầng 18" },
  floorAdjRate: { subject: 0, comp1: 0, comp2: 0.5, comp3: -0.5 },
  bedWc: { subject: "3 PN / 2 WC", comp1: "3 PN / 2 WC", comp2: "2 PN / 2 WC", comp3: "3 PN / 2 WC" },
  bedWcAdjRate: { subject: 0, comp1: 0, comp2: 1.0, comp3: 0 },
  apartmentDirection: { subject: "Đông Nam", comp1: "Đông Nam", comp2: "Nam", comp3: "Đông Bắc" },
  apartmentDirectionAdjRate: { subject: 0, comp1: 0, comp2: 0, comp3: 0.5 },
  apartmentPosition: { subject: "Căn góc", comp1: "Căn thường", comp2: "Căn thường", comp3: "Căn góc" },
  apartmentPositionAdjRate: { subject: 0, comp1: 1.0, comp2: 1.0, comp3: 0 },
  balconyDirection: { subject: "Đông Nam", comp1: "Đông Nam", comp2: "Nam", comp3: "Đông Bắc" },
  balconyDirectionAdjRate: { subject: 0, comp1: 0, comp2: 0, comp3: 0 },
  areaFactor: { subject: "102.0 m²", comp1: "102.0 m²", comp2: "98.5 m²", comp3: "106.0 m²" },
  areaAdjRate: { subject: 0, comp1: 0, comp2: -0.5, comp3: 0.2 },
  selectedUnitPrice: 28500000
};

const DEFAULT_COMPARABLES: MarketComparable[] = [
  {
    id: 'ss-1',
    name: 'Tài sản so sánh 1: Căn hộ 805 Tòa CT1 Chung cư Tả Thanh Oai',
    source: 'batdongsan.com.vn (Tin đăng ID: 398214)',
    contactPhone: '0982 456 789 (Môi giới anh Hoàng)',
    surveyDate: '31/07/2024',
    address: 'Tầng 8, Tòa CT1 Tả Thanh Oai, Thanh Trì, Hà Nội',
    area: 102.0,
    floorsOrFloorLevel: 'Tầng 8 / 25 tầng',
    direction: 'Đông Nam',
    legalStatus: 'Sổ hồng lâu dài chính chủ',
    askingPrice: 2950000000,
    askingUnitPrice: 28921568,
    negotiationRate: -2.5,
    transactionUnitPrice: 28198529,
    adjustmentRate: 1.0,
    adjustedUnitPrice: 28480514,
    notes: 'Căn hộ cùng trục, diện tích tương đương 102m2, bàn giao full nội thất cơ bản'
  },
  {
    id: 'ss-2',
    name: 'Tài sản so sánh 2: Căn hộ 1502 Tòa CT2 KĐT Đại Thanh',
    source: 'Chợ Tốt Nhà & Khảo sát trực tiếp thực địa',
    contactPhone: '0915 678 999 (Chính chủ chị Mai)',
    surveyDate: '01/08/2024',
    address: 'Tầng 15, Tòa CT2 Đại Thanh, Tả Thanh Oai, Thanh Trì',
    area: 98.5,
    floorsOrFloorLevel: 'Tầng 15 / 32 tầng',
    direction: 'Nam',
    legalStatus: 'Đã có sổ đỏ',
    askingPrice: 2820000000,
    askingUnitPrice: 28629441,
    negotiationRate: -3.0,
    transactionUnitPrice: 27770558,
    adjustmentRate: 2.5,
    adjustedUnitPrice: 28464822,
    notes: 'Dự án liền kề, cùng phân khúc bình dân, tầng cao view thoáng'
  },
  {
    id: 'ss-3',
    name: 'Tài sản so sánh 3: Căn hộ 1106 Tòa CT1 Tổ hợp Tả Thanh Oai',
    source: 'Văn phòng giao dịch BĐS Thanh Trì',
    contactPhone: '0973 111 222 (Anh Tuấn Trưởng phòng GD)',
    surveyDate: '01/08/2024',
    address: 'Tầng 11, Tòa CT1 Tổ hợp Tả Thanh Oai, Thanh Trì',
    area: 106.0,
    floorsOrFloorLevel: 'Tầng 11 / 25 tầng',
    direction: 'Đông Bắc',
    legalStatus: 'Hợp đồng mua bán & Đã nộp hồ sơ cấp sổ',
    askingPrice: 3050000000,
    askingUnitPrice: 28773584,
    negotiationRate: -2.0,
    transactionUnitPrice: 28198113,
    adjustmentRate: 1.2,
    adjustedUnitPrice: 28536490,
    notes: 'Cùng tòa nhà CT1, diện tích 106m2, căn góc 3 phòng ngủ view hồ'
  }
];

const DEFAULT_CLCL_SHEET: ClclCalculationSheet = {
  buildingClassification: 'Công trình nhà ở chung cư nhiều tầng - Cấp II',
  designLifespanYears: 50,
  constructionYear: 2020,
  appraisalYear: 2024,
  usedYears: 4,
  baseDepreciationRate: 8.0,
  finalClclRate: 85,
  newConstructionUnitPrice: 6500000,
  usableFloorArea: 104.5,
  newReplacementValue: 679250000,
  remainingStructureValue: 577362500,
  components: [
    {
      id: 'cmp-1',
      componentName: '1. Móng, khung cột, dầm, giằng, sàn bê tông cốt thép',
      weightRate: 30,
      actualQualityRate: 90,
      weightedQuality: 27.0,
      conditionDescription: 'Khung dầm sàn BTCT kiên cố, không nứt lún, kết cấu ổn định'
    },
    {
      id: 'cmp-2',
      componentName: '2. Tường bao che, tường ngăn, vách ngăn căn hộ',
      weightRate: 15,
      actualQualityRate: 85,
      weightedQuality: 12.75,
      conditionDescription: 'Tường gạch vữa xi măng, sơn bả phẳng, không bong tróc'
    },
    {
      id: 'cmp-3',
      componentName: '3. Mái, trần thạch cao, chống thấm sàn mái và vệ sinh',
      weightRate: 10,
      actualQualityRate: 85,
      weightedQuality: 8.5,
      conditionDescription: 'Trần thạch cao khung chìm, chống thấm khu WC hoạt động tốt'
    },
    {
      id: 'cmp-4',
      componentName: '4. Lát nền, ốp gạch men, hoàn thiện bề mặt',
      weightRate: 15,
      actualQualityRate: 82,
      weightedQuality: 12.3,
      conditionDescription: 'Sàn gạch ceramic 60x60 bóng kiếng, có trầy xước nhẹ'
    },
    {
      id: 'cmp-5',
      componentName: '5. Hệ thống cửa (cửa ra vào, cửa sổ, ban công)',
      weightRate: 10,
      actualQualityRate: 80,
      weightedQuality: 8.0,
      conditionDescription: 'Cửa chính gỗ công nghiệp chống cháy, cửa ban công nhôm kính Xingfa'
    },
    {
      id: 'cmp-6',
      componentName: '6. Thiết bị vệ sinh, điện chiếu sáng, cấp thoát nước',
      weightRate: 15,
      actualQualityRate: 80,
      weightedQuality: 12.0,
      conditionDescription: 'Thiết bị Inax/Viglacera đầy đủ, hệ thống cấp thoát nước ổn định'
    },
    {
      id: 'cmp-7',
      componentName: '7. Thiết bị đặc biệt: Thang máy, PCCC tòa nhà chung cư',
      weightRate: 5,
      actualQualityRate: 89,
      weightedQuality: 4.45,
      conditionDescription: 'Thang máy Mitsubishi vận hành êm, hệ thống báo cháy tự động đạt chuẩn'
    }
  ]
};

export const DossierFormModal: React.FC<DossierFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const isEditing = !!initialData;
  const [activeTab, setActiveTab] = useState<FormSheetTab>('dac_diem_chung_chi_tiet');
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');

  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrNotification, setOcrNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ValuationDossier>>({
    code: '',
    status: 'MOI_GIAO',
    businessUnit: '',
    clientName: '',
    clientCccd: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    receivedDate: new Date().toISOString().split('T')[0],
    receivedTime: '15h30',
    assignedDate: new Date().toISOString().split('T')[0],
    assignedTime: '16h00',
    amcSpecialist: 'Lê Văn Nam',
    advanceFee: 500000,
    surveyDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    surveyTime: '09h00',
    approvalDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    businessUnitSpecialist: '',
    totalValuationFee: 0,
    assetName: '',
    assetCategory: 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT',
    assetAddress: '',

    // Địa chỉ
    landPlotNumber: '',
    mapSheetNumber: '',
    apartmentNumber: '',
    buildingName: '',
    houseNumber: '',
    ward: '',
    district: '',
    province: '',
    googleMapCoords: '',

    // Kỹ thuật
    constructionYear: '2020',
    floorsCount: '1',
    area: undefined,
    areaCertificate: undefined,
    areaExpanded: 0,
    landUseForm: 'Sử dụng riêng',
    landUsePurpose: 'Để ở',
    landUseTerm: 'Lâu dài',
    roadAccessLevel: 'Đường nội bộ khu chung cư, ô tô vào tận nơi',
    roadType: 'Đường bê tông nhựa',
    roadWidth: '8m',
    direction: 'Đông Nam',
    shape: '1. Vuông Vắn',
    frontageWidth: undefined,
    dimension: '',
    businessCondition: 'Để ở',
    infrastructure: '1. Thành phố',
    carQuality: 100,
    otherFactors: 'Căn hộ chung cư tầng cao thoáng mát, 2 phòng ngủ, 2 WC',

    // Công trình
    constructionType: 'Nhà chung cư kết cấu bê tông cốt thép, mái bằng',
    constructionArea: undefined,
    constructionUsableArea: undefined,
    constructionActualArea: undefined,
    buildingFloorsMaterial: 'Khung BTCT, sàn bê tông',
    buildingYear: '2020',
    remainingBuildingQuality: 85,
    constructionUnitPrice: 6500000,

    // Kết quả định giá
    stateLandPrice: 15000000,
    statePriceYear: '2024',
    kCoefficient: 1.5,
    proposedUnitPrice: 28500000,
    appraisedUnitPrice: 28497607,
    marketPrice: 0,
    estimatedValue: 0,
    approvedValue: 0,

    // Quy hoạch
    plannedLandUnit: 'm²',
    plannedLandArea: undefined,
    plannedLandUnitPrice: undefined,
    plannedLandValue: undefined,
    unplannedLandUnit: 'm²',
    unplannedLandArea: undefined,
    unplannedLandUnitPrice: undefined,
    unplannedLandValue: undefined,

    // Sheet 2: thuthapthongtin
    marketComparables: DEFAULT_COMPARABLES,

    // Sheet 4: bang tinh clcl
    clclCalculation: DEFAULT_CLCL_SHEET,
      landValuationTable: DEFAULT_LAND_VALUATION_TABLE,

    // Sheet 6: Kiến nghị & Đề xuất (Mục IV trong các biểu mẫu)
    creditProposal: 'Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng theo quy định của Ngân hàng TMCP Bắc Á.',
    maxLtvRate: 70,
    maxLoanAmount: 0,
    collateralConditions: 'Kiểm tra thực địa ranh giới thửa đất, đối chiếu hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.',
    postDisbursementCheck: 'Định kỳ tối thiểu 06 tháng/lần, Đơn vị kinh doanh phối hợp kiểm tra hiện trạng tài sản bảo đảm, bảo đảm nguyên trạng tài sản và kịp thời phát hiện biến động giá hoặc quy hoạch.',
    otherProposals: '',
    recommendations: '',

    // Quản lý & Pháp lý
    legalDocNumber: '',
    purpose: 'VAY_VON_NGAN_HANG',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    assignedAppraiser: 'Lê Văn Nam',
    branch: 'Chi nhánh Hà Nội',
    serviceFee: 0,
    paymentStatus: 'CHUA_THANH_TOAN',
    priority: 'NORMAL',
    methodUsed: 'Phương pháp so sánh trực tiếp thị trường',
    notes: '',
    assetImages: [],
    documents: [
      { id: 'doc-1', name: 'Giấy chứng nhận QSDĐ / Hợp đồng mua bán căn hộ', status: 'DA_NOP' },
      { id: 'doc-2', name: 'Tờ khai lệ phí trước bạ', status: 'DA_NOP' },
      { id: 'doc-3', name: 'Biên bản khảo sát hiện trạng thực địa', status: 'DA_NOP' }
    ]
  });

  const [imageUrlInput, setImageUrlInput] = useState('');

  const SAMPLE_PHOTOS = [
    { label: 'Căn hộ chung cư', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800' },
    { label: 'Phòng khách & Ban công', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
    { label: 'Sảnh tòa nhà & Mặt tiền', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800' },
    { label: 'Giấy chứng nhận (Sổ đỏ / Sổ hồng)', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800' }
  ];

  // Auto-generate or populate initialData
  useEffect(() => {
    if (initialData) {
      const totalVal = initialData.approvedValue || initialData.marketPrice || initialData.estimatedValue || 0;
      const ltv = initialData.maxLtvRate ?? 70;
      const loanAmt = initialData.maxLoanAmount ?? (totalVal > 0 ? Math.round(totalVal * (ltv / 100)) : 0);

      setFormData({
        ...initialData,
        apartmentNumber: initialData.apartmentNumber || (initialData.houseNumber?.includes('Căn') ? initialData.houseNumber : ''),
        buildingName: initialData.buildingName || '',
        marketComparables: initialData.marketComparables && initialData.marketComparables.length > 0 
          ? initialData.marketComparables 
          : DEFAULT_COMPARABLES,
        clclCalculation: initialData.clclCalculation || DEFAULT_CLCL_SHEET,
        landValuationTable: initialData.landValuationTable || DEFAULT_LAND_VALUATION_TABLE,
        creditProposal: initialData.creditProposal || `Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng cho khách hàng ${initialData.clientName || ''} theo quy định của Ngân hàng TMCP Bắc Á.`,
        maxLtvRate: ltv,
        maxLoanAmount: loanAmt,
        collateralConditions: initialData.collateralConditions || 'Kiểm tra thực địa ranh giới thửa đất, đối chiếu hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.',
        postDisbursementCheck: initialData.postDisbursementCheck || 'Định kỳ tối thiểu 06 tháng/lần, Đơn vị kinh doanh phối hợp kiểm tra hiện trạng tài sản bảo đảm, bảo đảm nguyên trạng tài sản và kịp thời phát hiện biến động giá hoặc quy hoạch.',
        otherProposals: initialData.otherProposals || '',
        recommendations: initialData.recommendations || ''
      });
    } else {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const today = new Date();
      const code = `2024TĐ-AMC${randNum}`;

      setFormData(prev => ({
        ...prev,
        code,
        receivedDate: today.toISOString().split('T')[0],
        receivedTime: '15h30',
        assignedDate: today.toISOString().split('T')[0],
        assignedTime: '16h00',
        surveyDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        surveyTime: '09h00',
        approvalDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'MOI_GIAO',
        priority: 'NORMAL',
        assetCategory: 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT',
        purpose: 'VAY_VON_NGAN_HANG',
        marketComparables: DEFAULT_COMPARABLES,
        clclCalculation: DEFAULT_CLCL_SHEET
      }));
    }
  }, [initialData, isOpen]);

  // Load sample apartment data matching "chung cu.xlsx"
  
    const updateLandValuation = (section: string, colOrVal: any, value: any = undefined) => {
    setFormData(prev => {
      const currentTable = prev.landValuationTable || DEFAULT_LAND_VALUATION_TABLE;
      if (section === 'selectedUnitPrice') {
        const val = typeof colOrVal === 'number' ? colOrVal : (value ?? 0);
        return {
          ...prev,
          appraisedUnitPrice: val,
          landValuationTable: {
            ...currentTable,
            selectedUnitPrice: val
          }
        };
      }
      return {
        ...prev,
        landValuationTable: {
          ...currentTable,
          [section]: {
            ...currentTable[section],
            [colOrVal]: value
          }
        }
      };
    });
  };
  
  const handleLoadSampleChungCu = () => {
    setFormData(prev => ({
      ...prev,
      code: '2024TĐ-AMC5864',
      status: 'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH',
      businessUnit: 'Ngân hàng TMCP Bắc Á - Chi nhánh Hà Thành',
      clientName: 'Nguyễn Viết Chính & Nguyễn Thị Huyền Trang',
      clientCccd: '001198002839',
      clientPhone: '0988 123 456',
      clientEmail: 'nvchinh@bacabank.vn',
      clientAddress: 'Thôn Thượng, xã Tả Thanh Oai, huyện Thanh Trì, Hà Nội',
      receivedDate: '30/07/2024',
      receivedTime: '15h30',
      assignedDate: '30/07/2024',
      assignedTime: '16h00',
      amcSpecialist: 'Lê Văn Nam',
      advanceFee: 500000,
      surveyDate: '01/08/2024',
      surveyTime: '09h00',
      approvalDate: '02/08/2024',
      businessUnitSpecialist: 'Nguyễn Minh Tuấn',
      totalValuationFee: 45299000,

      // Địa chỉ & Căn hộ
      landPlotNumber: '152',
      mapSheetNumber: '39',
      apartmentNumber: 'Căn hộ 1208, Tầng 12',
      buildingName: 'Tòa CT1, Dự án tổ hợp nhà ở, văn phòng làm việc và dịch vụ',
      houseNumber: 'Dự án tổ hợp nhà ở, văn phòng làm việc và dịch vụ',
      ward: 'xã Tả Thanh Oai',
      district: 'huyện Thanh Trì',
      province: 'thành phố Hà Nội',
      assetName: 'Thửa đất số: 152, tờ bản đồ số: 39, Căn hộ chung cư Tả Thanh Oai',
      assetAddress: 'Dự án tổ hợp nhà ở, văn phòng làm việc và dịch vụ, xã Tả Thanh Oai, huyện Thanh Trì, thành phố Hà Nội',
      googleMapCoords: '20.958459, 105.804748',

      // Kỹ thuật
      constructionYear: '2020',
      floorsCount: 'Tầng 12 / 25 tầng',
      areaCertificate: 104.5,
      area: 104.5,
      areaExpanded: 0,
      landUseForm: 'Sử dụng riêng',
      landUsePurpose: 'Để ở',
      landUseTerm: 'Lâu dài',
      roadAccessLevel: 'Đường nội bộ dự án, xe ô tô tránh nhau',
      roadType: 'Đường bê tông nhựa',
      roadWidth: '8m',
      direction: 'Đông Nam',
      shape: '1. Vuông Vắn',
      frontageWidth: 8.5,
      dimension: '8.5m x 12.3m',
      businessCondition: 'Để ở',
      infrastructure: '1. Thành phố',
      carQuality: 100,
      otherFactors: 'Căn hộ 2 phòng ngủ, 2 WC, ban công view thoáng mát, bàn giao hoàn thiện cơ bản',

      // Công trình
      constructionType: 'Nhà BTCT, mái bằng (Chung cư cao tầng)',
      constructionArea: 1390.5,
      constructionUsableArea: 104.5,
      constructionActualArea: 104.5,
      buildingFloorsMaterial: '25 tầng, khung BTCT chịu lực',
      buildingYear: '2020',
      remainingBuildingQuality: 85,
      constructionUnitPrice: 6500000,

      // Giá thẩm định (Bang tinh gia dat)
      stateLandPrice: 15000000,
      statePriceYear: '2024',
      kCoefficient: 1.5,
      proposedUnitPrice: 28500000,
      appraisedUnitPrice: 28497607,
      marketPrice: 2978000000,
      approvedValue: 2978000000,
      estimatedValue: 2978000000,

      // Quy hoạch
      plannedLandUnit: 'm²',
      plannedLandArea: 90.0,
      plannedLandUnitPrice: 28500000,
      plannedLandValue: 2565000000,
      unplannedLandUnit: 'm²',
      unplannedLandArea: 14.5,
      unplannedLandUnitPrice: 15000000,
      unplannedLandValue: 217500000,

      // thuthapthongtin & bang tinh clcl
      marketComparables: DEFAULT_COMPARABLES,
      clclCalculation: DEFAULT_CLCL_SHEET,

      legalDocNumber: 'GCN số DO 665708 do VPĐKĐĐ Hà Nội cấp ngày 25/05/2024. Số vào sổ VP 00283',
      methodUsed: 'Phương pháp so sánh trực tiếp thị trường',
      notes: 'Hồ sơ pháp lý đầy đủ, hợp lệ theo quy định',

      // Kiến nghị mẫu chuẩn BM.02A1
      creditProposal: 'Đề xuất chấp thuận kết quả định giá căn hộ làm cơ sở cấp tín dụng cho khách hàng Nguyễn Viết Chính & Nguyễn Thị Huyền Trang theo đúng quy định của Ngân hàng TMCP Bắc Á.',
      maxLtvRate: 70,
      maxLoanAmount: 2084600000,
      collateralConditions: 'Kiểm tra thực tế hiện trạng căn hộ, hợp đồng mua bán/GCN bản gốc và làm thủ tục thế chấp, đăng ký giao dịch bảo đảm hợp lệ trước khi giải ngân.',
      postDisbursementCheck: 'Định kỳ tối thiểu 06 tháng/lần, Đơn vị kinh doanh phối hợp kiểm tra hiện trạng tài sản bảo đảm, bảo đảm nguyên trạng tài sản và kịp thời phát hiện biến động giá hoặc quy hoạch.',
      otherProposals: 'Tài sản nằm trong khu đô thị dân cư hiện hữu, an ninh tốt, tính thanh khoản trung bình khá.',
      recommendations: ''
    }));

    setOcrNotification('✅ Đã nạp thành công bộ dữ liệu mẫu Căn Hộ Chung Cư từ file chuẩn!');
    setTimeout(() => setOcrNotification(null), 4000);
  };

  // Helper auto-calculate fee
  const handleAutoCalculateFee = () => {
    const val = formData.approvedValue || formData.marketPrice || formData.estimatedValue || 0;
    if (val > 0) {
      let fee = 0;
      if (val <= 2000000000) fee = Math.max(5000000, val * 0.0025);
      else if (val <= 10000000000) fee = 5000000 + (val - 2000000000) * 0.0018;
      else if (val <= 50000000000) fee = 19400000 + (val - 10000000000) * 0.0012;
      else fee = 67400000 + (val - 50000000000) * 0.0008;

      const rounded = Math.round(fee / 100000) * 100000;
      setFormData(prev => ({ 
        ...prev, 
        totalValuationFee: rounded,
        serviceFee: rounded 
      }));
    }
  };

  // Auto-compose Asset Name and Full Address
  const handleAutoComposeNames = () => {
    const partsName: string[] = [];
    if (formData.apartmentNumber) partsName.push(formData.apartmentNumber);
    if (formData.buildingName) partsName.push(formData.buildingName);
    if (formData.landPlotNumber) partsName.push(`Thửa ${formData.landPlotNumber}`);
    if (formData.mapSheetNumber) partsName.push(`TBĐ ${formData.mapSheetNumber}`);
    if (formData.ward) partsName.push(formData.ward);

    const partsAddress: string[] = [];
    if (formData.houseNumber) partsAddress.push(formData.houseNumber);
    else if (formData.buildingName) partsAddress.push(formData.buildingName);
    if (formData.ward) partsAddress.push(formData.ward);
    if (formData.district) partsAddress.push(formData.district);
    if (formData.province) partsAddress.push(formData.province);

    setFormData(prev => ({
      ...prev,
      assetName: partsName.join(', ') || prev.assetName || 'Căn hộ chung cư',
      assetAddress: partsAddress.join(', ') || prev.assetAddress || ''
    }));
  };

  // Calculate average indicated unit price from comparables
  const handleApplyAverageComparablePrice = () => {
    const comps = formData.marketComparables || [];
    if (comps.length === 0) return;
    const sum = comps.reduce((acc, c) => acc + (c.adjustedUnitPrice || 0), 0);
    const avg = Math.round(sum / comps.length);
    const totalArea = formData.areaCertificate || formData.area || 104.5;
    const totalVal = Math.round(avg * totalArea);

    setFormData(prev => ({
      ...prev,
      appraisedUnitPrice: avg,
      proposedUnitPrice: avg,
      marketPrice: totalVal,
      approvedValue: totalVal,
      estimatedValue: totalVal,
      plannedLandUnitPrice: avg,
      plannedLandArea: totalArea,
      plannedLandValue: totalVal
    }));

    setOcrNotification(`🎯 Đã áp dụng đơn giá chỉ dẫn trung bình ${formatVND(avg)}/m² vào Bảng tính giá đất!`);
    setTimeout(() => setOcrNotification(null), 4000);
  };

  // Re-calculate CLCL total rate from components
  const handleRecalculateClcl = () => {
    const clcl = formData.clclCalculation;
    if (!clcl || !clcl.components) return;
    const totalScore = clcl.components.reduce((acc, c) => {
      const itemScore = (c.weightRate * (c.actualQualityRate || 0)) / 100;
      return acc + itemScore;
    }, 0);
    const roundedRate = Math.round(totalScore);
    const area = clcl.usableFloorArea || formData.constructionActualArea || formData.areaCertificate || 104.5;
    const unitPrice = clcl.newConstructionUnitPrice || formData.constructionUnitPrice || 6500000;
    const newVal = Math.round(area * unitPrice);
    const remVal = Math.round(newVal * (roundedRate / 100));

    setFormData(prev => ({
      ...prev,
      remainingBuildingQuality: roundedRate,
      clclCalculation: {
        ...(prev.clclCalculation || DEFAULT_CLCL_SHEET),
        finalClclRate: roundedRate,
        usableFloorArea: area,
        newConstructionUnitPrice: unitPrice,
        newReplacementValue: newVal,
        remainingStructureValue: remVal
      }
    }));
  };

  // Merge OCR scan results into form
  const handleApplyOcrData = (extracted: ExtractedOcrData, docImage?: string) => {
    setFormData(prev => {
      const updatedDocs = [...(prev.documents || [])];
      if (extracted.legalDocNumber) {
        updatedDocs.unshift({
          id: `doc-ocr-${Date.now()}`,
          name: `Giấy tờ pháp lý: ${extracted.legalDocNumber}`,
          status: 'DA_NOP'
        });
      }

      return {
        ...prev,
        clientName: extracted.clientName || prev.clientName,
        clientCccd: extracted.clientCccd || prev.clientCccd,
        clientAddress: extracted.clientAddress || prev.clientAddress,
        clientPhone: extracted.clientPhone || prev.clientPhone,
        clientEmail: extracted.clientEmail || prev.clientEmail,
        assetName: extracted.assetName || prev.assetName,
        assetCategory: extracted.assetCategory || prev.assetCategory,
        assetAddress: extracted.assetAddress || prev.assetAddress,
        legalDocNumber: extracted.legalDocNumber || prev.legalDocNumber,
        area: extracted.area !== undefined ? extracted.area : prev.area,
        areaCertificate: extracted.area !== undefined ? extracted.area : prev.areaCertificate,
        landPlotNumber: extracted.landPlotNumber || prev.landPlotNumber,
        mapSheetNumber: extracted.mapSheetNumber || prev.mapSheetNumber,
        landUseForm: extracted.landUseForm || prev.landUseForm,
        landUsePurpose: extracted.landUsePurpose || prev.landUsePurpose,
        landUseTerm: extracted.landUseTerm || prev.landUseTerm,
        houseNumber: extracted.houseNumber || prev.houseNumber,
        ward: extracted.ward || prev.ward,
        district: extracted.district || prev.district,
        province: extracted.province || prev.province,
        constructionType: extracted.constructionType || prev.constructionType,
        constructionArea: extracted.constructionArea !== undefined ? extracted.constructionArea : prev.constructionArea,
        constructionUsableArea: extracted.constructionUsableArea !== undefined ? extracted.constructionUsableArea : prev.constructionUsableArea,
        floorsCount: extracted.floorsCount || prev.floorsCount,
        buildingYear: extracted.buildingYear || prev.buildingYear,
        estimatedValue: extracted.estimatedValue || prev.estimatedValue,
        approvedValue: extracted.estimatedValue ? Math.round(extracted.estimatedValue * 0.98 / 1000000) * 1000000 : prev.approvedValue,
        marketPrice: extracted.estimatedValue || prev.marketPrice,
        serviceFee: extracted.serviceFee || prev.serviceFee,
        totalValuationFee: extracted.serviceFee || prev.totalValuationFee,
        documents: updatedDocs,
        assetImages: docImage ? [docImage, ...(prev.assetImages || [])] : prev.assetImages
      };
    });

    setOcrNotification('✨ Đã quét OCR thành công! Dữ liệu đã được tự động điền vào các Sheet tương ứng.');
    setTimeout(() => setOcrNotification(null), 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const newImg = reader.result;
          setFormData(prev => ({
            ...prev,
            assetImages: [...(prev.assetImages || []), newImg]
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      assetImages: [...(prev.assetImages || []), imageUrlInput.trim()]
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assetImages: (prev.assetImages || []).filter((_, i) => i !== index)
    }));
  };

  const handleNextTab = () => {
    const order: FormSheetTab[] = [
      'dac_diem_chung_chi_tiet', 
      'thuthapthongtin', 
      'bang_tinh_gia_dat', 
      'bang_tinh_clcl', 
      'phap_ly_va_anh',
      'kien_nghi'
    ];
    const currIdx = order.indexOf(activeTab);
    if (currIdx < order.length - 1) {
      setActiveTab(order[currIdx + 1]);
    }
  };

  const handlePrevTab = () => {
    const order: FormSheetTab[] = [
      'dac_diem_chung_chi_tiet', 
      'thuthapthongtin', 
      'bang_tinh_gia_dat', 
      'bang_tinh_clcl', 
      'phap_ly_va_anh',
      'kien_nghi'
    ];
    const currIdx = order.indexOf(activeTab);
    if (currIdx > 0) {
      setActiveTab(order[currIdx - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.clientName || !formData.assetName) {
      alert('Vui lòng điền đầy đủ: Mã hồ sơ, Tên khách hàng và Tên tài sản!');
      return;
    }

    const marketOrApproved = Number(formData.approvedValue) || Number(formData.marketPrice) || Number(formData.estimatedValue) || 0;
    const feeVal = Number(formData.totalValuationFee) || Number(formData.serviceFee) || 0;

    const dossierToSave: ValuationDossier = {
      ...(initialData || {}),
      id: formData.id || (initialData?.id ?? `HS-${Date.now()}`),
      code: formData.code || '',
      status: (formData.status as DossierStatus) || 'MOI_GIAO',
      businessUnit: formData.businessUnit || '',
      clientName: formData.clientName || '',
      clientCccd: formData.clientCccd || '',
      clientPhone: formData.clientPhone || '',
      clientEmail: formData.clientEmail || '',
      clientAddress: formData.clientAddress || '',
      receivedDate: formData.receivedDate || new Date().toISOString().split('T')[0],
      receivedTime: formData.receivedTime || '',
      assignedDate: formData.assignedDate || '',
      assignedTime: formData.assignedTime || '',
      amcSpecialist: formData.amcSpecialist || formData.assignedAppraiser || 'Lê Văn Nam',
      advanceFee: Number(formData.advanceFee) || 0,
      surveyDate: formData.surveyDate || '',
      surveyTime: formData.surveyTime || '',
      approvalDate: formData.approvalDate || '',
      businessUnitSpecialist: formData.businessUnitSpecialist || '',
      totalValuationFee: feeVal,

      assetName: formData.assetName || '',
      assetCategory: (formData.assetCategory as AssetCategory) || 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT',
      assetAddress: formData.assetAddress || '',

      // Sheet 1: Địa chỉ & Căn hộ
      landPlotNumber: formData.landPlotNumber,
      mapSheetNumber: formData.mapSheetNumber,
      apartmentNumber: formData.apartmentNumber,
      buildingName: formData.buildingName,
      houseNumber: formData.houseNumber,
      ward: formData.ward,
      district: formData.district,
      province: formData.province,
      googleMapCoords: formData.googleMapCoords,

      // Sheet 1: Thông số kỹ thuật
      constructionYear: formData.constructionYear,
      floorsCount: formData.floorsCount,
      area: formData.area || formData.areaCertificate,
      areaCertificate: formData.areaCertificate || formData.area,
      areaExpanded: Number(formData.areaExpanded) || 0,
      landUseForm: formData.landUseForm,
      landUsePurpose: formData.landUsePurpose,
      landUseTerm: formData.landUseTerm,
      roadAccessLevel: formData.roadAccessLevel,
      roadType: formData.roadType,
      roadWidth: formData.roadWidth,
      direction: formData.direction,
      shape: formData.shape,
      frontageWidth: formData.frontageWidth !== undefined ? Number(formData.frontageWidth) : undefined,
      dimension: formData.dimension,
      businessCondition: formData.businessCondition,
      infrastructure: formData.infrastructure,
      carQuality: formData.carQuality !== undefined ? Number(formData.carQuality) : undefined,
      otherFactors: formData.otherFactors,

      // Sheet 2: thuthapthongtin
      marketComparables: formData.marketComparables || DEFAULT_COMPARABLES,

      // Sheet 3: Bang tinh gia dat
      stateLandPrice: formData.stateLandPrice !== undefined ? Number(formData.stateLandPrice) : undefined,
      statePriceYear: formData.statePriceYear,
      kCoefficient: formData.kCoefficient !== undefined ? Number(formData.kCoefficient) : undefined,
      proposedUnitPrice: formData.proposedUnitPrice !== undefined ? Number(formData.proposedUnitPrice) : undefined,
      appraisedUnitPrice: formData.appraisedUnitPrice !== undefined ? Number(formData.appraisedUnitPrice) : undefined,
      marketPrice: marketOrApproved,
      approvedValue: marketOrApproved,
      estimatedValue: Number(formData.estimatedValue) || marketOrApproved,

      plannedLandUnit: formData.plannedLandUnit || 'm²',
      plannedLandArea: formData.plannedLandArea !== undefined ? Number(formData.plannedLandArea) : undefined,
      plannedLandUnitPrice: formData.plannedLandUnitPrice !== undefined ? Number(formData.plannedLandUnitPrice) : undefined,
      plannedLandValue: formData.plannedLandValue !== undefined ? Number(formData.plannedLandValue) : undefined,
      unplannedLandUnit: formData.unplannedLandUnit || 'm²',
      unplannedLandArea: formData.unplannedLandArea !== undefined ? Number(formData.unplannedLandArea) : undefined,
      unplannedLandUnitPrice: formData.unplannedLandUnitPrice !== undefined ? Number(formData.unplannedLandUnitPrice) : undefined,
      unplannedLandValue: formData.unplannedLandValue !== undefined ? Number(formData.unplannedLandValue) : undefined,
      landPlanningValuation: {
        plannedArea: {
          landType: 'Diện tích phù hợp với quy hoạch',
          unit: formData.plannedLandUnit || 'm²',
          quantity: formData.plannedLandArea !== undefined ? Number(formData.plannedLandArea) : undefined,
          unitPrice: formData.plannedLandUnitPrice !== undefined ? Number(formData.plannedLandUnitPrice) : undefined,
          totalPrice: formData.plannedLandValue !== undefined ? Number(formData.plannedLandValue) : undefined
        },
        unplannedArea: {
          landType: 'Diện tích không phù hợp với quy hoạch',
          unit: formData.unplannedLandUnit || 'm²',
          quantity: formData.unplannedLandArea !== undefined ? Number(formData.unplannedLandArea) : undefined,
          unitPrice: formData.unplannedLandUnitPrice !== undefined ? Number(formData.unplannedLandUnitPrice) : undefined,
          totalPrice: formData.unplannedLandValue !== undefined ? Number(formData.unplannedLandValue) : undefined
        },
        totalQuantity: ((Number(formData.plannedLandArea) || 0) + (Number(formData.unplannedLandArea) || 0)) || undefined,
        totalPrice: ((Number(formData.plannedLandValue) || 0) + (Number(formData.unplannedLandValue) || 0)) || undefined
      },

      // Sheet 4: bang tinh clcl
      clclCalculation: formData.clclCalculation || DEFAULT_CLCL_SHEET,
      constructionType: formData.constructionType,
      constructionArea: formData.constructionArea !== undefined ? Number(formData.constructionArea) : undefined,
      constructionUsableArea: formData.constructionUsableArea !== undefined ? Number(formData.constructionUsableArea) : undefined,
      constructionActualArea: formData.constructionActualArea !== undefined ? Number(formData.constructionActualArea) : undefined,
      buildingFloorsMaterial: formData.buildingFloorsMaterial,
      buildingYear: formData.buildingYear,
      remainingBuildingQuality: formData.remainingBuildingQuality !== undefined ? Number(formData.remainingBuildingQuality) : 85,
      constructionUnitPrice: formData.constructionUnitPrice !== undefined ? Number(formData.constructionUnitPrice) : 6500000,

      // Sheet 5: Pháp lý & Khác
      legalDocNumber: formData.legalDocNumber,
      purpose: (formData.purpose as ValuationPurpose) || 'VAY_VON_NGAN_HANG',
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      assignedAppraiser: formData.assignedAppraiser || 'Lê Văn Nam',
      branch: formData.branch || 'Chi nhánh Hà Nội',
      serviceFee: feeVal,
      paymentStatus: (formData.paymentStatus as PaymentStatus) || 'CHUA_THANH_TOAN',
      priority: (formData.priority as DossierPriority) || 'NORMAL',
      methodUsed: formData.methodUsed || 'Phương pháp so sánh trực tiếp thị trường',
      notes: formData.notes || '',
      assetImages: formData.assetImages || [],
      documents: formData.documents || [],
      statusHistory: formData.statusHistory || [
        {
          status: (formData.status as DossierStatus) || 'MOI_GIAO',
          note: isEditing ? 'Cập nhật thông tin hồ sơ theo 4 Sheet chung cu.xlsx' : 'Khởi tạo hồ sơ định giá mới chuẩn 4 Sheet chung cu.xlsx',
          updatedAt: new Date().toLocaleString('vi-VN'),
          updatedBy: 'Chuyên viên'
        }
      ],
      // Sheet 6: Kiến nghị & Đề xuất (Mục IV trong các biểu mẫu)
      creditProposal: formData.creditProposal,
      maxLtvRate: formData.maxLtvRate !== undefined ? Number(formData.maxLtvRate) : undefined,
      maxLoanAmount: formData.maxLoanAmount !== undefined ? Number(formData.maxLoanAmount) : undefined,
      collateralConditions: formData.collateralConditions,
      postDisbursementCheck: formData.postDisbursementCheck,
      otherProposals: formData.otherProposals,
      recommendations: formData.recommendations,

      importedColumnsData: initialData?.importedColumnsData,
      customFields: initialData?.customFields,
      totalImportedColumns: initialData?.totalImportedColumns
    };

    onSave(dossierToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-3 sm:my-6 flex flex-col max-h-[94vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {isEditing ? `Hồ Sơ: ${formData.code || ''}` : 'Tạo Hồ Sơ Thẩm Định Giá Mới'}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  Chuẩn 4 Sheet file chung cu.xlsx
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                ĐẶC ĐIỂM CHUNG,CHI TIẾT • thuthapthongtin • Bang tinh gia dat • bang tinh clcl
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleLoadSampleChungCu}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg text-xs font-semibold transition"
              title="Điền mẫu đầy đủ dữ liệu 4 Sheet từ căn hộ chung cư 2024TĐ-AMC5864"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Nạp Dữ Liệu Mẫu 4 Sheet</span>
              <span className="md:hidden">Mẫu 4 Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition"
              title="Quét tài liệu CCCD, Sổ đỏ tự động điền form"
            >
              <Scan className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Quét OCR AI</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* OCR / Info Notification Toast */}
        {ocrNotification && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-2 shrink-0 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{ocrNotification}</span>
          </div>
        )}

        {/* 4 SHEET TABS - EXACTLY MATCHING USER'S EXCEL FILE */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 overflow-x-auto">
          <div className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {SHEET_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (viewMode === 'all') setViewMode('tabs');
                  }}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-t-lg text-xs font-bold transition whitespace-nowrap border-b-2 ${
                    isActive && viewMode === 'tabs'
                      ? 'bg-white text-blue-700 border-blue-600 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 border-transparent font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="font-mono tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-1 pb-2 sm:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
                viewMode === 'tabs'
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              📑 Từng Sheet
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              📜 Tất cả Sheet
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* ========================================================= */}
          {/* SHEET 1: ĐẶC ĐIỂM CHUNG,CHI TIẾT                         */}
          {/* ========================================================= */}
          {(viewMode === 'all' || activeTab === 'dac_diem_chung_chi_tiet') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-blue-900 tracking-wider">
                      Sheet 1: ĐẶC ĐIỂM CHUNG,CHI TIẾT
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Thông tin chung hồ sơ, khách hàng, vị trí thửa đất/căn hộ & thông số kỹ thuật chi tiết
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoComposeNames}
                  className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg font-semibold flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ghép Tên & Địa Chỉ</span>
                </button>
              </div>

              {/* Phần 1A: Hồ sơ & Khách hàng */}
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>1A. Thông tin hồ sơ & Khách hàng</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã hồ sơ (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 2024TĐ-AMC5864"
                      value={formData.code || ''}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái hồ sơ</label>
                    <select
                      value={formData.status || 'MOI_GIAO'}
                      onChange={e => setFormData({ ...formData, status: e.target.value as DossierStatus })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                        <option key={k} value={k}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị kinh doanh (Chi nhánh)</label>
                    <input
                      type="text"
                      placeholder="VD: Ngân hàng Bắc Á - Chi nhánh Hà Thành"
                      value={formData.businessUnit || ''}
                      onChange={e => setFormData({ ...formData, businessUnit: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên khách hàng (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Viết Chính & Nguyễn Thị Huyền Trang"
                      value={formData.clientName || ''}
                      onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số CCCD / CMND</label>
                    <input
                      type="text"
                      placeholder="VD: 001198002839"
                      value={formData.clientCccd || ''}
                      onChange={e => setFormData({ ...formData, clientCccd: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 0988 123 456"
                      value={formData.clientPhone || ''}
                      onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày tiếp nhận (Giờ, Ngày)</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        placeholder="15h30"
                        value={formData.receivedTime || ''}
                        onChange={e => setFormData({ ...formData, receivedTime: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="30/07/2024"
                        value={formData.receivedDate || ''}
                        onChange={e => setFormData({ ...formData, receivedDate: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày phân công (Giờ, Ngày)</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        placeholder="16h00"
                        value={formData.assignedTime || ''}
                        onChange={e => setFormData({ ...formData, assignedTime: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="30/07/2024"
                        value={formData.assignedDate || ''}
                        onChange={e => setFormData({ ...formData, assignedDate: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chuyên viên AMC</label>
                    <input
                      type="text"
                      placeholder="VD: Lê Văn Nam"
                      value={formData.amcSpecialist || formData.assignedAppraiser || ''}
                      onChange={e => setFormData({ ...formData, amcSpecialist: e.target.value, assignedAppraiser: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phí tạm ứng (VNĐ)</label>
                    <input
                      type="number"
                      placeholder="VD: 500000"
                      value={formData.advanceFee ?? ''}
                      onChange={e => setFormData({ ...formData, advanceFee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono text-emerald-700 font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày khảo sát (Giờ, Ngày)</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        placeholder="09h00"
                        value={formData.surveyTime || ''}
                        onChange={e => setFormData({ ...formData, surveyTime: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="01/08/2024"
                        value={formData.surveyDate || ''}
                        onChange={e => setFormData({ ...formData, surveyDate: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày phê duyệt</label>
                    <input
                      type="text"
                      placeholder="VD: 02/08/2024"
                      value={formData.approvalDate || ''}
                      onChange={e => setFormData({ ...formData, approvalDate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chuyên viên tín dụng (ĐVKD)</label>
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Minh Tuấn"
                      value={formData.creditOfficer || formData.businessUnitSpecialist || ''}
                      onChange={e => setFormData({ ...formData, businessUnitSpecialist: e.target.value, creditOfficer: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Tổng phí thẩm định (VNĐ)</label>
                      <button
                        type="button"
                        onClick={handleAutoCalculateFee}
                        className="text-[10px] text-blue-700 hover:text-blue-800 font-bold underline"
                      >
                        Tự tính
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder="VD: 45299000"
                      value={formData.totalValuationFee ?? ''}
                      onChange={e => setFormData({ ...formData, totalValuationFee: parseFloat(e.target.value) || 0, serviceFee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono text-emerald-700 font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Loại tài sản</label>
                    <select
                      value={formData.assetCategory || 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT'}
                      onChange={e => setFormData({ ...formData, assetCategory: e.target.value as AssetCategory })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(ASSET_CATEGORY_CONFIG).map(([k, cfg]) => (
                        <option key={k} value={k}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ thường trú khách hàng</label>
                    <input
                      type="text"
                      placeholder="VD: Thôn Thượng, xã Tả Thanh Oai, huyện Thanh Trì, thành phố Hà Nội"
                      value={formData.clientAddress || ''}
                      onChange={e => setFormData({ ...formData, clientAddress: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phần 1B: Địa chỉ thửa đất & Căn hộ */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>1B. Địa chỉ thửa đất & Căn hộ chung cư</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Thửa đất số</label>
                    <input
                      type="text"
                      placeholder="VD: 152"
                      value={formData.landPlotNumber || ''}
                      onChange={e => setFormData({ ...formData, landPlotNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tờ bản đồ số</label>
                    <input
                      type="text"
                      placeholder="VD: 39"
                      value={formData.mapSheetNumber || ''}
                      onChange={e => setFormData({ ...formData, mapSheetNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số căn hộ / Tầng</label>
                    <input
                      type="text"
                      placeholder="VD: Căn hộ 1208, Tầng 12"
                      value={formData.apartmentNumber || ''}
                      onChange={e => setFormData({ ...formData, apartmentNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-amber-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên tòa nhà / Dự án</label>
                    <input
                      type="text"
                      placeholder="VD: Tòa CT1, Chung cư Tả Thanh Oai"
                      value={formData.buildingName || ''}
                      onChange={e => setFormData({ ...formData, buildingName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số nhà, Ngõ, Ngách, Hẻm</label>
                    <input
                      type="text"
                      placeholder="VD: Dự án tổ hợp nhà ở, văn phòng làm việc và dịch vụ"
                      value={formData.houseNumber || ''}
                      onChange={e => setFormData({ ...formData, houseNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Xã/Thị trấn/Phường</label>
                    <input
                      type="text"
                      placeholder="VD: xã Tả Thanh Oai"
                      value={formData.ward || ''}
                      onChange={e => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Huyện/Thị xã/Quận</label>
                    <input
                      type="text"
                      placeholder="VD: huyện Thanh Trì"
                      value={formData.district || ''}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tỉnh/Thành phố</label>
                    <input
                      type="text"
                      placeholder="VD: thành phố Hà Nội"
                      value={formData.province || ''}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tọa độ Google Maps</label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        placeholder="20.958459, 105.804748"
                        value={formData.googleMapCoords || ''}
                        onChange={e => setFormData({ ...formData, googleMapCoords: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                      />
                      {formData.googleMapCoords && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.googleMapCoords)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded shrink-0 flex items-center justify-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên tài sản định giá (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Thửa đất số 152, Tờ bản đồ 39 (Căn hộ chung cư Tả Thanh Oai)"
                      value={formData.assetName || ''}
                      onChange={e => setFormData({ ...formData, assetName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ vị trí tài sản đầy đủ</label>
                    <input
                      type="text"
                      placeholder="VD: Dự án tổ hợp nhà ở, văn phòng làm việc và dịch vụ, xã Tả Thanh Oai, huyện Thanh Trì, thành phố Hà Nội"
                      value={formData.assetAddress || ''}
                      onChange={e => setFormData({ ...formData, assetAddress: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phần 1C: Thông số kỹ thuật chi tiết */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>1C. Thông số kỹ thuật chi tiết căn hộ / đất</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Năm xây dựng chung cư</label>
                    <input
                      type="text"
                      placeholder="VD: 2020"
                      value={formData.constructionYear || ''}
                      onChange={e => setFormData({ ...formData, constructionYear: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số tầng / Vị trí tầng</label>
                    <input
                      type="text"
                      placeholder="VD: Tầng 12 / 25 tầng"
                      value={formData.floorsCount || ''}
                      onChange={e => setFormData({ ...formData, floorsCount: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Diện tích theo sổ đỏ (m²) (*)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="VD: 104.5"
                      value={formData.areaCertificate ?? formData.area ?? ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, areaCertificate: val, area: val });
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Diện tích cơi nới (m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="VD: 0"
                      value={formData.areaExpanded ?? ''}
                      onChange={e => setFormData({ ...formData, areaExpanded: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hình thức sử dụng</label>
                    <select
                      value={formData.landUseForm || 'Sử dụng riêng'}
                      onChange={e => setFormData({ ...formData, landUseForm: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Sử dụng riêng">Sử dụng riêng</option>
                      <option value="Sử dụng chung">Sử dụng chung</option>
                      <option value="Sử dụng riêng và chung">Sử dụng riêng và chung</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Thời hạn sử dụng</label>
                    <select
                      value={formData.landUseTerm || 'Lâu dài'}
                      onChange={e => setFormData({ ...formData, landUseTerm: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Lâu dài">Lâu dài</option>
                      <option value="Có thời hạn 50 năm">Có thời hạn 50 năm</option>
                      <option value="Đến năm 2070">Đến năm 2070</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hướng / Ban công</label>
                    <select
                      value={formData.direction || 'Đông Nam'}
                      onChange={e => setFormData({ ...formData, direction: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Đông Nam">Đông Nam</option>
                      <option value="Nam">Nam</option>
                      <option value="Tây Nam">Tây Nam</option>
                      <option value="Đông">Đông</option>
                      <option value="Tây">Tây</option>
                      <option value="Đông Bắc">Đông Bắc</option>
                      <option value="Bắc">Bắc</option>
                      <option value="Tây Bắc">Tây Bắc</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hình dạng (chuẩn Excel)</label>
                    <select
                      value={formData.shape || '1. Vuông Vắn'}
                      onChange={e => setFormData({ ...formData, shape: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="1. Vuông Vắn">1. Vuông Vắn</option>
                      <option value="2. Cân Đối">2. Cân Đối</option>
                      <option value="3. Nở Hậu">3. Nở Hậu</option>
                      <option value="4. Thóp Hậu">4. Thóp Hậu</option>
                      <option value="5. Đa Giác">5. Đa Giác</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Đường vào tài sản: Cấp độ & Loại đường</label>
                    <input
                      type="text"
                      placeholder="VD: Đường nội bộ dự án, xe ô tô tránh nhau, đường bê tông nhựa"
                      value={formData.roadAccessLevel || ''}
                      onChange={e => setFormData({ ...formData, roadAccessLevel: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Độ rộng đường (m)</label>
                    <input
                      type="text"
                      placeholder="VD: 8m"
                      value={formData.roadWidth || ''}
                      onChange={e => setFormData({ ...formData, roadWidth: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cơ sở hạ tầng</label>
                    <select
                      value={formData.infrastructure || '1. Thành phố'}
                      onChange={e => setFormData({ ...formData, infrastructure: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="1. Thành phố">1. Thành phố</option>
                      <option value="2. Thị Xã">2. Thị Xã</option>
                      <option value="3. Thị Trấn">3. Thị Trấn</option>
                      <option value="4. Thị Tứ">4. Thị Tứ</option>
                      <option value="5. Nông thôn">5. Nông thôn</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Yếu tố khác / Tiện ích căn hộ</label>
                    <input
                      type="text"
                      placeholder="VD: Căn hộ góc 2 mặt thoáng, 2 phòng ngủ, 2 WC, ban công view thoáng mát, đầy đủ tiện ích nội khu"
                      value={formData.otherFactors || ''}
                      onChange={e => setFormData({ ...formData, otherFactors: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SHEET 2: thuthapthongtin (Thu thập thông tin so sánh)     */}
          {/* ========================================================= */}
          {(viewMode === 'all' || activeTab === 'thuthapthongtin') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-emerald-900 tracking-wider">
                      Sheet 2: thuthapthongtin
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Bảng thu thập thông tin thị trường, so sánh giá chào bán & xác định đơn giá chỉ dẫn
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleApplyAverageComparablePrice}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1.5"
                    title="Tính đơn giá chỉ dẫn trung bình từ các TSSS và cập nhật sang Sheet Bang tinh gia dat"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Áp dụng Đơn giá TB sang Sheet 3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newComp: MarketComparable = {
                        id: `ss-${Date.now()}`,
                        name: `Tài sản so sánh ${(formData.marketComparables?.length || 0) + 1}`,
                        source: 'batdongsan.com.vn',
                        contactPhone: '',
                        surveyDate: new Date().toISOString().split('T')[0],
                        address: 'Khu vực lân cận dự án',
                        area: formData.areaCertificate || 100,
                        floorsOrFloorLevel: 'Tầng trung',
                        direction: 'Đông Nam',
                        legalStatus: 'Sổ đỏ chính chủ',
                        askingPrice: 2900000000,
                        askingUnitPrice: 29000000,
                        negotiationRate: -2.5,
                        transactionUnitPrice: 28275000,
                        adjustmentRate: 1.0,
                        adjustedUnitPrice: 28557750,
                        notes: 'Vị trí tương đồng'
                      };
                      setFormData(prev => ({
                        ...prev,
                        marketComparables: [...(prev.marketComparables || []), newComp]
                      }));
                    }}
                    className="text-xs bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm TSSS</span>
                  </button>
                </div>
              </div>

              {/* Bảng danh sách Tài sản so sánh */}
              <div className="space-y-4">
                {(formData.marketComparables || []).map((comp, idx) => (
                  <div key={comp.id || idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={comp.name}
                          onChange={e => {
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="font-bold text-slate-900 text-sm border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Chỉ dẫn: {formatVND(comp.adjustedUnitPrice)}/m²
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.marketComparables || []).filter((_, i) => i !== idx);
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                          title="Xóa tài sản so sánh này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-medium">Nguồn thông tin & ID</label>
                        <input
                          type="text"
                          value={comp.source || ''}
                          onChange={e => {
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].source = e.target.value;
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1"
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-0.5 font-medium">Số ĐT liên hệ / Môi giới</label>
                        <input
                          type="text"
                          value={comp.contactPhone || ''}
                          onChange={e => {
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].contactPhone = e.target.value;
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-0.5 font-medium">Diện tích (m²)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={comp.area || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].area = val;
                            if (val > 0 && updated[idx].askingPrice) {
                              updated[idx].askingUnitPrice = Math.round(updated[idx].askingPrice / val);
                            }
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-0.5 font-medium">Vị trí tầng / Tòa</label>
                        <input
                          type="text"
                          value={comp.floorsOrFloorLevel || ''}
                          onChange={e => {
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].floorsOrFloorLevel = e.target.value;
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1"
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-0.5 font-medium">Giá rao bán (VNĐ)</label>
                        <input
                          type="number"
                          value={comp.askingPrice || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].askingPrice = val;
                            if (comp.area > 0 && val > 0) {
                              updated[idx].askingUnitPrice = Math.round(val / comp.area);
                              const negRate = updated[idx].negotiationRate || 0;
                              const postNeg = Math.round(updated[idx].askingUnitPrice * (1 + negRate / 100));
                              updated[idx].transactionUnitPrice = postNeg;
                              const adjRate = updated[idx].adjustmentRate || 0;
                              updated[idx].adjustedUnitPrice = Math.round(postNeg * (1 + adjRate / 100));
                            }
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-0.5 font-medium">Đơn giá rao bán (VNĐ/m²)</label>
                        <input
                          type="number"
                          value={comp.askingUnitPrice || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].askingUnitPrice = val;
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-0.5 font-medium">Tỷ lệ thương lượng (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="-2.5%"
                          value={comp.negotiationRate ?? ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].negotiationRate = val;
                            const baseUnit = updated[idx].askingUnitPrice || 0;
                            const postNeg = Math.round(baseUnit * (1 + val / 100));
                            updated[idx].transactionUnitPrice = postNeg;
                            const adjRate = updated[idx].adjustmentRate || 0;
                            updated[idx].adjustedUnitPrice = Math.round(postNeg * (1 + adjRate / 100));
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-0.5 font-medium">Tỷ lệ điều chỉnh yếu tố (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="1.0%"
                          value={comp.adjustmentRate ?? ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].adjustmentRate = val;
                            const postNeg = updated[idx].transactionUnitPrice || updated[idx].askingUnitPrice || 0;
                            updated[idx].adjustedUnitPrice = Math.round(postNeg * (1 + val / 100));
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-emerald-800 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-4">
                        <label className="text-slate-500 block mb-0.5 font-medium">Địa chỉ & Ghi chú so sánh</label>
                        <input
                          type="text"
                          value={comp.notes || comp.address || ''}
                          onChange={e => {
                            const updated = [...(formData.marketComparables || [])];
                            updated[idx].notes = e.target.value;
                            setFormData({ ...formData, marketComparables: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

                    {/* ========================================================= */}
          {/* SHEET 3: Bang tinh gia dat (Interactive Comparative Valuation Table) */}
          {/* ========================================================= */}
          {(viewMode === 'all' || activeTab === 'bang_tinh_gia_dat') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-amber-950 tracking-wider">
                      Sheet 3: Bang tinh gia dat (Bảng tính giá đất / định giá theo phương pháp so sánh - Cho phép nhập liệu)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Nhập thông số, đơn giá và tỷ lệ điều chỉnh cho thửa đất thẩm định giá và 3 tài sản so sánh
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-amber-100 text-amber-950 font-black px-3 py-1 rounded-lg border border-amber-300 font-mono">
                    Giá phê duyệt: {formatVND(formData.approvedValue || formData.marketPrice || 2850000000)}
                  </span>
                </div>
              </div>

              {/* Interactive Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3 border-r border-slate-200 w-1/3">Nội dung</th>
                      <th className="p-3 border-r border-slate-200 text-center w-1/6 bg-emerald-50 text-emerald-900">Thửa đất thẩm định giá</th>
                      <th className="p-3 border-r border-slate-200 text-center w-1/6">Tài sản so sánh 1</th>
                      <th className="p-3 border-r border-slate-200 text-center w-1/6">Tài sản so sánh 2</th>
                      <th className="p-3 text-center w-1/6">Tài sản so sánh 3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {/* Tổng diện tích */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans font-bold text-slate-800 border-r border-slate-100">Tổng diện tích (m²)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center">
                        <input type="number" step="0.1" value={formData.landValuationTable?.totalArea?.subject || 102} onChange={e => updateLandValuation('totalArea', 'subject', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-emerald-900" />
                      </td>
                      <td className="p-2 border-r border-slate-100 text-center">
                        <input type="number" step="0.1" value={formData.landValuationTable?.totalArea?.comp1 || 102} onChange={e => updateLandValuation('totalArea', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" />
                      </td>
                      <td className="p-2 border-r border-slate-100 text-center">
                        <input type="number" step="0.1" value={formData.landValuationTable?.totalArea?.comp2 || 98.5} onChange={e => updateLandValuation('totalArea', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" />
                      </td>
                      <td className="p-2 text-center">
                        <input type="number" step="0.1" value={formData.landValuationTable?.totalArea?.comp3 || 106} onChange={e => updateLandValuation('totalArea', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" />
                      </td>
                    </tr>

                    {/* Giá tham khảo */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans font-bold text-slate-800 border-r border-slate-100">Giá tham khảo / Tổng giá (VNĐ)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.referencePrice?.comp1 || '28.000.000'} onChange={e => updateLandValuation('referencePrice', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.referencePrice?.comp2 || '27.800.000'} onChange={e => updateLandValuation('referencePrice', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.referencePrice?.comp3 || '28.100.000'} onChange={e => updateLandValuation('referencePrice', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>

                    {/* Đơn giá (vnd/m2) */}
                    <tr className="hover:bg-slate-50 transition bg-amber-50/40">
                      <td className="p-2.5 font-sans font-bold text-slate-900 border-r border-slate-100">Đơn giá (VNĐ/m²)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/30 text-center">
                        <input type="number" value={formData.landValuationTable?.unitPrice?.subject || 28500000} onChange={e => updateLandValuation('unitPrice', 'subject', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-emerald-900 font-mono" />
                      </td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" value={formData.landValuationTable?.unitPrice?.comp1 || 28000000} onChange={e => updateLandValuation('unitPrice', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" value={formData.landValuationTable?.unitPrice?.comp2 || 27800000} onChange={e => updateLandValuation('unitPrice', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono" /></td>
                      <td className="p-2 text-center"><input type="number" value={formData.landValuationTable?.unitPrice?.comp3 || 28100000} onChange={e => updateLandValuation('unitPrice', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono" /></td>
                    </tr>

                    {/* Thời điểm giao dịch */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100">Thời điểm giao dịch</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.transactionDate?.subject || 'Hiện tại'} onChange={e => updateLandValuation('transactionDate', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.transactionDate?.comp1 || 'Tháng 9/2024'} onChange={e => updateLandValuation('transactionDate', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.transactionDate?.comp2 || 'Tháng 8/2024'} onChange={e => updateLandValuation('transactionDate', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.transactionDate?.comp3 || 'Tháng 10/2024'} onChange={e => updateLandValuation('transactionDate', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>

                    {/* Factor row generator helper or direct rows */}
                    {/* Yếu tố thị trường */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Yếu tố thị trường</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.marketFactor?.subject || 'Ổn định'} onChange={e => updateLandValuation('marketFactor', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.marketFactor?.comp1 || 'Ổn định'} onChange={e => updateLandValuation('marketFactor', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.marketFactor?.comp2 || 'Ổn định'} onChange={e => updateLandValuation('marketFactor', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.marketFactor?.comp3 || 'Ổn định'} onChange={e => updateLandValuation('marketFactor', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.marketAdjRate?.comp1 ?? 0} onChange={e => updateLandValuation('marketAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.marketAdjRate?.comp2 ?? 0} onChange={e => updateLandValuation('marketAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.marketAdjRate?.comp3 ?? 0} onChange={e => updateLandValuation('marketAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>

                    {/* Tình trạng pháp lý */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Tình trạng pháp lý</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.legalStatus?.subject || 'Đã có Sổ đỏ'} onChange={e => updateLandValuation('legalStatus', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.legalStatus?.comp1 || 'Đã có Sổ đỏ'} onChange={e => updateLandValuation('legalStatus', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.legalStatus?.comp2 || 'Đã có Sổ đỏ'} onChange={e => updateLandValuation('legalStatus', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.legalStatus?.comp3 || 'HĐMB'} onChange={e => updateLandValuation('legalStatus', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.legalAdjRate?.comp1 ?? 0} onChange={e => updateLandValuation('legalAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.legalAdjRate?.comp2 ?? 0} onChange={e => updateLandValuation('legalAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.legalAdjRate?.comp3 ?? 1.0} onChange={e => updateLandValuation('legalAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-amber-700 font-bold" /></td>
                    </tr>

                    {/* Nội thất */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Nội thất</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.interior?.subject || 'Hoàn thiện cơ bản'} onChange={e => updateLandValuation('interior', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.interior?.comp1 || 'Hoàn thiện cơ bản'} onChange={e => updateLandValuation('interior', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.interior?.comp2 || 'Đầy đủ nội thất'} onChange={e => updateLandValuation('interior', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.interior?.comp3 || 'Hoàn thiện cơ bản'} onChange={e => updateLandValuation('interior', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.interiorAdjRate?.comp1 ?? 0} onChange={e => updateLandValuation('interiorAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.interiorAdjRate?.comp2 ?? -1.0} onChange={e => updateLandValuation('interiorAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-indigo-700 font-bold" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.interiorAdjRate?.comp3 ?? 0} onChange={e => updateLandValuation('interiorAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>

                    {/* Vị trí tầng */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Vị trí tầng</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.floorPosition?.subject || 'Tầng 12'} onChange={e => updateLandValuation('floorPosition', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.floorPosition?.comp1 || 'Tầng 12'} onChange={e => updateLandValuation('floorPosition', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.floorPosition?.comp2 || 'Tầng 8'} onChange={e => updateLandValuation('floorPosition', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.floorPosition?.comp3 || 'Tầng 18'} onChange={e => updateLandValuation('floorPosition', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.floorAdjRate?.comp1 ?? 0} onChange={e => updateLandValuation('floorAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.floorAdjRate?.comp2 ?? 0.5} onChange={e => updateLandValuation('floorAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.floorAdjRate?.comp3 ?? -0.5} onChange={e => updateLandValuation('floorAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>

                    {/* Số phòng ngủ / WC */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Số phòng ngủ / WC</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.bedWc?.subject || '3 PN / 2 WC'} onChange={e => updateLandValuation('bedWc', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.bedWc?.comp1 || '3 PN / 2 WC'} onChange={e => updateLandValuation('bedWc', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.bedWc?.comp2 || '2 PN / 2 WC'} onChange={e => updateLandValuation('bedWc', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.bedWc?.comp3 || '3 PN / 2 WC'} onChange={e => updateLandValuation('bedWc', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.bedWcAdjRate?.comp1 ?? 0} onChange={e => updateLandValuation('bedWcAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.bedWcAdjRate?.comp2 ?? 1.0} onChange={e => updateLandValuation('bedWcAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-amber-700 font-bold" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.bedWcAdjRate?.comp3 ?? 0} onChange={e => updateLandValuation('bedWcAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>

                    {/* Hướng vào căn hộ */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Hướng vào căn hộ</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.apartmentDirection?.subject || 'Đông Nam'} onChange={e => updateLandValuation('apartmentDirection', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-emerald-900" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.apartmentDirection?.comp1 || 'Đông Nam'} onChange={e => updateLandValuation('apartmentDirection', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.apartmentDirection?.comp2 || 'Nam'} onChange={e => updateLandValuation('apartmentDirection', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.apartmentDirection?.comp3 || 'Đông Bắc'} onChange={e => updateLandValuation('apartmentDirection', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.apartmentDirectionAdjRate?.comp1 ?? 0} onChange={e => updateLandValuation('apartmentDirectionAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.apartmentDirectionAdjRate?.comp2 ?? 0} onChange={e => updateLandValuation('apartmentDirectionAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.apartmentDirectionAdjRate?.comp3 ?? 0.5} onChange={e => updateLandValuation('apartmentDirectionAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-emerald-700 font-bold" /></td>
                    </tr>

                    {/* Vị trí căn */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Vị trí căn</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.apartmentPosition?.subject || 'Căn góc'} onChange={e => updateLandValuation('apartmentPosition', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-emerald-900" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.apartmentPosition?.comp1 || 'Căn thường'} onChange={e => updateLandValuation('apartmentPosition', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.apartmentPosition?.comp2 || 'Căn thường'} onChange={e => updateLandValuation('apartmentPosition', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.apartmentPosition?.comp3 || 'Căn góc'} onChange={e => updateLandValuation('apartmentPosition', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.apartmentPositionAdjRate?.comp1 ?? 1.0} onChange={e => updateLandValuation('apartmentPositionAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-amber-700 font-bold" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.apartmentPositionAdjRate?.comp2 ?? 1.0} onChange={e => updateLandValuation('apartmentPositionAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-amber-700 font-bold" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.apartmentPositionAdjRate?.comp3 ?? 0} onChange={e => updateLandValuation('apartmentPositionAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>

                    {/* Hướng ban công */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Hướng ban công</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.balconyDirection?.subject || 'Đông Nam'} onChange={e => updateLandValuation('balconyDirection', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-emerald-900" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.balconyDirection?.comp1 || 'Đông Nam'} onChange={e => updateLandValuation('balconyDirection', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.balconyDirection?.comp2 || 'Nam'} onChange={e => updateLandValuation('balconyDirection', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.balconyDirection?.comp3 || 'Đông Bắc'} onChange={e => updateLandValuation('balconyDirection', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.balconyDirectionAdjRate?.comp1 ?? 0} onChange={e => updateLandValuation('balconyDirectionAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.balconyDirectionAdjRate?.comp2 ?? 0} onChange={e => updateLandValuation('balconyDirectionAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.balconyDirectionAdjRate?.comp3 ?? 0} onChange={e => updateLandValuation('balconyDirectionAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>

                    {/* Diện tích */}
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Diện tích</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center"><input type="text" value={formData.landValuationTable?.areaFactor?.subject || '102.0 m²'} onChange={e => updateLandValuation('areaFactor', 'subject', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-emerald-900" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.areaFactor?.comp1 || '102.0 m²'} onChange={e => updateLandValuation('areaFactor', 'comp1', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="text" value={formData.landValuationTable?.areaFactor?.comp2 || '98.5 m²'} onChange={e => updateLandValuation('areaFactor', 'comp2', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 text-center"><input type="text" value={formData.landValuationTable?.areaFactor?.comp3 || '106.0 m²'} onChange={e => updateLandValuation('areaFactor', 'comp3', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition text-slate-600 bg-slate-50/50">
                      <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh (%)</td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10 text-center text-slate-400">---</td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.areaAdjRate?.comp1 ?? 0} onChange={e => updateLandValuation('areaAdjRate', 'comp1', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center" /></td>
                      <td className="p-2 border-r border-slate-100 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.areaAdjRate?.comp2 ?? -0.5} onChange={e => updateLandValuation('areaAdjRate', 'comp2', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-amber-700 font-bold" /></td>
                      <td className="p-2 text-center"><input type="number" step="0.1" value={formData.landValuationTable?.areaAdjRate?.comp3 ?? 0.2} onChange={e => updateLandValuation('areaAdjRate', 'comp3', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-emerald-700 font-bold" /></td>
                    </tr>
                    {(() => {
                      const lt = formData.landValuationTable || DEFAULT_LAND_VALUATION_TABLE;
                      const calcNet = (k) => Number((
                        (lt.marketAdjRate?.[k] || 0) +
                        (lt.legalAdjRate?.[k] || 0) +
                        (lt.interiorAdjRate?.[k] || 0) +
                        (lt.floorAdjRate?.[k] || 0) +
                        (lt.bedWcAdjRate?.[k] || 0) +
                        (lt.apartmentDirectionAdjRate?.[k] || 0) +
                        (lt.apartmentPositionAdjRate?.[k] || 0) +
                        (lt.balconyDirectionAdjRate?.[k] || 0) +
                        (lt.areaAdjRate?.[k] || 0)
                      ).toFixed(2));

                      const net1 = calcNet("comp1");
                      const net2 = calcNet("comp2");
                      const net3 = calcNet("comp3");

                      const up1 = lt.unitPrice?.comp1 || 28000000;
                      const up2 = lt.unitPrice?.comp2 || 27800000;
                      const up3 = lt.unitPrice?.comp3 || 28100000;

                      const ap1 = Math.round(up1 * (1 + net1 / 100));
                      const ap2 = Math.round(up2 * (1 + net2 / 100));
                      const ap3 = Math.round(up3 * (1 + net3 / 100));

                      const avg = Math.round((ap1 + ap2 + ap3) / 3);

                      return (
                        <>
                          {/* Outputs */}
                          <tr className="bg-slate-50 font-bold text-slate-900 transition">
                            <td className="p-2.5 font-sans border-r border-slate-200">Tổng giá trị điều chỉnh thuần (%)</td>
                            <td className="p-2.5 text-center border-r border-slate-200 text-slate-400 bg-emerald-50/20">---</td>
                            <td className="p-2.5 text-center border-r border-slate-200 text-indigo-700">{net1 > 0 ? `+${net1}%` : `${net1}%`}</td>
                            <td className="p-2.5 text-center border-r border-slate-200 text-indigo-700">{net2 > 0 ? `+${net2}%` : `${net2}%`}</td>
                            <td className="p-2.5 text-center text-indigo-700">{net3 > 0 ? `+${net3}%` : `${net3}%`}</td>
                          </tr>
                          <tr className="bg-emerald-50/50 font-black text-slate-900 transition">
                            <td className="p-2.5 font-sans border-r border-slate-200">Mức giá sau điều chỉnh (VNĐ/m²)</td>
                            <td className="p-2.5 text-center border-r border-slate-200 text-slate-400 bg-emerald-100/50">---</td>
                            <td className="p-2.5 text-center border-r border-slate-200 text-emerald-900 font-mono">{formatVND(ap1)} đ</td>
                            <td className="p-2.5 text-center border-r border-slate-200 text-emerald-900 font-mono">{formatVND(ap2)} đ</td>
                            <td className="p-2.5 text-center text-emerald-900 font-mono">{formatVND(ap3)} đ</td>
                          </tr>
                          <tr className="bg-blue-50/60 font-bold text-slate-900 transition">
                            <td className="p-3 font-sans border-r border-slate-200 text-blue-950 uppercase">
                              Giá bình quân (Trung bình 3 TSSS)
                            </td>
                            <td className="p-3 text-center font-mono text-blue-800 text-sm border-r border-slate-200 bg-blue-100/40" colSpan={4}>
                              {formatVND(avg)} /m² (Trung bình mức giá sau điều chỉnh của 3 tài sản so sánh)
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                    <tr className="bg-slate-900 text-white font-black text-xs">
                      <td className="p-3 border-r border-slate-800 uppercase">Giá lựa chọn (Phê duyệt)</td>
                      <td className="p-3 text-center" colSpan={4}>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-slate-300">Đơn giá lựa chọn (VNĐ/m²):</span>
                          <input 
                            type="text" 
                            value={formatCurrencyNumber(formData.landValuationTable?.selectedUnitPrice ?? formData.appraisedUnitPrice ?? 28500000)} 
                            onChange={e => {
                              const rawVal = parseVietnameseNumber(e.target.value);
                              updateLandValuation('selectedUnitPrice', rawVal);
                            }} 
                            className="bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold px-3 py-1 rounded text-center w-48"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          

          {/* ========================================================= */}
          {/* SHEET 4: bang tinh clcl (Chất lượng còn lại công trình)   */}
          {/* ========================================================= */}
          {(viewMode === 'all' || activeTab === 'bang_tinh_clcl') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                    4
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-teal-900 tracking-wider">
                      Sheet 4: bang tinh clcl
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Bảng tính tỷ lệ chất lượng còn lại (CLCL %), phân tích kết cấu bộ phận & giá trị công trình xây dựng
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRecalculateClcl}
                  className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tự động tính lại CLCL %</span>
                </button>
              </div>

              {/* Thông số khấu hao chung */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-0.5 font-medium">Cấp công trình</label>
                  <input
                    type="text"
                    value={formData.clclCalculation?.buildingClassification || 'Công trình Cấp II (Chung cư)'}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      clclCalculation: { ...(prev.clclCalculation || DEFAULT_CLCL_SHEET), buildingClassification: e.target.value }
                    }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-0.5 font-medium">Niên hạn sử dụng chuẩn (năm)</label>
                  <input
                    type="number"
                    value={formData.clclCalculation?.designLifespanYears || 50}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      clclCalculation: { ...(prev.clclCalculation || DEFAULT_CLCL_SHEET), designLifespanYears: parseInt(e.target.value) || 50 }
                    }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-0.5 font-medium">Năm XD / Đưa vào SD</label>
                  <input
                    type="number"
                    value={formData.clclCalculation?.constructionYear || 2020}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      clclCalculation: { ...(prev.clclCalculation || DEFAULT_CLCL_SHEET), constructionYear: parseInt(e.target.value) || 2020 }
                    }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-0.5 font-medium">Tỷ lệ CLCL tổng hợp (%)</label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      value={formData.clclCalculation?.finalClclRate ?? formData.remainingBuildingQuality ?? 85}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          remainingBuildingQuality: val,
                          clclCalculation: { ...(prev.clclCalculation || DEFAULT_CLCL_SHEET), finalClclRate: val }
                        }));
                      }}
                      className="w-full bg-emerald-50 border border-emerald-300 rounded px-2 py-1 font-black text-emerald-800 text-sm"
                    />
                    <span className="font-bold text-slate-600">%</span>
                  </div>
                </div>
              </div>

              {/* Bảng chi tiết 7 kết cấu bộ phận */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 flex justify-between">
                  <span>Chi tiết kết cấu bộ phận công trình</span>
                  <span>Tỷ trọng (%) • Điểm đánh giá</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {(formData.clclCalculation?.components || DEFAULT_CLCL_SHEET.components || []).map((cmp, idx) => (
                    <div key={cmp.id || idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                      <div className="flex-1">
                        <span className="font-bold text-slate-900 block">{cmp.componentName}</span>
                        <input
                          type="text"
                          value={cmp.conditionDescription || ''}
                          onChange={e => {
                            const updated = [...(formData.clclCalculation?.components || [])];
                            updated[idx].conditionDescription = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              clclCalculation: { ...(prev.clclCalculation || DEFAULT_CLCL_SHEET), components: updated }
                            }));
                          }}
                          className="text-[11px] text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 w-full mt-0.5"
                        />
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Tỷ trọng</span>
                          <span className="font-mono font-bold text-slate-700">{cmp.weightRate}%</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">CLCL thực tế</span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={cmp.actualQualityRate || ''}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...(formData.clclCalculation?.components || [])];
                                updated[idx].actualQualityRate = val;
                                updated[idx].weightedQuality = parseFloat(((val * updated[idx].weightRate) / 100).toFixed(2));
                                setFormData(prev => ({
                                  ...prev,
                                  clclCalculation: { ...(prev.clclCalculation || DEFAULT_CLCL_SHEET), components: updated }
                                }));
                              }}
                              className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-bold text-slate-900"
                            />
                            <span>%</span>
                          </div>
                        </div>

                        <div className="text-right w-16">
                          <span className="text-[10px] text-slate-400 block">Điểm</span>
                          <span className="font-mono font-bold text-teal-700">
                            {cmp.weightedQuality || ((cmp.weightRate * cmp.actualQualityRate) / 100).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng kết giá trị công trình */}
              <div className="bg-teal-50/80 p-3.5 rounded-xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-teal-900 block text-sm">Giá trị công trình xây dựng sau khấu hao CLCL:</span>
                  <span className="text-slate-600 text-[11px]">
                    (DT sàn {formData.clclCalculation?.usableFloorArea || formData.areaCertificate || 104.5}m² × Suất vốn {formatVND(formData.clclCalculation?.newConstructionUnitPrice || 6500000)}/m² × CLCL {formData.clclCalculation?.finalClclRate || 85}%)
                  </span>
                </div>

                <div className="text-base font-black font-mono text-teal-900">
                  {formatVND(
                    formData.clclCalculation?.remainingStructureValue ||
                    Math.round((formData.areaCertificate || 104.5) * (formData.constructionUnitPrice || 6500000) * ((formData.remainingBuildingQuality || 85) / 100))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SHEET 5: HỒ SƠ PHÁP LÝ & ẢNH HIỆN TRẠNG                    */}
          {/* ========================================================= */}
          {(viewMode === 'all' || activeTab === 'phap_ly_va_anh') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                    5
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-purple-900 tracking-wider">
                      Hồ sơ pháp lý & Hình ảnh khảo sát hiện trạng
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Cơ sở pháp lý Giấy chứng nhận QSDĐ, Quét OCR AI & Thư viện hình ảnh khảo sát thực địa
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Quét OCR Giấy Tờ</span>
                </button>
              </div>

              {/* Pháp lý */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cơ sở pháp lý / Giấy chứng nhận quyền sử dụng đất & sở hữu nhà ở
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Giấy chứng nhận quyền sử dụng đất quyền sở hữu nhà ở và tài sản khác gắn liền với đất số DO 665708 do văn phòng đăng ký đất đai Hà Nội Cấp cho ông Nguyễn Viết Chính và bà Nguyễn Thị Huyền Trang Ngày 25/05/2024. Số vào sổ VP 00283."
                  value={formData.legalDocNumber || ''}
                  onChange={e => setFormData({ ...formData, legalDocNumber: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              {/* Danh sách hồ sơ pháp lý đính kèm */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
                  <span>Danh mục hồ sơ tài liệu kèm theo</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newDoc: LegalDocument = {
                        id: `doc-${Date.now()}`,
                        name: 'Bản vẽ mặt bằng / Hợp đồng mua bán căn hộ',
                        status: 'DA_NOP'
                      };
                      setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), newDoc] }));
                    }}
                    className="text-[11px] text-purple-700 hover:text-purple-800 font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm tài liệu</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(formData.documents || []).map((doc, idx) => (
                    <div key={doc.id || idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2 flex-1 mr-2">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <select
                          value={doc.status}
                          onChange={e => {
                            const updated = [...(formData.documents || [])];
                            updated[idx].status = e.target.value as any;
                            setFormData({ ...formData, documents: updated });
                          }}
                          className="text-[11px] font-semibold bg-white border border-slate-300 rounded px-2 py-0.5"
                        >
                          <option value="DA_NOP">Đã nộp</option>
                          <option value="CHUA_NOP">Chưa nộp</option>
                          <option value="CAN_BO_SUNG">Cần bổ sung</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.documents || []).filter((_, i) => i !== idx);
                            setFormData({ ...formData, documents: updated });
                          }}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thư viện hình ảnh */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Hình ảnh khảo sát hiện trạng ({formData.assetImages?.length || 0} ảnh)</span>
                  </div>
                  <label className="cursor-pointer text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-semibold transition flex items-center space-x-1 border border-slate-300">
                    <Upload className="w-3 h-3 text-slate-600" />
                    <span>Tải ảnh lên</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="url"
                    placeholder="Dán đường dẫn URL ảnh (https://...)"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shrink-0"
                  >
                    Thêm ảnh
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Chọn nhanh ảnh mẫu:</span>
                  {SAMPLE_PHOTOS.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, assetImages: [...(prev.assetImages || []), sample.url] }))}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-slate-200 transition"
                    >
                      + {sample.label}
                    </button>
                  ))}
                </div>

                {formData.assetImages && formData.assetImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                    {formData.assetImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                        <img
                          src={img}
                          alt={`Asset ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6 / SHEET 6: IV. KIẾN NGHỊ & ĐỀ XUẤT CỦA CÁN BỘ THẨM ĐỊNH
              (Được xuất trực tiếp vào Mục IV của Báo cáo BM.02A, BM.02A1, BM.02B, BM.02C)
              ======================================================== */}
          {(viewMode === 'all' || activeTab === 'kien_nghi') && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Box */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase">
                      IV. KIẾN NGHỊ & ĐỀ XUẤT CỦA CÁN BỘ THẨM ĐỊNH
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Nhập đề xuất cấp tín dụng, Tỷ lệ LTV (%), Số tiền cho vay, Điều kiện quản lý TSBĐ & Giám sát sau giải ngân để xuất ra Báo cáo BM.02A/TĐTS.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const totalVal = formData.approvedValue || formData.marketPrice || formData.estimatedValue || 0;
                      const ltv = formData.maxLtvRate || 70;
                      const client = formData.clientName || 'Khách hàng';
                      let catLabel = 'tài sản bảo đảm';
                      if (formData.assetCategory === 'CAN_HO_CHUNG_CU') catLabel = 'căn hộ chung cư';
                      else if (formData.assetCategory === 'PHUONG_TIEN_VAN_TAI') catLabel = 'phương tiện vận tải';
                      else if (formData.assetCategory === 'MAY_MOC_THIET_BI') catLabel = 'máy móc thiết bị';
                      else catLabel = 'QSD đất và công trình trên đất';

                      setFormData(prev => ({
                        ...prev,
                        creditProposal: `Đề xuất chấp thuận kết quả định giá ${catLabel} làm cơ sở cấp tín dụng cho khách hàng ${client} theo đúng quy định của Ngân hàng TMCP Bắc Á.`,
                        maxLtvRate: ltv,
                        maxLoanAmount: totalVal > 0 ? Math.round(totalVal * (ltv / 100)) : prev.maxLoanAmount,
                        collateralConditions: formData.assetCategory === 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT'
                          ? 'Đơn vị kinh doanh phối hợp kiểm tra thực địa ranh giới thửa đất, đối chiếu hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.'
                          : 'Kiểm tra thực tế hiện trạng tài sản, hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.',
                        postDisbursementCheck: 'Định kỳ tối thiểu 06 tháng/lần, Đơn vị kinh doanh phối hợp kiểm tra hiện trạng tài sản bảo đảm, bảo đảm nguyên trạng tài sản và kịp thời phát hiện biến động giá hoặc quy hoạch.',
                        otherProposals: 'Tài sản có tính pháp lý rõ ràng, hiện trạng sử dụng ổn định, khả năng thanh khoản trên thị trường ở mức trung bình khá.'
                      }));

                      setOcrNotification('✨ Đã áp dụng mẫu kiến nghị chuẩn BAC A BANK phù hợp với loại tài sản!');
                      setTimeout(() => setOcrNotification(null), 4000);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nạp Mẫu Kiến Nghị Chuẩn</span>
                  </button>
                </div>
              </div>

              {/* Box 1: Tỷ lệ LTV & Số tiền cho vay tối đa đề xuất */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      1. Đề xuất Tỷ lệ cho vay tối đa (LTV) & Hạn mức cho vay
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Giá trị định giá: <strong className="font-mono text-amber-900">{formatCurrencyNumber(formData.approvedValue || formData.marketPrice || formData.estimatedValue || 0)} VNĐ</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tỷ lệ LTV */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tỷ lệ cho vay tối đa đề xuất (% LTV):
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={formData.maxLtvRate ?? 70}
                          onChange={e => {
                            const rate = Number(e.target.value);
                            const totalVal = formData.approvedValue || formData.marketPrice || formData.estimatedValue || 0;
                            const calcAmount = totalVal > 0 ? Math.round(totalVal * (rate / 100)) : formData.maxLoanAmount;
                            setFormData(prev => ({
                              ...prev,
                              maxLtvRate: rate,
                              maxLoanAmount: calcAmount
                            }));
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-emerald-950 focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">%</span>
                      </div>
                      <div className="flex space-x-1 shrink-0">
                        {[65, 70, 75, 80].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              const totalVal = formData.approvedValue || formData.marketPrice || formData.estimatedValue || 0;
                              setFormData(prev => ({
                                ...prev,
                                maxLtvRate: pct,
                                maxLoanAmount: totalVal > 0 ? Math.round(totalVal * (pct / 100)) : prev.maxLoanAmount
                              }));
                            }}
                            className={`px-2 py-1 text-[11px] rounded font-bold border transition ${
                              formData.maxLtvRate === pct
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Số tiền cho vay tối đa */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Số tiền cho vay tối đa đề xuất (VNĐ):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const totalVal = formData.approvedValue || formData.marketPrice || formData.estimatedValue || 0;
                          const rate = formData.maxLtvRate ?? 70;
                          const calc = Math.round(totalVal * (rate / 100));
                          setFormData(prev => ({ ...prev, maxLoanAmount: calc }));
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ⚡ Tính tự động
                      </button>
                    </div>
                    <input
                      type="number"
                      step="10000000"
                      value={formData.maxLoanAmount ?? 0}
                      onChange={e => setFormData({ ...formData, maxLoanAmount: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-amber-900 focus:ring-2 focus:ring-amber-500"
                      placeholder="VD: 2000000000"
                    />
                    {formData.maxLoanAmount && formData.maxLoanAmount > 0 ? (
                      <p className="text-[11px] text-slate-500 mt-1 italic">
                        Bằng chữ: <em>{numberToVietnameseWords(formData.maxLoanAmount)}.</em>
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Nội dung đề xuất cấp tín dụng */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nội dung Đề xuất cấp tín dụng:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.creditProposal || ''}
                    onChange={e => setFormData({ ...formData, creditProposal: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                    placeholder="VD: Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng cho khách hàng theo đúng quy định của Ngân hàng TMCP Bắc Á."
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        creditProposal: `Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng cho khách hàng ${formData.clientName || 'khách hàng'} theo đúng quy định của Ngân hàng TMCP Bắc Á.`
                      }))}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 border border-slate-200 transition"
                    >
                      + Chấp thuận định giá chuẩn
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        creditProposal: `Đề xuất cấp hạn mức cho vay tối đa ${formData.maxLtvRate || 70}% giá trị định giá tài sản làm cơ sở cấp tín dụng cho khách hàng ${formData.clientName || 'khách hàng'}.`
                      }))}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 border border-slate-200 transition"
                    >
                      + Cấp hạn mức theo tỷ lệ LTV
                    </button>
                  </div>
                </div>
              </div>

              {/* Box 2: Điều kiện quản lý tài sản bảo đảm */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    2. Điều kiện quản lý tài sản bảo đảm trước khi giải ngân
                  </h4>
                </div>
                <textarea
                  rows={2}
                  value={formData.collateralConditions || ''}
                  onChange={e => setFormData({ ...formData, collateralConditions: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                  placeholder="VD: Đơn vị kinh doanh phối hợp kiểm tra thực địa ranh giới thửa đất, đối chiếu hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân."
                />
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = formData.collateralConditions || '';
                      const clause = 'Kiểm tra bản gốc Giấy chứng nhận QSDĐ/QSHNƠ trước khi ký hợp đồng thế chấp.';
                      setFormData(prev => ({ ...prev, collateralConditions: cur ? `${cur} ${clause}` : clause }));
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 border border-slate-200 transition"
                  >
                    + Kiểm tra bản gốc GCN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = formData.collateralConditions || '';
                      const clause = 'Thực hiện công chứng hợp đồng thế chấp và đăng ký biện pháp bảo đảm hợp lệ tại Văn phòng Đăng ký đất đai.';
                      setFormData(prev => ({ ...prev, collateralConditions: cur ? `${cur} ${clause}` : clause }));
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 border border-slate-200 transition"
                  >
                    + Đăng ký giao dịch bảo đảm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = formData.collateralConditions || '';
                      const clause = 'Kiểm tra thực địa ranh giới, mốc giới thửa đất không có lấn chiếm tranh chấp.';
                      setFormData(prev => ({ ...prev, collateralConditions: cur ? `${cur} ${clause}` : clause }));
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 border border-slate-200 transition"
                  >
                    + Kiểm tra mốc giới thực địa
                  </button>
                </div>
              </div>

              {/* Box 3: Kiểm tra, giám sát sau cấp tín dụng */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    3. Kiểm tra, giám sát tài sản sau khi cấp tín dụng
                  </h4>
                </div>
                <textarea
                  rows={2}
                  value={formData.postDisbursementCheck || ''}
                  onChange={e => setFormData({ ...formData, postDisbursementCheck: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                  placeholder="VD: Định kỳ tối thiểu 06 tháng/lần, Đơn vị kinh doanh phối hợp kiểm tra hiện trạng tài sản bảo đảm, bảo đảm nguyên trạng tài sản và kịp thời phát hiện biến động giá hoặc quy hoạch."
                />
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = formData.postDisbursementCheck || '';
                      const clause = 'Định kỳ tối thiểu 06 tháng/lần kiểm tra thực địa hiện trạng tài sản bảo đảm.';
                      setFormData(prev => ({ ...prev, postDisbursementCheck: cur ? `${cur} ${clause}` : clause }));
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 border border-slate-200 transition"
                  >
                    + Định kỳ 6 tháng kiểm tra thực địa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = formData.postDisbursementCheck || '';
                      const clause = 'Thực hiện định giá lại tài sản bảo đảm định kỳ hàng năm theo quy định của BAC A BANK.';
                      setFormData(prev => ({ ...prev, postDisbursementCheck: cur ? `${cur} ${clause}` : clause }));
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 border border-slate-200 transition"
                  >
                    + Định giá lại hàng năm
                  </button>
                </div>
              </div>

              {/* Box 4: Kiến nghị khác & Toàn văn tự do */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    4. Kiến nghị / Lưu ý khác của Cán bộ thẩm định
                  </h4>
                  <textarea
                    rows={3}
                    value={formData.otherProposals || ''}
                    onChange={e => setFormData({ ...formData, otherProposals: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                    placeholder="Ghi chú thêm về quy hoạch phân khu, khả năng thanh khoản, thị trường bất động sản khu vực..."
                  />
                </div>

                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-300 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-950 uppercase">
                      5. Tùy chọn: Toàn văn Kiến nghị tự do
                    </h4>
                    <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded">
                      Ưu tiên cao nhất
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.recommendations || ''}
                    onChange={e => setFormData({ ...formData, recommendations: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-amber-500"
                    placeholder="Nếu nhập ô này, hệ thống sẽ xuất từng dòng nguyên văn vào Mục IV của báo cáo (mỗi dòng 1 đầu dòng gạch ngang)."
                  />
                  <p className="text-[11px] text-amber-900 italic">
                    * Mẹo: Để trống ô này nếu bạn muốn hệ thống tự động tổng hợp từ các mục 1, 2, 3 ở trên!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
              {viewMode === 'tabs' && activeTab !== 'dac_diem_chung_chi_tiet' && (
                <button
                  type="button"
                  onClick={handlePrevTab}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sheet trước</span>
                </button>
              )}

              {viewMode === 'tabs' && activeTab !== 'kien_nghi' && (
                <button
                  type="button"
                  onClick={handleNextTab}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                >
                  <span>Sheet tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition transform active:scale-95 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isEditing ? 'Lưu Thay Đổi Hồ Sơ' : 'Lưu Hồ Sơ Mới'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* OCR Scanner Modal Component */}
        <DocumentOcrScannerModal
          isOpen={isOcrModalOpen}
          onClose={() => setIsOcrModalOpen(false)}
          onApplyData={handleApplyOcrData}
        />
      </div>
    </div>
  );
};
