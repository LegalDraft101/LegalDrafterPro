import fs from 'fs/promises';
import path from 'path';
import docx from 'mammoth';
import AffidavitModel from '../../models/affidavit/affidavitModel.js';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfPkg = require('pdf-parse');
const pdf = pdfPkg.default || pdfPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AffidavitService {
    /**
     * Fetch all available formats (metadata without file contents)
     */
    static async getAllExistingFormats() {
        const formats = await AffidavitModel.getAllFormats();
        return formats;
    }

    /**
     * Fetch a specific format and read its associated physical file content.
     */
    static async getFormatWithFileContent(id) {
        const formatData = await AffidavitModel.getFormatById(id);

        let fileContent = '';
        try {
            const absoluteFilePath = path.join(__dirname, '../../', formatData.file);
            const ext = path.extname(absoluteFilePath).toLowerCase();

            if (ext === '.pdf') {
                const dataBuffer = await fs.readFile(absoluteFilePath);
                const pdfData = await pdf(dataBuffer);
                fileContent = pdfData.text;
            } else if (ext === '.docx') {
                const docxData = await docx.convertToHtml({ path: absoluteFilePath });
                fileContent = docxData.value
                    .replace(/<\/p>/g, '\n\n')
                    .replace(/<br\s*\/?>/g, '\n')
                    .replace(/<[^>]+>/g, '');
            } else {
                fileContent = await fs.readFile(absoluteFilePath, 'utf8');
            }
        } catch (error) {
            console.error(`Failed to read physical file at ${formatData.file}:`, error);
            throw new Error('Template file could not be read from storage.');
        }

        return {
            ...formatData,
            content: fileContent
        };
    }
}

export default AffidavitService;
