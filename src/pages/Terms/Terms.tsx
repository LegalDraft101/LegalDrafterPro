import { useEffect } from 'react';
import { makeStyles, tokens, Title1, Title2, Text, Link as FluentLink } from '@fluentui/react-components';
import { PageLayout } from '../../components/common/PageLayout/PageLayout';
import { BackLink } from '../../components/common/BackLink/BackLink';
import { siteName } from '../../constants/content';

const HELP_EMAIL = 'legaldrafterpro@gmail.com';

const useStyles = makeStyles({
  content: { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' },
  title: { marginBottom: '4px' },
  lastUpdated: { fontSize: '13px', color: tokens.colorNeutralForeground4, marginBottom: '32px' },
  section: { marginBottom: '28px' },
  sectionTitle: { marginBottom: '8px' },
  text: { fontSize: '14px', lineHeight: '1.7', color: tokens.colorNeutralForeground2, marginBottom: '12px' },
  list: { fontSize: '14px', lineHeight: '1.7', color: tokens.colorNeutralForeground2, paddingLeft: '20px', marginBottom: '12px' },
  contactBlock: { padding: '16px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '8px', marginTop: '8px' },
});

export function TermsPage() {
  const c = useStyles();
  useEffect(() => {
    document.title = `Terms of Service — ${siteName}`;
    return () => { document.title = 'LegalDrafter — Online Legal Drafting'; };
  }, []);

  return (
    <PageLayout skipLinkTarget="main-content" constrained>
      <div className={c.content}>
        <Title1 className={c.title}>Terms of Service</Title1>
        <Text className={c.lastUpdated}>Last updated: February 2026</Text>

        <section className={c.section}><Title2 className={c.sectionTitle}>Acceptance of Terms</Title2><Text className={c.text}>By accessing or using the {siteName} website, you agree to be bound by these Terms. If you do not agree, do not use our services.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Description of Service</Title2><Text className={c.text}>{siteName} provides online legal document drafting tools. We do not provide legal advice; our service is limited to drafting only.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Disclaimer</Title2><Text className={c.text}>Our service is provided "as is". We are not responsible for:</Text><ul className={c.list}><li>Accuracy or suitability of any draft for your specific situation</li><li>Any loss or legal consequence from use of drafts</li><li>Outages, errors, or interruptions</li><li>Actions of third parties</li></ul><Text className={c.text}>Review any draft with a qualified professional before use.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>No Legal Advice</Title2><Text className={c.text}>Nothing on this website constitutes legal advice. For legal advice, consult a licensed lawyer.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Acceptable Use</Title2><Text className={c.text}>Use our service only for lawful purposes. Do not misuse the service or attempt unauthorised access.</Text></section>
        <section className={c.section}><Title2 className={c.sectionTitle}>Contact & Help</Title2><Text className={c.text}>For questions, support, or help:</Text><div className={c.contactBlock}><Text>Email: <FluentLink href={`mailto:${HELP_EMAIL}`}>{HELP_EMAIL}</FluentLink></Text></div></section>

        <BackLink to="/">← Back to home</BackLink>
      </div>
    </PageLayout>
  );
}
