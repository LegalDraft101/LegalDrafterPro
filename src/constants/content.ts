export const siteName = 'LegalDrafter';
export const tagline = 'Online legal drafting. Nothing beyond drafting.';
export const hero = {
  headline: 'Professional legal drafts, done right',
  subheadline:
    'We provide online legal drafting services. Create affidavits, rent agreements, and more.',
  ctaLabel: 'Start Drafting Now',
};
export const ctaSection = {
  title: 'Start Drafting Now',
  subtitle: 'Choose a document type to begin. No signup required to explore.',
};
export interface DraftingCategory {
  id: string;
  name: string;
  description: string;
  path: string;
  icon?: string;
}
export const draftingCategories: DraftingCategory[] = [
  {
    id: 'affidavit',
    name: 'Affidavit Drafting',
    description: 'Draft legally sound affidavits for court, notary, or official use.',
    path: '/affidavit',
    icon: '📄',
  },
  {
    id: 'rent-agreement',
    name: 'Rent Agreement Drafting',
    description: 'Create clear, standard rent agreements for landlords and tenants.',
    path: '/rent-agreement',
    icon: '🏠',
  },
];
export const categoriesSection = {
  heading: 'Drafting categories',
  subheading: 'Select a document type to start. More document types coming soon.',
};
export const footer = {
  about:
    'LegalDrafter provides online legal drafting services. We focus only on drafting—no legal advice.',
  contactLabel: 'Contact Us',
  copyright: '© 2026 LegalDrafter. All rights reserved.',
  links: [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Contact', path: '/contact' },
    { label: 'Help', path: '/help' },
  ],
};
export const meta = {
  title: 'LegalDrafter — Online Legal Drafting',
  description:
    'Professional online legal drafting. Create affidavits, rent agreements, and more. Nothing beyond drafting.',
};
