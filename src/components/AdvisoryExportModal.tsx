import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Building2, 
  Bell, 
  CreditCard,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Check,
  Send,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Lock,
  Edit3,
  ArrowRight,
  CornerDownLeft,
  FileCheck,
  Info
} from 'lucide-react';
import { ValuationDossier, DossierStatus } from '../types/dossier';
import { 
  numberToVietnameseWords, 
  cleanVietnameseText, 
  formatCurrencyNumber,
  formatBranchName,
  extractPlotAndMap,
  isDossierLocked,
  getStatusConfig
} from '../utils/formatters';
import { downloadReportDocx, ExportReportOptions, getComparablesData } from '../utils/docxExport';

export type ReportTemplateType = 1 | 2 | 3;
export type ExportDocumentType = ReportTemplateType;

interface AdvisoryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: ValuationDossier | null;
  defaultTemplate?: ReportTemplateType;
  onUpdateStatus?: (id: string, newStatus: DossierStatus, reason?: string) => void;
  onUpdateDossier?: (updated: ValuationDossier) => void;
  onEditDossier?: (dossier: ValuationDossier) => void;
}

export const AdvisoryExportModal: React.FC<AdvisoryExportModalProps> = ({
  isOpen,
  onClose,
  dossier,
  defaultTemplate = 1,
  onUpdateStatus,
  onUpdateDossier,
  onEditDossier
}) => {
  // 1: A1 Bao Cao OK.doc (Báo cáo kết quả tư vấn giá tài sản)
  // 2: A1 Ket Qua OK.doc (Thông báo kết quả tư vấn giá tài sản)
  // 3: A1 TB Phi OK.doc (Thông báo phí tư vấn giá tài sản)
  const [templateType, setTemplateType] = useState<ReportTemplateType>(defaultTemplate);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Workflow Approval States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "warning" | "info" | "error" } | null>(null);
  
  // Submit Confirmation & Success Modal States
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [submissionNoteInput, setSubmissionNoteInput] = useState("");
  const [showSubmitSuccessModal, setShowSubmitSuccessModal] = useState(false);
  const [submittedTime, setSubmittedTime] = useState("");
  const [showRejectSuccessModal, setShowRejectSuccessModal] = useState(false);
  const [rejectedReasonSaved, setRejectedReasonSaved] = useState("");
  const [rejectedTime, setRejectedTime] = useState("");
  const [showApproveSuccessModal, setShowApproveSuccessModal] = useState(false);
  const [approvedTime, setApprovedTime] = useState("");

  // Synchronized status helper
  const currentStatus = dossier?.status || "MOI_GIAO";
  const isLocked = isDossierLocked(currentStatus);
  const isRejected = currentStatus === "TU_CHOI_BAO_CAO";
  const isWaitingApproval = currentStatus === "DA_LEN_BAO_CAO_CHO_DUYET";
  const statusCfg = getStatusConfig(currentStatus);

  // Auto clear feedback toast after 5s
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Handlers for approval workflow
  const handleOpenSubmitConfirm = () => {
    if (!dossier) return;
    setSubmissionNoteInput(dossier.submissionNote || "Kính trình Lãnh đạo xem xét và phê duyệt báo cáo tư vấn định giá tài sản.");
    setShowSubmitConfirmModal(true);
  };

  const handleConfirmSubmitApproval = () => {
    if (!dossier) return;
    const note = submissionNoteInput.trim();
    const nowStr = new Date().toLocaleString("vi-VN");
    onUpdateStatus?.(dossier.id, "DA_LEN_BAO_CAO_CHO_DUYET", note);
    setShowSubmitConfirmModal(false);
    setSubmittedTime(nowStr);
    setShowSubmitSuccessModal(true);
    setFeedbackMsg({
      text: "🚀 Đã gửi trình duyệt thành công báo cáo tư vấn định giá tài sản lên Lãnh đạo phê duyệt!",
      type: "success"
    });
  };

  const handleRecallSubmission = () => {
    if (!dossier) return;
    if (confirm("Bạn có chắc chắn muốn thu hồi yêu cầu trình duyệt báo cáo này không?")) {
      onUpdateStatus?.(dossier.id, "DA_KHAO_SAT", "Chuyên viên thu hồi yêu cầu trình duyệt báo cáo");
      setFeedbackMsg({
        text: "↩️ Đã thu hồi yêu cầu trình duyệt báo cáo thành công. Hồ sơ đã chuyển về trạng thái [Đã khảo sát].",
        type: "info"
      });
    }
  };

  const handleApproveReport = () => {
    if (!dossier) return;
    const nowStr = new Date().toLocaleString("vi-VN");
    onUpdateStatus?.(dossier.id, "DA_DUYET_BAO_CAO");
    setApprovedTime(nowStr);
    setShowApproveSuccessModal(true);
    setFeedbackMsg({
      text: "🎉 Lãnh đạo đã phê duyệt báo cáo! Hồ sơ đã được chuyển sang trạng thái [Đã duyệt báo cáo] và KHÓA BẢN GHI, không cho phép chỉnh sửa.",
      type: "success"
    });
  };

  const handleRejectReport = () => {
    if (!dossier) return;
    if (!rejectionReasonInput.trim()) {
      alert("Vui lòng nhập lý do từ chối / yêu cầu chỉnh sửa!");
      return;
    }
    const reason = rejectionReasonInput.trim();
    const nowStr = new Date().toLocaleString("vi-VN");
    onUpdateStatus?.(dossier.id, "TU_CHOI_BAO_CAO", reason);
    setRejectedReasonSaved(reason);
    setRejectedTime(nowStr);
    setShowRejectModal(false);
    setRejectionReasonInput("");
    setShowRejectSuccessModal(true);
    setFeedbackMsg({
      text: `⚠️ Lãnh đạo đã từ chối duyệt báo cáo với lý do: "${reason}". Hồ sơ đã được MỞ KHÓA để chuyên viên vào cập nhật lại thông tin.`,
      type: "warning"
    });
  };

  // Dynamic & Customization Parameters
  const [branchName, setBranchName] = useState('Hà Nội');
  const [branchAddress, setBranchAddress] = useState('Số 9 Đào Duy Anh, Đống Đa, Hà Nội');
  const [appraiserName, setAppraiserName] = useState('');
  const [managerName, setManagerName] = useState('Trần Đình Trọng');
  const [directorName, setDirectorName] = useState('Nguyễn Minh Hải');
  
  // Custom Valuation values
  const [customLandValue, setCustomLandValue] = useState<number>(0);
  const [customConstrValue, setCustomConstrValue] = useState<number>(0);
  const [liquidity, setLiquidity] = useState<'Cao' | 'Trung bình' | 'Kém'>('Trung bình');
  
  // Checklist for Template 2
  const [transferability, setTransferability] = useState<'Cao' | 'Trung bình' | 'Kém'>('Trung bình');
  const [planningStatus, setPlanningStatus] = useState<'Có' | 'Không' | 'Không rõ'>('Không');
  const [usagePurpose, setUsagePurpose] = useState<'Để ở' | 'Để kinh doanh' | 'Khác'>('Để ở');
  const [disputeStatus, setDisputeStatus] = useState<'Có' | 'Không' | 'Không rõ'>('Không');
  const [additionalNotes, setAdditionalNotes] = useState('Hồ sơ pháp lý đầy đủ, hiện trạng sử dụng ổn định.');

  // Technical appendix states
  const [eastBorder, setEastBorder] = useState('');
  const [westBorder, setWestBorder] = useState('');
  const [southBorder, setSouthBorder] = useState('');
  const [northBorder, setNorthBorder] = useState('');
  const [trafficStatus, setTrafficStatus] = useState('');
  const [infrastructureStatus, setInfrastructureStatus] = useState('');
  const [businessCapability, setBusinessCapability] = useState('');

  // Fee parameters for Template 3
  const [totalFee, setTotalFee] = useState<number>(5500000);
  const [advanceFee, setAdvanceFee] = useState<number>(0);

  // Recommendation States (Mục IV. KIẾN NGHỊ)
  const [creditProposal, setCreditProposal] = useState('');
  const [maxLtvRate, setMaxLtvRate] = useState<number>(70);
  const [maxLoanAmount, setMaxLoanAmount] = useState<number>(0);
  const [collateralConditions, setCollateralConditions] = useState('');
  const [postDisbursementCheck, setPostDisbursementCheck] = useState('');
  const [otherProposals, setOtherProposals] = useState('');
  const [customRecommendations, setCustomRecommendations] = useState('');
  const [isEditingRecommendations, setIsEditingRecommendations] = useState(false);

  // Synchronize state with the selected dossier whenever it opens or changes
  useEffect(() => {
    if (!dossier) return;

    setTemplateType(defaultTemplate);

    // 1. Branch information
    const branchRaw = dossier.businessUnit || dossier.branch || 'Hà Nội';
    const branch = formatBranchName(branchRaw);
    setBranchName(branch);
    if (branch.toLowerCase().includes('hà thành')) {
      setBranchAddress('Tòa nhà BAC A BANK, 09 Đào Duy Anh, Đống Đa, Hà Nội');
    } else if (branch.toLowerCase().includes('thăng long')) {
      setBranchAddress('Số 26 Phạm Văn Đồng, Mai Dịch, Cầu Giấy, Hà Nội');
    } else if (branch.toLowerCase().includes('cầu giấy')) {
      setBranchAddress('Số 139 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội');
    } else {
      setBranchAddress('Số 9 Đào Duy Anh, Đống Đa, Hà Nội');
    }

    // 2. Specialist: exactly prioritize AMC Specialist, then Assigned Appraiser, then Business Unit Specialist
    const specialist = dossier.amcSpecialist || dossier.assignedAppraiser || dossier.businessUnitSpecialist || dossier.appraiser || 'Lê Văn Nam';
    setAppraiserName(specialist);

    // 3. Price calculation from selected record
    const totalVal = dossier.approvedValue || dossier.marketPrice || dossier.estimatedValue || 0;

    let landVal = 0;
    let constrVal = 0;

    const plannedVal = dossier.plannedLandValue || (dossier.plannedLandArea && dossier.plannedLandUnitPrice ? Math.round(dossier.plannedLandArea * dossier.plannedLandUnitPrice) : 0);
    const unplannedVal = dossier.unplannedLandValue || (dossier.unplannedLandArea && dossier.unplannedLandUnitPrice ? Math.round(dossier.unplannedLandArea * dossier.unplannedLandUnitPrice) : 0);

    if (plannedVal > 0 || unplannedVal > 0) {
      landVal = plannedVal + unplannedVal;
    } else if (dossier.landPlanningValuation?.totalPrice) {
      landVal = dossier.landPlanningValuation.totalPrice;
    } else if (dossier.appraisedUnitPrice && (dossier.areaCertificate || dossier.area)) {
      landVal = Math.round(dossier.appraisedUnitPrice * (dossier.areaCertificate || dossier.area || 0));
    }

    if (dossier.constructionUnitPrice && dossier.constructionActualArea) {
      const quality = (dossier.remainingBuildingQuality || 100) / 100;
      constrVal = Math.round(dossier.constructionUnitPrice * dossier.constructionActualArea * quality);
    }

    if (totalVal > 0) {
      if (landVal > 0 && constrVal === 0) {
        constrVal = Math.max(0, totalVal - landVal);
      } else if (landVal === 0 && constrVal > 0) {
        landVal = Math.max(0, totalVal - constrVal);
      } else if (landVal === 0 && constrVal === 0) {
        if ((dossier.assetCategory === 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT' || dossier.assetCategory === 'CAN_HO_CHUNG_CU') && (dossier.constructionType || dossier.floorsCount)) {
          landVal = Math.round(totalVal * 0.8);
          constrVal = totalVal - landVal;
        } else {
          landVal = totalVal;
          constrVal = 0;
        }
      }
    } else {
      if (landVal === 0 && constrVal === 0) {
        landVal = 2500000000;
        constrVal = 478000000;
      }
    }

    setCustomLandValue(landVal);
    setCustomConstrValue(constrVal);

    // 4. Fee calculation from selected record
    const feeVal = dossier.totalValuationFee && dossier.totalValuationFee > 0
      ? dossier.totalValuationFee
      : (dossier.serviceFee && dossier.serviceFee > 0 ? dossier.serviceFee : 5500000);
    const advVal = dossier.advanceFee !== undefined && dossier.advanceFee !== null ? dossier.advanceFee : 0;
    setTotalFee(feeVal);
    setAdvanceFee(advVal);

    // 5. Checklist
    if (unplannedVal > 0 || (dossier.unplannedLandArea && dossier.unplannedLandArea > 0)) {
      setPlanningStatus('Có');
    } else {
      setPlanningStatus('Không');
    }

    // 6. Recommendations
    const defaultCreditProp = dossier.creditProposal || 
      `Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng cho khách hàng ${cleanVietnameseText(dossier.clientName)} theo quy định của Ngân hàng TMCP Bắc Á.`;
    setCreditProposal(defaultCreditProp);

    const ltv = dossier.maxLtvRate ?? 70;
    setMaxLtvRate(ltv);

    const calcLoanAmt = dossier.maxLoanAmount ?? (totalVal > 0 ? Math.round(totalVal * (ltv / 100)) : 0);
    setMaxLoanAmount(calcLoanAmt);

    const defaultColConditions = dossier.collateralConditions || 
      (dossier.assetCategory === 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT'
        ? 'Đơn vị kinh doanh phối hợp kiểm tra thực địa ranh giới thửa đất, đối chiếu hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.'
        : dossier.assetCategory === 'CAN_HO_CHUNG_CU'
        ? 'Kiểm tra thực tế hiện trạng căn hộ, hợp đồng mua bán/GCN bản gốc và làm thủ tục thế chấp, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.'
        : 'Kiểm tra thực tế hiện trạng, số khung/số máy/hồ sơ kỹ thuật gốc và đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.');
    setCollateralConditions(defaultColConditions);

    const defaultPostCheck = dossier.postDisbursementCheck || 
      'Định kỳ tối thiểu 06 tháng/lần, Đơn vị kinh doanh phối hợp kiểm tra hiện trạng tài sản bảo đảm, bảo đảm nguyên trạng tài sản và kịp thời phát hiện biến động giá hoặc quy hoạch.';
    setPostDisbursementCheck(defaultPostCheck);

    setOtherProposals(dossier.otherProposals || '');
    setCustomRecommendations(dossier.recommendations || '');
  }, [dossier?.id, isOpen, defaultTemplate]);

  if (!isOpen || !dossier) return null;

  const today = new Date();
  const currentMonthYear = `Tháng ${today.getMonth() + 1}/${today.getFullYear()}`;
  const todayStr = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const landArea = dossier.areaCertificate || dossier.area || dossier.plannedLandArea || 100;
  const constrArea = dossier.constructionActualArea || dossier.constructionArea || 80;
  const hasPlannedBreakdown = !!(dossier.plannedLandArea || dossier.plannedLandValue || dossier.unplannedLandArea || dossier.unplannedLandValue);
  const plannedArea = dossier.plannedLandArea || landArea;
  const plannedVal = customLandValue > 0 ? (dossier.plannedLandValue || customLandValue) : (dossier.plannedLandValue || 0);
  const unplannedArea = dossier.unplannedLandArea || 0;
  const unplannedVal = dossier.unplannedLandValue || 0;

  const finalTotalValue = (customLandValue + customConstrValue) > 0 
    ? (customLandValue + customConstrValue) 
    : (dossier.approvedValue || dossier.marketPrice || dossier.estimatedValue || 0);

  const remainingFee = Math.max(0, totalFee - advanceFee);

  const { plot: cleanPlot, sheet: cleanSheet } = extractPlotAndMap(dossier.landPlotNumber, dossier.mapSheetNumber);

  const exportOptions: ExportReportOptions = {
    branchName,
    branchAddress,
    appraiserName,
    directorName,
    managerName,
    customLandValue,
    customConstrValue,
    customFee: totalFee,
    advanceFeePaid: advanceFee,
    liquidity,
    transferability,
    planningStatus,
    usagePurpose,
    disputeStatus,
    additionalNotes,
    valuationMonthStr: currentMonthYear,
    surveyDateStr: dossier.surveyDate || todayStr,
    eastBorder,
    westBorder,
    southBorder,
    northBorder,
    trafficStatus,
    infrastructureStatus,
    businessCapability,
    // IV. KIẾN NGHỊ
    recommendations: customRecommendations,
    creditProposal,
    maxLtvRate,
    maxLoanAmount,
    collateralConditions,
    postDisbursementCheck,
    otherProposals
  };

  const handleSaveRecommendationsToDossier = () => {
    if (!dossier || !onUpdateDossier) return;
    const updated: ValuationDossier = {
      ...dossier,
      creditProposal,
      maxLtvRate,
      maxLoanAmount,
      collateralConditions,
      postDisbursementCheck,
      otherProposals,
      recommendations: customRecommendations
    };
    onUpdateDossier(updated);
    setFeedbackMsg({
      text: '💾 Đã lưu thành công nội dung Kiến nghị & Đề xuất vào hồ sơ!',
      type: 'success'
    });
  };

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      await downloadReportDocx(templateType, dossier, exportOptions);
    } catch (err) {
      console.error('Lỗi xuất file docx:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadOriginalTemplate = (filename: string) => {
    const a = document.createElement('a');
    a.href = `/drive_templates/${filename}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-h-none print:w-full">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex items-center justify-between print:hidden shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Báo Cáo & Chứng Thư Thẩm Định Giá
                </h2>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                  {dossier.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Chuyên viên: <strong className="text-amber-200">{appraiserName}</strong> | Giá: <strong className="text-emerald-300">{formatCurrencyNumber(finalTotalValue)} đ</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition ${
                showConfigPanel 
                  ? 'bg-amber-500 text-slate-950 font-bold' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tùy chỉnh thông số</span>
              {showConfigPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition"
              title="In văn bản trực tiếp"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In / PDF</span>
            </button>

            <button
              onClick={handleDownloadDocx}
              disabled={isExportingDocx}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-md shadow-amber-950/20 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingDocx ? 'Đang tạo .docx...' : 'Tải File Word (.docx)'}</span>
            </button>

            {/* Quick Top Approval Buttons */}
            {!isLocked ? (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleOpenSubmitConfirm}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-md transition active:scale-95 cursor-pointer"
                  title="Gửi trình duyệt báo cáo tư vấn định giá lên Lãnh đạo"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Trình Duyệt Báo Cáo</span>
                  <span className="sm:hidden">Trình Duyệt</span>
                </button>

                {/* NÚT DUYỆT & TỪ CHỐI: CHỈ HIỂN THỊ KHI Ở TRẠNG THÁI "ĐÃ LÊN BÁO CÁO CHỜ DUYỆT" */}
                {isWaitingApproval && (
                  <>
                    <button
                      type="button"
                      onClick={handleApproveReport}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-md transition active:scale-95 cursor-pointer ring-1 ring-emerald-400"
                      title="Lãnh đạo phê duyệt báo cáo"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Duyệt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRejectionReasonInput(dossier?.approvalRejectionReason || "");
                        setShowRejectModal(true);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-md transition active:scale-95 cursor-pointer ring-1 ring-rose-400"
                      title="Lãnh đạo từ chối duyệt báo cáo"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ Chối</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold rounded-lg flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đã Duyệt (Khóa)</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Indicator Ribbon */}
        <div className="bg-slate-100 p-3 sm:px-6 sm:py-3 border-b border-slate-200 print:hidden shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Mẫu Báo Cáo Thẩm Định Giá Chuyên Sách ({
                  dossier?.assetCategory === 'CAN_HO_CHUNG_CU' ? 'Căn hộ chung cư / Tập thể' :
                  dossier?.assetCategory === 'PHUONG_TIEN_VAN_TAI' ? 'Phương tiện vận tải' :
                  dossier?.assetCategory === 'MAY_MOC_THIET_BI' ? 'Máy móc thiết bị' :
                  'Đất và tài sản gắn liền với đất'
                })
              </p>
              <p className="text-[11px] text-slate-500">
                Báo cáo tư vấn kết quả thẩm định giá chuẩn theo mẫu quy định cho từng loại tài sản
              </p>
            </div>
          </div>
        </div>

        {/* PINNED WORKFLOW APPROVAL CARD */}
        <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-4 border border-slate-800 shadow-md m-3 sm:mx-6 sm:my-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 font-mono">
                  Báo Cáo Chuyên Sách Tài Sản
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (Bao_Cao_Tham_Dinh_Gia.docx)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badge}`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                ⚡ <strong>Quy trình phê duyệt:</strong> Kiểm tra nội dung báo cáo và bấm gửi trình duyệt lên Lãnh đạo.
              </p>
              {isRejected && dossier?.approvalRejectionReason && (
                <div className="bg-rose-950/80 border border-rose-800 rounded-lg p-2 text-rose-200 text-xs mt-1">
                  <strong className="text-rose-300">Lý do Lãnh đạo từ chối: </strong>
                  <span>{dossier.approvalRejectionReason}</span>
                </div>
              )}
              {isLocked && (
                <div className="text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Báo cáo đã được Lãnh đạo phê duyệt. Bản ghi đã bị KHÓA, không cho phép chỉnh sửa.</span>
                </div>
              )}
              {isWaitingApproval ? (
                <div className="space-y-0.5">
                  <div className="text-amber-300 text-xs font-bold flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                    <span>Trạng thái: ĐÃ LÊN BÁO CÁO CHỜ DUYỆT</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Hồ sơ đang chờ Lãnh đạo phê duyệt. Lãnh đạo vui lòng chọn nút <strong>[✅ Duyệt Báo Cáo]</strong> hoặc <strong>[❌ Từ Chối]</strong> ở bên cạnh.
                  </p>
                </div>
              ) : !isLocked && !isRejected && (
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-300">
                    Báo cáo đã sẵn sàng. Chuyên viên hãy kiểm tra nội dung và nhấn <strong>[🚀 GỬI TRÌNH DUYỆT]</strong> để chuyển trạng thái sang <strong>"Đã lên báo cáo chờ duyệt"</strong>.
                  </p>
                  <p className="text-[11px] text-amber-400/90 italic">
                    * Khi bản ghi đã được Gửi duyệt thì trạng thái mới thành "Đã lên báo cáo chờ duyệt", lúc đó hệ thống mới hiển thị các nút Duyệt / Từ chối.
                  </p>
                </div>
              )}
            </div>

              {/* Action Buttons: Gửi trình duyệt, Duyệt, Từ chối */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                {isRejected && onEditDossier && (
                  <button
                    type="button"
                    onClick={() => onEditDossier(dossier)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-slate-700 font-bold text-xs transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                    title="Mở form để sửa lại dữ liệu hồ sơ"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa Lại Hồ Sơ</span>
                  </button>
                )}

                {/* Recall button if waiting approval */}
                {isWaitingApproval && (
                  <button
                    type="button"
                    onClick={handleRecallSubmission}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                    title="Thu hồi yêu cầu trình duyệt báo cáo để chỉnh sửa thêm"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>Thu Hồi Trình Duyệt</span>
                  </button>
                )}

                {!isLocked && (
                  <button
                    type="button"
                    onClick={handleOpenSubmitConfirm}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition flex items-center space-x-2 shadow-lg shadow-amber-950/30 active:scale-95 cursor-pointer ring-2 ring-amber-400/50"
                    title="Gửi trình duyệt báo cáo tư vấn định giá lên Lãnh đạo"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isWaitingApproval ? "Gửi Lại Trình Duyệt Báo Cáo" : isRejected ? "Gửi Trình Duyệt Lại Báo Cáo" : "🚀 GỬI TRÌNH DUYỆT BÁO CÁO"}</span>
                  </button>
                )}

                {/* CHỈ KHI Ở TRẠNG THÁI "ĐÃ LÊN BÁO CÁO CHỜ DUYỆT" MỚI HIỂN THỊ NÚT DUYỆT / TỪ CHỐI */}
                {isWaitingApproval && (
                  <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-700 animate-fadeIn">
                    <button
                      type="button"
                      onClick={handleApproveReport}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center space-x-1.5 shadow-md active:scale-95 cursor-pointer ring-2 ring-emerald-400/50"
                      title="Lãnh đạo phê duyệt báo cáo - Khóa bản ghi hồ sơ"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>✅ Duyệt Báo Cáo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRejectionReasonInput(dossier?.approvalRejectionReason || "");
                        setShowRejectModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition flex items-center space-x-1.5 shadow-md active:scale-95 cursor-pointer ring-2 ring-rose-400/50"
                      title="Lãnh đạo từ chối duyệt báo cáo và nhập lý do yêu cầu sửa"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>❌ Từ Chối</span>
                    </button>
                  </div>
                )}

                {isLocked && (
                  <span className="px-3.5 py-2 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-300 font-extrabold text-xs flex items-center space-x-1.5 shadow-sm">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>ĐÃ KHÓA BẢN GHI (ĐÃ DUYỆT)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Raw File Download Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="italic">
                File mẫu chuyên sách tương ứng: <strong className="text-amber-300 font-mono">Bao_Cao_Tham_Dinh_Gia.docx</strong>
              </span>
              <button
                onClick={() => handleDownloadOriginalTemplate('A1_Bao_Cao_OK.doc')}
                className="text-amber-300 hover:text-white font-semibold flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 transition"
                title="Tải trực tiếp file .doc gốc nguyên bản từ Google Drive"
              >
                <Download className="w-3 h-3" />
                <span>Tải file .doc gốc nguyên bản</span>
              </button>
            </div>
          </div>

        {/* Collapsible Parameter Customizer Panel */}
        {showConfigPanel && (
          <div className="bg-amber-50/70 p-3 sm:p-4 border-b border-amber-200 print:hidden text-xs text-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
              <span className="font-bold text-amber-950 flex items-center space-x-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                <span>Tùy chỉnh thông số báo cáo trước khi xuất (Tự động cập nhật vào bản xem & file Word):</span>
              </span>
              <button 
                onClick={() => setShowConfigPanel(false)}
                className="text-amber-800 hover:text-amber-950 font-medium"
              >
                Thu gọn
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Chi nhánh Bắc Á cho vay:</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Chuyên viên thẩm định giá:
                  <span className="ml-1 text-[10px] text-emerald-600 font-normal">(Từ bản ghi)</span>
                </label>
                <input
                  type="text"
                  value={appraiserName}
                  onChange={(e) => setAppraiserName(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-emerald-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Lãnh đạo ký duyệt BAC A AMC:</label>
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
                />
              </div>

              {/* Valuation Values */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Giá trị QSD Đất (VNĐ):</label>
                <input
                  type="number"
                  step="10000000"
                  value={customLandValue}
                  onChange={(e) => setCustomLandValue(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-amber-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Giá trị Công trình XD (VNĐ):</label>
                <input
                  type="number"
                  step="10000000"
                  value={customConstrValue}
                  onChange={(e) => setCustomConstrValue(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tính thanh khoản tài sản:</label>
                <select
                  value={liquidity}
                  onChange={(e) => setLiquidity(e.target.value as any)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="Cao">Cao</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Kém">Kém</option>
                </select>
              </div>

              {/* Specific for Template 2 Checklist */}
              {templateType === 2 && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Khả năng chuyển nhượng:</label>
                    <select
                      value={transferability}
                      onChange={(e) => setTransferability(e.target.value as any)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Cao">Cao</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Kém">Kém</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Khả năng bị quy hoạch:</label>
                    <select
                      value={planningStatus}
                      onChange={(e) => setPlanningStatus(e.target.value as any)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Không">Không</option>
                      <option value="Có">Có</option>
                      <option value="Không rõ">Không rõ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Khả năng sử dụng:</label>
                    <select
                      value={usagePurpose}
                      onChange={(e) => setUsagePurpose(e.target.value as any)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Để ở">Để ở</option>
                      <option value="Để kinh doanh">Để kinh doanh</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Ghi chú khác:</label>
                    <input
                      type="text"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </>
              )}

              {/* Specific for Template 3 Fees */}
              {templateType === 3 && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tổng phí tư vấn có VAT (VNĐ):</label>
                    <input
                      type="number"
                      step="500000"
                      value={totalFee}
                      onChange={(e) => setTotalFee(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Phí hồ sơ đã tạm ứng (VNĐ):</label>
                    <input
                      type="number"
                      step="500000"
                      value={advanceFee}
                      onChange={(e) => setAdvanceFee(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Phí còn lại phải thu (VNĐ):</label>
                    <input
                      type="text"
                      readOnly
                      value={formatCurrencyNumber(remainingFee) + ' VNĐ'}
                      className="w-full px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </>
              )}
            </div>

            {/* ========================================================
                BỔ SUNG CẤU HÌNH KIẾN NGHỊ XUẤT BÁO CÁO (MỤC IV)
                ======================================================== */}
            <div className="mt-4 pt-3 border-t border-slate-300/80 bg-amber-50/60 p-3 rounded-lg border border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-bold text-amber-950 uppercase">
                    IV. Tùy chỉnh Nội dung Kiến nghị & Đề xuất (Xuất vào Báo cáo Word)
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const client = dossier.clientName || 'Khách hàng';
                      let cat = 'tài sản bảo đảm';
                      if (dossier.assetCategory === 'CAN_HO_CHUNG_CU') cat = 'căn hộ chung cư';
                      else if (dossier.assetCategory === 'PHUONG_TIEN_VAN_TAI') cat = 'phương tiện vận tải';
                      else if (dossier.assetCategory === 'MAY_MOC_THIET_BI') cat = 'máy móc thiết bị';
                      else cat = 'QSD đất và công trình trên đất';

                      setCreditProposal(`Đề xuất chấp thuận kết quả định giá ${cat} làm cơ sở cấp tín dụng cho khách hàng ${client} theo đúng quy định của Ngân hàng TMCP Bắc Á.`);
                      setMaxLtvRate(70);
                      setMaxLoanAmount(finalTotalValue > 0 ? Math.round(finalTotalValue * 0.7) : 0);
                      setCollateralConditions(dossier.assetCategory === 'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT' 
                        ? 'Đơn vị kinh doanh phối hợp kiểm tra thực địa ranh giới thửa đất, đối chiếu hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.'
                        : 'Kiểm tra thực tế hiện trạng tài sản, hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.');
                      setPostDisbursementCheck('Định kỳ tối thiểu 06 tháng/lần, Đơn vị kinh doanh phối hợp kiểm tra hiện trạng tài sản bảo đảm, bảo đảm nguyên trạng tài sản và kịp thời phát hiện biến động giá hoặc quy hoạch.');
                      setOtherProposals('Tài sản có tính pháp lý đầy đủ, hiện trạng sử dụng ổn định.');
                    }}
                    className="text-[11px] bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold px-2 py-0.5 rounded transition flex items-center gap-1"
                  >
                    <span>Nạp mẫu chuẩn</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecommendationsToDossier}
                    className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded shadow-2xs transition flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Lưu vào Hồ sơ</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Nội dung Đề xuất cấp tín dụng:
                  </label>
                  <textarea
                    rows={2}
                    value={creditProposal}
                    onChange={(e) => setCreditProposal(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                    placeholder="VD: Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Tỷ lệ LTV (%) & Số tiền cho vay tối đa (VNĐ):
                    </label>
                    <div className="flex space-x-1">
                      {[65, 70, 75, 80].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setMaxLtvRate(p);
                            if (finalTotalValue > 0) setMaxLoanAmount(Math.round(finalTotalValue * (p / 100)));
                          }}
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${maxLtvRate === p ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={maxLtvRate}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        setMaxLtvRate(rate);
                        if (finalTotalValue > 0) setMaxLoanAmount(Math.round(finalTotalValue * (rate / 100)));
                      }}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold font-mono text-emerald-900"
                      placeholder="LTV %"
                    />
                    <input
                      type="number"
                      step="10000000"
                      value={maxLoanAmount}
                      onChange={(e) => setMaxLoanAmount(Number(e.target.value))}
                      className="col-span-2 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold font-mono text-amber-900"
                      placeholder="Số tiền (VNĐ)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Điều kiện quản lý tài sản bảo đảm trước giải ngân:
                  </label>
                  <textarea
                    rows={2}
                    value={collateralConditions}
                    onChange={(e) => setCollateralConditions(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                    placeholder="VD: Kiểm tra thực địa ranh giới thửa đất, đối chiếu hồ sơ pháp lý bản gốc..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Kiểm tra, giám sát sau cấp tín dụng:
                  </label>
                  <textarea
                    rows={2}
                    value={postDisbursementCheck}
                    onChange={(e) => setPostDisbursementCheck(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                    placeholder="VD: Định kỳ tối thiểu 06 tháng/lần kiểm tra hiện trạng TSBĐ..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Tùy chọn: Nhập tự do toàn văn phần Kiến nghị (Nếu nhập ô này, hệ thống sẽ ưu tiên xuất dòng này):
                  </label>
                  <textarea
                    rows={2}
                    value={customRecommendations}
                    onChange={(e) => setCustomRecommendations(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono text-slate-900"
                    placeholder="Nhập từng dòng kiến nghị..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Canvas (Scrollable, A4 proportioned, Print-optimized) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 print:p-0 print:bg-white flex justify-center">
          
          {/* A4 White Paper Container */}
          <div className="bg-white border border-slate-300 shadow-md p-6 sm:p-12 w-full max-w-[850px] min-h-[1050px] relative text-slate-900 print:border-none print:shadow-none print:p-0 font-serif">
            
            {/* Top Corporate Header */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-3 mb-6 font-sans">
              <div className="space-y-0.5 text-xs text-slate-800">
                <p className="font-extrabold uppercase text-amber-950 text-sm">
                  CÔNG TY TNHH QUẢN LÝ NỢ VÀ KHAI THÁC TÀI SẢN
                </p>
                <p className="font-bold text-amber-900 uppercase">
                  NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN BẮC Á (BAC A AMC)
                </p>
                <p className="text-[11px] text-slate-500">
                  Số 67 Nguyễn Thị Định - Q.Cầu Giấy - Hà Nội • ĐT: (04) 35134060
                </p>
              </div>

              <div className="text-right text-xs shrink-0">
                <p className="font-mono font-bold text-slate-900">
                  Số HS: <span className="text-amber-800">{dossier.code}</span>
                </p>
                <p className="text-slate-500 text-[11px]">Ngày: {dossier.surveyDate || todayStr}</p>
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px] mt-1 print:hidden">
                  Mẫu Báo Cáo Chuyên Sách
                </span>
              </div>
            </div>

            {/* BÁO CÁO KẾT QUẢ TƯ VẤN GIÁ TÀI SẢN THEO CHUYÊN SÁCH LOẠI TÀI SẢN */}
            {(() => {
              const compData = getComparablesData(dossier, landArea, constrArea, customLandValue, customConstrValue, finalTotalValue);
              const comps = compData.comps;
              const plotSheet = extractPlotAndMap(dossier.landPlotNumber, dossier.mapSheetNumber);
              const plotNum = plotSheet.plot || dossier.landPlotNumber || '...';
              const sheetNum = plotSheet.sheet || dossier.mapSheetNumber || '...';
              const stateUnitPrice = dossier.stateLandPrice || Math.round((customLandValue / (landArea || 1)) * 0.45);
              const stateK = 1.2;
              const stateLandVal = Math.round(landArea * stateUnitPrice * stateK);
              const stateConstrPrice = 4500000;
              const stateConstrVal = Math.round(constrArea * stateConstrPrice * ((dossier.remainingBuildingQuality || 70) / 100));
              const totalStateVal = stateLandVal + stateConstrVal;
              const appraisedUnitPrice = landArea > 0 ? Math.round(customLandValue / landArea) : 25000000;
              const appraisedConstrPrice = constrArea > 0 ? Math.round(customConstrValue / constrArea) : 5500000;

              if (dossier.assetCategory === 'CAN_HO_CHUNG_CU') {
                return (
                  <div className="space-y-5 text-xs sm:text-[13px] leading-relaxed font-sans">
                    {/* Header Mẫu 02A1 */}
                    <div className="text-center my-4 space-y-1">
                      <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-950">
                        BÁO CÁO THẨM ĐỊNH GIÁ TRỊ TÀI SẢN
                      </h1>
                      <p className="text-xs sm:text-sm italic font-medium text-slate-700">
                        (Áp dụng cho TSBĐ là QSH căn hộ chung cư, căn hộ tập thể)
                      </p>
                      <p className="text-xs italic text-slate-600">
                        Số: {dossier.code || '.......'}/20...../BACABANK- CN{cleanVietnameseText(branchName)}
                      </p>
                    </div>

                    {/* I. THÔNG TIN CHUNG */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">I. THÔNG TIN CHUNG</h3>
                      <div className="space-y-1 pl-3 text-slate-800">
                        <p>• <strong>Chi nhánh/Mã Chi nhánh:</strong> {cleanVietnameseText(branchName)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Mã tài sản:</strong> {dossier.code}</p>
                        <p>• <strong>Chủ sở hữu tài sản:</strong> {cleanVietnameseText(dossier.ownerName || dossier.clientName)}</p>
                        <p>• <strong>Khách hàng vay:</strong> {cleanVietnameseText(dossier.clientName)}</p>
                        <p>• <strong>Thời gian hoàn tất báo cáo thẩm định để ký:</strong> {todayStr}</p>
                        <p>• <strong>Mục đích thẩm định:</strong> [ x ] Làm cơ sở cấp tín dụng &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] TSBĐ bổ sung/thay thế &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Cơ cấu nợ/Xử lý nợ</p>
                      </div>
                    </div>

                    {/* II. MÔ TẢ VỀ BẤT ĐỘNG SẢN */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">II. MÔ TẢ VỀ BẤT ĐỘNG SẢN</h3>
                      <div className="space-y-1 pl-3 text-slate-800">
                        <p>• <strong>1. Vị trí căn hộ:</strong> {cleanVietnameseText(dossier.assetAddress)}</p>
                        <p>• <strong>2. Tên tòa nhà:</strong> {cleanVietnameseText(dossier.buildingName || 'Tòa chung cư cao tầng')}; <strong>Tầng số:</strong> {dossier.apartmentFloor || '---'}; <strong>Số căn hộ:</strong> {dossier.apartmentNumber || '---'}</p>
                        <p>• <strong>3. Diện tích thông thủy:</strong> {constrArea} m²; <strong>Hướng ban công:</strong> {cleanVietnameseText(dossier.direction || 'Đông Nam')}</p>
                        <p>• <strong>4. Chứng từ pháp lý:</strong> GCN/HĐMB số {cleanVietnameseText(dossier.legalDocNumber || 'Cung cấp theo hồ sơ')}</p>
                      </div>
                    </div>

                    {/* III. KẾT QUẢ THẨM ĐỊNH */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">III. KẾT QUẢ THẨM ĐỊNH</h3>
                      <table className="w-full border-collapse border border-slate-400 text-xs my-2 font-sans">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-900">
                            <th className="border border-slate-400 p-2 text-left">Khoản mục</th>
                            <th className="border border-slate-400 p-2 text-right w-44">Theo đơn giá Nhà nước</th>
                            <th className="border border-slate-400 p-2 text-right w-44">Theo đơn giá thẩm định</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-400 p-2 font-bold">Căn hộ chung cư / Căn hộ tập thể</td>
                            <td className="border border-slate-400 p-2 text-right font-mono">{formatCurrencyNumber(Math.round(finalTotalValue * 0.45))}</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold text-slate-900">{formatCurrencyNumber(finalTotalValue)}</td>
                          </tr>
                          <tr className="bg-amber-50/80 font-bold">
                            <td className="border border-slate-400 p-2 text-right uppercase text-amber-950">Tổng giá trị định giá</td>
                            <td className="border border-slate-400 p-2 text-right font-mono">{formatCurrencyNumber(Math.round(finalTotalValue * 0.45))}</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold text-amber-900">{formatCurrencyNumber(finalTotalValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-xs italic text-slate-800 mt-1">
                        Trị giá tài sản làm tròn: <strong>{formatCurrencyNumber(finalTotalValue)} VND</strong> (Bằng chữ: <em>{numberToVietnameseWords(finalTotalValue)}.</em>)
                      </p>
                    </div>

                    {/* IV. KIẾN NGHỊ */}
                    {(() => {
                      return (
                        <div className="border border-amber-200/80 rounded-lg p-3 bg-amber-50/40 relative group">
                          <div className="flex justify-between items-center mb-1.5 border-b border-amber-200/60 pb-1">
                            <h3 className="font-bold text-sm text-slate-950 uppercase flex items-center gap-1.5">
                              IV. KIẾN NGHỊ & ĐỀ XUẤT
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowConfigPanel(true)}
                              className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold bg-white border border-amber-300 px-2 py-0.5 rounded shadow-2xs hover:bg-amber-100 transition print:hidden flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa kiến nghị</span>
                            </button>
                          </div>

                          <div className="space-y-1 pl-1 text-slate-800 text-xs sm:text-[13px]">
                            {customRecommendations && customRecommendations.trim() ? (
                              customRecommendations.split('\n').filter(Boolean).map((line, idx) => (
                                <p key={idx}>{line.startsWith('-') || line.startsWith('•') ? line : `- ${line}`}</p>
                              ))
                            ) : (
                              <>
                                <p>- <strong>Đề xuất cấp tín dụng:</strong> {creditProposal || `Đề xuất chấp thuận kết quả định giá căn hộ làm cơ sở cấp tín dụng cho khách hàng ${cleanVietnameseText(dossier.clientName)} theo quy định của BAC A BANK.`}</p>
                                {(maxLtvRate || maxLoanAmount > 0) ? (
                                  <p>- <strong>Tỷ lệ cho vay tối đa đề xuất:</strong> <span className="font-bold text-amber-900">{maxLtvRate}%</span> giá trị định giá TSBĐ {maxLoanAmount > 0 ? <span>(Số tiền cho vay tối đa tương ứng: <strong className="font-mono text-emerald-900">{formatCurrencyNumber(maxLoanAmount)} VNĐ</strong>)</span> : null}.</p>
                                ) : null}
                                <p>- <strong>Điều kiện quản lý TSBĐ:</strong> {collateralConditions || 'Kiểm tra thực tế hiện trạng căn hộ, hợp đồng mua bán/GCN bản gốc và làm thủ tục thế chấp, đăng ký giao dịch bảo đảm hợp lệ trước khi giải ngân.'}</p>
                                {postDisbursementCheck ? (
                                  <p>- <strong>Giám sát sau giải ngân:</strong> {postDisbursementCheck}</p>
                                ) : null}
                                {otherProposals ? (
                                  <p>- <strong>Kiến nghị khác:</strong> {otherProposals}</p>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-center font-sans">
                      <div>
                        <p className="font-bold uppercase text-slate-950">NGƯỜI THẨM ĐỊNH</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, ghi rõ họ tên)</p>
                        <p className="font-bold text-slate-900 text-sm">{appraiserName}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-slate-950">TRƯỞNG PHÒNG</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, ghi rõ họ tên)</p>
                        <p className="font-bold text-slate-900 text-sm">{managerName || 'Trần Đình Trọng'}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-slate-950">NGƯỜI PHÊ DUYỆT</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, đóng dấu)</p>
                        <p className="font-bold text-slate-900 text-sm">{directorName}</p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-400 pt-2">
                      BM.02A1/TĐTS
                    </div>
                  </div>
                );
              }

              if (dossier.assetCategory === 'PHUONG_TIEN_VAN_TAI') {
                return (
                  <div className="space-y-5 text-xs sm:text-[13px] leading-relaxed font-sans">
                    {/* Header Mẫu 02B */}
                    <div className="text-center my-4 space-y-1">
                      <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-950">
                        BÁO CÁO THẨM ĐỊNH GIÁ TRỊ TÀI SẢN
                      </h1>
                      <p className="text-xs sm:text-sm italic font-medium text-slate-700">
                        (Áp dụng cho Phương tiện vận tải)
                      </p>
                      <p className="text-xs italic text-slate-600">
                        Số: {dossier.code || '.......'}/20...../BACABANK- CN{cleanVietnameseText(branchName)}
                      </p>
                    </div>

                    {/* I. THÔNG TIN CHUNG */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">I. THÔNG TIN CHUNG</h3>
                      <div className="space-y-1 pl-3 text-slate-800">
                        <p>• <strong>Chi nhánh/Mã Chi nhánh:</strong> {cleanVietnameseText(branchName)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Mã tài sản:</strong> {dossier.code}</p>
                        <p>• <strong>Chủ sở hữu tài sản:</strong> {cleanVietnameseText(dossier.ownerName || dossier.clientName)}</p>
                        <p>• <strong>Khách hàng vay:</strong> {cleanVietnameseText(dossier.clientName)}</p>
                        <p>• <strong>Thời gian hoàn tất báo cáo thẩm định để ký:</strong> {todayStr}</p>
                        <p>• <strong>Mục đích thẩm định:</strong> [ x ] Làm cơ sở cấp tín dụng &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] TSBĐ bổ sung/thay thế &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Cơ cấu nợ/Xử lý nợ</p>
                      </div>
                    </div>

                    {/* II. THÔNG TIN VỀ TÀI SẢN THẨM ĐỊNH */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">II. THÔNG TIN VỀ TÀI SẢN THẨM ĐỊNH</h3>
                      <div className="space-y-1 pl-3 text-slate-800">
                        <p>• <strong>Tên phương tiện / Nhãn hiệu:</strong> {cleanVietnameseText(dossier.assetName)}</p>
                        <p>• <strong>Biển kiểm soát:</strong> {dossier.licensePlate || '---'} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Số khung:</strong> {dossier.chassisNumber || '---'} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Số máy:</strong> {dossier.engineNumber || '---'}</p>
                        <p>• <strong>Năm sản xuất:</strong> {dossier.manufactureYear || 2022} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Nước sản xuất:</strong> Việt Nam / Nhập khẩu</p>
                        <p>• <strong>Đánh giá chất lượng còn lại thực tế:</strong> {dossier.remainingBuildingQuality || 85}%</p>
                      </div>
                    </div>

                    {/* III. KẾT QUẢ THẨM ĐỊNH */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">III. KẾT QUẢ THẨM ĐỊNH</h3>
                      <p className="font-semibold text-slate-900 mb-1">1. Định giá phương tiện vận tải theo phương pháp so sánh</p>
                      <table className="w-full border-collapse border border-slate-400 text-xs my-2 font-sans">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-900">
                            <th className="border border-slate-400 p-2 text-center w-12">STT</th>
                            <th className="border border-slate-400 p-2 text-left">Danh mục tài sản</th>
                            <th className="border border-slate-400 p-2 text-right w-36">Đơn giá lựa chọn</th>
                            <th className="border border-slate-400 p-2 text-center w-20">Số lượng</th>
                            <th className="border border-slate-400 p-2 text-right w-44">Giá trị định giá (VND)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-400 p-2 text-center font-bold">1</td>
                            <td className="border border-slate-400 p-2">
                              <p className="font-bold">Phương tiện vận tải: {dossier.assetName}</p>
                              <p className="text-[11px] text-slate-600 font-mono">BKS: {dossier.licensePlate || '---'}</p>
                            </td>
                            <td className="border border-slate-400 p-2 text-right font-mono">{formatCurrencyNumber(finalTotalValue)}</td>
                            <td className="border border-slate-400 p-2 text-center font-mono">01</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold text-slate-900">{formatCurrencyNumber(finalTotalValue)}</td>
                          </tr>
                          <tr className="bg-amber-50/80 font-bold">
                            <td colSpan={2} className="border border-slate-400 p-2 text-right uppercase text-amber-950">Tổng cộng</td>
                            <td className="border border-slate-400 p-2"></td>
                            <td className="border border-slate-400 p-2 text-center font-mono">01</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold text-amber-900">{formatCurrencyNumber(finalTotalValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-xs italic text-slate-800 mt-1">
                        Trị giá tài sản làm tròn: <strong>{formatCurrencyNumber(finalTotalValue)} VND</strong> (Bằng chữ: <em>{numberToVietnameseWords(finalTotalValue)}.</em>)
                      </p>
                    </div>

                    {/* IV. KIẾN NGHỊ */}
                    {(() => {
                      return (
                        <div className="border border-amber-200/80 rounded-lg p-3 bg-amber-50/40 relative group">
                          <div className="flex justify-between items-center mb-1.5 border-b border-amber-200/60 pb-1">
                            <h3 className="font-bold text-sm text-slate-950 uppercase flex items-center gap-1.5">
                              IV. KIẾN NGHỊ & ĐỀ XUẤT
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowConfigPanel(true)}
                              className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold bg-white border border-amber-300 px-2 py-0.5 rounded shadow-2xs hover:bg-amber-100 transition print:hidden flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa kiến nghị</span>
                            </button>
                          </div>

                          <div className="space-y-1 pl-1 text-slate-800 text-xs sm:text-[13px]">
                            {customRecommendations && customRecommendations.trim() ? (
                              customRecommendations.split('\n').filter(Boolean).map((line, idx) => (
                                <p key={idx}>{line.startsWith('-') || line.startsWith('•') ? line : `- ${line}`}</p>
                              ))
                            ) : (
                              <>
                                <p>- <strong>Đề xuất cấp tín dụng:</strong> {creditProposal || `Đề xuất chấp thuận mức định giá phương tiện vận tải làm cơ sở cấp tín dụng cho khách hàng ${cleanVietnameseText(dossier.clientName)} theo quy định của BAC A BANK.`}</p>
                                {(maxLtvRate || maxLoanAmount > 0) ? (
                                  <p>- <strong>Tỷ lệ cho vay tối đa đề xuất:</strong> <span className="font-bold text-amber-900">{maxLtvRate}%</span> giá trị định giá TSBĐ {maxLoanAmount > 0 ? <span>(Số tiền cho vay tối đa tương ứng: <strong className="font-mono text-emerald-900">{formatCurrencyNumber(maxLoanAmount)} VNĐ</strong>)</span> : null}.</p>
                                ) : null}
                                <p>- <strong>Điều kiện quản lý TSBĐ:</strong> {collateralConditions || 'Kiểm tra thực tế hiện trạng, số khung, số máy, hồ sơ đăng ký bản gốc và thực hiện thế chấp, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.'}</p>
                                {postDisbursementCheck ? (
                                  <p>- <strong>Giám sát sau giải ngân:</strong> {postDisbursementCheck}</p>
                                ) : null}
                                {otherProposals ? (
                                  <p>- <strong>Kiến nghị khác:</strong> {otherProposals}</p>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-center font-sans">
                      <div>
                        <p className="font-bold uppercase text-slate-950">NGƯỜI THẨM ĐỊNH</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, ghi rõ họ tên)</p>
                        <p className="font-bold text-slate-900 text-sm">{appraiserName}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-slate-950">TRƯỞNG PHÒNG</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, ghi rõ họ tên)</p>
                        <p className="font-bold text-slate-900 text-sm">{managerName || 'Trần Đình Trọng'}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-slate-950">NGƯỜI PHÊ DUYỆT</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, đóng dấu)</p>
                        <p className="font-bold text-slate-900 text-sm">{directorName}</p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-400 pt-2">
                      BM.02B/TĐTS
                    </div>
                  </div>
                );
              }

              if (dossier.assetCategory === 'MAY_MOC_THIET_BI') {
                return (
                  <div className="space-y-5 text-xs sm:text-[13px] leading-relaxed font-sans">
                    {/* Header Mẫu 02C */}
                    <div className="text-center my-4 space-y-1">
                      <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-950">
                        BÁO CÁO THẨM ĐỊNH GIÁ TRỊ TÀI SẢN
                      </h1>
                      <p className="text-xs sm:text-sm italic font-medium text-slate-700">
                        (Áp dụng cho Máy móc thiết bị)
                      </p>
                      <p className="text-xs italic text-slate-600">
                        Số: {dossier.code || '.......'}/20...../BACABANK- CN{cleanVietnameseText(branchName)}
                      </p>
                    </div>

                    {/* I. THÔNG TIN CHUNG */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">I. THÔNG TIN CHUNG</h3>
                      <div className="space-y-1 pl-3 text-slate-800">
                        <p>• <strong>Chi nhánh/Mã Chi nhánh:</strong> {cleanVietnameseText(branchName)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Mã tài sản:</strong> {dossier.code}</p>
                        <p>• <strong>Chủ sở hữu tài sản:</strong> {cleanVietnameseText(dossier.ownerName || dossier.clientName)}</p>
                        <p>• <strong>Khách hàng vay:</strong> {cleanVietnameseText(dossier.clientName)}</p>
                        <p>• <strong>Thời gian hoàn tất báo cáo thẩm định để ký:</strong> {todayStr}</p>
                        <p>• <strong>Mục đích thẩm định:</strong> [ x ] Làm cơ sở cấp tín dụng &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] TSBĐ bổ sung/thay thế &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Cơ cấu nợ/Xử lý nợ</p>
                      </div>
                    </div>

                    {/* II. THÔNG TIN VỀ TÀI SẢN THẨM ĐỊNH */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">II. THÔNG TIN VỀ TÀI SẢN THẨM ĐỊNH</h3>
                      <div className="space-y-1 pl-3 text-slate-800">
                        <p>• <strong>Tên chủng loại / Model:</strong> {cleanVietnameseText(dossier.assetName)}</p>
                        <p>• <strong>Năm sản xuất:</strong> {dossier.manufactureYear || 2021} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Xuất xứ:</strong> Nhập khẩu / Trong nước</p>
                        <p>• <strong>Đánh giá chất lượng kỹ thuật còn lại thực tế:</strong> {dossier.remainingBuildingQuality || 80}%</p>
                      </div>
                    </div>

                    {/* III. KẾT QUẢ THẨM ĐỊNH */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">III. KẾT QUẢ THẨM ĐỊNH</h3>
                      <p className="font-semibold text-slate-900 mb-1">1. Định giá máy móc thiết bị theo phương pháp so sánh</p>
                      <table className="w-full border-collapse border border-slate-400 text-xs my-2 font-sans">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-900">
                            <th className="border border-slate-400 p-2 text-center w-12">STT</th>
                            <th className="border border-slate-400 p-2 text-left">Danh mục máy móc thiết bị</th>
                            <th className="border border-slate-400 p-2 text-right w-36">Đơn giá lựa chọn</th>
                            <th className="border border-slate-400 p-2 text-center w-20">Số lượng</th>
                            <th className="border border-slate-400 p-2 text-right w-44">Giá trị định giá (VND)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-400 p-2 text-center font-bold">1</td>
                            <td className="border border-slate-400 p-2">
                              <p className="font-bold">Máy móc thiết bị / Dây chuyền: {dossier.assetName}</p>
                            </td>
                            <td className="border border-slate-400 p-2 text-right font-mono">{formatCurrencyNumber(finalTotalValue)}</td>
                            <td className="border border-slate-400 p-2 text-center font-mono">01 hệ thống</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold text-slate-900">{formatCurrencyNumber(finalTotalValue)}</td>
                          </tr>
                          <tr className="bg-amber-50/80 font-bold">
                            <td colSpan={2} className="border border-slate-400 p-2 text-right uppercase text-amber-950">Tổng cộng</td>
                            <td className="border border-slate-400 p-2"></td>
                            <td className="border border-slate-400 p-2 text-center font-mono">01</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold text-amber-900">{formatCurrencyNumber(finalTotalValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-xs italic text-slate-800 mt-1">
                        Trị giá tài sản làm tròn: <strong>{formatCurrencyNumber(finalTotalValue)} VND</strong> (Bằng chữ: <em>{numberToVietnameseWords(finalTotalValue)}.</em>)
                      </p>
                    </div>

                    {/* IV. KIẾN NGHỊ */}
                    {(() => {
                      return (
                        <div className="border border-amber-200/80 rounded-lg p-3 bg-amber-50/40 relative group">
                          <div className="flex justify-between items-center mb-1.5 border-b border-amber-200/60 pb-1">
                            <h3 className="font-bold text-sm text-slate-950 uppercase flex items-center gap-1.5">
                              IV. KIẾN NGHỊ & ĐỀ XUẤT
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowConfigPanel(true)}
                              className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold bg-white border border-amber-300 px-2 py-0.5 rounded shadow-2xs hover:bg-amber-100 transition print:hidden flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa kiến nghị</span>
                            </button>
                          </div>

                          <div className="space-y-1 pl-1 text-slate-800 text-xs sm:text-[13px]">
                            {customRecommendations && customRecommendations.trim() ? (
                              customRecommendations.split('\n').filter(Boolean).map((line, idx) => (
                                <p key={idx}>{line.startsWith('-') || line.startsWith('•') ? line : `- ${line}`}</p>
                              ))
                            ) : (
                              <>
                                <p>- <strong>Đề xuất cấp tín dụng:</strong> {creditProposal || `Đề xuất chấp thuận mức định giá MMTB làm cơ sở cấp tín dụng cho khách hàng ${cleanVietnameseText(dossier.clientName)} theo quy định của BAC A BANK.`}</p>
                                {(maxLtvRate || maxLoanAmount > 0) ? (
                                  <p>- <strong>Tỷ lệ cho vay tối đa đề xuất:</strong> <span className="font-bold text-amber-900">{maxLtvRate}%</span> giá trị định giá TSBĐ {maxLoanAmount > 0 ? <span>(Số tiền cho vay tối đa tương ứng: <strong className="font-mono text-emerald-900">{formatCurrencyNumber(maxLoanAmount)} VNĐ</strong>)</span> : null}.</p>
                                ) : null}
                                <p>- <strong>Điều kiện quản lý TSBĐ:</strong> {collateralConditions || 'Kiểm tra thực tế vận hành máy móc thiết bị, hồ sơ nguồn gốc nhập khẩu bản gốc và đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.'}</p>
                                {postDisbursementCheck ? (
                                  <p>- <strong>Giám sát sau giải ngân:</strong> {postDisbursementCheck}</p>
                                ) : null}
                                {otherProposals ? (
                                  <p>- <strong>Kiến nghị khác:</strong> {otherProposals}</p>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-center font-sans">
                      <div>
                        <p className="font-bold uppercase text-slate-950">NGƯỜI THẨM ĐỊNH</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, ghi rõ họ tên)</p>
                        <p className="font-bold text-slate-900 text-sm">{appraiserName}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-slate-950">TRƯỞNG PHÒNG</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, ghi rõ họ tên)</p>
                        <p className="font-bold text-slate-900 text-sm">{managerName || 'Trần Đình Trọng'}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-slate-950">NGƯỜI PHÊ DUYỆT</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, đóng dấu)</p>
                        <p className="font-bold text-slate-900 text-sm">{directorName}</p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-400 pt-2">
                      BM.02C/TĐTS
                    </div>
                  </div>
                );
              }

              // Default: BM.02A/TĐTS (QSD đất và tài sản gắn liền với đất)
              return (
                <div className="space-y-6 text-xs sm:text-[13px] leading-relaxed font-sans">
                  {/* Header Chuẩn BM.02A/TĐTS */}
                  <div className="text-center my-4 space-y-1">
                    <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-950">
                      BÁO CÁO THẨM ĐỊNH GIÁ TRỊ TÀI SẢN
                    </h1>
                    <p className="text-xs sm:text-sm italic font-medium text-slate-700">
                      (Áp dụng cho TSBĐ là QSD đất và tài sản khác gắn liền trên đất là nhà ở riêng lẻ)
                    </p>
                    <p className="text-xs italic text-slate-600">
                      Số: {dossier.code || '.......'}/20...../BACABANK- CN{cleanVietnameseText(branchName)}
                    </p>
                  </div>

                  {/* I. THÔNG TIN CHUNG */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <h3 className="font-bold text-sm text-slate-950 mb-2 uppercase border-b border-slate-200 pb-1">
                      I. THÔNG TIN CHUNG
                    </h3>
                    <div className="space-y-1 text-slate-800">
                      <p>• <strong>Chi nhánh/Mã Chi nhánh:</strong> {cleanVietnameseText(branchName)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Mã tài sản:</strong> <span className="font-mono font-bold text-amber-900">{dossier.code}</span></p>
                      <p>• <strong>Chủ sở hữu tài sản:</strong> {cleanVietnameseText(dossier.ownerName || dossier.clientName)}</p>
                      <p>• <strong>Khách hàng vay:</strong> {cleanVietnameseText(dossier.clientName)}</p>
                      <p>• <strong>Mối quan hệ giữa chủ tài sản và khách hàng vay:</strong> {cleanVietnameseText(dossier.relationshipWithBorrower || 'Chính chủ')}</p>
                      <p>• <strong>Thời gian phân hồ sơ:</strong> {dossier.assignmentDate || dossier.surveyDate || todayStr}</p>
                      <p>• <strong>Thời gian hoàn tất báo cáo thẩm định để ký:</strong> {todayStr}</p>
                      <p>• <strong>Mục đích thẩm định:</strong></p>
                      <div className="pl-4 flex flex-wrap gap-4 text-xs font-medium text-slate-900">
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-slate-800 bg-amber-600 text-white rounded flex items-center justify-center text-[10px] font-bold">✓</span> Làm cơ sở cấp tín dụng</span>
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-slate-400 rounded"></span> TSBĐ bổ sung/thay thế</span>
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-slate-400 rounded"></span> Cơ cấu nợ/Xử lý nợ</span>
                      </div>
                    </div>
                  </div>

                  {/* II. MÔ TẢ VỀ BẤT ĐỘNG SẢN */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-3">
                    <h3 className="font-bold text-sm text-slate-950 mb-1 uppercase border-b border-slate-200 pb-1">
                      II. MÔ TẢ VỀ BẤT ĐỘNG SẢN
                    </h3>
                    
                    {/* 1. Vị trí */}
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">1. Vị trí bất động sản</h4>
                      <div className="pl-3 space-y-0.5 text-slate-800">
                        <p>- Số: <strong>{dossier.houseNumber || '---'}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Đường/Ấp: <strong>{dossier.street || 'Đường hiện hữu'}</strong></p>
                        <p>- Phường/xã: <strong>{dossier.ward || '---'}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Quận/huyện: <strong>{dossier.district || '---'}</strong></p>
                        <p>- Tỉnh/Thành phố: <strong>{dossier.province || '---'}</strong></p>
                        <p>- Vị trí: <strong>{cleanVietnameseText(dossier.assetAddress)}</strong></p>
                      </div>
                    </div>

                    {/* 2. Chứng từ pháp lý */}
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">2. Chứng từ pháp lý</h4>
                      <p className="pl-3 text-slate-800">
                        Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở và tài sản khác gắn liền với đất số: <strong className="font-mono text-slate-950">{cleanVietnameseText(dossier.legalDocNumber || 'Cung cấp theo hồ sơ vay vốn')}</strong>
                      </p>
                    </div>

                    {/* 3. Đặc điểm về bất động sản */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">3. Đặc điểm về bất động sản</h4>
                      
                      {/* a. Về đất */}
                      <div className="pl-3 bg-white p-2.5 rounded border border-slate-200">
                        <p className="font-bold text-amber-950 mb-1">a. Về đất:</p>
                        <div className="space-y-0.5 text-slate-800">
                          <p>- Thửa đất số: <strong>{plotNum}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Tờ bản đồ số: <strong>{sheetNum}</strong></p>
                          <p>- Mục đích sử dụng đất: <strong>{dossier.landUsePurpose || 'Đất ở tại đô thị (ONT/ODT)'}</strong></p>
                          <p>- Hình thức sử dụng đất: <strong>{dossier.landUseForm || 'Sử dụng riêng'}</strong></p>
                          <p>- Thời hạn sử dụng đất: <strong>{dossier.landUseTerm || 'Lâu dài'}</strong></p>
                          <p>- DTSD thực tế: <strong className="font-mono text-amber-900">{landArea} m²</strong> &nbsp;&nbsp;&nbsp;&nbsp; Chiều dài: <strong>{dossier.dimensionLength || '15'} m</strong> &nbsp;&nbsp;&nbsp;&nbsp; Chiều rộng: <strong>{dossier.frontageWidth || '5'} m</strong></p>
                          <p>- DTSD được công nhận: <strong className="font-mono">{dossier.areaCertificate || landArea} m²</strong> &nbsp;&nbsp;&nbsp;&nbsp; Chiều dài: <strong>{dossier.dimensionLength || '15'} m</strong> &nbsp;&nbsp;&nbsp;&nbsp; Chiều rộng: <strong>{dossier.frontageWidth || '5'} m</strong></p>
                          <p>- Độ rộng mặt đường/ngõ trước thửa đất: <strong>{dossier.roadWidth || '3.5'} m</strong></p>
                          <p>- Hình dáng thửa đất: <strong>{dossier.shape || 'Vuông vắn'}</strong></p>
                          <p>- Số lượng mặt tiền: <strong>{dossier.frontageCount || 1}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Hướng: <strong>{dossier.direction || 'Đông Nam'}</strong></p>
                        </div>
                      </div>

                      {/* b. Về tài sản gắn liền với đất */}
                      <div className="pl-3 bg-white p-2.5 rounded border border-slate-200">
                        <p className="font-bold text-amber-950 mb-1">b. Về tài sản gắn liền với đất:</p>
                        <div className="space-y-0.5 text-slate-800">
                          <p>- Loại tài sản: <strong>{dossier.constructionType || 'Nhà ở kiên cố'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Năm xây dựng: <strong>{dossier.constructionYear || 2018}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Tiện nghi: <strong>{dossier.amenities || 'Đầy đủ'}</strong></p>
                          <p>- Cấu trúc: <strong>{dossier.structureSummary || 'Khung bê tông cốt thép chịu lực'}</strong></p>
                          <p className="pl-3 text-slate-700">+ Số tầng: <strong>{dossier.floorsCount || 3}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + Mái: <strong>{dossier.roofType || 'Bê tông cốt thép / Tôn chống nóng'}</strong></p>
                          <p className="pl-3 text-slate-700">+ Tường: <strong>{dossier.wallType || 'Xây gạch, sơn hoàn thiện'}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + Nền: <strong>{dossier.floorType || 'Lát gạch men ceramic / đá granite'}</strong></p>
                          <p>- DTSD thực tế: <strong className="font-mono text-amber-900">{constrArea} m²</strong> &nbsp;&nbsp;&nbsp;&nbsp; - DTSD được công nhận: <strong className="font-mono">{dossier.constructionRecognizedArea || constrArea} m²</strong></p>
                          <p>- Tổng số phòng: <strong>{dossier.totalRooms || 6}</strong> trong đó <strong>{dossier.bedRooms || 3}</strong> phòng ngủ, <strong>{dossier.bathRooms || 3}</strong> phòng WC</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* III. KẾT QUẢ THẨM ĐỊNH */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-4">
                    <h3 className="font-bold text-sm text-slate-950 mb-1 uppercase border-b border-slate-200 pb-1">
                      III. KẾT QUẢ THẨM ĐỊNH
                    </h3>
                    
                    <div className="space-y-1 text-slate-800">
                      <p>1. <strong>Quy hoạch sử dụng đất nơi bất động sản tọa lạc:</strong> {dossier.planningInfo || 'Đất ở đô thị phù hợp quy hoạch phân khu xây dựng, không có tranh chấp khiếu kiện.'}</p>
                      <p>2. <strong>Mục đích sử dụng của bất động sản:</strong> {dossier.currentUsage || 'Dùng để ở và sinh hoạt gia đình kết hợp kinh doanh.'}</p>
                      <p>3. <strong>Khả năng chuyển nhượng:</strong> {transferability || liquidity || 'Trung bình, khả năng thanh khoản tốt trên thị trường.'}</p>
                      <p className="font-bold pt-1">4. Định giá bất động sản:</p>
                    </div>

                    {/* a. Giá trị bất động sản */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-slate-900">a. Giá trị bất động sản:</h4>
                        <span className="text-[11px] italic text-slate-500 font-mono">đvt: VND</span>
                      </div>

                      <table className="w-full border-collapse border border-slate-400 text-xs font-sans">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-900">
                            <th className="border border-slate-400 p-2 text-left">Khoản mục</th>
                            <th className="border border-slate-400 p-2 text-right w-44">Theo đơn giá nhà nước</th>
                            <th className="border border-slate-400 p-2 text-right w-44">Theo đơn giá thẩm định</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="font-bold bg-slate-50">
                            <td colSpan={3} className="border border-slate-400 p-1.5 text-slate-900">1. Giá trị quyền sử dụng đất</td>
                          </tr>
                          <tr className="text-slate-700 italic">
                            <td className="border border-slate-400 p-1.5 pl-5">- Diện tích (m2)</td>
                            <td className="border border-slate-400 p-1.5 text-center font-mono">{landArea}</td>
                            <td className="border border-slate-400 p-1.5 text-center font-mono">{landArea}</td>
                          </tr>
                          <tr className="text-slate-700 italic">
                            <td className="border border-slate-400 p-1.5 pl-5">- Đơn giá (đvt/m2)</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(stateUnitPrice)}</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-amber-900">{formatCurrencyNumber(appraisedUnitPrice)}</td>
                          </tr>
                          <tr className="text-slate-700 italic">
                            <td className="border border-slate-400 p-1.5 pl-5">- Hệ số K</td>
                            <td className="border border-slate-400 p-1.5 text-center font-mono">{stateK}</td>
                            <td className="border border-slate-400 p-1.5 text-center font-mono">1.0</td>
                          </tr>
                          <tr className="font-semibold text-slate-900">
                            <td className="border border-slate-400 p-1.5 pl-3">Thành tiền QSD đất (VND)</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(stateLandVal)}</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-slate-950">{formatCurrencyNumber(customLandValue)}</td>
                          </tr>

                          <tr className="font-bold bg-slate-50">
                            <td colSpan={3} className="border border-slate-400 p-1.5 text-slate-900">2. Giá trị tài sản gắn liền với đất</td>
                          </tr>
                          <tr className="text-slate-700 italic">
                            <td className="border border-slate-400 p-1.5 pl-5">- Diện tích (m2)</td>
                            <td className="border border-slate-400 p-1.5 text-center font-mono">{constrArea}</td>
                            <td className="border border-slate-400 p-1.5 text-center font-mono">{constrArea}</td>
                          </tr>
                          <tr className="text-slate-700 italic">
                            <td className="border border-slate-400 p-1.5 pl-5">- Đơn giá (đvt/m2)</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(stateConstrPrice)}</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-amber-900">{formatCurrencyNumber(appraisedConstrPrice)}</td>
                          </tr>
                          <tr className="font-semibold text-slate-900">
                            <td className="border border-slate-400 p-1.5 pl-3">Thành tiền TS trên đất (VND)</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(stateConstrVal)}</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-slate-950">{formatCurrencyNumber(customConstrValue)}</td>
                          </tr>

                          <tr className="bg-amber-50/90 font-extrabold text-amber-950">
                            <td className="border border-slate-400 p-2 uppercase">3. Tổng giá trị = 1 + 2</td>
                            <td className="border border-slate-400 p-2 text-right font-mono text-sm">{formatCurrencyNumber(totalStateVal)}</td>
                            <td className="border border-slate-400 p-2 text-right font-mono text-sm text-amber-900">{formatCurrencyNumber(finalTotalValue)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="mt-2 space-y-0.5 text-xs text-slate-900">
                        <p>Trị giá tài sản làm tròn: <strong className="font-mono text-sm text-amber-900">{formatCurrencyNumber(finalTotalValue)} VND</strong></p>
                        <p>Bằng chữ: <em>{numberToVietnameseWords(finalTotalValue)}.</em></p>
                      </div>
                    </div>

                    {/* b. Giải thích phương pháp định giá */}
                    <div className="pt-2">
                      <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-xs">
                        b. Giải thích phương pháp định giá (Bảng so sánh 3 BĐS thị trường)
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-400 text-[11px] font-sans">
                          <thead>
                            <tr className="bg-slate-100 font-bold text-slate-900 text-center">
                              <th className="border border-slate-400 p-1.5 text-left w-64">Nội dung</th>
                              <th className="border border-slate-400 p-1.5 w-44">Tài sản cần thẩm định</th>
                              <th className="border border-slate-400 p-1.5 w-36">Tài sản so sánh 1</th>
                              <th className="border border-slate-400 p-1.5 w-36">Tài sản so sánh 2</th>
                              <th className="border border-slate-400 p-1.5 w-36">Tài sản so sánh 3</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-400 p-1.5 font-bold">Mô tả chi tiết tài sản (Địa chỉ, diện tích từng loại đất, TS trên đất, Tên & SĐT liên hệ)</td>
                              <td className="border border-slate-400 p-1.5">{dossier.assetAddress}. DT: {landArea}m². TS: {dossier.constructionType || 'Nhà ở'}. LH: Chủ tài sản</td>
                              <td className="border border-slate-400 p-1.5">{comps[0].address}. DT: {comps[0].landArea}m². LH: {comps[0].contact}</td>
                              <td className="border border-slate-400 p-1.5">{comps[1].address}. DT: {comps[1].landArea}m². LH: {comps[1].contact}</td>
                              <td className="border border-slate-400 p-1.5">{comps[2].address}. DT: {comps[2].landArea}m². LH: {comps[2].contact}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1.5">Thời điểm giao dịch</td>
                              <td className="border border-slate-400 p-1.5 text-center">Hiện tại</td>
                              <td className="border border-slate-400 p-1.5 text-center">{comps[0].transactionTime}</td>
                              <td className="border border-slate-400 p-1.5 text-center">{comps[1].transactionTime}</td>
                              <td className="border border-slate-400 p-1.5 text-center">{comps[2].transactionTime}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1.5">Giá tham khảo (VNĐ)</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-slate-900">{formatCurrencyNumber(finalTotalValue)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[0].askingPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[1].askingPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[2].askingPrice)}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1.5">Giá ước tính giao dịch thành công (VNĐ)</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-slate-900">{formatCurrencyNumber(finalTotalValue)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[0].transactionPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[1].transactionPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[2].transactionPrice)}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1.5">Giá trị tài sản trên đất (VNĐ)</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(customConstrValue)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[0].constrValue)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[1].constrValue)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[2].constrValue)}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1.5">Giá trị quyền sử dụng đất (VNĐ)</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-slate-900">{formatCurrencyNumber(customLandValue)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[0].landValue)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[1].landValue)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[2].landValue)}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1.5">Tổng diện tích đất (m2)</td>
                              <td className="border border-slate-400 p-1.5 text-center font-mono font-bold">{landArea}</td>
                              <td className="border border-slate-400 p-1.5 text-center font-mono">{comps[0].landArea}</td>
                              <td className="border border-slate-400 p-1.5 text-center font-mono">{comps[1].landArea}</td>
                              <td className="border border-slate-400 p-1.5 text-center font-mono">{comps[2].landArea}</td>
                            </tr>
                            <tr className="font-bold bg-slate-50">
                              <td className="border border-slate-400 p-1.5">Đơn giá đất (vnđ/m2) [B]</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono text-amber-900">{formatCurrencyNumber(appraisedUnitPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[0].landUnitPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[1].landUnitPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[2].landUnitPrice)}</td>
                            </tr>

                            <tr className="bg-sky-50 font-bold text-sky-950">
                              <td colSpan={5} className="border border-slate-400 p-1 text-left uppercase text-[10px]">
                                Điều chỉnh theo các yếu tố
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Diện tích đất (cùng mục đích SD)</td>
                              <td className="border border-slate-400 p-1 text-center">{landArea} m²</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[0].adjArea > 0 ? '+' : ''}{comps[0].adjArea}%</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[1].adjArea > 0 ? '+' : ''}{comps[1].adjArea}%</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[2].adjArea > 0 ? '+' : ''}{comps[2].adjArea}%</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Tình trạng pháp lý</td>
                              <td className="border border-slate-400 p-1 text-center">Đã có GCN</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Hình dạng (vuông vắn/không vuông)</td>
                              <td className="border border-slate-400 p-1 text-center">{dossier.shape || 'Vuông vắn'}</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Độ rộng mặt tiền</td>
                              <td className="border border-slate-400 p-1 text-center">{dossier.frontageWidth || 4.5} m</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[0].adjFrontage > 0 ? '+' : ''}{comps[0].adjFrontage}%</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[1].adjFrontage > 0 ? '+' : ''}{comps[1].adjFrontage}%</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[2].adjFrontage > 0 ? '+' : ''}{comps[2].adjFrontage}%</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Độ rộng mặt cắt ngõ</td>
                              <td className="border border-slate-400 p-1 text-center">{dossier.roadWidth || '3.5m'}</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[0].adjAlley > 0 ? '+' : ''}{comps[0].adjAlley}%</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[1].adjAlley > 0 ? '+' : ''}{comps[1].adjAlley}%</td>
                              <td className="border border-slate-400 p-1 text-center">{comps[2].adjAlley > 0 ? '+' : ''}{comps[2].adjAlley}%</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Khoảng cách ra đường phố chính</td>
                              <td className="border border-slate-400 p-1 text-center">Khoảng 50m</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Khả năng kinh doanh</td>
                              <td className="border border-slate-400 p-1 text-center">{businessCapability || dossier.businessCondition || 'Để ở / KD nhỏ'}</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Môi trường kinh tế xã hội</td>
                              <td className="border border-slate-400 p-1 text-center">Hạ tầng hoàn chỉnh, an ninh tốt</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-400 p-1 pl-4">- Yếu tố khác</td>
                              <td className="border border-slate-400 p-1 text-center">Tương đồng</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                              <td className="border border-slate-400 p-1 text-center">0%</td>
                            </tr>

                            <tr className="bg-amber-50/90 font-bold">
                              <td className="border border-slate-400 p-1.5 uppercase">Tổng tỷ lệ điều chỉnh (%)</td>
                              <td className="border border-slate-400 p-1.5 text-center">0%</td>
                              <td className="border border-slate-400 p-1.5 text-center font-mono">{comps[0].totalAdjRate > 0 ? '+' : ''}{comps[0].totalAdjRate}%</td>
                              <td className="border border-slate-400 p-1.5 text-center font-mono">{comps[1].totalAdjRate > 0 ? '+' : ''}{comps[1].totalAdjRate}%</td>
                              <td className="border border-slate-400 p-1.5 text-center font-mono">{comps[2].totalAdjRate > 0 ? '+' : ''}{comps[2].totalAdjRate}%</td>
                            </tr>
                            <tr className="font-bold bg-slate-50">
                              <td className="border border-slate-400 p-1.5">Đơn giá sau điều chỉnh (vnđ/m2) [F]</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono text-amber-900">{formatCurrencyNumber(appraisedUnitPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[0].adjustedUnitPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[1].adjustedUnitPrice)}</td>
                              <td className="border border-slate-400 p-1.5 text-right font-mono">{formatCurrencyNumber(comps[2].adjustedUnitPrice)}</td>
                            </tr>
                            <tr className="bg-slate-100 font-extrabold text-slate-950">
                              <td className="border border-slate-400 p-2 uppercase">Đơn giá lựa chọn (vnđ/m2) [G]</td>
                              <td colSpan={4} className="border border-slate-400 p-2 text-center font-mono text-sm text-amber-900 bg-amber-50">
                                {formatCurrencyNumber(appraisedUnitPrice)} VNĐ/m² (Trung bình cộng các đơn giá sau điều chỉnh F)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Lưu ý công thức chuẩn BM.02A */}
                      <div className="mt-2.5 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                        <p className="font-bold text-slate-800">Lưu ý theo quy chuẩn biểu mẫu BM.02A/TĐTS:</p>
                        <p>• <strong>Giá tham khảo:</strong> Giá trị chào mua/chào bán/giao dịch thành công do thẩm định viên thu thập trên thị trường.</p>
                        <p>• <strong>Giá ước tính giao dịch thành công:</strong> Giá trị tài sản có thể mua bán được sau khi điều chỉnh theo mức độ tin cậy của thông tin và biến động thị trường.</p>
                        <p>• <strong>Giá trị QSD đất:</strong> = Giá ước tính giao dịch thành công – Giá trị tài sản gắn liền trên đất.</p>
                        <p>• <strong>Đơn giá (B):</strong> = Giá trị QSD đất / Tổng diện tích đất.</p>
                        <p>• <strong>Tỷ lệ điều chỉnh:</strong> Nếu BĐS so sánh kém hơn BĐS thẩm định thì điều chỉnh tăng (+%); thuận lợi hơn thì điều chỉnh giảm (-%).</p>
                        <p>• <strong>Đơn giá sau điều chỉnh (F):</strong> = Đơn giá (B) × (100% + tổng tỷ lệ điều chỉnh).</p>
                        <p>• <strong>Đơn giá lựa chọn (G):</strong> = Trung bình cộng của đơn giá sau điều chỉnh của các tài sản so sánh.</p>
                      </div>
                    </div>

                    {/* 1.2 Định giá tài sản gắn liền trên đất */}
                    <div className="pt-2">
                      <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-xs">
                        1.2 Định giá tài sản gắn liền trên đất
                      </h4>

                      <table className="w-full border-collapse border border-slate-400 text-xs font-sans">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-900 text-center">
                            <th className="border border-slate-400 p-2 text-left">Hạng mục CTXD</th>
                            <th className="border border-slate-400 p-2 w-24">Diện tích (m2)</th>
                            <th className="border border-slate-400 p-2 w-32">Đơn giá (VNĐ)</th>
                            <th className="border border-slate-400 p-2 w-28">Chất lượng còn lại (%)</th>
                            <th className="border border-slate-400 p-2 text-right w-40">Giá trị thẩm định (VNĐ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-400 p-2 font-semibold">{dossier.constructionType || 'Nhà ở kiên cố'}</td>
                            <td className="border border-slate-400 p-2 text-center font-mono">{constrArea}</td>
                            <td className="border border-slate-400 p-2 text-right font-mono">{formatCurrencyNumber(appraisedConstrPrice)}</td>
                            <td className="border border-slate-400 p-2 text-center font-mono">{dossier.remainingBuildingQuality || 75}%</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold text-slate-950">{formatCurrencyNumber(customConstrValue)}</td>
                          </tr>
                          <tr className="bg-amber-50/80 font-bold">
                            <td colSpan={4} className="border border-slate-400 p-2 text-right uppercase text-amber-950">Giá trị tài sản trên đất</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold text-amber-900">{formatCurrencyNumber(customConstrValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* IV. KIẾN NGHỊ */}
                  {(() => {
                    return (
                      <div className="border border-amber-200/80 rounded-lg p-3.5 bg-amber-50/40 relative group">
                        <div className="flex justify-between items-center mb-1.5 border-b border-amber-200/60 pb-1">
                          <h3 className="font-bold text-sm text-slate-950 uppercase flex items-center gap-1.5">
                            IV. KIẾN NGHỊ & ĐỀ XUẤT
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowConfigPanel(true)}
                            className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold bg-white border border-amber-300 px-2 py-0.5 rounded shadow-2xs hover:bg-amber-100 transition print:hidden flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa kiến nghị</span>
                          </button>
                        </div>

                        <div className="space-y-1.5 pl-1 text-slate-800 text-xs sm:text-[13px]">
                          {customRecommendations && customRecommendations.trim() ? (
                            customRecommendations.split('\n').filter(Boolean).map((line, idx) => (
                              <p key={idx}>{line.startsWith('-') || line.startsWith('•') ? line : `- ${line}`}</p>
                            ))
                          ) : (
                            <>
                              <p>- <strong>Đề xuất cấp tín dụng:</strong> {creditProposal || `Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng cho khách hàng ${cleanVietnameseText(dossier.clientName)} theo đúng quy định định giá tài sản bảo đảm của Ngân hàng TMCP Bắc Á.`}</p>
                              {(maxLtvRate || maxLoanAmount > 0) ? (
                                <p>- <strong>Tỷ lệ cho vay tối đa đề xuất:</strong> <span className="font-bold text-amber-900">{maxLtvRate}%</span> giá trị định giá TSBĐ {maxLoanAmount > 0 ? <span>(Số tiền cho vay tối đa tương ứng: <strong className="font-mono text-emerald-900">{formatCurrencyNumber(maxLoanAmount)} VNĐ</strong>; bằng chữ: <em>{numberToVietnameseWords(maxLoanAmount)}</em>)</span> : null}.</p>
                              ) : null}
                              <p>- <strong>Điều kiện quản lý TSBĐ:</strong> {collateralConditions || 'Đơn vị kinh doanh phối hợp kiểm tra thực địa ranh giới thửa đất, hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.'}</p>
                              {postDisbursementCheck ? (
                                <p>- <strong>Giám sát sau giải ngân:</strong> {postDisbursementCheck}</p>
                              ) : null}
                              {otherProposals ? (
                                <p>- <strong>Kiến nghị khác:</strong> {otherProposals}</p>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* SƠ ĐỒ VỊ TRÍ TÀI SẢN */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-center">
                    <h3 className="font-bold text-sm text-slate-950 mb-1 uppercase">SƠ ĐỒ VỊ TRÍ TÀI SẢN</h3>
                    <p className="text-slate-500 italic text-xs mb-3">(In hình bản đồ nơi có vị trí tài sản)</p>
                    <div className="h-44 bg-slate-200 rounded border border-slate-300 flex flex-col items-center justify-center p-3 text-slate-600">
                      <p className="font-mono text-xs">Tọa độ: {dossier.googleMapCoords || '20.958459, 105.804748'}</p>
                      <p className="text-xs font-semibold mt-1">Trích lục sơ đồ định vị Google Maps & Thửa đất số {plotNum}, Tờ bản đồ {sheetNum}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{cleanVietnameseText(dossier.assetAddress)}</p>
                    </div>
                  </div>

                  {/* HÌNH ẢNH TÀI SẢN */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <h3 className="font-bold text-sm text-slate-950 mb-1 uppercase text-center">HÌNH ẢNH TÀI SẢN</h3>
                    <p className="text-slate-500 italic text-xs mb-3 text-center">Tối thiểu 3 hình ảnh đặc trưng của BĐS sau:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="h-32 bg-slate-200 rounded border border-slate-300 flex flex-col items-center justify-center p-2 text-center text-slate-600">
                        <p className="font-bold text-xs">1. Toàn cảnh tài sản</p>
                        <p className="text-[11px] text-slate-500 mt-1">Tổng thể tài sản và không gian xung quanh</p>
                      </div>
                      <div className="h-32 bg-slate-200 rounded border border-slate-300 flex flex-col items-center justify-center p-2 text-center text-slate-600">
                        <p className="font-bold text-xs">2. Đường ngõ & Mặt tiền</p>
                        <p className="text-[11px] text-slate-500 mt-1">Độ rộng mặt đường/ngõ trước thửa đất: {dossier.roadWidth || '3.5m'}</p>
                      </div>
                      <div className="h-32 bg-slate-200 rounded border border-slate-300 flex flex-col items-center justify-center p-2 text-center text-slate-600">
                        <p className="font-bold text-xs">3. Nội thất & Kết cấu</p>
                        <p className="text-[11px] text-slate-500 mt-1">Hiện trạng bên trong, yếu tố ảnh hưởng giá trị</p>
                      </div>
                    </div>
                  </div>

                  {/* Date & Signatures */}
                  <div className="pt-4">
                    <p className="text-right italic text-xs text-slate-600 mb-4">
                      ..............., ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </p>
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-300 pt-4 text-center font-sans">
                      <div>
                        <p className="font-bold uppercase text-slate-950">NGƯỜI THẨM ĐỊNH</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, ghi rõ họ tên)</p>
                        <p className="font-bold text-slate-900 text-sm">{appraiserName}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-slate-950">TRƯỞNG PHÒNG</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, ghi rõ họ tên)</p>
                        <p className="font-bold text-slate-900 text-sm">{managerName || 'Trần Đình Trọng'}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-slate-950">NGƯỜI PHÊ DUYỆT</p>
                        <p className="text-slate-500 italic text-[11px] mb-14">(Ký, đóng dấu)</p>
                        <p className="font-bold text-slate-900 text-sm">{directorName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Watermark / Form Code Bottom Right */}
                  <div className="text-right text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200 mt-4">
                    BM.02A/TĐTS
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>

      {/* 1. CONFIRM SUBMIT APPROVAL MODAL */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-slate-950/10 rounded-xl">
                  <Send className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Xác Nhận Gửi Trình Duyệt Báo Cáo</h3>
                  <p className="text-xs text-slate-900 font-mono">Hồ sơ: {dossier.code}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitConfirmModal(false)}
                className="p-1 text-slate-800 hover:text-slate-950 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-800">
              {/* Dossier Summary Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Khách hàng:</span>
                  <strong className="text-slate-900">{dossier.clientName}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Tài sản:</span>
                  <strong className="text-slate-900 truncate max-w-[280px]">{dossier.assetName}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Tổng giá trị định giá:</span>
                  <strong className="text-emerald-700 font-mono text-sm">{formatCurrencyNumber(finalTotalValue)} VNĐ</strong>
                </div>
              </div>

              {/* Report Model Info */}
              <div>
                <p className="font-bold text-slate-900 mb-1.5 flex items-center space-x-1.5 text-xs">
                  <FileCheck className="w-4 h-4 text-amber-600" />
                  <span>Báo cáo chuyên sách tương ứng loại tài sản:</span>
                </p>
                <div className="space-y-1.5 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-xs">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Báo cáo định giá:</strong> Báo cáo tư vấn giá tài sản chuẩn theo danh mục <code className="text-[11px] bg-amber-100 px-1 rounded">(.docx)</code></span>
                  </div>
                </div>
              </div>

              {/* Note for Approver */}
              <div>
                <label className="block text-slate-800 font-bold text-xs mb-1">
                  Ghi chú gửi Lãnh đạo (tùy chọn):
                </label>
                <textarea
                  rows={3}
                  value={submissionNoteInput}
                  onChange={(e) => setSubmissionNoteInput(e.target.value)}
                  placeholder="VD: Kính trình Lãnh đạo xem xét và phê duyệt báo cáo tư vấn định giá..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                />
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Kính trình Lãnh đạo phê duyệt báo cáo tư vấn",
                  "Hồ sơ pháp lý đầy đủ & hợp lệ",
                  "Số liệu khảo sát tài sản so sánh chuẩn xác",
                  "Đã cập nhật chỉnh sửa theo yêu cầu"
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSubmissionNoteInput(prev => prev ? `${prev}. ${tag}` : tag)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg text-[10px] border border-slate-200 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitApproval}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition flex items-center space-x-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>🚀 Xác Nhận Gửi Trình Duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUBMISSION SUCCESS MODAL */}
      {showSubmitSuccessModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col text-center p-6 sm:p-7">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-slate-950 mb-1">
              ĐÃ GỬI TRÌNH DUYỆT THÀNH CÔNG!
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Báo cáo tư vấn định giá của hồ sơ <strong className="text-amber-800 font-mono">{dossier.code}</strong> đã được chuyển đến Lãnh đạo để phê duyệt.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left text-xs space-y-1.5 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái mới:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Đã lên báo cáo chờ duyệt
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian gửi:</span>
                <span className="font-mono font-medium text-slate-800">{submittedTime || new Date().toLocaleString('vi-VN')}</span>
              </div>
              {submissionNoteInput && (
                <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Ghi chú: </span>
                  <span>{submissionNoteInput}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitSuccessModal(false);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
              >
                <span>Quay Về Danh Sách Hồ Sơ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitSuccessModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Ở Lại Xem Báo Cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REJECTION SUCCESS MODAL (XÁC NHẬN ĐÃ TỪ CHỐI THÀNH CÔNG) */}
      {showRejectSuccessModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col text-center p-6 sm:p-7">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-rose-50">
              <XCircle className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-slate-950 mb-1">
              ĐÃ TỪ CHỐI DUYỆT BÁO CÁO THÀNH CÔNG!
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Hồ sơ <strong className="text-amber-800 font-mono">{dossier.code}</strong> đã được chuyển sang trạng thái <strong>Từ chối duyệt báo cáo</strong> và đã được <strong>MỞ KHÓA</strong> để chuyên viên cập nhật lại thông tin.
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-2 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trạng thái mới:</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Từ chối duyệt báo cáo
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thời gian từ chối:</span>
                <span className="font-mono font-medium text-slate-800">{rejectedTime || new Date().toLocaleString('vi-VN')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-rose-900 block mb-0.5">Lý do từ chối & Yêu cầu chỉnh sửa:</span>
                <p className="text-rose-800 bg-rose-50/80 p-2 rounded-lg border border-rose-200 leading-relaxed font-medium">
                  "{rejectedReasonSaved}"
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {onEditDossier && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectSuccessModal(false);
                    onEditDossier(dossier);
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Chuyển Sang Sửa Lại Hồ Sơ Ngay</span>
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectSuccessModal(false);
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Quay Về Danh Sách</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectSuccessModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded-xl transition cursor-pointer"
                >
                  Ở Lại Xem Báo Cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. APPROVAL SUCCESS MODAL (XÁC NHẬN ĐÃ DUYỆT THÀNH CÔNG) */}
      {showApproveSuccessModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col text-center p-6 sm:p-7">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
              <ShieldCheck className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-slate-950 mb-1">
              ĐÃ PHÊ DUYỆT BÁO CÁO THÀNH CÔNG!
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Lãnh đạo đã phê duyệt báo cáo tư vấn định giá của hồ sơ <strong className="text-emerald-800 font-mono">{dossier.code}</strong>. Bản ghi hồ sơ đã được <strong>KHÓA AN TOÀN</strong>.
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-1.5 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trạng thái mới:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Đã duyệt báo cáo (Đã Khóa)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thời gian duyệt:</span>
                <span className="font-mono font-medium text-slate-800">{approvedTime || new Date().toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Quyền chỉnh sửa:</span>
                <span className="text-rose-600 font-bold flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Không cho phép sửa đổi (Khóa bản ghi)</span>
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowApproveSuccessModal(false);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
              >
                <span>Quay Về Danh Sách</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowApproveSuccessModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Ở Lại Xem
              </button>
            </div>
          </div>
        </div>
      )}

            {/* REJECTION REASON MODAL DIALOG */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-rose-700 text-white p-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Lãnh Đạo Từ Chối Duyệt Báo Cáo</h3>
                  <p className="text-xs text-rose-100 font-mono">Hồ sơ: {dossier.code}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-rose-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-bold text-xs mb-1.5">
                  Nhập lý do từ chối & Yêu cầu chuyên viên chỉnh sửa (*):
                </label>
                <textarea
                  rows={4}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="VD: Đơn giá đề xuất căn hộ CT1 còn cao so với giao dịch thực tế, yêu cầu khảo sát thêm tài sản so sánh và điều chỉnh lại tỷ lệ..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                />
              </div>

              {/* Quick Suggestion Tags */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Gợi ý lý do nhanh (bấm để thêm vào nội dung):</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Đơn giá đề xuất chưa sát thị trường",
                    "Cần khảo sát lại hiện trạng tài sản",
                    "Bổ sung tài liệu pháp lý còn thiếu",
                    "Điều chỉnh tỷ lệ thương lượng tài sản so sánh",
                    "Kiểm tra lại diện tích theo trích lục mới",
                    "Rà soát lại tỷ lệ CLCL công trình"
                  ].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReasonInput(prev => prev ? `${prev}. ${tag}` : tag)}
                      className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-[11px] border border-slate-200 transition"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Sau khi xác nhận từ chối, hồ sơ sẽ được chuyển sang trạng thái <strong>"Từ chối duyệt báo cáo"</strong> và <strong>MỞ KHÓA</strong> để chuyên viên vào cập nhật lại thông tin hồ sơ.
                </span>
              </div>
            </div>

            <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRejectReport}
                disabled={!rejectionReasonInput.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-md"
              >
                <XCircle className="w-4 h-4" />
                <span>Xác Nhận Từ Chối & Yêu Cầu Sửa</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
