import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAdminDataStore } from '../hooks/useAdminDataStore';
import { Location, Department, AppUser } from '../types/admin';
import {
    Plus, Edit2, Trash2, MapPin, Building2, Users,
    Search, AlertCircle, Save, X, RefreshCw,
    ChevronDown, ChevronRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LocationModal } from './administration/components/LocationModal';
import { DepartmentModal, DepartmentDeleteDialog } from './administration/components/DepartmentModals';
import { AddEditUserModal, TransferUserModal, UserProfileModal } from './administration/components/UserModals';

const Administration: React.FC = () => {
    const { t } = useLanguage();

    // Helper to translate known location names
    const getTranslatedLocationName = (name: string) => {
        const map: Record<string, string> = {
            'Zurich': 'admin.universityHospitalZurich',
            'Bern': 'admin.genevaUniversityHospitals',
            'University Hospital Zurich (ZH)': 'admin.universityHospitalZurich',
            'Geneva University Hospitals (GE)': 'admin.genevaUniversityHospitals',
            'Bern': 'admin.inselspitalBern',
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
    const {
        adminData,
        saveLocation,
        deleteLocation,
        saveDepartment,
        deleteDepartment,
        saveUser,
        deleteUser,
        restoreDefaults,
        getLocationDependencies,
        getDepartmentDependencies
    } = useAdminDataStore();
    const locations = adminData.locations;
    const departments = adminData.departments;
    const users = adminData.users;
    const [locationSearch, setLocationSearch] = useState('');
    const [locationCountryFilter, setLocationCountryFilter] = useState('');
    const [departmentExpandedLocs, setDepartmentExpandedLocs] = useState<Record<string, boolean>>({});
    const [departmentSearch, setDepartmentSearch] = useState('');
    const [departmentCityFilter, setDepartmentCityFilter] = useState('');
    const [allExpanded, setAllExpanded] = useState(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
    const [depFormCode, setDepFormCode] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);
    const toastTimerRef = useRef<number | null>(null);
    const [userSearch, setUserSearch] = useState('');
    const [userCityFilter, setUserCityFilter] = useState('');
    const [userDepartmentFilter, setUserDepartmentFilter] = useState('');
    const [userGlobalRole, setUserGlobalRole] = useState<'All' | 'Admin' | 'Owner' | 'Assigned' | 'Viewer'>('All');
    const [usersExpandedLocs, setUsersExpandedLocs] = useState<Record<string, boolean>>({});
    const [usersExpandedDeps, setUsersExpandedDeps] = useState<Record<string, boolean>>({});
    const [selectedUsersDepartment, setSelectedUsersDepartment] = useState<{ locationId: string; departmentId: string } | null>(null);
    const [userLocalRoleFilters, setUserLocalRoleFilters] = useState<Record<string, 'All' | 'Admin' | 'Owner' | 'Assigned' | 'Viewer'>>({});
    const [usersAllExpanded, setUsersAllExpanded] = useState(false);
    const [isAddEditUserModalOpen, setAddEditUserModalOpen] = useState(false);
    const [isTransferUserModalOpen, setTransferUserModalOpen] = useState(false);
    const [isProfileUserModalOpen, setProfileUserModalOpen] = useState(false);
    const [locationFormError, setLocationFormError] = useState('');
    const [departmentFormError, setDepartmentFormError] = useState('');
    const [userFormError, setUserFormError] = useState('');
    const [transferFormError, setTransferFormError] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [transferUserId, setTransferUserId] = useState<string | null>(null);
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const [userForm, setUserForm] = useState({
        name: '',
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
        if (dep.address?.trim()) return dep.address;
        if (dep.name === 'Quality & Patient Safety') return 'M\u00fcllackerstrasse 2/4\n8152 Glattbrugg';
        if (dep.name === 'Tertianum Restelberg') return 'Restelbergstrasse 108\n8044 Z\u00fcrich';
        if (dep.name === 'Surgery Department') return 'K\u00f6nizstrasse 74\n3008 Bern';
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
    }, [locations, departments, departmentCityFilter, departmentSearch, users]);

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
                    const nameMatch = (u.name || '').toLowerCase().includes(q);
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
        const depMap: Record<string, boolean> = {};
        locations.forEach(loc => {
            map[loc.id] = true;
            departments
                .filter(dep => dep.locationId === loc.id)
                .forEach(dep => {
                    depMap[`${loc.id}::${dep.id}`] = true;
                });
        });
        setUsersExpandedLocs(prev => ({ ...map, ...prev }));
        setUsersExpandedDeps(prev => ({ ...depMap, ...prev }));
    }, [userSearch, locations, departments]);

    useEffect(() => {
        if (userGlobalRole === 'All') return;
        const map: Record<string, boolean> = {};
        const depMap: Record<string, boolean> = {};
        locations.forEach(loc => {
            map[loc.id] = true;
            departments
                .filter(dep => dep.locationId === loc.id)
                .forEach(dep => {
                    depMap[`${loc.id}::${dep.id}`] = true;
                });
        });
        setUsersExpandedLocs(prev => ({ ...map, ...prev }));
        setUsersExpandedDeps(prev => ({ ...depMap, ...prev }));
    }, [userGlobalRole, locations, departments]);

    useEffect(() => {
        if (!selectedUsersDepartment) return;
        const hasLocation = locations.some(loc => loc.id === selectedUsersDepartment.locationId);
        const hasDepartment = departments.some(
            dep => dep.id === selectedUsersDepartment.departmentId && dep.locationId === selectedUsersDepartment.locationId
        );
        if (!hasLocation || !hasDepartment) {
            setSelectedUsersDepartment(null);
        }
    }, [selectedUsersDepartment, locations, departments]);

    useEffect(() => {
        if (!userForm.locationId || !userForm.departmentId) return;
        const valid = departments.some(dep => dep.id === userForm.departmentId && dep.locationId === userForm.locationId);
        if (!valid) {
            setUserForm(prev => ({ ...prev, departmentId: '' }));
        }
    }, [departments, userForm.locationId, userForm.departmentId]);

    useEffect(() => {
        if (!transferForm.locationId || !transferForm.departmentId) return;
        const valid = departments.some(dep => dep.id === transferForm.departmentId && dep.locationId === transferForm.locationId);
        if (!valid) {
            setTransferForm(prev => ({ ...prev, departmentId: '' }));
        }
    }, [departments, transferForm.locationId, transferForm.departmentId]);

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

    const handleResetDefaultData = () => {
        restoreDefaults();
        setSelectedLocation(null);
        setSelectedUsersDepartment(null);
        showToast('Default data restored');
    };

    // --- MODAL STATES ---
    const [isLocationModalOpen, setLocModalOpen] = useState(false);
    const [editingLoc, setEditingLoc] = useState<Partial<Location>>({});

    const [isDepModalOpen, setDepModalOpen] = useState(false);
    const [editingDep, setEditingDep] = useState<Partial<Department>>({});
    const [departmentDeleteTarget, setDepartmentDeleteTarget] = useState<Department | null>(null);

    // --- HANDLERS ---

    // Locations
    const handleSaveLocation = () => {
        if (!editingLoc.name?.trim()) {
            setLocationFormError(t('admin.validation.nameRequired') || 'Location name is required.');
            return;
        }
        setLocationFormError('');
        const isEditing = !!editingLoc.id;
        const loc: Location = {
            id: editingLoc.id || `LOC-${Date.now()}`,
            name: editingLoc.name.trim(),
            city: editingLoc.city || '',
            country: editingLoc.country || '',
            code: editingLoc.code || ''
        };
        saveLocation(loc);
        setLocModalOpen(false);
        // If editing the currently open location, update it
        if (selectedLocation && selectedLocation.id === loc.id) {
            setSelectedLocation(loc);
        }
        showToast(isEditing ? 'Location updated' : 'Location added');
    };
    const handleDeleteLocation = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent drawer opening
        const deps = getLocationDependencies(id);
        const confirmText = deps.departmentsCount > 0 || deps.usersCount > 0
            ? `Delete this location and its ${deps.departmentsCount} departments / ${deps.usersCount} users?`
            : (t('admin.confirm.deleteLocation') || 'Delete this location?');
        if (confirm(confirmText)) {
            try {
                deleteLocation(id);
                if (selectedLocation?.id === id) setSelectedLocation(null);
                showToast('Location removed');
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    // Departments
    const handleSaveDepartment = () => {
        if (!editingDep.name?.trim() || !editingDep.locationId) {
            setDepartmentFormError(t('admin.validation.nameLocationRequired') || 'Department name and location are required.');
            return;
        }
        setDepartmentFormError('');
        const dep: Department = {
            id: editingDep.id || `DEP-${Date.now()}`,
            name: editingDep.name.trim(),
            locationId: editingDep.locationId!,
            address: depFormCode.trim()
        };
        saveDepartment(dep);
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
    };
    const handleDeleteDepartment = (dep: Department, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDepartmentDeleteTarget(dep);
    };

    const confirmDeleteDepartment = () => {
        if (!departmentDeleteTarget) return;
        try {
            const deps = getDepartmentDependencies(departmentDeleteTarget.id);
            if (deps.usersCount > 0) {
                const ok = confirm(`Delete this department and ${deps.usersCount} related users?`);
                if (!ok) return;
            }
            deleteDepartment(departmentDeleteTarget.id);
            setDepartmentDeleteTarget(null);
            showToast('Department removed');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteUser = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm(t('admin.confirm.deleteUser'))) {
            try {
                deleteUser(id);
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
        setDepartmentFormError('');
        setDepModalOpen(true);
    };

    const onEditDepartment = (dep: Department) => {
        setEditingDepartmentId(dep.id);
        setEditingDep(dep);
        setDepFormCode(getDepartmentCode(dep));
        setDepartmentFormError('');
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
        openAddUserModal(id);
    };

    const roleBadgeStyle = (role: AppUser['role']): React.CSSProperties => {
        if (role === 'Admin') return { background: '#fff3e0', color: '#e67e22' };
        if (role === 'Owner') return { background: '#e8f0fe', color: '#3b6fd4' };
        if (role === 'Assigned') return { background: '#e8f7f0', color: '#2e9e68' };
        return { background: '#f3f0ff', color: '#7c5cbf' };
    };

    const openAddUserModal = (locationId?: string, departmentId?: string) => {
        const preLocId = locationId || '';
        const localDepartments = departments.filter(dep => dep.locationId === preLocId);
        setEditingUserId(null);
        setUserFormError('');
        setUserForm({
            name: '',
            email: '',
            locationId: preLocId,
            departmentId: departmentId || localDepartments[0]?.id || '',
            role: 'Assigned'
        });
        setAddEditUserModalOpen(true);
    };

    const openEditUserModal = (user: AppUser) => {
        setEditingUserId(user.id);
        setUserFormError('');
        const localDepartments = departments.filter(dep => dep.locationId === user.locationId);
        const departmentId = user.departmentId || localDepartments[0]?.id || '';
        setUserForm({
            name: user.name,
            email: user.email,
            locationId: user.locationId,
            departmentId,
            role: user.role
        });
        setAddEditUserModalOpen(true);
    };

    const saveAddEditUser = () => {
        const name = userForm.name.trim();
        const email = userForm.email.trim();
        if (!name || !email || !userForm.locationId || !userForm.departmentId) {
            setUserFormError('Name, email, location and department are required.');
            return;
        }
        const selectedDep = departments.find(dep => dep.id === userForm.departmentId);
        if (!selectedDep || selectedDep.locationId !== userForm.locationId) {
            setUserFormError('Selected department does not belong to selected location.');
            return;
        }
        setUserFormError('');
        const payload: AppUser = {
            id: editingUserId || `USR-${Date.now()}`,
            name,
            email,
            locationId: userForm.locationId,
            departmentId: userForm.departmentId,
            role: userForm.role
        };
        saveUser(payload);
        setUsersExpandedLocs(prev => ({ ...prev, [payload.locationId]: true }));
        if (payload.departmentId) {
            setUsersExpandedDeps(prev => ({ ...prev, [`${payload.locationId}::${payload.departmentId}`]: true }));
        }
        setAddEditUserModalOpen(false);
        showToast(editingUserId ? 'User updated' : 'User added');
    };

    const openTransferModal = (user: AppUser) => {
        setTransferUserId(user.id);
        setTransferFormError('');
        const localDepartments = departments.filter(dep => dep.locationId === user.locationId);
        const departmentId = user.departmentId || localDepartments[0]?.id || '';
        setTransferForm({
            locationId: user.locationId,
            departmentId,
            role: user.role
        });
        setTransferUserModalOpen(true);
    };

    const saveTransferUser = () => {
        if (!transferUserId || !transferForm.locationId || !transferForm.departmentId) {
            setTransferFormError('Location and department are required.');
            return;
        }
        const user = users.find(u => u.id === transferUserId);
        if (!user) return;
        const selectedDep = departments.find(dep => dep.id === transferForm.departmentId);
        if (!selectedDep || selectedDep.locationId !== transferForm.locationId) {
            setTransferFormError('Selected department does not belong to selected location.');
            return;
        }
        setTransferFormError('');
        const payload: AppUser = {
            ...user,
            locationId: transferForm.locationId,
            departmentId: transferForm.departmentId,
            role: transferForm.role
        };
        saveUser(payload);
        setUsersExpandedLocs(prev => ({ ...prev, [payload.locationId]: true }));
        if (payload.departmentId) {
            setUsersExpandedDeps(prev => ({ ...prev, [`${payload.locationId}::${payload.departmentId}`]: true }));
        }
        setTransferUserModalOpen(false);
        showToast('User transferred');
    };

    const openProfileModal = (user: AppUser) => {
        setProfileUserId(user.id);
        setProfileUserModalOpen(true);
    };

    const clearUserSearch = () => {
        setUserSearch('');
    };

    const getDepartmentExpandKey = (locationId: string, departmentId: string) => `${locationId}::${departmentId}`;

    const getLocationShortName = (locationName: string) =>
        getTranslatedLocationName(locationName).replace(/\s*\([A-Z]+\)$/, '');

    const toggleUsersExpandAll = () => {
        const next = !usersAllExpanded;
        setUsersAllExpanded(next);
        if (next) {
            const map: Record<string, boolean> = {};
            const depMap: Record<string, boolean> = {};
            locations.forEach(loc => {
                map[loc.id] = true;
                departments
                    .filter(dep => dep.locationId === loc.id)
                    .forEach(dep => {
                        depMap[`${loc.id}::${dep.id}`] = true;
                    });
            });
            setUsersExpandedLocs(map);
            setUsersExpandedDeps(depMap);
            return;
        }
        setUsersExpandedLocs({});
        setUsersExpandedDeps({});
    };

    return (
        <div style={{ maxWidth: selectedUsersDepartment ? 'none' : '1600px', margin: selectedUsersDepartment ? '0' : '0 auto', paddingBottom: '4rem', position: 'relative' }}>
            <style>{`@keyframes urSlideUp { from { transform: translateY(18px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
            {!selectedUsersDepartment && (
                <>
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: 'var(--color-text)' }}>{t('admin.pageTitle')}</h1>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{t('admin.subtitle')}</div>
                        </div>
                        <button onClick={handleResetDefaultData} className="btn btn-outline" style={{ display: 'flex', gap: '8px' }}>
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
                </>
            )}

            {/* CONTENT */}
            <div
                className="card"
                style={
                    activeTab === 'users' || activeTab === 'departments' || activeTab === 'locations'
                        ? { padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }
                        : { padding: 0 }
                }
            >
                {/* --- LOCATIONS TAB --- */}
                {activeTab === 'locations' && (
                    <div
                        style={{
                            background: '#ffffff',
                            border: '1px solid #dbe5ec',
                            borderRadius: '14px',
                            boxShadow: 'none',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', padding: '12px 18px', borderBottom: 'none', background: '#ffffff' }}>
                            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '17px', fontWeight: 600, color: '#0f2530', lineHeight: 1, height: '40px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{t('admin.locations')}</span>

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
                                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13.5px', padding: '8px 30px 8px 34px', border: '1.5px solid #c8d8d6', borderRadius: '10px', outline: 'none', background: '#f2f9f8', color: '#1a2e2d', width: '275px', transition: 'all .2s' }}
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
                                style={{ width: '139px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, padding: '8px 12px', border: '1.5px solid #c8d8d6', borderRadius: '10px', background: '#f2f9f8', color: '#315a69', outline: 'none', cursor: 'pointer' }}
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
                                onClick={() => { setLocationFormError(''); setEditingLoc({ country: 'Switzerland' }); setLocModalOpen(true); }}
                                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13.5px', fontWeight: 500, padding: '9px 15px', background: '#5ba8a0', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
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

                        <div style={{ display: 'flex', gap: '24px', padding: '9px 18px', background: '#ffffff', borderTop: '1px solid #ddecea', borderBottom: '1px solid #ddecea', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{locationStats.totalLocations}</span> locations
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{locationStats.totalCountries}</span> countries
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', padding: '9px 20px', background: '#f7fbfb', borderBottom: '1px solid #ddecea' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583' }}>Name</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b8583', textAlign: 'right' }}>Actions</div>
                        </div>

                        {filteredLocations.length === 0 ? (
                            <div style={{ padding: '52px', textAlign: 'center', color: '#6b8583', fontSize: '14px' }}>
                                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>??</div>
                                <div>No locations match your search.</div>
                            </div>
                        ) : (
                            filteredLocations.map((loc, index) => {
                                const q = locationSearch.trim();
                                const isLast = index === filteredLocations.length - 1;
                                return (
                                    <div
                                        key={loc.id}
                                        style={{ display: 'grid', gridTemplateColumns: '1fr 90px', padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid #f0f8f7', alignItems: 'center', background: '#fafefe' }}
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
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button
                                                title="Edit"
                                                onClick={() => { setLocationFormError(''); setEditingLoc(loc); setLocModalOpen(true); }}
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
                    <div style={{ padding: '0', background: '#ffffff', border: '1px solid #dbe5ec', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 0,
                                padding: '12px 18px',
                                borderBottom: 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'nowrap' }}>
                                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '17px', fontWeight: 600, color: '#0f2530', lineHeight: 1, height: '40px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{t('admin.tabDepartments')}</span>
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
                                            borderRadius: '10px',
                                            outline: 'none',
                                            background: '#f2f9f8',
                                            color: '#1a2e2d',
                                            width: '275px',
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
                                        width: '139px',
                                        fontFamily: 'DM Sans, sans-serif',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        padding: '8px 12px',
                                        border: '1.5px solid #c8d8d6',
                                        borderRadius: '10px',
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
                                    padding: '8px 16px',
                                    border: '1.5px solid #c8d8d6',
                                    borderRadius: '10px',
                                    background: '#eef1f1',
                                    color: '#315a69',
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
                                    setDepartmentFormError('');
                                    setDepModalOpen(true);
                                }}
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '13.5px',
                                    fontWeight: 500,
                                    padding: '9px 15px',
                                    background: '#5ba8a0',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round">
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
                                borderTop: '1px solid #ddecea',
                                borderBottom: 'none',
                                padding: '9px 18px',
                                gap: '24px',
                                flexWrap: 'wrap'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{departmentStats.locationsShown}</span> locations
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{departmentStats.departmentsTotal}</span> departments
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M20 21a8 8 0 1 0-16 0" />
                                </svg>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{departmentStats.usersAssigned}</span> users
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
                                    <div key={loc.id}>
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
                                                borderTop: '1px solid #dfe8ee',
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
                                                    style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.2, color: '#1a2e2d', flex: 1 }}
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
                                                        padding: '8px 24px 8px 110px',
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
                                                    <div style={{ padding: '20px 110px', fontSize: '13px', color: '#6b8583', fontStyle: 'italic' }}>No departments yet — add one above.</div>
                                                ) : (
                                                    depts.map(dep => (
                                                        <div
                                                            key={dep.id}
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 260px 70px 80px',
                                                                padding: '12px 24px 12px 110px',
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
                        <div style={{ display: selectedUsersDepartment ? 'none' : 'block', background: '#ffffff', border: '1px solid #dbe5ec', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', background: 'transparent', border: 'none', borderRadius: 0, padding: '12px 18px', borderBottom: 'none' }}>
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

                            <select value={userDepartmentFilter} onChange={(e) => setUserDepartmentFilter(e.target.value)} style={{ width: '139px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, padding: '8px 12px', border: '1.5px solid #c8d8d6', borderRadius: '10px', background: '#f2f9f8', color: '#315a69', outline: 'none' }}>
                                <option value="">All Departments</option>
                                {allDepartmentNames.map(dep => <option key={dep} value={dep}>{dep}</option>)}
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

                        <div style={{ display: 'flex', gap: '24px', background: 'transparent', border: 'none', borderTop: '1px solid #ddecea', borderBottom: 'none', padding: '9px 18px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{usersViewData.stats.totalLocations}</span> locations</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b8583' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: '14px', color: '#1a2e2d' }}>{usersViewData.stats.totalUsersShown}</span> users</div>
                        </div>

                        <div style={{ background: '#f8fbfb', border: 'none', borderRadius: 0, overflow: 'hidden', boxShadow: 'none' }}>
                            {usersViewData.groups.length === 0 && (
                                <div style={{ padding: '52px', textAlign: 'center', color: '#6b8583', fontSize: '14px' }}><div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>??</div>No users match your search or filters.</div>
                            )}

                            {usersViewData.groups.map(({ loc, allLocUsers, visibleUsers }, locIndex) => {
                                const isOpen = !!usersExpandedLocs[loc.id];
                                const localRole = userLocalRoleFilters[loc.id] || 'All';
                                const activeSearch = userSearch.trim();
                                const hasActiveFilter = !!activeSearch || userGlobalRole !== 'All' || localRole !== 'All' || !!userDepartmentFilter;

                                const locationDepartments = departments.filter(dep => dep.locationId === loc.id);
                                const departmentBlocks = locationDepartments
                                    .map(dep => {
                                        const depName = getTranslatedDepartmentName(dep.name);
                                        const depUsersAll = allLocUsers.filter(user => {
                                            return user.departmentId === dep.id;
                                        });
                                        const depUsersVisible = visibleUsers.filter(user => {
                                            return user.departmentId === dep.id;
                                        });
                                        return { dep, depName, depUsersAll, depUsersVisible };
                                    })
                                    .filter(block => !hasActiveFilter || block.depUsersVisible.length > 0);

                                return (
                                    <div key={loc.id} style={{ marginBottom: 0 }}>
                                        <div
                                            onClick={() => setUsersExpandedLocs(prev => ({ ...prev, [loc.id]: !prev[loc.id] }))}
                                            style={{ background: '#fafefe', border: 'none', borderTop: locIndex === 0 ? '1px solid #dfe8ee' : '1px solid #dfe8ee', borderRadius: 0, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                        >
                                            <div style={{ width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6b8583', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </div>
                                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 500, background: '#e8f4f3', color: '#5ba8a0', padding: '3px 8px', borderRadius: '5px', flexShrink: 0, letterSpacing: '.05em' }}>
                                                {loc.code || '-'}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '15px', lineHeight: 1.2, fontWeight: 600, color: '#1a2e2d' }}>{getLocationShortName(loc.name)}</div>
                                                <div style={{ fontSize: '13px', color: '#6b8583' }}>{loc.city || '-'} · {loc.country || '-'}</div>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div style={{ border: 'none', borderTop: '1px solid #dfe8ee', borderRadius: 0, overflow: 'hidden', display: 'grid', gap: 0 }}>
                                                {departmentBlocks.length === 0 ? (
                                                    <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #ddecea', color: '#6b8583', fontSize: '13px' }}>No departments match current filters.</div>
                                                ) : (
                                                    departmentBlocks.map(({ dep, depName, depUsersAll, depUsersVisible }, depIndex) => {
                                                        const depKey = getDepartmentExpandKey(loc.id, dep.id);
                                                        const depOpen = !!usersExpandedDeps[depKey];
                                                        const detailUsers = depUsersAll.filter(user => {
                                                            if (localRole !== 'All' && user.role !== localRole) return false;
                                                            const q = userSearch.trim().toLowerCase();
                                                            if (!q) return true;
                                                            return (user.name || '').toLowerCase().includes(q) || (user.email || '').toLowerCase().includes(q);
                                                        });
                                                        const depOwnerCount = depUsersAll.filter(u => u.role === 'Owner').length;
                                                        const depAssignedCount = depUsersAll.filter(u => u.role === 'Assigned').length;
                                                        return (
                                                            <div key={dep.id} style={{ borderBottom: depIndex === departmentBlocks.length - 1 ? 'none' : '1px solid #ddecea', background: '#ffffff', overflow: 'hidden' }}>
                                                                <div
                                                                    onClick={() => setSelectedUsersDepartment({ locationId: loc.id, departmentId: dep.id })}
                                                                    style={{ padding: '12px 16px 12px 80px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                                                >
                                                                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 500, background: '#e8f4f3', color: '#5ba8a0', padding: '3px 8px', borderRadius: '5px', flexShrink: 0, letterSpacing: '.05em' }}>
                                                                        {depName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                                                                    </span>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                                            <div style={{ fontSize: '15px', lineHeight: 1.2, fontWeight: 600, color: '#1a2e2d' }}>{depName}</div>
                                                                        </div>
                                                                        <div style={{ fontSize: '13px', color: '#8aa0b5', marginTop: '2px' }}>{getLocationShortName(loc.name)}</div>
                                                                    </div>
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6b8583', fontWeight: 400 }}>
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                                <circle cx="12" cy="8" r="4" />
                                                                                <path d="M20 21a8 8 0 1 0-16 0" />
                                                                            </svg>
                                                                            <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 400, fontSize: '14px', color: '#6b8583' }}>{depUsersVisible.length}</span> users
                                                                        </span>
                                                                        <div style={{ color: '#8aa0b5', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                {depOpen ? <polyline points="6 9 12 15 18 9" /> : <polyline points="9 18 15 12 9 6" />}
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {depOpen && (
                                                                    <div style={{ borderTop: '1px solid #ddecea', background: '#f5f8fb', padding: '14px 18px 18px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#5ba8a0', fontWeight: 600 }}>
                                                                                <button
                                                                                    onClick={() => setUsersExpandedDeps(prev => ({ ...prev, [depKey]: false }))}
                                                                                    style={{ background: 'transparent', border: 'none', color: '#5ba8a0', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 600 }}
                                                                                >
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                                                                    Users & Roles
                                                                                </button>
                                                                                <span style={{ color: '#1a2e2d', fontWeight: 700 }}>{depName}</span>
                                                                            </div>
                                                                            <button onClick={() => openAddUserModal(loc.id, dep.id)} style={{ padding: '9px 16px', background: '#5ba8a0', color: '#ffffff', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                                                Add User
                                                                            </button>
                                                                        </div>

                                                                        <div style={{ background: '#ffffff', border: '1px solid #dbe5ec', borderRadius: '14px', padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                <span style={{ width: '56px', height: '56px', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#4f9d95', color: '#ffffff', fontFamily: 'DM Mono, monospace', fontSize: '24px', fontWeight: 700 }}>
                                                                                    {depName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                                                                                </span>
                                                                                <div>
                                                                                    <div style={{ fontSize: '39px', lineHeight: 1.15, fontWeight: 700, color: '#1d2f3a' }}>{depName}</div>
                                                                                    <div style={{ fontSize: '14px', color: '#8aa0b5', marginTop: '4px' }}>{loc.city || '-'} · {loc.country || '-'}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,auto)', gap: '24px' }}>
                                                                                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '44px', lineHeight: 1, color: '#4f9d95', fontWeight: 700 }}>{depUsersAll.length}</div><div style={{ fontSize: '11px', letterSpacing: '.06em', color: '#4f9d95', fontWeight: 600 }}>TOTAL USERS</div></div>
                                                                                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '44px', lineHeight: 1, color: '#4f9d95', fontWeight: 700 }}>{depOwnerCount}</div><div style={{ fontSize: '11px', letterSpacing: '.06em', color: '#9aacbd', fontWeight: 600 }}>OWNER</div></div>
                                                                                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '44px', lineHeight: 1, color: '#4f9d95', fontWeight: 700 }}>{depAssignedCount}</div><div style={{ fontSize: '11px', letterSpacing: '.06em', color: '#9aacbd', fontWeight: 600 }}>ASSIGNED</div></div>
                                                                            </div>
                                                                        </div>

                                                                        <div style={{ background: '#ffffff', border: '1px solid #dbe5ec', borderRadius: '14px', overflow: 'hidden' }}>
                                                                            <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 130px', gap: '10px' }}>
                                                                                <div style={{ position: 'relative' }}>
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '10px', top: '10px', color: '#8aa0b5' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                                                                    <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name or email..." style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1.5px solid #dde5ee', borderRadius: '9px', background: '#f8fbfb', fontSize: '13px', color: '#294b52', outline: 'none' }} />
                                                                                </div>
                                                                                <select value={localRole} onChange={(e) => setUserLocalRoleFilters(prev => ({ ...prev, [loc.id]: e.target.value as 'All' | 'Admin' | 'Owner' | 'Assigned' | 'Viewer' }))} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #dde5ee', borderRadius: '9px', background: '#f8fbfb', fontSize: '13px', color: '#315a69', outline: 'none' }}>
                                                                                    <option value="All">All Roles</option>
                                                                                    <option value="Admin">Admin</option>
                                                                                    <option value="Owner">Owner</option>
                                                                                    <option value="Assigned">Assigned</option>
                                                                                    <option value="Viewer">Viewer</option>
                                                                                </select>
                                                                            </div>
                                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px', padding: '10px 16px', background: '#f7fbfb', borderTop: '1px solid #edf5f4', borderBottom: '1px solid #edf5f4' }}>
                                                                                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8aa0b5' }}>User</div>
                                                                                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8aa0b5' }}>Role</div>
                                                                                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8aa0b5', textAlign: 'right' }}>Actions</div>
                                                                            </div>
                                                                            {detailUsers.length === 0 ? (
                                                                                <div style={{ padding: '18px 16px', color: '#6b8583', fontSize: '13px' }}>No users in this Betrieb.</div>
                                                                            ) : (
                                                                                detailUsers.map(user => (
                                                                                    <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px', padding: '12px 16px', borderBottom: '1px solid #f0f8f7', alignItems: 'center' }}>
                                                                                        <div>
                                                                                            <div style={{ fontSize: '27px', fontWeight: 700, lineHeight: 1.2, color: '#0f2530' }} dangerouslySetInnerHTML={{ __html: highlight(user.name, userSearch.trim()) }} />
                                                                                            <div style={{ fontSize: '13px', color: '#8aa0b5' }} dangerouslySetInnerHTML={{ __html: highlight(user.email, userSearch.trim()) }} />
                                                                                        </div>
                                                                                        <div><span style={{ fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', ...roleBadgeStyle(user.role) }}>{user.role}</span></div>
                                                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                                                            <button title="View Profile" onClick={() => openProfileModal(user)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #ddecea', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#6b8583' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                                                                                            <button title="Edit" onClick={() => openEditUserModal(user)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #ddecea', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#5ba8a0' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                                                                                            <button title="Remove" onClick={(e) => handleDeleteUser(user.id, e)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #f5d5d5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#e05a5a' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg></button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            )}
                                                                            <button onClick={() => openAddUserModal(loc.id, dep.id)} style={{ background: 'transparent', border: 'none', color: '#3f9088', fontWeight: 700, fontSize: '26px', cursor: 'pointer', padding: '14px 16px' }}>
                                                                                + Add User
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        </div>

                        {selectedUsersDepartment && (() => {
                            const loc = locations.find(l => l.id === selectedUsersDepartment.locationId);
                            const dep = departments.find(d => d.id === selectedUsersDepartment.departmentId);
                            if (!loc || !dep) return null;

                            const depName = getTranslatedDepartmentName(dep.name);
                            const depUsersAll = users.filter(user => {
                                if (user.locationId !== loc.id) return false;
                                return user.departmentId === dep.id;
                            });
                            const localRole = userLocalRoleFilters[loc.id] || 'All';
                            const q = userSearch.trim().toLowerCase();
                            const detailUsers = depUsersAll.filter(user => {
                                if (localRole !== 'All' && user.role !== localRole) return false;
                                if (!q) return true;
                                return (user.name || '').toLowerCase().includes(q) || (user.email || '').toLowerCase().includes(q);
                            });
                            const depOwnerCount = depUsersAll.filter(u => u.role === 'Owner').length;
                            const depAssignedCount = depUsersAll.filter(u => u.role === 'Assigned').length;

                            return (
                                <div style={{ padding: '0 0 24px', marginTop: '-32px' }}>
                                    <div style={{ maxWidth: 'none', margin: 0 }}>
                                        <div style={{ margin: '0 -32px 0', background: '#ffffff' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 16px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5ba8a0', fontWeight: 600, lineHeight: 1.3 }}>
                                                    <button
                                                        onClick={() => setSelectedUsersDepartment(null)}
                                                        style={{ background: 'transparent', border: 'none', color: '#5ba8a0', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                                        Users & Roles
                                                    </button>
                                                    <span style={{ color: '#9fb3c4', fontSize: '13px', lineHeight: 1.3 }}>/</span>
                                                    <span style={{ color: '#1e2b3a', fontWeight: 600, fontSize: '13px', lineHeight: 1.3 }}>{depName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: '#5ba8a0', borderRadius: '0', padding: '34px 20px 34px 32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center', margin: '0 -32px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <span style={{ width: '50px', height: '50px', borderRadius: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontFamily: 'DM Sans, sans-serif', fontSize: '17px', fontWeight: 700, letterSpacing: '.01em' }}>
                                                    {depName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                                                </span>
                                                <div>
                                                    <div style={{ fontSize: '30px', lineHeight: 1.08, fontWeight: 400, color: '#ffffff' }}>{depName}</div>
                                                    <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" />
                                                            <circle cx="12" cy="10" r="3" />
                                                        </svg>
                                                        <span>{loc.city || '-'} · {loc.country || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,auto)', gap: '0' }}>
                                                <div style={{ textAlign: 'center', padding: '0 22px' }}><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '46px', lineHeight: 1, color: '#ffffff', fontWeight: 700 }}>{depUsersAll.length}</div><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', letterSpacing: '.06em', color: '#ffffff', fontWeight: 600 }}>TOTAL USERS</div></div>
                                            </div>
                                        </div>

                                        <div style={{ background: '#ffffff', border: '1px solid #dbe5ec', borderRadius: '14px', overflow: 'hidden' }}>
                                            <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '340px 110px 1fr', gap: '10px', alignItems: 'center' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '10px', top: '10px', color: '#8aa0b5' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                                    <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name or email..." style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1.5px solid #dde5ee', borderRadius: '9px', background: '#f8fbfb', fontSize: '13px', color: '#294b52', outline: 'none' }} />
                                                </div>
                                                <select value={localRole} onChange={(e) => setUserLocalRoleFilters(prev => ({ ...prev, [loc.id]: e.target.value as 'All' | 'Admin' | 'Owner' | 'Assigned' | 'Viewer' }))} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #dde5ee', borderRadius: '9px', background: '#f8fbfb', fontSize: '13px', color: '#315a69', outline: 'none' }}>
                                                    <option value="All">All Roles</option>
                                                    <option value="Admin">Admin</option>
                                                    <option value="Owner">Owner</option>
                                                    <option value="Assigned">Assigned</option>
                                                    <option value="Viewer">Viewer</option>
                                                </select>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => openAddUserModal(loc.id, dep.id)} style={{ padding: '8px 14px', background: '#5ba8a0', color: '#ffffff', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                        Add User
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px', padding: '10px 16px', background: '#f7fbfb', borderTop: '1px solid #edf5f4', borderBottom: '1px solid #edf5f4' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8aa0b5' }}>User</div>
                                                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8aa0b5' }}>Role</div>
                                                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8aa0b5', textAlign: 'right' }}>Actions</div>
                                            </div>
                                            {detailUsers.length === 0 ? (
                                                <div style={{ padding: '18px 16px', color: '#6b8583', fontSize: '13px' }}>No users in this Betrieb.</div>
                                            ) : (
                                                detailUsers.map(user => (
                                                    <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px', padding: '12px 16px', borderBottom: '1px solid #f0f8f7', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#5ba8a0', color: '#ffffff', fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {(user.name || '').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                                                            </span>
                                                            <div>
                                                                <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.2, color: '#0f2530' }} dangerouslySetInnerHTML={{ __html: highlight(user.name, userSearch.trim()) }} />
                                                                <div style={{ fontSize: '12px', color: '#8aa0b5' }} dangerouslySetInnerHTML={{ __html: highlight(user.email, userSearch.trim()) }} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span style={user.role === 'Owner'
                                                                ? { fontSize: '11px', fontWeight: 600, padding: '4px 11px', borderRadius: '999px', background: '#5ba8a0', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '5px' }
                                                                : user.role === 'Assigned'
                                                                    ? { fontSize: '11px', fontWeight: 600, padding: '4px 11px', borderRadius: '999px', background: '#e8f4f3', color: '#3f9088', border: '1px solid #b7deda', display: 'inline-flex', alignItems: 'center', gap: '5px' }
                                                                    : { fontSize: '11px', fontWeight: 600, padding: '4px 11px', borderRadius: '999px', ...roleBadgeStyle(user.role), display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                                <span style={{ fontSize: '10px' }}>•</span>{user.role}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                            <button title="View Profile" onClick={() => openProfileModal(user)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #ddecea', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#6b8583' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                                                            <button title="Edit" onClick={() => openEditUserModal(user)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #ddecea', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#5ba8a0' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                                                            <button title="Remove" onClick={(e) => handleDeleteUser(user.id, e)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #f5d5d5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', color: '#e05a5a' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg></button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
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
                                                                    <button onClick={() => onEditDepartment(dep)} className="btn btn-outline" style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
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
                                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{user.name}</div>
                                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.email}</div>
                                                                </td>
                                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                                    <span style={{
                                                                        padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                                                                        background: user.role === 'Admin' ? '#f3e8ff' : user.role === 'Owner' ? '#dbeafe' : user.role === 'Assigned' ? '#dcfce7' : '#f1f5f9',
                                                                        color: user.role === 'Admin' ? '#7e22ce' : user.role === 'Owner' ? '#1e40af' : user.role === 'Assigned' ? '#15803d' : '#475569'
                                                                    }}>{getTranslatedRole(user.role)}</span>
                                                                </td>
                                                                <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>{getUserDepartmentName(user)}</td>
                                                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                                        <button onClick={() => openEditUserModal(user)} className="btn btn-outline" style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
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

            <LocationModal
                isOpen={isLocationModalOpen}
                editingLoc={editingLoc}
                locationFormError={locationFormError}
                onChange={setEditingLoc}
                onClose={() => {
                    setLocationFormError('');
                    setLocModalOpen(false);
                }}
                onSave={handleSaveLocation}
            />

            <DepartmentModal
                isOpen={isDepModalOpen}
                editingDepartmentId={editingDepartmentId}
                editingDep={editingDep}
                depFormCode={depFormCode}
                locations={locations}
                isLocationLocked={!!(selectedLocation || lockLocationId)}
                departmentFormError={departmentFormError}
                usersCountInDepartment={editingDepartmentId ? users.filter(u => u.departmentId === editingDepartmentId).length : 0}
                getTranslatedLocationName={getTranslatedLocationName}
                onChangeDep={setEditingDep}
                onChangeDepCode={setDepFormCode}
                onClose={() => {
                    setDepModalOpen(false);
                    setLockLocationId(null);
                    setEditingDepartmentId(null);
                    setDepartmentFormError('');
                }}
                onSave={handleSaveDepartment}
            />

            <DepartmentDeleteDialog
                target={departmentDeleteTarget}
                getTranslatedDepartmentName={getTranslatedDepartmentName}
                onCancel={() => setDepartmentDeleteTarget(null)}
                onConfirm={confirmDeleteDepartment}
            />

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

            <AddEditUserModal
                isOpen={isAddEditUserModalOpen}
                editingUserId={editingUserId}
                userForm={userForm}
                userFormError={userFormError}
                locations={locations}
                departments={departments}
                getTranslatedLocationName={getTranslatedLocationName}
                getTranslatedDepartmentName={getTranslatedDepartmentName}
                onChangeUserForm={setUserForm}
                onClose={() => {
                    setUserFormError('');
                    setAddEditUserModalOpen(false);
                }}
                onSave={saveAddEditUser}
            />

            <TransferUserModal
                isOpen={isTransferUserModalOpen}
                transferUserId={transferUserId}
                transferForm={transferForm}
                transferFormError={transferFormError}
                users={users}
                locations={locations}
                departments={departments}
                getTranslatedLocationName={getTranslatedLocationName}
                getTranslatedDepartmentName={getTranslatedDepartmentName}
                onChangeTransferForm={setTransferForm}
                onClose={() => {
                    setTransferFormError('');
                    setTransferUserModalOpen(false);
                }}
                onSave={saveTransferUser}
            />

            <UserProfileModal
                isOpen={isProfileUserModalOpen}
                profileUserId={profileUserId}
                users={users}
                locations={locations}
                roleBadgeStyle={roleBadgeStyle}
                getUserDepartmentName={getUserDepartmentName}
                getTranslatedLocationName={getTranslatedLocationName}
                onClose={() => setProfileUserModalOpen(false)}
                onEditUser={(user) => {
                    setProfileUserModalOpen(false);
                    openEditUserModal(user);
                }}
            />

        </div>
    );
};

export default Administration;








