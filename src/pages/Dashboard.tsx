import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auditService } from '../services/auditService';
import { adminService } from '../services/adminService';
import { activityService } from '../services/activityService';
import { AuditFinding } from '../types';
import { Location, AppUser, Department } from '../types/admin';
import { ActivityEntry } from '../types/activity';
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
    TrendingUp,
    Eye,
    CheckCircle
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
    { id: 'L-01', user: 'Dr. Elena Rossi', action: 'Risk Level Adjusted', step: 'PLAN', timestamp: '2024-02-20T10:30:00', details: 'Severity changed after clinical review – Zurich' },
    { id: 'L-02', user: 'Dr. Marcus Weber', action: 'Clinical Evidence Uploaded', step: 'DO', timestamp: '2024-02-20T09:15:00', details: 'Added surgical prep checklist validation documents – Geneva' },
    { id: 'L-03', user: 'TJC Survey Team', action: 'Finding Identified', step: 'PLAN', timestamp: '2024-02-19T16:45:00', details: 'New documentation deficiency found – Bern' },
    { id: 'L-04', user: 'Sarah Johnson', action: 'Safety Protocol Verified', step: 'CHECK', timestamp: '2024-02-19T14:20:00', details: 'Medication double-check records confirmed – Basel' },
    { id: 'L-05', user: 'System', action: 'Clinical Deadline Alert', step: 'DO', timestamp: '2024-02-19T08:00:00', details: 'PDCA topic moved to CHECK phase – Lausanne' },
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
    const colors = ['#EF4444', '#3B82F6', '#F97316', '#3B82F6', '#EF4444']; // Red, Blue, Orange pattern

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', height: '100%', paddingTop: '1rem', justifyContent: 'space-around' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', height: '100%', maxWidth: '80px' }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{
                            width: '100%',
                            height: `${(d.value / max) * 100}%`,
                            background: colors[i % colors.length],
                            borderRadius: '6px 6px 0 0',
                            minHeight: '8px',
                            transition: 'all 0.3s ease'
                        }} />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text)', fontWeight: 700, textAlign: 'center', lineHeight: '1.2', textTransform: 'uppercase' }}>
                        {d.label.split(' ')[0]}<br />{d.label.split(' ').slice(1).join(' ')}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)' }}>{d.value}</div>
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
    const departmentParam = searchParams.get('department') || 'All';
    const locationParam = searchParams.get('location') || 'All';
    const statusParam = searchParams.get('status') || 'All';

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

    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [timeRange, setTimeRange] = useState('Last Month');

    useEffect(() => {
        const load = () => {
            setFindings(auditService.getAllFindings());
            setLocations(adminService.getLocations());
            setDepartments(adminService.getDepartments());
            setUsers(adminService.getUsers());
            setActivities(activityService.getActivities());
        };
        load();
        window.addEventListener('storage', load);
        window.addEventListener('storage-admin', load);
        window.addEventListener('storage-activity', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('storage-admin', load);
            window.removeEventListener('storage-activity', load);
        };
    }, []);

    // Helper to derive department from finding
    const getDepartment = (f: AuditFinding): string => {
        const text = (f.title + f.auditName + f.responsible + f.location).toLowerCase();
        if (text.includes('pharmacy')) return 'Main Pharmacy';
        if (text.includes('surgery') || text.includes('surgical') || text.includes('or ')) return 'Surgery Department';
        if (text.includes('infection') || text.includes('isolation')) return 'Infectious Diseases';
        if (text.includes('emergency')) return 'Emergency Medicine';
        return 'Quality & Patient Safety'; // Default
    };

    // Derived Data
    const filteredFindings = useMemo(() => {
        return findings.filter(f => {
            if (auditIdParam !== 'All' && f.auditId !== auditIdParam) return false;

            if (departmentParam !== 'All') {
                const dep = getDepartment(f);
                if (dep !== departmentParam) return false;
            }

            if (locationParam !== 'All' && f.location !== locationParam) return false;

            if (statusParam !== 'All') {
                const meta = getStatusMeta(f.status, f.deadline, f.status === 'ACT');
                const label = meta.label; // "Overdue", "Due Soon", "On Track", "Done"

                if (statusParam === 'Critical' && (label === 'Overdue' || label === 'Critical')) return true;
                if (statusParam === 'Warning' && (label === 'Due Soon' || label === 'Warning')) return true;
                if (statusParam === 'On Track' && label === 'On Track') return true;
                if (statusParam === 'Done' && (label === 'Done' || label === 'Completed')) return true;

                // Fallback for direct match if labels change
                if (label === statusParam) return true;

                return false;
            }

            // Time Range Logic
            const created = new Date(f.createdAt);
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (timeRange === 'Today' && created < startOfDay) return false;
            if (timeRange === 'Last Week') {
                const limit = new Date(now);
                limit.setDate(now.getDate() - 7);
                if (created < limit) return false;
            }
            if (timeRange === 'Last Month') {
                const limit = new Date(now);
                limit.setMonth(now.getMonth() - 1);
                if (created < limit) return false;
            }
            if (timeRange === 'Last 6 Months') {
                const limit = new Date(now);
                limit.setMonth(now.getMonth() - 6);
                if (created < limit) return false;
            }
            if (timeRange === 'Last Year') {
                const limit = new Date(now);
                limit.setFullYear(now.getFullYear() - 1);
                if (created < limit) return false;
            }

            return true;
        });
    }, [auditIdParam, departmentParam, locationParam, statusParam, findings, timeRange]);

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

    const byLocation = locations
        .filter(l => locationParam === 'All' || l.name.trim() === locationParam.trim())
        .map(l => ({
            label: l.name,
            value: filteredFindings.filter(f => f.location === l.name).length
        }));

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

    const FilterDropdown = ({ label, value, options, onChange, placeholder = 'All' }: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        appearance: 'none',
                        width: '100%',
                        padding: '6px 28px 6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        fontSize: '12px',
                        color: 'var(--color-text)',
                        background: 'white',
                        fontWeight: 500,
                        cursor: 'pointer',
                        minWidth: '120px'
                    }}
                >
                    {placeholder && <option value="All">{placeholder}</option>}
                    {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* HEADER */}


            {/* KPI CARDS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(100,116,139,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={20} color="#64748B" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>TOTAL FINDINGS</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)' }}>{totalFindings}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={20} color="#EF4444" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>CRITICAL ISSUES</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#EF4444' }}>{statsByStatus['status-critical']}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Eye size={20} color="#F59E0B" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>PENDING REVIEW</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B' }}>0</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={20} color="#22C55E" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>RESOLVED CASES</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#22C55E' }}>{statsByStatus['status-done']}</div>
                    </div>
                </div>
            </div>

            {/* TOP ACTIONS BAR */}
            <div className="card" style={{ padding: '1.25rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '2rem', borderRight: '2px solid var(--color-border)', height: '100%' }}>
                    <Filter size={20} color="var(--color-text)" strokeWidth={2} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ANALYSIS FILTERS</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
                    <div style={{ flex: 1 }}>
                        <FilterDropdown
                            label="LOCATION"
                            value={locationParam}
                            options={[
                                'University Hospital Zurich (ZH)',
                                'Geneva University Hospitals (GE)',
                                'Inselspital Bern (BE)',
                                'University Hospital Basel (BS)',
                                'CHUV Lausanne (VD)'
                            ]}
                            onChange={(v: string) => updateFilter('location', v)}
                            placeholder="All Entities"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <FilterDropdown
                            label="DEPARTMENT"
                            value={departmentParam}
                            options={departments.map(d => d.name)}
                            onChange={(v: string) => updateFilter('department', v)}
                            placeholder="All Departments"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <FilterDropdown
                            label="STATUS"
                            value={statusParam}
                            options={['On Track', 'Critical', 'Warning', 'Done']}
                            onChange={(v: string) => updateFilter('status', v)}
                            placeholder={null}
                        />
                    </div>
                </div>
            </div>

            {/* CHARTS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Geographic Distribution */}
                <div className="card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                            Overview
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {timeRange === 'Custom' && (
                                <input type="date" style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '12px' }} />
                            )}
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                style={{ padding: '6px 32px 6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', appearance: 'none', background: 'white', cursor: 'pointer' }}
                            >
                                <option>Today</option>
                                <option>Last Week</option>
                                <option>Last Month</option>
                                <option>Last 6 Months</option>
                                <option>Last Year</option>
                                <option>Custom</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ height: '280px' }}>
                        <BarChart data={byLocation} />
                    </div>
                </div>

                {/* Finding Severity */}
                <div className="card" style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Finding Severity</h3>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total: {totalFindings}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DonutChart data={[
                            { label: 'Major', value: byRating.major, color: '#EF4444' },
                            { label: 'Minor', value: byRating.minor, color: '#F59E0B' },
                            { label: 'OFI', value: byRating.ofi, color: '#FCD34D' }
                        ]} size={140} thickness={16} />
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { label: 'Major', value: byRating.major, color: '#EF4444' },
                            { label: 'Minor', value: byRating.minor, color: '#F59E0B' },
                            { label: 'OFI', value: byRating.ofi, color: '#FCD34D' }
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                                    <span style={{ color: 'var(--color-text)' }}>{item.label}</span>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RECENT ACTIVITY & COMPLIANCE LIFECYCLE */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Recent Activity */}
                <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Recent Activity</h3>
                        <button
                            onClick={() => navigate('/app/activity-log')}
                            style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            View All
                        </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', maxHeight: '320px', padding: '0 1.25rem' }}>
                        {activities.slice(0, 5).map((activity, i) => {
                            const getActivityIcon = () => {
                                if (activity.type.includes('USER')) return <User size={8} color="var(--color-primary)" />;
                                if (activity.type.includes('DEPARTMENT')) return <Building2 size={8} color="#8b5cf6" />;
                                if (activity.type.includes('LOCATION')) return <MapPin size={8} color="var(--color-status-yellow)" />;
                                if (activity.type.includes('PDCA') || activity.type.includes('TOPIC')) return <Activity size={8} color="var(--color-primary)" />;
                                return <Clock size={8} color="var(--color-text-muted)" />;
                            };

                            const getPhaseBadge = () => {
                                // Extract phase from message if it's a PDCA phase update
                                if (activity.type === 'PDCA_PHASE_UPDATED') {
                                    const phases = ['PLAN', 'DO', 'CHECK', 'ACT'];
                                    for (const phase of phases) {
                                        if (activity.message.includes(phase)) {
                                            return <span style={{ background: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{phase}</span>;
                                        }
                                    }
                                }
                                return null;
                            };

                            return (
                                <div
                                    key={activity.id}
                                    style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        padding: '1rem 0',
                                        borderBottom: i === Math.min(activities.length, 5) - 1 ? 'none' : '1px solid var(--color-bg)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        // Navigate based on entity type
                                        if (activity.entityType === 'Topic' && activity.entityId) {
                                            navigate(`/app/topic/${activity.entityId}`);
                                        } else if (activity.entityType === 'User') {
                                            navigate('/app/users');
                                        } else if (activity.entityType === 'Department' || activity.entityType === 'Location') {
                                            navigate('/app/admin');
                                        }
                                    }}
                                >
                                    <div style={{ paddingTop: '2px' }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: activity.type.includes('CREATED') || activity.type.includes('ADDED') ? 'var(--color-primary)' :
                                                activity.type.includes('DELETED') ? '#EF4444' :
                                                    'var(--color-status-green)'
                                        }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{activity.message}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                                            {activity.entityType}: {activity.entityName}
                                            {activity.location && ` – ${activity.location}`}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <span>{activity.performedBy}</span>
                                            <span>•</span>
                                            <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                                            {getPhaseBadge()}
                                        </div>
                                    </div>
                                    <TrendingUp size={14} color="var(--color-text-muted)" style={{ marginTop: '4px' }} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Compliance Lifecycle */}
                <div className="card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Compliance Lifecycle</h3>
                        <div style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                            ACTIVE PHASE
                        </div>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>PDCA workflow progression across all active findings</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', position: 'relative' }}>
                        {/* Connecting Line */}
                        <div style={{ position: 'absolute', top: '28px', left: '12.5%', right: '12.5%', height: '2px', background: 'var(--color-border)', zIndex: 0 }} />

                        {(['PLAN', 'DO', 'CHECK', 'ACT'] as PDCA_Step[]).map((step, i) => (
                            <div key={step} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    background: byStep[step] > 0 ? '#FEE2E2' : 'white',
                                    border: `3px solid ${byStep[step] > 0 ? '#EF4444' : 'var(--color-border)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: byStep[step] > 0 ? '#EF4444' : 'var(--color-text-muted)',
                                    fontWeight: 800,
                                    fontSize: '20px',
                                    boxShadow: byStep[step] > 0 ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'none'
                                }}>
                                    {byStep[step]}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '13px' }}>{step}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Phase {i + 1}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* COMPLIANCE REGISTRY TABLE */}
            <div className="card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Compliance Registry</h3>
                    <div style={{ position: 'relative' }}>
                        <input type="text" placeholder="Search repository..." style={{ padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', width: '280px' }} />
                        <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: '#FAFAFA', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>ENTRY / ID</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>FINDING STATUS</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>LOCATION</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>RESPONSIBLE</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>STATUS MARK</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>DUE DATE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFindings.slice(0, 10).map((f) => {
                            const meta = getStatusMeta(f.status, f.deadline, f.status === 'ACT');
                            const badgeStyle = getStatusBadgeStyle(f.status, f.deadline, f.status === 'ACT');

                            return (
                                <tr key={f.id} onClick={() => console.log('Nav to', f.id)} style={{ borderBottom: '1px solid #F5F5F5', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#FFFBF5'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '13px' }}>{f.id}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{f.rating} Finding</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>{f.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{f.auditType} Case</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={14} color="var(--color-primary)" />
                                            <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{f.location}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                {f.responsible.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '13px' }}>{f.responsible}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            background: meta.class === 'status-critical' ? '#FEE2E2' : meta.class === 'status-warning' ? '#FEF3C7' : meta.class === 'status-done' ? '#E0E7FF' : '#DCFCE7',
                                            color: meta.class === 'status-critical' ? '#991B1B' : meta.class === 'status-warning' ? '#92400E' : meta.class === 'status-done' ? '#3730A3' : '#166534',
                                            border: 'none'
                                        }}>
                                            ● {meta.class === 'status-critical' ? 'OVERDUE' : meta.class === 'status-warning' ? 'DUE SOON' : meta.class === 'status-done' ? 'COMPLETED' : 'ON TRACK'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: meta.class === 'status-critical' ? '#EF4444' : 'var(--color-text)', fontWeight: meta.class === 'status-critical' ? 700 : 500 }}>
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
