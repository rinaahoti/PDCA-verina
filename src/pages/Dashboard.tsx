
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auditService } from '../services/auditService';
import { adminService } from '../services/adminService';
import { AuditFinding } from '../types';
import { Location, AppUser } from '../types/admin';
import { getStatusMeta, getStatusBadgeStyle } from '../utils/statusUtils';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    BarChart3,
    Filter,
    ChevronDown,
    Search,
    FileText,
    Activity,
    Repeat,
    ArrowRight,
    User,
    Calendar,
    MapPin,
    Building2,
    PieChart
} from 'lucide-react';

// --- Types ---

type Rating = 'Major' | 'Minor' | 'OFI';
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

// --- Sub-Components ---

const DonutChart = ({ data, size = 120, thickness = 12 }: { data: { label: string, value: number, color: string }[], size?: number, thickness?: number }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
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
                            />
                        );
                    })}
                </svg>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    textAlign: 'center', pointerEvents: 'none'
                }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)' }}>{total}</div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)', marginLeft: 'auto' }}>{Math.round((item.value / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarChart = ({ data }: { data: { label: string, value: number }[] }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '100%', paddingTop: '1rem' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%' }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{
                            width: '60%',
                            height: `${(d.value / max) * 100}% `,
                            background: 'var(--color-primary)',
                            borderRadius: '4px 4px 0 0',
                            minHeight: '4px',
                            opacity: 0.8
                        }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'center' }}>{d.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>{d.value}</div>
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
            // Note: f.auditType is on finding, but simple string. auditTypeParam compares to that string.
            if (auditTypeParam !== 'All' && f.auditType !== auditTypeParam) return false;
            if (locationParam !== 'All' && f.location !== locationParam) return false;
            if (responsibleParam !== 'All' && f.responsible !== responsibleParam) return false;
            return true;
        });
    }, [auditIdParam, auditTypeParam, locationParam, responsibleParam]);

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

    // --- Render Helpers ---

    const FilterDropdown = ({ label, value, options, onChange }: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        appearance: 'none',
                        width: '100%',
                        padding: '8px 32px 8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        fontSize: '13px',
                        color: 'var(--color-text)',
                        background: 'white',
                        fontWeight: 500,
                        cursor: 'pointer',
                        minWidth: '140px'
                    }}
                >
                    <option value="All">All</option>
                    {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
            </div>
        </div>
    );

    const KPICard = ({ title, value, subtext, color = '#1e293b', icon: Icon }: any) => (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
                {Icon && <Icon size={18} color={color} style={{ opacity: 0.8 }} />}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: color }}>{value}</div>
            {subtext && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{subtext}</div>}
        </div>
    );

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* 1. FILTER BAR */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', borderRight: '1px solid var(--color-border)', paddingRight: '1.5rem' }}>
                    <Filter size={20} color="var(--color-text-muted)" />
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Filters</span>
                </div>
                <FilterDropdown
                    label="Audit ID / Name"
                    value={auditIdParam}
                    options={Array.from(new Set(findings.map(f => f.auditId)))}
                    onChange={(v: string) => updateFilter('auditId', v)}
                />
                <FilterDropdown
                    label="Type"
                    value={auditTypeParam}
                    options={['Internal', 'External']}
                    onChange={(v: string) => updateFilter('auditType', v)}
                />
                <FilterDropdown
                    label="Location"
                    value={locationParam}
                    options={Array.from(new Set([...locations.map(l => l.name), ...findings.map(f => f.location)]))}
                    onChange={(v: string) => updateFilter('location', v)}
                />
                <FilterDropdown
                    label="Responsible"
                    value={responsibleParam}
                    options={Array.from(new Set([...users.map(u => u.fullName), ...findings.map(f => f.responsible)]))}
                    onChange={(v: string) => updateFilter('responsible', v)}
                />
                <div style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={resetFilters}>
                        <Repeat size={14} /> Reset Filters
                    </button>
                </div>
            </div>

            {/* 2. KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <KPICard title="Total Findings" value={totalFindings} icon={FileText} color="var(--color-text)" />
                <KPICard title="Overdue / Critical" value={statsByStatus['status-critical']} subtext="Requires immediate action" color="var(--color-status-red)" icon={AlertTriangle} />
                <KPICard title="Due Soon" value={statsByStatus['status-warning']} subtext="Warning window active" color="var(--color-status-yellow)" icon={Clock} />
                <KPICard title="Completed (Done)" value={statsByStatus['status-done']} subtext="Successfully validated" color="var(--color-status-done)" icon={CheckCircle2} />
            </div>

            {/* Breakdown by Rating Row */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>Breakdown by Severity Rating</div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 1, padding: '1rem', background: '#fee2e2', borderRadius: '12px', textAlign: 'center', border: '1px solid #fecaca' }}>
                        <div style={{ color: 'var(--color-status-red)', fontSize: '24px', fontWeight: 800 }}>{byRating.major}</div>
                        <div style={{ color: '#7f1d1d', fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>MAJOR</div>
                    </div>
                    <div style={{ flex: 1, padding: '1rem', background: '#fef9c3', borderRadius: '12px', textAlign: 'center', border: '1px solid #fde68a' }}>
                        <div style={{ color: 'var(--color-status-yellow)', fontSize: '24px', fontWeight: 800 }}>{byRating.minor}</div>
                        <div style={{ color: '#78350f', fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>MINOR</div>
                    </div>
                    <div style={{ flex: 1, padding: '1rem', background: 'var(--color-primary-light)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--color-primary)' }}>
                        <div style={{ color: 'var(--color-primary)', fontSize: '24px', fontWeight: 800 }}>{byRating.ofi}</div>
                        <div style={{ color: 'var(--color-primary-dark)', fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>OFI</div>
                    </div>
                </div>
            </div>

            {/* 3. CHARTS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#334155' }}>Findings per Location</h3>
                    <div style={{ height: '200px' }}>
                        <BarChart data={byLocation} />
                    </div>
                </div>
                <div className="card" style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#334155' }}>Findings by Rating</h3>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DonutChart data={[
                            { label: 'Major', value: byRating.major, color: 'var(--color-status-red)' },
                            { label: 'Minor', value: byRating.minor, color: 'var(--color-status-yellow)' },
                            { label: 'OFI', value: byRating.ofi, color: 'var(--color-primary)' }
                        ]} />
                    </div>
                </div>
                <div className="card" style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#334155' }}>Findings by Cause</h3>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DonutChart data={
                            byCause.length > 0 ? byCause.map((c, i) => ({ ...c, color: ['var(--color-primary)', 'var(--color-primary-dark)', '#f4c542', '#22C55E'][i % 4] }))
                                : [{ label: 'N/A', value: 1, color: 'var(--color-border)' }]
                        } />
                    </div>
                </div>
            </div>

            {/* 4. PDCA VISIBILITY & ACTIVITY (Split Layout) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* PDCA Flow */}
                <div className="card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>Findings Lifecycle (PDCA)</h3>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'var(--color-bg)', padding: '4px 12px', borderRadius: '20px', fontWeight: 600 }}>
                            Live Status
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', position: 'relative' }}>
                        {/* Connecting Line */}
                        <div style={{ position: 'absolute', top: '24px', left: '12.5%', right: '12.5%', height: '2px', background: 'var(--color-border)', zIndex: 0 }} />

                        {(['PLAN', 'DO', 'CHECK', 'ACT'] as PDCA_Step[]).map((step, i) => (
                            <div key={step} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: byStep[step] > 0 ? 'var(--color-primary-light)' : 'white',
                                    border: `2px solid ${byStep[step] > 0 ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: byStep[step] > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: 700,
                                    fontSize: '18px',
                                    boxShadow: byStep[step] > 0 ? '0 4px 6px -1px rgba(46, 174, 158, 0.1)' : 'none'
                                }}>
                                    {byStep[step]}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '14px' }}>{step}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Phase {i + 1}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Audit Trail Activity */}
                <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-bg)' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Audit Trail</h3>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', maxHeight: '250px', padding: '0 1.25rem' }}>
                        {MOCK_ACTIVITY.map((log, i) => (
                            <div key={log.id} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: i === MOCK_ACTIVITY.length - 1 ? 'none' : '1px solid var(--color-bg)' }}>
                                <div style={{ paddingTop: '2px' }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: log.action.includes('Alert') ? 'var(--color-status-red)' : 'var(--color-primary)'
                                    }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{log.action}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0' }}>{log.details}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{log.user}</span>
                                        <span>•</span>
                                        <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                        {log.step && <span style={{ background: 'var(--color-bg)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>{log.step}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 5. AUDIT FINDINGS TABLE */}
            <div className="card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Detailed Audit Findings</h3>
                    <div style={{ position: 'relative' }}>
                        <input type="text" placeholder="Search findings..." style={{ padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', width: '250px' }} />
                        <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>ID / Rating</th>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Findings Title</th>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Location & Audit</th>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Responsible</th>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Deadline</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFindings.map((f) => {
                            const meta = getStatusMeta(f.status, f.deadline, f.status === 'ACT');
                            const badgeStyle = getStatusBadgeStyle(f.status, f.deadline, f.status === 'ACT');

                            return (
                                <tr key={f.id} onClick={() => console.log('Nav to', f.id)} style={{ borderBottom: '1px solid var(--color-bg)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-row-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{f.id}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.rating === 'Major' ? 'var(--color-status-red)' : f.rating === 'Minor' ? 'var(--color-status-yellow)' : 'var(--color-primary)' }} />
                                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{f.rating}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{f.title}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Cause: {f.cause}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text)' }}>
                                            <MapPin size={14} color="var(--color-text-muted)" /> {f.location}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', paddingLeft: '20px' }}>{f.auditType} • <span style={{ fontWeight: 600 }}>{f.auditId}</span></div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                                {f.responsible.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{f.responsible}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Assigned: {f.assigned}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            ...badgeStyle,
                                            border: `1px solid ${meta.color}`
                                        }}>
                                            {meta.label.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: meta.class === 'status-critical' ? 'var(--color-status-red)' : 'var(--color-text)', fontWeight: meta.class === 'status-critical' ? 700 : 400 }}>
                                            <Calendar size={14} /> {new Date(f.deadline).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
