import { Request, Response } from 'express';
import { createNameDifferenceDraft } from './name-difference.service';

export async function generateNameDifference(req: Request, res: Response): Promise<void> {
  try {
    const result = await createNameDifferenceDraft(req.body);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${result.draftId}.docx"`);
    res.setHeader('X-Draft-Id', result.draftId);
    res.send(result.buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    res.status(500).json({ error: message });
  }
}
