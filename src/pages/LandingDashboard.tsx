import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileCheck, Lightbulb, Bell, ClipboardList } from 'lucide-react';

const LandingDashboard: React.FC = () => {
    const navigate = useNavigate();

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Bell size={20} color="#78716C" style={{ cursor: 'pointer' }} />
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#5FAE9E',
                        cursor: 'pointer'
                    }}></div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: '#F9FAFB'
                    }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#E0E7FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#4F46E5'
                        }}>U</div>
                        <span style={{ fontSize: '14px', color: '#78716C' }}>User</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
                {/* Breadcrumb */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    color: '#78716C',
                    fontSize: '14px'
                }}>
                    <Home size={16} />
                    <span>Startseite</span>
                </div>

                {/* Three Tiles */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2rem',
                    marginBottom: '3rem'
                }}>
                    {/* PDCA Tile */}
                    <div className="card" style={{
                        padding: '2.5rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
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
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#F0F9FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5FAE9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '18px', fontWeight: 600, color: '#1C1917' }}>PDCA</h3>
                        <button
                            onClick={handlePDCAOpen}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#5FAE9E',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#4A9A8A';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#5FAE9E';
                            }}
                        >
                            Open
                        </button>
                    </div>

                    {/* Audit Tile */}
                    <div className="card" style={{
                        padding: '2.5rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
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
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#F0F9FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <FileCheck size={32} color="#5FAE9E" strokeWidth={2} />
                        </div>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '18px', fontWeight: 600, color: '#1C1917' }}>Audit</h3>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // No action - button is non-functional
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#5FAE9E',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'not-allowed',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Open
                        </button>
                    </div>

                    {/* Ideen Tile */}
                    <div className="card" style={{
                        padding: '2.5rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
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
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#F0F9FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <Lightbulb size={32} color="#5FAE9E" strokeWidth={2} />
                        </div>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '18px', fontWeight: 600, color: '#1C1917' }}>Ideen</h3>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // No action - button is non-functional
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#5FAE9E',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'not-allowed',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Open
                        </button>
                    </div>
                </div>

                {/* Bottom Panels */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Neuigkeiten */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{
                            margin: '0 0 1rem 0',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1C1917'
                        }}>Neuigkeiten</h3>
                        <p style={{
                            margin: 0,
                            color: '#78716C',
                            fontSize: '14px',
                            fontStyle: 'italic'
                        }}>Keine aktuellen Nachrichten.</p>
                    </div>

                    {/* Meine Aufgaben */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{
                            margin: '0 0 1rem 0',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1C1917'
                        }}>Meine Aufgaben</h3>
                        <p style={{
                            margin: 0,
                            color: '#78716C',
                            fontSize: '14px',
                            fontStyle: 'italic'
                        }}>Keine offenen Aufgaben.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingDashboard;
