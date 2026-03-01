import React from 'react';
import { Button, Title1, Input, Switch, Avatar } from '@fluentui/react-components';
import { NavigationRegular } from '@fluentui/react-icons';
import { Link } from 'react-router-dom';
import './Header.scss';

function Header({ isDarkMode, setIsDarkMode }) {
    return (
        <header className="app-header glass-effect">
            <div className="header-left">
                <Button icon={<NavigationRegular />} appearance="transparent" aria-label="Menu" />
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <Title1 className="logo-text">Legal Drafter Pro</Title1>
                </Link>
            </div>
            <div className="header-right">
                <Input placeholder="Search documents..." className="search-input" />
                <Switch
                    checked={isDarkMode}
                    onChange={(e, data) => setIsDarkMode(data.checked)}
                    label="Dark Mode"
                />
                <Avatar name="John Doe" color="brand" />
            </div>
        </header>
    );
}

export default Header;
