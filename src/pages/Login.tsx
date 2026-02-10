import React, { useState } from 'react';
import { authService } from '../services';

import { useLanguage } from '../contexts/LanguageContext';

const Login: React.FC = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('elena.rossi@hospital.ch');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (authService.login(email)) {
            window.location.href = '/app/cockpit';
        } else {
            alert(t('auth.invalidEmail'));
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
            <div className="card" style={{ width: '400px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/logoo.png" alt="VIRENA Logo" style={{ width: '64px', height: '64px', margin: '0 auto 1rem', display: 'block' }} />
                    <h1 style={{ margin: 0, fontSize: '24px' }}>{t('auth.loginTitle')}</h1>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#5FAE9E', marginTop: '0.5rem' }}>{t('login.productName')}</div>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{t('auth.subtitle')}</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div>
                        <label>{t('auth.email')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', justifyContent: 'center', background: '#5FAE9E', color: '#cbeee2', border: 'none' }}>{t('auth.signIn')}</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
