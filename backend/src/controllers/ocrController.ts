/**
 * Content extraction: extract text from uploaded files.
 * Supports images (OCR via Tesseract.js), PDFs (pdf-parse), and Word documents (mammoth).
 */

// Polyfill browser globals required by pdfjs-dist (bundled inside pdf-parse) in Node.js
/* eslint-disable @typescript-eslint/no-explicit-any */
const g = globalThis as any;
if (!g.DOMMatrix) g.DOMMatrix = class DOMMatrix { m: number[] = []; constructor() { this.m = [1,0,0,1,0,0]; } };
if (!g.ImageData) g.ImageData = class ImageData { data: Uint8ClampedArray; width: number; height: number; constructor(w: number, h: number) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); } };
if (!g.Path2D) g.Path2D = class Path2D { constructor() {} };
/* eslint-enable @typescript-eslint/no-explicit-any */

import { Request, Response } from 'express';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

const ALLOWED_MIMETYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: images (JPEG, PNG, GIF, WebP, BMP), PDF, Word (DOC/DOCX).'));
    }
  },
});

export const uploadSingle = upload.single('file');

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp|bmp)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});
export const uploadImageSingle = imageUpload.single('image');

async function extractFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    return data.text?.trim() ?? '';
  } finally {
    await worker.terminate().catch(() => {});
  }
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text?.trim() ?? '';
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? '';
}

function isImage(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}

function isPdf(mimetype: string): boolean {
  return mimetype === 'application/pdf';
}

function isDocx(mimetype: string): boolean {
  return (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  );
}

/**
 * Generic content extraction endpoint.
 * POST /api/extract-content  (field name: "file")
 * Returns { text, sourceType } where sourceType is "image" | "pdf" | "docx".
 */
export async function extractContent(req: Request, res: Response): Promise<void> {
  if (!req.file || !req.file.buffer) {
    res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    return;
  }

  const { mimetype, buffer } = req.file;

  try {
    let text = '';
    let sourceType: 'image' | 'pdf' | 'docx' = 'image';

    if (isImage(mimetype)) {
      sourceType = 'image';
      text = await extractFromImage(buffer);
    } else if (isPdf(mimetype)) {
      sourceType = 'pdf';
      text = await extractFromPdf(buffer);
    } else if (isDocx(mimetype)) {
      sourceType = 'docx';
      text = await extractFromDocx(buffer);
    } else {
      res.status(400).json({ error: 'Unsupported file type.' });
      return;
    }

    res.json({ text, sourceType });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Content extraction failed';
    res.status(500).json({ error: message });
  }
}

/**
 * Legacy image-only OCR endpoint (backward compatibility).
 * POST /api/ocr  (field name: "image")
 */
export async function extractText(req: Request, res: Response): Promise<void> {
  if (!req.file || !req.file.buffer) {
    res.status(400).json({ error: 'No image file uploaded. Use field name "image".' });
    return;
  }

  try {
    const text = await extractFromImage(req.file.buffer);
    res.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OCR failed';
    res.status(500).json({ error: message });
  }
}
