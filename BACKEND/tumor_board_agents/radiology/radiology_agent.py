"""
Radiology Agent - Specialized for analyzing imaging reports.

Analyzes: CT scans, MRI scans, PET scans, X-rays, Ultrasounds
Extracts: Tumor size, location, staging, metastasis, lymph nodes
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
from .prompt import RADIOLOGY_EXTRACTION_PROMPT


class RadiologyAgent(TumorBoardAgentBase):
    """
    Specialized agent for analyzing radiology/imaging reports.
    
    Focuses on:
    - Tumor characteristics (size, location, enhancement patterns)
    - Metastatic disease assessment
    - Lymph node involvement
    - Response to treatment (if applicable)
    - RECIST criteria measurements
    """
    
    def __init__(self, model_name: str = "llama3.2"):
        super().__init__(model_name)
        self.agent_type = AgentType.RADIOLOGY
    
    @property
    def agent_name(self) -> str:
        return "Radiology Agent"
    
    @property
    def agent_description(self) -> str:
        return "Analyzes imaging reports (CT, MRI, PET) to extract tumor characteristics, staging, and metastatic findings"
    
    def get_prompt(self, context: AgentContext) -> str:
        """Build radiology-specific extraction prompt."""
        return RADIOLOGY_EXTRACTION_PROMPT.format(
            patient_id=context.patient_id,
            patient_name=context.patient_name or "Unknown",
            report_text=context.report_text,
            report_type=context.report_type or "Imaging Report"
        )
    
    def parse_response(self, response: str, context: AgentContext) -> AgentOutput:
        """Parse LLM response into structured radiology findings."""
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from response
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
        
        # Parse tumor findings
        for tumor in data.get("tumors", []):
            findings.append(Finding(
                category="tumor",
                name=tumor.get("location", "Primary Tumor"),
                value=tumor.get("size", "Unknown"),
                unit=tumor.get("size_unit", "cm"),
                severity=self._parse_severity(tumor.get("severity", "moderate")),
                confidence=self._parse_confidence(tumor.get("confidence", "medium")),
                source_report=context.report_type,
                interpretation=tumor.get("description")
            ))
        
        # Parse lymph node findings
        for ln in data.get("lymph_nodes", []):
            findings.append(Finding(
                category="lymph_nodes",
                name=ln.get("location", "Lymph Nodes"),
                value=ln.get("status", "Unknown"),
                severity=self._parse_severity(ln.get("severity", "moderate")),
                confidence=self._parse_confidence(ln.get("confidence", "medium")),
                source_report=context.report_type,
                interpretation=ln.get("description")
            ))
        
        # Parse metastasis findings
        for met in data.get("metastases", []):
            findings.append(Finding(
                category="metastasis",
                name=met.get("location", "Metastatic Site"),
                value=met.get("status", "Present"),
                severity=SeverityLevel.HIGH,
                confidence=self._parse_confidence(met.get("confidence", "medium")),
                source_report=context.report_type,
                interpretation=met.get("description")
            ))
        
        # Parse recommendations
        for rec in data.get("recommendations", []):
            recommendations.append(Recommendation(
                category="imaging",
                text=rec.get("text", rec) if isinstance(rec, dict) else str(rec),
                priority=SeverityLevel.MODERATE,
                rationale=rec.get("rationale") if isinstance(rec, dict) else None
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
            findings=[],
            recommendations=[],
            warnings=[error],
            source_patient_id=context.patient_id
        )
    
    def _parse_severity(self, severity_str: str) -> SeverityLevel:
        mapping = {
            "critical": SeverityLevel.CRITICAL,
            "high": SeverityLevel.HIGH,
            "moderate": SeverityLevel.MODERATE,
            "low": SeverityLevel.LOW,
            "info": SeverityLevel.INFORMATIONAL
        }
        return mapping.get(severity_str.lower(), SeverityLevel.MODERATE)
    
    def _parse_confidence(self, conf_str: str) -> ConfidenceLevel:
        mapping = {
            "high": ConfidenceLevel.HIGH,
            "medium": ConfidenceLevel.MEDIUM,
            "low": ConfidenceLevel.LOW,
            "none": ConfidenceLevel.NONE
        }
        return mapping.get(conf_str.lower(), ConfidenceLevel.MEDIUM)
    
    def _overall_confidence(self, findings: List[Finding]) -> ConfidenceLevel:
        if not findings:
            return ConfidenceLevel.LOW
        
        high_count = sum(1 for f in findings if f.confidence == ConfidenceLevel.HIGH)
        if high_count >= len(findings) * 0.7:
            return ConfidenceLevel.HIGH
        elif high_count >= len(findings) * 0.3:
            return ConfidenceLevel.MEDIUM
        return ConfidenceLevel.LOW
