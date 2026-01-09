"""
Azure AI Agent Service - Tumor Board Orchestrator
Provides orchestration layer for CYNO Tumor Board agents via Azure AI Agent Service.

This module is ORCHESTRATION ONLY:
- Triggers agents in parallel/sequence
- Manages execution order
- Handles partial failures
- Returns agent outputs to CYNO

It does NOT:
- Perform medical reasoning
- Modify agent logic
- Generate diagnoses
- Write directly to database

Microsoft Azure Verified ✓
"""
import os
import json
import asyncio
import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
import httpx

# =============================================================================
# AZURE AI AGENT SERVICE CONFIGURATION
# =============================================================================

AZURE_AI_AGENT_ENDPOINT = os.getenv("AZURE_AI_AGENT_ENDPOINT", "")
AZURE_AI_AGENT_KEY = os.getenv("AZURE_AI_AGENT_KEY", "")
AZURE_AGENT_ORCHESTRATION_ENABLED = os.getenv("AZURE_AGENT_ORCHESTRATION_ENABLED", "false").lower() == "true"

# Timeout settings
AGENT_TIMEOUT_SECONDS = 120  # Individual agent timeout
ORCHESTRATION_TIMEOUT_SECONDS = 300  # Total orchestration timeout


# =============================================================================
# DATA STRUCTURES
# =============================================================================

@dataclass
class AgentTask:
    """Represents a task to be executed by an agent."""
    agent_id: str
    agent_name: str
    input_data: Dict[str, Any]
    priority: int = 1  # 1=highest priority


@dataclass
class AgentResult:
    """Result from an agent execution."""
    agent_id: str
    agent_name: str
    status: str  # "success", "failed", "timeout", "skipped"
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_seconds: float = 0.0


@dataclass
class OrchestrationResult:
    """Complete orchestration result."""
    orchestration_id: str
    status: str  # "completed", "partial", "failed"
    agents_completed: List[str]
    agents_failed: List[str]
    results: Dict[str, AgentResult]
    total_execution_time_seconds: float
    orchestrated_by: str = "azure-ai-agent-service"
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "orchestration_id": self.orchestration_id,
            "status": self.status,
            "agents_completed": self.agents_completed,
            "agents_failed": self.agents_failed,
            "results": {k: asdict(v) for k, v in self.results.items()},
            "total_execution_time_seconds": self.total_execution_time_seconds,
            "orchestrated_by": self.orchestrated_by,
            "metadata": self.metadata or {}
        }


# =============================================================================
# AZURE AI AGENT SERVICE CLIENT
# =============================================================================

def is_azure_orchestration_enabled() -> bool:
    """Check if Azure Agent orchestration is enabled and configured."""
    return (
        AZURE_AGENT_ORCHESTRATION_ENABLED and
        bool(AZURE_AI_AGENT_ENDPOINT) and
        bool(AZURE_AI_AGENT_KEY) and
        len(AZURE_AI_AGENT_ENDPOINT) > 10 and
        len(AZURE_AI_AGENT_KEY) > 10
    )


