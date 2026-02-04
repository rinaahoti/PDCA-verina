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
    locationName?: string; // Helpful for display
}

export interface AppUser {
    id: string;
    fullName: string;
    email: string;
    role: 'Admin' | 'Owner' | 'Assigned' | 'Viewer';
    locationId: string;
    departmentId?: string;
    locationName?: string;
    departmentName?: string;
}
