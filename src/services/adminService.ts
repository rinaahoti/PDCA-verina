import { AdminData, AppUser, Department, Location } from '../types/admin';
import { activityService } from './activityService';
import { stripDoctorPrefix } from '../utils/nameUtils';

const STORAGE_KEY = 'mso_v7_admin_data';
const LEGACY_KEYS = {
    LOCATIONS: 'mso_v6_locations',
    DEPARTMENTS: 'mso_v6_departments',
    USERS: 'mso_v6_users'
};

const REMOVED_LOCATION_IDS = new Set<string>();
const REMOVED_LOCATION_NAME_KEYS: string[] = ['location tbd'];
const ZURICH_LOCATION_ID = 'LOC-001';
const BERN_LOCATION_ID = 'LOC-002';
const ZURICH_RESTELBERG_ADDRESS = 'Restelbergstrasse 108, 8044 Zurich';
const BERN_FISCHERMATTELI_ADDRESS = 'Könizstrasse 74 008 Bern';
const BERN_VIKTORIA_ADDRESS = 'Schänzlistrasse 63 3013';

const DEFAULT_ADMIN_DATA: AdminData = {
    locations: [
        { id: 'LOC-001', name: 'Zurich', city: 'Zurich', country: 'Switzerland', code: 'ZH' },
        { id: 'LOC-002', name: 'Bern', city: 'Bern', country: 'Switzerland', code: 'GE' }
    ],
    departments: [
        { id: 'DEP-001', name: 'Quality & Patient Safety', locationId: 'LOC-001', address: 'Mullackerstrasse 2/4, 8152 Glattbrugg' },
        { id: 'DEP-002', name: 'Surgery Department', locationId: 'LOC-001', address: ZURICH_RESTELBERG_ADDRESS },
        { id: 'DEP-BERN-001', name: 'Tertianum Fischermatteli', locationId: 'LOC-002', address: BERN_FISCHERMATTELI_ADDRESS },
        { id: 'DEP-BERN-002', name: 'Tertianum Viktoria', locationId: 'LOC-002', address: BERN_VIKTORIA_ADDRESS }
    ],
    users: [
        { id: 'USR-001', name: 'Elena Rossi', email: 'elena.rossi@hospital.ch', role: 'Owner', locationId: 'LOC-001', departmentId: 'DEP-001' },
        { id: 'USR-002', name: 'Marcus Weber', email: 'marcus.weber@hospital.ch', role: 'Assigned', locationId: 'LOC-001', departmentId: 'DEP-002' }
    ]
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const trimValue = (value: unknown): string => String(value ?? '').trim();

const deriveLocationCode = (name: unknown): string => {
    const normalizedName = trimValue(name);
    if (!normalizedName) return '';

    const parentheticalCode = normalizedName.match(/\(([A-Za-z0-9]{2,4})\)\s*$/)?.[1];
    if (parentheticalCode) return parentheticalCode.toUpperCase();

    const compactName = normalizedName.replace(/[^A-Za-z0-9 ]/g, ' ').trim();
    if (!compactName) return '';

    const condensed = compactName.replace(/\s+/g, '');
    if (/^[A-Za-z0-9]{2,4}$/.test(condensed)) {
        return condensed.toUpperCase();
    }

    const words = compactName.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return words.slice(0, 3).map(word => word[0]).join('').toUpperCase();
};

const createUserName = (raw: any): string => {
    const name = trimValue(raw?.name);
    if (name) return stripDoctorPrefix(name);
    return stripDoctorPrefix(trimValue(raw?.fullName));
};

const isRemovedLocationName = (name: string): boolean => {
    const key = name.toLowerCase();
    return REMOVED_LOCATION_NAME_KEYS.some(removed => key.includes(removed));
};

const normalize = (raw: Partial<AdminData> | null | undefined): AdminData => {
    const locations = Array.isArray(raw?.locations)
        ? raw.locations
            .map((loc: any) => {
                const id = trimValue(loc?.id);
                let name = trimValue(loc?.name);
                let city = trimValue(loc?.city);
                const country = trimValue(loc?.country);
                const code = trimValue(loc?.code) || deriveLocationCode(loc?.name);

                // Migrate legacy names to the current short display names used in Administration.
                if (name === 'University Hospital Zurich (ZH)') {
                    name = 'Zurich';
                }
                if (name === 'Geneva University Hospitals (GE)') {
                    name = 'Bern';
                    if (!city || city === 'Geneva') city = 'Bern';
                }
                if (name === 'Bern') {
                    name = 'Bern';
                    if (!city) city = 'Bern';
                }

                return { id, name, city, country, code };
            })
            .filter(loc => !!loc.id && !!loc.name)
            .filter(loc => !REMOVED_LOCATION_IDS.has(loc.id) && !isRemovedLocationName(loc.name))
            .map(loc => ({ ...loc } as Location))
        : [];

    const locationIds = new Set(locations.map(loc => loc.id));

    const departments = Array.isArray(raw?.departments)
        ? raw.departments
            .map((dep: any) => {
                const id = trimValue(dep?.id);
                let name = trimValue(dep?.name);
                const locationId = trimValue(dep?.locationId);
                let address = trimValue(dep?.address);

                // Zurich's second default department was previously labeled/shipped with the wrong
                // Fischermatteli/Bern data. Keep Bern unchanged and only heal Zurich records.
                if (locationId === ZURICH_LOCATION_ID) {
                    if (name === 'Tertianum Fischermatteli' || name === 'Tertianum Fischermätteli') {
                        name = 'Tertianum Restelberg';
                    }
                    if (
                        name === 'Surgery Department' ||
                        name === 'Tertianum Restelberg'
                    ) {
                        address = ZURICH_RESTELBERG_ADDRESS;
                    }
                }

                if (locationId === BERN_LOCATION_ID) {
                    if (name === 'Tertianum Fischermatteli' || name === 'Tertianum Fischermätteli') {
                        address = BERN_FISCHERMATTELI_ADDRESS;
                    }
                    if (name === 'Tertianum Viktoria') {
                        address = BERN_VIKTORIA_ADDRESS;
                    }
                }

                return { id, name, locationId, address };
            })
            .filter(dep => !!dep.id && !!dep.name && !!dep.locationId && locationIds.has(dep.locationId))
            .map(dep => ({ ...dep } as Department))
        : [];

    const departmentIds = new Set(departments.map(dep => dep.id));

    const users = Array.isArray(raw?.users)
        ? raw.users
            .map((user: any) => {
                const password = trimValue(user?.password);
                return {
                    id: trimValue(user?.id),
                    name: createUserName(user),
                    email: trimValue(user?.email),
                    ...(password ? { password } : {}),
                    role: user?.role as AppUser['role'],
                    locationId: trimValue(user?.locationId),
                    departmentId: trimValue(user?.departmentId)
                };
            })
            .filter(
                (user): user is AppUser =>
                    !!user.id &&
                    !!user.name &&
                    !!user.email &&
                    (user.role === 'Admin' || user.role === 'Owner' || user.role === 'Assigned' || user.role === 'Viewer') &&
                    !!user.locationId &&
                    !!user.departmentId &&
                    locationIds.has(user.locationId) &&
                    departmentIds.has(user.departmentId)
            )
            .filter(user => departments.some(dep => dep.id === user.departmentId && dep.locationId === user.locationId))
            .map(user => ({ ...user, fullName: user.name }))
        : [];

    return { locations, departments, users };
};

const emitUpdate = () => window.dispatchEvent(new Event('storage-admin'));

const loadLegacyData = (): AdminData | null => {
    const legacyLocations = localStorage.getItem(LEGACY_KEYS.LOCATIONS);
    const legacyDepartments = localStorage.getItem(LEGACY_KEYS.DEPARTMENTS);
    const legacyUsers = localStorage.getItem(LEGACY_KEYS.USERS);
    if (!legacyLocations && !legacyDepartments && !legacyUsers) return null;

    const data: Partial<AdminData> = {
        locations: legacyLocations ? (JSON.parse(legacyLocations) as Location[]) : [],
        departments: legacyDepartments ? (JSON.parse(legacyDepartments) as Department[]) : [],
        users: legacyUsers ? (JSON.parse(legacyUsers) as AppUser[]) : []
    };

    return normalize(data);
};

export const loadAdminData = (): AdminData => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        const parsed = normalize(JSON.parse(raw) as Partial<AdminData>);
        const hasRemovedLocation = parsed.locations.some(loc => isRemovedLocationName(loc.name));
        const healed = parsed.locations.length === 0 || hasRemovedLocation ? clone(DEFAULT_ADMIN_DATA) : parsed;
        const serialized = JSON.stringify(healed);
        if (serialized !== raw) {
            localStorage.setItem(STORAGE_KEY, serialized);
        }
        return healed;
    }

    const legacy = loadLegacyData();
    const initial = legacy || clone(DEFAULT_ADMIN_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
};

