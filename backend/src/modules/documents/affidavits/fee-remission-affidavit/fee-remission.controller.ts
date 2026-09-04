import { Request, Response } from 'express';
import { processFeeRemissionAffidavit } from './fee-remission.service';

export async function handleFeeRemission(req: Request, res: Response): Promise<void> {
  try {
    const result = await processFeeRemissionAffidavit(req.body);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    res.status(500).json({ success: false, error: message });
  }
}
