import jsPDF from 'jspdf';
import { Topic } from '../types';
import i18n from '../i18n';

const getPdfLanguage = (): 'en' | 'de' => {
    const current = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
    return current.startsWith('de') ? 'de' : 'en';
};

const translatePdfText = (input: string): string => {
    if (getPdfLanguage() !== 'de' || !input) return input;

    const replacements: Array<[string, string]> = [
        ['PDCA Plan Protocol', 'PDCA Plan-Protokoll'],
        ['Plan Phase Meeting', 'PLAN-Phasen-Meeting'],
        ['Check Phase Activation', 'Check-Phase Aktivierung'],
        ['CHECK Phase Meeting', 'CHECK-Phasen-Meeting'],
        ['CHECK PHASE', 'CHECK-PHASE'],
        ['DO PHASE', 'DO-PHASE'],
        ['ACT PHASE', 'ACT-PHASE'],
        ['Plan Phase', 'Plan-Phase'],
        ['Do Phase', 'Do-Phase'],
        ['Check Phase', 'Check-Phase'],
        ['Act Phase', 'Act-Phase'],
        ['Input from Check', 'Input aus CHECK'],
        ['Topic Title', 'Thementitel'],
        ['Topic', 'Thema'],
        ['Title', 'Titel'],
        ['Goal', 'Ziel'],
        ['Target Goal (From Plan)', 'Zielvorgabe (aus PLAN)'],
        ['Meeting Title', 'Besprechungstitel'],
        ['Internal Participants', 'Interne Teilnehmende'],
        ['External Participants', 'Externe Teilnehmende'],
        ['Plan Data', 'Planungsdaten'],
        ['Root Cause', 'Hauptursache'],
        ['Improvement Purpose', 'Verbesserungszweck'],
        ['Location & Department', 'Standort & Betriebe'],
        ['Locations', 'Standorte'],
        ['Departments', 'Betriebe'],
        ['Status', 'Status'],
        ['Meeting Type', 'Sitzungstyp'],
        ['Responsible Person', 'Verantwortliche Person'],
        ['Responsible Persons', 'VERANTWORTLICHE PERSONEN'],
        ['Meeting Date & Time', 'Sitzungstermin'],
        ['Office / Location', 'BÃ¼ro / Standort'],
        ['Online Meeting Link', 'Online-Meeting-Link'],
        ['External Users', 'Externe Benutzer'],
        ['AS-IS - Current State', 'AS-IS - Ist-Zustand'],
        ['TO-BE - Target State', 'TO-BE - Soll-Zustand'],
        ['Generated', 'Erstellt'],
        ['Page', 'Seite'],
        ['Owner', 'Besitzer'],
        ['Comments', 'Kommentare'],
        ['Action Due Date', 'Faelligkeitsdatum der Massnahme'],
        ['Check Decision & Audit', 'CHECK-Entscheidung & Audit'],
        ['Decision Outcome', 'Entscheidung'],
        ['Checked By', 'Geprueft von'],
        ['Due Date', 'FÃ¤lligkeitsdatum'],
        ['DO Phase Activation', 'DO-Phasen-Aktivierung'],
        ['Execution Summary (From DO Phase)', 'Zusammenfassung der AusfÃ¼hrung (aus DO-Phase)'],
        ['Total Actions', 'Gesamtzahl MaÃŸnahmen'],
        ['Involved Users', 'Beteiligte Benutzer'],
        ['Effectiveness Assessment', 'Wirksamkeitsbewertung'],
        ['Assessment Result', 'Bewertungsergebnis'],
        ['Assessment Description', 'Bewertungsbeschreibung'],
        ['KPI Evaluation', 'KPI-Bewertung'],
        ['Indicator', 'Indikator'],
        ['Target', 'Zielwert'],
        ['Result', 'Ergebnis'],
        ['Effectiveness Review', 'WirksamkeitsprÃ¼fung'],
        ['Review', 'PrÃ¼fung'],
        ['ACT Phase Activation', 'ACT-Phasen-Aktivierung'],
        ['DO & Execution Actions', 'DO & AusfÃ¼hrungsmaÃŸnahmen'],
        ['Description', 'Beschreibung'],
        ['Outcome Decision', 'Outcome-Entscheidung'],
        ['Decision', 'Entscheidung'],
        ['Standardization Scope', 'Standardisierungs-Umfang'],
        ['Affected Areas / Rollout', 'Betroffene Bereiche / Rollout'],
        ['Standardization Description', 'Beschreibung Standardisierung'],
        ['Lessons Learned', 'Erkenntnisse'],
        ['Key Takeaways', 'Wichtigste Erkenntnisse'],
        ['ACT Phase Confirmation & Sign-off', 'BestÃ¤tigung & Abschluss ACT-Phase'],
        ['Confirmation', 'BestÃ¤tigung'],
        ['Signed By', 'Abgeschlossen von'],
        ['Date', 'Datum'],
        ['Objective fully met. Proceed to Standardization.', 'Ziel vollstÃ¤ndig erreicht. Weiter zur Standardisierung.'],
        ['Objective partially met. Improvements needed before full standardization.', 'Ziel teilweise erreicht. Verbesserungen vor vollstÃ¤ndiger Standardisierung erforderlich.'],
        ['Objective not met. Re-planning and corrective action required.', 'Ziel nicht erreicht. Neuplanung und KorrekturmaÃŸnahmen erforderlich.'],
        ['Measure is successful. Roll out and update standards.', 'MaÃŸnahme ist erfolgreich. Rollout und Aktualisierung der Standards.'],
        ['Improve and re-run PDCA based on findings.', 'Verbessern und PDCA auf Basis der Erkenntnisse erneut durchfÃ¼hren.'],
        ['Close process without standardization.', 'Prozess ohne Standardisierung abschlieÃŸen.'],
        ['I confirm that the improvement has been standardized and documented.', 'Ich bestÃ¤tige, dass die Verbesserung standardisiert und dokumentiert wurde.'],
        ['I confirm that the PDCA will be rerun for improvements.', 'Ich bestÃ¤tige, dass der PDCA fÃ¼r Verbesserungen erneut durchgefÃ¼hrt wird.'],
        ['I confirm that the topic is ready to be closed.', 'Ich bestÃ¤tige, dass das Thema zur SchlieÃŸung bereit ist.'],
        ['Standardized', 'Standardisiert'],
        ['Re-run PDCA', 'PDCA erneut durchfÃ¼hren'],
        ['Ready to Close', 'Bereit zum AbschlieÃŸen'],
        ['Proceed to Standardization', 'Weiter zur Standardisierung'],
        ['Proceed to Improvement', 'Weiter zur Verbesserung'],
        ['Return to Re-planning', 'Zurueck zur Neuplanung'],
        ['[ ] Confirmation not provided.', '[ ] BestÃ¤tigung nicht angegeben.'],
        ['Standardize', 'Standardisieren'],
        ['Improve & Re-run PDCA', 'Verbessern & PDCA wiederholen'],
        ['Close without Standardization', 'AbschlieÃŸen ohne Standardisierung'],
        ['Effective', 'Wirksam'],
        ['Partially Effective', 'Teilweise wirksam'],
        ['Not Effective', 'Nicht wirksam'],
        ['Monitoring', 'Monitoring'],
        ['Warning', 'Warnung'],
        ['Critical', 'Kritisch'],
        ['Done', 'Abgeschlossen'],
        ['Safety-critical', 'Sicherheitskritisch'],
        ['Save time', 'Zeit sparen'],
        ['Reduce costs', 'Kosten senken'],
        ['Increase quality', 'Qualität verbessern'],
        ['Gästezufriedenheit', 'Gästezufriedenheit'],
        ['Mitarberiterzufriedenheit', 'Mitarberiterzufriedenheit'],
        ['Qualität verbessern', 'Qualität verbessern'],
        ['Process', 'Prozess'],
        ['Clinical Guide', 'Klinischer Leitfaden'],
        ['Policy', 'Richtlinie'],
        ['Checklist', 'Checkliste'],
        ['Training', 'Schulung'],
        ['EHR Configuration', 'EHR-Konfiguration'],
        ['Nursing', 'Pflege'],
        ['Surgery', 'Chirurgie'],
        ['Emergency', 'Notaufnahme'],
        ['Inpatient Ward', 'Station'],
        ['Outpatient Clinic', 'Ambulanz'],
        ['Pharmacy', 'Apotheke'],
        ['Diagnostics', 'Diagnostik'],
        ['Administration', 'Verwaltung'],
        ['Other', 'Andere'],
        ['Patient Fall Prevention Protocol Compliance', 'Einhaltung des SturzprÃ¤ventionsprotokolls'],
        ['Reduction of Post-operative Infection Rates', 'Reduktion postoperativer Infektionsraten'],
        ['Medication Administration Error Reduction', 'Reduktion von Medikationsfehlern'],
        ['Infection rate < 0.5%', 'Infektionsrate < 0,5 %'],
        ['Zero high-risk medication errors', 'Keine Hochrisiko-Medikationsfehler'],
        ['100% compliance with fall risk assessments', '100 % Einhaltung der Sturzrisikobewertungen'],
        ['Audit Sterile Field Documentation', 'Audit der Dokumentation des sterilen Feldes'],
        ['Validate Barcode Scanner Calibration', 'Validierung der Kalibrierung des Barcode-Scanners']
    ];

    // Longer entries first to avoid partial replacements.
    replacements.sort((a, b) => b[0].length - a[0].length);
    let output = input;
    replacements.forEach(([from, to]) => {
        output = output.split(from).join(to);
    });
    return output;
};

