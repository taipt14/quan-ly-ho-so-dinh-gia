import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2, Building2, CreditCard, Copy, Check } from 'lucide-react';
import { ValuationDossier } from '../types/dossier';
import { 
  formatVND, 
  formatDate, 
  ASSET_CATEGORY_CONFIG, 
  PURPOSE_CONFIG, 
  numberToVietnameseWords 
} from '../utils/formatters';

interface FeeNoticeModalProps {
  dossier: ValuationDossier | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FeeNoticeModal: React.FC<FeeNoticeModalProps> = ({
  dossier,
  isOpen,
  onClose
}) => {
  const [templateType, setTemplateType] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);

  // Editable Fee Parameters
  const [baseFee, setBaseFee] = useState<number>(dossier?.totalValuationFee || dossier?.serviceFee || 5000000);
  const [surveyFee, setSurveyFee] = useState<number>(1000000);
  const [vatRate, setVatRate] = useState<number>(10); // 10% or 8%
  const [advancePercent, setAdvancePercent] = useState<number>(50); // 50%
  const [bankAccount, setBankAccount] = useState({
    bankName: 'Ngân hàng TMCP Bắc Á (BAC A BANK)',
    accountNumber: '150.001.060.000.500',
    accountName: 'CONG TY TNHH QUAN LY NO VA KHAI THAC TAI SAN BAC A',
    branch: 'Chi nhánh Hà Thành'
  });

  React.useEffect(() => {
    if (!dossier) return;
    const fee = dossier.totalValuationFee || dossier.serviceFee || 5000000;
    setBaseFee(fee);
    if (dossier.advanceFee && fee > 0) {
      setAdvancePercent(Math.round((dossier.advanceFee / fee) * 100));
    }
  }, [dossier?.id, isOpen]);

  if (!isOpen || !dossier) return null;

  const handlePrint = () => {
    window.print();
  };

  const calculateFees = () => {
    const rawBase = baseFee || 0;
    const rawSurvey = templateType === 2 ? (surveyFee || 0) : 0;
    const subTotal = rawBase + rawSurvey;
    const vatAmount = Math.round((subTotal * vatRate) / 100);
    const totalAmount = subTotal + vatAmount;
    const advanceAmount = Math.round((totalAmount * advancePercent) / 100);
    const remainingAmount = totalAmount - advanceAmount;

    return {
      subTotal,
      vatAmount,
      totalAmount,
      advanceAmount,
      remainingAmount
    };
  };

  const fees = calculateFees();
  const todayStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const paymentContent = `TBP ${dossier.code} ${dossier.clientName.replace(/[^a-zA-Z0-9]/g, ' ')}`;

  const handleCopyPaymentInfo = () => {
    const info = `SỐ TK: ${bankAccount.accountNumber}\nNGÂN HÀNG: ${bankAccount.bankName}\nTÊN TK: ${bankAccount.accountName}\nNỘI DUNG: ${paymentContent}\nSỐ TIỀN: ${formatVND(fees.totalAmount)}`;
    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* Top Header Bar & Template Selector (Hidden on print) */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between text-white gap-3 print:hidden shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Xuất Thông Báo Phí Dịch Vụ Thẩm Định Giá</span>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>In / Xuất PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Selector Tabs & Custom Fee Inputs (Print Hidden) */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 space-y-3 print:hidden shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn mẫu thông báo phí (3 mẫu tiêu chuẩn):
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyPaymentInfo}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-600" />}
                <span>{copied ? 'Đã sao chép TK' : 'Sao chép thông tin CK'}</span>
              </button>
            </div>
          </div>

