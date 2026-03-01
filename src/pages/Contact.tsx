import { useEffect } from 'react';
import { makeStyles, tokens, Title1, Title2, Text, Link as FluentLink } from '@fluentui/react-components';
import { PageLayout } from '../components/PageLayout/PageLayout';
import { BackLink } from '../components/BackLink/BackLink';
import { siteName } from '../static/content';

const CONTACT_EMAIL = 'legaldrafterpro@gmail.com';

const useStyles = makeStyles({
  content: { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' },
  title: { marginBottom: '12px' },
  section: { marginBottom: '28px' },
  sectionTitle: { marginBottom: '8px' },
  text: { fontSize: '14px', lineHeight: '1.7', color: tokens.colorNeutralForeground2, marginBottom: '12px' },
  contactBlock: { padding: '16px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '8px', marginTop: '8px' },
  subText: { fontSize: '13px', color: tokens.colorNeutralForeground4, marginTop: '8px' },
});

export function ContactPage() {
  const c = useStyles();
  useEffect(() => {
    document.title = `Contact Us — ${siteName}`;
    return () => { document.title = 'LegalDrafter — Online Legal Drafting'; };
  }, []);

  return (
    <PageLayout skipLinkTarget="main-content" constrained>
      <div className={c.content}>
        <Title1 className={c.title}>Contact Us</Title1>
        <Text className={c.text}>We'd like to hear from you. For enquiries, support, or feedback about {siteName}, use the details below.</Text>

        <section className={c.section}>
          <Title2 className={c.sectionTitle}>Email</Title2>
          <div className={c.contactBlock}>
            <Text><FluentLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</FluentLink></Text>
            <Text className={c.subText}>We aim to respond within a few business days.</Text>
          </div>
        </section>

        <section className={c.section}>
          <Title2 className={c.sectionTitle}>Help & Support</Title2>
          <Text className={c.text}>For help with your account, drafting, or technical issues, email us. For legal advice, consult a qualified professional.</Text>
        </section>

        <BackLink to="/">← Back to home</BackLink>
      </div>
    </PageLayout>
  );
}
