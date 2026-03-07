import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { AuthInit } from './components/features/AuthInit/AuthInit';
import { AuthModalProvider, AuthModal } from './components/features/AuthModal';
import { BackendBanner } from './components/layout/BackendBanner/BackendBanner';
import { Navbar } from './components/layout/Navbar/Navbar';
import { Footer } from './components/layout/Footer/Footer';
import './App.scss';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme} className="fluent-root">
      <AuthInit>
        <AuthModalProvider>
          <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <BackendBanner />
            <Navbar />
            <Outlet />
            <Footer />
          </div>
          <AuthModal />
        </AuthModalProvider>
      </AuthInit>
    </FluentProvider>
  );
}

export default App;
