import { User, Topic, ToDo } from '../types';

export const initialData = {
    users: [
        { id: 'u1', name: 'Sophia Mayer', email: 'sophia.mayer@company.com', role: 'ADMIN' as const, avatar: '👩‍💼', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u2', name: 'Max Müller', email: 'max.mueller@company.com', role: 'OWNER' as const, avatar: '👨‍💼', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u3', name: 'Anna Schmidt', email: 'anna.schmidt@company.com', role: 'ASSIGNED' as const, avatar: '👩‍🔧', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u4', name: 'Thomas Weber', email: 'thomas.weber@company.com', role: 'ASSIGNED' as const, avatar: '👨‍🔧', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u5', name: 'Lisa Fischer', email: 'lisa.fischer@company.com', role: 'ASSIGNED' as const, avatar: '👩‍💻', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u6', name: 'Michael Wagner', email: 'michael.wagner@company.com', role: 'ASSIGNED' as const, avatar: '👨‍💻', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u7', name: 'Sarah Becker', email: 'sarah.becker@company.com', role: 'VIEWER' as const, avatar: '👤', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u8', name: 'Client Admin', email: 'client@demo.com', role: 'CLIENT_ADMIN' as const, avatar: '🏢', status: 'Active' as const, organizationId: 'org1' }
    ],
    topics: [
        {
            id: 'T-001',
            title: 'Optimization of Supplier Onboarding Process',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'PLAN' as const,
            dueDate: '2026-03-28',
            status: 'On Track' as const,
            severity: 'High' as const,
            category: 'Process' as const,
            kpi: 'Reduced onboarding time by 20%',
            objective: 'Streamline procurement and reduce lead times.',
            history: [],
            plan: {
                description: 'Current onboarding takes 15 days on average.',
                asIs: 'Current onboarding process is manual and decentralized, taking 15 days on average. Documents are exchanged via email.',
                toBe: 'Centralized digital portal for onboarding with automated workflows, reducing time to 3 days.',
                rootCause: 'Manual document verification and missing digital interface.',
                objectives: ['Implement digital portal', 'Automate background checks']
            },
            do: { actions: [], checkDate: '' },
            check: { kpiResults: '', effectivenessReview: '' },
            act: { standardization: '', lessonsLearned: '' }
        },
        {
            id: 'T-002',
            title: 'Critical Security Breach in CRM API',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'DO' as const,
            dueDate: '2025-01-01',
            status: 'Critical' as const,
            severity: 'Business Critical' as const,
            category: 'IT' as const,
            kpi: 'Zero unauthorized access logs',
            objective: 'Fix vulnerability and prevent data leakage.',
            history: [],
            plan: {
                description: 'SQL injection vulnerability detected in search endpoint.',
                asIs: 'SQL injection vulnerability exists in CRM API search endpoint, allowing potential data leakage.',
                toBe: 'API endpoint secured with input sanitization and parameterized queries. Zero vulnerabilities in scan.',
                rootCause: 'Lack of input sanitization in legacy code.',
                objectives: ['Patch API', 'Full security audit']
            },
            do: {
                checkDate: '2025-01-10',
                actions: [
                    {
                        id: 'a1',
                        title: 'Apply sanitization filters',
                        description: 'Implement DOMPurify and parameterized queries in the search module.',
                        assignments: [{ userId: 'u3', userName: 'Felix Worker', completed: true }],
                        dueDate: '2025-01-02',
                        status: 'Done'
                    }
                ]
            },
            check: { kpiResults: '', effectivenessReview: '' },
            act: { standardization: '', lessonsLearned: '' }
        },
        {
            id: 'T-003',
            title: 'Fire Safety Extinguisher Expired',
            ownerId: 'u1',
            responsibleId: 'u4',
            step: 'DO' as const,
            dueDate: '2024-03-01',
            status: 'Critical' as const,
            severity: 'High' as const,
            category: 'Process' as const,
            kpi: '100% Compliance',
            objective: 'Ensure all safety equipment is valid.',
            // Audit Fields
            type: 'Audit Finding',
            rating: 'Major',
            location: 'Plant Berlin',
            auditReference: 'ISO 45001',
            auditType: 'Internal',
            history: [],
            plan: {
                description: 'Fire extinguisher in Hall 3 expired last month.',
                rootCause: 'Maintenance schedule not updated.',
                objectives: ['Replace extinguisher', 'Update schedule']
            },
            do: { actions: [], checkDate: '' },
            check: { kpiResults: '', effectivenessReview: '' },
            act: { standardization: '', lessonsLearned: '' }
        }
    ],
    todos: [
        {
            id: 'TD-001',
            title: 'Conduct Stakeholder Interview',
            topicId: 'T-001',
            topicTitle: 'Optimization of Supplier Onboarding Process',
            step: 'PLAN' as const,
            priority: 'Medium' as const,
            status: 'Pending' as const,
            dueDate: '2026-02-15'
        },
        {
            id: 'TD-002',
            title: 'Deploy API Patch to Staging',
            topicId: 'T-002',
            topicTitle: 'Critical Security Breach in CRM API',
            step: 'DO' as const,
            priority: 'Critical' as const,
            status: 'Overdue' as const,
            dueDate: '2025-01-05'
        }
    ]
};
