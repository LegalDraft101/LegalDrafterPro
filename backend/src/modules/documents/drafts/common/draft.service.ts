import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', '..', '..', '..', '..', 'data');

export function readJsonData<T>(filePath: string): T | null {
  try {
    const full = path.join(DATA_DIR, filePath);
    const raw = fs.readFileSync(full, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getDocumentPath(draftId: string): string | null {
  const docPath = path.join(DATA_DIR, 'drafts', 'documents', `${draftId}.docx`);
  return fs.existsSync(docPath) ? docPath : null;
}

export function saveUploadFile(originalname: string, buffer: Buffer): { fileId: string; filePath: string } {
  const docDir = path.join(DATA_DIR, 'drafts', 'uploads');
  if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
  const ext = originalname.split('.').pop() || 'bin';
  const fileId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = path.join(docDir, fileId);
  fs.writeFileSync(filePath, buffer);
  return { fileId, filePath };
}
