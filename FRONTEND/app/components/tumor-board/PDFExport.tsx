'use client';

import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

// --- Interfaces ---

interface Finding {
    category: string;
    title: string;
    value: string;
    severity: string;
    source_agent: string;
    interpretation?: string;
}

interface Recommendation {
    category: string;
    text: string;
    priority: string;
    rationale?: string;
    evidence_level?: string;
}

interface MultiAgentView {
    patient_id: string;
    patient_name: string;
    patient_age?: string;
    patient_gender?: string;
    executive_summary: string;
    staging?: {
        clinical_stage?: string;
        pathological_stage?: string;
        tnm_staging?: string;
    };
    findings: {
        imaging: Finding[];
        pathology: Finding[];
        clinical: Finding[];
        biomarkers: Finding[];
    };
    recommendations: {
        treatment: Recommendation[];
        imaging: Recommendation[];
        other: Recommendation[];
        diagnostic?: Recommendation[];
    };
    clinical_trials?: { name: string; source?: string; eligibility?: string }[];
    warnings: string[];
    overall_confidence: string;
    processing_time_seconds: number;
    agents_used: string[];
    diagnostic_status?: string;
    data_completeness_score?: number;
    missing_critical_data?: string[];
    confidence_justification?: string;
}

interface TumorBoardCase {
    id: string;
    createdAt: string;
    patient?: {
        name: string;
        patientId: string;
        age?: string;
        gender?: string;
    };
    finalDecision?: string | null;
}

// --- Fresh Modern Color Palette ---

const COLORS = {
    primary: [15, 23, 42] as [number, number, number],        // Slate-900
    primaryLight: [241, 245, 249] as [number, number, number], // Slate-100
    accent: [99, 102, 241] as [number, number, number],       // Indigo-500
    accentLight: [238, 242, 255] as [number, number, number], // Indigo-50

    text: {
        primary: [15, 23, 42] as [number, number, number],     // Slate-900
        secondary: [100, 116, 139] as [number, number, number], // Slate-500
        tertiary: [148, 163, 184] as [number, number, number],  // Slate-400
        white: [255, 255, 255] as [number, number, number]
    },

    status: {
        critical: [239, 68, 68] as [number, number, number],   // Red-500
        warning: [245, 158, 11] as [number, number, number],   // Amber-500
        success: [34, 197, 94] as [number, number, number],    // Green-500
        info: [59, 130, 246] as [number, number, number]       // Blue-500
    },

    bg: {
        critical: [254, 242, 242] as [number, number, number], // Red-50
        warning: [255, 251, 235] as [number, number, number],  // Amber-50
        success: [240, 253, 244] as [number, number, number],  // Green-50
        info: [239, 246, 255] as [number, number, number],     // Blue-50
        neutral: [248, 250, 252] as [number, number, number],  // Slate-50
        white: [255, 255, 255] as [number, number, number]
    },

    border: {
        light: [226, 232, 240] as [number, number, number],    // Slate-200
        medium: [203, 213, 225] as [number, number, number],   // Slate-300
        dark: [148, 163, 184] as [number, number, number]      // Slate-400
    }
};

// --- PDF Generator ---

