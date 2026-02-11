import { Status, Step } from '../types';

export const getStatusColor = (status: Status | string, deadline?: string): string => {
    // Normalize input
    const normalized = normalizeStatus(status);

    // Explicit Status Logic
    switch (normalized) {
        case 'Critical':
            return 'var(--color-status-red)';
        case 'Warning':
            return 'var(--color-status-yellow)';
        case 'Monitoring':
            return 'var(--color-status-green)';
        case 'Done':
            return 'var(--color-status-done)';
    }

    // Fallback: Deadline Logic if provided and status is not one of the above
    if (deadline) {
        const now = new Date();
        const due = new Date(deadline);
        if (!isNaN(due.getTime())) {
            const diff = due.getTime() - now.getTime();
            const days = diff / (1000 * 3600 * 24);

            if (days < 0) return 'var(--color-status-red)'; // Critical
            if (days <= 7) return 'var(--color-status-yellow)'; // Warning (transferred from Due Soon)
            return 'var(--color-status-green)'; // Monitoring
        }
    }

    return 'var(--color-status-green)'; // Default to Monitoring
};

export const getStatusBgColor = (status: Status | string, deadline?: string): string => {
    // Normalize input
    const normalized = normalizeStatus(status);

    switch (normalized) {
        case 'Critical':
            return '#FEF2F2'; // red-50
        case 'Warning':
            return '#FFFBEB'; // amber-50
        case 'Monitoring':
            return '#ECFDF5'; // emerald-50
        case 'Done':
            return '#F1F5F9'; // slate-100
    }

    // Fallback Deadline Logic
    if (deadline) {
        const now = new Date();
        const due = new Date(deadline);
        if (!isNaN(due.getTime())) {
            const diff = due.getTime() - now.getTime();
            const days = diff / (1000 * 3600 * 24);

            if (days < 0) return '#FEF2F2';
            if (days <= 7) return '#FFFBEB';
            return '#ECFDF5';
        }
    }

    return '#ECFDF5'; // Default to Monitoring BG
};

export const getStatusStyles = (status: Status | string, deadline?: string) => {
    const color = getStatusColor(status, deadline);
    const bg = getStatusBgColor(status, deadline);

    return {
        backgroundColor: bg,
        color: color,
        border: `1px solid ${color}40`,
    };
};

export const getStatusLabel = (t: (key: string) => string, status: Status | string, deadline?: string): string => {
    const normalized = normalizeStatus(status);

    // If status is explicit, translate and return
    if (['Critical', 'Warning', 'Monitoring', 'Done'].includes(normalized)) {
        const key = normalized.toLowerCase();
        const translated = t(`status.${key}`);
        return translated !== `status.${key}` ? translated : normalized;
    }

    // Fallback Deadline Logic -> Must return one of the 4 allowed statuses
    if (deadline) {
        const now = new Date();
        const due = new Date(deadline);
        if (!isNaN(due.getTime())) {
            const diff = due.getTime() - now.getTime();
            const days = diff / (1000 * 3600 * 24);

            if (days < 0) return t('status.critical') || 'Critical';
            if (days <= 7) return t('status.warning') || 'Warning'; // Map Due Soon to Warning
            return t('status.monitoring') || 'Monitoring';
        }
    }

    return t('status.monitoring') || 'Monitoring';
};

// Normalize internal codes to standard Status
export const normalizeStatus = (statusCode: string): Status | string => {
    if (!statusCode) return '';
    const code = statusCode.toLowerCase();

    if (code.includes('monitoring') || code.includes('ontrack') || code === 'on track' || code === 'pdca.monitoring' || code === 'pdca.ontrack') {
        return 'Monitoring';
    }
    if (code.includes('warning') || code === 'pdca.warning' || code === 'pdca.warningnearalert' || code === 'due soon' || code === 'duesoon') {
        return 'Warning';
    }
    if (code.includes('critical') || code === 'pdca.critical' || code === 'pdca.criticalalert' || code === 'overdue') {
        return 'Critical';
    }
    if (code === 'done') {
        return 'Done';
    }

    return statusCode;
};

// --- Adaptation for Legacy Components ---

export const getStatusBadgeStyle = (status: Status | string, deadline?: string) => {
    const color = getStatusColor(status, deadline);
    const bg = getStatusBgColor(status, deadline);

    return {
        backgroundColor: bg,
        color: color,
        border: '1px solid transparent'
    };
};

export const getStatusMeta = (status: Status | Step | string, deadline?: string, isAct?: boolean, t?: (key: string) => string) => {
    const color = getStatusColor(status as string, deadline);
    const normalized = normalizeStatus(status as string);

    let label = normalized;
    if (t) {
        const key = normalized.toLowerCase();
        label = t(`status.${key}`);
    }

    // Fallback label logic for deadline if status isn't clear
    if (!normalized && deadline) {
        const now = new Date();
        const due = new Date(deadline);
        if (!isNaN(due.getTime())) {
            const diff = due.getTime() - now.getTime();
            const days = diff / (1000 * 3600 * 24);
            if (days < 0) label = t ? t('status.critical') : 'Critical';
            else if (days <= 7) label = t ? t('status.warning') : 'Warning';
            else label = t ? t('status.monitoring') : 'Monitoring';
        }
    }

    // Class mapping - restricted to the 4 core classes
    let className = 'status-ontrack'; // For Monitoring
    if (normalized === 'Critical') className = 'status-critical';
    if (normalized === 'Warning') className = 'status-warning';
    if (normalized === 'Done') className = 'status-done';

    return { label, color, class: className };
};
