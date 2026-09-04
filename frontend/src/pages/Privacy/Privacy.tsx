import { useEffect } from 'react';
import { siteName } from '../../constants/content';
import '../../styles/inner-page.scss';

export function PrivacyPage() {
  useEffect(() => {
    document.title = `Privacy Policy — ${siteName}`;
    return () => { document.title = 'LegalDrafter — Online Legal Drafting'; };
  }, []);

  return (
    <main className="inner-page">
      <div className="inner-page__header">
        <div className="inner-page__badge">🔒 Privacy</div>
        <h1 className="inner-page__title">Privacy Policy</h1>
        <p className="inner-page__meta">Last updated: February 2026</p>
      </div>

      <div className="inner-page__panel">
        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Introduction</h2>
          <p className="inner-page__text">
            This Privacy Policy describes how {siteName} collects, uses, and shares information when you use our website and services. By using our services, you agree to the practices described in this policy.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Information We Collect</h2>
          <p className="inner-page__text">We may collect:</p>
          <ul className="inner-page__list">
            <li>Account information (name, email, phone) when you register</li>
            <li>Information you provide when using our drafting tools</li>
            <li>Usage data such as pages visited and device information</li>
            <li>Cookies and similar technologies for session management</li>
          </ul>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">How We Use Your Information</h2>
          <p className="inner-page__text">
            We use collected information to provide, maintain, and improve our services; process your requests; communicate with you; ensure security; and comply with applicable law.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Sharing of Information</h2>
          <p className="inner-page__text">
            We do not sell your personal information. We may share information with service providers, when required by law, or to protect our rights and safety.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Security</h2>
          <p className="inner-page__text">
            We implement reasonable technical and organisational measures to protect your data. No method of internet transmission is fully secure.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Your Rights</h2>
          <p className="inner-page__text">
            Depending on your location, you may have the right to access, correct, delete, or restrict processing of your personal data. Contact us via the Contact page.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Changes to This Policy</h2>
          <p className="inner-page__text">
            We may update this Privacy Policy from time to time. Continued use constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </main>
  );
}