          {/* 3 Template Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTemplateType(1)}
              className={`p-2.5 rounded-xl border text-left transition flex items-start space-x-2 ${
                templateType === 1
                  ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-medium'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900/10 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-xs leading-tight">Mẫu 1: Thông báo phí Tiêu chuẩn</p>
                <p className="text-[10px] opacity-80 mt-0.5">Dành cho Khách hàng Cá nhân / Doanh nghiệp chung</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTemplateType(2)}
              className={`p-2.5 rounded-xl border text-left transition flex items-start space-x-2 ${
                templateType === 2
                  ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-medium'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900/10 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-xs leading-tight">Mẫu 2: Bất động sản & Phụ phí</p>
                <p className="text-[10px] opacity-80 mt-0.5">Kèm phụ phí khảo sát thực địa + Điều khoản tạm ứng</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTemplateType(3)}
              className={`p-2.5 rounded-xl border text-left transition flex items-start space-x-2 ${
                templateType === 3
                  ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-medium'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900/10 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-xs leading-tight">Mẫu 3: Đề nghị thanh toán Ngân hàng</p>
                <p className="text-[10px] opacity-80 mt-0.5">Cấp cho Cán bộ tín dụng Ngân hàng + Xác nhận biên nhận</p>
              </div>
            </button>
          </div>

          {/* Quick Fee Inputs Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Phí dịch vụ cơ bản (VND)
              </label>
              <input
                type="number"
                step="500000"
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-amber-700"
              />
            </div>

            {templateType === 2 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Phí công tác / Khảo sát (VND)
                </label>
                <input
                  type="number"
                  step="200000"
                  value={surveyFee}
                  onChange={(e) => setSurveyFee(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Thuế GTGT (VAT)
              </label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
              >
                <option value={10}>10% VAT</option>
                <option value={8}>8% VAT</option>
                <option value={0}>0% (Miễn thuế)</option>
              </select>
            </div>

            {templateType === 2 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tỉ lệ tạm ứng (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={advancePercent}
                  onChange={(e) => setAdvancePercent(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white font-sans text-slate-900 print:p-0 print:overflow-visible">
          
          <div className="border border-slate-300 p-6 sm:p-10 relative bg-white min-h-[700px] shadow-sm">
            
            {/* Standard Company Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-amber-600 pb-4 mb-6 gap-4">
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-amber-900 uppercase">
                  CÔNG TY CỔ PHẦN THẨM ĐỊNH GIÁ VIỆT NAM (VALUMANAGER)
                </h2>
                <p className="text-xs text-slate-600 mt-1">Đơn vị Thẩm định giá đăng ký Bộ Tài chính • Mã số thuế: 0102938475</p>
                <p className="text-xs text-slate-600">Trụ sở: {dossier.branch} • Hotline: 1900 6868</p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs shrink-0">
                <p className="font-bold text-slate-900">Mã hồ sơ: <span className="text-amber-800">{dossier.code}</span></p>
                <p className="text-slate-500">Số TBP: {dossier.code}/TBP-VALU</p>
                <p className="text-slate-500">Ngày lập: {todayStr}</p>
              </div>
            </div>

            {/* Document Titles based on Selected Template */}
            <div className="text-center my-6">
              {templateType === 1 && (
                <>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-wide">
                    THÔNG BÁO PHÍ DỊCH VỤ THẨM ĐỊNH GIÁ
                  </h1>
                  <p className="text-xs italic text-slate-500 mt-1">
                    (V/v: Cung cấp dịch vụ Thẩm định giá tài sản theo yêu cầu)
                  </p>
                </>
              )}

              {templateType === 2 && (
                <>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-wide">
                    THÔNG BÁO PHÍ THẨM ĐỊNH GIÁ BẤT ĐỘNG SẢN & KẾ HOẠCH TẠM ỨNG
                  </h1>
                  <p className="text-xs italic text-slate-500 mt-1">
                    (Phụ phí công tác khảo sát thực địa + Khảo sát quy hoạch xây dựng)
                  </p>
                </>
              )}

              {templateType === 3 && (
                <>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-wide">
                    PHIẾU ĐỀ NGHỊ THANH TOÁN PHÍ THẨM ĐỊNH GIÁ
                  </h1>
                  <p className="text-xs italic text-slate-500 mt-1">
                    (Dành cho Ngân hàng / Đơn vị yêu cầu Thẩm định giá cấp Tín dụng)
                  </p>
                </>
              )}
            </div>

