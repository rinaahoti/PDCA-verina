import React from 'react';
import { Location } from '../../../types/admin';
import { useLanguage } from '../../../contexts/LanguageContext';

interface LocationModalProps {
    isOpen: boolean;
    editingLoc: Partial<Location>;
    locationFormError: string;
    onChange: (next: Partial<Location>) => void;
    onClose: () => void;
    onSave: () => void;
}

const fieldStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #ddecea',
    borderRadius: '8px',
    outline: 'none',
    color: '#1a2e2d',
    background: '#f2f9f8',
    transition: 'all .2s'
};

export const LocationModal: React.FC<LocationModalProps> = ({
    isOpen,
    editingLoc,
    locationFormError,
    onChange,
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
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', width: '440px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'urSlideUp .2s ease' }}>
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>{editingLoc.id ? t('admin.editLocation') : t('admin.addLocation')}</div>
                <div style={{ fontSize: '13px', color: '#6b8583', marginBottom: '20px' }}>{editingLoc.id ? t('admin.updateLocationDetails') : t('admin.fillLocationDetails')}</div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('admin.locationName')}</label>
                    <input
                        value={editingLoc.name || ''}
                        onChange={e => onChange({ ...editingLoc, name: e.target.value })}
                        placeholder={t('admin.locationPlaceholder')}
                        style={fieldStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#5ba8a0';
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,168,160,0.12)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#ddecea';
                            e.currentTarget.style.background = '#f2f9f8';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('common.city')}</label>
                    <input
                        value={editingLoc.city || ''}
                        onChange={e => onChange({ ...editingLoc, city: e.target.value })}
                        placeholder={t('admin.cityPlaceholder')}
                        style={fieldStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#5ba8a0';
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,168,160,0.12)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#ddecea';
                            e.currentTarget.style.background = '#f2f9f8';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b8583', marginBottom: '6px', display: 'block' }}>{t('common.country')}</label>
                    <input
                        value={editingLoc.country || ''}
                        onChange={e => onChange({ ...editingLoc, country: e.target.value })}
                        placeholder={t('admin.countryPlaceholder')}
                        style={fieldStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#5ba8a0';
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,168,160,0.12)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#ddecea';
                            e.currentTarget.style.background = '#f2f9f8';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {locationFormError && (
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#dc2626' }}>{locationFormError}</div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, padding: '9px 18px', border: '1.5px solid #ddecea', borderRadius: '8px', background: '#ffffff', color: '#6b8583', cursor: 'pointer' }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onSave}
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, padding: '9px 22px', background: '#5ba8a0', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#3d8880';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#5ba8a0';
                        }}
                    >
                        {t('admin.saveLocation')}
                    </button>
                </div>
            </div>
        </div>
    );
};


