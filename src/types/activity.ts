export type ActivityType =
    | 'USER_ADDED' | 'USER_EDITED' | 'USER_DELETED'
    | 'DEPARTMENT_CREATED' | 'DEPARTMENT_UPDATED' | 'DEPARTMENT_DELETED'
    | 'LOCATION_CREATED' | 'LOCATION_UPDATED' | 'LOCATION_DELETED'
    | 'AUDIT_CREATED' | 'AUDIT_STATUS_CHANGED'
    | 'FINDING_ADDED'
    | 'PDCA_PHASE_UPDATED'
    | 'TOPIC_CREATED';

export interface ActivityEntry {
    id: string;
    type: ActivityType;
    message: string;
    entityType: 'User' | 'Department' | 'Location' | 'Audit' | 'Finding' | 'Topic';
    entityName: string;
    entityId?: string;
    performedBy: string;
    timestamp: string;
    location?: string;
    department?: string;
}