export const saveAdminData = (data: AdminData): AdminData => {
    const normalized = normalize(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    emitUpdate();
    return normalized;
};

export const resetAdminData = (): AdminData => {
    const reset = clone(DEFAULT_ADMIN_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    emitUpdate();
    return reset;
};

const requireLocation = (data: AdminData, locationId: string): void => {
    if (!data.locations.some(loc => loc.id === locationId)) {
        throw new Error('Invalid location.');
    }
};

const requireDepartment = (data: AdminData, departmentId: string, locationId: string): void => {
    const dep = data.departments.find(item => item.id === departmentId);
    if (!dep || dep.locationId !== locationId) {
        throw new Error('Invalid department for selected location.');
    }
};

const toStoredUser = (user: AppUser): AppUser => ({
    id: trimValue(user.id),
    name: stripDoctorPrefix(trimValue(user.name || user.fullName)),
    fullName: stripDoctorPrefix(trimValue(user.name || user.fullName)),
    email: trimValue(user.email),
    password: trimValue(user.password) || undefined,
    role: user.role,
    locationId: trimValue(user.locationId),
    departmentId: trimValue(user.departmentId)
});

export const adminService = {
    loadAdminData,
    saveAdminData,
    resetAdminData,

    getLocations: (): Location[] => loadAdminData().locations,
    getDepartments: (): Department[] => loadAdminData().departments,
    getUsers: (): AppUser[] => loadAdminData().users,

    saveLocation: (loc: Location): AdminData => {
        const data = loadAdminData();
        const normalizedName = trimValue(loc.name) === 'Bern'
            ? 'Bern'
            : trimValue(loc.name);
        const normalizedCity = trimValue(loc.name) === 'Bern'
            ? 'Bern'
            : trimValue(loc.city);
        const existingLocation = data.locations.find(item => item.id === trimValue(loc.id));
        const existingDerivedCode = existingLocation ? deriveLocationCode(existingLocation.name) : '';
        const shouldRefreshCodeFromName =
            !trimValue(loc.code) ||
            (!!existingLocation && trimValue(existingLocation.code) === existingDerivedCode);
        const nextLocation: Location = {
            id: trimValue(loc.id),
            name: normalizedName,
            city: normalizedCity,
            country: trimValue(loc.country),
            code: shouldRefreshCodeFromName ? deriveLocationCode(normalizedName) : trimValue(loc.code)
        };

        if (!nextLocation.id || !nextLocation.name) {
            throw new Error('Location id and name are required.');
        }

        const idx = data.locations.findIndex(item => item.id === nextLocation.id);
        const isNew = idx < 0;
        if (idx >= 0) data.locations[idx] = nextLocation;
        else data.locations.push(nextLocation);

        activityService.log({
            type: isNew ? 'LOCATION_CREATED' : 'LOCATION_UPDATED',
            message: isNew ? `Location ${nextLocation.name} created` : `Location ${nextLocation.name} updated`,
            entityType: 'Location',
            entityName: nextLocation.name,
            location: nextLocation.city
        });

        return saveAdminData(data);
    },

    deleteLocation: (id: string): AdminData => {
        const data = loadAdminData();
        const location = data.locations.find(loc => loc.id === id);
        if (!location) return data;

        const deletedDepartmentIds = new Set(data.departments.filter(dep => dep.locationId === id).map(dep => dep.id));
        data.locations = data.locations.filter(loc => loc.id !== id);
        data.departments = data.departments.filter(dep => dep.locationId !== id);
        data.users = data.users.filter(user => user.locationId !== id && !deletedDepartmentIds.has(user.departmentId));

        activityService.log({
            type: 'LOCATION_DELETED',
            message: `Location ${location.name} deleted`,
            entityType: 'Location',
            entityName: location.name,
            location: location.city
        });

        return saveAdminData(data);
    },

    saveDepartment: (dep: Department): AdminData => {
        const data = loadAdminData();

        const nextDepartment: Department = {
            id: trimValue(dep.id),
            name: trimValue(dep.name),
            locationId: trimValue(dep.locationId),
            address: trimValue(dep.address)
        };

        if (!nextDepartment.id || !nextDepartment.name || !nextDepartment.locationId) {
            throw new Error('Department id, name and location are required.');
        }

        requireLocation(data, nextDepartment.locationId);

        const idx = data.departments.findIndex(item => item.id === nextDepartment.id);
        const isNew = idx < 0;
        if (idx >= 0) data.departments[idx] = nextDepartment;
        else data.departments.push(nextDepartment);

        activityService.log({
            type: isNew ? 'DEPARTMENT_CREATED' : 'DEPARTMENT_UPDATED',
            message: isNew ? `Department ${nextDepartment.name} created` : `Department ${nextDepartment.name} updated`,
            entityType: 'Department',
            entityName: nextDepartment.name,
            department: nextDepartment.name
        });

        return saveAdminData(data);
    },

    deleteDepartment: (id: string): AdminData => {
        const data = loadAdminData();
        const department = data.departments.find(dep => dep.id === id);
        if (!department) return data;

        data.departments = data.departments.filter(dep => dep.id !== id);
        data.users = data.users.filter(user => user.departmentId !== id);

        activityService.log({
            type: 'DEPARTMENT_DELETED',
            message: `Department ${department.name} deleted`,
            entityType: 'Department',
            entityName: department.name,
            department: department.name
        });

        return saveAdminData(data);
    },

    saveUser: (user: AppUser): AdminData => {
        const data = loadAdminData();
        const nextUser = toStoredUser(user);

        if (!nextUser.id || !nextUser.name || !nextUser.email || !nextUser.locationId || !nextUser.departmentId) {
            throw new Error('Name, email, location and department are required.');
        }

        requireLocation(data, nextUser.locationId);
        requireDepartment(data, nextUser.departmentId, nextUser.locationId);

        const idx = data.users.findIndex(item => item.id === nextUser.id);
        const isNew = idx < 0;
        if (idx >= 0) data.users[idx] = nextUser;
        else data.users.push(nextUser);

        activityService.log({
            type: isNew ? 'USER_ADDED' : 'USER_EDITED',
            message: isNew ? `User ${nextUser.name} registered` : `User ${nextUser.name} updated`,
            entityType: 'User',
            entityName: nextUser.name
        });

        return saveAdminData(data);
    },

    deleteUser: (id: string): AdminData => {
        const data = loadAdminData();
        const user = data.users.find(item => item.id === id);
        data.users = data.users.filter(item => item.id !== id);

        if (user) {
            activityService.log({
                type: 'USER_DELETED',
                message: `User ${user.name} deleted`,
                entityType: 'User',
                entityName: user.name
            });
        }

        return saveAdminData(data);
    },

    getLocationDependencies: (locationId: string) => {
        const data = loadAdminData();
        const departmentIds = data.departments.filter(dep => dep.locationId === locationId).map(dep => dep.id);
        const usersCount = data.users.filter(user => user.locationId === locationId || departmentIds.includes(user.departmentId)).length;
        return {
            departmentsCount: departmentIds.length,
            usersCount
        };
    },

    getDepartmentDependencies: (departmentId: string) => {
        const data = loadAdminData();
        return {
            usersCount: data.users.filter(user => user.departmentId === departmentId).length
        };
    },

    resetData: () => {
        resetAdminData();
    }
};

