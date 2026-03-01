import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { AuthInit } from './components/features/AuthInit/AuthInit';
import { BackendBanner } from './components/layout/BackendBanner/BackendBanner';
import { Navbar } from './components/layout/Navbar/Navbar';
import { Footer } from './components/layout/Footer/Footer';
import Home from './pages/Home/Home';
import Affidavit from './pages/Affidavit/Affidavit';
import AffidavitForm from './pages/AffidavitForm/AffidavitForm';
import { SignupPage, LoginPage, ForgotPasswordPage, VerifyOtpPage, AccountPage } from './pages/auth';
import { RentAgreementPage } from './pages/RentAgreement/RentAgreement';
import { PrivacyPage } from './pages/Privacy/Privacy';
import { TermsPage } from './pages/Terms/Terms';
import { ContactPage } from './pages/Contact/Contact';
import { NotFoundPage } from './pages/NotFound/NotFound';
import './App.scss';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme} className="fluent-root">
      <AuthInit>
        <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
          <BackendBanner />
          <Navbar />
          <Routes>
            {/* Existing routes */}
            <Route path="/" element={<Home />} />
            <Route path="/affidavit" element={<Affidavit />} />
            <Route path="/affidavit/:formatId" element={<AffidavitForm isDarkMode={isDarkMode} />} />
            {/* Auth routes */}
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify" element={<VerifyOtpPage />} />
            <Route path="/account" element={<AccountPage />} />
            {/* Content routes */}
            <Route path="/rent-agreement" element={<RentAgreementPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<Navigate to="/contact" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
        </div>
      </AuthInit>
    </FluentProvider>
  );
}

export default App;
