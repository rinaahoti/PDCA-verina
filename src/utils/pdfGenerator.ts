import jsPDF from 'jspdf';
import { Topic } from '../types';

const cleanValue = (value?: string): string => {
    if (!value) return '-';
    const v = value.trim();
    return v.length ? v : '-';
};

const formatLongDateUpper = (value?: string): string => {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB').toUpperCase();
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
};

const formatDate = (value?: string): string => {
    if (!value) return 'TBD';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB');
};

const formatDateTime = (value?: string): string => {
    if (!value) return 'TBD';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-GB', {
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
        INCREASE_QUALITY: 'Increase quality'
    };
    return dict[raw] || raw.replace(/_/g, ' ');
};

const renderPlanPage = (doc: jsPDF, topic: Topic) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 22;
    const contentW = pageW - (margin * 2);
    const rightX = pageW - margin;
    const colGap = 12;
    const colW = (contentW - colGap) / 2;
    let y = 24;

    const textColor: [number, number, number] = [10, 19, 36];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const labelColor: [number, number, number] = [17, 24, 39];

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 18) {
            doc.addPage();
            y = 24;
        }
    };

    const drawSectionLabel = (label: string) => {
        ensureSpace(7);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), margin, y);
        y += 5.5;
    };

    const drawField = (label: string, value: string, width = contentW) => {
        drawSectionLabel(label);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        const lines = doc.splitTextToSize(cleanValue(value), width);
        doc.text(lines, margin, y);
        y += Math.max(5, lines.length * 5.2) + 3;
    };

    const owner = topic.ownerName || 'Sophia Mayer';
    const refId = topic.id || 'NEW';
    const status = topic.status || 'Monitoring';
    const phaseLine = `Plan Phase · ${status}`;

    const improvementPurpose = (
        topic.plan?.improvementPurpose?.length
            ? topic.plan.improvementPurpose
            : (topic.plan?.objectives || [])
    ).map(mapImprovementPurpose);

    const locations = cleanValue(topic.location || '');
    const departments = cleanValue(topic.departmentId || '');
    const planMeetingType = cleanValue(topic.do?.actions?.[0]?.meetingType || '');
    const responsiblePerson = cleanValue(topic.responsibleName || owner);
    const doActivationDate = cleanValue(topic.do?.checkDate ? formatDate(topic.do.checkDate) : '');
    const meetingDateTime = cleanValue(topic.do?.actions?.[0]?.teamsMeeting ? formatDateTime(topic.do.actions[0].teamsMeeting) : '');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(`REF ${refId} · OWNER: ${owner.toUpperCase()}`, margin, y);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(formatLongDateUpper(), rightX, y, { align: 'right' });
    y += 12;

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15.5);
    doc.text('PDCA Plan Protocol', margin, y);
    y += 6.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(phaseLine, margin, y);
    y += 14;

    drawSectionLabel('Plan Data');
    y += 1;
    drawField('Title', cleanValue(topic.title));
    drawField('Goal', cleanValue(topic.plan?.goal || ''));

    ensureSpace(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text('AS-IS — CURRENT STATE', margin, y);
    doc.text('TO-BE — TARGET STATE', margin + colW + colGap, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const asIsLines = doc.splitTextToSize(cleanValue(topic.plan?.asIs || ''), colW);
    const toBeLines = doc.splitTextToSize(cleanValue(topic.plan?.toBe || ''), colW);
    doc.text(asIsLines, margin, y);
    doc.text(toBeLines, margin + colW + colGap, y);
    y += Math.max(asIsLines.length, toBeLines.length) * 5.2 + 4;

    drawField('Root Cause', cleanValue(topic.plan?.rootCause || ''));

    drawSectionLabel('Improvement Purpose');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    if (improvementPurpose.length === 0) {
        doc.text('— -', margin, y);
        y += 6;
    } else {
        improvementPurpose.forEach(item => {
            const lines = doc.splitTextToSize(`— ${item}`, contentW);
            doc.text(lines, margin, y);
            y += Math.max(5.2, lines.length * 5.2);
        });
    }
    y += 4;

    drawField('Cycle Description', cleanValue(topic.plan?.description || ''));

    ensureSpace(24);
    drawSectionLabel('Location & Department');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text('LOCATIONS', margin, y);
    doc.text('DEPARTMENTS', margin + colW + colGap, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const locLines = doc.splitTextToSize(locations, colW);
    const depLines = doc.splitTextToSize(departments, colW);
    doc.text(locLines, margin, y);
    doc.text(depLines, margin + colW + colGap, y);
    y += Math.max(locLines.length, depLines.length) * 5.2 + 6;

    drawField('Status', cleanValue(status));

    ensureSpace(34);
    drawSectionLabel('Plan Phase Meeting');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text('MEETING TYPE', margin, y);
    doc.text('RESPONSIBLE PERSON', margin + colW + colGap, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(doc.splitTextToSize(planMeetingType, colW), margin, y);
    doc.text(doc.splitTextToSize(responsiblePerson, colW), margin + colW + colGap, y);
    y += 9;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text('DUE DATE — DO PHASE ACTIVATION', margin, y);
    doc.text('MEETING DATE & TIME', margin + colW + colGap, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(doc.splitTextToSize(doActivationDate, colW), margin, y);
    doc.text(doc.splitTextToSize(meetingDateTime, colW), margin + colW + colGap, y);
};

const renderDoPage = (doc: jsPDF, topic: Topic) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 22;
    const contentW = pageW - (margin * 2);
    const colGap = 10;
    const fourColW = (contentW - (colGap * 3)) / 4;
    let y = 28;

    const textColor: [number, number, number] = [10, 19, 36];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const labelColor: [number, number, number] = [17, 24, 39];

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 18) {
            doc.addPage();
            y = 24;
        }
    };

    const sectionLabel = (label: string) => {
        ensureSpace(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), margin, y);
        y += 7.5;
    };

    const smallLabel = (label: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), x, yy);
    };

    const bodyLines = (text: string, width = contentW): string[] => doc.splitTextToSize(cleanValue(text), width);
    const drawBody = (text: string, x: number, yy: number, width = contentW) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(bodyLines(text, width), x, yy);
    };

    const actions = topic.do?.actions || [];
    const firstAction = actions[0];
    const targetGoal = cleanValue(topic.plan?.goal || topic.plan?.toBe || '');
    const dueDate = topic.do?.checkDate ? formatDate(topic.do.checkDate) : 'TBD';
    const phaseStatus = topic.status || 'Monitoring';
    const meetingType = cleanValue(firstAction?.meetingType || '');
    const meetingDateTime = cleanValue(firstAction?.teamsMeeting ? formatDateTime(firstAction.teamsMeeting) : '');
    const officeLocation = cleanValue(firstAction?.meetingLocation || '');
    const responsiblePersons = Array.from(new Set(actions.flatMap(a => (a.assignments || []).map(p => p.userName).filter(Boolean))));
    const responsiblePersonsText = responsiblePersons.length ? responsiblePersons.join('\n') : '-';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('DO PHASE', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Do Phase · ${phaseStatus}`, margin, y);
    y += 14;

    sectionLabel('Topic');
    smallLabel('Topic Title', margin, y);
    y += 6;
    drawBody(topic.title || '-', margin, y);
    y += bodyLines(topic.title || '-', contentW).length * 5.4 + 7;

    sectionLabel('Target Goal (From Plan)');
    smallLabel('Goal', margin, y);
    y += 6;
    drawBody(targetGoal, margin, y);
    y += bodyLines(targetGoal, contentW).length * 5.4 + 9;

    sectionLabel('Check Phase Activation');
    smallLabel('Due Date', margin, y);
    y += 6;
    drawBody(dueDate, margin, y);
    y += 10;

    sectionLabel('DO & Execution Actions');
    if (actions.length === 0) {
        drawBody('-', margin, y);
        y += 9;
    } else {
        actions.forEach((a) => {
            ensureSpace(18);
            const actionTitle = cleanValue(a.title || '-');
            const titleLines = bodyLines(`•  ${actionTitle}`, contentW);
            drawBody(`•  ${actionTitle}`, margin + 2, y);
            y += titleLines.length * 5.4 + 4;

            smallLabel('Description', margin, y);
            y += 6;
            const desc = cleanValue(a.description || '-');
            drawBody(desc, margin, y);
            y += bodyLines(desc, contentW).length * 5.4 + 7;
        });
    }

    ensureSpace(40);
    const col1X = margin;
    const col2X = margin + fourColW + colGap;
    const col3X = col2X + fourColW + colGap;
    const col4X = col3X + fourColW + colGap;

    smallLabel('Responsible Persons', col1X, y);
    smallLabel('Meeting Type', col2X, y);
    smallLabel('Meeting Date & Time', col3X, y);
    smallLabel('Office / Location', col4X, y);
    y += 6;

    drawBody(responsiblePersonsText, col1X, y, fourColW);
    drawBody(meetingType, col2X, y, fourColW);
    drawBody(meetingDateTime, col3X, y, fourColW);
    drawBody(officeLocation, col4X, y, fourColW);
};

export const generatePDCAPdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    renderPlanPage(doc, topic);
    doc.save(`PDCA_Plan_Protocol_${topic.id || 'NEW'}.pdf`);
};

export const generateDOPhasePdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    renderDoPage(doc, topic);
    doc.save(`PDCA_Do_Protocol_${topic.id || 'NEW'}.pdf`);
};

export const generateCheckPhasePdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 22;
    const contentW = pageW - (margin * 2);
    const colGap = 18;
    const halfW = (contentW - colGap) / 2;
    const col4Gap = 10;
    const fourColW = (contentW - (col4Gap * 3)) / 4;
    let y = 28;

    const textColor: [number, number, number] = [10, 19, 36];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const labelColor: [number, number, number] = [17, 24, 39];

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 18) {
            doc.addPage();
            y = 24;
        }
    };

    const sectionLabel = (label: string) => {
        ensureSpace(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), margin, y);
        y += 7.5;
    };

    const smallLabel = (label: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), x, yy);
    };

    const bodyLines = (text: string, width = contentW): string[] => doc.splitTextToSize(cleanValue(text), width);
    const drawBody = (text: string, x: number, yy: number, width = contentW) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(bodyLines(text, width), x, yy);
    };

    const status = topic.status || 'Monitoring';
    const actions = topic.do?.actions || [];
    const totalActions = actions.length;
    const involvedUsers = new Set(actions.flatMap(a => (a.assignments || []).map(p => p.userId))).size;
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
    const actDueDate = cleanValue(topic.do?.checkDate ? formatDate(topic.do.checkDate) : topic.dueDate ? formatDate(topic.dueDate) : '');
    const checkMeetingType = cleanValue(actions[0]?.meetingType || '');
    const checkResponsible = cleanValue(topic.responsibleName || topic.ownerName || '');
    const checkMeetingDateTime = cleanValue(actions[0]?.teamsMeeting ? formatDateTime(actions[0].teamsMeeting) : '');
    const checkOfficeLocation = cleanValue(actions[0]?.meetingLocation || '');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('CHECK PHASE', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Check Phase · ${status}`, margin, y);
    y += 14;

    sectionLabel('Topic Title');
    drawBody(topic.title || '-', margin, y);
    y += bodyLines(topic.title || '-', contentW).length * 5.4 + 9;

    sectionLabel('Execution Summary (From DO Phase)');
    smallLabel('Total Actions', margin, y);
    smallLabel('Involved Users', margin + halfW + colGap, y);
    y += 6;
    drawBody(String(totalActions), margin, y, halfW);
    drawBody(String(involvedUsers), margin + halfW + colGap, y, halfW);
    y += 10;

    sectionLabel('Effectiveness Assessment');
    smallLabel('Assessment Result', margin, y);
    y += 6;
    drawBody(effStatus, margin, y);
    y += bodyLines(effStatus, contentW).length * 5.4 + 5;
    smallLabel('Assessment Description', margin, y);
    y += 6;
    drawBody(assessmentDescription, margin, y);
    y += bodyLines(assessmentDescription, contentW).length * 5.4 + 9;

    sectionLabel('KPI Evaluation');
    smallLabel('Indicator', margin, y);
    smallLabel('Target', margin + fourColW + col4Gap, y);
    smallLabel('Result', margin + (fourColW + col4Gap) * 2, y);
    smallLabel('Status', margin + (fourColW + col4Gap) * 3, y);
    y += 6;
    if (kpiRows.length === 0) {
        drawBody('-', margin, y);
        y += 8;
    } else {
        kpiRows.forEach(row => {
            ensureSpace(8);
            drawBody(row.indicator, margin, y, fourColW);
            drawBody(row.target, margin + fourColW + col4Gap, y, fourColW);
            drawBody(row.result, margin + (fourColW + col4Gap) * 2, y, fourColW);
            drawBody(row.status, margin + (fourColW + col4Gap) * 3, y, fourColW);
            const h = Math.max(
                bodyLines(row.indicator, fourColW).length,
                bodyLines(row.target, fourColW).length,
                bodyLines(row.result, fourColW).length,
                bodyLines(row.status, fourColW).length
            );
            y += h * 5.4 + 3;
        });
    }

    sectionLabel('Effectiveness Review');
    smallLabel('Review', margin, y);
    y += 6;
    drawBody(review, margin, y);
    y += bodyLines(review, contentW).length * 5.4 + 9;

    sectionLabel('ACT Phase Activation');
    smallLabel('Due Date', margin, y);
    y += 6;
    drawBody(actDueDate, margin, y);
    y += 10;

    sectionLabel('CHECK Phase Meeting');
    const c1 = margin;
    const c2 = margin + fourColW + col4Gap;
    const c3 = c2 + fourColW + col4Gap;
    const c4 = c3 + fourColW + col4Gap;
    smallLabel('Meeting Type', c1, y);
    smallLabel('Responsible Person', c2, y);
    smallLabel('Meeting Date & Time', c3, y);
    smallLabel('Office / Location', c4, y);
    y += 6;
    drawBody(checkMeetingType, c1, y, fourColW);
    drawBody(checkResponsible, c2, y, fourColW);
    drawBody(checkMeetingDateTime, c3, y, fourColW);
    drawBody(checkOfficeLocation, c4, y, fourColW);

    doc.save(`PDCA_Check_Phase_${topic.id || 'NEW'}.pdf`);
};

export const generatePlanDoCombinedPdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    renderPlanPage(doc, topic);
    doc.addPage();
    renderDoPage(doc, topic);
    doc.save(`PDCA_Plan_Do_Protocol_${topic.id || 'NEW'}.pdf`);
};

export const generatePlanDoCheckCombinedPdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    renderPlanPage(doc, topic);
    doc.addPage();
    renderDoPage(doc, topic);
    doc.addPage();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 22;
    const contentW = pageW - (margin * 2);
    const colGap = 18;
    const halfW = (contentW - colGap) / 2;
    const col4Gap = 10;
    const fourColW = (contentW - (col4Gap * 3)) / 4;
    let y = 28;

    const textColor: [number, number, number] = [10, 19, 36];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const labelColor: [number, number, number] = [17, 24, 39];

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 18) {
            doc.addPage();
            y = 24;
        }
    };

    const sectionLabel = (label: string) => {
        ensureSpace(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), margin, y);
        y += 7.5;
    };

    const smallLabel = (label: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), x, yy);
    };

    const bodyLines = (text: string, width = contentW): string[] => doc.splitTextToSize(cleanValue(text), width);
    const drawBody = (text: string, x: number, yy: number, width = contentW) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(bodyLines(text, width), x, yy);
    };

    const status = topic.status || 'Monitoring';
    const actions = topic.do?.actions || [];
    const totalActions = actions.length;
    const involvedUsers = new Set(actions.flatMap(a => (a.assignments || []).map(p => p.userId))).size;
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
    const actDueDate = cleanValue(topic.do?.checkDate ? formatDate(topic.do.checkDate) : topic.dueDate ? formatDate(topic.dueDate) : '');
    const checkMeetingType = cleanValue(actions[0]?.meetingType || '');
    const checkResponsible = cleanValue(topic.responsibleName || topic.ownerName || '');
    const checkMeetingDateTime = cleanValue(actions[0]?.teamsMeeting ? formatDateTime(actions[0].teamsMeeting) : '');
    const checkOfficeLocation = cleanValue(actions[0]?.meetingLocation || '');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('CHECK PHASE', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Check Phase · ${status}`, margin, y);
    y += 14;

    sectionLabel('Topic Title');
    drawBody(topic.title || '-', margin, y);
    y += bodyLines(topic.title || '-', contentW).length * 5.4 + 9;

    sectionLabel('Execution Summary (From DO Phase)');
    smallLabel('Total Actions', margin, y);
    smallLabel('Involved Users', margin + halfW + colGap, y);
    y += 6;
    drawBody(String(totalActions), margin, y, halfW);
    drawBody(String(involvedUsers), margin + halfW + colGap, y, halfW);
    y += 10;

    sectionLabel('Effectiveness Assessment');
    smallLabel('Assessment Result', margin, y);
    y += 6;
    drawBody(effStatus, margin, y);
    y += bodyLines(effStatus, contentW).length * 5.4 + 5;
    smallLabel('Assessment Description', margin, y);
    y += 6;
    drawBody(assessmentDescription, margin, y);
    y += bodyLines(assessmentDescription, contentW).length * 5.4 + 9;

    sectionLabel('KPI Evaluation');
    smallLabel('Indicator', margin, y);
    smallLabel('Target', margin + fourColW + col4Gap, y);
    smallLabel('Result', margin + (fourColW + col4Gap) * 2, y);
    smallLabel('Status', margin + (fourColW + col4Gap) * 3, y);
    y += 6;
    if (kpiRows.length === 0) {
        drawBody('-', margin, y);
        y += 8;
    } else {
        kpiRows.forEach(row => {
            ensureSpace(8);
            drawBody(row.indicator, margin, y, fourColW);
            drawBody(row.target, margin + fourColW + col4Gap, y, fourColW);
            drawBody(row.result, margin + (fourColW + col4Gap) * 2, y, fourColW);
            drawBody(row.status, margin + (fourColW + col4Gap) * 3, y, fourColW);
            const h = Math.max(
                bodyLines(row.indicator, fourColW).length,
                bodyLines(row.target, fourColW).length,
                bodyLines(row.result, fourColW).length,
                bodyLines(row.status, fourColW).length
            );
            y += h * 5.4 + 3;
        });
    }

    sectionLabel('Effectiveness Review');
    smallLabel('Review', margin, y);
    y += 6;
    drawBody(review, margin, y);
    y += bodyLines(review, contentW).length * 5.4 + 9;

    sectionLabel('ACT Phase Activation');
    smallLabel('Due Date', margin, y);
    y += 6;
    drawBody(actDueDate, margin, y);
    y += 10;

    sectionLabel('CHECK Phase Meeting');
    const c1 = margin;
    const c2 = margin + fourColW + col4Gap;
    const c3 = c2 + fourColW + col4Gap;
    const c4 = c3 + fourColW + col4Gap;
    smallLabel('Meeting Type', c1, y);
    smallLabel('Responsible Person', c2, y);
    smallLabel('Meeting Date & Time', c3, y);
    smallLabel('Office / Location', c4, y);
    y += 6;
    drawBody(checkMeetingType, c1, y, fourColW);
    drawBody(checkResponsible, c2, y, fourColW);
    drawBody(checkMeetingDateTime, c3, y, fourColW);
    drawBody(checkOfficeLocation, c4, y, fourColW);

    // ACT page (page 4)
    doc.addPage();
    const actPageW = doc.internal.pageSize.getWidth();
    const actPageH = doc.internal.pageSize.getHeight();
    const actMargin = 22;
    const actContentW = actPageW - (actMargin * 2);
    const actColGap = 18;
    const actHalfW = (actContentW - actColGap) / 2;
    let actY = 28;

    const actTextColor: [number, number, number] = [10, 19, 36];
    const actMutedColor: [number, number, number] = [107, 114, 128];
    const actLabelColor: [number, number, number] = [17, 24, 39];

    const ensureActSpace = (needed: number) => {
        if (actY + needed > actPageH - 18) {
            doc.addPage();
            actY = 24;
        }
    };

    const actSectionLabel = (label: string) => {
        ensureActSpace(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(actLabelColor[0], actLabelColor[1], actLabelColor[2]);
        doc.text(label.toUpperCase(), actMargin, actY);
        actY += 7.5;
    };

    const actSmallLabel = (label: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(actLabelColor[0], actLabelColor[1], actLabelColor[2]);
        doc.text(label.toUpperCase(), x, yy);
    };

    const actBodyLines = (text: string, width = actContentW): string[] => doc.splitTextToSize(cleanValue(text), width);
    const drawActBody = (text: string, x: number, yy: number, width = actContentW) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.8);
        doc.setTextColor(actTextColor[0], actTextColor[1], actTextColor[2]);
        doc.text(actBodyLines(text, width), x, yy);
    };

    const actStatus = topic.status || 'Monitoring';
    const inputFromCheck = cleanValue(topic.check?.effectivenessStatus || '');
    const actOutcome = cleanValue(topic.act?.actOutcome || '');
    const outcomeDescription = actOutcome === 'Standardize'
        ? 'Measure is successful. Roll out and update standards.'
        : actOutcome === 'Improve & Re-run PDCA'
            ? 'Improve and re-run PDCA based on findings.'
            : actOutcome === 'Close without Standardization'
                ? 'Close process without standardization.'
                : '-';

    const scopeMap: Record<string, string> = {
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
    const areaMap: Record<string, string> = {
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

    const standardizationScope = (topic.act?.standardizationScope || []).map(v => scopeMap[String(v)] || String(v));
    const affectedAreas = (topic.act?.affectedAreas || []).map(v => areaMap[String(v)] || String(v));
    const standardizationDescription = cleanValue(topic.act?.standardizationDescription || topic.act?.standardization || '');
    const lessonsLearned = cleanValue(topic.act?.lessonsLearned || '');
    const confirmed = !!topic.act?.actConfirmation?.standardized;
    const signedBy = cleanValue(topic.act?.audit?.closedBy || topic.ownerName || '');
    const signedOn = cleanValue(topic.act?.audit?.closedOn ? formatDate(topic.act.audit.closedOn) : formatDate());

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(actTextColor[0], actTextColor[1], actTextColor[2]);
    doc.text('ACT PHASE', actMargin, actY);
    actY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(actMutedColor[0], actMutedColor[1], actMutedColor[2]);
    doc.text(`Act Phase · ${actStatus} · Input from Check: ${inputFromCheck}`, actMargin, actY);
    actY += 14;

    actSectionLabel('Topic Title');
    drawActBody(topic.title || '-', actMargin, actY);
    actY += actBodyLines(topic.title || '-', actContentW).length * 5.4 + 9;

    actSectionLabel('Outcome Decision');
    actSmallLabel('Decision', actMargin, actY);
    actY += 6;
    drawActBody(actOutcome, actMargin, actY);
    actY += actBodyLines(actOutcome, actContentW).length * 5.4 + 5;
    actSmallLabel('Description', actMargin, actY);
    actY += 6;
    drawActBody(outcomeDescription, actMargin, actY);
    actY += actBodyLines(outcomeDescription, actContentW).length * 5.4 + 9;

    actSectionLabel('Standardization Scope');
    if (standardizationScope.length === 0) {
        drawActBody('— -', actMargin, actY);
        actY += 8;
    } else {
        standardizationScope.forEach(item => {
            const line = `— ${item}`;
            drawActBody(line, actMargin, actY);
            actY += actBodyLines(line, actContentW).length * 5.4;
        });
        actY += 4;
    }

    actSectionLabel('Affected Areas / Rollout');
    if (affectedAreas.length === 0) {
        drawActBody('— -', actMargin, actY);
        actY += 8;
    } else {
        affectedAreas.forEach(item => {
            const line = `— ${item}`;
            drawActBody(line, actMargin, actY);
            actY += actBodyLines(line, actContentW).length * 5.4;
        });
        actY += 4;
    }

    actSectionLabel('Standardization Description');
    actSmallLabel('Description', actMargin, actY);
    actY += 6;
    drawActBody(standardizationDescription, actMargin, actY);
    actY += actBodyLines(standardizationDescription, actContentW).length * 5.4 + 9;

    actSectionLabel('Lessons Learned');
    actSmallLabel('Key Takeaways', actMargin, actY);
    actY += 6;
    drawActBody(lessonsLearned, actMargin, actY);
    actY += actBodyLines(lessonsLearned, actContentW).length * 5.4 + 9;

    actSectionLabel('ACT Phase Confirmation & Sign-off');
    actSmallLabel('Confirmation', actMargin, actY);
    actY += 6;
    drawActBody(confirmed ? '✓ I confirm that the improvement has been standardized and documented.' : '□ Confirmation not provided.', actMargin, actY);
    actY += actBodyLines(confirmed ? '✓ I confirm that the improvement has been standardized and documented.' : '□ Confirmation not provided.', actContentW).length * 5.4 + 8;

    actSmallLabel('Signed By', actMargin, actY);
    actSmallLabel('Date', actMargin + actHalfW + actColGap, actY);
    actY += 6;
    drawActBody(signedBy, actMargin, actY, actHalfW);
    drawActBody(signedOn, actMargin + actHalfW + actColGap, actY, actHalfW);

    doc.save(`PDCA_All_Phases_Protocol_${topic.id || 'NEW'}.pdf`);
};

export const generateActPhasePdf = (topic: Topic) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 22;
    const contentW = pageW - (margin * 2);
    const colGap = 18;
    const halfW = (contentW - colGap) / 2;
    let y = 28;

    const textColor: [number, number, number] = [10, 19, 36];
    const mutedColor: [number, number, number] = [107, 114, 128];
    const labelColor: [number, number, number] = [17, 24, 39];

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 18) {
            doc.addPage();
            y = 24;
        }
    };

    const sectionLabel = (label: string) => {
        ensureSpace(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), margin, y);
        y += 7.5;
    };

    const smallLabel = (label: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
        doc.text(label.toUpperCase(), x, yy);
    };

    const bodyLines = (text: string, width = contentW): string[] => doc.splitTextToSize(cleanValue(text), width);
    const drawBody = (text: string, x: number, yy: number, width = contentW) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(bodyLines(text, width), x, yy);
    };

    const status = topic.status || 'Monitoring';
    const inputFromCheck = cleanValue(topic.check?.effectivenessStatus || '');
    const actOutcome = cleanValue(topic.act?.actOutcome || '');
    const outcomeDescription = actOutcome === 'Standardize'
        ? 'Measure is successful. Roll out and update standards.'
        : actOutcome === 'Improve & Re-run PDCA'
            ? 'Improve and re-run PDCA based on findings.'
            : actOutcome === 'Close without Standardization'
                ? 'Close process without standardization.'
                : '-';

    const scopeMap: Record<string, string> = {
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
    const areaMap: Record<string, string> = {
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

    const standardizationScope = (topic.act?.standardizationScope || []).map(v => scopeMap[String(v)] || String(v));
    const affectedAreas = (topic.act?.affectedAreas || []).map(v => areaMap[String(v)] || String(v));
    const standardizationDescription = cleanValue(topic.act?.standardizationDescription || topic.act?.standardization || '');
    const lessonsLearned = cleanValue(topic.act?.lessonsLearned || '');
    const confirmed = !!topic.act?.actConfirmation?.standardized;
    const signedBy = cleanValue(topic.act?.audit?.closedBy || topic.ownerName || '');
    const signedOn = cleanValue(topic.act?.audit?.closedOn ? formatDate(topic.act.audit.closedOn) : formatDate());

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('ACT PHASE', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Act Phase · ${status} · Input from Check: ${inputFromCheck}`, margin, y);
    y += 14;

    sectionLabel('Topic Title');
    drawBody(topic.title || '-', margin, y);
    y += bodyLines(topic.title || '-', contentW).length * 5.4 + 9;

    sectionLabel('Outcome Decision');
    smallLabel('Decision', margin, y);
    y += 6;
    drawBody(actOutcome, margin, y);
    y += bodyLines(actOutcome, contentW).length * 5.4 + 5;
    smallLabel('Description', margin, y);
    y += 6;
    drawBody(outcomeDescription, margin, y);
    y += bodyLines(outcomeDescription, contentW).length * 5.4 + 9;

    sectionLabel('Standardization Scope');
    if (standardizationScope.length === 0) {
        drawBody('— -', margin, y);
        y += 8;
    } else {
        standardizationScope.forEach(item => {
            const line = `— ${item}`;
            drawBody(line, margin, y);
            y += bodyLines(line, contentW).length * 5.4;
        });
        y += 4;
    }

    sectionLabel('Affected Areas / Rollout');
    if (affectedAreas.length === 0) {
        drawBody('— -', margin, y);
        y += 8;
    } else {
        affectedAreas.forEach(item => {
            const line = `— ${item}`;
            drawBody(line, margin, y);
            y += bodyLines(line, contentW).length * 5.4;
        });
        y += 4;
    }

    sectionLabel('Standardization Description');
    smallLabel('Description', margin, y);
    y += 6;
    drawBody(standardizationDescription, margin, y);
    y += bodyLines(standardizationDescription, contentW).length * 5.4 + 9;

    sectionLabel('Lessons Learned');
    smallLabel('Key Takeaways', margin, y);
    y += 6;
    drawBody(lessonsLearned, margin, y);
    y += bodyLines(lessonsLearned, contentW).length * 5.4 + 9;

    sectionLabel('ACT Phase Confirmation & Sign-off');
    smallLabel('Confirmation', margin, y);
    y += 6;
    drawBody(confirmed ? '✓ I confirm that the improvement has been standardized and documented.' : '□ Confirmation not provided.', margin, y);
    y += bodyLines(confirmed ? '✓ I confirm that the improvement has been standardized and documented.' : '□ Confirmation not provided.', contentW).length * 5.4 + 8;

    smallLabel('Signed By', margin, y);
    smallLabel('Date', margin + halfW + colGap, y);
    y += 6;
    drawBody(signedBy, margin, y, halfW);
    drawBody(signedOn, margin + halfW + colGap, y, halfW);

    doc.save(`PDCA_Act_Phase_${topic.id || 'NEW'}.pdf`);
};
