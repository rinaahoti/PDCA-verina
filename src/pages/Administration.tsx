import React, { useState, useEffect, useMemo, useRef } from 'react';
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
        return t(`roles.${lowerRole}`) || role;
    };

    const [activeTab, setActiveTab] = useState<'locations' | 'departments' | 'users'>('locations');
    const [locations, setLocations] = useState<Location[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [locationSearch, setLocationSearch] = useState('');
    const [locationCountryFilter, setLocationCountryFilter] = useState('');
    const [departmentExpandedLocs, setDepartmentExpandedLocs] = useState<Record<string, boolean>>({});
    const [departmentSearch, setDepartmentSearch] = useState('');
    const [departmentCityFilter, setDepartmentCityFilter] = useState('');
    const [allExpanded, setAllExpanded] = useState(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
    const [depFormCode, setDepFormCode] = useState('');
    const [depFormUsers, setDepFormUsers] = useState('0');
    const [depCodeMeta, setDepCodeMeta] = useState<Record<string, string>>({});
    const [depUsersMeta, setDepUsersMeta] = useState<Record<string, number>>({});
    const [toastMessage, setToastMessage] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);
    const toastTimerRef = useRef<number | null>(null);
    const [userSearch, setUserSearch] = useState('');
    const [userCityFilter, setUserCityFilter] = useState('');
    const [userDepartmentFilter, setUserDepartmentFilter] = useState('');
    const [userGlobalRole, setUserGlobalRole] = useState<'All' | 'Admin' | 'Owner' | 'Assigned' | 'Viewer'>('All');
    const [usersExpandedLocs, setUsersExpandedLocs] = useState<Record<string, boolean>>({});
    const [userLocalRoleFilters, setUserLocalRoleFilters] = useState<Record<string, 'All' | 'Admin' | 'Owner' | 'Assigned' | 'Viewer'>>({});
    const [usersAllExpanded, setUsersAllExpanded] = useState(false);
    const [isAddEditUserModalOpen, setAddEditUserModalOpen] = useState(false);
    const [isTransferUserModalOpen, setTransferUserModalOpen] = useState(false);
    const [isProfileUserModalOpen, setProfileUserModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [transferUserId, setTransferUserId] = useState<string | null>(null);
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const [userForm, setUserForm] = useState({
        fullName: '',
        email: '',
        locationId: '',
        departmentId: '',
        role: 'Assigned' as AppUser['role']
    });
    const [transferForm, setTransferForm] = useState({
        locationId: '',
        departmentId: '',
        role: 'Assigned' as AppUser['role']
    });

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

    const filteredLocations = useMemo(() => {
        const query = locationSearch.trim().toLowerCase();
        return locations.filter(loc => {
            if (locationCountryFilter && (loc.country || '') !== locationCountryFilter) return false;
            if (!query) return true;
            const normalizedName = (loc.name || '').toLowerCase();
            const translatedName = getTranslatedLocationName(loc.name || '').toLowerCase();
            const city = (loc.city || '').toLowerCase();
            const code = (loc.code || '').toLowerCase();
            return normalizedName.includes(query) || translatedName.includes(query) || city.includes(query) || code.includes(query);
        });
    }, [locationSearch, locationCountryFilter, locations, t]);

    const locationCountries = useMemo(
        () => Array.from(new Set(locations.map(loc => (loc.country || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [locations]
    );

    const locationStats = useMemo(() => {
        const totalLocations = filteredLocations.length;
        const totalCountries = new Set(filteredLocations.map(loc => (loc.country || '').trim()).filter(Boolean)).size;
        return { totalLocations, totalCountries };
    }, [filteredLocations]);

    const departmentCities = useMemo(
        () => Array.from(new Set(locations.map(loc => loc.city || '').filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [locations]
    );

    const getDepartmentCode = (dep: Department) => {
        if (dep.name === 'Quality & Patient Safety') return 'M\u00fcllackerstrasse 2/4\n8152 Glattbrugg';
        if (dep.name === 'Tertianum Restelberg') return 'Restelbergstrasse 108\n8044 Z\u00fcrich';
        if (dep.name === 'Surgery Department') return 'K\u00f6nizstrasse 74\n3008 Bern';
        if (depCodeMeta[dep.id]) return depCodeMeta[dep.id];
        const base = (dep.name || '')
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .split(' ')
            .filter(Boolean)
            .map(part => part[0])
            .join('')
            .toUpperCase();
        return (base || (dep.name || '').replace(/\s+/g, '').slice(0, 4).toUpperCase() || 'DEPT').slice(0, 4);
    };

    const getDepartmentUsersCount = (dep: Department) => {
        if (typeof depUsersMeta[dep.id] === 'number') return depUsersMeta[dep.id];
        return users.filter(u => u.departmentId === dep.id).length;
    };

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const highlight = (text: string, query: string) => {
        if (!query) return text;
        const safe = escapeRegExp(query);
        return text.replace(new RegExp(`(${safe})`, 'gi'), '<mark style="background:#c8ede9;color:#1a2e2d;border-radius:2px;padding:0 1px;">$1</mark>');
    };

    const visibleDepartmentGroups = useMemo(() => {
        const q = departmentSearch.trim().toLowerCase();
        return locations.reduce<Array<{ loc: Location; depts: Department[]; totalUsers: number }>>((acc, loc) => {
            if (departmentCityFilter && (loc.city || '') !== departmentCityFilter) return acc;
            const locName = getTranslatedLocationName(loc.name).toLowerCase();
            const locCity = (loc.city || '').toLowerCase();
            const locCode = (loc.code || '').toLowerCase();
            const locMatch = !!q && (locName.includes(q) || locCity.includes(q) || locCode.includes(q));

            let locDepts = departments.filter(d => d.locationId === loc.id);
            if (q && !locMatch) {
                locDepts = locDepts.filter(dep => {
                    const depName = getTranslatedDepartmentName(dep.name).toLowerCase();
                    const depCode = getDepartmentCode(dep).toLowerCase();
                    return depName.includes(q) || depCode.includes(q);
                });
                if (locDepts.length === 0) return acc;
            }

            const totalUsers = locDepts.reduce((sum, dep) => sum + getDepartmentUsersCount(dep), 0);
            acc.push({ loc, depts: locDepts, totalUsers });
            return acc;
        }, []);
    }, [locations, departments, departmentCityFilter, departmentSearch, depCodeMeta, depUsersMeta, users]);

    const departmentStats = useMemo(() => {
        const locationsShown = visibleDepartmentGroups.length;
        const departmentsTotal = visibleDepartmentGroups.reduce((sum, g) => sum + g.depts.length, 0);
        const usersAssigned = visibleDepartmentGroups.reduce((sum, g) => sum + g.totalUsers, 0);
        return { locationsShown, departmentsTotal, usersAssigned };
    }, [visibleDepartmentGroups]);

    const roleOrder: Array<'Admin' | 'Owner' | 'Assigned' | 'Viewer'> = ['Admin', 'Owner', 'Assigned', 'Viewer'];

    const userCities = useMemo(
        () => Array.from(new Set(locations.map(loc => loc.city || '').filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [locations]
    );

    const allDepartmentNames = useMemo(
        () =>
            Array.from(
                new Set(
                    departments
                        .map(dep => getTranslatedDepartmentName(dep.name))
                        .filter(Boolean)
                )
            ).sort((a, b) => a.localeCompare(b)),
        [departments, t]
    );

    const getUserDepartmentName = (user: AppUser) => {
        if (user.departmentName) return getTranslatedDepartmentName(user.departmentName);
        const dep = departments.find(d => d.id === user.departmentId);
        return dep ? getTranslatedDepartmentName(dep.name) : '-';
    };

    const usersViewData = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        let totalLocations = 0;
        let totalUsersShown = 0;
        let totalRoleCounts: Record<'Admin' | 'Owner' | 'Assigned' | 'Viewer', number> = {
            Admin: 0,
            Owner: 0,
            Assigned: 0,
            Viewer: 0
        };

        const groups = locations.reduce<
            Array<{
                loc: Location;
                allLocUsers: AppUser[];
                visibleUsers: AppUser[];
                roleCounts: Record<'Admin' | 'Owner' | 'Assigned' | 'Viewer', number>;
            }>
        >((acc, loc) => {
            if (userCityFilter && (loc.city || '') !== userCityFilter) return acc;

            const localRole = userLocalRoleFilters[loc.id] || 'All';
            const allLocUsers = users.filter(u => u.locationId === loc.id);
            const roleCounts: Record<'Admin' | 'Owner' | 'Assigned' | 'Viewer', number> = {
                Admin: 0,
                Owner: 0,
                Assigned: 0,
                Viewer: 0
            };
            allLocUsers.forEach(u => {
                if (roleCounts[u.role] !== undefined) roleCounts[u.role] += 1;
            });

            const visibleUsers = users.filter(u => {
                if (u.locationId !== loc.id) return false;
                if (userGlobalRole !== 'All' && u.role !== userGlobalRole) return false;
                if (localRole !== 'All' && u.role !== localRole) return false;
                if (userDepartmentFilter && getUserDepartmentName(u) !== userDepartmentFilter) return false;
                if (q) {
                    const nameMatch = (u.fullName || '').toLowerCase().includes(q);
                    const emailMatch = (u.email || '').toLowerCase().includes(q);
                    if (!nameMatch && !emailMatch) return false;
                }
                return true;
            });

            if ((q || userGlobalRole !== 'All' || localRole !== 'All' || userDepartmentFilter) && visibleUsers.length === 0) {
                return acc;
            }

            totalLocations += 1;
            totalUsersShown += visibleUsers.length;
            totalRoleCounts.Admin += roleCounts.Admin;
            totalRoleCounts.Owner += roleCounts.Owner;
            totalRoleCounts.Assigned += roleCounts.Assigned;
            totalRoleCounts.Viewer += roleCounts.Viewer;

            acc.push({ loc, allLocUsers, visibleUsers, roleCounts });
            return acc;
        }, []);

        return {
            groups,
            stats: {
                totalLocations,
                totalUsersShown,
                totalRoleCounts
            }
        };
    }, [locations, users, userCityFilter, userGlobalRole, userLocalRoleFilters, userDepartmentFilter, userSearch, departments, t]);

    useEffect(() => {
        if (!departmentSearch.trim()) return;
        setDepartmentExpandedLocs(prev => {
            const next = { ...prev };
            locations.forEach(loc => {
                next[loc.id] = true;
            });
            return next;
        });
    }, [departmentSearch, locations]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const id = 'dm-mono-font-link';
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap';
        document.head.appendChild(link);
    }, []);

    useEffect(() => {
        if (!userSearch.trim()) return;
        const map: Record<string, boolean> = {};
        locations.forEach(loc => {
            map[loc.id] = true;
        });
        setUsersExpandedLocs(prev => ({ ...map, ...prev }));
    }, [userSearch, locations]);

    useEffect(() => {
        if (userGlobalRole === 'All') return;
        const map: Record<string, boolean> = {};
        locations.forEach(loc => {
            map[loc.id] = true;
        });
        setUsersExpandedLocs(prev => ({ ...map, ...prev }));
    }, [userGlobalRole, locations]);

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

    const toggleDepartmentLoc = (id: string) => {
        setDepartmentExpandedLocs(prev => ({ ...prev, [id]: !(prev[id] ?? false) }));
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setIsToastVisible(false);
        }, 2400);
    };

    // --- MODAL STATES ---
    const [isLocationModalOpen, setLocModalOpen] = useState(false);
    const [editingLoc, setEditingLoc] = useState<Partial<Location>>({});

    const [isDepModalOpen, setDepModalOpen] = useState(false);
    const [editingDep, setEditingDep] = useState<Partial<Department>>({});
    const [departmentDeleteTarget, setDepartmentDeleteTarget] = useState<Department | null>(null);

    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<AppUser>>({});

    // --- HANDLERS ---

    // Locations
    const handleSaveLocation = () => {
        if (!editingLoc.name) return alert(t('admin.validation.nameRequired'));
        const isEditing = !!editingLoc.id;
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
        showToast(isEditing ? '✓ Location updated' : '✓ Location added');
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

        const normalizedCode = depFormCode.trim();
        const normalizedUsers = Math.max(0, parseInt(depFormUsers || '0', 10) || 0);
        if (normalizedCode) {
            setDepCodeMeta(prev => ({ ...prev, [dep.id]: normalizedCode }));
        }
        setDepUsersMeta(prev => ({ ...prev, [dep.id]: normalizedUsers }));

        if (editingDepartmentId) {
            showToast('Department updated');
        } else {
            setDepartmentExpandedLocs(prev => ({ ...prev, [dep.locationId]: true }));
            showToast('Department added');
        }

        setDepModalOpen(false);
        setLockLocationId(null);
        setEditingDepartmentId(null);
        setDepFormCode('');
        setDepFormUsers('0');
    };
    const handleDeleteDepartment = (dep: Department, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDepartmentDeleteTarget(dep);
    };

    const confirmDeleteDepartment = () => {
        if (!departmentDeleteTarget) return;
        try {
            adminService.deleteDepartment(departmentDeleteTarget.id);
            setDepCodeMeta(prev => {
                const next = { ...prev };
                delete next[departmentDeleteTarget.id];
                return next;
            });
            setDepUsersMeta(prev => {
                const next = { ...prev };
                delete next[departmentDeleteTarget.id];
                return next;
            });
            setDepartmentDeleteTarget(null);
            showToast('Department removed');
        } catch (err: any) {
            alert(err.message);
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
                showToast('User removed');
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
        setEditingDepartmentId(null);
        setDepFormCode('');
        setDepFormUsers('0');
        setDepModalOpen(true);
    };

    const onEditDepartment = (dep: Department) => {
        setEditingDepartmentId(dep.id);
        setEditingDep(dep);
        setDepFormCode(getDepartmentCode(dep));
        setDepFormUsers(String(getDepartmentUsersCount(dep)));
        setDepModalOpen(true);
    };

    const clearDepartmentSearch = () => {
        setDepartmentSearch('');
    };

    const toggleAllDepartments = () => {
        const nextAllExpanded = !allExpanded;
        setAllExpanded(nextAllExpanded);
        if (nextAllExpanded) {
            setDepartmentExpandedLocs(prev => {
                const next = { ...prev };
                locations.forEach(loc => {
                    next[loc.id] = true;
                });
                return next;
            });
            return;
        }
        setDepartmentExpandedLocs({});
    };

    // Helper to add user from drawer or tab
    const onAddUser = (locId?: string) => {
        const id = locId || selectedLocation?.id;
        if (!id) return;
        setLockLocationId(id);
        setEditingUser({ locationId: id, role: 'Viewer' });
        setUserModalOpen(true);
    };

    const roleBadgeStyle = (role: AppUser['role']): React.CSSProperties => {
        if (role === 'Admin') return { background: '#fff3e0', color: '#e67e22' };
        if (role === 'Owner') return { background: '#e8f0fe', color: '#3b6fd4' };
        if (role === 'Assigned') return { background: '#e8f7f0', color: '#2e9e68' };
        return { background: '#f3f0ff', color: '#7c5cbf' };
    };

    const openAddUserModal = (locationId?: string) => {
        const preLocId = locationId || '';
        const localDepartments = departments.filter(dep => dep.locationId === preLocId);
        setEditingUserId(null);
        setUserForm({
            fullName: '',
            email: '',
            locationId: preLocId,
            departmentId: localDepartments[0]?.id || '',
            role: 'Assigned'
        });
        setAddEditUserModalOpen(true);
    };

    const openEditUserModal = (user: AppUser) => {
        setEditingUserId(user.id);
        const localDepartments = departments.filter(dep => dep.locationId === user.locationId);
        const departmentId =
            user.departmentId ||
            localDepartments.find(dep => dep.name === user.departmentName)?.id ||
            localDepartments[0]?.id ||
            '';
        setUserForm({
            fullName: user.fullName,
            email: user.email,
            locationId: user.locationId,
            departmentId,
            role: user.role
        });
        setAddEditUserModalOpen(true);
    };

    const saveAddEditUser = () => {
        const fullName = userForm.fullName.trim();
        const email = userForm.email.trim();
        if (!fullName || !email || !userForm.locationId) return;
        const selectedDep = departments.find(dep => dep.id === userForm.departmentId);
        const payload: AppUser = {
            id: editingUserId || `USR-${Date.now()}`,
            fullName,
            email,
            locationId: userForm.locationId,
            departmentId: userForm.departmentId || undefined,
            departmentName: selectedDep ? selectedDep.name : undefined,
            role: userForm.role
        };
        adminService.saveUser(payload);
        setUsersExpandedLocs(prev => ({ ...prev, [payload.locationId]: true }));
        setAddEditUserModalOpen(false);
        showToast(editingUserId ? '✓ User updated' : '✓ User added');
    };

    const openTransferModal = (user: AppUser) => {
        setTransferUserId(user.id);
        const localDepartments = departments.filter(dep => dep.locationId === user.locationId);
        const departmentId =
            user.departmentId ||
            localDepartments.find(dep => dep.name === user.departmentName)?.id ||
            localDepartments[0]?.id ||
            '';
        setTransferForm({
            locationId: user.locationId,
            departmentId,
            role: user.role
        });
        setTransferUserModalOpen(true);
    };

    const saveTransferUser = () => {
        if (!transferUserId || !transferForm.locationId) return;
        const user = users.find(u => u.id === transferUserId);
        if (!user) return;
        const selectedDep = departments.find(dep => dep.id === transferForm.departmentId);
        const payload: AppUser = {
            ...user,
            locationId: transferForm.locationId,
            departmentId: transferForm.departmentId || undefined,
            departmentName: selectedDep ? selectedDep.name : undefined,
            role: transferForm.role
        };
        adminService.saveUser(payload);
        setUsersExpandedLocs(prev => ({ ...prev, [payload.locationId]: true }));
        setTransferUserModalOpen(false);
        showToast('✓ User transferred');
    };

    const openProfileModal = (user: AppUser) => {
        setProfileUserId(user.id);
        setProfileUserModalOpen(true);
    };

    const clearUserSearch = () => {
        setUserSearch('');
    };

    const toggleUsersExpandAll = () => {
        const next = !usersAllExpanded;
        setUsersAllExpanded(next);
        if (next) {
            const map: Record<string, boolean> = {};
            locations.forEach(loc => {
                map[loc.id] = true;
            });
            setUsersExpandedLocs(map);
            return;
        }
        setUsersExpandedLocs({});
    };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '4rem', position: 'relative' }}>
            <style>{`@keyframes urSlideUp { from { transform: translateY(18px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
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
                    <div
                        style={{
                            background: '#ffffff',
                            border: 'none',
                            borderRadius: 0,
                            boxShadow: 'none',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', padding: '12px 14px', borderBottom: '1px solid #ddecea', background: '#ffffff' }}>
                            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '17px', fontWeight: 700, color: '#0f2530', lineHeight: 1, height: '40px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{t('admin.locations')}</span>

                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '11px', color: '#6b8583', pointerEvents: 'none' }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    value={locationSearch}
                                    onChange={e => setLocationSearch(e.target.value)}
                                    placeholder="Search locations..."
                                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13.5px', padding: '8px 30px 8px 34px', border: '1.5px solid #c8d8d6', borderRadius: '10px', outline: 'none', background: '#f2f9f8', color: '#1a2e2d', width: '240px', transition: 'all .2s' }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#5ba8a0';
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,168,160,0.12)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#c8d8d6';
                                        e.currentTarget.style.background = '#f2f9f8';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                {locationSearch.length > 0 && (
                                    <button onClick={() => setLocationSearch('')} style={{ position: 'absolute', right: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b8583', fontSize: '17px', lineHeight: 1 }}>×</button>
                                )}
                            </div>

                            <select
                                value={locationCountryFilter}
                                onChange={(e) => setLocationCountryFilter(e.target.value)}
                                style={{ width: '140px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, padding: '8px 12px', border: '1.5px solid #c8d8d6', borderRadius: '10px', background: '#f2f9f8', color: '#315a69', outline: 'none', cursor: 'pointer' }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#5ba8a0';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#c8d8d6';
                                }}
                            >
                                <option value="">All Countries</option>
                                {locationCountries.map(country => (
                                    <option key={country} value={country}>{country}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => { setEditingLoc({ country: 'Switzerland' }); setLocModalOpen(true); }}
                                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13.5px', fontWeight: 600, padding: '9px 15px', background: '#5ba8a0', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#3d8880'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#5ba8a0'; }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Location
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', padding: '9px 18px', background: '#ffffff', borderBottom: '1px solid #ddecea', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /></svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{locationStats.totalLocations}</span> locations
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{locationStats.totalCountries}</span> countries
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 90px 90px', padding: '9px 20px', background: '#f7fbfb', borderBottom: '1px solid #ddecea' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583' }}>Name</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583' }}>City</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583' }}>Country</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583' }}>Code</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583', textAlign: 'right' }}>Actions</div>
                        </div>

                        {filteredLocations.length === 0 ? (
                            <div style={{ padding: '52px', textAlign: 'center', color: '#6b8583', fontSize: '14px' }}>
                                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>🔍</div>
                                <div>No locations match your search.</div>
                            </div>
                        ) : (
                            filteredLocations.map((loc, index) => {
                                const q = locationSearch.trim();
                                const isLast = index === filteredLocations.length - 1;
                                return (
                                    <div
                                        key={loc.id}
                                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 90px 90px', padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid #f0f8f7', alignItems: 'center', background: '#fafefe' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafefe'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fafefe'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 500, background: '#e8f4f3', color: '#5ba8a0', padding: '3px 8px', borderRadius: '5px', flexShrink: 0, letterSpacing: '.05em' }}>
                                                {loc.code || '-'}
                                            </span>
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a2e2d' }} dangerouslySetInnerHTML={{ __html: highlight(getTranslatedLocationName(loc.name || ''), q) }} />
                                                <div style={{ fontSize: '13px', color: '#6b8583' }}>
                                                    <span dangerouslySetInnerHTML={{ __html: highlight(loc.city || '-', q) }} /> · {loc.country || '-'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#3d5c5a' }} dangerouslySetInnerHTML={{ __html: highlight(loc.city || '-', q) }} />
                                        <div style={{ fontSize: '14px', color: '#3d5c5a' }}>{loc.country || '-'}</div>
                                        <div>
                                            <span style={{ display: 'inline-block', background: '#e8f4f3', color: '#5ba8a0', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 500, padding: '3px 8px', borderRadius: '5px' }} dangerouslySetInnerHTML={{ __html: highlight(loc.code || '-', q) }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button
                                                title="Edit"
                                                onClick={() => { setEditingLoc(loc); setLocModalOpen(true); }}
                                                style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid #ddecea', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#5ba8a0' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#e8f4f3';
                                                    e.currentTarget.style.borderColor = '#7bbfb8';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#ffffff';
                                                    e.currentTarget.style.borderColor = '#ddecea';
                                                }}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                title="Delete"
                                                onClick={(e) => handleDeleteLocation(loc.id, e)}
                                                style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid #f5d5d5', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#e05a5a' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#fdeaea';
                                                    e.currentTarget.style.borderColor = '#e05a5a';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#ffffff';
                                                    e.currentTarget.style.borderColor = '#f5d5d5';
                                                }}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                    <path d="M10 11v6M14 11v6" />
                                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* --- DEPARTMENTS TAB --- */}
                {activeTab === 'departments' && (
                    <div style={{ padding: '0 0 1rem 0' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 0,
                                padding: '16px 20px',
                                borderBottom: 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'nowrap' }}>
                                <span style={{ fontSize: '17px', fontWeight: 600 }}>{t('admin.tabDepartments')}</span>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                    <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ position: 'absolute', left: '11px', color: '#6b8583', pointerEvents: 'none' }}
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={departmentSearch}
                                        onChange={e => setDepartmentSearch(e.target.value)}
                                        placeholder="Search departments or locations..."
                                        style={{
                                            fontFamily: 'DM Sans, sans-serif',
                                            fontSize: '13.5px',
                                            padding: '8px 32px 8px 34px',
                                            border: '1.5px solid #ddecea',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            background: '#f2f9f8',
                                            color: '#1a2e2d',
                                            width: '240px',
                                            transition: 'all .2s'
                                        }}
                                    />
                                    {departmentSearch.length > 0 && (
                                        <button
                                            onClick={clearDepartmentSearch}
                                            style={{
                                                position: 'absolute',
                                                right: '9px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#6b8583',
                                                fontSize: '17px',
                                                lineHeight: 1,
                                                padding: '1px 3px'
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={departmentCityFilter}
                                    onChange={e => setDepartmentCityFilter(e.target.value)}
                                    style={{
                                        width: '124px',
                                        fontFamily: 'DM Sans, sans-serif',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        padding: '8px 12px',
                                        border: '1.5px solid #c8d8d6',
                                        borderRadius: '8px',
                                        background: '#f2f9f8',
                                        color: '#3d5c5a',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    <option value="">All Cities</option>
                                    {departmentCities.map(city => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={toggleAllDepartments}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    padding: '8px 14px',
                                    border: '1.5px solid #ddecea',
                                    borderRadius: '8px',
                                    background: '#ffffff',
                                    color: '#6b8583',
                                    cursor: 'pointer'
                                }}
                            >
                                {allExpanded ? 'Collapse All' : 'Expand All'}
                            </button>
                            <button
                                onClick={() => {
                                    setEditingDepartmentId(null);
                                    setEditingDep({});
                                    setLockLocationId(null);
                                    setDepFormCode('');
                                    setDepFormUsers('0');
                                    setDepModalOpen(true);
                                }}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '13.5px',
                                    fontWeight: 600,
                                    padding: '9px 16px',
                                    background: '#5ba8a0',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Department
                            </button>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                background: 'transparent',
                                border: 'none',
                                borderTop: 'none',
                                borderBottom: 'none',
                                padding: '10px 20px',
                                gap: '24px',
                                flexWrap: 'wrap'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{departmentStats.locationsShown}</span> locations shown
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{departmentStats.departmentsTotal}</span> departments total
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M20 21a8 8 0 1 0-16 0" />
                                </svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{departmentStats.usersAssigned}</span> users assigned
                            </div>
                        </div>

                        <div
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 0,
                                overflow: 'hidden',
                                boxShadow: 'none'
                            }}
                        >
                            {visibleDepartmentGroups.length === 0 && (
                                <div style={{ padding: '48px', textAlign: 'center', color: '#6b8583', fontSize: '14px' }}>
                                    <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>??</div>
                                    <div>No departments or locations match your search.</div>
                                </div>
                            )}

                            {visibleDepartmentGroups.map(({ loc, depts, totalUsers }, idx) => {
                                const isExpanded = departmentExpandedLocs[loc.id] ?? false;
                                const q = departmentSearch.trim();
                                return (
                                    <div key={loc.id} style={{ borderBottom: idx === visibleDepartmentGroups.length - 1 ? 'none' : '1px solid #ddecea' }}>
                                        <div
                                            onClick={() => toggleDepartmentLoc(loc.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '14px 20px',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                background: '#fafefe',
                                                position: 'relative'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#6b8583',
                                                    transition: 'transform .25s',
                                                    flexShrink: 0,
                                                    transform: isExpanded ? 'rotate(90deg)' : 'none'
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </div>
                                            <span
                                                style={{
                                                    fontFamily: 'DM Mono, monospace',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    background: '#e8f4f3',
                                                    color: '#5ba8a0',
                                                    padding: '3px 8px',
                                                    borderRadius: '5px',
                                                    flexShrink: 0,
                                                    letterSpacing: '.05em'
                                                }}
                                            >
                                                {loc.code || '-'}
                                            </span>
                                            <div>
                                                <div
                                                    style={{ fontSize: '15px', fontWeight: 600, flex: 1 }}
                                                    dangerouslySetInnerHTML={{ __html: highlight(getTranslatedLocationName(loc.name), q) }}
                                                />
                                                <div style={{ fontSize: '13px', color: '#6b8583' }}>
                                                    <span dangerouslySetInnerHTML={{ __html: highlight(loc.city || '', q) }} /> · {loc.country}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                                                <span
                                                    style={{
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        padding: '3px 10px',
                                                        background: '#e8f4f3',
                                                        color: '#5ba8a0',
                                                        borderRadius: '20px',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {depts.length} dept{depts.length !== 1 ? 's' : ''}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#6b8583', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <circle cx="12" cy="8" r="4" />
                                                        <path d="M20 21a8 8 0 1 0-16 0" />
                                                    </svg>
                                                    {totalUsers} users
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddDepartment(loc.id);
                                                    }}
                                                    style={{
                                                        fontFamily: 'DM Sans, sans-serif',
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                        padding: '5px 11px',
                                                        background: '#ffffff',
                                                        border: '1.5px solid #7bbfb8',
                                                        color: '#5ba8a0',
                                                        borderRadius: '7px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                    Add Dept
                                                </button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ borderTop: '1px solid #ddecea' }}>
                                                <div
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 260px 70px 80px',
                                                        padding: '8px 24px 8px 52px',
                                                        background: '#f7fbfb',
                                                        borderBottom: '1px solid #ddecea'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b8583' }}>{t('admin.departments')}</div>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b8583' }}>{t('common.code')}</div>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b8583' }}>Users</div>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b8583', textAlign: 'right' }}>Actions</div>
                                                </div>

                                                {depts.length === 0 ? (
                                                    <div style={{ padding: '20px 52px', fontSize: '13px', color: '#6b8583', fontStyle: 'italic' }}>No departments yet — add one above.</div>
                                                ) : (
                                                    depts.map(dep => (
                                                        <div
                                                            key={dep.id}
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 260px 70px 80px',
                                                                padding: '12px 24px 12px 52px',
                                                                borderBottom: '1px solid #f0f8f7',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <div
                                                                style={{ fontSize: '14px', fontWeight: 500, color: '#1a2e2d' }}
                                                                dangerouslySetInnerHTML={{ __html: highlight(getTranslatedDepartmentName(dep.name), q) }}
                                                            />
                                                            <div
                                                                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6b8583', whiteSpace: 'pre-line', lineHeight: 1.35 }}
                                                                dangerouslySetInnerHTML={{ __html: highlight(getDepartmentCode(dep), q) }}
                                                            />
                                                            <div>
                                                                <span
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 500,
                                                                        color: '#3d5c5a',
                                                                        background: '#f0f8f7',
                                                                        borderRadius: '20px',
                                                                        padding: '3px 10px'
                                                                    }}
                                                                >
                                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <circle cx="12" cy="8" r="4" />
                                                                        <path d="M20 21a8 8 0 1 0-16 0" />
                                                                    </svg>
                                                                    {getDepartmentUsersCount(dep)}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    title="Edit"
                                                                    onClick={() => onEditDepartment(dep)}
                                                                    style={{
                                                                        width: '29px',
                                                                        height: '29px',
                                                                        borderRadius: '6px',
                                                                        border: '1.5px solid #ddecea',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        background: '#ffffff',
                                                                        color: '#5ba8a0'
                                                                    }}
                                                                >
                                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    title="Remove from location"
                                                                    onClick={(e) => handleDeleteDepartment(dep, e)}
                                                                    style={{
                                                                        width: '29px',
                                                                        height: '29px',
                                                                        borderRadius: '6px',
                                                                        border: '1.5px solid #f5d5d5',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        background: '#ffffff',
                                                                        color: '#e05a5a'
                                                                    }}
                                                                >
                                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <polyline points="3 6 5 6 21 6" />
                                                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                                        <path d="M10 11v6M14 11v6" />
                                                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (
                    <div style={{ padding: '0 0 1rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', background: 'transparent', border: 'none', borderRadius: 0, padding: '12px 14px', borderBottom: 'none' }}>
                            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '17px', fontWeight: 600, color: '#0f2530', lineHeight: 1, height: '40px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>Users & Roles</span>

                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <svg style={{ position: 'absolute', left: '11px', color: '#6b8583', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search name or email..."
                                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13.5px', padding: '8px 30px 8px 34px', border: '1.5px solid #c8d8d6', borderRadius: '10px', outline: 'none', background: '#f2f9f8', color: '#1a2e2d', width: '275px' }}
                                />
                                {userSearch.length > 0 && (
                                    <button onClick={clearUserSearch} style={{ position: 'absolute', right: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b8583', fontSize: '17px', lineHeight: 1 }}>×</button>
                                )}
                            </div>

                            <select value={userCityFilter} onChange={(e) => setUserCityFilter(e.target.value)} style={{ width: '139px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, padding: '8px 12px', border: '1.5px solid #c8d8d6', borderRadius: '10px', background: '#f2f9f8', color: '#315a69', outline: 'none' }}>
                                <option value="">All Cities</option>
                                {userCities.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>

                            <select value={userDepartmentFilter} onChange={(e) => setUserDepartmentFilter(e.target.value)} style={{ width: '153px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, padding: '8px 12px', border: '1.5px solid #c8d8d6', borderRadius: '10px', background: '#f2f9f8', color: '#315a69', outline: 'none' }}>
                                <option value="">All Departments</option>
                                {allDepartmentNames.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                            </select>

                            <select
                                value={userGlobalRole}
                                onChange={(e) => setUserGlobalRole(e.target.value as AppUser['role'] | 'All')}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    padding: '8px 12px',
                                    width: '139px',
                                    border: '1.5px solid #c8d8d6',
                                    borderRadius: '10px',
                                    background: '#f2f9f8',
                                    color: '#315a69',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="All">All</option>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Viewer">Viewer</option>
                            </select>

                            <div style={{ flex: 1 }} />

                            <button onClick={toggleUsersExpandAll} style={{ padding: '8px 16px', border: '1.5px solid #c8d8d6', borderRadius: '10px', background: '#eef1f1', color: '#315a69', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                                {usersAllExpanded ? 'Collapse All' : 'Expand All'}
                            </button>

                            <button onClick={() => openAddUserModal()} style={{ padding: '9px 15px', background: '#5ba8a0', color: '#ffffff', borderRadius: '10px', fontSize: '13.5px', fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add User
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', background: 'transparent', border: 'none', borderTop: 'none', borderBottom: 'none', padding: '9px 18px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /></svg><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{usersViewData.stats.totalLocations}</span> locations</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{usersViewData.stats.totalUsersShown}</span> users</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fff3e0', color: '#e67e22' }}>Admin</span><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{usersViewData.stats.totalRoleCounts.Admin}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#e8f0fe', color: '#3b6fd4' }}>Owner</span><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{usersViewData.stats.totalRoleCounts.Owner}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#e8f7f0', color: '#2e9e68' }}>Assigned</span><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{usersViewData.stats.totalRoleCounts.Assigned}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f0ff', color: '#7c5cbf' }}>Viewer</span><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{usersViewData.stats.totalRoleCounts.Viewer}</span></div>
                        </div>

                        <div style={{ background: 'transparent', border: 'none', borderRadius: 0, overflow: 'hidden', boxShadow: 'none' }}>
                            {usersViewData.groups.length === 0 && (
                                <div style={{ padding: '52px', textAlign: 'center', color: '#6b8583', fontSize: '14px' }}><div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>🔍</div>No users match your search or filters.</div>
                            )}

                            {usersViewData.groups.map(({ loc, allLocUsers, visibleUsers, roleCounts }) => {
                                const isOpen = !!usersExpandedLocs[loc.id];
                                const localRole = userLocalRoleFilters[loc.id] || 'All';
                                return (
                                    <div key={loc.id} style={{ borderBottom: '1px solid #ddecea' }}>
                                        <div onClick={() => setUsersExpandedLocs(prev => ({ ...prev, [loc.id]: !prev[loc.id] }))} onMouseEnter={(e) => { e.currentTarget.style.background = '#f2f9f8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#fafefe'; }} style={{ background: '#fafefe', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                            <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b8583', transition: 'transform .25s', flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                            </div>
                                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 500, background: '#e8f4f3', color: '#5ba8a0', padding: '3px 8px', borderRadius: '5px', flexShrink: 0, letterSpacing: '.05em' }}>
                                                {loc.code || '-'}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a2e2d' }}>
                                                    {getTranslatedLocationName(loc.name)}
                                                    <span style={{ fontSize: '13px', color: '#6b8583', marginLeft: '8px', fontWeight: 400 }}>{allLocUsers.length} user{allLocUsers.length !== 1 ? 's' : ''}</span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#6b8583' }}>{loc.city || '-'} · {loc.country || '-'}</div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); openAddUserModal(loc.id); }} style={{ background: 'transparent', border: 'none', color: '#1a2e2d', fontWeight: 500, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>+ Add User</button>
                                        </div>

                                        {isOpen && (
                                            <>
                                                <div style={{ padding: '11px 20px 10px', borderBottom: '1px solid #ddecea', background: '#fafefe', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {(['All', 'Admin', 'Owner', 'Assigned', 'Viewer'] as const).map(role => {
                                                        const count = role === 'All' ? allLocUsers.length : roleCounts[role];
                                                        const active = localRole === role;
                                                        let bg = '#ffffff'; let border = '#ddecea'; let color = '#6b8583';
                                                        if (active && role === 'All') { bg = '#e8f4f3'; border = '#7bbfb8'; color = '#5ba8a0'; }
                                                        if (active && role === 'Admin') { bg = '#fff3e0'; border = '#e67e22'; color = '#e67e22'; }
                                                        if (active && role === 'Owner') { bg = '#e8f0fe'; border = '#3b6fd4'; color = '#3b6fd4'; }
                                                        if (active && role === 'Assigned') { bg = '#e8f7f0'; border = '#2e9e68'; color = '#2e9e68'; }
                                                        if (active && role === 'Viewer') { bg = '#f3f0ff'; border = '#7c5cbf'; color = '#7c5cbf'; }
                                                        return <button key={role} onClick={() => setUserLocalRoleFilters(prev => ({ ...prev, [loc.id]: role }))} style={{ fontSize: '12px', fontWeight: 500, padding: '4px 11px', borderRadius: '20px', border: `1.5px solid ${border}`, background: bg, color, cursor: 'pointer' }}>{role} ({count})</button>;
                                                    })}
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 110px 1fr 110px', padding: '9px 20px', background: '#f7fbfb', borderBottom: '1px solid #ddecea' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583' }}>User</div>
                                                    <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583' }}>Role</div>
                                                    <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583' }}>{t('admin.departments')}</div>
                                                    <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583', textAlign: 'right' }}>Actions</div>
                                                </div>
                                                {visibleUsers.length === 0 ? (
                                                    <div style={{ padding: '20px', fontSize: '13px', color: '#6b8583', fontStyle: 'italic' }}>No users match current filter.</div>
                                                ) : (
                                                    visibleUsers.map(user => {
                                                        const deptText = getUserDepartmentName(user);
                                                        return (
                                                            <div key={user.id} onMouseEnter={(e) => { e.currentTarget.style.background = '#fafefe'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }} style={{ display: 'grid', gridTemplateColumns: '2fr 110px 1fr 110px', padding: '13px 20px', borderBottom: '1px solid #f0f8f7', alignItems: 'center' }}>
                                                                <div><div style={{ fontSize: '14px', fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: highlight(user.fullName, userSearch.trim()) }} /><div style={{ fontSize: '12px', color: '#6b8583', fontFamily: 'DM Mono, monospace' }} dangerouslySetInnerHTML={{ __html: highlight(user.email, userSearch.trim()) }} /></div>
                                                                <div><span style={{ fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', ...roleBadgeStyle(user.role) }}>{user.role}</span></div>
                                                                <div style={{ fontSize: '13px', color: '#3d5c5a' }}>{deptText}</div>
                                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                                    <button title="View Profile" onClick={() => openProfileModal(user)} onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f8f7'; e.currentTarget.style.borderColor = '#7bbfb8'; e.currentTarget.style.color = '#5ba8a0'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#ddecea'; e.currentTarget.style.color = '#6b8583'; }} style={{ width: '29px', height: '29px', borderRadius: '6px', border: '1.5px solid #ddecea', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#6b8583' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                                                                    <button title="Edit" onClick={() => openEditUserModal(user)} onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f4f3'; e.currentTarget.style.borderColor = '#7bbfb8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#ddecea'; }} style={{ width: '29px', height: '29px', borderRadius: '6px', border: '1.5px solid #ddecea', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#5ba8a0' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                                                                    <button title="Transfer" onClick={() => openTransferModal(user)} onMouseEnter={(e) => { e.currentTarget.style.background = '#fff3e0'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }} style={{ width: '29px', height: '29px', borderRadius: '6px', border: '1.5px solid #fde8c8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#e67e22' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg></button>
                                                                    <button title="Remove" onClick={(e) => handleDeleteUser(user.id, e)} onMouseEnter={(e) => { e.currentTarget.style.background = '#fdeaea'; e.currentTarget.style.borderColor = '#e05a5a'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#f5d5d5'; }} style={{ width: '29px', height: '29px', borderRadius: '6px', border: '1.5px solid #f5d5d5', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#e05a5a' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg></button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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
                                        <MapPin size={14} /> {getTranslatedLocationName(selectedLocation.name)} {selectedLocation.city && `Â· ${selectedLocation.city}`}
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
                                        <button onClick={() => onAddDepartment()} className="btn" style={{ fontSize: '12px', padding: '6px 12px', background: '#b3d8d8', color: '#424b55' }}>
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
                                                                    <button onClick={(e) => handleDeleteDepartment(dep, e)} className="btn btn-outline" style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fee2e2' }}><Trash2 size={13} /></button>
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
                                        <button onClick={() => onAddUser()} className="btn" style={{ fontSize: '12px', padding: '6px 12px', background: '#b3d8d8', color: '#424b55' }}>
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
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(20,45,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setLocModalOpen(false);
                    }}
                >
                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', width: '440px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'urSlideUp .2s ease' }}>
                        <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>{editingLoc.id ? 'Edit Location' : 'Add Location'}</div>
                        <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>{editingLoc.id ? 'Update location details' : 'Fill in the location details'}</div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Location Name</label>
                            <input
                                value={editingLoc.name || ''}
                                onChange={e => setEditingLoc({ ...editingLoc, name: e.target.value })}
                                placeholder="e.g. University Hospital Zurich (ZH)"
                                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', outline: 'none', color: '#1a2e2d', background: '#f2f9f8', transition: 'all .2s' }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#5ba8a0';
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,168,160,0.12)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#ddecea';
                                    e.currentTarget.style.background = '#f2f9f8';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>City</label>
                                <input
                                    value={editingLoc.city || ''}
                                    onChange={e => setEditingLoc({ ...editingLoc, city: e.target.value })}
                                    placeholder="e.g. Zurich"
                                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', outline: 'none', color: '#1a2e2d', background: '#f2f9f8', transition: 'all .2s' }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#5ba8a0';
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,168,160,0.12)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#ddecea';
                                        e.currentTarget.style.background = '#f2f9f8';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Code</label>
                                <input
                                    value={editingLoc.code || ''}
                                    onChange={e => setEditingLoc({ ...editingLoc, code: e.target.value })}
                                    placeholder="e.g. ZH"
                                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', outline: 'none', color: '#1a2e2d', background: '#f2f9f8', transition: 'all .2s' }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#5ba8a0';
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,168,160,0.12)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#ddecea';
                                        e.currentTarget.style.background = '#f2f9f8';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Country</label>
                            <input
                                value={editingLoc.country || ''}
                                onChange={e => setEditingLoc({ ...editingLoc, country: e.target.value })}
                                placeholder="e.g. Switzerland"
                                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', outline: 'none', color: '#1a2e2d', background: '#f2f9f8', transition: 'all .2s' }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#5ba8a0';
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,168,160,0.12)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#ddecea';
                                    e.currentTarget.style.background = '#f2f9f8';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                onClick={() => setLocModalOpen(false)}
                                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLocation}
                                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, padding: '9px 22px', background: '#5ba8a0', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#3d8880';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#5ba8a0';
                                }}
                            >
                                Save Location
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            {isDepModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(20,45,44,.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        backdropFilter: 'blur(3px)'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setDepModalOpen(false);
                            setLockLocationId(null);
                            setEditingDepartmentId(null);
                        }
                    }}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '28px 28px 24px',
                            width: '440px',
                            maxWidth: '95vw',
                            boxShadow: '0 20px 60px rgba(0,0,0,.15)'
                        }}
                    >
                        <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>
                            {editingDepartmentId ? 'Edit Department' : 'Add Department'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>
                            {editingDepartmentId ? 'Update department details' : 'Assign a new department to a location'}
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                                Location
                            </label>
                            <select
                                value={editingDep.locationId || ''}
                                onChange={e => setEditingDep({ ...editingDep, locationId: e.target.value })}
                                disabled={!!(selectedLocation || lockLocationId) && !editingDepartmentId}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '14px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1.5px solid #ddecea',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    color: '#1a2e2d',
                                    background: '#f2f9f8'
                                }}
                            >
                                <option value="">{t('admin.selectLocation')}</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.code ? `${loc.code} - ` : ''}{getTranslatedLocationName(loc.name)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                                Department Name
                            </label>
                            <input
                                value={editingDep.name || ''}
                                onChange={e => setEditingDep({ ...editingDep, name: e.target.value })}
                                placeholder="e.g. Cardiology"
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '14px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1.5px solid #ddecea',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    color: '#1a2e2d',
                                    background: '#f2f9f8'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                                Adresse
                            </label>
                            <input
                                value={depFormCode}
                                onChange={e => setDepFormCode(e.target.value)}
                                placeholder="z.B. Restelbergstrasse 108, 8044 Zürich"
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '14px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1.5px solid #ddecea',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    color: '#1a2e2d',
                                    background: '#f2f9f8'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                                Number of Users
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={depFormUsers}
                                onChange={e => setDepFormUsers(e.target.value)}
                                placeholder="0"
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '14px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1.5px solid #ddecea',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    color: '#1a2e2d',
                                    background: '#f2f9f8'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                onClick={() => {
                                    setDepModalOpen(false);
                                    setLockLocationId(null);
                                    setEditingDepartmentId(null);
                                }}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    padding: '9px 18px',
                                    border: '1.5px solid #ddecea',
                                    borderRadius: '8px',
                                    background: '#ffffff',
                                    color: '#6b8583',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveDepartment}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    padding: '9px 22px',
                                    background: '#5ba8a0',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Save Department
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {departmentDeleteTarget && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(20,45,44,.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 110,
                        backdropFilter: 'blur(3px)'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setDepartmentDeleteTarget(null);
                    }}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '24px',
                            width: '430px',
                            maxWidth: '95vw',
                            boxShadow: '0 20px 60px rgba(0,0,0,.15)'
                        }}
                    >
                        <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px', color: '#1a2e2d' }}>
                            Delete Department?
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '18px', lineHeight: 1.45 }}>
                            Do you want to delete <strong style={{ color: '#1a2e2d' }}>{getTranslatedDepartmentName(departmentDeleteTarget.name)}</strong>?
                            This action cannot be undone.
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDepartmentDeleteTarget(null)}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    padding: '9px 18px',
                                    border: '1.5px solid #ddecea',
                                    borderRadius: '8px',
                                    background: '#ffffff',
                                    color: '#6b8583',
                                    cursor: 'pointer'
                                }}
                            >
                                No
                            </button>
                            <button
                                onClick={confirmDeleteDepartment}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    padding: '9px 18px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: '#dc2626',
                                    color: '#ffffff',
                                    cursor: 'pointer'
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                style={{
                    position: 'fixed',
                    bottom: '28px',
                    right: '28px',
                    zIndex: 200,
                    background: '#1a2e2d',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    boxShadow: '0 8px 24px rgba(0,0,0,.2)',
                    opacity: isToastVisible ? 1 : 0,
                    transform: isToastVisible ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'all .25s',
                    pointerEvents: 'none'
                }}
            >
                {toastMessage}
            </div>
            {/* Add/Edit User Modal */}
            {isAddEditUserModalOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(20,45,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setAddEditUserModalOpen(false);
                    }}
                >
                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'urSlideUp .2s ease' }}>
                        <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>{editingUserId ? 'Edit User' : 'Add User'}</div>
                        <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>{editingUserId ? 'Update user details and role' : 'Assign a user to a location and role'}</div>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Full Name</label>
                            <input value={userForm.fullName} onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }} />
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Email</label>
                            <input type="email" value={userForm.email} onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Location</label>
                                <select
                                    value={userForm.locationId}
                                    onChange={(e) => {
                                        const nextLoc = e.target.value;
                                        const nextDeps = departments.filter(dep => dep.locationId === nextLoc);
                                        setUserForm(prev => ({ ...prev, locationId: nextLoc, departmentId: nextDeps[0]?.id || '' }));
                                    }}
                                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}
                                >
                                    <option value="">Select location</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} - ` : ''}{getTranslatedLocationName(l.name).replace(/ \([A-Z]+\)$/, '')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Department</label>
                                <select value={userForm.departmentId} onChange={(e) => setUserForm(prev => ({ ...prev, departmentId: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                                    {departments.filter(dep => dep.locationId === userForm.locationId).map(dep => <option key={dep.id} value={dep.id}>{getTranslatedDepartmentName(dep.name)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Role</label>
                            <select value={userForm.role} onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as AppUser['role'] }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button onClick={() => setAddEditUserModalOpen(false)} style={{ padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', fontSize: '14px', fontWeight: 500 }}>Cancel</button>
                            <button onClick={saveAddEditUser} style={{ padding: '9px 22px', border: 'none', borderRadius: '8px', background: '#5ba8a0', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>Save User</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {isTransferUserModalOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(20,45,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setTransferUserModalOpen(false);
                    }}
                >
                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'urSlideUp .2s ease' }}>
                        <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>Transfer User</div>
                        <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>{transferUserId ? `Transferring: ${users.find(u => u.id === transferUserId)?.fullName || ''}` : 'Move to a different location'}</div>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>New Location</label>
                            <select value={transferForm.locationId} onChange={(e) => { const nextLoc = e.target.value; const nextDeps = departments.filter(dep => dep.locationId === nextLoc); setTransferForm(prev => ({ ...prev, locationId: nextLoc, departmentId: nextDeps[0]?.id || '' })); }} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} - ` : ''}{getTranslatedLocationName(l.name).replace(/ \([A-Z]+\)$/, '')}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>New Department</label>
                            <select value={transferForm.departmentId} onChange={(e) => setTransferForm(prev => ({ ...prev, departmentId: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                                {departments.filter(dep => dep.locationId === transferForm.locationId).map(dep => <option key={dep.id} value={dep.id}>{getTranslatedDepartmentName(dep.name)}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Role</label>
                            <select value={transferForm.role} onChange={(e) => setTransferForm(prev => ({ ...prev, role: e.target.value as AppUser['role'] }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button onClick={() => setTransferUserModalOpen(false)} style={{ padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', fontSize: '14px', fontWeight: 500 }}>Cancel</button>
                            <button onClick={saveTransferUser} style={{ padding: '9px 22px', border: 'none', borderRadius: '8px', background: '#5ba8a0', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>Transfer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileUserModalOpen && (() => {
                const user = users.find(u => u.id === profileUserId);
                if (!user) return null;
                const loc = locations.find(l => l.id === user.locationId);
                const initials = user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(20,45,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)' }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setProfileUserModalOpen(false);
                        }}
                    >
                        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'urSlideUp .2s ease' }}>
                            <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '16px' }}>User Profile</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#5ba8a0', color: '#ffffff', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{user.fullName}</div>
                                    <div style={{ fontSize: '13px', color: '#6b8583', fontFamily: 'DM Mono, monospace' }}>{user.email}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: '#f2f9f8', borderRadius: '8px', padding: '12px 14px' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', fontWeight: 600, marginBottom: '4px' }}>Role</div><div style={{ fontSize: '14px', fontWeight: 500 }}><span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', ...roleBadgeStyle(user.role) }}>{user.role}</span></div></div>
                                <div style={{ background: '#f2f9f8', borderRadius: '8px', padding: '12px 14px' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', fontWeight: 600, marginBottom: '4px' }}>Location</div><div style={{ fontSize: '14px', fontWeight: 500 }}>{loc?.code || '-'}</div></div>
                                <div style={{ background: '#f2f9f8', borderRadius: '8px', padding: '12px 14px' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', fontWeight: 600, marginBottom: '4px' }}>Department</div><div style={{ fontSize: '14px', fontWeight: 500 }}>{getUserDepartmentName(user)}</div></div>
                                <div style={{ background: '#f2f9f8', borderRadius: '8px', padding: '12px 14px' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', fontWeight: 600, marginBottom: '4px' }}>Hospital</div><div style={{ fontSize: '13px', fontWeight: 500 }}>{loc ? getTranslatedLocationName(loc.name).replace(/ \([A-Z]+\)$/, '') : '-'}</div></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                                <button onClick={() => setProfileUserModalOpen(false)} style={{ padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', fontSize: '14px', fontWeight: 500 }}>Close</button>
                                <button onClick={() => { setProfileUserModalOpen(false); openEditUserModal(user); }} style={{ padding: '9px 22px', border: 'none', borderRadius: '8px', background: '#5ba8a0', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>Edit User</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

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
