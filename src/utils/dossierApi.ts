import { ValuationDossier } from '../types/dossier';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Lỗi yêu cầu (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse error, keep default message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchDossiers(): Promise<ValuationDossier[]> {
  const res = await fetch('/api/dossiers');
  return handleResponse<ValuationDossier[]>(res);
}

export async function createDossier(dossier: ValuationDossier): Promise<ValuationDossier> {
  const res = await fetch('/api/dossiers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dossier),
  });
  return handleResponse<ValuationDossier>(res);
}

export async function updateDossier(id: string, dossier: ValuationDossier): Promise<ValuationDossier> {
  const res = await fetch(`/api/dossiers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dossier),
  });
  return handleResponse<ValuationDossier>(res);
}

export async function deleteDossier(id: string): Promise<void> {
  const res = await fetch(`/api/dossiers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await handleResponse<{ success: boolean }>(res);
}

export async function bulkImportDossiers(dossiers: ValuationDossier[]): Promise<{ success: boolean; count: number }> {
  const res = await fetch('/api/dossiers/bulk-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dossiers }),
  });
  return handleResponse<{ success: boolean; count: number }>(res);
}

export async function resetDossiers(): Promise<ValuationDossier[]> {
  const res = await fetch('/api/dossiers/reset', { method: 'POST' });
  return handleResponse<ValuationDossier[]>(res);
}
