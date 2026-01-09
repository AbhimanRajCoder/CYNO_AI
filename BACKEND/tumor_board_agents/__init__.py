"""
Tumor Board Agents Module

This module contains specialized AI agents for tumor board analysis:

- **RadiologyAgent**: Analyzes imaging reports (CT, MRI, PET scans)
- **PathologyAgent**: Analyzes pathology/biopsy reports
- **ClinicalAgent**: Analyzes clinical notes, labs, patient history
- **ResearchAgent**: Provides evidence-based treatment recommendations
- **CoordinatorAgent**: Orchestrates all agents and synthesizes final view

Usage:
    from tumor_board_agents import TumorBoardRunner
    
    runner = TumorBoardRunner()
    result = await runner.run(patient_id="...", radiology_text="...", pathology_text="...")
"""

from .base import (
    TumorBoardAgentBase,
    AgentContext,
    AgentType,
    ConfidenceLevel,
    SeverityLevel,
    Finding,
    Recommendation,
    AgentOutput,
    TumorBoardCase
)

from .radiology import RadiologyAgent
from .pathology import PathologyAgent
from .clinical import ClinicalAgent
from .research import ResearchAgent
from .coordinator import CoordinatorAgent

from .schemas import TumorBoardView, TumorBoardFinding, TumorBoardRecommendation
from .runner import TumorBoardRunner, run_tumor_board_analysis

__all__ = [
    # Base
    'TumorBoardAgentBase',
    'AgentContext',
    'AgentType',
    'ConfidenceLevel',
    'SeverityLevel',
    'Finding',
    'Recommendation',
    'AgentOutput',
    'TumorBoardCase',
    # Agents
    'RadiologyAgent',
    'PathologyAgent',
    'ClinicalAgent',
    'ResearchAgent',
    'CoordinatorAgent',
    # Schemas
    'TumorBoardView',
    'TumorBoardFinding',
    'TumorBoardRecommendation',
    # Runner
    'TumorBoardRunner',
    'run_tumor_board_analysis'
]
