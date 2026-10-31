import os

# Helper script to generate updated docxExport.ts
with open('src/utils/docxExport.ts', 'r', encoding='utf-8') as f:
    orig = f.read()

# Find cut_point where buildBaoCaoTuVanDocx begins
cut_str = 'export function buildBaoCaoTuVanDocx'
cut_idx = orig.find(cut_str)

# Find where buildThongBaoKetQuaDocx begins
end_str = 'export function buildThongBaoKetQuaDocx'
end_idx = orig.find(end_str)

# Also check comments before them
comment_before = orig.rfind('/**', 0, cut_idx)
comment_after = orig.rfind('/**', 0, end_idx)

print('Cut from:', comment_before, 'to:', comment_after)
