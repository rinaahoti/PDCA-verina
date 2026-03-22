import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { topicsService } from '../services';
import { adminService } from '../services/adminService';
import { activityService } from '../services/activityService';
import { Topic } from '../types';
import { Location, AppUser, Department } from '../types/admin';
import { ActivityEntry } from '../types/activity';
import { getStatusMeta, getStatusBadgeStyle, getStatusColor, getStatusLabel } from '../utils/statusUtils';
import { mapActivityEntriesToLogEntries } from '../utils/activityLogUtils';
import { getTopicDisplayStep, getVisibleTopicStatus, isTopicVisibleInWorkflow } from '../utils/topicWorkflowUtils';
import {
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    Filter,
    ChevronDown,
    Search,
    FileText,
    Repeat,
    ArrowRight,
    Calendar,
    TrendingUp,
    Eye
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
    { id: 'L-01', user: 'Dr. Elena Rossi', action: 'Risk Level Adjusted', step: 'PLAN', timestamp: '2024-02-20T10:30:00', details: 'Severity changed after clinical review â€“ Zurich' },
    { id: 'L-02', user: 'Dr. Marcus Weber', action: 'Clinical Evidence Uploaded', step: 'DO', timestamp: '2024-02-20T09:15:00', details: 'Added surgical prep checklist validation documents â€“ Geneva' },
    { id: 'L-03', user: 'TJC Survey Team', action: 'Finding Identified', step: 'PLAN', timestamp: '2024-02-19T16:45:00', details: 'New documentation deficiency found â€“ Bern' },
    { id: 'L-04', user: 'Sarah Johnson', action: 'Safety Protocol Verified', step: 'CHECK', timestamp: '2024-02-19T14:20:00', details: 'Medication double-check records confirmed â€“ Basel' },
    { id: 'L-05', user: 'System', action: 'Clinical Deadline Alert', step: 'DO', timestamp: '2024-02-19T08:00:00', details: 'PDCA topic moved to CHECK phase â€“ Lausanne' },
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

    const [topics, setTopics] = useState<Topic[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [timeRange, setTimeRange] = useState('lastMonth');
    const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

    const selectedLocation = useMemo(() => {
        if (locationParam === 'All') return null;
        const normalized = (locationParam || '').trim();
        return (
            locations.find(loc => loc.id === normalized) ||
            locations.find(loc => (loc.name || '').trim() === normalized) ||
            locations.find(loc => (loc.city || '').trim() === normalized) ||
            null
        );
    }, [locationParam, locations, t]);
    const effectiveLocationParam = selectedLocation?.id || 'All';
    const effectiveLocationName = selectedLocation?.name || 'All';

    useEffect(() => {
        if (locationParam !== 'All' && !selectedLocation) {
            updateFilter('location', 'All');
        }
    }, [locationParam, selectedLocation]);

    useEffect(() => {
        if (locationParam !== 'All' && selectedLocation && locationParam !== selectedLocation.id) {
            updateFilter('location', selectedLocation.id);
        }
    }, [locationParam, selectedLocation]);

    useEffect(() => {
        const load = () => {
            setTopics(topicsService.getAll());
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

    const normalizeLookup = (value?: string) =>
        (value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();

    const splitStoredValues = (value?: string) =>
        (value || '')
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean);

    const getTopicTimelineDate = (topic: Topic) =>
        topic.updatedAt ||
        topic.act.audit?.closedOn ||
        topic.check.audit?.checkedOn ||
        topic.history[0]?.date ||
        topic.dueDate;

    // Helper to get translated location name
    const getTranslatedLocationName = (name: string) => {
        if (name.includes('Zurich')) return t('admin.universityHospitalZurich');
        if (name.includes('Bern')) return t('admin.inselspitalBern');
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

    const locationOptions = useMemo(
        () =>
            locations
                .map(loc => ({
                    label: (loc.city || '').trim() || getTranslatedLocationName(loc.name).replace(/ \([A-Z]+\)$/, ''),
                    value: loc.id
                }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        [locations, t]
    );

    const selectedDepartment = useMemo(() => {
        if (departmentParam === 'All') return null;
        const normalized = (departmentParam || '').trim();
        const scopedDepartments =
            effectiveLocationName === 'All'
                ? departments
                : departments.filter(dep => dep.locationId === selectedLocation?.id);

        return (
            scopedDepartments.find(dep => dep.id === normalized) ||
            scopedDepartments.find(dep => (dep.name || '').trim() === normalized) ||
            null
        );
    }, [departmentParam, departments, effectiveLocationName, selectedLocation]);

    const effectiveDepartmentParam = selectedDepartment?.id || 'All';

    const departmentOptions = useMemo(() => {
        const scopedDepartments =
            effectiveLocationName === 'All'
                ? departments
                : departments.filter(dep => dep.locationId === selectedLocation?.id);

        return scopedDepartments.map(dep => ({
            label: getTranslatedDepartmentName(dep.name),
            value: dep.id
        }));
    }, [departments, effectiveLocationName, selectedLocation, t]);

    useEffect(() => {
        if (departmentParam !== 'All' && !selectedDepartment) {
            updateFilter('department', 'All');
        }
    }, [departmentParam, selectedDepartment]);

    useEffect(() => {
        if (departmentParam !== 'All' && selectedDepartment && departmentParam !== selectedDepartment.id) {
            updateFilter('department', selectedDepartment.id);
        }
    }, [departmentParam, selectedDepartment]);
    const topicMatchesLocation = (topic: Topic, location: Location) => {
        const tokens = [
            ...splitStoredValues(topic.location),
            ...splitStoredValues(topic.locationId)
        ];
        if (tokens.length === 0) return false;

        const normalizedName = normalizeLookup(location.name);
        const normalizedCity = normalizeLookup(location.city || '');
        const normalizedCode = normalizeLookup(location.code || '');
        const aliases = new Set(
            [
                location.id,
                location.name,
                location.city,
                location.code,
                `${location.code || ''} - ${location.name || ''}`,
                `${location.code || ''} - ${location.city || ''}`
            ]
                .map(value => normalizeLookup(value))
                .filter(Boolean)
        );

        return tokens.some(token => {
            const normalizedToken = normalizeLookup(token);
            if (!normalizedToken) return false;
            if (aliases.has(normalizedToken)) return true;
            if (normalizedCode && (normalizedToken.includes(`(${normalizedCode})`) || normalizedToken.endsWith(` ${normalizedCode}`))) {
                return true;
            }
            if (normalizedName && normalizedToken.includes(normalizedName)) return true;
            if (normalizedCity && normalizedToken.includes(normalizedCity)) return true;
            return false;
        });
    };

    const getTopicMatchedLocations = (topic: Topic) => {
        return locations.filter(location => topicMatchesLocation(topic, location));
    };

    const getTopicDepartmentMatches = (topic: Topic) => {
        const matchedDepartments = new Map<string, Department>();

        splitStoredValues(topic.departmentId).forEach(token => {
            const normalizedToken = normalizeLookup(token);
            if (!normalizedToken) return;

            const matchedDepartment = departments.find(dep => normalizeLookup(dep.id) === normalizedToken);
            if (matchedDepartment) {
                matchedDepartments.set(matchedDepartment.id, matchedDepartment);
                return;
            }

            const matchedByName = departments.find(dep => normalizeLookup(dep.name) === normalizedToken);
            if (matchedByName) {
                matchedDepartments.set(matchedByName.id, matchedByName);
            }
        });

        return Array.from(matchedDepartments.values());
    };

    const topicMatchesDepartment = (topic: Topic, departmentId: string) => {
        if (!departmentId || departmentId === 'All') return true;
        return getTopicDepartmentMatches(topic).some(dep => dep.id === departmentId);
    };

    const matchesTimeRange = (topic: Topic) => {
        if (timeRange === 'custom') return true;

        const referenceDate = new Date(getTopicTimelineDate(topic));
        if (Number.isNaN(referenceDate.getTime())) return true;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (timeRange === 'today' && referenceDate < startOfDay) return false;
        if (timeRange === 'lastWeek') {
            const limit = new Date(now);
            limit.setDate(now.getDate() - 7);
            if (referenceDate < limit) return false;
        }
        if (timeRange === 'lastMonth') {
            const limit = new Date(now);
            limit.setMonth(now.getMonth() - 1);
            if (referenceDate < limit) return false;
        }
        if (timeRange === 'last6Months') {
            const limit = new Date(now);
            limit.setMonth(now.getMonth() - 6);
            if (referenceDate < limit) return false;
        }
        if (timeRange === 'lastYear') {
            const limit = new Date(now);
            limit.setFullYear(now.getFullYear() - 1);
            if (referenceDate < limit) return false;
        }

        return true;
    };

    const scopedTopics = useMemo(
        () =>
            topics.filter(topic => {
                if (!isTopicVisibleInWorkflow(topic)) return false;
                if (locations.length === 0) return true;
                return locations.some(location => topicMatchesLocation(topic, location));
            }),
        [topics, locations]
    );

    const filteredTopics = useMemo(() => {
        return scopedTopics.filter(topic => {
            if (effectiveLocationName !== 'All' && selectedLocation && !topicMatchesLocation(topic, selectedLocation)) return false;
            if (effectiveDepartmentParam !== 'All' && !topicMatchesDepartment(topic, effectiveDepartmentParam)) return false;
            if (!matchesTimeRange(topic)) return false;

            if (statusParam !== 'All' && statusParam !== 'ALL') {
                const normalizedStatus = normalizeLookup(getStatusLabel(t, getVisibleTopicStatus(topic), topic.dueDate));
                const normalizedSelectedStatus = normalizeLookup(statusParam);
                if (normalizedStatus !== normalizedSelectedStatus) return false;
            }

            return true;
        });
    }, [scopedTopics, effectiveLocationName, selectedLocation, effectiveDepartmentParam, statusParam, timeRange, t]);

    const kpiTopics = useMemo(() => {
        return scopedTopics.filter(topic => {
            if (effectiveLocationName !== 'All' && selectedLocation && !topicMatchesLocation(topic, selectedLocation)) return false;
            if (effectiveDepartmentParam !== 'All' && !topicMatchesDepartment(topic, effectiveDepartmentParam)) return false;
            return matchesTimeRange(topic);
        });
    }, [scopedTopics, effectiveLocationName, selectedLocation, effectiveDepartmentParam, timeRange]);

    const filteredTopicUnits = useMemo(
        () =>
            filteredTopics.flatMap(topic => {
                const matchedLocations =
                    effectiveLocationName !== 'All' && selectedLocation
                        ? (topicMatchesLocation(topic, selectedLocation) ? [selectedLocation] : [])
                        : getTopicMatchedLocations(topic);

                return matchedLocations.map(location => ({ topic, location }));
            }),
        [filteredTopics, effectiveLocationName, selectedLocation, locations]
    );

    const kpiTopicUnits = useMemo(
        () =>
            kpiTopics.flatMap(topic => {
                const matchedLocations =
                    effectiveLocationName !== 'All' && selectedLocation
                        ? (topicMatchesLocation(topic, selectedLocation) ? [selectedLocation] : [])
                        : getTopicMatchedLocations(topic);

                return matchedLocations.map(location => ({ topic, location }));
            }),
        [kpiTopics, effectiveLocationName, selectedLocation, locations]
    );

    const recentActivityEntries = useMemo(
        () => mapActivityEntriesToLogEntries(activities, language).slice(0, 5),
        [activities, language]
    );

    const cycleTopics = useMemo(() => {
        return topics.filter(topic => {
            if (!isTopicVisibleInWorkflow(topic)) return false;
            if (selectedLocation && !topicMatchesLocation(topic, selectedLocation)) return false;
            if (effectiveDepartmentParam !== 'All' && !topicMatchesDepartment(topic, effectiveDepartmentParam)) return false;
            if (!matchesTimeRange(topic)) return false;

            if (statusParam !== 'All' && statusParam !== 'ALL') {
                const normalizedStatus = normalizeLookup(getStatusLabel(t, getVisibleTopicStatus(topic), topic.dueDate));
                const normalizedSelectedStatus = normalizeLookup(statusParam);
                if (normalizedStatus !== normalizedSelectedStatus) return false;
            }

            return true;
        });
    }, [topics, selectedLocation, effectiveDepartmentParam, timeRange, statusParam, t]);

    const cycleStatsByStatus = useMemo(() => {
        const counts = {
            'status-critical': 0,
            'status-warning': 0,
            'status-ontrack': 0,
            'status-done': 0
        };
        cycleTopics.forEach(topic => {
            const meta = getStatusMeta(getVisibleTopicStatus(topic), topic.dueDate);
            counts[meta.class as keyof typeof counts]++;
        });
        return counts;
    }, [cycleTopics]);

    const cycleByStep = {
        PLAN: cycleTopics.filter(topic => getTopicDisplayStep(topic) === 'PLAN').length,
        DO: cycleTopics.filter(topic => getTopicDisplayStep(topic) === 'DO').length,
        CHECK: cycleTopics.filter(topic => getTopicDisplayStep(topic) === 'CHECK').length,
    };

    const cycleTotalActive = cycleTopics.length;

    const navigateToListsForStep = (step: 'PLAN' | 'DO' | 'CHECK') => {
        const params = new URLSearchParams();
        params.set('step', step);

        if (effectiveLocationParam !== 'All') params.set('location', effectiveLocationParam);
        if (effectiveDepartmentParam !== 'All') params.set('department', effectiveDepartmentParam);
        if (statusParam !== 'All' && statusParam !== 'ALL') params.set('status', statusParam);
        if (timeRange !== 'lastMonth') params.set('timeRange', timeRange);

        navigate(`/app/lists?${params.toString()}`);
    };

    // KPI Metrics
    const totalFindingsMetric = kpiTopicUnits.length;
    const statsByStatusMetric = useMemo(() => {
        const counts = {
            'status-critical': 0,
            'status-warning': 0,
            'status-ontrack': 0,
            'status-done': 0
        };
        kpiTopicUnits.forEach(({ topic }) => {
            const meta = getStatusMeta(getVisibleTopicStatus(topic), topic.dueDate);
            counts[meta.class as keyof typeof counts]++;
        });
        return counts;
    }, [kpiTopicUnits]);

    // Metrics based on filtered data
    const totalFindings = filteredTopicUnits.length;

    const statsByStatus = useMemo(() => {
        const counts = {
            'status-critical': 0,
            'status-warning': 0,
            'status-ontrack': 0,
            'status-done': 0
        };
        filteredTopicUnits.forEach(({ topic }) => {
            const meta = getStatusMeta(getVisibleTopicStatus(topic), topic.dueDate);
            counts[meta.class as keyof typeof counts]++;
        });
        return counts;
    }, [filteredTopicUnits]);

    const openFindings = statsByStatus['status-critical'] + statsByStatus['status-warning'] + statsByStatus['status-ontrack'];

    const byLocation = locations
        .filter(l => effectiveLocationName === 'All' || l.name.trim() === effectiveLocationName.trim())
        .map(l => ({
            label: (l.city || '').trim() || getTranslatedLocationName(l.name),
            value: filteredTopicUnits.filter(unit => unit.location.id === l.id).length
        }));

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
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
                            value={effectiveLocationParam}
                            options={locationOptions}
                            onChange={(v: string) => updateFilter('location', v)}
                            placeholder={t('dashboard.allEntities')}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <FilterDropdown
                            label={t('dashboard.department')}
                            value={effectiveDepartmentParam}
                            options={departmentOptions}
                            onChange={(v: string) => updateFilter('department', v)}
                            placeholder={t('dashboard.allDepartments')}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <FilterDropdown
                            label={t('dashboard.status')}
                            value={statusParam}
                            options={[
                                { label: t('status.all'), value: 'ALL' },
                                { label: t('status.monitoring'), value: 'Monitoring' },
                                { label: t('status.warning'), value: 'Warning' },
                                { label: t('status.critical'), value: 'Critical' }
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
                                            { label: 'Monitoring', value: statsByStatus['status-ontrack'], color: getStatusColor('Monitoring') }, // Green
                                            { label: 'Warning', value: statsByStatus['status-warning'], color: getStatusColor('Warning') }, // Orange
                                            { label: 'Critical', value: statsByStatus['status-critical'], color: getStatusColor('Critical') } // Red
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
                                { label: 'Monitoring', value: statsByStatus['status-ontrack'], color: '#22C55E', bg: '#F0FDF4' },
                                { label: 'Warning', value: statsByStatus['status-warning'], color: '#F59E0B', bg: '#FFF7ED' },
                                { label: 'Critical', value: statsByStatus['status-critical'], color: '#EF4444', bg: '#FEF2F2' }
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
                            { label: 'MONITORING', value: statsByStatus['status-ontrack'] },
                            { label: 'WARNING', value: statsByStatus['status-warning'] },
                            { label: 'CRITICAL', value: statsByStatus['status-critical'] }
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
                        {recentActivityEntries.length ? recentActivityEntries.map((activity, i) => (
                            <div
                                key={activity.id}
                                style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    padding: '1rem 0',
                                    borderBottom: i === recentActivityEntries.length - 1 ? 'none' : '1px solid var(--color-bg)'
                                }}
                            >
                                <div style={{ paddingTop: '2px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: activity.d.st.cls === 'chip-orange'
                                            ? '#F59E0B'
                                            : activity.d.st.cls === 'chip-blue'
                                                ? '#3B82F6'
                                                : 'var(--color-primary)'
                                    }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#3e4c5a' }}>{activity.title}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {activity.meta.map((item, metaIndex) => (
                                            <span key={`${activity.id}-meta-${metaIndex}`}>
                                                {metaIndex > 0 ? '• ' : ''}{item.l ? `${item.l}: ` : ''}{item.v}
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span>{activity.time}</span>
                                        <span>•</span>
                                        <span style={{ fontWeight: 600 }}>{activity.d.st.label}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '1rem 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                {language === 'de' ? 'Keine Aktivität vorhanden.' : 'No activity yet.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Compliance Lifecycle */}
                <div className="card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#3e4c5a' }}>{t('dashboard.complianceLifecycle')}</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '3rem', fontFamily: 'Inter, sans-serif' }}>{t('dashboard.pdcaWorkflowDescription')}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', position: 'relative', padding: '0 1rem' }}>
                        {/* Connecting Line */}
                        <div style={{
                            position: 'absolute',
                            top: '40px',
                            left: '16.67%',
                            right: '16.67%',
                            height: '4px',
                            background: 'linear-gradient(90deg, #3B82F6 0%, #F97316 50%, #F59E0B 100%)',
                            zIndex: 0,
                            borderRadius: '2px',
                            opacity: 0.2
                        }} />

                        {[
                            { key: 'PLAN', label: t('pdca.plan'), phase: t('dashboard.phase1'), color: '#3B82F6', hoverLabel: t('phases.planningStrategy') },
                            { key: 'DO', label: t('pdca.do'), phase: t('dashboard.phase2'), color: '#F97316', hoverLabel: t('phases.executionImplementation') },
                            { key: 'CHECK', label: t('pdca.check'), phase: t('dashboard.phase3'), color: '#F59E0B', hoverLabel: t('phases.reviewVerification') }
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
                                        onClick={() => navigateToListsForStep(s.key as 'PLAN' | 'DO' | 'CHECK')}
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
                                        {cycleByStep[s.key as keyof typeof cycleByStep]}
                                    </div>
                                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 800, color: '#3e4c5a', fontSize: '14px', marginBottom: '2px' }}>{s.label}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{s.phase}</div>
                                        <div
                                            onClick={() => navigateToListsForStep(s.key as 'PLAN' | 'DO' | 'CHECK')}
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
                                            {cycleByStep[s.key as keyof typeof cycleByStep]} {t('common.findings')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '3rem', borderTop: '1px solid var(--color-bg)', paddingTop: '2rem' }}>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3e4c5a' }}>{cycleTotalActive}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{t('dashboard.totalActive')}</div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3e4c5a' }}>
                                {cycleTotalActive > 0 ? Math.round((cycleByStep.PLAN / cycleTotalActive) * 100) : 0}%
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{t('dashboard.inPlanning')}</div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3e4c5a' }}>
                                {cycleTotalActive > 0 ? Math.round((cycleByStep.DO / cycleTotalActive) * 100) : 0}%
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{t('dashboard.inProgress')}</div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3e4c5a' }}>{cycleByStep.CHECK}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{t('dashboard.criticalIssues')}</div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}


