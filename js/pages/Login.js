import { store } from '../data.js';

export const Login = () => {
    window.handleLogin = (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const user = store.login(email);
        if (user) {
            window.location.hash = '#cockpit';
            window.location.reload(); // Force app shell to load
        } else {
            alert('User not found');
        }
    };

    window.handleDemo = (role) => {
        const email = role === 'owner' ? 'sophia.mayer@mso.de' : 'admin@mso.de';
        store.login(email);
        window.location.hash = '#cockpit';
        window.location.reload();
    };

    return `
        <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5;">
            <div class="card" style="width: 400px; padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="width: 48px; height: 48px; background: var(--color-primary); border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 1rem auto;">M</div>
                    <h1 style="color: var(--color-primary);">MSO Maestro 5</h1>
                    <p style="color: #6b7280;">Sign in to your account</p>
                </div>
                
                <form onsubmit="window.handleLogin(event)">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Email Address</label>
                        <input type="email" id="email" class="input-base" placeholder="name@company.com" value="sophia.mayer@mso.de">
                    </div>
                    
                    <button type="submit" class="btn btn-primary w-full" style="padding: 0.75rem;">Sign In</button>
                    <div style="text-align: center; margin-top: 1rem;">
                        <a href="#" style="font-size: 12px; color: var(--color-primary);">Forgot password?</a>
                    </div>
                </form>

                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee;">
                    <div style="font-size: 11px; color: #999; text-align: center; margin-bottom: 1rem;">DEMO MODES (One-Click)</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button onclick="window.handleDemo('owner')" class="btn btn-outline btn-sm">Sophia (Owner)</button>
                        <button onclick="window.handleDemo('admin')" class="btn btn-outline btn-sm">Admin</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};
