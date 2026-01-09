"""
Data cleaning utilities for tumor board agent outputs.
Fixes common issues like placeholder text, duplicate units, and empty values.
Integrates clinical validation for safety.
"""

import re
from typing import Any, Dict, List, Optional

from .validation import (
    validate_for_treatment_recommendations,
    detect_disease_category,
    filter_biomarkers_by_disease,
    sanitize_recommendations,
    check_critical_findings,
    is_diagnosis_confirmed
)
from .confidence_calculator import (
    calculate_evidence_based_confidence,
    override_llm_confidence
)


# Placeholder patterns to remove
PLACEHOLDER_PATTERNS = [
    r'^string$',           # Literal "string"
    r'^string \(',         # "string (..."
    r'^Unknown$',          # Just "Unknown"
    r'^None$',             # Literal "None"
    r'^null$',             # Literal "null"
    r'^N/A$',              # Just "N/A"
    r'^\s*$',              # Empty or whitespace
    r'^2-3 sentence',      # Prompt template leaked
]

# Compile for performance
PLACEHOLDER_REGEX = re.compile('|'.join(PLACEHOLDER_PATTERNS), re.IGNORECASE)

# Duplicate unit patterns
DUPLICATE_UNIT_PATTERNS = [
    (r'(\w+/\w+)\s+\1', r'\1'),          # "g/dL g/dL" -> "g/dL"
    (r'(\%)\s+\1', r'\1'),                # "% %" -> "%"
    (r'(lakh/cu\.mm)\s+lakh/cu\.mm', r'\1'),
    (r'(million/cu\.mm)\s+million/cu\.mm', r'\1'),
    (r'(pg)\s+pg', r'\1'),                # "pg pg" -> "pg"
    (r'(fL)\s+fL', r'\1'),                # "fL fL" -> "fL"
]

# Gender standardization
GENDER_MAP = {
    'male': 'Male',
    'm': 'Male',
    'man': 'Male',
    'female': 'Female',
    'f': 'Female',
    'woman': 'Female'
}


def is_placeholder(value: Any) -> bool:
    """Check if a value is a placeholder or empty."""
    if value is None:
        return True
    if not isinstance(value, str):
        return False
    return bool(PLACEHOLDER_REGEX.match(value.strip()))


def clean_value(value: str) -> str:
    """Clean a value string by removing duplicate units and trimming."""
    if not value or not isinstance(value, str):
        return value or ""
    
    cleaned = value.strip()
    
    # Fix duplicate units
    for pattern, replacement in DUPLICATE_UNIT_PATTERNS:
        cleaned = re.sub(pattern, replacement, cleaned)
    
    # Remove trailing "(None)"
    cleaned = re.sub(r'\s*\(None\)\s*$', '', cleaned)
    
    # Remove "None" at end
    cleaned = re.sub(r'\s+None$', '', cleaned)
    
    return cleaned.strip()


def standardize_gender(gender: str) -> str:
    """Standardize gender to consistent format."""
    if not gender:
        return ""
    return GENDER_MAP.get(gender.lower().strip(), gender.capitalize())


