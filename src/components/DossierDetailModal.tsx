import React, { useState, useMemo } from 'react';
import { 
  X, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Lock, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Plus, 
  Check, 
  History, 
  Briefcase,
  Image as ImageIcon,
  Upload,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Camera,
  Link as LinkIcon,
  Receipt,
  Award,
  Scan,
  Sparkles,
  FileSpreadsheet,
  Search,
  Copy,
  Filter,
  TrendingUp,
  Calculator,
  Percent,
  Layers,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { ValuationDossier, DossierStatus, LegalDocument, DynamicImportField, MarketComparable, ClclCalculationSheet } from '../types/dossier';
import { 
  isDossierLocked,
  formatVND, 
  formatDate, 
  getSLADaysInfo, 
  STATUS_CONFIG, 
  getStatusConfig,
  ASSET_CATEGORY_CONFIG, 
  PURPOSE_CONFIG, 
  PAYMENT_STATUS_CONFIG, 
  PRIORITY_CONFIG,
  numberToVietnameseWords
} from '../utils/formatters';

import { ReportTemplateType } from './AdvisoryExportModal';
import { useAuth } from '../context/AuthContext';
import { DocumentOcrScannerModal, ExtractedOcrData } from './DocumentOcrScannerModal';

interface DossierDetailModalProps {
  dossier: ValuationDossier | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (dossier: ValuationDossier) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: DossierStatus) => void;
  onOpenCertificate: (dossier: ValuationDossier) => void;
  onOpenFeeNotice?: (dossier: ValuationDossier) => void;
  onOpenExportDoc?: (dossier: ValuationDossier, template?: ReportTemplateType) => void;
  onUpdateDossier: (dossier: ValuationDossier) => void;
}

export type DetailTabType = 
  | 'sheet_1' 
  | 'sheet_2' 
  | 'sheet_3' 
  | 'sheet_4' 
  | 'images' 
  | 'documents' 
  | 'history' 
  | 'imported_fields';

