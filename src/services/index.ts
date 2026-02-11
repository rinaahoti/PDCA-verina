import { User, Topic, ToDo, Status, SupportTicket, HistoryEntry, Organization, Department, GovernanceRules, NotificationSettings, UserPreferences } from '../types';
import { normalizeStatus } from '../utils/statusUtils';
import { initialData } from '../data/seed';
import { activityService } from './activityService';
import { adminService } from './adminService';

const KEYS = {
    USER: 'mso_v5_user',
    TOPICS: 'mso_v5_topics',
    TICKETS: 'mso_v5_tickets',
    TODOS: 'mso_v5_todos',
    ORGANIZATION: 'mso_v5_organization',
    PREFERENCES: 'mso_v5_preferences',
    NOTIFICATIONS: 'mso_v5_notifications'
};

export const authService = {
    init: () => {
        if (!localStorage.getItem(KEYS.USER + '_list')) {
            localStorage.setItem(KEYS.USER + '_list', JSON.stringify(initialData.users));
        }
    },
    getAllUsers: (): User[] => {
        authService.init();
        return JSON.parse(localStorage.getItem(KEYS.USER + '_list') || '[]');
    },
    updateUser: (id: string, updates: Partial<User>) => {
        const users = authService.getAllUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem(KEYS.USER + '_list', JSON.stringify(users));

            // If the updated user is the current user, update their session too
            const current = authService.getCurrentUser();
            if (current && current.id === id) {
                localStorage.setItem(KEYS.USER, JSON.stringify(users[index]));
                window.dispatchEvent(new Event('storage'));
            }
            return users[index];
        }
        return null;
    },
    addUser: (user: Omit<User, 'id' | 'avatar' | 'status'>) => {
        const users = authService.getAllUsers();
        const newUser: User = {
            ...user,
            id: `u${Date.now()}`,
            avatar: '👤',
            status: 'Active'
        };
        users.push(newUser);
        localStorage.setItem(KEYS.USER + '_list', JSON.stringify(users));
        return newUser;
    },
    login: (email: string): User | null => {
        const users = authService.getAllUsers();
        const user = users.find(u => u.email === email);
        if (user) {
            localStorage.setItem(KEYS.USER, JSON.stringify(user));
            return user;
        }
        return null;
    },
    logout: () => localStorage.removeItem(KEYS.USER),
    getCurrentUser: (): User | null => {
        const data = localStorage.getItem(KEYS.USER);
        return data ? JSON.parse(data) : null;
    }
};

const defaultOrg: Organization = {
    id: 'org1',
    name: "Swiss Healthcare Quality Network",
    industry: 'Healthcare',
    country: 'Switzerland',
    status: 'Sandbox',
    departments: [
        { id: 'dept1', name: 'Quality & Patient Safety', code: 'QPS', description: 'Clinical quality assurance and patient safety protocols.' },
        { id: 'dept2', name: 'Infectious Disease Control', code: 'IDC', description: 'Infection monitoring and prevention.' },
        { id: 'dept3', name: 'Surgery Department', code: 'SURG', description: 'Main clinical surgery and post-op care.' },
        { id: 'dept4', name: 'Compliance & Ethics', code: 'COMP', description: 'Medical law and regulatory compliance.' }
    ],
    governance: {
        dueSoonThreshold: 7
    }
};

export const organizationService = {
    get: (): Organization => {
        const data = localStorage.getItem(KEYS.ORGANIZATION);
        if (!data) {
            localStorage.setItem(KEYS.ORGANIZATION, JSON.stringify(defaultOrg));
            return defaultOrg;
        }
        return JSON.parse(data);
    },
    update: (updates: Partial<Organization>) => {
        const current = organizationService.get();
        const merged = { ...current, ...updates };
        localStorage.setItem(KEYS.ORGANIZATION, JSON.stringify(merged));
        window.dispatchEvent(new Event('storage'));
        return merged;
    },
    addDepartment: (dept: Omit<Department, 'id'>) => {
        const org = organizationService.get();
        const newDept: Department = { ...dept, id: `dept-${Date.now()}` };
        org.departments.push(newDept);
        organizationService.update(org);
        return newDept;
    },
    updateDepartment: (id: string, updates: Partial<Department>) => {
        const org = organizationService.get();
        const index = org.departments.findIndex(d => d.id === id);
        if (index !== -1) {
            org.departments[index] = { ...org.departments[index], ...updates };
            organizationService.update(org);
        }
    },
    deleteDepartment: (id: string) => {
        const org = organizationService.get();
        org.departments = org.departments.filter(d => d.id !== id);
        organizationService.update(org);
    },
    getGovernance: (): GovernanceRules => {
        return organizationService.get().governance;
    },
    updateGovernance: (rules: Partial<GovernanceRules>) => {
        const org = organizationService.get();
        org.governance = { ...org.governance, ...rules };
        organizationService.update(org);
    }
};

