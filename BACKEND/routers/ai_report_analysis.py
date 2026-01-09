from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import os
import asyncio
import time
import json
import aiofiles
from concurrent.futures import ThreadPoolExecutor
from database import db
from routers.ocr_llm import (
    extract_structured_from_image,
    extract_structured_from_pdf,
    analyze_page_with_llm,
    merge_page_analyses,
    asdict
)

router = APIRouter(prefix="/api/ai-analysis", tags=["AI Analysis"])

# =============================================================================
# CONCURRENCY CONTROL (Prevents GPU thrashing)
# =============================================================================

# Maximum concurrent LLM calls - prevent GPU memory exhaustion
LLM_SEMAPHORE = asyncio.Semaphore(2)

# Dedicated thread pool for CPU-bound OCR operations
OCR_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="ocr_worker")

# Constants for ETA estimation (reduced due to optimizations)
SECONDS_PER_REPORT = 300  # ~5 min per report (optimized from 600s)


class AnalysisRequest(BaseModel):
    patientId: str


class JobStatusResponse(BaseModel):
    """Standardized job status response"""
    jobId: str
    status: str  # queued, processing, completed, failed, cancelled
    generatedAt: str  # ISO 8601 UTC
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    reportCount: int
    estimatedSeconds: Optional[int] = None
    elapsedSeconds: Optional[int] = None
    result: Optional[dict] = None
    error: Optional[str] = None


def to_iso8601(dt: Optional[datetime]) -> Optional[str]:
    """Convert datetime to ISO 8601 UTC string"""
    if dt is None:
        return None
    # Ensure timezone aware
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat().replace('+00:00', 'Z')


def calculate_elapsed_seconds(started_at: Optional[datetime], completed_at: Optional[datetime]) -> Optional[int]:
    """Calculate elapsed seconds from start time"""
    if started_at is None:
        return None
    end_time = completed_at if completed_at else datetime.now(timezone.utc)
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)
    return max(0, int((end_time - started_at).total_seconds()))


def build_job_response(report) -> dict:
    """Build standardized job status response from AIReport record"""
    result = None
    error = None
    
    if report.keyFindings:
        try:
            result = json.loads(report.keyFindings)
        except:
            result = None
    
    if report.errorMessage:
        error = report.errorMessage
    elif report.status == "failed" and result and "error" in result:
        error = result.get("error")
    
    return {
        "jobId": report.id,
        "status": report.status,
        "generatedAt": to_iso8601(report.generatedAt),
        "startedAt": to_iso8601(report.startedAt),
        "completedAt": to_iso8601(report.completedAt),
        "reportCount": report.reportCount or 0,
        "estimatedSeconds": report.estimatedSeconds,
        "elapsedSeconds": calculate_elapsed_seconds(report.startedAt, report.completedAt),
        "result": result if report.status == "completed" else None,
        "error": error
    }


