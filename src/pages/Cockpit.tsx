import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { topicsService, authService, todosService } from '../services';
import { notificationService } from '../services/notifications';
import { Topic, ToDo, Step, EffectivenessStatus, KPIEvaluation, ActOutcome, StandardizationScope, AffectedArea } from '../types';
import { Save, Printer, Mail, ArrowLeft, ChevronRight, Lock, CheckCircle2, X, AlertTriangle, PlayCircle, BarChart3, RotateCcw, FileText, Globe, GraduationCap, ShieldCheck, Settings } from 'lucide-react';
import { getStatusMeta, getStatusBadgeStyle } from '../utils/statusUtils';


const Cockpit: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const user = authService.getCurrentUser();

    const [topics, setTopics] = useState<Topic[]>([]);
    const [todos, setTodos] = useState<ToDo[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [viewingStep, setViewingStep] = useState<Step>('PLAN');

    // Create Mode State
    const [createState, setCreateState] = useState({
        title: '',
        description: '',
        asIs: '',
        toBe: '',
        rootCause: '',
        dueDate: '',
        step: 'PLAN' as Step
    });

    const [formState, setFormState] = useState<any>({
        description: '', asIs: '', toBe: '', rootCause: '',
        checkDate: '',
        actions: [],
        kpis: [], kpiResults: '', effectivenessReview: '',
        // CHECK Phase New Fields
        effectivenessStatus: undefined,
        kpiEvaluations: [],

        // ACT Phase New Fields
        actOutcome: undefined,
        standardizationScope: [],
        affectedAreas: [],
        standardizationDescription: '', // replaces standardization
        actConfirmation: { standardized: false, noActionsPending: false, readyToClose: false },

        standardization: '', lessonsLearned: ''
    });

    const [statusFilter, setStatusFilter] = useState<string[]>(['On Track', 'Critical', 'Warning', 'Done']);
    const [stepFilter, setStepFilter] = useState<Step[]>(['PLAN', 'DO', 'CHECK', 'ACT']);
    const [isSaved, setIsSaved] = useState(false);
    const [emailStatus, setEmailStatus] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: '' });

    const loadData = () => {
        const allTopics = topicsService.getAll();
        setTopics(allTopics);
        setTodos(todosService.getAll());
        if (selectedTopic) {
            const updated = allTopics.find(t => t.id === selectedTopic.id);
            if (updated) setSelectedTopic(updated);
        }
    };

    useEffect(() => {
        topicsService.init();
        loadData();
        window.addEventListener('storage', loadData);
        return () => window.removeEventListener('storage', loadData);
    }, [selectedTopic?.id]);

    useEffect(() => {
        if (selectedTopic) {
            setViewingStep(selectedTopic.step);
            setFormState({
                title: selectedTopic.title || '',
                dueDate: selectedTopic.dueDate || '',
                severity: selectedTopic.severity || 'Medium',
                description: selectedTopic.plan.description || '',
                asIs: selectedTopic.plan.asIs || '',
                toBe: selectedTopic.plan.toBe || '',
                rootCause: selectedTopic.plan.rootCause || '',
                checkDate: selectedTopic.do.checkDate || '',
                actions: selectedTopic.do.actions || [],
                kpis: selectedTopic.check.kpis || [],
                kpiResults: selectedTopic.check.kpiResults || '',
                effectivenessReview: selectedTopic.check.effectivenessReview || '',
                effectivenessStatus: selectedTopic.check.effectivenessStatus,
                kpiEvaluations: selectedTopic.check.kpiEvaluations || [],

                // ACT
                actOutcome: selectedTopic.act.actOutcome,
                standardizationScope: selectedTopic.act.standardizationScope || [],
                affectedAreas: selectedTopic.act.affectedAreas || [],
                standardizationDescription: selectedTopic.act.standardizationDescription || selectedTopic.act.standardization || '',
                actConfirmation: selectedTopic.act.actConfirmation || { standardized: false, noActionsPending: false, readyToClose: false },

                standardization: selectedTopic.act.standardization || '',
                lessonsLearned: selectedTopic.act.lessonsLearned || ''
            });
        }
    }, [selectedTopic?.id, selectedTopic?.step]);

    const myToDos = todos.filter((t: ToDo) => t.status !== 'Overdue' || t.priority === 'Critical');

    // Derived: My Assigned Actions from Topics
    const myActions = topics.flatMap(t =>
        (t.do?.actions || [])
            .filter(a => a.assignments?.some((assign: any) => assign.userId === user?.id))
            .map(a => ({
                ...a,
                topicId: t.id,
                topicTitle: t.title,
                myAssignment: a.assignments.find((assign: any) => assign.userId === user?.id)
            }))
    );



    const myTopics = topics.filter((t: Topic) => {
        const isOwner = t.ownerId === user?.id;
        const matchesStatus = statusFilter.includes(t.status);
        const matchesStep = stepFilter.includes(t.step);
        return isOwner && matchesStatus && matchesStep;
    });

    const toggleStatus = (status: string) => {
        setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    const toggleStep = (step: Step) => {
        setStepFilter(prev => prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]);
    };

    const handleSave = async () => {
        if (!selectedTopic) return;
        topicsService.update(selectedTopic.id, {
            title: formState.title,
            dueDate: formState.dueDate,
            severity: formState.severity,
            plan: { description: formState.description, asIs: formState.asIs, toBe: formState.toBe, rootCause: formState.rootCause, objectives: formState.objectives || [] } as any,
            do: { checkDate: formState.checkDate, actions: formState.actions || [] },

            check: {
                kpis: formState.kpis || [],
                kpiResults: formState.kpiResults,
                effectivenessReview: formState.effectivenessReview,
                effectivenessStatus: formState.effectivenessStatus,
                kpiEvaluations: formState.kpiEvaluations || [],
                audit: { checkedBy: user?.name || 'Unknown', checkedOn: new Date().toISOString() }
            },
            act: {
                actOutcome: formState.actOutcome,
                standardizationScope: formState.standardizationScope,
                affectedAreas: formState.affectedAreas,
                standardizationDescription: formState.standardizationDescription,
                lessonsLearned: formState.lessonsLearned,
                actConfirmation: formState.actConfirmation,
                standardization: formState.standardization // keep legacy sync
            }
        });
        loadData();
        window.dispatchEvent(new Event('storage'));

        // Send Email Notifications
        if (formState.actions && formState.actions.length > 0) {
            try {
                const allRecipients = formState.actions.flatMap((action: any) =>
                    action.assignments.map((assign: any) => ({
                        userId: assign.userId,
                        userName: assign.userName,
                        email: assign.userId + '@company.com' // In production, get real email from user profile
                    }))
                );

                // Remove duplicates
                const uniqueRecipients = Array.from(
                    new Map(allRecipients.map((r: any) => [r.userId, r])).values()
                );

                if (uniqueRecipients.length > 0) {
                    const emailResponse = await notificationService.sendActionAssignmentEmails({
                        recipients: uniqueRecipients as any,
                        subject: `[MSO Maestro] Action Assignment: ${selectedTopic?.title}`,
                        body: `You have been assigned to one or more actions in the topic "${selectedTopic?.title}".`,
                        actionDetails: {
                            title: formState.actions[0]?.title || 'Multiple Actions',
                            topicTitle: selectedTopic?.title,
                            description: formState.actions[0]?.description,
                            dueDate: formState.actions[0]?.dueDate,
                            teamsMeeting: formState.actions[0]?.teamsMeeting,
                            teamsMeetingLink: formState.actions[0]?.teamsMeetingLink,
                            owner: user?.name
                        }
                    });

                    if (emailResponse.success) {
                        setEmailStatus({
                            show: true,
                            success: true,
                            message: `✓ ${emailResponse.summary.successful} email(s) sent successfully`
                        });
                    } else {
                        setEmailStatus({
                            show: true,
                            success: false,
                            message: `⚠ ${emailResponse.summary.failed} email(s) failed to send`
                        });
                    }
                    setTimeout(() => setEmailStatus({ show: false, success: false, message: '' }), 5000);
                }
            } catch (error) {
                console.error('Failed to send email notifications:', error);
                setEmailStatus({
                    show: true,
                    success: false,
                    message: '✗ Email service unavailable'
                });
                setTimeout(() => setEmailStatus({ show: false, success: false, message: '' }), 5000);
            }
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const newTopic = topicsService.add({
            title: createState.title,
            ownerId: user?.id || '',
            responsibleId: 'u2',
            status: 'On Track',
            severity: 'Medium',
            category: 'Clinical',
            kpi: '-',
            objective: '-',
            dueDate: createState.dueDate,
            step: createState.step
        });

        // Update plan data immediately
        topicsService.update(newTopic.id, {
            plan: { ...newTopic.plan, description: createState.description, asIs: createState.asIs, toBe: createState.toBe, rootCause: createState.rootCause }
        });

        window.dispatchEvent(new Event('storage'));
        loadData();
        setSearchParams({}); // Clear mode
        setSelectedTopic(topicsService.getById(newTopic.id) || newTopic); // Open the detail view
    };

    const handleProceed = () => {
        if (!selectedTopic) return;

        // Validation for PLAN phase
        if (selectedTopic.step === 'PLAN') {
            if (!formState.asIs?.trim() || !formState.toBe?.trim()) {
                alert('Validation Error: Both "AS-IS (Current State)" and "TO-BE (Target State)" sections are mandatory to proceed.');
                return;
            }
        }

        // Validation for DO phase
        if (selectedTopic.step === 'DO') {
            if (!formState.checkDate) {
                alert('Validation Error: A defined "Check Date" is required to proceed.');
                return;
            }
            // Ensure at least one action exists
            if (!formState.actions || formState.actions.length === 0) {
                alert('Validation Error: At least one execution action must be defined.');
                return;
            }
            // Ensure each action has a Teams Meeting and at least one person
            const invalidAction = formState.actions.find((a: any) => !a.teamsMeeting || a.assignments.length === 0);
            if (invalidAction) {
                alert(`Validation Error: Action "${invalidAction.title}" is missing a Teams Meeting date or Assigned Persons.`);
                return;
            }
        }

        // Validation for CHECK phase
        if (selectedTopic.step === 'CHECK') {
            if (!formState.effectivenessStatus) {
                alert('Validation Error: Effectiveness Status is mandatory.');
                return;
            }
            if (!formState.effectivenessReview?.trim()) {
                alert('Validation Error: Effectiveness Review (justification) is mandatory.');
                return;
            }
            if (!formState.kpiEvaluations || formState.kpiEvaluations.length === 0) {
                alert('Validation Error: At least one KPI evaluation is required.');
                return;
            }
        }

        // Validation for ACT phase (Closing)
        if (selectedTopic.step === 'ACT') {
            if (!formState.actOutcome) {
                alert('Validation Error: An ACT Outcome must be selected.');
                return;
            }

            if (formState.actOutcome === 'Standardize') {
                if (!formState.standardizationScope || formState.standardizationScope.length === 0) {
                    alert('Validation Error: Please select at least one item for "Standardization Scope".');
                    return;
                }
                if (!formState.standardizationDescription?.trim()) {
                    alert('Validation Error: "Standardization Description" is mandatory for this outcome.');
                    return;
                }
            }

            // Confirmation Checklist
            if (!formState.actConfirmation.standardized && formState.actOutcome === 'Standardize') {
                alert('Validation Error: You must confirm that the improvement has been standardized.');
                return;
            }
            if (!formState.actConfirmation.noActionsPending) {
                alert('Validation Error: You must confirm that no further operational actions are pending.');
                return;
            }
            if (!formState.actConfirmation.readyToClose) {
                alert('Validation Error: You must confirm that the topic is ready to be closed.');
                return;
            }
        }

        const steps: Step[] = ['PLAN', 'DO', 'CHECK', 'ACT'];
        const currentIdx = steps.indexOf(selectedTopic.step);

        // SYNC: Update localStorage with latest formState BEFORE proceeding
        topicsService.update(selectedTopic.id, {
            title: formState.title,
            dueDate: formState.dueDate,
            severity: formState.severity,
            plan: { description: formState.description, asIs: formState.asIs, toBe: formState.toBe, rootCause: formState.rootCause, objectives: formState.objectives || [] },
            do: { checkDate: formState.checkDate, actions: formState.actions },
            check: {
                kpis: formState.kpis,
                kpiResults: formState.kpiResults,
                effectivenessReview: formState.effectivenessReview,
                effectivenessStatus: formState.effectivenessStatus,
                kpiEvaluations: formState.kpiEvaluations,
                audit: { checkedBy: user?.name || 'Unknown', checkedOn: new Date().toISOString() }
            },
            act: {
                actOutcome: formState.actOutcome,
                standardizationScope: formState.standardizationScope,
                affectedAreas: formState.affectedAreas,
                standardizationDescription: formState.standardizationDescription,
                lessonsLearned: formState.lessonsLearned,
                actConfirmation: formState.actConfirmation,
                standardization: formState.standardization
            }
        });

        if (currentIdx < steps.length - 1) {
            const nextStep = steps[currentIdx + 1];
            const updates: any = { step: nextStep };

            if (selectedTopic.step === 'PLAN') (updates as any).plan = {
                description: formState.description, asIs: formState.asIs, toBe: formState.toBe, rootCause: formState.rootCause, objectives: formState.objectives || [],
                completedAt: new Date().toISOString()
            };
            if (selectedTopic.step === 'DO') (updates as any).do = {
                checkDate: formState.checkDate, actions: formState.actions,
                completedAt: new Date().toISOString()
            };
            if (selectedTopic.step === 'CHECK') (updates as any).check = {
                kpis: formState.kpis,
                kpiResults: formState.kpiResults,
                effectivenessReview: formState.effectivenessReview,
                effectivenessStatus: formState.effectivenessStatus,
                kpiEvaluations: formState.kpiEvaluations,
                audit: { checkedBy: user?.name || 'Unknown', checkedOn: new Date().toISOString() },
                completedAt: new Date().toISOString()
            };

            topicsService.update(selectedTopic.id, updates);
            loadData();
            window.dispatchEvent(new Event('storage'));
        } else if (selectedTopic.step === 'ACT') {
            const finalStatus = formState.actOutcome === 'Improve & Re-run PDCA' ? 'Warning' : 'Done';

            topicsService.update(selectedTopic.id, {
                status: finalStatus,
                act: {
                    actOutcome: formState.actOutcome,
                    standardizationScope: formState.standardizationScope,
                    affectedAreas: formState.affectedAreas,
                    standardizationDescription: formState.standardizationDescription,
                    lessonsLearned: formState.lessonsLearned,
                    actConfirmation: formState.actConfirmation,
                    standardization: formState.standardization,
                    audit: {
                        closedBy: user?.name || 'Unknown',
                        closedOn: new Date().toISOString(),
                        finalOutcome: formState.actOutcome,
                        finalStatus: finalStatus
                    },
                    completedAt: new Date().toISOString()
                } as any
            });
            loadData();
            window.dispatchEvent(new Event('storage'));
        }
    };

    const handleReopen = () => {
        if (!selectedTopic) return;
        topicsService.update(selectedTopic.id, { status: 'On Track' });
        loadData();
        window.dispatchEvent(new Event('storage'));
    };

    const getStatusClass = (status: string, dueDate?: string, completed?: boolean) => {
        return getStatusMeta(status, dueDate, completed).class;
    };

    const getPriorityBadge = (priority: string) => {
        const bgColors: any = {
            Critical: '#fee2e2',
            High: '#fef9c3',
            Medium: '#fef9c3',
            Low: 'var(--color-bg)'
        };
        const textColors: any = {
            Critical: 'var(--color-status-red)',
            High: '#854d0e',
            Medium: '#854d0e',
            Low: 'var(--color-text-muted)'
        };
        return <span className="badge" style={{ background: bgColors[priority], color: textColors[priority] }}>{priority}</span>;
    };


    const isStepClickable = (step: Step) => {
        const steps: Step[] = ['PLAN', 'DO', 'CHECK', 'ACT'];
        const currentIdx = steps.indexOf(selectedTopic?.step || 'PLAN');
        const targetIdx = steps.indexOf(step);
        return targetIdx <= currentIdx;
    };

    // CREATE MODE VIEW
    if (mode === 'create') {
        return (
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="action-bar">
                        <button className="action-btn back" onClick={() => setSearchParams({})}>
                            <ArrowLeft size={16} /> Back
                        </button>
                        <button className="action-btn" onClick={handleCreate}><Save size={16} /> Save</button>
                        <button className="action-btn" onClick={() => setSearchParams({})}><X size={16} /> Cancel</button>
                    </div>
                    <span className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px' }}>DRAFT</span>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 700, color: 'var(--color-text)' }}>Create New PDCA Topic</h1>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
                        Ref ID: NEW | Owner: {user?.name}
                    </div>
                </div>

                <div className="detail-view">
                    <div className="card" style={{ padding: '0.5rem 0' }}>
                        <div style={{ padding: '1rem', fontWeight: 700, fontSize: '12px', color: 'var(--color-text-muted)' }}>PROCESS LIFECYCLE</div>
                        <div className="lifecycle-stepper">
                            {['PLAN', 'DO', 'CHECK', 'ACT'].map((step, i) => (
                                <div key={step} className={`lifecycle-step ${step === 'PLAN' ? 'active' : ''}`} style={{ cursor: 'default' }}>
                                    <div className="lifecycle-step-num">{i + 1}</div>
                                    <span>{step.charAt(0) + step.slice(1).toLowerCase()}</span>
                                    {step !== 'PLAN' && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--color-border)', background: '#fcfcfd' }}>
                                <h3 style={{ margin: 0 }}>Plan Data</h3>
                            </div>
                            <div style={{ padding: '1.75rem' }}>
                                <form onSubmit={handleCreate}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600 }}>Title</label>
                                        <input
                                            required
                                            value={createState.title}
                                            onChange={e => setCreateState({ ...createState, title: e.target.value })}
                                            placeholder="Enter topic title..."
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>AS-IS (Current State) <span style={{ color: 'red' }}>*</span></label>
                                            <textarea
                                                required
                                                rows={6}
                                                value={createState.asIs}
                                                onChange={e => setCreateState({ ...createState, asIs: e.target.value })}
                                                placeholder="Describe the problem, where it occurs, and its impact..."
                                                style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>TO-BE (Target State) <span style={{ color: 'red' }}>*</span></label>
                                            <textarea
                                                required
                                                rows={6}
                                                value={createState.toBe}
                                                onChange={e => setCreateState({ ...createState, toBe: e.target.value })}
                                                placeholder="Define the expected outcome and desired state..."
                                                style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600 }}>Root Cause</label>
                                        <textarea
                                            rows={4}
                                            value={createState.rootCause}
                                            onChange={e => setCreateState({ ...createState, rootCause: e.target.value })}
                                            placeholder="Enter root cause analysis..."
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontWeight: 600 }}>Initial Step</label>
                                            <select value={createState.step} onChange={e => setCreateState({ ...createState, step: e.target.value as Step })}>
                                                <option value="PLAN">PLAN</option>
                                                <option value="DO">DO</option>
                                                <option value="CHECK">CHECK</option>
                                                <option value="ACT">ACT</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontWeight: 600 }}>Due Date</label>
                                            <input type="date" required value={createState.dueDate} onChange={e => setCreateState({ ...createState, dueDate: e.target.value })} />
                                        </div>
                                    </div>
                                    <button type="submit" style={{ display: 'none' }} id="hidden-submit" />
                                </form>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ alignSelf: 'flex-start', padding: '0.9rem 2rem', fontWeight: 600 }}
                            onClick={() => document.getElementById('hidden-submit')?.click()}
                        >
                            Create Topic & Proceed
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedTopic) {
        return (
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Detail View Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="action-bar">
                        <button className="action-btn back" onClick={() => setSelectedTopic(null)}>
                            <ArrowLeft size={16} /> Back
                        </button>
                        <button className="action-btn" onClick={handleSave}><Save size={16} /> Save</button>
                        {selectedTopic.status === 'Done' && (
                            <button className="action-btn" style={{ color: 'var(--color-primary)' }} onClick={handleReopen}>
                                <CheckCircle2 size={16} /> Re-open Topic
                            </button>
                        )}
                        <button className="action-btn" onClick={() => window.print()}><Printer size={16} /> Print</button>
                        <button className="action-btn"><Mail size={16} /> Email</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isSaved && <span style={{ color: 'var(--color-status-green)', fontWeight: 700, fontSize: '12px' }}>✓ SAVED!</span>}
                        {emailStatus.show && (
                            <span style={{
                                color: emailStatus.success ? 'var(--color-status-green)' : 'var(--color-status-yellow)',
                                fontWeight: 700,
                                fontSize: '12px',
                                padding: '6px 12px',
                                background: emailStatus.success ? '#dcfce7' : '#fef9c3',
                                borderRadius: '6px',
                                border: emailStatus.success ? '1px solid #86efac' : '1px solid #fcd34d'
                            }}>
                                {emailStatus.message}
                            </span>
                        )}
                        <span className="badge" style={{ ...getStatusBadgeStyle(selectedTopic.status, selectedTopic.dueDate), padding: '6px 12px' }}>{getStatusMeta(selectedTopic.status, selectedTopic.dueDate).label.toUpperCase()}</span>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 700, color: '#1a202c' }}>{selectedTopic.title}</h1>
                    <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                        Ref ID: {selectedTopic.id} | Owner: Sophia Mayer
                    </div>
                </div>

                {selectedTopic.status === 'Done' && (
                    <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid var(--color-status-done)', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Lock size={18} color="var(--color-status-done)" />
                        <div style={{ fontSize: '14px', color: '#475569' }}>
                            <strong>Topic is Done.</strong> Data is read-only. Use <strong>Re-open Topic</strong> above to make further changes.
                        </div>
                    </div>
                )}

                <div className="detail-view">
                    {/* Stepper column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: '0.5rem 0' }}>
                            <div style={{ padding: '1rem', fontWeight: 700, fontSize: '12px', color: '#94a3b8' }}>PROCESS LIFECYCLE</div>
                            <div className="lifecycle-stepper">
                                {(['PLAN', 'DO', 'CHECK', 'ACT'] as Step[]).map((step, i) => {
                                    const isCurrent = selectedTopic.step === step;
                                    const isViewing = viewingStep === step;
                                    const isPast = ['PLAN', 'DO', 'CHECK', 'ACT'].indexOf(selectedTopic.step) > i;
                                    const clickable = isStepClickable(step);

                                    return (
                                        <div
                                            key={step}
                                            className={`lifecycle-step ${isViewing ? 'active' : ''} ${isPast ? 'completed' : ''}`}
                                            style={{ cursor: clickable ? 'pointer' : 'not-allowed', opacity: clickable ? 1 : 0.5 }}
                                            onClick={() => clickable && setViewingStep(step)}
                                        >
                                            <div className="lifecycle-step-num">
                                                {isPast ? <CheckCircle2 size={12} /> : i + 1}
                                            </div>
                                            <span>{step.charAt(0) + step.slice(1).toLowerCase()}</span>
                                            {!clickable && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                                            {isCurrent && !isViewing && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', marginLeft: 'auto' }}></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '12px', color: '#94a3b8', marginBottom: '1.25rem', textTransform: 'uppercase' }}>Topic Information</div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>DUE DATE</label>
                                <input
                                    type="date"
                                    value={formState.dueDate}
                                    onChange={e => setFormState({ ...formState, dueDate: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>SEVERITY</label>
                                <select
                                    value={formState.severity}
                                    onChange={e => setFormState({ ...formState, severity: e.target.value })}
                                    disabled={selectedTopic.status === 'Done'}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Critical">Critical</option>
                                    <option value="Business Critical">Business Critical</option>
                                </select>
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '12px', color: '#94a3b8', marginBottom: '1rem', marginTop: '1rem' }}>HISTORY LOG</div>
                                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>• Plan initialized by Sophia Mayer</div>
                                    <div>• Step advanced to {selectedTopic.step}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--color-border)', background: '#fcfcfd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>{viewingStep.charAt(0) + viewingStep.slice(1).toLowerCase()} Data</h3>
                            </div>
                            <div style={{ padding: '1.75rem' }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Topic Title</label>
                                    <input
                                        type="text"
                                        value={formState.title}
                                        onChange={e => setFormState({ ...formState, title: e.target.value })}
                                        style={{ fontSize: '1.1rem', fontWeight: 600 }}
                                        disabled={selectedTopic.status === 'Done'}
                                    />
                                </div>
                                {viewingStep === 'PLAN' && (
                                    <>
                                        <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>AS-IS (Current State)</label>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Describe the problem, where it occurs, and its impact.</div>
                                                <textarea
                                                    rows={8}
                                                    value={formState.asIs}
                                                    onChange={e => setFormState({ ...formState, asIs: e.target.value })}
                                                    disabled={selectedTopic.status === 'Done'}
                                                    placeholder="Enter AS-IS description..."
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>TO-BE (Target State)</label>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Define the expected outcome and desired state.</div>
                                                <textarea
                                                    rows={8}
                                                    value={formState.toBe}
                                                    onChange={e => setFormState({ ...formState, toBe: e.target.value })}
                                                    disabled={selectedTopic.status === 'Done'}
                                                    placeholder="Enter TO-BE description..."
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Root Cause</label>
                                            <textarea
                                                rows={6}
                                                value={formState.rootCause}
                                                onChange={e => setFormState({ ...formState, rootCause: e.target.value })}
                                                disabled={selectedTopic.status === 'Done'} placeholder="Enter root cause analysis..."
                                            />
                                        </div>
                                    </>
                                )}
                                {viewingStep === 'DO' && (
                                    <div>
                                        {/* Goal / Target Reference */}
                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '6px', borderLeft: '4px solid var(--color-primary)' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Target Goal (From Plan)</label>
                                            <div style={{ color: '#334155', fontSize: '14px' }}>
                                                {formState.toBe || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No TO-BE defined in PLAN phase.</span>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <label style={{ fontWeight: 600 }}>Execution Actions</label>
                                            <button
                                                className="btn"
                                                disabled={selectedTopic.status === 'Done'}
                                                style={{ fontSize: '12px', padding: '4px 10px', background: '#e0f2fe', color: '#0369a1' }}
                                                onClick={() => {
                                                    const newAction = {
                                                        id: `a-${Date.now()}`,
                                                        title: '',
                                                        description: '',
                                                        assignments: [],
                                                        dueDate: '',
                                                        teamsMeeting: '',
                                                        teamsMeetingLink: '',
                                                        status: 'Open'
                                                    };
                                                    setFormState({ ...formState, actions: [...formState.actions, newAction] });
                                                }}
                                            >
                                                + Add Action
                                            </button>
                                        </div>

                                        {formState.actions.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', marginBottom: '2rem' }}>
                                                No actions defined. Click "+ Add Action" to start execution.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                                {formState.actions.map((action: any, idx: number) => (
                                                    <div key={action.id} className="card" style={{ padding: '1rem', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                                            <input
                                                                type="text"
                                                                value={action.title}
                                                                onChange={e => {
                                                                    const updated = [...formState.actions];
                                                                    updated[idx].title = e.target.value;
                                                                    setFormState({ ...formState, actions: updated });
                                                                }}
                                                                placeholder="Action Title (What)"
                                                                style={{ fontWeight: 600, border: 'none', borderBottom: '1px solid #cbd5e1', width: '60%', padding: '4px 0' }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const updated = formState.actions.filter((_: any, i: number) => i !== idx);
                                                                    setFormState({ ...formState, actions: updated });
                                                                }}
                                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={2}
                                                            value={action.description}
                                                            onChange={e => {
                                                                const updated = [...formState.actions];
                                                                updated[idx].description = e.target.value;
                                                                setFormState({ ...formState, actions: updated });
                                                            }}
                                                            placeholder="Implementation Details (How)"
                                                            style={{ width: '100%', marginBottom: '1rem', fontSize: '13px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                        />

                                                        {/* People & Status Row */}
                                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 2 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>RESPONSIBLE PERSONS</label>
                                                                <select
                                                                    style={{ marginBottom: '8px', width: '100%', fontSize: '12px' }}
                                                                    onChange={e => {
                                                                        if (!e.target.value) return;
                                                                        const existing = action.assignments.find((a: any) => a.userId === e.target.value);
                                                                        if (existing) return;
                                                                        const user = authService.getAllUsers().find(u => u.id === e.target.value);
                                                                        if (user) {
                                                                            const updated = [...formState.actions];
                                                                            updated[idx].assignments.push({ userId: user.id, userName: user.name, completed: false, completedAt: undefined });
                                                                            setFormState({ ...formState, actions: updated });
                                                                        }
                                                                        e.target.value = '';
                                                                    }}
                                                                >
                                                                    <option value="">+ Assign Person...</option>
                                                                    {authService.getAllUsers().map(u => (
                                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                                    ))}
                                                                </select>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                    {action.assignments.map((assign: any, aIdx: number) => (
                                                                        <div key={assign.userId} style={{
                                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                                            background: assign.completed ? '#dcfce7' : '#f1f5f9',
                                                                            padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                                                                            border: assign.completed ? '1px solid #86efac' : '1px solid #e2e8f0'
                                                                        }}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={assign.completed}
                                                                                onChange={e => {
                                                                                    const updated = [...formState.actions];
                                                                                    const isCompleted = e.target.checked;
                                                                                    updated[idx].assignments[aIdx].completed = isCompleted;
                                                                                    updated[idx].assignments[aIdx].completedAt = isCompleted ? new Date().toISOString() : undefined;

                                                                                    // Auto-update status
                                                                                    const allDone = updated[idx].assignments.every((a: any) => a.completed);
                                                                                    const anyDone = updated[idx].assignments.some((a: any) => a.completed);
                                                                                    updated[idx].status = allDone ? 'Done' : (anyDone ? 'In Progress' : 'Open');

                                                                                    setFormState({ ...formState, actions: updated });
                                                                                }}
                                                                            />
                                                                            <span style={{ textDecoration: assign.completed ? 'line-through' : 'none', color: assign.completed ? '#166534' : '#334155' }}>{assign.userName}</span>
                                                                            <X
                                                                                size={10}
                                                                                style={{ cursor: 'pointer', marginLeft: '4px', opacity: 0.5 }}
                                                                                onClick={() => {
                                                                                    const updated = [...formState.actions];
                                                                                    updated[idx].assignments = updated[idx].assignments.filter((_: any, i: number) => i !== aIdx);
                                                                                    setFormState({ ...formState, actions: updated });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>DUE DATE</label>
                                                                <input
                                                                    type="date"
                                                                    value={action.dueDate}
                                                                    onChange={e => {
                                                                        const updated = [...formState.actions];
                                                                        updated[idx].dueDate = e.target.value;
                                                                        setFormState({ ...formState, actions: updated });
                                                                    }}
                                                                    style={{ fontSize: '12px', padding: '4px', width: '100%' }}
                                                                />
                                                            </div>

                                                            {action.assignments.length > 0 && (
                                                                <>
                                                                    <div style={{ flex: 1 }}>
                                                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>TEAMS MEETING <span style={{ color: 'red' }}>*</span></label>
                                                                        <input
                                                                            type="datetime-local"
                                                                            required
                                                                            value={action.teamsMeeting || ''}
                                                                            onChange={e => {
                                                                                const updated = [...formState.actions];
                                                                                updated[idx].teamsMeeting = e.target.value;
                                                                                setFormState({ ...formState, actions: updated });
                                                                            }}
                                                                            style={{ fontSize: '12px', padding: '4px', width: '100%', border: !action.teamsMeeting ? '1px solid red' : '1px solid #cbd5e1' }}
                                                                        />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>TEAMS LINK</label>
                                                                        <input
                                                                            type="url"
                                                                            placeholder="https://teams.microsoft.com/l/meetup-join/..."
                                                                            value={action.teamsMeetingLink || ''}
                                                                            onChange={e => {
                                                                                const updated = [...formState.actions];
                                                                                updated[idx].teamsMeetingLink = e.target.value;
                                                                                setFormState({ ...formState, actions: updated });
                                                                            }}
                                                                            style={{ fontSize: '12px', padding: '4px', width: '100%' }}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}

                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>STATUS</label>
                                                                <select
                                                                    value={action.status}
                                                                    onChange={e => {
                                                                        const updated = [...formState.actions];
                                                                        updated[idx].status = e.target.value;
                                                                        setFormState({ ...formState, actions: updated });
                                                                    }}
                                                                    style={{ fontSize: '12px', padding: '4px', width: '100%', fontWeight: 600, color: getStatusMeta(action.status, action.dueDate).color }}
                                                                >
                                                                    <option value="Open">Open</option>
                                                                    <option value="In Progress">In Progress</option>
                                                                    <option value="Done">Done</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ padding: '1.5rem', background: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem', color: '#9a3412' }}>CHECK Phase Trigger <span style={{ color: 'red' }}>*</span></label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '12px', color: '#c2410c', marginBottom: '4px' }}>Please specify when the effectiveness check will be performed.</div>
                                                    <input
                                                        type="date"
                                                        value={formState.checkDate}
                                                        onChange={e => setFormState({ ...formState, checkDate: e.target.value })}
                                                        disabled={selectedTopic.status === 'Done'}
                                                    />
                                                </div>
                                                <div style={{ flex: 2, fontSize: '13px', color: '#9a3412' }}>
                                                    <strong>Requirement:</strong> DO phase can only be completed once a CHECK checkpoint is defined.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {viewingStep === 'CHECK' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        {/* 1. EXECUTION SUMMARY (Read-Only) */}
                                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <PlayCircle size={16} /> Execution Summary (From DO Phase)
                                            </h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                                <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOTAL ACTIONS</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                                                        {selectedTopic.do.actions?.length || 0}
                                                    </div>
                                                </div>
                                                <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>COMPLETED ACTIONS</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534' }}>
                                                        {selectedTopic.do.actions?.filter(a => a.status === 'Done').length || 0}
                                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}> / {selectedTopic.do.actions?.length || 0}</span>
                                                    </div>
                                                </div>
                                                <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>INVOLVED USERS</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>
                                                        {new Set(selectedTopic.do.actions?.flatMap(a => a.assignments.map(p => p.userId))).size || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. EFFECTIVENESS STATUS (Mandatory) */}
                                        <div>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                                1. Effectiveness Assessment <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                                {[
                                                    { value: 'Effective', color: '#dcfce7', border: '#16a34a', icon: <CheckCircle2 />, desc: 'Objective fully met. Proceed to Standardization.' },
                                                    { value: 'Partially Effective', color: '#fef9c3', border: '#ca8a04', icon: <AlertTriangle />, desc: 'Objective partially met. Improvements needed.' },
                                                    { value: 'Not Effective', color: '#fee2e2', border: '#dc2626', icon: <X />, desc: 'Objective not met. Re-planning required.' }
                                                ].map((opt) => (
                                                    <div
                                                        key={opt.value}
                                                        onClick={() => selectedTopic.status !== 'Done' && setFormState({ ...formState, effectivenessStatus: opt.value as EffectivenessStatus })}
                                                        style={{
                                                            padding: '1.25rem',
                                                            borderRadius: '8px',
                                                            border: `2px solid ${formState.effectivenessStatus === opt.value ? opt.border : '#e2e8f0'}`,
                                                            background: formState.effectivenessStatus === opt.value ? opt.color : 'white',
                                                            cursor: selectedTopic.status === 'Done' ? 'default' : 'pointer',
                                                            transition: 'all 0.2s',
                                                            opacity: (formState.effectivenessStatus && formState.effectivenessStatus !== opt.value) ? 0.6 : 1
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: opt.border, marginBottom: '6px' }}>
                                                            {opt.icon} {opt.value}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{opt.desc}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. KPI EVALUATION */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                                <label style={{ fontWeight: 700, fontSize: '1.1rem' }}>2. KPI Evaluation <span style={{ color: 'red' }}>*</span></label>
                                                <button
                                                    onClick={() => {
                                                        const newKPI = { id: Date.now().toString(), name: '', targetValue: '', actualResult: '', status: 'Not Achieved' };
                                                        setFormState({ ...formState, kpiEvaluations: [...formState.kpiEvaluations, newKPI] });
                                                    }}
                                                    className="btn"
                                                    disabled={selectedTopic.status === 'Done'}
                                                    style={{ fontSize: '12px', padding: '6px 12px', background: '#e0f2fe', color: '#0369a1' }}
                                                >
                                                    + Add KPI Result
                                                </button>
                                            </div>

                                            {(!formState.kpiEvaluations || formState.kpiEvaluations.length === 0) ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8' }}>
                                                    No KPIs evaluated yet. Please add at least one KPI result.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    {formState.kpiEvaluations.map((kpi: KPIEvaluation, idx: number) => (
                                                        <div key={kpi.id || idx} style={{ display: 'flex', gap: '1rem', alignItems: 'start', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                                                            <div style={{ flex: 2 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>KPI NAME</label>
                                                                <input
                                                                    type="text"
                                                                    value={kpi.name}
                                                                    onChange={e => {
                                                                        const updated = [...formState.kpiEvaluations];
                                                                        updated[idx].name = e.target.value;
                                                                        setFormState({ ...formState, kpiEvaluations: updated });
                                                                    }}
                                                                    placeholder="e.g. Reduce Defect Rate"
                                                                    style={{ width: '100%', padding: '6px', fontSize: '13px', fontWeight: 600, border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>TARGET</label>
                                                                <input
                                                                    type="text"
                                                                    value={kpi.targetValue}
                                                                    onChange={e => {
                                                                        const updated = [...formState.kpiEvaluations];
                                                                        updated[idx].targetValue = e.target.value;
                                                                        setFormState({ ...formState, kpiEvaluations: updated });
                                                                    }}
                                                                    placeholder="e.g. < 5%"
                                                                    style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>ACTUAL</label>
                                                                <input
                                                                    type="text"
                                                                    value={kpi.actualResult}
                                                                    onChange={e => {
                                                                        const updated = [...formState.kpiEvaluations];
                                                                        updated[idx].actualResult = e.target.value;
                                                                        setFormState({ ...formState, kpiEvaluations: updated });
                                                                    }}
                                                                    placeholder="Current Value"
                                                                    style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>STATUS</label>
                                                                <select
                                                                    value={kpi.status}
                                                                    onChange={e => {
                                                                        const updated = [...formState.kpiEvaluations];
                                                                        updated[idx].status = e.target.value;
                                                                        setFormState({ ...formState, kpiEvaluations: updated });
                                                                    }}
                                                                    style={{ width: '100%', padding: '6px', fontSize: '13px', fontWeight: 600, color: kpi.status === 'Achieved' ? 'green' : 'red', borderColor: kpi.status === 'Achieved' ? '#86efac' : '#fca5a5' }}
                                                                >
                                                                    <option value="Achieved">Achieved</option>
                                                                    <option value="Not Achieved">Not Achieved</option>
                                                                </select>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const updated = formState.kpiEvaluations.filter((_: any, i: number) => i !== idx);
                                                                    setFormState({ ...formState, kpiEvaluations: updated });
                                                                }}
                                                                style={{ marginTop: '20px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 4. EFFECTIVENESS REVIEW (Structured Text) */}
                                        <div>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.8rem', fontSize: '1.1rem' }}>
                                                3. Effectiveness Review <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                                                Has the implemented measure achieved the defined objective? Justify the effectiveness status selected above.
                                            </div>
                                            <textarea
                                                rows={5}
                                                value={formState.effectivenessReview}
                                                onChange={e => setFormState({ ...formState, effectivenessReview: e.target.value })}
                                                disabled={selectedTopic.status === 'Done'}
                                                placeholder="Provide specific details on why the measure is considered Effective / Partially Effective / Not Effective..."
                                                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', lineHeight: '1.5' }}
                                            />
                                        </div>

                                        {/* 5. DECISION & AUDIT (Read-Only Info) */}
                                        {formState.effectivenessStatus && (
                                            <div style={{ background: '#f1f5f9', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Check Decision Outcome</h4>
                                                <p style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                                                    Based on your selection of <strong>{formState.effectivenessStatus}</strong>, the topic will proceed to:
                                                    <strong>
                                                        {formState.effectivenessStatus === 'Effective' ? ' Standardization (Act)' :
                                                            formState.effectivenessStatus === 'Partially Effective' ? ' Improvement (Act)' :
                                                                ' Re-planning (Return to Plan)'}
                                                    </strong>
                                                </p>
                                                <div style={{ marginTop: '1rem', fontSize: '11px', color: '#64748b', display: 'flex', gap: '1rem' }}>
                                                    <span>Checked By: <strong>{user?.name}</strong></span>
                                                    <span>Date: <strong>{new Date().toLocaleDateString('de-DE')}</strong></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {viewingStep === 'ACT' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        {/* 1. ACT DECISION (Mandatory) */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <label style={{ fontWeight: 700, fontSize: '1.1rem' }}>1. ACT Outcome Decision <span style={{ color: 'red' }}>*</span></label>
                                                {formState.effectivenessStatus && (
                                                    <span className="badge" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                                                        Input from CHECK: {formState.effectivenessStatus}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                                {[
                                                    { value: 'Standardize', icon: <ShieldCheck />, desc: 'Measure is successful. Roll out and update standards.' },
                                                    { value: 'Improve & Re-run PDCA', icon: <RotateCcw />, desc: 'Partially effective. Re-plan and execute another cycle.' },
                                                    { value: 'Close without Standardization', icon: <X />, desc: 'Not effective or not feasible. Close topic without rolling out.' }
                                                ].map((opt: any) => (
                                                    <div
                                                        key={opt.value}
                                                        onClick={() => selectedTopic.status !== 'Done' && setFormState({ ...formState, actOutcome: opt.value as ActOutcome })}
                                                        style={{
                                                            padding: '1.25rem',
                                                            borderRadius: '8px',
                                                            border: `2px solid ${formState.actOutcome === opt.value ? 'var(--color-primary)' : '#e2e8f0'}`,
                                                            background: formState.actOutcome === opt.value ? 'var(--color-primary-light)' : 'white',
                                                            cursor: selectedTopic.status === 'Done' ? 'default' : 'pointer',
                                                            opacity: (formState.actOutcome && formState.actOutcome !== opt.value) ? 0.6 : 1
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: formState.actOutcome === opt.value ? 'var(--color-primary)' : '#334155', marginBottom: '6px' }}>
                                                            {opt.icon} {opt.value}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{opt.desc}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {formState.actOutcome === 'Standardize' && (
                                            <>
                                                {/* 2. STANDARDIZATION SCOPE */}
                                                <div>
                                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}>2. Standardization Scope <span style={{ color: 'red' }}>*</span></label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                                        {['Process', 'Clinical Guide', 'Policy', 'Checklist', 'Training', 'EHR Configuration', 'Other'].map(item => (
                                                            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: selectedTopic.status === 'Done' ? 'default' : 'pointer' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={selectedTopic.status === 'Done'}
                                                                    checked={formState.standardizationScope?.includes(item)}
                                                                    onChange={e => {
                                                                        const current = formState.standardizationScope || [];
                                                                        const updated = e.target.checked
                                                                            ? [...current, item]
                                                                            : current.filter((i: string) => i !== item);
                                                                        setFormState({ ...formState, standardizationScope: updated });
                                                                    }}
                                                                />
                                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{item}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 3. AFFECTED AREAS */}
                                                <div>
                                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}>3. Affected Areas / Rollout</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                                        {['Nursing', 'Surgery', 'Emergency', 'Inpatient Ward', 'Outpatient Clinic', 'Pharmacy', 'Diagnostics', 'Administration', 'Other'].map(item => (
                                                            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: selectedTopic.status === 'Done' ? 'default' : 'pointer' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={selectedTopic.status === 'Done'}
                                                                    checked={formState.affectedAreas?.includes(item)}
                                                                    onChange={e => {
                                                                        const current = formState.affectedAreas || [];
                                                                        const updated = e.target.checked
                                                                            ? [...current, item]
                                                                            : current.filter((i: string) => i !== item);
                                                                        setFormState({ ...formState, affectedAreas: updated });
                                                                    }}
                                                                />
                                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{item}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 4. STANDARDIZATION DESCRIPTION */}
                                                <div>
                                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>4. Standardization Description <span style={{ color: 'red' }}>*</span></label>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                                                        How will this improvement be integrated into daily operations and sustained long-term?
                                                    </div>
                                                    <textarea
                                                        rows={5}
                                                        value={formState.standardizationDescription}
                                                        onChange={e => setFormState({ ...formState, standardizationDescription: e.target.value })}
                                                        disabled={selectedTopic.status === 'Done'}
                                                        placeholder="Describe the rollout plan, document updates, and training requirements..."
                                                        style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* 5. LESSONS LEARNED */}
                                        <div>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>{formState.actOutcome === 'Standardize' ? '5.' : '2.'} Lessons Learned</label>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                                                What should be repeated or avoided in future PDCA cycles?
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={formState.lessonsLearned}
                                                onChange={e => setFormState({ ...formState, lessonsLearned: e.target.value })}
                                                disabled={selectedTopic.status === 'Done'}
                                                placeholder="Key takeaways from this initiative..."
                                                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                            />
                                        </div>

                                        {/* 6. CONFIRMATION & AUDIT */}
                                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem', color: '#1e293b' }}>
                                                ACT Phase Confirmation & Sign-off <span style={{ color: 'red' }}>*</span>
                                            </label>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                                {formState.actOutcome === 'Standardize' && (
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={formState.actConfirmation?.standardized}
                                                            onChange={e => setFormState({ ...formState, actConfirmation: { ...formState.actConfirmation, standardized: e.target.checked } })}
                                                            disabled={selectedTopic.status === 'Done'}
                                                        />
                                                        I confirm that the improvement has been standardized and documented.
                                                    </label>
                                                )}
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formState.actConfirmation?.noActionsPending}
                                                        onChange={e => setFormState({ ...formState, actConfirmation: { ...formState.actConfirmation, noActionsPending: e.target.checked } })}
                                                        disabled={selectedTopic.status === 'Done'}
                                                    />
                                                    I confirm that no further operational actions are pending.
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formState.actConfirmation?.readyToClose}
                                                        onChange={e => setFormState({ ...formState, actConfirmation: { ...formState.actConfirmation, readyToClose: e.target.checked } })}
                                                        disabled={selectedTopic.status === 'Done'}
                                                    />
                                                    I confirm that the topic is ready to be closed.
                                                </label>
                                            </div>

                                            {selectedTopic.status === 'Done' && selectedTopic.act?.audit && (
                                                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1rem', fontSize: '11px', color: '#64748b', display: 'flex', gap: '2rem' }}>
                                                    <span>Closed By: <strong>{selectedTopic.act.audit.closedBy}</strong></span>
                                                    <span>Date: <strong>{new Date(selectedTopic.act.audit.closedOn).toLocaleString('de-DE')}</strong></span>
                                                    <span>Final Outcome: <strong style={{ color: 'var(--color-primary)' }}>{selectedTopic.act.audit.finalOutcome}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {viewingStep === selectedTopic.step && (
                            <button
                                className="btn btn-primary"
                                style={{ alignSelf: 'flex-start', padding: '0.9rem 2rem', fontWeight: 600 }}
                                onClick={handleProceed}
                            >
                                {selectedTopic.step === 'ACT' ? 'Close Topic' : 'Complete Step & Proceed'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* My ToDos Section */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>My ToDos (Assigned to Me)</h3>
                    <div className="badge" style={{ background: '#435ebe22', color: 'var(--color-primary)' }}>{myToDos.length} ACTIVE TASKS</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th>Status</th>
                                <th>Task Title</th>
                                <th>Related Topic</th>
                                <th>Step</th>
                                <th>Priority</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myToDos.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No pending tasks.</td></tr>
                            ) : (
                                myToDos.map((t: ToDo) => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`status-dot ${getStatusClass(t.status, t.dueDate)}`}></span>
                                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{getStatusMeta(t.status, t.dueDate).label}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#1a202c' }}>{t.title}</td>
                                        <td style={{ color: '#4a5568', fontSize: '13px' }}>{t.topicTitle}</td>
                                        <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{t.step}</span></td>
                                        <td>{getPriorityBadge(t.priority)}</td>
                                        <td style={{ color: t.status === 'Overdue' ? 'var(--color-danger)' : 'inherit', fontWeight: t.status === 'Overdue' ? 600 : 400 }}>
                                            {new Date(t.dueDate).toLocaleDateString('de-DE')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* My Actions Section (New Worker View) */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>My Actions (Execution Assignments)</h3>
                    <div className="badge" style={{ background: '#ecfccb', color: '#166534' }}>{myActions.length} ASSIGNMENTS</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th>Status</th>
                                <th>Topic</th>
                                <th>Action Title</th>
                                <th>Due Date</th>
                                <th>Teams Meeting</th>
                                <th>My Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myActions.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No actions assigned to you.</td></tr>
                            ) : (
                                myActions.map((a: any) => {
                                    const myAssign = a.assignments.find((p: any) => p.userId === user?.id);
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className={`status-dot ${getStatusClass(a.status, a.dueDate)}`}></span>
                                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{getStatusMeta(a.status, a.dueDate).label}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#1a202c', fontSize: '13px' }}>{a.topicTitle}</td>
                                            <td style={{ fontWeight: 600, color: '#435ebe' }}>{a.title}</td>
                                            <td style={{ fontSize: '13px' }}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString('de-DE') : '-'}</td>
                                            <td style={{ fontSize: '13px', fontWeight: 600 }}>
                                                {a.teamsMeeting ? new Date(a.teamsMeeting).toLocaleString('de-DE') : '-'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={myAssign.completed}
                                                        onChange={(e) => {
                                                            // Find the topic and update it
                                                            const topic = topicsService.getById(a.topicId);
                                                            if (topic) {
                                                                const action = topic.do.actions.find(act => act.id === a.id);
                                                                if (action) {
                                                                    const assign = action.assignments.find(p => p.userId === user?.id);
                                                                    if (assign) {
                                                                        assign.completed = e.target.checked;
                                                                        assign.completedAt = e.target.checked ? new Date().toISOString() : undefined;

                                                                        // Recalculate status
                                                                        const allDone = action.assignments.every(p => p.completed);
                                                                        const anyDone = action.assignments.some(p => p.completed);
                                                                        action.status = allDone ? 'Done' : (anyDone ? 'In Progress' : 'Open');

                                                                        topicsService.update(a.topicId, { do: topic.do });
                                                                        loadData(); // Refresh UI
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        color: myAssign.completed ? '#166534' : '#64748b',
                                                        textDecoration: myAssign.completed ? 'none' : 'none'
                                                    }}>
                                                        {myAssign.completed ? 'COMPLETED' : 'Mark Complete'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* My Topics Section */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', marginTop: '2rem' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>My Topics (Owner Overview)</h3>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Accountable for {myTopics.length} Initiatives</div>
                </div>

                {/* Quick Filters Bar */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: '#fff', display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#64748b' }}>Status:</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {['On Track', 'Critical', 'Warning', 'Done'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => toggleStatus(s)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid',
                                        borderColor: statusFilter.includes(s) ? 'var(--color-primary)' : '#e2e8f0',
                                        background: statusFilter.includes(s) ? 'var(--color-primary-light)' : 'transparent',
                                        color: statusFilter.includes(s) ? 'var(--color-primary)' : '#475569',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#64748b' }}>Step:</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {(['PLAN', 'DO', 'CHECK', 'ACT'] as Step[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => toggleStep(s)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid',
                                        borderColor: stepFilter.includes(s) ? 'var(--color-primary)' : '#e2e8f0',
                                        background: stepFilter.includes(s) ? 'var(--color-primary-light)' : 'transparent',
                                        color: stepFilter.includes(s) ? 'var(--color-primary)' : '#475569',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(statusFilter.length < 4 || stepFilter.length < 4) && (
                        <button
                            onClick={() => { setStatusFilter(['On Track', 'Critical', 'Warning', 'Done']); setStepFilter(['PLAN', 'DO', 'CHECK', 'ACT']); }}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                            <X size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Clear filters
                        </button>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1200px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th>Status</th>
                                <th>PDCA Topic</th>
                                <th>Severity</th>
                                <th>Category</th>
                                <th>Step</th>
                                <th>Due Date</th>
                                <th>Responsible</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTopics.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No topics found.</td></tr>
                            ) : (
                                myTopics.map((t: Topic) => (
                                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTopic(t)}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`status-dot ${getStatusClass(t.status, t.dueDate)}`}></span>
                                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{getStatusMeta(t.status, t.dueDate).label}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#1a202c' }}>{t.title}</div>
                                            <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>KPI: {t.kpi}</div>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: t.severity === 'Business Critical' ? '#fee2e2' : '#f1f5f9',
                                                color: t.severity === 'Business Critical' ? '#991b1b' : '#475569',
                                                fontWeight: 700
                                            }}>{t.severity}</span>
                                        </td>
                                        <td style={{ fontSize: '13px' }}>{t.category}</td>
                                        <td><span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{t.step}</span></td>
                                        <td>{new Date(t.dueDate).toLocaleDateString('de-DE')}</td>
                                        <td style={{ fontSize: '13px', fontWeight: 500 }}>Felix Worker</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Cockpit;
