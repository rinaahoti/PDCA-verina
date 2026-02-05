import React, { useState, useEffect, useMemo } from 'react';
import { activityService } from '../services/activityService';
import { ActivityEntry, ActivityType } from '../types/activity';
import {
    Activity, User, Building2, MapPin, FileText, Search,
    Filter, Clock, CheckCircle2, ArrowRight, UserPlus, Trash2, Edit
} from 'lucide-react';

const ActivityLog: React.FC = () => {
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All Entities');
    const [filterLocation, setFilterLocation] = useState<string>('All');
    const [filterDepartment, setFilterDepartment] = useState<string>('All');

    useEffect(() => {
        const load = () => {
            setActivities(activityService.getActivities());
        };
        load();
        window.addEventListener('storage-activity', load);
        return () => window.removeEventListener('storage-activity', load);
    }, []);

    // Get unique locations dynamically from data for the dropdown
    const availableLocations = useMemo(() => {
        const locs = Array.from(new Set(activities.map(a => a.location).filter(Boolean))) as string[];
        return locs.sort();
    }, [activities]);

    // Get unique departments dynamically from data for the dropdown
    const availableDepartments = useMemo(() => {
        const deps = Array.from(new Set(activities.map(a => a.department).filter(Boolean))) as string[];
        return deps.sort();
    }, [activities]);

    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            const query = searchTerm.toLowerCase();
            const matchesSearch =
                act.message.toLowerCase().includes(query) ||
                act.entityName.toLowerCase().includes(query) ||
                (act.entityId && act.entityId.toLowerCase().includes(query)) ||
                act.entityType.toLowerCase().includes(query) ||
                act.performedBy.toLowerCase().includes(query) ||
                (act.location && act.location.toLowerCase().includes(query)) ||
                (act.department && act.department.toLowerCase().includes(query));

            // Map plural back to singular for matching
            const actTypePlural = act.entityType + 's';
            const matchesType = filterType === 'All Entities' || actTypePlural === filterType;

            const matchesLocation = filterLocation === 'All' || act.location === filterLocation;
            const matchesDepartment = filterDepartment === 'All' || act.department === filterDepartment;

            return matchesSearch && matchesType && matchesLocation && matchesDepartment;
        });
    }, [activities, searchTerm, filterType, filterLocation, filterDepartment]);

    const handleTypeChange = (value: string) => {
        setFilterType(value);
        if (value !== 'Locations') {
            setFilterLocation('All');
        }
        if (value !== 'Departments') {
            setFilterDepartment('All');
        }
    };

    const formatTimestamp = (iso: string) => {
        const date = new Date(iso);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getIcon = (type: ActivityType) => {
        if (type.includes('USER')) return <User size={18} color="var(--color-primary)" />;
        if (type.includes('DEPARTMENT')) return <Building2 size={18} color="#8b5cf6" />; // Purple is fine for variety
        if (type.includes('LOCATION')) return <MapPin size={18} color="var(--color-status-yellow)" />;
        if (type.includes('AUDIT')) return <FileText size={18} color="var(--color-status-green)" />;
        if (type.includes('FINDING')) return <Search size={18} color="var(--color-status-red)" />;
        if (type.includes('PDCA') || type.includes('TOPIC')) return <Activity size={18} color="var(--color-primary)" />;
        return <Clock size={18} color="var(--color-text-muted)" />;
    };

    const typeColors: Record<ActivityEntry['entityType'], string> = {
        'User': 'var(--color-primary-light)',
        'Department': '#f3e8ff',
        'Location': '#fef3c7',
        'Audit': '#dcfce7',
        'Finding': '#fee2e2',
        'Topic': 'var(--color-primary-light)'
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: 'var(--color-text)' }}>Activity Log</h1>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} /> System Governance Log · Clinical Audit Trail
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search activity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '14px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} color="#64748b" />
                        <select
                            value={filterType}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer', minWidth: '150px' }}
                        >
                            <option value="All Entities">All Entities</option>
                            <option value="Users">Users</option>
                            <option value="Audits">Audits</option>
                            <option value="Topics">Topics</option>
                            <option value="Locations">Locations</option>
                            <option value="Departments">Departments</option>
                        </select>
                    </div>

                    {filterType === 'Locations' && (
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer', minWidth: '140px' }}
                        >
                            <option value="All">All Swiss Locations</option>
                            {availableLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    )}

                    {filterType === 'Departments' && (
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer', minWidth: '140px' }}
                        >
                            <option value="All">All Departments</option>
                            {availableDepartments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Timeline List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {filteredActivities.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                        <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <p>No activity recorded yet matching your filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredActivities.map((act, index) => (
                            <div
                                key={act.id}
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    display: 'flex',
                                    gap: '1.5rem',
                                    borderBottom: index === filteredActivities.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    transition: 'background 0.2s',
                                    cursor: 'default'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                {/* Left Icon Column */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: typeColors[act.entityType] || '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getIcon(act.type)}
                                </div>

                                {/* Content Column */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '15px' }}>{act.message}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{formatTimestamp(act.timestamp)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                            {act.entityType}: <strong style={{ color: 'var(--color-text)' }}>{act.entityName}</strong>
                                            {act.entityId && <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontWeight: 500 }}>({act.entityId})</span>}
                                        </span>
                                        {act.location && (
                                            <>
                                                <span style={{ color: '#e2e8f0' }}>|</span>
                                                <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={12} /> {act.location}
                                                </span>
                                            </>
                                        )}
                                        {act.department && (
                                            <>
                                                <span style={{ color: '#e2e8f0' }}>|</span>
                                                <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Building2 size={12} /> {act.department}
                                                </span>
                                            </>
                                        )}
                                        <span style={{ color: '#e2e8f0' }}>|</span>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                            By: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{act.performedBy}</span>
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <ArrowRight size={16} color="#e2e8f0" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;
