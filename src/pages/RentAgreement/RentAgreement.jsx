import React, { useState, useEffect } from 'react';
import { Title1, Button, Text, Dropdown, Option, Spinner } from '@fluentui/react-components';
import { DocumentArrowUpRegular, DocumentCopyRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import FeatureCard from '../../components/features/FeatureCard/FeatureCard';
import { fetchRentAgreementFormats } from '../../services/apiClient';
import '../Affidavit/Affidavit.scss';

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

    const renderUploadContent = () => (
        <div className="affidavit-card-content">
            <DocumentArrowUpRegular className="card-icon large-icon" />
            <Button appearance="primary" size="large" className="full-width-btn" disabled={loading}>
                Upload Rent Agreement Format
            </Button>
            <Text align="center">Upload an existing document to use as a template for your new rent agreement.</Text>
        </div>
    );

    const renderExistingContent = () => (
        <div className="affidavit-card-content">
            {loading ? (
                <div className="loading-container">
                    <Spinner size="large" label="Loading formats..." />
                </div>
            ) : (
                <>
                    <DocumentCopyRegular className="card-icon large-icon" />

                    <Dropdown
                        placeholder="Select an existing format"
                        className="full-width-dropdown"
                        onOptionSelect={(e, data) => setSelectedFormat(data.optionValue)}
                    >
                        {formats.map(format => (
                            <Option key={format.id} value={format.id} text={format.title}>
                                <div className="dropdown-option-content">
                                    <Text weight="semibold">{format.title}</Text>
                                    <Text size={200} className="dropdown-option-desc">{format.description}</Text>
                                </div>
                            </Option>
                        ))}
                    </Dropdown>

                    <Text align="center">Choose from our library of expertly drafted rent agreement templates.</Text>

                    <Button
                        appearance="primary"
                        style={{ marginTop: '0.5rem', width: '100%' }}
                        disabled={!selectedFormat}
                        onClick={() => navigate(`/rent-agreement/${selectedFormat}`)}
                    >
                        Proceed
                    </Button>
                </>
            )}
        </div>
    );

    return (
        <main className="main-content">
            <div className="hero-section">
                <Title1 as="h1">Select Rent Agreement Option</Title1>
                <Text className="hero-subtitle">Choose how you want to create your new rent agreement.</Text>
            </div>

            <div className="options-container">
                <FeatureCard
                    style={{ cursor: loading ? 'not-allowed' : 'pointer', maxWidth: '350px', flex: 1, height: '100%' }}
                    onClick={() => { if (!loading) console.log('Upload format clicked') }}
                    content={renderUploadContent()}
                />

                <div className="or-divider">
                    <Text size={500} weight="semibold" className="or-text">OR</Text>
                </div>

                <FeatureCard
                    style={{ maxWidth: '350px', flex: 1, height: '100%' }}
                    content={renderExistingContent()}
                />
            </div>
        </main>
    );
}

export default RentAgreement;
