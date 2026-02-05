import { ActivityEntry, ActivityType } from '../types/activity';
import { authService } from './index';

const STORAGE_KEY = 'mso_activity_log';

export const activityService = {
    getActivities: (): ActivityEntry[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            const seed = activityService.seedDemo();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(data);
    },

    log: (entry: Omit<ActivityEntry, 'id' | 'timestamp' | 'performedBy'>) => {
        const activities = activityService.getActivities();
        const currentUser = authService.getCurrentUser();

        const newEntry: ActivityEntry = {
            ...entry,
            id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            performedBy: currentUser?.name || 'System'
        };

        activities.unshift(newEntry); // Latest first
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activities.slice(0, 100))); // Keep last 100
        window.dispatchEvent(new Event('storage-activity'));
    },

    seedDemo: (): ActivityEntry[] => {
        const now = new Date();
        const hour = 1000 * 60 * 60;
        const day = hour * 24;

        return [
            {
                id: 'ACT-2026-001',
                type: 'USER_ADDED',
                message: 'New clinical staff registered',
                entityType: 'User',
                entityName: 'Dr. Julia Chen',
                entityId: 'U-102',
                performedBy: 'Dr. Elena Rossi',
                timestamp: new Date(now.getTime() - hour * 2).toISOString(),
                location: 'Zurich',
                department: 'Infectious Diseases'
            },
            {
                id: 'ACT-2026-002',
                type: 'AUDIT_CREATED',
                message: 'Patient Safety Site Visit scheduled',
                entityType: 'Audit',
                entityName: 'Internal Patient Safety Audit 2026',
                entityId: 'AUD-2026-004',
                performedBy: 'System',
                timestamp: new Date(now.getTime() - hour * 5).toISOString(),
                location: 'Geneva',
                department: 'Quality & Patient Safety'
            },
            {
                id: 'ACT-2026-003',
                type: 'PDCA_PHASE_UPDATED',
                message: 'Topic moved to CHECK phase – Basel',
                entityType: 'Topic',
                entityName: 'Reduction of Post-operative Infection Rates',
                entityId: 'T-001',
                performedBy: 'Dr. Marcus Weber',
                timestamp: new Date(now.getTime() - day).toISOString(),
                location: 'Basel',
                department: 'Surgery Department'
            },
            {
                id: 'ACT-2026-004',
                type: 'DEPARTMENT_CREATED',
                message: 'Department created: Clinical Compliance',
                entityType: 'Department',
                entityName: 'Clinical Compliance',
                entityId: 'DEP-COMP',
                performedBy: 'Dr. Elena Rossi',
                timestamp: new Date(now.getTime() - day * 1.5).toISOString(),
                location: 'Lausanne',
                department: 'Compliance & Ethics'
            },
            {
                id: 'ACT-2026-005',
                type: 'LOCATION_CREATED',
                message: 'Location added: CHUV Lausanne',
                entityType: 'Location',
                entityName: 'CHUV Lausanne',
                entityId: 'LOC-VD',
                performedBy: 'Dr. Elena Rossi',
                timestamp: new Date(now.getTime() - day * 2).toISOString(),
                location: 'Lausanne',
                department: 'Quality & Patient Safety'
            },
            {
                id: 'ACT-2026-006',
                type: 'AUDIT_STATUS_CHANGED',
                message: 'Clinical audit completed – Zurich',
                entityType: 'Audit',
                entityName: 'Joint Commission Hospital Accreditation',
                entityId: 'AUD-2024-001',
                performedBy: 'System',
                timestamp: new Date(now.getTime() - hour * 8).toISOString(),
                location: 'Zurich',
                department: 'Quality & Patient Safety'
            },
            {
                id: 'ACT-2026-007',
                type: 'PDCA_PHASE_UPDATED',
                message: 'PDCA topic moved to ACT phase – Bern',
                entityType: 'Topic',
                entityName: 'Medication Administration Error Reduction',
                entityId: 'T-002',
                performedBy: 'Dr. Elena Rossi',
                timestamp: new Date(now.getTime() - day * 3).toISOString(),
                location: 'Bern',
                department: 'Quality & Patient Safety'
            },
            {
                id: 'ACT-2026-008',
                type: 'USER_EDITED',
                message: 'Clinical profile updated',
                entityType: 'User',
                entityName: 'Sarah Johnson (RN)',
                entityId: 'U-003',
                performedBy: 'System',
                timestamp: new Date(now.getTime() - hour * 12).toISOString(),
                location: 'Geneva',
                department: 'Surgery Department'
            },
            {
                id: 'ACT-2026-009',
                type: 'FINDING_ADDED',
                message: 'Patient safety incident reported – Geneva',
                entityType: 'Finding',
                entityName: 'Pediatric crash cart missing items',
                entityId: 'F-010',
                performedBy: 'Sarah Johnson (RN)',
                timestamp: new Date(now.getTime() - hour * 24).toISOString(),
                location: 'Geneva',
                department: 'Quality & Patient Safety'
            },
            {
                id: 'ACT-2026-010',
                type: 'TOPIC_CREATED',
                message: 'New Clinical PDCA: Fall Prevention',
                entityType: 'Topic',
                entityName: 'Patient Fall Prevention Protocol Compliance',
                entityId: 'T-003',
                performedBy: 'Dr. Marcus Weber',
                timestamp: new Date(now.getTime() - hour * 4).toISOString(),
                location: 'Basel',
                department: 'Nursing'
            }
        ];
    }
};
