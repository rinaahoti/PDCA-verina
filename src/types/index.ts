export type Role = 'ADMIN' | 'OWNER' | 'ASSIGNED' | 'VIEWER' | 'CLIENT_ADMIN' | 'DEMO';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar: string;
    status: 'Active' | 'Current User' | 'Suspended';
    organizationId: string;
    departmentId?: string;
    disabled?: boolean;
}

export interface NotificationSettings {
    emailNotifications: boolean;
    notifyOverdue: boolean;
    notifyDueSoon: boolean;
    notifyAssignedToDo: boolean;
    notifyTopicClosed: boolean;
    frequency: 'Instant' | 'Daily Digest';
}

export interface UserPreferences {
    language: 'EN' | 'DE';
    dateFormat: 'de-DE' | 'en-US';
    defaultLandingPage: 'Cockpit' | 'Dashboard' | 'Lists';
}

export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string;
}

export interface GovernanceRules {
    dueSoonThreshold: number;
    maxDaysPerStep?: {
        PLAN?: number;
        DO?: number;
        CHECK?: number;
        ACT?: number;
    };
}

export interface Organization {
    id: string;
    name: string;
    industry: string;
    country: string;
    status: 'Active' | 'Sandbox';
    logoUrl?: string;
    departments: Department[];
    governance: GovernanceRules;
}

export type Step = 'PLAN' | 'DO' | 'CHECK' | 'ACT';
export type Status = 'Critical' | 'Warning' | 'Monitoring' | 'Done';

//export type Severity = 'Low' | 'Medium' | 'High' | 'Critical' | 'Business Critical';
export type Category = 'Clinical' | 'Nursing' | 'Quality' | 'Compliance' | 'Patient Safety';
// export type ToDoStatus = 'Pending' | 'In Progress' | 'Overdue';

// CHECK Phase: Effectiveness Status
export type EffectivenessStatus = 'Effective' | 'Partially Effective' | 'Not Effective';

// CHECK Phase: KPI Status
export type KPIStatus = 'Achieved' | 'Not Achieved';

// CHECK Phase: KPI Evaluation Structure
export interface KPIEvaluation {
    id: string;
    name: string;
    targetValue: string;
    actualResult: string;
    status: KPIStatus;
}

// CHECK Phase: Audit & Traceability
export interface CheckAudit {
    checkedBy: string;
    checkedOn: string;
}

// ACT Phase: OTCOME
export type ActOutcome = 'Standardize' | 'Improve & Re-run PDCA' | 'Close without Standardization';

// ACT Phase: Standardization Scope
export type StandardizationScope = 'Process' | 'Clinical Guide' | 'Policy' | 'Checklist' | 'Training' | 'EHR Configuration' | 'Other';

// ACT Phase: Affected Areas
export type AffectedArea = 'Nursing' | 'Surgery' | 'Emergency' | 'Inpatient Ward' | 'Outpatient Clinic' | 'Pharmacy' | 'Diagnostics' | 'Administration' | 'Other';

// ACT Phase: Audit & Traceability
export interface ActAudit {
    closedBy: string;
    closedOn: string;
    finalOutcome: string;
    finalStatus: string;
}

// CHECK Phase: Decision Bridge to ACT
export type CheckDecision = 'Proceed to Standardization' | 'Proceed to Improvement' | 'Return to Re-planning';

export interface HistoryEntry {
    user: string;
    date: string;
    action: string;
    oldValue: string;
    newValue: string;
}

export interface Topic {
    id: string;
    title: string;
    ownerId: string;
    ownerName?: string;
    responsibleId: string;
    responsibleName?: string;
    step: Step;
    dueDate: string;
    status: Status;
    //severity: Severity;
    category: Category;
    kpi: string;
    objective: string;
    // Audit Specific Fields
    type?: string; //'Audit Finding' | 'General Topic'; // Discriminate between generic topics and audit findings
    rating?: 'Major' | 'Minor' | 'OFI';
    location?: string;
    locationId?: string;
    departmentId?: string;
    auditReference?: string; // e.g. "ISO 9001:2015"
    auditType?: 'Internal' | 'External';
    history: HistoryEntry[];
    plan: {
        description: string;
        goal?: string;
        asIs?: string;
        toBe?: string;
        rootCause: string;
        objectives: string[];
        improvementPurpose?: string[];
        kpis?: { name: string; target: string }[];
        completedAt?: string;
    };
    do: {
        checkDate?: string; // When the results will be reviewed
        actions: {
            id: string;
            title: string;
            description: string;
            assignments: { userId: string; userName: string; completed: boolean; completedAt?: string }[];
            dueDate: string;
            teamsMeeting?: string;
            teamsMeetingLink?: string;
            meetingType?: 'In-Office' | 'Online';
            meetingLocation?: string;
            status: 'Open' | 'In Progress' | 'Done';
        }[];
        completedAt?: string;
    };
    check: {
        // Legacy fields for backward compatibility
        kpis: string[];
        kpiResults: string;
        effectivenessReview: string;
        // New VIRENA – PDCA CHECK Phase structure
        effectivenessStatus?: EffectivenessStatus;
        effectivenessReviewText?: string;
        kpiEvaluations: KPIEvaluation[];
        checkDecision?: CheckDecision;
        audit?: CheckAudit;
        completedAt?: string;
    };
    act: {
        effectivenessStatus?: EffectivenessStatus; // Brought from CHECK
        actOutcome?: ActOutcome;
        standardizationScope?: StandardizationScope[]; // Checklist
        affectedAreas?: AffectedArea[];
        standardizationDescription?: string; // Was standardization
        lessonsLearned: string;
        actConfirmation?: {
            standardized: boolean;
            noActionsPending: boolean;
            readyToClose: boolean;
        };
        audit?: ActAudit;
        completedAt?: string;
        // Legacy
        standardization?: string;
    };
}

export interface ToDo {
    id: string;
    title: string;
    topicId: string;
    topicTitle: string;
    step: Step;

    status: Status;
    dueDate: string;
}

export interface Audit {
    id: string;
    name: string;
    type: 'Internal' | 'External' | 'Process' | 'Patient Safety' | 'Certification';
    location: string;
    startDate: string;
    endDate: string;
    auditor: string;
    status: 'Planned' | 'In Progress' | 'Completed';
    description?: string;
}

export interface AuditFinding {
    id: string;
    title: string;
    rating: 'Major' | 'Minor' | 'OFI';
    location: string;
    responsible: string;
    assigned: string;
    status: Step;
    deadline: string;
    cause: string;
    auditId: string;
    auditName: string;
    auditType: string;
    createdAt: string;
}

export interface SupportTicket {
    id: string;
    userEmail: string;
    userName: string;
    message: string;
    date: string;
}