const localizePdfDoc = (doc: jsPDF) => {
    if (getPdfLanguage() !== 'de') return;

    const originalText = doc.text.bind(doc) as any;
    const originalSplit = doc.splitTextToSize.bind(doc);

    (doc as any).text = (text: string | string[], ...rest: any[]) => {
        if (Array.isArray(text)) {
            return originalText(text.map(line => translatePdfText(String(line))), ...(rest as any[]));
        }
        return originalText(translatePdfText(String(text)), ...(rest as any[]));
    };

    (doc as any).splitTextToSize = (text: string, size: number, options?: any) => {
        return originalSplit(translatePdfText(String(text)), size, options);
    };
};

const cleanValue = (value?: string): string => {
    if (!value) return '-';
    const v = value.trim();
    return v.length ? v : '-';
};

const formatLongDateUpper = (value?: string): string => {
    const locale = getPdfLanguage() === 'de' ? 'de-DE' : 'en-GB';
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString(locale).toUpperCase();
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
};

const formatLongDate = (value?: string): string => {
    const locale = getPdfLanguage() === 'de' ? 'de-DE' : 'en-GB';
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString(locale);
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDate = (value?: string): string => {
    if (!value) return 'TBD';
    const locale = getPdfLanguage() === 'de' ? 'de-DE' : 'en-GB';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(locale);
};

const formatDateTime = (value?: string): string => {
    if (!value) return 'TBD';
    const locale = getPdfLanguage() === 'de' ? 'de-DE' : 'en-GB';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const mapImprovementPurpose = (raw: string): string => {
    const dict: Record<string, string> = {
        SAFETY_CRITICAL: 'Safety-critical',
        SAVE_TIME: 'Save time',
        REDUCE_COSTS: 'Reduce costs',
        INCREASE_QUALITY: 'Increase quality',
        GUEST_SATISFACTION: 'Gästezufriedenheit',
        MITARBERITERZUFRIEDENHEIT: 'Mitarberiterzufriedenheit',
        QUALITY_VERBESSERN: 'Qualität verbessern'
    };
    return dict[raw] || raw.replace(/_/g, ' ');
};

const getActOutcomeDescription = (actOutcome: string): string => {
    if (actOutcome === 'Standardize') {
        return 'Measure is successful. Roll out and update standards.';
    }
    if (actOutcome === 'Improve & Re-run PDCA') {
        return 'Improve and re-run PDCA based on findings.';
    }
    if (actOutcome === 'Close without Standardization') {
        return 'Close process without standardization.';
    }
    return '-';
};

const getActConfirmationFields = (
    actOutcome: string,
    confirmation?: Topic['act']['actConfirmation']
) => {
    if (actOutcome === 'Standardize') {
        return [
            {
                label: 'Standardized',
                value: `${confirmation?.standardized ? '[x]' : '[ ]'} I confirm that the improvement has been standardized and documented.`
            }
        ];
    }

    if (actOutcome === 'Improve & Re-run PDCA') {
        return [
            {
                label: 'Re-run PDCA',
                value: `${confirmation?.noActionsPending ? '[x]' : '[ ]'} I confirm that the PDCA will be rerun for improvements.`
            }
        ];
    }

    if (actOutcome === 'Close without Standardization') {
        return [
            {
                label: 'Ready to Close',
                value: confirmation?.readyToClose
                    ? 'I confirm that the topic is ready to be closed.'
                    : 'Confirmation not provided.'
            }
        ];
    }

    return [
        {
            label: 'Confirmation',
            value: '[ ] Confirmation not provided.'
        }
    ];
};

const formatList = (items?: string[]): string => {
    const values = (items || []).map(item => cleanValue(item)).filter(item => item !== '-');
    return values.length ? values.join('\n') : '-';
};

const getMeetingLocationLabel = (meetingType?: string): string =>
    meetingType === 'Remote (Online)' || meetingType === 'Online'
        ? 'Online Meeting Link'
        : 'Office / Location';

const getMeetingLocationValue = (meetingType?: string, location?: string, onlineLink?: string): string =>
    cleanValue(
        meetingType === 'Remote (Online)' || meetingType === 'Online'
            ? (onlineLink || location || '')
            : (location || '')
    );

const formatExternalUsers = (externalUsers?: Array<{ fullName: string; email: string; note?: string }>): string => {
    const rows = (externalUsers || [])
        .map(user => {
            const parts = [
                user.fullName?.trim(),
                user.email?.trim() ? `<${user.email.trim()}>` : '',
                user.note?.trim() ? `| ${user.note.trim()}` : ''
            ].filter(Boolean);
            return parts.length ? `- ${parts.join(' ')}` : '';
        })
        .filter(Boolean);
    return rows.length ? rows.join('\n') : '-';
};

const formatAssignments = (assignments?: Array<{ userName: string }>): string => {
    const users = Array.from(new Set((assignments || []).map(assign => cleanValue(assign.userName)).filter(name => name !== '-')));
    return users.length ? users.join('\n') : '-';
};

const formatActionComments = (action: Topic['do']['actions'][number]): string => {
    if (action.comments && action.comments.length > 0) {
        return action.comments.map(comment => `- ${comment.userName ? `${comment.userName}: ` : ''}${cleanValue(comment.text)}`).join('\n');
    }
    if (action.comment?.trim()) {
        return `- ${action.comment.trim()}`;
    }
    return '-';
};

const getPreferredPdfSansFont = (doc: jsPDF): string => {
    const fontList = typeof (doc as any).getFontList === 'function' ? (doc as any).getFontList() : {};
    const calibriFont = Object.keys(fontList).find(fontName => fontName.toLowerCase() === 'calibri');
    return calibriFont || 'helvetica';
};

const getCheckDecisionOutcome = (effectivenessStatus?: string, explicitDecision?: string): string => {
    if (explicitDecision) return explicitDecision;
    if (effectivenessStatus === 'Effective') return 'Proceed to Standardization';
    if (effectivenessStatus === 'Partially Effective') return 'Proceed to Improvement';
    if (effectivenessStatus === 'Not Effective') return 'Return to Re-planning';
    return '-';
};

const ACT_SCOPE_MAP: Record<string, string> = {
    process: 'Process',
    clinicalGuide: 'Clinical Guide',
    policy: 'Policy',
    checklist: 'Checklist',
    training: 'Training',
    ehrConfiguration: 'EHR Configuration',
    other: 'Other',
    Process: 'Process',
    'Clinical Guide': 'Clinical Guide',
    Policy: 'Policy',
    Checklist: 'Checklist',
    Training: 'Training',
    'EHR Configuration': 'EHR Configuration',
    Other: 'Other'
};

const ACT_AREA_MAP: Record<string, string> = {
    nursing: 'Nursing',
    surgery: 'Surgery',
    emergency: 'Emergency',
    inpatientWard: 'Inpatient Ward',
    outpatientClinic: 'Outpatient Clinic',
    pharmacy: 'Pharmacy',
    diagnostics: 'Diagnostics',
    administration: 'Administration',
    other: 'Other',
    Nursing: 'Nursing',
    Surgery: 'Surgery',
    Emergency: 'Emergency',
    'Inpatient Ward': 'Inpatient Ward',
    'Outpatient Clinic': 'Outpatient Clinic',
    Pharmacy: 'Pharmacy',
    Diagnostics: 'Diagnostics',
    Administration: 'Administration',
    Other: 'Other'
};

const PHASE_TITLE_FONT_SIZE = 28;
const PHASE_TITLE_MIN_FONT_SIZE = 22;
const PHASE_SUBTITLE_FONT_SIZE = 11;

const renderExecutiveSummaryPage = (doc: jsPDF, topic: Topic, startPage = 1): number => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const leftMargin = 25.4;
    const rightMargin = 20;
    const contentW = pageW - leftMargin - rightMargin;
    const rightX = pageW - rightMargin;
    const colGap = 14;
    const halfW = (contentW - colGap) / 2;
    const headerTop = 16;
    const headerRuleY = 22;
    const footerRuleY = pageH - 14;
    const footerTextY = pageH - 8.5;
    const contentBottom = footerRuleY - 8;
    const thickRule = 2.12;
    const thinRule = 0.25;
    const darkColor: [number, number, number] = [17, 24, 39];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const tealColor: [number, number, number] = [58, 175, 160];
    const bodyColor: [number, number, number] = [55, 65, 81];
    const sansFont = getPreferredPdfSansFont(doc);

    const owner = cleanValue(topic.ownerName || topic.act?.audit?.closedBy || topic.check?.audit?.checkedBy || '');
    const refId = topic.id || 'NEW';
    const status = cleanValue(topic.status || 'Monitoring');
    const generatedDate = formatLongDate();
    const inputFromCheck = cleanValue(topic.check?.effectivenessStatus || '');
    const rawActOutcome = topic.act?.actOutcome || '';
    const actOutcome = cleanValue(rawActOutcome);
    const outcomeDescription = getActOutcomeDescription(rawActOutcome);
    const rootCause = cleanValue(topic.plan?.rootCause || '');
    const standardizationScope = (rawActOutcome === 'Standardize'
        ? (topic.act?.standardizationScope || [])
        : []).map(v => ACT_SCOPE_MAP[String(v)] || String(v));
    const affectedAreas = (rawActOutcome === 'Standardize'
        ? (topic.act?.affectedAreas || [])
        : []).map(v => ACT_AREA_MAP[String(v)] || String(v));
    const joinedScope = cleanValue(standardizationScope.length ? standardizationScope.join(' · ') : '');
    const joinedAffectedAreas = cleanValue(affectedAreas.length ? affectedAreas.join(' · ') : '');
    const standardizationDescription = cleanValue(
        rawActOutcome === 'Standardize'
            ? (topic.act?.standardizationDescription || topic.act?.standardization || '')
            : ''
    );
    const lessonsLearned = cleanValue(topic.act?.lessonsLearned || '');
    let pageNumber = startPage;

    const setFont = (style: 'normal' | 'bold') => {
        doc.setFont(sansFont, style);
    };

    const drawHeader = () => {
        setFont('bold');
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('PDCA Plan Protocol', leftMargin, headerTop);

        setFont('normal');
        doc.setFontSize(10);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(`${owner} · ${generatedDate}`, rightX, headerTop, { align: 'right' });
    };

    const drawFooter = (pageNumber: number) => {
        doc.setDrawColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.setLineWidth(thinRule);
        doc.line(leftMargin, footerRuleY, rightX, footerRuleY);

        setFont('normal');
        doc.setFontSize(10);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text('VIRENA - PDCA', leftMargin, footerTextY);
        doc.text(`Page ${pageNumber}`, rightX, footerTextY, { align: 'right' });
    };

    const sectionLabelText = (label: string) =>
        label
            .toUpperCase()
            .split('')
            .join(' ');

    const drawSectionHeader = (label: string, y: number) => {
        setFont('bold');
        doc.setFontSize(9);
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        doc.text(sectionLabelText(label), leftMargin, y);
        return y + 8;
    };

    const drawStackField = (label: string, value: string, y: number, width = contentW) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(label, leftMargin, y);

        setFont('normal');
        doc.setFontSize(11.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const valueLines = doc.splitTextToSize(cleanValue(value), width);
        const valueY = y + 5;
        doc.text(valueLines, leftMargin, valueY);
        return valueY + (valueLines.length * 5.2) + 4;
    };

    const drawTwoColumnField = (
        leftLabel: string,
        leftValue: string,
        rightLabel: string,
        rightValue: string,
        y: number
    ) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(leftLabel, leftMargin, y);
        doc.text(rightLabel, leftMargin + halfW + colGap, y);

        setFont('normal');
        doc.setFontSize(11.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const valueY = y + 5;
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), halfW);
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), halfW);
        doc.text(leftLines, leftMargin, valueY);
        doc.text(rightLines, leftMargin + halfW + colGap, valueY);
        return valueY + (Math.max(leftLines.length, rightLines.length) * 5.2) + 5;
    };

    const startNextPage = () => {
        pageNumber += 1;
        doc.addPage();
        drawHeader();
        return 34;
    };

    const ensureSpace = (currentY: number, needed: number) => {
        if (currentY + needed > contentBottom) {
            return startNextPage();
        }
        return currentY;
    };

    const estimateFieldHeight = (value: string, width = contentW) => {
        const lineCount = doc.splitTextToSize(cleanValue(value), width).length || 1;
        return 9 + (lineCount * 5.2);
    };

    const estimateTwoColumnHeight = (leftValue: string, rightValue: string) => {
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), halfW).length || 1;
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), halfW).length || 1;
        return 10 + (Math.max(leftLines, rightLines) * 5.2);
    };

    drawHeader();

    let y = 34;
    setFont('bold');
    doc.setFontSize(PHASE_TITLE_FONT_SIZE);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Executive Summary', leftMargin, y);
    y += 8;

    setFont('normal');
    doc.setFontSize(PHASE_SUBTITLE_FONT_SIZE);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const phasePrefix = 'Plan Phase · ';
    doc.text(phasePrefix, leftMargin, y);
    const phasePrefixWidth = doc.getTextWidth(phasePrefix);
    setFont('bold');
    doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.text(status, leftMargin + phasePrefixWidth, y);
    y += 8;

    doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.setLineWidth(0.9);
    doc.line(leftMargin, y, rightX, y);
    y += 10;

    y = ensureSpace(y, 36);
    y = drawSectionHeader('Process', y);
    y = drawStackField('Topic Title', cleanValue(topic.title || ''), y);
    y = drawStackField('Ref', refId, y);
    y = drawStackField('Date', generatedDate, y);

    y = ensureSpace(
        y,
        estimateFieldHeight(actOutcome) + estimateFieldHeight(status) + estimateFieldHeight(inputFromCheck) + estimateFieldHeight(outcomeDescription) + 20
    );
    y = drawSectionHeader('Outcome', y + 1);
    y = drawStackField('Decision', actOutcome, y);
    y = drawStackField('Status', status, y);
    y = drawStackField('Input from Check', inputFromCheck, y);
    y = drawStackField('Description', outcomeDescription, y);

    y = ensureSpace(y, estimateFieldHeight(rootCause) + 16);
    y = drawSectionHeader('Problem', y + 1);
    y = drawStackField('Root Cause', rootCause, y);

    y = ensureSpace(
        y,
        estimateFieldHeight(joinedScope) + estimateFieldHeight(joinedAffectedAreas) + estimateFieldHeight(standardizationDescription) + 20
    );
    y = drawSectionHeader('Actions Taken', y + 1);
    y = drawStackField('Scope', joinedScope, y);
    y = drawStackField('Rollout', joinedAffectedAreas, y);
    y = drawStackField('Description', standardizationDescription, y);

    y = ensureSpace(y, estimateTwoColumnHeight(joinedScope, joinedAffectedAreas) + 16);
    y = drawSectionHeader('Standardization', y + 1);
    y = drawTwoColumnField('Scope', joinedScope, 'Affected Areas', joinedAffectedAreas, y);

    y = ensureSpace(y, estimateFieldHeight(lessonsLearned) + 16);
    y = drawSectionHeader('Key Takeaway', y + 1);
    y = drawStackField('Lessons Learned', lessonsLearned, y);

    drawFooter(pageNumber);
    return pageNumber;
};

