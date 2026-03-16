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
                            { userId: 'u1', userName: 'Dr. Elena Rossi', completed: true, completedAt: '2026-03-12T09:10:00.000Z' },
                            { userId: 'u2', userName: 'Dr. Marcus Weber', completed: true, completedAt: '2026-03-12T09:35:00.000Z' },
                            { userId: 'u3', userName: 'Sarah Johnson', completed: false, completedAt: undefined },
                            { userId: 'u4', userName: 'Robert Miller', completed: true, completedAt: '2026-03-12T10:05:00.000Z' },
                            { userId: 'u5', userName: 'Dr. Julia Chen', completed: false, completedAt: undefined }
                        ],
                        comments: [
                            {
                                id: 'c-demo-001-1',
                                userId: 'u1',
                                userName: 'Dr. Elena Rossi',
                                text: 'Sterilprotokoll der Frühschicht vollständig geprüft; keine kritischen Abweichungen dokumentiert.',
                                createdAt: '2026-03-12T09:10:00.000Z'
                            },
                            {
                                id: 'c-demo-001-2',
                                userId: 'u2',
                                userName: 'Dr. Marcus Weber',
                                text: 'Die Checkliste für die sterile Vorbereitung sollte im Template stärker hervorgehoben werden.',
                                createdAt: '2026-03-12T09:35:00.000Z'
                            },
                            {
                                id: 'c-demo-001-3',
                                userId: 'u3',
                                userName: 'Sarah Johnson',
                                text: 'In der Spätschicht fehlt noch eine einheitliche Dokumentation der Materialfreigabe.',
                                createdAt: '2026-03-12T09:50:00.000Z'
                            },
                            {
                                id: 'c-demo-001-4',
                                userId: 'u4',
                                userName: 'Robert Miller',
                                text: 'Audit auf Station B abgeschlossen; das Team wünscht eine kürzere Version der Dokumentationsmaske.',
                                createdAt: '2026-03-12T10:05:00.000Z'
                            },
                            {
                                id: 'c-demo-001-5',
                                userId: 'u5',
                                userName: 'Dr. Julia Chen',
                                text: 'Ich schlage vor, die Freigabe des sterilen Feldes zusätzlich mit Zeitstempel zu erfassen.',
                                createdAt: '2026-03-12T10:20:00.000Z'
                            }
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
        },
        {
            id: 'T-910',
            title: 'Visitenprotokoll standardisieren',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'DO' as const,
            dueDate: '2026-04-18',
            status: 'Monitoring' as const,
            category: 'Clinical' as const,
            location: 'Universitätsspital Zürich (ZH)',
            kpi: '100% dokumentierte Visiten',
            objective: 'Standardisierte Dokumentation aller interdisziplinären Visiten.',
            history: [],
            plan: {
                description: 'Unterschiedliche Dokumentationsqualität zwischen den Stationen.',
                asIs: 'Visiten werden durchgeführt, aber Inhalte werden uneinheitlich dokumentiert.',
                toBe: 'Ein einheitliches Visitenprotokoll ist auf allen Stationen aktiv.',
                rootCause: 'Kein verbindliches Template und unterschiedliche Übergabepraxis.',
                objectives: ['Visiten-Template definieren', 'Stationsleitungen briefen']
            },
            do: {
                checkDate: '2026-04-20',
                actions: [
                    {
                        id: 'a-demo-910',
                        title: 'Template für Visitenbericht testen',
                        description: 'Pilotierung des neuen Templates auf Station A und B.',
                        comments: [
                            {
                                id: 'c-demo-910-1',
                                userId: 'u1',
                                userName: 'Dr. Elena Rossi',
                                text: 'Pilot auf zwei Stationen durchgeführt; Rückmeldungen der Teams sind dokumentiert.',
                                createdAt: '2026-03-12T10:30:00.000Z'
                            },
                            {
                                id: 'c-demo-910-2',
                                userId: 'u2',
                                userName: 'Dr. Marcus Weber',
                                text: 'Bitte Rückmeldung aus Station B noch in die finale Version übernehmen.',
                                createdAt: '2026-03-12T12:00:00.000Z'
                            },
                            {
                                id: 'c-demo-910-3',
                                userId: 'u3',
                                userName: 'Sarah Johnson',
                                text: 'Die Pflege dokumentiert schneller, wenn die Freitextfelder reduziert werden.',
                                createdAt: '2026-03-12T12:25:00.000Z'
                            },
                            {
                                id: 'c-demo-910-4',
                                userId: 'u4',
                                userName: 'Robert Miller',
                                text: 'Stationsleitung A hat das Template freigegeben; Schulung der Nachtschicht steht noch aus.',
                                createdAt: '2026-03-12T12:40:00.000Z'
                            },
                            {
                                id: 'c-demo-910-5',
                                userId: 'u5',
                                userName: 'Dr. Julia Chen',
                                text: 'Die medizinischen Pflichtfelder sind aus meiner Sicht vollständig abgedeckt.',
                                createdAt: '2026-03-12T13:05:00.000Z'
                            }
                        ],
                        assignments: [
                            { userId: 'u1', userName: 'Dr. Elena Rossi', completed: true, completedAt: '2026-03-12T10:30:00.000Z' },
                            { userId: 'u2', userName: 'Dr. Marcus Weber', completed: true, completedAt: '2026-03-12T12:00:00.000Z' },
                            { userId: 'u3', userName: 'Sarah Johnson', completed: false, completedAt: undefined },
                            { userId: 'u4', userName: 'Robert Miller', completed: true, completedAt: '2026-03-12T12:40:00.000Z' },
                            { userId: 'u5', userName: 'Dr. Julia Chen', completed: false, completedAt: undefined }
                        ],
                        dueDate: '2026-04-10',
                        teamsMeeting: '2026-04-08T14:00'
                    }
                ]
            },
            check: { kpis: [], kpiResults: '', effectivenessReview: '', kpiEvaluations: [] },
            act: { lessonsLearned: '' }
        },
        {
            id: 'T-911',
            title: 'Labor-Freigabeprozess vereinheitlichen',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'CHECK' as const,
            dueDate: '2026-04-25',
            status: 'Warning' as const,
            category: 'Quality' as const,
            location: 'Universitätsspital Basel (BS)',
            kpi: '95% Freigaben unter 30 Minuten',
            objective: 'Schnellere und nachvollziehbare Laborfreigaben.',
            history: [],
            plan: {
                description: 'Freigaben dauern je nach Schicht unterschiedlich lang.',
                asIs: 'Manuelle Freigaben und uneinheitliche Eskalationen.',
                toBe: 'Klare Freigabekette mit dokumentierten Verantwortlichkeiten.',
                rootCause: 'Unklare Rollenverteilung und fehlende Eskalationsschritte.',
                objectives: ['Freigabekette definieren', 'Schichtleitung schulen']
            },
            do: {
                checkDate: '2026-04-18',
                actions: [
                    {
                        id: 'a-demo-911',
                        title: 'Eskalationsmatrix im Labor einführen',
                        description: 'Neue Eskalationsstufen und Verantwortliche im Laborbetrieb testen.',
                        comments: [
                            {
                                id: 'c-demo-911-1',
                                userId: 'u1',
                                userName: 'Dr. Elena Rossi',
                                text: 'Eskalationsmatrix wurde eine Woche getestet; Nachtschicht meldete bessere Transparenz.',
                                createdAt: '2026-03-11T08:15:00.000Z'
                            },
                            {
                                id: 'c-demo-911-2',
                                userId: 'u2',
                                userName: 'Dr. Marcus Weber',
                                text: 'Die Rolle der Laborleitung in Stufe 3 sollte im Ablaufdiagramm klarer formuliert werden.',
                                createdAt: '2026-03-11T08:40:00.000Z'
                            },
                            {
                                id: 'c-demo-911-3',
                                userId: 'u3',
                                userName: 'Sarah Johnson',
                                text: 'Für Wochenenddienste brauchen wir noch eine kompaktere Eskalationsübersicht am Arbeitsplatz.',
                                createdAt: '2026-03-11T09:05:00.000Z'
                            },
                            {
                                id: 'c-demo-911-4',
                                userId: 'u4',
                                userName: 'Robert Miller',
                                text: 'Die Rückfragen zwischen Labor und Station sind seit dem Test deutlich zurückgegangen.',
                                createdAt: '2026-03-11T09:20:00.000Z'
                            },
                            {
                                id: 'c-demo-911-5',
                                userId: 'u5',
                                userName: 'Dr. Julia Chen',
                                text: 'Aus ärztlicher Sicht ist die neue Eskalationskette nachvollziehbar und ausreichend schnell.',
                                createdAt: '2026-03-11T09:35:00.000Z'
                            }
                        ],
                        assignments: [
                            { userId: 'u1', userName: 'Dr. Elena Rossi', completed: true, completedAt: '2026-03-11T08:15:00.000Z' },
                            { userId: 'u2', userName: 'Dr. Marcus Weber', completed: true, completedAt: '2026-03-11T08:40:00.000Z' },
                            { userId: 'u3', userName: 'Sarah Johnson', completed: false, completedAt: undefined },
                            { userId: 'u4', userName: 'Robert Miller', completed: true, completedAt: '2026-03-11T09:20:00.000Z' },
                            { userId: 'u5', userName: 'Dr. Julia Chen', completed: true, completedAt: '2026-03-11T09:35:00.000Z' }
                        ],
                        dueDate: '2026-04-12',
                        teamsMeeting: '2026-04-11T09:00'
                    }
                ]
            },
            check: { kpis: [], kpiResults: '', effectivenessReview: 'Erste Ergebnisse zeigen weniger Rückfragen pro Schicht.', kpiEvaluations: [] },
            act: { lessonsLearned: '' }
        },
        {
            id: 'T-912',
            title: 'OP-Checkliste digital ausrollen',
            ownerId: 'u1',
            responsibleId: 'u2',
            step: 'ACT' as const,
            dueDate: '2026-05-02',
            status: 'Monitoring' as const,
            category: 'Clinical' as const,
            location: 'Genfer Universitätsspitäler (GE)',
            kpi: '100% digitale OP-Checklisten',
            objective: 'Erfolgreiche Maßnahmen standardisieren und digital ausrollen.',
            history: [],
            plan: {
                description: 'Papierbasierte Checklisten sind fehleranfällig.',
                asIs: 'Checklisten werden händisch ausgefüllt und verspätet abgelegt.',
                toBe: 'Digitale Erfassung direkt im OP-Prozess.',
                rootCause: 'Fehlende Systemintegration und uneinheitliche Nutzung.',
                objectives: ['Digitale Vorlage finalisieren', 'Rollout auf OP-Säle planen']
            },
            do: {
                checkDate: '2026-04-22',
                actions: [
                    {
                        id: 'a-demo-912',
                        title: 'Rollout-Feedback der OP-Teams sammeln',
                        description: 'Lessons Learned und finale Anpassungen für die Standardisierung konsolidieren.',
                        comments: [
                            {
                                id: 'c-demo-912-1',
                                userId: 'u1',
                                userName: 'Dr. Elena Rossi',
                                text: 'Feedback aus drei OP-Teams konsolidiert; Standardisierungsfreigabe vorbereitet.',
                                createdAt: '2026-03-10T15:45:00.000Z'
                            },
                            {
                                id: 'c-demo-912-2',
                                userId: 'u5',
                                userName: 'Dr. Julia Chen',
                                text: 'Die finale Freigabe aus dem OP-Bereich kann aus meiner Sicht erteilt werden.',
                                createdAt: '2026-03-10T16:20:00.000Z'
                            },
                            {
                                id: 'c-demo-912-3',
                                userId: 'u2',
                                userName: 'Dr. Marcus Weber',
                                text: 'Für den Rollout sollten wir die Einführung auf zwei zusätzliche Säle vorziehen.',
                                createdAt: '2026-03-10T16:35:00.000Z'
                            },
                            {
                                id: 'c-demo-912-4',
                                userId: 'u3',
                                userName: 'Sarah Johnson',
                                text: 'Das Pflegepersonal benötigt noch eine kurze Einweisung zur mobilen Eingabe im OP.',
                                createdAt: '2026-03-10T16:50:00.000Z'
                            },
                            {
                                id: 'c-demo-912-5',
                                userId: 'u4',
                                userName: 'Robert Miller',
                                text: 'Die Lessons Learned sollten direkt in das finale Schulungsdokument übernommen werden.',
                                createdAt: '2026-03-10T17:10:00.000Z'
                            }
                        ],
                        assignments: [
                            { userId: 'u1', userName: 'Dr. Elena Rossi', completed: true, completedAt: '2026-03-10T15:45:00.000Z' },
                            { userId: 'u2', userName: 'Dr. Marcus Weber', completed: true, completedAt: '2026-03-10T16:35:00.000Z' },
                            { userId: 'u3', userName: 'Sarah Johnson', completed: false, completedAt: undefined },
                            { userId: 'u4', userName: 'Robert Miller', completed: true, completedAt: '2026-03-10T17:10:00.000Z' },
                            { userId: 'u5', userName: 'Dr. Julia Chen', completed: true, completedAt: '2026-03-10T16:20:00.000Z' }
                        ],
                        dueDate: '2026-04-19',
                        teamsMeeting: '2026-04-18T13:30'
                    }
                ]
            },
            check: { kpis: [], kpiResults: '', effectivenessReview: 'Digitale Nutzung wurde in allen Pilotbereichen bestätigt.', kpiEvaluations: [] },
            act: { lessonsLearned: 'Frühe Einbindung der OP-Leitungen verkürzt den Rollout deutlich.' }
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

