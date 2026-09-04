import { Request, Response } from 'express';
import { getAllFormats, getFormatWithContent } from './affidavit.service';

export async function fetchAllAffidavitFormats(_req: Request, res: Response): Promise<void> {
  try {
    const formats = await getAllFormats();
    res.status(200).json({ success: true, data: formats });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Server Error: ' + msg });
  }
}

export async function fetchAffidavitFormatById(req: Request, res: Response): Promise<void> {
  try {
    const formatId = req.params.id as string;
    const formatData = await getFormatWithContent(formatId);
    res.status(200).json({ success: true, data: formatData });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(404).json({ success: false, message: msg });
  }
}

export function saveAffidavitFile(req: Request, res: Response): void {
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
}
