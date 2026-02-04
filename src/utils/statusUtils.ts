import { organizationService } from '../services';

export interface StatusMeta {
    color: string;
    label: string;
    class: string;
}

/** 4-color system: GREEN=On Track, YELLOW=Due Soon, RED=Overdue/Critical, DARK GRAY=Done. Done overrides all. */
export const getStatusMeta = (status: string, dueDate?: string, completed?: boolean): StatusMeta => {
    // Rule 1: DONE always overrides everything (never green/yellow/red)
    if (completed === true || status === 'Done' || status === 'Completed') {
        return {
            color: 'var(--color-status-done)',
            label: 'Done',
            class: 'status-done'
        };
    }

    if (!dueDate) {
        return {
            color: 'var(--color-status-green)',
            label: 'On Track',
            class: 'status-ontrack'
        };
    }

    const now = new Date();
    const due = new Date(dueDate);
    due.setHours(23, 59, 59, 999); // End of day

    const governance = organizationService.getGovernance();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + (governance.dueSoonThreshold || 7));

    // Rule 3: Overdue
    if (due < now) {
        return {
            color: 'var(--color-status-red)',
            label: 'Overdue',
            class: 'status-critical'
        };
    }

    // Rule 2: Due Soon
    if (due <= thresholdDate) {
        return {
            color: 'var(--color-status-yellow)',
            label: 'Due Soon',
            class: 'status-warning'
        };
    }

    // Rule 4: On Track
    return {
        color: 'var(--color-status-green)',
        label: 'On Track',
        class: 'status-ontrack'
    };
};

/** Inline styles for status badges (background + color). Use with meta.class for consistency. */
export const getStatusBadgeStyles: Record<string, { background: string; color: string }> = {
    'status-critical': { background: '#fee2e2', color: 'var(--color-status-red)' },
    'status-warning': { background: '#fef9c3', color: '#854d0e' },
    'status-ontrack': { background: '#dcfce7', color: 'var(--color-status-green)' },
    'status-done': { background: '#e2e8f0', color: 'var(--color-status-done)' }
};

export function getStatusBadgeStyle(status: string, dueDate?: string, completed?: boolean): { background: string; color: string } {
    const meta = getStatusMeta(status, dueDate, completed);
    return getStatusBadgeStyles[meta.class] ?? getStatusBadgeStyles['status-ontrack'];
}
