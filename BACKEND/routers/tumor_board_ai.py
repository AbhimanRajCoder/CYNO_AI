"""
Tumor Board AI Router - Clinical Intelligence Compiler
Transforms structured JSON medical reports into comprehensive tumor board case views

Azure AI Agent Service Integration:
- Orchestration layer for agent execution (additive, non-disruptive)
- Medical reasoning remains in CYNO agents
- Feature-flag controlled via AZURE_AGENT_ORCHESTRATION_ENABLED
"""
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from fastapi import APIRouter, HTTPException, status, Query, BackgroundTasks
from groq_client import groq_chat
from database import db

# Import config
from config import LLMModels, LLMConfigs, ProcessingConfig, get_model_name

# Import multi-agent system
from tumor_board_agents import (
    TumorBoardRunner,
    TumorBoardView,
    RadiologyAgent,
    PathologyAgent,
    ClinicalAgent,
    ResearchAgent,
    AgentContext
)
from tumor_board_agents.utils import clean_multi_agent_view

# Import Azure AI Agent Service orchestrator
from routers.azure_agent_orchestrator import (
    orchestrate_with_azure,
    is_azure_orchestration_enabled,
    get_orchestration_status,
    OrchestrationResult
)

router = APIRouter(prefix="/api/tumor-board-ai", tags=["Tumor Board AI"])

# Use config for model name
MODEL_NAME = LLMModels.TUMOR_BOARD_MAIN

# =============================================================================
# TUMOR BOARD AI PROMPT - CLINICAL INTELLIGENCE COMPILER
# =============================================================================

TUMOR_BOARD_PROMPT = '''You are a MEDICAL TIMELINE STRUCTURING SYSTEM designed for hospital-grade clinical summarization.

You do NOT perform OCR.
You do NOT extract raw values from PDFs.
You ONLY receive structured extraction JSON produced by a prior STRICT extractor.

Your task is to RESTRUCTURE, GROUP, and ORGANIZE the provided data into a
chronological, domain-aware clinical timeline WITHOUT inventing any new facts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE SAFETY RULES (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. You MUST NOT invent, infer, assume, normalize, or clinically interpret data.
2. You MUST NOT introduce values, diagnoses, or impressions not explicitly present.
3. You MUST NOT correct numeric values, units, or reference ranges.
4. You MUST NOT upgrade impressions into confirmed diagnoses unless explicitly stated.
5. You MUST preserve uncertainty exactly as present in the source.
6. If information is missing → omit the field or set it to null.
7. Never reuse patient data across unrelated reports unless explicitly repeated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• You receive one JSON object containing:
  - page-level extractions
  - merged_analysis
  - warnings
  - diagnoses listed per page
• This data is already validated and must NOT be re-evaluated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR OUTPUT OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transform the input into a SINGLE unified JSON document with:

• Clean patient identity
• Metadata summary
• Chronological reports timeline
• Diagnostic consolidation
• Recommendations aggregation
• Warnings normalization

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALLOWED TRANSFORMATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MAY:
✔ Group findings by DATE
✔ Group findings by MEDICAL DOMAIN
✔ Rename structural keys (not values)
✔ Collapse repeated tests into one timeline entry
✔ Move impressions into an "impression" field if explicitly labeled
✔ Remove empty / null-only objects
✔ Deduplicate repeated warnings
✔ Convert verbose test names into clinical parameter labels
✔ Merge related flow cytometry reports on the same date

You MUST NOT:
✘ Change numeric values or units
✘ Add medical conclusions
✘ Normalize abnormal ranges
✘ Create synthetic diagnoses
✘ Add interpretations not printed in the source
✘ Fix OCR typos unless they break JSON validity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN CLASSIFICATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use ONLY these categories:

• Radiology
• Biochemistry
• Clinical Pathology
• Hematology
• Flow Cytometry / Immunophenotyping

Assignment rules:
• X-ray / CT / MRI → Radiology
• LDH, LFT, Renal → Biochemistry
• Urine tests → Clinical Pathology
• CBC, Hemogram → Hematology
• cMPO, CD markers → Flow Cytometry / Immunophenotyping

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGNOSTIC RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• "confirmed_diagnosis" may be populated ONLY if
  the source explicitly states a diagnosis by name.

• If diagnosis is stated inside interpretation → extract verbatim.

• Diagnostic basis MUST list only extracted findings
  already present in the input JSON.

• Diagnostic status may be one of:
  - CONFIRMED
  - SUSPECTED
  - NOT STATED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDATIONS RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Aggregate ALL recommendations verbatim
• Remove duplicates
• Preserve original wording
• Do NOT rephrase

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WARNINGS & NOTES RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Include:
• OCR ambiguity notes
• Missing fields
• AI/system errors
• Digital signature absence
• Abnormal values without interpretation
• Date format inconsistencies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON in the following schema:

{
  "meta": {
    "processing_time_seconds": number,
    "completed_at": number,
    "source_type": "pdf",
    "total_pages": number,
    "aggregate_extraction_confidence": number
  },
  "patient": {
    "name": string | null,
    "gender": string | null,
    "age": string | null,
    "patient_id": string | null,
    "dob": string | null
  },
  "reports_timeline": [
    {
      "date": string,
      "category": string,
      "report_type": string,
      "lab_name": string | null,
      "referring_physician": string | null,
      "findings": [
        {
          "parameter": string,
          "value": string | number,
          "unit": string | null,
          "reference_range": string | null,
          "status": string | null,
          "interpretation": string | null
        }
      ],
      "impression": string | null
    }
  ],
  "diagnostic_summary": {
    "confirmed_diagnosis": string | null,
    "diagnostic_basis": [string],
    "diagnostic_status": "CONFIRMED | SUSPECTED | NOT STATED"
  },
  "recommendations": [string],
  "warnings_and_notes": [string]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If a field cannot be filled with HIGH CERTAINTY from the input JSON,
it MUST be omitted or set to null.

This output MUST be CLINICALLY SAFE, AUDITABLE, and HOSPITAL-GRADE
'''


