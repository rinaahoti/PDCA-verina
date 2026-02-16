import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Edit2, Trash2, Search, Download, RefreshCw, Eye, FileText,
    X, Save, CheckCircle2, AlertCircle, Tag, MapPin, Building2, Calendar
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// --- TYPES --- 

type EffectivenessStatus = 'Effective' | 'Partially Effective' | 'Not Effective';
type DecisionType = 'Standardize' | 'Improve & Re-run' | 'Close';
type TemplateKind = 'template' | 'standard';
type TemplateStatus = 'Draft' | 'Published' | 'Archived';

interface PDCAOutcome {
    ref: string;
    title: string;
    owner: string;
    category: string;
    location: string;
    effectiveness: EffectivenessStatus;
    decision: DecisionType;
    scope: string[];
    areas: string[];
    kpi: {
        name: string;
        target: number;
        actual: number;
        status: 'Achieved' | 'Partial' | 'Not Achieved';
    }[];
    description: string;
    lessons: string;
    whyNot?: string;
    signoff: {
        standardized: boolean;
        noPending: boolean;
        readyClose: boolean;
    };
    standardId?: string;
    createdAt: string;
}

interface Template {
    id: string;
    title: string;
    kind: TemplateKind;
    category: string;
    step: 'PLAN' | 'DO' | 'CHECK' | 'ACT';
    status: TemplateStatus;
    source: string;
}

const STORAGE_KEY_OUTCOMES = 'virena_pdca_outcomes';
const STORAGE_KEY_TEMPLATES = 'virena_templates';

// --- SEED DATA ---

const seedOutcomes = (): PDCAOutcome[] => [
    {
        ref: 'T-001',
        title: 'Reduktion postoperativer Infektionsraten',
        owner: 'Dr. Marcus Weber',
        category: 'Patientensicherheit',
        location: 'Universitätsspital Basel (BS)',
        effectiveness: 'Effective',
        decision: 'Standardize',
        scope: ['Chirurgie', 'Infektionskontrolle'],
        areas: ['Präoperative Protokolle', 'Sterilisationsverfahren'],
        kpi: [
            { name: 'Infektionsraten-Reduktion', target: 50, actual: 65, status: 'Achieved' }
        ],
        description: 'Erweiterte präoperative Protokolle implementiert',
        lessons: 'Frühzeitige Intervention und Schulung des Personals kritisch',
        signoff: { standardized: true, noPending: true, readyClose: true },
        standardId: 'STD-T-001',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        ref: 'T-002',
        title: 'Reduktion von Medikationsfehlern',
        owner: 'Dr. Elena Rossi',
        category: 'Medikamentensicherheit',
        location: 'Inselspital Bern (BE)',
        effectiveness: 'Partially Effective',
        decision: 'Improve & Re-run',
        scope: ['Pflege', 'Apotheke'],
        areas: ['Doppel-Check-Verfahren', 'Elektronische Verifizierung'],
        kpi: [
            { name: 'Fehlerraten-Reduktion', target: 80, actual: 45, status: 'Partial' }
        ],
        description: 'Elektronisches Verifizierungssystem pilotiert',
        lessons: 'Technologieeinführung erfordert mehr Schulung',
        whyNot: 'Ziel nicht erreicht; erfordert zusätzliche Schulungszyklen und Systemverfeinerung vor der Standardisierung',
        signoff: { standardized: false, noPending: false, readyClose: false },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        ref: 'T-003',
        title: 'Einhaltung des Sturzpräventionsprotokolls',
        owner: 'Sarah Johnson (RN)',
        category: 'Patientensicherheit',
        location: 'Universitätsspital Basel (BS)',
        effectiveness: 'Effective',
        decision: 'Standardize',
        scope: ['Pflege', 'Geriatrie'],
        areas: ['Risikobewertung', 'Umgebungssicherheit'],
        kpi: [
            { name: 'Sturzvorfall-Reduktion', target: 40, actual: 52, status: 'Achieved' }
        ],
        description: 'Verbesserte Sturzrisikobewertung und Präventionsmaßnahmen',
        lessons: 'Konsequente Anwendung über alle Schichten hinweg essenziell',
        signoff: { standardized: true, noPending: true, readyClose: true },
        standardId: 'STD-T-003',
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const seedTemplates = (): Template[] => [
    {
        id: 'STD-T-001',
        title: 'Standard: Reduktion postoperativer Infektionsraten',
        kind: 'standard',
        category: 'Patientensicherheit',
        step: 'ACT',
        status: 'Published',
        source: 'PDCA T-001'
    },
    {
        id: 'STD-T-003',
        title: 'Standard: Einhaltung des Sturzpräventionsprotokolls',
        kind: 'standard',
        category: 'Patientensicherheit',
        step: 'ACT',
        status: 'Published',
        source: 'PDCA T-003'
    }
];

// --- SERVICE LAYER ---

const outcomesService = {
    getAll: (): PDCAOutcome[] => {
        const data = localStorage.getItem(STORAGE_KEY_OUTCOMES);
        if (!data) {
            const seed = seedOutcomes();
            localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(data);
    },
    save: (outcome: PDCAOutcome) => {
        const all = outcomesService.getAll();
        const idx = all.findIndex(o => o.ref === outcome.ref);
        if (idx >= 0) all[idx] = outcome;
        else all.push(outcome);
        localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(all));
        window.dispatchEvent(new Event('storage-outcomes'));
    },
    delete: (ref: string) => {
        const all = outcomesService.getAll().filter(o => o.ref !== ref);
        localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(all));
        window.dispatchEvent(new Event('storage-outcomes'));
    },
    reset: () => {
        localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(seedOutcomes()));
        window.dispatchEvent(new Event('storage-outcomes'));
    }
};

