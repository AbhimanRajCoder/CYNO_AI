"""
Coordinator Agent - Orchestrates and synthesizes all agent outputs.

Combines findings from all specialized agents into a unified tumor board view.
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Optional

from ..base import (
    TumorBoardAgentBase, 
    AgentContext, 
    AgentType,
    AgentOutput, 
    Finding, 
    Recommendation,
    ConfidenceLevel,
    SeverityLevel,
    TumorBoardCase
)
from .prompt import COORDINATOR_PROMPT


class CoordinatorAgent(TumorBoardAgentBase):
    """
    Coordinator that synthesizes outputs from all specialized agents
    into a unified tumor board presentation.
    """
    
    def __init__(self, model_name: str = "llama3.2"):
        super().__init__(model_name)
        self.agent_type = AgentType.COORDINATOR
    
    @property
    def agent_name(self) -> str:
        return "Coordinator Agent"
    
    @property
    def agent_description(self) -> str:
        return "Orchestrates all agents and synthesizes findings into unified tumor board view"
    
    def get_prompt(self, context: AgentContext) -> str:
        """Build prompt with all agent outputs."""
        return COORDINATOR_PROMPT.format(
            patient_id=context.patient_id,
            patient_name=context.patient_name or "Unknown",
            agent_outputs=context.report_text  # Contains JSON of all agent outputs
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
        
        # Extract prioritized findings
        findings = []
        for f in data.get("key_findings", []):
            findings.append(Finding(
                category=f.get("category", "summary"),
                name=f.get("name", "Finding"),
                value=f.get("value", ""),
                severity=self._parse_severity(f.get("severity", "moderate")),
                confidence=self._parse_confidence(f.get("confidence", "medium")),
                source_report=f.get("source_agent")
            ))
        
        # Extract prioritized recommendations
        recommendations = []
        for r in data.get("prioritized_recommendations", []):
            recommendations.append(Recommendation(
                category=r.get("category", "treatment"),
                text=r.get("text", ""),
                priority=self._parse_severity(r.get("priority", "moderate")),
                rationale=r.get("rationale"),
                evidence_level=r.get("evidence_level")
            ))
        
        return AgentOutput(
            agent_type=self.agent_type,
            agent_name=self.agent_name,
            success=True,
            confidence=self._parse_confidence(data.get("overall_confidence", "medium")),
            findings=findings,
            recommendations=recommendations,
            summary=data.get("executive_summary", ""),
            warnings=data.get("warnings", []),
            source_patient_id=context.patient_id,
            sub_agent_outputs=context.additional_context or {}
        )
    
    def synthesize_case(
        self,
        patient_id: str,
        patient_name: Optional[str],
        radiology_output: Optional[AgentOutput] = None,
        pathology_output: Optional[AgentOutput] = None,
        clinical_output: Optional[AgentOutput] = None,
        research_output: Optional[AgentOutput] = None
    ) -> TumorBoardCase:
        """
        Synthesize all agent outputs into a complete tumor board case.
        """
        # Prepare context with all agent outputs
        agent_data = {
            "radiology": radiology_output.to_dict() if radiology_output else None,
            "pathology": pathology_output.to_dict() if pathology_output else None,
            "clinical": clinical_output.to_dict() if clinical_output else None,
            "research": research_output.to_dict() if research_output else None
        }
        
        context = AgentContext(
            patient_id=patient_id,
            patient_name=patient_name,
            report_text=json.dumps(agent_data, indent=2),
            additional_context=agent_data
        )
        
        # Run coordinator analysis
        coordinator_output = self.analyze(context)
        
        # Build case
        case = TumorBoardCase(
            patient_id=patient_id,
            patient_name=patient_name,
            case_date=datetime.utcnow().isoformat(),
            radiology_output=radiology_output,
            pathology_output=pathology_output,
            clinical_output=clinical_output,
            research_output=research_output,
            coordinator_output=coordinator_output,
            final_summary=coordinator_output.summary,
            final_recommendations=coordinator_output.recommendations,
            all_warnings=self._collect_warnings(
                radiology_output, pathology_output, clinical_output, 
                research_output, coordinator_output
            )
        )
        
        return case
    
    def _collect_warnings(self, *outputs) -> List[str]:
        warnings = []
        for output in outputs:
            if output and output.warnings:
                warnings.extend(output.warnings)
        return list(set(warnings))
    
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
    
    def _parse_severity(self, s: str) -> SeverityLevel:
        mapping = {"critical": SeverityLevel.CRITICAL, "high": SeverityLevel.HIGH,
                   "moderate": SeverityLevel.MODERATE, "low": SeverityLevel.LOW}
        return mapping.get(s.lower(), SeverityLevel.MODERATE)
    
    def _parse_confidence(self, c: str) -> ConfidenceLevel:
        mapping = {"high": ConfidenceLevel.HIGH, "medium": ConfidenceLevel.MEDIUM, "low": ConfidenceLevel.LOW}
        return mapping.get(c.lower(), ConfidenceLevel.MEDIUM)
