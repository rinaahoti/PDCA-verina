import { Utils } from './utils.js';

const SEED_DATA = {
    users: [
        { id: 'u1', name: 'Admin User', email: 'admin@mso.de', role: 'admin', avatar: '🛡️' },
        { id: 'u2', name: 'Sophia Mayer', email: 'sophia.mayer@mso.de', role: 'owner', avatar: '👩‍💼' }, // The Owner in screenshots
        { id: 'u3', name: 'Felix Worker', email: 'felix@mso.de', role: 'user', avatar: '👨‍🔧' },
        { id: 'u4', name: 'Julia Manager', email: 'julia@mso.de', role: 'client_admin', avatar: '👩‍💻' }
    ],
    templates: [
        {
            id: 't1',
            name: 'PDCA Measure',
            steps: ['Plan', 'Do', 'Check', 'Act'],
            fields: [
                { id: 'f1', label: 'Description', type: 'richtext', step: 'Plan' },
                { id: 'f2', label: 'Root Cause', type: 'richtext', step: 'Plan' },
                { id: 'f3', label: 'Implementation Date', type: 'date', step: 'Do' },
                { id: 'f4', label: 'Effectiveness Check', type: 'yesno', step: 'Check' }
            ]
        },
        {
            id: 't2',
            name: 'Audit Finding',
            steps: ['Identification', 'Correction', 'Verification'],
            fields: []
        }
    ],
    measures: [
        {
            id: '9',
            title: 'Outdated Process Model',
            ownerId: 'u2', // Sophia
            responsibleId: 'u3', // Felix
            status: 'Plan',
            dueDate: '2026-03-28',
            templateId: 't1',
            history: [],
            data: {}
        },
        {
            id: '8',
            title: 'HR Lifecycle Update',
            ownerId: 'u2',
            responsibleId: 'u2',
            status: 'Check',
            dueDate: '2026-04-04',
            templateId: 't1',
            history: [],
            data: {}
        },
        {
            id: '2',
            title: 'CRITICAL CRM Data Issue',
            ownerId: 'u2',
            responsibleId: 'u3',
            status: 'Do',
            dueDate: '2025-01-01', // Past date -> Critical
            templateId: 't1',
            history: [],
            data: {}
        }
    ]
};

export class Store {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('mso_users')) {
            console.log('Seeding Data...');
            localStorage.setItem('mso_users', JSON.stringify(SEED_DATA.users));
            localStorage.setItem('mso_templates', JSON.stringify(SEED_DATA.templates));
            localStorage.setItem('mso_measures', JSON.stringify(SEED_DATA.measures));
            localStorage.setItem('mso_currentUser', JSON.stringify(null));
        }
    }

    // Auth
    login(email) {
        const users = JSON.parse(localStorage.getItem('mso_users'));
        const user = users.find(u => u.email === email) || users[0]; // Default to admin if not found for demo
        localStorage.setItem('mso_currentUser', JSON.stringify(user));
        return user;
    }

    logout() {
        localStorage.setItem('mso_currentUser', JSON.stringify(null));
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('mso_currentUser'));
    }

    // Getters
    getMeasures() {
        return JSON.parse(localStorage.getItem('mso_measures') || '[]');
    }

    getMeasure(id) {
        const measures = this.getMeasures();
        return measures.find(m => m.id === id);
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('mso_users') || '[]');
    }

    getTemplates() {
        return JSON.parse(localStorage.getItem('mso_templates') || '[]');
    }

    // Actions
    createMeasure(measureData) {
        const measures = this.getMeasures();
        const newMeasure = {
            id: Utils.generateId(),
            history: [{
                user: this.getCurrentUser().name,
                date: new Date().toISOString(),
                action: 'Created',
                oldValue: '-',
                newValue: 'Draft'
            }],
            ...measureData
        };
        measures.push(newMeasure);
        localStorage.setItem('mso_measures', JSON.stringify(measures));
        return newMeasure;
    }

    updateMeasure(id, updates) {
        const measures = this.getMeasures();
        const index = measures.findIndex(m => m.id === id);
        if (index === -1) return null;

        const oldMeasure = measures[index];
        const updatedMeasure = { ...oldMeasure, ...updates };

        // Log history automatically
        const user = this.getCurrentUser();
        const log = {
            user: user ? user.name : 'System',
            date: new Date().toISOString(),
            action: 'Update',
            oldValue: '...',
            newValue: 'Saved'
        };
        updatedMeasure.history.unshift(log);

        measures[index] = updatedMeasure;
        localStorage.setItem('mso_measures', JSON.stringify(measures));
        return updatedMeasure;
    }
}

export const store = new Store();
