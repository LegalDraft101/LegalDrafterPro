import React from 'react';
import { Title1, Text, Button } from '@fluentui/react-components';
import { DocumentRegular, SettingsRegular, AlertRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import FeatureCard from '../../components/FeatureCard/FeatureCard';
import './Home.scss';

function Home() {
    const navigate = useNavigate();

    return (
        <main className="main-content">
            <div className="hero-section">
                <Title1 as="h1">Welcome to Legal Drafter Pro</Title1>
                <Text className="hero-subtitle">Draft professional legal documents in minutes with AI assistance.</Text>
                <Button
                    appearance="primary"
                    size="large"
                    className="cta-button"
                    onClick={() => navigate('/affidavit')}
                >
                    Generate Affidavit
                </Button>
            </div>

            <div className="features-grid">
                <FeatureCard
                    icon={<DocumentRegular className="card-icon" />}
                    title="Smart Templates"
                    description="Pre-built templates for all your needs."
                />
                <FeatureCard
                    icon={<SettingsRegular className="card-icon" />}
                    title="Advanced Customization"
                    description="Tailor every clause to your specific case."
                />
                <FeatureCard
                    icon={<AlertRegular className="card-icon" />}
                    title="Risk Analysis"
                    description="Identify potential blindspots in your drafts automatically."
                />
            </div>
        </main>
    );
}

export default Home;