const defaultPrefs: UserPreferences = {
    language: 'EN',
    dateFormat: 'de-DE',
    defaultLandingPage: 'Dashboard'
};

const defaultNotifications: NotificationSettings = {
    emailNotifications: true,
    notifyOverdue: true,
    notifyDueSoon: true,
    notifyAssignedToDo: true,
    notifyTopicClosed: false,
    frequency: 'Instant'
};

export const settingsService = {
    getPreferences: (): UserPreferences => {
        const data = localStorage.getItem(KEYS.PREFERENCES);
        return data ? JSON.parse(data) : defaultPrefs;
    },
    updatePreferences: (prefs: Partial<UserPreferences>) => {
        const current = settingsService.getPreferences();
        localStorage.setItem(KEYS.PREFERENCES, JSON.stringify({ ...current, ...prefs }));
        window.dispatchEvent(new Event('storage'));
    },
    getNotifications: (): NotificationSettings => {
        const data = localStorage.getItem(KEYS.NOTIFICATIONS);
        return data ? JSON.parse(data) : defaultNotifications;
    },
    updateNotifications: (settings: Partial<NotificationSettings>) => {
        const current = settingsService.getNotifications();
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify({ ...current, ...settings }));
        window.dispatchEvent(new Event('storage'));
    },
    exportData: () => {
        const data = {
            topics: topicsService.getAll(),
            todos: todosService.getAll(),
            organization: organizationService.get(),
            users: authService.getAllUsers()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pdca-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    importData: async (file: File): Promise<boolean> => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data.topics) localStorage.setItem(KEYS.TOPICS, JSON.stringify(data.topics));
            if (data.todos) localStorage.setItem(KEYS.TODOS, JSON.stringify(data.todos));
            if (data.organization) localStorage.setItem(KEYS.ORGANIZATION, JSON.stringify(data.organization));
            if (data.users) localStorage.setItem(KEYS.USER + '_list', JSON.stringify(data.users));
            window.dispatchEvent(new Event('storage'));
            return true;
        } catch (e) {
            console.error('Import failed', e);
            return false;
        }
    },
    resetData: () => {
        localStorage.removeItem(KEYS.TOPICS);
        localStorage.removeItem(KEYS.TODOS);
        localStorage.removeItem(KEYS.ORGANIZATION);
        localStorage.removeItem(KEYS.USER + '_list');
        localStorage.removeItem(KEYS.PREFERENCES);
        localStorage.removeItem(KEYS.NOTIFICATIONS);
        window.location.reload();
    }
};

