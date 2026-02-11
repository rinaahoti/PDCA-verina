import React, { useState, useEffect, useMemo } from 'react';
import { activityService } from '../services/activityService';
import { ActivityEntry, ActivityType } from '../types/activity';
import {
    Activity, User, Building2, MapPin, FileText, Search,
    Filter, Clock, CheckCircle2, ArrowRight, UserPlus, Trash2, Edit
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ActivityLog: React.FC = () => {
    const { t, language } = useLanguage();
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

    // Helper to translate known location names (shared logic)
    const getTranslatedLocationName = (name: string) => {
        const map: Record<string, string> = {
            'University Hospital Zurich (ZH)': 'admin.universityHospitalZurich',
            'University Hospital Zurich': 'admin.universityHospitalZurich',
            'Zurich': 'admin.zurich',
            'Geneva University Hospitals (GE)': 'admin.genevaUniversityHospitals',
            'Geneva University Hospitals': 'admin.genevaUniversityHospitals',
            'Geneva': 'admin.geneva',
            'Inselspital Bern (BE)': 'admin.inselspitalBern',
            'Inselspital Bern': 'admin.inselspitalBern',
            'Bern': 'admin.bern',
            'University Hospital Basel (BS)': 'admin.universityHospitalBasel',
            'University Hospital Basel': 'admin.universityHospitalBasel',
            'Basel': 'admin.basel',
            'CHUV Lausanne (VD)': 'admin.chuvLausanne',
            'CHUV Lausanne': 'admin.chuvLausanne',
            'Lausanne': 'admin.lausanne'
        };
        return map[name] ? t(map[name]) : name;
    };

    // Helper to translate known department names
    const getTranslatedDepartmentName = (name: string) => {
        const map: Record<string, string> = {
            'Quality & Patient Safety': 'admin.qualityPatientSafety',
            'Surgery Department': 'admin.surgeryDepartment',
            'Main Pharmacy': 'admin.mainPharmacy',
            'Infectious Diseases': 'admin.infectiousDiseases',
            'Emergency Medicine': 'admin.emergencyMedicine',
            'Clinical Compliance': 'admin.clinicalCompliance',
            'Compliance & Ethics': 'admin.complianceEthics',
            'Nursing': 'admin.nursing'
        };
        return map[name] ? t(map[name]) : name;
    };

    // Helper to translate arbitrary text (Topics, Audits, etc.)
    const getTranslatedText = (text: string) => {
        const map: Record<string, string> = {
            'Reduction of Post-operative Infection Rates': 'Reduktion postoperativer Infektionsraten',
            'Medication Administration Error Reduction': 'Reduktion von Medikationsfehlern',
            'Patient Fall Prevention Protocol Compliance': 'Einhaltung des Sturzpräventionsprotokolls',
            'New Clinical PDCA: Fall Prevention': 'Neues klinisches KVP: Sturzprävention',
            'Fall Prevention': 'Sturzprävention',
            'Pediatric crash cart missing items': 'Fehlende Gegenstände im pädiatrischen Notfallwagen',
            'Internal Patient Safety Audit 2026': 'Internes Patientensicherheits-Audit 2026',
            'Joint Commission Hospital Accreditation': 'Joint Commission Krankenhausakkreditierung'
        };
        return map[text] || text;
    };

    // Helper to translate activity messages
    const translateActivityMessage = (message: string) => {
        // New Clinical Staff
        if (message.includes('New clinical staff registered')) return t('activityLog.messages.newClinicalStaff');

        // Site Visit
        if (message.includes('Patient Safety Site Visit scheduled')) return t('activityLog.messages.siteVisitScheduled');

        // Topic Moved Check
        const topicCheck = message.match(/Topic (.*?) moved to CHECK phase [-–] (.*)/) || message.match(/Topic moved to CHECK phase [-–] (.*)/);
        if (topicCheck) {
            // If Group 2 exists it is location, if only Group 1 exists (from second regex) it is location
            const location = topicCheck[2] || topicCheck[1];
            return t('activityLog.messages.topicMovedCheck', { location: getTranslatedLocationName(location) });
        }

        // Topic Moved Act
        const topicAct = message.match(/PDCA topic moved to ACT phase [-–] (.*)/) || message.match(/KVP Topic moved to ACT phase [-–] (.*)/);
        if (topicAct) return t('activityLog.messages.topicMovedAct', { location: getTranslatedLocationName(topicAct[1]) });

        // Dept Created - Specific format "Department created: Name"
        const deptCreatedSpecific = message.match(/^Department created: (.*)$/);
        if (deptCreatedSpecific) return t('activityLog.messages.deptCreated', { name: getTranslatedDepartmentName(deptCreatedSpecific[1]) });

        // Loc Added
        const locAdded = message.match(/^Location added: (.*)$/);
        if (locAdded) return t('activityLog.messages.locAdded', { name: getTranslatedLocationName(locAdded[1]) });

        // Audit Completed
        const auditComp = message.match(/Clinical audit completed [-–] (.*)/) || message.match(/Clinical Audit completed [-–] (.*)/);
        if (auditComp) return t('activityLog.messages.auditCompleted', { location: getTranslatedLocationName(auditComp[1]) });

        // Profile Updated
        if (message.includes('Clinical profile updated')) return t('activityLog.messages.profileUpdated');

        // Incident Reported
        const incident = message.match(/Patient safety incident reported [-–] (.*)/);
        if (incident) return t('activityLog.messages.incidentReported', { location: getTranslatedLocationName(incident[1]) });

        // New Clinical PDCA
        const newPdca = message.match(/New Clinical PDCA: (.*)/) || message.match(/Neues klinisches KVP: (.*)/);
        if (newPdca) return t('activityLog.messages.newClinicalPdca', { topic: getTranslatedText(newPdca[1]) });

        // Original Topic Created
        const topicCreatedMatch = message.match(/^New PDCA Topic (.*?) created$/);
        if (topicCreatedMatch) return t('activityLog.messages.topicCreated', { id: topicCreatedMatch[1] });

        // Original Topic Moved (Generic)
        const topicMovedMatch = message.match(/^Topic (.*?) moved to (.*?) phase$/);
        if (topicMovedMatch) return t('activityLog.messages.topicMovedToPhase', { id: topicMovedMatch[1], phase: topicMovedMatch[2] });

        // Original Location Created
        const locCreatedMatch = message.match(/^Location (.*?) created$/);
        if (locCreatedMatch) return t('activityLog.messages.locationCreated', { name: getTranslatedLocationName(locCreatedMatch[1]) });

        // Original Location Updated
        const locUpdatedMatch = message.match(/^Location (.*?) updated$/);
        if (locUpdatedMatch) return t('activityLog.messages.locationUpdated', { name: getTranslatedLocationName(locUpdatedMatch[1]) });

        // Original Location Deleted
        const locDeletedMatch = message.match(/^Location (.*?) deleted$/);
        if (locDeletedMatch) return t('activityLog.messages.locationDeleted', { name: getTranslatedLocationName(locDeletedMatch[1]) });

        // Original Department Created (Generic)
        const depCreatedMatch = message.match(/^Department (.*?) created$/);
        if (depCreatedMatch) return t('activityLog.messages.departmentCreated', { name: getTranslatedDepartmentName(depCreatedMatch[1]) });

        // Original Department Updated
        const depUpdatedMatch = message.match(/^Department (.*?) updated$/);
        if (depUpdatedMatch) return t('activityLog.messages.departmentUpdated', { name: getTranslatedDepartmentName(depUpdatedMatch[1]) });

        // Original Department Deleted
        const depDeletedMatch = message.match(/^Department (.*?) deleted$/);
        if (depDeletedMatch) return t('activityLog.messages.departmentDeleted', { name: getTranslatedDepartmentName(depDeletedMatch[1]) });

        // User Added
        const userAddedMatch = message.match(/^User (.*?) registered$/);
        if (userAddedMatch) return t('activityLog.messages.userAdded', { name: userAddedMatch[1] });

        // User Updated
        const userUpdatedMatch = message.match(/^User (.*?) updated$/);
        if (userUpdatedMatch) return t('activityLog.messages.userEdited', { name: userUpdatedMatch[1] });

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
            'Audit': 'activityLog.audit',
            'Finding': 'common.findings'
        };
        return map[type] ? t(map[type]) : type;
    };

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
            const translatedMsg = translateActivityMessage(act.message).toLowerCase();
            const translatedEntityName = act.entityType === 'Location' ? getTranslatedLocationName(act.entityName) :
                act.entityType === 'Department' ? getTranslatedDepartmentName(act.entityName) :
                    act.entityName;

            const matchesSearch =
                translatedMsg.includes(query) ||
                translatedEntityName.toLowerCase().includes(query) ||
                (act.entityId && act.entityId.toLowerCase().includes(query)) ||
                act.entityType.toLowerCase().includes(query) ||
                act.performedBy.toLowerCase().includes(query) ||
                (act.location && getTranslatedLocationName(act.location).toLowerCase().includes(query)) ||
                (act.department && getTranslatedDepartmentName(act.department).toLowerCase().includes(query));

            // Map plural back to singular for matching
            const actTypePlural = act.entityType === 'User' ? 'Users' :
                act.entityType === 'Department' ? 'Departments' :
                    act.entityType === 'Location' ? 'Locations' :
                        act.entityType === 'Topic' ? 'Topics' :
                            act.entityType + 's';

            const matchesType = filterType === 'All Entities' || actTypePlural === filterType;

            const matchesLocation = filterLocation === 'All' || act.location === filterLocation;
            const matchesDepartment = filterDepartment === 'All' || act.department === filterDepartment;

            return matchesSearch && matchesType && matchesLocation && matchesDepartment;
        });
    }, [activities, searchTerm, filterType, filterLocation, filterDepartment, t]);

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

        if (diffInMins < 1) return t('common.justNow') || 'Gerade eben';

        if (language === 'de') {
            if (diffInMins < 60) return `vor ${diffInMins}m`;
            if (diffInHours < 24) return `vor ${diffInHours}h`;
        } else {
            if (diffInMins < 60) return `${diffInMins}m ${t('common.ago') || 'ago'}`;
            if (diffInHours < 24) return `${diffInHours}h ${t('common.ago') || 'ago'}`;
        }
        return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: 'var(--color-text)' }}>{t('activityLog.pageTitle')}</h1>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} /> {t('activityLog.subtitle')}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder={t('activityLog.searchPlaceholder')}
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
                            <option value="All Entities">{t('activityLog.allEntities')}</option>
                            <option value="Users">{t('activityLog.users')}</option>
                            <option value="Audits">{t('activityLog.audits')}</option>
                            <option value="Topics">{t('activityLog.topics')}</option>
                            <option value="Locations">{t('activityLog.locations')}</option>
                            <option value="Departments">{t('activityLog.departments')}</option>
                        </select>
                    </div>

                    {filterType === 'Locations' && (
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer', minWidth: '140px' }}
                        >
                            <option value="All">{t('activityLog.allEntities')}</option>
                            {availableLocations.map(loc => (
                                <option key={loc} value={loc}>{getTranslatedLocationName(loc)}</option>
                            ))}
                        </select>
                    )}

                    {filterType === 'Departments' && (
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer', minWidth: '140px' }}
                        >
                            <option value="All">{t('activityLog.allEntities')}</option>
                            {availableDepartments.map(dept => (
                                <option key={dept} value={dept}>{getTranslatedDepartmentName(dept)}</option>
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
                        <p>{t('activityLog.noActivityMatching')}</p>
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
                                        <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '15px' }}>{translateActivityMessage(act.message)}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{formatTimestamp(act.timestamp)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                            {getTranslatedEntityType(act.entityType)}: <strong style={{ color: 'var(--color-text)' }}>
                                                {act.entityType === 'Location' ? getTranslatedLocationName(act.entityName) :
                                                    act.entityType === 'Department' ? getTranslatedDepartmentName(act.entityName) :
                                                        (act.entityType === 'Topic' || act.entityType === 'Audit' || act.entityType === 'Finding') ? getTranslatedText(act.entityName) :
                                                            act.entityName}
                                            </strong>
                                            {act.entityId && <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontWeight: 500 }}>({act.entityId})</span>}
                                        </span>
                                        {act.location && (
                                            <>
                                                <span style={{ color: '#e2e8f0' }}>|</span>
                                                <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={12} /> {getTranslatedLocationName(act.location)}
                                                </span>
                                            </>
                                        )}
                                        {act.department && (
                                            <>
                                                <span style={{ color: '#e2e8f0' }}>|</span>
                                                <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Building2 size={12} /> {getTranslatedDepartmentName(act.department)}
                                                </span>
                                            </>
                                        )}
                                        <span style={{ color: '#e2e8f0' }}>|</span>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                            {t('activityLog.messages.by')}: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{act.performedBy}</span>
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
