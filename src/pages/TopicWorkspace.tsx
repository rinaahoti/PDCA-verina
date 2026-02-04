import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { topicsService } from '../services';
import { Topic, Step } from '../types';
import { ChevronRight, ArrowLeft, CheckCircle2, Clock, AlertTriangle, FileText, Activity, BarChart3, Repeat, MapPin, Shield } from 'lucide-react';
import { getStatusMeta, getStatusBadgeStyle } from '../utils/statusUtils';

const TopicWorkspace: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [topic, setTopic] = useState<Topic | null>(null);
    const [activeTab, setActiveTab] = useState<Step>('PLAN');

    useEffect(() => {
        if (id) {
            const t = topicsService.getById(id);
            if (t) {
                setTopic(t);
                setActiveTab(t.step);
            }
        }
    }, [id]);

    if (!topic) return <div style={{ padding: '2rem' }}>Topic not found.</div>;

    const TabButton = ({ step, label, icon: Icon }: { step: Step, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(step)}
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1rem',
                border: 'none',
                background: activeTab === step ? 'white' : 'transparent',
                color: activeTab === step ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: activeTab === step ? '3px solid var(--color-primary)' : '3px solid transparent',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    const isAudit = topic.type === 'Audit Finding';

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(-1)}
                className="btn btn-outline"
                style={{ marginBottom: '1.5rem', border: 'none', padding: 0, color: 'var(--color-primary)' }}
            >
                <ArrowLeft size={18} /> Back to Overview
            </button>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-dark))', color: 'white' }}>
                <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{topic.id}</span>
                    <span>|</span>
                    <span>{topic.category}</span>
                    {isAudit && (
                        <>
                            <span>|</span>
                            <span style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                <Shield size={10} /> {topic.rating}
                            </span>
                        </>
                    )}
                </div>
                <h1 style={{ margin: '0.5rem 0', fontSize: '1.75rem' }}>{topic.title}</h1>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', fontSize: '14px', flexWrap: 'wrap' }}>
                    <div><span style={{ opacity: 0.7 }}>Owner:</span> <span style={{ fontWeight: 600 }}>Sophia Mayer</span></div>
                    <div><span style={{ opacity: 0.7 }}>Responsible:</span> <span style={{ fontWeight: 600 }}>Felix Worker</span></div>
                    <div><span style={{ opacity: 0.7 }}>Target Date:</span> <span style={{ fontWeight: 600 }}>{new Date(topic.dueDate).toLocaleDateString()}</span></div>
                    {isAudit && topic.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} style={{ opacity: 0.7 }} />
                            <span style={{ fontWeight: 600 }}>{topic.location}</span>
                        </div>
                    )}
                    {isAudit && topic.auditReference && (
                        <div><span style={{ opacity: 0.7 }}>Source:</span> <span style={{ fontWeight: 600 }}>{topic.auditReference}</span></div>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <TabButton step="PLAN" label="PLAN" icon={FileText} />
                    <TabButton step="DO" label="DO" icon={Activity} />
                    <TabButton step="CHECK" label="CHECK" icon={BarChart3} />
                    <TabButton step="ACT" label="ACT" icon={Repeat} />
                </div>

                <div style={{ padding: '2rem' }}>
                    {activeTab === 'PLAN' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>Root Cause Analysis & Planning</h3>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Problem Description</label>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{topic.plan.description || 'No description provided.'}</p>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Root Cause Analysis</label>
                                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid var(--color-primary)' }}>
                                    {topic.plan.rootCause || 'Root cause not yet identified.'}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Objectives</label>
                                <ul style={{ paddingLeft: '1.25rem' }}>
                                    {topic.plan.objectives.length > 0 ? topic.plan.objectives.map((obj, i) => (
                                        <li key={i} style={{ marginBottom: '0.5rem', color: '#4a5568' }}>{obj}</li>
                                    )) : <li>No objectives defined.</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'DO' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>Measures & Execution</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Action Item</th>
                                        <th>Responsible</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topic.do.actions.length > 0 ? topic.do.actions.map(action => (
                                        <tr key={action.id}>
                                            <td style={{ fontWeight: 600 }}>{action.title}</td>
                                            <td>{action.assignments.map(a => a.userName).join(', ')}</td>
                                            <td>{new Date(action.dueDate).toLocaleDateString()}</td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    ...getStatusBadgeStyle(action.status, action.dueDate)
                                                }}>
                                                    {getStatusMeta(action.status, action.dueDate).label}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No actions defined.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'CHECK' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>KPI Monitoring & Results</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div className="card" style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-primary)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)' }}>Measurable KPI</h4>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{topic.kpi}</div>
                                </div>
                                <div className="card" style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-primary)', opacity: 0.9 }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)' }}>Target Objective</h4>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>{topic.objective}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={{ fontWeight: 700 }}>Effectiveness Review</label>
                                <p style={{ color: '#4a5568' }}>{topic.check.effectivenessReview || 'Pending review.'}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ACT' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>Standardization & Lessons Learned</h3>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700 }}>Standardization Plan</label>
                                <p style={{ color: '#4a5568' }}>{topic.act.standardization || 'Standards not yet updated.'}</p>
                            </div>
                            <div>
                                <label style={{ fontWeight: 700 }}>Lessons Learned</label>
                                <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid var(--color-status-yellow)' }}>
                                    {topic.act.lessonsLearned || 'No lessons logged.'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopicWorkspace;
