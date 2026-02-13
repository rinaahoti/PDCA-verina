import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, PieChart, HelpCircle, Plus, LogOut, ChevronRight, Menu, Shield, Building2, Settings, Bell, CheckCircle2, Activity, FileText } from 'lucide-react';
import { User, Topic } from '../types';
import { topicsService } from '../services';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface ShellProps {
    user: User;
    children: React.ReactNode;
}

export const AppShell: React.FC<ShellProps> = ({ user, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language, setLanguage } = useLanguage();

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src="/logoo.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '8px' }} />
                        <span style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-text)' }}>VIRENA</span>
                    </div>
                </div>

                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                    <button
                        className="btn w-full"
                        style={{ width: '100%', justifyContent: 'center', background: '#b3d8d8', color: '#424b55', border: 'none' }}
                        onClick={() => user.role !== 'DEMO' && navigate('/app/cockpit?mode=create')}
                        disabled={user.role === 'DEMO'}
                    >
                        <Plus size={18} /> {t('nav.new')}
                    </button>
                </div>

                <div style={{ padding: '1rem 1.75rem', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '1px', marginTop: '1rem' }}>{t('nav.pdcaManagement')}</div>
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <NavLink to="/app/dashboard" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <PieChart size={20} /> {t('nav.dashboard')}
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/lists" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <List size={20} /> {t('nav.lists')}
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/cockpit" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <LayoutDashboard size={20} /> {t('nav.cockpit')}
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>


                    <div style={{ padding: '1rem 1.75rem', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '1px', marginTop: '1rem', textTransform: 'uppercase' }}>{t('nav.administration')}</div>
                    <NavLink to="/app/admin" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Settings size={20} /> {t('nav.administration')}
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/activity-log" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Activity size={20} /> {t('nav.activityLog')}
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/templates-standards" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FileText size={20} /> {t('nav.templatesStandards')}
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}>
                    v5.0.1 Professional
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        {t('header.breadcrumb')}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        background: 'white',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '12px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                        {/* Language Switcher */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748B'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                </svg>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => setLanguage('en')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '4px 2px',
                                        fontSize: '14px',
                                        fontWeight: language === 'en' ? 700 : 400,
                                        color: language === 'en' ? '#3e4c5a' : '#94a3b8',
                                        borderBottom: language === 'en' ? '2px solid #5FAE9E' : '2px solid transparent',
                                        cursor: 'pointer',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('de')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '4px 2px',
                                        fontSize: '14px',
                                        fontWeight: language === 'de' ? 700 : 400,
                                        color: language === 'de' ? '#3e4c5a' : '#94a3b8',
                                        borderBottom: language === 'de' ? '2px solid #5FAE9E' : '2px solid transparent',
                                        cursor: 'pointer',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                >
                                    DE
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '24px', background: '#E2E8F0' }}></div>

                        {/* User Profile */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#5FAE9E',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: 700,
                                boxShadow: '0 4px 6px -1px rgba(95, 174, 158, 0.3)'
                            }}>
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155', lineHeight: '1.2' }}>{user.name}</span>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#424b55', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{user.role}</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '24px', background: '#E2E8F0' }}></div>

                        {/* Logout */}
                        <button
                            onClick={() => { localStorage.removeItem('mso_v5_user'); window.location.href = '/login'; }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#64748B',
                                fontSize: '14px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'none'; }}
                        >
                            <LogOut size={16} />
                            {t('header.signOut')}
                        </button>
                    </div>
                </header>
                <div style={{ padding: '2rem' }}>{children}</div>
            </main>
        </div>
    );
};
