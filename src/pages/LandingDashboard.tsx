import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const LandingDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handlePDCAOpen = () => {
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                height: '60px',
                background: 'white',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '18px', fontWeight: 600 }}>
                    <img src="/logoo.png" alt="VIRENA Logo" style={{ width: '32px', height: '32px', display: 'block' }} />
                    <span>VIRENA</span>
                </div>
                <LanguageSwitcher />
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '7rem 2rem 2rem 2rem', maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Three Tiles */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2.5rem',
                    width: '100%',
                    maxWidth: '1300px'
                }}>
                    {/* PDCA Tile */}
                    <div className="card" style={{
                        padding: '4.5rem 3.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        minHeight: '380px'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                    >
                        <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            background: '#F0F9FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '2rem'
                        }}>
                            <img src="/logo5.png" alt="PDCA Logo" style={{ width: '190px', height: '134px' }} />
                        </div>
                        <h3 style={{ margin: '0 0 2.5rem 0', fontSize: '24px', fontWeight: 600, color: '#1C1917' }}>{t('landing.pdca')}</h3>
                        <button
                            onClick={handlePDCAOpen}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: '#5eae9e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#5eae9e';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#5eae9e';
                            }}
                        >
                            {t('landing.open')}
                        </button>
                    </div>

                    {/* Audit Tile */}
                    <div className="card" style={{
                        padding: '4.5rem 3.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        minHeight: '380px'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                    >
                        <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            background: '#F0F9FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '2rem'
                        }}>
                            <img src="/logo6.png" alt="QM Logo" style={{ width: '180px', height: '120px', objectFit: 'contain' }} />
                        </div>
                        <h3 style={{ margin: '0 0 2.5rem 0', fontSize: '24px', fontWeight: 600, color: '#1C1917' }}>{t('landing.audit')}</h3>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // No action - button is non-functional
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: '#5eae9e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'not-allowed',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {t('landing.open')}
                        </button>
                    </div>

                    {/* Ideen Tile */}
                    <div className="card" style={{
                        padding: '4.5rem 3.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        minHeight: '380px'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                    >
                        <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            background: '#F0F9FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '2rem'
                        }}>
                            <img src="/logo8.png" alt="IDEEN Logo" style={{ width: '100px', height: '100px' }} />
                        </div>
                        <h3 style={{ margin: '0 0 2.5rem 0', fontSize: '24px', fontWeight: 600, color: '#1C1917' }}>{t('landing.ideen')}</h3>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // No action - button is non-functional
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: '#5eae9e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'not-allowed',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {t('landing.open')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingDashboard;
