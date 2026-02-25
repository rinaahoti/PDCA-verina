import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { topicsService, authService, todosService } from '../services';
import { notificationService } from '../services/notifications';
import { Topic, ToDo, Step, EffectivenessStatus, KPIEvaluation, ActOutcome, StandardizationScope, AffectedArea } from '../types';
import { Save, Printer, Mail, ArrowLeft, ChevronRight, ChevronDown, Lock, CheckCircle2, X, AlertTriangle, PlayCircle, BarChart3, RotateCcw, FileText, Globe, GraduationCap, ShieldCheck, Settings, Target, Play, Calendar, TrendingUp, MapPin, Building2, Users } from 'lucide-react';
import { getStatusMeta, getStatusBadgeStyle, getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import { useLanguage } from '../contexts/LanguageContext';
import DateTimePicker from '../components/DateTimePicker';


import { generatePlanDoCheckCombinedPdf } from '../utils/pdfGenerator';

const Cockpit: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const user = authService.getCurrentUser();

    const [topics, setTopics] = useState<Topic[]>([]);
    const [todos, setTodos] = useState<ToDo[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [viewingStep, setViewingStep] = useState<Step>('PLAN');
    const [showPdfModal, setShowPdfModal] = useState(false);

    // Create Mode State
    const [createState, setCreateState] = useState({
        title: '',
        goal: '',
        description: '',
        asIs: '',
        toBe: '',
        rootCause: '',
        improvementPurpose: [] as string[],
        dueDate: '',
        step: 'PLAN' as Step,
        status: 'Monitoring'
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

    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [stepFilter, setStepFilter] = useState<Step[]>([]);
    const [isSaved, setIsSaved] = useState(false);
    const [emailStatus, setEmailStatus] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: '' });

    // Location & Department state (PLAN page only)
    const [locationDeptTab, setLocationDeptTab] = useState<'locations' | 'departments'>('locations');
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [planMeetingExpanded, setPlanMeetingExpanded] = useState(false);
    const [checkMeetingExpanded, setCheckMeetingExpanded] = useState(false);
    const [checkMeetingPickerOpen, setCheckMeetingPickerOpen] = useState(false);
    const [planMeetingPickerOpen, setPlanMeetingPickerOpen] = useState(false);
    const [doActionPickerOpenIdx, setDoActionPickerOpenIdx] = useState<number | null>(null);
    const doResponsiblePickerRef = useRef<HTMLDivElement | null>(null);

    const LOCATION_OPTIONS = [
        'Prishtina ',
        'Prizren ',
        'Peja ',
        'Mitrovica ',
        'Gjakova '
    ];
    const DEPARTMENT_OPTIONS = [
        'Finance',
        'HR & Staff',
        'IT & Development',
        'Marketing',
        'Communications',
        'Senior Management'
    ];

    // PLAN Phase Meeting state
    const [planMeeting, setPlanMeeting] = useState<{
        title: string;
        responsiblePersons: string[];
        checkedPersons: string[];
        meetingType: string;
        meetingDateTime: string;
        location: string;
        showDropdown: boolean;
        checkTriggerDate: string;
    }>({
        title: '',
        responsiblePersons: [],
        checkedPersons: [],
        meetingType: 'In-Office (On-site)',
        meetingDateTime: '',
        location: '',
        showDropdown: false,
        checkTriggerDate: ''
    });

    // CHECK Phase Meeting state (replicated from PLAN)
    const [checkMeeting, setCheckMeeting] = useState<{
        title: string;
        responsiblePersons: string[];
        checkedPersons: string[];
        meetingType: string;
        meetingDateTime: string;
        location: string;
        showDropdown: boolean;
        checkTriggerDate: string;
    }>({
        title: '',
        responsiblePersons: [],
        checkedPersons: [],
        meetingType: 'In-Office (On-site)',
        meetingDateTime: '',
        location: '',
        showDropdown: false,
        checkTriggerDate: ''
    });

    const PERSONS = [
        'Dr. Elena Rossi',
        'Dr. Marcus Weber',
        'Sarah Johnson',
        'Robert Miller',
        'Dr. Julia Chen',
        'James Wilson',
        'Anna Müller',
        'Thomas Becker',
        'Laura Schmidt',
        'Dr. Stefan Vogel',
        'Maria Hoffmann',
        'Florian Braun',
        'Katrin Neumann'
    ];

    // UI-only: department labels for the CHECK picker dropdown (Photo 3)
    const PERSON_DEPT: Record<string, string> = {
        'Dr. Elena Rossi': 'Medical',
        'Dr. Marcus Weber': 'Medical',
        'Sarah Johnson': 'HR & Staff',
        'Robert Miller': 'HR & Staff',
        'Dr. Julia Chen': 'Medical',
        'James Wilson': 'IT',
        'Anna Müller': 'HR & Staff',
        'Thomas Becker': 'IT',
        'Laura Schmidt': 'Finance',
        'Dr. Stefan Vogel': 'Medical',
        'Maria Hoffmann': 'Communications',
        'Florian Braun': 'IT',
        'Katrin Neumann': 'HR & Staff'
    };

    // UI-only: avatar background colors cycling list
    const AVATAR_COLORS = ['#5FAE9E', '#7C3AED', '#D97706', '#DC2626', '#2563EB', '#059669', '#9333EA', '#0369A1'];
    const getAvatarColor = (name: string): string => {
        const idx = PERSONS.indexOf(name);
        return AVATAR_COLORS[idx >= 0 ? idx % AVATAR_COLORS.length : 0];
    };
    const getInitials = (name: string): string => {
        return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

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
                description: selectedTopic.plan.description || '',
                goal: selectedTopic.plan.goal || '',
                asIs: selectedTopic.plan.asIs || '',
                toBe: selectedTopic.plan.toBe || '',
                rootCause: selectedTopic.plan.rootCause || '',
                improvementPurpose: selectedTopic.plan.improvementPurpose || selectedTopic.plan.objectives || [],
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

    // DO-only: ensure Responsible Persons picker renders full height on first open.
    useLayoutEffect(() => {
        if (viewingStep !== 'DO' || doActionPickerOpenIdx === null) return;
        const frame = requestAnimationFrame(() => {
            const panel = doResponsiblePickerRef.current;
            if (!panel) return;
            panel.style.height = '245px';
            panel.style.maxHeight = '245px';
            panel.scrollTop = 0;
            panel.getBoundingClientRect();
        });
        return () => cancelAnimationFrame(frame);
    }, [viewingStep, doActionPickerOpenIdx]);

    const getTranslatedTopicTitle = (title: string) => {
        const titleMap: Record<string, string> = {
            'Reduction of Post-operative Infection Rates': 'Reduktion postoperativer Infektionsraten',
            'Medication Administration Error Reduction': 'Reduktion von Medikationsfehlern',
            'Patient Fall Prevention Protocol Compliance': 'Einhaltung des Sturzpräventionsprotokolls'
        };
        return titleMap[title] || title;
    };

    const getTranslatedKPI = (kpi: string) => {
        const kpiMap: Record<string, string> = {
            'Infection rate < 0.5%': 'Infektionsrate < 0,5 %',
            'Zero high-risk medication errors': 'Keine Hochrisiko-Medikationsfehler',
            '100% compliance with fall risk assessments': '100 % Einhaltung der Sturzrisikobewertungen'
        };
        return kpiMap[kpi] || kpi;
    };

    const getTranslatedTaskTitle = (title: string) => {
        const taskMap: Record<string, string> = {
            'Audit Sterile Field Documentation': 'Audit der Dokumentation des sterilen Feldes',
            'Validate Barcode Scanner Calibration': 'Validierung der Kalibrierung des Barcode-Scanners'
        };
        return taskMap[title] || title;
    };

    const myToDos = todos.filter((t: ToDo) => t.status !== 'Critical');

    // Derived: My Assigned Actions from Topics
    const myActions = topics.flatMap(t =>
        (t.do?.actions || [])
            .filter(a => a.assignments?.some((assign: any) => assign.userId === user?.id))
            .filter(a => a.status !== 'Done') // Filter out Done actions to show only active executions
            .map(a => ({
                ...a,
                topicId: t.id,
                topicTitle: t.title,
                myAssignment: a.assignments.find((assign: any) => assign.userId === user?.id)
            }))
    );



    const myTopics = topics.filter((t: Topic) => {
        const isOwner = t.ownerId === user?.id;
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(t.status);
        const matchesStep = stepFilter.length === 0 || stepFilter.includes(t.step);

        // Filter out Done status and ACT phase as requested for this view
        const isNotDone = t.status !== 'Done';
        const isNotAct = t.step !== 'ACT';

        return isOwner && matchesStatus && matchesStep && isNotDone && isNotAct;
    });

    const toggleStatus = (status: string) => {
        setStatusFilter(prev => prev.includes(status) ? [] : [status]);
    };

    const toggleStep = (step: Step) => {
        setStepFilter(prev => prev.includes(step) ? [] : [step]);
    };

    const handleSave = async () => {
        if (!selectedTopic) return;
        topicsService.update(selectedTopic.id, {
            title: formState.title,
            dueDate: formState.dueDate,
            plan: { description: formState.description, goal: formState.goal, asIs: formState.asIs, toBe: formState.toBe, rootCause: formState.rootCause, improvementPurpose: formState.improvementPurpose || [], objectives: formState.improvementPurpose || [] } as any,
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
                        subject: `[VIRENA – PDCA] Action Assignment: ${selectedTopic?.title}`,
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
            status: createState.status as any,
            category: 'Clinical',
            kpi: '-',
            objective: '-',
            dueDate: createState.dueDate,
            step: 'DO' // Automatically start at DO phase
        });

        // Update plan data immediately and mark as complete
        topicsService.update(newTopic.id, {
            plan: {
                ...newTopic.plan,
                description: createState.description,
                goal: createState.goal,
                asIs: createState.asIs,
                toBe: createState.toBe,
                rootCause: createState.rootCause,
                improvementPurpose: createState.improvementPurpose,
                objectives: createState.improvementPurpose,
                completedAt: new Date().toISOString()
            },
            step: 'DO'
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
        // Validation for DO phase
        if (selectedTopic.step === 'DO') {
            // No mandatory fields for DO phase - user can save/proceed with partial info
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
            // Enforce KPI Status only if Partially Effective
            if (formState.effectivenessStatus === 'Partially Effective') {
                const missingStatus = formState.kpiEvaluations.find((k: any) => !k.status);
                if (missingStatus) {
                    alert('Validation Error: KPI Status (Achieved/Not Achieved) is required for all KPIs when effectiveness is "Partially Effective".');
                    return;
                }
            }
        }

        // Validation for ACT phase (Closing)
        if (selectedTopic.step === 'ACT') {
            if (!formState.actOutcome) {
                alert('Validation Error: An ACT Outcome must be selected.');
                return;
            }

            // Enforce Check-Act Logic
            if (formState.actOutcome === 'Standardize' && formState.effectivenessStatus !== 'Effective') {
                alert('Validation Error: "Standardize" is only available when the Effectiveness Assessment is "Effective".');
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

            // Lessons Learned is optional - no validation required

            // Confirmation Checklist
            if (formState.actOutcome === 'Standardize') {
                if (!formState.actConfirmation.standardized) {
                    alert('Validation Error: You must confirm that the improvement has been standardized.');
                    return;
                }
            } else {
                // For Non-Standardize outcomes (Improve / Close)
                if (formState.actOutcome !== 'Close without Standardization' && !formState.actConfirmation.noActionsPending) {
                    alert('Validation Error: You must confirm that ' + (formState.actOutcome === 'Improve & Re-run PDCA' ? 'the PDCA will be rerun for improvements.' : 'no further operational actions are pending.'));
                    return;
                }
                // Ready to Close required ONLY for Close without Standardization
                if (formState.actOutcome === 'Close without Standardization' && !formState.actConfirmation.readyToClose) {
                    alert('Validation Error: You must confirm that the topic is ready to be closed.');
                    return;
                }
            }
        }

        const steps: Step[] = ['PLAN', 'DO', 'CHECK', 'ACT'];
        const currentIdx = steps.indexOf(selectedTopic.step);

        // SYNC: Update localStorage with latest formState BEFORE proceeding
        topicsService.update(selectedTopic.id, {
            title: formState.title,
            dueDate: formState.dueDate,
            plan: { description: formState.description, goal: formState.goal, asIs: formState.asIs, toBe: formState.toBe, rootCause: formState.rootCause, improvementPurpose: formState.improvementPurpose || [], objectives: formState.improvementPurpose || [] },
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
                description: formState.description, goal: formState.goal, asIs: formState.asIs, toBe: formState.toBe, rootCause: formState.rootCause, improvementPurpose: formState.improvementPurpose || [], objectives: formState.improvementPurpose || [],
                completedAt: new Date().toISOString()
            };
            if (selectedTopic.step === 'DO') (updates as any).do = {
                checkDate: formState.checkDate, actions: formState.actions,
                completedAt: new Date().toISOString()
            };
            if (selectedTopic.step === 'CHECK') {
                (updates as any).check = {
                    kpis: formState.kpis,
                    kpiResults: formState.kpiResults,
                    effectivenessReview: formState.effectivenessReview,
                    effectivenessStatus: formState.effectivenessStatus,
                    kpiEvaluations: formState.kpiEvaluations,
                    audit: { checkedBy: user?.name || 'Unknown', checkedOn: new Date().toISOString() },
                    completedAt: new Date().toISOString()
                };
                updates.status = 'Done' as const;
            }

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
        topicsService.update(selectedTopic.id, { status: 'Monitoring' });
        loadData();
        window.dispatchEvent(new Event('storage'));
    };

    const getStatusClass = (status: string, dueDate?: string, completed?: boolean) => {
        return getStatusMeta(status, dueDate, completed).class;
    };

    const isStepClickable = (step: Step) => {
        const steps: Step[] = ['PLAN', 'DO', 'CHECK', 'ACT'];
        const currentIdx = steps.indexOf(selectedTopic?.step || 'PLAN');
        const targetIdx = steps.indexOf(step);
        return targetIdx <= currentIdx + 1; // Allow proceeding to next step
    };

    // CREATE MODE VIEW
    if (mode === 'create') {
        return (
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="action-bar">
                        <button
                            className="action-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                // Validation
                                if (!createState.title.trim()) { alert('Title is required'); return; }
                                if (!createState.goal.trim()) { alert(t('pdca.goalRequired')); return; }
                                if (!createState.asIs.trim()) { alert('AS-IS (Current State) is required'); return; }
                                if (!createState.toBe.trim()) { alert('TO-BE (Target State) is required'); return; }

                                // Auto-Save Logic (Create as PLAN)
                                const newTopic = topicsService.add({
                                    title: createState.title,
                                    ownerId: user?.id || '',
                                    responsibleId: 'u2',
                                    status: createState.status as any,
                                    category: 'Clinical',
                                    kpi: '-',
                                    objective: '-',
                                    dueDate: createState.dueDate,
                                    step: 'PLAN'
                                });

                                topicsService.update(newTopic.id, {
                                    plan: {
                                        description: createState.description,
                                        goal: createState.goal,
                                        asIs: createState.asIs,
                                        toBe: createState.toBe,
                                        rootCause: createState.rootCause,
                                        improvementPurpose: createState.improvementPurpose,
                                        objectives: createState.improvementPurpose,
                                        completedAt: new Date().toISOString()
                                    }
                                });

                                window.dispatchEvent(new Event('storage'));
                                loadData();
                                setSearchParams({});
                                setSelectedTopic(null);
                            }}
                            style={{ background: '#cbeee2', color: '#5FAE9E', border: 'none', width: '100px', flexDirection: 'row', gap: '8px', fontSize: '14px' }}
                        >
                            <ArrowLeft size={16} /> {t('common.back')}
                        </button>
                        <button className="action-btn" onClick={() => setSearchParams({})}><X size={16} /> {t('common.cancel')}</button>
                    </div>
                    <span className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px' }}>{t('pdca.draft')}</span>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 700, color: 'var(--color-text)' }}>{t('pdca.newTopic')}</h1>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
                        Ref ID: NEW | {t('common.owner')}: {user?.name}
                    </div>
                </div>

                <div className="detail-view">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: '0.5rem 0' }}>
                            <div style={{ padding: '1rem', fontWeight: 700, fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('pdca.processLifecycle')}</div>
                            <div className="lifecycle-stepper">
                                {['PLAN', 'DO', 'CHECK', 'ACT'].map((step, i) => (
                                    <div key={step} className={`lifecycle-step ${step === 'PLAN' ? 'active' : ''}`} style={{ cursor: 'default', background: step === 'PLAN' ? '#cbeee2' : 'transparent', color: step === 'PLAN' ? '#5FAE9E' : 'inherit', borderLeftColor: step === 'PLAN' ? '#5FAE9E' : 'transparent' }}>
                                        <div className="lifecycle-step-num" style={{ background: step === 'PLAN' ? '#5FAE9E' : 'var(--color-border)', color: step === 'PLAN' ? 'white' : 'inherit' }}>{i + 1}</div>
                                        <span>{step.charAt(0) + step.slice(1).toLowerCase()}</span>
                                        {step !== 'PLAN' && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            background: '#fff',
                            borderRadius: '16px',
                            border: '1px solid #e8ecf0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            padding: '1.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                                <span style={{ fontSize: '20px' }}></span>
                                <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>{t('pdca.checkTrigger')}</span>
                            </div>
                            <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.25rem' }} />

                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
                            <input
                                type="date"
                                value={planMeeting.checkTriggerDate}
                                onChange={e => setPlanMeeting({ ...planMeeting, checkTriggerDate: e.target.value })}
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '0.65rem 0.9rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    fontSize: '13px',
                                    color: '#334155',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    marginBottom: '0.5rem'
                                }}
                            />
                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                Please specify when the effectiveness check will be performed.
                            </div>
                        </div>

                        <div style={{
                            background: '#fff',
                            borderRadius: '16px',
                            border: '1px solid #e8ecf0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            padding: '1.75rem',
                            position: 'relative'
                        }}>
                            <div
                                onClick={() => setPlanMeetingExpanded(prev => !prev)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    marginBottom: planMeetingExpanded ? '1rem' : '0',
                                    userSelect: 'none'
                                }}
                            >
                                <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a202c' }}>PLAN Phase Meeting</span>
                                <ChevronDown
                                    size={20}
                                    color="#64748b"
                                    style={{
                                        transition: 'transform 0.25s ease',
                                        transform: planMeetingExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                />
                            </div>
                            {planMeetingExpanded && (
                                <>
                                    <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.5rem' }} />

                                    <input
                                        type="text"
                                        value={planMeeting.title}
                                        onChange={e => setPlanMeeting({ ...planMeeting, title: e.target.value })}
                                        placeholder="Meeting title"
                                        style={{
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '10px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: '14px',
                                            color: '#334155',
                                            outline: 'none',
                                            marginBottom: '1.25rem'
                                        }}
                                    />

                                    <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>RESPONSIBLE PERSONS</div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', minWidth: '140px' }}>
                                                {planMeeting.responsiblePersons.slice(0, 4).map((person, idx) => (
                                                    <div
                                                        key={person}
                                                        title={person}
                                                        style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            background: getAvatarColor(person), color: '#fff', fontSize: '11px',
                                                            fontWeight: 700, display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', border: '2px solid #fff',
                                                            marginLeft: idx === 0 ? 0 : '-8px', zIndex: 10 - idx,
                                                            position: 'relative', cursor: 'default', letterSpacing: '0.02em'
                                                        }}
                                                    >
                                                        {getInitials(person)}
                                                    </div>
                                                ))}
                                                {planMeeting.responsiblePersons.length > 4 && (
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%', background: '#64748b',
                                                        color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
                                                        marginLeft: '-8px', zIndex: 5, position: 'relative', letterSpacing: '0.01em'
                                                    }}>
                                                        +{planMeeting.responsiblePersons.length - 4}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setPlanMeetingPickerOpen(prev => !prev)}
                                                style={{
                                                    background: 'transparent', border: '1.5px dashed #5FAE9E',
                                                    borderRadius: '20px', padding: '4px 14px', fontSize: '13px',
                                                    color: '#5FAE9E', cursor: 'pointer', fontWeight: 600,
                                                    letterSpacing: '0.01em', transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#f0fdfa')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >- Ndrysho</button>
                                        </div>

                                        {planMeetingPickerOpen && (
                                            <div style={{
                                                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999,
                                                background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.13)', minWidth: '300px',
                                                height: '245px', maxHeight: '245px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column'
                                            }}>
                                                {PERSONS.map(person => {
                                                    const isSelected = planMeeting.responsiblePersons.includes(person);
                                                    return (
                                                        <div
                                                            key={person}
                                                            onClick={() => {
                                                                const updated = isSelected
                                                                    ? planMeeting.responsiblePersons.filter(p => p !== person)
                                                                    : [...planMeeting.responsiblePersons, person];
                                                                const updatedChecked = isSelected
                                                                    ? planMeeting.checkedPersons.filter(p => p !== person)
                                                                    : planMeeting.checkedPersons;
                                                                setPlanMeeting({ ...planMeeting, responsiblePersons: updated, checkedPersons: updatedChecked });
                                                            }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px',
                                                                cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                                                                background: isSelected ? '#f0fdfa' : '#fff', transition: 'background 0.12s'
                                                            }}
                                                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#f0fdfa' : '#fff'; }}
                                                        >
                                                            <input type="checkbox" readOnly checked={isSelected}
                                                                style={{ width: '15px', height: '15px', accentColor: '#5FAE9E', cursor: 'pointer', flexShrink: 0, margin: 0 }}
                                                            />
                                                            <div style={{
                                                                width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(person),
                                                                color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                            }}>{getInitials(person)}</div>
                                                            <span style={{ fontSize: '13px', color: '#334155', fontWeight: isSelected ? 600 : 400 }}>{person}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>MEETING TYPE</div>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={planMeeting.meetingType}
                                                onChange={e => setPlanMeeting({ ...planMeeting, meetingType: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    appearance: 'none',
                                                    WebkitAppearance: 'none',
                                                    padding: '0.7rem 2.5rem 0.7rem 1rem',
                                                    borderRadius: '10px',
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    fontSize: '13px',
                                                    color: '#334155',
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option>In-Office (On-site)</option>
                                                <option>Remote (Online)</option>
                                                <option>Hybrid</option>
                                            </select>
                                            <ChevronDown size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>MEETING DATE & TIME</div>
                                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                <DateTimePicker
                                                    value={planMeeting.meetingDateTime}
                                                    onChange={val => setPlanMeeting({ ...planMeeting, meetingDateTime: val })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{planMeeting.meetingType === 'Remote (Online)' ? 'MEETING LINK' : 'OFFICE / LOCATION'}</div>
                                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                <input
                                                    type="text"
                                                    value={planMeeting.location}
                                                    onChange={e => setPlanMeeting({ ...planMeeting, location: e.target.value })}
                                                    placeholder={planMeeting.meetingType === 'Remote (Online)' ? 'Paste meeting link... (https://)' : 'Location'}
                                                    style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#64748b', outline: 'none', width: '100%', padding: 0 }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => { }}
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem 1rem',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: 'linear-gradient(90deg, #3AAFA9 0%, #2B9E97 100%)',
                                                color: '#fff',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                letterSpacing: '0.02em',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                boxShadow: '0 2px 8px rgba(58,175,169,0.18)',
                                                transition: 'opacity 0.15s, box-shadow 0.15s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(58,175,169,0.28)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(58,175,169,0.18)'; }}
                                        >
                                            <span style={{ fontSize: '15px' }}></span>
                                            Send Meeting Invites
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: 0, overflow: viewingStep === 'DO' ? 'visible' : 'hidden' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--color-border)', background: '#fcfcfd' }}>
                                <h3 style={{ margin: 0 }}>{t('pdca.planData')}</h3>
                            </div>
                            <div style={{ padding: '1.75rem' }}>
                                <form onSubmit={handleCreate}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600 }}>{t('common.title')} <span style={{ color: 'red' }}>*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={createState.title}
                                            onChange={e => setCreateState({ ...createState, title: e.target.value })}
                                            placeholder={t('pdca.titlePlaceholder')}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600 }}>{t('pdca.goal')} <span style={{ color: 'red' }}>*</span></label>
                                        <textarea
                                            rows={3}
                                            required
                                            value={createState.goal}
                                            onChange={e => setCreateState({ ...createState, goal: e.target.value })}
                                            placeholder={t('pdca.goalPlaceholder')}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <label style={{ fontWeight: 600 }}>{t('pdca.asIs')} <span style={{ color: 'red' }}>*</span></label>
                                            <textarea
                                                rows={4}
                                                required
                                                value={createState.asIs}
                                                onChange={e => setCreateState({ ...createState, asIs: e.target.value })}
                                                placeholder={t('pdca.asIsPlaceholder')}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: 600 }}>{t('pdca.toBe')} <span style={{ color: 'red' }}>*</span></label>
                                            <textarea
                                                rows={4}
                                                required
                                                value={createState.toBe}
                                                onChange={e => setCreateState({ ...createState, toBe: e.target.value })}
                                                placeholder={t('pdca.toBePlaceholder')}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600 }}>{t('pdca.rootCause')}</label>
                                        <textarea
                                            rows={2}
                                            value={createState.rootCause}
                                            onChange={e => setCreateState({ ...createState, rootCause: e.target.value })}
                                            placeholder={t('pdca.rootCausePlaceholder')}
                                        />
                                    </div>

                                    {/* IMPROVEMENT PURPOSE (Verbesserungszweck) */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <TrendingUp size={20} color="#5FAE9E" strokeWidth={2} />
                                            <label style={{ fontWeight: 600, margin: 0 }}>{t('pdca.improvementPurpose')}</label>
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                            {[
                                                { value: 'SAFETY_CRITICAL', label: t('pdca.improvementPurposeSafetyCritical'), bold: true },
                                                { value: 'SAVE_TIME', label: t('pdca.improvementPurposeSaveTime') },
                                                { value: 'REDUCE_COSTS', label: t('pdca.improvementPurposeReduceCosts') },
                                                { value: 'INCREASE_QUALITY', label: t('pdca.improvementPurposeIncreaseQuality') }
                                            ].map(option => (
                                                <label
                                                    key={option.value}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '0.75rem 0',
                                                        cursor: 'pointer',
                                                        gap: '0.75rem'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={createState.improvementPurpose.includes(option.value)}
                                                        onChange={e => {
                                                            const newPurposes = e.target.checked
                                                                ? [...createState.improvementPurpose, option.value]
                                                                : createState.improvementPurpose.filter((p: string) => p !== option.value);
                                                            setCreateState({ ...createState, improvementPurpose: newPurposes });
                                                        }}
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            cursor: 'pointer',
                                                            accentColor: '#5FAE9E'
                                                        }}
                                                    />
                                                    <span style={{ fontWeight: option.bold ? 600 : 400, fontSize: '14px' }}>
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600 }}>{t('pdca.cycle')}</label>
                                        <textarea
                                            rows={4}
                                            value={createState.description || ''}
                                            onChange={e => setCreateState({ ...createState, description: e.target.value })}
                                            placeholder={t('pdca.cyclePlaceholder')}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <MapPin size={20} color="#5FAE9E" strokeWidth={2} />
                                            <label style={{ fontWeight: 600, margin: 0 }}>Location & Department</label>
                                        </div>
                                        <div style={{
                                            borderRadius: '12px',
                                            border: '1px solid #e8ecf0',
                                            padding: '1.5rem',
                                            background: '#fff'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                gap: '0',
                                                borderBottom: '2px solid #e8ecf0',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setLocationDeptTab('locations')}
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        padding: '10px 0',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: locationDeptTab === 'locations' ? '#5FAE9E' : '#94a3b8',
                                                        borderBottom: locationDeptTab === 'locations' ? '2.5px solid #5FAE9E' : '2.5px solid transparent',
                                                        marginBottom: '-2px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Building2 size={15} />
                                                    Locations
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLocationDeptTab('departments')}
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        padding: '10px 0',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: locationDeptTab === 'departments' ? '#5FAE9E' : '#94a3b8',
                                                        borderBottom: locationDeptTab === 'departments' ? '2.5px solid #5FAE9E' : '2.5px solid transparent',
                                                        marginBottom: '-2px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Users size={15} />
                                                    Departments
                                                </button>
                                            </div>

                                            {locationDeptTab === 'locations' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                                    {LOCATION_OPTIONS.map((loc) => {
                                                        const isSelected = selectedLocations.includes(loc);
                                                        return (
                                                            <label
                                                                key={loc}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '12px',
                                                                    padding: '12px 14px',
                                                                    borderRadius: '10px',
                                                                    cursor: 'pointer',
                                                                    background: isSelected ? '#edf8f5' : 'transparent',
                                                                    transition: 'background 0.18s ease',
                                                                    marginBottom: '2px'
                                                                }}
                                                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafb'; }}
                                                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        setSelectedLocations(prev =>
                                                                            prev.includes(loc)
                                                                                ? prev.filter(l => l !== loc)
                                                                                : [...prev, loc]
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        cursor: 'pointer',
                                                                        accentColor: '#5FAE9E',
                                                                        borderRadius: '6px',
                                                                        flexShrink: 0
                                                                    }}
                                                                />
                                                                <span style={{
                                                                    fontSize: '14px',
                                                                    color: isSelected ? '#1a202c' : '#475569',
                                                                    fontWeight: isSelected ? 600 : 400
                                                                }}>{loc}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {locationDeptTab === 'departments' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                                    {DEPARTMENT_OPTIONS.map((dept) => {
                                                        const isSelected = selectedDepartments.includes(dept);
                                                        return (
                                                            <label
                                                                key={dept}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '12px',
                                                                    padding: '12px 14px',
                                                                    borderRadius: '10px',
                                                                    cursor: 'pointer',
                                                                    background: isSelected ? '#edf8f5' : 'transparent',
                                                                    transition: 'background 0.18s ease',
                                                                    marginBottom: '2px'
                                                                }}
                                                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafb'; }}
                                                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        setSelectedDepartments(prev =>
                                                                            prev.includes(dept)
                                                                                ? prev.filter(d => d !== dept)
                                                                                : [...prev, dept]
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        cursor: 'pointer',
                                                                        accentColor: '#5FAE9E',
                                                                        borderRadius: '6px',
                                                                        flexShrink: 0
                                                                    }}
                                                                />
                                                                <span style={{
                                                                    fontSize: '14px',
                                                                    color: isSelected ? '#1a202c' : '#475569',
                                                                    fontWeight: isSelected ? 600 : 400
                                                                }}>{dept}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div style={{ borderTop: '1px solid #e8ecf0', marginTop: '14px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#94a3b8',
                                                        letterSpacing: '0.08em',
                                                        textTransform: 'uppercase',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <MapPin size={13} />
                                                        SELECTED LOCATIONS
                                                    </div>
                                                    {selectedLocations.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                            {selectedLocations.map(loc => (
                                                                <span
                                                                    key={loc}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        background: '#5FAE9E',
                                                                        color: '#fff',
                                                                        borderRadius: '20px',
                                                                        padding: '5px 12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        lineHeight: '1.3'
                                                                    }}
                                                                >
                                                                    {loc}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedLocations(prev => prev.filter(l => l !== loc))}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#fff',
                                                                            cursor: 'pointer',
                                                                            padding: '0',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            lineHeight: 1,
                                                                            opacity: 0.85
                                                                        }}
                                                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; }}
                                                                    >
                                                                        <X size={14} strokeWidth={2.5} />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#94a3b8',
                                                        letterSpacing: '0.08em',
                                                        textTransform: 'uppercase',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <Users size={13} />
                                                        SELECTED DEPARTMENTS
                                                    </div>
                                                    {selectedDepartments.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                            {selectedDepartments.map(dept => (
                                                                <span
                                                                    key={dept}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        background: '#5FAE9E',
                                                                        color: '#fff',
                                                                        borderRadius: '20px',
                                                                        padding: '5px 12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        lineHeight: '1.3'
                                                                    }}
                                                                >
                                                                    {dept}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedDepartments(prev => prev.filter(d => d !== dept))}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#fff',
                                                                            cursor: 'pointer',
                                                                            padding: '0',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            lineHeight: 1,
                                                                            opacity: 0.85
                                                                        }}
                                                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; }}
                                                                    >
                                                                        <X size={14} strokeWidth={2.5} />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>{t('common.status')}</label>
                                        <select
                                            value={createState.status}
                                            onChange={e => setCreateState({ ...createState, status: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid var(--color-border)',
                                                fontWeight: 600,
                                                color: getStatusColor(createState.status)
                                            }}
                                        >
                                            <option value="Monitoring" style={{ color: '#16a34a', fontWeight: 600 }}>{t('pdca.monitoring')}</option>
                                            <option value="Warning" style={{ color: '#ca8a04', fontWeight: 600 }}>{t('pdca.warningNearAlert')}</option>
                                            <option value="Critical" style={{ color: '#dc2626', fontWeight: 600 }}>{t('pdca.criticalAlert')}</option>
                                        </select>
                                    </div>

                                </form>
                            </div>
                        </div>
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
                        <button className="action-btn" onClick={() => { handleSave(); setSelectedTopic(null); }} style={{ background: '#cbeee2', color: '#5FAE9E', border: 'none', width: '100px', flexDirection: 'row', gap: '8px', fontSize: '14px' }}>
                            <ArrowLeft size={16} /> {t('common.back')}
                        </button>
                        {selectedTopic.status === 'Done' && (
                            <button className="action-btn" style={{ color: 'var(--color-primary)' }} onClick={handleReopen}>
                                <CheckCircle2 size={16} /> {t('pdca.reopenTopic')}
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isSaved && <span style={{ color: 'var(--color-status-green)', fontWeight: 700, fontSize: '12px' }}>{t('pdca.saveSaved')}</span>}
                        {/* Email status notification removed as per user request */}
                        <span className="badge" style={{ ...getStatusBadgeStyle(selectedTopic.status), padding: '6px 12px' }}>{getStatusLabel(t, selectedTopic.status).toUpperCase()}</span>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 700, color: '#1a202c' }}>{selectedTopic.title}</h1>
                    <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                        Ref ID: {selectedTopic.id} | {t('common.owner')}: Sophia Mayer
                    </div>
                </div>

                {selectedTopic.status === 'Done' && (selectedTopic.step !== 'ACT' || !!selectedTopic.act?.completedAt) && (
                    <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid var(--color-status-done)', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Lock size={18} color="var(--color-status-done)" />
                        <div style={{ fontSize: '14px', color: '#475569' }}>
                            <strong>{t('pdca.topicClosedReadOnly')}</strong>
                        </div>
                    </div>
                )}

                <div className="detail-view">
                    {/* Stepper column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: '0.5rem 0' }}>
                            <div style={{ padding: '1rem', fontWeight: 700, fontSize: '12px', color: '#94a3b8' }}>{t('pdca.processLifecycle')}</div>
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
                                            style={{
                                                cursor: clickable ? 'pointer' : 'not-allowed',
                                                opacity: clickable ? 1 : 0.5,
                                                background: isViewing ? '#cbeee2' : 'transparent',
                                                color: isViewing ? '#5FAE9E' : 'inherit',
                                                borderLeftColor: isViewing ? '#5FAE9E' : 'transparent'
                                            }}
                                            onClick={() => {
                                                if (clickable) {
                                                    const steps = ['PLAN', 'DO', 'CHECK', 'ACT'];
                                                    const currentIdx = steps.indexOf(selectedTopic.step);
                                                    const targetIdx = i;

                                                    if (targetIdx === currentIdx + 1) {
                                                        handleProceed();
                                                    } else if (targetIdx <= currentIdx) {
                                                        handleSave();
                                                        setViewingStep(step);
                                                    }
                                                }
                                            }}
                                        >
                                            <div className="lifecycle-step-num" style={{ background: isViewing ? '#5FAE9E' : 'var(--color-border)', color: isViewing ? 'white' : 'inherit' }}>
                                                {isPast ? <CheckCircle2 size={12} /> : i + 1}
                                            </div>
                                            <span>{step.charAt(0) + step.slice(1).toLowerCase()}</span>
                                            {!clickable && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                                            {isCurrent && !isViewing && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5FAE9E', marginLeft: 'auto' }}></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>


                        {/* DO Phase Activation Card (sidebar) */}
                        {viewingStep === 'DO' && (
                            <div style={{
                                background: '#fff',
                                borderRadius: '16px',
                                border: '1px solid #e8ecf0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                padding: '1.75rem'
                            }}>
                                {/* Header — identical to PLAN/CHECK */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                                    <span style={{ fontSize: '20px' }}></span>
                                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>Check Phase Activation</span>
                                </div>
                                <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.25rem' }} />

                                {/* Due Date */}
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
                                <input
                                    type="date"
                                    value={formState.checkDate}
                                    onChange={e => setFormState({ ...formState, checkDate: e.target.value })}
                                    disabled={selectedTopic.status === 'Done'}
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        padding: '0.65rem 0.9rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        fontSize: '13px',
                                        color: '#334155',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        marginBottom: '0.5rem'
                                    }}
                                />
                                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                    Please specify when the effectiveness check will be performed.
                                </div>
                            </div>
                        )}


                        {/* PLAN Phase Meeting Card */}
                        {viewingStep === 'PLAN' && (
                            <>
                                {/* DO Phase Activation Card (separate) */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: '16px',
                                    border: '1px solid #e8ecf0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                    padding: '1.75rem'
                                }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                                        <span style={{ fontSize: '20px' }}></span>
                                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>{t('pdca.checkTrigger')}</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.25rem' }} />

                                    {/* Due Date */}
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
                                    <input
                                        type="date"
                                        value={planMeeting.checkTriggerDate}
                                        onChange={e => setPlanMeeting({ ...planMeeting, checkTriggerDate: e.target.value })}
                                        style={{
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            padding: '0.65rem 0.9rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: '13px',
                                            color: '#334155',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            marginBottom: '0.5rem'
                                        }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                        Please specify when the effectiveness check will be performed.
                                    </div>
                                </div>

                                {/* PLAN Phase Meeting Card */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: '16px',
                                    border: '1px solid #e8ecf0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                    padding: '1.75rem',
                                    position: 'relative'
                                }}>
                                    {/* Header — clickable toggle */}
                                    <div
                                        onClick={() => setPlanMeetingExpanded(prev => !prev)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            marginBottom: planMeetingExpanded ? '1rem' : '0',
                                            userSelect: 'none'
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a202c' }}>PLAN Phase Meeting</span>
                                        <ChevronDown
                                            size={20}
                                            color="#64748b"
                                            style={{
                                                transition: 'transform 0.25s ease',
                                                transform: planMeetingExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                            }}
                                        />
                                    </div>
                                    {planMeetingExpanded && (
                                        <>
                                            <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.5rem' }} />

                                            {/* A) Meeting Title Input */}
                                            <input
                                                type="text"
                                                value={planMeeting.title}
                                                onChange={e => setPlanMeeting({ ...planMeeting, title: e.target.value })}
                                                placeholder="Meeting title"
                                                style={{
                                                    width: '100%',
                                                    boxSizing: 'border-box',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '10px',
                                                    border: '1px solid #e2e8f0',
                                                    background: '#f8fafc',
                                                    fontSize: '14px',
                                                    color: '#334155',
                                                    outline: 'none',
                                                    marginBottom: '1.25rem'
                                                }}
                                            />

                                            {/* B) Responsible Persons — Avatar-chip summary + Ndrysho picker */}
                                            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>RESPONSIBLE PERSONS</div>

                                                {/* Collapsed summary row: avatars + Ndrysho button */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', minWidth: '140px' }}>
                                                        {planMeeting.responsiblePersons.slice(0, 4).map((person, idx) => (
                                                            <div
                                                                key={person}
                                                                title={person}
                                                                style={{
                                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                                    background: getAvatarColor(person), color: '#fff', fontSize: '11px',
                                                                    fontWeight: 700, display: 'flex', alignItems: 'center',
                                                                    justifyContent: 'center', border: '2px solid #fff',
                                                                    marginLeft: idx === 0 ? 0 : '-8px', zIndex: 10 - idx,
                                                                    position: 'relative', cursor: 'default', letterSpacing: '0.02em'
                                                                }}
                                                            >
                                                                {getInitials(person)}
                                                            </div>
                                                        ))}
                                                        {planMeeting.responsiblePersons.length > 4 && (
                                                            <div style={{
                                                                width: '32px', height: '32px', borderRadius: '50%', background: '#64748b',
                                                                color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
                                                                marginLeft: '-8px', zIndex: 5, position: 'relative', letterSpacing: '0.01em'
                                                            }}>
                                                                +{planMeeting.responsiblePersons.length - 4}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Ndrysho (edit) button */}
                                                    <button
                                                        onClick={() => setPlanMeetingPickerOpen(prev => !prev)}
                                                        style={{
                                                            background: 'transparent', border: '1.5px dashed #5FAE9E',
                                                            borderRadius: '20px', padding: '4px 14px', fontSize: '13px',
                                                            color: '#5FAE9E', cursor: 'pointer', fontWeight: 600,
                                                            letterSpacing: '0.01em', transition: 'background 0.15s'
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#f0fdfa')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >– Ndrysho</button>
                                                </div>

                                                {/* Picker dropdown */}
                                                {planMeetingPickerOpen && (
                                                    <div style={{
                                                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999,
                                                        background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.13)', minWidth: '300px',
                                                        height: '245px', maxHeight: '245px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column'
                                                    }}>
                                                        {PERSONS.map(person => {
                                                            const isSelected = planMeeting.responsiblePersons.includes(person);
                                                            return (
                                                                <div
                                                                    key={person}
                                                                    onClick={() => {
                                                                        const updated = isSelected
                                                                            ? planMeeting.responsiblePersons.filter(p => p !== person)
                                                                            : [...planMeeting.responsiblePersons, person];
                                                                        const updatedChecked = isSelected
                                                                            ? planMeeting.checkedPersons.filter(p => p !== person)
                                                                            : planMeeting.checkedPersons;
                                                                        setPlanMeeting({ ...planMeeting, responsiblePersons: updated, checkedPersons: updatedChecked });
                                                                    }}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px',
                                                                        cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                                                                        background: isSelected ? '#f0fdfa' : '#fff', transition: 'background 0.12s'
                                                                    }}
                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#f0fdfa' : '#fff'; }}
                                                                >
                                                                    <input type="checkbox" readOnly checked={isSelected}
                                                                        style={{ width: '15px', height: '15px', accentColor: '#5FAE9E', cursor: 'pointer', flexShrink: 0, margin: 0 }}
                                                                    />
                                                                    <div style={{
                                                                        width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(person),
                                                                        color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex',
                                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                                    }}>{getInitials(person)}</div>
                                                                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: isSelected ? 600 : 400, flex: 1 }}>{person}</span>
                                                                    <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{PERSON_DEPT[person] || ''}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Outside-click overlay to close picker */}
                                                {planMeetingPickerOpen && (
                                                    <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setPlanMeetingPickerOpen(false)} />
                                                )}
                                            </div>

                                            {/* D) Meeting Type */}
                                            <div style={{ marginBottom: '1.25rem' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>MEETING TYPE</div>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={planMeeting.meetingType}
                                                        onChange={e => setPlanMeeting({ ...planMeeting, meetingType: e.target.value })}
                                                        style={{
                                                            width: '100%', appearance: 'none', WebkitAppearance: 'none',
                                                            padding: '0.7rem 2.5rem 0.7rem 1rem', borderRadius: '10px',
                                                            border: '1px solid #e2e8f0', background: '#fff',
                                                            fontSize: '13px', color: '#334155', cursor: 'pointer', outline: 'none'
                                                        }}
                                                    >
                                                        <option>In-Office (On-site)</option>
                                                        <option>Remote (Online)</option>
                                                        <option>Hybrid</option>
                                                    </select>
                                                    <ChevronDown size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                                                </div>
                                            </div>

                                            {/* E) Date stacked above Location – labels outside border, same as CHECK */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>MEETING DATE &amp; TIME</div>
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                        <DateTimePicker
                                                            value={planMeeting.meetingDateTime}
                                                            onChange={val => setPlanMeeting({ ...planMeeting, meetingDateTime: val })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{planMeeting.meetingType === 'Remote (Online)' ? 'MEETING LINK' : 'OFFICE / LOCATION'}</div>
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                        <input
                                                            id="plan-meeting-location"
                                                            type="text"
                                                            value={planMeeting.location}
                                                            onChange={e => setPlanMeeting({ ...planMeeting, location: e.target.value })}
                                                            placeholder={planMeeting.meetingType === 'Remote (Online)' ? 'Paste meeting link… (https://)' : 'Location'}
                                                            style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#64748b', outline: 'none', width: '100%', padding: 0 }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Send Meeting Invites button */}
                                                <button
                                                    onClick={() => {/* placeholder – wire to invite handler when ready */ }}
                                                    style={{
                                                        width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: 'none',
                                                        background: 'linear-gradient(90deg, #3AAFA9 0%, #2B9E97 100%)',
                                                        color: '#fff', fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        gap: '8px', boxShadow: '0 2px 8px rgba(58,175,169,0.18)', transition: 'opacity 0.15s, box-shadow 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(58,175,169,0.28)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(58,175,169,0.18)'; }}
                                                >
                                                    <span style={{ fontSize: '15px' }}></span>
                                                    Send Meeting Invites
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}


                        {/* CHECK Phase VERSION of side cards */}
                        {viewingStep === 'CHECK' && (
                            <>
                                {/* DO Phase Activation Card (separate) */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: '16px',
                                    border: '1px solid #e8ecf0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                    padding: '1.75rem'
                                }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                                        <span style={{ fontSize: '20px' }}></span>
                                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>Act Phase Activation</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.25rem' }} />

                                    {/* Due Date */}
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
                                    <input
                                        type="date"
                                        value={checkMeeting.checkTriggerDate}
                                        onChange={e => setCheckMeeting({ ...checkMeeting, checkTriggerDate: e.target.value })}
                                        style={{
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            padding: '0.65rem 0.9rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: '13px',
                                            color: '#334155',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            marginBottom: '0.5rem'
                                        }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                        Please specify when the effectiveness check will be performed.
                                    </div>
                                </div>

                                {/* CHECK Phase Meeting Card */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: '16px',
                                    border: '1px solid #e8ecf0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                    padding: '1.75rem',
                                    position: 'relative'
                                }}>
                                    {/* Header — clickable toggle (same as PLAN) */}
                                    <div
                                        onClick={() => setCheckMeetingExpanded(prev => !prev)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            marginBottom: checkMeetingExpanded ? '1rem' : '0',
                                            userSelect: 'none'
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a202c' }}>CHECK Phase Meeting</span>
                                        <ChevronDown
                                            size={20}
                                            color="#64748b"
                                            style={{
                                                transition: 'transform 0.25s ease',
                                                transform: checkMeetingExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                            }}
                                        />
                                    </div>
                                    {checkMeetingExpanded && (
                                        <>
                                            <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.5rem' }} />

                                            {/* A) Meeting Title Input */}
                                            <input
                                                type="text"
                                                value={checkMeeting.title}
                                                onChange={e => setCheckMeeting({ ...checkMeeting, title: e.target.value })}
                                                placeholder="Shkruaj titullin e mbledhjes..."
                                                style={{
                                                    width: '100%',
                                                    boxSizing: 'border-box',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '10px',
                                                    border: '1px solid #e2e8f0',
                                                    background: '#f8fafc',
                                                    fontSize: '14px',
                                                    color: '#334155',
                                                    outline: 'none',
                                                    marginBottom: '1.25rem'
                                                }}
                                            />

                                            {/* B) Responsible Persons — Avatar-chip summary + Ndrysho picker (CHECK only) */}
                                            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>RESPONSIBLE PERSONS</div>

                                                {/* ── Collapsed summary row: avatars + Ndrysho button ── */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {/* Overlapping avatar stack – fixed minWidth keeps Ndrysho button pinned */}
                                                    <div style={{ display: 'flex', alignItems: 'center', minWidth: '140px' }}>
                                                        {checkMeeting.responsiblePersons.slice(0, 4).map((person, idx) => (
                                                            <div
                                                                key={person}
                                                                title={person}
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    background: getAvatarColor(person),
                                                                    color: '#fff',
                                                                    fontSize: '11px',
                                                                    fontWeight: 700,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    border: '2px solid #fff',
                                                                    marginLeft: idx === 0 ? 0 : '-8px',
                                                                    zIndex: 10 - idx,
                                                                    position: 'relative',
                                                                    cursor: 'default',
                                                                    letterSpacing: '0.02em'
                                                                }}
                                                            >
                                                                {getInitials(person)}
                                                            </div>
                                                        ))}
                                                        {checkMeeting.responsiblePersons.length > 4 && (
                                                            <div
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    background: '#64748b',
                                                                    color: '#fff',
                                                                    fontSize: '10px',
                                                                    fontWeight: 700,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    border: '2px solid #fff',
                                                                    marginLeft: '-8px',
                                                                    zIndex: 5,
                                                                    position: 'relative',
                                                                    letterSpacing: '0.01em'
                                                                }}
                                                            >
                                                                +{checkMeeting.responsiblePersons.length - 4}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Ndrysho (edit) button */}
                                                    <button
                                                        onClick={() => setCheckMeetingPickerOpen(prev => !prev)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: '1.5px dashed #5FAE9E',
                                                            borderRadius: '20px',
                                                            padding: '4px 14px',
                                                            fontSize: '13px',
                                                            color: '#5FAE9E',
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                            letterSpacing: '0.01em',
                                                            transition: 'background 0.15s'
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#f0fdfa')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >– Ndrysho</button>
                                                </div>

                                                {/* ── Picker dropdown (Photo 3 style) ── */}
                                                {checkMeetingPickerOpen && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 'calc(100% + 6px)',
                                                            left: 0,
                                                            zIndex: 9999,
                                                            background: '#fff',
                                                            borderRadius: '12px',
                                                            border: '1px solid #e2e8f0',
                                                            boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                                                            minWidth: '300px',
                                                            height: '245px',
                                                            maxHeight: '245px',
                                                            overflowY: 'auto',
                                                            overflowX: 'hidden',
                                                            display: 'flex',
                                                            flexDirection: 'column'
                                                        }}
                                                    >
                                                        {PERSONS.map(person => {
                                                            const isSelected = checkMeeting.responsiblePersons.includes(person);
                                                            return (
                                                                <div
                                                                    key={person}
                                                                    onClick={() => {
                                                                        const updated = isSelected
                                                                            ? checkMeeting.responsiblePersons.filter(p => p !== person)
                                                                            : [...checkMeeting.responsiblePersons, person];
                                                                        const updatedChecked = isSelected
                                                                            ? checkMeeting.checkedPersons.filter(p => p !== person)
                                                                            : checkMeeting.checkedPersons;
                                                                        setCheckMeeting({ ...checkMeeting, responsiblePersons: updated, checkedPersons: updatedChecked });
                                                                    }}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '10px',
                                                                        padding: '9px 14px',
                                                                        cursor: 'pointer',
                                                                        borderBottom: '1px solid #f1f5f9',
                                                                        background: isSelected ? '#f0fdfa' : '#fff',
                                                                        transition: 'background 0.12s'
                                                                    }}
                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#f0fdfa' : '#fff'; }}
                                                                >
                                                                    {/* Checkbox */}
                                                                    <input
                                                                        type="checkbox"
                                                                        readOnly
                                                                        checked={isSelected}
                                                                        style={{ width: '15px', height: '15px', accentColor: '#5FAE9E', cursor: 'pointer', flexShrink: 0, margin: 0 }}
                                                                    />
                                                                    {/* Avatar initials */}
                                                                    <div style={{
                                                                        width: '28px',
                                                                        height: '28px',
                                                                        borderRadius: '50%',
                                                                        background: getAvatarColor(person),
                                                                        color: '#fff',
                                                                        fontSize: '10px',
                                                                        fontWeight: 700,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {getInitials(person)}
                                                                    </div>
                                                                    {/* Name */}
                                                                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: isSelected ? 600 : 400, flex: 1 }}>{person}</span>
                                                                    {/* Department (right-aligned) */}
                                                                    <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{PERSON_DEPT[person] || ''}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Outside-click overlay to close picker */}
                                                {checkMeetingPickerOpen && (
                                                    <div
                                                        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                                                        onClick={() => setCheckMeetingPickerOpen(false)}
                                                    />
                                                )}
                                            </div>

                                            {/* D) Meeting Type */}
                                            <div style={{ marginBottom: '1.25rem' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>MEETING TYPE</div>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={checkMeeting.meetingType}
                                                        onChange={e => setCheckMeeting({ ...checkMeeting, meetingType: e.target.value })}
                                                        style={{
                                                            width: '100%',
                                                            appearance: 'none',
                                                            WebkitAppearance: 'none',
                                                            padding: '0.7rem 2.5rem 0.7rem 1rem',
                                                            borderRadius: '10px',
                                                            border: '1px solid #e2e8f0',
                                                            background: '#fff',
                                                            fontSize: '13px',
                                                            color: '#334155',
                                                            cursor: 'pointer',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        <option>In-Office (On-site)</option>
                                                        <option>Remote (Online)</option>
                                                        <option>Hybrid</option>
                                                    </select>
                                                    <ChevronDown size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                                                </div>
                                            </div>

                                            {/* E) Date stacked above Location – labels outside border like Meeting Type */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>MEETING DATE &amp; TIME</div>
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                        <DateTimePicker
                                                            value={checkMeeting.meetingDateTime}
                                                            onChange={val => setCheckMeeting({ ...checkMeeting, meetingDateTime: val })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{checkMeeting.meetingType === 'Remote (Online)' ? 'MEETING LINK' : 'OFFICE / LOCATION'}</div>
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                        <input
                                                            id="check-meeting-location"
                                                            type="text"
                                                            value={checkMeeting.location}
                                                            onChange={e => setCheckMeeting({ ...checkMeeting, location: e.target.value })}
                                                            placeholder={checkMeeting.meetingType === 'Remote (Online)' ? 'Paste meeting link… (https://)' : 'Location'}
                                                            style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#64748b', outline: 'none', width: '100%', padding: 0 }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* F) Send invites button */}
                                                <button
                                                    onClick={() => {/* placeholder – wire to invite handler when ready */ }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.85rem 1rem',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        background: 'linear-gradient(90deg, #3AAFA9 0%, #2B9E97 100%)',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.02em',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        boxShadow: '0 2px 8px rgba(58,175,169,0.18)',
                                                        transition: 'opacity 0.15s, box-shadow 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(58,175,169,0.28)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(58,175,169,0.18)'; }}
                                                >
                                                    <span style={{ fontSize: '15px' }}></span>
                                                    Send Meeting Invites
                                                </button>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </>
                        )}

                    </div>

                    {/* Main content column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: 0, overflow: viewingStep === 'DO' ? 'visible' : 'hidden' }}>

                            <div style={{ padding: '1.75rem' }}>
                                {viewingStep !== 'PLAN' && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>{t('pdca.topicTitle')}</label>
                                        <input
                                            type="text"
                                            value={formState.title}
                                            onChange={e => setFormState({ ...formState, title: e.target.value })}
                                            style={{ fontSize: '1.1rem', fontWeight: 600 }}
                                            disabled={selectedTopic.status === 'Done'}
                                        />
                                    </div>
                                )}
                                {viewingStep === 'PLAN' && (
                                    <div>
                                        {/* HEADER - Matches Create View */}
                                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', background: '#fcfcfd', margin: '-1.75rem -1.75rem 1.75rem -1.75rem', padding: '1.25rem 1.75rem' }}>
                                            <h3 style={{ margin: 0 }}>{t('pdca.planData')}</h3>
                                        </div>

                                        {/* TITLE */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ fontWeight: 600 }}>{t('common.title')} <span style={{ color: 'red' }}>*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={formState.title}
                                                onChange={e => setFormState({ ...formState, title: e.target.value })}
                                                placeholder={t('pdca.titlePlaceholder')}
                                                disabled={selectedTopic.status === 'Done'}
                                            />
                                        </div>

                                        {/* GOAL */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ fontWeight: 600 }}>{t('pdca.goal')} <span style={{ color: 'red' }}>*</span></label>
                                            <textarea
                                                rows={3}
                                                required
                                                value={formState.goal || ''}
                                                onChange={e => setFormState({ ...formState, goal: e.target.value })}
                                                placeholder={t('pdca.goalPlaceholder')}
                                                disabled={selectedTopic.status === 'Done'}
                                            />
                                        </div>

                                        {/* AS-IS / TO-BE GRID */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
                                            <div>
                                                <label style={{ fontWeight: 600 }}>{t('pdca.asIs')} <span style={{ color: 'red' }}>*</span></label>
                                                <textarea
                                                    rows={4}
                                                    required
                                                    value={formState.asIs}
                                                    onChange={e => setFormState({ ...formState, asIs: e.target.value })}
                                                    placeholder={t('pdca.asIsPlaceholder')}
                                                    disabled={selectedTopic.status === 'Done'}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontWeight: 600 }}>{t('pdca.toBe')} <span style={{ color: 'red' }}>*</span></label>
                                                <textarea
                                                    rows={4}
                                                    required
                                                    value={formState.toBe}
                                                    onChange={e => setFormState({ ...formState, toBe: e.target.value })}
                                                    placeholder={t('pdca.toBePlaceholder')}
                                                    disabled={selectedTopic.status === 'Done'}
                                                />
                                            </div>
                                        </div>

                                        {/* ROOT CAUSE */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ fontWeight: 600 }}>{t('pdca.rootCause')}</label>
                                            <textarea
                                                rows={2}
                                                value={formState.rootCause}
                                                onChange={e => setFormState({ ...formState, rootCause: e.target.value })}
                                                placeholder={t('pdca.rootCausePlaceholder')}
                                                disabled={selectedTopic.status === 'Done'}
                                            />
                                        </div>

                                        {/* IMPROVEMENT PURPOSE (Verbesserungszweck) */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                <TrendingUp size={20} color="#5FAE9E" strokeWidth={2} />
                                                <label style={{ fontWeight: 600, margin: 0 }}>{t('pdca.improvementPurpose')}</label>
                                            </div>
                                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                                {[
                                                    { value: 'SAFETY_CRITICAL', label: t('pdca.improvementPurposeSafetyCritical'), bold: true },
                                                    { value: 'SAVE_TIME', label: t('pdca.improvementPurposeSaveTime') },
                                                    { value: 'REDUCE_COSTS', label: t('pdca.improvementPurposeReduceCosts') },
                                                    { value: 'INCREASE_QUALITY', label: t('pdca.improvementPurposeIncreaseQuality') }
                                                ].map(option => (
                                                    <label
                                                        key={option.value}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '0.75rem 0',
                                                            cursor: selectedTopic.status === 'Done' ? 'not-allowed' : 'pointer',
                                                            gap: '0.75rem',
                                                            opacity: selectedTopic.status === 'Done' ? 0.6 : 1
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={(formState.improvementPurpose || []).includes(option.value)}
                                                            onChange={e => {
                                                                const newPurposes = e.target.checked
                                                                    ? [...(formState.improvementPurpose || []), option.value]
                                                                    : (formState.improvementPurpose || []).filter((p: string) => p !== option.value);
                                                                setFormState({ ...formState, improvementPurpose: newPurposes });
                                                            }}
                                                            disabled={selectedTopic.status === 'Done'}
                                                            style={{
                                                                width: '18px',
                                                                height: '18px',
                                                                cursor: selectedTopic.status === 'Done' ? 'not-allowed' : 'pointer',
                                                                accentColor: '#5FAE9E'
                                                            }}
                                                        />
                                                        <span style={{ fontWeight: option.bold ? 600 : 400, fontSize: '14px' }}>
                                                            {option.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* CYCLE (Description) */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ fontWeight: 600 }}>{t('pdca.cycle')}</label>
                                            <textarea
                                                rows={4}
                                                value={formState.description || ''}
                                                onChange={e => setFormState({ ...formState, description: e.target.value })}
                                                placeholder={t('pdca.cyclePlaceholder')}
                                                disabled={selectedTopic.status === 'Done'}
                                            />
                                        </div>

                                        {/* LOCATION & DEPARTMENT (moved from sidebar) */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            {/* Header — outside bordered container */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                <MapPin size={20} color="#5FAE9E" strokeWidth={2} />
                                                <label style={{ fontWeight: 600, margin: 0 }}>Location & Department</label>
                                            </div>
                                            <div style={{
                                                borderRadius: '12px',
                                                border: '1px solid #e8ecf0',
                                                padding: '1.5rem',
                                                background: '#fff'
                                            }}>

                                                {/* Tab row */}
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '0',
                                                    borderBottom: '2px solid #e8ecf0',
                                                    marginBottom: '0.75rem'
                                                }}>
                                                    <button
                                                        onClick={() => setLocationDeptTab('locations')}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 0',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: locationDeptTab === 'locations' ? '#5FAE9E' : '#94a3b8',
                                                            borderBottom: locationDeptTab === 'locations' ? '2.5px solid #5FAE9E' : '2.5px solid transparent',
                                                            marginBottom: '-2px',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <Building2 size={15} />
                                                        Locations
                                                    </button>
                                                    <button
                                                        onClick={() => setLocationDeptTab('departments')}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 0',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: locationDeptTab === 'departments' ? '#5FAE9E' : '#94a3b8',
                                                            borderBottom: locationDeptTab === 'departments' ? '2.5px solid #5FAE9E' : '2.5px solid transparent',
                                                            marginBottom: '-2px',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <Users size={15} />
                                                        Departments
                                                    </button>
                                                </div>

                                                {/* Locations list */}
                                                {locationDeptTab === 'locations' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                                        {LOCATION_OPTIONS.map((loc) => {
                                                            const isSelected = selectedLocations.includes(loc);
                                                            return (
                                                                <label
                                                                    key={loc}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '12px',
                                                                        padding: '12px 14px',
                                                                        borderRadius: '10px',
                                                                        cursor: 'pointer',
                                                                        background: isSelected ? '#edf8f5' : 'transparent',
                                                                        transition: 'background 0.18s ease',
                                                                        marginBottom: '2px'
                                                                    }}
                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafb'; }}
                                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => {
                                                                            setSelectedLocations(prev =>
                                                                                prev.includes(loc)
                                                                                    ? prev.filter(l => l !== loc)
                                                                                    : [...prev, loc]
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            width: '20px',
                                                                            height: '20px',
                                                                            cursor: 'pointer',
                                                                            accentColor: '#5FAE9E',
                                                                            borderRadius: '6px',
                                                                            flexShrink: 0
                                                                        }}
                                                                    />
                                                                    <span style={{
                                                                        fontSize: '14px',
                                                                        color: isSelected ? '#1a202c' : '#475569',
                                                                        fontWeight: isSelected ? 600 : 400
                                                                    }}>{loc}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Departments list */}
                                                {locationDeptTab === 'departments' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                                        {DEPARTMENT_OPTIONS.map((dept) => {
                                                            const isSelected = selectedDepartments.includes(dept);
                                                            return (
                                                                <label
                                                                    key={dept}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '12px',
                                                                        padding: '12px 14px',
                                                                        borderRadius: '10px',
                                                                        cursor: 'pointer',
                                                                        background: isSelected ? '#edf8f5' : 'transparent',
                                                                        transition: 'background 0.18s ease',
                                                                        marginBottom: '2px'
                                                                    }}
                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafb'; }}
                                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => {
                                                                            setSelectedDepartments(prev =>
                                                                                prev.includes(dept)
                                                                                    ? prev.filter(d => d !== dept)
                                                                                    : [...prev, dept]
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            width: '20px',
                                                                            height: '20px',
                                                                            cursor: 'pointer',
                                                                            accentColor: '#5FAE9E',
                                                                            borderRadius: '6px',
                                                                            flexShrink: 0
                                                                        }}
                                                                    />
                                                                    <span style={{
                                                                        fontSize: '14px',
                                                                        color: isSelected ? '#1a202c' : '#475569',
                                                                        fontWeight: isSelected ? 600 : 400
                                                                    }}>{dept}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Divider before selected summary */}
                                                <div style={{ borderTop: '1px solid #e8ecf0', margin: '1rem 0 0.85rem 0' }} />

                                                {/* Selected Locations summary */}
                                                <div style={{ marginBottom: '0.75rem' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#94a3b8',
                                                        letterSpacing: '0.08em',
                                                        textTransform: 'uppercase',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <MapPin size={13} />
                                                        SELECTED LOCATIONS
                                                    </div>
                                                    {selectedLocations.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                            {selectedLocations.map(loc => (
                                                                <span
                                                                    key={loc}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        background: '#5FAE9E',
                                                                        color: '#fff',
                                                                        borderRadius: '20px',
                                                                        padding: '5px 12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        lineHeight: '1.3'
                                                                    }}
                                                                >
                                                                    {loc}
                                                                    <button
                                                                        onClick={() => setSelectedLocations(prev => prev.filter(l => l !== loc))}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#fff',
                                                                            cursor: 'pointer',
                                                                            padding: '0',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            lineHeight: 1,
                                                                            opacity: 0.85
                                                                        }}
                                                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; }}
                                                                    >
                                                                        <X size={14} strokeWidth={2.5} />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Selected Departments summary */}
                                                <div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#94a3b8',
                                                        letterSpacing: '0.08em',
                                                        textTransform: 'uppercase',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <Users size={13} />
                                                        SELECTED DEPARTMENTS
                                                    </div>
                                                    {selectedDepartments.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                            {selectedDepartments.map(dept => (
                                                                <span
                                                                    key={dept}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        background: '#5FAE9E',
                                                                        color: '#fff',
                                                                        borderRadius: '20px',
                                                                        padding: '5px 12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        lineHeight: '1.3'
                                                                    }}
                                                                >
                                                                    {dept}
                                                                    <button
                                                                        onClick={() => setSelectedDepartments(prev => prev.filter(d => d !== dept))}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#fff',
                                                                            cursor: 'pointer',
                                                                            padding: '0',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            lineHeight: 1,
                                                                            opacity: 0.85
                                                                        }}
                                                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; }}
                                                                    >
                                                                        <X size={14} strokeWidth={2.5} />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* STATUS dropdown */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>{t('common.status')}</label>
                                            <select
                                                value={selectedTopic.status}
                                                onChange={e => {
                                                    const newStatus = e.target.value;
                                                    topicsService.update(selectedTopic.id, { status: newStatus as any });
                                                    loadData();
                                                    window.dispatchEvent(new Event('storage'));
                                                }}
                                                disabled={selectedTopic.status === 'Done'}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.8rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--color-border)',
                                                    fontWeight: 600,
                                                    color: selectedTopic.status === 'Monitoring' ? '#16a34a' :
                                                        selectedTopic.status === 'Warning' ? '#ca8a04' :
                                                            selectedTopic.status === 'Critical' ? '#dc2626' : 'inherit'
                                                }}
                                            >
                                                <option value="Monitoring" style={{ color: '#16a34a', fontWeight: 600 }}>{t('pdca.monitoring')}</option>
                                                <option value="Warning" style={{ color: '#ca8a04', fontWeight: 600 }}>{t('pdca.warningNearAlert')}</option>
                                                <option value="Critical" style={{ color: '#dc2626', fontWeight: 600 }}>{t('pdca.criticalAlert')}</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {viewingStep === 'DO' && (
                                    <div>
                                        {/* Goal / Target Reference */}
                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '6px', borderLeft: '4px solid var(--color-primary)' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{t('pdca.targetGoal')}</label>
                                            <div style={{ color: '#334155', fontSize: '14px' }}>
                                                {formState.toBe || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>{t('pdca.noToBe')}</span>}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Play size={20} /> {t('pdca.do')} & {t('pdca.executionActions')}
                                            </h3>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => {
                                                        const newAction = {
                                                            id: `a-${Date.now()}`,
                                                            title: '',
                                                            description: '',
                                                            assignments: [],
                                                            dueDate: '',
                                                            teamsMeeting: '',
                                                            teamsMeetingLink: '',
                                                            meetingType: undefined,
                                                            meetingLocation: '',
                                                            status: 'Open'
                                                        };
                                                        setFormState({ ...formState, actions: [...formState.actions, newAction] });
                                                    }}
                                                    className="btn"
                                                    disabled={selectedTopic.status === 'Done'}
                                                    style={{ fontSize: '12px', padding: '4px 10px', background: '#e0f2fe', color: '#0369a1' }}
                                                >
                                                    {t('pdca.addAction')}
                                                </button>
                                            </div>
                                        </div>

                                        {formState.actions.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', marginBottom: '2rem' }}>
                                                {t('pdca.noActions')}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                                {formState.actions.map((action: any, idx: number) => (
                                                    <div key={action.id} className="card" style={{ padding: '1rem', border: '1px solid #e2e8f0', overflow: 'visible' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                                            <input
                                                                type="text"
                                                                value={action.title}
                                                                onChange={e => {
                                                                    const updated = [...formState.actions];
                                                                    updated[idx].title = e.target.value;
                                                                    setFormState({ ...formState, actions: updated });
                                                                }}
                                                                placeholder={t('pdca.actionTitle')}
                                                                style={{ fontWeight: 600, border: 'none', borderBottom: '1px solid #cbd5e1', width: '60%', padding: '4px 0' }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const updated = formState.actions.filter((_: any, i: number) => i !== idx);
                                                                    setFormState({ ...formState, actions: updated });
                                                                }}
                                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                                                            >
                                                                {t('pdca.remove')}
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
                                                            placeholder={t('pdca.implementationDetails')}
                                                            style={{ width: '100%', marginBottom: '1rem', fontSize: '13px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                        />

                                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', overflow: 'visible' }}>
                                                            <div style={{ flex: 2, position: 'relative' }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem' }}>{t('pdca.responsiblePersons')}</label>

                                                                {/* Avatar chips row + Ndrysho button */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', minWidth: '140px' }}>
                                                                        {action.assignments.slice(0, 4).map((assign: any, aIdx: number) => (
                                                                            <div
                                                                                key={assign.userId}
                                                                                title={assign.userName}
                                                                                style={{
                                                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                                                    background: getAvatarColor(assign.userName), color: '#fff', fontSize: '11px',
                                                                                    fontWeight: 700, display: 'flex', alignItems: 'center',
                                                                                    justifyContent: 'center', border: '2px solid #fff',
                                                                                    marginLeft: aIdx === 0 ? 0 : '-8px', zIndex: 10 - aIdx,
                                                                                    position: 'relative', cursor: 'default', letterSpacing: '0.02em'
                                                                                }}
                                                                            >
                                                                                {getInitials(assign.userName)}
                                                                            </div>
                                                                        ))}
                                                                        {action.assignments.length > 4 && (
                                                                            <div style={{
                                                                                width: '32px', height: '32px', borderRadius: '50%', background: '#64748b',
                                                                                color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex',
                                                                                alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
                                                                                marginLeft: '-8px', zIndex: 5, position: 'relative', letterSpacing: '0.01em'
                                                                            }}>
                                                                                +{action.assignments.length - 4}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Ndrysho (edit) button */}
                                                                    <button
                                                                        onClick={() => setDoActionPickerOpenIdx(doActionPickerOpenIdx === idx ? null : idx)}
                                                                        style={{
                                                                            background: 'transparent', border: '1.5px dashed #5FAE9E',
                                                                            borderRadius: '20px', padding: '4px 14px', fontSize: '13px',
                                                                            color: '#5FAE9E', cursor: 'pointer', fontWeight: 600,
                                                                            letterSpacing: '0.01em', transition: 'background 0.15s'
                                                                        }}
                                                                        onMouseEnter={e => (e.currentTarget.style.background = '#f0fdfa')}
                                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                                    >– Ndrysho</button>
                                                                </div>

                                                                {/* Picker dropdown */}
                                                                {doActionPickerOpenIdx === idx && (
                                                                    <div
                                                                        ref={doResponsiblePickerRef}
                                                                        style={{
                                                                            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999,
                                                                            background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                                            boxShadow: '0 8px 32px rgba(0,0,0,0.13)', minWidth: '300px',
                                                                            height: '245px', maxHeight: '245px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column'
                                                                        }}>
                                                                        {PERSONS.map(person => {
                                                                            const isSelected = action.assignments.some((a: any) => a.userName === person);
                                                                            return (
                                                                                <div
                                                                                    key={person}
                                                                                    onClick={() => {
                                                                                        const updated = [...formState.actions];
                                                                                        if (isSelected) {
                                                                                            updated[idx].assignments = updated[idx].assignments.filter((a: any) => a.userName !== person);
                                                                                        } else {
                                                                                            const user = authService.getAllUsers().find(u => u.name === person);
                                                                                            updated[idx].assignments.push({
                                                                                                userId: user?.id || person,
                                                                                                userName: person,
                                                                                                completed: false,
                                                                                                completedAt: undefined
                                                                                            });
                                                                                        }
                                                                                        setFormState({ ...formState, actions: updated });
                                                                                    }}
                                                                                    style={{
                                                                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px',
                                                                                        cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                                                                                        background: isSelected ? '#f0fdfa' : '#fff', transition: 'background 0.12s'
                                                                                    }}
                                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                                                                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#f0fdfa' : '#fff'; }}
                                                                                >
                                                                                    <input type="checkbox" readOnly checked={isSelected}
                                                                                        style={{ width: '15px', height: '15px', accentColor: '#5FAE9E', cursor: 'pointer', flexShrink: 0, margin: 0 }}
                                                                                    />
                                                                                    <div style={{
                                                                                        width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(person),
                                                                                        color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex',
                                                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                                                    }}>{getInitials(person)}</div>
                                                                                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: isSelected ? 600 : 400, flex: 1 }}>{person}</span>
                                                                                    <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{PERSON_DEPT[person] || ''}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* Outside-click overlay to close picker */}
                                                                {doActionPickerOpenIdx === idx && (
                                                                    <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setDoActionPickerOpenIdx(null)} />
                                                                )}
                                                            </div>

                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pdca.meetingType')}</label>
                                                                <select
                                                                    value={action.meetingType || ''}
                                                                    onChange={e => {
                                                                        const updated = [...formState.actions];
                                                                        updated[idx].meetingType = e.target.value as 'In-Office' | 'Online';
                                                                        setFormState({ ...formState, actions: updated });
                                                                    }}
                                                                    style={{
                                                                        fontSize: '12px',
                                                                        padding: '4px',
                                                                        width: '100%',
                                                                        border: '1px solid #cbd5e1',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    <option value="">{t('pdca.selectMeetingType')}</option>
                                                                    <option value="In-Office">{t('pdca.inOffice')}</option>
                                                                    <option value="Online">{t('pdca.online')}</option>
                                                                </select>
                                                            </div>

                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pdca.meetingDateTime')}</label>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={action.teamsMeeting || ''}
                                                                    onChange={e => {
                                                                        const updated = [...formState.actions];
                                                                        updated[idx].teamsMeeting = e.target.value;
                                                                        setFormState({ ...formState, actions: updated });
                                                                    }}
                                                                    placeholder="mm/dd/yyyy --:-- --"
                                                                    style={{ fontSize: '12px', padding: '4px', width: '100%', border: '1px solid #cbd5e1' }}
                                                                />
                                                            </div>

                                                            {action.meetingType === 'Online' && (
                                                                <div style={{ flex: 1 }}>
                                                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pdca.onlineLink')}</label>
                                                                    <input
                                                                        type="url"
                                                                        placeholder={t('pdca.onlineLinkPlaceholder')}
                                                                        value={action.teamsMeetingLink || ''}
                                                                        onChange={e => {
                                                                            const updated = [...formState.actions];
                                                                            updated[idx].teamsMeetingLink = e.target.value;
                                                                            setFormState({ ...formState, actions: updated });
                                                                        }}
                                                                        style={{ fontSize: '12px', padding: '4px', width: '100%' }}
                                                                    />
                                                                </div>
                                                            )}

                                                            {action.meetingType === 'In-Office' && (
                                                                <div style={{ flex: 1 }}>
                                                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pdca.officeLocation')}</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder={t('pdca.officeLocationPlaceholder')}
                                                                        value={action.meetingLocation || ''}
                                                                        onChange={e => {
                                                                            const updated = [...formState.actions];
                                                                            updated[idx].meetingLocation = e.target.value;
                                                                            setFormState({ ...formState, actions: updated });
                                                                        }}
                                                                        style={{ fontSize: '12px', padding: '4px', width: '100%' }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    </div>
                                )}
                                {viewingStep === 'CHECK' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        {/* 1. EXECUTION SUMMARY (Read-Only) */}
                                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <PlayCircle size={16} /> {t('pdca.executionSummary')}
                                            </h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{t('pdca.totalActions')}</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                                                        {selectedTopic.do.actions?.length || 0}
                                                    </div>
                                                </div>
                                                <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{t('pdca.involvedUsers')}</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>
                                                        {new Set(selectedTopic.do.actions?.flatMap(a => a.assignments.map(p => p.userId))).size || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. EFFECTIVENESS STATUS (Mandatory) */}
                                        <div>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                                1. {t('pdca.effectivenessAssessment')} <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                                {[
                                                    { value: 'Effective', color: '#dcfce7', border: '#16a34a', icon: <CheckCircle2 />, desc: t('pdca.objectiveMetLong'), label: t('pdca.objectiveMet') },
                                                    { value: 'Partially Effective', color: '#fef9c3', border: '#ca8a04', icon: <AlertTriangle />, desc: t('pdca.objectivePartialLong'), label: t('pdca.objectivePartial') },
                                                    { value: 'Not Effective', color: '#fee2e2', border: '#dc2626', icon: <X />, desc: t('pdca.objectiveNotMetLong'), label: t('pdca.objectiveNotMet') }
                                                ].map((opt) => (
                                                    <div
                                                        key={opt.value}
                                                        onClick={() => {
                                                            if (selectedTopic.status === 'Done') return;
                                                            const newStatus = opt.value as EffectivenessStatus;
                                                            let newOutcome = formState.actOutcome;
                                                            // If switching to Non-Effective, Standardize is no longer valid
                                                            if (newStatus !== 'Effective' && newOutcome === 'Standardize') {
                                                                newOutcome = undefined;
                                                            }
                                                            setFormState({ ...formState, effectivenessStatus: newStatus, actOutcome: newOutcome });
                                                        }}
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
                                                            {opt.icon} {opt.label}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{opt.desc}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. KPI EVALUATION */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                                <label style={{ fontWeight: 700, fontSize: '1.1rem' }}>2. {t('pdca.kpiEvaluation')} <span style={{ color: 'red' }}>*</span></label>
                                                <button
                                                    onClick={() => {
                                                        const newKPI = { id: Date.now().toString(), name: '', targetValue: '', actualResult: '', status: 'Not Achieved' };
                                                        setFormState({ ...formState, kpiEvaluations: [...formState.kpiEvaluations, newKPI] });
                                                    }}
                                                    className="btn"
                                                    disabled={selectedTopic.status === 'Done'}
                                                    style={{ fontSize: '12px', padding: '6px 12px', background: '#e0f2fe', color: '#0369a1' }}
                                                >
                                                    {t('pdca.addKPI')}
                                                </button>
                                            </div>

                                            {(!formState.kpiEvaluations || formState.kpiEvaluations.length === 0) ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8' }}>
                                                    {t('pdca.noKPIs')}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    {formState.kpiEvaluations.map((kpi: KPIEvaluation, idx: number) => (
                                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'start', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                                                            <div style={{ flex: 2 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{t('pdca.kpiName')}</label>
                                                                <input
                                                                    type="text"
                                                                    value={kpi.name}
                                                                    onChange={e => {
                                                                        const updated = [...formState.kpiEvaluations];
                                                                        updated[idx].name = e.target.value;
                                                                        setFormState({ ...formState, kpiEvaluations: updated });
                                                                    }}
                                                                    placeholder={t('pdca.kpiPlaceholder')}
                                                                    style={{ width: '100%', padding: '6px', fontSize: '13px', fontWeight: 600, border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{t('pdca.target')}</label>
                                                                <input
                                                                    type="text"
                                                                    value={kpi.targetValue}
                                                                    onChange={e => {
                                                                        const updated = [...formState.kpiEvaluations];
                                                                        updated[idx].targetValue = e.target.value;
                                                                        setFormState({ ...formState, kpiEvaluations: updated });
                                                                    }}
                                                                    placeholder={t('pdca.targetPlaceholder')}
                                                                    style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{t('pdca.actual')}</label>
                                                                <input
                                                                    type="text"
                                                                    value={kpi.actualResult}
                                                                    onChange={e => {
                                                                        const updated = [...formState.kpiEvaluations];
                                                                        updated[idx].actualResult = e.target.value;
                                                                        setFormState({ ...formState, kpiEvaluations: updated });
                                                                    }}
                                                                    placeholder={t('pdca.actualPlaceholder')}
                                                                    style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                                />
                                                            </div>
                                                            {formState.effectivenessStatus === 'Partially Effective' && (
                                                                <div style={{ flex: 1 }}>
                                                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{t('common.status')}</label>
                                                                    <select
                                                                        value={kpi.status}
                                                                        onChange={e => {
                                                                            const updated = [...formState.kpiEvaluations];
                                                                            updated[idx].status = e.target.value;
                                                                            setFormState({ ...formState, kpiEvaluations: updated });
                                                                        }}
                                                                        style={{ width: '100%', padding: '6px', fontSize: '13px', fontWeight: 600, color: kpi.status === 'Achieved' ? 'green' : 'red', borderColor: kpi.status === 'Achieved' ? '#86efac' : '#fca5a5' }}
                                                                    >
                                                                        <option value="Achieved">{t('pdca.achieved')}</option>
                                                                        <option value="Not Achieved">{t('pdca.notAchieved')}</option>
                                                                    </select>
                                                                </div>
                                                            )}
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
                                                3. {t('pdca.effectivenessReview')} <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                                                {t('pdca.effectivenessReviewQuestion')}
                                            </div>
                                            <textarea
                                                rows={5}
                                                value={formState.effectivenessReview}
                                                onChange={e => setFormState({ ...formState, effectivenessReview: e.target.value })}
                                                disabled={selectedTopic.status === 'Done'}
                                                placeholder={t('pdca.effectivenessReviewPlaceholder')}
                                                style={{ width: '100%', padding: '1rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', lineHeight: '1.5' }}
                                            />
                                        </div>

                                        {/* 5. DECISION & AUDIT (Read-Only Info) */}
                                        {formState.effectivenessStatus && (
                                            <div style={{ background: '#f1f5f9', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>{t('pdca.checkDecisionOutcome')}</h4>
                                                <p style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                                                    {t('pdca.basedOnSelection')} <strong>{t('pdca.objective' + (formState.effectivenessStatus === 'Effective' ? 'Met' : formState.effectivenessStatus === 'Partially Effective' ? 'Partial' : 'NotMet'))}</strong>, {t('pdca.topicProceedTo')}
                                                    <strong>
                                                        {formState.effectivenessStatus === 'Effective' ? ` ${t('pdca.outcomeStandardization')}` :
                                                            formState.effectivenessStatus === 'Partially Effective' ? ` ${t('pdca.outcomeImprovement')}` :
                                                                ` ${t('pdca.outcomeReplanning')}`}
                                                    </strong>
                                                </p>
                                                <div style={{ marginTop: '1rem', fontSize: '11px', color: '#64748b', display: 'flex', gap: '1rem' }}>
                                                    <span>{t('pdca.checkedBy')} <strong>{user?.name}</strong></span>
                                                    <span>{t('pdca.date')} <strong>{new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</strong></span>
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
                                                <label style={{ fontWeight: 700, fontSize: '1.1rem' }}>1. {t('pdca.actOutcomeDecision')} <span style={{ color: 'red' }}>*</span></label>
                                                {formState.effectivenessStatus && (
                                                    <span className="badge" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                                                        {t('pdca.inputFromCheck')} {t('pdca.objective' + (formState.effectivenessStatus === 'Effective' ? 'Met' : formState.effectivenessStatus === 'Partially Effective' ? 'Partial' : 'NotMet'))}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                                {[
                                                    { value: 'Standardize', icon: <ShieldCheck />, desc: t('pdca.measureSuccessful'), label: t('pdca.standardize') },
                                                    { value: 'Improve & Re-run PDCA', icon: <RotateCcw />, desc: t('pdca.improveRerun'), label: t('pdca.improveRerun') },
                                                    { value: 'Close without Standardization', icon: <X />, desc: t('pdca.closeWithoutStandardization'), label: t('pdca.closeWithoutStandardization') }
                                                ].filter(opt => {
                                                    // HIDE Standardize if Check was NOT Effective
                                                    if (opt.value === 'Standardize' && formState.effectivenessStatus !== 'Effective') {
                                                        return false;
                                                    }
                                                    return true;
                                                }).map((opt: any) => (
                                                    <div
                                                        key={opt.value}
                                                        onClick={() => (selectedTopic.status !== 'Done' || !selectedTopic.act?.completedAt) && setFormState({ ...formState, actOutcome: opt.value as ActOutcome })}
                                                        style={{
                                                            padding: '1.25rem',
                                                            borderRadius: '8px',
                                                            border: `2px solid ${formState.actOutcome === opt.value ? 'var(--color-primary)' : '#e2e8f0'}`,
                                                            background: formState.actOutcome === opt.value ? 'var(--color-primary-light)' : 'white',
                                                            cursor: (selectedTopic.status === 'Done' && selectedTopic.act?.completedAt) ? 'default' : 'pointer',
                                                            opacity: (formState.actOutcome && formState.actOutcome !== opt.value) ? 0.6 : 1
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: formState.actOutcome === opt.value ? 'var(--color-primary)' : '#334155', marginBottom: '6px' }}>
                                                            {opt.icon} {opt.label}
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
                                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}>2. {t('pdca.standardizationScope')} <span style={{ color: 'red' }}>*</span></label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                                        {['process', 'clinicalGuide', 'policy', 'checklist', 'training', 'ehrConfiguration', 'other'].map(key => (
                                                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: (selectedTopic.status === 'Done' && selectedTopic.act?.completedAt) ? 'default' : 'pointer' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={selectedTopic.status === 'Done' && !!selectedTopic.act?.completedAt}
                                                                    checked={formState.standardizationScope?.includes(key)}
                                                                    onChange={e => {
                                                                        const current = formState.standardizationScope || [];
                                                                        const updated = e.target.checked
                                                                            ? [...current, key]
                                                                            : current.filter((i: string) => i !== key);
                                                                        setFormState({ ...formState, standardizationScope: updated });
                                                                    }}
                                                                />
                                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{t(`pdca.scopes.${key}`)}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 3. AFFECTED AREAS */}
                                                <div>
                                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}>3. {t('pdca.affectedAreas')}</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                                        {['nursing', 'surgery', 'emergency', 'inpatientWard', 'outpatientClinic', 'pharmacy', 'diagnostics', 'administration', 'other'].map(key => (
                                                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: (selectedTopic.status === 'Done' && selectedTopic.act?.completedAt) ? 'default' : 'pointer' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={selectedTopic.status === 'Done' && !!selectedTopic.act?.completedAt}
                                                                    checked={formState.affectedAreas?.includes(key)}
                                                                    onChange={e => {
                                                                        const current = formState.affectedAreas || [];
                                                                        const updated = e.target.checked
                                                                            ? [...current, key]
                                                                            : current.filter((i: string) => i !== key);
                                                                        setFormState({ ...formState, affectedAreas: updated });
                                                                    }}
                                                                />
                                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{t(`pdca.areas.${key}`)}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 4. STANDARDIZATION DESCRIPTION */}
                                                <div>
                                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>4. {t('pdca.standardizationDesc')} <span style={{ color: 'red' }}>*</span></label>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                                                        {t('pdca.standardizationDescQuestion')}
                                                    </div>
                                                    <textarea
                                                        rows={5}
                                                        value={formState.standardizationDescription}
                                                        onChange={e => setFormState({ ...formState, standardizationDescription: e.target.value })}
                                                        disabled={selectedTopic.status === 'Done' && !!selectedTopic.act?.completedAt}
                                                        placeholder={t('pdca.standardizationDescPlaceholder')}
                                                        style={{ width: '100%', padding: '1rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* 5. LESSONS LEARNED */}
                                        <div>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>{formState.actOutcome === 'Standardize' ? '5.' : '2.'} {t('pdca.lessonsLearned')}</label>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                                                {t('pdca.lessonsLearnedQuestion')}
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={formState.lessonsLearned}
                                                onChange={e => setFormState({ ...formState, lessonsLearned: e.target.value })}
                                                disabled={selectedTopic.status === 'Done' && !!selectedTopic.act?.completedAt}
                                                placeholder={t('pdca.lessonsLearnedPlaceholder')}
                                                style={{ width: '100%', padding: '1rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                            />
                                        </div>

                                        {/* 6. CONFIRMATION & AUDIT */}
                                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                                            <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem', color: '#1e293b' }}>
                                                {t('pdca.actConfirmation')} <span style={{ color: 'red' }}>*</span>
                                            </label>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                                {formState.actOutcome === 'Standardize' && (
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={formState.actConfirmation?.standardized}
                                                            onChange={e => {
                                                                const checked = e.target.checked;
                                                                setFormState({ ...formState, actConfirmation: { ...formState.actConfirmation, standardized: checked } });
                                                                if (checked) setShowPdfModal(true);
                                                            }}
                                                            disabled={selectedTopic.status === 'Done' && !!selectedTopic.act?.completedAt}
                                                        />
                                                        {t('pdca.confirmStandardized')}
                                                    </label>
                                                )}
                                                {formState.actOutcome !== 'Standardize' && (
                                                    <>
                                                        {formState.actOutcome !== 'Close without Standardization' && (
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formState.actConfirmation?.noActionsPending}
                                                                    onChange={e => setFormState({ ...formState, actConfirmation: { ...formState.actConfirmation, noActionsPending: e.target.checked } })}
                                                                    disabled={selectedTopic.status === 'Done' && !!selectedTopic.act?.completedAt}
                                                                />
                                                                {formState.actOutcome === 'Improve & Re-run PDCA' ? t('pdca.confirmRerunPDCA') : t('pdca.confirmNoActions')}
                                                            </label>
                                                        )}
                                                        {formState.actOutcome === 'Close without Standardization' && (
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formState.actConfirmation?.readyToClose}
                                                                    onChange={e => setFormState({ ...formState, actConfirmation: { ...formState.actConfirmation, readyToClose: e.target.checked } })}
                                                                    disabled={selectedTopic.status === 'Done' && !!selectedTopic.act?.completedAt}
                                                                />
                                                                {t('pdca.confirmReadyClose')}
                                                            </label>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {selectedTopic.status === 'Done' && selectedTopic.act?.audit && (
                                                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1rem', fontSize: '11px', color: '#64748b', display: 'flex', gap: '2rem' }}>
                                                    <span>{t('pdca.closedBy')} <strong>{selectedTopic.act.audit.closedBy}</strong></span>
                                                    <span>{t('pdca.date')} <strong>{new Date(selectedTopic.act.audit.closedOn).toLocaleString(language === 'en' ? 'en-US' : 'de-DE')}</strong></span>
                                                    <span>{t('pdca.finalOutcome')} <strong style={{ color: 'var(--color-primary)' }}>{t(`pdca.outcome${selectedTopic.act.audit.finalOutcome.replace(/ /g, '')}`)}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
                {
                    showPdfModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', width: '500px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                                <div style={{ width: '64px', height: '64px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                                    <CheckCircle2 size={32} color="#10b981" strokeWidth={3} />
                                </div>

                                <h2 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.5rem', fontWeight: 700 }}>
                                    Export PDCA Process to PDF?
                                </h2>

                                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                                    The improvement has been successfully standardized and documented. Would you like to generate a complete PDF document with all process details?
                                </p>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setShowPdfModal(false)}
                                        style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        Not Now
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Merge current form state into topic for PDF generation to ensure latest edits are included
                                            const topicForPdf = {
                                                ...selectedTopic,
                                                plan: { ...selectedTopic.plan, asIs: formState.asIs, toBe: formState.toBe, rootCause: formState.rootCause, description: formState.description },
                                                do: { ...selectedTopic.do, actions: formState.actions, checkDate: formState.checkDate },
                                                check: { ...selectedTopic.check, effectivenessStatus: formState.effectivenessStatus, kpiEvaluations: formState.kpiEvaluations, effectivenessReview: formState.effectivenessReview },
                                                act: { ...selectedTopic.act, actOutcome: formState.actOutcome, lessonsLearned: formState.lessonsLearned }
                                            };
                                            generatePlanDoCheckCombinedPdf(topicForPdf);
                                            setShowPdfModal(false);
                                        }}
                                        style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        Yes, Generate PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* My ToDos Section */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t('pdca.myToDos')}</h3>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#334155',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5FAE9E' }}></div>
                        {myToDos.length} {t('common.activeTasks')}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th>{t('common.status')}</th>
                                <th>{t('common.title')}</th>
                                <th>{t('pdca.topicTitle')}</th>
                                <th>{t('common.step')}</th>
                                <th>{t('common.dueDate')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myToDos.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>{t('landing.keineAufgaben')}</td></tr>
                            ) : (
                                myToDos.map((todo: ToDo) => (
                                    <tr key={todo.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="status-dot" style={{ backgroundColor: getStatusColor(todo.status, todo.dueDate) }}></span>
                                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{getStatusMeta(todo.status, todo.dueDate, undefined, t).label}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#1a202c' }}>{getTranslatedTaskTitle(todo.title)}</td>
                                        <td style={{ color: '#4a5568', fontSize: '13px' }}>{getTranslatedTopicTitle(todo.topicTitle)}</td>
                                        <td>{t(`phases.${todo.step.toLowerCase()}`).toUpperCase()}</td>
                                        <td style={{ color: todo.status === 'Critical' ? 'var(--color-status-red)' : 'inherit', fontWeight: todo.status === 'Critical' ? 600 : 400 }}>
                                            {new Date(todo.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}
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
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t('pdca.myActions')}</h3>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#334155',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5FAE9E' }}></div>
                        {myActions.length} {t('common.assignments')}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th>{t('common.status')}</th>
                                <th>{t('pdca.topicTitle')}</th>
                                <th>{t('common.title')}</th>
                                <th>{t('common.dueDate')}</th>
                                <th>{t('common.teamsMeeting')}</th>
                                <th>{t('common.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myActions.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>{t('common.noActionsAssigned')}</td></tr>
                            ) : (
                                myActions.map((a: any) => {
                                    const myAssign = a.assignments.find((p: any) => p.userId === user?.id);
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="status-dot" style={{ backgroundColor: getStatusColor(a.status, a.dueDate) }}></span>
                                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{getStatusMeta(a.status, a.dueDate, undefined, t).label}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#1a202c', fontSize: '13px' }}>{getTranslatedTopicTitle(a.topicTitle)}</td>
                                            <td style={{ fontWeight: 600, color: '#435ebe' }}>{a.title}</td>
                                            <td style={{ fontSize: '13px' }}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</td>
                                            <td style={{ fontSize: '13px', fontWeight: 600 }}>
                                                {a.teamsMeeting ? new Date(a.teamsMeeting).toLocaleString(language === 'en' ? 'en-US' : 'de-DE') : '-'}
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
                                                        {myAssign.completed ? t('common.completed') : t('common.markComplete')}
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
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t('pdca.myTopics')}</h3>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{t('common.accountableFor')} {myTopics.length} {t('common.initiatives')}</div>
                </div>

                {/* Quick Filters Bar */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: '#fff', display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#64748b' }}>{t('filters.status')}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {['Monitoring', 'Critical', 'Warning', 'Done'].filter(s => s !== 'Done').map(s => {
                                const statusKey = s.toLowerCase();
                                return (
                                    <button
                                        key={s}
                                        onClick={() => toggleStatus(s)}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '4px',
                                            border: '1px solid',
                                            borderColor: statusFilter.includes(s) ? '#424b55' : '#e2e8f0',
                                            background: 'white',
                                            color: statusFilter.includes(s) ? '#424b55' : '#64748b',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {t(`status.${statusKey}`)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#64748b' }}>{t('filters.step')}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {(['PLAN', 'DO', 'CHECK', 'ACT'] as Step[]).filter(s => s !== 'ACT').map(s => (
                                <button
                                    key={s}
                                    onClick={() => toggleStep(s)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid',
                                        borderColor: stepFilter.includes(s) ? '#424b55' : '#e2e8f0',
                                        background: 'white',
                                        color: stepFilter.includes(s) ? '#424b55' : '#64748b',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t('phases.' + s.toLowerCase())}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(statusFilter.length > 0 || stepFilter.length > 0) && (
                        <button
                            onClick={() => { setStatusFilter([]); setStepFilter([]); }}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#5FAE9E', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                            <X size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {t('common.clearFilters')}
                        </button>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1200px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th>{t('common.status')}</th>
                                <th>{t('pdca.pdcaTopic')}</th>
                                <th>{t('common.step')}</th>
                                <th>{t('common.dueDate')}</th>
                                <th>{t('common.responsible')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTopics.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>{t('common.noTopicsFound')}</td></tr>
                            ) : (
                                myTopics.map((topic: Topic) => (
                                    <tr key={topic.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTopic(topic)}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`status-dot ${getStatusClass(topic.status, topic.dueDate)}`}></span>
                                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{getStatusMeta(topic.status, topic.dueDate, undefined, t).label}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#1a202c' }}>{getTranslatedTopicTitle(topic.title)}</div>
                                            <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>{t('common.kpi')}: {getTranslatedKPI(topic.kpi)}</div>
                                        </td>
                                        <td>{t(`phases.${topic.step.toLowerCase()}`).toUpperCase()}</td>
                                        <td>{topic.do.checkDate ? new Date(topic.do.checkDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</td>
                                        <td style={{ fontSize: '13px', fontWeight: 500 }}>{topic.ownerName || 'Elena Rossi'}</td>
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
