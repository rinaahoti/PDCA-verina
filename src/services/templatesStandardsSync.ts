import { Topic } from '../types';
import { stripDoctorPrefix } from '../utils/nameUtils';

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

const readStoredArray = <T,>(key: string): T[] => {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeStoredArray = <T,>(key: string, items: T[], eventName: string) => {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event(eventName));
};

const parseMetricNumber = (value?: string) => {
    const match = `${value || ''}`.replace(',', '.').match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
};

const mapDecision = (actOutcome?: string): DecisionType => {
    if (actOutcome === 'Standardize') return 'Standardize';
    if (actOutcome === 'Improve & Re-run PDCA') return 'Improve & Re-run';
    return 'Close';
};

const mapEffectiveness = (topic: Topic, decision: DecisionType): EffectivenessStatus => {
    if (topic.check?.effectivenessStatus) return topic.check.effectivenessStatus;
    if (decision === 'Standardize') return 'Effective';
    if (decision === 'Improve & Re-run') return 'Partially Effective';
    return 'Not Effective';
};

const mapOutcomeDescription = (topic: Topic, decision: DecisionType) => {
    if (decision === 'Standardize') {
        return topic.act?.standardizationDescription
            || topic.act?.standardization
            || topic.check?.effectivenessReview
            || topic.plan?.goal
            || '';
    }

    return topic.check?.effectivenessReview
        || topic.act?.lessonsLearned
        || topic.plan?.goal
        || '';
};

const mapWhyNot = (topic: Topic, decision: DecisionType) => {
    if (decision === 'Standardize') return undefined;

    return topic.check?.effectivenessReview
        || topic.act?.lessonsLearned
        || undefined;
};

const mapKpis = (topic: Topic, effectiveness: EffectivenessStatus): PDCAOutcome['kpi'] => {
    if (Array.isArray(topic.check?.kpiEvaluations) && topic.check.kpiEvaluations.length > 0) {
        return topic.check.kpiEvaluations.map(kpi => ({
            name: kpi.name || 'KPI',
            target: parseMetricNumber(kpi.targetValue),
            actual: parseMetricNumber(kpi.actualResult),
            status:
                kpi.status === 'Achieved'
                    ? 'Achieved'
                    : effectiveness === 'Partially Effective'
                        ? 'Partial'
                        : 'Not Achieved'
        }));
    }

    if (topic.kpi) {
        return [{
            name: topic.kpi,
            target: 0,
            actual: 0,
            status: effectiveness === 'Effective' ? 'Achieved' : effectiveness === 'Partially Effective' ? 'Partial' : 'Not Achieved'
        }];
    }

    return [];
};

export const removeTopicFromTemplatesStandards = (topicRef: string) => {
    const outcomes = readStoredArray<PDCAOutcome>(STORAGE_KEY_OUTCOMES)
        .filter(outcome => outcome.ref !== topicRef);
    writeStoredArray(STORAGE_KEY_OUTCOMES, outcomes, 'storage-outcomes');

    const templates = readStoredArray<Template>(STORAGE_KEY_TEMPLATES)
        .filter(template => template.id !== `STD-${topicRef}` && template.source !== `PDCA ${topicRef}`);
    writeStoredArray(STORAGE_KEY_TEMPLATES, templates, 'storage-templates');
};

export const syncTopicToTemplatesStandards = (topic: Topic, ownerName: string) => {
    const decision = mapDecision(topic.act?.actOutcome);
    const effectiveness = mapEffectiveness(topic, decision);
    const standardId = decision === 'Standardize' ? `STD-${topic.id}` : undefined;
    const outcomes = readStoredArray<PDCAOutcome>(STORAGE_KEY_OUTCOMES);
    const existingOutcome = outcomes.find(savedOutcome => savedOutcome.ref === topic.id);

    const outcome: PDCAOutcome = {
        ref: topic.id,
        title: topic.title,
        owner: stripDoctorPrefix(ownerName),
        category: topic.category || '',
        location: topic.location || '',
        department: topic.departmentId || '',
        effectiveness,
        decision,
        scope: topic.act?.standardizationScope || [],
        areas: topic.act?.affectedAreas || [],
        kpi: mapKpis(topic, effectiveness),
        description: mapOutcomeDescription(topic, decision),
        lessons: topic.act?.lessonsLearned || '',
        whyNot: mapWhyNot(topic, decision),
        signoff: {
            standardized: !!topic.act?.actConfirmation?.standardized,
            noPending: !!topic.act?.actConfirmation?.noActionsPending,
            readyClose: !!topic.act?.actConfirmation?.readyToClose
        },
        standardId,
        rerunTopicId: existingOutcome?.rerunTopicId,
        createdAt: topic.act?.audit?.closedOn || topic.act?.completedAt || new Date().toISOString()
    };

    const outcomeIndex = outcomes.findIndex(existingOutcome => existingOutcome.ref === outcome.ref);
    if (outcomeIndex >= 0) outcomes[outcomeIndex] = outcome;
    else outcomes.push(outcome);
    writeStoredArray(STORAGE_KEY_OUTCOMES, outcomes, 'storage-outcomes');

    const templates = readStoredArray<Template>(STORAGE_KEY_TEMPLATES);
    const standardTemplateId = `STD-${topic.id}`;
    const nextTemplates = templates.filter(template => template.id !== standardTemplateId);

    if (decision === 'Standardize') {
        nextTemplates.push({
            id: standardTemplateId,
            title: `Standard: ${topic.title}`,
            kind: 'standard',
            category: topic.category || '',
            step: 'ACT',
            status: 'Published',
            source: `PDCA ${topic.id}`
        });
    }

    writeStoredArray(STORAGE_KEY_TEMPLATES, nextTemplates, 'storage-templates');
};
