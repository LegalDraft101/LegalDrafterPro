import { useEffect } from 'react';
import { siteName } from '../../constants/content';
import '../../styles/inner-page.scss';

const HELP_EMAIL = 'legaldrafterpro@gmail.com';

export function TermsPage() {
  useEffect(() => {
    document.title = `Terms of Service — ${siteName}`;
    return () => { document.title = 'LegalDrafter — Online Legal Drafting'; };
  }, []);

  return (
    <main className="inner-page">
      <div className="inner-page__header">
        <div className="inner-page__badge">📋 Terms</div>
        <h1 className="inner-page__title">Terms of Service</h1>
        <p className="inner-page__meta">Last updated: February 2026</p>
      </div>

      <div className="inner-page__panel">
        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Acceptance of Terms</h2>
          <p className="inner-page__text">
            By accessing or using the {siteName} website, you agree to be bound by these Terms. If you do not agree, do not use our services.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Description of Service</h2>
          <p className="inner-page__text">
            {siteName} provides online legal document drafting tools. We do not provide legal advice; our service is limited to drafting only.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Disclaimer</h2>
          <p className="inner-page__text">Our service is provided "as is". We are not responsible for:</p>
          <ul className="inner-page__list">
            <li>Accuracy or suitability of any draft for your specific situation</li>
            <li>Any loss or legal consequence from use of drafts</li>
            <li>Outages, errors, or interruptions</li>
            <li>Actions of third parties</li>
          </ul>
          <p className="inner-page__text">
            Review any draft with a qualified professional before use.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">No Legal Advice</h2>
          <p className="inner-page__text">
            Nothing on this website constitutes legal advice. For legal advice, consult a licensed lawyer.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Acceptable Use</h2>
          <p className="inner-page__text">
            Use our service only for lawful purposes. Do not misuse the service or attempt unauthorised access.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Contact &amp; Help</h2>
          <p className="inner-page__text">For questions, support, or help:</p>
          <div className="inner-page__highlight">
            <p className="inner-page__text" style={{ marginBottom: 0 }}>
              Email: <a href={`mailto:${HELP_EMAIL}`}>{HELP_EMAIL}</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