export function generateTumorBoardPDF(
    caseData: TumorBoardCase,
    _legacyView: any | null,
    view: MultiAgentView | null
): void {
    if (!view) {
        console.error("No multi-agent view provided for PDF generation");
        return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 20;

    // --- Helper Functions ---

    const addText = (
        text: string,
        x: number,
        y: number,
        size: number,
        color: [number, number, number],
        fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
        align: 'left' | 'center' | 'right' = 'left',
        maxWidth?: number
    ) => {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont('helvetica', fontStyle);

        if (maxWidth) {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y, { align });
            return lines.length * (size * 0.5); // Return height used
        } else {
            doc.text(text, x, y, { align });
            return size * 0.5;
        }
    };

    const drawSectionHeader = (title: string, y: number) => {
        // Background bar
        doc.setFillColor(...COLORS.primaryLight);
        doc.rect(margin, y, contentWidth, 10, 'F');

        // Accent line
        doc.setFillColor(...COLORS.accent);
        doc.rect(margin, y, 3, 10, 'F');

        addText(title, margin + 8, y + 7, 10, COLORS.text.primary, 'bold');
        return y + 18;
    };

    const checkPageBreak = (neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - 35) {
            doc.addPage();
            currentY = margin;
            return true;
        }
        return false;
    };

    const drawCard = (y: number, height: number, fillColor?: [number, number, number]) => {
        doc.setFillColor(...(fillColor || COLORS.bg.white));
        doc.setDrawColor(...COLORS.border.light);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, y, contentWidth, height, 1.5, 1.5, 'FD');
    };

    // --- 1. HEADER ---

    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    addText("CYNO", margin, 16, 20, COLORS.text.white, 'bold');
    addText("Tumor Board Comprehensive Report", margin, 26, 10, [203, 213, 225] as [number, number, number]);

    const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    addText(dateStr, pageWidth - margin, 16, 9, [203, 213, 225] as [number, number, number], 'normal', 'right');
    addText(`Case ID: ${caseData.id.slice(0, 12)}`, pageWidth - margin, 24, 9, [203, 213, 225] as [number, number, number], 'normal', 'right');

    currentY = 52;

    // --- 2. PATIENT INFORMATION CARD ---

    const patientCardHeight = 32;
    drawCard(currentY, patientCardHeight);

    const pName = view.patient_name || caseData.patient?.name || "Unknown Patient";
    addText(pName, margin + 10, currentY + 12, 14, COLORS.text.primary, 'bold');

    const demo = [
        view.patient_id ? `ID: ${view.patient_id}` : null,
        view.patient_age ? `Age: ${view.patient_age}` : null,
        view.patient_gender ? `Gender: ${view.patient_gender}` : null
    ].filter(Boolean).join(" • ");

    addText(demo, margin + 10, currentY + 22, 9, COLORS.text.secondary);

    // Confidence Badge - Fixed positioning
    const conf = view.overall_confidence || 'low';
    let confColor = COLORS.status.warning;
    let confBg = COLORS.bg.warning;

    if (conf === 'high') {
        confColor = COLORS.status.success;
        confBg = COLORS.bg.success;
    }
    if (conf === 'very_low' || conf === 'low') {
        confColor = COLORS.status.critical;
        confBg = COLORS.bg.critical;
    }

    const badgeX = pageWidth - margin - 45;
    const badgeY = currentY + 6;
    const badgeWidth = 40;
    const badgeHeight = 20;

    doc.setFillColor(...confBg);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
    doc.setDrawColor(...confColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'S');

    addText("CONFIDENCE", badgeX + (badgeWidth / 2), badgeY + 7, 7, confColor, 'bold', 'center');
    addText(conf.toUpperCase().replace('_', ' '), badgeX + (badgeWidth / 2), badgeY + 14, 8, confColor, 'bold', 'center');

    currentY += patientCardHeight + 12;

    // --- 3. SAFETY BANNER ---

    const isPending = view.diagnostic_status && view.diagnostic_status !== 'ready_for_review';

    if (isPending) {
        checkPageBreak(50);

        const bannerHeight = 38;
        doc.setFillColor(...COLORS.bg.critical);
        doc.setDrawColor(...COLORS.status.critical);
        doc.setLineWidth(1.5);
        doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 2, 2, 'FD');

        // Warning icon
        doc.setFontSize(18);
        doc.setTextColor(...COLORS.status.critical);
        doc.text("⚠", margin + 8, currentY + 14);

        // Title
        addText("DIAGNOSTIC WORKUP REQUIRED", margin + 20, currentY + 12, 10, COLORS.status.critical, 'bold');

        // Description
        const warningMsg = "Diagnosis is NOT CONFIRMED. Treatment recommendations are withheld pending diagnostic completion.";
        const warningLines = doc.splitTextToSize(warningMsg, contentWidth - 30);
        addText(warningLines, margin + 20, currentY + 22, 9, COLORS.status.critical);

        // Missing data
        if (view.missing_critical_data?.length) {
            const missing = "Missing: " + view.missing_critical_data.join(", ");
            const missingLines = doc.splitTextToSize(missing, contentWidth - 30);
            addText(missingLines, margin + 20, currentY + 30, 8, COLORS.status.critical, 'italic');
        }

        currentY += bannerHeight + 12;
    }

    // --- 4. EXECUTIVE SUMMARY ---

    checkPageBreak(40);
    currentY = drawSectionHeader("Executive Summary", currentY);

    const summaryText = view.executive_summary || "No summary available.";
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 20);
    const summaryHeight = (summaryLines.length * 5) + 20;

    drawCard(currentY, summaryHeight);
    addText(summaryLines, margin + 10, currentY + 12, 10, COLORS.text.secondary);

    currentY += summaryHeight + 14;

    // --- 5. FINDINGS SECTIONS ---

    const findingsConfig = [
        {
            title: "Radiology Findings",
            data: view.findings.imaging,
            color: [59, 130, 246] as [number, number, number]  // Blue-500
        },
        {
            title: "Pathology Findings",
            data: view.findings.pathology,
            color: [168, 85, 247] as [number, number, number]  // Purple-500
        },
        {
            title: "Clinical Findings",
            data: view.findings.clinical,
            color: [34, 197, 94] as [number, number, number]   // Green-500
        },
        {
            title: "Biomarker Results",
            data: view.findings.biomarkers,
            color: [245, 158, 11] as [number, number, number]  // Amber-500
        }
    ];

    findingsConfig.forEach(section => {
        if (!section.data || section.data.length === 0) return;

        checkPageBreak(45);
        currentY = drawSectionHeader(section.title, currentY);

        const tableBody = section.data.map(f => {
            let valueText = f.value || "None";
            if (f.interpretation && f.interpretation !== "None") {
                valueText += `\n${f.interpretation}`;
            }
            return [
                f.title || "Unknown",
                valueText,
                (f.severity || "info").toUpperCase()
            ];
        });

        autoTable(doc, {
            startY: currentY,
            head: [['Finding', 'Value & Interpretation', 'Severity']],
            body: tableBody,
            theme: 'striped',
            headStyles: {
                fillColor: section.color,
                textColor: COLORS.text.white,
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 5
            },
            styles: {
                fontSize: 9,
                cellPadding: 5,
                valign: 'top',
                textColor: COLORS.text.secondary,
                lineColor: COLORS.border.light,
                lineWidth: 0.1
            },
            alternateRowStyles: {
                fillColor: COLORS.bg.neutral
            },
            columnStyles: {
                0: {
                    fontStyle: 'bold',
                    cellWidth: 55,
                    textColor: COLORS.text.primary
                },
                1: { cellWidth: 85 },
                2: {
                    cellWidth: 25,
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'center'
                }
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 2) {
                    const sev = (data.cell.raw as string).toLowerCase();
                    if (sev === 'critical' || sev === 'high') {
                        data.cell.styles.textColor = COLORS.status.critical;
                    } else if (sev === 'moderate') {
                        data.cell.styles.textColor = COLORS.status.warning;
                    } else {
                        data.cell.styles.textColor = COLORS.text.tertiary;
                    }
                }
            },
            margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 14;
    });

    // --- 6. RECOMMENDATIONS ---

    const recommendations = [];

    if (view.recommendations.diagnostic?.length) {
        recommendations.push({
            title: "Diagnostic Next Steps",
            items: view.recommendations.diagnostic,
            color: COLORS.status.warning,
            bgColor: COLORS.bg.warning
        });
    }

    if (view.recommendations.treatment?.length) {
        recommendations.push({
            title: "Treatment Recommendations",
            items: view.recommendations.treatment,
            color: COLORS.status.success,
            bgColor: COLORS.bg.success
        });
    }

    if (view.recommendations.other?.length) {
        recommendations.push({
            title: "Additional Recommendations",
            items: view.recommendations.other,
            color: COLORS.accent,
            bgColor: COLORS.accentLight
        });
    }

    recommendations.forEach(recSection => {
        checkPageBreak(45);
        currentY = drawSectionHeader(recSection.title, currentY);

        recSection.items.forEach((item) => {
            const estimatedHeight = 30;
            checkPageBreak(estimatedHeight);

            // Priority color
            let priColor = COLORS.text.tertiary;
            if (item.priority === 'urgent' || item.priority === 'high') {
                priColor = COLORS.status.critical;
            } else if (item.priority === 'moderate') {
                priColor = COLORS.status.warning;
            }

            // Calculate actual card height
            const textLines = doc.splitTextToSize(item.text, contentWidth - 50);
            let cardHeight = 20 + (textLines.length * 5);

            if (item.rationale) {
                const ratLines = doc.splitTextToSize(item.rationale, contentWidth - 50);
                cardHeight += (ratLines.length * 4.5) + 5;
            }

            drawCard(currentY, cardHeight);

            // Priority dot
            doc.setFillColor(...priColor);
            doc.circle(margin + 7, currentY + 9, 2, 'F');

            // Priority badge
            doc.setFillColor(...recSection.bgColor);
            doc.roundedRect(margin + 13, currentY + 5, 30, 8, 1, 1, 'F');
            addText(
                item.priority.toUpperCase(),
                margin + 28,
                currentY + 10,
                7,
                priColor,
                'bold',
                'center'
            );

            // Recommendation text
            addText(textLines, margin + 47, currentY + 10, 9, COLORS.text.primary, 'bold');
            let textY = currentY + 10 + (textLines.length * 5);

            // Rationale
            if (item.rationale) {
                const ratLines = doc.splitTextToSize(item.rationale, contentWidth - 50);
                addText(ratLines, margin + 47, textY + 4, 8, COLORS.text.secondary);
            }

            currentY += cardHeight + 8;
        });
        currentY += 6;
    });

    // --- 7. FINAL DECISION ---

    if (caseData.finalDecision) {
        checkPageBreak(45);

        // Header bar
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(margin, currentY, contentWidth, 10, 1, 1, 'F');
        addText(
            "FINAL TUMOR BOARD DECISION",
            margin + 8,
            currentY + 7,
            9,
            COLORS.text.white,
            'bold'
        );

        currentY += 12;

        const decLines = doc.splitTextToSize(caseData.finalDecision, contentWidth - 20);
        const decHeight = (decLines.length * 5) + 20;

        drawCard(currentY, decHeight);
        addText(decLines, margin + 10, currentY + 12, 10, COLORS.text.primary);

        currentY += decHeight;
    }

    // --- 8. FOOTER ---

    const pageCount = (doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setDrawColor(...COLORS.border.light);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

        addText(
            "CONFIDENTIAL MEDICAL RECORD  •  AI-Assisted Clinical Decision Support  •  Physician Review Required",
            pageWidth / 2,
            pageHeight - 10,
            7,
            COLORS.text.tertiary,
            'italic',
            'center'
        );

        addText(
            `Page ${i} of ${pageCount}`,
            pageWidth - margin,
            pageHeight - 10,
            7,
            COLORS.text.tertiary,
            'normal',
            'right'
        );
    }

    // Save
    const filename = `CYNO_TumorBoard_${view.patient_name?.replace(/\s+/g, '_') || 'Case'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}