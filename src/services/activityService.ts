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
                message: 'New user registered in the system',
                entityType: 'User',
                entityName: 'Hans Mueller',
                entityId: 'U-102',
                performedBy: 'Sophia Mayer',
                timestamp: new Date(now.getTime() - hour * 2).toISOString(),
                location: 'Berlin',
                department: 'IT Infrastructure'
            },
            {
                id: 'ACT-2026-002',
                type: 'AUDIT_CREATED',
                message: 'Internal Safety Audit scheduled',
                entityType: 'Audit',
                entityName: 'Internal Safety Audit 2026',
                entityId: 'AUD-2026-004',
                performedBy: 'System',
                timestamp: new Date(now.getTime() - hour * 5).toISOString(),
                location: 'Munich',
                department: 'Quality Management'
            },
            {
                id: 'ACT-2026-003',
                type: 'PDCA_PHASE_UPDATED',
                message: 'Topic moved to CHECK phase',
                entityType: 'Topic',
                entityName: 'Optimize Production Line B',
                entityId: 'T-001',
                performedBy: 'Max Müller',
                timestamp: new Date(now.getTime() - day).toISOString(),
                location: 'Berlin',
                department: 'Operations'
            },
            {
                id: 'ACT-2026-004',
                type: 'DEPARTMENT_CREATED',
                message: 'Department created: Compliance',
                entityType: 'Department',
                entityName: 'Compliance',
                entityId: 'DEP-COMP',
                performedBy: 'Sophia Mayer',
                timestamp: new Date(now.getTime() - day * 1.5).toISOString(),
                location: 'Hamburg',
                department: 'Compliance'
            },
            {
                id: 'ACT-2026-005',
                type: 'LOCATION_CREATED',
                message: 'Location added: Munich Plant',
                entityType: 'Location',
                entityName: 'Munich Plant',
                entityId: 'LOC-MUC',
                performedBy: 'Sophia Mayer',
                timestamp: new Date(now.getTime() - day * 2).toISOString(),
                location: 'Munich',
                department: 'Operations'
            },
            {
                id: 'ACT-2026-006',
                type: 'AUDIT_STATUS_CHANGED',
                message: 'Audit completed',
                entityType: 'Audit',
                entityName: 'Internal Safety Audit 2026',
                entityId: 'AUD-2026-004',
                performedBy: 'System',
                timestamp: new Date(now.getTime() - hour * 8).toISOString(),
                location: 'Munich',
                department: 'Quality Management'
            },
            {
                id: 'ACT-2026-007',
                type: 'PDCA_PHASE_UPDATED',
                message: 'Topic closed after ACT',
                entityType: 'Topic',
                entityName: 'Quarterly Quality Review',
                entityId: 'T-042',
                performedBy: 'Sophia Mayer',
                timestamp: new Date(now.getTime() - day * 3).toISOString(),
                location: 'Hamburg',
                department: 'Quality Management'
            },
            {
                id: 'ACT-2026-008',
                type: 'USER_EDITED',
                message: 'User profile updated',
                entityType: 'User',
                entityName: 'Sarah Weber',
                entityId: 'U-003',
                performedBy: 'System',
                timestamp: new Date(now.getTime() - hour * 12).toISOString(),
                location: 'Munich',
                department: 'Quality Management'
            },
            {
                id: 'ACT-2026-009',
                type: 'FINDING_ADDED',
                message: 'Critical finding identified during audit',
                entityType: 'Finding',
                entityName: 'Power Supply Redundancy Issue',
                entityId: 'F-2026-015',
                performedBy: 'Max Müller',
                timestamp: new Date(now.getTime() - hour * 24).toISOString(),
                location: 'Berlin',
                department: 'IT Infrastructure'
            },
            {
                id: 'ACT-2026-010',
                type: 'TOPIC_CREATED',
                message: 'New PDCA Topic: Reduce Energy Waste',
                entityType: 'Topic',
                entityName: 'Reduce Energy Waste',
                entityId: 'T-099',
                performedBy: 'Hans Mueller',
                timestamp: new Date(now.getTime() - hour * 4).toISOString(),
                location: 'Hamburg',
                department: 'Operations'
            }
        ];
    }
};