const templatesService = {
    getAll: (): Template[] => {
        const data = localStorage.getItem(STORAGE_KEY_TEMPLATES);
        if (!data) {
            const seed = seedTemplates();
            localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(data);
    },
    save: (template: Template) => {
        const all = templatesService.getAll();
        const idx = all.findIndex(t => t.id === template.id);
        if (idx >= 0) all[idx] = template;
        else all.push(template);
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(all));
        window.dispatchEvent(new Event('storage-templates'));
    },
    delete: (id: string) => {
        const all = templatesService.getAll().filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(all));
        window.dispatchEvent(new Event('storage-templates'));
    },
    reset: () => {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(seedTemplates()));
        window.dispatchEvent(new Event('storage-templates'));
    }
};

// --- MAIN COMPONENT ---

const TemplatesStandards: React.FC = () => {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'standardizations' | 'templates'>('standardizations');
    const [outcomes, setOutcomes] = useState<PDCAOutcome[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [locationFilter, setLocationFilter] = useState('All Locations');
    const [decisionFilter, setDecisionFilter] = useState('All Decisions');

    // Modals
    const [isOutcomeModalOpen, setOutcomeModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [editingOutcome, setEditingOutcome] = useState<Partial<PDCAOutcome> | null>(null);
    const [viewingOutcome, setViewingOutcome] = useState<PDCAOutcome | null>(null);

    useEffect(() => {
        const load = () => {
            setOutcomes(outcomesService.getAll());
            setTemplates(templatesService.getAll());
        };
        load();
        window.addEventListener('storage-outcomes', load);
        window.addEventListener('storage-templates', load);
        return () => {
            window.removeEventListener('storage-outcomes', load);
            window.removeEventListener('storage-templates', load);
        };
    }, []);

    // KPI Calculations
    const totalOutcomes = outcomes.length;
    const standardized = outcomes.filter(o => o.decision === 'Standardize').length;
    const notStandardized = outcomes.filter(o => o.decision !== 'Standardize').length;
    const totalStandards = templates.filter(t => t.kind === 'standard').length;

    // Filtered outcomes
    const filteredOutcomes = useMemo(() => {
        return outcomes.filter(o => {
            const matchesSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.ref.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'All Categories' || o.category === categoryFilter;
            const matchesLocation = locationFilter === 'All Locations' || o.location === locationFilter;
            const matchesDecision = decisionFilter === 'All Decisions' || o.decision === decisionFilter;
            return matchesSearch && matchesCategory && matchesLocation && matchesDecision;
        });
    }, [outcomes, searchTerm, categoryFilter, locationFilter, decisionFilter]);

    // Get unique values for filters
    const categories = Array.from(new Set(outcomes.map(o => o.category)));
    const locations = Array.from(new Set(outcomes.map(o => o.location)));

    // Translated Helpers
    const getTranslatedDecision = (decision: string) => {
        const map: Record<string, string> = {
            'Standardize': 'templatesStandards.badges.standardize',
            'Improve & Re-run': 'templatesStandards.badges.improveRerun',
            'Close': 'templatesStandards.badges.close'
        };
        return map[decision] ? t(map[decision]) : decision;
    };

    const getTranslatedEffectiveness = (status: string) => {
        const map: Record<string, string> = {
            'Effective': 'templatesStandards.badges.effective',
            'Partially Effective': 'templatesStandards.badges.partiallyEffective',
            'Not Effective': 'templatesStandards.badges.notEffective'
        };
        return map[status] ? t(map[status]) : status;
    };

    const getTranslatedKPIStatus = (status: string) => {
        const map: Record<string, string> = {
            'Achieved': 'templatesStandards.badges.achieved',
            'Partial': 'templatesStandards.badges.partial',
            'Not Achieved': 'templatesStandards.badges.notAchieved'
        };
        return map[status] ? t(map[status]) : status;
    };

    const getTranslatedCategory = (cat: string) => {
        const map: Record<string, string> = {
            'Patient Safety': 'templatesStandards.categories.patientSafety',
            'Medication Safety': 'templatesStandards.categories.medicationSafety',
            'Patientensicherheit': 'templatesStandards.categories.patientSafety',
            'Medikamentensicherheit': 'templatesStandards.categories.medicationSafety'
        };
        return map[cat] ? t(map[cat]) : cat;
    };

    const getTranslatedLocationName = (name: string) => {
        const map: Record<string, string> = {
            'Basel': 'admin.universityHospitalBasel',
            'Bern': 'admin.inselspitalBern',
            'Zurich': 'admin.universityHospitalZurich',
            'Geneva': 'admin.genevaUniversityHospitals',
            'Lausanne': 'admin.chuvLausanne',
            'Universitätsspital Basel (BS)': 'admin.universityHospitalBasel',
            'Inselspital Bern (BE)': 'admin.inselspitalBern',
            'Universitätsspital Zürich (ZH)': 'admin.universityHospitalZurich',
            'Genfer Universitätsspitäler (GE)': 'admin.genevaUniversityHospitals',
            'CHUV Lausanne (VD)': 'admin.chuvLausanne',
            'University Hospital Basel (BS)': 'admin.universityHospitalBasel'
        };
        return map[name] ? t(map[name]) : name;
    };

    const getTranslatedTitle = (title: string) => {
        const titleMap: Record<string, string> = {
            'Reduction of Post-operative Infection Rates': 'Reduktion postoperativer Infektionsraten',
            'Medication Administration Error Reduction': 'Reduktion von Medikationsfehlern',
            'Patient Fall Prevention Protocol Compliance': 'Einhaltung des Sturzpräventionsprotokolls',
            'Reduktion von Fehlern bei der Medikamentenabgabe': 'Reduktion von Medikationsfehlern'
        };
        return titleMap[title] || title;
    };

    const getTranslatedTag = (tag: string) => {
        const areas = ['nursing', 'surgery', 'emergency', 'inpatientWard', 'outpatientClinic', 'pharmacy', 'diagnostics', 'geriatrics', 'administration'];
        const scopes = ['process', 'clinicalGuide', 'policy', 'checklist', 'training', 'ehrConfiguration', 'infectionControl', 'preOpProtocols', 'sterilizationProcedures'];

        const englishMap: Record<string, string> = {
            'Nursing': 'nursing',
            'Surgery Department': 'surgery',
            'Emergency': 'emergency',
            'Inpatient Ward': 'inpatientWard',
            'Outpatient Clinic': 'outpatientClinic',
            'Pharmacy': 'pharmacy',
            'Diagnostics': 'diagnostics',
            'Geriatrics': 'geriatrics',
            'Administration': 'administration',
            'Infection Control': 'infectionControl',
            'Chirurgie': 'surgery',
            'Infektionskontrolle': 'infectionControl',
            'Pflege': 'nursing',
            'Apotheke': 'pharmacy',
            'Geriatrie': 'geriatrics',
            'Geriatrics Department': 'geriatrics'
        };

        const key = englishMap[tag] || tag.toLowerCase();

        if (areas.includes(key)) return t(`pdca.areas.${key}`);
        if (scopes.includes(key)) return t(`pdca.scopes.${key}`);

        return tag;
    };

    const getTranslatedTemplateKind = (kind: string) => {
        const map: Record<string, string> = {
            'standard': 'templatesStandards.badges.standard',
            'template': 'templatesStandards.badges.template'
        };
        return map[kind] ? t(map[kind]) : kind;
    };

    const getTranslatedTemplateStatus = (status: string) => {
        const map: Record<string, string> = {
            'Draft': 'templatesStandards.badges.draft',
            'Published': 'templatesStandards.badges.published',
            'Archived': 'templatesStandards.badges.archived'
        };
        return map[status] ? t(map[status]) : status;
    };


    const getTranslatedStep = (step: string) => {
        return t(`pdca.${step.toLowerCase()}`);
    };

    // Handlers
    const handleExportJSON = () => {
        const data = { outcomes, templates };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `virena-templates-standards-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleRestoreDefaults = () => {
        if (confirm(t('templatesStandards.messages.restoreConfirm'))) {
            outcomesService.reset();
            templatesService.reset();
        }
    };

    const handleGenerateStandard = (outcome: PDCAOutcome) => {
        if (outcome.decision !== 'Standardize') return;

        const standard: Template = {
            id: `STD-${outcome.ref}`,
            title: `Standard: ${outcome.title}`,
            kind: 'standard',
            category: outcome.category,
            step: 'ACT',
            status: 'Published',
            source: `PDCA ${outcome.ref}`
        };

        templatesService.save(standard);

        // Update outcome with standard ID
        outcomesService.save({ ...outcome, standardId: standard.id });

        alert(t('templatesStandards.messages.standardGenerated', { id: standard.id }));
    };

    const handleSaveOutcome = () => {
        if (!editingOutcome || !editingOutcome.ref || !editingOutcome.title) {
            return alert(t('templatesStandards.messages.validationError'));
        }

        const outcome: PDCAOutcome = {
            ref: editingOutcome.ref,
            title: editingOutcome.title,
            owner: editingOutcome.owner || '',
            category: editingOutcome.category || '',
            location: editingOutcome.location || '',
            effectiveness: editingOutcome.effectiveness || 'Effective',
            decision: editingOutcome.decision || 'Standardize',
            scope: editingOutcome.scope || [],
            areas: editingOutcome.areas || [],
            kpi: editingOutcome.kpi || [],
            description: editingOutcome.description || '',
            lessons: editingOutcome.lessons || '',
            whyNot: editingOutcome.whyNot,
            signoff: editingOutcome.signoff || { standardized: false, noPending: false, readyClose: false },
            standardId: editingOutcome.standardId,
            createdAt: editingOutcome.createdAt || new Date().toISOString()
        };

        outcomesService.save(outcome);
        setOutcomeModalOpen(false);
        setEditingOutcome(null);
    };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* HEADER */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: 'var(--color-text)' }}>{t('templatesStandards.pageTitle')}</h1>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{t('templatesStandards.subtitle')}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleRestoreDefaults} className="btn btn-outline" style={{ display: 'flex', gap: '8px', color: '#dc2626', borderColor: '#fee2e2' }}>
                        <RefreshCw size={16} /> {t('templatesStandards.restoreDefaults')}
                    </button>
                </div>
            </div>

            {/* KPI SUMMARY ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(100,116,139,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={20} color="#64748B" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t('templatesStandards.pdcaOutcomes')}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)' }}>{totalOutcomes}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={20} color="#22C55E" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t('templatesStandards.standardized')}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#22C55E' }}>{standardized}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertCircle size={20} color="#F59E0B" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t('templatesStandards.notStandardized')}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B' }}>{notStandardized}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={20} color="#3B82F6" strokeWidth={1.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t('templatesStandards.standards')}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#3B82F6' }}>{totalStandards}</div>
                    </div>
                </div>
            </div>

            {/* MAIN PANEL WITH TABS */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* TABS */}
                <div style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 1.5rem', display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('standardizations')}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: '1px solid',
                            background: activeTab === 'standardizations' ? '#cbeee2' : 'white',
                            color: activeTab === 'standardizations' ? '#5FAE9E' : 'var(--color-text-muted)',
                            borderColor: activeTab === 'standardizations' ? '#5FAE9E' : 'var(--color-border)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t('templatesStandards.tabStandardizations')}
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: '1px solid',
                            background: activeTab === 'templates' ? '#cbeee2' : 'white',
                            color: activeTab === 'templates' ? '#5FAE9E' : 'var(--color-text-muted)',
                            borderColor: activeTab === 'templates' ? '#5FAE9E' : 'var(--color-border)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t('templatesStandards.tabTemplates')}
                    </button>
                </div>

                {/* FILTERS ROW */}
                {activeTab === 'standardizations' && (
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 300px' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder={t('templatesStandards.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '14px' }}
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer' }}
                        >
                            <option value="All Categories">{t('templatesStandards.filters.allCategories')}</option>
                            {categories.map(c => <option key={c} value={c}>{getTranslatedCategory(c)}</option>)}
                        </select>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer' }}
                        >
                            <option value="All Locations">{t('templatesStandards.filters.allLocations')}</option>
                            {locations.map(l => <option key={l} value={l}>{getTranslatedLocationName(l)}</option>)}
                        </select>
                        <select
                            value={decisionFilter}
                            onChange={(e) => setDecisionFilter(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer' }}
                        >
                            <option value="All Decisions">{t('templatesStandards.filters.allDecisions')}</option>
                            <option value="Standardize">{t('templatesStandards.badges.standardize')}</option>
                            <option value="Improve & Re-run">{t('templatesStandards.badges.improveRerun')}</option>
                            <option value="Close">{t('templatesStandards.badges.close')}</option>
                        </select>
                    </div>
                )}

                {/* STANDARDIZATIONS TABLE */}
                {activeTab === 'standardizations' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.topicRef')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.title')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.outcome')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.kpiSummary')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.scope')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.date')}</th>
                                    <th style={{ textAlign: 'right', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOutcomes.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>{t('templatesStandards.emptyStates.noOutcomes')}</td></tr>
                                ) : (
                                    filteredOutcomes.map(outcome => {
                                        const achievedKPIs = outcome.kpi.filter(k => k.status === 'Achieved').length;
                                        const totalKPIs = outcome.kpi.length;

                                        return (
                                            <tr key={outcome.ref} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>{outcome.ref}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{getTranslatedTitle(outcome.title)}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                        {outcome.owner} · {getTranslatedCategory(outcome.category)} · {getTranslatedLocationName(outcome.location)}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{
                                                        background: '#F8F9FA',
                                                        borderLeft: `4px solid ${outcome.decision === 'Standardize' ? '#22C55E' : '#F59E0B'}`,
                                                        padding: '10px 14px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px',
                                                        width: '200px'
                                                    }}>
                                                        <div style={{
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            color: '#64748B',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {getTranslatedDecision(outcome.decision)}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            fontWeight: 600,
                                                            color: '#334155'
                                                        }}>
                                                            {getTranslatedEffectiveness(outcome.effectiveness)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#64748b' }}>{achievedKPIs}/{totalKPIs} {t('templatesStandards.badges.achieved')}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        {outcome.scope.slice(0, 2).map((s, i) => (
                                                            <span key={i} style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '6px 14px',
                                                                background: '#F3F4F6',
                                                                borderRadius: '999px',
                                                                fontSize: '12px',
                                                                color: '#475569',
                                                                fontWeight: 500
                                                            }}>
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    background: '#5FAE9E',
                                                                    display: 'inline-block'
                                                                }} />
                                                                {getTranslatedTag(s)}
                                                            </span>
                                                        ))}
                                                        {outcome.scope.length > 2 && <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>+{outcome.scope.length - 2}</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '12px' }}>
                                                    {new Date(outcome.createdAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB')}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                        <button
                                                            onClick={() => { setViewingOutcome(outcome); setViewModalOpen(true); }}
                                                            className="btn btn-outline"
                                                            style={{ padding: '4px 8px' }}
                                                            title={t('common.view')}
                                                        >
                                                            <Eye size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TEMPLATES TABLE */}
                {activeTab === 'templates' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.id')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.title')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.kind')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.category')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.step')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.status')}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.source')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>{t('templatesStandards.emptyStates.noTemplates')}</td></tr>
                                ) : (
                                    templates.map(template => (
                                        <tr key={template.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>{template.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{template.title}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    background: template.kind === 'standard' ? '#dbeafe' : '#f3e8ff',
                                                    color: template.kind === 'standard' ? '#1e40af' : '#7e22ce'
                                                }}>
                                                    {getTranslatedTemplateKind(template.kind)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#64748b' }}>{getTranslatedCategory(template.category)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    background: '#f1f5f9',
                                                    color: '#64748b'
                                                }}>
                                                    {getTranslatedStep(template.step)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    background: template.status === 'Published' ? '#dcfce7' : template.status === 'Draft' ? '#fef3c7' : '#fee2e2',
                                                    color: template.status === 'Published' ? '#166534' : template.status === 'Draft' ? '#92400e' : '#991b1b'
                                                }}>
                                                    {getTranslatedTemplateStatus(template.status)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#64748b', fontSize: '12px' }}>{template.source}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* VIEW MODAL */}
            {isViewModalOpen && viewingOutcome && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '700px', maxHeight: '80vh', overflow: 'auto', padding: 0 }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                            <h3 style={{ margin: 0 }}>{t('templatesStandards.actions.outcomeDetails')}</h3>
                            <button onClick={() => { setViewModalOpen(false); setViewingOutcome(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.topicRef')}</div>
                                <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{viewingOutcome.ref}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.title')}</div>
                                <div style={{ fontWeight: 600 }}>{viewingOutcome.title}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.owner')}</div>
                                    <div>{viewingOutcome.owner}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.category')}</div>
                                    <div>{getTranslatedCategory(viewingOutcome.category)}</div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.description')}</div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{viewingOutcome.description}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.lessonsLearned')}</div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{viewingOutcome.lessons}</div>
                            </div>
                            {viewingOutcome.whyNot && (
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.whyNotStandardized')}</div>
                                    <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>{viewingOutcome.whyNot}</div>
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.kpis')}</div>
                                {viewingOutcome.kpi.map((k, i) => (
                                    <div key={i} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{k.name}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            {t('templatesStandards.modal.target')}: {k.target}% | {t('templatesStandards.modal.actual')}: {k.actual}% | {t('templatesStandards.modal.status')}: <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '8px',
                                                background: k.status === 'Achieved' ? '#dcfce7' : k.status === 'Partial' ? '#fef3c7' : '#fee2e2',
                                                color: k.status === 'Achieved' ? '#166534' : k.status === 'Partial' ? '#92400e' : '#991b1b',
                                                fontWeight: 600
                                            }}>{getTranslatedKPIStatus(k.status)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OUTCOME EDIT/ADD MODAL - Simplified for demo */}
            {isOutcomeModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '600px', padding: 0 }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{editingOutcome?.ref ? t('templatesStandards.actions.editOutcome') : t('templatesStandards.newOutcome')}</h3>
                            <button onClick={() => { setOutcomeModalOpen(false); setEditingOutcome(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div className="form-group">
                                <label>{t('templatesStandards.modal.topicRef')} *</label>
                                <input
                                    className="input"
                                    value={editingOutcome?.ref || ''}
                                    onChange={e => setEditingOutcome({ ...editingOutcome, ref: e.target.value })}
                                    placeholder="e.g. T-004"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('templatesStandards.modal.title')} *</label>
                                <input
                                    className="input"
                                    value={editingOutcome?.title || ''}
                                    onChange={e => setEditingOutcome({ ...editingOutcome, title: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>{t('templatesStandards.modal.owner')}</label>
                                    <input
                                        className="input"
                                        value={editingOutcome?.owner || ''}
                                        onChange={e => setEditingOutcome({ ...editingOutcome, owner: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('templatesStandards.modal.category')}</label>
                                    <input
                                        className="input"
                                        value={editingOutcome?.category || ''}
                                        onChange={e => setEditingOutcome({ ...editingOutcome, category: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{t('templatesStandards.modal.decision')} *</label>
                                <select
                                    className="input"
                                    value={editingOutcome?.decision || 'Standardize'}
                                    onChange={e => setEditingOutcome({ ...editingOutcome, decision: e.target.value as DecisionType })}
                                >
                                    <option value="Standardize">{t('templatesStandards.badges.standardize')}</option>
                                    <option value="Improve & Re-run">{t('templatesStandards.badges.improveRerun')}</option>
                                    <option value="Close">{t('templatesStandards.badges.close')}</option>
                                </select>
                            </div>
                            {editingOutcome?.decision !== 'Standardize' && (
                                <div className="form-group">
                                    <label>{t('templatesStandards.modal.whyNotStandardized')} *</label>
                                    <textarea
                                        className="input"
                                        value={editingOutcome?.whyNot || ''}
                                        onChange={e => setEditingOutcome({ ...editingOutcome, whyNot: e.target.value })}
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={handleSaveOutcome} className="btn" style={{ background: '#cbeee2', color: '#5FAE9E', border: 'none' }}>
                                <Save size={16} /> {t('templatesStandards.actions.saveOutcome')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesStandards;
