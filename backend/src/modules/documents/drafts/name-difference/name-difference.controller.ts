import { Response } from 'express';
import { createNameDifferenceDraft } from './name-difference.service';
import type { AuthRequest } from '../../../../middleware/auth.middleware';

export async function generateNameDifference(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await createNameDifferenceDraft(req.body, req.user.sub);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${result.draftId}.docx"`);
    res.setHeader('X-Draft-Id', result.draftId);
    res.send(result.buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    res.status(500).json({ error: message });
  }
}
