import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createRoutesFromElements, Route, Navigate, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './store';
import { ErrorBoundary } from './components/common/ErrorBoundary/ErrorBoundary';
import App from './App';
import Home from './pages/Home/Home';
import Affidavit from './pages/Affidavit/Affidavit';
import AffidavitForm from './pages/AffidavitForm/AffidavitForm';
import { SignupPage, LoginPage, ForgotPasswordPage, VerifyOtpPage, AccountPage } from './pages/auth';
import RentAgreement from './pages/RentAgreement/RentAgreement';
import RentAgreementForm from './pages/RentAgreementForm/RentAgreementForm';
import { PrivacyPage } from './pages/Privacy/Privacy';
import { TermsPage } from './pages/Terms/Terms';
import { ContactPage } from './pages/Contact/Contact';
import { NotFoundPage } from './pages/NotFound/NotFound';
import './index.scss';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route path="/" element={<Home />} />
      <Route path="/affidavit" element={<Affidavit />} />
      <Route path="/affidavit/:formatId" element={<AffidavitForm />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify" element={<VerifyOtpPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/rent-agreement" element={<RentAgreement />} />
      <Route path="/rent-agreement/:formatId" element={<RentAgreementForm />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/help" element={<Navigate to="/contact" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);
