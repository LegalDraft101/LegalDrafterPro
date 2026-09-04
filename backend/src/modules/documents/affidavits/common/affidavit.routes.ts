import { Router } from 'express';
import multer from 'multer';
import { GENERATED_DIR } from './affidavit.service';
import {
  fetchAllAffidavitFormats,
  fetchAffidavitFormatById,
  saveAffidavitFile,
} from './affidavit.controller';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, GENERATED_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage });

const router = Router();

router.get('/formats', fetchAllAffidavitFormats);
router.get('/formats/:id', fetchAffidavitFormatById);
router.post('/save', upload.single('pdfFile'), saveAffidavitFile);

export default router;
