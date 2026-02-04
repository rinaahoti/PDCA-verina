import { Audit, AuditFinding } from '../types';

export const MOCK_AUDITS: Audit[] = [
    {
        id: 'AUD-2024-001',
        name: 'ISO 9001:2015 Surveillance Audit',
        type: 'Certification',
        location: 'HQ Munich',
        startDate: '2024-03-10',
        endDate: '2024-03-12',
        auditor: 'TÜV Süd',
        status: 'Completed'
    },
    {
        id: 'AUD-2024-002',
        name: 'Internal Safety Audit (ISO 45001)',
        type: 'Internal',
        location: 'Plant Berlin',
        startDate: '2024-04-05',
        endDate: '2024-04-06',
        auditor: 'Internal QM Team',
        status: 'In Progress'
    },
    {
        id: 'AUD-2024-003',
        name: 'Supplier Quality Audit: TechParts GmbH',
        type: 'External',
        location: 'Hamburg',
        startDate: '2024-02-15',
        endDate: '2024-02-16',
        auditor: 'Sophia Mayer',
        status: 'Completed'
    },
    {
        id: 'AUD-2024-004',
        name: 'IT Security Audit (ISO 27001)',
        type: 'Process',
        location: 'Remote / HQ',
        startDate: '2024-05-20',
        endDate: '2024-05-25',
        auditor: 'CyberSec Consult',
        status: 'Planned'
    },
    {
        id: 'AUD-2024-005',
        name: 'Customer Audit: Automotive Inc.',
        type: 'Customer',
        location: 'Plant Berlin',
        startDate: '2024-01-20',
        endDate: '2024-01-22',
        auditor: 'Automotive Inc. QA',
        status: 'Completed'
    },
    {
        id: 'AUD-2024-006',
        name: 'Environmental Compliance (ISO 14001)',
        type: 'Internal',
        location: 'Plant Hamburg',
        startDate: '2024-06-01',
        endDate: '2024-06-03',
        auditor: 'Green Officer',
        status: 'Planned'
    }
];

