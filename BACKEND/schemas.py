"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Hospital Signup Request
class HospitalSignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    registrationNumber: str
    address: Optional[str] = None
    phone: Optional[str] = None


# Hospital Signin Request
class HospitalSigninRequest(BaseModel):
    email: EmailStr
    password: str


# Hospital Response (without password)
class HospitalResponse(BaseModel):
    id: str
    name: str
    email: str
    registrationNumber: str
    address: Optional[str] = None
    phone: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# Auth Response with Token
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    hospital: HospitalResponse


# Error Response
class ErrorResponse(BaseModel):
    detail: str


# =====================
# Patient Schemas
# =====================

class PatientCreateRequest(BaseModel):
    patientId: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    cancerType: Optional[str] = None
    status: Optional[str] = "active"


class PatientUpdateRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    cancerType: Optional[str] = None
    status: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    patientId: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    cancerType: Optional[str] = None
    status: str
    hospitalId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    patients: List[PatientResponse]
    total: int


class PatientDetailResponse(PatientResponse):
    reports: List["ReportResponse"] = []
    aiReports: List["AIReportResponse"] = []


# =====================
# Report Schemas
# =====================

class ReportUploadRequest(BaseModel):
    patientId: str
    patientName: str
    category: str  # imaging, pathology, lab, clinical


class ReportResponse(BaseModel):
    id: str
    fileName: str
    filePath: str
    fileSize: int
    fileType: str
    category: str
    status: str
    patientId: str
    uploadedAt: datetime

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    message: str
    uploaded: int
    reports: List[ReportResponse]


class RecentUploadResponse(BaseModel):
    id: str
    patientName: str
    patientId: str
    fileType: str
    category: str
    timestamp: str
    status: str


# =====================
# AI Report Schemas
# =====================

class AIReportGenerateRequest(BaseModel):
    patientId: str


class AIReportResponse(BaseModel):
    id: str
    patientId: str
    status: str
    keyFindings: Optional[str] = None
    redFlags: Optional[str] = None
    suggestedSteps: Optional[str] = None
    imagingAnalysis: Optional[str] = None
    pathologyReview: Optional[str] = None
    clinicalNotes: Optional[str] = None
    riskScore: Optional[int] = None
    generatedAt: datetime
    reviewedAt: Optional[datetime] = None
    reviewedBy: Optional[str] = None

    class Config:
        from_attributes = True


class AIReportReviewRequest(BaseModel):
    reviewedBy: str


# =====================
# Tumor Board Schemas
# =====================

class TumorBoardCreateRequest(BaseModel):
    patientId: str


class TumorBoardUpdateRequest(BaseModel):
    radiologyNotes: Optional[str] = None
    pathologyNotes: Optional[str] = None
    oncologyNotes: Optional[str] = None
    guidelinesRef: Optional[str] = None
    recommendations: Optional[str] = None
    finalDecision: Optional[str] = None
    status: Optional[str] = None


class TumorBoardResponse(BaseModel):
    id: str
    patientId: str
    hospitalId: str
    aiSummary: Optional[str] = None
    radiologyNotes: Optional[str] = None
    pathologyNotes: Optional[str] = None
    oncologyNotes: Optional[str] = None
    guidelinesRef: Optional[str] = None
    recommendations: Optional[str] = None
    finalDecision: Optional[str] = None
    status: str
    createdAt: datetime
    updatedAt: datetime
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True


# =====================
# Tumor Board AI View Schemas
# =====================

class TumorBoardCaseSummary(BaseModel):
    patient_name: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    primary_diagnosis: Optional[str] = None
    suspected_category: str = "Unknown"  # Hematologic / Solid Tumor / Unknown
    case_complexity: str = "Moderate"  # Low / Moderate / High


class RadiologySummarySchema(BaseModel):
    modality: Optional[str] = None
    anatomical_region: Optional[str] = None
    key_findings: List[str] = []
    impression: Optional[str] = None
    limitations: Optional[str] = None


class PathologySummarySchema(BaseModel):
    specimen_type: Optional[str] = None
    hematologic_findings: List[str] = []
    immunophenotype: List[str] = []
    pathologist_impression: Optional[str] = None


class CriticalAlertSchema(BaseModel):
    parameter: str
    value: str
    trend: str  # Rising / Falling / Persistent / New
    clinical_significance: str


class IntegratedAnalysisSchema(BaseModel):
    concordance: str = "Moderate"  # High / Moderate / Low
    key_insights: List[str] = []
    data_gaps: List[str] = []


class DoctorInputsSchema(BaseModel):
    radiologist: Optional[str] = None
    pathologist: Optional[str] = None
    medical_oncologist: Optional[str] = None
    surgical_oncologist: Optional[str] = None
    radiation_oncologist: Optional[str] = None


class TumorBoardConsensusSchema(BaseModel):
    summary: Optional[str] = None
    suggested_next_steps: List[str] = []
    confidence_level: str = "Moderate"  # Low / Moderate / High


class TumorBoardAIViewResponse(BaseModel):
    case_summary: TumorBoardCaseSummary
    radiology_summary: RadiologySummarySchema
    pathology_summary: PathologySummarySchema
    critical_alerts: List[CriticalAlertSchema] = []
    integrated_analysis: IntegratedAnalysisSchema
    doctor_inputs: DoctorInputsSchema = DoctorInputsSchema()
    tumor_board_consensus: TumorBoardConsensusSchema
    confidence: float = 0.0
    generated_at: datetime
    warnings: List[str] = []


# =====================
# Activity Log Schemas
# =====================

class ActivityLogCreateRequest(BaseModel):
    action: str
    entityType: str
    entityId: Optional[str] = None
    description: str
    metadata: Optional[str] = None
    performedBy: Optional[str] = None


class ActivityLogResponse(BaseModel):
    id: str
    hospitalId: str
    action: str
    entityType: str
    entityId: Optional[str] = None
    description: str
    metadata: Optional[str] = None
    performedBy: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True


class ActivityLogListResponse(BaseModel):
    activities: List[ActivityLogResponse]
    total: int


# =====================
# Dashboard Stats
# =====================

class DashboardStatsResponse(BaseModel):
    totalPatients: int
    totalReports: int
    totalAIReports: int
    pendingReviews: int
    recentActivity: List[ActivityLogResponse]


# Update forward references
PatientDetailResponse.model_rebuild()
