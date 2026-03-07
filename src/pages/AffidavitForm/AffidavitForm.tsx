import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import {
    Title1, Button, Text, Spinner, Input, Textarea, Field,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions
} from '@fluentui/react-components';
import {
    DocumentArrowDownRegular, EditRegular, ArrowLeftRegular,
    SaveRegular, DocumentRegular, DeleteRegular
} from '@fluentui/react-icons';
import { fetchAffidavitFormatById, saveAffidavitPdf } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModal } from '../../components/features/AuthModal';
import { useDraft } from '../../hooks/useDraft';
import html2pdf from 'html2pdf.js';
import './AffidavitForm.scss';

function AffidavitForm() {
    const { formatId } = useParams();
    const navigate = useNavigate();
    const documentRef = useRef();
    const { user } = useAuth();
    const { requireAuth } = useAuthModal();
    const { saveDraft, loadDraft, deleteDraft, hasDraft } = useDraft(user, 'affidavit', formatId);

    const [formatData, setFormatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [isFinalView, setIsFinalView] = useState(false);

    const [initialFormData, setInitialFormData] = useState({});
    const [showDraftDialog, setShowDraftDialog] = useState(false);
    const [draftMeta, setDraftMeta] = useState(null);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [draftHandled, setDraftHandled] = useState(false);
    const [navigationConfirmed, setNavigationConfirmed] = useState(false);

    const hasUnsavedChanges = useCallback(() => {
        if (!formatData || isFinalView) return false;
        return JSON.stringify(formData) !== JSON.stringify(initialFormData);
    }, [formData, initialFormData, formatData, isFinalView]);

    const blocker = useBlocker(({ currentLocation, nextLocation }) => {
        if (navigationConfirmed) return false;
        if (isFinalView) return false;
        if (currentLocation.pathname === nextLocation.pathname) return false;
        return hasUnsavedChanges();
    });

    useEffect(() => {
        if (blocker.state === 'blocked') {
            if (user) {
                setPendingNavigation(blocker);
                setShowLeaveDialog(true);
            } else {
                blocker.proceed();
            }
        }
    }, [blocker.state, blocker, user]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetchAffidavitFormatById(formatId);
                if (response.success) {
                    setFormatData(response.data);

                    const freshData = {};
                    response.data.fields.forEach(f => {
                        freshData[f.name] = '';
                    });
                    setInitialFormData(freshData);

                    if (user && hasDraft()) {
                        const draft = loadDraft();
                        if (draft) {
                            setDraftMeta(draft);
                            setShowDraftDialog(true);
                            setFormData(freshData);
                        } else {
                            setFormData(freshData);
                            setDraftHandled(true);
                        }
                    } else {
                        setFormData(freshData);
                        setDraftHandled(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch format details", error);
            } finally {
                setLoading(false);
            }
        };

        if (formatId) {
            fetchDetails();
        }
    }, [formatId]);

    const handleRestoreDraft = () => {
        if (draftMeta?.formData && formatData) {
            const freshData = {};
            formatData.fields.forEach(f => { freshData[f.name] = ''; });
            const merged = { ...freshData, ...draftMeta.formData };
            setFormData(merged);
            setInitialFormData(merged);
        }
        setShowDraftDialog(false);
        setDraftHandled(true);
    };

    const handleStartNew = () => {
        deleteDraft();
        const freshData = {};
        if (formatData) {
            formatData.fields.forEach(f => { freshData[f.name] = ''; });
        }
        setFormData(freshData);
        setInitialFormData(freshData);
        setShowDraftDialog(false);
        setDraftHandled(true);
    };

    const handleLeaveSaveDraft = () => {
        saveDraft(formData);
        setShowLeaveDialog(false);
        setNavigationConfirmed(true);
        setTimeout(() => pendingNavigation?.proceed(), 0);
    };

    const handleLeaveDiscard = () => {
        deleteDraft();
        setShowLeaveDialog(false);
        setNavigationConfirmed(true);
        setTimeout(() => pendingNavigation?.proceed(), 0);
    };

    const handleLeaveCancel = () => {
        setShowLeaveDialog(false);
        pendingNavigation?.reset();
        setPendingNavigation(null);
    };

    const handleBack = () => {
        if (hasUnsavedChanges() && user) {
            setPendingNavigation({ proceed: () => navigate(-1), reset: () => {} });
            setShowLeaveDialog(true);
        } else {
            navigate(-1);
        }
    };

    const handleInputChange = (e, data) => {
        const { name } = e.target;
        const value = data ? data.value : e.target.value;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;

        formatData.fields.forEach(field => {
            const val = formData[field.name];

            if (!val || val.toString().trim() === '') {
                errors[field.name] = `${field.label} is required`;
                isValid = false;
            } else if (field.type === 'number') {
                if (isNaN(Number(val))) {
                    errors[field.name] = `Must be a valid number`;
                    isValid = false;
                }
            } else if (field.type === 'date') {
                const dateVal = new Date(val);
                if (isNaN(dateVal.getTime())) {
                    errors[field.name] = `Must be a valid date`;
                    isValid = false;
                }
            }
        });

        setFormErrors(errors);
        return isValid;
    };

    const handleGenerate = () => {
        if (!user) {
            requireAuth(() => handleGenerate());
            return;
        }
        if (validateForm()) {
            deleteDraft();
            setIsFinalView(true);
        } else {
            console.warn("Form validation failed", formErrors);
        }
    };

    const getLivePreviewContent = () => {
        if (!formatData || !formatData.content) return null;

        const blankRegex = /(_{2,}(?:\/_{2,})*)/g;

        const cleanContent = formatData.content
            .replace(/[ \t]+/g, ' ')
            .replace(/\n\s*\n\s*\n+/g, '\n\n');

        const paragraphs = cleanContent.split('\n');

        let globalBlankIndex = 0;

        return paragraphs.map((paragraph, pIdx) => {
            if (!paragraph) {
                return <div key={pIdx} className="paragraph-spacer" style={{ height: '0.75rem' }} />;
            }

            const parts = paragraph.split(blankRegex);

            return (
                <p key={pIdx} className="preview-paragraph">
                    {parts.map((part, i) => {
                        if (i % 2 === 1) {
                            const field = formatData.fields[globalBlankIndex];
                            globalBlankIndex++;

                            if (field && formData[field.name]) {
                                return (
                                    <span key={i} className={isFinalView ? "final-value" : "live-value"} title={!isFinalView ? `Filled from: ${field.label}` : ""}>
                                        {" "}{formData[field.name].trim()}{" "}
                                    </span>
                                );
                            }
                            return <span key={i} className="empty-blank"> {part} </span>;
                        }
                        return <span key={i}>{part}</span>;
                    })}
                </p>
            );
        });
    };

    const handleDownloadPdf = async () => {
        const element = documentRef.current;
        const filename = `${formatData?.title.replace(/\s+/g, '_') || 'Affidavit'}.pdf`;

        const opt = {
            margin: 1,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();

        try {
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
            const response = await saveAffidavitPdf(pdfBlob, filename);
            if (response.success) {
                console.log("Successfully saved PDF to backend:", response.filepath);
            }
        } catch (error) {
            console.error("Failed to save PDF to backend:", error);
        }
    };

    if (loading) {
        return (
            <div className="form-loading-container">
                <Spinner size="huge" label="Loading format details..." />
            </div>
        );
    }

    if (!formatData) {
        return (
            <div className="form-error-container">
                <Text weight="semibold">Failed to load the affidavit format.</Text>
            </div>
        );
    }

    if (isFinalView) {
        return (
            <div className="affidavit-final-page">
                <div className="header-actions split-header">
                    <Button
                        appearance="transparent"
                        icon={<EditRegular />}
                        onClick={() => setIsFinalView(false)}
                    >
                        Edit Details
                    </Button>
                    <Button
                        appearance="primary"
                        icon={<DocumentArrowDownRegular />}
                        onClick={handleDownloadPdf}
                        className="download-btn"
                    >
                        Download PDF
                    </Button>
                </div>

                <div className="final-document-container">
                    <div className="printable-document" ref={documentRef}>
                        {getLivePreviewContent()}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="affidavit-form-page">
            <div className="form-top-bar">
                <Button
                    appearance="subtle"
                    icon={<ArrowLeftRegular />}
                    onClick={handleBack}
                    className="back-btn"
                >
                    Back
                </Button>
                {user && hasUnsavedChanges() && (
                    <Button
                        appearance="subtle"
                        icon={<SaveRegular />}
                        onClick={() => { saveDraft(formData); setInitialFormData(formData); }}
                        className="save-draft-btn"
                    >
                        Save Draft
                    </Button>
                )}
            </div>

            <div className="split-layout">
                <div className="left-pane glass-pane">
                    <Title1 as="h2" className="form-title">{formatData.title}</Title1>
                    <Text className="form-desc">{formatData.description}</Text>

                    <Text size={200} className="required-helper-text">
                        <span className="required-asterisk">*</span> Indicates required field
                    </Text>

                    <div className="form-fields-container">
                        {formatData.fields.map((field) => (
                            <Field
                                key={field.name}
                                label={field.label}
                                required
                                className="dynamic-field"
                                validationMessage={formErrors[field.name]}
                                validationState={formErrors[field.name] ? "error" : "none"}
                            >
                                {field.type === 'textarea' ? (
                                    <Textarea
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleInputChange}
                                        placeholder={`Enter ${field.label}`}
                                        resize="vertical"
                                        className="modern-input"
                                        appearance={formErrors[field.name] ? 'underline' : 'outline'}
                                    />
                                ) : (
                                    <Input
                                        name={field.name}
                                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                                        value={formData[field.name] || ''}
                                        onChange={handleInputChange}
                                        placeholder={`Enter ${field.label}`}
                                        className="modern-input"
                                        appearance={formErrors[field.name] ? 'underline' : 'outline'}
                                    />
                                )}
                            </Field>
                        ))}
                    </div>

                    <Button
                        appearance="primary"
                        size="large"
                        className="generate-btn"
                        onClick={handleGenerate}
                    >
                        Generate
                    </Button>
                </div>

                <div className="right-pane glass-pane preview-pane">
                    <Text weight="semibold" size={500} className="preview-header">Live Preview</Text>
                    <div className="preview-content">
                        <div className="raw-document-text">
                            {getLivePreviewContent()}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={showDraftDialog} modalType="alert">
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Draft Found</DialogTitle>
                        <DialogContent>
                            <Text>
                                You have a saved draft from{' '}
                                {draftMeta?.savedAt ? new Date(draftMeta.savedAt).toLocaleString() : 'earlier'}.
                                Would you like to continue from where you left off?
                            </Text>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" icon={<DeleteRegular />} onClick={handleStartNew}>
                                Start New
                            </Button>
                            <Button appearance="primary" icon={<DocumentRegular />} onClick={handleRestoreDraft}>
                                Restore Draft
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            <Dialog open={showLeaveDialog} modalType="alert">
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Unsaved Changes</DialogTitle>
                        <DialogContent>
                            <Text>
                                You have unsaved changes. Would you like to save them as a draft before leaving?
                            </Text>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={handleLeaveDiscard}>
                                Discard
                            </Button>
                            <Button appearance="outline" onClick={handleLeaveCancel}>
                                Cancel
                            </Button>
                            <Button appearance="primary" icon={<SaveRegular />} onClick={handleLeaveSaveDraft}>
                                Save Draft
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    );
}

export default AffidavitForm;
