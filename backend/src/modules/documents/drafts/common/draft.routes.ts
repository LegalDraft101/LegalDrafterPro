import { Router } from 'express';
import {
  getAffidavitTypes,
  getAffidavitForm,
  getRentAgreementTypes,
  getRentAgreementForm,
  generateAffidavitDocument,
  downloadDraft,
  uploadDocument,
} from './draft.controller';
import {
  uploadSingle,
  uploadImageSingle,
  extractContent,
  extractText,
} from '../../../ocr/ocr.controller';

const router = Router();

router.get('/affidavit-types', getAffidavitTypes);
router.get('/affidavit-forms/:typeId', getAffidavitForm);
router.get('/rent-agreement-types', getRentAgreementTypes);
router.get('/rent-agreement-forms/:typeId', getRentAgreementForm);
router.post('/affidavit/generate/:typeId', generateAffidavitDocument);
router.get('/affidavit/download/:draftId', downloadDraft);

router.post('/upload-document', (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('[upload-document] upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    uploadDocument(req, res);
  });
});

router.post('/extract-content', (req, res) => {
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

router.post('/ocr', (req, res) => {
  uploadImageSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    extractText(req, res);
  });
});

export default router;