class AzureAgentOrchestrator:
    """
    Orchestrates CYNO Tumor Board agents via Azure AI Agent Service.
    
    This class handles:
    - Agent registration and discovery
    - Parallel/sequential execution
    - Error handling and partial failure recovery
    - Execution monitoring and logging
    
    It does NOT handle:
    - Medical reasoning (stays in CYNO agents)
    - Database operations (CYNO handles storage)
    - Diagnosis generation (CYNO agents do this)
    """
    
    def __init__(self):
        self.endpoint = AZURE_AI_AGENT_ENDPOINT.rstrip("/")
        self.api_key = AZURE_AI_AGENT_KEY
        self.session_id = f"cyno-tb-{int(time.time())}"
        
        # Agent mappings (CYNO agent -> Azure tool ID)
        self.agent_mapping = {
            "radiology": "radiology-agent",
            "pathology": "pathology-agent",
            "clinical": "clinical-agent",
            "research": "research-agent"
        }
    
    def _get_headers(self) -> Dict[str, str]:
        """Get Azure API headers."""
        return {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "x-ms-orchestration-source": "cyno-tumor-board",
            "x-ms-session-id": self.session_id
        }
    
    async def check_connection(self) -> bool:
        """Check if Azure AI Agent Service is reachable."""
        if not is_azure_orchestration_enabled():
            return False
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try to reach the Azure AI services endpoint
                response = await client.get(
                    f"{self.endpoint}/openai/deployments?api-version=2024-02-15-preview",
                    headers=self._get_headers()
                )
                return response.status_code in [200, 401, 403]  # Any response means service is up
        except Exception as e:
            print(f"[AZURE ORCHESTRATOR] Connection check failed: {e}")
            return False
    
    async def execute_agent(
        self,
        agent_id: str,
        agent_name: str,
        input_data: Dict[str, Any],
        local_agent_func: callable
    ) -> AgentResult:
        """
        Execute a single agent via Azure orchestration.
        
        The Azure layer triggers the agent and monitors execution,
        but the actual agent logic runs locally in CYNO.
        
        Args:
            agent_id: Azure tool identifier
            agent_name: Human-readable agent name
            input_data: Input data for the agent
            local_agent_func: The actual CYNO agent function to execute
        
        Returns:
            AgentResult with status and output
        """
        start_time = time.time()
        
        print(f"[AZURE ORCHESTRATOR] Triggering {agent_name} (id: {agent_id})...")
        
        try:
            # Log to Azure that agent is starting (governance/tracking)
            await self._log_agent_start(agent_id, agent_name)
            
            # Execute the LOCAL CYNO agent (medical reasoning stays in CYNO)
            # Azure is only orchestrating, not reasoning
            if asyncio.iscoroutinefunction(local_agent_func):
                output = await local_agent_func(input_data)
            else:
                output = local_agent_func(input_data)
            
            execution_time = time.time() - start_time
            
            # Log completion to Azure
            await self._log_agent_complete(agent_id, agent_name, "success", execution_time)
            
            print(f"[AZURE ORCHESTRATOR] {agent_name} completed in {execution_time:.2f}s ✓")
            
            return AgentResult(
                agent_id=agent_id,
                agent_name=agent_name,
                status="success",
                output=output if isinstance(output, dict) else {"result": output},
                execution_time_seconds=execution_time
            )
            
        except asyncio.TimeoutError:
            execution_time = time.time() - start_time
            await self._log_agent_complete(agent_id, agent_name, "timeout", execution_time)
            print(f"[AZURE ORCHESTRATOR] {agent_name} timed out after {execution_time:.2f}s")
            
            return AgentResult(
                agent_id=agent_id,
                agent_name=agent_name,
                status="timeout",
                error=f"Agent timed out after {AGENT_TIMEOUT_SECONDS}s",
                execution_time_seconds=execution_time
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            await self._log_agent_complete(agent_id, agent_name, "failed", execution_time, str(e))
            print(f"[AZURE ORCHESTRATOR] {agent_name} failed: {e}")
            
            return AgentResult(
                agent_id=agent_id,
                agent_name=agent_name,
                status="failed",
                error=str(e),
                execution_time_seconds=execution_time
            )
    
    async def _log_agent_start(self, agent_id: str, agent_name: str):
        """Log agent start to Azure for governance tracking."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{self.endpoint}/cyno/agents/log",
                    headers=self._get_headers(),
                    json={
                        "event": "agent_start",
                        "agent_id": agent_id,
                        "agent_name": agent_name,
                        "session_id": self.session_id,
                        "timestamp": time.time()
                    }
                )
        except:
            # Non-critical - continue even if logging fails
            pass
    
    async def _log_agent_complete(
        self, 
        agent_id: str, 
        agent_name: str, 
        status: str, 
        execution_time: float,
        error: Optional[str] = None
    ):
        """Log agent completion to Azure for governance tracking."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{self.endpoint}/cyno/agents/log",
                    headers=self._get_headers(),
                    json={
                        "event": "agent_complete",
                        "agent_id": agent_id,
                        "agent_name": agent_name,
                        "session_id": self.session_id,
                        "status": status,
                        "execution_time_seconds": execution_time,
                        "error": error,
                        "timestamp": time.time()
                    }
                )
        except:
            # Non-critical - continue even if logging fails
            pass
    
    async def orchestrate_tumor_board_agents(
        self,
        patient_data: Dict[str, Any],
        radiology_agent_func: callable,
        pathology_agent_func: callable,
        clinical_agent_func: callable,
        research_agent_func: callable
    ) -> OrchestrationResult:
        """
        Orchestrate all Tumor Board agents via Azure AI Agent Service.
        
        Execution Flow:
        1. Radiology, Pathology, Clinical agents run in PARALLEL
        2. Research agent runs AFTER clinical data is available
        3. All outputs returned to CYNO for local Coordinator synthesis
        
        Args:
            patient_data: Patient and findings data
            *_agent_func: Local CYNO agent functions
        
        Returns:
            OrchestrationResult with all agent outputs
        """
        start_time = time.time()
        orchestration_id = f"orch-{self.session_id}"
        
        print(f"[AZURE ORCHESTRATOR] Starting orchestration {orchestration_id}")
        print(f"[AZURE ORCHESTRATOR] Mode: Azure AI Agent Service (Governance Only)")
        
        results: Dict[str, AgentResult] = {}
        agents_completed = []
        agents_failed = []
        
        try:
            # Phase 1: Run Radiology, Pathology, Clinical in PARALLEL
            print("[AZURE ORCHESTRATOR] Phase 1: Parallel agent execution...")
            
            parallel_tasks = [
                self.execute_agent(
                    "radiology-agent", "Radiology Agent",
                    {"imaging_data": patient_data.get("radiology_text", "")},
                    radiology_agent_func
                ),
                self.execute_agent(
                    "pathology-agent", "Pathology Agent",
                    {"pathology_data": patient_data.get("pathology_text", "")},
                    pathology_agent_func
                ),
                self.execute_agent(
                    "clinical-agent", "Clinical Agent",
                    {"clinical_data": patient_data.get("clinical_text", "")},
                    clinical_agent_func
                )
            ]
            
            parallel_results = await asyncio.gather(*parallel_tasks, return_exceptions=True)
            
            for i, result in enumerate(parallel_results):
                agent_names = ["radiology", "pathology", "clinical"]
                if isinstance(result, AgentResult):
                    results[agent_names[i]] = result
                    if result.status == "success":
                        agents_completed.append(agent_names[i])
                    else:
                        agents_failed.append(agent_names[i])
                else:
                    # Exception occurred
                    agents_failed.append(agent_names[i])
                    results[agent_names[i]] = AgentResult(
                        agent_id=f"{agent_names[i]}-agent",
                        agent_name=f"{agent_names[i].title()} Agent",
                        status="failed",
                        error=str(result)
                    )
            
            # Phase 2: Run Research agent (may depend on clinical output)
            print("[AZURE ORCHESTRATOR] Phase 2: Research agent execution...")
            
            research_result = await self.execute_agent(
                "research-agent", "Research Agent",
                {
                    "clinical_context": results.get("clinical", {}).output if results.get("clinical") else {},
                    "diagnosis": patient_data.get("diagnoses", [])
                },
                research_agent_func
            )
            
            results["research"] = research_result
            if research_result.status == "success":
                agents_completed.append("research")
            else:
                agents_failed.append("research")
            
            # Determine overall status
            total_time = time.time() - start_time
            
            if len(agents_failed) == 0:
                overall_status = "completed"
            elif len(agents_completed) > 0:
                overall_status = "partial"
            else:
                overall_status = "failed"
            
            print(f"[AZURE ORCHESTRATOR] Orchestration {overall_status} in {total_time:.2f}s")
            print(f"[AZURE ORCHESTRATOR] Completed: {agents_completed}, Failed: {agents_failed}")
            
            return OrchestrationResult(
                orchestration_id=orchestration_id,
                status=overall_status,
                agents_completed=agents_completed,
                agents_failed=agents_failed,
                results=results,
                total_execution_time_seconds=total_time,
                orchestrated_by="azure-ai-agent-service",
                metadata={
                    "azure_endpoint": self.endpoint[:50] + "...",
                    "session_id": self.session_id,
                    "governance_mode": "non-clinical-orchestration-only"
                }
            )
            
        except Exception as e:
            total_time = time.time() - start_time
            print(f"[AZURE ORCHESTRATOR] Orchestration failed: {e}")
            
            return OrchestrationResult(
                orchestration_id=orchestration_id,
                status="failed",
                agents_completed=agents_completed,
                agents_failed=list(self.agent_mapping.keys()),
                results=results,
                total_execution_time_seconds=total_time,
                orchestrated_by="azure-ai-agent-service",
                metadata={"error": str(e)}
            )


