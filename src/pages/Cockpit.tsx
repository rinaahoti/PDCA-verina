import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { topicsService, authService, todosService } from '../services';
import { adminService } from '../services/adminService';
import { notificationService } from '../services/notifications';
import { Topic, ToDo, Step, EffectivenessStatus, KPIEvaluation, ActOutcome, StandardizationScope, AffectedArea, PhaseMeetingData, ExternalMeetingUser, CheckDecision } from '../types';
import { Location as AdminLocation, Department as AdminDepartment } from '../types/admin';
import { Save, Printer, Mail, ArrowLeft, ChevronRight, ChevronDown, Lock, Check, CheckCircle2, X, AlertTriangle, PlayCircle, BarChart3, RotateCcw, FileText, Globe, GraduationCap, ShieldCheck, Settings, Target, Play, Calendar, TrendingUp, MapPin, Building2, Users, MessageSquare, Search } from 'lucide-react';
import { getStatusMeta, getStatusBadgeStyle, getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import { getTopicDisplayStep, getVisibleTopicStatus, isTopicVisibleInWorkflow } from '../utils/topicWorkflowUtils';
import { useLanguage } from '../contexts/LanguageContext';
import DateTimePicker from '../components/DateTimePicker';
import { initialData } from '../data/seed';


import { generatePlanDoCheckCombinedPdf } from '../utils/pdfGenerator';
import { removeTopicFromTemplatesStandards, syncTopicToTemplatesStandards } from '../services/templatesStandardsSync';

const RECENT_SAVED_TOPIC_KEY = 'mso_recent_saved_topic_id';

const Cockpit: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const openTopicId = searchParams.get('topicId');
    const user = authService.getCurrentUser();

    const createDefaultState = () => ({
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

    const [topics, setTopics] = useState<Topic[]>([]);
    const [todos, setTodos] = useState<ToDo[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [viewingStep, setViewingStep] = useState<Step>('PLAN');
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfModalContext, setPdfModalContext] = useState<'standardize' | 'rerun' | 'close'>('standardize');

    // Create Mode State
    const [createState, setCreateState] = useState(() => createDefaultState());

    const [formState, setFormState] = useState<any>({
        goal: '',
        description: '',
        asIs: '',
        toBe: '',
        rootCause: '',
        improvementPurpose: [],
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
    const [lastSavedTopicId, setLastSavedTopicId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return window.sessionStorage.getItem(RECENT_SAVED_TOPIC_KEY);
    });
    const [emailStatus, setEmailStatus] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: '' });
    const [openActionCommentId, setOpenActionCommentId] = useState<string | null>(null);
    const [actionCommentDraft, setActionCommentDraft] = useState('');
    const [allActionsSearch, setAllActionsSearch] = useState('');
    const [allActionsStatusFilter, setAllActionsStatusFilter] = useState('All Status');
    const [allActionsStepFilter, setAllActionsStepFilter] = useState('All');
    const [allTopicsSearch, setAllTopicsSearch] = useState('');
    const [allTopicsStatusFilter, setAllTopicsStatusFilter] = useState('All Status');
    const [allTopicsStepFilter, setAllTopicsStepFilter] = useState('All');

    // Location & Department state (PLAN page only)
    const [locationDeptTab, setLocationDeptTab] = useState<'locations' | 'departments'>('locations');
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [hasInitializedPlanDefaults, setHasInitializedPlanDefaults] = useState(false);
    const [adminLocations, setAdminLocations] = useState<AdminLocation[]>([]);
    const [adminDepartments, setAdminDepartments] = useState<AdminDepartment[]>([]);
    const [planMeetingExpanded, setPlanMeetingExpanded] = useState(false);
    const [checkMeetingExpanded, setCheckMeetingExpanded] = useState(false);
    const [checkMeetingPickerOpen, setCheckMeetingPickerOpen] = useState(false);
    const [planMeetingPickerOpen, setPlanMeetingPickerOpen] = useState(false);
    const [doActionPickerOpenIdx, setDoActionPickerOpenIdx] = useState<number | null>(null);
    const doResponsiblePickerRef = useRef<HTMLDivElement | null>(null);
    const pendingViewingStepRef = useRef<Step | null>(null);
    const savedIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const feedbackPopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [feedbackPopupTitleKey, setFeedbackPopupTitleKey] = useState<'pdca.externalUsersConfirmedTitle' | 'pdca.meetingInvitesSentTitle' | null>(null);
    const seededTopicIds = useMemo(() => new Set(initialData.topics.map(topic => topic.id)), []);
    const myTopicsStepOptions = (language === 'de' ? ['PLAN', 'DO', 'CHECK'] : ['PLAN', 'DO', 'CHECK', 'ACT']) as Step[];

    const locationRecords = useMemo(
        () =>
            adminLocations
                .map(loc => ({
                    id: loc.id,
                    label: (loc.city || '').trim() || (loc.name || '').replace(/ \([A-Z]+\)$/, '').trim()
                }))
                .filter(loc => !!loc.label),
        [adminLocations]
    );
    const LOCATION_OPTIONS = useMemo(
        () => Array.from(new Set(locationRecords.map(loc => loc.label))).sort((a, b) => a.localeCompare(b)),
        [locationRecords]
    );
    const getTranslatedDepartmentName = (name: string) => {
        if (name === 'Quality & Patient Safety') return t('admin.qualityPatientSafety');
        if (name === 'Surgery Department') return t('admin.surgeryDepartment');
        return name;
    };
    const normalizeStoredDepartmentName = (value: string) => {
        const trimmed = `${value || ''}`.trim();
        if (!trimmed) return '';

        const matchedDepartment = adminDepartments.find(dep =>
            dep.name === trimmed || getTranslatedDepartmentName(dep.name) === trimmed
        );

        return matchedDepartment?.name || trimmed;
    };
    const DEPARTMENT_OPTIONS = useMemo(() => {
        const selectedLocationIds = locationRecords
            .filter(loc => selectedLocations.includes(loc.label))
            .map(loc => loc.id);
        const scopedDepartments = selectedLocationIds.length > 0
            ? adminDepartments.filter(dep => selectedLocationIds.includes(dep.locationId))
            : adminDepartments;
        return Array.from(new Set(scopedDepartments.map(dep => dep.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [adminDepartments, locationRecords, selectedLocations]);

    type MeetingState = {
        title: string;
        responsiblePersons: string[];
        checkedPersons: string[];
        meetingType: string;
        meetingDateTime: string;
        location: string;
        showDropdown: boolean;
        checkTriggerDate: string;
        externalEnabled: boolean;
        externalUsers: ExternalMeetingUser[];
    };

    const createExternalUserRow = (): ExternalMeetingUser => ({
        id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        fullName: '',
        email: '',
        note: ''
    });

    const createDefaultMeetingState = (): MeetingState => ({
        title: '',
        responsiblePersons: [],
        checkedPersons: [],
        meetingType: 'In-Office (On-site)',
        meetingDateTime: '',
        location: '',
        showDropdown: false,
        checkTriggerDate: '',
        externalEnabled: false,
        externalUsers: []
    });

    const normalizePhaseMeetingType = (meetingType?: string) =>
        meetingType === 'Hybrid' ? 'In-Office (On-site)' : (meetingType || 'In-Office (On-site)');

    const normalizeResponsiblePersons = (responsiblePersons?: string[] | string) => {
        const rawValues = Array.isArray(responsiblePersons)
            ? responsiblePersons
            : typeof responsiblePersons === 'string'
                ? responsiblePersons.split(',')
                : [];

        return Array.from(new Set(rawValues.map(value => `${value || ''}`.trim()).filter(Boolean)));
    };

    const hydrateMeetingState = (meeting?: PhaseMeetingData, fallbackCheckTriggerDate = ''): MeetingState => {
        const responsiblePersons = normalizeResponsiblePersons(meeting?.responsiblePersons);

        return {
            ...createDefaultMeetingState(),
            title: meeting?.title || '',
            responsiblePersons,
            checkedPersons: responsiblePersons,
            meetingType: normalizePhaseMeetingType(meeting?.meetingType),
            meetingDateTime: meeting?.meetingDateTime || '',
            location: meeting?.location || '',
            checkTriggerDate: meeting?.checkTriggerDate || fallbackCheckTriggerDate,
            // Always start collapsed; user opens external section manually via arrow/button.
            externalEnabled: false,
            externalUsers: Array.isArray(meeting?.externalUsers) ? meeting.externalUsers : []
        };
    };

    const toPhaseMeetingData = (meeting: MeetingState): PhaseMeetingData => ({
        title: meeting.title,
        responsiblePersons: normalizeResponsiblePersons(meeting.responsiblePersons),
        meetingType: meeting.meetingType,
        meetingDateTime: meeting.meetingDateTime,
        location: meeting.location,
        checkTriggerDate: meeting.checkTriggerDate,
        externalEnabled: meeting.externalEnabled,
        externalUsers: meeting.externalUsers
    });

    const hasMeetingStateContent = (meeting: MeetingState) =>
        Boolean(
            meeting.title.trim()
            || meeting.responsiblePersons.length > 0
            || meeting.meetingDateTime
            || meeting.location.trim()
            || meeting.checkTriggerDate
            || meeting.externalUsers.some(userItem =>
                Boolean(userItem.fullName.trim() || userItem.email.trim() || (userItem.note || '').trim())
            )
        );

    // PLAN Phase Meeting state
    const [planMeeting, setPlanMeeting] = useState<MeetingState>(createDefaultMeetingState);

    // CHECK Phase Meeting state (replicated from PLAN)
    const [checkMeeting, setCheckMeeting] = useState<MeetingState>(createDefaultMeetingState);

    const PERSONS = [
        'Elena Rossi',
        'Marcus Weber',
        'Sarah Johnson',
        'Robert Miller',
        'Julia Chen',
        'James Wilson',
        'Anna Müller',
        'Thomas Becker',
        'Laura Schmidt',
        'Stefan Vogel',
        'Maria Hoffmann',
        'Florian Braun',
        'Katrin Neumann'
    ];

    // UI-only: department labels for the CHECK picker dropdown (Photo 3)
    const PERSON_DEPT: Record<string, string> = {
        'Elena Rossi': 'Medical',
        'Marcus Weber': 'Medical',
        'Sarah Johnson': 'HR & Staff',
        'Robert Miller': 'HR & Staff',
        'Julia Chen': 'Medical',
        'James Wilson': 'IT',
        'Anna Müller': 'HR & Staff',
        'Thomas Becker': 'IT',
        'Laura Schmidt': 'Finance',
        'Stefan Vogel': 'Medical',
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

    const addExternalUserRow = (phase: 'plan' | 'check') => {
        const row = createExternalUserRow();
        if (phase === 'plan') {
            setPlanMeeting(prev => ({ ...prev, externalUsers: [...prev.externalUsers, row] }));
            return;
        }
        setCheckMeeting(prev => ({ ...prev, externalUsers: [...prev.externalUsers, row] }));
    };

    const removeExternalUserRow = (phase: 'plan' | 'check', id: string) => {
        if (phase === 'plan') {
            setPlanMeeting(prev => ({ ...prev, externalUsers: prev.externalUsers.filter(userItem => userItem.id !== id) }));
            return;
        }
        setCheckMeeting(prev => ({ ...prev, externalUsers: prev.externalUsers.filter(userItem => userItem.id !== id) }));
    };

    const updateExternalUserField = (
        phase: 'plan' | 'check',
        id: string,
        field: 'fullName' | 'email' | 'note',
        value: string
    ) => {
        if (phase === 'plan') {
            setPlanMeeting(prev => ({
                ...prev,
                externalUsers: prev.externalUsers.map(userItem => userItem.id === id ? { ...userItem, [field]: value } : userItem)
            }));
            return;
        }
        setCheckMeeting(prev => ({
            ...prev,
            externalUsers: prev.externalUsers.map(userItem => userItem.id === id ? { ...userItem, [field]: value } : userItem)
        }));
    };

    const toggleExternalUsers = (phase: 'plan' | 'check') => {
        if (phase === 'plan') {
            setPlanMeeting(prev => {
                const nextEnabled = !prev.externalEnabled;
                return {
                    ...prev,
                    externalEnabled: nextEnabled,
                    externalUsers: nextEnabled && prev.externalUsers.length === 0 ? [createExternalUserRow()] : prev.externalUsers
                };
            });
            return;
        }
        setCheckMeeting(prev => {
            const nextEnabled = !prev.externalEnabled;
            return {
                ...prev,
                externalEnabled: nextEnabled,
                externalUsers: nextEnabled && prev.externalUsers.length === 0 ? [createExternalUserRow()] : prev.externalUsers
            };
        });
    };

    const closeExternalUsersPanel = (phase: 'plan' | 'check') => {
        if (phase === 'plan') {
            setPlanMeeting(prev => ({ ...prev, externalEnabled: false }));
            return;
        }
        setCheckMeeting(prev => ({ ...prev, externalEnabled: false }));
    };

    const showFeedbackPopup = (
        titleKey: 'pdca.externalUsersConfirmedTitle' | 'pdca.meetingInvitesSentTitle',
        onClose?: () => void
    ) => {
        if (feedbackPopupTimeoutRef.current) {
            clearTimeout(feedbackPopupTimeoutRef.current);
        }
        setFeedbackPopupTitleKey(titleKey);
        feedbackPopupTimeoutRef.current = setTimeout(() => {
            setFeedbackPopupTitleKey(null);
            feedbackPopupTimeoutRef.current = null;
            onClose?.();
        }, 1800);
    };

    const showExternalUsersConfirmed = (phase: 'plan' | 'check') => {
        closeExternalUsersPanel(phase);
        showFeedbackPopup('pdca.externalUsersConfirmedTitle');
    };

    const handleSendMeetingInvites = (phase: 'plan' | 'check') => {
        showFeedbackPopup('pdca.meetingInvitesSentTitle', () => {
            if (phase === 'plan') {
                setPlanMeetingExpanded(false);
                return;
            }
            setCheckMeetingExpanded(false);
        });
    };

    const renderFeedbackPopup = () => {
        if (!feedbackPopupTitleKey) return null;

        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 12000,
                    pointerEvents: 'none'
                }}
            >
                <div
                    style={{
                        minWidth: '280px',
                        padding: '2rem 2.25rem',
                        borderRadius: '28px',
                        background: '#ffffff',
                        boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1.1rem'
                    }}
                >
                    <div
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '999px',
                            background: 'linear-gradient(180deg, #34d3c5 0%, #21b8aa 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 14px 32px rgba(33, 184, 170, 0.24)'
                        }}
                    >
                        <Check size={58} color="#ffffff" strokeWidth={3.5} />
                    </div>
                    <div style={{ fontSize: '34px', fontWeight: 800, color: '#111827', lineHeight: 1, textAlign: 'center' }}>
                        {t(feedbackPopupTitleKey)}
                    </div>
                </div>
            </div>
        );
    };

    const renderExternalUsersPanel = (phase: 'plan' | 'check', meeting: MeetingState) => (
        <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.35rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'transparent', color: '#2f7a6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={16} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2f7a6b', fontWeight: 700, fontSize: '15px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                            <span>{t('pdca.inviteExternalUsers')}</span>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => addExternalUserRow(phase)}
                    style={{
                        border: 'none',
                        borderRadius: '999px',
                        padding: '0 14px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 500,
                        lineHeight: 1,
                        color: '#2f7a6b',
                        background: 'transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    + {t('pdca.addPerson')}
                </button>
            </div>

            {meeting.externalUsers.map((externalUser, idx) => (
                <div key={externalUser.id} style={{ border: '1px solid #d7ebe5', borderRadius: '10px', padding: '0.75rem', background: '#ffffff', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '999px', background: '#5FAE9E', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {idx + 1}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeExternalUserRow(phase, externalUser.id)}
                            style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff1f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div style={{ marginBottom: '0.55rem' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#5FAE9E', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('pdca.fullName')}</div>
                        <input
                            type="text"
                            value={externalUser.fullName}
                            onChange={e => updateExternalUserField(phase, externalUser.id, 'fullName', e.target.value)}
                            placeholder="Jane Smith"
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #d7ebe5', background: '#fff', fontSize: '13px', color: '#334155', outline: 'none' }}
                        />
                    </div>

                    <div style={{ marginBottom: '0.55rem' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#5FAE9E', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('pdca.emailAddress')}</div>
                        <input
                            type="email"
                            value={externalUser.email}
                            onChange={e => updateExternalUserField(phase, externalUser.id, 'email', e.target.value)}
                            placeholder={language === 'de' ? 'email@beispiel.de' : 'email@example.com'}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #d7ebe5', background: '#fff', fontSize: '13px', color: '#334155', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#5FAE9E', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('pdca.note')}</div>
                        <input
                            type="text"
                            value={externalUser.note || ''}
                            onChange={e => updateExternalUserField(phase, externalUser.id, 'note', e.target.value)}
                            placeholder={language === 'de' ? 'Notiz...' : 'Note...'}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #d7ebe5', background: '#fff', fontSize: '13px', color: '#334155', outline: 'none' }}
                        />
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={() => showExternalUsersConfirmed(phase)}
                style={{
                    width: '100%',
                    marginTop: '0.35rem',
                    padding: '0.68rem 0.9rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(90deg, #3AAFA9 0%, #2B9E97 100%)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                }}
            >
                {t('pdca.confirmExternalUsers', { count: meeting.externalUsers.length })}
            </button>
        </div>
    );

    const toggleDoExternalUsers = (idx: number) => {
        const updated = [...formState.actions];
        const action = updated[idx];
        const nextEnabled = !action.externalEnabled;
        updated[idx] = {
            ...action,
            externalEnabled: nextEnabled,
            externalUsers: nextEnabled && (!action.externalUsers || action.externalUsers.length === 0)
                ? [createExternalUserRow()]
                : (action.externalUsers || [])
        };
        setFormState({ ...formState, actions: updated });
    };

    const addDoExternalUserRow = (idx: number) => {
        const updated = [...formState.actions];
        const action = updated[idx];
        updated[idx] = { ...action, externalUsers: [...(action.externalUsers || []), createExternalUserRow()] };
        setFormState({ ...formState, actions: updated });
    };

    const removeDoExternalUserRow = (idx: number, id: string) => {
        const updated = [...formState.actions];
        const action = updated[idx];
        updated[idx] = { ...action, externalUsers: (action.externalUsers || []).filter((u: ExternalMeetingUser) => u.id !== id) };
        setFormState({ ...formState, actions: updated });
    };

    const updateDoExternalUserField = (idx: number, id: string, field: 'fullName' | 'email' | 'note', value: string) => {
        const updated = [...formState.actions];
        const action = updated[idx];
        updated[idx] = {
            ...action,
            externalUsers: (action.externalUsers || []).map((u: ExternalMeetingUser) => u.id === id ? { ...u, [field]: value } : u)
        };
        setFormState({ ...formState, actions: updated });
    };

    const showDoExternalUsersConfirmed = (idx: number) => {
        setFormState((prev: typeof formState) => {
            const updated = [...prev.actions];
            const action = updated[idx];
            if (!action) return prev;
            updated[idx] = { ...action, externalEnabled: false };
            return { ...prev, actions: updated };
        });
        showFeedbackPopup('pdca.externalUsersConfirmedTitle');
    };

    const loadData = () => {
        const allTopics = topicsService.getAll();
        setTopics(allTopics);
        setTodos(todosService.getAll());
        setAdminLocations(adminService.getLocations());
        setAdminDepartments(adminService.getDepartments());
        if (selectedTopic) {
            const updated = allTopics.find(t => t.id === selectedTopic.id);
            if (updated) {
                setSelectedTopic(updated);
                setViewingStep(updated.step);
            }
        }
    };

    useEffect(() => {
        topicsService.init();
        loadData();
        window.addEventListener('storage', loadData);
        window.addEventListener('storage-admin', loadData);
        return () => {
            window.removeEventListener('storage', loadData);
            window.removeEventListener('storage-admin', loadData);
        };
    }, [selectedTopic?.id]);

    useEffect(() => {
        if (!openTopicId || topics.length === 0) return;
        const requestedTopic = topics.find(topic => topic.id === openTopicId);
        if (!requestedTopic) return;
        if (selectedTopic?.id !== requestedTopic.id) {
            setSelectedTopic(requestedTopic);
        }
        setViewingStep(requestedTopic.step);
    }, [openTopicId, topics, selectedTopic?.id]);

    useEffect(() => {
        return () => {
            if (savedIndicatorTimeoutRef.current) {
                clearTimeout(savedIndicatorTimeoutRef.current);
            }
            if (feedbackPopupTimeoutRef.current) {
                clearTimeout(feedbackPopupTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setSelectedDepartments(prev => prev.filter(dep => DEPARTMENT_OPTIONS.includes(dep)));
    }, [DEPARTMENT_OPTIONS]);

    useEffect(() => {
        if (mode !== 'create' || hasInitializedPlanDefaults) return;
        setSelectedLocations([]);
        setSelectedDepartments([]);
        setHasInitializedPlanDefaults(true);
    }, [mode, hasInitializedPlanDefaults]);

    useEffect(() => {
        if (selectedTopic) {
            const isSeedTopic = seededTopicIds.has(selectedTopic.id);
            const shouldResetCurrentDoPhase = isSeedTopic && selectedTopic.step === 'DO' && !selectedTopic.do.completedAt;
            const shouldResetCurrentCheckPhase = isSeedTopic && selectedTopic.step === 'CHECK' && !selectedTopic.check.completedAt;
            const shouldResetCurrentActPhase = isSeedTopic && selectedTopic.step === 'ACT' && !selectedTopic.act.completedAt;

            const nextViewingStep = pendingViewingStepRef.current ?? selectedTopic.step;
            setViewingStep(nextViewingStep);
            pendingViewingStepRef.current = null;
            setSelectedLocations(
                selectedTopic.location
                    ? selectedTopic.location.split(',').map(v => v.trim()).filter(Boolean)
                    : []
            );
            setSelectedDepartments(
                selectedTopic.departmentId
                    ? selectedTopic.departmentId.split(',').map(v => normalizeStoredDepartmentName(v)).filter(Boolean)
                    : []
            );
            setFormState({
                title: selectedTopic.title || '',
                dueDate: selectedTopic.dueDate || '',
                description: selectedTopic.plan.description || '',
                goal: selectedTopic.plan.goal || '',
                asIs: selectedTopic.plan.asIs || '',
                toBe: selectedTopic.plan.toBe || '',
                rootCause: selectedTopic.plan.rootCause || '',
                improvementPurpose: selectedTopic.plan.improvementPurpose || selectedTopic.plan.objectives || [],
                checkDate: shouldResetCurrentDoPhase ? '' : (selectedTopic.do.checkDate || selectedTopic.dueDate || ''),
                actions: shouldResetCurrentDoPhase ? [] : (selectedTopic.do.actions || []),
                kpis: shouldResetCurrentCheckPhase ? [] : (selectedTopic.check.kpis || []),
                kpiResults: shouldResetCurrentCheckPhase ? '' : (selectedTopic.check.kpiResults || ''),
                effectivenessReview: shouldResetCurrentCheckPhase ? '' : (selectedTopic.check.effectivenessReview || ''),
                effectivenessStatus: shouldResetCurrentCheckPhase ? undefined : selectedTopic.check.effectivenessStatus,
                kpiEvaluations: shouldResetCurrentCheckPhase ? [] : (selectedTopic.check.kpiEvaluations || []),

                // ACT
                actOutcome: shouldResetCurrentActPhase ? undefined : selectedTopic.act.actOutcome,
                standardizationScope: shouldResetCurrentActPhase ? [] : (selectedTopic.act.standardizationScope || []),
                affectedAreas: shouldResetCurrentActPhase ? [] : (selectedTopic.act.affectedAreas || []),
                standardizationDescription: shouldResetCurrentActPhase ? '' : (selectedTopic.act.standardizationDescription || selectedTopic.act.standardization || ''),
                actConfirmation: shouldResetCurrentActPhase ? { standardized: false, noActionsPending: false, readyToClose: false } : (selectedTopic.act.actConfirmation || { standardized: false, noActionsPending: false, readyToClose: false }),

                standardization: shouldResetCurrentActPhase ? '' : (selectedTopic.act.standardization || ''),
                lessonsLearned: shouldResetCurrentActPhase ? '' : (selectedTopic.act.lessonsLearned || '')
            });
            setPlanMeeting(hydrateMeetingState(selectedTopic.plan.meeting, selectedTopic.dueDate || ''));
            setCheckMeeting(
                shouldResetCurrentCheckPhase
                    ? createDefaultMeetingState()
                    : hydrateMeetingState(selectedTopic.check.meeting, selectedTopic.dueDate || '')
            );
        } else {
            setPlanMeeting(createDefaultMeetingState());
            setCheckMeeting(createDefaultMeetingState());
        }
    }, [selectedTopic?.id, selectedTopic?.step, selectedTopic?.updatedAt, seededTopicIds]);

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

    const getGermanMyTopicsStepLabel = (step: Step) => {
        const visibleStep = step === 'ACT' ? 'CHECK' : step;
        if (visibleStep === 'PLAN') return 'Plan';
        if (visibleStep === 'DO') return 'Do';
        return 'Check';
    };

    const getMyTopicsFilterStepLabel = (step: Step) =>
        language === 'de'
            ? getGermanMyTopicsStepLabel(step)
            : t(`phases.${step.toLowerCase()}`);

    const getMyTopicsRowStepLabel = (step: Step) =>
        language === 'de'
            ? getGermanMyTopicsStepLabel(step)
            : t(`pdca.${step.toLowerCase()}`);

    const backToCockpitLabel = language === 'de' ? 'Zur\u00fcck zum Cockpit' : 'Back to Cockpit';
    const allTopicsTitle = language === 'de' ? 'Alle Themen' : 'All Topics';
    const allTopicsSubtitle = language === 'de'
        ? 'Alle Initiativen, f\u00fcr die Sie verantwortlich sind'
        : 'All initiatives you are responsible for';
    const viewAllLabel = language === 'de' ? 'Alle anzeigen' : 'View all';

    const openTopicDetail = (topic: Topic) => {
        const latestTopic = topicsService.getById(topic.id) || topic;
        setSelectedTopic(latestTopic);
        setViewingStep(latestTopic.step);
    };

    const resolveTopicOwnerName = (topic: Topic) => {
        const allUsers = authService.getAllUsers();
        return topic.ownerName
            || allUsers.find(candidate => candidate.id === topic.ownerId)?.name
            || topic.responsibleName
            || allUsers.find(candidate => candidate.id === topic.responsibleId)?.name
            || user?.name
            || 'Unknown';
    };

    // Derived: My Assigned Actions from Topics
    const myActions = topics.flatMap(t =>
        (t.do?.actions || [])
            .filter(a => a.assignments?.some((assign: any) => assign.userId === user?.id))
            .filter(a => !a.assignments.every((assign: any) => assign.completed))
            .map(a => ({
                ...a,
                topicId: t.id,
                topicTitle: t.title,
                topicStep: t.step,
                myAssignment: a.assignments.find((assign: any) => assign.userId === user?.id)
            }))
    );

    const getActionStatusValue = (dueDate?: string) => {
        const statusClass = getStatusMeta('', dueDate).class;
        if (statusClass === 'status-critical') return 'Critical';
        if (statusClass === 'status-warning') return 'Warning';
        if (statusClass === 'status-done') return 'Done';
        return 'Monitoring';
    };

    const filteredAllActions = myActions.filter((action: any) => {
        const searchText = `${action.topicTitle || ''} ${action.title || ''}`.toLowerCase();
        const matchesSearch = searchText.includes(allActionsSearch.toLowerCase());
        const matchesStatus = allActionsStatusFilter === 'All Status' || getActionStatusValue(action.dueDate) === allActionsStatusFilter;
        const matchesStep = allActionsStepFilter === 'All' || action.topicStep === allActionsStepFilter;
        return matchesSearch && matchesStatus && matchesStep;
    });
    const visibleMyActions = myActions.slice(0, 5);



    const isPlaceholderTopic = (topic: Topic) => {
        const title = (topic.title || '').trim();
        const kpi = (topic.kpi || '').trim();
        const objective = (topic.objective || '').trim();

        return title.length === 0 && kpi === '-' && objective === '-';
    };

    const isOwnedByCurrentUser = (topic: Topic) => !!user?.id && topic.ownerId === user.id;
    const isVisibleCockpitTopic = (topic: Topic) =>
        !isPlaceholderTopic(topic) && isTopicVisibleInWorkflow(topic);

    const markTopicAsRecentlySaved = (topicId: string) => {
        setLastSavedTopicId(topicId);
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(RECENT_SAVED_TOPIC_KEY, topicId);
        }
    };

    const effectiveRecentSavedTopicId =
        lastSavedTopicId ||
        (typeof window !== 'undefined' ? window.sessionStorage.getItem(RECENT_SAVED_TOPIC_KEY) : null);

    const syncRecentSavedTopicFromStorage = () => {
        if (typeof window === 'undefined') return;
        setLastSavedTopicId(window.sessionStorage.getItem(RECENT_SAVED_TOPIC_KEY));
    };

    const getTopicSortTimestamp = (topic: Topic) => {
        if (topic.updatedAt) return new Date(topic.updatedAt).getTime();
        const lastHistoryEntry = topic.history?.[topic.history.length - 1];
        return lastHistoryEntry?.date ? new Date(lastHistoryEntry.date).getTime() : 0;
    };

    const recentSavedTopicCandidate = effectiveRecentSavedTopicId
        ? topics.find(topic => topic.id === effectiveRecentSavedTopicId) || topicsService.getById(effectiveRecentSavedTopicId)
        : undefined;

    const recentSavedTopic =
        recentSavedTopicCandidate &&
        isOwnedByCurrentUser(recentSavedTopicCandidate) &&
        isVisibleCockpitTopic(recentSavedTopicCandidate)
            ? recentSavedTopicCandidate
            : undefined;

    const handleBackToCockpit = () => {
        loadData();
        syncRecentSavedTopicFromStorage();
        setSearchParams({});
        setSelectedTopic(null);
    };

    const triggerSavedIndicator = () => {
        if (savedIndicatorTimeoutRef.current) {
            clearTimeout(savedIndicatorTimeoutRef.current);
        }

        setIsSaved(true);
        savedIndicatorTimeoutRef.current = setTimeout(() => {
            setIsSaved(false);
            savedIndicatorTimeoutRef.current = null;
        }, 2000);
    };

    const getEffectiveTopicDueDate = (step: Step | null | undefined) => {
        if (step === 'DO') return formState.checkDate || formState.dueDate;
        if (step === 'CHECK') return checkMeeting.checkTriggerDate || formState.dueDate;
        if (step === 'ACT') return formState.dueDate;
        return planMeeting.checkTriggerDate || formState.dueDate;
    };

    const getDerivedCheckDecision = (effectivenessStatus?: EffectivenessStatus): CheckDecision | undefined => {
        if (effectivenessStatus === 'Effective') return 'Proceed to Standardization';
        if (effectivenessStatus === 'Partially Effective') return 'Proceed to Improvement';
        if (effectivenessStatus === 'Not Effective') return 'Return to Re-planning';
        return undefined;
    };

    const baseMyTopics = topics
        .filter((t: Topic) => {
            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(getVisibleTopicStatus(t));
            const matchesStep = stepFilter.length === 0 || stepFilter.includes(getTopicDisplayStep(t));

            return isOwnedByCurrentUser(t) && matchesStatus && matchesStep && isVisibleCockpitTopic(t);
        })
        .sort((a, b) => getTopicSortTimestamp(b) - getTopicSortTimestamp(a));

    const myTopics = recentSavedTopic
        ? [recentSavedTopic, ...baseMyTopics.filter(topic => topic.id !== recentSavedTopic.id)]
        : baseMyTopics;

    const ownedTopicsAll = topics.filter((t: Topic) => isOwnedByCurrentUser(t) && !isPlaceholderTopic(t));

    const filteredAllTopics = ownedTopicsAll.filter((topic: Topic) => {
        const searchText = `${topic.title || ''} ${topic.kpi || ''}`.toLowerCase();
        const matchesSearch = searchText.includes(allTopicsSearch.toLowerCase());
        const matchesStatus = allTopicsStatusFilter === 'All Status' || getVisibleTopicStatus(topic) === allTopicsStatusFilter;
        const matchesStep = allTopicsStepFilter === 'All' || getTopicDisplayStep(topic) === allTopicsStepFilter;
        return matchesSearch && matchesStatus && matchesStep && isVisibleCockpitTopic(topic);
    }).sort((a, b) => getTopicSortTimestamp(b) - getTopicSortTimestamp(a));
    const visibleMyTopics = myTopics.slice(0, 5);

    const toggleStatus = (status: string) => {
        setStatusFilter(prev => prev.includes(status) ? [] : [status]);
    };

    useEffect(() => {
        if (language !== 'de') return;
        setStepFilter(prev => prev.filter(step => step !== 'ACT'));
    }, [language]);

    useEffect(() => {
        if (allTopicsStepFilter === 'ACT') {
            setAllTopicsStepFilter('All');
        }
    }, [allTopicsStepFilter]);

    const toggleStep = (step: Step) => {
        setStepFilter(prev => prev.includes(step) ? [] : [step]);
    };

    const openActionCommentEditor = (action: any) => {
        setOpenActionCommentId(action.id);
        setActionCommentDraft(action.comment || '');
    };

    const closeActionCommentEditor = () => {
        setOpenActionCommentId(null);
        setActionCommentDraft('');
    };

    const getActionComments = (action: any) => {
        if (action.comments && action.comments.length > 0) return action.comments;
        if (action.comment) {
            return [{
                id: `legacy-${action.id}`,
                userId: 'legacy',
                userName: 'System',
                text: action.comment,
                createdAt: ''
            }];
        }
        return [];
    };

    const renderActionComments = (action: any) => {
        const comments = getActionComments(action);

        if (comments.length === 0) return null;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {comments.map((comment: any) => {
                    const matchingAssignment = action.assignments?.find((assignment: any) => assignment.userId === comment.userId);
                    const assignmentStatus = matchingAssignment ? (matchingAssignment.completed ? t('common.completed') : t('common.markComplete')) : null;

                    return (
                    <div
                        key={comment.id}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            color: '#334155',
                            fontSize: '13px',
                            padding: '0.6rem 0.75rem',
                            background: '#fff',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px'
                        }}
                    >
                        <MessageSquare size={16} style={{ marginTop: '1px', flexShrink: 0, color: '#8AA0BF' }} />
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                                {comment.userName}
                                {assignmentStatus ? `: ${assignmentStatus.toUpperCase()}` : ''}
                            </div>
                            {comment.createdAt && (
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }}>
                                    {new Date(comment.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'de-DE')}
                                </div>
                            )}
                            <div>{comment.text}</div>
                        </div>
                    </div>
                    );
                })}
            </div>
        );
    };

    const saveActionComment = (action: any) => {
        if (!actionCommentDraft.trim()) return;
        const topic = topicsService.getById(action.topicId);
        if (!topic) return;

        const nextActions = (topic.do.actions || []).map(existingAction =>
            existingAction.id === action.id
                ? {
                    ...existingAction,
                    comments: [
                        ...getActionComments(existingAction),
                        {
                            id: `comment-${Date.now()}`,
                            userId: user?.id || 'unknown',
                            userName: user?.name || 'Unknown',
                            text: actionCommentDraft.trim(),
                            createdAt: new Date().toISOString()
                        }
                    ],
                    comment: actionCommentDraft.trim()
                }
                : existingAction
        );

        topicsService.update(action.topicId, {
            do: {
                ...topic.do,
                actions: nextActions
            }
        });
        loadData();
        closeActionCommentEditor();
    };

    const toggleAssignedActionCompletion = (actionRef: any, checked: boolean) => {
        const topic = topicsService.getById(actionRef.topicId);
        if (!topic) return;

        const action = topic.do.actions.find(act => act.id === actionRef.id);
        if (!action) return;

        const assign = action.assignments.find(p => p.userId === user?.id);
        if (!assign) return;

        assign.completed = checked;
        assign.completedAt = checked ? new Date().toISOString() : undefined;

        topicsService.update(actionRef.topicId, { do: topic.do });
        loadData();
    };

    const handleSave = async () => {
        if (!selectedTopic) return;
        const savedTopicId = selectedTopic.id;
        const effectiveDueDate = getEffectiveTopicDueDate(selectedTopic.step);
        const nowIso = new Date().toISOString();
        const shouldPromptStandardizationPdf =
            selectedTopic.step === 'ACT'
            && formState.actOutcome === 'Standardize'
            && !!formState.actConfirmation?.standardized;
        const shouldPromptRerunPdf =
            selectedTopic.step === 'ACT'
            && formState.actOutcome === 'Improve & Re-run PDCA'
            && !!formState.actConfirmation?.noActionsPending;
        const shouldPromptClosePdf =
            selectedTopic.step === 'ACT'
            && formState.actOutcome === 'Close without Standardization'
            && !!formState.actConfirmation?.readyToClose;
        const shouldFinalizeActOnSave =
            shouldPromptStandardizationPdf ||
            shouldPromptRerunPdf ||
            shouldPromptClosePdf;
        const actFinalStatus = formState.actOutcome === 'Improve & Re-run PDCA' ? 'Warning' : 'Done';

        const savedTopic = topicsService.update(savedTopicId, {
            title: formState.title,
            dueDate: effectiveDueDate,
            location: selectedLocations.join(', '),
            departmentId: selectedDepartments.join(', '),
            plan: {
                description: formState.description,
                goal: formState.goal,
                asIs: formState.asIs,
                toBe: formState.toBe,
                rootCause: formState.rootCause,
                improvementPurpose: formState.improvementPurpose || [],
                objectives: formState.improvementPurpose || [],
                meeting: toPhaseMeetingData(planMeeting)
            } as any,
            do: { checkDate: formState.checkDate, actions: formState.actions || [] },

            check: {
                kpis: formState.kpis || [],
                kpiResults: formState.kpiResults,
                effectivenessReview: formState.effectivenessReview,
                effectivenessStatus: formState.effectivenessStatus,
                kpiEvaluations: formState.kpiEvaluations || [],
                checkDecision: getDerivedCheckDecision(formState.effectivenessStatus),
                meeting: toPhaseMeetingData(checkMeeting),
                audit: { checkedBy: user?.name || 'Unknown', checkedOn: new Date().toISOString() }
            },
            act: {
                actOutcome: formState.actOutcome,
                standardizationScope: formState.standardizationScope,
                affectedAreas: formState.affectedAreas,
                standardizationDescription: formState.standardizationDescription,
                lessonsLearned: formState.lessonsLearned,
                actConfirmation: formState.actConfirmation,
                standardization: formState.standardization, // keep legacy sync
                ...(selectedTopic.step === 'ACT' && shouldFinalizeActOnSave
                    ? {
                        audit: {
                            closedBy: user?.name || 'Unknown',
                            closedOn: nowIso,
                            finalOutcome: formState.actOutcome,
                            finalStatus: actFinalStatus
                        },
                        completedAt: nowIso
                    }
                    : {})
            },
            ...(selectedTopic.step === 'ACT' && shouldFinalizeActOnSave
                ? { status: actFinalStatus as Topic['status'], displayStep: 'ACT' as Step }
                : {})
        });

        if (savedTopic) {
            setSelectedTopic(savedTopic);
            setViewingStep(pendingViewingStepRef.current ?? savedTopic.step);
        }

        if (selectedTopic.step === 'PLAN' && selectedTopic.rerunSourceRef) {
            removeTopicFromTemplatesStandards(selectedTopic.rerunSourceRef);
            topicsService.update(savedTopicId, { rerunSourceRef: undefined });
        }

        markTopicAsRecentlySaved(savedTopicId);
        setStatusFilter([]);
        setStepFilter([]);
        loadData();
        window.dispatchEvent(new Event('storage'));
        triggerSavedIndicator();

        if (shouldPromptStandardizationPdf) {
            setPdfModalContext('standardize');
            setShowPdfModal(true);
        } else if (shouldPromptRerunPdf) {
            setPdfModalContext('rerun');
            setShowPdfModal(true);
        } else if (shouldPromptClosePdf) {
            setPdfModalContext('close');
            setShowPdfModal(true);
        }

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

    };

    const handlePrimarySave = async () => {
        if (!selectedTopic) return;

        const shouldAdvanceAfterSave =
            viewingStep === selectedTopic.step &&
            selectedTopic.step !== 'ACT';

        await handleSave();

        if (shouldAdvanceAfterSave) {
            handleProceed();
        }
    };

    const resetCreateDraft = () => {
        setCreateState(createDefaultState());
        setSelectedLocations([]);
        setSelectedDepartments([]);
        setLocationDeptTab('locations');
        setHasInitializedPlanDefaults(false);
        setPlanMeetingExpanded(false);
        setPlanMeetingPickerOpen(false);
        setPlanMeeting(createDefaultMeetingState());
        setCheckMeetingExpanded(false);
        setCheckMeetingPickerOpen(false);
        setCheckMeeting(createDefaultMeetingState());
    };

    const handleCreateSave = () => {
        if (!createState.title.trim()) { alert('Title is required'); return; }
        if (!createState.goal.trim()) { alert(t('pdca.goalRequired')); return; }
        if (!createState.asIs.trim()) { alert('AS-IS (Current State) is required'); return; }
        if (!createState.toBe.trim()) { alert('TO-BE (Target State) is required'); return; }
        const effectiveDueDate = planMeeting.checkTriggerDate || createState.dueDate;

        const newTopic = topicsService.add({
            title: createState.title,
            ownerId: user?.id || '',
            responsibleId: 'u2',
            status: createState.status as any,
            category: 'Clinical',
            kpi: '-',
            objective: '-',
            dueDate: effectiveDueDate,
            step: 'PLAN'
        });

        topicsService.update(newTopic.id, {
            location: selectedLocations.join(', '),
            departmentId: selectedDepartments.join(', '),
            plan: {
                description: createState.description,
                goal: createState.goal,
                asIs: createState.asIs,
                toBe: createState.toBe,
                rootCause: createState.rootCause,
                improvementPurpose: createState.improvementPurpose,
                objectives: createState.improvementPurpose,
                meeting: toPhaseMeetingData(planMeeting),
                completedAt: new Date().toISOString()
            }
        });

        const savedTopic = topicsService.getById(newTopic.id) || newTopic;
        markTopicAsRecentlySaved(savedTopic.id);
        setStatusFilter([]);
        setStepFilter([]);
        window.dispatchEvent(new Event('storage'));
        loadData();
        setSelectedTopic(savedTopic);
        setViewingStep('PLAN');
        setSearchParams({ topicId: savedTopic.id });
        triggerSavedIndicator();
    };

    const handleProceed = () => {
        if (!selectedTopic) return;
        const effectiveDueDate = getEffectiveTopicDueDate(selectedTopic.step);

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
            dueDate: effectiveDueDate,
            location: selectedLocations.join(', '),
            departmentId: selectedDepartments.join(', '),
            plan: {
                description: formState.description,
                goal: formState.goal,
                asIs: formState.asIs,
                toBe: formState.toBe,
                rootCause: formState.rootCause,
                improvementPurpose: formState.improvementPurpose || [],
                objectives: formState.improvementPurpose || [],
                meeting: toPhaseMeetingData(planMeeting)
            },
            do: { checkDate: formState.checkDate, actions: formState.actions },
            check: {
                kpis: formState.kpis,
                kpiResults: formState.kpiResults,
                effectivenessReview: formState.effectivenessReview,
                effectivenessStatus: formState.effectivenessStatus,
                kpiEvaluations: formState.kpiEvaluations,
                checkDecision: getDerivedCheckDecision(formState.effectivenessStatus),
                meeting: toPhaseMeetingData(checkMeeting),
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
            const updates: any = { step: nextStep, displayStep: selectedTopic.step };

            if (selectedTopic.step === 'PLAN') (updates as any).plan = {
                description: formState.description, goal: formState.goal, asIs: formState.asIs, toBe: formState.toBe, rootCause: formState.rootCause, improvementPurpose: formState.improvementPurpose || [], objectives: formState.improvementPurpose || [],
                meeting: toPhaseMeetingData(planMeeting),
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
                    checkDecision: getDerivedCheckDecision(formState.effectivenessStatus),
                    meeting: toPhaseMeetingData(checkMeeting),
                    audit: { checkedBy: user?.name || 'Unknown', checkedOn: new Date().toISOString() },
                    completedAt: new Date().toISOString()
                };
                updates.status = 'Done' as const;
            }

            const progressedTopic = topicsService.update(selectedTopic.id, updates);
            if (progressedTopic) {
                setSelectedTopic(progressedTopic);
                setViewingStep(progressedTopic.step);
            } else {
                setViewingStep(nextStep);
            }
            loadData();
            window.dispatchEvent(new Event('storage'));
        } else if (selectedTopic.step === 'ACT') {
            const finalStatus = formState.actOutcome === 'Improve & Re-run PDCA' ? 'Warning' : 'Done';

            const closedTopic = topicsService.update(selectedTopic.id, {
                status: finalStatus,
                displayStep: 'ACT',
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
            if (closedTopic) {
                setSelectedTopic(closedTopic);
                setViewingStep(closedTopic.step);
            }
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

    const buildTopicForPdf = (overrides?: { actConfirmation?: { standardized: boolean; noActionsPending: boolean; readyToClose: boolean } }) => {
        if (!selectedTopic) return null;
        const persistedTopic = topicsService.getById(selectedTopic.id) || selectedTopic;
        const nowIso = new Date().toISOString();
        const improvementPurpose = formState.improvementPurpose || persistedTopic.plan.improvementPurpose || persistedTopic.plan.objectives || [];
        const resolvedPlanMeeting = hasMeetingStateContent(planMeeting) ? toPhaseMeetingData(planMeeting) : persistedTopic.plan.meeting;
        const resolvedCheckMeeting = hasMeetingStateContent(checkMeeting) ? toPhaseMeetingData(checkMeeting) : persistedTopic.check.meeting;
        const resolvedLocation = selectedLocations.length > 0 ? selectedLocations.join(', ') : (persistedTopic.location || '');
        const resolvedDepartments = selectedDepartments.length > 0 ? selectedDepartments.join(', ') : (persistedTopic.departmentId || '');
        const derivedCheckDecision = getDerivedCheckDecision(formState.effectivenessStatus);
        const actFinalStatus = formState.actOutcome === 'Improve & Re-run PDCA' ? 'Warning' : 'Done';
        const checkAudit =
            persistedTopic.check?.completedAt && persistedTopic.check.audit
                ? persistedTopic.check.audit
                : {
                    checkedBy: user?.name || 'Unknown',
                    checkedOn: nowIso
                };
        const actAudit =
            persistedTopic.act?.completedAt && persistedTopic.act.audit
                ? persistedTopic.act.audit
                : (formState.actOutcome ? {
                    closedBy: user?.name || 'Unknown',
                    closedOn: nowIso,
                    finalOutcome: formState.actOutcome,
                    finalStatus: actFinalStatus
                } : persistedTopic.act.audit);
        return {
            ...persistedTopic,
            title: formState.title || persistedTopic.title,
            dueDate: getEffectiveTopicDueDate(selectedTopic.step) || persistedTopic.dueDate,
            location: resolvedLocation,
            departmentId: resolvedDepartments,
            plan: {
                ...persistedTopic.plan,
                description: formState.description,
                goal: formState.goal,
                asIs: formState.asIs,
                toBe: formState.toBe,
                rootCause: formState.rootCause,
                improvementPurpose,
                objectives: improvementPurpose,
                meeting: resolvedPlanMeeting
            },
            do: { ...persistedTopic.do, actions: formState.actions, checkDate: formState.checkDate },
            check: {
                ...persistedTopic.check,
                effectivenessStatus: formState.effectivenessStatus,
                kpiEvaluations: formState.kpiEvaluations,
                effectivenessReview: formState.effectivenessReview,
                checkDecision: derivedCheckDecision,
                meeting: resolvedCheckMeeting,
                audit: checkAudit
            },
            act: {
                ...persistedTopic.act,
                actOutcome: formState.actOutcome,
                standardizationScope: formState.standardizationScope,
                affectedAreas: formState.affectedAreas,
                standardizationDescription: formState.standardizationDescription,
                lessonsLearned: formState.lessonsLearned,
                actConfirmation: overrides?.actConfirmation ?? formState.actConfirmation,
                standardization: formState.standardization,
                audit: actAudit
            }
        };
    };

    const handlePdfModalDismiss = () => {
        const topicForPdf = buildTopicForPdf();
        if (topicForPdf) {
            syncTopicToTemplatesStandards(topicForPdf, resolveTopicOwnerName(topicForPdf));
        }
        setShowPdfModal(false);
        navigate('/app/templates-standards');
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
                {renderFeedbackPopup()}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="action-bar">
                        <button
                            className="action-btn"
                            type="button"
                            onClick={() => {
                                resetCreateDraft();
                                setSearchParams({});
                            }}
                            style={{ background: '#cbeee2', color: '#5FAE9E', border: 'none', minWidth: '140px', flexDirection: 'row', gap: '8px', fontSize: '14px' }}
                        >
                            <ArrowLeft size={16} /> {t('common.back')}
                        </button>
                        <button
                            className="action-btn"
                            type="button"
                            onClick={handleCreateSave}
                            style={{ background: '#5FAE9E', color: '#ffffff', border: 'none', minWidth: '100px', flexDirection: 'row', gap: '8px', fontSize: '14px' }}
                        >
                            <Save size={16} /> {t('common.save')}
                        </button>
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

                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>{t('common.dueDate')}</label>
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
                                {t('pdca.specifyCheckDate')}
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
                                <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a202c' }}>{t('pdca.planPhaseMeeting')}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {planMeetingExpanded && (
                                        <button
                                            type="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                toggleExternalUsers('plan');
                                            }}
                                            style={{
                                                border: 'none',
                                                borderRadius: 0,
                                                padding: 0,
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: '#5FAE9E',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0
                                            }}
                                        >
                                            {planMeeting.externalEnabled ? t('pdca.hideExternal') : t('pdca.externalUsers')}
                                        </button>
                                    )}
                                    <ChevronDown
                                        size={20}
                                        color="#64748b"
                                        style={{
                                            transition: 'transform 0.25s ease',
                                            transform: planMeetingExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }}
                                    />
                                </div>
                            </div>
                            {planMeetingExpanded && (
                                <>
                                    <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.5rem' }} />

                                    <input
                                        type="text"
                                        value={planMeeting.title}
                                        onChange={e => setPlanMeeting({ ...planMeeting, title: e.target.value })}
                                        placeholder={t('pdca.meetingTitlePlaceholder')}
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
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.responsiblePersons')}</div>

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
                                            >- {t('pdca.changeLabel')}</button>
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
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.meetingType')}</div>
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
                                                <option value="In-Office (On-site)">{t('pdca.inOffice')}</option>
                                                <option value="Remote (Online)">{t('pdca.online')}</option>
                                            </select>
                                            <ChevronDown size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.meetingDateTime')}</div>
                                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                <DateTimePicker
                                                    value={planMeeting.meetingDateTime}
                                                    onChange={val => setPlanMeeting({ ...planMeeting, meetingDateTime: val })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{planMeeting.meetingType === 'Remote (Online)' ? t('pdca.onlineLink') : t('pdca.officeLocation')}</div>
                                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                <input
                                                    type="text"
                                                    value={planMeeting.location}
                                                    onChange={e => setPlanMeeting({ ...planMeeting, location: e.target.value })}
                                                    placeholder={planMeeting.meetingType === 'Remote (Online)' ? t('pdca.meetingLinkPlaceholder') : t('pdca.locationPlaceholder')}
                                                    style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#64748b', outline: 'none', width: '100%', padding: 0 }}
                                                />
                                            </div>
                                        </div>
                                        {planMeeting.externalEnabled && renderExternalUsersPanel('plan', planMeeting)}

                                        <button
                                            type="button"
                                            onClick={() => handleSendMeetingInvites('plan')}
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
                                            {t('pdca.sendMeetingInvites')}
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
                                <form onSubmit={(e) => { e.preventDefault(); handleCreateSave(); }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600 }}>{t('common.title')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={createState.title}
                                            onChange={e => setCreateState({ ...createState, title: e.target.value })}
                                            placeholder={t('pdca.titlePlaceholder')}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontWeight: 600 }}>{t('pdca.goal')}</label>
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
                                            <label style={{ fontWeight: 600 }}>{t('pdca.asIs')}</label>
                                            <textarea
                                                rows={4}
                                                required
                                                value={createState.asIs}
                                                onChange={e => setCreateState({ ...createState, asIs: e.target.value })}
                                                placeholder={t('pdca.asIsPlaceholder')}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: 600 }}>{t('pdca.toBe')}</label>
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
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem', alignItems: 'start' }}>
                                                {[
                                                    [
                                                        { value: 'SAFETY_CRITICAL', label: t('pdca.improvementPurposeSafetyCritical'), bold: true },
                                                        { value: 'SAVE_TIME', label: t('pdca.improvementPurposeSaveTime') },
                                                        { value: 'REDUCE_COSTS', label: t('pdca.improvementPurposeReduceCosts') },
                                                        { value: 'INCREASE_QUALITY', label: t('pdca.improvementPurposeIncreaseQuality') }
                                                    ],
                                                    [
                                                        { value: 'GUEST_SATISFACTION', label: t('pdca.improvementPurposeGuestSatisfaction') },
                                                        { value: 'MITARBERITERZUFRIEDENHEIT', label: t('pdca.improvementPurposeMitarberiterzufriedenheit') }
                                                    ]
                                                ].map((column, columnIndex) => (
                                                    <div key={`create-purpose-col-${columnIndex}`}>
                                                        {column.map(option => (
                                                            <label
                                                                key={option.value}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '0.35rem 0',
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
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <MapPin size={20} color="#5FAE9E" strokeWidth={2} />
                                            <label style={{ fontWeight: 600, margin: 0 }}>{t('pdca.locationDepartment')}</label>
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
                                                    {language === 'de' ? 'Standort' : 'Locations'}
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
                                                    {language === 'de' ? 'Betriebe' : 'Departments'}
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
                                                                }}>{getTranslatedDepartmentName(dept)}</span>
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
                                                        {t('pdca.selectedLocations')}
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
                                                        {t('pdca.selectedDepartments')}
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
                                                                    {getTranslatedDepartmentName(dept)}
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
                                            <option value="Monitoring" style={{ color: '#16a34a', fontWeight: 600 }}>{t('status.monitoring')}</option>
                                            <option value="Warning" style={{ color: '#ca8a04', fontWeight: 600 }}>{t('status.warning')}</option>
                                            <option value="Critical" style={{ color: '#dc2626', fontWeight: 600 }}>{t('status.critical')}</option>
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
                {renderFeedbackPopup()}
                {/* Detail View Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="action-bar">
                        <button className="action-btn" type="button" onClick={handleBackToCockpit} style={{ background: '#cbeee2', color: '#5FAE9E', border: 'none', minWidth: '140px', flexDirection: 'row', gap: '8px', fontSize: '14px' }}>
                            <ArrowLeft size={16} /> {t('common.back')}
                        </button>
                        <button className="action-btn" type="button" onClick={handlePrimarySave} style={{ background: '#5FAE9E', color: '#ffffff', border: 'none', minWidth: '100px', flexDirection: 'row', gap: '8px', fontSize: '14px' }}>
                            <Save size={16} /> {t('common.save')}
                        </button>
                        {selectedTopic.status === 'Done' && (
                            <button className="action-btn" style={{ color: 'var(--color-primary)' }} onClick={handleReopen}>
                                <CheckCircle2 size={16} /> {t('pdca.reopenTopic')}
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isSaved && <span style={{ color: '#111827', fontWeight: 700, fontSize: '12px' }}>{t('pdca.saveSaved')}</span>}
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
                                                        pendingViewingStepRef.current = step;
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
                                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>{t('pdca.checkPhaseActivation')}</span>
                                </div>
                                <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.25rem' }} />

                                {/* Due Date */}
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>{t('common.dueDate')}</label>
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
                                    {t('pdca.specifyCheckDate')}
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
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>{t('common.dueDate')}</label>
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
                                        {t('pdca.specifyCheckDate')}
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
                                        <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a202c' }}>{t('pdca.planPhaseMeeting')}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {planMeetingExpanded && (
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        toggleExternalUsers('plan');
                                                    }}
                                                    style={{
                                                        border: 'none',
                                                        borderRadius: 0,
                                                        padding: 0,
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: '#5FAE9E',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0
                                                    }}
                                                >
                                                    {planMeeting.externalEnabled ? t('pdca.hideExternal') : t('pdca.externalUsers')}
                                                </button>
                                            )}
                                            <ChevronDown
                                                size={20}
                                                color="#64748b"
                                                style={{
                                                    transition: 'transform 0.25s ease',
                                                    transform: planMeetingExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {planMeetingExpanded && (
                                        <>
                                            <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.5rem' }} />

                                            {/* A) Meeting Title Input */}
                                            <input
                                                type="text"
                                                value={planMeeting.title}
                                                onChange={e => setPlanMeeting({ ...planMeeting, title: e.target.value })}
                                                placeholder={t('pdca.meetingTitlePlaceholder')}
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

                                            {/* B) Responsible Persons — Avatar-chip summary + {t('pdca.changeLabel')} picker */}
                                            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.responsiblePersons')}</div>

                                                {/* Collapsed summary row: avatars + {t('pdca.changeLabel')} button */}
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

                                                    {/* {t('pdca.changeLabel')} (edit) button */}
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
                                                    >- {t('pdca.changeLabel')}</button>
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
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.meetingType')}</div>
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
                                                        <option value="In-Office (On-site)">{t('pdca.inOffice')}</option>
                                                        <option value="Remote (Online)">{t('pdca.online')}</option>
                                                    </select>
                                                    <ChevronDown size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                                                </div>
                                            </div>

                                            {/* E) Date stacked above Location – labels outside border, same as CHECK */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.meetingDateTime')}</div>
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                        <DateTimePicker
                                                            value={planMeeting.meetingDateTime}
                                                            onChange={val => setPlanMeeting({ ...planMeeting, meetingDateTime: val })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{planMeeting.meetingType === 'Remote (Online)' ? t('pdca.onlineLink') : t('pdca.officeLocation')}</div>
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                        <input
                                                            id="plan-meeting-location"
                                                            type="text"
                                                            value={planMeeting.location}
                                                            onChange={e => setPlanMeeting({ ...planMeeting, location: e.target.value })}
                                                            placeholder={planMeeting.meetingType === 'Remote (Online)' ? t('pdca.meetingLinkPlaceholder') : t('pdca.locationPlaceholder')}
                                                            style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#64748b', outline: 'none', width: '100%', padding: 0 }}
                                                        />
                                                    </div>
                                                </div>
                                                {planMeeting.externalEnabled && renderExternalUsersPanel('plan', planMeeting)}

                                                {/* {t('pdca.sendMeetingInvites')} button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSendMeetingInvites('plan')}
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
                                                    {t('pdca.sendMeetingInvites')}
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
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>{t('common.dueDate')}</label>
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
                                        {t('pdca.specifyCheckDate')}
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
                                        <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a202c' }}>{t('pdca.checkPhaseMeeting')}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {checkMeetingExpanded && (
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        toggleExternalUsers('check');
                                                    }}
                                                    style={{
                                                        border: 'none',
                                                        borderRadius: 0,
                                                        padding: 0,
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: '#5FAE9E',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0
                                                    }}
                                                >
                                                    {checkMeeting.externalEnabled ? t('pdca.hideExternal') : t('pdca.externalUsers')}
                                                </button>
                                            )}
                                            <ChevronDown
                                                size={20}
                                                color="#64748b"
                                                style={{
                                                    transition: 'transform 0.25s ease',
                                                    transform: checkMeetingExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {checkMeetingExpanded && (
                                        <>
                                            <div style={{ borderTop: '1px solid #e8ecf0', marginBottom: '1.5rem' }} />

                                            {/* A) Meeting Title Input */}
                                            <input
                                                type="text"
                                                value={checkMeeting.title}
                                                onChange={e => setCheckMeeting({ ...checkMeeting, title: e.target.value })}
                                                placeholder={t('pdca.meetingTitlePlaceholder')}
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

                                            {/* B) Responsible Persons — Avatar-chip summary + {t('pdca.changeLabel')} picker (CHECK only) */}
                                            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.responsiblePersons')}</div>

                                                {/* ── Collapsed summary row: avatars + {t('pdca.changeLabel')} button ── */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {/* Overlapping avatar stack – fixed minWidth keeps {t('pdca.changeLabel')} button pinned */}
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

                                                    {/* {t('pdca.changeLabel')} (edit) button */}
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
                                                    >- {t('pdca.changeLabel')}</button>
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
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.meetingType')}</div>
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
                                                        <option value="In-Office (On-site)">{t('pdca.inOffice')}</option>
                                                        <option value="Remote (Online)">{t('pdca.online')}</option>
                                                    </select>
                                                    <ChevronDown size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                                                </div>
                                            </div>

                                            {/* E) Date stacked above Location – labels outside border like Meeting Type */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{t('pdca.meetingDateTime')}</div>
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                        <DateTimePicker
                                                            value={checkMeeting.meetingDateTime}
                                                            onChange={val => setCheckMeeting({ ...checkMeeting, meetingDateTime: val })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{checkMeeting.meetingType === 'Remote (Online)' ? t('pdca.onlineLink') : t('pdca.officeLocation')}</div>
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                                                        <input
                                                            id="check-meeting-location"
                                                            type="text"
                                                            value={checkMeeting.location}
                                                            onChange={e => setCheckMeeting({ ...checkMeeting, location: e.target.value })}
                                                            placeholder={checkMeeting.meetingType === 'Remote (Online)' ? t('pdca.meetingLinkPlaceholder') : t('pdca.locationPlaceholder')}
                                                            style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#64748b', outline: 'none', width: '100%', padding: 0 }}
                                                        />
                                                    </div>
                                                </div>
                                                {checkMeeting.externalEnabled && renderExternalUsersPanel('check', checkMeeting)}

                                                {/* F) Send invites button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSendMeetingInvites('check')}
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
                                                    {t('pdca.sendMeetingInvites')}
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
                                            <label style={{ fontWeight: 600 }}>{t('common.title')}</label>
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
                                            <label style={{ fontWeight: 600 }}>{t('pdca.goal')}</label>
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
                                                <label style={{ fontWeight: 600 }}>{t('pdca.asIs')}</label>
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
                                                <label style={{ fontWeight: 600 }}>{t('pdca.toBe')}</label>
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
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem', alignItems: 'start' }}>
                                                    {[
                                                        [
                                                            { value: 'SAFETY_CRITICAL', label: t('pdca.improvementPurposeSafetyCritical'), bold: true },
                                                            { value: 'SAVE_TIME', label: t('pdca.improvementPurposeSaveTime') },
                                                            { value: 'REDUCE_COSTS', label: t('pdca.improvementPurposeReduceCosts') },
                                                            { value: 'INCREASE_QUALITY', label: t('pdca.improvementPurposeIncreaseQuality') }
                                                        ],
                                                        [
                                                            { value: 'GUEST_SATISFACTION', label: t('pdca.improvementPurposeGuestSatisfaction') },
                                                            { value: 'MITARBERITERZUFRIEDENHEIT', label: t('pdca.improvementPurposeMitarberiterzufriedenheit') }
                                                        ]
                                                    ].map((column, columnIndex) => (
                                                        <div key={`edit-purpose-col-${columnIndex}`}>
                                                            {column.map(option => (
                                                                <label
                                                                    key={option.value}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        padding: '0.35rem 0',
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
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* LOCATION & DEPARTMENT (moved from sidebar) */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            {/* Header — outside bordered container */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                <MapPin size={20} color="#5FAE9E" strokeWidth={2} />
                                                <label style={{ fontWeight: 600, margin: 0 }}>{t('pdca.locationDepartment')}</label>
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
                                                        {language === 'de' ? 'Standort' : 'Locations'}
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
                                                        {language === 'de' ? 'Betriebe' : 'Departments'}
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
                                                                    }}>{getTranslatedDepartmentName(dept)}</span>
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
                                                        {t('pdca.selectedLocations')}
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
                                                        {t('pdca.selectedDepartments')}
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
                                                                    {getTranslatedDepartmentName(dept)}
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
                                                <option value="Monitoring" style={{ color: '#16a34a', fontWeight: 600 }}>{t('status.monitoring')}</option>
                                                <option value="Warning" style={{ color: '#ca8a04', fontWeight: 600 }}>{t('status.warning')}</option>
                                                <option value="Critical" style={{ color: '#dc2626', fontWeight: 600 }}>{t('status.critical')}</option>
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
                                                            externalEnabled: false,
                                                            externalUsers: []
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

                                                                {/* Avatar chips row + {t('pdca.changeLabel')} button */}
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

                                                                    {/* {t('pdca.changeLabel')} (edit) button */}
                                                                    <button
                                                                        onClick={() => setDoActionPickerOpenIdx(doActionPickerOpenIdx === idx ? null : idx)}
                                                                        style={{
                                                                            background: 'transparent',
                                                                            border: 'none',
                                                                            borderRadius: 0,
                                                                            padding: 0,
                                                                            fontSize: '13px',
                                                                            color: '#5FAE9E',
                                                                            cursor: 'pointer',
                                                                            fontWeight: 600,
                                                                            letterSpacing: '0.01em'
                                                                        }}
                                                                    >
                                                                        - {doActionPickerOpenIdx === idx ? t('common.close') : t('pdca.changeLabel')}
                                                                    </button>
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

                                                        <div style={{ marginTop: '1rem' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleDoExternalUsers(idx)}
                                                                style={{
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    padding: 0,
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    color: '#5FAE9E',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {action.externalEnabled ? t('pdca.hideExternal') : t('pdca.externalUsers')}
                                                            </button>

                                                            {action.externalEnabled && (
                                                                <div style={{ marginTop: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', background: '#fff' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1a202c', fontWeight: 700, fontSize: '13px' }}>
                                                                            <Mail size={14} color="#64748b" />
                                                                            <span>{t('pdca.inviteExternalUsers')}</span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => addDoExternalUserRow(idx)}
                                                                            style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '12px', fontWeight: 500, color: '#64748b', cursor: 'pointer' }}
                                                                        >
                                                                            + {t('pdca.addPerson')}
                                                                        </button>
                                                                    </div>

                                                                    {(action.externalUsers || []).map((externalUser: ExternalMeetingUser, extIdx: number) => (
                                                                        <div key={externalUser.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem', marginBottom: '0.55rem' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                                                                                <div style={{ width: '24px', height: '24px', borderRadius: '999px', background: '#5FAE9E', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    {extIdx + 1}
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeDoExternalUserRow(idx, externalUser.id)}
                                                                                    style={{ width: '26px', height: '26px', borderRadius: '7px', border: '1px solid #fecaca', background: '#fff1f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                >
                                                                                    <X size={13} />
                                                                                </button>
                                                                            </div>

                                                                            <div style={{ marginBottom: '0.45rem' }}>
                                                                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>{t('pdca.fullName')}</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={externalUser.fullName}
                                                                                    onChange={e => updateDoExternalUserField(idx, externalUser.id, 'fullName', e.target.value)}
                                                                                    placeholder="Jane Smith"
                                                                                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                                                                />
                                                                            </div>

                                                                            <div style={{ marginBottom: '0.45rem' }}>
                                                                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>{t('pdca.emailAddress')}</label>
                                                                                <input
                                                                                    type="email"
                                                                                    value={externalUser.email}
                                                                                    onChange={e => updateDoExternalUserField(idx, externalUser.id, 'email', e.target.value)}
                                                                                    placeholder={language === 'de' ? 'email@beispiel.de' : 'email@example.com'}
                                                                                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>{t('pdca.note')}</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={externalUser.note || ''}
                                                                                    onChange={e => updateDoExternalUserField(idx, externalUser.id, 'note', e.target.value)}
                                                                                    placeholder={language === 'de' ? 'Notiz...' : 'Note...'}
                                                                                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => showDoExternalUsersConfirmed(idx)}
                                                                        style={{
                                                                            width: '100%',
                                                                            marginTop: '0.25rem',
                                                                            padding: '0.55rem 0.7rem',
                                                                            border: 'none',
                                                                            borderRadius: '8px',
                                                                            background: 'linear-gradient(90deg, #3AAFA9 0%, #2B9E97 100%)',
                                                                            color: '#fff',
                                                                            fontSize: '12px',
                                                                            fontWeight: 700,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        {t('pdca.confirmExternalUsers', { count: (action.externalUsers || []).length })}
                                                                    </button>
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
                                                1. {t('pdca.effectivenessAssessment')}
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
                                                <label style={{ fontWeight: 700, fontSize: '1.1rem' }}>2. {t('pdca.kpiEvaluation')}</label>
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
                                                3. {t('pdca.effectivenessReview')}
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
                                                <label style={{ fontWeight: 700, fontSize: '1.1rem' }}>1. {t('pdca.actOutcomeDecision')}</label>
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
                                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}>2. {t('pdca.standardizationScope')}</label>
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
                                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>4. {t('pdca.standardizationDesc')}</label>
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
                                                {t('pdca.actConfirmation')}
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
                                                                      onChange={e => {
                                                                          const checked = e.target.checked;
                                                                          const updatedActConfirmation = { ...formState.actConfirmation, readyToClose: checked };
                                                                          setFormState({ ...formState, actConfirmation: updatedActConfirmation });
                                                                        }}
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
                                    {language === 'de' ? 'PDCA-Prozess als PDF exportieren?' : 'Export PDCA Process to PDF?'}
                                </h2>

                                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                                    {pdfModalContext === 'standardize'
                                        ? (language === 'de'
                                            ? 'Die Verbesserung wurde erfolgreich standardisiert und dokumentiert. Möchten Sie ein vollständiges PDF-Dokument mit allen Prozessdetails erstellen?'
                                            : 'The improvement has been successfully standardized and documented. Would you like to generate a complete PDF document with all process details?')
                                        : pdfModalContext === 'rerun'
                                            ? 'The topic has been marked for Improve & Re-run. Would you like to generate a complete PDF document with all process details before sending it to Templates & Standards?'
                                            : 'The topic is ready to be closed without standardization. Would you like to generate a complete PDF document with all process details?'}
                                </p>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <button
                                        onClick={handlePdfModalDismiss}
                                        style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        {language === 'de' ? 'Jetzt nicht' : 'Not Now'}
                                    </button>
                                      <button
                                          onClick={() => {
                                              const topicForPdf = buildTopicForPdf();
                                              if (!topicForPdf) return;
                                              generatePlanDoCheckCombinedPdf(topicForPdf);
                                              syncTopicToTemplatesStandards(topicForPdf, resolveTopicOwnerName(topicForPdf));
                                              setShowPdfModal(false);
                                              handleBackToCockpit();
                                          }}
                                        style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        {language === 'de' ? 'Ja, PDF erstellen' : 'Yes, Generate PDF'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }

    if (mode === 'all-actions') {
        return (
            <div style={{ maxWidth: '1680px', margin: '0 auto', paddingTop: '0.5rem' }}>
                <button
                    type="button"
                    onClick={() => setSearchParams({})}
                    style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: '1rem', color: '#7b8ca5', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                    <ArrowLeft size={14} /> {backToCockpitLabel}
                </button>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', lineHeight: 1.1, color: '#0f172a' }}>All Actions</h1>
                    <div style={{ marginTop: '0.4rem', fontSize: '13px', color: '#7b8ca5' }}>
                        All assigned actions and their current completion status
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid #dbe1ea', boxShadow: '0 1px 2px rgba(15,23,42,.05)' }}>
                    <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#fff' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                value={allActionsSearch}
                                onChange={e => setAllActionsSearch(e.target.value)}
                                placeholder="Search actions..."
                                style={{ paddingLeft: '34px', height: '34px' }}
                            />
                        </div>
                        <select
                            value={allActionsStatusFilter}
                            onChange={e => setAllActionsStatusFilter(e.target.value)}
                            style={{ width: '120px', height: '34px', padding: '0 12px', borderRadius: '8px', border: '1px solid #dbe1ea', background: '#fff' }}
                        >
                            <option value="All Status">All Status</option>
                            <option value="Monitoring">Monitoring</option>
                            <option value="Warning">Warning</option>
                            <option value="Critical">Critical</option>
                        </select>
                        <select
                            value={allActionsStepFilter}
                            onChange={e => setAllActionsStepFilter(e.target.value)}
                            style={{ width: '120px', height: '34px', padding: '0 12px', borderRadius: '8px', border: '1px solid #dbe1ea', background: '#fff' }}
                        >
                            <option value="All">All</option>
                            <option value="PLAN">PLAN</option>
                            <option value="DO">DO</option>
                            <option value="CHECK">CHECK</option>
                        </select>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '1100px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('common.status')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('pdca.topicTitle')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('common.title')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('common.dueDate')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('common.teamsMeeting')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'center' }}>{t('common.markComplete')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'center' }}>{t('common.comment')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAllActions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            {t('common.noActionsAssigned')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAllActions.map((a: any) => {
                                        const myAssign = a.assignments.find((p: any) => p.userId === user?.id);
                                        const isCommentOpen = openActionCommentId === a.id;
                                        const hasComment = (a.comments && a.comments.length > 0) || !!a.comment?.trim();

                                        return (
                                            <React.Fragment key={`all-${a.id}`}>
                                                <tr style={{ borderTop: '1px solid #e5edf5' }}>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="status-dot" style={{ backgroundColor: getStatusColor('', a.dueDate), width: 8, height: 8 }}></span>
                                                            <span style={{ fontSize: '12px', color: '#475569' }}>{getStatusMeta('', a.dueDate, undefined, t).label}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '12px', color: '#475569' }}>{getTranslatedTopicTitle(a.topicTitle)}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{a.title}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '12px', color: '#475569' }}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '12px', color: '#475569' }}>{a.teamsMeeting ? new Date(a.teamsMeeting).toLocaleString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: isCommentOpen ? 'none' : undefined }}>
                                                        <input type="checkbox" checked={myAssign.completed} onChange={e => toggleAssignedActionCompletion(a, e.target.checked)} />
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: isCommentOpen ? 'none' : undefined }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => isCommentOpen ? closeActionCommentEditor() : openActionCommentEditor(a)}
                                                            style={{ border: 'none', background: 'transparent', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                            aria-label={t('common.comment')}
                                                        >
                                                            <MessageSquare size={16} color={hasComment ? 'var(--color-status-green)' : '#8AA0BF'} strokeWidth={1.8} />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isCommentOpen && (
                                                    <tr>
                                                        <td colSpan={7} style={{ padding: '0.75rem 1rem 1rem', background: '#fff' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                                {renderActionComments(a)}
                                                                <textarea
                                                                    value={actionCommentDraft}
                                                                    onChange={e => setActionCommentDraft(e.target.value)}
                                                                    placeholder="Write a comment..."
                                                                    rows={3}
                                                                    style={{ width: '100%', resize: 'vertical', minHeight: '60px' }}
                                                                />
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                                    <button type="button" className="btn btn-outline" onClick={closeActionCommentEditor}>
                                                                        {t('common.cancel')}
                                                                    </button>
                                                                    <button type="button" className="btn btn-primary" onClick={() => saveActionComment(a)}>
                                                                        {t('common.save')}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'all-topics') {
        return (
            <div style={{ maxWidth: '1680px', margin: '0 auto', paddingTop: '0.5rem' }}>
                <button
                    type="button"
                    onClick={() => setSearchParams({})}
                    style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: '1rem', color: '#7b8ca5', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                    <ArrowLeft size={14} /> {backToCockpitLabel}
                </button>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', lineHeight: 1.1, color: '#0f172a' }}>{allTopicsTitle}</h1>
                    <div style={{ marginTop: '0.4rem', fontSize: '13px', color: '#7b8ca5' }}>
                        {allTopicsSubtitle}
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid #dbe1ea', boxShadow: '0 1px 2px rgba(15,23,42,.05)' }}>
                    <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#fff' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                value={allTopicsSearch}
                                onChange={e => setAllTopicsSearch(e.target.value)}
                                placeholder="Search topics..."
                                style={{ paddingLeft: '34px', height: '34px' }}
                            />
                        </div>
                        <select
                            value={allTopicsStatusFilter}
                            onChange={e => setAllTopicsStatusFilter(e.target.value)}
                            style={{ width: '120px', height: '34px', padding: '0 12px', borderRadius: '8px', border: '1px solid #dbe1ea', background: '#fff' }}
                        >
                            <option value="All Status">All Status</option>
                            <option value="Monitoring">Monitoring</option>
                            <option value="Warning">Warning</option>
                            <option value="Critical">Critical</option>
                        </select>
                        <select
                            value={allTopicsStepFilter}
                            onChange={e => setAllTopicsStepFilter(e.target.value)}
                            style={{ width: '120px', height: '34px', padding: '0 12px', borderRadius: '8px', border: '1px solid #dbe1ea', background: '#fff' }}
                        >
                            <option value="All">All</option>
                            <option value="PLAN">PLAN</option>
                            <option value="DO">DO</option>
                            <option value="CHECK">CHECK</option>
                        </select>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '1000px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('common.status')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('pdca.pdcaTopic')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('common.step')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('common.dueDate')}</th>
                                    <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.85rem 1rem', textAlign: 'left' }}>{t('common.responsible')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAllTopics.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            {t('common.noTopicsFound')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAllTopics.map((topic: Topic) => (
                                        <tr key={`all-topic-${topic.id}`} style={{ cursor: 'pointer', borderTop: '1px solid #e5edf5' }} onClick={() => openTopicDetail(topic)}>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className={`status-dot ${getStatusClass(getVisibleTopicStatus(topic), topic.dueDate)}`}></span>
                                                    <span style={{ fontSize: '12px', color: '#475569' }}>{getStatusMeta(getVisibleTopicStatus(topic), topic.dueDate, undefined, t).label}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 400, color: '#0f172a', fontSize: '12px' }}>{getTranslatedTopicTitle(topic.title)}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{t('common.kpi')}: {getTranslatedKPI(topic.kpi)}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '12px' }}>
                                                {t(`pdca.${getTopicDisplayStep(topic).toLowerCase()}`)}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '12px', color: '#475569' }}>{topic.dueDate ? new Date(topic.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{topic.ownerName || 'Elena Rossi'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1680px', margin: '0 auto', paddingTop: '0.5rem' }}>
            {renderFeedbackPopup()}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '24px', lineHeight: 1.1, color: '#0f172a' }}>Cockpit</h1>
                <div style={{ marginTop: '0.4rem', fontSize: '13px', color: '#64748b' }}>
                    {language === 'de' ? 'Ihre pers\u00f6nliche \u00dcbersicht' : 'Your personal overview - actions, themes, and responsibilities'}
                </div>
            </div>
            {/* My Actions Section (New Worker View) */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem', borderRadius: '16px', border: '1px solid #dbe1ea', boxShadow: '0 1px 2px rgba(15,23,42,.05)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{t('pdca.myActions')}</h3>
                    </div>
                    <button onClick={() => setSearchParams({ mode: 'all-actions' })} style={{ border: 'none', background: 'transparent', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                        {viewAllLabel} <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('common.status')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('common.title')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('common.dueDate')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('common.teamsMeeting')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'center', borderBottom: 'none' }}>{t('common.markComplete')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'center' }}>{t('common.comment')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleMyActions.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>{t('common.noActionsAssigned')}</td></tr>
                            ) : (
                                visibleMyActions.map((a: any) => {
                                    const myAssign = a.assignments.find((p: any) => p.userId === user?.id);
                                    const isCommentOpen = openActionCommentId === a.id;
                                    const hasComment = (a.comments && a.comments.length > 0) || !!a.comment?.trim();
                                    return (
                                        <React.Fragment key={a.id}>
                                            <tr style={{ borderTop: '1px solid #eef2f7' }}>
                                                <td style={{ padding: '0.75rem 0.9rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className="status-dot" style={{ backgroundColor: getStatusColor('', a.dueDate), width: 10, height: 10 }}></span>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{getStatusMeta('', a.dueDate, undefined, t).label}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 600, color: '#0f172a', fontSize: '12px' }}>{a.title}</td>
                                                <td style={{ padding: '0.75rem 0.9rem', fontSize: '12px', color: '#475569' }}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</td>
                                                <td style={{ padding: '0.75rem 0.9rem', fontSize: '12px', fontWeight: 500, color: '#475569' }}>
                                                    {a.teamsMeeting ? new Date(a.teamsMeeting).toLocaleString(language === 'en' ? 'en-US' : 'de-DE') : '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.9rem', textAlign: 'center', borderBottom: isCommentOpen ? 'none' : 'none' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={myAssign.completed}
                                                            onChange={(e) => toggleAssignedActionCompletion(a, e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.9rem', textAlign: 'center', borderBottom: isCommentOpen ? 'none' : undefined }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => isCommentOpen ? closeActionCommentEditor() : openActionCommentEditor(a)}
                                                            style={{ border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                            aria-label={t('common.comment')}
                                                        >
                                                            <MessageSquare size={16} color={hasComment ? 'var(--color-status-green)' : '#8AA0BF'} strokeWidth={1.8} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isCommentOpen && (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: '0.75rem 1rem 1rem', background: '#fff', borderBottom: '1px solid var(--color-bg)' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                            {renderActionComments(a)}
                                                            <textarea
                                                                value={actionCommentDraft}
                                                                onChange={e => setActionCommentDraft(e.target.value)}
                                                                placeholder="Write a comment..."
                                                                rows={3}
                                                                style={{ width: '100%', resize: 'vertical', minHeight: '60px' }}
                                                            />
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                                <button type="button" className="btn btn-outline" onClick={closeActionCommentEditor}>
                                                                    {t('common.cancel')}
                                                                </button>
                                                                <button type="button" className="btn btn-primary" onClick={() => saveActionComment(a)}>
                                                                    {t('common.save')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* My Topics Section */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', marginTop: '2rem', borderRadius: '16px', border: '1px solid #dbe1ea', boxShadow: '0 1px 2px rgba(15,23,42,.05)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{t('pdca.myTopics')}</h3>
                    </div>
                    <button onClick={() => setSearchParams({ mode: 'all-topics' })} style={{ border: 'none', background: 'transparent', color: '#0f766e', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                        {viewAllLabel} <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                    </button>
                </div>

                {/* Quick Filters Bar */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '13px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>{t('filters.status')}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['Monitoring', 'Critical', 'Warning', 'Done'].filter(s => s !== 'Done').map(s => {
                                const statusKey = s.toLowerCase();
                                return (
                                    <button
                                        key={s}
                                        onClick={() => toggleStatus(s)}
                                        style={{
                                            padding: '5px 12px',
                                            borderRadius: '999px',
                                            border: '1px solid',
                                            borderColor: statusFilter.includes(s) ? '#0891b2' : '#d1d5db',
                                            background: statusFilter.includes(s) ? '#ecfeff' : '#fff',
                                            color: statusFilter.includes(s) ? '#0f766e' : '#475569',
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>{t('filters.step')}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {myTopicsStepOptions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => toggleStep(s)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: '999px',
                                        border: '1px solid',
                                        borderColor: stepFilter.includes(s) ? '#0891b2' : '#d1d5db',
                                        background: stepFilter.includes(s) ? '#ecfeff' : '#fff',
                                        color: stepFilter.includes(s) ? '#0f766e' : '#475569',
                                        fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                    {getMyTopicsFilterStepLabel(s)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(statusFilter.length > 0 || stepFilter.length > 0) && (
                        <button
                            onClick={() => { setStatusFilter([]); setStepFilter([]); }}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#0f766e', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                            <X size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {t('common.clearFilters')}
                        </button>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1200px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('common.status')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('pdca.pdcaTopic')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('common.step')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('common.dueDate')}</th>
                                <th style={{ fontSize: '12px', color: '#94a3b8', padding: '0.75rem 0.9rem', textAlign: 'left' }}>{t('common.responsible')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleMyTopics.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>{t('common.noTopicsFound')}</td></tr>
                            ) : (
                                visibleMyTopics.map((topic: Topic) => (
                                    <tr
                                        key={topic.id}
                                        style={{
                                            cursor: 'pointer',
                                            borderTop: '1px solid #eef2f7'
                                        }}
                                        onClick={() => openTopicDetail(topic)}
                                    >
                                        <td style={{ padding: '0.75rem 0.9rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`status-dot ${getStatusClass(getVisibleTopicStatus(topic), topic.dueDate)}`}></span>
                                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{getStatusMeta(getVisibleTopicStatus(topic), topic.dueDate, undefined, t).label}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 0.9rem' }}>
                                            <div style={{ fontWeight: 400, color: '#0f172a', fontSize: '12px' }}>{getTranslatedTopicTitle(topic.title)}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem 0.9rem', fontSize: '12px' }}>
                                            {getMyTopicsRowStepLabel(getTopicDisplayStep(topic))}
                                        </td>
                                        <td style={{ padding: '0.75rem 0.9rem', fontSize: '12px' }}>
                                            {topic.dueDate ? new Date(topic.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE') : '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem 0.9rem', fontSize: '12px', fontWeight: 600 }}>{topic.ownerName || 'Elena Rossi'}</td>
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





