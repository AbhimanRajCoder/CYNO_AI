"""
Research Agent - Provides evidence-based treatment recommendations.

Analyzes: Published guidelines, clinical trials, treatment protocols
Outputs: Evidence-based recommendations with citations
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
from .prompt import RESEARCH_PROMPT


class ResearchAgent(TumorBoardAgentBase):
    """Agent that synthesizes treatment recommendations based on clinical evidence."""
    
    def __init__(self, model_name: str = "llama3.2"):
        super().__init__(model_name)
        self.agent_type = AgentType.RESEARCH
    
    @property
    def agent_name(self) -> str:
        return "Research Agent"
    
    @property
    def agent_description(self) -> str:
        return "Provides evidence-based treatment recommendations from guidelines and clinical trials"
    
    def get_prompt(self, context: AgentContext) -> str:
        return RESEARCH_PROMPT.format(
            patient_id=context.patient_id,
            patient_name=context.patient_name or "Unknown",
            patient_age=context.patient_age or "Unknown",
            clinical_summary=context.report_text,
            additional_context=json.dumps(context.additional_context or {})
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
        
        recommendations = []
        warnings = data.get("warnings", [])
        
        for rec in data.get("treatment_options", []):
            recommendations.append(Recommendation(
                category="treatment",
                text=rec.get("name", "Unknown"),
                priority=self._parse_priority(rec.get("priority", "moderate")),
                rationale=rec.get("rationale"),
                evidence_level=rec.get("evidence_level"),
                source=rec.get("source")
            ))
        
        for rec in data.get("clinical_trials", []):
            recommendations.append(Recommendation(
                category="clinical_trial",
                text=rec.get("name", "Clinical Trial"),
                priority=SeverityLevel.MODERATE,
                rationale=rec.get("eligibility"),
                evidence_level="Clinical Trial",
                source=rec.get("nct_id")
            ))
        
        for rec in data.get("additional_recommendations", []):
            recommendations.append(Recommendation(
                category="additional",
                text=rec.get("text", rec) if isinstance(rec, dict) else str(rec),
                priority=SeverityLevel.LOW
            ))
        
        return AgentOutput(
            agent_type=self.agent_type,
            agent_name=self.agent_name,
            success=True,
            confidence=ConfidenceLevel.MEDIUM,
            findings=[],
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
    
    def _parse_priority(self, p: str) -> SeverityLevel:
        mapping = {"high": SeverityLevel.HIGH, "moderate": SeverityLevel.MODERATE, "low": SeverityLevel.LOW}
        return mapping.get(p.lower(), SeverityLevel.MODERATE)
