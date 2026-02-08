import { Audit, AuditFinding, Step } from '../types';
import { MOCK_AUDITS, MOCK_FINDINGS } from '../data/mock_audits';
import { activityService } from './activityService';

const KEYS = {
    AUDITS: 'mso_v6_audits',
    FINDINGS: 'mso_v6_audit_findings'
};

export const auditService = {
    init: () => {
        if (!localStorage.getItem(KEYS.AUDITS)) {
            localStorage.setItem(KEYS.AUDITS, JSON.stringify(MOCK_AUDITS));
        }
        if (!localStorage.getItem(KEYS.FINDINGS)) {
            localStorage.setItem(KEYS.FINDINGS, JSON.stringify(MOCK_FINDINGS));
        }
    },

    getAllAudits: (): Audit[] => {
        auditService.init();
        return JSON.parse(localStorage.getItem(KEYS.AUDITS) || '[]');
    },

    getAuditById: (id: string): Audit | undefined => {
        return auditService.getAllAudits().find(a => a.id === id);
    },

    saveAudit: (audit: Audit) => {
        const audits = auditService.getAllAudits();
        const index = audits.findIndex(a => a.id === audit.id);
        const isNew = index < 0;
        const oldStatus = !isNew ? audits[index].status : null;

        if (index >= 0) {
            audits[index] = audit;
        } else {
            audits.push(audit);
        }
        localStorage.setItem(KEYS.AUDITS, JSON.stringify(audits));

        if (isNew) {
            activityService.log({
                type: 'AUDIT_CREATED',
                message: `Audit ${audit.id} created`,
                entityType: 'Audit',
                entityName: audit.id,
                location: audit.location
            });
        } else if (oldStatus !== audit.status) {
            activityService.log({
                type: 'AUDIT_STATUS_CHANGED',
                message: `Audit ${audit.id} status changed to ${audit.status}`,
                entityType: 'Audit',
                entityName: audit.id,
                location: audit.location
            });
        }

        // Dispatch storage event to notify other tabs/components
        window.dispatchEvent(new Event('storage'));
        return audit;
    },

    getAllFindings: (): AuditFinding[] => {
        auditService.init();
        return JSON.parse(localStorage.getItem(KEYS.FINDINGS) || '[]');
    },

    getFindingsByAudit: (auditId: string): AuditFinding[] => {
        return auditService.getAllFindings().filter(f => f.auditId === auditId);
    },

    saveFinding: (finding: AuditFinding) => {
        const findings = auditService.getAllFindings();
        const index = findings.findIndex(f => f.id === finding.id);
        const isNew = index < 0;

        if (index >= 0) {
            findings[index] = finding;
        } else {
            findings.push(finding);
        }
        localStorage.setItem(KEYS.FINDINGS, JSON.stringify(findings));

        if (isNew) {
            activityService.log({
                type: 'FINDING_ADDED',
                message: `Finding added to Audit ${finding.auditId}`,
                entityType: 'Finding',
                entityName: finding.title,
                location: finding.location
            });
        }

        window.dispatchEvent(new Event('storage'));
        return finding;
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