# =============================================================================
# DATA STRUCTURES
# =============================================================================

@dataclass
class CaseSummary:
    patient_name: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    primary_diagnosis: Optional[str] = None
    suspected_category: str = "Unknown"
    case_complexity: str = "Moderate"


@dataclass
class RadiologySummary:
    modality: Optional[str] = None
    anatomical_region: Optional[str] = None
    key_findings: List[str] = None
    impression: Optional[str] = None
    limitations: Optional[str] = None

    def __post_init__(self):
        if self.key_findings is None:
            self.key_findings = []


@dataclass
class PathologySummary:
    specimen_type: Optional[str] = None
    hematologic_findings: List[str] = None
    immunophenotype: List[str] = None
    pathologist_impression: Optional[str] = None

    def __post_init__(self):
        if self.hematologic_findings is None:
            self.hematologic_findings = []
        if self.immunophenotype is None:
            self.immunophenotype = []


@dataclass
class CriticalAlert:
    parameter: str
    value: str
    trend: str
    clinical_significance: str


@dataclass
class IntegratedAnalysis:
    concordance: str = "Moderate"
    key_insights: List[str] = None
    data_gaps: List[str] = None

    def __post_init__(self):
        if self.key_insights is None:
            self.key_insights = []
        if self.data_gaps is None:
            self.data_gaps = []


@dataclass
class TumorBoardConsensus:
    summary: Optional[str] = None
    suggested_next_steps: List[str] = None
    confidence_level: str = "Moderate"

    def __post_init__(self):
        if self.suggested_next_steps is None:
            self.suggested_next_steps = []


@dataclass
class TumorBoardAIView:
    case_summary: CaseSummary
    radiology_summary: RadiologySummary
    pathology_summary: PathologySummary
    critical_alerts: List[CriticalAlert]
    integrated_analysis: IntegratedAnalysis
    tumor_board_consensus: TumorBoardConsensus
    warnings: List[str]
    confidence: float
    generated_at: str


# =============================================================================
# AI GENERATION FUNCTIONS
# =============================================================================

def gather_patient_report_data(patient_id: str) -> Dict[str, Any]:
    """
    Gather all AI analysis data for a patient from their reports.
    This compiles the input JSON for the tumor board AI.
    """
    # This will be populated from the AIReport data
    return {}


