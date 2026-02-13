import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Topic, KPIEvaluation } from '../types';

interface Action {
    id: string;
    title: string;
    description: string;
    assignments: { userId: string; userName: string }[];
    dueDate: string;
    status: string;
    meetingType?: string;
}

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

export const generatePDCAPdf = (topic: Topic) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.width; // 210mm
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 20;

    // --- COLORS ---
    const c = {
        primary: [22, 163, 74],      // #16a34a (Green-600) - Main Brand Accent
        secondary: [100, 116, 139],  // #64748b (Slate-500) - Secondary Text
        text: [30, 41, 59],          // #1e293b (Slate-800) - Main Text
        bgLight: [248, 250, 252],    // #f8fafc (Slate-50)  - Box Background
        border: [226, 232, 240],     // #e2e8f0 (Slate-200) - Borders
        white: [255, 255, 255],      // #ffffff

        // Phase Colors (Approximations of the gradients/solid bars)
        plan: [6, 182, 212],    // #06b6d4 (Cyan-500)
        do: [34, 197, 94],      // #22c55e (Green-500) 
        check: [244, 63, 94],   // #f43f5e (Rose-500) - "Warm" tone
        act: [99, 102, 241],    // #6366f1 (Indigo-500)
    };

    // --- HELPER FUNCTIONS ---

    const checkPageBreak = (heightNeeded: number) => {
        if (currentY + heightNeeded > pageHeight - margin) {
            doc.addPage();
            currentY = 20;
            return true;
        }
        return false;
    };

    // Header for phases: Colored bar with Number Badge and Title
    const renderPhaseHeader = (number: string, title: string, color: number[]) => {
        checkPageBreak(25);

        // Full width bar
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'F');

        // Number badge circle (white)
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 10, currentY + 7, 4, 'F');

        // Text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(number, margin + 10, currentY + 8.5, { align: 'center' }); // Number inside circle

        doc.setFontSize(11);
        doc.text(`${title}`, margin + 20, currentY + 9);

        currentY += 22;
    };

    // Grey data block with green left border
    const renderDataBlock = (label: string, value: string | undefined) => {
        const text = value || '-';
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const splitText = doc.splitTextToSize(text, contentWidth - 12); // padding
        const textHeight = splitText.length * 5;
        const boxHeight = textHeight + 18; // 8px top, 8px mid, 8px bot padding approx

        checkPageBreak(boxHeight);

        // Background
        doc.setFillColor(c.bgLight[0], c.bgLight[1], c.bgLight[2]);
        doc.rect(margin, currentY, contentWidth, boxHeight, 'F');

        // Left Green Accent
        doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
        doc.rect(margin, currentY, 1.5, boxHeight, 'F');

        // Label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
        doc.text(label.toUpperCase(), margin + 6, currentY + 8);

        // Value
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(c.text[0], c.text[1], c.text[2]);
        doc.text(splitText, margin + 6, currentY + 15);

        currentY += boxHeight + 6;
    };

    // Stats Row (Used in Do and Check)
    const renderStatsRow = (actions: Action[]) => {
        const completed = actions.filter((a) => a.status === 'Done').length;
        const involved = new Set(actions.flatMap((a) => a.assignments.map((u) => u.userId))).size;

        checkPageBreak(25);
        const cardGap = 5;
        const cardWidth = (contentWidth - (cardGap * 2)) / 3;
        const h = 20;

        const stats = [
            { val: actions.length.toString(), lbl: 'TOTAL ACTIONS' },
            { val: `${completed}/${actions.length}`, lbl: 'COMPLETED ACTIONS' }, // Originally "0/1"
            { val: involved.toString(), lbl: 'INVOLVED USERS' } // Originally "0"
        ];

        let startX = margin;
        stats.forEach(stat => {
            // Card Box
            doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(startX, currentY, cardWidth, h, 1, 1, 'FD');

            // Value
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(c.primary[0], c.primary[1], c.primary[2]); // Green
            doc.text(stat.val, startX + (cardWidth / 2), currentY + 9, { align: 'center' });

            // Label
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
            doc.text(stat.lbl, startX + (cardWidth / 2), currentY + 15, { align: 'center' });

            startX += cardWidth + cardGap;
        });

        currentY += h + 8;
    };


    // --- DOCUMENT CONTENT START ---

    // 1. HEADER
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.text[0], c.text[1], c.text[2]);
    doc.text('PDCA Process Documentation', margin, currentY);
    currentY += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
    doc.text('Complete Process Report - Healthcare Governance / Clinical Improvement', margin, currentY);
    currentY += 4;

    // Green Divider Line
    doc.setDrawColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Summary Box (Process Metadata)
    const metaLabels = [
        { l: 'Process Title:', v: topic.title },
        { l: 'Reference ID:', v: topic.id || 'T-838' },
        { l: 'Process Owner:', v: topic.ownerName || 'Dr. Sophia Mayer' },
        { l: 'Status:', v: topic.status === 'Done' ? 'Standardized & Documented' : (topic.status || 'Draft') },
        { l: 'Generated Date:', v: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
    ];

    const metaBoxHeight = (metaLabels.length * 6) + 10;

    // Bg & Border
    doc.setFillColor(c.bgLight[0], c.bgLight[1], c.bgLight[2]); // very light gray
    doc.rect(margin, currentY, contentWidth, metaBoxHeight, 'F');
    // Left Accent
    doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.rect(margin, currentY, 1.5, metaBoxHeight, 'F');

    // Content
    let mycharsY = currentY + 8;
    metaLabels.forEach(m => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(c.text[0], c.text[1], c.text[2]);
        doc.text(m.l, margin + 8, mycharsY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(m.v, margin + 45, mycharsY);

        mycharsY += 6;
    });

    currentY += metaBoxHeight + 15;


    // --- PHASE 1: PLAN ---
    renderPhaseHeader('1', 'PLAN Phase', c.plan);

    // Fields
    renderDataBlock('Current State (AS-IS)', topic.plan?.asIs);
    renderDataBlock('Target State (TO-BE)', topic.plan?.toBe);
    renderDataBlock('Root Cause', topic.plan?.rootCause);
    renderDataBlock('Purpose', topic.objective || topic.plan.objectives?.[0] || topic.plan?.description);
    renderDataBlock('Cycle', topic.plan?.description);
    renderDataBlock('Status', topic.status);


    // --- PHASE 2: DO ---
    renderPhaseHeader('2', 'DO Phase - Execution', c.do);

    renderDataBlock('Target Goal', topic.plan?.toBe || 'Achieve 95% compliance...');

    const actions = topic.do?.actions || [];
    renderStatsRow(actions);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
    doc.text('EXECUTION ACTIONS', margin, currentY);
    currentY += 6;

    if (actions.length > 0) {
        actions.forEach(a => {
            const desc = doc.splitTextToSize(a.description || 'No implementation details', contentWidth - 10);
            const contentH = (desc.length * 4) + 26;
            checkPageBreak(contentH);

            // Card Style
            doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(margin, currentY, contentWidth, contentH, 1, 1, 'S'); // Border only
            // Left Accent
            doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
            doc.rect(margin, currentY, 1.5, contentH, 'F');

            // Title
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(c.primary[0], c.primary[1], c.primary[2]); // Green title
            doc.text(a.title || 'Untitled Action', margin + 6, currentY + 6);

            // Desc
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(c.text[0], c.text[1], c.text[2]);
            doc.text(desc, margin + 6, currentY + 12);

            let detY = currentY + 12 + (desc.length * 4);

            // Sub-fields
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);

            doc.text('Responsible:', margin + 6, detY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(c.text[0], c.text[1], c.text[2]);
            doc.text(a.assignments.map(u => u.userName).join(', ') || 'Unassigned', margin + 30, detY);

            detY += 4;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
            doc.text('Due Date:', margin + 6, detY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(c.text[0], c.text[1], c.text[2]);
            doc.text(a.dueDate || '-', margin + 30, detY);

            detY += 4;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
            doc.text('Meeting Type:', margin + 6, detY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(c.text[0], c.text[1], c.text[2]);
            doc.text(a.meetingType || '-', margin + 30, detY);

            currentY += contentH + 4;
        });
    } else {
        doc.setFontSize(9);
        doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
        doc.text('No actions defined.', margin, currentY + 2);
        currentY += 10;
    }

    // CHECK PHASE TRIGGER
    const triggerText = `Due Date: ${topic.do?.checkDate || 'To be specified'}\nNote: The effectiveness check will be performed after the implementation is completed.`;
    renderDataBlock('Check Phase Trigger', triggerText);


    // --- PHASE 3: CHECK ---
    renderPhaseHeader('3', 'CHECK Phase - Evaluation', c.check);

    // Reuse stats from DO phase
    renderStatsRow(actions);

    // 1. Effectiveness Assessment
    if (topic.check?.effectivenessStatus) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
        doc.text('1. EFFECTIVENESS ASSESSMENT', margin, currentY);
        currentY += 5;

        // Block
        doc.setFillColor(c.bgLight[0], c.bgLight[1], c.bgLight[2]);
        doc.rect(margin, currentY, contentWidth, 20, 'F');
        doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]); // Green Left Accent
        doc.rect(margin, currentY, 1.5, 20, 'F');

        // Badge
        const status = topic.check.effectivenessStatus;
        let badgeCol = [100, 100, 100];
        if (status === 'Effective') badgeCol = c.primary;
        else if (status === 'Partially Effective') badgeCol = [234, 179, 8];
        else badgeCol = [239, 68, 68];

        doc.setFillColor(badgeCol[0], badgeCol[1], badgeCol[2]);
        doc.roundedRect(margin + 6, currentY + 4, 30, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text(status, margin + 21, currentY + 8, { align: 'center' });

        // Text
        doc.setTextColor(c.text[0], c.text[1], c.text[2]);
        doc.setFontSize(9);
        doc.text(`Status: Objective ${status === 'Effective' ? 'fully met' : 'partially met'}. Ready to ${status === 'Effective' ? 'Standardization' : 'Review'}.`, margin + 6, currentY + 16);

        currentY += 26;
    }

    // 2. KPI Evaluation
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
    doc.text('2. KPI EVALUATION RESULTS', margin, currentY);
    currentY += 4;

    const kpiRows = (topic.check?.kpiEvaluations || []).map((k: KPIEvaluation) => [
        k.name, k.targetValue, k.actualResult, k.status
    ]);

    if (kpiRows.length > 0) {
        autoTable(doc, {
            startY: currentY,
            head: [['KPI Name', 'Target', 'Actual', 'Status']],
            body: kpiRows,
            theme: 'plain',
            headStyles: {
                fillColor: [c.bgLight[0], c.bgLight[1], c.bgLight[2]],
                textColor: [c.text[0], c.text[1], c.text[2]],
                fontStyle: 'bold',
                lineWidth: 0,
                cellPadding: 4
            },
            bodyStyles: {
                textColor: [c.text[0], c.text[1], c.text[2]],
                fontSize: 9,
                cellPadding: 4,
                lineColor: [c.border[0], c.border[1], c.border[2]],
                lineWidth: 0.1 // Bottom borders
            },
            columnStyles: {
                3: { fontStyle: 'bold', textColor: [c.primary[0], c.primary[1], c.primary[2]] }
            },
            margin: { left: margin, right: margin }
        });
        currentY = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.text('No KPIs recorded.', margin, currentY + 4);
        currentY += 10;
    }

    // 3. Effectiveness Review
    renderDataBlock('3. Effectiveness Review', topic.check?.effectivenessReview);


    // --- PHASE 4: ACT ---
    renderPhaseHeader('4', 'ACT Phase - Standardization', c.act);

    renderDataBlock('PROCESS TITLE', topic.title);

    // 1. Outcome Decision (3 Cards)
    checkPageBreak(35);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
    doc.text('1. OUTCOME DECISION', margin, currentY);
    currentY += 6;

    const outcomes = ['Standardize', 'Improve & Re-run PDCA', 'Close without Standardization'];
    const selectedOutcome = topic.act?.actOutcome || 'Standardize';
    const cardW = (contentWidth - 10) / 3;
    const cardH = 20;

    // Center the single card
    let ox = margin + (contentWidth - cardW) / 2;

    // Filter to show only the selected outcome
    const displayedOutcomes = outcomes.filter(o => o === selectedOutcome);

    displayedOutcomes.forEach(opt => {
        const isSelected = true; // Always true since we filter by selectedOutcome

        // If selected: Green Border, Light Green Fill. Else Gray Border, White Fill.
        const drawCol = c.primary;
        const fillCol = [240, 253, 244];

        doc.setDrawColor(drawCol[0], drawCol[1], drawCol[2]);
        doc.setFillColor(fillCol[0], fillCol[1], fillCol[2]);
        doc.roundedRect(ox, currentY, cardW, cardH, 1, 1, 'FD');

        // Icon/Text
        doc.setFontSize(8);
        doc.setTextColor(c.primary[0], c.primary[1], c.primary[2]);

        const mark = isSelected ? '✔' : (opt.includes('Close') ? '✘' : '↻');

        // Fix: Split text to fit card width
        const splitOpt = doc.splitTextToSize(`${mark}  ${opt}`, cardW - 10);
        doc.text(splitOpt, ox + 5, currentY + 8);

        // Subtext (dummy)
        doc.setFontSize(6);
        doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
        const sub = isSelected ? 'Measure is successful.' : 'Action required.';

        // Adjust subtext Y position if title wraps
        const subY = splitOpt.length > 1 ? currentY + 16 : currentY + 14;
        doc.text(sub, ox + 5, subY);

        ox += cardW + 5;
    });
    currentY += cardH + 10;

    // 2. Lessons Learned
    renderDataBlock('2. LESSONS LEARNED', `Key Takeaways from this Initiative:\n\n${topic.act?.lessonsLearned || 'No lessons recorded.'}`);

    // 3. Confirmation
    // Calculate dynamic height needed for content
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const standardCheck = topic.act?.actConfirmation?.standardized ? '✔' : '○'; // Keep verify check logic if needed for other things, but prompt only asked for specific text.

    // Determine the single confirmation text based on selected outcome
    let confirmationSentence = "";
    if (selectedOutcome === 'Improve & Re-run PDCA') {
        confirmationSentence = "I confirm that the PDCA will be rerun for improvements.";
    } else if (selectedOutcome === 'Close without Standardization') {
        confirmationSentence = "I confirm that the topic is ready to be closed.";
    } else {
        // Default to Standardize
        // Force line break exactly after "been"
        confirmationSentence = "I confirm that the improvement has been\nstandardized and documented.";
    }

    // Ensure correct font context is set before splitting text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const confText = `Confirmed: ${confirmationSentence}`;

    // Width available for text: contentWidth - left padding (6) - right padding (10)
    // Reducing textWidth ensures wrapping happens before the edge
    const textWidth = contentWidth - 16;

    // Use splitTextToSize to respect both width constraints AND the explicit newline
    const splitConf = doc.splitTextToSize(confText, textWidth);

    const nextStepsText = "This standardized protocol will be rolled out across all clinical departments. Documentation will be updated in the organizational standard operating procedures, and the protocol will be included in onboarding training.";
    // Ensure wrapping for next steps as well
    doc.setFont('helvetica', 'normal');
    const splitNextSteps = doc.splitTextToSize(nextStepsText, contentWidth - 31); // 25 + 6

    // Calculate box height requirements
    const h1 = splitConf.length * 5;
    const hNext = splitNextSteps.length * 4.5;

    // Base padding (10 top) + h1 + gap(10) + NextTitle(4) + hNext + padding(10)
    // Removed h2 logic
    const requiredHeight = 10 + h1 + 10 + 4 + hNext + 10;
    const boxHeight = Math.max(50, requiredHeight); // Maintain min height of 50

    checkPageBreak(boxHeight + 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.secondary[0], c.secondary[1], c.secondary[2]);
    doc.text('3. ACT PHASE CONFIRMATION & SIGN-OFF', margin, currentY);
    currentY += 6;

    // Box
    doc.setFillColor(c.bgLight[0], c.bgLight[1], c.bgLight[2]);
    doc.rect(margin, currentY, contentWidth, boxHeight, 'F');

    let cy = currentY + 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    // Changed to black text as requested
    doc.setTextColor(c.text[0], c.text[1], c.text[2]);

    doc.text(splitConf, margin + 6, cy);
    cy += (splitConf.length * 5) + 10;

    doc.setTextColor(c.text[0], c.text[1], c.text[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Next Steps:', margin + 6, cy);
    doc.setFont('helvetica', 'normal');
    doc.text(splitNextSteps, margin + 25, cy);

    // Save file
    doc.save(`PDCA_Process_${topic.id || 'Ref'}_Standardized.pdf`);
};
