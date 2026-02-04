import { store } from '../data.js';
import { Utils } from '../utils.js';

export const Cockpit = () => {
    const user = store.getCurrentUser();
    const allMeasures = store.getMeasures();

    // Logic:
    // Assigned/Worker View: responsibleId === user.id
    // Owner View: ownerId === user.id

    const assignedMeasures = allMeasures.filter(m => m.responsibleId === user.id && m.status !== 'Done');
    const ownedMeasures = allMeasures.filter(m => m.ownerId === user.id);

    const renderRow = (m) => {
        const trafficClass = Utils.getTrafficLightClass(Utils.getTrafficLight(m));
        return `
            <div class="measure-grid" onclick="window.navigate('#measure/${m.id}')" style="cursor: pointer; background: white; padding: 0.75rem 0.5rem; border-radius: 4px; border: 1px solid transparent; transition: border-color 0.2s;">
                <div style="display: flex; justify-content: center;">
                   <div class="${trafficClass}" style="width: 12px; height: 12px; border-radius: 50%;"></div>
                </div>
                <div style="font-weight: 500;">${m.title}</div>
                <div class="badge badge-done" style="width: fit-content;">${m.status}</div>
                <div>${Utils.formatDate(m.dueDate)}</div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 10px; background: #eee; padding: 2px 4px; border-radius: 4px;">Own</span>
                    ${store.getUsers().find(u => u.id === m.ownerId)?.name.split(' ')[0]}
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 10px; background: #eee; padding: 2px 4px; border-radius: 4px;">Do</span>
                    ${store.getUsers().find(u => u.id === m.responsibleId)?.name.split(' ')[0]}
                </div>
            </div>
        `;
    };

    return `
        <div style="padding: 0 1rem;">
            
            <!-- Worker View -->
            <div class="card" style="margin-bottom: 2rem;">
                <div style="padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem; display: flex; justify-content: space-between;">
                    <h2 style="margin: 0; color: var(--color-primary);">My ToDos (Assigned to Me)</h2>
                    <span class="badge badge-warning">${assignedMeasures.length} Pending</span>
                </div>
                
                <div class="measure-grid measure-grid-header">
                    <div style="text-align: center;">Status</div>
                    <div>Title</div>
                    <div>Step</div>
                    <div>Due Date</div>
                    <div>Owner</div>
                    <div>Responsible</div>
                </div>
                <div class="list-container">
                    ${assignedMeasures.length ? assignedMeasures.map(renderRow).join('') : '<div class="p-4 text-muted">No pending tasks.</div>'}
                </div>
            </div>

            <!-- Owner View -->
            <div class="card">
                <div style="padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem;">
                    <h2 style="margin: 0; color: var(--color-primary);">My Topics (Owner Overview)</h2>
                </div>

                 <div class="measure-grid measure-grid-header">
                    <div style="text-align: center;">Status</div>
                    <div>Title</div>
                    <div>Current Step</div>
                    <div>Due Date</div>
                    <div>Owner</div>
                    <div>Responsible</div>
                </div>
                <div class="list-container">
                    ${ownedMeasures.length ? ownedMeasures.map(renderRow).join('') : '<div class="p-4 text-muted">No owned topics.</div>'}
                </div>
            </div>
        </div>
    `;
};
