import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { topicsService } from '../services';
import { Topic, Step } from '../types';
import { adminService } from '../services/adminService';
import { ChevronRight, ArrowLeft, CheckCircle2, Clock, AlertTriangle, FileText, Activity, BarChart3, MapPin, Shield, MessageSquare, Lock, CalendarDays, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TopicWorkspace: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t, language } = useLanguage();
    const [topic, setTopic] = useState<Topic | null>(null);
    const [activeTab, setActiveTab] = useState<Step>('PLAN');

    useEffect(() => {
        if (id) {
            const t = topicsService.getById(id);
            if (t) {
                setTopic(t);
                const tabParam = (searchParams.get('tab') || '').toUpperCase();
                const requestedTab = (tabParam === 'PLAN' || tabParam === 'DO' || tabParam === 'CHECK')
                    ? (tabParam as Step)
                    : (t.step === 'ACT' ? 'CHECK' : t.step);

                const canOpenRequested =
                    (t.step === 'PLAN' && requestedTab === 'PLAN') ||
                    (t.step === 'DO' && (requestedTab === 'PLAN' || requestedTab === 'DO')) ||
                    (t.step === 'CHECK' && requestedTab !== 'ACT') ||
                    (t.step === 'ACT' && requestedTab !== 'ACT');

                if (canOpenRequested) {
                    setActiveTab(requestedTab);
                } else {
                    setActiveTab(t.step === 'ACT' ? 'CHECK' : t.step === 'DO' ? 'DO' : t.step === 'CHECK' ? 'CHECK' : 'PLAN');
                }
            }
        }
    }, [id, searchParams]);

    if (!topic) return <div style={{ padding: '2rem' }}>{t('common.noTopicsFound')}</div>;

    const activationLabel =
        activeTab === 'CHECK'
            ? (language === 'de' ? 'Act-Phase Aktivierung' : 'Act Phase Activation')
            : activeTab === 'DO'
                ? (language === 'de' ? 'Check-Phase Aktivierung' : 'Check Phase Activation')
                : (language === 'de' ? 'Durchführen-Phase Aktivierung' : 'DO Phase Activation');

    const currentPhaseLabel = `${topic.step} ${language === 'de' ? 'Phase' : 'Phase'}`;
    const workspaceAccent = '#46c0bc';

    const canOpenTab = (target: Step): boolean => {
        if (!topic) return false;
        const current = topic.step;

        // PLAN topics: only PLAN is accessible until moved in Cockpit.
        if (current === 'PLAN') return target === 'PLAN';
        // DO topics: PLAN and DO are accessible.
        if (current === 'DO') return target === 'PLAN' || target === 'DO';
        // CHECK topics: PLAN, DO, CHECK are accessible; ACT is locked.
        if (current === 'CHECK') return target !== 'ACT';
        // ACT topics: ACT view is hidden here, so fall back to PLAN/DO/CHECK only.
        return target !== 'ACT';
    };

    const TabButton = ({ step, label, icon: Icon }: { step: Step, label: string, icon: any }) => (
        <button
            onClick={() => {
                if (!canOpenTab(step)) return;
                setActiveTab(step);
            }}
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1.1rem 1rem',
                border: 'none',
                borderRight: '1px solid var(--color-border)',
                background: activeTab === step ? '#eef9f6' : 'transparent',
                color: !canOpenTab(step)
                    ? '#c0cad7'
                    : (activeTab === step ? workspaceAccent : 'var(--color-text-muted)'),
                borderBottom: activeTab === step ? `3px solid ${workspaceAccent}` : '3px solid transparent',
                fontWeight: 600,
                cursor: canOpenTab(step) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: canOpenTab(step) ? 1 : 0.55
            }}
            disabled={!canOpenTab(step)}
        >
            {canOpenTab(step) ? <Icon size={18} /> : <Lock size={16} />}
            {label}
        </button>
    );

    const getTranslatedText = (text: string) => {
        const textMap: Record<string, string> = {
            'Reduction of Post-operative Infection Rates': 'Reduktion postoperativer Infektionsraten',
            'Medication Administration Error Reduction': 'Reduktion von Medikationsfehlern',
            'Patient Fall Prevention Protocol Compliance': 'Einhaltung des Sturzpräventionsprotokolls',
            'New Clinical PDCA: Fall Prevention': 'Neues klinisches KVP: Sturzprävention',
            'Audit Finding': 'Audit-Feststellung',

            // Descriptions
            'Current infection rate in Surgery Ward B is at 2.1%.': 'Die aktuelle Infektionsrate auf der Chirurgie-Station B beträgt 2,1%.',
            'Three near-miss incidents reported in the last quarter regarding insulin dosages.': 'Im letzten Quartal wurden drei Beinahe-Zwischenfälle bei der Insulindosierung gemeldet.',
            'Inconsistent training for new surgical staff and manual documentation gaps.': 'Inkonsistentes Training für neues OP-Personal und manuelle Dokumentationslücken.',
            'Lack of automated verification system and look-alike packaging': 'Fehlendes automatisches Verifizierungssystem und ähnliche Verpackungen',
            'Patient fall rate increased by 5% in Q3': 'Patientensturzrate im 3. Quartal um 5% gestiegen',
            'Staff shortage and slipper floors': 'Personalmangel und rutschige Böden',
            'The audit revealed that 30% of admissions lacked fall risk assessment.': 'Das Audit ergab, dass bei 30 % der Aufnahmen die Sturzrisikobewertung fehlte.',
            'Admission process does not mandate assessment before bed assignment.': 'Der Aufnahmeprozess schreibt die Bewertung vor der Bettenzuweisung nicht zwingend vor.',

            // Objectives
            'Reduce infection rate to <1% by Q4': 'Senkung der Infektionsrate auf <1% bis Q4',
            'Zero medication errors for Q1 2025': 'Null Medikationsfehler im 1. Quartal 2025',
            'Implement digital sterile checklist': 'Implementierung der digitalen Steril-Checkliste',
            'Conduct mandatory hygiene retraining': 'Durchführung obligatorischer Hygiene-Schulungen',
            'Implement barcode scanning': 'Barcode-Scanning implementieren',
            'Review packaging with pharmacy': 'Verpackungen mit der Apotheke überprüfen',
            'Install non-slip mats': 'Rutschfeste Matten installieren',
            'Hire 2 additional nurses': '2 zusätzliche Pflegekräfte einstellen',
            'Update EHR admission template': 'EHR-Aufnahmevorlage aktualisieren',
            'Train nursing staff on Morse Fall Scale': 'Schulung des Pflegepersonals zur Morse-Sturz-Skala',
            'Improve surgical outcome and patient safety through sterile protocol optimization.': 'Verbesserung der chirurgischen Ergebnisse und der Patientensicherheit durch Optimierung steriler Protokolle.',
            'Standardize double-check process for high-risk medication administration.': 'Standardisierung des Doppel-Check-Prozesses für die Abgabe von Hochrisiko-Medikamenten.',
            'Ensure every patient receives a validated fall risk assessment within 2 hours of admission.': 'Sicherstellung, dass jeder Patient innerhalb von 2 Stunden nach der Aufnahme eine validierte Sturzrisikobewertung erhält.',

            // Actions
            'Validation audit': 'Validierungsaudit',
            'Define new protocol': 'Neues Protokoll definieren',
            'Purchase scanners': 'Scanner kaufen',
            'Train staff': 'Personal schulen',

            // KPIs
            'Infection rate < 0.5%': 'Infektionsrate < 0,5 %',
            'Zero high-risk medication errors': 'Null Hochrisiko-Medikationsfehler',
            '100% compliance with fall risk assessment': '100% Einhaltung der Sturzrisikobewertung'
        };
        return textMap[text] || text;
    };

    const getTranslatedCategory = (cat: string) => {
        const map: Record<string, string> = {
            'Clinical': 'Klinisch',
            'Quality': 'Qualität',
            'Safety': 'Sicherheit',
            'Process': 'Prozess',
            'Administrative': 'Administrativ',
            'Audit Finding': 'Audit-Feststellung'
        };
        return map[cat] || cat;
    };

    const isAudit = topic.type === 'Audit Finding' || topic.type === 'Audit-Feststellung';
    const planPurposes = (topic.plan.improvementPurpose && topic.plan.improvementPurpose.length > 0)
        ? topic.plan.improvementPurpose
        : (topic.plan.objectives || []);
    const allLocations = adminService.getLocations();
    const allDepartments = adminService.getDepartments();
    const resolvedLocation = topic.locationId
        ? allLocations.find(loc => loc.id === topic.locationId)
        : undefined;
    const resolvedDepartment = topic.departmentId
        ? allDepartments.find(dep => dep.id === topic.departmentId)
        : undefined;
    const fallbackDepartment = topic.locationId
        ? allDepartments.find(dep => dep.locationId === topic.locationId)
        : undefined;

    const planLocation = resolvedLocation?.name || topic.location || topic.locationId || '';
    const planDepartment =
        resolvedDepartment?.name ||
        topic.departmentId ||
        fallbackDepartment?.name ||
        '';

    const renderActionCards = (title?: string) => (
        <div style={{ marginTop: title ? '2rem' : 0 }}>
            {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
            {topic.do.actions.length > 0 ? topic.do.actions.map(action => {
                const actionComments = action.comments && action.comments.length > 0
                    ? action.comments
                    : (action.comment ? [{
                        id: `legacy-${action.id}`,
                        userId: 'legacy',
                        userName: 'System',
                        text: action.comment,
                        createdAt: ''
                    }] : []);

                return (
                    <div key={action.id} style={{ marginBottom: '1rem' }}>
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{getTranslatedText(action.title)}</div>
                            </div>

                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>{t('pdca.implementationDetails')}:</strong>{' '}
                                <span>{action.description === 'Validation audit' ? 'Validierungsaudit' : action.description || '-'}</span>
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>{t('pdca.meetingParticipants')}:</strong>{' '}
                                <span>{action.assignments.map(a => a.userName).join(', ') || '-'}</span>
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>{t('common.dueDate')}:</strong>{' '}
                                <span>{action.dueDate ? new Date(action.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</span>
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>Meeting type:</strong>{' '}
                                <span>{action.meetingType || '-'}</span>
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>Meeting Date & Time:</strong>{' '}
                                <span>{action.teamsMeeting ? new Date(action.teamsMeeting).toLocaleString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</span>
                            </div>
                            {(action.meetingType || '').toLowerCase() === 'online' ? (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong>Online Meeting Link:</strong>{' '}
                                    {action.teamsMeetingLink ? (
                                        <a href={action.teamsMeetingLink} target="_blank" rel="noreferrer">
                                            {action.teamsMeetingLink}
                                        </a>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                            ) : (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong>{t('common.location')}:</strong>{' '}
                                    <span>{action.meetingLocation || '-'}</span>
                                </div>
                            )}
                            <div style={{ marginBottom: 0 }}>
                                <strong>{t('pdca.externalUsers')}:</strong>{' '}
                                {(action.externalUsers && action.externalUsers.length > 0) ? (
                                    <span>
                                        {action.externalUsers.map((user, idx) => (
                                            <span key={user.id}>
                                                {idx > 0 ? '; ' : ''}
                                                {user.fullName} ({user.email}){user.note ? ` - ${user.note}` : ''}
                                            </span>
                                        ))}
                                    </span>
                                ) : '-'}
                            </div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <strong style={{ display: 'block', marginBottom: '0.45rem' }}>{t('common.markComplete')}</strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                    {action.assignments.map(assignment => (
                                        <div key={`${action.id}-${assignment.userId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: assignment.completed ? '#16a34a' : '#64748b', fontSize: '13px', fontWeight: 600 }}>
                                            <CheckCircle2 size={16} />
                                            <span>{assignment.userName}: {assignment.completed ? t('common.completed') : t('common.markComplete')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <strong style={{ display: 'block', marginBottom: '0.45rem' }}>{t('common.comment')}</strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {actionComments.length > 0 ? actionComments.map(comment => {
                                        const matchingAssignment = action.assignments.find(assignment => assignment.userId === comment.userId);
                                        const assignmentStatus = matchingAssignment ? (matchingAssignment.completed ? t('common.completed') : t('common.markComplete')) : null;

                                        return (
                                            <div key={comment.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#334155', fontSize: '13px', padding: '0.6rem 0.75rem', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                                                <MessageSquare size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
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
                                    }) : (
                                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>-</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>{t('pdca.noActions')}</div>
            )}
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(-1)}
                className="btn"
                style={{ marginBottom: '1rem', border: 'none', padding: 0, background: 'transparent', color: '#7b8ca5', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
                <ArrowLeft size={14} /> {t('pdca.backToOverview')}
            </button>

            <div
                className="card"
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '1.9rem 2rem',
                    marginBottom: '1.6rem',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #45c3bc 0%, #37b8ad 100%)',
                    color: 'white'
                }}
            >
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', right: '-30px', top: '-42px', width: '210px', height: '210px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                    <div style={{ position: 'absolute', right: '66px', top: '46px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '13px', opacity: 0.95, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                        <span>{topic.id}</span>
                        <span style={{ opacity: 0.45 }}>|</span>
                        <span style={{ background: 'rgba(255,255,255,0.16)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>{getTranslatedCategory(topic.category)}</span>
                        {isAudit && (
                            <>
                                <span style={{ opacity: 0.45 }}>|</span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    <Shield size={10} /> {topic.rating}
                                </span>
                            </>
                        )}
                    </div>
                    <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.2 }}>{getTranslatedText(topic.title)}</h1>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem', fontSize: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                            <User size={14} />
                            <span style={{ opacity: 0.85 }}>{t('common.owner')}:</span>
                            <span style={{ fontWeight: 700 }}>{topic.ownerName || 'Elena Rossi'}</span>
                        </div>
                        {activeTab !== 'ACT' && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                                <CalendarDays size={14} />
                                <span style={{ opacity: 0.85 }}>{activationLabel}:</span>
                                <span style={{ fontWeight: 700 }}>{new Date(topic.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</span>
                            </div>
                        )}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', borderRadius: '10px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.24)', fontWeight: 700 }}>
                            <Activity size={14} />
                            <span>{language === 'de' ? 'Aktiv:' : 'Active:'} {currentPhaseLabel}</span>
                        </div>
                        {isAudit && topic.location && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={14} />
                                <span style={{ fontWeight: 600 }}>{topic.location}</span>
                            </div>
                        )}
                        {isAudit && topic.auditReference && (
                            <div><span style={{ opacity: 0.85 }}>{t('templatesStandards.columns.source')}:</span> <span style={{ fontWeight: 700 }}>{topic.auditReference}</span></div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 1px 2px rgba(15,23,42,.04)' }}>
                <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid var(--color-border)' }}>
                    <TabButton step="PLAN" label={t('pdca.plan')} icon={FileText} />
                    <TabButton step="DO" label={t('pdca.do')} icon={Activity} />
                    <TabButton step="CHECK" label={t('pdca.check')} icon={BarChart3} />
                </div>

                <div style={{ padding: '2rem' }}>
                    {activeTab === 'PLAN' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>{t('pdca.rootCauseAnalysis')} & {t('pdca.plan')}</h3>
                            <div style={{ marginBottom: '2rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '0.45rem' }}><strong>{t('common.location')}:</strong> {planLocation || '-'}</div>
                                <div><strong>{t('admin.department')}:</strong> {planDepartment || '-'}</div>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>{t('pdca.objective')}</label>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                    {getTranslatedText(topic.plan.goal || topic.objective || '') || t('pdca.noToBe')}
                                </p>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>IST-Zustand</label>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{getTranslatedText(topic.plan.asIs || '') || t('pdca.noToBe')}</p>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>SOLL-Zustand</label>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{getTranslatedText(topic.plan.toBe || '') || t('pdca.noToBe')}</p>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>{t('pdca.rootCauseAnalysis')}</label>
                                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '6px', borderLeft: `4px solid ${workspaceAccent}` }}>
                                    {getTranslatedText(topic.plan.rootCause) || t('pdca.rootCausePlaceholder')}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>{t('pdca.improvementPurpose')}</label>
                                <ul style={{ paddingLeft: '1.25rem' }}>
                                    {planPurposes.length > 0 ? planPurposes.map((obj, i) => (
                                        <li key={i} style={{ marginBottom: '0.5rem', color: '#4a5568' }}>{getTranslatedText(obj)}</li>
                                    )) : <li>{t('pdca.noActions')}</li>}
                                </ul>
                            </div>
                            {topic.plan.meeting && (
                                <div style={{ marginTop: '2rem' }}>
                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Meeting</label>
                                    <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '6px' }}>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>{t('common.title')}:</strong> {topic.plan.meeting.title || '-'}</div>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>Meeting type:</strong> {topic.plan.meeting.meetingType || '-'}</div>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>Meeting Date & Time:</strong> {topic.plan.meeting.meetingDateTime ? new Date(topic.plan.meeting.meetingDateTime).toLocaleString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</div>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>{t('common.location')}:</strong> {topic.plan.meeting.location || '-'}</div>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>{t('pdca.meetingParticipants')}:</strong> {(topic.plan.meeting.responsiblePersons || []).join(', ') || '-'}</div>
                                        <div>
                                            <strong>{t('pdca.externalUsers')}:</strong>{' '}
                                            {(topic.plan.meeting.externalUsers && topic.plan.meeting.externalUsers.length > 0) ? (
                                                <span>
                                                    {topic.plan.meeting.externalUsers.map((user, idx) => (
                                                        <span key={user.id}>
                                                            {idx > 0 ? '; ' : ''}
                                                            {user.fullName} ({user.email}){user.note ? ` - ${user.note}` : ''}
                                                        </span>
                                                    ))}
                                                </span>
                                            ) : '-'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {renderActionCards(t('pdca.executionActions'))}
                        </div>
                    )}

                    {activeTab === 'DO' && (
                        <div>
                            {renderActionCards(t('pdca.executionActions'))}
                        </div>
                    )}

                    {activeTab === 'CHECK' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>{t('pdca.kpiEvaluation')}</h3>
                            <div style={{ marginBottom: '1rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '0.45rem' }}><strong>{t('common.location')}:</strong> {planLocation || '-'}</div>
                                <div><strong>{t('admin.department')}:</strong> {planDepartment || '-'}</div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Effectiveness Assessment:</strong> {topic.check.effectivenessStatus || '-'}
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>{t('pdca.effectivenessReview')}:</strong>{' '}
                                <span>{getTranslatedText(topic.check.effectivenessReview || topic.check.effectivenessReviewText || '') || '-'}</span>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>{t('pdca.kpiEvaluation')}:</strong>
                                {topic.check.kpiEvaluations && topic.check.kpiEvaluations.length > 0 ? (
                                    <div style={{ marginTop: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--color-bg)' }}>
                                                    <th style={{ textAlign: 'left', padding: '10px' }}>KPI</th>
                                                    <th style={{ textAlign: 'left', padding: '10px' }}>Target</th>
                                                    <th style={{ textAlign: 'left', padding: '10px' }}>Actual</th>
                                                    <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topic.check.kpiEvaluations.map(item => (
                                                    <tr key={item.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                        <td style={{ padding: '10px' }}>{item.name}</td>
                                                        <td style={{ padding: '10px' }}>{item.targetValue}</td>
                                                        <td style={{ padding: '10px' }}>{item.actualResult}</td>
                                                        <td style={{ padding: '10px' }}>{item.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '0.5rem', color: '#64748b' }}>-</div>
                                )}
                            </div>

                            {topic.check.meeting && (
                                <div style={{ marginTop: '2rem' }}>
                                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Meeting</label>
                                    <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '6px' }}>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>{t('common.title')}:</strong> {topic.check.meeting.title || '-'}</div>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>Meeting type:</strong> {topic.check.meeting.meetingType || '-'}</div>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>Meeting Date & Time:</strong> {topic.check.meeting.meetingDateTime ? new Date(topic.check.meeting.meetingDateTime).toLocaleString(language === 'en' ? 'en-US' : 'de-DE') : '-'}</div>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>{t('common.location')}:</strong> {topic.check.meeting.location || '-'}</div>
                                        <div style={{ marginBottom: '0.5rem' }}><strong>{t('pdca.meetingParticipants')}:</strong> {(topic.check.meeting.responsiblePersons || []).join(', ') || '-'}</div>
                                        <div>
                                            <strong>{t('pdca.externalUsers')}:</strong>{' '}
                                            {(topic.check.meeting.externalUsers && topic.check.meeting.externalUsers.length > 0) ? (
                                                <span>
                                                    {topic.check.meeting.externalUsers.map((user, idx) => (
                                                        <span key={user.id}>
                                                            {idx > 0 ? '; ' : ''}
                                                            {user.fullName} ({user.email}){user.note ? ` - ${user.note}` : ''}
                                                        </span>
                                                    ))}
                                                </span>
                                            ) : '-'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {renderActionCards(t('pdca.completedActions'))}

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default TopicWorkspace;
