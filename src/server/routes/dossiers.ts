import express from 'express';
import { DossierModel } from '../models/Dossier';
import { INITIAL_DOSSIERS } from '../../data/mockDossiers';
import { cleanVietnameseText } from '../../utils/formatters';
import type { ValuationDossier } from '../../types/dossier';

const router = express.Router();

function computeDefaultDueDate(id: string, index: number): string {
  const now = new Date();
  if (id === 'HS-2026-0802') {
    const d = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (id === 'HS-2026-0803') {
    const d = new Date(now.getTime() + 16 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (id === 'HS-2024TĐ-AMC5864') {
    return '2024-08-05';
  }
  const daysOffset = 3 + (index % 4) * 2;
  const d = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sanitizeDossier(d: ValuationDossier, index: number = 0): ValuationDossier {
  const dueDate = d.dueDate || computeDefaultDueDate(d.id, index);

  return {
    ...d,
    dueDate,
    clientName: cleanVietnameseText(d.clientName),
    clientAddress: d.clientAddress ? cleanVietnameseText(d.clientAddress) : undefined,
    assetAddress: cleanVietnameseText(d.assetAddress),
    assetName: cleanVietnameseText(d.assetName),
    businessUnit: cleanVietnameseText(d.businessUnit),
    businessUnitSpecialist: cleanVietnameseText(d.businessUnitSpecialist),
    amcSpecialist: cleanVietnameseText(d.amcSpecialist),
    assignedAppraiser: cleanVietnameseText(d.assignedAppraiser),
    branch: cleanVietnameseText(d.branch),
    legalDocNumber: d.legalDocNumber ? cleanVietnameseText(d.legalDocNumber) : undefined,
  };
}

// GET /api/dossiers - danh sách toàn bộ hồ sơ
router.get('/', async (_req, res) => {
  try {
    const docs = await DossierModel.find().sort({ createdAt: -1 });
    return res.json(docs.map((d) => d.toJSON()));
  } catch (err: any) {
    console.error('[GET /api/dossiers]', err);
    return res.status(500).json({ error: 'Không thể tải danh sách hồ sơ từ database' });
  }
});

// POST /api/dossiers - tạo mới 1 hồ sơ
router.post('/', async (req, res) => {
  try {
    const sanitized = sanitizeDossier(req.body as ValuationDossier);
    const created = await DossierModel.create(sanitized);
    return res.status(201).json(created.toJSON());
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: `Hồ sơ với id "${req.body?.id}" đã tồn tại` });
    }
    console.error('[POST /api/dossiers]', err);
    return res.status(400).json({ error: err?.message || 'Không thể tạo hồ sơ mới' });
  }
});

// PUT /api/dossiers/:id - sửa 1 hồ sơ theo id
router.put('/:id', async (req, res) => {
  try {
    const sanitized = sanitizeDossier({ ...req.body, id: req.params.id } as ValuationDossier);
    const updated = await DossierModel.findOneAndUpdate(
      { id: req.params.id },
      sanitized,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: `Không tìm thấy hồ sơ với id "${req.params.id}"` });
    }
    return res.json(updated.toJSON());
  } catch (err: any) {
    console.error('[PUT /api/dossiers/:id]', err);
    return res.status(400).json({ error: err?.message || 'Không thể cập nhật hồ sơ' });
  }
});

// DELETE /api/dossiers/:id - xóa 1 hồ sơ theo id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await DossierModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ error: `Không tìm thấy hồ sơ với id "${req.params.id}"` });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/dossiers/:id]', err);
    return res.status(500).json({ error: 'Không thể xóa hồ sơ' });
  }
});

// POST /api/dossiers/bulk-import - upsert nhiều hồ sơ (import Excel/Google Sheets)
router.post('/bulk-import', async (req, res) => {
  try {
    const dossiers: ValuationDossier[] = req.body?.dossiers;
    if (!Array.isArray(dossiers) || dossiers.length === 0) {
      return res.status(400).json({ error: 'Danh sách hồ sơ để import không hợp lệ' });
    }
    const sanitized = dossiers.map((d, i) => sanitizeDossier(d, i));
    const ops = sanitized.map((d) => ({
      updateOne: {
        filter: { id: d.id },
        update: { $set: d },
        upsert: true,
      },
    }));
    await DossierModel.bulkWrite(ops);
    return res.json({ success: true, count: sanitized.length });
  } catch (err: any) {
    console.error('[POST /api/dossiers/bulk-import]', err);
    return res.status(500).json({ error: err?.message || 'Không thể import hồ sơ' });
  }
});

// POST /api/dossiers/reset - xóa hết và seed lại dữ liệu mẫu
router.post('/reset', async (_req, res) => {
  try {
    await DossierModel.deleteMany({});
    const sanitizedInitial = INITIAL_DOSSIERS.map((d, i) => sanitizeDossier(d, i));
    const created = await DossierModel.insertMany(sanitizedInitial);
    return res.json(created.map((d) => d.toJSON()));
  } catch (err: any) {
    console.error('[POST /api/dossiers/reset]', err);
    return res.status(500).json({ error: 'Không thể khôi phục dữ liệu mẫu' });
  }
});

export default router;
