import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The Model's pure job is to retrieve the record objects (the row/document data)
// from the database equivalent (in this case, our JSON file).

const dataPath = path.join(__dirname, '../../data/affidavit/affidavits.json');

class AffidavitModel {
    /**
     * Retrieve all affidavit metadata formats from storage.
     */
    static async getAllFormats() {
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error("Error reading affidavits data:", error);
            throw new Error("Could not retrieve affidavit formats from storage.");
        }
    }

    /**
     * Retrieve a specific affidavit format metadata by its ID.
     */
    static async getFormatById(id) {
        try {
            const formats = await this.getAllFormats();
            const format = formats.find(f => f.id === id);
            if (!format) throw new Error("Format not found.");
            return format;
        } catch (error) {
            console.error("Error finding affidavit format:", error);
            throw error;
        }
    }
}

export default AffidavitModel;
