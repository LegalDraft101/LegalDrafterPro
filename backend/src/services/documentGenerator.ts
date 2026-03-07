import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import fs from 'fs';
import path from 'path';

const DRAFTS_DIR = path.join(__dirname, '..', '..', 'data', 'drafts');
const SUBMISSIONS_DIR = path.join(DRAFTS_DIR, 'submissions');
const DOCUMENTS_DIR = path.join(DRAFTS_DIR, 'documents');

for (const dir of [SUBMISSIONS_DIR, DOCUMENTS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

type FormData = Record<string, unknown>;

function str(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  return String(value);
}

function formatDate(dateStr: unknown): string {
  const s = str(dateStr);
  if (!s) return '___/___/_____';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLong(dateStr: unknown): string {
  const s = str(dateStr);
  if (!s) return '________';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const day = d.getDate();
  const month = d.toLocaleDateString('en-IN', { month: 'long' });
  const year = d.getFullYear();
  return `${day} day of ${month}, ${year}`;
}

function val(data: FormData, key: string, fallback = '_______________'): string {
  const v = str(data[key]).trim();
  return v || fallback;
}

function relationLabel(data: FormData): string {
  return data.relation === 'daughter' ? 'daughter' : 'son';
}

function blankLine(): Paragraph {
  return new Paragraph({ spacing: { after: 120 } });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 300 },
    children: [
      new TextRun({ text, bold: true, size: 32, font: 'Times New Roman' }),
    ],
  });
}

function bodyPara(text: string, opts?: { bold?: boolean; indent?: number; spacing?: number }): Paragraph {
  return new Paragraph({
    spacing: { after: opts?.spacing ?? 180 },
    indent: opts?.indent ? { left: opts.indent } : undefined,
    children: [
      new TextRun({ text, size: 24, font: 'Times New Roman', bold: opts?.bold }),
    ],
  });
}

