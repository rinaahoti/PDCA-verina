import { User, Topic, ToDo } from '../types';

export const initialData = {
    users: [
        { id: 'u1', name: 'Dr. Elena Rossi', email: 'elena.rossi@hospital.ch', role: 'ADMIN' as const, avatar: '👩‍⚕️', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u2', name: 'Dr. Marcus Weber', email: 'marcus.weber@hospital.ch', role: 'OWNER' as const, avatar: '👨‍⚕️', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u3', name: 'Sarah Johnson', email: 'sarah.johnson@hospital.ch', role: 'ASSIGNED' as const, avatar: '👩‍⚕️', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u4', name: 'Robert Miller', email: 'robert.miller@hospital.ch', role: 'ASSIGNED' as const, avatar: '👨‍💼', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u5', name: 'Dr. Julia Chen', email: 'julia.chen@hospital.ch', role: 'ASSIGNED' as const, avatar: '👩‍🔬', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u6', name: 'James Wilson', email: 'james.wilson@hospital.ch', role: 'ASSIGNED' as const, avatar: '👨‍🔬', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u7', name: 'Linda Thompson', email: 'linda.thompson@hospital.ch', role: 'VIEWER' as const, avatar: '👤', status: 'Active' as const, organizationId: 'org1' },
        { id: 'u8', name: 'Clinical Director', email: 'director@university-hospital.ch', role: 'CLIENT_ADMIN' as const, avatar: '🏢', status: 'Active' as const, organizationId: 'org1' }
    ],
    topics: [
        {
            id: 'T-001',
            title: 'Reduktion postoperativer Infektionsraten',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'PLAN' as const,
            dueDate: '2026-03-28',
            status: 'Monitoring' as const,
            category: 'Clinical' as const,
            location: 'Universitätsspital Zürich (ZH)',
            kpi: 'Infektionsrate < 0,5%',
            objective: 'Verbesserung des chirurgischen Ergebnisses und der Patientensicherheit durch Optimierung der Sterilprotokolle.',
            history: [],
            plan: {
                description: 'Die aktuelle Infektionsrate auf der chirurgischen Station B liegt bei 2,1%.',
                asIs: 'Das aktuelle Protokoll zur chirurgischen Vorbereitung ist über die Schichten hinweg inkonsistent. Die Einhaltung der Händehygiene liegt bei 75%. Die Dokumentation der Einrichtung des sterilen Feldes fehlt oft.',
                toBe: 'Standardisiertes chirurgisches Vorbereitungsprotokoll krankenhausweit implementiert. 100%ige Einhaltung der Händehygiene und digitalisierte sterile Checkliste.',
                rootCause: 'Inkonsistente Schulung für neues chirurgisches Personal und Lücken in der manuellen Dokumentation.',
                objectives: ['Digitale sterile Checkliste implementieren', 'Verpflichtende Hygiene-Nachschulung durchführen']
            },
            do: {
                checkDate: '2026-03-15',
                actions: [
                    {
                        id: 'a-demo-001',
                        title: 'Überprüfung der Sterilprotokoll-Dokumentation',
                        description: 'Audit der aktuellen Verfahren zur Einrichtung des sterilen Feldes und Identifizierung von Lücken in der Dokumentation.',
                        assignments: [
                            { userId: 'u1', userName: 'Dr. Elena Rossi', completed: false, completedAt: undefined }
                        ],
                        dueDate: '2026-02-20',
                        teamsMeeting: '2026-02-18T14:00',
                        teamsMeetingLink: 'https://teams.microsoft.com/l/meetup-join/demo',
                        status: 'Monitoring'
                    }
                ]
            },
            check: { kpis: [], kpiResults: '', effectivenessReview: '', kpiEvaluations: [] },
            act: { lessonsLearned: '' }
        },
        {
            id: 'T-002',
            title: 'Reduktion von Fehlern bei der Medikamentenabgabe',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'DO' as const,
            dueDate: '2025-01-01',
            status: 'Critical' as const,
            category: 'Patient Safety' as const,
            location: 'Genfer Universitätsspitäler (GE)',
            kpi: 'Null Hochrisiko-Medikationsfehler',
            objective: 'Standardisierung des Doppel-Check-Prozesses für die Abgabe von Hochrisiko-Medikamenten.',
            history: [],
            plan: {
                description: 'Drei Beinahe-Fehler im letzten Quartal bezüglich der Insulindosierung gemeldet.',
                asIs: 'Der aktuelle Doppel-Check-Prozess erfolgt mündlich und wird nicht konsistent aufgezeichnet. Hochrisikomedikamente werden neben Routinemedikamenten gelagert.',
                toBe: 'Barcode-gestützte Medikamentenabgabe (BCMA) in allen Stationen implementiert. Getrennte Lagerung für Hochrisikomedikamente.',
                rootCause: 'Fehlen eines automatisierten Verifizierungssystems und Verwechslungsgefahr bei der Verpackung.',
                objectives: ['BCMA-Scanner installieren', 'Lagerung für Hochrisikomedikamente neu gestalten']
            },
            do: {
                checkDate: '2025-01-10',
                actions: [
                    {
                        id: 'a1',
                        title: 'Design eines Kennzeichnungssystems für Hochrisikomedikamente',
                        description: 'Implementierung von "Tall-man"-Schrift und farbcodierten Etiketten für alle Hochrisiko-Infusionen.',
                        assignments: [{ userId: 'u3', userName: 'Sarah Johnson', completed: true }],
                        dueDate: '2025-01-02',
                        status: 'Done'
                    }
                ]
            },
            check: { kpis: [], kpiResults: '', effectivenessReview: '', kpiEvaluations: [] },
            act: { lessonsLearned: '' }
        },
        {
            id: 'T-003',
            title: 'Einhaltung des Sturzpräventionsprotokolls',
            ownerId: 'u1',
            responsibleId: 'u4',
            step: 'DO' as const,
            dueDate: '2024-03-01',
            status: 'Critical' as const,
            category: 'Nursing' as const,
            kpi: '100% Einhaltung der Sturzrisikobewertung',
            objective: 'Sicherstellung, dass jeder Patient innerhalb von 2 Stunden nach der Aufnahme eine validierte Sturzrisikobewertung erhält.',
            // Audit Fields
            type: 'Audit Finding',
            rating: 'Major',
            location: 'Universitätsspital Basel (BS)',
            auditReference: 'Patientensicherheitsstandard 4.1',
            auditType: 'Internal',
            history: [],
            plan: {
                description: 'Das Audit ergab, dass bei 30 % der Aufnahmen die Sturzrisikobewertung fehlte.',
                rootCause: 'Der Aufnahmeprozess schreibt die Bewertung vor der Bettenzuweisung nicht zwingend vor.',
                objectives: ['EHR-Aufnahmevorlage aktualisieren', 'Schulung des Pflegepersonals zur Morse-Sturz-Skala']
            },
            do: { actions: [], checkDate: '' },
            check: { kpis: [], kpiResults: '', effectivenessReview: '', kpiEvaluations: [] },
            act: { lessonsLearned: '' }
        }
    ],
    todos: [
        {
            id: 'TD-001',
            title: 'Prüfprotokoll Dokumentation sterile Felder',
            topicId: 'T-001',
            topicTitle: 'Reduktion postoperativer Infektionsraten',
            step: 'PLAN' as const,
            status: 'Monitoring' as const,
            dueDate: '2026-02-15'
        },
        {
            id: 'TD-002',
            title: 'Validierung der Barcode-Scanner-Kalibrierung',
            topicId: 'T-002',
            topicTitle: 'Reduktion von Fehlern bei der Medikamentenabgabe',
            step: 'DO' as const,
            status: 'Critical' as const,
            dueDate: '2025-01-05'
        }
    ]
};

