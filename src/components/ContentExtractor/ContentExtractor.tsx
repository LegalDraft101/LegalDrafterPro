import { useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Textarea,
  Select,
  Spinner,
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronUp20Regular,
  DocumentRegular,
} from '@fluentui/react-icons';
import { draftingApi } from '../../api/index';

export interface TargetField {
  name: string;
  label: string;
}

interface ContentExtractorProps {
  targetFields: TargetField[];
  onPaste: (fieldName: string, text: string) => void;
}

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
].join(',');

const ACCEPT_LABEL = 'PDF, Word (DOCX), Images (JPG, PNG, GIF, WebP)';

const useStyles = makeStyles({
  wrapper: {
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: '20px',
    overflow: 'hidden',
  },
  toggleBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px 16px',
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground3,
    border: 'none',
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
  },
  toggleHint: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    marginLeft: 'auto',
  },
  body: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dropZone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transitionDuration: '0.2s',
    transitionProperty: 'border-color, background-color',
    ':hover': {
      borderTopColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  dropZoneActive: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
  },
  hiddenInput: {
    display: 'none',
  },
  dropContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  resultArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: '14px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  pasteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  pasteLabel: {
    fontSize: '14px',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
});

export function ContentExtractor({ targetFields, onPaste }: ContentExtractorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [sourceType, setSourceType] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState('');
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const classes = useStyles();

  const handleFile = useCallback(async (file: File) => {
    setExtracting(true);
    setExtractedText('');
    setSourceType(null);
    setExpanded(true);
    try {
      const result = await draftingApi.extractContentFromFile(file);
      if (result.text) {
        setExtractedText(result.text);
        setSourceType(result.sourceType);
        toast.success(`Text extracted from ${result.sourceType.toUpperCase()} file.`);
      } else {
        toast.info('No text could be extracted from this file.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      toast.error(msg);
    } finally {
      setExtracting(false);
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePaste = () => {
    if (!selectedField) { toast.error('Please select a field to paste into.'); return; }
    if (!extractedText.trim()) { toast.error('No extracted text to paste.'); return; }
    onPaste(selectedField, extractedText.trim());
    const fieldLabel = targetFields.find((f) => f.name === selectedField)?.label ?? selectedField;
    toast.success(`Content pasted into "${fieldLabel}".`);
  };

  const handleClear = () => {
    setExtractedText('');
    setSourceType(null);
    setSelectedField('');
  };

  return (
    <div className={classes.wrapper}>
      <button
        type="button"
        className={classes.toggleBar}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
        <span>Upload a document to extract content</span>
        <span className={classes.toggleHint}>{ACCEPT_LABEL}</span>
      </button>

      {expanded && (
        <div className={classes.body}>
          <div
            className={`${classes.dropZone} ${dragging ? classes.dropZoneActive : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={onFileSelect}
              className={classes.hiddenInput}
              aria-label="Upload file for content extraction"
            />
            {extracting ? (
              <div className={classes.dropContent}>
                <Spinner size="small" />
                <Text>Extracting text...</Text>
              </div>
            ) : (
              <div className={classes.dropContent}>
                <DocumentRegular style={{ fontSize: 32, color: tokens.colorNeutralForeground3 }} />
                <Text weight="semibold">Drop a file here or click to browse</Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>{ACCEPT_LABEL}</Text>
              </div>
            )}
          </div>

          {extractedText && (
            <div className={classes.resultArea}>
              <div className={classes.resultHeader}>
                <span className={classes.resultLabel}>
                  Extracted text
                  {sourceType && <span className={classes.badge}>{sourceType.toUpperCase()}</span>}
                </span>
                <Button appearance="subtle" size="small" onClick={handleClear}>Clear</Button>
              </div>

              <Textarea
                value={extractedText}
                onChange={(_e, data) => setExtractedText(data.value)}
                rows={8}
                resize="vertical"
                aria-label="Extracted text preview -- editable"
              />

              <div className={classes.pasteRow}>
                <label htmlFor="extractor-field-select" className={classes.pasteLabel}>
                  Paste into:
                </label>
                <Select
                  id="extractor-field-select"
                  value={selectedField}
                  onChange={(_e, data) => setSelectedField(data.value)}
                  style={{ flex: 1, minWidth: 180 }}
                >
                  <option value="">-- Select a field --</option>
                  {targetFields.map((f) => (
                    <option key={f.name} value={f.name}>{f.label}</option>
                  ))}
                </Select>
                <Button
                  appearance="primary"
                  size="small"
                  onClick={handlePaste}
                  disabled={!selectedField || !extractedText.trim()}
                >
                  Paste Content
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
