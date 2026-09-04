import { Request, Response } from 'express';
import { processRentAgreement } from './rent-agreement.service';

export async function handleRentAgreement(req: Request, res: Response): Promise<void> {
  try {
    const result = await processRentAgreement(req.body);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    res.status(500).json({ success: false, error: message });
  }
}
