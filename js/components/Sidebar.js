import { store } from '../data.js';

export const Sidebar = () => {
    const user = store.getCurrentUser();
    const isAdmin = user && (user.role === 'admin' || user.role === 'client_admin');

    return `
        <div class="sidebar">
            <div style="padding: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 32px; height: 32px; background: var(--color-primary); border-radius: 6px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">M</div>
                <span style="font-weight: 700; font-size: 1.1rem; color: var(--color-primary);">MSO Maestro</span>
            </div>

            <div style="padding: 0 1.5rem 1rem 1.5rem;">
                <button id="btn-create-new" class="btn btn-primary w-full" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <i data-lucide="plus"></i> Neu
                </button>
            </div>

            <nav style="flex: 1;">
                <a href="#cockpit" class="nav-item active">
                    <i data-lucide="layout-dashboard" class="nav-icon"></i> Cockpit
                </a>
                <a href="#measures" class="nav-item">
                    <i data-lucide="list" class="nav-icon"></i> Lists
                </a>
                <a href="#dashboard" class="nav-item">
                    <i data-lucide="pie-chart" class="nav-icon"></i> Dashboard
                </a>
                
                ${isAdmin ? `
                <div style="margin-top: 1rem; padding: 0 1.5rem; font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600;">System</div>
                <a href="#admin" class="nav-item">
                    <i data-lucide="settings" class="nav-icon"></i> Administration
                </a>
                ` : ''}

                <a href="#help" class="nav-item">
                    <i data-lucide="help-circle" class="nav-icon"></i> Help / Support
                </a>
            </nav>
            
            <div style="padding: 1rem; border-top: 1px solid var(--color-border); font-size: 11px; color: var(--color-text-muted);">
                v5.0.1 Prototype <br>
                User: ${user ? user.name : 'Guest'}
            </div>
        </div>
    `;
};
