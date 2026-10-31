import { ValuationDossier } from '../types/dossier';
import { INITIAL_DOSSIERS } from '../data/mockDossiers';
import { cleanVietnameseText } from './formatters';

const STORAGE_KEY = 'VALUATION_DOSSIERS_APP_DATA_V4';

function computeDefaultDueDate(id: string, index: number): string {
  const now = new Date();
  if (id === 'HS-2026-0802') {
    // Overdue by 2 days
    const d = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (id === 'HS-2026-0803') {
    // Approaching deadline within 16 hours (today)
    const d = new Date(now.getTime() + 16 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (id === 'HS-2024TĐ-AMC5864') {
    return '2024-08-05';
  }
  // Others: 3 to 7 days in the future
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

export function loadDossiers(): ValuationDossier[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeDossier);
      }
    }
  } catch (e) {
    console.error('Failed to load dossiers from localStorage:', e);
  }
  // Default to initial mock data if none exists
  const sanitizedInitial = INITIAL_DOSSIERS.map(sanitizeDossier);
  saveDossiers(sanitizedInitial);
  return sanitizedInitial;
}

export function saveDossiers(dossiers: ValuationDossier[]): void {
  try {
    const sanitized = dossiers.map(sanitizeDossier);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Failed to save dossiers to localStorage:', e);
  }
}

export function resetDossiersToDefault(): ValuationDossier[] {
  const sanitizedInitial = INITIAL_DOSSIERS.map(sanitizeDossier);
  saveDossiers(sanitizedInitial);
  return sanitizedInitial;
}
