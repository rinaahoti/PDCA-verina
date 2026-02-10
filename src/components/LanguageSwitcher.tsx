import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '6px 8px'
        }}>
            <Globe size={16} color="var(--color-text-muted)" />
            <button
                onClick={() => setLanguage('en')}
                style={{
                    background: language === 'en' ? '#b3d8d8' : 'transparent',
                    color: language === 'en' ? '#424b55' : 'var(--color-text-muted)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: language === 'en' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter, sans-serif'
                }}
            >
                EN
            </button>
            <div style={{
                width: '1px',
                height: '16px',
                background: 'var(--color-border)'
            }} />
            <button
                onClick={() => setLanguage('de')}
                style={{
                    background: language === 'de' ? '#b3d8d8' : 'transparent',
                    color: language === 'de' ? '#424b55' : 'var(--color-text-muted)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: language === 'de' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter, sans-serif'
                }}
            >
                DE
            </button>
        </div>
    );
};
