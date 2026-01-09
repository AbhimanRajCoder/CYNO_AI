"""
Clinical Validation Module - Safety Gating for Tumor Board AI

Implements evidence-based validation to ensure safe AI outputs.
Blocks treatment recommendations until sufficient diagnostic evidence exists.
"""

from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class DiagnosticStatus(Enum):
    """Status levels for tumor board case readiness."""
    DIAGNOSTIC_WORKUP_REQUIRED = "diagnostic_workup_required"
    PENDING_CONFIRMATION = "pending_confirmation"
    PRELIMINARY = "preliminary"
    READY_FOR_REVIEW = "ready_for_review"


@dataclass
class ValidationResult:
    """Result of clinical validation checks."""
    is_safe_for_treatment_recs: bool
    data_completeness_score: float
    status: DiagnosticStatus
    missing_critical_data: List[str]
    warnings: List[str]
    complexity_override: Optional[str] = None


# Disease category to relevant biomarker mapping
DISEASE_BIOMARKER_MAP = {
    "breast": ["ER", "PR", "HER2", "Ki-67", "BRCA1", "BRCA2"],
    "lung": ["EGFR", "ALK", "PD-L1", "ROS1", "KRAS", "MET", "BRAF"],
    "colorectal": ["KRAS", "NRAS", "BRAF", "MSI", "MMR"],
    "hematologic": ["BCR-ABL", "FLT3", "NPM1", "IDH1", "IDH2", "CD markers", "JAK2", "MPL", "CALR"],
    "prostate": ["PSA", "AR", "PTEN", "BRCA"],
    "ovarian": ["BRCA1", "BRCA2", "HRD", "CA-125"],
    "melanoma": ["BRAF", "NRAS", "KIT", "PD-L1"],
    "unknown": []  # No biomarkers filtered for unknown disease
}

# Critical lab thresholds for complexity escalation
CRITICAL_THRESHOLDS = {
    "hemoglobin": {"low": 7.0, "unit": "g/dL"},
    "platelet": {"low": 50000, "unit": "count"},
    "wbc": {"low": 1000, "high": 50000, "unit": "cells/cu.mm"},
    "neutrophil": {"low": 500, "unit": "count"},
    "creatinine": {"high": 3.0, "unit": "mg/dL"},
}


def is_diagnosis_confirmed(findings: Dict[str, Any]) -> bool:
    """
    Check if a definitive diagnosis exists (not just 'blood', 'unknown', 'pending').
    
    Returns True only if pathology confirms a specific cancer/disease type.
    """
    invalid_diagnoses = [
        "blood", "unknown", "pending", "suspected", "possible",
        "n/a", "none", "string", "null", ""
    ]
    
    # Check pathology findings for confirmed diagnosis
    pathology_findings = findings.get("pathology", [])
    for finding in pathology_findings:
        if finding.get("category") == "diagnosis":
            value = (finding.get("value") or "").lower().strip()
            title = (finding.get("title") or "").lower()
            
            # Check if it's a real diagnosis
            if value and value not in invalid_diagnoses:
                # Must have some specificity
                if any(term in value for term in ["carcinoma", "lymphoma", "leukemia", "sarcoma", "melanoma", "adenoma", "myeloma"]):
                    return True
    
    return False


def is_staging_available(findings: Dict[str, Any], staging: Dict[str, Any] = None) -> bool:
    """
    Check if cancer staging data is explicitly present.
    """
    if staging:
        if staging.get("clinical_stage") or staging.get("pathological_stage") or staging.get("tnm_staging"):
            return True
    
    # Check findings for staging info
    for category in ["pathology", "clinical"]:
        for finding in findings.get(category, []):
            title = (finding.get("title") or "").lower()
            if any(term in title for term in ["stage", "tnm", "t1", "t2", "t3", "t4", "n0", "n1", "m0", "m1"]):
                value = finding.get("value", "")
                if value and value.lower() not in ["unknown", "pending", "n/a", ""]:
                    return True
    
    return False


def has_imaging_data(findings: Dict[str, Any]) -> bool:
    """
    Check if any imaging/radiology data is present.
    """
    imaging = findings.get("imaging", [])
    return len(imaging) > 0


def has_pathology_confirmation(findings: Dict[str, Any]) -> bool:
    """
    Check if pathology report data exists (not just placeholder).
    """
    pathology = findings.get("pathology", [])
    
    # Need at least one real pathology finding
    for finding in pathology:
        value = (finding.get("value") or "").lower().strip()
        if value and value not in ["string", "unknown", "n/a", "null", "none", ""]:
            return True
    
    return False


