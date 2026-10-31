import React from 'react';
import { X, Printer, ShieldCheck, Download, Award } from 'lucide-react';
import { ValuationDossier } from '../types/dossier';
import { 
  formatVND, 
  formatDate, 
  ASSET_CATEGORY_CONFIG, 
  PURPOSE_CONFIG, 
  numberToVietnameseWords 
} from '../utils/formatters';

interface ValuationCertificateModalProps {
  dossier: ValuationDossier | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ValuationCertificateModal: React.FC<ValuationCertificateModalProps> = ({
  dossier,
  isOpen,
  onClose
}) => {
  if (!isOpen || !dossier) return null;

  const handlePrint = () => {
    window.print();
  };

  const finalValue = dossier.approvedValue || dossier.marketPrice || dossier.estimatedValue || 0;
  const todayStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 px-6 py-3 flex items-center justify-between text-white print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Xem trước Chứng thư Định giá chuẩn Quốc gia</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>In Chứng Thư (Print / PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Sheet Area */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white font-serif text-slate-900 print:p-0 print:overflow-visible">
          
          <div className="border-4 border-double border-amber-800/60 p-6 sm:p-10 relative bg-amber-50/10">
            
            {/* National Motto Header */}
            <div className="text-center space-y-1 mb-8">
              <h4 className="font-bold text-xs sm:text-sm uppercase tracking-widest text-slate-900">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h4>
              <p className="font-semibold text-xs sm:text-sm italic text-slate-800 border-b-2 border-amber-700/50 pb-2 inline-block px-8">
                Độc lập - Tự do - Hạnh phúc
              </p>
            </div>

            {/* Certificate Header Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start text-xs text-slate-700 mb-8 border-b border-slate-200 pb-4 font-sans">
              <div>
                <p className="font-bold text-slate-900 uppercase">CÔNG TY CỔ PHẦN THẨM ĐỊNH GIÁ VIỆT NAM</p>
                <p>Địa chỉ: {dossier.branch}</p>
                <p>Số Hotline: 1900 6868 • Email: valumanager@dinhgia.vn</p>
              </div>

              <div className="text-left sm:text-right mt-2 sm:mt-0 font-mono">
                <p className="font-bold text-amber-800 text-sm">Số CT: CT-{dossier.code}</p>
                <p className="text-[11px] text-slate-500">Ngày phát hành: {todayStr}</p>
              </div>
            </div>

            {/* Document Main Title */}
            <div className="text-center my-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-900 uppercase tracking-wider font-sans">
                CHỨNG THƯ THẨM ĐỊNH GIÁ
              </h1>
              <p className="text-xs tracking-widest uppercase text-slate-500 font-sans mt-1">
                VALUATION CERTIFICATE
              </p>
            </div>

            {/* Certificate Content Table */}
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed font-sans">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <span className="font-bold text-slate-600">Kính gửi (Khách hàng):</span>
                  <span className="sm:col-span-3 font-bold text-slate-900 text-sm">{dossier.clientName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <span className="font-bold text-slate-600">Số điện thoại liên hệ:</span>
                  <span className="sm:col-span-3 font-mono">{dossier.clientPhone}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <span className="font-bold text-slate-600">Mục đích thẩm định:</span>
                  <span className="sm:col-span-3 font-semibold text-slate-800">{PURPOSE_CONFIG[dossier.purpose]}</span>
                </div>
              </div>

              {/* Asset Description Box */}
              <div className="border border-amber-900/20 rounded-xl p-4 bg-amber-50/30 space-y-2">
                <h3 className="font-bold text-amber-900 uppercase text-xs tracking-wider border-b border-amber-900/20 pb-1">
                  1. THÔNG TIN TÀI SẢN THẨM ĐỊNH GIÁ
                </h3>

                <p className="font-bold text-slate-900 text-sm">{dossier.assetName}</p>
                <p><strong>Loại tài sản:</strong> {ASSET_CATEGORY_CONFIG[dossier.assetCategory]?.label}</p>
                <p><strong>Địa chỉ / Vị trí:</strong> {dossier.assetAddress}</p>
                {dossier.area && <p><strong>Diện tích khuôn viên:</strong> {dossier.area} m²</p>}
                {dossier.legalDocNumber && <p><strong>Cơ sở pháp lý:</strong> {dossier.legalDocNumber}</p>}
                <p><strong>Phương pháp định giá áp dụng:</strong> {dossier.methodUsed || 'Phương pháp so sánh trực tiếp thị trường'}</p>
              </div>

              {/* Final Valuation Result Box */}
              <div className="border-2 border-amber-600 rounded-2xl p-6 bg-amber-50/70 text-center space-y-2 shadow-inner">
                <h3 className="font-bold text-amber-950 uppercase text-xs tracking-widest">
                  2. KẾT QUẢ GIÁ TRỊ THẨM ĐỊNH GIÁ PHÊ DUYỆT
                </h3>
                
                <div className="py-2">
                  <span className="text-2xl sm:text-4xl font-extrabold text-amber-800 tracking-tight font-sans">
                    {formatVND(finalValue)}
                  </span>
                </div>

                <p className="text-sm font-semibold italic text-slate-800">
                  (Bằng chữ: {numberToVietnameseWords(finalValue)})
                </p>
              </div>

              {/* Legal Notes */}
              <div className="text-[11px] text-slate-500 space-y-1 pt-2 font-sans italic">
                <p>• Giá trị thẩm định trên có hiệu lực 06 tháng kể từ ngày phát hành chứng thư này.</p>
                <p>• Chứng thư thẩm định giá này được lập thành 03 bản chính có giá trị pháp lý như nhau.</p>
              </div>

            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-2 gap-8 mt-12 pt-6 text-center text-xs font-sans">
              <div>
                <p className="font-bold text-slate-900 uppercase">THẨM ĐỊNH VIÊN PHỤ TRÁCH</p>
                <p className="text-slate-400 italic text-[11px] mb-12">(Ký, ghi rõ họ tên)</p>
                <p className="font-bold text-slate-900 text-sm">
                  {dossier.amcSpecialist || dossier.assignedAppraiser || dossier.businessUnitSpecialist || 'Lê Văn Nam'}
                </p>
                <p className="text-[10px] text-slate-500">Thẻ thẩm định viên số: TĐV-2024/0892</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 uppercase">GIÁM ĐỐC / NGƯỜI ĐẠI DIỆN PHÁP LUẬT</p>
                <p className="text-slate-400 italic text-[11px] mb-12">(Ký tên & Đóng dấu công ty)</p>
                <p className="font-bold text-slate-900 text-sm">Nguyễn Minh Hải</p>
                <p className="text-[10px] text-slate-500">Tổng Giám đốc Công ty Thẩm định giá</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
