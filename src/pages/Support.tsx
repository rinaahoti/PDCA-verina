import React, { useState, useEffect } from 'react';
import { supportService, authService } from '../services';
import { SupportTicket } from '../types';
import {
    Book,
    Download,
    Send,
    Rocket,
    BarChart3,
    PlayCircle,
    FileText,
    HelpCircle,
    MessageSquare,
    CheckSquare,
    Zap,
    RotateCcw,
    Mail,
    Phone,
    MessageCircle,
    LifeBuoy
} from 'lucide-react';

const Support: React.FC = () => {
    const user = authService.getCurrentUser();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [msg, setMsg] = useState('');
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [subject, setSubject] = useState('');
    const [activeTab, setActiveTab] = useState<'Guide' | 'FAQ' | 'Contact'>('Guide');

    useEffect(() => {
        setTickets(supportService.getTickets());
    }, [user]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !msg) return;
        supportService.addTicket({
            userEmail: email,
            userName: name,
            message: `[Subject: ${subject}] ${msg}`
        });
        setMsg('');
        setSubject('');
        setTickets(supportService.getTickets());
        alert('Message sent successfully!');
    };

    const downloadPDF = () => {
        const content = "MSO Maestro v5 User Guide\n\nThis is a placeholder for the PDF manual.";
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Maestro_v5_Guide.pdf';
        a.click();
    };

    const PDCA_CARDS = [
        { title: 'Plan', desc: 'Define objectives, identify problems, and develop action plans.', icon: <FileText size={18} color="#3b82f6" /> },
        { title: 'Do', desc: 'Implement the planned actions and collect data.', icon: <Zap size={18} color="#f59e0b" /> },
        { title: 'Check', desc: 'Analyze results and compare against objectives.', icon: <CheckSquare size={18} color="#10b981" /> },
        { title: 'Act', desc: 'Take corrective actions and standardize successful processes.', icon: <RotateCcw size={18} color="#6366f1" /> },
    ];

    const RESOURCES = [
        { title: 'Complete User Manual (PDF)', desc: 'Comprehensive guide for all features', icon: <Book size={20} color="#64748b" /> },
        { title: 'Video Tutorials', desc: 'Step-by-step video guides', icon: <PlayCircle size={20} color="#64748b" /> },
        { title: 'Best Practices Guide', desc: 'Tips for effective PDCA implementation', icon: <Download size={20} color="#64748b" /> },
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Support & Documentation</h2>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                {[
                    { id: 'Guide', label: 'User Guide', icon: <Book size={16} /> },
                    { id: 'FAQ', label: 'FAQ', icon: <HelpCircle size={16} /> },
                    { id: 'Contact', label: 'Contact Support', icon: <MessageSquare size={16} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.25rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#64748b',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'Guide' && (
                <div className="card" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', fontSize: '1.25rem' }}>User Guide</h3>

                    {/* Getting Started */}
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                            <Rocket size={20} />
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Getting Started</h4>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>1. Login to Your Account</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Use your email and password to access the system. If you're new, try the demo mode first.</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>2. Explore the Dashboard</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>The dashboard shows KPIs, charts, and recent measures for your organization.</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>3. Create Your First Measure</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Click "New" in the sidebar, select a template, and follow the guided setup process.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PDCA Cycles */}
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                            <BarChart3 size={20} />
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Understanding PDCA Cycles</h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            {PDCA_CARDS.map(card => (
                                <div key={card.title} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                                        {card.icon}
                                        {card.title}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{card.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                            <Download size={20} />
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Resources</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {RESOURCES.map(res => (
                                <div key={res.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {res.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{res.title}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{res.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'FAQ' && (
                <div className="card" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', fontSize: '1.25rem' }}>Frequently Asked Questions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                            { q: 'How do I change the status of a measure?', a: 'Only the OWNER or ASSIGNED user can change statuses. Navigate to the measure detail and use the step progression buttons.' },
                            { q: 'Can I export the data?', a: 'Yes, role-based export options are available in the Lists view for XLSX and PDF formats.' },
                            { q: 'What determines the Critical status?', a: 'A measure automatically becomes Critical if its due date has passed and it is not yet marked as Done.' },
                            { q: 'How do I delete a measure?', a: 'Measures can only be archived or deleted by users with Administrator privileges to maintain audit history.' },
                        ].map((faq, i) => (
                            <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '0.5rem' }}>{faq.q}</div>
                                <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{faq.a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'Contact' && (
                <div style={{ padding: '0.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 700 }}>Contact Support</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem' }}>
                        {/* Left Column: Form */}
                        <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: '#334155' }}>Send us a Message</h4>
                            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Name *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Email *</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Subject *</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        placeholder="What is this about?"
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Message *</label>
                                    <textarea
                                        style={{ height: '150px', resize: 'none' }}
                                        placeholder="How can we help you today?"
                                        value={msg}
                                        onChange={e => setMsg(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', padding: '0.75rem 2rem', marginTop: '0.5rem' }}>
                                    Send Message
                                </button>
                            </form>
                        </div>

                        {/* Right Column: Info blocks */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Other Ways to Reach Us</h4>

                            {/* Email Support */}
                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ marginTop: '2px' }}><Mail size={18} color="#64748b" /></div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Email Support</div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-primary)', margin: '4px 0' }}>support@pdcamaestro.com</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Response time: 24 hours</div>
                                </div>
                            </div>

                            {/* Phone Support */}
                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ marginTop: '2px' }}><Phone size={18} color="#64748b" /></div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Phone Support</div>
                                    <div style={{ fontSize: '13px', color: '#475569', margin: '4px 0' }}>+1 (555) 123-4567</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Mon-Fri, 9AM-5PM EST</div>
                                </div>
                            </div>

                            {/* Live Chat */}
                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ marginTop: '2px' }}><MessageCircle size={18} color="#64748b" /></div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Live Chat</div>
                                    <div style={{ fontSize: '13px', color: '#475569', margin: '4px 0' }}>Available in-app</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Mon-Fri, 9AM-8PM EST</div>
                                </div>
                            </div>

                            {/* Emergency Support */}
                            <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #dbeafe', display: 'flex', gap: '1rem', alignItems: 'flex-start', marginTop: '1rem' }}>
                                <div style={{ marginTop: '2px' }}><LifeBuoy size={18} color="#dc2626" /></div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Emergency Support</div>
                                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                                        For critical system issues, call our emergency line: <span style={{ fontWeight: 600 }}>+1 (555) 911-HELP</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support History - Optional bottom section or hidden in this view? 
                        In the user's image, history isn't shown, but it's good value. 
                        I'll keep it as a smaller section below or remove it for pixel-perfect match.
                        The user said "pjesen e contact support boje kshtu" which implies matching the image.
                        I'll remove the history from this tab's primary view to match the image precisely.
                    */}
                </div>
            )}
        </div>
    );
};

export default Support;
