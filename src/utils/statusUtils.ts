import { organizationService } from '../services';

export interface StatusMeta {
    color: string;
    label: string;
    class: string;
}

/** 4-color system: GREEN=On Track, YELLOW=Due Soon, RED=Overdue/Critical, DARK GRAY=Done. Done overrides all. */
/** 4-color system: GREEN=On Track, ORANGE=Due Soon, RED=Overdue/Critical, DARK GRAY=Done. Done overrides all. */
export const getStatusMeta = (status: string, dueDate?: string, completed?: boolean): StatusMeta => {
    // Rule 1: DONE always overrides everything
    if (completed === true || status === 'Done' || status === 'Completed') {
        return {
            color: '#64748b', // Grey
            label: 'Done',
            class: 'status-done'
        };
    }

    // Manual Overrides
    if (status === 'Critical') return { color: '#ef4444', label: 'Critical', class: 'status-critical' };
    if (status === 'Warning') return { color: '#f97316', label: 'Warning', class: 'status-warning' };
    if (status === 'On Track') return { color: '#22c55e', label: 'On Track', class: 'status-ontrack' };

    if (!dueDate) {
        return {
            color: '#22c55e', // Green
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
            color: '#ef4444', // Red
            label: 'Overdue',
            class: 'status-critical'
        };
    }

    // Rule 2: Due Soon (Near Alert)
    if (due <= thresholdDate) {
        return {
            color: '#f97316', // Orange
            label: 'Due Soon',
            class: 'status-warning'
        };
    }

    // Rule 4: On Track
    return {
        color: '#22c55e', // Green
        label: 'On Track',
        class: 'status-ontrack'
    };
};

/** Inline styles for status badges (background + color). Use with meta.class for consistency. */
export const getStatusBadgeStyles: Record<string, { background: string; color: string }> = {
    'status-critical': { background: '#fee2e2', color: '#ef4444' }, // Red bg, Red text
    'status-warning': { background: '#ffedd5', color: '#c2410c' }, // Orange bg, Dark Orange text
    'status-ontrack': { background: '#dcfce7', color: '#15803d' }, // Green bg, Dark Green text
    'status-done': { background: '#f1f5f9', color: '#64748b' } // Grey bg, Grey text
};

export function getStatusBadgeStyle(status: string, dueDate?: string, completed?: boolean): { background: string; color: string } {
    const meta = getStatusMeta(status, dueDate, completed);
    return getStatusBadgeStyles[meta.class] ?? getStatusBadgeStyles['status-ontrack'];
}
