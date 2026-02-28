import AffidavitService from '../../services/affidavit/affidavitService.js';

const getFormats = async (req, res) => {
    try {
        const formats = await AffidavitService.getAllExistingFormats();

        res.status(200).json({
            success: true,
            data: formats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
};

const getFormatById = async (req, res) => {
    try {
        const formatId = req.params.id;
        const formatData = await AffidavitService.getFormatWithFileContent(formatId);

        res.status(200).json({
            success: true,
            data: formatData
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const saveGeneratedAffidavit = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }
        res.status(200).json({
            success: true,
            message: 'File successfully saved to backend',
            filepath: `/file_storage/generated_affidavits/${req.file.filename}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error saving file: ' + error.message
        });
    }
};

export {
    getFormats,
    getFormatById,
    saveGeneratedAffidavit
};