async def get_patient_ai_data(patient_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the latest AI analysis data for a patient.
    Returns the raw JSON data from their most recent completed AI report.
    The data is stored in keyFindings as a full JSON object containing:
    - processing_time_seconds
    - results[] (array of report analyses with pages, merged_analysis, etc.)
    - patient_name
    - report_count
    - completed_at
    """
    try:
        # Get latest completed AI report for patient
        ai_report = await db.aireport.find_first(
            where={"patientId": patient_id, "status": "completed"},
            order={"generatedAt": "desc"}
        )
        
        if not ai_report:
            print(f"No completed AI report found for patient {patient_id}")
            return None
        
        # Parse the full analysis data from keyFindings
        # This contains the complete analysis output from the OCR+LLM pipeline
        analysis_data = None
        if ai_report.keyFindings:
            try:
                analysis_data = json.loads(ai_report.keyFindings)
            except json.JSONDecodeError as e:
                print(f"Failed to parse keyFindings JSON: {e}")
                return None
        
        if not analysis_data:
            print(f"No analysis data in keyFindings for patient {patient_id}")
            return None
        
        # Get patient info
        patient = await db.patient.find_unique(where={"id": patient_id})
        
        # Build comprehensive data for tumor board
        data = {
            "patient_info": {
                "name": patient.name if patient else None,
                "age": str(patient.age) if patient and patient.age else None,
                "gender": patient.gender if patient else None,
                "cancer_type": patient.cancerType if patient else None
            },
            "processing_time_seconds": analysis_data.get("processing_time_seconds"),
            "report_count": analysis_data.get("report_count", 0),
            "results": []
        }
        
        # Extract findings from all report results
        all_findings = []
        all_diagnoses = []
        all_recommendations = []
        all_warnings = []
        
        for result in analysis_data.get("results", []):
            if result.get("status") == "success":
                # Get merged analysis (aggregated from all pages)
                merged = result.get("merged_analysis", {})
                
                # Collect patient identity if available
                patient_identity = merged.get("patient_identity", {})
                if patient_identity.get("name") and not data["patient_info"]["name"]:
                    data["patient_info"]["name"] = patient_identity.get("name")
                if patient_identity.get("age") and not data["patient_info"]["age"]:
                    data["patient_info"]["age"] = patient_identity.get("age")
                if patient_identity.get("gender") and not data["patient_info"]["gender"]:
                    data["patient_info"]["gender"] = patient_identity.get("gender")
                
                # Collect all findings
                for finding in merged.get("all_findings", []):
                    all_findings.append(finding)
                
                # Collect diagnoses
                for diagnosis in merged.get("diagnoses", []):
                    if diagnosis and diagnosis not in all_diagnoses:
                        all_diagnoses.append(diagnosis)
                
                # Collect recommendations
                for rec in merged.get("recommendations", []):
                    if rec and rec not in all_recommendations:
                        all_recommendations.append(rec)
                
                # Collect warnings
                for warning in result.get("warnings", []):
                    if warning and warning not in all_warnings:
                        all_warnings.append(warning)
                
                # Add to results with page-level detail
                data["results"].append({
                    "file_name": result.get("file_name"),
                    "total_pages": result.get("total_pages"),
                    "pages": result.get("pages", []),
                    "merged_analysis": merged,
                    "report_metadata": merged.get("report_metadata", {})
                })
        
        # Add aggregated data
        data["all_findings"] = all_findings
        data["diagnoses"] = all_diagnoses
        data["recommendations"] = all_recommendations
        data["warnings"] = all_warnings
        
        # Debug print to verify data
        print(f"Retrieved tumor board data for patient {patient_id}:")
        print(f"  - Findings: {len(all_findings)}")
        print(f"  - Diagnoses: {len(all_diagnoses)}")
        print(f"  - Results: {len(data['results'])}")
        
        return data
        
    except Exception as e:
        print(f"Error fetching patient AI data: {e}")
        import traceback
        traceback.print_exc()
        return None


def generate_tumor_board_with_llm(input_json: Dict[str, Any]) -> TumorBoardAIView:
    """
    Generate tumor board analysis using LLM.
    Takes structured input JSON and produces comprehensive tumor board view.
    """
    # Simplify the input to essential data for the LLM
    simplified_input = {
        "patient_info": input_json.get("patient_info", {}),
        "diagnoses": input_json.get("diagnoses", []),
        "recommendations": input_json.get("recommendations", []),
        "warnings": input_json.get("warnings", []),
        "findings": []
    }
    
    # Extract key findings (limit to most important ones to avoid token limits)
    all_findings = input_json.get("all_findings", [])
    critical_findings = [f for f in all_findings if f.get("status") == "CRITICAL"]
    abnormal_findings = [f for f in all_findings if f.get("status") == "ABNORMAL"]
    other_findings = [f for f in all_findings if f.get("status") not in ["CRITICAL", "ABNORMAL"]]
    
    # Prioritize critical and abnormal findings
    simplified_input["findings"] = critical_findings + abnormal_findings[:20] + other_findings[:10]
    
    print(f"[Tumor Board AI] Sending to LLM:")
    print(f"  - Patient: {simplified_input['patient_info']}")
    print(f"  - Diagnoses: {simplified_input['diagnoses']}")
    print(f"  - Findings count: {len(simplified_input['findings'])}")
    print(f"  - Critical: {len(critical_findings)}, Abnormal: {len(abnormal_findings)}")
    
    prompt = TUMOR_BOARD_PROMPT + json.dumps(simplified_input, indent=2)
    
    try:
        response = groq_chat(
            model=MODEL_NAME,
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.2,
            max_tokens=4096,
            response_format={"type": "json_object"}
        )
        
        llm_response = response['message']['content']
        print(f"[Tumor Board AI] LLM Response length: {len(llm_response)}")
        print(f"[Tumor Board AI] LLM Response preview: {llm_response[:500]}...")
        
        # Parse LLM response
        try:
            data = json.loads(llm_response)
        except json.JSONDecodeError as je:
            print(f"[Tumor Board AI] JSON parse error: {je}")
            # Try to extract JSON from response
            import re
            match = re.search(r'\{.*\}', llm_response, re.DOTALL)
            if match:
                data = json.loads(match.group())
            else:
                raise ValueError("Failed to parse LLM response as JSON")
        
        print(f"[Tumor Board AI] Parsed data keys: {list(data.keys())}")
        
        # If LLM returned empty/minimal data, build from source data directly
        patient_info = input_json.get("patient_info", {})
        diagnoses = input_json.get("diagnoses", [])
        
        # Build structured response - fallback to source data if LLM didn't populate
        case_summary_data = data.get("case_summary", {})
        case_summary = CaseSummary(
            patient_name=case_summary_data.get("patient_name") or patient_info.get("name"),
            age=case_summary_data.get("age") or patient_info.get("age"),
            gender=case_summary_data.get("gender") or patient_info.get("gender"),
            primary_diagnosis=case_summary_data.get("primary_diagnosis") or (diagnoses[0] if diagnoses else patient_info.get("cancer_type")),
            suspected_category=case_summary_data.get("suspected_category") or ("Hematologic" if any("leukemia" in str(d).lower() or "lymphoma" in str(d).lower() or "myeloma" in str(d).lower() for d in diagnoses) else "Unknown"),
            case_complexity=case_summary_data.get("case_complexity") or ("High" if len(critical_findings) > 3 else "Moderate" if len(critical_findings) > 0 else "Low")
        )
        
        radiology_data = data.get("radiology_summary", {})
        radiology_summary = RadiologySummary(
            modality=radiology_data.get("modality"),
            anatomical_region=radiology_data.get("anatomical_region"),
            key_findings=radiology_data.get("key_findings", []),
            impression=radiology_data.get("impression"),
            limitations=radiology_data.get("limitations") or ("No imaging data in source reports" if not radiology_data.get("key_findings") else None)
        )
        
        pathology_data = data.get("pathology_summary", {})
        # Build pathology from source if LLM didn't provide
        hematologic_findings_from_source = []
        for f in all_findings:
            test_name = (f.get("test_name") or "").lower()
            if any(term in test_name for term in ["wbc", "rbc", "hemoglobin", "hematocrit", "platelet", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil", "blast"]):
                status = f.get("status", "")
                value = f.get("value", "")
                unit = f.get("unit", "")
                hematologic_findings_from_source.append(f"{f.get('test_name')}: {value} {unit} ({status})")
        
        pathology_summary = PathologySummary(
            specimen_type=pathology_data.get("specimen_type"),
            hematologic_findings=pathology_data.get("hematologic_findings") or hematologic_findings_from_source[:10],
            immunophenotype=pathology_data.get("immunophenotype", []),
            pathologist_impression=pathology_data.get("pathologist_impression") or (diagnoses[0] if diagnoses else None)
        )
        
        # Build critical alerts from source data
        critical_alerts = []
        llm_alerts = data.get("critical_alerts", [])
        if llm_alerts:
            for alert in llm_alerts:
                critical_alerts.append(CriticalAlert(
                    parameter=alert.get("parameter", "Unknown"),
                    value=str(alert.get("value", "")),
                    trend=alert.get("trend", "New"),
                    clinical_significance=alert.get("clinical_significance", "")
                ))
        else:
            # Build from critical findings in source
            for f in critical_findings[:5]:
                critical_alerts.append(CriticalAlert(
                    parameter=f.get("test_name", "Unknown"),
                    value=f"{f.get('value', '')} {f.get('unit', '')}".strip(),
                    trend="New",
                    clinical_significance=f.get("interpretation") or f"Value outside reference range ({f.get('reference_range', 'N/A')})"
                ))
        
        integrated_data = data.get("integrated_analysis", {})
        # Build data gaps from source if needed
        data_gaps = integrated_data.get("data_gaps", [])
        if not data_gaps:
            if not radiology_data.get("key_findings"):
                data_gaps.append("No imaging/radiology data available")
            if len(all_findings) == 0:
                data_gaps.append("No lab findings extracted")
        
        integrated_analysis = IntegratedAnalysis(
            concordance=integrated_data.get("concordance") or ("High" if len(diagnoses) == 1 else "Moderate"),
            key_insights=integrated_data.get("key_insights", []) or [f"Primary diagnosis: {diagnoses[0]}" if diagnoses else "Diagnosis pending"],
            data_gaps=data_gaps
        )
        
        consensus_data = data.get("tumor_board_consensus", {})
        recommendations_from_source = input_json.get("recommendations", [])
        tumor_board_consensus = TumorBoardConsensus(
            summary=consensus_data.get("summary") or (f"Patient with {diagnoses[0]}. {len(critical_findings)} critical findings identified." if diagnoses else "Case under review"),
            suggested_next_steps=consensus_data.get("suggested_next_steps", []) or recommendations_from_source[:5],
            confidence_level=consensus_data.get("confidence_level") or ("High" if len(all_findings) > 10 else "Moderate")
        )
        
        warnings = data.get("warnings", []) or input_json.get("warnings", [])
        
        return TumorBoardAIView(
            case_summary=case_summary,
            radiology_summary=radiology_summary,
            pathology_summary=pathology_summary,
            critical_alerts=critical_alerts,
            integrated_analysis=integrated_analysis,
            tumor_board_consensus=tumor_board_consensus,
            warnings=warnings,
            confidence=0.75,
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"[Tumor Board AI] LLM Generation Error: {e}")
        import traceback
        traceback.print_exc()
        
        # Build fallback response from source data
        patient_info = input_json.get("patient_info", {})
        diagnoses = input_json.get("diagnoses", [])
        all_findings = input_json.get("all_findings", [])
        critical_findings = [f for f in all_findings if f.get("status") == "CRITICAL"]
        
        # Build hematologic findings for fallback
        hematologic_for_fallback = []
        for f in all_findings[:10]:
            hematologic_for_fallback.append(f"{f.get('test_name')}: {f.get('value')} {f.get('unit', '')} ({f.get('status', 'N/A')})")
        
        return TumorBoardAIView(
            case_summary=CaseSummary(
                patient_name=patient_info.get("name"),
                age=patient_info.get("age"),
                gender=patient_info.get("gender"),
                primary_diagnosis=diagnoses[0] if diagnoses else patient_info.get("cancer_type"),
                suspected_category="Hematologic" if ("blood" in str(diagnoses).lower() or "leukemia" in str(diagnoses).lower()) else "Unknown",
                case_complexity="Moderate"
            ),
            radiology_summary=RadiologySummary(
                limitations="No imaging data in source reports"
            ),
            pathology_summary=PathologySummary(
                hematologic_findings=hematologic_for_fallback,
                pathologist_impression=diagnoses[0] if diagnoses else None
            ),
            critical_alerts=[CriticalAlert(
                parameter=f.get("test_name", "Unknown"),
                value=f"{f.get('value', '')} {f.get('unit', '')}".strip(),
                trend="New",
                clinical_significance=f.get("interpretation") or "Critical value"
            ) for f in critical_findings[:5]],
            integrated_analysis=IntegratedAnalysis(
                key_insights=[f"Diagnosis: {d}" for d in diagnoses[:3]] if diagnoses else ["Analysis pending"],
                data_gaps=["AI generation failed - showing source data"]
            ),
            tumor_board_consensus=TumorBoardConsensus(
                summary=f"Patient data extracted with {len(all_findings)} findings and {len(diagnoses)} diagnoses.",
                suggested_next_steps=input_json.get("recommendations", [])[:5],
                confidence_level="Low"
            ),
            warnings=[f"AI generation failed: {str(e)}", "Showing extracted source data as fallback"],
            confidence=0.3,
            generated_at=datetime.now().isoformat()
        )


def dataclass_to_dict(obj) -> Dict[str, Any]:
    """Convert dataclass and nested dataclasses to dict."""
    if hasattr(obj, '__dataclass_fields__'):
        result = {}
        for field_name in obj.__dataclass_fields__:
            value = getattr(obj, field_name)
            result[field_name] = dataclass_to_dict(value)
        return result
    elif isinstance(obj, list):
        return [dataclass_to_dict(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: dataclass_to_dict(v) for k, v in obj.items()}
    else:
        return obj


# =============================================================================
# MULTI-AGENT TUMOR BOARD GENERATION
# =============================================================================

async def generate_multi_agent_analysis(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate tumor board analysis using multiple specialized agents.
    
    Pipeline:
    1. [OPTIONAL] Azure AI Agent Service orchestrates agent execution (non-clinical)
    2. Radiology Agent - analyzes imaging findings
    3. Pathology Agent - analyzes pathology/biopsy data
    4. Clinical Agent - analyzes clinical notes/labs
    5. Research Agent - provides evidence-based recommendations
    6. Local Coordinator - synthesizes all outputs (ALWAYS in CYNO)
    
    Azure AI Agent Service (when enabled):
    - Provides orchestration and governance ONLY
    - Does NOT perform medical reasoning
    - Does NOT write to database
    - Feature-flag controlled
    
    Returns a combined view with individual agent outputs.
    """
    # Check Azure orchestration status
    azure_enabled = is_azure_orchestration_enabled()
    orchestration_mode = "azure-ai-agent-service" if azure_enabled else "local"
    
    print(f"[Multi-Agent] Starting tumor board analysis (orchestration: {orchestration_mode})...")
    
    patient_info = patient_data.get("patient_info", {})
    all_findings = patient_data.get("all_findings", [])
    diagnoses = patient_data.get("diagnoses", [])
    recommendations = patient_data.get("recommendations", [])
    
    # Build text representations for each agent
    # Categorize findings by type
    imaging_findings = []
    pathology_findings = []
    clinical_findings = []
    
    for finding in all_findings:
        test_name = (finding.get("test_name") or "").lower()
        
        # Imaging-related
        if any(term in test_name for term in ["ct", "mri", "x-ray", "ultrasound", "pet", "scan", "imaging"]):
            imaging_findings.append(finding)
        # Pathology/Hematology
        elif any(term in test_name for term in ["biopsy", "histology", "specimen", "wbc", "rbc", "hemoglobin", "platelet", "blast", "cd"]):
            pathology_findings.append(finding)
        # Clinical/Labs
        else:
            clinical_findings.append(finding)
    
    # Build text for each agent
    def findings_to_text(findings: List[Dict]) -> str:
        lines = []
        for f in findings:
            line = f"{f.get('test_name', 'Unknown')}: {f.get('value', 'N/A')} {f.get('unit', '')}"
            if f.get('reference_range'):
                line += f" (Ref: {f['reference_range']})"
            if f.get('status'):
                line += f" [{f['status']}]"
            lines.append(line)
        return "\n".join(lines)
    
    radiology_text = findings_to_text(imaging_findings) if imaging_findings else "No imaging findings available."
    pathology_text = findings_to_text(pathology_findings) if pathology_findings else "No pathology findings available."
    clinical_text = findings_to_text(clinical_findings) if clinical_findings else "No clinical findings available."
    
    if diagnoses:
        pathology_text += f"\n\nDiagnoses: {', '.join(diagnoses)}"
        clinical_text += f"\n\nDiagnoses: {', '.join(diagnoses)}"
    
    if recommendations:
        clinical_text += f"\n\nRecommendations: {', '.join(recommendations[:5])}"
    
    print(f"[Multi-Agent] Prepared data - Imaging: {len(imaging_findings)}, Pathology: {len(pathology_findings)}, Clinical: {len(clinical_findings)}")
    
    # Prepare patient data for orchestration
    orchestration_data = {
        "patient_info": patient_info,
        "radiology_text": radiology_text,
        "pathology_text": pathology_text,
        "clinical_text": clinical_text,
        "diagnoses": diagnoses,
        "all_findings": all_findings
    }
    
    # Run agents using TumorBoardRunner (local execution - medical reasoning stays here)
    try:
        runner = TumorBoardRunner()  # Uses config defaults
        
        # =====================================================================
        # AZURE AI AGENT SERVICE ORCHESTRATION (OPTIONAL)
        # When enabled, Azure orchestrates agent execution order, parallel runs,
        # and failure handling. Medical reasoning STILL happens in CYNO agents.
        # =====================================================================
        
        azure_orchestration_result = None
        if azure_enabled:
            print("[Multi-Agent] ☁️ Azure AI Agent Service orchestration ENABLED")
            print("[Multi-Agent] Azure handles: execution order, parallel runs, failure tracking")
            print("[Multi-Agent] CYNO handles: ALL medical reasoning (unchanged)")
            
            # Define wrapper functions for Azure to call
            async def radiology_wrapper(data):
                agent = RadiologyAgent()
                return await agent.analyze(data.get("imaging_data", ""))
            
            async def pathology_wrapper(data):
                agent = PathologyAgent()
                return await agent.analyze(data.get("pathology_data", ""))
            
            async def clinical_wrapper(data):
                agent = ClinicalAgent()
                return await agent.analyze(data.get("clinical_data", ""))
            
            async def research_wrapper(data):
                agent = ResearchAgent()
                return await agent.analyze(json.dumps(data))
            
            # Attempt Azure orchestration
            azure_orchestration_result = await orchestrate_with_azure(
                orchestration_data,
                radiology_wrapper,
                pathology_wrapper,
                clinical_wrapper,
                research_wrapper
            )
            
            if azure_orchestration_result and azure_orchestration_result.status != "failed":
                print(f"[Multi-Agent] ☁️ Azure orchestration completed: {azure_orchestration_result.status}")
        
        # Run local Tumor Board Runner (Coordinator synthesis always happens locally)
        print("[Multi-Agent] Running local agent coordination and synthesis...")
        
        view = await runner.run(
            patient_id=patient_info.get("patient_id") or "unknown",
            patient_name=patient_info.get("name"),
            patient_age=patient_info.get("age"),
            patient_gender=patient_info.get("gender"),
            radiology_text=radiology_text,
            pathology_text=pathology_text,
            clinical_text=clinical_text
        )
        
        print(f"[Multi-Agent] Analysis complete - {len(view.agents_used)} agents used")
        
        # Convert to dict and clean placeholders/empty values
        raw_view = view.to_dict()
        cleaned_view = clean_multi_agent_view(raw_view)
        
        # Add Azure orchestration metadata
        cleaned_view["orchestration"] = {
            "mode": orchestration_mode,
            "azure_enabled": azure_enabled,
            "azure_status": azure_orchestration_result.status if azure_orchestration_result else None,
            "azure_agents_completed": azure_orchestration_result.agents_completed if azure_orchestration_result else [],
            "azure_agents_failed": azure_orchestration_result.agents_failed if azure_orchestration_result else [],
            "governance_note": "Azure AI Agent Service provides orchestration only. All medical reasoning performed by CYNO agents."
        }
        
        if azure_enabled:
            cleaned_view["azure_verified"] = True
            cleaned_view["orchestrated_by"] = "azure-ai-agent-service"
        
        print(f"[Multi-Agent] Data cleaned successfully (orchestration: {orchestration_mode})")
        return cleaned_view
        
    except Exception as e:
        print(f"[Multi-Agent] Error: {e}")
        import traceback
        traceback.print_exc()
        
        # Return fallback
        return {
            "patient_id": patient_info.get("patient_id", "unknown"),
            "patient_name": patient_info.get("name", "Unknown"),
            "executive_summary": f"Multi-agent analysis failed: {str(e)}",
            "findings": {
                "imaging": [],
                "pathology": [],
                "clinical": [],
                "biomarkers": []
            },
            "recommendations": {
                "treatment": [],
                "imaging": [],
                "other": []
            },
            "warnings": [f"Multi-agent analysis failed: {str(e)}"],
            "overall_confidence": "low",
            "agents_used": [],
            "processing_time_seconds": 0,
            "orchestration": {
                "mode": orchestration_mode,
                "azure_enabled": azure_enabled,
                "error": str(e)
            }
        }


# =============================================================================
# BACKGROUND PROCESSING
# =============================================================================

async def update_progress(case_id: str, percent: int, message: str):
    """Update case processing progress"""
    await db.tumorboardcase.update(
        where={"id": case_id},
        data={
            "progressPercent": percent,
            "progressMessage": message
        }
    )


async def check_cancellation(case_id: str) -> bool:
    """Check if case has been cancelled. Returns True if cancelled."""
    case = await db.tumorboardcase.find_unique(where={"id": case_id})
    return case and case.status == "cancelled"


async def process_tumor_board_background(case_id: str, patient_id: str, hospital_id: str):
    """
    Background task to generate tumor board AI analysis.
    Updates progress incrementally: 0% → 25% → 50% → 75% → 100%
    Checks for cancellation between steps.
    """
    try:
        # Start processing
        await db.tumorboardcase.update(
            where={"id": case_id},
            data={
                "status": "processing",
                "processingStartedAt": datetime.now(),
                "progressPercent": 0,
                "progressMessage": "Starting AI analysis...",
                "errorMessage": None
            }
        )
        
        if await check_cancellation(case_id):
            print(f"[Tumor Board AI] Task cancelled for case {case_id}")
            return

        # Step 1: Fetch patient data (25%)
        await update_progress(case_id, 10, "Fetching patient data...")
        patient_data = await get_patient_ai_data(patient_id)
        
        if not patient_data:
            raise ValueError("No AI analysis data found for this patient")
        
        await update_progress(case_id, 25, "Patient data retrieved. Analyzing findings...")
        
        if await check_cancellation(case_id):
            return

        # Step 2: Run LLM analysis (50%)
        await update_progress(case_id, 35, "Running AI analysis on medical data...")
        
        # Run the LLM in a thread pool to not block
        loop = asyncio.get_event_loop()
        tumor_board_view = await loop.run_in_executor(
            None,
            generate_tumor_board_with_llm,
            patient_data
        )
        
        if await check_cancellation(case_id):
            return

        await update_progress(case_id, 50, "AI analysis complete. Running specialized agents...")
        
        # Step 3: Run Multi-Agent Analysis (50% -> 80%)
        await update_progress(case_id, 55, "Running Radiology Agent...")
        
        multi_agent_view = None
        try:
            # Run multi-agent analysis
            multi_agent_view = await generate_multi_agent_analysis(patient_data)
            await update_progress(case_id, 70, "Running Pathology & Clinical Agents...")
            
            if await check_cancellation(case_id):
                return
                
            await update_progress(case_id, 80, "Synthesizing agent outputs...")
            
        except Exception as agent_error:
            print(f"[Tumor Board AI] Multi-agent analysis failed: {agent_error}")
            # Continue with just the LLM analysis if agents fail
            multi_agent_view = None
        
        # Step 4: Process and format results (85%)
        await update_progress(case_id, 85, "Formatting tumor board report...")
        ai_json = dataclass_to_dict(tumor_board_view)
        
        # Include multi-agent data if available
        if multi_agent_view:
            ai_json["multi_agent_view"] = multi_agent_view
        
        ai_json_str = json.dumps(ai_json)
        
        await update_progress(case_id, 90, "Saving results to database...")
        
        if await check_cancellation(case_id):
            return

        # Step 5: Save to database (100%)
        # Build summary from multi-agent if available, else use LLM summary
        summary = tumor_board_view.tumor_board_consensus.summary
        if multi_agent_view and multi_agent_view.get("executive_summary"):
            summary = multi_agent_view.get("executive_summary")
        
        await db.tumorboardcase.update(
            where={"id": case_id},
            data={
                "aiSummary": summary,
                "aiTumorBoardJson": ai_json_str,
                "status": "completed",
                "progressPercent": 100,
                "progressMessage": "Analysis complete",
                "processingCompletedAt": datetime.now()
            }
        )
        
        # Get patient name for logging
        patient = await db.patient.find_unique(where={"id": patient_id})
        
        # Log activity
        await db.activitylog.create(
            data={
                "hospitalId": hospital_id,
                "action": "tumor_board_ai_complete",
                "entityType": "tumor_board",
                "entityId": case_id,
                "description": f"Completed AI tumor board analysis for patient: {patient.name if patient else 'Unknown'}",
                "metadata": json.dumps({"confidence": tumor_board_view.confidence}),
                "performedBy": "CYNO AI"
            }
        )
        
        print(f"[Tumor Board AI] Background processing completed for case {case_id}")
        
    except Exception as e:
        print(f"[Tumor Board AI] Background processing failed for case {case_id}: {e}")
        import traceback
        traceback.print_exc()
        
        # Mark as failed
        await db.tumorboardcase.update(
            where={"id": case_id},
            data={
                "status": "failed",
                "progressPercent": 0,
                "progressMessage": None,
                "errorMessage": str(e)
            }
        )


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/{case_id}/generate")
async def generate_tumor_board_ai(
    case_id: str,
    hospitalId: str = Query(...),
    background_tasks: BackgroundTasks = None
) -> Dict[str, Any]:
    """
    Generate AI-powered tumor board analysis for a case.
    Runs in background and updates progress incrementally.
    Poll /status endpoint to track progress.
    """
    # Get tumor board case
    case = await db.tumorboardcase.find_unique(
        where={"id": case_id},
        include={"patient": True}
    )
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if already processing
    if case.status == "processing":
        return {
            "status": "already_processing",
            "case_id": case_id,
            "progressPercent": case.progressPercent,
            "progressMessage": case.progressMessage,
            "message": "Case is already being processed. Check /status for progress."
        }
    
    # Validate state - allow from draft, queued, failed, completed, or cancelled (regenerate)
    valid_states = ["draft", "queued", "failed", "completed", "cancelled"]
    if case.status not in valid_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot generate from '{case.status}' state"
        )
    
    # Check patient has AI data first (quick check before background)
    patient_data = await get_patient_ai_data(case.patientId)
    if not patient_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No AI analysis data found for this patient. Please run AI analysis first."
        )
    
    # Update to queued immediately
    await db.tumorboardcase.update(
        where={"id": case_id},
        data={
            "status": "queued",
            "progressPercent": 0,
            "progressMessage": "Queued for processing...",
            "errorMessage": None
        }
    )
    
    # Start background processing
    if background_tasks:
        background_tasks.add_task(
            process_tumor_board_background,
            case_id,
            case.patientId,
            hospitalId
        )
    else:
        # If no background_tasks (shouldn't happen), run inline
        asyncio.create_task(
            process_tumor_board_background(case_id, case.patientId, hospitalId)
        )
    
    # Log activity
    await db.activitylog.create(
        data={
            "hospitalId": hospitalId,
            "action": "tumor_board_ai_start",
            "entityType": "tumor_board",
            "entityId": case_id,
            "description": f"Started AI tumor board analysis for patient: {case.patient.name if case.patient else 'Unknown'}",
            "performedBy": "Hospital Staff"
        }
    )
    
    return {
        "status": "queued",
        "case_id": case_id,
        "message": "AI analysis started. This may take 2-5 minutes. Poll /status for progress.",
        "progressPercent": 0,
        "progressMessage": "Queued for processing..."
    }