const renderPlanPage = (doc: jsPDF, topic: Topic, startPage = 1): number => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const leftMargin = 25.4;
    const rightMargin = 20;
    const contentW = pageW - leftMargin - rightMargin;
    const rightX = pageW - rightMargin;
    const colGap = 12;
    const colW = (contentW - colGap) / 2;
    const headerTop = 16;
    const headerRuleY = 22;
    const footerRuleY = pageH - 14;
    const footerTextY = pageH - 8.5;
    const contentBottom = footerRuleY - 8;
    const thickRule = 2.12;
    const thinRule = 0.25;
    const darkColor: [number, number, number] = [17, 24, 39];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const tealColor: [number, number, number] = [58, 175, 160];
    const bodyColor: [number, number, number] = [55, 65, 81];
    const sansFont = getPreferredPdfSansFont(doc);
    let pageNumber = startPage;

    const owner = topic.ownerName || 'Sophia Mayer';
    const refId = topic.id || 'NEW';
    const status = cleanValue(topic.status || 'Monitoring');
    const generatedDate = formatLongDate();
    const improvementPurpose = (
        topic.plan?.improvementPurpose?.length
            ? topic.plan.improvementPurpose
            : (topic.plan?.objectives || [])
    ).map(mapImprovementPurpose);

    const locations = cleanValue(topic.location || '');
    const departments = cleanValue(topic.departmentId || '');
    const planMeeting = topic.plan?.meeting;
    const planMeetingTitle = cleanValue(planMeeting?.title || '');
    const planMeetingType = cleanValue(planMeeting?.meetingType || '');
    const responsiblePersons = formatList(planMeeting?.responsiblePersons);
    const doActivationDate = cleanValue(
        planMeeting?.checkTriggerDate
            ? formatDate(planMeeting.checkTriggerDate)
            : topic.dueDate
                ? formatDate(topic.dueDate)
                : ''
    );
    const meetingDateTime = cleanValue(planMeeting?.meetingDateTime ? formatDateTime(planMeeting.meetingDateTime) : '');
    const meetingLocationLabel = getMeetingLocationLabel(planMeeting?.meetingType);
    const meetingLocationValue = getMeetingLocationValue(planMeeting?.meetingType, planMeeting?.location);
    const externalUsers = formatExternalUsers(planMeeting?.externalUsers);
    const sectionLabelText = (label: string) =>
        label
            .toUpperCase()
            .split('')
            .join(' ');

    const setFont = (style: 'normal' | 'bold') => {
        doc.setFont(sansFont, style);
    };

    const drawHeader = () => {
        setFont('bold');
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('PDCA Plan Protocol', leftMargin, headerTop);

        setFont('normal');
        doc.setFontSize(10);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(`Plan Phase · ${generatedDate}`, rightX, headerTop, { align: 'right' });
    };

    const drawFooter = (pageNumber: number) => {
        doc.setDrawColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.setLineWidth(thinRule);
        doc.line(leftMargin, footerRuleY, rightX, footerRuleY);

        setFont('normal');
        doc.setFontSize(10);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text('VIRENA - PDCA', leftMargin, footerTextY);
        doc.text(`Page ${pageNumber}`, rightX, footerTextY, { align: 'right' });
    };

    const drawSectionHeader = (label: string, y: number) => {
        setFont('bold');
        doc.setFontSize(9);
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        const trackedLabel = sectionLabelText(label);
        doc.text(trackedLabel, leftMargin, y);
        return y + 8;
    };

    const drawStackField = (label: string, value: string, y: number, width = contentW) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(label, leftMargin, y);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const valueLines = doc.splitTextToSize(cleanValue(value), width);
        const valueY = y + 5;
        doc.text(valueLines, leftMargin, valueY);
        return valueY + (valueLines.length * 5.6) + 4;
    };

    const drawTwoColumnField = (
        leftLabel: string,
        leftValue: string,
        rightLabel: string,
        rightValue: string,
        y: number
    ) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(leftLabel, leftMargin, y);
        doc.text(rightLabel, leftMargin + colW + colGap, y);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const valueY = y + 5;
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), colW);
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), colW);
        doc.text(leftLines, leftMargin, valueY);
        doc.text(rightLines, leftMargin + colW + colGap, valueY);
        return valueY + (Math.max(leftLines.length, rightLines.length) * 5.6) + 5;
    };

    const drawImprovementPurposeField = (label: string, values: string[], y: number) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(label, leftMargin, y);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);

        let currentY = y + 5;
        const items = values.length ? values : ['-'];
        items.forEach(item => {
            const lines = doc.splitTextToSize(cleanValue(item), contentW - 7);
            doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
            doc.circle(leftMargin + 1.5, currentY - 2.4, 0.9, 'F');
            doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
            doc.text(lines, leftMargin + 5, currentY);
            currentY += (lines.length * 5.6) + 2;
        });

        return currentY + 2;
    };

    const startNextPage = () => {
        pageNumber += 1;
        doc.addPage();
        drawHeader();
        return 34;
    };

    const estimateStackFieldHeight = (value: string, width = contentW) => {
        setFont('normal');
        doc.setFontSize(12.5);
        const lines = doc.splitTextToSize(cleanValue(value), width);
        return 9 + (lines.length * 5.6);
    };

    const estimateTwoColumnFieldHeight = (leftValue: string, rightValue: string) => {
        setFont('normal');
        doc.setFontSize(12.5);
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), colW);
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), colW);
        return 10 + (Math.max(leftLines.length, rightLines.length) * 5.6);
    };

    const estimateImprovementPurposeHeight = (values: string[]) => {
        setFont('normal');
        doc.setFontSize(12.5);
        const items = values.length ? values : ['-'];
        let height = 9;

        items.forEach(item => {
            const lines = doc.splitTextToSize(cleanValue(item), contentW - 7);
            height += (lines.length * 5.6) + 2;
        });

        return height + 2;
    };

    drawHeader();

    let y = 34;
    setFont('bold');
    doc.setFontSize(PHASE_TITLE_FONT_SIZE);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('PLAN PHASE', leftMargin, y);
    y += 9;

    setFont('normal');
    doc.setFontSize(PHASE_SUBTITLE_FONT_SIZE);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const phasePrefix = 'Plan Phase · ';
    doc.text(phasePrefix, leftMargin, y);
    const phasePrefixWidth = doc.getTextWidth(phasePrefix);
    setFont('bold');
    doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.text(status, leftMargin + phasePrefixWidth, y);
    y += 8;

    doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.setLineWidth(0.9);
    doc.line(leftMargin, y, rightX, y);
    y += 10;

    setFont('normal');
    let titleFontSize = 20;
    doc.setFontSize(titleFontSize);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    let titleLines = doc.splitTextToSize(cleanValue(topic.title), contentW);
    while (titleFontSize > 16 && titleLines.length > 2) {
        titleFontSize -= 2;
        doc.setFontSize(titleFontSize);
        titleLines = doc.splitTextToSize(cleanValue(topic.title), contentW);
    }
    doc.text(titleLines, leftMargin, y);
    y += (titleLines.length * (titleFontSize * 0.36)) + 7;

    y = drawSectionHeader('Plan Data', y);
    y = drawStackField('Title', cleanValue(topic.title), y);
    y = drawStackField('Goal', cleanValue(topic.plan?.goal || ''), y);
    y = drawStackField('AS-IS - Current State', cleanValue(topic.plan?.asIs || ''), y);
    y = drawStackField('TO-BE - Target State', cleanValue(topic.plan?.toBe || ''), y);
    y = drawStackField('Root Cause', cleanValue(topic.plan?.rootCause || ''), y);
    y = drawImprovementPurposeField('Improvement Purpose', improvementPurpose, y);

    const locationSectionHeight = 9
        + estimateTwoColumnFieldHeight(locations, departments)
        + estimateStackFieldHeight(status);
    const meetingSectionHeight = 9
        + estimateTwoColumnFieldHeight(planMeetingTitle, planMeetingType)
        + estimateTwoColumnFieldHeight(responsiblePersons, meetingLocationValue)
        + estimateTwoColumnFieldHeight(doActivationDate, meetingDateTime)
        + 10
        + estimateStackFieldHeight(externalUsers, contentW);

    const locationFitsCurrentPage = y + 1 + locationSectionHeight <= contentBottom;
    if (!locationFitsCurrentPage) {
        drawFooter(pageNumber);
        y = startNextPage();
    }

    y = drawSectionHeader('Location & Department', y + 1);
    y = drawTwoColumnField('Locations', locations, 'Departments', departments, y);
    y = drawStackField('Status', status, y);

    const keepMeetingOnSeparatePage = locationFitsCurrentPage;
    if (keepMeetingOnSeparatePage || y + 2 + meetingSectionHeight > contentBottom) {
        drawFooter(pageNumber);
        y = startNextPage();
    } else {
        y += 2;
    }

    y = drawSectionHeader('Plan Phase Meeting', y);
    y = drawTwoColumnField('Meeting Title', planMeetingTitle, 'Meeting Type', planMeetingType, y);
    y = drawTwoColumnField('Internal Participants', responsiblePersons, meetingLocationLabel, meetingLocationValue, y);
    y = drawTwoColumnField('Due Date - DO Phase Activation', doActivationDate, 'Meeting Date & Time', meetingDateTime, y);

    y = drawSectionHeader('External Users', y + 2);
    y = drawStackField('External Users', externalUsers, y, contentW);

    drawFooter(pageNumber);
    return pageNumber;
};

