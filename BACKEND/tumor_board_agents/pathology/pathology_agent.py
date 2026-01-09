"""
Pathology Agent - Specialized for analyzing pathology/biopsy reports.

Analyzes: Biopsy reports, Histopathology, Immunohistochemistry, Molecular markers
Extracts: Tumor grade, stage, biomarkers (ER, PR, HER2, Ki-67), mutations
"""

import json
import re
from typing import Dict, Any, List

from ..base import (
    TumorBoardAgentBase, 
    AgentContext, 
    AgentType,
    AgentOutput, 
    Finding, 
    Recommendation,
    ConfidenceLevel,
    SeverityLevel
)
from .prompt import PATHOLOGY_EXTRACTION_PROMPT


class PathologyAgent(TumorBoardAgentBase):
    """
    Specialized agent for analyzing pathology reports.
    
    Focuses on:
    - Histological diagnosis and tumor type
    - Tumor grade (differentiation)
    - Biomarkers (ER, PR, HER2, Ki-67 for breast)
    - Molecular markers and mutations
    - Margins and resection status
    """
    
    def __init__(self, model_name: str = "llama3.2"):
        super().__init__(model_name)
        self.agent_type = AgentType.PATHOLOGY
    
    @property
    def agent_name(self) -> str:
        return "Pathology Agent"
    
    @property
    def agent_description(self) -> str:
        return "Analyzes pathology reports to extract histology, biomarkers, grading, and molecular findings"
    
    def get_prompt(self, context: AgentContext) -> str:
        return PATHOLOGY_EXTRACTION_PROMPT.format(
            patient_id=context.patient_id,
            patient_name=context.patient_name or "Unknown",
            report_text=context.report_text,
            report_type=context.report_type or "Pathology Report"
        )
    
    def parse_response(self, response: str, context: AgentContext) -> AgentOutput:
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group())
                except:
                    return self._error_output("Failed to parse JSON response", context)
            else:
                return self._error_output("No valid JSON in response", context)
        
        findings = []
        recommendations = []
        warnings = data.get("warnings", [])
        
        # Parse diagnosis
        if data.get("diagnosis"):
            dx = data["diagnosis"]
            findings.append(Finding(
                category="diagnosis",
                name="Histological Diagnosis",
                value=dx.get("type", "Unknown"),
                severity=SeverityLevel.HIGH,
                confidence=self._parse_confidence(dx.get("confidence", "medium")),
                source_report=context.report_type,
                interpretation=dx.get("description")
            ))
        
        # Parse grade
        if data.get("grade"):
            grade = data["grade"]
            findings.append(Finding(
                category="grade",
                name="Tumor Grade",
                value=grade.get("value", "Unknown"),
                severity=SeverityLevel.MODERATE,
                confidence=self._parse_confidence(grade.get("confidence", "medium")),
                source_report=context.report_type
            ))
        
        # Parse biomarkers
        for marker in data.get("biomarkers", []):
            severity = SeverityLevel.HIGH if marker.get("value", "").lower() == "positive" else SeverityLevel.MODERATE
            findings.append(Finding(
                category="biomarker",
                name=marker.get("name", "Unknown Biomarker"),
                value=marker.get("value", "Unknown"),
                severity=severity,
                confidence=self._parse_confidence(marker.get("confidence", "medium")),
                source_report=context.report_type,
                interpretation=marker.get("interpretation")
            ))
        
        # Parse mutations
        for mutation in data.get("mutations", []):
            findings.append(Finding(
                category="mutation",
                name=mutation.get("gene", "Unknown Gene"),
                value=mutation.get("status", "Unknown"),
                severity=SeverityLevel.HIGH,
                confidence=self._parse_confidence(mutation.get("confidence", "medium")),
                source_report=context.report_type,
                interpretation=mutation.get("clinical_significance")
            ))
        
        # Parse margins
        if data.get("margins"):
            margins = data["margins"]
            findings.append(Finding(
                category="surgical",
                name="Surgical Margins",
                value=margins.get("status", "Unknown"),
                severity=SeverityLevel.HIGH if margins.get("status", "").lower() == "positive" else SeverityLevel.LOW,
                confidence=self._parse_confidence(margins.get("confidence", "medium")),
                source_report=context.report_type
            ))
        
        # Parse recommendations
        for rec in data.get("recommendations", []):
            recommendations.append(Recommendation(
                category="pathology",
                text=rec.get("text", rec) if isinstance(rec, dict) else str(rec),
                priority=SeverityLevel.MODERATE
            ))
        
        return AgentOutput(
            agent_type=self.agent_type,
            agent_name=self.agent_name,
            success=True,
            confidence=self._overall_confidence(findings),
            findings=findings,
            recommendations=recommendations,
            summary=data.get("summary", ""),
            warnings=warnings,
            source_patient_id=context.patient_id
        )
    
    def _error_output(self, error: str, context: AgentContext) -> AgentOutput:
        return AgentOutput(
            agent_type=self.agent_type,
            agent_name=self.agent_name,
            success=False,
            error=error,
            confidence=ConfidenceLevel.NONE,
            warnings=[error],
            source_patient_id=context.patient_id
        )
    
    def _parse_confidence(self, conf_str: str) -> ConfidenceLevel:
        mapping = {"high": ConfidenceLevel.HIGH, "medium": ConfidenceLevel.MEDIUM, "low": ConfidenceLevel.LOW}
        return mapping.get(conf_str.lower(), ConfidenceLevel.MEDIUM)
    
    def _overall_confidence(self, findings: List[Finding]) -> ConfidenceLevel:
        if not findings:
            return ConfidenceLevel.LOW
        high_count = sum(1 for f in findings if f.confidence == ConfidenceLevel.HIGH)
        if high_count >= len(findings) * 0.7:
            return ConfidenceLevel.HIGH
        return ConfidenceLevel.MEDIUM
