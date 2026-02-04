export const Topbar = (user) => {
    return `
        <div class="top-bar">
            <!-- Breadcrumb or Title -->
            <div id="page-title" style="font-weight: 600; font-size: 1.1rem;">Cockpit</div>

            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="position: relative;">
                    <i data-lucide="search" style="position: absolute; left: 10px; top: 8px; width: 16px; color: #9ca3af;"></i>
                    <input type="text" placeholder="Global Search (AND/OR)..." 
                        class="input-base" 
                        style="padding-left: 32px; width: 300px; background: #f9fafb;">
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" id="user-menu">
                    <div style="width: 32px; height: 32px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                        ${user ? user.avatar : '?'}
                    </div>
                    <div style="font-size: 13px;">
                        <div style="font-weight: 600;">${user ? user.name : 'Guest'}</div>
                        <div style="color: var(--color-text-muted); font-size: 11px;">${user ? user.role.toUpperCase() : 'Guest'}</div>
                    </div>
                    <i data-lucide="chevron-down" style="width: 14px; color: #6b7280;"></i>
                </div>
                
                <button id="btn-logout" class="btn btn-outline btn-sm">Logout</button>
            </div>
        </div>
    `;
};
