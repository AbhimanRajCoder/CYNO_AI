"""
Tumor Board View Schema - Final output for UI.

This schema represents the complete tumor board analysis
that gets displayed to doctors and exported to PDF.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime


@dataclass
class TumorBoardFinding:
    """A finding displayed in the tumor board UI."""
    category: str
    title: str
    value: str
    severity: str  # critical, high, moderate, low, info
    source_agent: str
    source_report: Optional[str] = None
    interpretation: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "title": self.title,
            "value": self.value,
            "severity": self.severity,
            "source_agent": self.source_agent,
            "source_report": self.source_report,
            "interpretation": self.interpretation
        }


@dataclass
class TumorBoardRecommendation:
    """A recommendation displayed in the tumor board UI."""
    category: str  # treatment, imaging, biopsy, referral, follow_up
    text: str
    priority: str  # high, moderate, low
    rationale: Optional[str] = None
    evidence_level: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "text": self.text,
            "priority": self.priority,
            "rationale": self.rationale,
            "evidence_level": self.evidence_level
        }


@dataclass
class TumorBoardView:
    """
    Complete tumor board view for UI rendering.
    
    This is the final output that goes to:
    - Frontend UI display
    - PDF generation
    - Doctor review
    """
    # Patient Info
    patient_id: str
    patient_name: str
    patient_age: Optional[str] = None
    patient_gender: Optional[str] = None
    
    # Case Info
    case_id: str = ""
    case_date: str = ""
    generated_at: str = ""
    
    # Executive Summary
    executive_summary: str = ""
    
    # Staging
    clinical_stage: Optional[str] = None
    pathological_stage: Optional[str] = None
    tnm_staging: Optional[str] = None
    
    # Findings by Category
    imaging_findings: List[TumorBoardFinding] = field(default_factory=list)
    pathology_findings: List[TumorBoardFinding] = field(default_factory=list)
    clinical_findings: List[TumorBoardFinding] = field(default_factory=list)
    biomarker_findings: List[TumorBoardFinding] = field(default_factory=list)
    
    # Recommendations
    treatment_recommendations: List[TumorBoardRecommendation] = field(default_factory=list)
    imaging_recommendations: List[TumorBoardRecommendation] = field(default_factory=list)
    other_recommendations: List[TumorBoardRecommendation] = field(default_factory=list)
    
    # Clinical Trials
    clinical_trials: List[Dict[str, str]] = field(default_factory=list)
    
    # Warnings & Conflicts
    warnings: List[str] = field(default_factory=list)
    conflicts: List[Dict[str, Any]] = field(default_factory=list)
    
    # Confidence
    overall_confidence: str = "medium"  # high, medium, low
    
    # Processing metadata
    processing_time_seconds: float = 0.0
    agents_used: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        if not self.generated_at:
            self.generated_at = datetime.utcnow().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "patient_id": self.patient_id,
            "patient_name": self.patient_name,
            "patient_age": self.patient_age,
            "patient_gender": self.patient_gender,
            "case_id": self.case_id,
            "case_date": self.case_date,
            "generated_at": self.generated_at,
            "executive_summary": self.executive_summary,
            "staging": {
                "clinical_stage": self.clinical_stage,
                "pathological_stage": self.pathological_stage,
                "tnm_staging": self.tnm_staging
            },
            "findings": {
                "imaging": [f.to_dict() for f in self.imaging_findings],
                "pathology": [f.to_dict() for f in self.pathology_findings],
                "clinical": [f.to_dict() for f in self.clinical_findings],
                "biomarkers": [f.to_dict() for f in self.biomarker_findings]
            },
            "recommendations": {
                "treatment": [r.to_dict() for r in self.treatment_recommendations],
                "imaging": [r.to_dict() for r in self.imaging_recommendations],
                "other": [r.to_dict() for r in self.other_recommendations]
            },
            "clinical_trials": self.clinical_trials,
            "warnings": self.warnings,
            "conflicts": self.conflicts,
            "overall_confidence": self.overall_confidence,
            "processing_time_seconds": self.processing_time_seconds,
            "agents_used": self.agents_used
        }
    
    def to_json(self) -> str:
        import json
        return json.dumps(self.to_dict(), indent=2)
