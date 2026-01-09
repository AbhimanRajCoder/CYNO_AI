"""
Clinical Agent - Specialized for analyzing clinical notes and patient history.

Analyzes: Progress notes, H&P, Labs, Vitals, Medications
Extracts: Comorbidities, performance status, symptoms, treatment history
"""

import json
import re
from typing import List

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
from .prompt import CLINICAL_EXTRACTION_PROMPT


class ClinicalAgent(TumorBoardAgentBase):
    """Specialized agent for analyzing clinical notes and patient history."""
    
    def __init__(self, model_name: str = "llama3.2"):
        super().__init__(model_name)
        self.agent_type = AgentType.CLINICAL
    
    @property
    def agent_name(self) -> str:
        return "Clinical Agent"
    
    @property
    def agent_description(self) -> str:
        return "Analyzes clinical notes to extract patient history, comorbidities, performance status, and treatment history"
    
    def get_prompt(self, context: AgentContext) -> str:
        return CLINICAL_EXTRACTION_PROMPT.format(
            patient_id=context.patient_id,
            patient_name=context.patient_name or "Unknown",
            patient_age=context.patient_age or "Unknown",
            patient_gender=context.patient_gender or "Unknown",
            report_text=context.report_text,
            report_type=context.report_type or "Clinical Notes"
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
                    return self._error_output("Failed to parse JSON", context)
            else:
                return self._error_output("No valid JSON", context)
        
        findings = []
        recommendations = []
        warnings = data.get("warnings", [])
        
        # Performance status
        if data.get("performance_status"):
            ps = data["performance_status"]
            findings.append(Finding(
                category="performance_status",
                name="ECOG Performance Status",
                value=ps.get("value", "Unknown"),
                severity=self._ps_severity(ps.get("value", "")),
                confidence=self._parse_confidence(ps.get("confidence", "medium")),
                source_report=context.report_type
            ))
        
        # Comorbidities
        for comorbidity in data.get("comorbidities", []):
            findings.append(Finding(
                category="comorbidity",
                name=comorbidity.get("name", "Unknown"),
                value=comorbidity.get("status", "Present"),
                severity=SeverityLevel.MODERATE,
                confidence=self._parse_confidence(comorbidity.get("confidence", "medium")),
                source_report=context.report_type
            ))
        
        # Symptoms
        for symptom in data.get("symptoms", []):
            findings.append(Finding(
                category="symptom",
                name=symptom.get("name", "Unknown"),
                value=symptom.get("severity", "Present"),
                severity=self._parse_severity(symptom.get("severity", "moderate")),
                confidence=self._parse_confidence(symptom.get("confidence", "medium")),
                source_report=context.report_type
            ))
        
        # Labs
        for lab in data.get("labs", []):
            findings.append(Finding(
                category="lab",
                name=lab.get("name", "Unknown"),
                value=lab.get("value", "Unknown"),
                unit=lab.get("unit"),
                severity=SeverityLevel.INFORMATIONAL,
                confidence=self._parse_confidence(lab.get("confidence", "medium")),
                source_report=context.report_type,
                interpretation=lab.get("interpretation")
            ))
        
        # Treatment history
        for treatment in data.get("treatment_history", []):
            findings.append(Finding(
                category="treatment",
                name=treatment.get("type", "Treatment"),
                value=treatment.get("name", "Unknown"),
                severity=SeverityLevel.INFORMATIONAL,
                confidence=self._parse_confidence(treatment.get("confidence", "medium")),
                source_report=context.report_type,
                interpretation=treatment.get("response")
            ))
        
        for rec in data.get("recommendations", []):
            recommendations.append(Recommendation(
                category="clinical",
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
    
    def _ps_severity(self, ps_value: str) -> SeverityLevel:
        """Map performance status to severity."""
        if "0" in ps_value or "1" in ps_value:
            return SeverityLevel.LOW
        elif "2" in ps_value:
            return SeverityLevel.MODERATE
        elif "3" in ps_value or "4" in ps_value:
            return SeverityLevel.HIGH
        return SeverityLevel.MODERATE
    
    def _parse_severity(self, s: str) -> SeverityLevel:
        mapping = {"critical": SeverityLevel.CRITICAL, "high": SeverityLevel.HIGH, 
                   "moderate": SeverityLevel.MODERATE, "low": SeverityLevel.LOW}
        return mapping.get(s.lower(), SeverityLevel.MODERATE)
    
    def _parse_confidence(self, c: str) -> ConfidenceLevel:
        mapping = {"high": ConfidenceLevel.HIGH, "medium": ConfidenceLevel.MEDIUM, "low": ConfidenceLevel.LOW}
        return mapping.get(c.lower(), ConfidenceLevel.MEDIUM)
    
    def _overall_confidence(self, findings: List[Finding]) -> ConfidenceLevel:
        if not findings:
            return ConfidenceLevel.LOW
        high_count = sum(1 for f in findings if f.confidence == ConfidenceLevel.HIGH)
        return ConfidenceLevel.HIGH if high_count >= len(findings) * 0.7 else ConfidenceLevel.MEDIUM
