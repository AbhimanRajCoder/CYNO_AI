"""
Base Agent Contract - CRITICAL for all tumor board agents.

All specialized agents MUST inherit from TumorBoardAgentBase and implement
the required abstract methods to ensure consistent behavior across the pipeline.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import json
from groq_client import groq_chat

from .agent_types import AgentType, AgentOutput, ConfidenceLevel


@dataclass
class AgentContext:
    """Context passed to each agent for analysis."""
    patient_id: str
    patient_name: Optional[str] = None
    patient_age: Optional[str] = None
    patient_gender: Optional[str] = None
    report_text: str = ""
    report_type: Optional[str] = None
    report_date: Optional[str] = None
    ocr_confidence: float = 0.0
    additional_context: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.additional_context is None:
            self.additional_context = {}


class TumorBoardAgentBase(ABC):
    """
    Base class for all Tumor Board AI agents.
    
    CRITICAL CONTRACT:
    1. All agents MUST implement analyze() method
    2. All agents MUST return AgentOutput with proper schema
    3. All agents MUST set confidence levels honestly
    4. All agents MUST NOT hallucinate - if unsure, say so
    5. All agents MUST cite source page/report when making claims
    """
    
    def __init__(self, model_name: str = "llama-3.1-8b-instant"):
        self.model_name = model_name
        self.agent_type: AgentType = AgentType.UNKNOWN
        self._prompt_template: str = ""
    
    @property
    @abstractmethod
    def agent_name(self) -> str:
        """Return human-readable agent name."""
        pass
    
    @property
    @abstractmethod
    def agent_description(self) -> str:
        """Return description of what this agent does."""
        pass
    
    @abstractmethod
    def get_prompt(self, context: AgentContext) -> str:
        """
        Build the prompt for this agent given the context.
        Must be implemented by each specialized agent.
        """
        pass
    
    @abstractmethod
    def parse_response(self, response: str, context: AgentContext) -> AgentOutput:
        """
        Parse the LLM response into structured AgentOutput.
        Must handle malformed responses gracefully.
        """
        pass
    
    def analyze(self, context: AgentContext) -> AgentOutput:
        """
        Main entry point for agent analysis.
        
        DO NOT OVERRIDE unless you have a very good reason.
        """
        try:
            # Build prompt
            prompt = self.get_prompt(context)
            
            # Call LLM
            response = self._call_llm(prompt)
            
            # Parse response
            output = self.parse_response(response, context)
            
            # Add metadata
            output.agent_type = self.agent_type
            output.agent_name = self.agent_name
            output.timestamp = datetime.utcnow().isoformat()
            output.source_patient_id = context.patient_id
            
            return output
            
        except Exception as e:
            return AgentOutput(
                agent_type=self.agent_type,
                agent_name=self.agent_name,
                success=False,
                error=str(e),
                confidence=ConfidenceLevel.NONE,
                findings=[],
                recommendations=[],
                warnings=[f"Agent failed: {str(e)}"],
                timestamp=datetime.utcnow().isoformat(),
                source_patient_id=context.patient_id
            )
    
    def _call_llm(self, prompt: str) -> str:
        """Call the LLM with the given prompt using Groq API."""
        response = groq_chat(
            model=self.model_name,
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.1,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
        return response['message']['content']
    
    def validate_output(self, output: AgentOutput) -> List[str]:
        """
        Validate the output meets clinical safety requirements.
        Returns list of validation warnings.
        """
        warnings = []
        
        if not output.findings and output.success:
            warnings.append(f"{self.agent_name}: No findings extracted despite success")
        
        if output.confidence == ConfidenceLevel.NONE and output.success:
            warnings.append(f"{self.agent_name}: Success but zero confidence - suspicious")
        
        return warnings
    
    def to_dict(self) -> Dict[str, Any]:
        """Return agent metadata as dictionary."""
        return {
            "agent_type": self.agent_type.value,
            "agent_name": self.agent_name,
            "agent_description": self.agent_description,
            "model_name": self.model_name
        }
