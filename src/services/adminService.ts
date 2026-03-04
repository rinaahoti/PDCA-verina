import { Location, Department, AppUser } from '../types/admin';
import { activityService } from './activityService';

const KEYS = {
    LOCATIONS: 'mso_v6_locations',
    DEPARTMENTS: 'mso_v6_departments',
    USERS: 'mso_v6_users'
};

const REMOVED_LOCATION_CODES = new Set(['BE', 'BS', 'VD']);
const REMOVED_LOCATION_NAMES = new Set([
    'Inselspital Bern (BE)',
    'University Hospital Basel (BS)',
    'CHUV Lausanne (VD)'
]);

const isRemovedLocation = (loc: Location | { name?: string; code?: string }): boolean => {
    const code = (loc.code || '').trim().toUpperCase();
    const name = (loc.name || '').trim();
    return REMOVED_LOCATION_CODES.has(code) || REMOVED_LOCATION_NAMES.has(name);
};

const sanitizeLocations = (locations: Location[]): Location[] => {
    return locations.filter(loc => !isRemovedLocation(loc));
};

const normalizeLocations = (locations: Location[]): Location[] => {
    return locations.map(loc => {
        if ((loc.code || '').toUpperCase() === 'GE') {
            return { ...loc, city: 'Bern' };
        }
        return loc;
    });
};

const normalizeDepartments = (departments: Department[], locations: Location[]): Department[] => {
    const hasZurich = locations.some(l => l.id === 'LOC-001');

    let next = [...departments];

    const hasRestelbergZurich = next.some(
        d => d.locationId === 'LOC-001' && d.name === 'Tertianum Restelberg'
    );
    if (hasZurich && !hasRestelbergZurich) {
        next.push({ id: 'DEP-RESTELBERG', name: 'Tertianum Restelberg', locationId: 'LOC-001' });
    }

    return next;
};

const SEED = {
    LOCATIONS: [
        { id: 'LOC-001', name: 'University Hospital Zurich (ZH)', city: 'Zurich', country: 'Switzerland', code: 'ZH' },
        { id: 'LOC-002', name: 'Geneva University Hospitals (GE)', city: 'Geneva', country: 'Switzerland', code: 'GE' }
    ] as Location[],
    DEPARTMENTS: [
        { id: 'DEP-001', name: 'Quality & Patient Safety', locationId: 'LOC-001' },
        { id: 'DEP-002', name: 'Surgery Department', locationId: 'LOC-001' },
        { id: 'DEP-BERN-001', name: 'Tertianum Fischermätteli', locationId: 'LOC-002' },
        { id: 'DEP-BERN-002', name: 'Tertianum Viktoria', locationId: 'LOC-002' }
    ] as Department[],
    USERS: [
        { id: 'USR-001', fullName: 'Dr. Elena Rossi', email: 'elena.rossi@hospital.ch', role: 'Owner', locationId: 'LOC-001', departmentId: 'DEP-001' },
        { id: 'USR-002', fullName: 'Dr. Marcus Weber', email: 'marcus.weber@hospital.ch', role: 'Assigned', locationId: 'LOC-001', departmentId: 'DEP-002' }
    ] as AppUser[]
};

