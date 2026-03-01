/**
 * Legacy affidavit routes — ported from the original backend/ JS code.
 * Serves the old frontend pages (Affidavit/AffidavitForm) that use /api/affidavits/*.
 * Reads template files from file_storage/affidavits/ and metadata from data/affidavit/affidavits.json.
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import multer from 'multer';
import mammoth from 'mammoth';

const pdfParse = require('pdf-parse');

const BACKEND_ROOT = path.join(__dirname, '..', '..');
const DATA_PATH = path.join(BACKEND_ROOT, 'data', 'affidavit', 'affidavits.json');
const FILE_STORAGE_ROOT = BACKEND_ROOT;
const GENERATED_DIR = path.join(BACKEND_ROOT, 'file_storage', 'generated_affidavits');

if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

interface AffidavitFormat {
  id: string;
  title: string;
  description: string;
  category: string;
  file: string;
  fields: Array<{ name: string; label: string; type: string }>;
}

async function getAllFormats(): Promise<AffidavitFormat[]> {
  const data = await fsp.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(data) as AffidavitFormat[];
}

async function getFormatById(id: string): Promise<AffidavitFormat> {
  const formats = await getAllFormats();
  const format = formats.find(f => f.id === id);
  if (!format) throw new Error('Format not found.');
  return format;
}

async function getFormatWithContent(id: string): Promise<AffidavitFormat & { content: string }> {
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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, GENERATED_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage });

const router = Router();

router.get('/formats', async (_req: Request, res: Response) => {
  try {
    const formats = await getAllFormats();
    res.status(200).json({ success: true, data: formats });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Server Error: ' + msg });
  }
});

router.get('/formats/:id', async (req: Request, res: Response) => {
  try {
    const formatId = req.params.id as string;
    const formatData = await getFormatWithContent(formatId);
    res.status(200).json({ success: true, data: formatData });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(404).json({ success: false, message: msg });
  }
});

router.post('/save', upload.single('pdfFile'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'File successfully saved to backend',
      filepath: `/file_storage/generated_affidavits/${req.file.filename}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Error saving file: ' + msg });
  }
});

export const legacyAffidavitRoutes = router;