export const DossierDetailModal: React.FC<DossierDetailModalProps> = ({
  dossier,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onOpenCertificate,
  onOpenFeeNotice,
  onOpenExportDoc,
  onUpdateDossier
}) => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<DetailTabType>('sheet_1');
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [selectedFieldGroup, setSelectedFieldGroup] = useState<string>('ALL');
  const [copiedFieldName, setCopiedFieldName] = useState<string | null>(null);
  const [editingFieldCol, setEditingFieldCol] = useState<number | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState<string>('');

  const [newDocName, setNewDocName] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrSuccessToast, setOcrSuccessToast] = useState<string | null>(null);

  // Land Planning Valuation Edit State
  const [isEditingLandPlanning, setIsEditingLandPlanning] = useState(false);
  const [landPlanForm, setLandPlanForm] = useState({
    plannedArea: '' as string | number,
    plannedUnitPrice: '' as string | number,
    plannedValue: '' as string | number,
    unplannedArea: '' as string | number,
    unplannedUnitPrice: '' as string | number,
    unplannedValue: '' as string | number
  });

  // Sync landPlanForm with dossier when it changes
  React.useEffect(() => {
    if (dossier) {
      setLandPlanForm({
        plannedArea: dossier.plannedLandArea ?? '',
        plannedUnitPrice: dossier.plannedLandUnitPrice ?? '',
        plannedValue: dossier.plannedLandValue ?? '',
        unplannedArea: dossier.unplannedLandArea ?? '',
        unplannedUnitPrice: dossier.unplannedLandUnitPrice ?? '',
        unplannedValue: dossier.unplannedValue ?? ''
      });
    }
  }, [dossier]);

  // Fallback realistic market comparables for Sheet 2
  const comparablesList = useMemo<MarketComparable[]>(() => {
    if (!dossier) return [];
    if (dossier.marketComparables && dossier.marketComparables.length > 0) {
      return dossier.marketComparables;
    }
    const baseArea = dossier.areaCertificate || dossier.area || 104.5;
    const basePrice = dossier.appraisedUnitPrice || dossier.proposedUnitPrice || 28500000;
    return [
      {
        id: 'ss-dyn-1',
        name: `Tài sản so sánh 1: ${dossier.apartmentNumber ? dossier.apartmentNumber + ' (Tòa lân cận)' : dossier.assetName}`,
        source: 'batdongsan.com.vn (Tin xác thực)',
        contactPhone: '0982 456 789 (Môi giới anh Hoàng)',
        surveyDate: dossier.surveyDate || '01/08/2024',
        address: `${dossier.ward || 'Khu vực lân cận'}, ${dossier.district || 'Thanh Trì'}, ${dossier.province || 'Hà Nội'}`,
        area: Math.round(baseArea * 0.98 * 10) / 10,
        floorsOrFloorLevel: dossier.floorsCount ? `Tầng trung / ${dossier.floorsCount} tầng` : 'Tầng trung',
        direction: dossier.direction || 'Đông Nam',
        legalStatus: 'Sổ hồng lâu dài chính chủ',
        askingPrice: Math.round(baseArea * 0.98 * basePrice * 1.03),
        askingUnitPrice: Math.round(basePrice * 1.03),
        negotiationRate: -2.5,
        transactionUnitPrice: Math.round(basePrice * 1.004),
        adjustmentRate: 1.0,
        adjustedUnitPrice: Math.round(basePrice * 1.014),
        notes: 'Căn hộ cùng trục, bàn giao full nội thất cơ bản, pháp lý hoàn chỉnh'
      },
      {
        id: 'ss-dyn-2',
        name: `Tài sản so sánh 2: Bất động sản cùng phân khúc ${dossier.buildingName || dossier.district || ''}`,
        source: 'Chợ Tốt Nhà & Khảo sát thực địa',
        contactPhone: '0915 678 999 (Chính chủ chị Mai)',
        surveyDate: dossier.surveyDate || '01/08/2024',
        address: `${dossier.houseNumber || ''}, ${dossier.district || ''}`,
        area: Math.round(baseArea * 1.02 * 10) / 10,
        floorsOrFloorLevel: 'Tầng cao thoáng',
        direction: 'Nam',
        legalStatus: 'Đã có sổ đỏ',
        askingPrice: Math.round(baseArea * 1.02 * basePrice * 1.02),
        askingUnitPrice: Math.round(basePrice * 1.02),
        negotiationRate: -2.0,
        transactionUnitPrice: Math.round(basePrice * 0.999),
        adjustmentRate: 0.5,
        adjustedUnitPrice: Math.round(basePrice * 1.004),
        notes: 'Dự án liền kề, cùng phân khúc, tầng cao view thoáng'
      },
      {
        id: 'ss-dyn-3',
        name: `Tài sản so sánh 3: Khảo sát tại ${dossier.district || 'địa bàn tương đồng'}`,
        source: 'Văn phòng giao dịch BĐS địa phương',
        contactPhone: '0973 111 222 (Anh Tuấn Trưởng phòng GD)',
        surveyDate: dossier.surveyDate || '01/08/2024',
        address: `${dossier.ward || ''}, ${dossier.district || ''}`,
        area: baseArea,
        floorsOrFloorLevel: 'Tầng trung',
        direction: 'Đông Bắc',
        legalStatus: 'Hợp đồng mua bán / Sổ hồng',
        askingPrice: Math.round(baseArea * basePrice * 1.01),
        askingUnitPrice: Math.round(basePrice * 1.01),
        negotiationRate: -1.5,
        transactionUnitPrice: Math.round(basePrice * 0.995),
        adjustmentRate: 0.5,
        adjustedUnitPrice: basePrice,
        notes: 'Diện tích tương đương, cùng chủ đầu tư, căn góc thoáng'
      }
    ];
  }, [dossier]);

  // Average comparable unit price
  const avgComparableUnitPrice = useMemo(() => {
    if (comparablesList.length === 0) return 0;
    const sum = comparablesList.reduce((acc, c) => acc + (c.adjustedUnitPrice || 0), 0);
    return Math.round(sum / comparablesList.length);
  }, [comparablesList]);

  // Fallback CLCL calculation for Sheet 4
  const clclData = useMemo<ClclCalculationSheet>(() => {
    if (!dossier) return {};
    if (dossier.clclCalculation && dossier.clclCalculation.components && dossier.clclCalculation.components.length > 0) {
      return dossier.clclCalculation;
    }
    const area = dossier.constructionUsableArea || dossier.areaCertificate || dossier.area || 104.5;
    const unitP = dossier.constructionUnitPrice || 6500000;
    const newRepl = Math.round(area * unitP);
    const clclRate = dossier.remainingBuildingQuality || 85;
    const remainVal = Math.round(newRepl * (clclRate / 100));
    return {
      buildingClassification: dossier.constructionType || 'Công trình nhà ở chung cư nhiều tầng - Cấp II',
      designLifespanYears: 50,
      constructionYear: parseInt(dossier.constructionYear || '2020') || 2020,
      appraisalYear: 2024,
      usedYears: 4,
      baseDepreciationRate: 8.0,
      finalClclRate: clclRate,
      newConstructionUnitPrice: unitP,
      usableFloorArea: area,
      newReplacementValue: newRepl,
      remainingStructureValue: remainVal,
      components: [
        { id: 'c1', componentName: '1. Móng, khung cột, dầm, giằng, sàn bê tông cốt thép', weightRate: 30, actualQualityRate: 90, weightedQuality: 27.0, conditionDescription: 'Khung dầm sàn BTCT kiên cố, không nứt lún, kết cấu ổn định' },
        { id: 'c2', componentName: '2. Tường bao che, tường ngăn, vách ngăn căn hộ', weightRate: 15, actualQualityRate: 85, weightedQuality: 12.75, conditionDescription: 'Tường gạch vữa xi măng, sơn bả phẳng, không bong tróc' },
        { id: 'c3', componentName: '3. Mái, trần thạch cao, chống thấm sàn mái và vệ sinh', weightRate: 10, actualQualityRate: 85, weightedQuality: 8.5, conditionDescription: 'Trần thạch cao khung chìm, chống thấm khu WC hoạt động tốt' },
        { id: 'c4', componentName: '4. Lát nền, ốp gạch men, hoàn thiện bề mặt', weightRate: 15, actualQualityRate: 82, weightedQuality: 12.3, conditionDescription: 'Sàn gạch ceramic 60x60 bóng kiếng, có trầy xước nhẹ' },
        { id: 'c5', componentName: '5. Hệ thống cửa (cửa ra vào, cửa sổ, ban công)', weightRate: 10, actualQualityRate: 80, weightedQuality: 8.0, conditionDescription: 'Cửa chính gỗ công nghiệp chống cháy, cửa ban công nhôm kính Xingfa' },
        { id: 'c6', componentName: '6. Thiết bị vệ sinh, điện chiếu sáng, cấp thoát nước', weightRate: 15, actualQualityRate: 80, weightedQuality: 12.0, conditionDescription: 'Thiết bị Inax/Viglacera đầy đủ, hệ thống cấp thoát nước ổn định' },
        { id: 'c7', componentName: '7. Thiết bị đặc biệt: Thang máy, PCCC tòa nhà chung cư', weightRate: 5, actualQualityRate: 89, weightedQuality: 4.45, conditionDescription: 'Thang máy Mitsubishi vận hành êm, hệ thống báo cháy tự động đạt chuẩn' }
      ]
    };
  }, [dossier]);

  if (!isOpen || !dossier) return null;

  const imagesList = dossier.assetImages || [];

  const handleToggleDocumentStatus = (docId: string) => {
    const updatedDocs = dossier.documents.map(d => {
      if (d.id === docId) {
        const nextStatus: LegalDocument['status'] = 
          d.status === 'DA_NOP' ? 'CAN_BO_SUNG' :
          d.status === 'CAN_BO_SUNG' ? 'CHUA_NOP' : 'DA_NOP';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    onUpdateDossier({ ...dossier, documents: updatedDocs });
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    const newDoc: LegalDocument = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim(),
      status: 'CHUA_NOP'
    };
    onUpdateDossier({
      ...dossier,
      documents: [...dossier.documents, newDoc]
    });
    setNewDocName('');
  };

  const handleApplyOcrData = (extracted: ExtractedOcrData, docImage?: string) => {
    const updated: ValuationDossier = {
      ...dossier,
      clientName: extracted.clientName || dossier.clientName,
      clientCccd: extracted.clientCccd || dossier.clientCccd,
      clientAddress: extracted.clientAddress || dossier.clientAddress,
      legalDocNumber: extracted.legalDocNumber || dossier.legalDocNumber,
      landPlotNumber: extracted.landPlotNumber || dossier.landPlotNumber,
      mapSheetNumber: extracted.mapSheetNumber || dossier.mapSheetNumber,
      areaCertificate: extracted.area || dossier.areaCertificate,
      landUseForm: extracted.landUseForm || dossier.landUseForm,
      landUseTerm: extracted.landUseTerm || dossier.landUseTerm,
      houseNumber: extracted.houseNumber || dossier.houseNumber,
      ward: extracted.ward || dossier.ward,
      district: extracted.district || dossier.district,
      province: extracted.province || dossier.province,
      assetAddress: extracted.assetAddress || dossier.assetAddress,
      assetName: extracted.assetName || dossier.assetName,
      constructionType: extracted.constructionType || dossier.constructionType,
      constructionArea: extracted.constructionArea || dossier.constructionArea,
      constructionUsableArea: extracted.constructionUsableArea || dossier.constructionUsableArea,
      floorsCount: extracted.floorsCount || dossier.floorsCount,
      buildingYear: extracted.buildingYear || dossier.buildingYear,
      estimatedValue: extracted.estimatedValue || dossier.estimatedValue
    };

    if (docImage) {
      updated.assetImages = [...(updated.assetImages || []), docImage];
    }

    onUpdateDossier(updated);
    setIsOcrModalOpen(false);
    setOcrSuccessToast('Đã nạp và cập nhật tự động toàn bộ dữ liệu từ ảnh scan OCR vào hồ sơ thành công!');
    setTimeout(() => setOcrSuccessToast(null), 5000);
  };

  const handleSaveLandPlanning = () => {
    const plannedAreaNum = parseFloat(String(landPlanForm.plannedArea)) || 0;
    const plannedUnitNum = parseFloat(String(landPlanForm.plannedUnitPrice)) || 0;
    const plannedValNum = parseFloat(String(landPlanForm.plannedValue)) || (plannedAreaNum * plannedUnitNum);

    const unplannedAreaNum = parseFloat(String(landPlanForm.unplannedArea)) || 0;
    const unplannedUnitNum = parseFloat(String(landPlanForm.unplannedUnitPrice)) || 0;
    const unplannedValNum = parseFloat(String(landPlanForm.unplannedValue)) || (unplannedAreaNum * unplannedUnitNum);

    const updated: ValuationDossier = {
      ...dossier,
      plannedLandArea: plannedAreaNum,
      plannedLandUnitPrice: plannedUnitNum,
      plannedLandValue: plannedValNum,
      unplannedLandArea: unplannedAreaNum,
      unplannedLandUnitPrice: unplannedUnitNum,
      unplannedLandValue: unplannedValNum,
      appraisedUnitPrice: plannedUnitNum || dossier.appraisedUnitPrice,
      marketPrice: (plannedValNum + unplannedValNum) > 0 ? (plannedValNum + unplannedValNum) : dossier.marketPrice,
      approvedValue: (plannedValNum + unplannedValNum) > 0 ? (plannedValNum + unplannedValNum) : dossier.approvedValue
    };

    onUpdateDossier(updated);
    setIsEditingLandPlanning(false);
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrlInput.trim()) return;
    const currentImages = dossier.assetImages || [];
    onUpdateDossier({ ...dossier, assetImages: [...currentImages, newImageUrlInput.trim()] });
    setNewImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = dossier.assetImages || [];
    const updated = currentImages.filter((_, i) => i !== index);
    onUpdateDossier({ ...dossier, assetImages: updated });
    if (selectedImageIndex === index) setSelectedImageIndex(null);
  };

  const statusConfig = getStatusConfig(dossier.status);
  const slaInfo = getSLADaysInfo(dossier.dueDate, dossier.status);
  const paymentConfig = PAYMENT_STATUS_CONFIG[dossier.paymentStatus];
  const priorityConfig = PRIORITY_CONFIG[dossier.priority];
  const categoryLabel = ASSET_CATEGORY_CONFIG[dossier.assetCategory]?.label || dossier.assetCategory;

  // Build list of all imported fields (from dossier.importedColumnsData or synthetic)
  const allImportedFields: DynamicImportField[] = React.useMemo(() => {
    if (dossier.importedColumnsData && dossier.importedColumnsData.length > 0) {
      return dossier.importedColumnsData;
    }
    const synthetic: DynamicImportField[] = [
      { colIndex: 0, headerName: 'SỐ HỒ SƠ', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.code },
      { colIndex: 1, headerName: 'Trạng thái hồ sơ', categoryGroup: 'THÔNG TIN CHUNG', value: getStatusConfig(dossier.status)?.label || dossier.status },
      { colIndex: 2, headerName: 'ĐƠN VỊ KINH DOANH', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.businessUnit || '' },
      { colIndex: 3, headerName: 'KHÁCH HÀNG', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.clientName },
      { colIndex: 4, headerName: 'CCCD', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.clientCccd || '' },
      { colIndex: 5, headerName: 'NGÀY TIẾP NHẬN (Giờ)', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.receivedTime || '' },
      { colIndex: 6, headerName: 'NGÀY TIẾP NHẬN (Ngày)', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.receivedDate || '' },
      { colIndex: 7, headerName: 'NGÀY PHÂN CÔNG (Giờ)', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.assignedTime || '' },
      { colIndex: 8, headerName: 'NGÀY PHÂN CÔNG (Ngày)', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.assignedDate || '' },
      { colIndex: 9, headerName: 'CHUYÊN VIÊN AMC', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.amcSpecialist || dossier.assignedAppraiser || '' },
      { colIndex: 10, headerName: 'PHÍ TẠM ỨNG', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.advanceFee ? formatVND(dossier.advanceFee) : '' },
      { colIndex: 11, headerName: 'NGÀY KHẢO SÁT', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.surveyDate || '' },
      { colIndex: 12, headerName: 'NGÀY PHÊ DUYỆT', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.approvalDate || '' },
      { colIndex: 13, headerName: 'CHUYÊN VIÊN ĐƠN VỊ KINH DOANH', categoryGroup: 'THÔNG TIN CHUNG', value: dossier.businessUnitSpecialist || '' },
      { colIndex: 14, headerName: 'TỔNG PHÍ THẨM ĐỊNH', categoryGroup: 'THÔNG TIN CHUNG', value: (dossier.totalValuationFee || dossier.serviceFee) ? formatVND(dossier.totalValuationFee || dossier.serviceFee || 0) : '' },
      { colIndex: 15, headerName: 'LOẠI TÀI SẢN (BĐS/ĐS)', categoryGroup: 'THÔNG TIN CHUNG', value: categoryLabel },
      { colIndex: 16, headerName: 'THỬA ĐẤT SỐ', categoryGroup: 'ĐỊA CHỈ THỬA ĐẤT', value: dossier.landPlotNumber || '' },
      { colIndex: 17, headerName: 'TỜ BẢN ĐỒ', categoryGroup: 'ĐỊA CHỈ THỬA ĐẤT', value: dossier.mapSheetNumber || '' },
      { colIndex: 18, headerName: 'SỐ NHÀ, CĂN HỘ', categoryGroup: 'ĐỊA CHỈ THỬA ĐẤT', value: dossier.houseNumber || '' },
      { colIndex: 19, headerName: 'XÃ/THỊ TRẤN/PHƯỜNG', categoryGroup: 'ĐỊA CHỈ THỬA ĐẤT', value: dossier.ward || '' },
      { colIndex: 20, headerName: 'HUYỆN/THỊ XÃ/QUẬN', categoryGroup: 'ĐỊA CHỈ THỬA ĐẤT', value: dossier.district || '' },
      { colIndex: 21, headerName: 'TỈNH/TP', categoryGroup: 'ĐỊA CHỈ THỬA ĐẤT', value: dossier.province || '' },
      { colIndex: 22, headerName: 'ĐỊA CHỈ TÀI SẢN ĐẦY ĐỦ', categoryGroup: 'ĐỊA CHỈ THỬA ĐẤT', value: dossier.assetAddress || '' },
      { colIndex: 23, headerName: 'NĂM XÂY DỰNG CHUNG CƯ', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.constructionYear || '' },
      { colIndex: 24, headerName: 'SỐ TẦNG', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.floorsCount || '' },
      { colIndex: 25, headerName: 'DIỆN TÍCH THEO SỔ ĐỎ (m2)', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.areaCertificate || dossier.area || '' },
      { colIndex: 26, headerName: 'DIỆN TÍCH CƠI NỚI', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.areaExpanded || '' },
      { colIndex: 27, headerName: 'HÌNH THỨC SỬ DỤNG ĐẤT', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.landUseForm || '' },
      { colIndex: 28, headerName: 'THỜI HẠN SỬ DỤNG ĐẤT', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.landUseTerm || '' },
      { colIndex: 29, headerName: 'ĐƯỜNG VÀO (Cấp độ)', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.roadAccessLevel || '' },
      { colIndex: 30, headerName: 'ĐƯỜNG VÀO (Loại đường)', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.roadType || '' },
      { colIndex: 31, headerName: 'ĐƯỜNG VÀO (Độ rộng)', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.roadWidth || '' },
      { colIndex: 32, headerName: 'HƯỚNG', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.direction || '' },
      { colIndex: 33, headerName: 'HÌNH DẠNG', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.shape || '' },
      { colIndex: 34, headerName: 'ĐỘ RỘNG MẶT TIỀN (m)', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.frontageWidth || '' },
      { colIndex: 35, headerName: 'DÀI X RỘNG', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.dimension || '' },
      { colIndex: 36, headerName: 'TỌA ĐỘ GOOGLE MAP', categoryGroup: 'THÔNG SỐ KỸ THUẬT', value: dossier.googleMapCoords || '' },
      { colIndex: 37, headerName: 'GIÁ NHÀ NƯỚC', categoryGroup: 'KẾT QUẢ THẨM ĐỊNH GIÁ', value: dossier.stateLandPrice ? formatVND(dossier.stateLandPrice) : '' },
      { colIndex: 38, headerName: 'HỆ SỐ K', categoryGroup: 'KẾT QUẢ THẨM ĐỊNH GIÁ', value: dossier.kCoefficient || '' },
      { colIndex: 39, headerName: 'ĐƠN GIÁ ĐỀ NGHỊ', categoryGroup: 'KẾT QUẢ THẨM ĐỊNH GIÁ', value: dossier.proposedUnitPrice ? formatVND(dossier.proposedUnitPrice) : '' },
      { colIndex: 40, headerName: 'ĐƠN GIÁ THẨM ĐỊNH', categoryGroup: 'KẾT QUẢ THẨM ĐỊNH GIÁ', value: dossier.appraisedUnitPrice ? formatVND(dossier.appraisedUnitPrice) : '' },
      { colIndex: 41, headerName: 'GIÁ THỊ TRƯỜNG / PHÊ DUYỆT', categoryGroup: 'KẾT QUẢ THẨM ĐỊNH GIÁ', value: (dossier.marketPrice || dossier.approvedValue) ? formatVND(dossier.marketPrice || dossier.approvedValue || 0) : '' },
      { colIndex: 42, headerName: 'DIỆN TÍCH PHÙ HỢP QUY HOẠCH', categoryGroup: 'ĐỊNH GIÁ QUY HOẠCH (BĐS)', value: dossier.plannedLandArea ? `${dossier.plannedLandArea} m²` : '' },
      { colIndex: 43, headerName: 'GIÁ THẨM ĐỊNH PHÙ HỢP QUY HOẠCH', categoryGroup: 'ĐỊNH GIÁ QUY HOẠCH (BĐS)', value: dossier.plannedLandValue ? formatVND(dossier.plannedLandValue) : '' },
      { colIndex: 44, headerName: 'DIỆN TÍCH KHÔNG PHÙ HỢP QUY HOẠCH', categoryGroup: 'ĐỊNH GIÁ QUY HOẠCH (BĐS)', value: dossier.unplannedLandArea ? `${dossier.unplannedLandArea} m²` : '' },
      { colIndex: 45, headerName: 'GIÁ THẨM ĐỊNH KHÔNG PHÙ HỢP QUY HOẠCH', categoryGroup: 'ĐỊNH GIÁ QUY HOẠCH (BĐS)', value: dossier.unplannedLandValue ? formatVND(dossier.unplannedValue || dossier.unplannedLandValue || 0) : '' },
      { colIndex: 46, headerName: 'LOẠI CÔNG TRÌNH XÂY DỰNG', categoryGroup: 'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT', value: dossier.constructionType || '' },
      { colIndex: 47, headerName: 'DIỆN TÍCH XÂY DỰNG', categoryGroup: 'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT', value: dossier.constructionArea || '' },
      { colIndex: 48, headerName: 'DIỆN TÍCH SỬ DỤNG THEO SỔ', categoryGroup: 'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT', value: dossier.constructionUsableArea || '' },
      { colIndex: 49, headerName: 'DIỆN TÍCH SỬ DỤNG THỰC TẾ', categoryGroup: 'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT', value: dossier.constructionActualArea || '' },
      { colIndex: 50, headerName: 'SỐ TẦNG / NGUYÊN LIỆU GIA CÔNG', categoryGroup: 'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT', value: dossier.buildingFloorsMaterial || '' },
      { colIndex: 51, headerName: 'NĂM XÂY DỰNG', categoryGroup: 'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT', value: dossier.buildingYear || '' },
      { colIndex: 52, headerName: 'CHẤT LƯỢNG CÒN LẠI (CLCL %)', categoryGroup: 'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT', value: dossier.remainingBuildingQuality ? `${dossier.remainingBuildingQuality}%` : '' },
      { colIndex: 53, headerName: 'ĐƠN GIÁ XÂY DỰNG', categoryGroup: 'CÔNG TRÌNH GẮN LIỀN VỚI ĐẤT', value: dossier.constructionUnitPrice ? formatVND(dossier.constructionUnitPrice) : '' }
    ];
    return synthetic;
  }, [dossier, categoryLabel]);

  // Unique groups in imported fields
  const fieldGroups = React.useMemo(() => {
    const set = new Set<string>();
    allImportedFields.forEach(f => {
      if (f.categoryGroup) set.add(f.categoryGroup);
    });
    return Array.from(set);
  }, [allImportedFields]);

  // Filtered fields
  const filteredImportedFields = React.useMemo(() => {
    return allImportedFields.filter(f => {
      const matchGroup = selectedFieldGroup === 'ALL' || f.categoryGroup === selectedFieldGroup;
      const q = fieldSearchQuery.toLowerCase().trim();
      if (!q) return matchGroup;
      const matchQ = 
        f.headerName.toLowerCase().includes(q) ||
        (f.categoryGroup && f.categoryGroup.toLowerCase().includes(q)) ||
        (f.value !== undefined && String(f.value).toLowerCase().includes(q));
      return matchGroup && matchQ;
    });
  }, [allImportedFields, selectedFieldGroup, fieldSearchQuery]);

  const handleCopyField = (header: string, val: any) => {
    const text = String(val ?? '');
    navigator.clipboard.writeText(text);
    setCopiedFieldName(header);
    setTimeout(() => setCopiedFieldName(null), 2000);
  };

  const handleSaveFieldEdit = (colIndex: number) => {
    const updatedFields = allImportedFields.map(f => {
      if (f.colIndex === colIndex) {
        return { ...f, value: editingFieldValue };
      }
      return f;
    });
    onUpdateDossier({
      ...dossier,
      importedColumnsData: updatedFields,
      customFields: {
        ...(dossier.customFields || {}),
        [`col_${colIndex + 1}`]: editingFieldValue
      }
    });
    setEditingFieldCol(null);
  };

  const isShowAll = viewMode === 'all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Status Lock & Rejection Banners */}
        {isDossierLocked(dossier.status) && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center space-x-2 text-emerald-900 text-xs font-bold shrink-0">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>🔒 Hồ sơ đã được Lãnh đạo duyệt báo cáo. Bản ghi đã bị KHÓA và không cho phép chỉnh sửa.</span>
          </div>
        )}
        {dossier.status === 'TU_CHOI_BAO_CAO' && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-start space-x-2 text-rose-950 text-xs shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold uppercase text-rose-900">Lãnh đạo đã từ chối duyệt báo cáo — Yêu cầu chỉnh sửa:</span>
              {dossier.approvalRejectionReason && (
                <div className="mt-1 bg-white/80 p-2 rounded-lg border border-rose-200 font-medium text-rose-800">
                  {dossier.approvalRejectionReason}
                </div>
              )}
              <p className="mt-1 text-slate-600">Hồ sơ đã được mở khóa. Bạn có thể nhấn biểu tượng cây bút ở góc trên để cập nhật lại thông tin hồ sơ.</p>
            </div>
          </div>
        )}
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {dossier.code}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusConfig.badge}`}>
                {statusConfig.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${priorityConfig.badge}`}>
                {priorityConfig.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${slaInfo.color}`}>
                {slaInfo.text}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {categoryLabel}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1 line-clamp-1">
              {dossier.assetName}
            </h2>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0 flex-wrap gap-y-1">
            {hasPermission('export_report') && onOpenExportDoc && (
              <button
                onClick={() => onOpenExportDoc(dossier)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
                title="Xuất Báo Cáo Tư Vấn Định Giá (Mẫu chuẩn Google Drive .docx & In)"
              >
                <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Xuất Báo Cáo Định Giá</span>
                <span className="sm:hidden">Xuất Báo Cáo</span>
              </button>
            )}

            {hasPermission('edit_dossier') && !isDossierLocked(dossier.status) && (
              <button
                onClick={() => onEdit(dossier)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Sửa toàn bộ hồ sơ (4 Sheet)"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 EXCEL SHEETS + EXTENDED TABS NAVIGATION BAR */}
        <div className="bg-slate-100 px-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold overflow-x-auto shrink-0 pt-1.5">
          <div className="flex space-x-1 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
            {/* Sheet 1 */}
            <button
              onClick={() => { setActiveTab('sheet_1'); if (viewMode === 'all') setViewMode('tabs'); }}
              className={`py-2 px-3 rounded-t-lg border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'sheet_1' && viewMode === 'tabs'
                  ? 'border-blue-600 text-blue-700 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Sheet 1: ĐẶC ĐIỂM CHUNG,CHI TIẾT</span>
            </button>

            {/* Sheet 2 */}
            <button
              onClick={() => { setActiveTab('sheet_2'); if (viewMode === 'all') setViewMode('tabs'); }}
              className={`py-2 px-3 rounded-t-lg border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'sheet_2' && viewMode === 'tabs'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sheet 2: thuthapthongtin</span>
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                {comparablesList.length}
              </span>
            </button>

            {/* Sheet 3 */}
            <button
              onClick={() => { setActiveTab('sheet_3'); if (viewMode === 'all') setViewMode('tabs'); }}
              className={`py-2 px-3 rounded-t-lg border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'sheet_3' && viewMode === 'tabs'
                  ? 'border-amber-600 text-amber-800 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>Sheet 3: Bang tinh gia dat</span>
            </button>

            {/* Sheet 4 */}
            <button
              onClick={() => { setActiveTab('sheet_4'); if (viewMode === 'all') setViewMode('tabs'); }}
              className={`py-2 px-3 rounded-t-lg border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'sheet_4' && viewMode === 'tabs'
                  ? 'border-teal-600 text-teal-800 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-teal-600" />
              <span>Sheet 4: bang tinh clcl</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-teal-100 text-teal-800 font-bold">
                {clclData.finalClclRate ?? 85}%
              </span>
            </button>

            {/* Extended Tab: Images & Legal Docs */}
            <button
              onClick={() => { setActiveTab('images'); if (viewMode === 'all') setViewMode('tabs'); }}
              className={`py-2 px-3 rounded-t-lg border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'images' && viewMode === 'tabs'
                  ? 'border-purple-600 text-purple-700 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Ảnh & Pháp Lý ({imagesList.length})</span>
            </button>

            {/* Extended Tab: Progress History */}
            <button
              onClick={() => { setActiveTab('history'); if (viewMode === 'all') setViewMode('tabs'); }}
              className={`py-2 px-3 rounded-t-lg border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'history' && viewMode === 'tabs'
                  ? 'border-indigo-600 text-indigo-700 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tiến Độ ({dossier.statusHistory.length})</span>
            </button>

            {/* Extended Tab: Imported Fields Table */}
            <button
              onClick={() => { setActiveTab('imported_fields'); if (viewMode === 'all') setViewMode('tabs'); }}
              className={`py-2 px-3 rounded-t-lg border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'imported_fields' && viewMode === 'tabs'
                  ? 'border-emerald-600 text-emerald-800 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>54 Cột Excel</span>
            </button>
          </div>

          {/* View Mode Switcher: Tabs vs All Sheets Scrolling */}
          <div className="flex items-center space-x-1 pb-1.5 sm:pb-0 shrink-0">
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
              📜 Xem Tất Cả Sheet
            </button>
          </div>
        </div>

        {/* OCR Success Toast */}
        {ocrSuccessToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fadeIn shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin-slow shrink-0" />
            <span>{ocrSuccessToast}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6">

          {/* Top Highlight Summary Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Giá Trị Đề Xuất</span>
              <span className="text-lg font-bold text-slate-200">{formatVND(dossier.estimatedValue)}</span>
            </div>

            <div>
              <span className="text-xs text-amber-400 block font-semibold uppercase tracking-wider">Giá Trị Phê Duyệt</span>
              <span className="text-xl font-bold text-emerald-400">{formatVND(dossier.approvedValue || dossier.estimatedValue)}</span>
              <span className="text-[11px] text-slate-400 block italic mt-0.5">
                ({numberToVietnameseWords(dossier.approvedValue || dossier.estimatedValue)})
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Phí Dịch Vụ Thẩm Định</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-bold text-amber-300">
                  {formatVND(dossier.totalValuationFee || dossier.serviceFee)}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${paymentConfig.badge}`}>
                  {paymentConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SHEET 1: ĐẶC ĐIỂM CHUNG,CHI TIẾT                         */}
          {/* ========================================================= */}
          {(isShowAll || activeTab === 'sheet_1') && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 text-xs sm:text-sm uppercase tracking-wide">
                      Sheet 1: ĐẶC ĐIỂM CHUNG,CHI TIẾT
                    </h3>
                    <p className="text-[11px] text-blue-800">
                      Thông tin chung hồ sơ, khách hàng, địa chỉ thửa đất/căn hộ và thông số kỹ thuật chi tiết
                    </p>
                  </div>
                </div>
              </div>

              {/* Mục 1A: Thông tin chung & Khách hàng */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>1A. Thông tin chung hồ sơ & Khách hàng</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">ĐVKD: {dossier.businessUnit || '---'}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Số hồ sơ:</span> <strong className="font-mono text-slate-900">{dossier.code}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Khách hàng:</span> <strong className="text-slate-900">{dossier.clientName}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">CCCD/MST:</span> <span className="font-mono">{dossier.clientCccd || '---'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Số điện thoại:</span> <span className="font-mono text-amber-600">{dossier.clientPhone || '---'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Chuyên viên AMC:</span> <strong>{dossier.amcSpecialist || dossier.assignedAppraiser}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Phí tạm ứng:</span> <span className="font-mono font-bold text-emerald-700">{dossier.advanceFee ? formatVND(dossier.advanceFee) : '0 VNĐ'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Loại tài sản:</span> <span className="font-semibold text-slate-800">{categoryLabel}</span></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Ngày tiếp nhận:</span> <span>{dossier.receivedDate} ({dossier.receivedTime || '--:--'})</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Ngày phân công:</span> <span>{dossier.assignedDate || '---'} ({dossier.assignedTime || '--:--'})</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Ngày khảo sát:</span> <span>{dossier.surveyDate || '---'} ({dossier.surveyTime || '--:--'})</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Ngày phê duyệt:</span> <span>{dossier.approvalDate || '---'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Chuyên viên tín dụng:</span> <span className="font-semibold text-blue-700">{dossier.creditOfficer || dossier.businessUnitSpecialist || '---'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tổng phí thẩm định:</span> <span className="font-mono font-bold text-emerald-700">{dossier.totalValuationFee ? formatVND(dossier.totalValuationFee) : (dossier.serviceFee ? formatVND(dossier.serviceFee) : '---')}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Địa chỉ thường trú KH:</span> <span className="text-slate-700 text-right truncate max-w-[200px]" title={dossier.clientAddress}>{dossier.clientAddress || '---'}</span></div>
                  </div>
                </div>
              </div>

              {/* Mục 1B: Địa chỉ thửa đất & Căn hộ chung cư */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>1B. Địa chỉ thửa đất & Căn hộ chung cư</span>
                  </h4>
                  {dossier.googleMapCoords && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dossier.googleMapCoords)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 flex items-center space-x-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      <span>Xem Vị Trí Google Maps</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-slate-500 block">Thửa đất số:</span><strong className="text-slate-900 font-mono">{dossier.landPlotNumber || '---'}</strong></div>
                  <div><span className="text-slate-500 block">Tờ bản đồ số:</span><strong className="text-slate-900 font-mono">{dossier.mapSheetNumber || '---'}</strong></div>
                  <div><span className="text-slate-500 block">Số căn hộ:</span><strong className="text-amber-800 font-bold">{dossier.apartmentNumber || '---'}</strong></div>
                  <div><span className="text-slate-500 block">Tòa nhà / Dự án:</span><span className="text-slate-800 font-medium">{dossier.buildingName || '---'}</span></div>
                  <div><span className="text-slate-500 block">Số nhà / Hẻm:</span><span className="text-slate-800 font-medium">{dossier.houseNumber || '---'}</span></div>
                  <div><span className="text-slate-500 block">Phường / Xã:</span><span className="text-slate-800 font-medium">{dossier.ward || '---'}</span></div>
                  <div><span className="text-slate-500 block">Quận / Huyện:</span><span className="text-slate-800 font-medium">{dossier.district || '---'}</span></div>
                  <div><span className="text-slate-500 block">Tỉnh / Thành phố:</span><span className="text-slate-800 font-medium">{dossier.province || '---'}</span></div>
                  <div className="col-span-2 sm:col-span-4"><span className="text-slate-500 block">Địa chỉ đầy đủ:</span><span className="text-slate-900 font-medium">{dossier.assetAddress}</span></div>
                </div>
              </div>

              {/* Mục 1C: Thông số kỹ thuật chi tiết */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>1C. Thông số kỹ thuật chi tiết</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-slate-500 block">Năm XD chung cư:</span><strong className="text-slate-900">{dossier.constructionYear || '---'}</strong></div>
                  <div><span className="text-slate-500 block">Số tầng:</span><span className="text-slate-800">{dossier.floorsCount || '---'}</span></div>
                  <div><span className="text-slate-500 block">Diện tích sổ đỏ:</span><strong className="text-indigo-700 font-bold">{dossier.areaCertificate || dossier.area || 0} m²</strong></div>
                  <div><span className="text-slate-500 block">Diện tích cơi nới:</span><span className="text-slate-800">{dossier.areaExpanded || 0} m²</span></div>

                  <div><span className="text-slate-500 block">Hình thức sử dụng:</span><span className="text-slate-800">{dossier.landUseForm || '---'}</span></div>
                  <div><span className="text-slate-500 block">Thời hạn sử dụng:</span><span className="text-slate-800">{dossier.landUseTerm || '---'}</span></div>
                  <div><span className="text-slate-500 block">Đường vào (Cấp độ):</span><span className="text-slate-800">{dossier.roadAccessLevel || '---'}</span></div>
                  <div><span className="text-slate-500 block">Loại đường & Độ rộng:</span><span className="text-slate-800">{dossier.roadType || 'Đường nội bộ'} ({dossier.roadWidth || '---'})</span></div>

                  <div><span className="text-slate-500 block">Hướng / Ban công:</span><span className="text-slate-800">{dossier.direction || '---'}</span></div>
                  <div><span className="text-slate-500 block">Hình dạng:</span><span className="text-slate-800">{dossier.shape || '---'}</span></div>
                  <div><span className="text-slate-500 block">Mặt tiền / Rộng:</span><span className="text-slate-800">{dossier.frontageWidth ? `${dossier.frontageWidth}m` : '---'}</span></div>
                  <div><span className="text-slate-500 block">Kích thước (DxR):</span><span className="text-slate-800">{dossier.dimension || '---'}</span></div>

                  <div className="col-span-2"><span className="text-slate-500 block">Điều kiện kinh doanh & Hạ tầng:</span><span className="text-slate-800">{dossier.businessCondition || 'Để ở & dịch vụ'} • {dossier.infrastructure || 'Đầy đủ'}</span></div>
                  <div className="col-span-2"><span className="text-slate-500 block">Yếu tố khác / Mô tả:</span><span className="text-slate-800">{dossier.otherFactors || '---'}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SHEET 2: thuthapthongtin (Thu thập thông tin so sánh)     */}
          {/* ========================================================= */}
          {(isShowAll || activeTab === 'sheet_2') && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-950 text-xs sm:text-sm uppercase tracking-wide">
                      Sheet 2: thuthapthongtin (Thu thập thông tin so sánh thị trường)
                    </h3>
                    <p className="text-[11px] text-emerald-800">
                      Khảo sát thực địa, so sánh 3 tài sản thị trường, xác định đơn giá chỉ dẫn
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-lg border border-emerald-300">
                    Đơn giá chỉ dẫn TB: {formatVND(avgComparableUnitPrice)}/m²
                  </span>
                </div>
              </div>

              {/* Comparables List Cards */}
              <div className="space-y-3">
                {comparablesList.map((comp, idx) => (
                  <div key={comp.id || idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-emerald-300 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {comp.name}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Chỉ dẫn: {formatVND(comp.adjustedUnitPrice)}/m²
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Nguồn tin:</span>
                        <strong className="text-slate-800 truncate block" title={comp.source}>{comp.source || 'Khảo sát thực địa'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Liên hệ / Môi giới:</span>
                        <span className="font-mono text-slate-800">{comp.contactPhone || '---'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Ngày khảo sát:</span>
                        <span className="text-slate-800">{comp.surveyDate || '---'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Pháp lý:</span>
                        <span className="text-slate-800">{comp.legalStatus || 'Sổ hồng / Sổ đỏ'}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">Địa chỉ TSSS:</span>
                        <span className="text-slate-800 font-medium">{comp.address}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Diện tích & Vị trí:</span>
                        <strong className="text-indigo-700">{comp.area} m²</strong> ({comp.floorsOrFloorLevel || 'Tầng trung'})
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Hướng:</span>
                        <span className="text-slate-800">{comp.direction || '---'}</span>
                      </div>
                    </div>

                    {/* Financial Breakdown Table for this comparable */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Giá rao bán:</span>
                        <span className="font-bold text-slate-800">{formatVND(comp.askingPrice)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Đơn giá rao bán:</span>
                        <span className="font-mono text-slate-800">{formatVND(comp.askingUnitPrice || Math.round(comp.askingPrice / comp.area))}/m²</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Thương lượng ({comp.negotiationRate ?? -2.5}%):</span>
                        <span className="font-mono text-amber-700">{formatVND(comp.transactionUnitPrice || Math.round((comp.askingPrice / comp.area) * (1 + (comp.negotiationRate || -2.5) / 100)))}/m²</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Điều chỉnh ({comp.adjustmentRate ?? 0}%):</span>
                        <span className="font-mono font-bold text-emerald-700">{formatVND(comp.adjustedUnitPrice)}/m²</span>
                      </div>
                    </div>

                    {comp.notes && (
                      <div className="text-[11px] text-slate-600 bg-emerald-50/40 p-2 rounded border border-emerald-100 italic">
                        <strong>Đặc điểm so sánh:</strong> {comp.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SHEET 3: Bang tinh gia dat                                */}
          {/* ========================================================= */}
          {(isShowAll || activeTab === 'sheet_3') && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-950 text-xs sm:text-sm uppercase tracking-wide">
                      Sheet 3: Bang tinh gia dat (Bảng tính giá đất / căn hộ & phân bổ quy hoạch)
                    </h3>
                    <p className="text-[11px] text-amber-900">
                      Bảng tính giá đất theo Bảng giá Nhà nước, Hệ số K, phân bổ diện tích quy hoạch và giá thị trường
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-amber-100 text-amber-950 font-black px-2.5 py-1 rounded-lg border border-amber-300">
                    Phê duyệt: {formatVND(dossier.approvedValue || dossier.marketPrice || 0)}
                  </span>
                </div>
              </div>

              {/* Khối Đơn giá Nhà nước & Thẩm định */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Giá đất Nhà nước:</span>
                  <strong className="text-slate-900 font-mono text-sm">
                    {dossier.stateLandPrice ? formatVND(dossier.stateLandPrice) + '/m²' : '---'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Năm ban hành giá NN:</span>
                  <span className="font-semibold text-slate-800">{dossier.statePriceYear || '2024'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Hệ số điều chỉnh (K):</span>
                  <span className="font-bold text-amber-800 font-mono">K = {dossier.kCoefficient || 1.2}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Đơn giá đề nghị:</span>
                  <span className="font-mono text-slate-800">{dossier.proposedUnitPrice ? formatVND(dossier.proposedUnitPrice) + '/m²' : '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Đơn giá thẩm định:</span>
                  <strong className="font-mono text-emerald-700 text-sm">{dossier.appraisedUnitPrice ? formatVND(dossier.appraisedUnitPrice) + '/m²' : '---'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Diện tích tính giá:</span>
                  <strong className="text-indigo-700 font-bold">{dossier.areaCertificate || dossier.area || 0} m²</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[11px]">Giá trị thị trường tính toán:</span>
                  <strong className="text-emerald-800 font-black text-sm">{formatVND(dossier.marketPrice || dossier.approvedValue || 0)}</strong>
                </div>
              </div>

              {/* IV. KIẾN NGHỊ & ĐỀ XUẤT CỦA CÁN BỘ THẨM ĐỊNH */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white p-4 rounded-xl border border-amber-300 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                      IV. KIẾN NGHỊ & ĐỀ XUẤT CỦA CÁN BỘ THẨM ĐỊNH (Xuất Báo cáo BM.02A/TĐTS)
                    </h4>
                  </div>
                  {!isDossierLocked(dossier.status) && (
                    <button
                      type="button"
                      onClick={() => onEdit(dossier)}
                      className="text-xs text-amber-800 hover:text-amber-950 font-bold bg-white border border-amber-300 px-2.5 py-1 rounded-lg shadow-2xs transition flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa kiến nghị</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-slate-800">
                      <strong className="text-slate-900">• Đề xuất cấp tín dụng:</strong>{' '}
                      {dossier.creditProposal || `Đề xuất chấp thuận kết quả định giá làm cơ sở cấp tín dụng cho khách hàng ${dossier.clientName} theo quy định của Ngân hàng TMCP Bắc Á.`}
                    </p>
                    <p className="text-slate-800">
                      <strong className="text-slate-900">• Tỷ lệ LTV đề xuất:</strong>{' '}
                      <span className="font-bold text-amber-900">{dossier.maxLtvRate ?? 70}%</span> giá trị định giá TSBĐ{' '}
                      {dossier.maxLoanAmount && dossier.maxLoanAmount > 0 ? (
                        <span>(Số tiền cho vay tối đa: <strong className="font-mono text-emerald-800">{formatVND(dossier.maxLoanAmount)}</strong>)</span>
                      ) : null}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-slate-800">
                      <strong className="text-slate-900">• Điều kiện quản lý TSBĐ:</strong>{' '}
                      {dossier.collateralConditions || 'Kiểm tra thực địa ranh giới, đối chiếu hồ sơ gốc và đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.'}
                    </p>
                    {dossier.postDisbursementCheck && (
                      <p className="text-slate-800">
                        <strong className="text-slate-900">• Giám sát sau giải ngân:</strong>{' '}
                        {dossier.postDisbursementCheck}
                      </p>
                    )}
                  </div>
                </div>

                {dossier.recommendations && dossier.recommendations.trim() ? (
                  <div className="pt-2 border-t border-amber-200/60 text-xs font-mono text-amber-950 bg-white/80 p-2 rounded border border-amber-200">
                    <span className="font-bold font-sans text-slate-700 block mb-0.5">Toàn văn kiến nghị xuất nguyên văn:</span>
                    {dossier.recommendations}
                  </div>
                ) : null}
              </div>

              {/* BẢNG TÍNH GIÁ ĐẤT / SO SÁNH TRỰC TIẾP CHUẨN MẪU */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Bảng tính giá đất / định giá theo phương pháp so sánh (Chuẩn mẫu 5 cột)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Giá bình quân = Trung bình mức giá sau điều chỉnh của 3 TSSS
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-200 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3 border-r border-slate-800 min-w-[200px]">Nội dung</th>
                        <th className="p-3 text-right border-r border-slate-800 min-w-[150px] bg-emerald-950/40 text-emerald-300">Thửa đất thẩm định giá</th>
                        <th className="p-3 text-right border-r border-slate-800 min-w-[140px]">Tài sản so sánh 1</th>
                        <th className="p-3 text-right border-r border-slate-800 min-w-[140px]">Tài sản so sánh 2</th>
                        <th className="p-3 text-right min-w-[140px]">Tài sản so sánh 3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {/* 1. Tổng diện tích */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans font-semibold text-slate-900 border-r border-slate-100">Tổng diện tích (m2)</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700 border-r border-slate-100 bg-emerald-50/20">
                          {dossier.area || dossier.areaCertificate || 102.0} m²
                        </td>
                        <td className="p-2.5 text-right border-r border-slate-100">{dossier.marketComparables?.[0]?.area || 102.0} m²</td>
                        <td className="p-2.5 text-right border-r border-slate-100">{dossier.marketComparables?.[1]?.area || 98.5} m²</td>
                        <td className="p-2.5 text-right">{dossier.marketComparables?.[2]?.area || 106.0} m²</td>
                      </tr>

                      {/* 2. Giá tham khảo */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans font-semibold text-slate-900 border-r border-slate-100">Giá tham khảo</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700 border-r border-slate-100 bg-emerald-50/20">
                          {formatVND(dossier.marketPrice || dossier.approvedValue || 2900000000)}
                        </td>
                        <td className="p-2.5 text-right border-r border-slate-100">{formatVND(dossier.marketComparables?.[0]?.askingPrice || 2950000000)}</td>
                        <td className="p-2.5 text-right border-r border-slate-100">{formatVND(dossier.marketComparables?.[1]?.askingPrice || 2820000000)}</td>
                        <td className="p-2.5 text-right">{formatVND(dossier.marketComparables?.[2]?.askingPrice || 3050000000)}</td>
                      </tr>

                      {/* 3. Đơn giá */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans font-semibold text-slate-900 border-r border-slate-100">Đơn giá (vnd/m2)</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700 border-r border-slate-100 bg-emerald-50/20">
                          {formatVND(dossier.appraisedUnitPrice || dossier.proposedUnitPrice || 28400000)} /m²
                        </td>
                        <td className="p-2.5 text-right border-r border-slate-100">{formatVND(dossier.marketComparables?.[0]?.askingUnitPrice || 28921568)}</td>
                        <td className="p-2.5 text-right border-r border-slate-100">{formatVND(dossier.marketComparables?.[1]?.askingUnitPrice || 28629441)}</td>
                        <td className="p-2.5 text-right">{formatVND(dossier.marketComparables?.[2]?.askingUnitPrice || 28773584)}</td>
                      </tr>

                      {/* 4. Thời điểm giao dịch */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans font-semibold text-slate-900 border-r border-slate-100">Thời điểm giao dịch</td>
                        <td className="p-2.5 text-right text-emerald-700 border-r border-slate-100 bg-emerald-50/25">Hiện tại</td>
                        <td className="p-2.5 text-right border-r border-slate-100">{dossier.marketComparables?.[0]?.surveyDate || '31/07/2024'}</td>
                        <td className="p-2.5 text-right border-r border-slate-100">{dossier.marketComparables?.[1]?.surveyDate || '01/08/2024'}</td>
                        <td className="p-2.5 text-right">{dossier.marketComparables?.[2]?.surveyDate || '01/08/2024'}</td>
                      </tr>

                      {/* 5. Section Header */}
                      <tr className="bg-slate-100 font-sans font-bold text-slate-900">
                        <td className="p-2.5 border-r border-slate-200 uppercase" colSpan={5}>Điều chỉnh theo các yếu tố so sánh</td>
                      </tr>

                      {/* 6 & 7. Yếu tố thị trường */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Yếu tố thị trường</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Tương đương</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Tương đương</td>
                        <td className="p-2.5 text-right">Tương đương</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-700">+0.0%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-700">+0.0%</td>
                        <td className="p-2.5 text-right text-emerald-700">+0.0%</td>
                      </tr>

                      {/* 8 & 9. Tình trạng pháp lý */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Tình trạng pháp lý</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-800 font-semibold bg-emerald-50/10">Sổ hồng lâu dài</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Sổ hồng chính chủ</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Đã có sổ đỏ</td>
                        <td className="p-2.5 text-right">HĐMB & chờ sổ</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-700">+0.0%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-700">+0.0%</td>
                        <td className="p-2.5 text-right text-amber-700">+1.0%</td>
                      </tr>

                      {/* 10 & 11. Nội thất */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Nội thất</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-800 font-semibold bg-emerald-50/10">Full cơ bản</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Cơ bản</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Cơ bản</td>
                        <td className="p-2.5 text-right">Đầy đủ cao cấp</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-700">+0.5%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-700">+0.5%</td>
                        <td className="p-2.5 text-right text-slate-500">0.0%</td>
                      </tr>

                      {/* 12 & 13. Vị trí tầng */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Vị trí tầng</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-800 font-semibold bg-emerald-50/10">Tầng trung</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Tầng 8 / 25</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Tầng 15 / 32</td>
                        <td className="p-2.5 text-right">Tầng 11 / 25</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-500">0.0%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-700">+0.5%</td>
                        <td className="p-2.5 text-right text-slate-500">0.0%</td>
                      </tr>

                      {/* 14 & 15. Số phòng ngủ/ WC */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Số phòng ngủ/ WC</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-800 font-semibold bg-emerald-50/10">3 PN / 2 WC</td>
                        <td className="p-2.5 text-right border-r border-slate-100">3 PN / 2 WC</td>
                        <td className="p-2.5 text-right border-r border-slate-100">2 PN / 2 WC</td>
                        <td className="p-2.5 text-right">3 PN / 2 WC</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-500">0.0%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-amber-700">+1.0%</td>
                        <td className="p-2.5 text-right text-slate-500">0.0%</td>
                      </tr>

                      {/* 16 & 17. Hướng vào căn hộ */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Hướng vào căn hộ</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-800 font-semibold bg-emerald-50/10">Đông Nam</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Đông Nam</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Nam</td>
                        <td className="p-2.5 text-right">Đông Bắc</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-500">0.0%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-500">0.0%</td>
                        <td className="p-2.5 text-right text-emerald-700">+0.5%</td>
                      </tr>

                      {/* 18 & 19. Vị trí căn */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Vị trí căn</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-800 font-semibold bg-emerald-50/10">Căn góc</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Căn thường</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Căn thường</td>
                        <td className="p-2.5 text-right">Căn góc</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-amber-700">+1.0%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-amber-700">+1.0%</td>
                        <td className="p-2.5 text-right text-slate-500">0.0%</td>
                      </tr>

                      {/* 20 & 21. Hướng ban công */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Hướng ban công</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-800 font-semibold bg-emerald-50/10">Đông Nam</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Đông Nam</td>
                        <td className="p-2.5 text-right border-r border-slate-100">Nam</td>
                        <td className="p-2.5 text-right">Đông Bắc</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-500">0.0%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-500">0.0%</td>
                        <td className="p-2.5 text-right text-slate-500">0.0%</td>
                      </tr>

                      {/* 22 & 23. Diện tích */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-sans text-slate-800 border-r border-slate-100 pl-4">↳ Diện tích</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-emerald-800 font-semibold bg-emerald-50/10">{dossier.area || 102} m²</td>
                        <td className="p-2.5 text-right border-r border-slate-100">102.0 m²</td>
                        <td className="p-2.5 text-right border-r border-slate-100">98.5 m²</td>
                        <td className="p-2.5 text-right">106.0 m²</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition text-slate-600">
                        <td className="p-2.5 font-sans text-slate-600 border-r border-slate-100 pl-8">Tỷ lệ điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-400 bg-emerald-50/10">---</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-slate-500">0.0%</td>
                        <td className="p-2.5 text-right border-r border-slate-100 text-amber-700">-0.5%</td>
                        <td className="p-2.5 text-right text-emerald-700">+0.2%</td>
                      </tr>

                      {/* 24. Tổng giá trị điều chỉnh thuần */}
                      <tr className="bg-slate-50 font-bold text-slate-900 transition">
                        <td className="p-2.5 font-sans border-r border-slate-200">Tổng giá trị điều chỉnh thuần</td>
                        <td className="p-2.5 text-right border-r border-slate-200 text-slate-400 bg-emerald-50/20">---</td>
                        <td className="p-2.5 text-right border-r border-slate-250 text-indigo-700">+1.5%</td>
                        <td className="p-2.5 text-right border-r border-slate-250 text-indigo-700">+2.5%</td>
                        <td className="p-2.5 text-right text-indigo-700">+1.7%</td>
                      </tr>

                      {/* 25. Mức giá sau điều chỉnh */}
                      <tr className="bg-emerald-50/50 font-black text-slate-900 transition">
                        <td className="p-2.5 font-sans border-r border-slate-200">Mức giá sau điều chỉnh</td>
                        <td className="p-2.5 text-right border-r border-slate-200 text-slate-400 bg-emerald-100/50">---</td>
                        <td className="p-2.5 text-right border-r border-slate-200 text-emerald-900 font-mono">28.480.514 đ</td>
                        <td className="p-2.5 text-right border-r border-slate-200 text-emerald-900 font-mono">28.464.822 đ</td>
                        <td className="p-2.5 text-right text-emerald-900 font-mono">28.536.490 đ</td>
                      </tr>

                      {/* 26. Giá bình quân */}
                      <tr className="bg-blue-50/60 font-bold text-slate-900 transition">
                        <td className="p-3 font-sans border-r border-slate-200 text-blue-950 uppercase" colSpan={1}>
                          Giá bình quân (Trung bình 3 TSSS)
                        </td>
                        <td className="p-3 text-right font-mono text-blue-800 text-sm border-r border-slate-200 bg-blue-100/40" colSpan={4}>
                          {formatVND(28493942)} /m² (Trung bình mức giá sau điều chỉnh của 3 tài sản so sánh)
                        </td>
                      </tr>

                      {/* 27. Giá lựa chọn */}
                      <tr className="bg-slate-900 text-white font-black text-xs">
                        <td className="p-3 border-r border-slate-800 uppercase" colSpan={1}>Giá lựa chọn (Phê duyệt)</td>
                        <td className="p-3 text-right font-mono text-emerald-400 text-sm" colSpan={4}>
                          {formatVND(dossier.approvedValue || dossier.marketPrice || 2850000000)} ({formatVND(dossier.appraisedUnitPrice || 28500000)} /m²)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* SHEET 4: bang tinh clcl (Chất lượng còn lại công trình)   */}
          {/* ========================================================= */}
          {(isShowAll || activeTab === 'sheet_4') && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-teal-950 text-xs sm:text-sm uppercase tracking-wide">
                      Sheet 4: bang tinh clcl (Bảng tính tỷ lệ chất lượng còn lại công trình)
                    </h3>
                    <p className="text-[11px] text-teal-800">
                      Bảng tính tỷ lệ CLCL %, đánh giá 7 kết cấu bộ phận chi tiết & giá trị công trình xây dựng
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-teal-100 text-teal-900 font-black px-2.5 py-1 rounded-lg border border-teal-300">
                    CLCL Áp dụng: {clclData.finalClclRate ?? 85}%
                  </span>
                </div>
              </div>

              {/* Thông số khấu hao chung */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Cấp công trình:</span>
                  <strong className="text-slate-900 block truncate" title={clclData.buildingClassification}>
                    {clclData.buildingClassification || 'Công trình Cấp II'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Niên hạn chuẩn:</span>
                  <span className="font-bold text-slate-800">{clclData.designLifespanYears || 50} năm</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Năm XD / Sử dụng:</span>
                  <span className="font-semibold text-slate-800">{clclData.constructionYear || 2020} ({clclData.usedYears || 4} năm đã SD)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Hao mòn cơ sở:</span>
                  <span className="font-mono text-amber-700">{clclData.baseDepreciationRate || 8.0}%</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Suất vốn đầu tư mới:</span>
                  <span className="font-mono font-bold text-slate-900">{formatVND(clclData.newConstructionUnitPrice || 6500000)}/m²</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Diện tích sàn sử dụng:</span>
                  <span className="font-bold text-indigo-700">{clclData.usableFloorArea || dossier.areaCertificate || 104.5} m²</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Giá trị xây mới 100%:</span>
                  <span className="font-mono font-bold text-slate-900">{formatVND(clclData.newReplacementValue || 679250000)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Giá trị còn lại sau CLCL:</span>
                  <strong className="font-mono font-black text-teal-800 text-sm">{formatVND(clclData.remainingStructureValue || 577362500)}</strong>
                </div>
              </div>

              {/* Bảng 7 kết cấu bộ phận chi tiết */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span>Bảng phân tích đánh giá 7 kết cấu bộ phận chi tiết (Tỷ trọng & Điểm số CLCL)</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-200 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 text-center w-12 border-r border-slate-800">STT</th>
                        <th className="p-2.5 border-r border-slate-800">Tên Kết Cấu Bộ Phận</th>
                        <th className="p-2.5 text-center w-24 border-r border-slate-800">Tỷ Trọng (%)</th>
                        <th className="p-2.5 text-center w-28 border-r border-slate-800">CLCL Thực Tế (%)</th>
                        <th className="p-2.5 text-center w-28 border-r border-slate-800">Điểm Đánh Giá</th>
                        <th className="p-2.5">Hiện Trạng Thực Tế</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(clclData.components || []).map((cmp, idx) => (
                        <tr key={cmp.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-2.5 text-center font-bold text-slate-400 bg-slate-50/50 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 border-r border-slate-100">
                            {cmp.componentName}
                          </td>
                          <td className="p-2.5 text-center font-mono font-semibold text-slate-700 border-r border-slate-100">
                            {cmp.weightRate}%
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-teal-700 border-r border-slate-100">
                            {cmp.actualQualityRate}%
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-indigo-700 border-r border-slate-100">
                            {cmp.weightedQuality}
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px]">
                            {cmp.conditionDescription || 'Kết cấu ổn định, hoạt động tốt'}
                          </td>
                        </tr>
                      ))}

                      <tr className="bg-teal-50/80 font-bold text-teal-950">
                        <td colSpan={2} className="p-2.5 text-right uppercase border-r border-teal-200">
                          Tổng cộng tỷ trọng & Tỷ lệ CLCL tổng hợp:
                        </td>
                        <td className="p-2.5 text-center border-r border-teal-200 font-mono text-sm">
                          100%
                        </td>
                        <td className="p-2.5 text-center border-r border-teal-200 font-mono">
                          --
                        </td>
                        <td className="p-2.5 text-center font-mono text-teal-900 text-sm font-black border-r border-teal-200">
                          {clclData.finalClclRate ?? 85}%
                        </td>
                        <td className="p-2.5 text-teal-800 text-[11px] font-semibold">
                          Áp dụng tỷ lệ chất lượng còn lại tổng hợp {clclData.finalClclRate ?? 85}% vào định giá
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: ASSET IMAGES & LEGAL DOCUMENTS                       */}
          {/* ========================================================= */}
          {(!isShowAll && activeTab === 'images') && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Upload / Insert Banner */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Thư Viện Ảnh Khảo Sát Hiện Trạng ({imagesList.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Đính kèm hình ảnh mặt tiền, nội thất, ngõ vào và ảnh chụp giấy tờ
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsOcrModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Quét OCR AI Sổ Đỏ</span>
                  </button>
                </div>
              </div>

              {/* Add Image URL */}
              <form onSubmit={handleAddImageUrl} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Dán link ảnh online (https://...)..."
                  value={newImageUrlInput}
                  onChange={e => setNewImageUrlInput(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm ảnh</span>
                </button>
              </form>

              {/* Gallery Grid */}
              {imagesList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagesList.map((imgUrl, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900 group">
                      <img src={imgUrl} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Camera className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-700">Chưa có hình ảnh tài sản nào</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Dán link URL ảnh ở trên hoặc bấm Quét OCR để tải ảnh tài sản
                  </p>
                </div>
              )}

              {/* Legal Documents Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Danh Mục Hồ Sơ Pháp Lý ({dossier.documents.length})</span>
                </h4>

                <div className="space-y-2">
                  {dossier.documents.map(doc => {
                    const isDone = doc.status === 'DA_NOP';
                    const isPending = doc.status === 'CAN_BO_SUNG';

                    return (
                      <div 
                        key={doc.id}
                        onClick={() => handleToggleDocumentStatus(doc.id)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-white transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isDone ? 'bg-emerald-500 border-emerald-600 text-white' :
                            isPending ? 'bg-amber-100 border-amber-300 text-amber-800' :
                            'bg-slate-100 border-slate-300 text-slate-400'
                          }`}>
                            {isDone ? <Check className="w-3.5 h-3.5" /> : null}
                          </div>
                          <span className={`text-xs sm:text-sm font-medium ${isDone ? 'text-slate-800 font-semibold' : 'text-slate-600'}`}>
                            {doc.name}
                          </span>
                        </div>

                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isDone ? 'bg-emerald-100 text-emerald-800' :
                          isPending ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {isDone ? 'Đã nộp' : isPending ? 'Cần bổ sung' : 'Chưa nộp'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleAddDocument} className="pt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Thêm tên loại giấy tờ pháp lý khác..."
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm mục</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: PROGRESS HISTORY                                     */}
          {/* ========================================================= */}
          {(!isShowAll && activeTab === 'history') && (
            <div className="space-y-4 animate-fadeIn">
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                {dossier.statusHistory.map((item, idx) => {
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${cfg?.color || 'bg-slate-400'}`} />
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${cfg?.badge}`}>
                            {cfg?.label || item.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{item.updatedAt}</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium mt-1">{item.note}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Cập nhật bởi: {item.updatedBy}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: IMPORTED DYNAMIC FIELDS (ALL 54 COLUMNS)             */}
          {/* ========================================================= */}
          {(!isShowAll && activeTab === 'imported_fields') && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Controls */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Dữ Liệu Toàn Bộ Các Cột Từ File Import
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Hiển thị {filteredImportedFields.length} / {allImportedFields.length} trường thông tin được bóc tách từ file bảng tính
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const exportObj: Record<string, any> = {};
                      allImportedFields.forEach(f => {
                        exportObj[f.headerName] = f.value;
                      });
                      navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
                      alert(`Đã sao chép toàn bộ ${allImportedFields.length} trường thông tin vào bộ nhớ tạm (dạng JSON)!`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1 transition shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy JSON Toàn Bộ</span>
                  </button>
                </div>
              </div>

              {/* Search & Group Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên cột, nhóm hoặc giá trị..."
                    value={fieldSearchQuery}
                    onChange={e => setFieldSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-xs"
                  />
                  {fieldSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFieldSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {fieldGroups.length > 0 && (
                  <div className="sm:w-60">
                    <select
                      value={selectedFieldGroup}
                      onChange={e => setSelectedFieldGroup(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="ALL">Tất cả các nhóm ({allImportedFields.length})</option>
                      {fieldGroups.map((grp, i) => (
                        <option key={i} value={grp}>{grp}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Dynamic Fields Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-200 sticky top-0 z-10 text-[11px]">
                      <tr>
                        <th className="p-2.5 w-14 text-center font-bold">Cột</th>
                        <th className="p-2.5 w-44 font-bold">Nhóm phân loại (Dòng 1)</th>
                        <th className="p-2.5 w-64 font-bold">Tên trường thông tin (Dòng 1-3)</th>
                        <th className="p-2.5 font-bold">Giá trị thực tế</th>
                        <th className="p-2.5 w-24 text-right font-bold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredImportedFields.map((f) => {
                        const isCopied = copiedFieldName === f.headerName;
                        const isEditingThis = editingFieldCol === f.colIndex;
                        const hasVal = f.value !== undefined && f.value !== null && String(f.value).trim() !== '';

                        return (
                          <tr key={f.colIndex} className="hover:bg-amber-50/40 transition">
                            <td className="p-2.5 text-center font-mono font-bold text-slate-400 bg-slate-50/50">
                              #{f.colIndex + 1}
                            </td>

                            <td className="p-2.5 text-slate-500 font-medium truncate max-w-[180px]">
                              {f.categoryGroup ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                  {f.categoryGroup}
                                </span>
                              ) : (
                                <span className="text-slate-300">--</span>
                              )}
                            </td>

                            <td className="p-2.5 font-bold text-slate-900" title={f.headerName}>
                              {f.headerName}
                            </td>

                            <td className="p-2.5">
                              {isEditingThis ? (
                                <div className="flex items-center space-x-1.5">
                                  <input
                                    type="text"
                                    value={editingFieldValue}
                                    onChange={e => setEditingFieldValue(e.target.value)}
                                    autoFocus
                                    className="px-2 py-1 bg-white border border-emerald-500 rounded text-xs w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveFieldEdit(f.colIndex)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingFieldCol(null)}
                                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px]"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <span className={hasVal ? "text-slate-900 font-medium" : "text-slate-300 italic"}>
                                  {hasVal ? String(f.value) : "(Chưa có dữ liệu)"}
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 text-right whitespace-nowrap">
                              {!isEditingThis && (
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyField(f.headerName, f.value)}
                                    className={`p-1 rounded transition ${
                                      isCopied 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                                    }`}
                                    title="Sao chép giá trị"
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingFieldCol(f.colIndex);
                                      setEditingFieldValue(String(f.value ?? ''));
                                    }}
                                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition"
                                    title="Chỉnh sửa giá trị này"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Notes Section if present */}
          {dossier.notes && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <h4 className="font-bold text-amber-900 mb-1">Ghi chú nghiệp vụ:</h4>
              <p className="text-amber-800 leading-relaxed">{dossier.notes}</p>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Cập nhật trạng thái nhanh:</span>
            <select
              value={dossier.status}
              onChange={(e) => onUpdateStatus(dossier.id, e.target.value as DossierStatus)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            {hasPermission('export_report') && onOpenCertificate && (
              <button
                type="button"
                onClick={() => onOpenCertificate(dossier)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition flex items-center space-x-1"
                title="Mở Chứng thư định giá chính thức"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Chứng Thư</span>
              </button>
            )}

            {hasPermission('export_report') && onOpenFeeNotice && (
              <button
                type="button"
                onClick={() => onOpenFeeNotice(dossier)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition flex items-center space-x-1"
                title="Mở Thông báo nộp phí thẩm định"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Thông Báo Phí</span>
              </button>
            )}

            {hasPermission('delete_dossier') && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ ${dossier.code} không?`)) {
                    onDelete(dossier.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold transition flex items-center space-x-1"
                title="Xóa hồ sơ khỏi hệ thống"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>

      {/* Embedded Standalone OCR Modal */}
      {isOcrModalOpen && (
        <DocumentOcrScannerModal
          isOpen={isOcrModalOpen}
          onClose={() => setIsOcrModalOpen(false)}
          onApplyData={handleApplyOcrData}
        />
      )}
    </div>
  );
};
