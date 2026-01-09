"""
Activity Log router for audit timeline
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from database import db
from schemas import (
    ActivityLogResponse,
    ActivityLogListResponse,
    DashboardStatsResponse
)

router = APIRouter(prefix="/api/activity", tags=["Activity Log"])


@router.get("", response_model=ActivityLogListResponse)
async def list_activity_logs(
    hospitalId: str = Query(...),
    action: Optional[str] = Query(None, description="Filter by action type"),
    entityType: Optional[str] = Query(None, description="Filter by entity type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get activity logs for audit timeline"""
    where_clause = {"hospitalId": hospitalId}
    
    if action:
        where_clause["action"] = action
    if entityType:
        where_clause["entityType"] = entityType
    
    activities = await db.activitylog.find_many(
        where=where_clause,
        skip=skip,
        take=limit,
        order={"createdAt": "desc"}
    )
    
    total = await db.activitylog.count(where=where_clause)
    
    return ActivityLogListResponse(
        activities=[ActivityLogResponse(
            id=a.id,
            hospitalId=a.hospitalId,
            action=a.action,
            entityType=a.entityType,
            entityId=a.entityId,
            description=a.description,
            metadata=a.metadata,
            performedBy=a.performedBy,
            createdAt=a.createdAt
        ) for a in activities],
        total=total
    )


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(hospitalId: str = Query(...)):
    """Get dashboard statistics"""
    # Count total patients
    total_patients = await db.patient.count(where={"hospitalId": hospitalId})
    
    # Count total reports
    patients = await db.patient.find_many(
        where={"hospitalId": hospitalId},
        include={"reports": True, "aiReports": True}
    )
    
    total_reports = sum(len(p.reports or []) for p in patients)
    total_ai_reports = sum(len(p.aiReports or []) for p in patients)
    
    # Count pending reviews (AI reports with status 'ready')
    pending_reviews = 0
    for p in patients:
        for ai in (p.aiReports or []):
            if ai.status == "ready":
                pending_reviews += 1
    
    # Get recent activity
    recent_activities = await db.activitylog.find_many(
        where={"hospitalId": hospitalId},
        take=10,
        order={"createdAt": "desc"}
    )
    
    return DashboardStatsResponse(
        totalPatients=total_patients,
        totalReports=total_reports,
        totalAIReports=total_ai_reports,
        pendingReviews=pending_reviews,
        recentActivity=[ActivityLogResponse(
            id=a.id,
            hospitalId=a.hospitalId,
            action=a.action,
            entityType=a.entityType,
            entityId=a.entityId,
            description=a.description,
            metadata=a.metadata,
            performedBy=a.performedBy,
            createdAt=a.createdAt
        ) for a in recent_activities]
    )