def detect_disease_category(findings: Dict[str, Any], diagnosis: str = None) -> str:
    """
    Infer disease category from findings to validate biomarker relevance.
    """
    diagnosis_lower = (diagnosis or "").lower()
    
    # Check for explicit disease category mentions
    if any(term in diagnosis_lower for term in ["breast", "mammary"]):
        return "breast"
    if any(term in diagnosis_lower for term in ["lung", "pulmonary", "bronchial"]):
        return "lung"
    if any(term in diagnosis_lower for term in ["colon", "rectal", "colorectal", "bowel"]):
        return "colorectal"
    if any(term in diagnosis_lower for term in ["blood", "leukemia", "lymphoma", "myeloma", "hematologic"]):
        return "hematologic"
    if any(term in diagnosis_lower for term in ["prostate"]):
        return "prostate"
    if any(term in diagnosis_lower for term in ["ovary", "ovarian"]):
        return "ovarian"
    if any(term in diagnosis_lower for term in ["melanoma", "skin"]):
        return "melanoma"
    
    # Check clinical findings for hematologic indicators
    clinical = findings.get("clinical", [])
    hematologic_indicators = ["wbc", "rbc", "hemoglobin", "platelet", "blast", "lymphocyte"]
    hematologic_count = sum(1 for f in clinical if any(ind in (f.get("title") or "").lower() for ind in hematologic_indicators))
    
    if hematologic_count >= 3:
        return "hematologic"
    
    return "unknown"


def calculate_data_completeness_score(
    findings: Dict[str, Any],
    staging: Dict[str, Any] = None
) -> Tuple[float, List[str]]:
    """
    Calculate evidence-based completeness score (0.0 - 1.0).
    
    Returns: (score, list of missing items)
    """
    weights = {
        "diagnosis_confirmed": 0.30,
        "imaging_available": 0.20,
        "staging_available": 0.20,
        "pathology_present": 0.15,
        "labs_present": 0.15
    }
    
    score = 0.0
    missing = []
    
    # Check each factor
    if is_diagnosis_confirmed(findings):
        score += weights["diagnosis_confirmed"]
    else:
        missing.append("Confirmed pathological diagnosis")
    
    if has_imaging_data(findings):
        score += weights["imaging_available"]
    else:
        missing.append("Imaging/radiology data")
    
    if is_staging_available(findings, staging):
        score += weights["staging_available"]
    else:
        missing.append("Cancer staging (TNM)")
    
    if has_pathology_confirmation(findings):
        score += weights["pathology_present"]
    else:
        missing.append("Pathology confirmation")
    
    # Check labs
    clinical = findings.get("clinical", [])
    lab_count = sum(1 for f in clinical if f.get("category") == "lab")
    if lab_count >= 3:
        score += weights["labs_present"]
    else:
        missing.append("Complete laboratory workup")
    
    return round(score, 2), missing


def determine_status(score: float) -> DiagnosticStatus:
    """Map completeness score to diagnostic status."""
    if score < 0.3:
        return DiagnosticStatus.DIAGNOSTIC_WORKUP_REQUIRED
    elif score < 0.5:
        return DiagnosticStatus.PENDING_CONFIRMATION
    elif score < 0.7:
        return DiagnosticStatus.PRELIMINARY
    else:
        return DiagnosticStatus.READY_FOR_REVIEW


def check_critical_findings(findings: Dict[str, Any]) -> Tuple[bool, Optional[str], List[str]]:
    """
    Check for critical lab values that require complexity escalation.
    
    Returns: (has_critical, complexity_override, warning_list)
    """
    warnings = []
    has_critical = False
    
    clinical = findings.get("clinical", [])
    
    for finding in clinical:
        title = (finding.get("title") or "").lower()
        value_str = finding.get("value", "")
        
        # Try to extract numeric value
        try:
            # Remove units and parse number
            import re
            numbers = re.findall(r'[\d.]+', str(value_str))
            if numbers:
                value = float(numbers[0])
            else:
                continue
        except:
            continue
        
        # Check hemoglobin
        if "hemoglobin" in title or "hb" in title or "hgb" in title:
            if value < CRITICAL_THRESHOLDS["hemoglobin"]["low"]:
                has_critical = True
                warnings.append(f"⚠️ CRITICAL: Severe anemia (Hgb {value} g/dL)")
        
        # Check platelets
        if "platelet" in title:
            if value < CRITICAL_THRESHOLDS["platelet"]["low"]:
                has_critical = True
                warnings.append(f"⚠️ CRITICAL: Severe thrombocytopenia (Plt {value})")
        
        # Check WBC
        if "wbc" in title or "leucocyte" in title or "leukocyte" in title:
            threshold = CRITICAL_THRESHOLDS["wbc"]
            if value < threshold["low"]:
                has_critical = True
                warnings.append(f"⚠️ CRITICAL: Severe leukopenia (WBC {value})")
            elif value > threshold["high"]:
                has_critical = True
                warnings.append(f"⚠️ CRITICAL: Leukocytosis (WBC {value})")
    
    complexity_override = "high" if has_critical else None
    return has_critical, complexity_override, warnings