const renderDoPage = (doc: jsPDF, topic: Topic, startPage = 1): number => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const leftMargin = 25.4;
    const rightMargin = 20;
    const contentW = pageW - leftMargin - rightMargin;
    const rightX = pageW - rightMargin;
    const colGap = 14;
    const colW = (contentW - colGap) / 2;
    const headerY = 13;
    const footerRuleY = pageH - 14;
    const footerTextY = pageH - 8.5;
    const contentBottom = footerRuleY - 8;
    const thickRule = 0.9;
    const thinRule = 0.25;
    const darkColor: [number, number, number] = [17, 24, 39];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const tealColor: [number, number, number] = [58, 175, 160];
    const bodyColor: [number, number, number] = [55, 65, 81];
    const sansFont = getPreferredPdfSansFont(doc);
    const actions = topic.do?.actions || [];
    const targetGoal = cleanValue(topic.plan?.toBe || topic.plan?.goal || '');
    const dueDate = topic.do?.checkDate ? formatDate(topic.do.checkDate) : 'TBD';
    const phaseStatus = cleanValue(topic.status || 'Monitoring');
    const generatedDate = formatLongDate();
    let y = 30;
    let pageNumber = startPage;

    const setFont = (style: 'normal' | 'bold') => {
        doc.setFont(sansFont, style);
    };

    const sectionLabelText = (label: string) =>
        label
            .toUpperCase()
            .split('')
            .join(' ');

    const drawPageChrome = (page: number) => {
        setFont('bold');
        doc.setFontSize(9);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('PDCA Do Phase', leftMargin, headerY);

        setFont('normal');
        doc.setFontSize(9);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(`Do Phase · ${generatedDate}`, rightX, headerY, { align: 'right' });

        doc.setDrawColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.setLineWidth(thinRule);
        doc.line(leftMargin, footerRuleY, rightX, footerRuleY);

        setFont('normal');
        doc.setFontSize(8.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text('VIRENA - PDCA', leftMargin, footerTextY);
        doc.text(`Page ${page}`, rightX, footerTextY, { align: 'right' });
    };

    const startNextPage = (continuationLabel?: string) => {
        pageNumber += 1;
        doc.addPage();
        drawPageChrome(pageNumber);
        y = 30;
        if (continuationLabel) {
            y = drawSectionHeader(continuationLabel, y);
        }
    };

    const ensureSpace = (needed: number, continuationLabel?: string) => {
        if (y + needed > contentBottom) {
            startNextPage(continuationLabel);
        }
    };

    const drawSectionHeader = (label: string, startY: number) => {
        setFont('bold');
        doc.setFontSize(9);
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        const trackedLabel = sectionLabelText(label);
        doc.text(trackedLabel, leftMargin, startY);
        return startY + 8;
    };

    const drawStackField = (label: string, value: string, startY: number, width = contentW) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(label, leftMargin, startY);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const lines = doc.splitTextToSize(cleanValue(value), width);
        const valueY = startY + 5;
        doc.text(lines, leftMargin, valueY);
        return valueY + (lines.length * 5.6) + 4;
    };

    const drawTwoColumnField = (
        leftLabel: string,
        leftValue: string,
        rightLabel: string,
        rightValue: string,
        startY: number
    ) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(leftLabel, leftMargin, startY);
        doc.text(rightLabel, leftMargin + colW + colGap, startY);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const valueY = startY + 5;
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), colW);
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), colW);
        doc.text(leftLines, leftMargin, valueY);
        doc.text(rightLines, leftMargin + colW + colGap, valueY);
        return valueY + (Math.max(leftLines.length, rightLines.length) * 5.6) + 5;
    };

    const estimateFieldHeight = (value: string, width = contentW) => {
        const lineCount = doc.splitTextToSize(cleanValue(value), width).length || 1;
        return 9 + (lineCount * 5.6);
    };

    const estimateTwoColumnHeight = (leftValue: string, rightValue: string) => {
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), colW).length || 1;
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), colW).length || 1;
        return 10 + (Math.max(leftLines, rightLines) * 5.6);
    };

    const estimateActionHeight = (action: Topic['do']['actions'][number]) => {
        return 18
            + estimateFieldHeight(cleanValue(action.title || ''))
            + estimateFieldHeight(cleanValue(action.description || ''))
            + estimateTwoColumnHeight(formatAssignments(action.assignments), action.dueDate ? formatDate(action.dueDate) : '-')
            + estimateTwoColumnHeight(
                cleanValue(action.meetingType || ''),
                action.teamsMeeting ? formatDateTime(action.teamsMeeting) : '-'
            )
            + estimateFieldHeight(getMeetingLocationValue(action.meetingType, action.meetingLocation, action.teamsMeetingLink))
            + 12
            + estimateTwoColumnHeight(formatExternalUsers(action.externalUsers), formatActionComments(action))
            + 6;
    };

    drawPageChrome(pageNumber);

    setFont('bold');
    doc.setFontSize(PHASE_TITLE_FONT_SIZE);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('DO PHASE', leftMargin, y);
    y += 9;

    setFont('normal');
    doc.setFontSize(PHASE_SUBTITLE_FONT_SIZE);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const phasePrefix = 'Do Phase · ';
    doc.text(phasePrefix, leftMargin, y);
    const phasePrefixWidth = doc.getTextWidth(phasePrefix);
    setFont('bold');
    doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.text(phaseStatus, leftMargin + phasePrefixWidth, y);
    y += 8;

    doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.setLineWidth(thickRule);
    doc.line(leftMargin, y, rightX, y);
    y += 10;

    y = drawSectionHeader('Overview', y);
    y = drawStackField('Topic Title', cleanValue(topic.title || ''), y);
    y = drawStackField('Target Goal (From Plan)', targetGoal, y);

    ensureSpace(20, 'Check Phase Activation');
    y = drawSectionHeader('Check Phase Activation', y + 1);
    y = drawStackField('Due Date', dueDate, y);

    ensureSpace(24, 'DO & Execution Actions');
    y = drawSectionHeader('DO & Execution Actions', y + 1);

    if (actions.length === 0) {
        y = drawStackField('Title', '-', y);
    } else {
        actions.forEach((action, idx) => {
            ensureSpace(estimateActionHeight(action), 'DO & Execution Actions');

            setFont('bold');
            doc.setFontSize(10);
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.text(`ACTION ${idx + 1}`, leftMargin, y);
            y += 7;

            y = drawStackField('Title', cleanValue(action.title || ''), y);
            y = drawStackField('Description', cleanValue(action.description || ''), y);
            y = drawTwoColumnField(
                'Responsible Persons',
                formatAssignments(action.assignments),
                'Action Due Date',
                action.dueDate ? formatDate(action.dueDate) : '-',
                y
            );
            y = drawTwoColumnField(
                'Meeting Type',
                cleanValue(action.meetingType || ''),
                'Meeting Date & Time',
                action.teamsMeeting ? formatDateTime(action.teamsMeeting) : '-',
                y
            );
            y = drawStackField(
                getMeetingLocationLabel(action.meetingType),
                getMeetingLocationValue(action.meetingType, action.meetingLocation, action.teamsMeetingLink),
                y
            );

            y = drawSectionHeader('External Users & Comments', y + 2);
            y = drawTwoColumnField(
                'External Users',
                formatExternalUsers(action.externalUsers),
                'Comments',
                formatActionComments(action),
                y
            );

            if (idx < actions.length - 1) {
                doc.setDrawColor(mutedColor[0], mutedColor[1], mutedColor[2]);
                doc.setLineWidth(thinRule);
                doc.line(leftMargin, y, rightX, y);
                y += 7;
            }
        });
    }
    return pageNumber;
};

