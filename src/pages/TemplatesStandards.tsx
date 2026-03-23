import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Edit2, Trash2, Search, Download, RefreshCw, Eye, FileText,
    X, Save, CheckCircle2, Tag, MapPin, Building2, Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { adminService } from '../services/adminService';
import { topicsService } from '../services';
import { activityService } from '../services/activityService';
import { generatePlanDoCheckCombinedPdf } from '../utils/pdfGenerator';
import { stripDoctorPrefix } from '../utils/nameUtils';

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
    department?: string;
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
    rerunTopicId?: string;
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

const normalizeOutcome = (outcome: PDCAOutcome): PDCAOutcome => ({
    ...outcome,
    owner: stripDoctorPrefix(outcome.owner)
});

// --- SEED DATA ---

const seedOutcomes = (): PDCAOutcome[] => [
    {
        ref: 'T-001',
        title: 'Reduktion postoperativer Infektionsraten',
        owner: 'Marcus Weber',
        category: 'Patientensicherheit',
        location: 'UniversitÃ¤tsspital Basel (BS)',
        department: 'Surgery Department',
        effectiveness: 'Effective',
        decision: 'Standardize',
        scope: ['Chirurgie', 'Infektionskontrolle'],
        areas: ['PrÃ¤operative Protokolle', 'Sterilisationsverfahren'],
        kpi: [
            { name: 'Infektionsraten-Reduktion', target: 50, actual: 65, status: 'Achieved' }
        ],
        description: 'Erweiterte prÃ¤operative Protokolle implementiert',
        lessons: 'FrÃ¼hzeitige Intervention und Schulung des Personals kritisch',
        signoff: { standardized: true, noPending: true, readyClose: true },
        standardId: 'STD-T-001',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        ref: 'T-002',
        title: 'Reduktion von Medikationsfehlern',
        owner: 'Elena Rossi',
        category: 'Medikamentensicherheit',
        location: 'Bern',
        department: 'Quality & Patient Safety',
        effectiveness: 'Partially Effective',
        decision: 'Improve & Re-run',
        scope: ['Pflege', 'Apotheke'],
        areas: ['Doppel-Check-Verfahren', 'Elektronische Verifizierung'],
        kpi: [
            { name: 'Fehlerraten-Reduktion', target: 80, actual: 45, status: 'Partial' }
        ],
        description: 'Elektronisches Verifizierungssystem pilotiert',
        lessons: 'TechnologieeinfÃ¼hrung erfordert mehr Schulung',
        whyNot: 'Ziel nicht erreicht; erfordert zusÃ¤tzliche Schulungszyklen und Systemverfeinerung vor der Standardisierung',
        signoff: { standardized: false, noPending: false, readyClose: false },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        ref: 'T-003',
        title: 'Einhaltung des Sturzpräventionsprotokolls',
        owner: 'Sarah Johnson (RN)',
        category: 'Patientensicherheit',
        location: 'UniversitÃ¤tsspital Basel (BS)',
        department: 'Quality & Patient Safety',
        effectiveness: 'Effective',
        decision: 'Standardize',
        scope: ['Pflege', 'Geriatrie'],
        areas: ['Risikobewertung', 'Umgebungssicherheit'],
        kpi: [
            { name: 'Sturzvorfall-Reduktion', target: 40, actual: 52, status: 'Achieved' }
        ],
        description: 'Verbesserte Sturzrisikobewertung und PrÃ¤ventionsmaÃŸnahmen',
        lessons: 'Konsequente Anwendung Ã¼ber alle Schichten hinweg essenziell',
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
        const raw = localStorage.getItem(STORAGE_KEY_OUTCOMES);
        if (!raw) {
            const seed = seedOutcomes().map(normalizeOutcome);
            localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(seed));
            return seed;
        }
        const outcomes = (JSON.parse(raw) as PDCAOutcome[]).map(normalizeOutcome);
        const serialized = JSON.stringify(outcomes);
        if (serialized !== raw) {
            localStorage.setItem(STORAGE_KEY_OUTCOMES, serialized);
        }
        return outcomes;
    },
    save: (outcome: PDCAOutcome) => {
        const all = outcomesService.getAll();
        const normalizedOutcome = normalizeOutcome(outcome);
        const idx = all.findIndex(o => o.ref === normalizedOutcome.ref);
        if (idx >= 0) all[idx] = normalizedOutcome;
        else all.push(normalizedOutcome);
        localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(all));
        window.dispatchEvent(new Event('storage-outcomes'));
    },
    delete: (ref: string) => {
        const all = outcomesService.getAll().filter(o => o.ref !== ref);
        localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(all));
        window.dispatchEvent(new Event('storage-outcomes'));
    },
    reset: () => {
        localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(seedOutcomes().map(normalizeOutcome)));
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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'standardizations' | 'templates'>('standardizations');
    const [outcomes, setOutcomes] = useState<PDCAOutcome[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [adminLocations, setAdminLocations] = useState<Array<{ id: string; name: string }>>([]);
    const [adminDepartments, setAdminDepartments] = useState<Array<{ name: string; locationId: string }>>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('All Locations');
    const [departmentFilter, setDepartmentFilter] = useState('All Departments');
    const [decisionFilter, setDecisionFilter] = useState('All Decisions');

    // Modals
    const [isOutcomeModalOpen, setOutcomeModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [editingOutcome, setEditingOutcome] = useState<Partial<PDCAOutcome> | null>(null);
    const [viewingOutcome, setViewingOutcome] = useState<PDCAOutcome | null>(null);
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);

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

    useEffect(() => {
        const loadAdminFilters = () => {
            const locations = adminService.getLocations()
                .map(loc => ({ id: loc.id, name: loc.name }))
                .filter(loc => !!loc.id && !!loc.name);
            const departments = adminService.getDepartments()
                .map(dep => ({ name: dep.name, locationId: dep.locationId }))
                .filter(dep => !!dep.name && !!dep.locationId);
            setAdminLocations(locations);
            setAdminDepartments(departments);
        };
        loadAdminFilters();
        window.addEventListener('storage-admin', loadAdminFilters);
        return () => window.removeEventListener('storage-admin', loadAdminFilters);
    }, []);

    // KPI Calculations
    const totalOutcomes = outcomes.length;
    const standardized = outcomes.filter(o => o.decision === 'Standardize').length;
    const improveRerun = outcomes.filter(o => o.decision === 'Improve & Re-run').length;
    const notStandardized = outcomes.filter(o => o.decision === 'Close').length;

    const getOutcomeLocations = (location?: string) =>
        `${location || ''}`
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);

    // Filtered outcomes
    const filteredOutcomes = useMemo(() => {
        return outcomes.filter(o => {
            const matchesSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.ref.toLowerCase().includes(searchTerm.toLowerCase());
            const outcomeLocations = getOutcomeLocations(o.location);
            const matchesLocation =
                locationFilter === 'All Locations'
                || outcomeLocations.includes(locationFilter);
            const matchesDepartment = departmentFilter === 'All Departments' || o.department === departmentFilter;
            const matchesDecision = decisionFilter === 'All Decisions' || o.decision === decisionFilter;
            return matchesSearch && matchesLocation && matchesDepartment && matchesDecision;
        });
    }, [outcomes, searchTerm, locationFilter, departmentFilter, decisionFilter]);

    // Prefer locations from Administration; fallback to outcomes if admin is empty.
    const locations = useMemo(() => {
        if (adminLocations.length > 0) {
            return Array.from(new Set(adminLocations.map(loc => loc.name).filter(Boolean)));
        }
        return Array.from(new Set(outcomes.flatMap(o => getOutcomeLocations(o.location))));
    }, [adminLocations, outcomes]);

    const departments = useMemo(() => {
        if (adminDepartments.length > 0) {
            const selectedLocationIds =
                locationFilter === 'All Locations'
                    ? null
                    : adminLocations
                        .filter(loc => loc.name === locationFilter)
                        .map(loc => loc.id);

            const names = adminDepartments
                .filter(dep => !selectedLocationIds || selectedLocationIds.includes(dep.locationId))
                .map(dep => dep.name)
                .filter(Boolean);

            return Array.from(new Set(names));
        }

        const fallback = outcomes
            .filter(o => locationFilter === 'All Locations' || getOutcomeLocations(o.location).includes(locationFilter))
            .map(o => o.department)
            .filter(Boolean) as string[];
        return Array.from(new Set(fallback));
    }, [adminDepartments, adminLocations, outcomes, locationFilter]);

    useEffect(() => {
        if (departmentFilter !== 'All Departments' && !departments.includes(departmentFilter)) {
            setDepartmentFilter('All Departments');
        }
    }, [departmentFilter, departments]);

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
            'Bern': 'admin.inselspitalBern',
            'Zurich': 'admin.universityHospitalZurich',
            'Universitätsspital Zürich (ZH)': 'admin.universityHospitalZurich',
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

    const getTranslatedDepartmentName = (name: string) => {
        if (name === 'Quality & Patient Safety') return t('admin.qualityPatientSafety');
        if (name === 'Surgery Department') return t('admin.surgeryDepartment');
        return name;
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

    const getOutcomeFromSource = (source: string): PDCAOutcome | null => {
        const match = source.match(/T-\d+/i);
        if (!match) return null;
        const ref = match[0].toUpperCase();
        return outcomes.find(o => o.ref.toUpperCase() === ref) || null;
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter(template => {
            const linkedOutcome = getOutcomeFromSource(template.source);
            const isStandardizedProcess =
                template.kind === 'standard' && (!linkedOutcome || linkedOutcome.decision === 'Standardize');

            if (!isStandardizedProcess) {
                return false;
            }

            const matchesSearch =
                template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (linkedOutcome?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (linkedOutcome?.ref || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesLocation =
                locationFilter === 'All Locations'
                || getOutcomeLocations(linkedOutcome?.location).includes(locationFilter);
            const matchesDepartment =
                departmentFilter === 'All Departments' || (linkedOutcome?.department || '') === departmentFilter;
            return matchesSearch && matchesLocation && matchesDepartment;
        });
    }, [templates, outcomes, searchTerm, locationFilter, departmentFilter]);

    const downloadTemplateDetails = (template: Template) => {
        const linkedOutcome = getOutcomeFromSource(template.source);
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const left = 14;
        const maxW = 182;
        const pageBottom = 285;
        const lineH = 5.5;
        let y = 16;

        const ensureSpace = (needed: number) => {
            if (y + needed > pageBottom) {
                doc.addPage();
                y = 16;
            }
        };

        const heading = (text: string) => {
            ensureSpace(10);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(text, left, y);
            y += 8;
        };

        const subheading = (text: string) => {
            ensureSpace(8);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(text, left, y);
            y += 6;
        };

        const field = (label: string, value: string) => {
            const text = `${label}: ${value || '-'}`;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(text, maxW);
            ensureSpace(lines.length * lineH + 2);
            doc.text(lines, left, y);
            y += lines.length * lineH + 1;
        };

        heading('Template / Standard Details');
        field('ID', template.id);
        field('Title', template.title);
        field('Kind', getTranslatedTemplateKind(template.kind));
        field('Step', getTranslatedStep(template.step));
        field('Status', getTranslatedTemplateStatus(template.status));
        field('Source', template.source || '-');

        y += 2;
        subheading('Linked PDCA Outcome');

        if (!linkedOutcome) {
            field('Info', 'No linked PDCA outcome details found for this source.');
            doc.save(`${template.id}_details.pdf`);
            return;
        }

        field('Reference', linkedOutcome.ref);
        field('Title', linkedOutcome.title);
        field('Owner', linkedOutcome.owner || '-');
        field('Description', linkedOutcome.description || '-');
        field('Lessons Learned', linkedOutcome.lessons || '-');
        field('Why Not Standardized', linkedOutcome.whyNot || '-');

        const scopeText = (linkedOutcome.scope || []).length > 0
            ? linkedOutcome.scope.map(s => getTranslatedTag(s)).join(', ')
            : '-';
        const areasText = (linkedOutcome.areas || []).length > 0
            ? linkedOutcome.areas.map(a => getTranslatedTag(a)).join(', ')
            : '-';

        field('Scope', scopeText);
        field('Affected Areas / Rollout', areasText);
        field('Date', new Date(linkedOutcome.createdAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB'));

        const kpis = linkedOutcome.kpi || [];
        if (kpis.length > 0) {
            y += 2;
            subheading('KPIs');
            kpis.forEach((kpi, idx) => {
                field(`KPI ${idx + 1}`, `${kpi.name} | Target: ${kpi.target}% | Actual: ${kpi.actual}% | Status: ${getTranslatedKPIStatus(kpi.status)}`);
            });
        }

        doc.save(`${template.id}_details.pdf`);
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

    const handleDownloadOutcomePdf = (outcome: PDCAOutcome) => {
        const topic = topicsService.getById(outcome.ref);
        if (!topic) {
            alert(`No linked PDCA process was found for ${outcome.ref}.`);
            return;
        }

        generatePlanDoCheckCombinedPdf(topic);
    };

    const buildCopiedPlanMeeting = (sourceTopic: ReturnType<typeof topicsService.getById>) => {
        const sourceMeeting = sourceTopic?.plan.meeting;
        const copiedResponsiblePersons = Array.isArray(sourceMeeting?.responsiblePersons)
            ? sourceMeeting.responsiblePersons.filter(Boolean)
            : [];

        return {
            title: sourceMeeting?.title || '',
            responsiblePersons: copiedResponsiblePersons,
            meetingType: sourceMeeting?.meetingType || 'In-Office (On-site)',
            meetingDateTime: sourceMeeting?.meetingDateTime || '',
            location: sourceMeeting?.location || '',
            checkTriggerDate: sourceMeeting?.checkTriggerDate || '',
            externalEnabled: !!sourceMeeting?.externalEnabled,
            externalUsers: Array.isArray(sourceMeeting?.externalUsers) ? sourceMeeting.externalUsers : []
        };
    };

    const initializeRerunTopic = (topicId: string, title: string, sourceTopic: ReturnType<typeof topicsService.getById>) => {
        topicsService.update(topicId, {
            title,
            dueDate: '',
            location: '',
            locationId: '',
            departmentId: '',
            step: 'PLAN',
            status: 'Monitoring',
            plan: {
                description: '',
                goal: '',
                asIs: '',
                toBe: '',
                rootCause: '',
                improvementPurpose: [],
                objectives: [],
                meeting: buildCopiedPlanMeeting(sourceTopic),
                completedAt: undefined
            },
            do: {
                actions: [],
                checkDate: '',
                completedAt: undefined
            },
            check: {
                kpis: [],
                kpiResults: '',
                effectivenessReview: '',
                effectivenessStatus: undefined,
                kpiEvaluations: [],
                checkDecision: undefined,
                meeting: undefined,
                audit: undefined,
                completedAt: undefined
            },
            act: {
                effectivenessStatus: undefined,
                actOutcome: undefined,
                standardizationScope: [],
                affectedAreas: [],
                standardizationDescription: '',
                lessonsLearned: '',
                actConfirmation: { standardized: false, noActionsPending: false, readyToClose: false },
                audit: undefined,
                completedAt: undefined,
                standardization: ''
            }
        });
    };

    const logRerunOpened = (topicId: string, sourceTopic: ReturnType<typeof topicsService.getById>, outcome: PDCAOutcome) => {
        if (!sourceTopic) return;

        activityService.log({
            type: 'TOPIC_RERUN_OPENED',
            message: `PDCA Re-run opened from Templates & Standards for ${outcome.ref}`,
            entityType: 'Topic',
            entityName: sourceTopic.title,
            entityId: topicId,
            location: outcome.location || sourceTopic.location,
            department: outcome.department
        });
    };

    const handleRerunOutcome = (outcome: PDCAOutcome) => {
        const sourceTopic = topicsService.getById(outcome.ref);
        if (!sourceTopic) {
            alert(`No linked PDCA process was found for ${outcome.ref}.`);
            return;
        }

        const existingRerunTopic = outcome.rerunTopicId ? topicsService.getById(outcome.rerunTopicId) : undefined;
        if (existingRerunTopic) {
            initializeRerunTopic(existingRerunTopic.id, sourceTopic.title, sourceTopic);
            topicsService.update(existingRerunTopic.id, {
                rerunSourceRef: outcome.ref
            });
            logRerunOpened(existingRerunTopic.id, sourceTopic, outcome);
            outcomesService.save({
                ...outcome,
                rerunTopicId: existingRerunTopic.id
            });
            window.dispatchEvent(new Event('storage'));
            navigate(`/app/cockpit?topicId=${existingRerunTopic.id}`);
            return;
        }

        const rerunTopic = topicsService.add({
            title: sourceTopic.title,
            ownerId: sourceTopic.ownerId,
            ownerName: sourceTopic.ownerName,
            responsibleId: sourceTopic.responsibleId,
            responsibleName: sourceTopic.responsibleName,
            status: 'Monitoring',
            category: sourceTopic.category,
            kpi: sourceTopic.kpi,
            objective: sourceTopic.objective,
            dueDate: '',
            step: 'PLAN',
            type: sourceTopic.type,
            rating: sourceTopic.rating,
            location: '',
            locationId: '',
            departmentId: '',
            auditReference: sourceTopic.auditReference,
            auditType: sourceTopic.auditType,
            rerunSourceRef: outcome.ref
        });

        initializeRerunTopic(rerunTopic.id, sourceTopic.title, sourceTopic);

        logRerunOpened(rerunTopic.id, sourceTopic, outcome);
        outcomesService.save({
            ...outcome,
            rerunTopicId: rerunTopic.id
        });
        window.dispatchEvent(new Event('storage'));
        navigate(`/app/cockpit?topicId=${rerunTopic.id}`);
    };

    const handleDownloadTemplatePdf = (template: Template) => {
        const linkedOutcome = getOutcomeFromSource(template.source);
        const topicRef = linkedOutcome?.ref || template.source.match(/T-\d+/i)?.[0]?.toUpperCase();

        if (!topicRef) {
            alert(`No linked PDCA process was found for ${template.id}.`);
            return;
        }

        const topic = topicsService.getById(topicRef);
        if (!topic) {
            alert(`No linked PDCA process was found for ${topicRef}.`);
            return;
        }

        generatePlanDoCheckCombinedPdf(topic);
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
            department: editingOutcome.department || '',
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
            rerunTopicId: editingOutcome.rerunTopicId,
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
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
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(95,174,158,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <RefreshCw size={20} color="#5FAE9E" strokeWidth={1.8} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t('templatesStandards.badges.improveRerun')}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#5FAE9E' }}>{improveRerun}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <X size={20} color="#EF4444" strokeWidth={1.8} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t('templatesStandards.notStandardized')}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#EF4444' }}>{notStandardized}</div>
                    </div>
                </div>

            </div>

            {/* MAIN PANEL WITH TABS */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* TABS */}
                <div style={{ borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button
                        onClick={() => setActiveTab('standardizations')}
                        style={{
                            padding: '0.9rem 1.1rem 0.8rem',
                            borderRadius: 0,
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent',
                            color: activeTab === 'standardizations' ? '#5FAE9E' : '#94a3b8',
                            borderBottom: activeTab === 'standardizations' ? '2px solid #5FAE9E' : '2px solid transparent',
                            transition: 'all 0.15s'
                        }}
                    >
                        {t('templatesStandards.tabStandardizations')}
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        style={{
                            padding: '0.9rem 1.1rem 0.8rem',
                            borderRadius: 0,
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent',
                            color: activeTab === 'templates' ? '#5FAE9E' : '#94a3b8',
                            borderBottom: activeTab === 'templates' ? '2px solid #5FAE9E' : '2px solid transparent',
                            transition: 'all 0.15s'
                        }}
                    >
                        {t('templatesStandards.tabTemplates')}
                    </button>
                </div>

                {/* FILTERS ROW */}
                {(activeTab === 'standardizations' || activeTab === 'templates') && (
                    <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                        <div style={{ position: 'relative', flex: '0 1 360px', minWidth: '260px' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder={t('templatesStandards.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '10px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '14px' }}
                            />
                        </div>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            style={{ width: '160px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}
                        >
                            <option value="All Locations">{t('templatesStandards.filters.allLocations')}</option>
                            {locations.map(l => <option key={l} value={l}>{getTranslatedLocationName(l)}</option>)}
                        </select>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            style={{ width: '170px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}
                        >
                            <option value="All Departments">{language === 'de' ? 'Alle Betriebe' : 'All Departments'}</option>
                            {departments.map(d => <option key={d} value={d}>{getTranslatedDepartmentName(d)}</option>)}
                        </select>
                        {activeTab === 'standardizations' && (
                            <select
                                value={decisionFilter}
                                onChange={(e) => setDecisionFilter(e.target.value)}
                                style={{ width: '160px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}
                            >
                                <option value="All Decisions">{t('templatesStandards.filters.allDecisions')}</option>
                                <option value="Standardize">{t('templatesStandards.badges.standardize')}</option>
                                <option value="Improve & Re-run">{t('templatesStandards.badges.improveRerun')}</option>
                                <option value="Close">{t('templatesStandards.badges.close')}</option>
                            </select>
                        )}
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
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.date')}</th>
                                    <th style={{ textAlign: 'right', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOutcomes.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>{t('templatesStandards.emptyStates.noOutcomes')}</td></tr>
                                ) : (
                                    filteredOutcomes.map(outcome => {
                                        return (
                                            <tr key={outcome.ref} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>{outcome.ref}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{getTranslatedTitle(outcome.title)}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                        {getTranslatedLocationName(outcome.location)}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{
                                                        background: 'transparent',
                                                        borderLeft: '4px solid #5FAE9E',
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
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '12px' }}>
                                                    {new Date(outcome.createdAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB')}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                        {outcome.decision === 'Improve & Re-run' && (
                                                            <button
                                                                onClick={() => handleRerunOutcome(outcome)}
                                                                className="btn btn-outline"
                                                                style={{ padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                                title={outcome.rerunTopicId ? t('templatesStandards.actions.openRerun') : t('templatesStandards.actions.rerun')}
                                                            >
                                                                <RefreshCw size={13} />
                                                                {outcome.rerunTopicId ? t('templatesStandards.actions.openRerun') : t('templatesStandards.actions.rerun')}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDownloadOutcomePdf(outcome)}
                                                            className="btn btn-outline"
                                                            style={{ padding: '4px 8px' }}
                                                            title="Download PDF"
                                                        >
                                                            <Download size={13} />
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
                                    <th style={{ textAlign: 'right', padding: '1rem', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTemplates.length === 0 ? (
                                    <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>{t('templatesStandards.emptyStates.noTemplates')}</td></tr>
                                ) : (
                                    filteredTemplates.map(template => (
                                        <tr
                                            key={template.id}
                                            style={{ borderBottom: '1px solid #f1f5f9' }}
                                        >
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>{template.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{template.title}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                    <button
                                                        onClick={() => handleDownloadTemplatePdf(template)}
                                                        className="btn btn-outline"
                                                        style={{ padding: '4px 8px' }}
                                                        title="Download PDF"
                                                    >
                                                        <Download size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* TEMPLATE/STANDARD VIEW MODAL */}
            {isTemplateModalOpen && viewingTemplate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '760px', maxHeight: '82vh', overflow: 'auto', padding: 0 }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                            <h3 style={{ margin: 0 }}>{viewingTemplate.kind === 'standard' ? 'Standard Details' : 'Template Details'}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    onClick={() => downloadTemplateDetails(viewingTemplate)}
                                    className="btn btn-outline"
                                    style={{ padding: '6px 10px' }}
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                                <button onClick={() => { setTemplateModalOpen(false); setViewingTemplate(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>ID</div>
                                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{viewingTemplate.id}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.source')}</div>
                                    <div>{viewingTemplate.source || '-'}</div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.title')}</div>
                                <div style={{ fontWeight: 600 }}>{viewingTemplate.title}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.kind')}</div>
                                    <div>{getTranslatedTemplateKind(viewingTemplate.kind)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.step')}</div>
                                    <div>{getTranslatedStep(viewingTemplate.step)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.status')}</div>
                                    <div>{getTranslatedTemplateStatus(viewingTemplate.status)}</div>
                                </div>
                            </div>

                            {(() => {
                                const linkedOutcome = getOutcomeFromSource(viewingTemplate.source);
                                if (!linkedOutcome) {
                                    return (
                                        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
                                            No linked PDCA outcome details found for this source.
                                        </div>
                                    );
                                }
                                return (
                                    <>
                                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '1rem' }}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Linked PDCA Outcome</div>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 600, marginBottom: '6px' }}>{linkedOutcome.ref}</div>
                                            <div style={{ fontWeight: 600 }}>{linkedOutcome.title}</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.owner')}</div>
                                                <div>{linkedOutcome.owner || '-'}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.description')}</div>
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{linkedOutcome.description || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.lessonsLearned')}</div>
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{linkedOutcome.lessons || '-'}</div>
                                        </div>
                                        {linkedOutcome.whyNot && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.whyNotStandardized')}</div>
                                                <div style={{ padding: '0.75rem', background: '#dff5ef', borderRadius: '8px', color: '#2f7f72' }}>{linkedOutcome.whyNot}</div>
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.modal.kpis')}</div>
                                            {linkedOutcome.kpi && linkedOutcome.kpi.length > 0 ? (
                                                linkedOutcome.kpi.map((k, i) => (
                                                    <div key={i} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px' }}>
                                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{k.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                            {t('templatesStandards.modal.target')}: {k.target}% | {t('templatesStandards.modal.actual')}: {k.actual}% | {t('templatesStandards.modal.status')}: <span style={{
                                                                padding: '2px 6px',
                                                                borderRadius: '8px',
                                                                background: k.status === 'Achieved' ? '#dcfce7' : k.status === 'Partial' ? '#dff5ef' : '#fee2e2',
                                                                color: k.status === 'Achieved' ? '#166534' : k.status === 'Partial' ? '#2f7f72' : '#991b1b',
                                                                fontWeight: 600
                                                            }}>{getTranslatedKPIStatus(k.status)}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ color: '#64748b' }}>-</div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.scope')}</div>
                                            {linkedOutcome.scope && linkedOutcome.scope.length > 0 ? (
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {linkedOutcome.scope.map((s, i) => (
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
                                                </div>
                                            ) : (
                                                <div style={{ color: '#64748b' }}>-</div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>{t('pdca.affectedAreas')}</div>
                                            {linkedOutcome.areas && linkedOutcome.areas.length > 0 ? (
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {linkedOutcome.areas.map((area, idx) => (
                                                        <span key={idx} style={{
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
                                                            {getTranslatedTag(area)}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ color: '#64748b' }}>-</div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.date')}</div>
                                            <div>{new Date(linkedOutcome.createdAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB')}</div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

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
                                    <div style={{ padding: '0.75rem', background: '#dff5ef', borderRadius: '8px', color: '#2f7f72' }}>{viewingOutcome.whyNot}</div>
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
                                                background: k.status === 'Achieved' ? '#dcfce7' : k.status === 'Partial' ? '#dff5ef' : '#fee2e2',
                                                color: k.status === 'Achieved' ? '#166534' : k.status === 'Partial' ? '#2f7f72' : '#991b1b',
                                                fontWeight: 600
                                            }}>{getTranslatedKPIStatus(k.status)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.scope')}</div>
                                {viewingOutcome.scope && viewingOutcome.scope.length > 0 ? (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {viewingOutcome.scope.map((s, i) => (
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
                                    </div>
                                ) : (
                                    <div style={{ color: '#64748b' }}>-</div>
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('templatesStandards.columns.date')}</div>
                                <div>{new Date(viewingOutcome.createdAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB')}</div>
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




