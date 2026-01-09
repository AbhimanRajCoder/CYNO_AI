"""
Confidence Calculator - Evidence-Based Confidence Scoring

Calculates confidence based on available evidence rather than LLM self-assessment.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum


class ConfidenceLevel(Enum):
    """Confidence levels with clinical meaning."""
    VERY_LOW = "very_low"      # < 30% - Insufficient data
    LOW = "low"                 # 30-50% - Major gaps
    MODERATE = "moderate"       # 50-70% - Some gaps
    HIGH = "high"               # > 70% - Sufficient data


@dataclass
class ConfidenceAssessment:
    """Detailed confidence assessment."""
    level: ConfidenceLevel
    score: float
    factors: Dict[str, float]
    justification: str


def calculate_evidence_based_confidence(
    findings: Dict[str, Any],
    staging: Optional[Dict[str, Any]] = None,
    recommendations: Optional[List[Dict]] = None
) -> ConfidenceAssessment:
    """
    Calculate confidence based on objective evidence availability.
    
    This replaces LLM self-reported confidence with evidence-based scoring.
    """
    factors = {}
    
    # Factor 1: Diagnosis Quality (30%)
    diagnosis_score = _assess_diagnosis_quality(findings)
    factors["diagnosis"] = round(diagnosis_score * 0.30, 2)
    
    # Factor 2: Imaging Coverage (20%)
    imaging_score = _assess_imaging_coverage(findings)
    factors["imaging"] = round(imaging_score * 0.20, 2)
    
    # Factor 3: Staging Completeness (20%)
    staging_score = _assess_staging_completeness(findings, staging)
    factors["staging"] = round(staging_score * 0.20, 2)
    
    # Factor 4: Biomarker Relevance (15%)
    biomarker_score = _assess_biomarker_quality(findings)
    factors["biomarkers"] = round(biomarker_score * 0.15, 2)
    
    # Factor 5: Lab Completeness (15%)
    lab_score = _assess_lab_completeness(findings)
    factors["labs"] = round(lab_score * 0.15, 2)
    
    # Calculate total
    total_score = sum(factors.values())
    
    # Determine level
    if total_score < 0.30:
        level = ConfidenceLevel.VERY_LOW
    elif total_score < 0.50:
        level = ConfidenceLevel.LOW
    elif total_score < 0.70:
        level = ConfidenceLevel.MODERATE
    else:
        level = ConfidenceLevel.HIGH
    
    # Generate justification
    justification = _generate_justification(factors, level)
    
    return ConfidenceAssessment(
        level=level,
        score=round(total_score, 2),
        factors=factors,
        justification=justification
    )


def _assess_diagnosis_quality(findings: Dict[str, Any]) -> float:
    """Score diagnosis quality from 0-1."""
    pathology = findings.get("pathology", [])
    
    score = 0.0
    
    for finding in pathology:
        category = finding.get("category", "").lower()
        value = (finding.get("value") or "").lower().strip()
        
        if category == "diagnosis" and value:
            # Check for specific cancer types
            if any(term in value for term in ["carcinoma", "adenocarcinoma", "lymphoma", "leukemia", "sarcoma"]):
                score = 1.0
                break
            # Partial credit for descriptive findings
            elif any(term in value for term in ["malignant", "neoplasm", "tumor"]):
                score = max(score, 0.7)
            elif value not in ["unknown", "pending", "string", "n/a", ""]:
                score = max(score, 0.4)
    
    return score


def _assess_imaging_coverage(findings: Dict[str, Any]) -> float:
    """Score imaging coverage from 0-1."""
    imaging = findings.get("imaging", [])
    
    if not imaging:
        return 0.0
    
    # More findings = higher score
    count = len(imaging)
    if count >= 5:
        return 1.0
    elif count >= 3:
        return 0.8
    elif count >= 1:
        return 0.5
    
    return 0.0


def _assess_staging_completeness(
    findings: Dict[str, Any],
    staging: Optional[Dict[str, Any]]
) -> float:
    """Score staging completeness from 0-1."""
    score = 0.0
    
    if staging:
        if staging.get("tnm_staging"):
            score += 0.4
        if staging.get("clinical_stage"):
            score += 0.3
        if staging.get("pathological_stage"):
            score += 0.3
    
    # Check findings for staging info
    for category in ["pathology", "clinical"]:
        for finding in findings.get(category, []):
            title = (finding.get("title") or "").lower()
            if "stage" in title or "tnm" in title:
                value = finding.get("value", "")
                if value and value.lower() not in ["unknown", "pending", ""]:
                    score = min(1.0, score + 0.3)
    
    return min(1.0, score)


def _assess_biomarker_quality(findings: Dict[str, Any]) -> float:
    """Score biomarker quality from 0-1."""
    biomarkers = findings.get("biomarkers", [])
    
    if not biomarkers:
        return 0.0
    
    valid_count = 0
    for biomarker in biomarkers:
        value = (biomarker.get("value") or "").lower().strip()
        if value and value not in ["string", "unknown", "n/a", "null", "none", ""]:
            valid_count += 1
    
    if valid_count >= 4:
        return 1.0
    elif valid_count >= 2:
        return 0.7
    elif valid_count >= 1:
        return 0.4
    
    return 0.0


def _assess_lab_completeness(findings: Dict[str, Any]) -> float:
    """Score lab data completeness from 0-1."""
    clinical = findings.get("clinical", [])
    
    lab_findings = [f for f in clinical if f.get("category") == "lab"]
    
    if not lab_findings:
        return 0.0
    
    valid_count = 0
    for lab in lab_findings:
        value = (lab.get("value") or "").strip()
        if value and value.lower() not in ["none", "n/a", "null", ""]:
            valid_count += 1
    
    if valid_count >= 10:
        return 1.0
    elif valid_count >= 5:
        return 0.7
    elif valid_count >= 2:
        return 0.4
    
    return 0.2


def _generate_justification(factors: Dict[str, float], level: ConfidenceLevel) -> str:
    """Generate human-readable confidence justification."""
    
    # Find weakest factors
    sorted_factors = sorted(factors.items(), key=lambda x: x[1])
    weak = [f[0] for f in sorted_factors if f[1] < 0.1]
    
    if level == ConfidenceLevel.VERY_LOW:
        return f"Insufficient data for reliable conclusions. Missing: {', '.join(weak) if weak else 'multiple factors'}."
    elif level == ConfidenceLevel.LOW:
        return f"Major data gaps present. Requires additional workup before treatment decisions."
    elif level == ConfidenceLevel.MODERATE:
        return f"Some data gaps exist. Recommendations are preliminary pending complete workup."
    else:
        return "Sufficient evidence available for tumor board review."


def override_llm_confidence(
    llm_confidence: str,
    calculated: ConfidenceAssessment
) -> str:
    """
    Override LLM-reported confidence with evidence-based assessment.
    
    This prevents the LLM from being overconfident when data is missing.
    """
    # Always use calculated confidence
    return calculated.level.value
