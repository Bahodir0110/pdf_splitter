import type { FolderCategory, UploadResponse, SplitResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchFolders(): Promise<FolderCategory[]> {
  const res = await fetch(`${API_BASE}/api/folders`);
  if (!res.ok) {
    throw new Error('Papkalar ro‘yxatini yuklashda xatolik yuz berdi.');
  }
  const data = await res.json();
  return data.folders || [];
}

export async function uploadPdfFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Faylni yuklashda xatolik yuz berdi.');
  }
  return data;
}

export async function executeSplit(
  documentId: string,
  mappings: { folder: string; pages: string }[]
): Promise<SplitResponse> {
  const res = await fetch(`${API_BASE}/api/split`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document_id: documentId,
      mappings,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Sahifalarni ajratishda xatolik yuz berdi.');
  }
  return data;
}

export function getPdfStreamUrl(documentId: string): string {
  return `${API_BASE}/api/pdf/${documentId}`;
}

export function triggerZipDownload() {
  const url = `${API_BASE}/api/download-zip`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