@router.get("/{case_id}/ai-view")
async def get_tumor_board_ai_view(
    case_id: str,
    hospitalId: str = Query(...)
) -> Dict[str, Any]:
    """
    Get the AI-generated tumor board view for a case.
    Returns cached view if available, otherwise indicates regeneration needed.
    """
    case = await db.tumorboardcase.find_unique(
        where={"id": case_id},
        include={"patient": True}
    )
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Return stored JSON if available (prevent regeneration)
    if case.aiTumorBoardJson:
        try:
            stored_view = json.loads(case.aiTumorBoardJson)
            return {
                "status": "success",
                "case_id": case_id,
                "patient": {
                    "id": case.patient.id if case.patient else None,
                    "name": case.patient.name if case.patient else None,
                    "patientId": case.patient.patientId if case.patient else None,
                    "cancerType": case.patient.cancerType if case.patient else None
                },
                "tumor_board_view": stored_view
            }
        except json.JSONDecodeError:
            print(f"Error decoding stored AI JSON for case {case_id}, regenerating...")

    # For now, we'll regenerate on demand
    # In production, this would fetch from stored JSON
    patient_data = await get_patient_ai_data(case.patientId)
    
    if not patient_data:
        return {
            "status": "no_data",
            "case_id": case_id,
            "message": "No AI analysis data available for this patient"
        }
    
    # Generate fresh tumor board view
    tumor_board_view = generate_tumor_board_with_llm(patient_data)
    ai_json = dataclass_to_dict(tumor_board_view)
    
    return {
        "status": "success",
        "case_id": case_id,
        "patient": {
            "id": case.patient.id if case.patient else None,
            "name": case.patient.name if case.patient else None,
            "patientId": case.patient.patientId if case.patient else None,
            "cancerType": case.patient.cancerType if case.patient else None
        },
        "tumor_board_view": ai_json
    }


