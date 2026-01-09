"""
Tumor Board router for care coordination
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from database import db
from schemas import (
    TumorBoardCreateRequest,
    TumorBoardUpdateRequest,
    TumorBoardResponse,
    PatientResponse
)

router = APIRouter(prefix="/api/tumor-board", tags=["Tumor Board"])


@router.get("", response_model=list[TumorBoardResponse])
async def list_tumor_board_cases(
    hospitalId: str = Query(...),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """List all tumor board cases for a hospital (excludes deleted)"""
    where_clause = {
        "hospitalId": hospitalId,
        "status": {"not": "deleted"}  # Exclude deleted cases by status
    }
    
    if status:
        where_clause["status"] = status
    
    cases = await db.tumorboardcase.find_many(
        where=where_clause,
        include={"patient": True},
        skip=skip,
        take=limit,
        order={"updatedAt": "desc"}
    )
    
    return [TumorBoardResponse(
        id=c.id,
        patientId=c.patientId,
        hospitalId=c.hospitalId,
        aiSummary=c.aiSummary,
        radiologyNotes=c.radiologyNotes,
        pathologyNotes=c.pathologyNotes,
        oncologyNotes=c.oncologyNotes,
        guidelinesRef=c.guidelinesRef,
        recommendations=c.recommendations,
        finalDecision=c.finalDecision,
        status=c.status,
        createdAt=c.createdAt,
        updatedAt=c.updatedAt,
        patient=PatientResponse(
            id=c.patient.id,
            patientId=c.patient.patientId,
            name=c.patient.name,
            age=c.patient.age,
            gender=c.patient.gender,
            cancerType=c.patient.cancerType,
            status=c.patient.status,
            hospitalId=c.patient.hospitalId,
            createdAt=c.patient.createdAt,
            updatedAt=c.patient.updatedAt
        ) if c.patient else None
    ) for c in cases]


@router.post("", response_model=TumorBoardResponse, status_code=status.HTTP_201_CREATED)
async def create_tumor_board_case(request: TumorBoardCreateRequest, hospitalId: str = Query(...)):
    """Create a new tumor board case for a patient"""
    # Find patient
    patient = await db.patient.find_first(
        where={"OR": [{"id": request.patientId}, {"patientId": request.patientId}]}
    )
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Allow multiple cases for the same patient (restriction removed)
    
    # Get latest AI report for summary
    ai_report = await db.aireport.find_first(
        where={"patientId": patient.id},
        order={"generatedAt": "desc"}
    )
    
    ai_summary = None
    if ai_report:
        ai_summary = f"Risk Score: {ai_report.riskScore}/10\n"
        if ai_report.keyFindings:
            ai_summary += f"Key Findings: {ai_report.keyFindings}\n"
        if ai_report.redFlags:
            ai_summary += f"Red Flags: {ai_report.redFlags}\n"
        if ai_report.clinicalNotes:
            ai_summary += f"Clinical Notes: {ai_report.clinicalNotes}"
    
    # Create tumor board case
    case = await db.tumorboardcase.create(
        data={
            "patientId": patient.id,
            "hospitalId": hospitalId,
            "aiSummary": ai_summary,
            "status": "draft"
        }
    )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "tumor_board_create",
            "entityType": "tumor_board",
            "entityId": case.id,
            "description": f"Created tumor board case for patient: {patient.name}",
            "performedBy": "Hospital Staff"
        }
    )
    
    return TumorBoardResponse(
        id=case.id,
        patientId=case.patientId,
        hospitalId=case.hospitalId,
        aiSummary=case.aiSummary,
        radiologyNotes=case.radiologyNotes,
        pathologyNotes=case.pathologyNotes,
        oncologyNotes=case.oncologyNotes,
        guidelinesRef=case.guidelinesRef,
        recommendations=case.recommendations,
        finalDecision=case.finalDecision,
        status=case.status,
        createdAt=case.createdAt,
        updatedAt=case.updatedAt
    )


@router.get("/{case_id}", response_model=TumorBoardResponse)
async def get_tumor_board_case(case_id: str):
    """Get a specific tumor board case"""
    case = await db.tumorboardcase.find_unique(
        where={"id": case_id},
        include={"patient": True}
    )
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    return TumorBoardResponse(
        id=case.id,
        patientId=case.patientId,
        hospitalId=case.hospitalId,
        aiSummary=case.aiSummary,
        radiologyNotes=case.radiologyNotes,
        pathologyNotes=case.pathologyNotes,
        oncologyNotes=case.oncologyNotes,
        guidelinesRef=case.guidelinesRef,
        recommendations=case.recommendations,
        finalDecision=case.finalDecision,
        status=case.status,
        createdAt=case.createdAt,
        updatedAt=case.updatedAt,
        patient=PatientResponse(
            id=case.patient.id,
            patientId=case.patient.patientId,
            name=case.patient.name,
            age=case.patient.age,
            gender=case.patient.gender,
            cancerType=case.patient.cancerType,
            status=case.patient.status,
            hospitalId=case.patient.hospitalId,
            createdAt=case.patient.createdAt,
            updatedAt=case.patient.updatedAt
        ) if case.patient else None
    )


@router.put("/{case_id}", response_model=TumorBoardResponse)
async def update_tumor_board_case(case_id: str, request: TumorBoardUpdateRequest, hospitalId: str = Query(...)):
    """Update tumor board case notes and decisions"""
    case = await db.tumorboardcase.find_unique(where={"id": case_id})
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    update_data = {}
    if request.radiologyNotes is not None:
        update_data["radiologyNotes"] = request.radiologyNotes
    if request.pathologyNotes is not None:
        update_data["pathologyNotes"] = request.pathologyNotes
    if request.oncologyNotes is not None:
        update_data["oncologyNotes"] = request.oncologyNotes
    if request.guidelinesRef is not None:
        update_data["guidelinesRef"] = request.guidelinesRef
    if request.recommendations is not None:
        update_data["recommendations"] = request.recommendations
    if request.finalDecision is not None:
        update_data["finalDecision"] = request.finalDecision
    if request.status is not None:
        update_data["status"] = request.status
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    updated = await db.tumorboardcase.update(
        where={"id": case_id},
        data=update_data,
        include={"patient": True}
    )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "tumor_board_update",
            "entityType": "tumor_board",
            "entityId": case_id,
            "description": f"Updated tumor board case for patient: {updated.patient.name if updated.patient else 'Unknown'}",
            "performedBy": "Hospital Staff"
        }
    )
    
    return TumorBoardResponse(
        id=updated.id,
        patientId=updated.patientId,
        hospitalId=updated.hospitalId,
        aiSummary=updated.aiSummary,
        radiologyNotes=updated.radiologyNotes,
        pathologyNotes=updated.pathologyNotes,
        oncologyNotes=updated.oncologyNotes,
        guidelinesRef=updated.guidelinesRef,
        recommendations=updated.recommendations,
        finalDecision=updated.finalDecision,
        status=updated.status,
        createdAt=updated.createdAt,
        updatedAt=updated.updatedAt,
        patient=PatientResponse(
            id=updated.patient.id,
            patientId=updated.patient.patientId,
            name=updated.patient.name,
            age=updated.patient.age,
            gender=updated.patient.gender,
            cancerType=updated.patient.cancerType,
            status=updated.patient.status,
            hospitalId=updated.patient.hospitalId,
            createdAt=updated.patient.createdAt,
            updatedAt=updated.patient.updatedAt
        ) if updated.patient else None
    )


# =============================================================================
# STATE MANAGEMENT ENDPOINTS
# =============================================================================

@router.get("/{case_id}/status")
async def get_case_status(case_id: str, hospitalId: str = Query(...)):
    """Get current processing status and progress for a case"""
    case = await db.tumorboardcase.find_unique(
        where={"id": case_id},
        include={"patient": True}
    )
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "id": case.id,
        "status": case.status,
        "progressPercent": case.progressPercent,
        "progressMessage": case.progressMessage,
        "errorMessage": case.errorMessage,
        "processingStartedAt": case.processingStartedAt.isoformat() if case.processingStartedAt else None,
        "processingCompletedAt": case.processingCompletedAt.isoformat() if case.processingCompletedAt else None,
        "patientName": case.patient.name if case.patient else None,
        "hasAIData": case.aiTumorBoardJson is not None
    }


@router.post("/{case_id}/submit")
async def submit_for_processing(case_id: str, hospitalId: str = Query(...)):
    """Submit a draft case for AI processing"""
    case = await db.tumorboardcase.find_unique(where={"id": case_id})
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Validate state transition
    valid_states = ["draft", "failed"]
    if case.status not in valid_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit case in '{case.status}' state. Must be in: {valid_states}"
        )
    
    # Update to queued
    from datetime import datetime
    updated = await db.tumorboardcase.update(
        where={"id": case_id},
        data={
            "status": "queued",
            "progressPercent": 0,
            "progressMessage": "Waiting in queue...",
            "errorMessage": None,
            "processingStartedAt": None,
            "processingCompletedAt": None
        }
    )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "tumor_board_submit",
            "entityType": "tumor_board",
            "entityId": case_id,
            "description": "Submitted tumor board case for AI processing",
            "performedBy": "Hospital Staff"
        }
    )
    
    return {
        "status": "queued",
        "message": "Case submitted for processing. This may take 10-15 minutes.",
        "caseId": case_id
    }


@router.post("/{case_id}/retry")
async def retry_failed_case(case_id: str, hospitalId: str = Query(...)):
    """Retry a failed processing case"""
    case = await db.tumorboardcase.find_unique(where={"id": case_id})
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if case.status != "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only retry cases in 'failed' state. Current state: {case.status}"
        )
    
    # Reset to queued
    updated = await db.tumorboardcase.update(
        where={"id": case_id},
        data={
            "status": "queued",
            "progressPercent": 0,
            "progressMessage": "Retrying... Waiting in queue",
            "errorMessage": None
        }
    )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "tumor_board_retry",
            "entityType": "tumor_board",
            "entityId": case_id,
            "description": "Retrying failed tumor board case",
            "performedBy": "Hospital Staff"
        }
    )
    
    return {
        "status": "queued",
        "message": "Case requeued for processing",
        "caseId": case_id
    }


@router.delete("/{case_id}")
async def delete_tumor_board_case(case_id: str, hospitalId: str = Query(...)):
    """Soft delete a tumor board case"""
    from datetime import datetime
    import traceback
    
    try:
        case = await db.tumorboardcase.find_unique(
            where={"id": case_id},
            include={"patient": True}
        )
        
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tumor board case not found"
            )
        
        if case.hospitalId != hospitalId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if already deleted
        if case.status == "deleted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This tumor board case has already been deleted"
            )
        
        # Check if processing - warn but allow
        warning = None
        if case.status == "processing":
            warning = "Case was in processing state. Processing may continue in background."
        
        # Soft delete
        await db.tumorboardcase.update(
            where={"id": case_id},
            data={
                "status": "deleted",
                "deletedAt": datetime.now(),
                "deletedBy": "Hospital Staff"
            }
        )
        
        # Log activity
        await db.activitylog.create(
            data={
                "hospitalId": hospitalId,
                "action": "tumor_board_delete",
                "entityType": "tumor_board",
                "entityId": case_id,
                "description": f"Deleted tumor board case for patient: {case.patient.name if case.patient else 'Unknown'}",
                "performedBy": "Hospital Staff"
            }
        )
        
        return {
            "status": "deleted",
            "message": "Tumor board case deleted successfully",
            "warning": warning,
            "caseId": case_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting tumor board case {case_id}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tumor board case: {str(e)}"
        )


@router.post("/{case_id}/cancel")
async def cancel_tumor_board_processing(case_id: str, hospitalId: str = Query(...)):
    """Cancel a processing tumor board case"""
    from datetime import datetime
    
    case = await db.tumorboardcase.find_unique(where={"id": case_id})
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if case.status not in ["queued", "processing"]:
        return {
            "status": case.status,
            "message": f"Case is not processing (current status: {case.status})",
            "caseId": case_id
        }
    
    # Update to cancelled
    updated = await db.tumorboardcase.update(
        where={"id": case_id},
        data={
            "status": "cancelled",
            "progressMessage": "Cancelled by user",
            "errorMessage": None,
            "processingCompletedAt": datetime.now()
        }
    )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "tumor_board_cancel",
            "entityType": "tumor_board",
            "entityId": case_id,
            "description": "Cancelled tumor board AI processing",
            "performedBy": "Hospital Staff"
        }
    )
    
    return {
        "status": "cancelled",
        "message": "Processing cancelled",
        "caseId": case_id
    }