export const MOCK_FINDINGS: AuditFinding[] = [
    // AUD-2024-001 (ISO 9001 - HQ Munich)
    { id: 'F-001', title: 'Document control procedure outdated', rating: 'Minor', location: 'HQ Munich', responsible: 'QM Lead', assigned: 'Doc Controller', status: 'DO', deadline: '2024-04-15', cause: 'Process Change', auditId: 'AUD-2024-001', auditName: 'ISO 9001:2015 Surveillance Audit', auditType: 'Certification', createdAt: '2024-03-12' },
    { id: 'F-002', title: 'Management Review missing inputs', rating: 'Major', location: 'HQ Munich', responsible: 'CEO', assigned: 'QM Lead', status: 'PLAN', deadline: '2024-04-01', cause: 'Oversight', auditId: 'AUD-2024-001', auditName: 'ISO 9001:2015 Surveillance Audit', auditType: 'Certification', createdAt: '2024-03-12' },
    { id: 'F-003', title: 'Training records incomplete for new hires', rating: 'Minor', location: 'HQ Munich', responsible: 'HR Director', assigned: 'HR Admin', status: 'CHECK', deadline: '2024-03-30', cause: 'Resource Shortage', auditId: 'AUD-2024-001', auditName: 'ISO 9001:2015 Surveillance Audit', auditType: 'Certification', createdAt: '2024-03-12' },

    // AUD-2024-002 (ISO 45001 - Berlin)
    { id: 'F-004', title: 'Emergency exit blocked in Warehouse', rating: 'Major', location: 'Plant Berlin', responsible: 'Plant Mgr', assigned: 'Safety Officer', status: 'ACT', deadline: '2024-04-10', cause: 'Behavioral', auditId: 'AUD-2024-002', auditName: 'Internal Safety Audit (ISO 45001)', auditType: 'Internal', createdAt: '2024-04-05' },
    { id: 'F-005', title: 'PPE signage missing in chemical area', rating: 'Minor', location: 'Plant Berlin', responsible: 'Safety Officer', assigned: 'Facility Mgr', status: 'DO', deadline: '2024-04-20', cause: 'Maintenance', auditId: 'AUD-2024-002', auditName: 'Internal Safety Audit (ISO 45001)', auditType: 'Internal', createdAt: '2024-04-05' },
    { id: 'F-006', title: 'Improve lighting in assembly line', rating: 'OFI', location: 'Plant Berlin', responsible: 'Plant Mgr', assigned: 'Maintenance', status: 'PLAN', deadline: '2024-05-01', cause: 'Optimization', auditId: 'AUD-2024-002', auditName: 'Internal Safety Audit (ISO 45001)', auditType: 'Internal', createdAt: '2024-04-05' },
    { id: 'F-007', title: 'First aid kits expired', rating: 'Major', location: 'Plant Berlin', responsible: 'Safety Officer', assigned: 'Health Rep', status: 'DO', deadline: '2024-04-08', cause: 'Supplier Issue', auditId: 'AUD-2024-002', auditName: 'Internal Safety Audit (ISO 45001)', auditType: 'Internal', createdAt: '2024-04-05' },

    // AUD-2024-003 (Supplier - Hamburg)
    { id: 'F-008', title: 'CoC missing for raw material X', rating: 'Major', location: 'Hamburg', responsible: 'Purchasing', assigned: 'Buyer A', status: 'ACT', deadline: '2024-03-01', cause: 'Supplier Compliance', auditId: 'AUD-2024-003', auditName: 'Supplier Quality Audit: TechParts GmbH', auditType: 'External', createdAt: '2024-02-16' },
    { id: 'F-009', title: 'Delay in response to complaints', rating: 'Minor', location: 'Hamburg', responsible: 'Purchasing', assigned: 'Buyer B', status: 'CHECK', deadline: '2024-03-15', cause: 'Communication', auditId: 'AUD-2024-003', auditName: 'Supplier Quality Audit: TechParts GmbH', auditType: 'External', createdAt: '2024-02-16' },

    // AUD-2024-005 (Customer - Berlin)
    { id: 'F-010', title: 'Calibration sticker missing on tool #44', rating: 'Minor', location: 'Plant Berlin', responsible: 'QA Mgr', assigned: 'Metrologist', status: 'ACT', deadline: '2024-02-01', cause: 'Human Error', auditId: 'AUD-2024-005', auditName: 'Customer Audit: Automotive Inc.', auditType: 'Customer', createdAt: '2024-01-22' },
    { id: 'F-011', title: 'Traceability gap in Lot #992', rating: 'Major', location: 'Plant Berlin', responsible: 'Prod Mgr', assigned: 'Supervisor', status: 'ACT', deadline: '2024-02-10', cause: 'System Error', auditId: 'AUD-2024-005', auditName: 'Customer Audit: Automotive Inc.', auditType: 'Customer', createdAt: '2024-01-22' },

    // Generic / Unassigned to specific mock audit for volume
    { id: 'F-012', title: 'Noise level high in sector C', rating: 'OFI', location: 'Plant Hamburg', responsible: 'Facility Mgr', assigned: 'External Consultant', status: 'PLAN', deadline: '2024-07-01', cause: 'Equipment Aging', auditId: 'AUD-2024-006', auditName: 'Environmental Compliance (ISO 14001)', auditType: 'Internal', createdAt: '2024-01-10' },
    { id: 'F-013', title: 'Visitor logbook not GDPR compliant', rating: 'Minor', location: 'HQ Munich', responsible: 'DPO', assigned: 'Reception', status: 'CHECK', deadline: '2024-03-01', cause: 'Regulation', auditId: 'AUD-2024-001', auditName: 'ISO 9001:2015 Surveillance Audit', auditType: 'Certification', createdAt: '2024-01-15' },
    { id: 'F-014', title: 'Update firewall rules', rating: 'Major', location: 'Remote / HQ', responsible: 'CISO', assigned: 'NetAdmin', status: 'DO', deadline: '2024-02-28', cause: 'Security Policy', auditId: 'AUD-2024-004', auditName: 'IT Security Audit (ISO 27001)', auditType: 'Process', createdAt: '2024-02-20' },
    { id: 'F-015', title: 'Backup restore test failed', rating: 'Major', location: 'Remote / HQ', responsible: 'IT Ops', assigned: 'SysAdmin', status: 'PLAN', deadline: '2024-03-10', cause: 'Configuration', auditId: 'AUD-2024-004', auditName: 'IT Security Audit (ISO 27001)', auditType: 'Process', createdAt: '2024-02-20' },
    { id: 'F-016', title: 'Password policy not enforced', rating: 'Minor', location: 'Remote / HQ', responsible: 'CISO', assigned: 'Helpdesk', status: 'ACT', deadline: '2024-03-01', cause: 'Config Drift', auditId: 'AUD-2024-004', auditName: 'IT Security Audit (ISO 27001)', auditType: 'Process', createdAt: '2024-02-20' },
    { id: 'F-017', title: 'Chemical spill kit empty', rating: 'Major', location: 'Plant Hamburg', responsible: 'Safety Officer', assigned: 'Warehouse', status: 'DO', deadline: '2024-06-15', cause: 'Usage', auditId: 'AUD-2024-006', auditName: 'Environmental Compliance (ISO 14001)', auditType: 'Internal', createdAt: '2024-01-10' },
    { id: 'F-018', title: 'Energy consumption metering faulty', rating: 'Minor', location: 'Plant Hamburg', responsible: 'Facility Mgr', assigned: 'Electrician', status: 'PLAN', deadline: '2024-06-20', cause: 'Maintenance', auditId: 'AUD-2024-006', auditName: 'Environmental Compliance (ISO 14001)', auditType: 'Internal', createdAt: '2024-01-10' },
    { id: 'F-019', title: 'Customer complaint logged late', rating: 'Minor', location: 'HQ Munich', responsible: 'CS Mgr', assigned: 'Agent', status: 'ACT', deadline: '2024-02-15', cause: 'Training', auditId: 'AUD-2024-001', auditName: 'ISO 9001:2015 Surveillance Audit', auditType: 'Certification', createdAt: '2024-03-12' },
    { id: 'F-020', title: 'Server room door unlocked', rating: 'Major', location: 'HQ Munich', responsible: 'Security', assigned: 'Guard', status: 'DO', deadline: '2024-02-25', cause: 'Human Error', auditId: 'AUD-2024-004', auditName: 'IT Security Audit (ISO 27001)', auditType: 'Process', createdAt: '2024-02-20' }
];

// Helper to calculate findings for an audit
export const getAuditStats = (auditId: string) => {
    const findings = MOCK_FINDINGS.filter(f => f.auditId === auditId);
    return {
        major: findings.filter(f => f.rating === 'Major').length,
        minor: findings.filter(f => f.rating === 'Minor').length,
        ofi: findings.filter(f => f.rating === 'OFI').length,
        total: findings.length,
        open: findings.filter(f => f.status !== 'ACT').length,
        closed: findings.filter(f => f.status === 'ACT').length
    };
};
