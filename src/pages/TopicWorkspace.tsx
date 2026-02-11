import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { topicsService } from '../services';
import { Topic, Step } from '../types';
import { ChevronRight, ArrowLeft, CheckCircle2, Clock, AlertTriangle, FileText, Activity, BarChart3, Repeat, MapPin, Shield } from 'lucide-react';
import { getStatusMeta, getStatusBadgeStyle } from '../utils/statusUtils';
import { useLanguage } from '../contexts/LanguageContext';

const TopicWorkspace: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
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

    if (!topic) return <div style={{ padding: '2rem' }}>{t('common.noTopicsFound')}</div>;

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

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(-1)}
                className="btn btn-outline"
                style={{ marginBottom: '1.5rem', border: 'none', padding: 0, color: 'var(--color-primary)' }}
            >
                <ArrowLeft size={18} /> {t('pdca.backToOverview')}
            </button>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-dark))', color: 'white' }}>
                <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{topic.id}</span>
                    <span>|</span>
                    <span>{getTranslatedCategory(topic.category)}</span>
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
                <h1 style={{ margin: '0.5rem 0', fontSize: '1.75rem' }}>{getTranslatedText(topic.title)}</h1>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', fontSize: '14px', flexWrap: 'wrap' }}>
                    <div><span style={{ opacity: 0.7 }}>{t('common.owner')}:</span> <span style={{ fontWeight: 600 }}>{topic.ownerName || 'Elena Rossi'}</span></div>
                    <div><span style={{ opacity: 0.7 }}>{t('common.responsible')}:</span> <span style={{ fontWeight: 600 }}>{'Felix Worker'}</span></div>
                    <div><span style={{ opacity: 0.7 }}>{t('common.dueDate')}:</span> <span style={{ fontWeight: 600 }}>{new Date(topic.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</span></div>
                    {isAudit && topic.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} style={{ opacity: 0.7 }} />
                            <span style={{ fontWeight: 600 }}>{topic.location}</span>
                        </div>
                    )}
                    {isAudit && topic.auditReference && (
                        <div><span style={{ opacity: 0.7 }}>{t('templatesStandards.columns.source')}:</span> <span style={{ fontWeight: 600 }}>{topic.auditReference}</span></div>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <TabButton step="PLAN" label={t('pdca.plan')} icon={FileText} />
                    <TabButton step="DO" label={t('pdca.do')} icon={Activity} />
                    <TabButton step="CHECK" label={t('pdca.check')} icon={BarChart3} />
                    <TabButton step="ACT" label={t('pdca.act')} icon={Repeat} />
                </div>

                <div style={{ padding: '2rem' }}>
                    {activeTab === 'PLAN' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>{t('pdca.rootCauseAnalysis')} & {t('pdca.plan')}</h3>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>{t('pdca.purpose')}</label>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{getTranslatedText(topic.plan.description) || t('pdca.noToBe')}</p>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>{t('pdca.rootCauseAnalysis')}</label>
                                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid var(--color-primary)' }}>
                                    {getTranslatedText(topic.plan.rootCause) || t('pdca.rootCausePlaceholder')}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>{t('pdca.objective')}</label>
                                <ul style={{ paddingLeft: '1.25rem' }}>
                                    {topic.plan.objectives && topic.plan.objectives.length > 0 ? topic.plan.objectives.map((obj, i) => (
                                        <li key={i} style={{ marginBottom: '0.5rem', color: '#4a5568' }}>{getTranslatedText(obj)}</li>
                                    )) : <li>{t('pdca.noActions')}</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'DO' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>{t('pdca.executionActions')}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('pdca.actionTitle')}</th>
                                        <th>{t('common.responsible')}</th>
                                        <th>{t('common.dueDate')}</th>
                                        <th>{t('common.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topic.do.actions.length > 0 ? topic.do.actions.map(action => (
                                        <tr key={action.id}>
                                            <td style={{ fontWeight: 600 }}>{getTranslatedText(action.title)} ({t('pdca.implementationDetails')}: {action.description === 'Validation audit' ? 'Validierungsaudit' : action.description})</td>
                                            <td>{action.assignments.map(a => a.userName).join(', ')}</td>
                                            <td>{new Date(action.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    ...getStatusBadgeStyle(action.status, action.dueDate)
                                                }}>
                                                    {getStatusMeta(action.status, action.dueDate, undefined, t).label}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>{t('pdca.noActions')}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'CHECK' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>{t('pdca.kpiEvaluation')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div className="card" style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-primary)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)' }}>{t('common.kpi')}</h4>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{getTranslatedText(topic.kpi)}</div>
                                </div>
                                <div className="card" style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-primary)', opacity: 0.9 }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)' }}>{t('pdca.objective')}</h4>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>{getTranslatedText(topic.objective)}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={{ fontWeight: 700 }}>{t('pdca.effectivenessReview')}</label>
                                <p style={{ color: '#4a5568' }}>{getTranslatedText(topic.check.effectivenessReview) || t('common.loading')}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ACT' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>{t('pdca.standardizationDesc')} & {t('pdca.lessonsLearned')}</h3>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 700 }}>{t('pdca.standardizationScope')}</label>
                                <p style={{ color: '#4a5568' }}>{topic.act.standardizationDescription || topic.act.standardization || t('pdca.noToBe')}</p>
                            </div>
                            <div>
                                <label style={{ fontWeight: 700 }}>{t('pdca.lessonsLearned')}</label>
                                <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid var(--color-status-yellow)' }}>
                                    {topic.act.lessonsLearned || t('pdca.lessonsLearnedPlaceholder')}
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
