# -*- coding: utf-8 -*-
import os

with open('src/components/AdvisoryExportModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's import getComparablesData if not already imported
if 'getComparablesData' not in text:
    text = text.replace(
        "import { downloadReportDocx, ExportReportOptions } from '../utils/docxExport';",
        "import { downloadReportDocx, ExportReportOptions, getComparablesData } from '../utils/docxExport';"
    )

# Let's locate the template 1 preview start
start_marker = '{/* BÁO CÁO KẾT QUẢ TƯ VẤN GIÁ TÀI SẢN THEO CHUYÊN SÁCH LOẠI TÀI SẢN */}'
end_marker = '{/* 1. CONFIRM SUBMIT APPROVAL MODAL */}'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

print("start_idx:", start_idx, "end_idx:", end_idx)

new_preview = r'''{/* BÁO CÁO KẾT QUẢ TƯ VẤN GIÁ TÀI SẢN THEO CHUYÊN SÁCH LOẠI TÀI SẢN */}
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
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">IV. KIẾN NGHỊ</h3>
                      <div className="pl-3 text-slate-800 space-y-1">
                        <p>- Đề xuất chấp thuận kết quả định giá căn hộ làm cơ sở cấp tín dụng cho khách hàng {cleanVietnameseText(dossier.clientName)} theo quy định của BAC A BANK.</p>
                      </div>
                    </div>

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
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">IV. KIẾN NGHỊ</h3>
                      <div className="pl-3 text-slate-800 space-y-1">
                        <p>- Đề xuất chấp thuận mức định giá phương tiện vận tải làm cơ sở cấp tín dụng cho khách hàng {cleanVietnameseText(dossier.clientName)} theo quy định của BAC A BANK.</p>
                      </div>
                    </div>

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
                    <div>
                      <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase">IV. KIẾN NGHỊ</h3>
                      <div className="pl-3 text-slate-800 space-y-1">
                        <p>- Đề xuất chấp thuận mức định giá MMTB làm cơ sở cấp tín dụng cho khách hàng {cleanVietnameseText(dossier.clientName)} theo quy định của BAC A BANK.</p>
                      </div>
                    </div>

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
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <h3 className="font-bold text-sm text-slate-950 mb-1.5 uppercase border-b border-slate-200 pb-1">
                      IV. KIẾN NGHỊ
                    </h3>
                    <div className="space-y-1 text-slate-800">
                      <p>- Đề xuất chấp thuận kết quả định giá tài sản làm cơ sở cấp tín dụng cho khách hàng <strong>{cleanVietnameseText(dossier.clientName)}</strong> theo đúng quy định định giá tài sản bảo đảm của Ngân hàng TMCP Bắc Á.</p>
                      <p>- Điều kiện quản lý tài sản: Đơn vị kinh doanh phối hợp kiểm tra thực địa ranh giới thửa đất, hồ sơ pháp lý bản gốc và thực hiện công chứng, đăng ký biện pháp bảo đảm hợp lệ trước khi giải ngân.</p>
                    </div>
                  </div>

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

'''

new_full = text[:start_idx] + new_preview + text[end_idx:]

with open('src/components/AdvisoryExportModal.tsx', 'w', encoding='utf-8') as f:
    f.write(new_full)

print("Successfully updated AdvisoryExportModal.tsx with exact BM.02A, BM.02A1, BM.02B, BM.02C templates!")
