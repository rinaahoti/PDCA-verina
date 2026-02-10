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
    const { t } = useLanguage();

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
                    <NavLink to="/app/cockpit" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <LayoutDashboard size={20} /> {t('nav.cockpit')}
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/lists" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <List size={20} /> {t('nav.lists')}
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/dashboard" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <PieChart size={20} /> {t('nav.dashboard')}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <LanguageSwitcher />
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.name}</div>
                            <div className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>{t('roles.' + user.role.toLowerCase())}</div>
                        </div>
                        <button className="btn btn-outline" onClick={() => { localStorage.removeItem('mso_v5_user'); window.location.href = '/login'; }}>
                            <LogOut size={16} /> {t('header.signOut')}
                        </button>
                    </div>
                </header>
                <div style={{ padding: '2rem' }}>{children}</div>
            </main>
        </div>
    );
};
