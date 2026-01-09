"""
Tumor Board Runner - Orchestrates all agents for complete analysis.

This is the main entry point for running tumor board analysis.
"""

import asyncio
import time
from typing import List, Dict, Any, Optional
from dataclasses import asdict
from concurrent.futures import ThreadPoolExecutor

# Import config
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import LLMModels, ProcessingConfig

from .base import AgentContext, AgentOutput, TumorBoardCase
from .radiology import RadiologyAgent
from .pathology import PathologyAgent
from .clinical import ClinicalAgent
from .research import ResearchAgent
from .coordinator import CoordinatorAgent
from .schemas import TumorBoardView, TumorBoardFinding, TumorBoardRecommendation


class TumorBoardRunner:
    """
    Orchestrates all tumor board agents for complete case analysis.
    
    Pipeline:
    1. Classify incoming reports by type
    2. Route to appropriate specialized agents (parallel)
    3. Run coordinator to synthesize
    4. Generate TumorBoardView for UI
    """
    
    def __init__(self, model_name: Optional[str] = None, max_concurrent: Optional[int] = None):
        # Use config defaults if not specified
        self.model_name = model_name or LLMModels.TUMOR_BOARD_AGENTS
        self.max_concurrent = max_concurrent or ProcessingConfig.TUMOR_BOARD_MAX_AGENTS
        
        # Initialize agents
        self.radiology_agent = RadiologyAgent(self.model_name)
        self.pathology_agent = PathologyAgent(self.model_name)
        self.clinical_agent = ClinicalAgent(self.model_name)
        self.research_agent = ResearchAgent(self.model_name)
        self.coordinator_agent = CoordinatorAgent(self.model_name)
        
        # Semaphore for limiting concurrent LLM calls
        self._semaphore = asyncio.Semaphore(self.max_concurrent)
        self._executor = ThreadPoolExecutor(max_workers=4)
    
    async def run(
        self,
        patient_id: str,
        patient_name: Optional[str] = None,
        patient_age: Optional[str] = None,
        patient_gender: Optional[str] = None,
        reports: Optional[List[Dict[str, Any]]] = None,
        radiology_text: Optional[str] = None,
        pathology_text: Optional[str] = None,
        clinical_text: Optional[str] = None
    ) -> TumorBoardView:
        """
        Run complete tumor board analysis.
        
        Args:
            patient_id: Patient identifier
            patient_name: Patient name
            patient_age: Patient age
            patient_gender: Patient gender
            reports: List of report dicts with 'type' and 'text' keys
            radiology_text: Direct radiology report text
            pathology_text: Direct pathology report text
            clinical_text: Direct clinical notes text
        
        Returns:
            TumorBoardView for UI display
        """
        start_time = time.perf_counter()
        
        # Prepare contexts from direct text or reports
        radiology_ctx = pathology_ctx = clinical_ctx = None
        
        if radiology_text:
            radiology_ctx = AgentContext(
                patient_id=patient_id,
                patient_name=patient_name,
                patient_age=patient_age,
                patient_gender=patient_gender,
                report_text=radiology_text,
                report_type="Radiology Report"
            )
        
        if pathology_text:
            pathology_ctx = AgentContext(
                patient_id=patient_id,
                patient_name=patient_name,
                patient_age=patient_age,
                patient_gender=patient_gender,
                report_text=pathology_text,
                report_type="Pathology Report"
            )
        
        if clinical_text:
            clinical_ctx = AgentContext(
                patient_id=patient_id,
                patient_name=patient_name,
                patient_age=patient_age,
                patient_gender=patient_gender,
                report_text=clinical_text,
                report_type="Clinical Notes"
            )
        
        # Process reports list if provided
        if reports:
            for report in reports:
                report_type = report.get("type", "").lower()
                report_text = report.get("text", "")
                
                if "radiology" in report_type or "imaging" in report_type or "ct" in report_type or "mri" in report_type:
                    radiology_ctx = AgentContext(
                        patient_id=patient_id,
                        patient_name=patient_name,
                        patient_age=patient_age,
                        report_text=report_text,
                        report_type=report.get("type")
                    )
                elif "pathology" in report_type or "biopsy" in report_type or "histology" in report_type:
                    pathology_ctx = AgentContext(
                        patient_id=patient_id,
                        patient_name=patient_name,
                        patient_age=patient_age,
                        report_text=report_text,
                        report_type=report.get("type")
                    )
                elif "clinical" in report_type or "notes" in report_type or "progress" in report_type:
                    clinical_ctx = AgentContext(
                        patient_id=patient_id,
                        patient_name=patient_name,
                        patient_age=patient_age,
                        patient_gender=patient_gender,
                        report_text=report_text,
                        report_type=report.get("type")
                    )
        
        # Run specialized agents in parallel (with semaphore control)
        loop = asyncio.get_event_loop()
        
        async def run_agent_with_semaphore(agent, context):
            if context is None:
                return None
            async with self._semaphore:
                return await loop.run_in_executor(
                    self._executor,
                    agent.analyze,
                    context
                )
        
        radiology_output, pathology_output, clinical_output = await asyncio.gather(
            run_agent_with_semaphore(self.radiology_agent, radiology_ctx),
            run_agent_with_semaphore(self.pathology_agent, pathology_ctx),
            run_agent_with_semaphore(self.clinical_agent, clinical_ctx)
        )
        
        # Run research agent with combined context
        combined_summary = self._build_combined_summary(
            radiology_output, pathology_output, clinical_output
        )
        
        research_ctx = AgentContext(
            patient_id=patient_id,
            patient_name=patient_name,
            patient_age=patient_age,
            report_text=combined_summary,
            additional_context={
                "radiology": radiology_output.to_dict() if radiology_output else None,
                "pathology": pathology_output.to_dict() if pathology_output else None,
                "clinical": clinical_output.to_dict() if clinical_output else None
            }
        )
        
        research_output = await run_agent_with_semaphore(self.research_agent, research_ctx)
        
        # Run coordinator to synthesize
        case = self.coordinator_agent.synthesize_case(
            patient_id=patient_id,
            patient_name=patient_name,
            radiology_output=radiology_output,
            pathology_output=pathology_output,
            clinical_output=clinical_output,
            research_output=research_output
        )
        
        # Convert to UI view
        elapsed = time.perf_counter() - start_time
        view = self._case_to_view(case, patient_age, patient_gender, elapsed)
        
        return view
    
    def _build_combined_summary(
        self,
        radiology: Optional[AgentOutput],
        pathology: Optional[AgentOutput],
        clinical: Optional[AgentOutput]
    ) -> str:
        """Build a combined summary for the research agent."""
        parts = []
        
        if radiology and radiology.success:
            parts.append(f"IMAGING: {radiology.summary}")
            for f in radiology.findings[:5]:
                parts.append(f"  - {f.name}: {f.value}")
        
        if pathology and pathology.success:
            parts.append(f"PATHOLOGY: {pathology.summary}")
            for f in pathology.findings[:5]:
                parts.append(f"  - {f.name}: {f.value}")
        
        if clinical and clinical.success:
            parts.append(f"CLINICAL: {clinical.summary}")
            for f in clinical.findings[:5]:
                parts.append(f"  - {f.name}: {f.value}")
        
        return "\n".join(parts)
    
    def _case_to_view(
        self, 
        case: TumorBoardCase, 
        patient_age: Optional[str],
        patient_gender: Optional[str],
        elapsed: float
    ) -> TumorBoardView:
        """Convert TumorBoardCase to TumorBoardView for UI."""
        view = TumorBoardView(
            patient_id=case.patient_id,
            patient_name=case.patient_name or "Unknown",
            patient_age=patient_age,
            patient_gender=patient_gender,
            case_date=case.case_date,
            executive_summary=case.coordinator_output.summary if case.coordinator_output else "",
            warnings=case.all_warnings,
            processing_time_seconds=round(elapsed, 2),
            agents_used=[]
        )
        
        # Extract imaging findings
        if case.radiology_output and case.radiology_output.success:
            view.agents_used.append("Radiology Agent")
            for f in case.radiology_output.findings:
                view.imaging_findings.append(TumorBoardFinding(
                    category=f.category,
                    title=f.name,
                    value=f.value,
                    severity=f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                    source_agent="radiology",
                    interpretation=f.interpretation
                ))
        
        # Extract pathology findings
        if case.pathology_output and case.pathology_output.success:
            view.agents_used.append("Pathology Agent")
            for f in case.pathology_output.findings:
                if f.category == "biomarker":
                    view.biomarker_findings.append(TumorBoardFinding(
                        category=f.category,
                        title=f.name,
                        value=f.value,
                        severity=f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                        source_agent="pathology",
                        interpretation=f.interpretation
                    ))
                else:
                    view.pathology_findings.append(TumorBoardFinding(
                        category=f.category,
                        title=f.name,
                        value=f.value,
                        severity=f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                        source_agent="pathology",
                        interpretation=f.interpretation
                    ))
        
        # Extract clinical findings
        if case.clinical_output and case.clinical_output.success:
            view.agents_used.append("Clinical Agent")
            for f in case.clinical_output.findings:
                view.clinical_findings.append(TumorBoardFinding(
                    category=f.category,
                    title=f.name,
                    value=f.value,
                    severity=f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                    source_agent="clinical",
                    interpretation=f.interpretation
                ))
        
        # Extract recommendations
        if case.research_output and case.research_output.success:
            view.agents_used.append("Research Agent")
            for r in case.research_output.recommendations:
                if r.category == "treatment":
                    view.treatment_recommendations.append(TumorBoardRecommendation(
                        category=r.category,
                        text=r.text,
                        priority=r.priority.value if hasattr(r.priority, 'value') else str(r.priority),
                        rationale=r.rationale,
                        evidence_level=r.evidence_level
                    ))
                elif r.category == "clinical_trial":
                    view.clinical_trials.append({
                        "name": r.text,
                        "source": r.source or "",
                        "eligibility": r.rationale or ""
                    })
                else:
                    view.other_recommendations.append(TumorBoardRecommendation(
                        category=r.category,
                        text=r.text,
                        priority=r.priority.value if hasattr(r.priority, 'value') else str(r.priority),
                        rationale=r.rationale
                    ))
        
        if case.coordinator_output:
            view.agents_used.append("Coordinator Agent")
            view.overall_confidence = case.coordinator_output.confidence.value if hasattr(case.coordinator_output.confidence, 'value') else str(case.coordinator_output.confidence)
        
        return view


# Convenience function
async def run_tumor_board_analysis(
    patient_id: str,
    patient_name: Optional[str] = None,
    radiology_text: Optional[str] = None,
    pathology_text: Optional[str] = None,
    clinical_text: Optional[str] = None,
    model_name: Optional[str] = None
) -> TumorBoardView:
    """
    Convenience function to run tumor board analysis.
    
    Returns TumorBoardView ready for UI display.
    """
    runner = TumorBoardRunner(model_name=model_name)
    return await runner.run(
        patient_id=patient_id,
        patient_name=patient_name,
        radiology_text=radiology_text,
        pathology_text=pathology_text,
        clinical_text=clinical_text
    )
