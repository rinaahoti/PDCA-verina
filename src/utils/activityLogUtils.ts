import { ActivityEntry } from '../types/activity';

export type ActivityIconKey =
    | 'hash' | 'user' | 'clock' | 'layers' | 'pin' | 'tag' | 'brief'
    | 'wave' | 'person' | 'doc' | 'monitor' | 'mappin';

export type ActivityEntityFilter =
    | 'All Entities'
    | 'Topics'
    | 'Users'
    | 'Audits'
    | 'Findings'
    | 'Locations'
    | 'Departments';

export interface ActivityMetaItem {
    l?: string;
    v: string;
    lnk?: boolean;
    sys?: boolean;
    ico?: boolean;
}

export interface ActivityDetailRow {
    i: ActivityIconKey;
    l: string;
    v: string;
    lnk?: boolean;
}

export interface ActivityTimelineRow {
    e: string;
    t: string;
    a: boolean;
}

export interface ActivityLogViewEntry {
    id: string;
    entity: Exclude<ActivityEntityFilter, 'All Entities'>;
    ic: 'icon-orange' | 'icon-blue' | 'icon-green' | 'icon-purple' | 'icon-teal' | 'icon-amber';
    icon: ActivityIconKey;
    title: string;
    meta: ActivityMetaItem[];
    time: string;
    d: {
        st: {
            label: string;
            cls: 'chip-green' | 'chip-orange' | 'chip-blue';
        };
        rows: ActivityDetailRow[];
        tl: ActivityTimelineRow[];
    };
    source: ActivityEntry;
}

const formatDate = (timestamp: string, isGerman: boolean) => {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
        ? timestamp
        : date.toLocaleDateString(isGerman ? 'de-CH' : 'en-US');
};

