import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService';
import { AdminData, AppUser, Department, Location } from '../types/admin';

export const useAdminDataStore = () => {
    const [adminData, setAdminData] = useState<AdminData>(() => adminService.loadAdminData());

    useEffect(() => {
        const handleUpdate = () => setAdminData(adminService.loadAdminData());
        window.addEventListener('storage-admin', handleUpdate);
        return () => window.removeEventListener('storage-admin', handleUpdate);
    }, []);

    const saveLocation = useCallback((location: Location) => {
        const next = adminService.saveLocation(location);
        setAdminData(next);
        return next;
    }, []);

    const deleteLocation = useCallback((locationId: string) => {
        const next = adminService.deleteLocation(locationId);
        setAdminData(next);
        return next;
    }, []);

    const saveDepartment = useCallback((department: Department) => {
        const next = adminService.saveDepartment(department);
        setAdminData(next);
        return next;
    }, []);

    const deleteDepartment = useCallback((departmentId: string) => {
        const next = adminService.deleteDepartment(departmentId);
        setAdminData(next);
        return next;
    }, []);

    const saveUser = useCallback((user: AppUser) => {
        const next = adminService.saveUser(user);
        setAdminData(next);
        return next;
    }, []);

    const deleteUser = useCallback((userId: string) => {
        const next = adminService.deleteUser(userId);
        setAdminData(next);
        return next;
    }, []);

    const restoreDefaults = useCallback(() => {
        const next = adminService.resetAdminData();
        setAdminData(next);
        return next;
    }, []);

    const dependencyApi = useMemo(
        () => ({
            getLocationDependencies: adminService.getLocationDependencies,
            getDepartmentDependencies: adminService.getDepartmentDependencies
        }),
        []
    );

    return {
        adminData,
        setAdminData,
        saveLocation,
        deleteLocation,
        saveDepartment,
        deleteDepartment,
        saveUser,
        deleteUser,
        restoreDefaults,
        ...dependencyApi
    };
};
