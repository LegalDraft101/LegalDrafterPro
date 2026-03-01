/**
 * Drafting API: affidavit and rent agreement types, form schemas, OCR, and document generation.
 * Data is read from files under data/; generated drafts are saved to data/drafts/.
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  uploadSingle,
  uploadImageSingle,
  extractContent,
  extractText,
} from './ocrController';
import { generateAffidavit } from './services/documentGenerator';

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson<T>(filePath: string): T | null {
  try {
    const full = path.join(DATA_DIR, filePath);
    const raw = fs.readFileSync(full, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const router = Router();

// GET /api/affidavit-types
router.get('/affidavit-types', (_req: Request, res: Response) => {
  const data = readJson<unknown[]>('affidavit-types.json');
  if (!data || !Array.isArray(data)) {
    return res.status(500).json({ error: 'Failed to load affidavit types' });
  }
  res.json(data);
});

// GET /api/affidavit-forms/:typeId
router.get('/affidavit-forms/:typeId', (req: Request, res: Response) => {
  const typeId = req.params.typeId as string;
  if (!typeId || !/^[a-z0-9-]+$/.test(typeId)) {
    return res.status(400).json({ error: 'Invalid type id' });
  }
  const data = readJson<unknown>(`affidavit-forms/${typeId}.json`);
  if (!data) {
    return res.status(404).json({ error: 'Affidavit form not found' });
  }
  res.json(data);
});

// GET /api/rent-agreement-types
router.get('/rent-agreement-types', (_req: Request, res: Response) => {
  const data = readJson<unknown[]>('rent-agreement-types.json');
  if (!data || !Array.isArray(data)) {
    return res.status(500).json({ error: 'Failed to load rent agreement types' });
  }
  res.json(data);
});

// GET /api/rent-agreement-forms/:typeId
router.get('/rent-agreement-forms/:typeId', (req: Request, res: Response) => {
  const typeId = req.params.typeId as string;
  if (!typeId || !/^[a-z0-9-]+$/.test(typeId)) {
    return res.status(400).json({ error: 'Invalid type id' });
  }
  const data = readJson<unknown>(`rent-agreement-forms/${typeId}.json`);
  if (!data) {
    return res.status(404).json({ error: 'Rent agreement form not found' });
  }
  res.json(data);
});

// POST /api/affidavit/generate/:typeId — generate affidavit document from form data
router.post('/affidavit/generate/:typeId', async (req: Request, res: Response) => {
  const typeId = req.params.typeId as string;
  if (!typeId || !/^[a-z0-9-]+$/.test(typeId)) {
    return res.status(400).json({ error: 'Invalid type id' });
  }

  const formData = req.body;
  if (!formData || typeof formData !== 'object' || Object.keys(formData).length === 0) {
    return res.status(400).json({ error: 'Form data is required' });
  }

  try {
    const result = await generateAffidavit(typeId, formData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${result.draftId}.docx"`);
    res.setHeader('X-Draft-Id', result.draftId);
    res.send(result.buffer);
  } catch (err: unknown) {
    console.error('[affidavit/generate]', err);
    const message = err instanceof Error ? err.message : 'Document generation failed';
    res.status(500).json({ error: message });
  }
});

// GET /api/affidavit/download/:draftId — re-download a previously generated document
router.get('/affidavit/download/:draftId', (req: Request, res: Response) => {
  const draftId = req.params.draftId as string;
  if (!draftId || !/^[a-z0-9-]+$/.test(draftId)) {
    return res.status(400).json({ error: 'Invalid draft id' });
  }

  const docPath = path.join(DATA_DIR, 'drafts', 'documents', `${draftId}.docx`);
  if (!fs.existsSync(docPath)) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${draftId}.docx"`);
  res.sendFile(docPath);
});

// POST /api/upload-document — upload a supporting document (Aadhaar, etc.)
router.post('/upload-document', (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('[upload-document] upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    }
    try {
      const docDir = path.join(DATA_DIR, 'drafts', 'uploads');
      if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
      const ext = req.file.originalname.split('.').pop() || 'bin';
      const fileId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = path.join(docDir, fileId);
      fs.writeFileSync(filePath, req.file.buffer);
      res.json({ fileId, originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size });
    } catch (e: unknown) {
      console.error('[upload-document] save error:', e);
      const msg = e instanceof Error ? e.message : 'Upload save failed';
      res.status(500).json({ error: msg });
    }
  });
});

// POST /api/extract-content — extract text from PDF, DOCX, or image (field: "file")
router.post('/extract-content', (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('[extract-content] upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    extractContent(req, res).catch((e) => {
      console.error('[extract-content] extraction error:', e);
      res.status(500).json({ error: e.message || 'Extraction failed' });
    });
  });
});

// POST /api/ocr — legacy image-only OCR (field: "image")
router.post('/ocr', (req, res) => {
  uploadImageSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    extractText(req, res);
  });
});

export const draftRoutes = router;
