import { Audit, AuditFinding } from '../types';

export const MOCK_AUDITS: Audit[] = [
    {
        id: 'AUD-2026-001',
        name: 'Joint Commission Hospital Accreditation',
        type: 'Certification',
        location: 'University Hospital Zurich (ZH)',
        startDate: '2026-03-10',
        endDate: '2026-03-12',
        auditor: 'TJC Survey Team',
        status: 'Completed'
    },
    {
        id: 'AUD-2026-002',
        name: 'Annual Clinical Safety Audit',
        type: 'Internal',
        location: 'Geneva University Hospitals (GE)',
        startDate: '2026-04-05',
        endDate: '2026-04-06',
        auditor: 'Internal Quality Team',
        status: 'In Progress'
    },
    {
        id: 'AUD-2026-003',
        name: 'Pharmacy Compliance Review',
        type: 'External',
        location: 'Inselspital Bern (BE)',
        startDate: '2026-02-15',
        endDate: '2026-02-16',
        auditor: 'State Board of Pharmacy',
        status: 'Completed'
    },
    {
        id: 'AUD-2026-004',
        name: 'Infection Control Site Visit',
        type: 'Process',
        location: 'University Hospital Basel (BS)',
        startDate: '2026-05-20',
        endDate: '2026-05-25',
        auditor: 'CDC External Consultant',
        status: 'Planned'
    },
    {
        id: 'AUD-2026-005',
        name: 'Pediatric Care Quality Review',
        type: 'Patient Safety',
        location: 'CHUV Lausanne (VD)',
        startDate: '2026-01-20',
        endDate: '2026-01-22',
        auditor: 'Patient Safety Board',
        status: 'Completed'
    },
    {
        id: 'AUD-2026-006',
        name: 'Radiology Safety Compliance',
        type: 'Internal',
        location: 'University Hospital Zurich (ZH)',
        startDate: '2026-06-01',
        endDate: '2026-06-03',
        auditor: 'Radiation Safety Officer',
        status: 'Planned'
    }
];

