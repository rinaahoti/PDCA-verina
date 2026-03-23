import React from 'react';
import { Department, Location } from '../../../types/admin';
import { useLanguage } from '../../../contexts/LanguageContext';

interface DepartmentModalProps {
    isOpen: boolean;
    editingDepartmentId: string | null;
    editingDep: Partial<Department>;
    depFormCode: string;
    locations: Location[];
    isLocationLocked: boolean;
    departmentFormError: string;
    usersCountInDepartment: number;
    getTranslatedLocationName: (name: string) => string;
    getTranslatedDepartmentName?: (name: string) => string;
    onChangeDep: (next: Partial<Department>) => void;
    onChangeDepCode: (value: string) => void;
    onClose: () => void;
    onSave: () => void;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
    isOpen,
    editingDepartmentId,
    editingDep,
    depFormCode,
    locations,
    isLocationLocked,
    departmentFormError,
    usersCountInDepartment,
    getTranslatedLocationName,
    getTranslatedDepartmentName,
    onChangeDep,
    onChangeDepCode,
    onClose,
    onSave
}) => {
    const { t, language } = useLanguage();
    const translateDepartmentName = (name: string) => getTranslatedDepartmentName ? getTranslatedDepartmentName(name) : name;

    if (!isOpen) return null;
    const isLocationFixed = isLocationLocked && !editingDepartmentId;
    const selectedLocation = locations.find(loc => loc.id === editingDep.locationId);
    const selectedLocationLabel = selectedLocation
        ? `${selectedLocation.code ? `${selectedLocation.code} - ` : ''}${getTranslatedLocationName(selectedLocation.name)}`
        : '';

    return (
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
                    onClose();
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
                    {editingDepartmentId ? t('admin.editDepartment') : t('admin.addDepartment')}
                </div>
                <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>
                    {editingDepartmentId ? t('admin.updateDepartmentDetails') : t('admin.assignDepartmentToLocation')}
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                        {t('common.location')}
                    </label>
                    {isLocationFixed ? (
                        <input
                            value={selectedLocationLabel}
                            readOnly
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
                    ) : (
                        <select
                            value={editingDep.locationId || ''}
                            onChange={e => onChangeDep({ ...editingDep, locationId: e.target.value })}
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
                    )}
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                        {t('admin.departmentName')}
                    </label>
                    <input
                        value={language === 'de' ? translateDepartmentName(editingDep.name || '') : (editingDep.name || '')}
                        onChange={e => onChangeDep({ ...editingDep, name: e.target.value })}
                        placeholder={t('admin.departmentPlaceholder')}
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
                        {t('common.code')}
                    </label>
                    <input
                        value={depFormCode}
                        onChange={e => onChangeDepCode(e.target.value)}
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

                {editingDepartmentId && (
                    <div style={{ marginBottom: '14px', fontSize: '12px', color: '#6b8583' }}>
                        {language === 'de' ? 'Benutzer in dieser Abteilung' : 'Users in this department'}: <strong style={{ color: '#1a2e2d' }}>{usersCountInDepartment}</strong>
                    </div>
                )}

                {departmentFormError && (
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#dc2626' }}>{departmentFormError}</div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button
                        onClick={onClose}
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
                        onClick={onSave}
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
                        {t('admin.saveDepartment')}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DepartmentDeleteDialogProps {
    target: Department | null;
    usersCount?: number;
    getTranslatedDepartmentName?: (name: string) => string;
    onCancel: () => void;
    onConfirm: () => void;
}

export const DepartmentDeleteDialog: React.FC<DepartmentDeleteDialogProps> = ({
    target,
    usersCount,
    getTranslatedDepartmentName,
    onCancel,
    onConfirm
}) => {
    const { t, language } = useLanguage();
    const translateDepartmentName = (name: string) => getTranslatedDepartmentName ? getTranslatedDepartmentName(name) : name;
    if (!target) return null;

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
                    boxShadow: '0 20px 60px rgba(0,0,0,.15)'
                }}
            >
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>
                    {language === 'de' ? 'Abteilung löschen?' : 'Delete Department?'}
                </div>
                <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '18px', lineHeight: 1.45 }}>
                    {language === 'de'
                        ? 'Möchten Sie wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
                        : 'Do you want to delete? This action cannot be undone.'}
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                        {language === 'de' ? 'Abteilung' : t('admin.departmentName')}
                    </label>
                    <div style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px', color: '#1a2e2d', fontWeight: 500 }}>
                        {translateDepartmentName(target.name)}
                    </div>
                </div>
                <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>
                        {language === 'de' ? 'Betroffene Benutzer' : 'Affected Users'}
                    </label>
                    <div style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#f2f9f8', fontSize: '14px', color: '#1a2e2d', fontWeight: 500 }}>
                        {usersCount ?? 0}
                    </div>
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
                        {language === 'de' ? 'Nein' : 'No'}
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
                        {language === 'de' ? 'Ja' : 'Yes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
