import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auditService } from '../services/auditService';
import { adminService } from '../services/adminService';
import { activityService } from '../services/activityService';
import { AuditFinding } from '../types';
import { Location, AppUser, Department } from '../types/admin';
import { ActivityEntry } from '../types/activity';
import { getStatusMeta, getStatusBadgeStyle, getStatusColor, getStatusLabel } from '../utils/statusUtils';
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
import { useLanguage } from '../contexts/LanguageContext';

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
                    <div style={{ fontSize: '20px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#3e4c5a' }}>{total}</div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: '#3e4c5a', marginLeft: 'auto' }}>{Math.round((item.value / total) * 100)}%</span>
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
                    <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#3e4c5a', fontWeight: 700, textAlign: 'center', lineHeight: '1.2', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                        <div>
                            {d.label.split(' ')[0]}<br />{d.label.split(' ').slice(1).join(' ')}
                        </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#3e4c5a', fontFamily: 'Inter, sans-serif' }}>{d.value}</div>
                </div>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const { t, language } = useLanguage();
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
    const [timeRange, setTimeRange] = useState('lastMonth');
    const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

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

    // Helper to get translated location name
    const getTranslatedLocationName = (name: string) => {
        if (name.includes('Zurich')) return t('admin.universityHospitalZurich');
        if (name.includes('Geneva')) return t('admin.genevaUniversityHospitals');
        if (name.includes('Bern')) return t('admin.inselspitalBern');
        if (name.includes('Basel')) return t('admin.universityHospitalBasel');
        if (name.includes('Lausanne')) return t('admin.chuvLausanne');
        return name;
    };

    // Helper to get translated department name
    const getTranslatedDepartmentName = (name: string) => {
        if (name === 'Quality & Patient Safety') return t('admin.qualityPatientSafety');
        if (name === 'Surgery Department') return t('admin.surgeryDepartment');
        if (name === 'Main Pharmacy') return t('admin.mainPharmacy');
        if (name === 'Infectious Diseases') return t('admin.infectiousDiseases');
        if (name === 'Emergency Medicine') return t('admin.emergencyMedicine');
        return name;
    }
    // Helper to translate activity messages
    const translateActivityMessage = (message: string) => {
        // Topic Created
        const topicCreatedMatch = message.match(/^New PDCA Topic (.*?) created$/);
        if (topicCreatedMatch) return t('activityLog.messages.topicCreated', { id: topicCreatedMatch[1] });

        // Topic Moved
        const topicMovedMatch = message.match(/^Topic (.*?) moved to (.*?) phase$/);
        if (topicMovedMatch) {
            const phaseKey = topicMovedMatch[2].toLowerCase();
            const translatedPhase = t(`pdca.${phaseKey}`);
            return t('activityLog.messages.topicMovedToPhase', { id: topicMovedMatch[1], phase: translatedPhase });
        }

        // Location Created
        const locCreatedMatch = message.match(/^Location (.*?) created$/);
        if (locCreatedMatch) return t('activityLog.messages.locationCreated', { name: getTranslatedLocationName(locCreatedMatch[1]) });

        // Location Updated
        const locUpdatedMatch = message.match(/^Location (.*?) updated$/);
        if (locUpdatedMatch) return t('activityLog.messages.locationUpdated', { name: getTranslatedLocationName(locUpdatedMatch[1]) });

        // Location Deleted
        const locDeletedMatch = message.match(/^Location (.*?) deleted$/);
        if (locDeletedMatch) return t('activityLog.messages.locationDeleted', { name: getTranslatedLocationName(locDeletedMatch[1]) });

        // Department Created
        const depCreatedMatch = message.match(/^Department (.*?) created$/);
        if (depCreatedMatch) return t('activityLog.messages.departmentCreated', { name: getTranslatedDepartmentName(depCreatedMatch[1]) });

        // Department Updated
        const depUpdatedMatch = message.match(/^Department (.*?) updated$/);
        if (depUpdatedMatch) return t('activityLog.messages.departmentUpdated', { name: getTranslatedDepartmentName(depUpdatedMatch[1]) });

        // Department Deleted
        const depDeletedMatch = message.match(/^Department (.*?) deleted$/);
        if (depDeletedMatch) return t('activityLog.messages.departmentDeleted', { name: getTranslatedDepartmentName(depDeletedMatch[1]) });

        // User Added
        const userAddedMatch = message.match(/^User (.*?) registered$/);
        if (userAddedMatch) return t('activityLog.messages.userAdded', { name: userAddedMatch[1] });

        // User Updated
        const userUpdatedMatch = message.match(/^User (.*?) updated$/);
        if (userUpdatedMatch) return t('activityLog.messages.userEdited', { name: userUpdatedMatch[1] });

        // New Clinical Staff
        if (message.includes('New clinical staff registered')) return t('activityLog.messages.newClinicalStaff');

        // Site Visit Scheduled
        if (message.includes('Patient Safety Site Visit scheduled')) return t('activityLog.messages.siteVisitScheduled');

        // Topic Moved Check
        const topicCheck = message.match(/Topic (.*?) moved to CHECK phase [-–] (.*)/);
        if (topicCheck) return t('activityLog.messages.topicMovedCheck', { location: getTranslatedLocationName(topicCheck[2]) });

        // Department Created with Name
        const deptCreatedNamed = message.match(/^Department created: (.*)$/);
        if (deptCreatedNamed) return t('activityLog.messages.deptCreated', { name: getTranslatedDepartmentName(deptCreatedNamed[1]) });

        // User Deleted
        const userDeletedMatch = message.match(/^User (.*?) deleted$/);
        if (userDeletedMatch) return t('activityLog.messages.userDeleted', { name: userDeletedMatch[1] });

        return message;
    };

    const getTranslatedEntityType = (type: string) => {
        const map: Record<string, string> = {
            'User': 'common.user',
            'Department': 'common.department',
            'Location': 'common.location',
            'Topic': 'activityLog.topic',
            'Audit': 'activityLog.audit'
        };
        return map[type] ? t(map[type]) : type;
    };
    // Derived Data for Content (Charts, Lists) - Respects ALL filters
    const filteredFindings = useMemo(() => {
        return findings.filter(f => {
            if (auditIdParam !== 'All' && f.auditId !== auditIdParam) return false;

            if (departmentParam !== 'All') {
                const dep = getDepartment(f);
                if (dep !== departmentParam) return false;
            }

            if (locationParam !== 'All' && f.location !== locationParam) return false;

            if (statusParam !== 'All') {
                const label = getStatusLabel(t, f.status, f.deadline);

                // Exact match with allowed restricted statuses
                if (label === statusParam) return true;

                // Backward compatibility mapping for legacy filters if any
                if (statusParam === 'Critical' && label === t('status.critical')) return true;
                if (statusParam === 'Warning' && label === t('status.warning')) return true;
                if (statusParam === 'Monitoring' && label === t('status.monitoring')) return true;
                if (statusParam === 'Done' && label === t('status.done')) return true;

                return false;
            }

            // Time Range Logic
            const created = new Date(f.createdAt);
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (timeRange === 'today' && created < startOfDay) return false;
            if (timeRange === 'lastWeek') {
                const limit = new Date(now);
                limit.setDate(now.getDate() - 7);
                if (created < limit) return false;
            }
            if (timeRange === 'lastMonth') {
                const limit = new Date(now);
                limit.setMonth(now.getMonth() - 1);
                if (created < limit) return false;
            }
            if (timeRange === 'last6Months') {
                const limit = new Date(now);
                limit.setMonth(now.getMonth() - 6);
                if (created < limit) return false;
            }
            if (timeRange === 'lastYear') {
                const limit = new Date(now);
                limit.setFullYear(now.getFullYear() - 1);
                if (created < limit) return false;
            }

            return true;
        });
    }, [auditIdParam, departmentParam, locationParam, statusParam, findings, timeRange]);

    // Derived Data for KPIs - Respects Location/Dept/Time, IGNORES Status filter
    const kpiFindings = useMemo(() => {
        return findings.filter(f => {
            if (auditIdParam !== 'All' && f.auditId !== auditIdParam) return false;

            if (departmentParam !== 'All') {
                const dep = getDepartment(f);
                if (dep !== departmentParam) return false;
            }

            if (locationParam !== 'All' && f.location !== locationParam) return false;

            // STATUS FILTER IS IGNORED HERE

            // Time Range Logic
            const created = new Date(f.createdAt);
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (timeRange === 'today' && created < startOfDay) return false;
            if (timeRange === 'lastWeek') {
                const limit = new Date(now);
                limit.setDate(now.getDate() - 7);
                if (created < limit) return false;
            }
            if (timeRange === 'lastMonth') {
                const limit = new Date(now);
                limit.setMonth(now.getMonth() - 1);
                if (created < limit) return false;
            }
            if (timeRange === 'last6Months') {
                const limit = new Date(now);
                limit.setMonth(now.getMonth() - 6);
                if (created < limit) return false;
            }
            if (timeRange === 'lastYear') {
                const limit = new Date(now);
                limit.setFullYear(now.getFullYear() - 1);
                if (created < limit) return false;
            }

            return true;
        });
    }, [auditIdParam, departmentParam, locationParam, findings, timeRange]);

    // KPI Metrics
    const totalFindingsMetric = kpiFindings.length;
    const statsByStatusMetric = useMemo(() => {
        const counts = {
            'status-critical': 0,
            'status-warning': 0,
            'status-ontrack': 0,
            'status-done': 0
        };
        kpiFindings.forEach(f => {
            const meta = getStatusMeta(f.status, f.deadline, f.status === 'ACT');
            counts[meta.class as keyof typeof counts]++;
        });
        return counts;
    }, [kpiFindings]);

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

    const byRatingMetric = {
        major: kpiFindings.filter(f => f.rating === 'Major').length,
        minor: kpiFindings.filter(f => f.rating === 'Minor').length,
        ofi: kpiFindings.filter(f => f.rating === 'OFI').length,
    };

    const byLocation = locations
        .filter(l => locationParam === 'All' || l.name.trim() === locationParam.trim())
        .map(l => ({
            label: getTranslatedLocationName(l.name), // Translate label for chart
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

    interface FilterOption {
        label: string;
        value: string;
    }

    const FilterDropdown = ({ label, value, options, onChange, placeholder = 'All' }: {
        label: string,
        value: string,
        options: (string | FilterOption)[],
        onChange: (val: string) => void,
        placeholder?: string | null
    }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>{label}</label>
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
                        color: '#3e4c5a',
                        background: 'white',
                        fontWeight: 500,
                        cursor: 'pointer',
                        minWidth: '120px'
                    }}
                >
                    {placeholder && <option value="All">{placeholder}</option>}
                    {options.map((o) => {
                        const optValue = typeof o === 'string' ? o : o.value;
                        const optLabel = typeof o === 'string' ? o : o.label;
                        return <option key={optValue} value={optValue}>{optLabel}</option>;
                    })}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* HEADER */}


            {/* KPI CARDS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(100,116,139,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={20} color="#64748B" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontFamily: 'Inter, sans-serif' }}>{t('dashboard.totalFindings')}</div>
                        <div style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#3e4c5a' }}>{totalFindingsMetric}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrendingUp size={20} color="#22C55E" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontFamily: 'Inter, sans-serif' }}>{t('dashboard.monitoring')}</div>
                        <div style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#22C55E' }}>{statsByStatusMetric['status-ontrack']}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={20} color="#F59E0B" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontFamily: 'Inter, sans-serif' }}>{t('status.warning')}</div>
                        <div style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#F59E0B' }}>{statsByStatusMetric['status-warning']}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={20} color="#EF4444" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontFamily: 'Inter, sans-serif' }}>{t('status.critical')}</div>
                        <div style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#EF4444' }}>{statsByStatusMetric['status-critical']}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={20} color="#3B82F6" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontFamily: 'Inter, sans-serif' }}>{t('status.done')}</div>
                        <div style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#3B82F6' }}>{statsByStatusMetric['status-done']}</div>
                    </div>
                </div>
            </div>

            {/* TOP ACTIONS BAR */}
            <div className="card" style={{ padding: '1.25rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '2rem', borderRight: '2px solid var(--color-border)', height: '100%' }}>
                    <Filter size={20} color="#3e4c5a" strokeWidth={2} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#3e4c5a', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>{t('dashboard.analysisFilters')}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
                    <div style={{ flex: 1 }}>
                        <FilterDropdown
                            label={t('dashboard.location')}
                            value={locationParam}
                            options={[
                                { label: t('admin.universityHospitalZurich'), value: 'University Hospital Zurich (ZH)' },
                                { label: t('admin.genevaUniversityHospitals'), value: 'Geneva University Hospitals (GE)' },
                                { label: t('admin.inselspitalBern'), value: 'Inselspital Bern (BE)' },
                                { label: t('admin.universityHospitalBasel'), value: 'University Hospital Basel (BS)' },
                                { label: t('admin.chuvLausanne'), value: 'CHUV Lausanne (VD)' }
                            ]}
                            onChange={(v: string) => updateFilter('location', v)}
                            placeholder={t('dashboard.allEntities')}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <FilterDropdown
                            label={t('dashboard.department')}
                            value={departmentParam}
                            options={departments.map(d => ({
                                label: getTranslatedDepartmentName(d.name),
                                value: d.name // Use constant value for logic
                            }))}
                            onChange={(v: string) => updateFilter('department', v)}
                            placeholder={t('dashboard.allDepartments')}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <FilterDropdown
                            label={t('dashboard.status')}
                            value={statusParam}
                            options={[
                                { label: t('status.monitoring'), value: 'Monitoring' },
                                { label: t('status.critical'), value: 'Critical' },
                                { label: t('status.warning'), value: 'Warning' },
                                { label: t('status.done'), value: 'Done' }
                            ]}
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
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#3e4c5a' }}>
                            {t('dashboard.overview')}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {timeRange === 'custom' && (
                                <input type="date" style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '12px' }} />
                            )}
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                style={{ padding: '6px 32px 6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', appearance: 'none', background: 'white', cursor: 'pointer' }}
                            >
                                <option value="today">{t('time.today')}</option>
                                <option value="lastWeek">{t('time.lastWeek')}</option>
                                <option value="lastMonth">{t('time.lastMonth')}</option>
                                <option value="last6Months">{t('time.last6Months')}</option>
                                <option value="lastYear">{t('time.lastYear')}</option>
                                <option value="custom">{t('time.custom')}</option>
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
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#3e4c5a' }}>{t('dashboard.findingStatus')}</h3>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{t('dashboard.total')}: {totalFindings}</span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Semi-Circle Chart */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ width: '180px', height: '100px', position: 'relative', overflow: 'hidden' }}>
                                <svg viewBox="0 0 200 110" style={{ width: '100%', height: '100%', transform: 'rotate(0deg)' }}>
                                    {(() => {
                                        const data = [
                                            { label: 'Critical', value: statsByStatus['status-critical'], color: getStatusColor('Critical') }, // Red
                                            { label: 'Warning', value: statsByStatus['status-warning'], color: getStatusColor('Warning') }, // Orange
                                            { label: 'Monitoring', value: statsByStatus['status-ontrack'], color: getStatusColor('Monitoring') } // Green
                                        ];
                                        const total = data.reduce((sum, item) => sum + item.value, 0);
                                        const radius = 80;
                                        const center = 100;
                                        const strokeWidth = 25;
                                        let currentAngle = 180; // Start from left (180 degrees)

                                        // Background Track
                                        return (
                                            <>
                                                {data.map((item, i) => {
                                                    const percent = total > 0 ? item.value / total : 0;
                                                    if (percent === 0) return null;

                                                    const angle = percent * 180; // Only use 180 degrees total
                                                    const startAngle = currentAngle;
                                                    const endAngle = currentAngle + angle;

                                                    // Calculate path
                                                    const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
                                                    const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
                                                    const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
                                                    const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);

                                                    const pathData = [
                                                        `M ${x1} ${y1}`, // Move to start
                                                        `A ${radius} ${radius} 0 0 1 ${x2} ${y2}` // Arc to end
                                                    ].join(' ');

                                                    currentAngle += angle;

                                                    return (
                                                        <path
                                                            key={i}
                                                            d={pathData}
                                                            fill="none"
                                                            stroke={item.color}
                                                            strokeWidth={strokeWidth}
                                                            strokeLinecap={i === 0 ? "butt" : "butt"} // Round caps only on ends if needed, butt for segments
                                                        />
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </svg>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#3e4c5a', lineHeight: '1' }}>{totalFindings}</div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>{t('dashboard.total')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'Critical', value: statsByStatus['status-critical'], color: '#EF4444', bg: '#FEF2F2' },
                                { label: 'Warning', value: statsByStatus['status-warning'], color: '#F59E0B', bg: '#FFF7ED' },
                                { label: 'Monitoring', value: statsByStatus['status-ontrack'], color: '#22C55E', bg: '#F0FDF4' }
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    background: '#F8FAFC',
                                    borderRadius: '8px',
                                    gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#3e4c5a' }}>{t(`status.${item.label.toLowerCase()}`)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#3e4c5a' }}>{item.value}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                                            {totalFindings > 0 ? Math.round((item.value / totalFindings) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Summary Cards */}
                    <div style={{
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--color-border)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '1rem'
                    }}>
                        {[
                            { label: 'CRITICAL', value: statsByStatus['status-critical'] },
                            { label: 'WARNING', value: statsByStatus['status-warning'] },
                            { label: 'MONITORING', value: statsByStatus['status-ontrack'] }
                        ].map((item, i) => (
                            <div key={i} style={{
                                background: '#F8FAFC',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{ fontSize: '20px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#3e4c5a' }}>{item.value}</div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{t(`status.${item.label.toLowerCase()}`)}</div>
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
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{t('dashboard.recentActivity')}</h3>
                        <button
                            onClick={() => navigate('/app/activity-log')}
                            style={{ fontSize: '12px', color: '#424b55', fontWeight: 600, background: '#b3d8d8', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                        >
                            {t('dashboard.viewAll')}
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
                                            return <span style={{ background: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{t(`pdca.${phase.toLowerCase()}`)}</span>;
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
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#3e4c5a' }}>{translateActivityMessage(activity.message)}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                                            {getTranslatedEntityType(activity.entityType)}: {activity.entityType === 'Location' ? getTranslatedLocationName(activity.entityName) :
                                                activity.entityType === 'Department' ? getTranslatedDepartmentName(activity.entityName) :
                                                    activity.entityName}
                                            {activity.location && ` – ${getTranslatedLocationName(activity.location)}`}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <span>{activity.performedBy}</span>
                                            <span>•</span>
                                            <span>{new Date(activity.timestamp).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</span>
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
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#3e4c5a' }}>{t('dashboard.complianceLifecycle')}</h3>
                        <div style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                            {t('dashboard.activePhase')}
                        </div>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '3rem', fontFamily: 'Inter, sans-serif' }}>{t('dashboard.pdcaWorkflowDescription')}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative', padding: '0 1rem' }}>
                        {/* Connecting Line */}
                        <div style={{
                            position: 'absolute',
                            top: '40px',
                            left: '12.5%',
                            right: '12.5%',
                            height: '4px',
                            background: 'linear-gradient(90deg, #3B82F6 0%, #F97316 33%, #F59E0B 66%, #2DD4BF 100%)',
                            zIndex: 0,
                            borderRadius: '2px',
                            opacity: 0.2
                        }} />

                        {[
                            { key: 'PLAN', label: t('pdca.plan'), phase: t('dashboard.phase1'), color: '#3B82F6', hoverLabel: t('phases.planningStrategy') },
                            { key: 'DO', label: t('pdca.do'), phase: t('dashboard.phase2'), color: '#F97316', hoverLabel: t('phases.executionImplementation') },
                            { key: 'CHECK', label: t('pdca.check'), phase: t('dashboard.phase3'), color: '#F59E0B', hoverLabel: t('phases.reviewVerification') },
                            { key: 'ACT', label: t('pdca.act'), phase: t('dashboard.phase4'), color: '#2DD4BF', hoverLabel: t('phases.actionStandardization') }
                        ].map((s) => {
                            const isHovered = hoveredPhase === s.key;
                            return (
                                <div
                                    key={s.key}
                                    style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                                    onMouseEnter={() => setHoveredPhase(s.key)}
                                    onMouseLeave={() => setHoveredPhase(null)}
                                >
                                    {/* Tooltip */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-45px',
                                        background: '#1E293B',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        opacity: isHovered ? 1 : 0,
                                        transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                                        transition: 'all 0.2s ease',
                                        pointerEvents: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}>
                                        {s.hoverLabel}
                                        {/* Tooltip Arrow */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-4px',
                                            left: '50%',
                                            transform: 'translate(-50%) rotate(45deg)',
                                            width: '8px',
                                            height: '8px',
                                            background: '#1E293B'
                                        }} />
                                    </div>

                                    <div
                                        onClick={() => navigate(`/app/lists?step=${s.key}`)}
                                        style={{
                                            width: '80px', height: '80px', borderRadius: '50%',
                                            background: s.color,
                                            border: 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 800,
                                            fontSize: '28px',
                                            boxShadow: `0 10px 20px -5px ${s.color}60`,
                                            marginBottom: '1rem',
                                            transition: 'transform 0.2s ease',
                                            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                                        }}>
                                        {byStep[s.key as PDCA_Step]}
                                    </div>
                                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 800, color: '#3e4c5a', fontSize: '14px', marginBottom: '2px' }}>{s.label}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{s.phase}</div>
                                        <div
                                            onClick={() => navigate(`/app/lists?step=${s.key}`)}
                                            style={{
                                                fontSize: '11px',
                                                color: isHovered ? s.color : 'var(--color-text-muted)',
                                                background: 'var(--color-bg)',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                border: `1px solid ${isHovered ? s.color : 'var(--color-border)'}`,
                                                fontWeight: 700,
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}>
                                            {byStep[s.key as PDCA_Step]} {t('common.findings')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '3rem', borderTop: '1px solid var(--color-bg)', paddingTop: '2rem' }}>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3e4c5a' }}>{openFindings}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{t('dashboard.totalActive')}</div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3e4c5a' }}>
                                {openFindings > 0 ? Math.round((byStep.PLAN / openFindings) * 100) : 0}%
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{t('dashboard.inPlanning')}</div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3e4c5a' }}>
                                {openFindings > 0 ? Math.round((byStep.DO / openFindings) * 100) : 0}%
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{t('dashboard.inProgress')}</div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3e4c5a' }}>{statsByStatus['status-critical']}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{t('dashboard.criticalIssues')}</div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}
