import React from 'react';
import { AppUser, Department, Location } from '../../../types/admin';

interface UserFormState {
    name: string;
    email: string;
    locationId: string;
    departmentId: string;
    role: AppUser['role'];
}

interface TransferFormState {
    locationId: string;
    departmentId: string;
    role: AppUser['role'];
}

interface AddEditUserModalProps {
    isOpen: boolean;
    editingUserId: string | null;
    userForm: UserFormState;
    userFormError: string;
    locations: Location[];
    departments: Department[];
    getTranslatedLocationName: (name: string) => string;
    getTranslatedDepartmentName: (name: string) => string;
    onChangeUserForm: (next: UserFormState) => void;
    onClose: () => void;
    onSave: () => void;
}

export const AddEditUserModal: React.FC<AddEditUserModalProps> = ({
    isOpen,
    editingUserId,
    userForm,
    userFormError,
    locations,
    departments,
    getTranslatedLocationName,
    getTranslatedDepartmentName,
    onChangeUserForm,
    onClose,
    onSave
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,45,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'urSlideUp .2s ease' }}>
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>{editingUserId ? 'Edit User' : 'Add User'}</div>
                <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>{editingUserId ? 'Update user details and role' : 'Assign a user to a location and role'}</div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Full Name</label>
                    <input value={userForm.name} onChange={(e) => onChangeUserForm({ ...userForm, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Email</label>
                    <input type="email" value={userForm.email} onChange={(e) => onChangeUserForm({ ...userForm, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Location</label>
                        <select
                            value={userForm.locationId}
                            onChange={(e) => {
                                const nextLoc = e.target.value;
                                const nextDeps = departments.filter(dep => dep.locationId === nextLoc);
                                onChangeUserForm({ ...userForm, locationId: nextLoc, departmentId: nextDeps[0]?.id || '' });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}
                        >
                            <option value="">Select location</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} - ` : ''}{getTranslatedLocationName(l.name).replace(/ \([A-Z]+\)$/, '')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Department</label>
                        <select value={userForm.departmentId} onChange={(e) => onChangeUserForm({ ...userForm, departmentId: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                            <option value="">Select department</option>
                            {departments.filter(dep => dep.locationId === userForm.locationId).map(dep => <option key={dep.id} value={dep.id}>{getTranslatedDepartmentName(dep.name)}</option>)}
                        </select>
                    </div>
                </div>
                {userFormError && (
                    <div style={{ marginBottom: '12px', fontSize: '12px', color: '#dc2626' }}>{userFormError}</div>
                )}
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Role</label>
                    <select value={userForm.role} onChange={(e) => onChangeUserForm({ ...userForm, role: e.target.value as AppUser['role'] })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                        <option value="Admin">Admin</option>
                        <option value="Owner">Owner</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Viewer">Viewer</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', fontSize: '14px', fontWeight: 500 }}>Cancel</button>
                    <button onClick={onSave} style={{ padding: '9px 22px', border: 'none', borderRadius: '8px', background: '#5ba8a0', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>Save User</button>
                </div>
            </div>
        </div>
    );
};

interface TransferUserModalProps {
    isOpen: boolean;
    transferUserId: string | null;
    transferForm: TransferFormState;
    transferFormError: string;
    users: AppUser[];
    locations: Location[];
    departments: Department[];
    getTranslatedLocationName: (name: string) => string;
    getTranslatedDepartmentName: (name: string) => string;
    onChangeTransferForm: (next: TransferFormState) => void;
    onClose: () => void;
    onSave: () => void;
}

export const TransferUserModal: React.FC<TransferUserModalProps> = ({
    isOpen,
    transferUserId,
    transferForm,
    transferFormError,
    users,
    locations,
    departments,
    getTranslatedLocationName,
    getTranslatedDepartmentName,
    onChangeTransferForm,
    onClose,
    onSave
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,45,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'urSlideUp .2s ease' }}>
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>Transfer User</div>
                <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>{transferUserId ? `Transferring: ${users.find(u => u.id === transferUserId)?.name || ''}` : 'Move to a different location'}</div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>New Location</label>
                    <select value={transferForm.locationId} onChange={(e) => { const nextLoc = e.target.value; const nextDeps = departments.filter(dep => dep.locationId === nextLoc); onChangeTransferForm({ ...transferForm, locationId: nextLoc, departmentId: nextDeps[0]?.id || '' }); }} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} - ` : ''}{getTranslatedLocationName(l.name).replace(/ \([A-Z]+\)$/, '')}</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>New Department</label>
                    <select value={transferForm.departmentId} onChange={(e) => onChangeTransferForm({ ...transferForm, departmentId: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                        <option value="">Select department</option>
                        {departments.filter(dep => dep.locationId === transferForm.locationId).map(dep => <option key={dep.id} value={dep.id}>{getTranslatedDepartmentName(dep.name)}</option>)}
                    </select>
                </div>
                {transferFormError && (
                    <div style={{ marginBottom: '12px', fontSize: '12px', color: '#dc2626' }}>{transferFormError}</div>
                )}
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>Role</label>
                    <select value={transferForm.role} onChange={(e) => onChangeTransferForm({ ...transferForm, role: e.target.value as AppUser['role'] })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                        <option value="Admin">Admin</option>
                        <option value="Owner">Owner</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Viewer">Viewer</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', fontSize: '14px', fontWeight: 500 }}>Cancel</button>
                    <button onClick={onSave} style={{ padding: '9px 22px', border: 'none', borderRadius: '8px', background: '#5ba8a0', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>Transfer</button>
                </div>
            </div>
        </div>
    );
};

interface UserProfileModalProps {
    isOpen: boolean;
    profileUserId: string | null;
    users: AppUser[];
    locations: Location[];
    roleBadgeStyle: (role: AppUser['role']) => React.CSSProperties;
    getUserDepartmentName: (user: AppUser) => string;
    getTranslatedLocationName: (name: string) => string;
    onClose: () => void;
    onEditUser: (user: AppUser) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
    isOpen,
    profileUserId,
    users,
    locations,
    roleBadgeStyle,
    getUserDepartmentName,
    getTranslatedLocationName,
    onClose,
    onEditUser
}) => {
    if (!isOpen) return null;

    const user = users.find(u => u.id === profileUserId);
    if (!user) return null;

    const loc = locations.find(l => l.id === user.locationId);
    const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,45,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'urSlideUp .2s ease' }}>
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '16px' }}>User Profile</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#5ba8a0', color: '#ffffff', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700 }}>{user.name}</div>
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
                    <button onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', fontSize: '14px', fontWeight: 500 }}>Close</button>
                    <button onClick={() => onEditUser(user)} style={{ padding: '9px 22px', border: 'none', borderRadius: '8px', background: '#5ba8a0', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>Edit User</button>
                </div>
            </div>
        </div>
    );
};
