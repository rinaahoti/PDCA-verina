import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auditService } from '../services/auditService';
import { adminService } from '../services/adminService';
import { AuditFinding } from '../types';
import { Location, AppUser } from '../types/admin';
import { getStatusMeta } from '../utils/statusUtils';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Filter,
    ChevronDown,
    Search,
    FileText,
    Activity,
    Calendar,
    MapPin,
    User
} from 'lucide-react';
import '../styles/dashboard-ref.css';

// --- Types ---
type PDCA_Step = 'PLAN' | 'DO' | 'CHECK' | 'ACT';

interface AuditLog {
    id: string;
    user: string;
    action: string;
    step: PDCA_Step;
    timestamp: string;
    details: string;
}

const MOCK_ACTIVITY: AuditLog[] = [
    { id: 'L-01', user: 'Sophia Mayer', action: 'Downgraded Rating', step: 'PLAN', timestamp: '2024-02-20T10:30:00', details: 'Changed from Major to Minor after review' },
    { id: 'L-02', user: 'Hans Mueller', action: 'Uploaded Evidence', step: 'DO', timestamp: '2024-02-20T09:15:00', details: 'Added fire extinguisher maintenance content' },
    { id: 'L-03', user: 'Audit Team', action: 'Finding Created', step: 'PLAN', timestamp: '2024-02-19T16:45:00', details: 'New finding identified in Berlin Plant' },
    { id: 'L-04', user: 'Sarah Weber', action: 'Effectiveness Verified', step: 'CHECK', timestamp: '2024-02-19T14:20:00', details: 'Training records confirmed complete' },
    { id: 'L-05', user: 'System', action: 'Overdue Alert', step: 'DO', timestamp: '2024-02-19T08:00:00', details: 'Finding F-24-001 is approaching deadline' },
];

// --- Sub-Components (Restyled) ---