export const adminService = {
    init: () => {
        const rawLocations = localStorage.getItem(KEYS.LOCATIONS);
        const locations = rawLocations
            ? normalizeLocations(sanitizeLocations(JSON.parse(rawLocations) as Location[]))
            : normalizeLocations(SEED.LOCATIONS);
        localStorage.setItem(KEYS.LOCATIONS, JSON.stringify(locations));

        const validLocationIds = new Set(locations.map(l => l.id));

        const rawDepartments = localStorage.getItem(KEYS.DEPARTMENTS);
        const departments = normalizeDepartments(
            rawDepartments ? JSON.parse(rawDepartments) as Department[] : SEED.DEPARTMENTS,
            locations
        )
            .filter(d => validLocationIds.has(d.locationId));
        localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(departments));

        const validDepartmentIds = new Set(departments.map(d => d.id));

        const rawUsers = localStorage.getItem(KEYS.USERS);
        const users = (rawUsers ? JSON.parse(rawUsers) as AppUser[] : SEED.USERS)
            .filter(u => u.locationId !== 'LOC-002')
            .filter(u => validLocationIds.has(u.locationId))
            .map(u => ({
                ...u,
                departmentId: u.departmentId && validDepartmentIds.has(u.departmentId) ? u.departmentId : undefined
            }));
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    },

    // LOCATIONS
    getLocations: (): Location[] => {
        adminService.init();
        const locations = JSON.parse(localStorage.getItem(KEYS.LOCATIONS) || '[]') as Location[];
        const sanitized = normalizeLocations(sanitizeLocations(locations));
        if (JSON.stringify(sanitized) !== JSON.stringify(locations)) {
            localStorage.setItem(KEYS.LOCATIONS, JSON.stringify(sanitized));
        }
        return sanitized;
    },
    saveLocation: (loc: Location) => {
        const list = adminService.getLocations();
        const index = list.findIndex(l => l.id === loc.id);
        const isNew = index < 0;
        if (index >= 0) list[index] = loc;
        else list.push(loc);
        localStorage.setItem(KEYS.LOCATIONS, JSON.stringify(list));

        activityService.log({
            type: isNew ? 'LOCATION_CREATED' : 'LOCATION_UPDATED',
            message: isNew ? `Location ${loc.name} created` : `Location ${loc.name} updated`,
            entityType: 'Location',
            entityName: loc.name,
            location: loc.city
        });

        window.dispatchEvent(new Event('storage-admin'));
    },
    deleteLocation: (id: string) => {
        const deps = adminService.getDepartments().filter(d => d.locationId === id);
        if (deps.length > 0) throw new Error('Cannot delete location with existing departments. Remove departments first.');

        const users = adminService.getUsers().filter(u => u.locationId === id);
        if (users.length > 0) throw new Error('Cannot delete location with existing users. Remove users first.');

        const list = adminService.getLocations();
        const loc = list.find(l => l.id === id);
        const filtered = list.filter(l => l.id !== id);
        localStorage.setItem(KEYS.LOCATIONS, JSON.stringify(filtered));

        if (loc) {
            activityService.log({
                type: 'LOCATION_DELETED',
                message: `Location ${loc.name} deleted`,
                entityType: 'Location',
                entityName: loc.name,
                location: loc.city
            });
        }

        window.dispatchEvent(new Event('storage-admin'));
    },

    // DEPARTMENTS
    getDepartments: (): Department[] => {
        adminService.init();
        const deps = JSON.parse(localStorage.getItem(KEYS.DEPARTMENTS) || '[]') as Department[];
        const locs = adminService.getLocations();
        const validLocationIds = new Set(locs.map(l => l.id));
        return deps.map(d => ({
            ...d,
            locationName: locs.find(l => l.id === d.locationId)?.name || 'Unknown'
        })).filter(d => validLocationIds.has(d.locationId));
    },
    saveDepartment: (dep: Department) => {
        const list = JSON.parse(localStorage.getItem(KEYS.DEPARTMENTS) || '[]') as Department[];
        const index = list.findIndex(d => d.id === dep.id);
        const isNew = index < 0;
        // Remove derived fields for storage
        const { locationName, ...storeDep } = dep;
        if (index >= 0) list[index] = storeDep;
        else list.push(storeDep);
        localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(list));

        activityService.log({
            type: isNew ? 'DEPARTMENT_CREATED' : 'DEPARTMENT_UPDATED',
            message: isNew ? `Department ${dep.name} created` : `Department ${dep.name} updated`,
            entityType: 'Department',
            entityName: dep.name,
            location: dep.locationName,
            department: dep.name
        });

        window.dispatchEvent(new Event('storage-admin'));
    },
    deleteDepartment: (id: string) => {
        const users = adminService.getUsers().filter(u => u.departmentId === id);
        if (users.length > 0) throw new Error('Cannot delete department with existing users. Reassign users first.');

        const list = JSON.parse(localStorage.getItem(KEYS.DEPARTMENTS) || '[]') as Department[];
        const dep = list.find(d => d.id === id);
        const filtered = list.filter(d => d.id !== id);
        localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(filtered));

        if (dep) {
            activityService.log({
                type: 'DEPARTMENT_DELETED',
                message: `Department ${dep.name} deleted`,
                entityType: 'Department',
                entityName: dep.name,
                department: dep.name
            });
        }

        window.dispatchEvent(new Event('storage-admin'));
    },

    // USERS
    getUsers: (): AppUser[] => {
        adminService.init();
        const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]') as AppUser[];
        const locs = adminService.getLocations();
        const deps = adminService.getDepartments();
        const validLocationIds = new Set(locs.map(l => l.id));
        return users.map(u => ({
            ...u,
            locationName: locs.find(l => l.id === u.locationId)?.name || 'Unknown',
            departmentName: deps.find(d => d.id === u.departmentId)?.name || '-'
        })).filter(u => validLocationIds.has(u.locationId));
    },
    saveUser: (user: AppUser) => {
        const list = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]') as AppUser[];
        const index = list.findIndex(u => u.id === user.id);
        const isNew = index < 0;
        // Remove derived
        const { locationName, departmentName, ...storeUser } = user;
        if (index >= 0) list[index] = storeUser;
        else list.push(storeUser);
        localStorage.setItem(KEYS.USERS, JSON.stringify(list));

        activityService.log({
            type: isNew ? 'USER_ADDED' : 'USER_EDITED',
            message: isNew ? `User ${user.fullName} registered` : `User ${user.fullName} updated`,
            entityType: 'User',
            entityName: user.fullName,
            location: user.locationName,
            department: user.departmentName
        });

        window.dispatchEvent(new Event('storage-admin'));
    },
    deleteUser: (id: string) => {
        const list = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]') as AppUser[];
        const user = list.find(u => u.id === id);
        const filtered = list.filter(u => u.id !== id);
        localStorage.setItem(KEYS.USERS, JSON.stringify(filtered));

        if (user) {
            activityService.log({
                type: 'USER_DELETED',
                message: `User ${user.fullName} deleted`,
                entityType: 'User',
                entityName: user.fullName
            });
        }

        window.dispatchEvent(new Event('storage-admin'));
    },

    resetData: () => {
        localStorage.removeItem(KEYS.LOCATIONS);
        localStorage.removeItem(KEYS.DEPARTMENTS);
        localStorage.removeItem(KEYS.USERS);
        window.location.reload();
    }
};

