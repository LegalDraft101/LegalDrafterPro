import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  makeStyles,
  tokens,
  Title1,
  Text,
} from '@fluentui/react-components';
import { PageLayout } from '../components/PageLayout/PageLayout';
import { BackLink } from '../components/BackLink/BackLink';
import { Button, ButtonSubmit } from '../components/Button/Button';
import { TypeCardGrid } from '../components/TypeCardGrid/TypeCardGrid';
import { DynamicForm } from '../components/DynamicForm/DynamicForm';
import { api, type DraftType, type FormSchema } from '../api/index';

const useStyles = makeStyles({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    margin: 0,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
    marginBottom: '8px',
  },
  formHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '8px',
  },
  formWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
});

export function RentAgreementPage() {
  const classes = useStyles();
  const [types, setTypes] = useState<DraftType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, control, handleSubmit, setValue, formState: { errors }, reset } = useForm<Record<string, unknown>>();

  useEffect(() => {
    api.getRentAgreementTypes()
      .then(setTypes)
      .catch(() => toast.error('Failed to load rent agreement types'))
      .finally(() => setLoadingTypes(false));
  }, []);

  useEffect(() => {
    if (!selectedTypeId) { setFormSchema(null); return; }
    setLoadingForm(true);
    api.getRentAgreementForm(selectedTypeId)
      .then((schema) => {
        setFormSchema(schema);
        reset(schema.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.type === 'checkbox' ? false : '' }), {} as Record<string, unknown>));
      })
      .catch(() => { toast.error('Failed to load form'); setSelectedTypeId(null); })
      .finally(() => setLoadingForm(false));
  }, [selectedTypeId, reset]);

  const onFormSubmit = handleSubmit(async (data) => {
    setSubmitLoading(true);
    try {
      console.log('Rent agreement draft data:', { typeId: selectedTypeId, data });
      toast.success('Draft saved. You can download or edit it once document generation is ready.');
      setSelectedTypeId(null);
      setFormSchema(null);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitLoading(false);
    }
  });

  const backToTypes = () => {
    setSelectedTypeId(null);
    setFormSchema(null);
  };

  return (
    <PageLayout skipLinkTarget="main-content" constrained>
      <div className={classes.wrap}>
        {!selectedTypeId ? (
          <>
            <Title1 className={classes.title}>Rent Agreement Drafting</Title1>
            <Text className={classes.subtitle}>Choose the type of rent agreement you need.</Text>
            <TypeCardGrid types={types} onSelect={setSelectedTypeId} loading={loadingTypes} />
          </>
        ) : (
          <>
            <div className={classes.formHeader}>
              <Button variant="ghost" onClick={backToTypes}>← Back to types</Button>
              <Title1 className={classes.title}>
                {loadingForm ? 'Loading form...' : formSchema?.typeName ?? selectedTypeId}
              </Title1>
            </div>
            {formSchema && (
              <form onSubmit={onFormSubmit} noValidate className={classes.formWrap}>
                <DynamicForm
                  fields={formSchema.fields}
                  register={register as never}
                  control={control as never}
                  errors={errors}
                  setValue={setValue}
                />
                <div className={classes.actions}>
                  <ButtonSubmit disabled={submitLoading}>
                    {submitLoading ? 'Saving...' : 'Generate draft'}
                  </ButtonSubmit>
                  <Button variant="secondary" onClick={backToTypes}>Cancel</Button>
                </div>
              </form>
            )}
          </>
        )}
        <BackLink to="/">← Back to home</BackLink>
      </div>
    </PageLayout>
  );
}