const DonutChart = ({ data, size = 140, thickness = 14 }: { data: { label: string, value: number, color: string }[], size?: number, thickness?: number }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg viewBox={`0 0 ${size} ${size} `} style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {data.map((item, i) => {
                        const percent = total > 0 ? (item.value / total) * 100 : 0;
                        if (percent === 0) return null;
                        const strokeDasharray = `${(percent / 100) * circumference} ${circumference} `;
                        const strokeDashoffset = -(cumulativePercent / 100) * circumference;
                        cumulativePercent += percent;
                        return (
                            <circle
                                key={i}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth={thickness}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    textAlign: 'center', pointerEvents: 'none'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{total}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Total</div>
                </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                        <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontWeight: 800, color: 'var(--text)', marginLeft: 'auto' }}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarChart = ({ data }: { data: { label: string, value: number }[] }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem', height: '100%', width: '100%', padding: '1rem 0' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', height: '100%' }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
                        <div
                            className="bar-fill"
                            style={{
                                width: '90%',
                                maxWidth: '32px',
                                height: `${(d.value / max) * 100}% `,
                                background: i % 2 === 0 ? 'var(--accent)' : 'var(--blue)',
                                borderRadius: '10px 10px 0 0',
                                minHeight: '6px',
                                transition: 'height 0.8s ease'
                            }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 800, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>{d.value}</div>
                </div>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters State - Synced with URL Params
    const auditIdParam = searchParams.get('auditId') || 'All';
    const auditTypeParam = searchParams.get('auditType') || 'All';
    const locationParam = searchParams.get('location') || 'All';
    const responsibleParam = searchParams.get('responsible') || 'All';

    // Helper to update URL params
    const updateFilter = (key: string, value: string) => {
        setSearchParams(prev => {
            if (value === 'All') prev.delete(key);
            else prev.set(key, value);
            return prev;
        });
    };

    const resetFilters = () => {
        setSearchParams({});
    };

    const [findings, setFindings] = useState<AuditFinding[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);

    useEffect(() => {
        const load = () => {
            setFindings(auditService.getAllFindings());
            setLocations(adminService.getLocations());
            setUsers(adminService.getUsers());
        };
        load();
        window.addEventListener('storage', load);
        window.addEventListener('storage-admin', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('storage-admin', load);
        };
    }, []);

    // Derived Data
    const filteredFindings = useMemo(() => {
        return findings.filter(f => {
            if (auditIdParam !== 'All' && f.auditId !== auditIdParam) return false;
            if (auditTypeParam !== 'All' && f.auditType !== auditTypeParam) return false;
            if (locationParam !== 'All' && f.location !== locationParam) return false;
            if (responsibleParam !== 'All' && f.responsible !== responsibleParam) return false;
            return true;
        });
    }, [auditIdParam, auditTypeParam, locationParam, responsibleParam, findings]);

    // Metrics based on filtered data
    const totalFindings = filteredFindings.length;

    const statsByStatus = useMemo(() => {
        const counts = {
            'status-critical': 0,
            'status-warning': 0,
            'status-ontrack': 0,
            'status-done': 0
        };
        filteredFindings.forEach(f => {
            const meta = getStatusMeta(f.status, f.deadline, f.status === 'ACT');
            counts[meta.class as keyof typeof counts]++;
        });
        return counts;
    }, [filteredFindings]);

    const openFindings = statsByStatus['status-critical'] + statsByStatus['status-warning'] + statsByStatus['status-ontrack'];
    const closedFindings = statsByStatus['status-done'];

    const byRating = {
        major: filteredFindings.filter(f => f.rating === 'Major').length,
        minor: filteredFindings.filter(f => f.rating === 'Minor').length,
        ofi: filteredFindings.filter(f => f.rating === 'OFI').length,
    };

    const byLocation = Object.entries(filteredFindings.reduce((acc, f) => {
        acc[f.location] = (acc[f.location] || 0) + 1;
        return acc;
    }, {} as Record<string, number>)).map(([label, value]) => ({ label, value }));

    const byCause = Object.entries(filteredFindings.reduce((acc, f) => {
        acc[f.cause] = (acc[f.cause] || 0) + 1;
        return acc;
    }, {} as Record<string, number>)).map(([label, value]) => ({ label, value }));

    const byStep = {
        PLAN: filteredFindings.filter(f => f.status === 'PLAN').length,
        DO: filteredFindings.filter(f => f.status === 'DO').length,
        CHECK: filteredFindings.filter(f => f.status === 'CHECK').length,
        ACT: filteredFindings.filter(f => f.status === 'ACT').length,
    };

    // --- Render ---

    return (
        <div className="refDash">
            <div className="container">

                {/* 1. HEADER ROW */}
                <header className="header-row">
                    <div>
                        <h1 className="header-title">Executive Insights</h1>
                        <p className="header-subtitle">Performance analysis and compliance monitoring for all locations</p>
                    </div>
                    <div className="header-actions">
                        <button className="control-btn">
                            <Calendar size={18} />
                            <span>Change Periode</span>
                            <ChevronDown size={14} />
                        </button>
                        <button className="control-btn" onClick={resetFilters}>Reset All</button>
                        <button className="control-btn btn-primary" onClick={() => window.print()}>Export Report</button>
                    </div>
                </header>

                {/* 2. STAT CARDS ROW */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--text)' }}><FileText size={20} /></div>
                        <div>
                            <div className="stat-value">{totalFindings}</div>
                            <div className="stat-label">Total Findings</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--red)', background: '#FCE7E1' }}><AlertTriangle size={20} /></div>
                        <div>
                            <div className="stat-value">{statsByStatus['status-critical']}</div>
                            <div className="stat-label">Critical Issues</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--yellow)', background: '#FDF7E1' }}><Clock size={20} /></div>
                        <div>
                            <div className="stat-value">{statsByStatus['status-warning']}</div>
                            <div className="stat-label">Pending Review</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--green)', background: '#E1F7ED' }}><CheckCircle2 size={20} /></div>
                        <div>
                            <div className="stat-value">{statsByStatus['status-done']}</div>
                            <div className="stat-label">Resolved Cases</div>
                        </div>
                    </div>
                </div>

                {/* 3. FILTERS (INTEGRATED) */}
                <div className="grid-card" style={{ padding: '1.25rem', marginBottom: '32px', display: 'flex', flexDirection: 'row', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '1rem', borderRight: '1px solid var(--border)', paddingRight: '1.5rem' }}>
                        <Filter size={20} color="var(--muted)" />
                        <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Analysis Filters</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
                        {[
                            { label: 'Audit ID', key: 'auditId', options: Array.from(new Set(findings.map(f => f.auditId))), current: auditIdParam },
                            { label: 'Type', key: 'auditType', options: ['Internal', 'External'], current: auditTypeParam },
                            { label: 'Location', key: 'location', options: Array.from(new Set([...locations.map(l => l.name), ...findings.map(f => f.location)])), current: locationParam },
                            { label: 'Lead', key: 'responsible', options: Array.from(new Set([...users.map(u => u.fullName), ...findings.map(f => f.responsible)])), current: responsibleParam }
                        ].map(f => (
                            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                                <select
                                    className="control-btn"
                                    style={{ height: '36px', padding: '0 24px 0 12px', minWidth: '160px' }}
                                    value={f.current}
                                    onChange={(e) => updateFilter(f.key, e.target.value)}
                                >
                                    <option value="All">All Entities</option>
                                    {f.options.map((o: any) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. MAIN GRID (Chart + Right Widgets) */}
                <div className="main-grid">
                    {/* Left: Geographic/Location Chart */}
                    <div className="grid-card">
                        <header className="card-header">
                            <h3 className="card-title">Geographic Distribution</h3>
                            <select className="control-btn" style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}>
                                <option>Current Month</option>
                                <option>Last Quarter</option>
                            </select>
                        </header>
                        <div className="chart-container" style={{ flex: 1 }}>
                            {byLocation.length > 0 ? <BarChart data={byLocation} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '14px' }}>No location data available</div>}
                        </div>
                    </div>

                    {/* Right:severity + Audit Trail Stack */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Right Top: Finding Severity */}
                        <div className="grid-card">
                            <header className="card-header">
                                <h3 className="card-title">Finding Severity</h3>
                                <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Total {totalFindings}</div>
                            </header>
                            <div style={{ padding: '10px 0' }}>
                                <DonutChart data={[
                                    { label: 'Major', value: byRating.major, color: 'var(--red)' },
                                    { label: 'Minor', value: byRating.minor, color: 'var(--yellow)' },
                                    { label: 'OFI', value: byRating.ofi, color: 'var(--accent)' }
                                ]} />
                            </div>
                        </div>

                        {/* Right Bottom: Audit Trail */}
                        <div className="grid-card" style={{ flex: 1 }}>
                            <header className="card-header">
                                <h3 className="card-title">Audit Trail</h3>
                                <button className="control-btn" style={{ height: '28px', fontSize: '10px' }}>View All</button>
                            </header>
                            <div style={{ overflow: 'auto', maxHeight: '320px' }}>
                                {MOCK_ACTIVITY.map((log) => (
                                    <div key={log.id} className="feed-item">
                                        <div className="feed-icon">
                                            {log.action.includes('Alert') ? <Activity size={16} color="var(--red)" /> : <User size={16} color="var(--accent)" />}
                                        </div>
                                        <div>
                                            <div className="feed-title">{log.action}</div>
                                            <div className="feed-meta">{log.details}</div>
                                            <div className="feed-meta" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                <span style={{ fontWeight: 700 }}>{log.user}</span>
                                                <span style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>{log.step}</span>
                                            </div>
                                        </div>
                                        <div className="feed-time">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. COMPLIANCE LIFECYCLE (Timeline) */}
                <div className="grid-card" style={{ marginBottom: '32px' }}>
                    <header className="card-header" style={{ marginBottom: '32px' }}>
                        <div>
                            <h3 className="card-title">Compliance Lifecycle</h3>
                            <p className="header-subtitle" style={{ fontSize: '12px' }}>PDCA workflow progression across all active findings</p>
                        </div>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>ACTIVE PHASE</span>
                            </div>
                        </div>
                    </header>

                    <div className="lifecycle-row">
                        <div className="lifecycle-line" />
                        {(['PLAN', 'DO', 'CHECK', 'ACT'] as PDCA_Step[]).map((step, i) => (
                            <div key={step} className="lifecycle-node">
                                <div className={`node-circle ${byStep[step] > 0 ? 'active' : ''}`}>
                                    {byStep[step]}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div className="node-label">{step}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--muted2)', fontWeight: 600, marginTop: '2px' }}>Phase 0{i + 1}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. FINDINGS TABLE (POLISHED) */}
                <div className="grid-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="card-title">Compliance Registry</h3>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search repository..."
                                className="control-btn"
                                style={{ paddingLeft: '40px', width: '280px', height: '38px' }}
                            />
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ background: 'var(--surface2)' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--muted)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ENTITY / RATING</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--muted)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FINDING STATUS</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--muted)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LOCATION</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--muted)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RESPONSIBLE</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--muted)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS MARK</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--muted)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DUE DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFindings.length > 0 ? filteredFindings.map((f) => {
                                    const meta = getStatusMeta(f.status, f.deadline, f.status === 'ACT');
                                    return (
                                        <tr key={f.id} style={{ borderBottom: '1px solid var(--surface2)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontWeight: 800, color: 'var(--text)' }}>{f.id}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: f.rating === 'Major' ? 'var(--red)' : f.rating === 'Minor' ? 'var(--yellow)' : 'var(--accent)' }} />
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>{f.rating}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{f.title}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{f.cause}</div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600 }}>
                                                    <MapPin size={14} color="var(--muted)" /> {f.location}
                                                </div>
                                                <div style={{ fontSize: '10px', color: 'var(--muted2)', marginTop: '4px', paddingLeft: '22px', fontWeight: 700 }}>{f.auditId}</div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--muted)' }}>
                                                        {f.responsible.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{f.responsible}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{f.assigned}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 14px',
                                                    borderRadius: '10px',
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    background: 'var(--surface2)',
                                                    border: '1px solid var(--border)',
                                                    color: 'var(--text)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color }} />
                                                    {meta.label}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: meta.class === 'status-critical' ? 'var(--red)' : 'var(--text)', fontWeight: 700 }}>
                                                    <Calendar size={14} /> {new Date(f.deadline).toLocaleDateString()}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>No findings matching filters</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
