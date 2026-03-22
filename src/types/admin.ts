export interface Location {
    id: string;
    name: string;
    city?: string;
    country?: string;
    code?: string;
}

export interface Department {
    id: string;
    name: string;
    locationId: string;
    address?: string;
}

export interface AppUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: 'Admin' | 'Owner' | 'Assigned' | 'Viewer';
    locationId: string;
    departmentId: string;
    // Legacy compatibility for old UI code that still reads fullName.
    fullName?: string;
}

export interface AdminData {
    locations: Location[];
    departments: Department[];
    users: AppUser[];
}
