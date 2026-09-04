import { useCallback } from 'react';

const DRAFT_PREFIX = 'ldp_draft_';

function getDraftKey(userId, formType, formatId) {
    return `${DRAFT_PREFIX}${userId}_${formType}_${formatId}`;
}

export function useDraft(user, formType, formatId) {
    const userId = user?.id || user?._id || user?.email;

    const saveDraft = useCallback((formData) => {
        if (!userId) return false;
        try {
            const key = getDraftKey(userId, formType, formatId);
            const payload = {
                formData,
                savedAt: new Date().toISOString(),
                formType,
                formatId,
            };
            localStorage.setItem(key, JSON.stringify(payload));
            return true;
        } catch {
            return false;
        }
    }, [userId, formType, formatId]);

    const loadDraft = useCallback(() => {
        if (!userId) return null;
        try {
            const key = getDraftKey(userId, formType, formatId);
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed;
        } catch {
            return null;
        }
    }, [userId, formType, formatId]);

    const deleteDraft = useCallback(() => {
        if (!userId) return;
        try {
            const key = getDraftKey(userId, formType, formatId);
            localStorage.removeItem(key);
        } catch { /* ignore */ }
    }, [userId, formType, formatId]);

    const hasDraft = useCallback(() => {
        if (!userId) return false;
        try {
            const key = getDraftKey(userId, formType, formatId);
            return localStorage.getItem(key) !== null;
        } catch {
            return false;
        }
    }, [userId, formType, formatId]);

    return { saveDraft, loadDraft, deleteDraft, hasDraft };
}