const renderCheckPage = (doc: jsPDF, topic: Topic, startPage = 1): number => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const leftMargin = 25.4;
    const rightMargin = 20;
    const contentW = pageW - leftMargin - rightMargin;
    const rightX = pageW - rightMargin;
    const colGap = 14;
    const halfW = (contentW - colGap) / 2;
    const col4Gap = 8;
    const fourColW = (contentW - (col4Gap * 3)) / 4;
    const headerY = 13;
    const footerRuleY = pageH - 14;
    const footerTextY = pageH - 8.5;
    const contentBottom = footerRuleY - 8;
    const thickRule = 0.9;
    const thinRule = 0.25;
    const darkColor: [number, number, number] = [17, 24, 39];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const tealColor: [number, number, number] = [58, 175, 160];
    const bodyColor: [number, number, number] = [55, 65, 81];
    const sansFont = getPreferredPdfSansFont(doc);
    const actions = topic.do?.actions || [];
    const totalActions = actions.length;
    const involvedUsers = new Set(actions.flatMap(a => (a.assignments || []).map(p => p.userId))).size;
    const status = cleanValue(topic.status || 'Monitoring');
    const effStatus = cleanValue(topic.check?.effectivenessStatus || '');
    const assessmentDescription = effStatus === 'Effective'
        ? 'Objective fully met. Proceed to Standardization.'
        : effStatus === 'Partially Effective'
            ? 'Objective partially met. Improvements needed before full standardization.'
            : effStatus === 'Not Effective'
                ? 'Objective not met. Re-planning and corrective action required.'
                : '-';

    const kpiRows = (topic.check?.kpiEvaluations || []).map(k => ({
        indicator: cleanValue(k.name),
        target: cleanValue(k.targetValue),
        result: cleanValue(k.actualResult),
        status: cleanValue(k.status)
    }));

    const review = cleanValue(topic.check?.effectivenessReview || '');
    const checkMeeting = topic.check?.meeting;
    const checkMeetingTitle = cleanValue(checkMeeting?.title || '');
    const checkMeetingType = cleanValue(checkMeeting?.meetingType || '');
    const checkResponsiblePersons = formatList(checkMeeting?.responsiblePersons);
    const checkMeetingDateTime = cleanValue(checkMeeting?.meetingDateTime ? formatDateTime(checkMeeting.meetingDateTime) : '');
    const checkMeetingLocationLabel = getMeetingLocationLabel(checkMeeting?.meetingType);
    const checkMeetingLocationValue = getMeetingLocationValue(checkMeeting?.meetingType, checkMeeting?.location);
    const checkMeetingExternalUsers = formatExternalUsers(checkMeeting?.externalUsers);
    const actDueDate = cleanValue(
        checkMeeting?.checkTriggerDate
            ? formatDate(checkMeeting.checkTriggerDate)
            : topic.dueDate
                ? formatDate(topic.dueDate)
                : ''
    );
    const checkDecision = cleanValue(getCheckDecisionOutcome(topic.check?.effectivenessStatus, topic.check?.checkDecision));
    const checkedBy = cleanValue(topic.check?.audit?.checkedBy || '');
    const checkedOn = cleanValue(topic.check?.audit?.checkedOn ? formatDateTime(topic.check.audit.checkedOn) : '');
    const generatedDate = formatLongDate();
    let y = 30;
    let pageNumber = startPage;

    const setFont = (style: 'normal' | 'bold') => {
        doc.setFont(sansFont, style);
    };

    const sectionLabelText = (label: string) =>
        label
            .toUpperCase()
            .split('')
            .join(' ');

    const drawPageChrome = (page: number) => {
        setFont('bold');
        doc.setFontSize(9);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('PDCA Check Phase', leftMargin, headerY);

        setFont('normal');
        doc.setFontSize(9);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(`Check Phase · ${generatedDate}`, rightX, headerY, { align: 'right' });

        doc.setDrawColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.setLineWidth(thinRule);
        doc.line(leftMargin, footerRuleY, rightX, footerRuleY);

        setFont('normal');
        doc.setFontSize(8.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text('VIRENA - PDCA', leftMargin, footerTextY);
        doc.text(`Page ${page}`, rightX, footerTextY, { align: 'right' });
    };

    const drawSectionHeader = (label: string, startY: number) => {
        setFont('bold');
        doc.setFontSize(9);
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        const trackedLabel = sectionLabelText(label);
        doc.text(trackedLabel, leftMargin, startY);
        return startY + 8;
    };

    const startNextPage = (continuationLabel?: string) => {
        pageNumber += 1;
        doc.addPage();
        drawPageChrome(pageNumber);
        y = 30;
        if (continuationLabel) {
            y = drawSectionHeader(continuationLabel, y);
        }
    };

    const ensureSpace = (needed: number, continuationLabel?: string) => {
        if (y + needed > contentBottom) {
            startNextPage(continuationLabel);
        }
    };

    const drawStackField = (label: string, value: string, startY: number, width = contentW) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(label, leftMargin, startY);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const lines = doc.splitTextToSize(cleanValue(value), width);
        const valueY = startY + 5;
        doc.text(lines, leftMargin, valueY);
        return valueY + (lines.length * 5.6) + 4;
    };

    const drawTwoColumnField = (
        leftLabel: string,
        leftValue: string,
        rightLabel: string,
        rightValue: string,
        startY: number
    ) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(leftLabel, leftMargin, startY);
        doc.text(rightLabel, leftMargin + halfW + colGap, startY);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const valueY = startY + 5;
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), halfW);
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), halfW);
        doc.text(leftLines, leftMargin, valueY);
        doc.text(rightLines, leftMargin + halfW + colGap, valueY);
        return valueY + (Math.max(leftLines.length, rightLines.length) * 5.6) + 5;
    };

    const drawKpiHeader = (startY: number) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text('Indicator', leftMargin, startY);
        doc.text('Target', leftMargin + fourColW + col4Gap, startY);
        doc.text('Result', leftMargin + (fourColW + col4Gap) * 2, startY);
        doc.text('Status', leftMargin + (fourColW + col4Gap) * 3, startY);
        return startY + 5;
    };

    const drawKpiRow = (row: { indicator: string; target: string; result: string; status: string }, startY: number) => {
        setFont('normal');
        doc.setFontSize(11.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);

        const indicatorLines = doc.splitTextToSize(cleanValue(row.indicator), fourColW);
        const targetLines = doc.splitTextToSize(cleanValue(row.target), fourColW);
        const resultLines = doc.splitTextToSize(cleanValue(row.result), fourColW);
        const statusLines = doc.splitTextToSize(cleanValue(row.status), fourColW);
        const valueY = startY + 4;

        doc.text(indicatorLines, leftMargin, valueY);
        doc.text(targetLines, leftMargin + fourColW + col4Gap, valueY);
        doc.text(resultLines, leftMargin + (fourColW + col4Gap) * 2, valueY);
        doc.text(statusLines, leftMargin + (fourColW + col4Gap) * 3, valueY);

        return valueY + (Math.max(indicatorLines.length, targetLines.length, resultLines.length, statusLines.length) * 5.2) + 3;
    };

    const estimateFieldHeight = (value: string, width = contentW) => {
        const lineCount = doc.splitTextToSize(cleanValue(value), width).length || 1;
        return 9 + (lineCount * 5.6);
    };

    const estimateTwoColumnHeight = (leftValue: string, rightValue: string) => {
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), halfW).length || 1;
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), halfW).length || 1;
        return 10 + (Math.max(leftLines, rightLines) * 5.6);
    };

    const estimateKpiRowHeight = (row: { indicator: string; target: string; result: string; status: string }) => {
        const indicatorLines = doc.splitTextToSize(cleanValue(row.indicator), fourColW).length || 1;
        const targetLines = doc.splitTextToSize(cleanValue(row.target), fourColW).length || 1;
        const resultLines = doc.splitTextToSize(cleanValue(row.result), fourColW).length || 1;
        const statusLines = doc.splitTextToSize(cleanValue(row.status), fourColW).length || 1;
        return 7 + (Math.max(indicatorLines, targetLines, resultLines, statusLines) * 5.2);
    };

    drawPageChrome(pageNumber);

    setFont('bold');
    doc.setFontSize(PHASE_TITLE_FONT_SIZE);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('CHECK PHASE', leftMargin, y);
    y += 9;

    setFont('normal');
    doc.setFontSize(PHASE_SUBTITLE_FONT_SIZE);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const phasePrefix = 'Check Phase · ';
    doc.text(phasePrefix, leftMargin, y);
    const phasePrefixWidth = doc.getTextWidth(phasePrefix);
    setFont('bold');
    doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.text(status, leftMargin + phasePrefixWidth, y);
    y += 8;

    doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.setLineWidth(thickRule);
    doc.line(leftMargin, y, rightX, y);
    y += 10;

    y = drawSectionHeader('Overview', y);
    y = drawStackField('Topic Title', cleanValue(topic.title || ''), y);

    ensureSpace(26, 'Execution Summary (From DO Phase)');
    y = drawSectionHeader('Execution Summary (From DO Phase)', y + 1);
    y = drawTwoColumnField('Total Actions', String(totalActions), 'Involved Users', String(involvedUsers), y);

    ensureSpace(estimateFieldHeight(effStatus) + estimateFieldHeight(assessmentDescription) + 18, 'Effectiveness Assessment');
    y = drawSectionHeader('Effectiveness Assessment', y + 1);
    y = drawStackField('Assessment Result', effStatus, y);
    y = drawStackField('Assessment Description', assessmentDescription, y);

    ensureSpace(24, 'KPI Evaluation');
    y = drawSectionHeader('KPI Evaluation', y + 1);
    y = drawKpiHeader(y);
    if (kpiRows.length === 0) {
        setFont('normal');
        doc.setFontSize(11.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        doc.text('-', leftMargin, y + 4);
        y += 11;
    } else {
        kpiRows.forEach((row, idx) => {
            if (y + estimateKpiRowHeight(row) > contentBottom) {
                startNextPage('KPI Evaluation');
                y = drawKpiHeader(y);
            }
            y = drawKpiRow(row, y);
            if (idx < kpiRows.length - 1) {
                y += 1.5;
            }
        });
    }

    ensureSpace(estimateFieldHeight(review) + 16, 'Effectiveness Review');
    y = drawSectionHeader('Effectiveness Review', y + 2);
    y = drawStackField('Review', review, y);

    ensureSpace(estimateFieldHeight(checkDecision) + estimateTwoColumnHeight(checkedBy, checkedOn) + 18, 'Check Decision & Audit');
    y = drawSectionHeader('Check Decision & Audit', y + 1);
    y = drawStackField('Decision Outcome', checkDecision, y);
    y = drawTwoColumnField('Checked By', checkedBy, 'Date', checkedOn, y);

    ensureSpace(estimateFieldHeight(actDueDate) + 14, 'ACT Phase Activation');
    y = drawSectionHeader('ACT Phase Activation', y + 1);
    y = drawStackField('Due Date', actDueDate, y);

    const checkMeetingSectionHeight = 9
        + estimateTwoColumnHeight(checkMeetingTitle, checkMeetingType)
        + estimateTwoColumnHeight(checkResponsiblePersons, checkMeetingLocationValue)
        + estimateTwoColumnHeight(checkMeetingDateTime, checkMeetingExternalUsers);

    if (y + 2 + checkMeetingSectionHeight > contentBottom) {
        startNextPage();
    } else {
        y += 2;
    }

    y = drawSectionHeader('CHECK Phase Meeting', y);

    const checkMeetingRows = [
        {
            leftLabel: 'Meeting Title',
            leftValue: checkMeetingTitle,
            rightLabel: 'Meeting Type',
            rightValue: checkMeetingType
        },
        {
            leftLabel: 'Internal Participants',
            leftValue: checkResponsiblePersons,
            rightLabel: checkMeetingLocationLabel,
            rightValue: checkMeetingLocationValue
        },
        {
            leftLabel: 'Meeting Date & Time',
            leftValue: checkMeetingDateTime,
            rightLabel: 'External Users',
            rightValue: checkMeetingExternalUsers
        }
    ];

    checkMeetingRows.forEach(row => {
        if (y + estimateTwoColumnHeight(row.leftValue, row.rightValue) > contentBottom) {
            startNextPage('CHECK Phase Meeting');
        }
        y = drawTwoColumnField(row.leftLabel, row.leftValue, row.rightLabel, row.rightValue, y);
    });

    return pageNumber;
};

