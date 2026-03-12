import React, { useMemo, useState } from 'react';
import '../styles/activity-log-exact.css';
import { useLanguage } from '../contexts/LanguageContext';

type IconKey =
    | 'hash' | 'user' | 'clock' | 'layers' | 'pin' | 'tag' | 'brief'
    | 'wave' | 'person' | 'doc' | 'monitor' | 'mappin';

type EntityFilter = 'All Entities' | 'Topics' | 'Users' | 'Locations' | 'Departments';

interface MetaItem {
    l?: string;
    v: string;
    lnk?: boolean;
    sys?: boolean;
    ico?: boolean;
}

interface DetailRow {
    i: IconKey;
    l: string;
    v: string;
    lnk?: boolean;
}

interface TimelineRow {
    e: string;
    t: string;
    a: boolean;
}

interface LogEntry {
    id: number;
    entity: Exclude<EntityFilter, 'All Entities'>;
    ic: 'icon-orange' | 'icon-blue' | 'icon-green' | 'icon-purple' | 'icon-teal' | 'icon-amber';
    icon: IconKey;
    title: string;
    meta: MetaItem[];
    time: string;
    d: {
        st: { label: string; cls: 'chip-green' | 'chip-orange' | 'chip-blue' };
        rows: DetailRow[];
        tl: TimelineRow[];
    };
}

const SVG_ICONS: Record<IconKey, string> = {
    hash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
    user: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    layers: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    pin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    tag: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    brief: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
    wave: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    person: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    doc: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    monitor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    mappin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
};

