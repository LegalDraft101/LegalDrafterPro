import React, { useState, useEffect } from 'react';
import { Button, Spinner } from '@fluentui/react-components';
import { DocumentArrowUpRegular, DocumentCopyRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { fetchRentAgreementFormats } from '../../services/apiClient';
import CustomDropdown from '../../components/common/CustomDropdown/CustomDropdown';
import '../../styles/inner-page.scss';

function RentAgreement() {
    const navigate = useNavigate();
    const [formats, setFormats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFormat, setSelectedFormat] = useState(null);

    useEffect(() => {
        const getFormats = async () => {
            try {
                const response = await fetchRentAgreementFormats();
                if (response.success) {
                    setFormats(response.data);
                }
            } catch (error) {
                console.error("Failed to load formats", error);
            } finally {
                setLoading(false);
            }
        };
        getFormats();
    }, []);

    return (
        <main className="inner-page">
            <div className="inner-page__header">
                <div className="inner-page__badge">🏠 Rent Agreement</div>
                <h1 className="inner-page__title">Create Your Rent Agreement</h1>
                <p className="inner-page__subtitle">
                    Choose how you want to start — upload your own format or pick from our templates.
                </p>
            </div>

            <div className="inner-page__options">
                <div
                    className="inner-page__option-card"
                    style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                    onClick={() => { if (!loading) console.log('Upload format clicked') }}
                >
                    <DocumentArrowUpRegular className="inner-page__option-icon" />
                    <Button appearance="primary" size="large" disabled={loading} style={{
                        width: '100%',
                        background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        border: 'none',
                        borderRadius: '12px',
                        minHeight: '44px',
                        fontWeight: 600,
                        boxShadow: loading ? 'none' : '0 4px 15px rgba(59,130,246,0.3), 0 0 0 1px rgba(139,92,246,0.15)',
                    }}>
                        Upload Format
                    </Button>
                    <p className="inner-page__option-text">
                        Upload an existing document to use as a template.
                    </p>
                </div>

                <div className="inner-page__divider">OR</div>

                <div className="inner-page__option-card">
                    {loading ? (
                        <div className="inner-page__loading">
                            <Spinner size="large" label="Loading formats..." />
                        </div>
                    ) : (
                        <>
                            <DocumentCopyRegular className="inner-page__option-icon" />
                            <CustomDropdown
                                placeholder="Select a template"
                                options={formats}
                                value={selectedFormat}
                                onChange={setSelectedFormat}
                            />
                            <p className="inner-page__option-text">
                                Choose from our library of expert templates.
                            </p>
                            <Button
                                appearance="primary"
                                style={{
                                    width: '100%',
                                    background: !selectedFormat ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    border: !selectedFormat ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                    borderRadius: '12px',
                                    minHeight: '44px',
                                    fontWeight: 600,
                                    boxShadow: !selectedFormat ? 'none' : '0 4px 15px rgba(59,130,246,0.3), 0 0 0 1px rgba(139,92,246,0.15)',
                                    color: !selectedFormat ? 'rgba(255,255,255,0.2)' : '#fff',
                                }}
                                disabled={!selectedFormat}
                                onClick={() => navigate(`/rent-agreement/${selectedFormat}`)}
                            >
                                Proceed
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}

export default RentAgreement;
