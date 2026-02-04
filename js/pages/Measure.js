import { store } from '../data.js';
import { Utils } from '../utils.js';

export const Measure = (id) => {
    const measure = store.getMeasure(id);
    if (!measure) return `<div class="p-4">Measure not found</div>`;

    const template = store.getTemplates().find(t => t.id === measure.templateId);

    // Hydrate steps if missing (for seed data)
    let steps = measure.steps;
    if (!steps && template) {
        steps = template.steps.map(s => ({
            name: s,
            status: s === measure.status ? 'active' : 'locked', // simplified
            fields: template.fields.filter(f => f.step === s)
        }));
    }

    // Determine active step
    const activeStepIndex = steps.findIndex(s => s.name === measure.status);
    const activeStep = steps[activeStepIndex] || steps[0];

    // Helper to render fields
    const renderField = (field) => {
        const val = measure.data[field.id] || '';
        if (field.type === 'richtext') {
            return `
                <div style="margin-bottom: 1rem;">
                    <label style="display:block; font-weight: 500; margin-bottom: 0.5rem;">${field.label}</label>
                    <textarea class="field-input input-base" data-id="${field.id}" rows="4">${val}</textarea>
                </div>`;
        }
        if (field.type === 'date') {
            return `
                <div style="margin-bottom: 1rem;">
                    <label style="display:block; font-weight: 500; margin-bottom: 0.5rem;">${field.label}</label>
                    <input type="date" class="field-input input-base" data-id="${field.id}" value="${val}">
                </div>`;
        }
        if (field.type === 'yesno') {
            return `
                <div style="margin-bottom: 1rem;">
                    <label style="display:block; font-weight: 500; margin-bottom: 0.5rem;">${field.label}</label>
                    <select class="field-input input-base" data-id="${field.id}">
                        <option value="">Select...</option>
                        <option value="yes" ${val === 'yes' ? 'selected' : ''}>Yes</option>
                        <option value="no" ${val === 'no' ? 'selected' : ''}>No</option>
                    </select>
                </div>`;
        }
        return '';
    };

    // Events are attached by app.js after render, or we can use inline onchange for prototype speed
    // We'll use a globally exposed saver for this prototype "window.saveMeasureField"

    window.saveMeasureField = (id, fieldId, value) => {
        const m = store.getMeasure(id);
        m.data = m.data || {};
        m.data[fieldId] = value;
        store.updateMeasure(id, { data: m.data });
    };

    // Render History
    const renderHistory = () => {
        return measure.history.map(h => `
            <div style="font-size: 12px; padding: 8px 0; border-bottom: 1px solid #eee;">
                <div style="display:flex; justify-content:space-between; color: #666;">
                    <span>${h.user}</span>
                    <span>${Utils.formatDate(h.date)}</span>
                </div>
                <div>${h.action}: From <b>${h.oldValue}</b> to <b>${h.newValue}</b></div>
            </div>
        `).join('');
    };

    return `
        <div class="workspace-container">
            <!-- Action Bar -->
            <div class="ws-action-bar">
                 <button class="btn btn-primary" onclick="window.navigate('#cockpit')"><i data-lucide="arrow-left" style="width:14px;"></i> Back</button>
                 <div style="width: 1px; height: 24px; background: #ddd; margin: 0 10px;"></div>
                 <button class="btn btn-outline btn-sm"><i data-lucide="save" style="width:14px;"></i> Save</button>
                 <button class="btn btn-outline btn-sm"><i data-lucide="printer" style="width:14px;"></i> Print</button>
                 <button class="btn btn-outline btn-sm"><i data-lucide="mail" style="width:14px;"></i> Email</button>
                 <div style="flex:1;"></div>
                 <span class="badge ${Utils.getTrafficLightClass(Utils.getTrafficLight(measure))}">
                    ${Utils.getTrafficLightLabel(Utils.getTrafficLight(measure))}
                 </span>
            </div>

            <!-- Structure Pane -->
            <div class="ws-structure">
                <div style="padding: 1rem; border-bottom: 1px solid #eee; font-weight: 600;">Process Lifecycle</div>
                ${steps.map((s, idx) => `
                    <div style="padding: 10px 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px; background: ${s.name === measure.status ? '#e6f0ff' : 'transparent'}; border-left: 3px solid ${s.name === measure.status ? 'var(--color-primary)' : 'transparent'};">
                        <div style="width: 18px; height: 18px; border-radius: 50%; background: ${idx < activeStepIndex ? 'var(--status-ontrack)' : (s.name === measure.status ? 'var(--color-primary)' : '#ddd')}; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                            ${idx < activeStepIndex ? '✓' : idx + 1}
                        </div>
                        <span style="color: ${s.name === measure.status ? 'var(--color-primary)' : 'inherit'}; font-weight: ${s.name === measure.status ? '600' : '400'}">${s.name}</span>
                        ${s.status === 'locked' ? '<i data-lucide="lock" style="width:12px; margin-left: auto; color: #999;"></i>' : ''}
                    </div>
                `).join('')}
                
                 <div style="padding: 1rem; margin-top: 2rem; border-top: 1px solid #eee;">
                    <h3 style="font-size: 12px; font-weight:600; text-transform:uppercase; color:#999; margin-bottom: 10px;">History Log</h3>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${renderHistory()}
                    </div>
                </div>
            </div>

            <!-- Data Pane -->
            <div class="ws-data">
                <div style="margin-bottom: 1.5rem;">
                    <h1 style="margin-bottom: 0.5rem;">${measure.title}</h1>
                    <div style="color: #666; font-size: 12px;">Ref ID: ${measure.id} | Owner: ${store.getUsers().find(u => u.id === measure.ownerId)?.name}</div>
                </div>

                <div class="card">
                    <h3 style="padding-bottom: 1rem; margin-bottom: 1rem; border-bottom: 1px solid #eee;">${activeStep.name} Data</h3>
                    ${activeStep.fields && activeStep.fields.length > 0
            ? activeStep.fields.map(renderField).join('')
            : '<div style="color: #999; font-style: italic;">No specific fields configured for this step.</div>'}
                </div>

                <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                    <button class="btn btn-primary" onclick="alert('Simulation: Proceeding to next workflow step...')">Complete Step & Proceed</button>
                    ${activeStepIndex > 0 ? '<button class="btn btn-outline" style="color: #d32f2f; border-color: #d32f2f;">Reject / Return to Previous</button>' : ''}
                </div>
            </div>
        </div>
        <script>
            // Attach listeners to inputs
            document.querySelectorAll('.field-input').forEach(el => {
                el.addEventListener('change', (e) => {
                    window.saveMeasureField('${measure.id}', e.target.dataset.id, e.target.value);
                });
            });
        </script>
    `;
};
