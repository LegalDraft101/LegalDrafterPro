import { useMemo, useState, useCallback } from 'react';
import { Control, Controller, FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { toast } from 'sonner';
import {
  makeStyles,
  tokens,
  Input,
  Textarea,
  Select,
  Checkbox,
  Label,
  Text,
  Spinner,
} from '@fluentui/react-components';
import type { FormField } from '../../api/index';
import { draftingApi } from '../../api/index';
import { ContentExtractor, type TargetField } from '../ContentExtractor/ContentExtractor';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
  },
  required: {
    color: tokens.colorPaletteRedForeground1,
  },
  error: {
    fontSize: '12px',
    color: tokens.colorPaletteRedForeground1,
    marginTop: '2px',
  },
  section: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  sectionFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkboxWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  fileUploadArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fileDropZone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    transitionDuration: '0.15s',
    ':hover': {
      borderTopColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
    },
  },
  fileDropZoneDone: {
    borderTopColor: tokens.colorPaletteGreenBorder1,
    borderRightColor: tokens.colorPaletteGreenBorder1,
    borderBottomColor: tokens.colorPaletteGreenBorder1,
    borderLeftColor: tokens.colorPaletteGreenBorder1,
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  fileHiddenInput: {
    display: 'none',
  },
  fileHint: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
  },
});

interface DynamicFormProps {
  fields: FormField[];
  register: UseFormRegister<Record<string, unknown>>;
  control: Control<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
  setValue?: UseFormSetValue<Record<string, unknown>>;
}

interface FieldSection {
  title: string | null;
  fields: FormField[];
}

interface FileUploadState {
  uploading: boolean;
  fileName: string | null;
  fileId: string | null;
}

function FileUploadField({
  field,
  control,
  errors,
}: {
  field: FormField;
  control: Control<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
}) {
  const [state, setState] = useState<FileUploadState>({ uploading: false, fileName: null, fileId: null });
  const classes = useStyles();

  const handleUpload = useCallback(
    async (file: File, onChange: (val: string) => void) => {
      setState({ uploading: true, fileName: file.name, fileId: null });
      try {
        const result = await draftingApi.uploadDocument(file);
        setState({ uploading: false, fileName: result.originalName, fileId: result.fileId });
        onChange(result.fileId);
        toast.success(`${result.originalName} uploaded successfully.`);
      } catch (err) {
        setState({ uploading: false, fileName: null, fileId: null });
        onChange('');
        const msg = err instanceof Error ? err.message : 'Upload failed';
        toast.error(msg);
      }
    },
    []
  );

  return (
    <Controller
      name={field.name}
      control={control}
      rules={{ required: field.required ? 'Please upload the required document' : false }}
      render={({ field: f }) => (
        <div className={classes.fileUploadArea}>
          <label
            className={`${classes.fileDropZone} ${state.fileId ? classes.fileDropZoneDone : ''}`}
            htmlFor={field.id}
          >
            <input
              id={field.id}
              type="file"
              accept={field.accept}
              className={classes.fileHiddenInput}
              disabled={state.uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleUpload(file, (val) => f.onChange(val));
              }}
            />
            {state.uploading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spinner size="tiny" /> Uploading {state.fileName}...
              </span>
            ) : state.fileId ? (
              <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
                {state.fileName} — Uploaded
              </Text>
            ) : (
              <Text>Click to select file</Text>
            )}
          </label>
          {field.hint && <span className={classes.fileHint}>{field.hint}</span>}
          {errors[field.name] && (
            <span className={classes.error} role="alert">
              {errors[field.name]?.message as string}
            </span>
          )}
        </div>
      )}
    />
  );
}

export function DynamicForm({ fields, register, control, errors, setValue }: DynamicFormProps) {
  const classes = useStyles();

  const sections = useMemo<FieldSection[]>(() => {
    const ordered: FieldSection[] = [];
    const seen = new Set<string | null>();
    for (const field of fields) {
      const key = field.section ?? null;
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push({ title: key, fields: [] });
      }
      ordered.find((s) => s.title === key)!.fields.push(field);
    }
    return ordered;
  }, [fields]);

  const hasSections = sections.some((s) => s.title !== null);

  const extractorTargets = useMemo<TargetField[]>(
    () =>
      fields
        .filter((f) => f.type === 'text' || f.type === 'textarea')
        .map((f) => ({ name: f.name, label: f.label })),
    [fields]
  );

  const handleExtractorPaste = (fieldName: string, text: string) => {
    if (setValue) setValue(fieldName, text, { shouldValidate: true });
  };

  const renderField = (field: FormField) => (
    <div key={field.id} className={classes.fieldGroup}>
      {field.type !== 'checkbox' && field.type !== 'file' && (
        <Label htmlFor={field.id} className={classes.label}>
          {field.label}
          {field.required && <span className={classes.required} aria-hidden> *</span>}
        </Label>
      )}

      {field.type === 'file' && (
        <>
          <Label className={classes.label}>
            {field.label}
            {field.required && <span className={classes.required} aria-hidden> *</span>}
          </Label>
          <FileUploadField field={field} control={control} errors={errors} />
        </>
      )}

      {field.type === 'textarea' && (
        <Textarea
          id={field.id}
          placeholder={field.placeholder}
          rows={3}
          resize="vertical"
          {...register(field.name, { required: field.required ? 'This field is required' : false })}
          aria-invalid={Boolean(errors[field.name])}
        />
      )}

      {field.type === 'select' && (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required ? 'Please select an option' : false }}
          render={({ field: f }) => (
            <Select
              id={field.id}
              value={(f.value as string) ?? ''}
              onChange={(_e, data) => f.onChange(data.value)}
              onBlur={f.onBlur}
              aria-invalid={Boolean(errors[field.name])}
            >
              <option value="">Select...</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          )}
        />
      )}

      {field.type === 'checkbox' && (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required ? 'You must accept this' : false }}
          render={({ field: f }) => (
            <Checkbox
              checked={Boolean(f.value)}
              onChange={(_e, data) => f.onChange(data.checked)}
              label={
                <>
                  {field.label}
                  {field.required && <span className={classes.required} aria-hidden> *</span>}
                </>
              }
            />
          )}
        />
      )}

      {['text', 'number', 'date'].includes(field.type) && (
        <Input
          id={field.id}
          type={field.type as 'text' | 'number'}
          placeholder={field.placeholder}
          {...register(field.name, {
            required: field.required ? 'This field is required' : false,
            ...(field.type === 'number' && { valueAsNumber: true }),
          })}
          aria-invalid={Boolean(errors[field.name])}
        />
      )}

      {field.type !== 'file' && errors[field.name] && (
        <span className={classes.error} role="alert">
          {errors[field.name]?.message as string}
        </span>
      )}
    </div>
  );

  return (
    <div className={classes.form}>
      {setValue && extractorTargets.length > 0 && (
        <ContentExtractor
          targetFields={extractorTargets}
          onPaste={handleExtractorPaste}
        />
      )}

      {hasSections
        ? sections.map((section) => (
            <fieldset key={section.title ?? '__none'} className={classes.section}>
              {section.title && (
                <legend className={classes.sectionTitle}>{section.title}</legend>
              )}
              <div className={classes.sectionFields}>
                {section.fields.map(renderField)}
              </div>
            </fieldset>
          ))
        : fields.map(renderField)}
    </div>
  );
}