@router.post("/{case_id}/save-doctor-inputs")
async def save_doctor_inputs(
    case_id: str,
    hospitalId: str = Query(...),
    radiologist: Optional[str] = None,
    pathologist: Optional[str] = None,
    medical_oncologist: Optional[str] = None,
    surgical_oncologist: Optional[str] = None,
    radiation_oncologist: Optional[str] = None
) -> Dict[str, Any]:
    """
    Save doctor inputs for a tumor board case.
    Maps to existing notes fields.
    """
    case = await db.tumorboardcase.find_unique(where={"id": case_id})
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    update_data = {}
    if radiologist is not None:
        update_data["radiologyNotes"] = radiologist
    if pathologist is not None:
        update_data["pathologyNotes"] = pathologist
    if medical_oncologist is not None:
        update_data["oncologyNotes"] = medical_oncologist
    
    # Store surgical and radiation oncologist in recommendations as JSON
    if surgical_oncologist is not None or radiation_oncologist is not None:
        extra_inputs = {
            "surgical_oncologist": surgical_oncologist,
            "radiation_oncologist": radiation_oncologist
        }
        # Merge with existing recommendations if any
        existing_rec = case.recommendations
        if existing_rec:
            try:
                existing = json.loads(existing_rec)
                if isinstance(existing, dict):
                    existing.update(extra_inputs)
                    update_data["recommendations"] = json.dumps(existing)
                else:
                    update_data["recommendations"] = json.dumps({"items": existing, **extra_inputs})
            except:
                update_data["recommendations"] = json.dumps(extra_inputs)
        else:
            update_data["recommendations"] = json.dumps(extra_inputs)
    
    if update_data:
        await db.tumorboardcase.update(
            where={"id": case_id},
            data=update_data
        )
    
    return {
        "status": "success",
        "message": "Doctor inputs saved successfully"
    }


