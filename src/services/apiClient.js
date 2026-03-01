export const API_BASE_URL = '/api';

export async function fetchHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return await response.json();
    } catch (error) {
        console.error("Health check failed:", error);
        throw error;
    }
}

export async function fetchAffidavitFormats() {
    try {
        const response = await fetch(`${API_BASE_URL}/affidavits/formats`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch affidavit formats:", error);
        throw error;
    }
}

export async function fetchAffidavitFormatById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/affidavits/formats/${id}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch affidavit format with id ${id}:`, error);
        throw error;
    }
}

export async function saveAffidavitPdf(pdfBlob, filename) {
    try {
        const formData = new FormData();
        formData.append('pdfFile', pdfBlob, filename || 'affidavit.pdf');

        const response = await fetch(`${API_BASE_URL}/affidavits/save`, {
            method: 'POST',
            body: formData,
        });

        return await response.json();
    } catch (error) {
        console.error("Failed to save PDF to backend:", error);
        throw error;
    }
}

export async function fetchRentAgreementFormats() {
    try {
        const response = await fetch(`${API_BASE_URL}/rent-agreements/formats`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch rent agreement formats:", error);
        throw error;
    }
}

export async function fetchRentAgreementFormatById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/rent-agreements/formats/${id}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch rent agreement format with id ${id}:`, error);
        throw error;
    }
}

export async function saveRentAgreementPdf(pdfBlob, filename) {
    try {
        const formData = new FormData();
        formData.append('pdfFile', pdfBlob, filename || 'rent-agreement.pdf');

        const response = await fetch(`${API_BASE_URL}/rent-agreements/save`, {
            method: 'POST',
            body: formData,
        });

        return await response.json();
    } catch (error) {
        console.error("Failed to save rent agreement PDF to backend:", error);
        throw error;
    }
}
