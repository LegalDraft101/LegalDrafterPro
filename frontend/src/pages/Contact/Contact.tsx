import { useEffect } from 'react';
import { siteName } from '../../constants/content';
import '../../styles/inner-page.scss';

const CONTACT_EMAIL = 'legaldrafterpro@gmail.com';

export function ContactPage() {
  useEffect(() => {
    document.title = `Contact Us — ${siteName}`;
    return () => { document.title = 'LegalDrafter — Online Legal Drafting'; };
  }, []);

  return (
    <main className="inner-page">
      <div className="inner-page__header">
        <div className="inner-page__badge">✉️ Get in Touch</div>
        <h1 className="inner-page__title">Contact Us</h1>
        <p className="inner-page__subtitle">
          For enquiries, support, or feedback about {siteName}, use the details below.
        </p>
      </div>

      <div className="inner-page__panel">
        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Email</h2>
          <div className="inner-page__highlight">
            <p className="inner-page__text" style={{ marginBottom: 0 }}>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
          <p className="inner-page__text" style={{ marginTop: '0.75rem' }}>
            We aim to respond within a few business days.
          </p>
        </section>

        <section className="inner-page__section">
          <h2 className="inner-page__section-title">Help &amp; Support</h2>
          <p className="inner-page__text">
            For help with your account, drafting, or technical issues, email us.
            For legal advice, consult a qualified professional.
          </p>
        </section>
      </div>
    </main>
  );
}
