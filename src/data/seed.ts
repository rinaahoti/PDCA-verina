import { User, Topic, ToDo } from '../types';

export const initialData = {
    users: [
        { id: 'u1', name: 'Dr. Elena Rossi', email: 'elena.rossi@hospital.ch', role: 'ADMIN' as const, avatar: '👩‍⚕️', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u2', name: 'Dr. Marcus Weber', email: 'marcus.weber@hospital.ch', role: 'OWNER' as const, avatar: '👨‍⚕️', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u3', name: 'Sarah Johnson', email: 'sarah.johnson@hospital.ch', role: 'ASSIGNED' as const, avatar: '👩‍⚕️', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u4', name: 'Robert Miller', email: 'robert.miller@hospital.ch', role: 'ASSIGNED' as const, avatar: '👨‍💼', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u5', name: 'Dr. Julia Chen', email: 'julia.chen@hospital.ch', role: 'ASSIGNED' as const, avatar: '👩‍🔬', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u6', name: 'James Wilson', email: 'james.wilson@hospital.ch', role: 'ASSIGNED' as const, avatar: '👨‍🔬', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u7', name: 'Linda Thompson', email: 'linda.thompson@hospital.ch', role: 'VIEWER' as const, avatar: '👤', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u8', name: 'Clinical Director', email: 'director@university-hospital.ch', role: 'CLIENT_ADMIN' as const, avatar: '🏢', status: 'Active' as const, organizationId: 'org1' }
    ],
    topics: [
        {
            id: 'T-001',
            title: 'Reduction of Post-operative Infection Rates',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'PLAN' as const,
            dueDate: '2026-03-28',
            status: 'On Track' as const,
            severity: 'High' as const,
            category: 'Clinical' as const,
            location: 'University Hospital Zurich (ZH)',
            kpi: 'Infection rate < 0.5%',
            objective: 'Improve surgical outcome and patient safety through sterile protocol optimization.',
            history: [],
            plan: {
                description: 'Current infection rate in Surgery Ward B is at 2.1%.',
                asIs: 'Current surgical prep protocol is inconsistent across shifts. Hand hygiene compliance is at 75%. Documentation of sterile field setup is often missing.',
                toBe: 'Standardized surgical prep protocol implemented hospital-wide. 100% hand hygiene compliance and digitized sterile checklist.',
                rootCause: 'Inconsistent training for new surgical staff and manual documentation gaps.',
                objectives: ['Implement digital sterile checklist', 'Conduct mandatory hygiene retraining']
            },
            do: {
                checkDate: '2026-03-15',
                actions: [
                    {
                        id: 'a-demo-001',
                        title: 'Review Sterile Protocol Documentation',
                        description: 'Audit current sterile field setup procedures and identify gaps in documentation.',
                        assignments: [
                            { userId: 'u1', userName: 'Dr. Elena Rossi', completed: false, completedAt: undefined }
                        ],
                        dueDate: '2026-02-20',
                        teamsMeeting: '2026-02-18T14:00',
                        teamsMeetingLink: 'https://teams.microsoft.com/l/meetup-join/demo',
                        status: 'On Track'
                    }
                ]
            },
            check: { kpiResults: '', effectivenessReview: '' },
            act: { standardization: '', lessonsLearned: '' }
        },
        {
            id: 'T-002',
            title: 'Medication Administration Error Reduction',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'DO' as const,
            dueDate: '2025-01-01',
            status: 'Critical' as const,
            severity: 'Critical' as const,
            category: 'Patient Safety' as const,
            location: 'Geneva University Hospitals (GE)',
            kpi: 'Zero high-risk medication errors',
            objective: 'Standardize the double-check process for high-risk medication delivery.',
            history: [],
            plan: {
                description: 'Three near-miss incidents reported in the last quarter regarding insulin dosages.',
                asIs: 'Current double-check process is verbal and not consistently recorded. High-risk meds are stored next to routine medications.',
                toBe: 'Barcode-assisted medication administration (BCMA) implemented in all wards. Separate storage for high-risk medications.',
                rootCause: 'Lack of automated verification system and look-alike packaging.',
                objectives: ['Install BCMA scanners', 'Redesign high-risk med storage']
            },
            do: {
                checkDate: '2025-01-10',
                actions: [
                    {
                        id: 'a1',
                        title: 'Design high-risk labeling system',
                        description: 'Implement tall-man lettering and color-coded labels for all high-risk infusions.',
                        assignments: [{ userId: 'u3', userName: 'Sarah Johnson', completed: true }],
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
            title: 'Patient Fall Prevention Protocol Compliance',
            ownerId: 'u1',
            responsibleId: 'u4',
            step: 'DO' as const,
            dueDate: '2024-03-01',
            status: 'Critical' as const,
            severity: 'High' as const,
            category: 'Nursing' as const,
            kpi: '100% compliance with fall risk assessments',
            objective: 'Ensure every patient has a validated fall risk assessment within 2 hours of admission.',
            // Audit Fields
            type: 'Audit Finding',
            rating: 'Major',
            location: 'University Hospital Basel (BS)',
            auditReference: 'Patient Safety Standard 4.1',
            auditType: 'Internal',
            history: [],
            plan: {
                description: 'Audit showed 30% of admissions lacked completed fall risk scores.',
                rootCause: 'Admission workflow does not mandate the score before bed assignment.',
                objectives: ['Update EHR admission template', 'Train nursing staff on Morse Fall Scale']
            },
            do: { actions: [], checkDate: '' },
            check: { kpiResults: '', effectivenessReview: '' },
            act: { standardization: '', lessonsLearned: '' }
        }
    ],
    todos: [
        {
            id: 'TD-001',
            title: 'Audit Sterile Field Documentation',
            topicId: 'T-001',
            topicTitle: 'Reduction of Post-operative Infection Rates',
            step: 'PLAN' as const,
            priority: 'Medium' as const,
            status: 'Pending' as const,
            dueDate: '2026-02-15'
        },
        {
            id: 'TD-002',
            title: 'Validate Barcode Scanner Calibration',
            topicId: 'T-002',
            topicTitle: 'Medication Administration Error Reduction',
            step: 'DO' as const,
            priority: 'Critical' as const,
            status: 'Overdue' as const,
            dueDate: '2025-01-05'
        }
    ]
};