export const MOCK_FINDINGS: AuditFinding[] = [
    // AUD-2026-001 (Joint Commission)
    { id: 'F-001', title: 'Medication reconciliation records incomplete', rating: 'Minor', location: 'University Hospital Zurich (ZH)', responsible: 'Chief of Medicine', assigned: 'Ward Manager', status: 'DO', deadline: '2026-04-15', cause: 'Workflow Gaps', auditId: 'AUD-2026-001', auditName: 'Joint Commission Hospital Accreditation', auditType: 'Certification', createdAt: '2026-03-12' },
    { id: 'F-002', title: 'Unauthorized access to EHR in Emergency Dept', rating: 'Major', location: 'University Hospital Zurich (ZH)', responsible: 'CISO (Medical)', assigned: 'IT Security', status: 'PLAN', deadline: '2026-04-01', cause: 'Protocol Breach', auditId: 'AUD-2026-001', auditName: 'Joint Commission Hospital Accreditation', auditType: 'Certification', createdAt: '2026-03-12' },
    { id: 'F-003', title: 'Hand hygiene station empty in Outpatient', rating: 'Minor', location: 'University Hospital Zurich (ZH)', responsible: 'Infection Control', assigned: 'Facility Management', status: 'CHECK', deadline: '2026-03-30', cause: 'Supply Chain Loss', auditId: 'AUD-2026-001', auditName: 'Joint Commission Hospital Accreditation', auditType: 'Certification', createdAt: '2026-03-12' },

    // AUD-2026-002 (Surgery Dept)
    { id: 'F-004', title: 'Surgical site marking not protocol-compliant', rating: 'Major', location: 'Geneva University Hospitals (GE)', responsible: 'Head of Surgery', assigned: 'Surgical Team', status: 'ACT', deadline: '2026-04-10', cause: 'Inconsistent Training', auditId: 'AUD-2026-002', auditName: 'Annual Clinical Safety Audit', auditType: 'Internal', createdAt: '2026-04-05' },
    { id: 'F-005', title: 'Missing sterile equipment timestamps', rating: 'Minor', location: 'Geneva University Hospitals (GE)', responsible: 'OR Manager', assigned: 'Sterilization Lead', status: 'DO', deadline: '2026-04-20', cause: 'Human Error', auditId: 'AUD-2026-002', auditName: 'Annual Clinical Safety Audit', auditType: 'Internal', createdAt: '2026-04-05' },
    { id: 'F-006', title: 'Optimize patient recovery room flow', rating: 'OFI', location: 'Geneva University Hospitals (GE)', responsible: 'Clinical Director', assigned: 'Nurses Lead', status: 'PLAN', deadline: '2026-05-01', cause: 'Patient Volume', auditId: 'AUD-2026-002', auditName: 'Annual Clinical Safety Audit', auditType: 'Internal', createdAt: '2026-04-05' },
    { id: 'F-007', title: 'Expired local anesthetics in OR cabinet', rating: 'Major', location: 'Geneva University Hospitals (GE)', responsible: 'Pharmacist Lead', assigned: 'OR Nurse', status: 'DO', deadline: '2026-04-08', cause: 'Inventory Control', auditId: 'AUD-2026-002', auditName: 'Annual Clinical Safety Audit', auditType: 'Internal', createdAt: '2026-04-05' },

    // AUD-2026-003 (Pharmacy)
    { id: 'F-008', title: 'Controlled substance log discrepancy', rating: 'Major', location: 'Inselspital Bern (BE)', responsible: 'Pharmacy Director', assigned: 'Lead Pharmacist', status: 'ACT', deadline: '2026-03-01', cause: 'Accountability Gap', auditId: 'AUD-2026-003', auditName: 'Pharmacy Compliance Review', auditType: 'External', createdAt: '2026-02-16' },
    { id: 'F-009', title: 'Medication fridge temperature log missing', rating: 'Minor', location: 'Inselspital Bern (BE)', responsible: 'Pharmacy Director', assigned: 'Pharmacy Tech', status: 'CHECK', deadline: '2026-03-15', cause: 'System Fault', auditId: 'AUD-2026-003', auditName: 'Pharmacy Compliance Review', auditType: 'External', createdAt: '2026-02-16' },

    // AUD-2026-005 (Pediatrics)
    { id: 'F-010', title: 'Pediatric crash cart missing list items', rating: 'Minor', location: 'CHUV Lausanne (VD)', responsible: 'Pediatric Lead', assigned: 'Ward Nurse', status: 'ACT', deadline: '2026-02-01', cause: 'Usage Overload', auditId: 'AUD-2026-005', auditName: 'Pediatric Care Quality Review', auditType: 'Patient Safety', createdAt: '2026-01-22' },
    { id: 'F-011', title: 'Patient wristband mismatch in ward 4B', rating: 'Major', location: 'CHUV Lausanne (VD)', responsible: 'Nursing Director', assigned: 'Charge Nurse', status: 'ACT', deadline: '2026-02-10', cause: 'Admissions Error', auditId: 'AUD-2026-005', auditName: 'Pediatric Care Quality Review', auditType: 'Patient Safety', createdAt: '2026-01-22' },

    // Generic
    { id: 'F-012', title: 'Noise levels over 60dB in NICU', rating: 'OFI', location: 'University Hospital Basel (BS)', responsible: 'NICU Lead', assigned: 'Facility Management', status: 'PLAN', deadline: '2026-07-01', cause: 'Equipment Vibration', auditId: 'AUD-2026-006', auditName: 'Radiology Safety Compliance', auditType: 'Internal', createdAt: '2026-01-10' },
    { id: 'F-013', title: 'Patient consent forms lack signatures', rating: 'Minor', location: 'University Hospital Zurich (ZH)', responsible: 'Legal Counsel', assigned: 'Admin Staff', status: 'CHECK', deadline: '2026-03-01', cause: 'Human Error', auditId: 'AUD-2026-001', auditName: 'Joint Commission Hospital Accreditation', auditType: 'Certification', createdAt: '2026-01-15' },
    { id: 'F-014', title: 'Critical labs not communicated in 30min', rating: 'Major', location: 'University Hospital Basel (BS)', responsible: 'Chief Medical Officer', assigned: 'Lab Director', status: 'DO', deadline: '2026-02-28', cause: 'Comm Breakdown', auditId: 'AUD-2026-004', auditName: 'Infection Control Site Visit', auditType: 'Process', createdAt: '2026-02-20' },
    { id: 'F-015', title: 'Isolation protocol breach in ICU', rating: 'Major', location: 'University Hospital Basel (BS)', responsible: 'Dr. Julia Chen', assigned: 'ICU Staff', status: 'PLAN', deadline: '2026-03-10', cause: 'Lack of PPE Train', auditId: 'AUD-2026-004', auditName: 'Infection Control Site Visit', auditType: 'Process', createdAt: '2026-02-20' },
    { id: 'F-016', title: 'Incomplete blood transfusion logs', rating: 'Minor', location: 'University Hospital Basel (BS)', responsible: 'Chief Medical Officer', assigned: 'Hematology Lead', status: 'ACT', deadline: '2026-03-01', cause: 'Documentation Load', auditId: 'AUD-2026-004', auditName: 'Infection Control Site Visit', auditType: 'Process', createdAt: '2026-02-20' },
    { id: 'F-017', title: 'Biohazard waste bins overflowing', rating: 'Major', location: 'University Hospital Zurich (ZH)', responsible: 'Infection Control', assigned: 'Housekeeping', status: 'DO', deadline: '2026-06-15', cause: 'Scheduling Gap', auditId: 'AUD-2026-006', auditName: 'Radiology Safety Compliance', auditType: 'Internal', createdAt: '2026-01-10' },
    { id: 'F-018', title: 'Radiation shield door sensor faulty', rating: 'Minor', location: 'University Hospital Zurich (ZH)', responsible: 'Radiation Safety', assigned: 'Maintenance', status: 'PLAN', deadline: '2026-06-20', cause: 'Mechanical Wear', auditId: 'AUD-2026-006', auditName: 'Radiology Safety Compliance', auditType: 'Internal', createdAt: '2026-01-10' },
    { id: 'F-019', title: 'Emergency call button non-responsive in 2C', rating: 'Minor', location: 'University Hospital Zurich (ZH)', responsible: 'Nursing Lead', assigned: 'Electrician', status: 'ACT', deadline: '2026-02-15', cause: 'Technical Fault', auditId: 'AUD-2026-001', auditName: 'Joint Commission Hospital Accreditation', auditType: 'Certification', createdAt: '2026-03-12' },
    { id: 'F-020', title: 'Medicine cabinet left unlocked in ICU', rating: 'Major', location: 'University Hospital Zurich (ZH)', responsible: 'Charge Nurse', assigned: 'ICU Team', status: 'DO', deadline: '2026-02-25', cause: 'Human Error', auditId: 'AUD-2026-004', auditName: 'Infection Control Site Visit', auditType: 'Process', createdAt: '2026-02-20' }
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

