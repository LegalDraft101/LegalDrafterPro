export interface AffidavitFormat {
  id: string;
  title: string;
  description: string;
  category: string;
  file: string;
  fields: Array<{ name: string; label: string; type: string }>;
}
