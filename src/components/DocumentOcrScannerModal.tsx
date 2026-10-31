import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Scan, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  User, 
  Building2, 
  Car, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  Eye,
  Info,
  Copy,
  Edit3,
  Sliders,
  CheckSquare,
  FileCheck,
  QrCode,
  AlertTriangle
} from 'lucide-react';
import { ValuationDossier, AssetCategory } from '../types/dossier';
import { 
  scanCccdQrCode, 
  inspectCccdNumber, 
  cleanCccdDigits, 
  CCCD_PROVINCES 
} from '../utils/cccd';

export type OcrDocType = 'AUTO' | 'CCCD' | 'SO_DO' | 'DANG_KY_XE';

export interface ExtractedOcrData {
  // Khách hàng
  clientName?: string;
  clientCccd?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  placeOfOrigin?: string;
  expiryDate?: string;
  issueDate?: string;
  issuePlace?: string;
  isQrVerified?: boolean;

  // Tài sản
  assetName?: string;
  assetCategory?: AssetCategory;
  assetAddress?: string;
  legalDocNumber?: string;

  // BĐS
  landPlotNumber?: string;
  mapSheetNumber?: string;
  area?: number;
  landUseForm?: string;
  landUsePurpose?: string;
  landUseTerm?: string;
  houseNumber?: string;
  ward?: string;
  district?: string;
  province?: string;
  constructionType?: string;
  constructionArea?: number;
  constructionUsableArea?: number;
  floorsCount?: string;
  structure?: string;
  buildingYear?: string;
  issueAuthority?: string;

  // Xe
  licensePlate?: string;
  brand?: string;
  modelCode?: string;
  chassisNumber?: string;
  engineNumber?: string;
  manufactureYear?: string;
  origin?: string;
  color?: string;
  seatingCapacity?: string;
  engineDisplacement?: string;
  firstRegistrationDate?: string;
  estimatedValue?: number;
  serviceFee?: number;

  // Raw recognized text
  rawText?: string;
}

interface DocumentOcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ExtractedOcrData, docImage?: string) => void;
  initialDocType?: OcrDocType;
}