const logs: LogEntry[] = [
    { id: 0, entity: 'Topics', ic: 'icon-green', icon: 'doc', title: 'ACT Phase completed - moved to Templates & Standards', meta: [{ l: 'By', v: 'Dr. Elena Rossi', lnk: true }], time: 'just now', d: { st: { label: 'Standardisiert', cls: 'chip-green' }, rows: [{ i: 'hash', l: 'Topic ID', v: 'T-655' }, { i: 'tag', l: 'Titel', v: 'Reduktion postoperativer Infektionsraten', lnk: true }, { i: 'clock', l: 'Datum', v: '12.03.2026' }, { i: 'layers', l: 'Phase', v: 'ACT -> Templates & Standards' }, { i: 'doc', l: 'Standard Ref', v: 'STD-2026-011', lnk: true }, { i: 'user', l: 'Von', v: 'Dr. Elena Rossi', lnk: true }], tl: [{ e: 'PLAN Phase gestartet', t: '12.03.2026', a: true }, { e: 'DO Phase gestartet', t: '12.03.2026', a: true }, { e: 'CHECK Phase gestartet', t: '12.03.2026', a: true }, { e: 'ACT Phase gestartet', t: '12.03.2026', a: true }, { e: 'An Templates & Standards übergeben', t: '12.03.2026', a: true }] } },
    { id: 1, entity: 'Topics', ic: 'icon-orange', icon: 'wave', title: 'Topic T-655 moved to ACT phase', meta: [{ l: 'By', v: 'Dr. Elena Rossi', lnk: true }], time: '1h ago', d: { st: { label: 'ACT Phase', cls: 'chip-orange' }, rows: [{ i: 'hash', l: 'Topic ID', v: 'T-655' }, { i: 'user', l: 'Von', v: 'Dr. Elena Rossi', lnk: true }, { i: 'clock', l: 'Datum', v: '12.03.2026' }, { i: 'layers', l: 'Phase', v: 'CHECK -> ACT' }, { i: 'pin', l: 'Standort', v: 'Basel' }, { i: 'brief', l: 'Betriebe', v: 'Surgery Department' }], tl: [{ e: 'PLAN Phase gestartet', t: '12.03.2026', a: false }, { e: 'DO Phase gestartet', t: '12.03.2026', a: false }, { e: 'CHECK Phase gestartet', t: '12.03.2026', a: false }, { e: 'ACT Phase gestartet', t: '12.03.2026', a: true }] } },
    { id: 2, entity: 'Topics', ic: 'icon-orange', icon: 'wave', title: 'Topic T-655 moved to CHECK phase', meta: [{ l: 'By', v: 'Dr. Elena Rossi', lnk: true }], time: '1h ago', d: { st: { label: 'CHECK Phase', cls: 'chip-blue' }, rows: [{ i: 'hash', l: 'Topic ID', v: 'T-655' }, { i: 'user', l: 'Von', v: 'Dr. Elena Rossi', lnk: true }, { i: 'clock', l: 'Datum', v: '12.03.2026' }, { i: 'layers', l: 'Phase', v: 'DO -> CHECK' }, { i: 'pin', l: 'Standort', v: 'Basel' }], tl: [{ e: 'PLAN Phase gestartet', t: '12.03.2026', a: false }, { e: 'DO Phase gestartet', t: '12.03.2026', a: false }, { e: 'CHECK Phase gestartet', t: '12.03.2026', a: true }] } },
    { id: 3, entity: 'Topics', ic: 'icon-orange', icon: 'wave', title: 'Topic T-655 moved to DO phase', meta: [{ l: 'By', v: 'Dr. Elena Rossi', lnk: true }], time: '1h ago', d: { st: { label: 'DO Phase', cls: 'chip-blue' }, rows: [{ i: 'hash', l: 'Topic ID', v: 'T-655' }, { i: 'user', l: 'Von', v: 'Dr. Elena Rossi', lnk: true }, { i: 'clock', l: 'Datum', v: '12.03.2026' }, { i: 'layers', l: 'Phase', v: 'PLAN -> DO' }], tl: [{ e: 'PLAN Phase gestartet', t: '12.03.2026', a: false }, { e: 'DO Phase gestartet', t: '12.03.2026', a: true }] } },
    { id: 4, entity: 'Topics', ic: 'icon-orange', icon: 'wave', title: 'New PDCA Topic T-655 created', meta: [{ l: 'By', v: 'Dr. Elena Rossi', lnk: true }], time: '1h ago', d: { st: { label: 'Neu erstellt', cls: 'chip-green' }, rows: [{ i: 'hash', l: 'Topic ID', v: 'T-655' }, { i: 'user', l: 'Erstellt von', v: 'Dr. Elena Rossi', lnk: true }, { i: 'clock', l: 'Datum', v: '12.03.2026' }, { i: 'tag', l: 'Typ', v: 'PDCA Zyklus' }, { i: 'pin', l: 'Standort', v: 'Basel' }], tl: [{ e: 'PLAN Phase gestartet', t: '12.03.2026', a: true }] } },
    { id: 5, entity: 'Users', ic: 'icon-blue', icon: 'person', title: 'Neues klinisches Personal registriert', meta: [{ l: 'User', v: 'Dr. Julia Chen' }, { l: 'By', v: 'Dr. Elena Rossi', lnk: true }], time: '3h ago', d: { st: { label: 'Registriert', cls: 'chip-green' }, rows: [{ i: 'user', l: 'Name', v: 'Dr. Julia Chen' }, { i: 'brief', l: 'Fachbereich', v: 'Infectious Diseases' }, { i: 'pin', l: 'Standort', v: 'Zürich' }, { i: 'user', l: 'Registriert von', v: 'Dr. Elena Rossi', lnk: true }, { i: 'clock', l: 'Datum', v: '12.03.2026' }], tl: [{ e: 'Account aktiviert', t: '12.03.2026', a: true }, { e: 'Profil erstellt', t: '12.03.2026', a: false }] } },
    { id: 7, entity: 'Topics', ic: 'icon-orange', icon: 'wave', title: 'Topic moved to CHECK phase - Basel', meta: [{ l: 'By', v: 'Dr. Marcus Weber', lnk: true }], time: '09/03/2026', d: { st: { label: 'CHECK Phase', cls: 'chip-blue' }, rows: [{ i: 'hash', l: 'Topic ID', v: 'T-001' }, { i: 'tag', l: 'Titel', v: 'Reduktion postoperativer Infektionsraten', lnk: true }, { i: 'layers', l: 'Phase', v: 'DO -> CHECK' }, { i: 'user', l: 'Von', v: 'Dr. Marcus Weber', lnk: true }, { i: 'pin', l: 'Standort', v: 'Basel' }, { i: 'brief', l: 'Betriebe', v: 'Surgery Department' }, { i: 'clock', l: 'Datum', v: '09.03.2026' }], tl: [{ e: 'PLAN Phase gestartet', t: '01.03.2026', a: false }, { e: 'DO Phase gestartet', t: '05.03.2026', a: false }, { e: 'CHECK Phase gestartet', t: '09.03.2026', a: true }] } },
    { id: 9, entity: 'Locations', ic: 'icon-amber', icon: 'mappin', title: 'Standort hinzugefügt: Lausanne', meta: [{ l: 'Location', v: 'Lausanne' }, { l: 'By', v: 'Dr. Elena Rossi', lnk: true }], time: '08/03/2026', d: { st: { label: 'Hinzugefügt', cls: 'chip-green' }, rows: [{ i: 'hash', l: 'Location ID', v: 'LOC-VD' }, { i: 'tag', l: 'Name', v: 'CHUV Lausanne', lnk: true }, { i: 'pin', l: 'Stadt', v: 'Lausanne' }, { i: 'brief', l: 'Bereich', v: 'Quality & Patient Safety' }, { i: 'user', l: 'Von', v: 'Dr. Elena Rossi', lnk: true }, { i: 'clock', l: 'Datum', v: '08.03.2026' }], tl: [{ e: 'Standort aktiviert', t: '08.03.2026', a: true }, { e: 'Validierung abgeschlossen', t: '08.03.2026', a: false }] } }
];