@router.get("/{case_id}/agents-view")
async def get_multi_agent_view(
    case_id: str,
    hospitalId: str = Query(...)
) -> Dict[str, Any]:
    """
    Get the multi-agent tumor board analysis view.
    
    Returns findings and recommendations from each specialized agent:
    - Radiology Agent: imaging analysis
    - Pathology Agent: biopsy/histology analysis
    - Clinical Agent: patient history and labs
    - Research Agent: evidence-based treatment recommendations
    
    This provides more granular insights than the unified view.
    """
    case = await db.tumorboardcase.find_unique(
        where={"id": case_id},
        include={"patient": True}
    )
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get patient AI data
    patient_data = await get_patient_ai_data(case.patientId)
    
    if not patient_data:
        return {
            "status": "no_data",
            "case_id": case_id,
            "message": "No AI analysis data available for this patient"
        }
    
    # Run multi-agent analysis
    multi_agent_view = await generate_multi_agent_analysis(patient_data)
    
    return {
        "status": "success",
        "case_id": case_id,
        "patient": {
            "id": case.patient.id if case.patient else None,
            "name": case.patient.name if case.patient else None,
            "patientId": case.patient.patientId if case.patient else None,
            "cancerType": case.patient.cancerType if case.patient else None,
            "age": str(case.patient.age) if case.patient and case.patient.age else None,
            "gender": case.patient.gender if case.patient else None
        },
        "multi_agent_view": multi_agent_view,
        "agents_used": multi_agent_view.get("agents_used", []),
        "processing_time_seconds": multi_agent_view.get("processing_time_seconds", 0)
    }


