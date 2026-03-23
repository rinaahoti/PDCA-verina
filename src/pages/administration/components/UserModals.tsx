import React from 'react';
import { AppUser, Department, Location } from '../../../types/admin';
import { useLanguage } from '../../../contexts/LanguageContext';

export interface UserFormState {
    name: string;
    email: string;
    password: string;
    locationId: string;
    departmentId: string;
    role: AppUser['role'];
}

export interface TransferFormState {
    locationId: string;
    departmentId: string;
    role: AppUser['role'];
}

interface AddEditUserModalProps {
    isOpen: boolean;
    editingUserId: string | null;
    hideDepartmentField?: boolean;
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
    hideDepartmentField = false,
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
    const { t } = useLanguage();

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
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>{editingUserId ? t('admin.editUser') : t('admin.addUser')}</div>
                <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>{editingUserId ? t('admin.updateUserDetailsAndRole') : t('admin.assignUserToLocationAndRole')}</div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('admin.fullName')}</label>
                    <input value={userForm.name} onChange={(e) => onChangeUserForm({ ...userForm, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('admin.email')}</label>
                    <input type="email" value={userForm.email} onChange={(e) => onChangeUserForm({ ...userForm, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }} />
                </div>
                {!editingUserId && (
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('auth.password')}</label>
                        <input type="password" value={userForm.password} onChange={(e) => onChangeUserForm({ ...userForm, password: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }} />
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: hideDepartmentField ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('common.location')}</label>
                        <select
                            value={userForm.locationId}
                            onChange={(e) => {
                                const nextLoc = e.target.value;
                                const nextDeps = departments.filter(dep => dep.locationId === nextLoc);
                                onChangeUserForm({ 
                                    ...userForm, 
                                    locationId: nextLoc, 
                                    departmentId: nextDeps[0]?.id || '' 
                                });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}
                        >
                            <option value="">{t('admin.selectLocation')}</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.code ? `${l.code} - ` : ''}{getTranslatedLocationName(l.name).replace(/ \([A-Z]+\)$/, '')}</option>)}
                        </select>
                    </div>
                    {!hideDepartmentField && (
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('common.department')}</label>
                        <select value={userForm.departmentId} onChange={(e) => onChangeUserForm({ ...userForm, departmentId: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                            <option value="">{t('admin.selectDepartment')}</option>
                            {departments.filter(dep => dep.locationId === userForm.locationId).map(dep => <option key={dep.id} value={dep.id}>{getTranslatedDepartmentName(dep.name)}</option>)}
                        </select>
                    </div>
                    )}
                </div>
                {userFormError && (
                    <div style={{ marginBottom: '12px', fontSize: '12px', color: '#dc2626' }}>{userFormError}</div>
                )}
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('common.role')}</label>
                    <select value={userForm.role} onChange={(e) => onChangeUserForm({ ...userForm, role: e.target.value as AppUser['role'] })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px' }}>
                        <option value="Admin">Admin</option>
                        <option value="Owner">Owner</option>
                        <option value="Assigned">{t('admin.assigned')}</option>
                        <option value="Viewer">Viewer</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', fontSize: '14px', fontWeight: 500 }}>{t('common.cancel')}</button>
                    <button onClick={onSave} style={{ padding: '9px 22px', border: 'none', borderRadius: '8px', background: '#5ba8a0', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>{t('admin.saveUser')}</button>
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
    getUserDepartmentName: (user: AppUser) => string;
    getTranslatedLocationName: (name: string) => string;
    roleBadgeStyle?: (role: AppUser['role']) => React.CSSProperties;
    onClose: () => void;
    onEditUser: (user: AppUser) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
    isOpen,
    profileUserId,
    users,
    locations,
    getUserDepartmentName,
    getTranslatedLocationName,
    onClose,
    onEditUser
}) => {
    const { t } = useLanguage();

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
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '16px' }}>{t('admin.userProfile')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#5ba8a0', color: '#ffffff', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700 }}>{user.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b8583', fontFamily: 'DM Mono, monospace' }}>{user.email}</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: '#f2f9f8', borderRadius: '8px', padding: '12px 14px' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', fontWeight: 600, marginBottom: '4px' }}>{t('common.role')}</div><div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{t(`roles.${user.role.toLowerCase()}`)}</div></div>
                    <div style={{ background: '#f2f9f8', borderRadius: '8px', padding: '12px 14px' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', fontWeight: 600, marginBottom: '4px' }}>{t('common.location')}</div><div style={{ fontSize: '14px', fontWeight: 500 }}>{loc?.code || '-'}</div></div>
                    <div style={{ background: '#f2f9f8', borderRadius: '8px', padding: '12px 14px' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', fontWeight: 600, marginBottom: '4px' }}>{t('common.department')}</div><div style={{ fontSize: '14px', fontWeight: 500 }}>{getUserDepartmentName(user)}</div></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', fontSize: '14px', fontWeight: 500 }}>{t('common.close')}</button>
                    <button onClick={() => onEditUser(user)} style={{ padding: '9px 22px', border: 'none', borderRadius: '8px', background: '#5ba8a0', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>{t('admin.editUser')}</button>
                </div>
            </div>
        </div>
    );
};

interface UserDeleteDialogProps {
    targetUsers: AppUser[];
    departments: Department[];
    getTranslatedDepartmentName: (name: string) => string;
    onCancel: () => void;
    onConfirm: () => void;
}

export const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
    targetUsers,
    departments,
    getTranslatedDepartmentName,
    onCancel,
    onConfirm
}) => {
    const { t, language } = useLanguage();

    if (targetUsers.length === 0) return null;

    const isMultiple = targetUsers.length > 1;
    const firstUser = targetUsers[0];
    const firstDepartment = departments.find(dep => dep.id === firstUser.departmentId);

    return (
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
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '28px',
                    width: '460px',
                    maxWidth: '95vw',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    animation: 'urSlideUp .2s ease'
                }}
            >
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>
                    {language === 'de' ? 'Benutzer löschen' : 'Delete User'}
                </div>
                <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '18px', lineHeight: 1.45 }}>
                    {isMultiple
                        ? (language === 'de'
                            ? `Diese ${targetUsers.length} Benutzer werden entfernt.`
                            : `These ${targetUsers.length} users will be removed.`)
                        : (language === 'de'
                            ? 'Dieser Benutzer wird entfernt.'
                            : 'This user will be removed.')}
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                        {t('admin.fullName')}
                    </label>
                    {isMultiple ? (
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {targetUsers.map(user => {
                                const department = departments.find(dep => dep.id === user.departmentId);
                                return (
                                    <div key={user.id} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a2e2d' }}>{user.name}</div>
                                            <div style={{ fontSize: '12px', color: '#6b8583' }}>{user.email}</div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b8583', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {department ? getTranslatedDepartmentName(department.name) : '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a2e2d' }}>{firstUser.name}</div>
                            <div style={{ fontSize: '13px', color: '#6b8583' }}>{firstUser.email}</div>
                            <div style={{ fontSize: '12px', color: '#6b8583' }}>
                                {firstDepartment ? getTranslatedDepartmentName(firstDepartment.name) : t('common.department')}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
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
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            padding: '9px 22px',
                            border: 'none',
                            borderRadius: '8px',
                            background: '#5ba8a0',
                            color: '#ffffff',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#3d8880';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#5ba8a0';
                        }}
                    >
                        {t('common.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};
