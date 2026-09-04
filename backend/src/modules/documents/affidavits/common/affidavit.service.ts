import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import type { AffidavitFormat } from './affidavit.schema';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

const BACKEND_ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const DATA_PATH = path.join(BACKEND_ROOT, 'data', 'affidavit', 'affidavits.json');
const FILE_STORAGE_ROOT = BACKEND_ROOT;
export const GENERATED_DIR = path.join(BACKEND_ROOT, 'file_storage', 'generated_affidavits');

if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

export async function getAllFormats(): Promise<AffidavitFormat[]> {
  const data = await fsp.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(data) as AffidavitFormat[];
}

export async function getFormatById(id: string): Promise<AffidavitFormat> {
  const formats = await getAllFormats();
  const format = formats.find(f => f.id === id);
  if (!format) throw new Error('Format not found.');
  return format;
}

export async function getFormatWithContent(id: string): Promise<AffidavitFormat & { content: string }> {
  const format = await getFormatById(id);
  let fileContent = '';

  const absoluteFilePath = path.join(FILE_STORAGE_ROOT, format.file);
  const ext = path.extname(absoluteFilePath).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = await fsp.readFile(absoluteFilePath);
    const pdfData = await pdfParse(dataBuffer);
    fileContent = pdfData.text;
  } else if (ext === '.docx') {
    const docxData = await mammoth.convertToHtml({ path: absoluteFilePath });
    fileContent = docxData.value
      .replace(/<\/p>/g, '\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, '');
  } else {
    fileContent = await fsp.readFile(absoluteFilePath, 'utf-8');
  }

  return { ...format, content: fileContent };
}