@router.post("/{case_id}/generate-agents")
async def generate_multi_agent_analysis_endpoint(
    case_id: str,
    hospitalId: str = Query(...),
    background_tasks: BackgroundTasks = None
) -> Dict[str, Any]:
    """
    Trigger multi-agent tumor board analysis for a case.
    Uses specialized AI agents for each domain.
    """
    case = await db.tumorboardcase.find_unique(
        where={"id": case_id},
        include={"patient": True}
    )
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tumor board case not found"
        )
    
    if case.hospitalId != hospitalId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check patient has AI data
    patient_data = await get_patient_ai_data(case.patientId)
    if not patient_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No AI analysis data found for this patient. Please run AI analysis first."
        )
    
    # Run multi-agent analysis
    try:
        multi_agent_view = await generate_multi_agent_analysis(patient_data)
        
        # Store the result
        await db.tumorboardcase.update(
            where={"id": case_id},
            data={
                "aiTumorBoardJson": json.dumps(multi_agent_view),
                "aiSummary": multi_agent_view.get("executive_summary", ""),
                "status": "completed"
            }
        )
        
        return {
            "status": "success",
            "case_id": case_id,
            "message": "Multi-agent analysis completed",
            "agents_used": multi_agent_view.get("agents_used", []),
            "processing_time_seconds": multi_agent_view.get("processing_time_seconds", 0)
        }
        
    except Exception as e:
        return {
            "status": "error",
            "case_id": case_id,
            "error": str(e)
        }
