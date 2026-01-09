"""
Patients router for CRUD operations
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from database import db
from schemas import (
    PatientCreateRequest,
    PatientUpdateRequest,
    PatientResponse,
    PatientListResponse,
    PatientDetailResponse,
    ReportResponse,
    AIReportResponse
)

router = APIRouter(prefix="/api/patients", tags=["Patients"])


@router.get("", response_model=PatientListResponse)
async def list_patients(
    hospitalId: str = Query(..., description="Hospital ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    cancerType: Optional[str] = Query(None, description="Filter by cancer type"),
    search: Optional[str] = Query(None, description="Search by name or patient ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """List all patients for a hospital with filters"""
    where_clause = {"hospitalId": hospitalId}
    
    if status:
        where_clause["status"] = status
    if cancerType:
        where_clause["cancerType"] = cancerType
    
    # Build search filter
    if search:
        where_clause["OR"] = [
            {"name": {"contains": search}},
            {"patientId": {"contains": search}}
        ]
    
    patients = await db.patient.find_many(
        where=where_clause,
        skip=skip,
        take=limit,
        order={"updatedAt": "desc"}
    )
    
    total = await db.patient.count(where=where_clause)
    
    return PatientListResponse(
        patients=[PatientResponse(
            id=p.id,
            patientId=p.patientId,
            name=p.name,
            age=p.age,
            gender=p.gender,
            cancerType=p.cancerType,
            status=p.status,
            hospitalId=p.hospitalId,
            createdAt=p.createdAt,
            updatedAt=p.updatedAt
        ) for p in patients],
        total=total
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(request: PatientCreateRequest, hospitalId: str = Query(...)):
    """Create a new patient"""
    # Verify hospital exists
    hospital = await db.hospital.find_unique(where={"id": hospitalId})
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found. Please log in again."
        )

    # Check if patient ID already exists
    existing = await db.patient.find_unique(where={"patientId": request.patientId})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this ID already exists"
        )
    
    patient = await db.patient.create(
        data={
            "patientId": request.patientId,
            "name": request.name,
            "age": request.age,
            "gender": request.gender,
            "cancerType": request.cancerType,
            "status": request.status or "active",
            "hospitalId": hospitalId
        }
    )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "patient_add",
            "entityType": "patient",
            "entityId": patient.id,
            "description": f"Added new patient: {patient.name} ({patient.patientId})",
            "performedBy": "Hospital Staff"
        }
    )
    
    return PatientResponse(
        id=patient.id,
        patientId=patient.patientId,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        cancerType=patient.cancerType,
        status=patient.status,
        hospitalId=patient.hospitalId,
        createdAt=patient.createdAt,
        updatedAt=patient.updatedAt
    )


@router.get("/{patient_id}", response_model=PatientDetailResponse)
async def get_patient(patient_id: str):
    """Get patient details with reports and AI reports"""
    patient = await db.patient.find_unique(
        where={"id": patient_id},
        include={
            "reports": {"order_by": {"uploadedAt": "desc"}},
            "aiReports": {"order_by": {"generatedAt": "desc"}}
        }
    )
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return PatientDetailResponse(
        id=patient.id,
        patientId=patient.patientId,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        cancerType=patient.cancerType,
        status=patient.status,
        hospitalId=patient.hospitalId,
        createdAt=patient.createdAt,
        updatedAt=patient.updatedAt,
        reports=[ReportResponse(
            id=r.id,
            fileName=r.fileName,
            filePath=r.filePath,
            fileSize=r.fileSize,
            fileType=r.fileType,
            category=r.category,
            status=r.status,
            patientId=r.patientId,
            uploadedAt=r.uploadedAt
        ) for r in (patient.reports or [])],
        aiReports=[AIReportResponse(
            id=a.id,
            patientId=a.patientId,
            status=a.status,
            keyFindings=a.keyFindings,
            redFlags=a.redFlags,
            suggestedSteps=a.suggestedSteps,
            imagingAnalysis=a.imagingAnalysis,
            pathologyReview=a.pathologyReview,
            clinicalNotes=a.clinicalNotes,
            riskScore=a.riskScore,
            generatedAt=a.generatedAt,
            reviewedAt=a.reviewedAt,
            reviewedBy=a.reviewedBy
        ) for a in (patient.aiReports or [])]
    )


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, request: PatientUpdateRequest):
    """Update patient information"""
    patient = await db.patient.find_unique(where={"id": patient_id})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.age is not None:
        update_data["age"] = request.age
    if request.gender is not None:
        update_data["gender"] = request.gender
    if request.cancerType is not None:
        update_data["cancerType"] = request.cancerType
    if request.status is not None:
        update_data["status"] = request.status
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    updated = await db.patient.update(
        where={"id": patient_id},
        data=update_data
    )
    
    # Log activity
    if patient.hospitalId:
        await db.activitylog.create(
            data={
                "hospitalId": patient.hospitalId,
                "action": "patient_update",
                "entityType": "patient",
                "entityId": patient.id,
                "description": f"Updated patient: {updated.name} ({updated.patientId})",
                "performedBy": "Hospital Staff"
            }
        )
    
    return PatientResponse(
        id=updated.id,
        patientId=updated.patientId,
        name=updated.name,
        age=updated.age,
        gender=updated.gender,
        cancerType=updated.cancerType,
        status=updated.status,
        hospitalId=updated.hospitalId,
        createdAt=updated.createdAt,
        updatedAt=updated.updatedAt
    )


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(patient_id: str):
    """Delete a patient and all related records"""
    patient = await db.patient.find_unique(where={"id": patient_id})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    try:
        # Delete related records first (cascade delete)
        # 1. Delete AI Reports
        await db.aireport.delete_many(where={"patientId": patient_id})
        
        # 2. Delete Reports
        await db.report.delete_many(where={"patientId": patient_id})
        
        # 3. Delete Tumor Board Cases
        await db.tumorboardcase.delete_many(where={"patientId": patient_id})
        
        # Log activity before deletion
        if patient.hospitalId:
            await db.activitylog.create(
                data={
                    "hospitalId": patient.hospitalId,
                    "action": "patient_delete",
                    "entityType": "patient",
                    "entityId": patient.id,
                    "description": f"Deleted patient: {patient.name} ({patient.patientId})",
                    "performedBy": "Hospital Staff"
                }
            )
        
        # Finally delete the patient
        await db.patient.delete(where={"id": patient_id})
        return None
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete patient: {str(e)}"
        )
