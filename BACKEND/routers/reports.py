"""
Reports Router - Handle patient report uploads
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from database import db
from schemas import ReportResponse, RecentUploadResponse

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_file_type(filename: str) -> str:
    """Determine file type from extension"""
    ext = filename.split(".")[-1].lower()
    if ext == "pdf":
        return "PDF"
    elif ext in ["dcm", "dicom"]:
        return "DICOM"
    elif ext in ["jpg", "jpeg", "png"]:
        return "Image"
    return "Document"


def format_time_ago(dt: datetime) -> str:
    """Convert datetime to relative time string"""
    now = datetime.now()
    diff = now - dt.replace(tzinfo=None)
    
    if diff < timedelta(minutes=1):
        return "Just now"
    elif diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} min ago"
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    else:
        days = diff.days
        return f"{days} day{'s' if days > 1 else ''} ago"


def get_category_label(category: str) -> str:
    """Convert category ID to display label"""
    mapping = {
        "imaging": "Imaging",
        "pathology": "Pathology",
        "lab": "Lab",
        "clinical": "Clinical"
    }
    return mapping.get(category, "Other")


@router.post("/upload")
async def upload_reports(
    files: List[UploadFile] = File(...),
    patientId: str = Form(...),
    patientName: str = Form(...),
    category: str = Form(...),
    hospitalId: str = Form(None)  # Made optional
):
    """Upload multiple patient reports at once"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Get or create patient
    patient = await db.patient.find_unique(where={"patientId": patientId})
    
    if not patient:
        # Create new patient (hospitalId is optional)
        patient_data = {
            "patientId": patientId,
            "name": patientName,
        }
        if hospitalId and hospitalId != "demo-hospital-id":
            patient_data["hospitalId"] = hospitalId
            
        patient = await db.patient.create(data=patient_data)
    
    uploaded_reports = []
    
    for file in files:
        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else ""
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file to disk
        try:
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            file_size = len(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
        # Create report record in database
        file_type = get_file_type(file.filename)
        
        report = await db.report.create(
            data={
                "fileName": file.filename,
                "filePath": file_path,
                "fileSize": file_size,
                "fileType": file_type,
                "category": category,
                "status": "pending",
                "patientId": patient.id
            }
        )
        
        uploaded_reports.append({
            "id": report.id,
            "fileName": report.fileName,
            "filePath": report.filePath,
            "fileSize": report.fileSize,
            "fileType": report.fileType,
            "category": report.category,
            "status": report.status,
            "patientId": patientId,
            "patientName": patientName,
            "uploadedAt": report.uploadedAt
        })
    
    return {
        "message": "Files uploaded successfully",
        "uploaded": len(uploaded_reports),
        "reports": uploaded_reports
    }


@router.get("/recent", response_model=List[RecentUploadResponse])
async def get_recent_uploads(limit: int = 10):
    """Get recent report uploads"""
    reports = await db.report.find_many(
        take=limit,
        order={"uploadedAt": "desc"},
        include={"patient": True}
    )
    
    result = []
    for report in reports:
        result.append({
            "id": report.id,
            "patientName": report.patient.name if report.patient else "Unknown",
            "patientId": report.patient.patientId if report.patient else "Unknown",
            "fileType": get_category_label(report.category),
            "category": report.category,
            "timestamp": format_time_ago(report.uploadedAt),
            "status": report.status
        })
    
    return result


@router.get("/patient/{patient_db_id}")
async def get_patient_reports(patient_db_id: str):
    """Get all reports for a specific patient"""
    reports = await db.report.find_many(
        where={"patientId": patient_db_id},
        order={"uploadedAt": "desc"}
    )
    
    result = []
    for report in reports:
        result.append({
            "id": report.id,
            "fileName": report.fileName,
            "filePath": report.filePath,
            "fileSize": report.fileSize,
            "fileType": report.fileType,
            "category": report.category,
            "categoryLabel": get_category_label(report.category),
            "status": report.status,
            "uploadedAt": report.uploadedAt.isoformat() if report.uploadedAt else None
        })
    
    return result


@router.get("/download/{report_id}")
async def download_report(report_id: str):
    """Download a report file"""
    from fastapi.responses import FileResponse
    
    report = await db.report.find_unique(where={"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not os.path.exists(report.filePath):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=report.filePath,
        filename=report.fileName,
        media_type="application/octet-stream"
    )


@router.delete("/{report_id}")
async def delete_report(report_id: str):
    """Delete a report"""
    report = await db.report.find_unique(where={"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Delete file from disk
    if os.path.exists(report.filePath):
        try:
            os.remove(report.filePath)
        except Exception as e:
            print(f"Error deleting file: {e}")
            # Continue to delete from DB even if file deletion fails
    
    # Delete from database
    await db.report.delete(where={"id": report_id})
    
    return {"message": "Report deleted successfully"}
