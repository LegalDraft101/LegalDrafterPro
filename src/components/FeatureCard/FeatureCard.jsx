import React from 'react';
import { Card, CardHeader, Text, Subtitle1 } from '@fluentui/react-components';
import './FeatureCard.scss';

function FeatureCard({ icon, title, description, onClick, style, content }) {
    return (
        <Card className="feature-card glass-card" onClick={onClick} style={style}>
            {content ? content : (
                <CardHeader
                    image={icon}
                    header={<Subtitle1>{title}</Subtitle1>}
                    description={<Text>{description}</Text>}
                />
            )}
        </Card>
    );
}

export default FeatureCard;