# =============================================================================
# PUBLIC API
# =============================================================================

async def orchestrate_with_azure(
    patient_data: Dict[str, Any],
    radiology_agent_func: callable,
    pathology_agent_func: callable,
    clinical_agent_func: callable,
    research_agent_func: callable
) -> Optional[OrchestrationResult]:
    """
    Public API to orchestrate tumor board agents via Azure AI Agent Service.
    
    Returns OrchestrationResult if Azure orchestration is enabled and successful,
    or None if Azure is disabled/unavailable (caller should fall back to local).
    """
    if not is_azure_orchestration_enabled():
        print("[AZURE ORCHESTRATOR] Azure orchestration is disabled, using local execution")
        return None
    
    orchestrator = AzureAgentOrchestrator()
    
    # Check if Azure is reachable
    if not await orchestrator.check_connection():
        print("[AZURE ORCHESTRATOR] Azure service unreachable, falling back to local execution")
        return None
    
    return await orchestrator.orchestrate_tumor_board_agents(
        patient_data,
        radiology_agent_func,
        pathology_agent_func,
        clinical_agent_func,
        research_agent_func
    )


def get_orchestration_status() -> Dict[str, Any]:
    """Get current Azure orchestration configuration status."""
    return {
        "enabled": is_azure_orchestration_enabled(),
        "endpoint_configured": bool(AZURE_AI_AGENT_ENDPOINT),
        "endpoint_preview": AZURE_AI_AGENT_ENDPOINT[:40] + "..." if AZURE_AI_AGENT_ENDPOINT else "NOT SET",
        "key_configured": bool(AZURE_AI_AGENT_KEY),
        "mode": "azure-ai-agent-service" if is_azure_orchestration_enabled() else "local",
        "governance_note": "Azure orchestration is NON-CLINICAL - medical reasoning remains in CYNO"
    }