export const DocumentOcrScannerModal: React.FC<DocumentOcrScannerModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialDocType = 'AUTO'
}) => {
  const [selectedDocType, setSelectedDocType] = useState<OcrDocType>(initialDocType);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [backPreviewImage, setBackPreviewImage] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [resultTab, setResultTab] = useState<'SUMMARY' | 'EDIT' | 'RAW'>('SUMMARY');
  const [copiedRaw, setCopiedRaw] = useState(false);
  
  // Quick inline edit for CCCD number right in summary tab
  const [isQuickEditingCccd, setIsQuickEditingCccd] = useState(false);
  const [quickCccdInput, setQuickCccdInput] = useState('');

  const [scanResult, setScanResult] = useState<{
    docType: string;
    docTypeLabel: string;
    confidence: number;
    rawText?: string;
    extractedData: ExtractedOcrData;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // Sync quick CCCD input when scanResult updates
  useEffect(() => {
    if (scanResult?.extractedData?.clientCccd) {
      setQuickCccdInput(scanResult.extractedData.clientCccd);
    }
  }, [scanResult]);

  // 4 Demo Sample Documents for Instant One-Click Testing
  const SAMPLE_DOCS = [
    {
      id: 'sample-cccd',
      title: 'Căn cước công dân gắn chip',
      type: 'CCCD' as OcrDocType,
      desc: 'Nguyễn Văn An - 001085012345 (Hà Nội)',
      badge: 'Khách hàng',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=700',
      mockData: {
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
        clientEmail: 'nguyenvanan.hanoi@gmail.com',
        isQrVerified: true
      }
    },
    {
      id: 'sample-sodo-hcm',
      title: 'Sổ hồng Nhà đất Quận 7, TP.HCM',
      type: 'SO_DO' as OcrDocType,
      desc: 'Thửa 128, TBĐ 15, Q.7 (142.5m2 ODT)',
      badge: 'Bất động sản',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=700',
      mockData: {
        clientName: 'LÊ HOÀNG NAM & TRẦN THỊ MAI',
        clientAddress: 'Số 128 Đường Huỳnh Tấn Phát, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
        legalDocNumber: 'Số phát hành: CY 892401 - Số vào sổ: CS 04821/2022',
        assetName: 'Quyền sử dụng đất và nhà ở tại Thửa đất số 128, Tờ bản đồ số 15',
        assetCategory: 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT' as AssetCategory,
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
        structure: 'Móng BTCT, khung cột BTCT, sàn BTCT, tường gạch',
        buildingYear: '2020',
        estimatedValue: 12800000000,
        serviceFee: 22000000
      }
    },
    {
      id: 'sample-car',
      title: 'Đăng ký xe ô tô Camry 2.5Q',
      type: 'DANG_KY_XE' as OcrDocType,
      desc: 'TOYOTA CAMRY 2.5Q - BKS: 51K-889.98',
      badge: 'Phương tiện vận tải',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=700',
      mockData: {
        clientName: 'TRẦN MINH QUÂN',
        clientAddress: '248/12 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
        legalDocNumber: 'Số ĐK: 0892415 - Seri: A 0124859',
        assetName: 'Xe ô tô con TOYOTA CAMRY 2.5Q - BKS: 51K-889.98',
        assetCategory: 'PHUONG_TIEN_VAN_TAI' as AssetCategory,
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
        estimatedValue: 1250000000,
        serviceFee: 5000000
      }
    },
    {
      id: 'sample-sodo-hn',
      title: 'Sổ đỏ Đất thổ cư Cầu Giấy, Hà Nội',
      type: 'SO_DO' as OcrDocType,
      desc: 'Thửa 56, TBĐ 24, Dịch Vọng Hậu (108.0m2)',
      badge: 'Bất động sản',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=700',
      mockData: {
        clientName: 'PHẠM VĂN ĐỨC',
        clientAddress: 'Số 56 Ngõ 165 Đường Cầu Giấy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội',
        legalDocNumber: 'Số phát hành: BD 910245 - Số vào sổ: CH 01928/2021',
        assetName: 'Quyền sử dụng đất ở và nhà ở tại Thửa đất số 56, Tờ bản đồ số 24',
        assetCategory: 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT' as AssetCategory,
        assetAddress: 'Số 56 Ngõ 165 Đường Cầu Giấy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội',
        landPlotNumber: '56',
        mapSheetNumber: '24',
        houseNumber: '56',
        ward: 'Phường Dịch Vọng Hậu',
        district: 'Quận Cầu Giấy',
        province: 'TP. Hà Nội',
        area: 108.0,
        landUseForm: 'Sử dụng riêng: 108.0 m2',
        landUsePurpose: 'Đất ở tại đô thị (ODT)',
        landUseTerm: 'Lâu dài',
        constructionType: 'Nhà ở kiên cố 4 tầng',
        constructionArea: 82.0,
        constructionUsableArea: 328.0,
        floorsCount: '04 tầng',
        structure: 'Khung bê tông cốt thép, tường xây gạch 220, mái bằng BTCT',
        buildingYear: '2019',
        estimatedValue: 16200000000,
        serviceFee: 26000000
      }
    }
  ];

  if (!isOpen) return null;

  // Rotate image by 90 degrees using HTML Canvas
  const rotateImage = (imgSrc: string, degrees = 90): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imgSrc);
          return;
        }

        const rads = (degrees * Math.PI) / 180;
        const isSwap = degrees % 180 !== 0;
        canvas.width = isSwap ? img.height : img.width;
        canvas.height = isSwap ? img.width : img.height;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rads);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => resolve(imgSrc);
      img.src = imgSrc;
    });
  };

  const handleRotateImage = async () => {
    if (!previewImage) return;
    const newAngle = (rotationAngle + 90) % 360;
    setRotationAngle(newAngle);
    const rotated = await rotateImage(previewImage, 90);
    setPreviewImage(rotated);
    // Re-scan with upright image
    processOcr(rotated, selectedDocType, false);
  };

  // Process scanning with Client-side QR scan + Server Gemini AI Vision cascade
  const processOcr = async (imageData: string, docHint: OcrDocType, isSample = false, mockPreset?: any) => {
    setIsScanning(true);
    setErrorMsg(null);
    setIsQuickEditingCccd(false);

    try {
      if (isSample && mockPreset) {
        // Fast simulated OCR flow for demo samples
        setScanProgress('Đang tải tài liệu mẫu thử nghiệm...');
        await new Promise(r => setTimeout(r, 300));
        setScanProgress('AI Vision đang bóc tách trường thông tin pháp lý...');
        await new Promise(r => setTimeout(r, 300));
        setScanProgress('Đang chuẩn hóa dữ liệu tài sản & khách hàng...');
        await new Promise(r => setTimeout(r, 200));

        setScanResult({
          docType: mockPreset.type || docHint,
          docTypeLabel: mockPreset.title,
          confidence: 98,
          rawText: `[BẢN QUÉT DEMO MẪU TÀI LIỆU CHUẨN]\n${JSON.stringify(mockPreset.mockData, null, 2)}`,
          extractedData: { ...mockPreset.mockData }
        });
        setIsScanning(false);
        return;
      }

      // Step 1: Scan for native Vietnamese CCCD QR code directly on Canvas
      setScanProgress('🔍 Đang kiểm tra mã QR bảo mật của Bộ Công An trên thẻ...');
      let qrData: ExtractedOcrData | null = null;
      try {
        qrData = await scanCccdQrCode(imageData);
        if (qrData && qrData.clientCccd) {
          console.log('[QR Success] Decoded CCCD from Ministry of Public Security QR code:', qrData.clientCccd);
          setScanProgress(`✅ Đã giải mã thành công mã QR: ${qrData.clientCccd}`);
        }
      } catch (qrErr) {
        console.warn('QR scan skipped or failed:', qrErr);
      }

      // Step 2: Live server OCR call to Gemini AI Vision with QR data passed
      setScanProgress('Đang phân tích hình ảnh và trích xuất các trường thông tin...');
      const response = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          docTypeHint: docHint,
          fileName: 'uploaded_document.jpg',
          isSample: false,
          qrDecodedData: qrData || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Máy chủ phản hồi lỗi khi xử lý OCR');
      }

      setScanProgress('Đang đồng bộ và chuẩn hóa 12 chữ số CCCD...');

      // Merge QR data with AI OCR result for 100% precision
      let finalExtracted: ExtractedOcrData = result.extractedData || {};
      if (qrData) {
        finalExtracted = {
          ...finalExtracted,
          clientCccd: qrData.clientCccd || finalExtracted.clientCccd,
          clientName: qrData.clientName || finalExtracted.clientName,
          birthDate: qrData.birthDate || finalExtracted.birthDate,
          gender: qrData.gender || finalExtracted.gender,
          clientAddress: qrData.clientAddress || finalExtracted.clientAddress,
          issueDate: qrData.issueDate || finalExtracted.issueDate,
          isQrVerified: true
        };
      }

      // Clean CCCD digits
      if (finalExtracted.clientCccd) {
        finalExtracted.clientCccd = cleanCccdDigits(finalExtracted.clientCccd);
      }

      // If user is uploading a back side of CCCD, intelligently merge with existing front side!
      if (activeSide === 'BACK' && scanResult && scanResult.docType === 'CCCD') {
        const mergedData: ExtractedOcrData = {
          ...scanResult.extractedData,
          issueDate: finalExtracted.issueDate || scanResult.extractedData.issueDate,
          issuePlace: finalExtracted.issuePlace || scanResult.extractedData.issuePlace,
          expiryDate: finalExtracted.expiryDate || scanResult.extractedData.expiryDate,
        };
        setScanResult({
          ...scanResult,
          extractedData: mergedData,
          rawText: `${scanResult.rawText || ''}\n\n--- MẶT SAU ---\n${result.rawText || ''}`
        });
      } else {
        setScanResult({
          docType: result.docType || (qrData ? 'CCCD' : 'CCCD'),
          docTypeLabel: result.docTypeLabel || (qrData ? 'Căn cước công dân gắn chip (Mã QR)' : 'Tài liệu pháp lý'),
          confidence: qrData ? 99 : (result.confidence || 95),
          rawText: result.rawText || (qrData?.rawText || ''),
          extractedData: finalExtracted
        });
      }

    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMsg(err.message || 'Không thể nhận diện hình ảnh lúc này. Vui lòng thử chụp lại rõ nét hơn, tránh chói lóa sáng hoặc xoay thẳng ảnh.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'FRONT' | 'BACK' = 'FRONT') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (side === 'BACK') {
          setBackPreviewImage(reader.result);
          setActiveSide('BACK');
          processOcr(reader.result, selectedDocType, false);
        } else {
          setPreviewImage(reader.result);
          setActiveSide('FRONT');
          processOcr(reader.result, selectedDocType, false);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectSample = (sample: typeof SAMPLE_DOCS[0]) => {
    setSelectedDocType(sample.type);
    setPreviewImage(sample.imageUrl);
    setBackPreviewImage(null);
    setActiveSide('FRONT');
    processOcr(sample.imageUrl, sample.type, true, sample);
  };

  // Field change handler in Edit Mode
  const handleFieldChange = (key: keyof ExtractedOcrData, value: any) => {
    if (!scanResult) return;
    setScanResult({
      ...scanResult,
      extractedData: {
        ...scanResult.extractedData,
        [key]: value
      }
    });
  };

  // Save quick CCCD edit
  const handleSaveQuickCccd = () => {
    const cleaned = cleanCccdDigits(quickCccdInput);
    handleFieldChange('clientCccd', cleaned);
    setIsQuickEditingCccd(false);
  };

  const handleApplyToDossier = () => {
    if (!scanResult) return;
    onApply(scanResult.extractedData, previewImage || undefined);
    onClose();
  };

  const handleCopyRaw = () => {
    if (!scanResult?.rawText) return;
    navigator.clipboard.writeText(scanResult.rawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Run CCCD number inspection
  const cccdInspection = scanResult?.extractedData?.clientCccd 
    ? inspectCccdNumber(
        scanResult.extractedData.clientCccd,
        scanResult.extractedData.birthDate,
        scanResult.extractedData.gender
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Scan className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AI OCR - Quét & Trích xuất Giấy tờ Tự động
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chuẩn hóa 12 số CCCD</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tự động bóc tách CCCD/Căn cước 2024, đối chiếu mã QR Bộ Công An & kiểm tra cấu trúc 12 số
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Type Selector Banner */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 hidden sm:inline">Loại tài liệu:</span>
            <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs overflow-x-auto">
              <button
                onClick={() => setSelectedDocType('AUTO')}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  selectedDocType === 'AUTO'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ⚡ Tự động nhận diện
              </button>

              <button
                onClick={() => setSelectedDocType('CCCD')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  selectedDocType === 'CCCD'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Căn cước công dân (CCCD)</span>
              </button>

              <button
                onClick={() => setSelectedDocType('SO_DO')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  selectedDocType === 'SO_DO'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Sổ đỏ / Sổ hồng</span>
              </button>

              <button
                onClick={() => setSelectedDocType('DANG_KY_XE')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  selectedDocType === 'DANG_KY_XE'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Đăng ký xe (Cà vẹt)</span>
              </button>
            </div>
          </div>

          <div className="text-slate-500 hidden sm:flex items-center space-x-1 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Thuật toán giải mã QR & Kiểm tra 12 số chuẩn Bộ Công An</span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50">
          
          {/* Quick Demo Sample Picker Bar */}
          <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Hoặc chọn mẫu tài liệu thử nghiệm nhanh (1 chạm):</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">Trải nghiệm ngay không cần tải tệp</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {SAMPLE_DOCS.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-2 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-left transition flex items-center space-x-2.5 group"
                >
                  <img
                    src={sample.imageUrl}
                    alt={sample.title}
                    className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${sample.badgeColor}`}>
                        {sample.badge}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5 group-hover:text-amber-700">
                      {sample.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{sample.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-bold text-rose-900 mb-0.5">Lưu ý khi quét ảnh:</strong>
                <span>{errorMsg}</span>
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={handleRotateImage}
                    className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 rounded text-rose-800 font-semibold text-[11px] flex items-center space-x-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Xoay ảnh 90° & quét lại</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-[11px] flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh khác rõ nét hơn</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Work Area: Left Preview & Upload - Right Extracted Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Image Upload & Preview with Laser Scanning Animation & Controls */}
            <div className="lg:col-span-5 flex flex-col space-y-3">
              
              {/* Multi-Side Selector (Mặt trước / Mặt sau) */}
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Trang tài liệu:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveSide('FRONT')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      activeSide === 'FRONT'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Mặt trước / Trang 1
                  </button>
                  <button
                    onClick={() => {
                      setActiveSide('BACK');
                      if (!backPreviewImage) {
                        backFileInputRef.current?.click();
                      } else {
                        processOcr(backPreviewImage, selectedDocType, false);
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      activeSide === 'BACK'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Mặt sau / Trang 2 {backPreviewImage && '✓'}
                  </button>
                </div>
              </div>

              {/* Image Preview Box */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
                
                {(activeSide === 'FRONT' ? previewImage : backPreviewImage) ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img
                      src={(activeSide === 'FRONT' ? previewImage : backPreviewImage) || ''}
                      alt="Giấy tờ thẩm định"
                      className="max-h-[300px] w-auto max-w-full object-contain rounded-lg shadow-sm transition-transform"
                    />

                    {/* Scanning Laser Beam Line */}
                    {isScanning && (
                      <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden">
                        <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#f59e0b] animate-scan-beam" />
                        <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] animate-pulse" />
                      </div>
                    )}

                    {/* Scanning Progress Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center rounded-lg">
                        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                        <p className="text-xs font-bold text-amber-300">{scanProgress}</p>
                        <p className="text-[11px] text-slate-300 mt-1">Đang kiểm tra & chuẩn hóa từng chữ số theo chuẩn Bộ Công An...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (activeSide === 'BACK') backFileInputRef.current?.click();
                      else fileInputRef.current?.click();
                    }}
                    className="w-full h-full min-h-[260px] border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition hover:bg-amber-50/30"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                      {activeSide === 'BACK' ? 'Tải lên ảnh Mặt sau (CCCD / Trang 2)' : 'Kéo thả ảnh hoặc Bấm để tải tài liệu lên'}
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mb-3">
                      Hỗ trợ CCCD gắn chip (có QR code), Căn cước mới 2024, Sổ đỏ, Sổ hồng, Đăng ký xe (JPG, PNG)
                    </p>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition"
                    >
                      Chọn file ảnh từ máy
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e, 'FRONT')}
                  accept="image/*"
                  className="hidden"
                />

                <input
                  type="file"
                  ref={backFileInputRef}
                  onChange={(e) => handleFileUpload(e, 'BACK')}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Image Control Buttons (Rotate, Change Image, Rescan) */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeSide === 'BACK') backFileInputRef.current?.click();
                    else fileInputRef.current?.click();
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chọn tệp khác</span>
                </button>

                {previewImage && (
                  <button
                    type="button"
                    onClick={handleRotateImage}
                    title="Xoay ảnh 90 độ nếu ảnh bị nghiêng hoặc chụp ngang"
                    className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                    <span>Xoay 90°</span>
                  </button>
                )}

                {(activeSide === 'FRONT' ? previewImage : backPreviewImage) && (
                  <button
                    type="button"
                    onClick={() => {
                      const cur = activeSide === 'FRONT' ? previewImage : backPreviewImage;
                      if (cur) processOcr(cur, selectedDocType, false);
                    }}
                    disabled={isScanning}
                    className="py-1.5 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>Quét lại</span>
                  </button>
                )}
              </div>

              {/* Tips for better OCR */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 flex items-start space-x-2">
                <QrCode className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Tự động đọc mã QR CCCD:</strong>
                  <p className="text-blue-800 mt-0.5 leading-relaxed">
                    Hệ thống sẽ tự động quét ô <strong>mã QR ở góc trên bên phải</strong> mặt trước thẻ CCCD để lấy chính xác 100% số CCCD gốc từ Bộ Công An.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Extracted Structured Data Cards & Direct Editor */}
            <div className="lg:col-span-7 space-y-3">
              
              {scanResult ? (
                <div className="space-y-3 animate-fadeIn">
                  
                  {/* Result Header Bar with Tab Switches */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {scanResult.docTypeLabel}
                          </span>
                          {scanResult.extractedData?.isQrVerified && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              <span>QR 100% Chuẩn</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                          <span>Độ tin cậy: <strong className="text-emerald-700">{scanResult.confidence}%</strong></span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">Sẵn sàng áp dụng</span>
                        </div>
                      </div>
                    </div>

                    {/* View/Edit Mode Tabs */}
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                      <button
                        onClick={() => setResultTab('SUMMARY')}
                        className={`px-2.5 py-1 rounded font-semibold transition ${
                          resultTab === 'SUMMARY'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📋 Thẻ tóm tắt
                      </button>
                      <button
                        onClick={() => setResultTab('EDIT')}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded font-semibold transition ${
                          resultTab === 'EDIT'
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chỉnh sửa (Live)</span>
                      </button>
                      {scanResult.rawText && (
                        <button
                          onClick={() => setResultTab('RAW')}
                          className={`px-2.5 py-1 rounded font-semibold transition ${
                            resultTab === 'RAW'
                              ? 'bg-white text-purple-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          📄 Văn bản thô
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TAB 1: SUMMARY CARD VIEW */}
                  {resultTab === 'SUMMARY' && (
                    <div className="space-y-3">
                      
                      {/* Highlighted CCCD Number Card with Group Breakdown and Quick-Edit */}
                      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-xl p-4 shadow-md border border-blue-800">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-blue-800/60">
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                              Số Căn Cước Công Dân (12 Chữ Số)
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setQuickCccdInput(scanResult.extractedData.clientCccd || '');
                              setIsQuickEditingCccd(!isQuickEditingCccd);
                            }}
                            className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 flex items-center space-x-1 underline"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isQuickEditingCccd ? 'Đóng chỉnh sửa' : 'Chỉnh sửa nhanh số'}</span>
                          </button>
                        </div>

                        {/* Quick Inline Edit Form or Big Monospace Display */}
                        {isQuickEditingCccd ? (
                          <div className="bg-blue-950/90 p-3 rounded-lg border border-blue-700/60 my-2 space-y-2">
                            <label className="block text-[11px] text-blue-200 font-medium">
                              Nhập/chỉnh sửa 12 chữ số CCCD chính xác:
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                maxLength={12}
                                value={quickCccdInput}
                                onChange={(e) => setQuickCccdInput(e.target.value.replace(/\D/g, ''))}
                                placeholder="001085012345"
                                className="flex-1 bg-white text-slate-900 font-mono font-bold text-lg px-3 py-1.5 rounded-lg border border-amber-400 focus:ring-2 focus:ring-amber-400"
                              />
                              <button
                                onClick={handleSaveQuickCccd}
                                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition"
                              >
                                Lưu số
                              </button>
                              <button
                                onClick={() => setIsQuickEditingCccd(false)}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                              >
                                Hủy
                              </button>
                            </div>
                            <span className="text-[10px] text-blue-300">
                              Hiện tại: {quickCccdInput.length}/12 chữ số
                            </span>
                          </div>
                        ) : (
                          <div className="my-2">
                            <div className="flex items-baseline space-x-3">
                              <span className="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider text-amber-300">
                                {cccdInspection?.formatted || scanResult.extractedData.clientCccd || 'Chưa đọc được'}
                              </span>
                              {cccdInspection?.isValid ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✓ Đủ 12 chữ số
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  ⚠️ {scanResult.extractedData.clientCccd ? `${scanResult.extractedData.clientCccd.length}/12 số` : 'Chưa có số'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Breakdown Tags (Province, Gender, Birth Year) */}
                        {cccdInspection?.isValid && (
                          <div className="pt-2 border-t border-blue-800/40 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-blue-800/60 text-blue-100 border border-blue-700/50">
                              🏛️ {cccdInspection.provinceName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-800/60 text-blue-100 border border-blue-700/50">
                              👤 {cccdInspection.genderDescription}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-800/60 text-blue-100 border border-blue-700/50">
                              📅 Năm sinh đuôi: <strong>{cccdInspection.yearDigits}</strong>
                            </span>
                          </div>
                        )}

                        {/* Auto-suggest if birth year has mismatch */}
                        {cccdInspection?.hasDobMismatch && cccdInspection.suggestedYearDigits && (
                          <div className="mt-2.5 bg-amber-500/20 border border-amber-400/40 rounded-lg p-2 flex items-center justify-between text-xs text-amber-200">
                            <div className="flex items-center space-x-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                Năm sinh ({scanResult.extractedData.birthDate}) ứng với số đuôi <strong>{cccdInspection.suggestedYearDigits}</strong> thay vì <strong>{cccdInspection.yearDigits}</strong>.
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (cccdInspection && cccdInspection.suggestedYearDigits) {
                                  const fixed = scanResult.extractedData.clientCccd!.slice(0, 4) + cccdInspection.suggestedYearDigits + scanResult.extractedData.clientCccd!.slice(6);
                                  handleFieldChange('clientCccd', fixed);
                                }
                              }}
                              className="px-2 py-1 bg-amber-400 text-slate-950 font-bold rounded text-[11px] shrink-0 ml-2"
                            >
                              Tự động sửa
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Customer Information Card (CCCD / Chủ sở hữu) */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              1. Thông tin Khách hàng / Nhân thân
                            </h4>
                          </div>
                          <button
                            onClick={() => setResultTab('EDIT')}
                            className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa thông tin</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Họ và tên khách hàng:</span>
                            <strong className="text-slate-900 font-bold text-sm">
                              {scanResult.extractedData.clientName || 'Chưa nhận diện'}
                            </strong>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Số CCCD / CMND:</span>
                            <strong className="text-blue-900 font-mono font-bold text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                              {scanResult.extractedData.clientCccd || 'Chưa nhận diện'}
                            </strong>
                          </div>

                          {scanResult.extractedData.birthDate && (
                            <div>
                              <span className="text-slate-400 block text-[11px]">Ngày sinh / Giới tính:</span>
                              <span className="text-slate-800 font-medium">
                                {scanResult.extractedData.birthDate} {scanResult.extractedData.gender ? `(${scanResult.extractedData.gender})` : ''}
                              </span>
                            </div>
                          )}

                          {scanResult.extractedData.nationality && (
                            <div>
                              <span className="text-slate-400 block text-[11px]">Quốc tịch:</span>
                              <span className="text-slate-800 font-medium">
                                {scanResult.extractedData.nationality}
                              </span>
                            </div>
                          )}

                          {scanResult.extractedData.placeOfOrigin && (
                            <div className="sm:col-span-2">
                              <span className="text-slate-400 block text-[11px]">Quê quán / Nơi khai sinh:</span>
                              <span className="text-slate-700 font-medium">
                                {scanResult.extractedData.placeOfOrigin}
                              </span>
                            </div>
                          )}

                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block text-[11px]">Nơi thường trú / Nơi cư trú:</span>
                            <span className="text-slate-900 font-medium bg-slate-50 p-1.5 rounded border border-slate-200 block">
                              {scanResult.extractedData.clientAddress || 'Theo giấy tờ pháp lý'}
                            </span>
                          </div>

                          {scanResult.extractedData.issueDate && (
                            <div>
                              <span className="text-slate-400 block text-[11px]">Ngày cấp:</span>
                              <span className="text-slate-800 font-medium">
                                {scanResult.extractedData.issueDate}
                              </span>
                            </div>
                          )}

                          {scanResult.extractedData.issuePlace && (
                            <div>
                              <span className="text-slate-400 block text-[11px]">Nơi cấp:</span>
                              <span className="text-slate-800 font-medium">
                                {scanResult.extractedData.issuePlace}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Asset Information Card (Sổ đỏ / Đăng ký xe) */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            {scanResult.extractedData.assetCategory === 'PHUONG_TIEN_VAN_TAI' ? (
                              <Car className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Building2 className="w-4 h-4 text-amber-600" />
                            )}
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              2. Thông số Tài sản Thẩm định giá
                            </h4>
                          </div>
                          <button
                            onClick={() => setResultTab('EDIT')}
                            className="text-[11px] font-semibold text-amber-600 hover:underline flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa tài sản</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block text-[11px]">Tên tài sản định giá:</span>
                            <strong className="text-slate-900 font-bold">
                              {scanResult.extractedData.assetName || 'Tài sản thẩm định giá'}
                            </strong>
                          </div>

                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block text-[11px]">Địa chỉ / Vị trí tài sản:</span>
                            <span className="text-slate-800 font-medium">
                              {scanResult.extractedData.assetAddress || 'Chưa nhận diện'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Số Giấy tờ pháp lý:</span>
                            <span className="text-slate-800 font-semibold font-mono bg-slate-100 px-2 py-0.5 rounded">
                              {scanResult.extractedData.legalDocNumber || 'Đang cập nhật'}
                            </span>
                          </div>

                          {/* If BĐS */}
                          {scanResult.extractedData.landPlotNumber && (
                            <div>
                              <span className="text-slate-400 block text-[11px]">Thửa đất & Tờ bản đồ:</span>
                              <span className="text-slate-800 font-semibold">
                                Thửa số {scanResult.extractedData.landPlotNumber} - TBĐ số {scanResult.extractedData.mapSheetNumber || '---'}
                              </span>
                            </div>
                          )}

                          {scanResult.extractedData.area && (
                            <div>
                              <span className="text-slate-400 block text-[11px]">Diện tích đất (Sổ đỏ):</span>
                              <span className="text-emerald-700 font-bold text-sm">
                                {scanResult.extractedData.area} m²
                              </span>
                            </div>
                          )}

                          {scanResult.extractedData.landUsePurpose && (
                            <div>
                              <span className="text-slate-400 block text-[11px]">Mục đích sử dụng:</span>
                              <span className="text-slate-700 font-medium">
                                {scanResult.extractedData.landUsePurpose} ({scanResult.extractedData.landUseTerm || 'Lâu dài'})
                              </span>
                            </div>
                          )}

                          {/* Construction Details */}
                          {scanResult.extractedData.constructionType && (
                            <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[11px] font-semibold mb-1">Công trình xây dựng gắn liền với đất:</span>
                              <p className="text-slate-800 text-xs">
                                {scanResult.extractedData.constructionType}
                                {scanResult.extractedData.floorsCount ? ` • ${scanResult.extractedData.floorsCount}` : ''}
                                {scanResult.extractedData.constructionUsableArea ? ` • DT Sàn: ${scanResult.extractedData.constructionUsableArea} m²` : ''}
                              </p>
                              {scanResult.extractedData.structure && (
                                <p className="text-slate-500 text-[11px] mt-0.5">
                                  Kết cấu: {scanResult.extractedData.structure}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Car Details */}
                          {scanResult.extractedData.licensePlate && (
                            <>
                              <div>
                                <span className="text-slate-400 block text-[11px]">Biển số xe:</span>
                                <span className="text-purple-700 font-bold text-sm font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
                                  {scanResult.extractedData.licensePlate}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">Nhãn hiệu / Dòng xe:</span>
                                <span className="text-slate-800 font-bold">
                                  {scanResult.extractedData.brand} {scanResult.extractedData.modelCode}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">Số khung (VIN):</span>
                                <span className="text-slate-700 font-mono text-[11px]">
                                  {scanResult.extractedData.chassisNumber || '---'}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">Số máy:</span>
                                <span className="text-slate-700 font-mono text-[11px]">
                                  {scanResult.extractedData.engineNumber || '---'}
                                </span>
                              </div>
                            </>
                          )}

                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DIRECT INLINE EDITING MODE */}
                  {resultTab === 'EDIT' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <Edit3 className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Chỉnh sửa trực tiếp thông tin OCR trước khi áp dụng
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">Tất cả thay đổi được lưu tức thì</span>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                          A. Thông tin cá nhân khách hàng (CCCD):
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Họ và tên khách hàng:</label>
                            <input
                              type="text"
                              value={scanResult.extractedData.clientName || ''}
                              onChange={(e) => handleFieldChange('clientName', e.target.value.toUpperCase())}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                              placeholder="NGUYỄN VĂN AN"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Số CCCD / Định danh (12 số):</label>
                            <input
                              type="text"
                              maxLength={12}
                              value={scanResult.extractedData.clientCccd || ''}
                              onChange={(e) => handleFieldChange('clientCccd', cleanCccdDigits(e.target.value))}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-900 focus:ring-2 focus:ring-amber-500"
                              placeholder="001085012345"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Số ký tự: {(scanResult.extractedData.clientCccd || '').length}/12 chữ số
                            </span>
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Ngày sinh (DD/MM/YYYY):</label>
                            <input
                              type="text"
                              value={scanResult.extractedData.birthDate || ''}
                              onChange={(e) => handleFieldChange('birthDate', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-500"
                              placeholder="15/08/1985"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Giới tính:</label>
                            <select
                              value={scanResult.extractedData.gender || 'Nam'}
                              onChange={(e) => handleFieldChange('gender', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="Nam">Nam</option>
                              <option value="Nữ">Nữ</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-slate-600 font-semibold mb-1">Nơi thường trú / Cư trú:</label>
                            <input
                              type="text"
                              value={scanResult.extractedData.clientAddress || ''}
                              onChange={(e) => handleFieldChange('clientAddress', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                              placeholder="Số 45 Ngõ 12 Đường Hoàng Quốc Việt..."
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Ngày cấp CCCD:</label>
                            <input
                              type="text"
                              value={scanResult.extractedData.issueDate || ''}
                              onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-500"
                              placeholder="20/04/2021"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Nơi cấp / Cơ quan cấp:</label>
                            <input
                              type="text"
                              value={scanResult.extractedData.issuePlace || ''}
                              onChange={(e) => handleFieldChange('issuePlace', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-500"
                              placeholder="Cục Cảnh sát QLHC về TTXH"
                            />
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block pt-3 border-t border-slate-100">
                          B. Thông tin tài sản thẩm định giá (Sổ đỏ / Đăng ký xe):
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="sm:col-span-2">
                            <label className="block text-slate-600 font-semibold mb-1">Tên tài sản định giá:</label>
                            <input
                              type="text"
                              value={scanResult.extractedData.assetName || ''}
                              onChange={(e) => handleFieldChange('assetName', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-slate-600 font-semibold mb-1">Địa chỉ tài sản:</label>
                            <input
                              type="text"
                              value={scanResult.extractedData.assetAddress || ''}
                              onChange={(e) => handleFieldChange('assetAddress', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Số giấy tờ pháp lý / Seri GCN:</label>
                            <input
                              type="text"
                              value={scanResult.extractedData.legalDocNumber || ''}
                              onChange={(e) => handleFieldChange('legalDocNumber', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                              placeholder="CY 892401"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Diện tích đất (m²):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={scanResult.extractedData.area || ''}
                              onChange={(e) => handleFieldChange('area', parseFloat(e.target.value) || undefined)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500"
                              placeholder="142.5"
                            />
                          </div>

                          {scanResult.extractedData.assetCategory === 'PHUONG_TIEN_VAN_TAI' && (
                            <>
                              <div>
                                <label className="block text-slate-600 font-semibold mb-1">Biển số đăng ký xe:</label>
                                <input
                                  type="text"
                                  value={scanResult.extractedData.licensePlate || ''}
                                  onChange={(e) => handleFieldChange('licensePlate', e.target.value.toUpperCase())}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-purple-800 focus:ring-2 focus:ring-amber-500"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-600 font-semibold mb-1">Nhãn hiệu xe:</label>
                                <input
                                  type="text"
                                  value={scanResult.extractedData.brand || ''}
                                  onChange={(e) => handleFieldChange('brand', e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: RAW OCR TEXT VIEW */}
                  {resultTab === 'RAW' && scanResult.rawText && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Văn bản thô AI nhận dạng trực tiếp từ ảnh
                          </h4>
                        </div>

                        <button
                          onClick={handleCopyRaw}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedRaw ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
                        </button>
                      </div>

                      <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto">
                        {scanResult.rawText}
                      </div>
                    </div>
                  )}

                  {/* Action Apply Button Bar */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 hidden sm:inline">
                      Dữ liệu sẽ được tự động điền vào các trường trong hồ sơ thẩm định giá
                    </span>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                      >
                        Đóng
                      </button>

                      <button
                        type="button"
                        onClick={handleApplyToDossier}
                        className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition transform active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Áp dụng vào Hồ Sơ</span>
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400 min-h-[340px]">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
                    <Scan className="w-7 h-7 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    Chưa có kết quả quét OCR
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
                    Hãy tải ảnh giấy tờ (CCCD, Sổ đỏ, Sổ hồng, Đăng ký xe) từ cột bên trái hoặc nhấp chọn một mẫu tài liệu thử nghiệm ở thanh phía trên để trải nghiệm bóc tách tự động.
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Hỗ trợ nhận dạng mã QR bảo mật CCCD & chuẩn hóa 12 số tự động</span>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 text-slate-300 px-5 sm:px-6 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Số CCCD và thông tin khách hàng được kiểm tra chéo theo cấu trúc 12 số của Bộ Công An</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition underline text-xs"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};
