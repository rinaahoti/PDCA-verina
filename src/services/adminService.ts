import { Location, Department, AppUser } from '../types/admin';
import { activityService } from './activityService';

const KEYS = {
    LOCATIONS: 'mso_v6_locations',
    DEPARTMENTS: 'mso_v6_departments',
    USERS: 'mso_v6_users'
};

const SEED = {
    LOCATIONS: [
        { id: 'LOC-001', name: 'University Hospital Zurich (ZH)', city: 'Zurich', country: 'Switzerland', code: 'ZH' },
        { id: 'LOC-002', name: 'Geneva University Hospitals (GE)', city: 'Geneva', country: 'Switzerland', code: 'GE' },
        { id: 'LOC-003', name: 'Inselspital Bern (BE)', city: 'Bern', country: 'Switzerland', code: 'BE' },
        { id: 'LOC-004', name: 'University Hospital Basel (BS)', city: 'Basel', country: 'Switzerland', code: 'BS' },
        { id: 'LOC-005', name: 'CHUV Lausanne (VD)', city: 'Lausanne', country: 'Switzerland', code: 'VD' }
    ] as Location[],
    DEPARTMENTS: [
        { id: 'DEP-001', name: 'Quality & Patient Safety', locationId: 'LOC-001' },
        { id: 'DEP-002', name: 'Surgery Department', locationId: 'LOC-002' },
        { id: 'DEP-003', name: 'Main Pharmacy', locationId: 'LOC-003' },
        { id: 'DEP-004', name: 'Infectious Diseases', locationId: 'LOC-004' },
        { id: 'DEP-005', name: 'Emergency Medicine', locationId: 'LOC-005' }
    ] as Department[],
    USERS: [
        { id: 'USR-001', fullName: 'Dr. Elena Rossi', email: 'elena.rossi@hospital.ch', role: 'Owner', locationId: 'LOC-001', departmentId: 'DEP-001' },
        { id: 'USR-002', fullName: 'Dr. Marcus Weber', email: 'marcus.weber@hospital.ch', role: 'Assigned', locationId: 'LOC-002', departmentId: 'DEP-002' },
        { id: 'USR-003', fullName: 'Sarah Johnson (RN)', email: 'sarah.johnson@hospital.ch', role: 'Viewer', locationId: 'LOC-003', departmentId: 'DEP-003' }
    ] as AppUser[]
};

export const adminService = {
    init: () => {
        if (!localStorage.getItem(KEYS.LOCATIONS)) {
            localStorage.setItem(KEYS.LOCATIONS, JSON.stringify(SEED.LOCATIONS));
        }
        if (!localStorage.getItem(KEYS.DEPARTMENTS)) {
            localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(SEED.DEPARTMENTS));
        }
        if (!localStorage.getItem(KEYS.USERS)) {
            localStorage.setItem(KEYS.USERS, JSON.stringify(SEED.USERS));
        }
    },

    // LOCATIONS
    getLocations: (): Location[] => {
        adminService.init();
        return JSON.parse(localStorage.getItem(KEYS.LOCATIONS) || '[]');
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
        return deps.map(d => ({
            ...d,
            locationName: locs.find(l => l.id === d.locationId)?.name || 'Unknown'
        }));
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
        return users.map(u => ({
            ...u,
            locationName: locs.find(l => l.id === u.locationId)?.name || 'Unknown',
            departmentName: deps.find(d => d.id === u.departmentId)?.name || '-'
        }));
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
