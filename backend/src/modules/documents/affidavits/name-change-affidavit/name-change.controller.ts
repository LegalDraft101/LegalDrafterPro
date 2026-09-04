import { Request, Response } from 'express';
import { processNameChangeAffidavit } from './name-change.service';

export async function handleNameChange(req: Request, res: Response): Promise<void> {
  try {
    const result = await processNameChangeAffidavit(req.body);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    res.status(500).json({ success: false, error: message });
  }
}