def validate_for_treatment_recommendations(
    findings: Dict[str, Any],
    staging: Dict[str, Any] = None,
    current_confidence: str = "medium"
) -> ValidationResult:
    """
    Main validation function - determines if case is safe for treatment recommendations.
    
    Returns ValidationResult with all safety checks.
    """
    # Calculate base score
    score, missing = calculate_data_completeness_score(findings, staging)
    
    # Determine status
    status = determine_status(score)
    
    # Check critical findings
    has_critical, complexity_override, critical_warnings = check_critical_findings(findings)
    
    # Generate standard warnings
    warnings = list(critical_warnings)
    
    if not has_imaging_data(findings):
        warnings.append("⚠️ No imaging data available. Imaging required before tumor board conclusions.")
    
    if not is_diagnosis_confirmed(findings):
        warnings.append("⚠️ Diagnosis pending. Treatment recommendations are preliminary only.")
    
    if not has_pathology_confirmation(findings):
        warnings.append("⚠️ Pathology confirmation required before treatment initiation.")
    
    if not is_staging_available(findings, staging):
        warnings.append("⚠️ Staging data incomplete. Cannot determine treatment eligibility.")
    
    # Determine if safe for treatment recs
    is_safe = (
        score >= 0.5 and
        is_diagnosis_confirmed(findings) and
        has_pathology_confirmation(findings)
    )
    
    return ValidationResult(
        is_safe_for_treatment_recs=is_safe,
        data_completeness_score=score,
        status=status,
        missing_critical_data=missing,
        warnings=warnings,
        complexity_override=complexity_override
    )


def filter_biomarkers_by_disease(
    biomarkers: List[Dict[str, Any]],
    disease_category: str
) -> List[Dict[str, Any]]:
    """
    Remove biomarkers that are not relevant to the detected disease category.
    """
    if disease_category == "unknown":
        return biomarkers  # Can't filter without knowing disease
    
    relevant = DISEASE_BIOMARKER_MAP.get(disease_category, [])
    if not relevant:
        return biomarkers
    
    filtered = []
    for biomarker in biomarkers:
        name = (biomarker.get("title") or biomarker.get("name") or "").upper()
        # Check if this biomarker is relevant
        if any(rel.upper() in name for rel in relevant):
            filtered.append(biomarker)
        # Also keep generic markers
        elif any(generic in name for generic in ["LDH", "AFP", "CEA", "CA-125", "CA-19"]):
            filtered.append(biomarker)
    
    return filtered


def sanitize_recommendations(
    recommendations: List[Dict[str, Any]],
    validation_result: ValidationResult
) -> List[Dict[str, Any]]:
    """
    Remove or modify treatment recommendations based on validation.
    
    If diagnosis not confirmed, only allow diagnostic recommendations.
    """
    if validation_result.is_safe_for_treatment_recs:
        return recommendations
    
    # Filter to diagnostic recommendations only
    allowed_categories = ["diagnostic", "imaging", "biopsy", "referral", "workup", "consultation"]
    
    filtered = []
    for rec in recommendations:
        category = (rec.get("category") or "").lower()
        text = (rec.get("text") or "").lower()
        
        # Keep diagnostic recommendations
        if category in allowed_categories:
            filtered.append(rec)
            continue
        
        # Check text for diagnostic intent
        if any(term in text for term in ["confirm", "rule out", "evaluate", "assess", "test", "biopsy", "imaging", "refer"]):
            rec_copy = dict(rec)
            rec_copy["category"] = "diagnostic"
            filtered.append(rec_copy)
    
    return filtered