const renderActPage = (doc: jsPDF, topic: Topic, startPage = 1) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const leftMargin = 25.4;
    const rightMargin = 20;
    const contentW = pageW - leftMargin - rightMargin;
    const rightX = pageW - rightMargin;
    const colGap = 14;
    const halfW = (contentW - colGap) / 2;
    const headerY = 13;
    const footerRuleY = pageH - 14;
    const footerTextY = pageH - 8.5;
    const contentBottom = footerRuleY - 8;
    const thickRule = 0.9;
    const thinRule = 0.25;
    const darkColor: [number, number, number] = [17, 24, 39];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const tealColor: [number, number, number] = [58, 175, 160];
    const bodyColor: [number, number, number] = [55, 65, 81];
    const sansFont = getPreferredPdfSansFont(doc);
    const status = cleanValue(topic.status || 'Monitoring');
    const inputFromCheck = cleanValue(topic.check?.effectivenessStatus || '');
    const rawActOutcome = topic.act?.actOutcome || '';
    const actOutcome = cleanValue(rawActOutcome);
    const outcomeDescription = getActOutcomeDescription(rawActOutcome);
    const refId = topic.id || 'NEW';
    const standardizationScope = (rawActOutcome === 'Standardize'
        ? (topic.act?.standardizationScope || [])
        : []).map(v => ACT_SCOPE_MAP[String(v)] || String(v));
    const affectedAreas = (rawActOutcome === 'Standardize'
        ? (topic.act?.affectedAreas || [])
        : []).map(v => ACT_AREA_MAP[String(v)] || String(v));
    const standardizationDescription = cleanValue(
        rawActOutcome === 'Standardize'
            ? (topic.act?.standardizationDescription || topic.act?.standardization || '')
            : ''
    );
    const lessonsLearned = cleanValue(topic.act?.lessonsLearned || '');
    const actConfirmationFields = getActConfirmationFields(rawActOutcome, topic.act?.actConfirmation);
    const signedBy = cleanValue(topic.act?.audit?.closedBy || topic.check?.audit?.checkedBy || topic.ownerName || '');
    const signedOn = cleanValue(
        topic.act?.audit?.closedOn
            ? formatDate(topic.act.audit.closedOn)
            : topic.check?.audit?.checkedOn
                ? formatDate(topic.check.audit.checkedOn)
                : formatDate()
    );
    const owner = cleanValue(topic.ownerName || signedBy || '');
    const generatedDate = formatLongDate();
    let y = 30;
    let pageNumber = startPage;

    const setFont = (style: 'normal' | 'bold') => {
        doc.setFont(sansFont, style);
    };

    const sectionLabelText = (label: string) =>
        label
            .toUpperCase()
            .split('')
            .join(' ');

    const drawPageChrome = (page: number) => {
        setFont('bold');
        doc.setFontSize(9);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('PDCA Act Protocol', leftMargin, headerY);

        setFont('normal');
        doc.setFontSize(9);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(`Act Phase · ${generatedDate}`, rightX, headerY, { align: 'right' });

        doc.setDrawColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.setLineWidth(thinRule);
        doc.line(leftMargin, footerRuleY, rightX, footerRuleY);

        setFont('normal');
        doc.setFontSize(8.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text('VIRENA - PDCA', leftMargin, footerTextY);
        doc.text(`Page ${page}`, rightX, footerTextY, { align: 'right' });
    };

    const drawSectionHeader = (label: string, startY: number) => {
        setFont('bold');
        doc.setFontSize(9);
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        const trackedLabel = sectionLabelText(label);
        doc.text(trackedLabel, leftMargin, startY);
        return startY + 8;
    };

    const startNextPage = (continuationLabel?: string) => {
        pageNumber += 1;
        doc.addPage();
        drawPageChrome(pageNumber);
        y = 30;
        if (continuationLabel) {
            y = drawSectionHeader(continuationLabel, y);
        }
    };

    const ensureSpace = (needed: number, continuationLabel?: string) => {
        if (y + needed > contentBottom) {
            startNextPage(continuationLabel);
        }
    };

    const drawStackField = (label: string, value: string, startY: number, width = contentW) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(label, leftMargin, startY);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const lines = doc.splitTextToSize(cleanValue(value), width);
        const valueY = startY + 5;
        doc.text(lines, leftMargin, valueY);
        return valueY + (lines.length * 5.6) + 4;
    };

    const drawTwoColumnField = (
        leftLabel: string,
        leftValue: string,
        rightLabel: string,
        rightValue: string,
        startY: number
    ) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(leftLabel, leftMargin, startY);
        doc.text(rightLabel, leftMargin + halfW + colGap, startY);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const valueY = startY + 5;
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), halfW);
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), halfW);
        doc.text(leftLines, leftMargin, valueY);
        doc.text(rightLines, leftMargin + halfW + colGap, valueY);
        return valueY + (Math.max(leftLines.length, rightLines.length) * 5.6) + 5;
    };

    const drawBulletField = (label: string, values: string[], startY: number) => {
        setFont('normal');
        doc.setFontSize(9.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(label, leftMargin, startY);

        setFont('normal');
        doc.setFontSize(12.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);

        let currentY = startY + 5;
        const items = values.length ? values : ['-'];
        items.forEach(item => {
            const lines = doc.splitTextToSize(cleanValue(item), contentW - 7);
            doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
            doc.circle(leftMargin + 1.5, currentY - 1.9, 0.8, 'F');
            doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
            doc.text(lines, leftMargin + 5, currentY);
            currentY += (lines.length * 5.6) + 2;
        });

        return currentY + 2;
    };

    const estimateFieldHeight = (value: string, width = contentW) => {
        const lineCount = doc.splitTextToSize(cleanValue(value), width).length || 1;
        return 9 + (lineCount * 5.6);
    };

    const estimateBulletHeight = (values: string[]) => {
        const items = values.length ? values : ['-'];
        const lines = items.reduce((sum, item) => {
            return sum + (doc.splitTextToSize(cleanValue(item), contentW - 7).length || 1);
        }, 0);
        return 9 + (lines * 5.6) + (items.length * 2) + 2;
    };

    const estimateTwoColumnHeight = (leftValue: string, rightValue: string) => {
        const leftLines = doc.splitTextToSize(cleanValue(leftValue), halfW).length || 1;
        const rightLines = doc.splitTextToSize(cleanValue(rightValue), halfW).length || 1;
        return 10 + (Math.max(leftLines, rightLines) * 5.6);
    };

    drawPageChrome(pageNumber);

    setFont('bold');
    doc.setFontSize(PHASE_TITLE_FONT_SIZE);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('ACT PHASE', leftMargin, y);
    y += 9;

    setFont('normal');
    doc.setFontSize(PHASE_SUBTITLE_FONT_SIZE);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const prefix = 'Act Phase · ';
    const statusText = status;
    const middle = ' · Input from Check: ';
    const suffix = inputFromCheck;
    doc.text(prefix, leftMargin, y);
    const prefixWidth = doc.getTextWidth(prefix);
    setFont('bold');
    doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.text(statusText, leftMargin + prefixWidth, y);
    const statusWidth = doc.getTextWidth(statusText);
    setFont('normal');
    doc.setFontSize(PHASE_SUBTITLE_FONT_SIZE);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(middle, leftMargin + prefixWidth + statusWidth, y);
    const middleWidth = doc.getTextWidth(middle);
    setFont('bold');
    doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.text(suffix, leftMargin + prefixWidth + statusWidth + middleWidth, y);
    y += 8;

    doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.setLineWidth(thickRule);
    doc.line(leftMargin, y, rightX, y);
    y += 10;

    y = drawSectionHeader('Topic', y);
    y = drawStackField('Topic Title', cleanValue(topic.title || ''), y);

    ensureSpace(estimateFieldHeight(actOutcome) + estimateFieldHeight(outcomeDescription) + 18, 'Outcome Decision');
    y = drawSectionHeader('Outcome Decision', y + 1);
    y = drawStackField('Decision', actOutcome, y);
    y = drawStackField('Description', outcomeDescription, y);

    if (rawActOutcome === 'Standardize') {
        ensureSpace(
            estimateBulletHeight(standardizationScope)
            + estimateBulletHeight(affectedAreas)
            + estimateFieldHeight(standardizationDescription)
            + 24,
            'Standardization'
        );
        y = drawSectionHeader('Standardization', y + 1);
        y = drawBulletField('Standardization Scope', standardizationScope, y);
        y = drawBulletField('Affected Areas / Rollout', affectedAreas, y);
        y = drawStackField('Description', standardizationDescription, y);
    }

    ensureSpace(estimateFieldHeight(lessonsLearned) + 16, 'Lessons Learned');
    y = drawSectionHeader('Lessons Learned', y + 1);
    y = drawStackField('Key Takeaways', lessonsLearned, y);

    const actConfirmationSectionHeight = 9
        + actConfirmationFields.reduce((sum, field) => sum + estimateFieldHeight(field.value), 0)
        + estimateTwoColumnHeight(signedBy, signedOn);

    if (y + 2 + actConfirmationSectionHeight > contentBottom) {
        startNextPage();
    } else {
        y += 2;
    }

    y = drawSectionHeader('ACT Phase Confirmation & Sign-off', y);
    actConfirmationFields.forEach(field => {
        if (y + estimateFieldHeight(field.value) > contentBottom) {
            startNextPage('ACT Phase Confirmation & Sign-off');
        }
        y = drawStackField(field.label, field.value, y);
    });

    if (y + estimateTwoColumnHeight(signedBy, signedOn) > contentBottom) {
        startNextPage('ACT Phase Confirmation & Sign-off');
    }
    y = drawTwoColumnField('Signed By', signedBy, 'Date', signedOn, y);
};