async def process_and_save_reports(job_id: str, patient_id: str, report_ids: List[str]):
    """
    Background task to process reports and save results to the database.
    Uses job_id directly for updates to ensure session-independent processing.
    """
    start_time = time.perf_counter()
    
    try:
        # Mark job as processing with start time
        await db.aireport.update(
            where={"id": job_id},
            data={
                "status": "processing",
                "startedAt": datetime.now(timezone.utc)
            }
        )
        
        # Fetch patient and reports
        patient = await db.patient.find_unique(where={"id": patient_id})
        reports = await db.report.find_many(where={"patientId": patient_id})
        
        async def process_single_report(report):
            try:
                # Check if file exists
                if not os.path.exists(report.filePath):
                    return {
                        "file_name": report.fileName,
                        "status": "error",
                        "error": "File not found on server"
                    }

                # Read file content
                async with aiofiles.open(report.filePath, 'rb') as f:
                    content = await f.read()

                # Extract structured OCR result based on file extension
                file_lower = report.fileName.lower()
                doc_result = None
                
                loop = asyncio.get_running_loop()
                
                if file_lower.endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
                    doc_result = await loop.run_in_executor(None, extract_structured_from_image, content)
                elif file_lower.endswith('.pdf'):
                    doc_result = await loop.run_in_executor(None, extract_structured_from_pdf, content)
                else:
                    return {
                        "file_name": report.fileName,
                        "status": "skipped",
                        "reason": "Unsupported file type"
                    }

                # Check if any text was extracted
                total_text = "".join([p.text for p in doc_result.pages])
                if not total_text.strip():
                    return {
                        "file_name": report.fileName,
                        "status": "warning",
                        "message": "No text extracted"
                    }

                # Analyze each page with LLM (with semaphore-controlled concurrency)
                try:
                    all_warnings = []
                    
                    async def analyze_with_semaphore(page):
                        """Analyze page with semaphore to limit concurrent LLM calls."""
                        async with LLM_SEMAPHORE:
                            return await loop.run_in_executor(None, analyze_page_with_llm, page)
                    
                    # Create tasks for all pages with bounded concurrency
                    page_tasks = [
                        analyze_with_semaphore(page)
                        for page in doc_result.pages
                    ]
                    
                    # Wait for all page analyses to complete
                    page_analyses = await asyncio.gather(*page_tasks)
                    
                    for analysis in page_analyses:
                        all_warnings.extend(analysis.warnings or [])
                    
                    # Merge page analyses
                    merged = merge_page_analyses(page_analyses)
                    
                    # Build page output
                    pages_output = []
                    for pa in page_analyses:
                        pages_output.append({
                            "page": pa.page_number,
                            "patient_identity": asdict(pa.patient_identity),
                            "report_metadata": asdict(pa.report_metadata),
                            "findings": [asdict(f) for f in pa.findings],
                            "diagnosis": pa.diagnosis,
                            "recommendations": pa.recommendations,
                            "extraction_confidence": pa.extraction_confidence
                        })
                    
                except ConnectionRefusedError:
                    raise Exception("AI service (Groq) error. Please check your GROQ_API_KEY in .env file.")
                except Exception as llm_error:
                    error_msg = str(llm_error)
                    if "Connection refused" in error_msg or "refused" in error_msg.lower():
                        raise Exception("AI service (Groq) error. Please check your GROQ_API_KEY in .env file.")
                    raise Exception(f"LLM analysis failed: {error_msg}")

                return {
                    "file_name": report.fileName,
                    "status": "success",
                    "total_pages": doc_result.total_pages,
                    "source_type": doc_result.source_type,
                    "pages": pages_output,
                    "merged_analysis": merged,
                    "warnings": list(set(all_warnings))
                }

            except Exception as e:
                error_message = str(e)
                # Provide clearer error messages
                if "Connection refused" in error_message or "Groq" in error_message or "API" in error_message:
                    error_message = "AI service (Groq) error. Please check your GROQ_API_KEY in .env file."
                
                return {
                    "file_name": report.fileName,
                    "status": "error",
                    "error": error_message
                }

        # Run all report processing in parallel
        results = await asyncio.gather(*[process_single_report(report) for report in reports])
        
        end_time = time.perf_counter()
        processing_time = round(end_time - start_time, 2)

        final_data = {
            "processing_time_seconds": processing_time,
            "results": results,
            "patient_name": patient.name,
            "report_count": len(reports),
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update job as completed using job_id directly
        await db.aireport.update(
            where={"id": job_id},
            data={
                "status": "completed",
                "completedAt": datetime.now(timezone.utc),
                "keyFindings": json.dumps(final_data)
            }
        )

    except Exception as e:
        error_message = str(e)
        # Provide clearer error messages for common issues
        if "Connection refused" in error_message or "refused" in error_message.lower():
            error_message = "AI service (Groq) error. Please check your GROQ_API_KEY in .env file."
        
        print(f"Background Task Error: {error_message}")
        # Mark job as failed using job_id directly
        try:
            await db.aireport.update(
                where={"id": job_id},
                data={
                    "status": "failed",
                    "completedAt": datetime.now(timezone.utc),
                    "errorMessage": error_message,
                    "keyFindings": json.dumps({"error": error_message})
                }
            )
        except Exception as db_error:
            print(f"Failed to update error status in DB: {db_error}")


@router.post("/analyze")
async def analyze_patient_reports(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    Initiate background analysis of all reports for a specific patient.
    Returns immediately with jobId for tracking.
    """
    # Verify patient exists
    patient = await db.patient.find_unique(where={"id": request.patientId})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    reports = await db.report.find_many(where={"patientId": request.patientId})
    if not reports:
        return {
            "jobId": None,
            "status": "no_reports",
            "generatedAt": to_iso8601(datetime.now(timezone.utc)),
            "startedAt": None,
            "completedAt": None,
            "reportCount": 0,
            "estimatedSeconds": None,
            "elapsedSeconds": None,
            "result": None,
            "error": "No reports found for this patient"
        }

    # Calculate estimated time
    report_count = len(reports)
    estimated_seconds = report_count * SECONDS_PER_REPORT

    # Create a new AIReport record with queued status
    ai_report = await db.aireport.create(
        data={
            "patientId": request.patientId,
            "status": "queued",
            "reportCount": report_count,
            "estimatedSeconds": estimated_seconds
        }
    )

    # Start background task with job_id
    background_tasks.add_task(
        process_and_save_reports, 
        ai_report.id, 
        request.patientId, 
        [r.id for r in reports]
    )

    return {
        "jobId": ai_report.id,
        "status": "queued",
        "generatedAt": to_iso8601(ai_report.generatedAt),
        "startedAt": None,
        "completedAt": None,
        "reportCount": report_count,
        "estimatedSeconds": estimated_seconds,
        "elapsedSeconds": None,
        "result": None,
        "error": None
    }


@router.get("/job/{jobId}")
async def get_job_status(jobId: str):
    """
    Get the status and results of a specific AI analysis job by jobId.
    This endpoint is session-independent - job continues regardless of user session.
    """
    report = await db.aireport.find_unique(where={"id": jobId})
    
    if not report:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return build_job_response(report)


@router.get("/status/{patientId}")
async def get_analysis_status(patientId: str):
    """
    Get the status and results of the latest AI analysis for a patient.
    Returns standardized job response format.
    """
    report = await db.aireport.find_first(
        where={"patientId": patientId},
        order={"generatedAt": "desc"}
    )

    if not report:
        return {
            "jobId": None,
            "status": "idle",
            "generatedAt": None,
            "startedAt": None,
            "completedAt": None,
            "reportCount": 0,
            "estimatedSeconds": None,
            "elapsedSeconds": None,
            "result": None,
            "error": None
        }
    
    return build_job_response(report)


@router.post("/cancel/{patientId}")
async def cancel_analysis(patientId: str):
    """
    Cancel any ongoing analysis for a patient by marking it as cancelled.
    """
    # Update any queued or processing jobs to cancelled
    await db.aireport.update_many(
        where={
            "patientId": patientId,
            "status": {"in": ["queued", "processing"]}
        },
        data={
            "status": "cancelled",
            "completedAt": datetime.now(timezone.utc)
        }
    )
    
    return {
        "status": "cancelled",
        "message": "Analysis cancelled"
    }