function numberedPara(num: number, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 180 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${num}.\t`, bold: true, size: 24, font: 'Times New Roman' }),
      new TextRun({ text, size: 24, font: 'Times New Roman' }),
    ],
  });
}

function signatureBlock(name: string, address: string, date: string): Paragraph[] {
  return [
    blankLine(),
    blankLine(),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'DEPONENT/AFFIANT', bold: true, size: 24, font: 'Times New Roman' })],
    }),
    blankLine(),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: '(Signature of Applicant)', italics: true, size: 22, font: 'Times New Roman' })],
    }),
    bodyPara(`Name: ${name}`),
    bodyPara(`Address: ${address}`),
    bodyPara(`Date: ${date}`),
  ];
}

// ──────────────────────────────────────────
// Name Difference Affidavit
// ──────────────────────────────────────────
function buildNameDifferenceDoc(data: FormData): Document {
  const intro = `I, ${val(data, 'deponentName')}, aged ${val(data, 'age')} years, ${relationLabel(data)} of ${val(data, 'fatherName')}, residing at ${val(data, 'permanentAddress')} [Permanent Address], do hereby solemnly affirm and declare as under:`;

  const clause1 = `That my name has been recorded differently in certain official/educational documents. My name appears as ${val(data, 'nameInFirstDoc')} in ${val(data, 'firstDocumentName')}, and as ${val(data, 'nameInSecondDoc')} in ${val(data, 'secondDocumentName')}.`;

  const clause2 = 'That both the aforesaid names refer to one and the same person, i.e., myself. The variation in spelling has occurred inadvertently due to a clerical or typographical error.';

  const clause3 = `That my correct and proper name is ${val(data, 'correctName')}. I shall henceforth use this name for all official, academic, and legal purposes.`;

  const clause4 = 'That this affidavit is being executed to declare and confirm that both name variations denote one and the same person, and may be treated as such by all concerned authorities.';

  const clause5 = 'That the statements made herein are true and correct to the best of my knowledge and belief, and nothing material has been concealed therefrom.';

  const verificationText = `I, the above-named deponent, do hereby verify that the contents of this affidavit are true and correct to the best of my knowledge and belief. Verified at ${val(data, 'verificationPlace')} on this ${formatDateLong(data.verificationDate)}.`;

  return new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [
        heading('AFFIDAVIT'),
        bodyPara(intro),
        numberedPara(1, clause1),
        numberedPara(2, clause2),
        numberedPara(3, clause3),
        numberedPara(4, clause4),
        numberedPara(5, clause5),
        blankLine(),
        bodyPara(`Application Date: ${formatDate(data.applicationDate)}`),
        ...signatureBlock(val(data, 'deponentName'), val(data, 'permanentAddress'), formatDate(data.applicationDate)),

        blankLine(),
        new Paragraph({
          spacing: { before: 300 },
          children: [new TextRun({ text: 'VERIFICATION', bold: true, size: 28, font: 'Times New Roman' })],
        }),
        bodyPara(verificationText),
        ...signatureBlock(val(data, 'deponentName'), val(data, 'permanentAddress'), formatDate(data.verificationDate)),

        blankLine(),
        bodyPara('Attested by:', { bold: true }),
        bodyPara('(Signature & Seal of Advocate / Notary Public)', { spacing: 100 }),
        bodyPara(`Name: ${val(data, 'advocateName', '___________________________')}`),
        bodyPara(`Enrolment No.: ${val(data, 'enrolmentNo', '___________________')}`),
        bodyPara(`Address: ${val(data, 'advocateAddress', '________________________')}`),
      ],
    }],
  });
}

// ──────────────────────────────────────────
// Gap Certificate Affidavit
// ──────────────────────────────────────────
function buildGapCertificateDoc(data: FormData): Document {
  const intro = `I, ${val(data, 'deponentName')}, aged ${val(data, 'age')} years, ${relationLabel(data)} of ${val(data, 'fatherName')}, residing at ${val(data, 'permanentAddress')} [Permanent Address], do hereby solemnly affirm and declare as under:`;

  const clause1 = `That I have completed my last educational qualification, namely ${val(data, 'lastQualification')}, from ${val(data, 'institutionName')} in the year ${val(data, 'yearOfCompletion')}.`;

  const clause2 = `That after completion of my said qualification, there has been a gap in my education from ${formatDate(data.gapFrom)} to ${formatDate(data.gapTo)}, i.e., a period of ${val(data, 'gapDuration')}.`;

  const clause3 = `That the reason for taking this gap was ${val(data, 'reasonForGap')}.`;

  const clause4 = 'That during the said gap period, I was not involved in any unlawful activity and did not undertake any employment/studies other than the stated reason above.';

  const clause5 = `That I now intend to seek admission in ${val(data, 'admissionInstitution')} for continuing my further studies.`;

  const clause6 = 'That this affidavit is made for the purpose of obtaining a Gap Certificate to be submitted to the said institution as part of my admission formalities.';

  const clause7 = 'That the statements made herein are true and correct to the best of my knowledge and belief and nothing material has been concealed therefrom.';

  const verificationText = `I, the above-named deponent, do hereby verify that the contents of this affidavit are true and correct to the best of my knowledge and belief. Verified at ${val(data, 'verificationPlace')} on this ${formatDateLong(data.verificationDate)}.`;

  return new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [
        heading('AFFIDAVIT'),
        bodyPara(intro),
        numberedPara(1, clause1),
        numberedPara(2, clause2),
        numberedPara(3, clause3),
        numberedPara(4, clause4),
        numberedPara(5, clause5),
        numberedPara(6, clause6),
        numberedPara(7, clause7),
        blankLine(),
        bodyPara(`Application Date: ${formatDate(data.applicationDate)}`),
        ...signatureBlock(val(data, 'deponentName'), val(data, 'permanentAddress'), formatDate(data.applicationDate)),

        blankLine(),
        new Paragraph({
          spacing: { before: 300 },
          children: [new TextRun({ text: 'VERIFICATION', bold: true, size: 28, font: 'Times New Roman' })],
        }),
        bodyPara(verificationText),
        ...signatureBlock(val(data, 'deponentName'), val(data, 'permanentAddress'), formatDate(data.verificationDate)),

        blankLine(),
        bodyPara('Attested by:', { bold: true }),
        bodyPara('(Signature & Seal of Advocate / Notary Public)', { spacing: 100 }),
        bodyPara(`Name: ${val(data, 'advocateName', '___________________________')}`),
        bodyPara(`Enrolment No.: ${val(data, 'enrolmentNo', '___________________')}`),
        bodyPara(`Address: ${val(data, 'advocateAddress', '________________________')}`),
      ],
    }],
  });
}

const TEMPLATE_BUILDERS: Record<string, (data: FormData) => Document> = {
  'name-difference': buildNameDifferenceDoc,
  'gap-certificate': buildGapCertificateDoc,
};

export interface GenerationResult {
  draftId: string;
  submissionPath: string;
  documentPath: string;
  buffer: Buffer;
}

export async function generateAffidavit(
  typeId: string,
  formData: FormData
): Promise<GenerationResult> {
  const builder = TEMPLATE_BUILDERS[typeId];
  if (!builder) {
    throw new Error(`Unknown affidavit type: ${typeId}`);
  }

  const draftId = `${typeId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const submissionPath = path.join(SUBMISSIONS_DIR, `${draftId}.json`);
  fs.writeFileSync(submissionPath, JSON.stringify({ typeId, draftId, submittedAt: new Date().toISOString(), formData }, null, 2), 'utf-8');

  const doc = builder(formData);
  const buffer = await Packer.toBuffer(doc);

  const documentPath = path.join(DOCUMENTS_DIR, `${draftId}.docx`);
  fs.writeFileSync(documentPath, buffer);

  return { draftId, submissionPath, documentPath, buffer: Buffer.from(buffer) };
}
