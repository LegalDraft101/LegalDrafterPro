import { useEffect } from 'react';
import { makeStyles, tokens, Title1, Title2, Text } from '@fluentui/react-components';
import { PageLayout } from '../../components/common/PageLayout/PageLayout';
import { BackLink } from '../../components/common/BackLink/BackLink';
import { siteName } from '../../constants/content';

const useStyles = makeStyles({
  content: { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' },
  title: { marginBottom: '4px' },
  lastUpdated: { fontSize: '13px', color: tokens.colorNeutralForeground4, marginBottom: '32px' },
  section: { marginBottom: '28px' },
  sectionTitle: { marginBottom: '8px' },
  text: { fontSize: '14px', lineHeight: '1.7', color: tokens.colorNeutralForeground2, marginBottom: '12px' },
  list: { fontSize: '14px', lineHeight: '1.7', color: tokens.colorNeutralForeground2, paddingLeft: '20px', marginBottom: '12px' },
});

export function PrivacyPage() {
  const c = useStyles();
  useEffect(() => {
    document.title = `Privacy Policy — ${siteName}`;
    return () => { document.title = 'LegalDrafter — Online Legal Drafting'; };
  }, []);

  return (
    <PageLayout skipLinkTarget="main-content" constrained>
      <div className={c.content}>
        <Title1 className={c.title}>Privacy Policy</Title1>
        <Text className={c.lastUpdated}>Last updated: February 2026</Text>

        <section className={c.section}><Title2 className={c.sectionTitle}>Introduction</Title2><Text className={c.text}>This Privacy Policy describes how {siteName} collects, uses, and shares information when you use our website and services. By using our services, you agree to the practices described in this policy.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Information We Collect</Title2><Text className={c.text}>We may collect:</Text><ul className={c.list}><li>Account information (name, email, phone) when you register</li><li>Information you provide when using our drafting tools</li><li>Usage data such as pages visited and device information</li><li>Cookies and similar technologies for session management</li></ul></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>How We Use Your Information</Title2><Text className={c.text}>We use collected information to provide, maintain, and improve our services; process your requests; communicate with you; ensure security; and comply with applicable law.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Sharing of Information</Title2><Text className={c.text}>We do not sell your personal information. We may share information with service providers, when required by law, or to protect our rights and safety.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Security</Title2><Text className={c.text}>We implement reasonable technical and organisational measures to protect your data. No method of internet transmission is fully secure.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Your Rights</Title2><Text className={c.text}>Depending on your location, you may have the right to access, correct, delete, or restrict processing of your personal data. Contact us via the Contact page.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Changes to This Policy</Title2><Text className={c.text}>We may update this Privacy Policy from time to time. Continued use constitutes acceptance of the updated policy.</Text></section>

        <BackLink to="/">← Back to home</BackLink>
      </div>
    </PageLayout>
  );
}