def clean_finding(finding: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Clean a finding dict. Returns None if the finding is invalid/placeholder.
    """
    if not finding:
        return None
    
    title = finding.get('title', '')
    value = finding.get('value', '')
    
    # Skip if both title and value are placeholders
    if is_placeholder(title) and is_placeholder(value):
        return None
    
    # Skip if title is empty
    if not title or is_placeholder(title):
        return None
    
    # Clean the value
    cleaned_value = clean_value(value) if value else ''
    
    # Skip if value ends up empty after cleaning (but allow info/lab findings)
    if not cleaned_value and finding.get('severity') not in ['info', 'low']:
        if finding.get('category') != 'lab':
            return None
    
    return {
        **finding,
        'title': clean_value(title),
        'value': cleaned_value,
        'interpretation': clean_value(finding.get('interpretation', '')) or None
    }


def clean_recommendation(rec: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Clean a recommendation dict. Returns None if invalid."""
    if not rec:
        return None
    
    text = rec.get('text', '')
    if is_placeholder(text) or not text.strip():
        return None
    
    return {
        **rec,
        'text': clean_value(text),
        'rationale': clean_value(rec.get('rationale', '')) or None
    }


def clean_clinical_trial(trial: Dict[str, Any], disease_category: str = None) -> Optional[Dict[str, Any]]:
    """Clean a clinical trial dict. Returns None if invalid or disease mismatch."""
    if not trial:
        return None
    
    name = trial.get('name', '')
    if is_placeholder(name) or not name.strip():
        return None
    
    # Check for disease mismatch if we know the category
    if disease_category and disease_category != "unknown":
        name_lower = name.lower()
        # Prevent breast cancer trials for hematologic patients and vice versa
        if disease_category == "hematologic" and any(term in name_lower for term in ["breast", "lung", "colon"]):
            return None
        if disease_category == "breast" and any(term in name_lower for term in ["leukemia", "lymphoma", "myeloma"]):
            return None
    
    return {
        'name': clean_value(name),
        'source': clean_value(trial.get('source', '')) or None,
        'eligibility': clean_value(trial.get('eligibility', '')) or None
    }


def clean_multi_agent_view(view: Dict[str, Any]) -> Dict[str, Any]:
    """
    Clean the entire multi-agent view with clinical validation.
    
    This is the main entry point that:
    1. Cleans placeholders and formatting
    2. Runs clinical validation
    3. Filters irrelevant biomarkers
    4. Sanitizes recommendations if diagnosis not confirmed
    5. Recalculates confidence based on evidence
    """
    if not view:
        return view
    
    cleaned = dict(view)
    
    # Standardize gender
    if cleaned.get('patient_gender'):
        cleaned['patient_gender'] = standardize_gender(cleaned['patient_gender'])
    
    # Clean findings first
    findings = cleaned.get('findings', {})
    for category in ['imaging', 'pathology', 'clinical', 'biomarkers']:
        if category in findings:
            cleaned_list = []
            for f in findings[category]:
                cleaned_f = clean_finding(f)
                if cleaned_f:
                    cleaned_list.append(cleaned_f)
            findings[category] = cleaned_list
    
    # Detect disease category
    disease_category = detect_disease_category(findings)
    cleaned['detected_disease_category'] = disease_category
    
    # Filter biomarkers by disease relevance
    if 'biomarkers' in findings:
        findings['biomarkers'] = filter_biomarkers_by_disease(
            findings['biomarkers'], 
            disease_category
        )
    
    # Run clinical validation
    validation = validate_for_treatment_recommendations(
        findings,
        cleaned.get('staging'),
        cleaned.get('overall_confidence', 'medium')
    )
    
    # Add validation status to output
    cleaned['diagnostic_status'] = validation.status.value
    cleaned['data_completeness_score'] = validation.data_completeness_score
    cleaned['missing_critical_data'] = validation.missing_critical_data
    
    # Upgrade complexity if critical findings
    if validation.complexity_override:
        cleaned['case_complexity'] = validation.complexity_override
    
    # Add validation warnings
    existing_warnings = cleaned.get('warnings', [])
    cleaned['warnings'] = list(set(existing_warnings + validation.warnings))
    
    # Sanitize recommendations if diagnosis not confirmed
    if 'recommendations' in cleaned:
        recs = cleaned['recommendations']
        
        # Clean treatment recommendations
        if 'treatment' in recs:
            cleaned_recs = []
            for r in recs['treatment']:
                cleaned_r = clean_recommendation(r)
                if cleaned_r:
                    cleaned_recs.append(cleaned_r)
            # Further sanitize based on validation
            recs['treatment'] = sanitize_recommendations(cleaned_recs, validation)
        
        # Clean other recommendation categories
        for category in ['imaging', 'other', 'diagnostic']:
            if category in recs:
                cleaned_list = []
                for r in recs[category]:
                    cleaned_r = clean_recommendation(r)
                    if cleaned_r:
                        cleaned_list.append(cleaned_r)
                recs[category] = cleaned_list
    
    # Clean clinical trials with disease matching
    if 'clinical_trials' in cleaned:
        cleaned_trials = []
        for trial in cleaned.get('clinical_trials', []):
            cleaned_t = clean_clinical_trial(trial, disease_category)
            if cleaned_t:
                cleaned_trials.append(cleaned_t)
        cleaned['clinical_trials'] = cleaned_trials
        
        # Remove trials entirely if diagnosis not confirmed
        if not validation.is_safe_for_treatment_recs:
            cleaned['clinical_trials'] = []
            if cleaned.get('clinical_trials'):
                cleaned['warnings'].append("⚠️ Clinical trials removed - diagnosis confirmation required for eligibility.")
    
    # Recalculate confidence based on evidence
    confidence_assessment = calculate_evidence_based_confidence(findings, cleaned.get('staging'))
    cleaned['overall_confidence'] = confidence_assessment.level.value
    cleaned['confidence_score'] = confidence_assessment.score
    cleaned['confidence_justification'] = confidence_assessment.justification
    
    # Clean or generate executive summary
    if is_placeholder(cleaned.get('executive_summary')):
        cleaned['executive_summary'] = generate_fallback_summary(cleaned, validation)
    
    return cleaned


def generate_fallback_summary(view: Dict[str, Any], validation=None) -> str:
    """Generate a safety-focused summary from available data."""
    parts = []
    
    patient_name = view.get('patient_name', 'Patient')
    patient_age = view.get('patient_age', '')
    patient_gender = view.get('patient_gender', '')
    
    # Patient intro
    demo_parts = []
    if patient_age:
        demo_parts.append(f"{patient_age} year old")
    if patient_gender:
        demo_parts.append(patient_gender.lower())
    
    if demo_parts:
        parts.append(f"{patient_name}, {' '.join(demo_parts)}.")
    else:
        parts.append(f"Patient: {patient_name}.")
    
    # Diagnosis status - critical for safety
    if validation and not validation.is_safe_for_treatment_recs:
        parts.append("Diagnosis is PENDING pathology confirmation.")
    
    # Count findings
    findings = view.get('findings', {})
    total_findings = sum(len(findings.get(k, [])) for k in ['imaging', 'pathology', 'clinical', 'biomarkers'])
    
    if total_findings > 0:
        parts.append(f"Analysis identified {total_findings} clinical findings.")
    
    # Missing data emphasis
    if validation and validation.missing_critical_data:
        missing = validation.missing_critical_data[:2]  # Top 2
        parts.append(f"Missing: {', '.join(missing)}.")
    
    # Add safety note
    if validation and not validation.is_safe_for_treatment_recs:
        parts.append("Treatment recommendations are preliminary only.")
    
    return " ".join(parts) or "Case analysis completed. Diagnostic workup recommended."

