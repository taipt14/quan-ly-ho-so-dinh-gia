const fs = require('fs');

let content = fs.readFileSync('src/components/DossierDetailModal.tsx', 'utf8');

if (!content.includes('isDossierLocked')) {
  content = content.replace(
    'import { formatVND,',
    'import { formatVND,\n  isDossierLocked,'
  );
}

const modalHeaderTarget = '<div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">';
const lockedBanner = `{isDossierLocked(dossier.status) && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center space-x-2 text-amber-900 text-xs font-bold shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>🔒 Hồ sơ đã được Lãnh đạo duyệt báo cáo. Bản ghi đã bị khóa và không cho phép chỉnh sửa.</span>
        </div>
      )}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">`;

if (!content.includes('Hồ sơ đã được Lãnh đạo duyệt báo cáo')) {
  content = content.replace(modalHeaderTarget, lockedBanner);
}

content = content.replace(
  "hasPermission('edit_dossier') && (\n              <button\n                onClick={() => onEdit(dossier)}",
  "hasPermission('edit_dossier') && !isDossierLocked(dossier.status) && (\n              <button\n                onClick={() => onEdit(dossier)}"
);

const footerTarget = "            {hasPermission('delete_dossier') && (";
const approvalButtons = `            {!isDossierLocked(dossier.status) && (
              <>
                {dossier.status !== 'DA_LEN_BAO_CAO_CHO_DUYET' && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(dossier.id, 'DA_LEN_BAO_CAO_CHO_DUYET');
                      alert('🚀 Đã gửi trình duyệt báo cáo thành công đến Lãnh đạo!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition flex items-center space-x-1"
                    title="Gửi trình duyệt báo cáo lên lãnh đạo"
                  >
                    <span>🚀 Gửi Trình Duyệt</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(dossier.id, 'DA_DUYET_BAO_CAO');
                    alert('✅ Lãnh đạo đã duyệt báo cáo! Hồ sơ đã được cập nhật trạng thái và khóa bản ghi.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition flex items-center space-x-1"
                  title="Lãnh đạo duyệt báo cáo và khóa hồ sơ"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Lãnh Đạo Duyệt</span>
                </button>
              </>
            )}
            {isDossierLocked(dossier.status) && (
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đã được Lãnh đạo duyệt (Khóa)</span>
              </span>
            )}
            {hasPermission('delete_dossier') && (`;

if (!content.includes('Gửi Trình Duyệt')) {
  content = content.replace(footerTarget, approvalButtons);
}

fs.writeFileSync('src/components/DossierDetailModal.tsx', content, 'utf8');
console.log('Successfully updated DossierDetailModal.tsx');