const RenderIcon: React.FC<{ name: IconKey }> = ({ name }) => (
    <span className="al-svg" dangerouslySetInnerHTML={{ __html: SVG_ICONS[name] }} />
);

const ActivityLog: React.FC = () => {
    const { language } = useLanguage();
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<EntityFilter>('All Entities');
    const [activeLog, setActiveLog] = useState<LogEntry | null>(null);
    const [entryOpen, setEntryOpen] = useState(false);
    const isGerman = language === 'de';

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const q = query.trim().toLowerCase();
            const queryMatch = !q || log.title.toLowerCase().includes(q);
            const filterMatch = filter === 'All Entities' || log.entity === filter;
            return queryMatch && filterMatch;
        });
    }, [query, filter]);

    const openPanel = (log: LogEntry) => {
        setActiveLog(log);
        setEntryOpen(false);
    };

    const closePanel = () => {
        setActiveLog(null);
    };

    const openEntryPage = () => {
        if (!activeLog) return;
        setEntryOpen(true);
    };

    const closeEntryPage = () => {
        setEntryOpen(false);
    };

    const statRows = useMemo(() => {
        if (!activeLog) return [];
        const timeRow = activeLog.d.rows.find((r) => r.i === 'clock');
        const locRow = activeLog.d.rows.find((r) => r.i === 'pin');
        const depRow = activeLog.d.rows.find((r) => r.i === 'brief');
        const userRow = activeLog.d.rows.find((r) => r.i === 'user');
        if (activeLog.entity === 'Topics') {
            return [timeRow, userRow].filter(Boolean) as DetailRow[];
        }
        return [timeRow, locRow, depRow, userRow].filter(Boolean) as DetailRow[];
    }, [activeLog]);

    const getTopicPlanTitle = (log: LogEntry): string => {
        const topicId = log.d.rows.find((r) => r.l === 'Topic ID')?.v;
        if (!topicId) return '';

        const relatedTopicLogs = logs.filter(
            (item) =>
                item.entity === 'Topics' &&
                item.d.rows.some((r) => r.l === 'Topic ID' && r.v === topicId)
        );

        const explicitTitle = relatedTopicLogs
            .flatMap((item) => item.d.rows)
            .find((r) => r.l === 'Titel' || r.l === 'Title' || r.l === 'Topic Title')
            ?.v;

        if (explicitTitle) return explicitTitle;
        if (topicId === 'T-655') return 'Reduktion postoperativer Infektionsraten';
        return `Topic ${topicId}`;
    };

    const getScopeRowValue = (log: LogEntry, icon: DetailRow['i']): string => {
        const direct = log.d.rows.find((r) => r.i === icon)?.v;
        if (direct) return direct;

        if (log.entity !== 'Topics') return '-';
        const topicId = log.d.rows.find((r) => r.l === 'Topic ID')?.v;
        if (!topicId) return '-';

        const relatedValue = logs
            .filter(
                (item) =>
                    item.entity === 'Topics' &&
                    item.d.rows.some((r) => r.l === 'Topic ID' && r.v === topicId)
            )
            .flatMap((item) => item.d.rows)
            .find((r) => r.i === icon)
            ?.v;

        if (relatedValue) return relatedValue;

        // Last fallback for topic scope cards so Abteilungen is never empty in this demo data set.
        if (icon === 'brief') {
            const anyTopicDepartment = logs
                .filter((item) => item.entity === 'Topics')
                .flatMap((item) => item.d.rows)
                .find((r) => r.i === 'brief')
                ?.v;
            if (anyTopicDepartment) return anyTopicDepartment;
        }

        return '-';
    };

    const getRowsWithTopicTitle = (log: LogEntry): DetailRow[] => {
        const rows = [...log.d.rows];
        if (log.entity !== 'Topics') return rows;

        const hasTitle = rows.some((r) => r.l === 'Titel' || r.l === 'Title' || r.l === 'Topic Title');
        if (hasTitle) return rows;

        const titleRow: DetailRow = {
            i: 'tag',
            l: 'Titel',
            v: getTopicPlanTitle(log),
            lnk: true
        };

        const topicIdIndex = rows.findIndex((r) => r.l === 'Topic ID');
        if (topicIdIndex >= 0) {
            rows.splice(topicIdIndex + 1, 0, titleRow);
        } else {
            rows.unshift(titleRow);
        }

        return rows;
    };

    const phaseOrder = ['PLAN', 'DO', 'CHECK', 'ACT'] as const;

    const getCurrentTopicPhaseIndex = (log: LogEntry): number => {
        if (log.entity !== 'Topics') return -1;
        const label = log.d.st.label.toUpperCase();
        return phaseOrder.findIndex((phase) => label.includes(phase));
    };

    const getTimelinePhaseIndex = (event: string): number => {
        const upper = event.toUpperCase();
        return phaseOrder.findIndex((phase) => upper.includes(`${phase} PHASE`));
    };

    const isTimelineEventActive = (log: LogEntry, row: TimelineRow): boolean => {
        const eventPhaseIndex = getTimelinePhaseIndex(row.e);
        const currentPhaseIndex = getCurrentTopicPhaseIndex(log);

        if (eventPhaseIndex === -1 || currentPhaseIndex === -1) return row.a;
        return eventPhaseIndex <= currentPhaseIndex;
    };

    return (
        <div className="activity-log-exact">
            <main className="al-page">
                <div className="al-page-header">
                    <h1>{language === 'de' ? 'Aktivitätsprotokoll' : 'Activity Log'}</h1>
                    <p>System Governance Log Â· Clinical Audit Trail</p>
                </div>

                <div className="al-toolbar">
                    <div className="al-search-wrap">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            className="al-search-input"
                            placeholder="Search activity..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="al-select-wrap">
                        <select value={filter} onChange={(e) => setFilter(e.target.value as EntityFilter)}>
                            <option value="All Entities">{isGerman ? 'Alle Einheiten' : 'All Entities'}</option>
                            <option value="Topics">{isGerman ? 'Themen' : 'Topics'}</option>
                            <option value="Users">{isGerman ? 'Benutzer' : 'Users'}</option>
                            <option value="Locations">{isGerman ? 'Standorte' : 'Locations'}</option>
                            <option value="Departments">{isGerman ? 'Betriebe' : 'Departments'}</option>
                        </select>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                </div>

                <div className="al-log-list">
                    {filteredLogs.length ? filteredLogs.map((log) => (
                        <div key={log.id} className="al-log-item" onClick={() => openPanel(log)}>
                            <div className={`al-log-icon ${log.ic}`}>
                                <RenderIcon name={log.icon} />
                            </div>
                            <div className="al-log-body">
                                <div className="al-log-title">{log.title}</div>
                                <div className="al-log-meta">
                                    {log.meta.map((m, i) => {
                                        if (m.ico) {
                                            return (
                                                <React.Fragment key={`${log.id}-${i}`}>
                                                    <span className="al-log-sep">|</span>
                                                    <span>{m.v}</span>
                                                </React.Fragment>
                                            );
                                        }

                                        if (m.lnk) {
                                            return (
                                                <React.Fragment key={`${log.id}-${i}`}>
                                                    {i > 0 && <span className="al-log-sep">|</span>}
                                                    <span>{m.l}: <span className="al-log-meta-link">{m.v}</span></span>
                                                </React.Fragment>
                                            );
                                        }

                                        if (m.sys) {
                                            return (
                                                <React.Fragment key={`${log.id}-${i}`}>
                                                    <span className="al-log-sep">|</span>
                                                    <span>{m.l}: <span className="al-log-meta-sys">{m.v}</span></span>
                                                </React.Fragment>
                                            );
                                        }

                                        return <span key={`${log.id}-${i}`}>{m.l}: <strong>{m.v}</strong></span>;
                                    })}
                                </div>
                            </div>
                            <div className="al-log-time">{log.time}</div>
                            <div className="al-arrow-btn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </div>
                        </div>
                    )) : (
                        <div className="al-empty">Keine EintrÃ¤ge gefunden</div>
                    )}
                </div>
            </main>

            <div className={`al-overlay ${activeLog && !entryOpen ? 'open' : ''}`} onClick={closePanel} />

            <div className={`al-detail-panel ${activeLog && !entryOpen ? 'open' : ''}`}>
                {activeLog && (
                    <>
                        <div className="al-dp-header">
                            <div className="al-dp-header-left">
                                <div className={`al-dp-icon ${activeLog.ic}`}>
                                    <RenderIcon name={activeLog.icon} />
                                </div>
                                <div>
                                    <div className="al-dp-title">{activeLog.title}</div>
                                    <div className="al-dp-subtitle">{activeLog.time}</div>
                                </div>
                            </div>
                            <button className="al-btn-close" onClick={closePanel} aria-label="Close panel">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className="al-dp-body">
                            <div className="al-dp-section">
                                <div className="al-dp-section-title">Status</div>
                                <span className={`al-status-chip ${activeLog.d.st.cls}`}>{activeLog.d.st.label}</span>
                            </div>

                            <div className="al-dp-section">
                                <div className="al-dp-section-title">Details</div>
                                {getRowsWithTopicTitle(activeLog)
                                    .filter((row) => !(activeLog.entity === 'Topics' && (row.l === 'Standort' || row.l === 'Betriebe' || row.l === 'Standard Ref')))
                                    .map((row, idx) => (
                                    <div className="al-dp-row" key={`${activeLog.id}-row-${idx}`}>
                                        <div className="al-dp-row-icon"><RenderIcon name={row.i} /></div>
                                        <div className="al-dp-row-label">{row.l}</div>
                                        <div className={`al-dp-row-value ${row.lnk ? 'link' : ''}`}>{row.v}</div>
                                    </div>
                                    ))}
                            </div>

                            {activeLog.entity === 'Topics' && (
                                <div className="al-dp-section">
                                    <div className="al-dp-section-title">Verlauf</div>
                                    <div className="al-timeline">
                                        {activeLog.d.tl.map((row, idx) => (
                                            <div className="al-tl-item" key={`${activeLog.id}-tl-${idx}`}>
                                                <div className="al-tl-left">
                                                    <div className={`al-tl-dot ${isTimelineEventActive(activeLog, row) ? '' : 'muted'}`} />
                                                    <div className="al-tl-line" />
                                                </div>
                                                <div>
                                                    <div className="al-tl-event">{row.e}</div>
                                                    <div className="al-tl-time">{row.t}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="al-dp-footer">
                            <button className="al-btn-secondary" onClick={closePanel}>SchlieÃŸen</button>
                            <button className="al-btn-primary" onClick={openEntryPage}>Zum Eintrag â†’</button>
                        </div>
                    </>
                )}
            </div>

            <div className={`al-entry-page ${entryOpen && activeLog ? 'open' : ''}`}>
                {activeLog && (
                    <>
                        <div className="al-ep-topbar">
                            <button className="al-ep-back" onClick={closeEntryPage}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                Zurück
                            </button>
                            <div className="al-ep-breadcrumb">
                                <span>Activity Log</span>
                                <span className="sep">/</span>
                                <span className="current">{activeLog.title.length > 42 ? `${activeLog.title.slice(0, 42)}...` : activeLog.title}</span>
                            </div>
                            <div className="al-ep-topbar-chip">
                                <span className={`al-status-chip ${activeLog.d.st.cls} nav-chip`}>{activeLog.d.st.label}</span>
                            </div>
                        </div>

                        <div className="al-ep-banner">
                            <div className="al-ep-banner-inner">
                                <div className="al-ep-banner-top">
                                    <div className="al-ep-banner-left">
                                        <div className={`al-ep-banner-icon ${activeLog.ic}`}>
                                            <RenderIcon name={activeLog.icon} />
                                        </div>
                                        <div>
                                            <div className="al-ep-banner-title">{activeLog.title}</div>
                                            <div className="al-ep-banner-id">
                                                {(() => {
                                                    if (activeLog.entity === 'Topics') {
                                                        return `Topic Title: ${getTopicPlanTitle(activeLog)}`;
                                                    }
                                                    const idRow = activeLog.d.rows.find((r) => r.i === 'hash');
                                                    return idRow ? `${idRow.l}: ${idRow.v}` : '';
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="al-ep-banner-chips">
                                        <span className={`al-status-chip ${activeLog.d.st.cls}`}>{activeLog.d.st.label}</span>
                                    </div>
                                </div>

                                <div className="al-ep-stats">
                                    {statRows.map((row, i) => (
                                        <div className="al-ep-stat" key={`${activeLog.id}-stat-${i}`}>
                                            <div className="al-ep-stat-label">{row.l}</div>
                                            <div className={`al-ep-stat-value ${row.i === 'user' ? 'blue' : ''}`}>{row.v}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={`al-ep-body ${activeLog.entity === 'Topics' ? '' : 'no-side'}`}>
                            <div className="al-ep-main">
                                <div className="al-ep-card">
                                    <div className="al-ep-card-head"><div className="al-ep-card-title">Alle Details</div></div>
                                    <div className="al-ep-card-body">
                                        {getRowsWithTopicTitle(activeLog)
                                            .filter((row) => row.l !== 'Standort' && row.l !== 'Betriebe')
                                            .map((row, idx) => (
                                            <div className="al-ep-row" key={`${activeLog.id}-detail-${idx}`}>
                                                <div className="al-ep-row-icon"><RenderIcon name={row.i} /></div>
                                                <div className="al-ep-row-label">{row.l}</div>
                                                <div className={`al-ep-row-value ${row.lnk ? 'link' : ''}`}>{row.v}</div>
                                            </div>
                                            ))}
                                    </div>
                                </div>

                                <div className="al-ep-card al-ep-scope-card">
                                    <div className="al-ep-scope-section">
                                        <div className="al-ep-scope-head">
                                            <span className="al-ep-scope-icon"><RenderIcon name="pin" /></span>
                                            <span className="al-ep-scope-label">Standorte</span>
                                            <span className="al-ep-scope-count">{getScopeRowValue(activeLog, 'pin') === '-' ? '0' : '1'}</span>
                                        </div>
                                        <div className="al-ep-scope-value">
                                            {getScopeRowValue(activeLog, 'pin')}
                                        </div>
                                    </div>

                                    <div className="al-ep-scope-divider" />

                                    <div className="al-ep-scope-section">
                                        <div className="al-ep-scope-head">
                                            <span className="al-ep-scope-icon"><RenderIcon name="brief" /></span>
                                            <span className="al-ep-scope-label">Abteilungen</span>
                                            <span className="al-ep-scope-count">{getScopeRowValue(activeLog, 'brief') === '-' ? '0' : '1'}</span>
                                        </div>
                                        <div className="al-ep-scope-value">
                                            {getScopeRowValue(activeLog, 'brief')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {activeLog.entity === 'Topics' && (
                                <div className="al-ep-side">
                                    <div className="al-ep-card">
                                        <div className="al-ep-card-head"><div className="al-ep-card-title">Verlauf</div></div>
                                        <div className="al-ep-tl">
                                            {activeLog.d.tl.map((row, idx) => (
                                                <div className="al-ep-tl-item" key={`${activeLog.id}-entry-tl-${idx}`}>
                                                    <div className="al-ep-tl-left">
                                                        <div className={`al-ep-tl-dot ${isTimelineEventActive(activeLog, row) ? '' : 'muted'}`} />
                                                        <div className="al-ep-tl-line" />
                                                    </div>
                                                    <div>
                                                        <div className="al-ep-tl-event">{row.e}</div>
                                                        <div className="al-ep-tl-time">{row.t}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;














