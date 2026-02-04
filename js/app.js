import { store } from './data.js';
import { Utils } from './utils.js';
import { Sidebar } from './components/Sidebar.js';
import { Topbar } from './components/Topbar.js';
import { Cockpit } from './pages/Cockpit.js';
import { Measure } from './pages/Measure.js';
import { Login } from './pages/Login.js';

class App {
    constructor() {
        this.appEl = document.getElementById('app');
        this.currentUser = store.getCurrentUser();
        window.navigate = (hash) => {
            window.location.hash = hash;
        };
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Initial load
    }

    handleRoute() {
        const hash = window.location.hash || '#';
        this.currentUser = store.getCurrentUser();

        // Auth Guard
        if (!this.currentUser && hash !== '#login') {
            this.renderLogin();
            return;
        }

        if (this.currentUser && (hash === '#login' || hash === '#')) {
            window.location.hash = '#cockpit';
            return;
        }

        // Render Shell + Page
        this.renderShell();

        const contentEl = document.getElementById('page-content');
        if (!contentEl) return;

        if (hash.startsWith('#cockpit')) {
            contentEl.innerHTML = Cockpit();
        } else if (hash.startsWith('#measure/')) {
            const id = hash.split('/')[1];
            contentEl.innerHTML = Measure(id);
        } else if (hash.startsWith('#admin')) {
            contentEl.innerHTML = '<div class="card p-4"><h1>Administration</h1><p>User Management & System Settings module placeholder.</p></div>';
        } else {
            contentEl.innerHTML = Cockpit(); // Default
        }

        // Re-init icons
        if (window.lucide) window.lucide.createIcons();
        this.attachGlobalListeners();
    }

    renderLogin() {
        this.appEl.innerHTML = Login();
        if (window.lucide) window.lucide.createIcons();
    }

    renderShell() {
        // Only render shell if not already there
        if (!document.getElementById('shell-container')) {
            this.appEl.innerHTML = `
                <div class="app-container" id="shell-container">
                    ${Sidebar()}
                    <div class="main-content">
                        ${Topbar(this.currentUser)}
                        <div id="page-content" class="page-content"></div>
                    </div>
                </div>
                <!-- Global Modals -->
                <div id="modal-root" class="hidden"></div>
            `;
        } else {
            // If shell exists, just update user in Topbar if needed? 
            // Ideally we re-render Topbar but for now assume static user per session.
        }
    }

    attachGlobalListeners() {
        const btnCreate = document.getElementById('btn-create-new');
        if (btnCreate) {
            btnCreate.onclick = () => this.openCreateModal();
        }
    }

    openCreateModal() {
        const modalRoot = document.getElementById('modal-root');
        const templates = store.getTemplates();

        modalRoot.classList.remove('hidden');
        modalRoot.innerHTML = `
            <div class="modal-overlay" onclick="document.getElementById('modal-root').classList.add('hidden')">
                <div class="modal-container" onclick="event.stopPropagation()">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                        <h2 style="margin:0;">Initiating Work</h2>
                        <button onclick="document.getElementById('modal-root').classList.add('hidden')" style="background:none; border:none; cursor:pointer;">X</button>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display:block; margin-bottom: 0.5rem; font-weight:600;">1. Select Template</label>
                        <select id="new-template" class="input-base" style="width:100%;">
                            ${templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                        </select>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                         <label style="display:block; margin-bottom: 0.5rem; font-weight:600;">2. Title / Subject</label>
                         <input type="text" id="new-title" class="input-base" placeholder="Enter title...">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                         <label style="display:block; margin-bottom: 0.5rem; font-weight:600;">3. Due Date</label>
                         <input type="date" id="new-date" class="input-base">
                    </div>

                    <div style="text-align: right;">
                        <button class="btn btn-outline" onclick="document.getElementById('modal-root').classList.add('hidden')">Cancel</button>
                        <button class="btn btn-primary" onclick="window.submitCreate()">Start Workflow</button>
                    </div>
                </div>
            </div>
        `;

        window.submitCreate = () => {
            const templateId = document.getElementById('new-template').value;
            const title = document.getElementById('new-title').value;
            const dueDate = document.getElementById('new-date').value;

            if (!title) return alert('Title is required');

            const newMeasure = store.createMeasure({
                title,
                templateId,
                dueDate,
                status: 'Plan',
                ownerId: this.currentUser.id,
                responsibleId: this.currentUser.id,
                data: {}
            });

            document.getElementById('modal-root').classList.add('hidden');
            window.navigate('#measure/' + newMeasure.id);
        };
    }
}

// Start App
new App();