const formatRelativeTime = (timestamp: string, isGerman: boolean) => {
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();

    if (Number.isNaN(date.getTime()) || diffMs < 0) {
        return formatDate(timestamp, isGerman);
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return isGerman ? 'gerade eben' : 'just now';
    if (diffMinutes < 60) return isGerman ? `vor ${diffMinutes} Min.` : `${diffMinutes}m ago`;
    if (diffHours < 24) return isGerman ? `vor ${diffHours} Std.` : `${diffHours}h ago`;
    if (diffDays < 7) return isGerman ? `vor ${diffDays} Tg.` : `${diffDays}d ago`;
    return formatDate(timestamp, isGerman);
};

const getEntityGroup = (entityType: ActivityEntry['entityType']): Exclude<ActivityEntityFilter, 'All Entities'> => {
    switch (entityType) {
        case 'Topic':
            return 'Topics';
        case 'User':
            return 'Users';
        case 'Location':
            return 'Locations';
        case 'Department':
            return 'Departments';
        case 'Audit':
            return 'Audits';
        case 'Finding':
            return 'Findings';
        default:
            return 'Topics';
    }
};

const getPhaseFromMessage = (message: string) => {
    const match = message.match(/\b(PLAN|DO|CHECK|ACT)\b/i);
    return match?.[1]?.toUpperCase() as 'PLAN' | 'DO' | 'CHECK' | 'ACT' | undefined;
};

const getTopicIdLabel = (isGerman: boolean) => (isGerman ? 'Themen-ID' : 'Topic ID');
const getTitleLabel = (isGerman: boolean) => (isGerman ? 'Titel' : 'Title');
const getDateLabel = (isGerman: boolean) => (isGerman ? 'Datum' : 'Date');
const getByLabel = (isGerman: boolean) => (isGerman ? 'Von' : 'By');
const getLocationLabel = (isGerman: boolean) => (isGerman ? 'Standort' : 'Location');
const getDepartmentLabel = (isGerman: boolean) => (isGerman ? 'Betrieb' : 'Department');
const getPhaseLabel = (isGerman: boolean) => (isGerman ? 'Phase' : 'Phase');
const getNameLabel = (isGerman: boolean) => (isGerman ? 'Name' : 'Name');

const getActivityTitle = (activity: ActivityEntry, isGerman: boolean) => {
    const topicRef = activity.entityId || activity.entityName;
    const phase = getPhaseFromMessage(activity.message);

    switch (activity.type) {
        case 'TOPIC_CREATED':
            return isGerman ? `Neues KVP-Thema ${topicRef} erstellt` : `New PDCA Topic ${topicRef} created`;
        case 'TOPIC_RERUN_OPENED':
            return isGerman
                ? `PDCA Re-run aus Templates & Standards geöffnet`
                : `PDCA Re-run opened from Templates & Standards`;
        case 'PDCA_PHASE_UPDATED':
            if (phase) {
                return isGerman
                    ? `Thema ${topicRef} in die Phase ${phase} verschoben`
                    : `Topic ${topicRef} moved to ${phase} phase`;
            }
            return activity.message;
        case 'USER_ADDED':
            return isGerman ? `Benutzer ${activity.entityName} registriert` : `User ${activity.entityName} registered`;
        case 'USER_EDITED':
            return isGerman ? `Benutzer ${activity.entityName} aktualisiert` : `User ${activity.entityName} updated`;
        case 'USER_DELETED':
            return isGerman ? `Benutzer ${activity.entityName} gelöscht` : `User ${activity.entityName} deleted`;
        case 'LOCATION_CREATED':
            return isGerman ? `Standort ${activity.entityName} erstellt` : `Location ${activity.entityName} created`;
        case 'LOCATION_UPDATED':
            return isGerman ? `Standort ${activity.entityName} aktualisiert` : `Location ${activity.entityName} updated`;
        case 'LOCATION_DELETED':
            return isGerman ? `Standort ${activity.entityName} gelöscht` : `Location ${activity.entityName} deleted`;
        case 'DEPARTMENT_CREATED':
            return isGerman ? `Betrieb ${activity.entityName} erstellt` : `Department ${activity.entityName} created`;
        case 'DEPARTMENT_UPDATED':
            return isGerman ? `Betrieb ${activity.entityName} aktualisiert` : `Department ${activity.entityName} updated`;
        case 'DEPARTMENT_DELETED':
            return isGerman ? `Betrieb ${activity.entityName} gelöscht` : `Department ${activity.entityName} deleted`;
        default:
            return activity.message;
    }
};

const getStatusConfig = (activity: ActivityEntry, isGerman: boolean) => {
    const phase = getPhaseFromMessage(activity.message);

    if (activity.type === 'TOPIC_CREATED') {
        return { label: isGerman ? 'Neu erstellt' : 'Created', cls: 'chip-green' as const };
    }

    if (activity.type === 'TOPIC_RERUN_OPENED') {
        return { label: 'Re-run', cls: 'chip-blue' as const };
    }

    if (activity.type === 'PDCA_PHASE_UPDATED' && phase) {
        if (phase === 'ACT') {
            return { label: isGerman ? 'ACT-Phase' : 'ACT Phase', cls: 'chip-orange' as const };
        }
        return { label: `${phase} ${isGerman ? 'Phase' : 'Phase'}`, cls: 'chip-blue' as const };
    }

    if (activity.type.endsWith('DELETED')) {
        return { label: isGerman ? 'Gelöscht' : 'Deleted', cls: 'chip-orange' as const };
    }

    if (activity.type.endsWith('UPDATED') || activity.type === 'AUDIT_STATUS_CHANGED') {
        return { label: isGerman ? 'Aktualisiert' : 'Updated', cls: 'chip-blue' as const };
    }

    return { label: isGerman ? 'Erstellt' : 'Created', cls: 'chip-green' as const };
};

const getVisualConfig = (activity: ActivityEntry) => {
    if (activity.entityType === 'Topic') {
        return { ic: 'icon-green' as const, icon: 'doc' as const };
    }
    if (activity.entityType === 'User') {
        return { ic: 'icon-blue' as const, icon: 'person' as const };
    }
    if (activity.entityType === 'Location') {
        return { ic: 'icon-amber' as const, icon: 'mappin' as const };
    }
    if (activity.entityType === 'Department') {
        return { ic: 'icon-purple' as const, icon: 'brief' as const };
    }
    if (activity.entityType === 'Audit') {
        return { ic: 'icon-teal' as const, icon: 'monitor' as const };
    }
    return { ic: 'icon-orange' as const, icon: 'wave' as const };
};

const buildMeta = (activity: ActivityEntry, isGerman: boolean): ActivityMetaItem[] => {
    const meta: ActivityMetaItem[] = [];

    if (activity.entityType === 'Topic') {
        meta.push({ l: getTitleLabel(isGerman), v: activity.entityName });
    } else {
        meta.push({ l: getNameLabel(isGerman), v: activity.entityName });
    }

    if (activity.location) {
        meta.push({ l: getLocationLabel(isGerman), v: activity.location });
    }

    meta.push({ l: getByLabel(isGerman), v: activity.performedBy, lnk: true });
    return meta;
};

const buildDetailRows = (activity: ActivityEntry, isGerman: boolean): ActivityDetailRow[] => {
    const rows: ActivityDetailRow[] = [];
    const phase = getPhaseFromMessage(activity.message);

    if (activity.entityId) {
        rows.push({
            i: 'hash',
            l: activity.entityType === 'Topic' ? getTopicIdLabel(isGerman) : `${getNameLabel(isGerman)} ID`,
            v: activity.entityId
        });
    }

    rows.push({
        i: activity.entityType === 'Topic' ? 'tag' : 'user',
        l: activity.entityType === 'Topic' ? getTitleLabel(isGerman) : getNameLabel(isGerman),
        v: activity.entityName,
        lnk: activity.entityType === 'Topic'
    });

    if (phase) {
        rows.push({
            i: 'layers',
            l: getPhaseLabel(isGerman),
            v: phase
        });
    }

    if (activity.location) {
        rows.push({
            i: 'pin',
            l: getLocationLabel(isGerman),
            v: activity.location
        });
    }

    if (activity.department) {
        rows.push({
            i: 'brief',
            l: getDepartmentLabel(isGerman),
            v: activity.department
        });
    }

    rows.push({
        i: 'user',
        l: getByLabel(isGerman),
        v: activity.performedBy,
        lnk: true
    });

    rows.push({
        i: 'clock',
        l: getDateLabel(isGerman),
        v: formatDate(activity.timestamp, isGerman)
    });

    return rows;
};

const buildTopicTimeline = (activity: ActivityEntry, isGerman: boolean): ActivityTimelineRow[] => {
    if (activity.entityType !== 'Topic') return [];

    const phaseOrder = ['PLAN', 'DO', 'CHECK', 'ACT'] as const;
    const currentPhase = activity.type === 'TOPIC_CREATED' ? 'PLAN' : getPhaseFromMessage(activity.message) || 'PLAN';
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const dateLabel = formatDate(activity.timestamp, isGerman);

    return phaseOrder.map((phase, index) => ({
        e: isGerman ? `${phase} Phase gestartet` : `${phase} Phase started`,
        t: dateLabel,
        a: index <= currentIndex
    }));
};

export const mapActivityEntryToLogEntry = (activity: ActivityEntry, language: 'en' | 'de'): ActivityLogViewEntry => {
    const isGerman = language === 'de';
    const visual = getVisualConfig(activity);

    return {
        id: activity.id,
        entity: getEntityGroup(activity.entityType),
        ic: visual.ic,
        icon: visual.icon,
        title: getActivityTitle(activity, isGerman),
        meta: buildMeta(activity, isGerman),
        time: formatRelativeTime(activity.timestamp, isGerman),
        d: {
            st: getStatusConfig(activity, isGerman),
            rows: buildDetailRows(activity, isGerman),
            tl: buildTopicTimeline(activity, isGerman)
        },
        source: activity
    };
};

export const mapActivityEntriesToLogEntries = (activities: ActivityEntry[], language: 'en' | 'de') =>
    activities.map((activity) => mapActivityEntryToLogEntry(activity, language));
