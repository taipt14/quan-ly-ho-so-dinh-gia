import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Layers,
  Table,
  Check,
  ChevronDown,
  Info,
  ExternalLink,
  Sliders,
  FileCheck,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { ValuationDossier } from '../types/dossier';
import { 
  parseExcelDetailed, 
  downloadExcelTemplate, 
  HeaderColumnInfo 
} from '../utils/excel';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newDossiers: ValuationDossier[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  // Mode selection: 'url' or 'file'
  const [activeSource, setActiveSource] = useState<'url' | 'file'>('url');

  // URL state
  const [urlInput, setUrlInput] = useState('https://docs.google.com/spreadsheets/d/1T9xx3AqBhOuhNEaPqY20zmTEVoYhZKtb/edit');
  
  // Header and Data row configuration (Default: Tên cột dòng 1 - 3, Data là dòng 4)
  const [headerStartRow, setHeaderStartRow] = useState<number>(1);
  const [headerEndRow, setHeaderEndRow] = useState<number>(3);
  const [dataStartRow, setDataStartRow] = useState<number>(4);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false);

  // Parsing & UI state
  const [isLoading, setIsLoading] = useState(false);
  const [parsedDossiers, setParsedDossiers] = useState<ValuationDossier[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [detectedHeaders, setDetectedHeaders] = useState<HeaderColumnInfo[]>([]);
  const [sheetName, setSheetName] = useState<string>('');
  const [skippedEmptyCount, setSkippedEmptyCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'data' | 'headers'>('data');
  const [dataPreviewMode, setDataPreviewMode] = useState<'summary' | 'all_columns'>('all_columns');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [lastBuffer, setLastBuffer] = useState<ArrayBuffer | string | null>(null);

  if (!isOpen) return null;

  // Re-parse with updated row configuration if buffer exists
  const reparseWithCurrentConfig = (buffer: ArrayBuffer | string, hStart = headerStartRow, hEnd = headerEndRow, dStart = dataStartRow) => {
    try {
      const res = parseExcelDetailed(buffer, {
        headerStartRow: hStart,
        headerEndRow: hEnd,
        dataStartRow: dStart
      });

      setDetectedHeaders(res.headers);
      setSheetName(res.sheetName);
      setSkippedEmptyCount(res.skippedEmptyRows || 0);

      if (res.dossiers.length === 0) {
        setErrorMessage(`Đã đọc tên cột từ dòng ${hStart}-${hEnd}, nhưng không tìm thấy dòng dữ liệu hợp lệ nào từ dòng ${dStart} trở đi (${res.skippedEmptyRows || 0} dòng trống/mẫu đã được bỏ qua). Hãy kiểm tra lại file.`);
        setParsedDossiers([]);
        setSelectedRowIds(new Set());
      } else {
        setParsedDossiers(res.dossiers);
        setSelectedRowIds(new Set(res.dossiers.map(d => d.id)));
        setErrorMessage(null);
      }
    } catch (err: any) {
      console.error('Re-parse error:', err);
      setErrorMessage(`Lỗi phân tích bảng tính: ${err.message || err}`);
    }
  };

  // Fetch data from URL via server proxy (bypasses CORS restrictions)
  const handleFetchFromUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMessage('Vui lòng dán đường dẫn (Google Sheets, URL tệp .xlsx hoặc .csv)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Call server proxy
      const response = await fetch('/api/import/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải file từ đường dẫn được cung cấp');
      }

      setLastBuffer(data.base64);
      reparseWithCurrentConfig(data.base64);

    } catch (err: any) {
      console.warn('Proxy fetch failed, attempting client direct fetch as fallback...', err);
      try {
        // Fallback: direct fetch if url is public CORS-friendly
        const directRes = await fetch(urlInput.trim());
        if (!directRes.ok) throw new Error(`HTTP ${directRes.status}`);
        const buf = await directRes.arrayBuffer();
        setLastBuffer(buf);
        reparseWithCurrentConfig(buf);
      } catch (fallbackErr: any) {
        setErrorMessage(
          err.message || 
          'Không thể tải dữ liệu từ đường dẫn. Hãy đảm bảo liên kết được chia sẻ công khai ("Bất kỳ ai có đường liên kết đều xem được") hoặc tải file về máy và chọn tab "Tải file từ máy tính".'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle local Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        setLastBuffer(buffer);
        reparseWithCurrentConfig(buffer);
      } catch (err: any) {
        setErrorMessage(`Lỗi đọc file Excel: ${err.message || err}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Apply row configuration change
  const handleApplyRowConfig = (hStart: number, hEnd: number, dStart: number) => {
    setHeaderStartRow(hStart);
    setHeaderEndRow(hEnd);
    setDataStartRow(dStart);
    if (lastBuffer) {
      reparseWithCurrentConfig(lastBuffer, hStart, hEnd, dStart);
    }
  };

  // Toggle selection for a single row
  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === parsedDossiers.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(parsedDossiers.map(d => d.id)));
    }
  };

  // Delete a single row from parsedDossiers
  const handleDeleteRow = (id: string) => {
    setParsedDossiers(prev => prev.filter(d => d.id !== id));
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Delete all selected rows
  const handleDeleteSelectedRows = () => {
    if (selectedRowIds.size === 0) return;
    setParsedDossiers(prev => prev.filter(d => !selectedRowIds.has(d.id)));
    setSelectedRowIds(new Set());
  };

  // Restore original parsed data from buffer
  const handleRestoreOriginal = () => {
    if (lastBuffer) {
      reparseWithCurrentConfig(lastBuffer);
    }
  };

  // Confirm import with only selected rows
  const handleConfirmImport = () => {
    const toImport = parsedDossiers.filter(d => selectedRowIds.has(d.id));
    if (toImport.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 dòng hồ sơ (tích vào ô vuông đầu dòng) để xác nhận nhập vào hệ thống!');
      return;
    }
    onImportSuccess(toImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <span>Nhập Dữ Liệu Từ Đường Dẫn / Excel</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Tên cột: Dòng 1-3 • Data: Dòng 4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Đọc trực tiếp từ link Google Sheets hoặc tệp bảng tính với cấu trúc tiêu đề 3 tầng chuẩn
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Source Tabs: URL vs File */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveSource('url');
                setErrorMessage(null);
              }}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
                activeSource === 'url'
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-amber-600" />
              <span>Đọc từ Đường Dẫn (Google Sheets / URL trực tuyến)</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-200 text-amber-900 rounded font-bold ml-1">Chính</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSource('file');
                setErrorMessage(null);
              }}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
                activeSource === 'file'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Tải file từ máy tính (.xlsx, .xls, .csv)</span>
            </button>
          </div>

          {/* TAB 1: IMPORT FROM URL */}
          {activeSource === 'url' && (
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center">
                  <LinkIcon className="w-4 h-4 mr-1.5 text-amber-600" />
                  Đường dẫn dữ liệu (URL Google Sheets / File trực tuyến)
                </label>
                <span className="text-[11px] text-amber-800 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Máy chủ Proxy tự động vượt lỗi CORS</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/1T9xx3AqBhOuhNEaPqY20zmTEVoYhZKtb/edit..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-xs"
                  />
                  {urlInput && (
                    <button
                      type="button"
                      onClick={() => setUrlInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-700"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleFetchFromUrl}
                  disabled={isLoading || !urlInput.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 shrink-0 flex items-center justify-center space-x-1.5 transform active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tải & đọc file...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Đọc Dữ Liệu Từ Đường Dẫn</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sample link helpers */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-amber-900">
                <span className="font-semibold text-amber-950">Gợi ý nhanh:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('https://docs.google.com/spreadsheets/d/1T9xx3AqBhOuhNEaPqY20zmTEVoYhZKtb/edit');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition font-medium text-amber-900"
                >
                  📋 Mẫu bảng tính Google Sheets Thẩm định giá (54 Cột)
                </button>
                <a
                  href={urlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-amber-800 hover:text-amber-950 underline font-medium ml-auto"
                >
                  <span>Mở liên kết ở tab mới</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT FROM LOCAL FILE */}
          {activeSource === 'file' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn tệp từ máy tính (.xlsx, .xls, .csv)
                </label>
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File Mẫu (.xlsx)</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center transition bg-slate-50 relative group cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 mx-auto text-slate-400 group-hover:text-amber-500 transition mb-2" />
                <p className="font-semibold text-sm text-slate-700">Kéo thả file Excel vào đây hoặc click để chọn file</p>
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ các định dạng .xlsx, .xls, .csv</p>
              </div>
            </div>
          )}

          {/* Specification Structure Indicator Banner */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </div>
                <div>
                  <span className="font-bold text-slate-900">Quy tắc nhận diện cấu trúc bảng tính:</span>
                  <div className="flex items-center flex-wrap gap-2 text-slate-600 mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px]">
                      Tên cột: Dòng {headerStartRow} đến dòng {headerEndRow}
                    </span>
                    <span>→</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                      Dữ liệu (Data): Bắt đầu từ dòng {dataStartRow}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdvancedConfig ? 'Ẩn cấu hình dòng' : 'Tùy chỉnh số dòng'}</span>
              </button>
            </div>

            {/* Advanced row customization drawer */}
            {showAdvancedConfig && (
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dòng bắt đầu Tiêu đề
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={headerStartRow}
                    onChange={e => handleApplyRowConfig(parseInt(e.target.value) || 1, headerEndRow, dataStartRow)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Dòng 1: Nhóm thông tin lớn</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dòng kết thúc Tiêu đề
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={headerEndRow}
                    onChange={e => handleApplyRowConfig(headerStartRow, parseInt(e.target.value) || 3, dataStartRow)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Dòng 3: Tên cột chi tiết/phụ</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dòng bắt đầu Dữ liệu (Data)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={dataStartRow}
                    onChange={e => handleApplyRowConfig(headerStartRow, headerEndRow, parseInt(e.target.value) || 4)}
                    className="w-full bg-white border border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs text-emerald-900 font-bold bg-emerald-50/50"
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold">Dòng 4: Bắt đầu hồ sơ</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold">Thông báo: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* PREVIEW CONTAINER */}
          {parsedDossiers.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200 animate-fadeIn">
              
              {/* Preview Header & Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Đã đọc {parsedDossiers.length} hồ sơ từ dòng {dataStartRow}!
                  </h4>
                  <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded border border-emerald-300">
                    {detectedHeaders.length} Cột = {detectedHeaders.length} Trường dữ liệu nạp vào hệ thống
                  </span>
                  {skippedEmptyCount > 0 && (
                    <span className="text-[11px] bg-amber-50 text-amber-900 font-medium px-2 py-0.5 rounded border border-amber-300">
                      Đã tự động loại bỏ {skippedEmptyCount} dòng mẫu/trống
                    </span>
                  )}
                  {sheetName && (
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Sheet: {sheetName}
                    </span>
                  )}
                </div>

                {/* Sub-tab: View Data Rows vs View Detected Column Headers */}
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('data')}
                    className={`px-3 py-1 rounded-md transition ${
                      activePreviewTab === 'data'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Xem Dữ Liệu Hồ Sơ ({parsedDossiers.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('headers')}
                    className={`px-3 py-1 rounded-md transition ${
                      activePreviewTab === 'headers'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Toàn Bộ {detectedHeaders.length} Cột Nhận Diện (Dòng 1-3)
                  </button>
                </div>
              </div>

              {/* View 1: Data Rows Table Preview */}
              {activePreviewTab === 'data' && (
                <div className="space-y-2">
                  {/* Row Selection & Management Toolbar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.size === parsedDossiers.length && parsedDossiers.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>Chọn tất cả ({parsedDossiers.length})</span>
                      </label>

                      <span className="text-slate-300">|</span>

                      {selectedRowIds.size > 0 && selectedRowIds.size < parsedDossiers.length && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedRowIds(new Set())}
                            className="text-slate-500 hover:text-slate-700 underline text-[11px] cursor-pointer"
                          >
                            Bỏ chọn
                          </button>
                          <span className="text-slate-300">|</span>
                        </>
                      )}

                      <span className="text-slate-700">
                        Đã chọn: <strong className="text-emerald-700 font-bold">{selectedRowIds.size}</strong> / {parsedDossiers.length} hồ sơ
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {selectedRowIds.size > 0 && (
                        <button
                          type="button"
                          onClick={handleDeleteSelectedRows}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-[11px] flex items-center space-x-1 transition shadow-2xs"
                          title="Xóa các dòng đã chọn khỏi danh sách xem trước"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Xóa {selectedRowIds.size} dòng đã chọn</span>
                        </button>
                      )}

                      {lastBuffer && (
                        <button
                          type="button"
                          onClick={handleRestoreOriginal}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-medium text-[11px] flex items-center space-x-1 transition shadow-2xs"
                          title="Khôi phục lại toàn bộ dữ liệu ban đầu từ file"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Khôi phục dữ liệu gốc</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mode switcher */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 font-medium text-[11px]">Chế độ xem bảng:</span>
                      <button
                        type="button"
                        onClick={() => setDataPreviewMode('all_columns')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                          dataPreviewMode === 'all_columns'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Toàn bộ {detectedHeaders.length} cột dữ liệu
                      </button>
                      <button
                        type="button"
                        onClick={() => setDataPreviewMode('summary')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                          dataPreviewMode === 'summary'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Cột tóm tắt
                      </button>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {dataPreviewMode === 'all_columns' ? `Cuộn ngang để xem tất cả ${detectedHeaders.length} cột` : 'Hiển thị 8 cột nghiệp vụ chính'}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-72">
                      {dataPreviewMode === 'all_columns' ? (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-200 sticky top-0 z-10 text-[11px]">
                            <tr>
                              <th className="p-2 text-center w-10 bg-slate-950 sticky left-0 z-20">
                                <input
                                  type="checkbox"
                                  checked={selectedRowIds.size === parsedDossiers.length && parsedDossiers.length > 0}
                                  onChange={handleToggleSelectAll}
                                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                />
                              </th>
                              <th className="p-2.5 font-bold whitespace-nowrap bg-slate-950 sticky left-10 z-20">
                                Dòng
                              </th>
                              {detectedHeaders.map((h) => (
                                <th key={h.colIndex} className="p-2.5 font-bold whitespace-nowrap min-w-[150px] border-r border-slate-800" title={h.combinedName}>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-amber-400 font-mono">
                                      #{h.colIndex + 1} {h.categoryGroup ? `[${h.categoryGroup}]` : ''}
                                    </span>
                                    <span className="truncate max-w-[200px]">{h.combinedName}</span>
                                  </div>
                                </th>
                              ))}
                              <th className="p-2.5 font-bold whitespace-nowrap text-center bg-slate-950 sticky right-0 z-20 w-16">
                                Xóa
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {parsedDossiers.map((row, idx) => {
                              const isRowSelected = selectedRowIds.has(row.id);
                              return (
                                <tr 
                                  key={row.id} 
                                  className={`transition ${isRowSelected ? 'hover:bg-amber-50/50' : 'bg-slate-50/60 opacity-60'}`}
                                >
                                  <td className="p-2 text-center bg-white sticky left-0 z-10">
                                    <input
                                      type="checkbox"
                                      checked={isRowSelected}
                                      onChange={() => handleToggleSelectRow(row.id)}
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2 text-slate-400 font-mono text-[11px] font-semibold bg-white whitespace-nowrap sticky left-10 z-10">
                                    #{dataStartRow + idx}
                                  </td>
                                  {detectedHeaders.map((h) => {
                                    const val = row.importedColumnsData?.[h.colIndex]?.value ?? row.customFields?.[h.combinedName] ?? '';
                                    const hasVal = val !== undefined && val !== null && String(val).trim() !== '';
                                    return (
                                      <td key={h.colIndex} className="p-2 text-slate-800 whitespace-nowrap max-w-[220px] truncate border-r border-slate-100" title={String(val)}>
                                        {hasVal ? String(val) : <span className="text-slate-300 italic">--</span>}
                                      </td>
                                    );
                                  })}
                                  <td className="p-2 text-center bg-white sticky right-0 z-10">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(row.id)}
                                      className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                                      title="Xóa dòng dữ liệu này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-200 sticky top-0 z-10">
                            <tr>
                              <th className="p-2 text-center w-10">
                                <input
                                  type="checkbox"
                                  checked={selectedRowIds.size === parsedDossiers.length && parsedDossiers.length > 0}
                                  onChange={handleToggleSelectAll}
                                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                />
                              </th>
                              <th className="p-2.5 font-bold">Dòng Excel</th>
                              <th className="p-2.5 font-bold">Mã HS</th>
                              <th className="p-2.5 font-bold">Khách hàng</th>
                              <th className="p-2.5 font-bold">CCCD</th>
                              <th className="p-2.5 font-bold">Tài sản thẩm định</th>
                              <th className="p-2.5 font-bold">Địa chỉ</th>
                              <th className="p-2.5 font-bold text-right">Diện tích (m²)</th>
                              <th className="p-2.5 font-bold text-right">Giá thị trường / duyệt</th>
                              <th className="p-2.5 font-bold">Trạng thái</th>
                              <th className="p-2.5 font-bold text-center w-14">Xóa</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {parsedDossiers.map((row, idx) => {
                              const isRowSelected = selectedRowIds.has(row.id);
                              return (
                                <tr 
                                  key={row.id} 
                                  className={`transition ${isRowSelected ? 'hover:bg-amber-50/40' : 'bg-slate-50/60 opacity-60'}`}
                                >
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isRowSelected}
                                      onChange={() => handleToggleSelectRow(row.id)}
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2 text-slate-400 font-mono text-[11px] font-semibold">
                                    #{dataStartRow + idx}
                                  </td>
                                  <td className="p-2 font-mono font-bold text-amber-700 whitespace-nowrap">
                                    {row.code}
                                  </td>
                                  <td className="p-2 font-bold text-slate-900 whitespace-nowrap">
                                    {row.clientName}
                                  </td>
                                  <td className="p-2 font-mono text-slate-600 text-[11px]">
                                    {row.clientCccd || '---'}
                                  </td>
                                  <td className="p-2 text-slate-700 max-w-[200px] truncate" title={row.assetName}>
                                    {row.assetName}
                                  </td>
                                  <td className="p-2 text-slate-600 max-w-[200px] truncate" title={row.assetAddress}>
                                    {row.assetAddress}
                                  </td>
                                  <td className="p-2 text-right font-mono text-slate-800">
                                    {row.area ? `${row.area} m²` : '--'}
                                  </td>
                                  <td className="p-2 text-right font-bold text-emerald-700 whitespace-nowrap">
                                    {row.approvedValue ? `${(row.approvedValue / 1_000_000_000).toFixed(2)} Tỷ` : '--'}
                                  </td>
                                  <td className="p-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(row.id)}
                                      className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                                      title="Xóa dòng dữ liệu này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="bg-slate-50 px-3 py-2 text-center text-[11px] text-slate-500 border-t border-slate-200 flex items-center justify-between">
                      <span>
                        Hiển thị <strong>{parsedDossiers.length}</strong> dòng hồ sơ hợp lệ.
                      </span>
                      <span>
                        Chỉ các dòng được tích chọn (<strong className="text-emerald-700 font-bold">{selectedRowIds.size} dòng</strong>) sẽ được nạp vào hệ thống.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Detected Column Headers (Dòng 1 đến 3) */}
              {activePreviewTab === 'headers' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-3 max-h-64 overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="text-slate-700 font-medium">
                      Phát hiện <strong className="text-emerald-700">{detectedHeaders.length} cột</strong>. Tất cả {detectedHeaders.length} cột đều được chuyển đổi thành các trường thông tin lưu trữ trong hệ thống:
                    </div>
                    <div className="w-56">
                      <input
                        type="text"
                        placeholder="Tìm cột..."
                        value={headerSearchQuery}
                        onChange={e => setHeaderSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {detectedHeaders
                      .filter(h => {
                        if (!headerSearchQuery.trim()) return true;
                        const q = headerSearchQuery.toLowerCase();
                        return (
                          h.combinedName.toLowerCase().includes(q) ||
                          h.categoryGroup.toLowerCase().includes(q) ||
                          h.row1.toLowerCase().includes(q) ||
                          h.row2.toLowerCase().includes(q) ||
                          h.row3.toLowerCase().includes(q) ||
                          String(h.colIndex + 1).includes(q)
                        );
                      })
                      .map((h) => (
                        <div 
                          key={h.colIndex} 
                          className="p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs hover:border-emerald-300 transition"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="font-mono font-bold text-emerald-800">
                              Cột #{h.colIndex + 1} ({String.fromCharCode(65 + (h.colIndex % 26))})
                            </span>
                            {h.categoryGroup && (
                              <span className="text-amber-700 font-semibold truncate max-w-[120px]" title={h.categoryGroup}>
                                {h.categoryGroup}
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 truncate" title={h.combinedName}>
                            {h.combinedName}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            D1: {h.row1 || '-'} • D2: {h.row2 || '-'} • D3: {h.row3 || '-'}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Đóng / Hủy bỏ
          </button>

          <div className="flex items-center space-x-3">
            {selectedRowIds.size > 0 && (
              <span className="text-xs text-emerald-800 font-bold hidden sm:inline">
                Sẵn sàng nạp {selectedRowIds.size} / {parsedDossiers.length} hồ sơ đã chọn
              </span>
            )}

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedRowIds.size === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Xác nhận Nhập ({selectedRowIds.size} Hồ sơ đã chọn)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
