"""
Agent Types, Enums, and Core Schemas for Tumor Board Agents.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


class AgentType(Enum):
    """Types of specialized agents in the tumor board pipeline."""
    RADIOLOGY = "radiology"
    PATHOLOGY = "pathology"
    CLINICAL = "clinical"
    RESEARCH = "research"
    COORDINATOR = "coordinator"
    UNKNOWN = "unknown"


class ConfidenceLevel(Enum):
    """Confidence levels for agent outputs."""
    HIGH = "high"        # >80% confidence, verified against source
    MEDIUM = "medium"    # 50-80% confidence, some ambiguity
    LOW = "low"          # <50% confidence, significant uncertainty
    NONE = "none"        # Cannot determine, insufficient data


class SeverityLevel(Enum):
    """Severity levels for findings."""
    CRITICAL = "critical"    # Requires immediate attention
    HIGH = "high"            # Significant clinical concern
    MODERATE = "moderate"    # Notable but not urgent
    LOW = "low"              # Minor or incidental finding
    INFORMATIONAL = "info"   # FYI only


@dataclass
class Finding:
    """A single clinical finding from an agent."""
    category: str                          # e.g., "tumor_size", "lymph_nodes", "biomarker"
    name: str                              # e.g., "Primary Tumor Size"
    value: str                             # e.g., "3.2 cm"
    unit: Optional[str] = None             # e.g., "cm"
    severity: SeverityLevel = SeverityLevel.INFORMATIONAL
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    source_page: Optional[int] = None      # Page number in source report
    source_report: Optional[str] = None    # Name of source report
    interpretation: Optional[str] = None   # Clinical interpretation (optional)
    raw_text: Optional[str] = None         # Original OCR text for verification
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "name": self.name,
            "value": self.value,
            "unit": self.unit,
            "severity": self.severity.value if isinstance(self.severity, SeverityLevel) else self.severity,
            "confidence": self.confidence.value if isinstance(self.confidence, ConfidenceLevel) else self.confidence,
            "source_page": self.source_page,
            "source_report": self.source_report,
            "interpretation": self.interpretation,
            "raw_text": self.raw_text
        }


@dataclass
class Recommendation:
    """A clinical recommendation from an agent."""
    category: str                          # e.g., "treatment", "imaging", "biopsy"
    text: str                              # The recommendation text
    priority: SeverityLevel = SeverityLevel.MODERATE
    rationale: Optional[str] = None        # Why this is recommended
    evidence_level: Optional[str] = None   # e.g., "Level 1A", "Expert Opinion"
    source: Optional[str] = None           # Citation or source
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "text": self.text,
            "priority": self.priority.value if isinstance(self.priority, SeverityLevel) else self.priority,
            "rationale": self.rationale,
            "evidence_level": self.evidence_level,
            "source": self.source
        }


@dataclass
class AgentOutput:
    """Standardized output from any tumor board agent."""
    agent_type: AgentType = AgentType.UNKNOWN
    agent_name: str = ""
    success: bool = True
    error: Optional[str] = None
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    
    # Core outputs
    findings: List[Finding] = field(default_factory=list)
    recommendations: List[Recommendation] = field(default_factory=list)
    summary: str = ""
    
    # Metadata
    warnings: List[str] = field(default_factory=list)
    timestamp: str = ""
    source_patient_id: str = ""
    processing_time_ms: int = 0
    
    # For coordinator aggregation
    sub_agent_outputs: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_type": self.agent_type.value if isinstance(self.agent_type, AgentType) else self.agent_type,
            "agent_name": self.agent_name,
            "success": self.success,
            "error": self.error,
            "confidence": self.confidence.value if isinstance(self.confidence, ConfidenceLevel) else self.confidence,
            "findings": [f.to_dict() if hasattr(f, 'to_dict') else f for f in self.findings],
            "recommendations": [r.to_dict() if hasattr(r, 'to_dict') else r for r in self.recommendations],
            "summary": self.summary,
            "warnings": self.warnings,
            "timestamp": self.timestamp,
            "source_patient_id": self.source_patient_id,
            "processing_time_ms": self.processing_time_ms,
            "sub_agent_outputs": self.sub_agent_outputs
        }


@dataclass
class TumorBoardCase:
    """Complete tumor board case with all agent analyses."""
    patient_id: str
    patient_name: Optional[str] = None
    case_date: str = ""
    
    # Agent outputs
    radiology_output: Optional[AgentOutput] = None
    pathology_output: Optional[AgentOutput] = None
    clinical_output: Optional[AgentOutput] = None
    research_output: Optional[AgentOutput] = None
    coordinator_output: Optional[AgentOutput] = None
    
    # Aggregated
    final_summary: str = ""
    final_recommendations: List[Recommendation] = field(default_factory=list)
    all_warnings: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "patient_id": self.patient_id,
            "patient_name": self.patient_name,
            "case_date": self.case_date,
            "radiology_output": self.radiology_output.to_dict() if self.radiology_output else None,
            "pathology_output": self.pathology_output.to_dict() if self.pathology_output else None,
            "clinical_output": self.clinical_output.to_dict() if self.clinical_output else None,
            "research_output": self.research_output.to_dict() if self.research_output else None,
            "coordinator_output": self.coordinator_output.to_dict() if self.coordinator_output else None,
            "final_summary": self.final_summary,
            "final_recommendations": [r.to_dict() if hasattr(r, 'to_dict') else r for r in self.final_recommendations],
            "all_warnings": self.all_warnings
        }
