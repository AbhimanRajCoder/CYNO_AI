"""
AI Reports router for generating and managing AI analysis reports
"""
import json
from fastapi import APIRouter, HTTPException, status, Query
from datetime import datetime
from database import db
from schemas import (
    AIReportGenerateRequest,
    AIReportResponse,
    AIReportReviewRequest
)

router = APIRouter(prefix="/api/ai-reports", tags=["AI Reports"])


def generate_mock_ai_analysis(patient_name: str, reports: list) -> dict:
    """
    Generate mock AI analysis data.
    In production, this would call an actual AI service like Gemini.
    """
    # Count report categories
    categories = {}
    for r in reports:
        cat = r.category
        categories[cat] = categories.get(cat, 0) + 1
    
    has_imaging = categories.get("imaging", 0) > 0
    has_pathology = categories.get("pathology", 0) > 0
    has_lab = categories.get("lab", 0) > 0
    
    key_findings = [
        "Patient has submitted multiple diagnostic reports for review.",
        f"Total of {len(reports)} reports analyzed across {len(categories)} categories."
    ]
    
    if has_imaging:
        key_findings.append("Imaging reports indicate areas requiring further radiological assessment.")
    if has_pathology:
        key_findings.append("Pathology samples have been processed and analyzed.")
    if has_lab:
        key_findings.append("Laboratory values are within expected ranges for current treatment phase.")
    
    red_flags = []
    if has_imaging and has_pathology:
        red_flags.append("Cross-correlation between imaging and pathology recommended.")
    
    suggested_steps = [
        "Schedule follow-up consultation within 2 weeks.",
        "Consider tumor board discussion for comprehensive treatment planning.",
        "Monitor patient vitals and symptom progression."
    ]
    
    imaging_analysis = "Imaging studies reviewed. Recommend correlation with clinical findings." if has_imaging else None
    pathology_review = "Pathology specimens analyzed. Detailed report available in patient records." if has_pathology else None
    
    risk_score = min(3 + len(reports) + (2 if red_flags else 0), 10)
    
    return {
        "keyFindings": json.dumps(key_findings),
        "redFlags": json.dumps(red_flags) if red_flags else None,
        "suggestedSteps": json.dumps(suggested_steps),
        "imagingAnalysis": imaging_analysis,
        "pathologyReview": pathology_review,
        "clinicalNotes": f"AI-generated clinical summary for patient {patient_name}. This analysis is for reference only and should be reviewed by a qualified physician.",
        "riskScore": risk_score
    }


@router.post("/generate", response_model=AIReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_ai_report(request: AIReportGenerateRequest, hospitalId: str = Query(...)):
    """Generate AI analysis report for a patient"""
    # Find patient by internal ID or external patientId
    patient = await db.patient.find_first(
        where={"OR": [{"id": request.patientId}, {"patientId": request.patientId}]},
        include={"reports": True}
    )
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check if patient has reports
    if not patient.reports or len(patient.reports) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient has no uploaded reports to analyze"
        )
    
    # Generate AI analysis (mock for now)
    analysis = generate_mock_ai_analysis(patient.name, patient.reports)
    
    # Create AI report
    ai_report = await db.aireport.create(
        data={
            "patientId": patient.id,
            "status": "ready",
            "keyFindings": analysis["keyFindings"],
            "redFlags": analysis["redFlags"],
            "suggestedSteps": analysis["suggestedSteps"],
            "imagingAnalysis": analysis["imagingAnalysis"],
            "pathologyReview": analysis["pathologyReview"],
            "clinicalNotes": analysis["clinicalNotes"],
            "riskScore": analysis["riskScore"]
        }
    )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "ai_analysis",
            "entityType": "ai_report",
            "entityId": ai_report.id,
            "description": f"Generated AI analysis for patient: {patient.name}",
            "performedBy": "AI System"
        }
    )
    
    return AIReportResponse(
        id=ai_report.id,
        patientId=ai_report.patientId,
        status=ai_report.status,
        keyFindings=ai_report.keyFindings,
        redFlags=ai_report.redFlags,
        suggestedSteps=ai_report.suggestedSteps,
        imagingAnalysis=ai_report.imagingAnalysis,
        pathologyReview=ai_report.pathologyReview,
        clinicalNotes=ai_report.clinicalNotes,
        riskScore=ai_report.riskScore,
        generatedAt=ai_report.generatedAt,
        reviewedAt=ai_report.reviewedAt,
        reviewedBy=ai_report.reviewedBy
    )


@router.get("/{patient_id}", response_model=list[AIReportResponse])
async def get_patient_ai_reports(patient_id: str):
    """Get all AI reports for a patient"""
    # Find patient
    patient = await db.patient.find_first(
        where={"OR": [{"id": patient_id}, {"patientId": patient_id}]}
    )
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    ai_reports = await db.aireport.find_many(
        where={"patientId": patient.id},
        order={"generatedAt": "desc"}
    )
    
    return [AIReportResponse(
        id=r.id,
        patientId=r.patientId,
        status=r.status,
        keyFindings=r.keyFindings,
        redFlags=r.redFlags,
        suggestedSteps=r.suggestedSteps,
        imagingAnalysis=r.imagingAnalysis,
        pathologyReview=r.pathologyReview,
        clinicalNotes=r.clinicalNotes,
        riskScore=r.riskScore,
        generatedAt=r.generatedAt,
        reviewedAt=r.reviewedAt,
        reviewedBy=r.reviewedBy
    ) for r in ai_reports]


@router.put("/{report_id}/review", response_model=AIReportResponse)
async def review_ai_report(report_id: str, request: AIReportReviewRequest, hospitalId: str = Query(...)):
    """Mark an AI report as reviewed"""
    ai_report = await db.aireport.find_unique(where={"id": report_id})
    
    if not ai_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Report not found"
        )
    
    updated = await db.aireport.update(
        where={"id": report_id},
        data={
            "status": "reviewed",
            "reviewedAt": datetime.now(),
            "reviewedBy": request.reviewedBy
        }
    )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "ai_review",
            "entityType": "ai_report",
            "entityId": report_id,
            "description": f"AI report reviewed by: {request.reviewedBy}",
            "performedBy": request.reviewedBy
        }
    )
    
    return AIReportResponse(
        id=updated.id,
        patientId=updated.patientId,
        status=updated.status,
        keyFindings=updated.keyFindings,
        redFlags=updated.redFlags,
        suggestedSteps=updated.suggestedSteps,
        imagingAnalysis=updated.imagingAnalysis,
        pathologyReview=updated.pathologyReview,
        clinicalNotes=updated.clinicalNotes,
        riskScore=updated.riskScore,
        generatedAt=updated.generatedAt,
        reviewedAt=updated.reviewedAt,
        reviewedBy=updated.reviewedBy
    )
