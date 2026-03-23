import { Audit, AuditFinding, Step } from '../types';
import { MOCK_AUDITS, MOCK_FINDINGS } from '../data/mock_audits';
import { activityService } from './activityService';
import { stripDoctorPrefix } from '../utils/nameUtils';

const KEYS = {
    AUDITS: 'mso_v6_audits',
    FINDINGS: 'mso_v6_audit_findings'
};

const normalizeAudit = (audit: Audit): Audit => ({
    ...audit,
    auditor: stripDoctorPrefix(audit.auditor)
});

const normalizeFinding = (finding: AuditFinding): AuditFinding => ({
    ...finding,
    responsible: stripDoctorPrefix(finding.responsible),
    assigned: stripDoctorPrefix(finding.assigned)
});

export const auditService = {
    init: () => {
        if (!localStorage.getItem(KEYS.AUDITS)) {
            localStorage.setItem(KEYS.AUDITS, JSON.stringify(MOCK_AUDITS));
        }
        if (!localStorage.getItem(KEYS.FINDINGS)) {
            localStorage.setItem(KEYS.FINDINGS, JSON.stringify(MOCK_FINDINGS));
        }

        const rawAudits = localStorage.getItem(KEYS.AUDITS) || '[]';
        const normalizedAudits = (JSON.parse(rawAudits) as Audit[]).map(normalizeAudit);
        const serializedAudits = JSON.stringify(normalizedAudits);
        if (serializedAudits !== rawAudits) {
            localStorage.setItem(KEYS.AUDITS, serializedAudits);
        }

        const rawFindings = localStorage.getItem(KEYS.FINDINGS) || '[]';
        const normalizedFindings = (JSON.parse(rawFindings) as AuditFinding[]).map(normalizeFinding);
        const serializedFindings = JSON.stringify(normalizedFindings);
        if (serializedFindings !== rawFindings) {
            localStorage.setItem(KEYS.FINDINGS, serializedFindings);
        }
    },

    getAllAudits: (): Audit[] => {
        auditService.init();
        return (JSON.parse(localStorage.getItem(KEYS.AUDITS) || '[]') as Audit[]).map(normalizeAudit);
    },

    getAuditById: (id: string): Audit | undefined => {
        return auditService.getAllAudits().find(a => a.id === id);
    },

    saveAudit: (audit: Audit) => {
        const audits = auditService.getAllAudits();
        const index = audits.findIndex(a => a.id === audit.id);
        const isNew = index < 0;
        const oldStatus = !isNew ? audits[index].status : null;

        const normalizedAudit = normalizeAudit(audit);

        if (index >= 0) {
            audits[index] = normalizedAudit;
        } else {
            audits.push(normalizedAudit);
        }
        localStorage.setItem(KEYS.AUDITS, JSON.stringify(audits));

        if (isNew) {
            activityService.log({
                type: 'AUDIT_CREATED',
                message: `Audit ${normalizedAudit.id} created`,
                entityType: 'Audit',
                entityName: normalizedAudit.id,
                location: normalizedAudit.location
            });
        } else if (oldStatus !== normalizedAudit.status) {
            activityService.log({
                type: 'AUDIT_STATUS_CHANGED',
                message: `Audit ${normalizedAudit.id} status changed to ${normalizedAudit.status}`,
                entityType: 'Audit',
                entityName: normalizedAudit.id,
                location: normalizedAudit.location
            });
        }

        // Dispatch storage event to notify other tabs/components
        window.dispatchEvent(new Event('storage'));
        return normalizedAudit;
    },

    getAllFindings: (): AuditFinding[] => {
        auditService.init();
        return (JSON.parse(localStorage.getItem(KEYS.FINDINGS) || '[]') as AuditFinding[]).map(normalizeFinding);
    },

    getFindingsByAudit: (auditId: string): AuditFinding[] => {
        return auditService.getAllFindings().filter(f => f.auditId === auditId);
    },

    saveFinding: (finding: AuditFinding) => {
        const findings = auditService.getAllFindings();
        const index = findings.findIndex(f => f.id === finding.id);
        const isNew = index < 0;

        const normalizedFinding = normalizeFinding(finding);

        if (index >= 0) {
            findings[index] = normalizedFinding;
        } else {
            findings.push(normalizedFinding);
        }
        localStorage.setItem(KEYS.FINDINGS, JSON.stringify(findings));

        if (isNew) {
            activityService.log({
                type: 'FINDING_ADDED',
                message: `Finding added to Audit ${normalizedFinding.auditId}`,
                entityType: 'Finding',
                entityName: normalizedFinding.title,
                location: normalizedFinding.location
            });
        }

        window.dispatchEvent(new Event('storage'));
        return normalizedFinding;
    },

    generateDemoFindings: (audit: Audit) => {
        const findings: AuditFinding[] = [];
        const count = Math.floor(Math.random() * 5) + 3; // 3 to 7 findings

        const ratings: ('Major' | 'Minor' | 'OFI')[] = ['Major', 'Minor', 'OFI'];
        const statuses: Step[] = ['PLAN', 'DO', 'CHECK', 'ACT'];
        const causes = ['Human Error', 'Process Gap', 'Documentation', 'Training', 'Equipment'];
        const responsibles = ['Sophia Mayer', 'Felix Worker', 'QA Lead', 'Safety Officer'];

        for (let i = 0; i < count; i++) {
            const rating = ratings[Math.floor(Math.random() * ratings.length)];
            // Bias status based on rating for realism
            let status = statuses[Math.floor(Math.random() * statuses.length)];

            const finding: AuditFinding = {
                id: `F-${audit.id.split('-')[1] || 'DEMO'}-${Math.floor(Math.random() * 1000)}`,
                title: `Demo Finding: ${rating} Issue in ${audit.location}`,
                rating: rating,
                location: audit.location,
                responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
                assigned: 'System',
                status: status,
                deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
                cause: causes[Math.floor(Math.random() * causes.length)],
                auditId: audit.id,
                auditName: audit.name,
                auditType: audit.type,
                createdAt: new Date().toISOString()
            };
            findings.push(finding);
            auditService.saveFinding(finding);
        }
        return findings;
    },

    resetData: () => {
        localStorage.removeItem(KEYS.AUDITS);
        localStorage.removeItem(KEYS.FINDINGS);
        window.location.reload();
    }
};
