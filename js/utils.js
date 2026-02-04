export const Utils = {
    // Generate UUID-like string
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    },

    // Format date nicely
    formatDate: (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('de-DE'); // MSO seems German/European based on screenshot dates "01.01.2025"
    },

    // Calculate Traffic Light Color
    getTrafficLight: (measure) => {
        if (measure.status === 'Done') return 'done';
        if (!measure.dueDate) return 'ontrack';

        const today = new Date();
        const due = new Date(measure.dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'critical'; // Overdue
        if (diffDays <= 7) return 'warning'; // Approaching
        return 'ontrack'; // Safe
    },

    getTrafficLightClass: (status) => {
        switch(status) {
            case 'critical': return 'badge-critical';
            case 'warning': return 'badge-warning';
            case 'ontrack': return 'badge-ontrack';
            case 'done': return 'badge-done';
            default: return 'badge-ontrack';
        }
    },

    getTrafficLightLabel: (status) => {
        switch(status) {
            case 'critical': return 'CRITICAL';
            case 'warning': return 'WARNING';
            case 'ontrack': return 'ON TRACK';
            case 'done': return 'DONE';
            default: return 'UNKNOWN';
        }
    }
};
