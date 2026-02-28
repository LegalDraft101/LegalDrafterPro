import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFormats, getFormatById, saveGeneratedAffidavit } from '../../controllers/affidavit/affidavitController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Set up multer for storing generated PDFs
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../file_storage/generated_affidavits/'));
    },
    filename: function (req, file, cb) {
        // Generate a unique filename: timestamp + original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// @route   GET /api/affidavits/formats
// @desc    Get all existing affidavit formats
// @access  Public
router.get('/formats', getFormats);

// @route   GET /api/affidavits/formats/:id
// @desc    Get a specific affidavit format with its file content by ID
// @access  Public
router.get('/formats/:id', getFormatById);

// @route   POST /api/affidavits/save
// @desc    Save a generated affidavit PDF to the backend
// @access  Public
router.post('/save', upload.single('pdfFile'), saveGeneratedAffidavit);

export default router;