            {/* Recipient Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm mb-6 space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                <span className="font-bold text-slate-600">Kính gửi Khách hàng:</span>
                <span className="sm:col-span-3 font-bold text-slate-900 text-base">{dossier.clientName}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                <span className="font-bold text-slate-600">Số điện thoại:</span>
                <span className="sm:col-span-3 font-mono">{dossier.clientPhone}</span>
              </div>

              {templateType === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-600">Ngân hàng / Đơn vị yêu cầu:</span>
                  <span className="sm:col-span-3 font-bold text-amber-900">{dossier.branch}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                <span className="font-bold text-slate-600">Mục đích định giá:</span>
                <span className="sm:col-span-3 font-medium text-slate-800">{PURPOSE_CONFIG[dossier.purpose]}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                <span className="font-bold text-slate-600">Tên tài sản định giá:</span>
                <span className="sm:col-span-3 font-semibold text-slate-900">{dossier.assetName}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                <span className="font-bold text-slate-600">Địa chỉ / Vị trí tài sản:</span>
                <span className="sm:col-span-3 text-slate-800">{dossier.assetAddress}</span>
              </div>
            </div>

            {/* Fee Itemized Table */}
            <div className="mb-6">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                Chi tiết tính phí dịch vụ thẩm định giá:
              </h3>

              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 px-3 py-2 text-center w-12">STT</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Nội dung chi phí</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-36">Thành tiền (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="border border-slate-300 px-3 py-2 text-center font-mono">01</td>
                    <td className="border border-slate-300 px-3 py-2">
                      <p className="font-bold">Phí dịch vụ thẩm định giá tiêu chuẩn</p>
                      <p className="text-[11px] text-slate-500">
                        Áp dụng cho tài sản: {ASSET_CATEGORY_CONFIG[dossier.assetCategory]?.label} (Diện tích: {dossier.area || '---'} m²)
                      </p>
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold">
                      {formatVND(baseFee)}
                    </td>
                  </tr>

                  {templateType === 2 && (
                    <tr>
                      <td className="border border-slate-300 px-3 py-2 text-center font-mono">02</td>
                      <td className="border border-slate-300 px-3 py-2">
                        <p className="font-bold">Phí khảo sát thực địa & xác minh quy hoạch</p>
                        <p className="text-[11px] text-slate-500">
                          Chi phí đi lại, đo đạc hiện trạng, kiểm tra quy hoạch đô thị địa phương
                        </p>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold">
                        {formatVND(surveyFee)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-slate-50">
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right font-bold">
                      Cộng tiền dịch vụ (Chưa VAT):
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold text-slate-900">
                      {formatVND(fees.subTotal)}
                    </td>
                  </tr>

                  <tr className="bg-slate-50">
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right font-bold">
                      Thuế giá trị gia tăng ({vatRate}% VAT):
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold text-slate-900">
                      {formatVND(fees.vatAmount)}
                    </td>
                  </tr>

                  <tr className="bg-amber-50/80">
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right font-bold text-amber-950 text-xs sm:text-sm">
                      TỔNG PHÍ THANH TOÁN (ĐÃ BAO GỒM VAT):
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono font-extrabold text-amber-800 text-sm sm:text-base">
                      {formatVND(fees.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-2 text-xs font-semibold italic text-slate-700">
                (Bằng chữ: <strong className="text-slate-900">{numberToVietnameseWords(fees.totalAmount)}</strong>)
              </div>
            </div>

            {/* Advance Payment Breakdown if Template 2 */}
            {templateType === 2 && (
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs mb-6 space-y-1">
                <p className="font-bold text-amber-900 uppercase">Tiến độ thanh toán phí:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-600">• Tạm ứng ({advancePercent}%):</span>{' '}
                    <strong className="font-mono text-amber-800">{formatVND(fees.advanceAmount)}</strong>
                    <span className="block text-[11px] text-slate-500">Thanh toán ngay trước khi tiến hành khảo sát thực địa</span>
                  </div>
                  <div>
                    <span className="text-slate-600">• Thanh toán còn lại ({100 - advancePercent}%):</span>{' '}
                    <strong className="font-mono text-amber-800">{formatVND(fees.remainingAmount)}</strong>
                    <span className="block text-[11px] text-slate-500">Thanh toán khi bàn giao Chứng thư & Báo cáo thẩm định giá</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Box */}
            <div className="border border-slate-300 bg-slate-50 p-4 rounded-xl text-xs space-y-2 mb-6">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>THÔNG TIN TÀI KHOẢN THANH TOÁN (CHUYỂN KHẢN):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 pt-1">
                <p>• <strong>Tên chủ tài khoản:</strong> {bankAccount.accountName}</p>
                <p>• <strong>Số tài khoản:</strong> <span className="font-mono font-extrabold text-amber-800 text-sm">{bankAccount.accountNumber}</span></p>
                <p>• <strong>Ngân hàng:</strong> {bankAccount.bankName}</p>
                <p>• <strong>Chi nhánh:</strong> {bankAccount.branch}</p>
              </div>

              <div className="p-2 bg-amber-100/70 rounded-lg text-amber-950 font-medium">
                • <strong>Nội dung chuyển khoản bắt buộc:</strong>{' '}
                <span className="font-mono font-bold underline">{paymentContent}</span>
              </div>
            </div>

            {/* Footer / Signatures based on Template */}
            {templateType === 3 ? (
              <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-900 uppercase">CÁN BỘ TÍN DỤNG</p>
                  <p className="text-slate-400 italic text-[11px] mb-10">(Ký, xác nhận)</p>
                  <p className="font-bold text-slate-800">Trần Văn Bình</p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 uppercase">XÁC NHẬN KHÁCH HÀNG</p>
                  <p className="text-slate-400 italic text-[11px] mb-10">(Đã nhận thông báo phí)</p>
                  <p className="font-bold text-slate-800">{dossier.clientName}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 uppercase">ĐẠI DIỆN ĐƠN VỊ TĐG</p>
                  <p className="text-slate-400 italic text-[11px] mb-10">(Ký, đóng dấu)</p>
                  <p className="font-bold text-slate-800">{dossier.assignedAppraiser || 'Lê Văn Nam'}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-900 uppercase">ĐẠI DIỆN KHÁCH HÀNG</p>
                  <p className="text-slate-400 italic text-[11px] mb-12">(Ký, ghi rõ họ tên)</p>
                  <p className="font-bold text-slate-800">{dossier.clientName}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 uppercase">CÔNG TY CỔ PHẦN THẨM ĐỊNH GIÁ VIỆT NAM</p>
                  <p className="text-slate-400 italic text-[11px] mb-12">(Ký tên, đóng dấu)</p>
                  <p className="font-bold text-slate-800">{dossier.assignedAppraiser || 'Lê Văn Nam'}</p>
                  <p className="text-[10px] text-slate-500">Trưởng phòng Nghiệp vụ Thẩm định</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
