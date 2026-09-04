import { Request, Response } from 'express';
import { readJsonData, getDocumentPath, saveUploadFile } from './draft.service';
import { generateAffidavit } from '../../document.service';

export function getAffidavitTypes(_req: Request, res: Response): void {
  const data = readJsonData<unknown[]>('affidavit-types.json');
  if (!data || !Array.isArray(data)) {
    res.status(500).json({ error: 'Failed to load affidavit types' });
    return;
  }
  res.json(data);
}

export function getAffidavitForm(req: Request, res: Response): void {
  const typeId = req.params.typeId as string;
  if (!typeId || !/^[a-z0-9-]+$/.test(typeId)) {
    res.status(400).json({ error: 'Invalid type id' });
    return;
  }
  const data = readJsonData<unknown>(`affidavit-forms/${typeId}.json`);
  if (!data) {
    res.status(404).json({ error: 'Affidavit form not found' });
    return;
  }
  res.json(data);
}

export function getRentAgreementTypes(_req: Request, res: Response): void {
  const data = readJsonData<unknown[]>('rent-agreement-types.json');
  if (!data || !Array.isArray(data)) {
    res.status(500).json({ error: 'Failed to load rent agreement types' });
    return;
  }
  res.json(data);
}

export function getRentAgreementForm(req: Request, res: Response): void {
  const typeId = req.params.typeId as string;
  if (!typeId || !/^[a-z0-9-]+$/.test(typeId)) {
    res.status(400).json({ error: 'Invalid type id' });
    return;
  }
  const data = readJsonData<unknown>(`rent-agreement-forms/${typeId}.json`);
  if (!data) {
    res.status(404).json({ error: 'Rent agreement form not found' });
    return;
  }
  res.json(data);
}

export async function generateAffidavitDocument(req: Request, res: Response): Promise<void> {
  const typeId = req.params.typeId as string;
  if (!typeId || !/^[a-z0-9-]+$/.test(typeId)) {
    res.status(400).json({ error: 'Invalid type id' });
    return;
  }

  const formData = req.body;
  if (!formData || typeof formData !== 'object' || Object.keys(formData).length === 0) {
    res.status(400).json({ error: 'Form data is required' });
    return;
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
}

export function downloadDraft(req: Request, res: Response): void {
  const draftId = req.params.draftId as string;
  if (!draftId || !/^[a-z0-9-]+$/.test(draftId)) {
    res.status(400).json({ error: 'Invalid draft id' });
    return;
  }

  const docPath = getDocumentPath(draftId);
  if (!docPath) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${draftId}.docx"`);
  res.sendFile(docPath);
}

export function uploadDocument(req: Request, res: Response): void {
  if (!req.file || !req.file.buffer) {
    res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    return;
  }
  try {
    const { fileId } = saveUploadFile(req.file.originalname, req.file.buffer);
    res.json({ fileId, originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size });
  } catch (e: unknown) {
    console.error('[upload-document] save error:', e);
    const msg = e instanceof Error ? e.message : 'Upload save failed';
    res.status(500).json({ error: msg });
  }
}
