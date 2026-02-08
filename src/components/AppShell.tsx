import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, PieChart, HelpCircle, Plus, LogOut, ChevronRight, Menu, Shield, Building2, Settings, Bell, CheckCircle2, Activity, FileText } from 'lucide-react';
import { User, Topic } from '../types';
import { topicsService } from '../services';

interface ShellProps {
    user: User;
    children: React.ReactNode;
}

export const AppShell: React.FC<ShellProps> = ({ user, children }) => {
    const navigate = useNavigate();
    const location = useLocation();

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
                        style={{ width: '100%', justifyContent: 'center', background: '#cbeee2', color: '#5FAE9E', border: 'none' }}
                        onClick={() => user.role !== 'DEMO' && navigate('/app/cockpit?mode=create')}
                        disabled={user.role === 'DEMO'}
                    >
                        <Plus size={18} /> New
                    </button>
                </div>

                <div style={{ padding: '1rem 1.75rem', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '1px', marginTop: '1rem' }}>PDCA MANAGEMENT</div>
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <NavLink to="/app/cockpit" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <LayoutDashboard size={20} /> Cockpit
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/lists" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <List size={20} /> Lists
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/dashboard" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <PieChart size={20} /> Dashboard
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>


                    <div style={{ padding: '1rem 1.75rem', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '1px', marginTop: '1rem', textTransform: 'uppercase' }}>Administration</div>
                    <NavLink to="/app/admin" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Settings size={20} /> Administration
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/activity-log" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Activity size={20} /> Activity Log
                        </div>
                        <ChevronRight size={14} className="nav-chevron" />
                    </NavLink>
                    <NavLink to="/app/templates-standards" className={({ isActive }) => isActive ? 'active-nav' : ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FileText size={20} /> Templates & Standards
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
                        Healthcare Governance / Clinical Improvement / <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>Quality Portal</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.name}</div>
                            <div className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>{user.role}</div>
                        </div>
                        <button className="btn btn-outline" onClick={() => { localStorage.removeItem('mso_v5_user'); window.location.href = '/login'; }}>
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </header>
                <div style={{ padding: '2rem' }}>{children}</div>
            </main>
        </div>
    );
};
