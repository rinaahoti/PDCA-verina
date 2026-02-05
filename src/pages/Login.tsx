import React, { useState } from 'react';
import { authService } from '../services';

const Login: React.FC = () => {
    const [email, setEmail] = useState('elena.rossi@hospital.ch');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (authService.login(email)) {
            window.location.href = '/app/cockpit';
        } else {
            alert('Invalid email');
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
            <div className="card" style={{ width: '400px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '64px', height: '64px', background: 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 1rem' }}>M</div>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>MSO Maestro 5</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Sign in to continue</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div>
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', justifyContent: 'center' }}>Sign In</button>
                </form>
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>QUICK LOGIN FOR DEMO</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setEmail('elena.rossi@hospital.ch')}>Elena (ADMIN)</button>
                        <button className="btn btn-outline" onClick={() => setEmail('marcus.weber@hospital.ch')}>Marcus (OWNER)</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