export const topicsService = {
    init: () => {
        if (!localStorage.getItem(KEYS.TOPICS)) {
            localStorage.setItem(KEYS.TOPICS, JSON.stringify(initialData.topics));
            localStorage.setItem(KEYS.TODOS, JSON.stringify(initialData.todos));
        }
    },
    getAll: (): Topic[] => {
        const topics: Topic[] = JSON.parse(localStorage.getItem(KEYS.TOPICS) || '[]');
        const now = new Date();
        const governance = organizationService.getGovernance();
        const thresholdDate = new Date();
        thresholdDate.setDate(now.getDate() + governance.dueSoonThreshold);

        return topics.map(t => {
            if (t.status === 'Done') return t;

            const dueDate = new Date(t.dueDate);
            dueDate.setHours(23, 59, 59, 999);

            let calculatedStatus: Status = 'Monitoring';
            if (dueDate < now) {
                calculatedStatus = 'Critical';
            } else if (dueDate <= thresholdDate) {
                calculatedStatus = 'Warning';
            }

            // We respect manually set statuses if they are "more urgent" than calculated
            // Priority: Critical > Warning > Monitoring
            const savedStatus = normalizeStatus(t.status) as Status;

            if (savedStatus === 'Critical' || calculatedStatus === 'Critical') {
                return { ...t, status: 'Critical' as const };
            }
            if (savedStatus === 'Warning' || calculatedStatus === 'Warning') {
                return { ...t, status: 'Warning' as const };
            }

            return { ...t, status: 'Monitoring' as const };
        });
    },
    save: (topics: Topic[]) => localStorage.setItem(KEYS.TOPICS, JSON.stringify(topics)),
    update: (id: string, updates: Partial<Topic>) => {
        const raw = localStorage.getItem(KEYS.TOPICS);
        const topics: Topic[] = raw ? JSON.parse(raw) : [];
        const index = topics.findIndex(t => t.id === id);
        if (index !== -1) {
            const current = topics[index];
            const deepFields: (keyof Topic)[] = ['plan', 'do', 'check', 'act'];

            const merged = { ...current, ...updates };

            // History Logging
            const history: HistoryEntry[] = current.history || [];
            if (updates.status && updates.status !== current.status) {
                history.push({
                    user: authService.getCurrentUser()?.name || 'System',
                    date: new Date().toISOString(),
                    action: 'Status changed',
                    oldValue: current.status,
                    newValue: updates.status
                });
            }
            if (updates.step && updates.step !== current.step) {
                history.push({
                    user: authService.getCurrentUser()?.name || 'System',
                    date: new Date().toISOString(),
                    action: 'Step changed',
                    oldValue: current.step,
                    newValue: updates.step
                });
            }
            if (updates.status === 'Done' && current.status !== 'Done') {
                history.push({
                    user: authService.getCurrentUser()?.name || 'System',
                    date: new Date().toISOString(),
                    action: 'Topic closed',
                    oldValue: current.status,
                    newValue: 'Done'
                });
            }
            merged.history = history;

            deepFields.forEach(field => {
                if (updates[field]) {
                    (merged as any)[field] = { ...(current[field] as any), ...(updates[field] as any) };
                }
            });

            topics[index] = merged;
            localStorage.setItem(KEYS.TOPICS, JSON.stringify(topics));

            if (updates.step && updates.step !== current.step) {
                const loc = adminService.getLocations().find(l => l.id === merged.locationId);
                const dep = adminService.getDepartments().find(d => d.id === merged.departmentId);

                activityService.log({
                    type: 'PDCA_PHASE_UPDATED',
                    message: `Topic ${merged.id} moved to ${updates.step} phase`,
                    entityType: 'Topic',
                    entityName: merged.title,
                    location: loc?.name,
                    department: dep?.name
                });
            }

            return topics[index];
        }
        return null;
    },
    add: (topic: Omit<Topic, 'id' | 'history' | 'plan' | 'do' | 'check' | 'act'>) => {
        const raw = localStorage.getItem(KEYS.TOPICS);
        const topics: Topic[] = raw ? JSON.parse(raw) : [];
        const newTopic: Topic = {
            ...topic,
            id: `T-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            history: [{ user: 'System', date: new Date().toISOString(), action: 'Created', oldValue: '', newValue: 'New' }],
            plan: { description: '', asIs: '', toBe: '', rootCause: '', objectives: [] },
            do: { actions: [] },
            check: { kpis: [], kpiResults: '', effectivenessReview: '', kpiEvaluations: [] },
            act: { standardization: '', lessonsLearned: '' }
        };
        topics.push(newTopic);
        localStorage.setItem(KEYS.TOPICS, JSON.stringify(topics));

        const loc = adminService.getLocations().find(l => l.id === newTopic.locationId);
        const dep = adminService.getDepartments().find(d => d.id === newTopic.departmentId);

        activityService.log({
            type: 'TOPIC_CREATED',
            message: `New PDCA Topic ${newTopic.id} created`,
            entityType: 'Topic',
            entityName: newTopic.title,
            location: loc?.name,
            department: dep?.name
        });

        return newTopic;
    },
    getById: (id: string): Topic | undefined => topicsService.getAll().find(t => t.id === id)
};

export const todosService = {
    getAll: (): ToDo[] => JSON.parse(localStorage.getItem(KEYS.TODOS) || '[]'),
    save: (todos: ToDo[]) => localStorage.setItem(KEYS.TODOS, JSON.stringify(todos)),
};

export const supportService = {
    getTickets: (): SupportTicket[] => JSON.parse(localStorage.getItem(KEYS.TICKETS) || '[]'),
    addTicket: (ticket: Omit<SupportTicket, 'id' | 'date'>) => {
        const tickets = supportService.getTickets();
        const newTicket: SupportTicket = {
            ...ticket,
            id: Date.now().toString(),
            date: new Date().toISOString()
        };
        tickets.push(newTicket);
        localStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
    }
};
