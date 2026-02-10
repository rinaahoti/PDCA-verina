import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Location, Department, AppUser } from '../types/admin';
import {
    Plus, Edit2, Trash2, MapPin, Building2, Users,
    Search, AlertCircle, Save, X, RefreshCw,
    ChevronDown, ChevronRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Administration: React.FC = () => {
    const { t } = useLanguage();

    // Helper to translate known location names
    const getTranslatedLocationName = (name: string) => {
        const map: Record<string, string> = {
            'University Hospital Zurich (ZH)': 'admin.universityHospitalZurich',
            'Geneva University Hospitals (GE)': 'admin.genevaUniversityHospitals',
            'Inselspital Bern (BE)': 'admin.inselspitalBern',
            'University Hospital Basel (BS)': 'admin.universityHospitalBasel',
            'CHUV Lausanne (VD)': 'admin.chuvLausanne'
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
            'Emergency Medicine': 'admin.emergencyMedicine'
        };
        return map[name] ? t(map[name]) : name;
    };

    // Helper to translate roles
    const getTranslatedRole = (role: string) => {
        const lowerRole = role.toLowerCase();
        return t(`admin.roles.${lowerRole}`) || role;
    };

    const [activeTab, setActiveTab] = useState<'locations' | 'departments' | 'users'>('locations');
    const [locations, setLocations] = useState<Location[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);

    useEffect(() => {
        const load = () => {
            setLocations(adminService.getLocations());
            setDepartments(adminService.getDepartments());
            setUsers(adminService.getUsers());
        };
        load();
        window.addEventListener('storage-admin', load);
        return () => window.removeEventListener('storage-admin', load);
    }, []);

    // --- DRAWER STATE ---
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [drawerUserRoleFilter, setDrawerUserRoleFilter] = useState<string>('All');

    // --- GROUPED TABS STATE ---
    const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({});
    const [tabRoleFilters, setTabRoleFilters] = useState<Record<string, string>>({});
    const [lockLocationId, setLockLocationId] = useState<string | null>(null); // For locking modals

    const toggleLoc = (id: string) => {
        setExpandedLocs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- MODAL STATES ---
    const [isLocationModalOpen, setLocModalOpen] = useState(false);
    const [editingLoc, setEditingLoc] = useState<Partial<Location>>({});

    const [isDepModalOpen, setDepModalOpen] = useState(false);
    const [editingDep, setEditingDep] = useState<Partial<Department>>({});

    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<AppUser>>({});

    // --- HANDLERS ---

    // Locations
    const handleSaveLocation = () => {
        if (!editingLoc.name) return alert(t('admin.validation.nameRequired'));
        const loc: Location = {
            id: editingLoc.id || `LOC-${Date.now()}`,
            name: editingLoc.name!,
            city: editingLoc.city || '',
            country: editingLoc.country || '',
            code: editingLoc.code || ''
        };
        adminService.saveLocation(loc);
        setLocModalOpen(false);
        // If editing the currently open location, update it
        if (selectedLocation && selectedLocation.id === loc.id) {
            setSelectedLocation(loc);
        }
    };
    const handleDeleteLocation = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent drawer opening
        if (confirm(t('admin.confirm.deleteLocation'))) {
            try {
                adminService.deleteLocation(id);
                if (selectedLocation?.id === id) setSelectedLocation(null);
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    // Departments
    const handleSaveDepartment = () => {
        if (!editingDep.name || !editingDep.locationId) return alert(t('admin.validation.nameLocationRequired'));
        const dep: Department = {
            id: editingDep.id || `DEP-${Date.now()}`,
            name: editingDep.name!,
            locationId: editingDep.locationId!
        };
        adminService.saveDepartment(dep);
        setDepModalOpen(false);
    };
    const handleDeleteDepartment = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm(t('admin.confirm.deleteDepartment'))) {
            try {
                adminService.deleteDepartment(id);
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    // Users
    const handleSaveUser = () => {
        if (!editingUser.fullName || !editingUser.email || !editingUser.locationId) return alert(t('admin.validation.nameEmailLocationRequired'));
        const usr: AppUser = {
            id: editingUser.id || `USR-${Date.now()}`,
            fullName: editingUser.fullName!,
            email: editingUser.email!,
            role: (editingUser.role as any) || 'Viewer',
            locationId: editingUser.locationId!,
            departmentId: editingUser.departmentId
        };
        adminService.saveUser(usr);
        setUserModalOpen(false);
    };
    const handleDeleteUser = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm(t('admin.confirm.deleteUser'))) {
            try {
                adminService.deleteUser(id);
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    // Helper to add department from drawer or tab
    const onAddDepartment = (locId?: string) => {
        const id = locId || selectedLocation?.id;
        if (!id) return;
        setLockLocationId(id);
        setEditingDep({ locationId: id });
        setDepModalOpen(true);
    };

    // Helper to add user from drawer or tab
    const onAddUser = (locId?: string) => {
        const id = locId || selectedLocation?.id;
        if (!id) return;
        setLockLocationId(id);
        setEditingUser({ locationId: id, role: 'Viewer' });
        setUserModalOpen(true);
    };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '4rem', position: 'relative' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: 'var(--color-text)' }}>{t('admin.pageTitle')}</h1>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{t('admin.subtitle')}</div>
                </div>
                <button onClick={adminService.resetData} className="btn btn-outline" style={{ display: 'flex', gap: '8px' }}>
                    <RefreshCw size={16} /> {t('admin.restoreDefaultData')}
                </button>
            </div>

            {/* TABS */}
            <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '2rem', display: 'flex', gap: '2rem' }}>
                <button
                    onClick={() => setActiveTab('locations')}
                    style={{
                        padding: '0.75rem 0',
                        color: activeTab === 'locations' ? '#5FAE9E' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'locations' ? '2px solid #5FAE9E' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    {t('admin.tabLocations')}
                </button>
                <button
                    onClick={() => setActiveTab('departments')}
                    style={{
                        padding: '0.75rem 0',
                        color: activeTab === 'departments' ? '#5FAE9E' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'departments' ? '2px solid #5FAE9E' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    {t('admin.tabDepartments')}
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '0.75rem 0',
                        color: activeTab === 'users' ? '#5FAE9E' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'users' ? '2px solid #5FAE9E' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    {t('admin.tabUsers')}
                </button>
            </div>

            {/* CONTENT */}
            <div className="card" style={{ padding: 0 }}>
                {/* --- LOCATIONS TAB --- */}
                {activeTab === 'locations' && (
                    <div>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('admin.locations')}</h3>
                            <button className="btn" onClick={() => { setEditingLoc({}); setLocModalOpen(true); }} style={{ display: 'flex', gap: '6px', background: '#b3d8d8', color: '#424b55', border: '1px solid #424b55' }}>
                                <Plus size={16} /> {t('admin.addLocation')}
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '12px' }}>{t('common.name')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '12px' }}>{t('common.city')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '12px' }}>{t('common.country')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '12px' }}>{t('common.code')}</th>
                                    <th style={{ textAlign: 'right', padding: '1rem', color: '#64748b', fontSize: '12px' }}>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.length === 0 ? <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('admin.noLocationsFound')}</td></tr> :
                                    locations.map(loc => (
                                        <tr
                                            key={loc.id}
                                            style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: selectedLocation?.id === loc.id ? '#cbeee2' : 'transparent' }}
                                            onClick={() => setSelectedLocation(loc)}
                                            className="hover-row"
                                        >
                                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{getTranslatedLocationName(loc.name)}</td>
                                            <td style={{ padding: '1rem' }}>{loc.city || '-'}</td>
                                            <td style={{ padding: '1rem' }}>{loc.country === 'Switzerland' ? t('common.switzerland') : (loc.country || '-')}</td>
                                            <td style={{ padding: '1rem' }}>{loc.code || '-'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => { setEditingLoc(loc); setLocModalOpen(true); }} className="btn btn-outline" style={{ padding: '4px 8px' }}><Edit2 size={14} /></button>
                                                    <button onClick={(e) => handleDeleteLocation(loc.id, e)} className="btn btn-outline" style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fee2e2' }}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- DEPARTMENTS TAB --- */}
                {activeTab === 'departments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem' }}>
                        {locations.length === 0 ? (
                            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                <Building2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                <p>{t('admin.noLocationsAddFirst')}</p>
                            </div>
                        ) : (
                            locations.map(loc => {
                                const locDeps = departments.filter(d => d.locationId === loc.id);
                                const isExpanded = expandedLocs[loc.id] !== false;
                                return (
                                    <div key={loc.id} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: 0 }}>
                                        <div
                                            onClick={() => toggleLoc(loc.id)}
                                            style={{
                                                padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#b3d8d8' : 'var(--color-bg)',
                                                borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {isExpanded ? <ChevronDown size={20} style={{ color: '#424b55' }} /> : <ChevronRight size={20} />}
                                                <div>
                                                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isExpanded ? '#424b55' : 'var(--color-text)' }}>{getTranslatedLocationName(loc.name)}</span>
                                                    {isExpanded && <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{locDeps.length} {t('admin.departments')}</span>}
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <button
                                                    className="btn"
                                                    style={{ fontSize: '12px', padding: '6px 12px', background: '#b3d8d8', color: '#424b55', border: '1px solid #424b55' }}
                                                    onClick={(e) => { e.stopPropagation(); onAddDepartment(loc.id); }}
                                                >
                                                    <Plus size={14} /> {t('admin.addDepartment')}
                                                </button>
                                            )}
                                        </div>
                                        {isExpanded && (
                                            <div style={{ padding: '0.5rem' }}>
                                                {locDeps.length === 0 ? (
                                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: '#ffffff' }}>
                                                        {t('admin.noDepartmentsFor')} <strong>{getTranslatedLocationName(loc.name)}</strong>.
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <button onClick={() => onAddDepartment(loc.id)} className="btn btn-outline" style={{ fontSize: '12px' }}>{t('admin.addDepartment')}</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                                        <thead style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>
                                                            <tr>
                                                                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.departmentName')}</th>
                                                                <th style={{ padding: '0.75rem 1rem' }}>{t('common.users')}</th>
                                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('common.actions')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {locDeps.map(dep => (
                                                                <tr key={dep.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{getTranslatedDepartmentName(dep.name)}</td>
                                                                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                                                                        {users.filter(u => u.departmentId === dep.id).length} {t('common.users')}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                            <button onClick={() => { setEditingDep(dep); setDepModalOpen(true); }} className="btn btn-outline" style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
                                                                            <button onClick={(e) => handleDeleteDepartment(dep.id, e)} className="btn btn-outline" style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fee2e2' }}><Trash2 size={13} /></button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem' }}>
                        {locations.length === 0 ? (
                            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                <p>{t('admin.noLocationsAddUserFirst')}</p>
                            </div>
                        ) : (
                            locations.map(loc => {
                                const locUsers = users.filter(u => u.locationId === loc.id);
                                const admins = locUsers.filter(u => u.role === 'Admin').length;
                                const isExpanded = expandedLocs[loc.id] !== false;
                                const currentFilter = tabRoleFilters[loc.id] || 'All';
                                const filteredUsers = locUsers.filter(u => currentFilter === 'All' || u.role === currentFilter);

                                return (
                                    <div key={loc.id} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: 0 }}>
                                        <div
                                            onClick={() => toggleLoc(loc.id)}
                                            style={{
                                                padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#b3d8d8' : 'var(--color-bg)',
                                                borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {isExpanded ? <ChevronDown size={20} style={{ color: '#424b55' }} /> : <ChevronRight size={20} />}
                                                <div>
                                                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isExpanded ? '#424b55' : 'var(--color-text)' }}>{getTranslatedLocationName(loc.name)}</span>

                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <button
                                                    className="btn"
                                                    style={{ fontSize: '12px', padding: '6px 12px', background: '#b3d8d8', color: '#424b55', border: '1px solid #424b55' }}
                                                    onClick={(e) => { e.stopPropagation(); onAddUser(loc.id); }}
                                                >
                                                    <Plus size={14} /> {t('admin.addUser')}
                                                </button>
                                            )}
                                        </div>
                                        {isExpanded && (
                                            <div style={{ padding: '1.25rem' }}>
                                                {/* Filter Chips */}
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                                    {['All', 'Admin', 'Owner', 'Assigned', 'Viewer'].map(role => (
                                                        <button
                                                            key={role}
                                                            onClick={(e) => { e.stopPropagation(); setTabRoleFilters(prev => ({ ...prev, [loc.id]: role })); }}
                                                            style={{
                                                                padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                                                cursor: 'pointer', border: '1px solid',
                                                                background: currentFilter === role ? '#cbeee2' : 'white',
                                                                color: currentFilter === role ? '#5FAE9E' : 'var(--color-text-muted)',
                                                                borderColor: currentFilter === role ? '#5FAE9E' : 'var(--color-border)',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {getTranslatedRole(role)} ({role === 'All' ? locUsers.length : locUsers.filter(u => u.role === role).length})
                                                        </button>
                                                    ))}
                                                </div>

                                                {locUsers.length === 0 ? (
                                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: '#ffffff', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                                        {t('admin.noUsersAssigned')} <strong>{getTranslatedLocationName(loc.name)}</strong>.
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <button onClick={() => onAddUser(loc.id)} className="btn btn-outline" style={{ fontSize: '12px' }}>{t('admin.addUser')}</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                                                                <tr>
                                                                    <th style={{ padding: '0.75rem 1rem' }}>{t('common.user')}</th>
                                                                    <th style={{ padding: '0.75rem 1rem' }}>{t('common.role')}</th>
                                                                    <th style={{ padding: '0.75rem 1rem' }}>{t('admin.department')}</th>
                                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('common.actions')}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {filteredUsers.length === 0 ? (
                                                                    <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('admin.noUsersMatchFilter')}</td></tr>
                                                                ) : (
                                                                    filteredUsers.map(user => (
                                                                        <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                                                <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                                                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{user.email}</div>
                                                                            </td>
                                                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                                                <span style={{
                                                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                                                                                    background: user.role === 'Admin' ? '#f3e8ff' : user.role === 'Owner' ? '#dbeafe' : user.role === 'Assigned' ? '#dcfce7' : '#f1f5f9',
                                                                                    color: user.role === 'Admin' ? '#7e22ce' : user.role === 'Owner' ? '#1e40af' : user.role === 'Assigned' ? '#15803d' : '#475569'
                                                                                }}>{getTranslatedRole(user.role)}</span>
                                                                            </td>
                                                                            <td style={{ padding: '0.75rem 1rem' }}>{user.departmentName ? getTranslatedDepartmentName(user.departmentName) : '-'}</td>
                                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                                    <button onClick={() => { setEditingUser(user); setUserModalOpen(true); }} className="btn btn-outline" style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
                                                                                    <button onClick={(e) => handleDeleteUser(user.id, e)} className="btn btn-outline" style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fee2e2' }}><Trash2 size={13} /></button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* --- LOCATION DETAILS DRAWER --- */}
            {selectedLocation && (() => {
                const locationDeps = departments.filter(d => d.locationId === selectedLocation.id);
                const locationUsers = users.filter(u => u.locationId === selectedLocation.id);
                const filteredDrawerUsers = locationUsers.filter(u => drawerUserRoleFilter === 'All' || u.role === drawerUserRoleFilter);

                const stats = [
                    { label: t('admin.totalUsers'), value: locationUsers.length, color: '#3b82f6' },
                    { label: t('admin.departmentsCount'), value: locationDeps.length, color: '#8b5cf6' },
                    { label: t('admin.adminsCount'), value: locationUsers.filter(u => u.role === 'Admin').length, color: '#f59e0b' },
                    { label: t('admin.assignedCount'), value: locationUsers.filter(u => u.role === 'Assigned').length, color: '#10b981' }
                ];

                return (
                    <>
                        <div
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 900 }}
                            onClick={() => setSelectedLocation(null)}
                        />
                        <div style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0, width: '650px', background: 'white', zIndex: 950,
                            boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', overflowY: 'auto', display: 'flex', flexDirection: 'column'
                        }}>
                            {/* Drawer Header */}
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: 700 }}>{t('admin.locationDetails')}</h2>
                                    <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={14} /> {getTranslatedLocationName(selectedLocation.name)} {selectedLocation.city && `· ${selectedLocation.city}`}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLocation(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Summary Row */}
                            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {stats.map(s => (
                                    <div key={s.label} style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                                {/* Departments Section */}
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Building2 size={18} style={{ color: '#64748b' }} />
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{t('admin.departments')}</h3>
                                        </div>
                                        <button onClick={() => onAddDepartment()} className="btn" style={{ fontSize: '12px', padding: '6px 12px', background: '#b3d8d8', color: '#424b55', border: '1px solid #424b55' }}>
                                            <Plus size={14} /> {t('admin.addDepartment')}
                                        </button>
                                    </div>

                                    {locationDeps.length === 0 ? (
                                        <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                            <div style={{ color: '#94a3b8', marginBottom: '1rem' }}>{t('admin.noDepartmentsForLocation')}</div>
                                            <button onClick={() => onAddDepartment()} className="btn btn-outline" style={{ fontSize: '13px' }}>{t('admin.createFirstDepartment')}</button>
                                        </div>
                                    ) : (
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px' }}>
                                                        <th style={{ padding: '0.75rem 1rem' }}>{t('admin.departmentName')}</th>
                                                        <th style={{ padding: '0.75rem 1rem' }}>{t('admin.usersCount')}</th>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('common.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {locationDeps.map(dep => (
                                                        <tr key={dep.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#1e293b' }}>{getTranslatedDepartmentName(dep.name)}</td>
                                                            <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <Users size={14} /> {users.filter(u => u.departmentId === dep.id).length}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                    <button onClick={() => { setEditingDep(dep); setDepModalOpen(true); }} className="btn btn-outline" style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
                                                                    <button onClick={(e) => handleDeleteDepartment(dep.id, e)} className="btn btn-outline" style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fee2e2' }}><Trash2 size={13} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>

                                {/* Users Section */}
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Users size={18} style={{ color: '#64748b' }} />
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{t('admin.tabUsers')}</h3>
                                        </div>
                                        <button onClick={() => onAddUser()} className="btn" style={{ fontSize: '12px', padding: '6px 12px', background: '#b3d8d8', color: '#424b55', border: '1px solid #424b55' }}>
                                            <Plus size={14} /> {t('admin.addUser')}
                                        </button>
                                    </div>

                                    {/* Filter Chips */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                        {['All', 'Admin', 'Owner', 'Assigned', 'Viewer'].map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setDrawerUserRoleFilter(role)}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    border: '1px solid',
                                                    background: drawerUserRoleFilter === role ? '#cbeee2' : 'white',
                                                    color: drawerUserRoleFilter === role ? '#5FAE9E' : 'var(--color-text-muted)',
                                                    borderColor: drawerUserRoleFilter === role ? '#5FAE9E' : 'var(--color-border)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {getTranslatedRole(role)}{role !== 'All' ? ` (${locationUsers.filter(u => u.role === role).length})` : ` (${locationUsers.length})`}
                                            </button>
                                        ))}
                                    </div>

                                    {locationUsers.length === 0 ? (
                                        <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                            <div style={{ color: '#94a3b8', marginBottom: '1rem' }}>{t('admin.noUsersAssigned')} {t('common.location').toLowerCase()}.</div>
                                            <button onClick={() => onAddUser()} className="btn btn-outline" style={{ fontSize: '13px' }}>{t('admin.inviteFirstUser')}</button>
                                        </div>
                                    ) : (
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                                                    <tr>
                                                        <th style={{ padding: '0.75rem 1rem' }}>{t('admin.fullName')} & {t('admin.email')}</th>
                                                        <th style={{ padding: '0.75rem 1rem' }}>{t('common.role')}</th>
                                                        <th style={{ padding: '0.75rem 1rem' }}>{t('admin.department')}</th>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('common.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredDrawerUsers.length === 0 ? (
                                                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('admin.noUsersMatchFilter')}</td></tr>
                                                    ) : (
                                                        filteredDrawerUsers.map(user => (
                                                            <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{user.fullName}</div>
                                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.email}</div>
                                                                </td>
                                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                                    <span style={{
                                                                        padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                                                                        background: user.role === 'Admin' ? '#f3e8ff' : user.role === 'Owner' ? '#dbeafe' : user.role === 'Assigned' ? '#dcfce7' : '#f1f5f9',
                                                                        color: user.role === 'Admin' ? '#7e22ce' : user.role === 'Owner' ? '#1e40af' : user.role === 'Assigned' ? '#15803d' : '#475569'
                                                                    }}>{getTranslatedRole(user.role)}</span>
                                                                </td>
                                                                <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>{user.departmentName ? getTranslatedDepartmentName(user.departmentName) : '-'}</td>
                                                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                                        <button onClick={() => { setEditingUser(user); setUserModalOpen(true); }} className="btn btn-outline" style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
                                                                        <button onClick={(e) => handleDeleteUser(user.id, e)} className="btn btn-outline" style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fee2e2' }}><Trash2 size={13} /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </>
                );
            })()}

            {/* --- MODALS --- */}

            {/* Location Modal */}
            {isLocationModalOpen && (
                <div style={modalOverlayStyle}>
                    <div className="card" style={{ width: '500px', padding: 0 }}>
                        <div style={modalHeaderStyle}>
                            <h3>{editingLoc.id ? t('admin.editLocation') : t('admin.addLocation')}</h3>
                            <button onClick={() => setLocModalOpen(false)} style={closeBtnStyle}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>{t('common.name')} *</label>
                                <input className="input" value={editingLoc.name || ''} onChange={e => setEditingLoc({ ...editingLoc, name: e.target.value })} placeholder={t('admin.locationPlaceholder')} />
                            </div>
                            <div className="form-group">
                                <label>{t('common.city')}</label>
                                <input className="input" value={editingLoc.city || ''} onChange={e => setEditingLoc({ ...editingLoc, city: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>{t('common.country')}</label>
                                    <input className="input" value={editingLoc.country || ''} onChange={e => setEditingLoc({ ...editingLoc, country: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>{t('common.code')}</label>
                                    <input className="input" value={editingLoc.code || ''} onChange={e => setEditingLoc({ ...editingLoc, code: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={handleSaveLocation} className="btn" style={{ background: '#cbeee2', color: '#5FAE9E', border: 'none' }}>{t('admin.saveLocation')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            {isDepModalOpen && (
                <div style={modalOverlayStyle}>
                    <div className="card" style={{ width: '500px', padding: 0 }}>
                        <div style={modalHeaderStyle}>
                            <h3>{editingDep.id ? t('admin.editDepartment') : t('admin.addDepartment')}</h3>
                            <button onClick={() => { setDepModalOpen(false); setLockLocationId(null); }} style={closeBtnStyle}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>{t('admin.departmentName')} *</label>
                                <input className="input" value={editingDep.name || ''} onChange={e => setEditingDep({ ...editingDep, name: e.target.value })} placeholder={t('admin.departmentPlaceholder')} />
                            </div>
                            <div className="form-group">
                                <label>{t('common.location')} *</label>
                                <select
                                    className="input"
                                    value={editingDep.locationId || ''}
                                    onChange={e => setEditingDep({ ...editingDep, locationId: e.target.value })}
                                    disabled={!!(selectedLocation || lockLocationId) && !editingDep.id} // Lock if adding from context
                                    style={{ background: (!!(selectedLocation || lockLocationId) && !editingDep.id) ? '#f1f5f9' : 'white' }}
                                >
                                    <option value="">{t('admin.selectLocation')}</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={handleSaveDepartment} className="btn" style={{ background: '#cbeee2', color: '#5FAE9E', border: 'none' }}>{t('admin.saveDepartment')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {isUserModalOpen && (
                <div style={modalOverlayStyle}>
                    <div className="card" style={{ width: '500px', padding: 0 }}>
                        <div style={modalHeaderStyle}>
                            <h3>{editingUser.id ? t('admin.editUser') : t('admin.addUser')}</h3>
                            <button onClick={() => { setUserModalOpen(false); setLockLocationId(null); }} style={closeBtnStyle}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>{t('admin.fullName')} *</label>
                                <input className="input" value={editingUser.fullName || ''} onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('admin.email')} *</label>
                                <input className="input" value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('common.role')} *</label>
                                <select className="input" value={editingUser.role || 'Viewer'} onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}>
                                    <option value="Admin">{t('admin.roles.admin')}</option>
                                    <option value="Owner">{t('admin.roles.owner')}</option>
                                    <option value="Assigned">{t('admin.roles.assigned')}</option>
                                    <option value="Viewer">{t('admin.roles.viewer')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('common.location')} *</label>
                                <select
                                    className="input"
                                    value={editingUser.locationId || ''}
                                    onChange={e => setEditingUser({ ...editingUser, locationId: e.target.value, departmentId: '' })}
                                    disabled={!!(selectedLocation || lockLocationId) && !editingUser.id} // Lock if adding from context
                                    style={{ background: (!!(selectedLocation || lockLocationId) && !editingUser.id) ? 'var(--color-bg)' : 'white' }}
                                >
                                    <option value="">{t('admin.selectLocation')}</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('admin.department')}</label>
                                <select className="input" value={editingUser.departmentId || ''} onChange={e => setEditingUser({ ...editingUser, departmentId: e.target.value })}>
                                    <option value="">{t('admin.selectDepartment')}</option>
                                    {departments
                                        .filter(d => !editingUser.locationId || d.locationId === editingUser.locationId)
                                        .map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                                    }
                                </select>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={handleSaveUser} className="btn" style={{ background: '#cbeee2', color: '#5FAE9E', border: 'none' }}>{t('admin.saveUser')}</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// Styles for modals
const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalHeaderStyle: React.CSSProperties = {
    padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};
const closeBtnStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' };
const modalFooterStyle: React.CSSProperties = {
    padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', justifyContent: 'flex-end', gap: '1rem'
};

export default Administration;