export const generatePDCAPdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    localizePdfDoc(doc);
    renderPlanPage(doc, topic);
    doc.save(`PDCA_Plan_Protocol_${topic.id || 'NEW'}.pdf`);
};

export const generateDOPhasePdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    localizePdfDoc(doc);
    renderDoPage(doc, topic);
    doc.save(`PDCA_Do_Protocol_${topic.id || 'NEW'}.pdf`);
};

export const generateCheckPhasePdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    localizePdfDoc(doc);
    renderCheckPage(doc, topic);
    doc.save(`PDCA_Check_Phase_${topic.id || 'NEW'}.pdf`);
};

export const generatePlanDoCombinedPdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    localizePdfDoc(doc);
    renderPlanPage(doc, topic);
    doc.addPage();
    renderDoPage(doc, topic);
    doc.save(`PDCA_Plan_Do_Protocol_${topic.id || 'NEW'}.pdf`);
};

export const generatePlanDoCheckCombinedPdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    localizePdfDoc(doc);
    const summaryPage = renderExecutiveSummaryPage(doc, topic);
    doc.addPage();
    const lastPlanPage = renderPlanPage(doc, topic, summaryPage + 1);
    doc.addPage();
    const lastDoPage = renderDoPage(doc, topic, lastPlanPage + 1);
    doc.addPage();
    const lastCheckPage = renderCheckPage(doc, topic, lastDoPage + 1);
    doc.addPage();
    renderActPage(doc, topic, lastCheckPage + 1);
    doc.save(`PDCA_All_Phases_Protocol_${topic.id || 'NEW'}.pdf`);
};

export const generateActPhasePdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    localizePdfDoc(doc);
    renderActPage(doc, topic);
    doc.save(`PDCA_Act_Phase_${topic.id || 'NEW'}.pdf`);
};

