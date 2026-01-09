"""
Azure Document Intelligence API health check route
Tests if Azure AI Document Intelligence is configured and working
"""
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import os
import time
import httpx

router = APIRouter(prefix="/api/azure", tags=["Azure AI"])

# Load Azure configuration from environment
AZURE_ENDPOINT = os.getenv("AZURE_DOC_INTELLIGENCE_ENDPOINT", "")
AZURE_KEY = os.getenv("AZURE_DOC_INTELLIGENCE_KEY", "")


class AzureHealthResponse(BaseModel):
    status: str
    message: str
    endpoint_configured: bool
    key_configured: bool
    api_reachable: Optional[bool] = None
    response_time_ms: Optional[float] = None
    error: Optional[str] = None


@router.get("/ping")
async def ping():
    """Basic health check for Azure router"""
    return {"status": "ok", "message": "Azure AI API router is running"}


@router.get("/check-config")
async def check_config():
    """Check if Azure Document Intelligence credentials are configured"""
    endpoint_ok = bool(AZURE_ENDPOINT and len(AZURE_ENDPOINT) > 10)
    key_ok = bool(AZURE_KEY and len(AZURE_KEY) > 10)
    
    return {
        "status": "ok" if (endpoint_ok and key_ok) else "warning",
        "endpoint_configured": endpoint_ok,
        "endpoint_preview": AZURE_ENDPOINT[:30] + "..." if endpoint_ok else "NOT SET",
        "key_configured": key_ok,
        "key_preview": AZURE_KEY[:8] + "..." if key_ok else "NOT SET",
        "message": "Azure Document Intelligence is configured" if (endpoint_ok and key_ok) else "Missing Azure credentials in .env"
    }


@router.get("/test-connection")
async def test_connection():
    """
    Test if Azure Document Intelligence API is reachable.
    Makes a lightweight request to verify connectivity.
    """
    if not AZURE_ENDPOINT or not AZURE_KEY:
        return AzureHealthResponse(
            status="error",
            message="Azure credentials not configured",
            endpoint_configured=bool(AZURE_ENDPOINT),
            key_configured=bool(AZURE_KEY),
            error="Set AZURE_DOC_INTELLIGENCE_ENDPOINT and AZURE_DOC_INTELLIGENCE_KEY in .env"
        )
    
    try:
        start = time.time()
        
        # Use the Document Intelligence API info endpoint
        # This is a lightweight call to verify the service is accessible
        url = f"{AZURE_ENDPOINT.rstrip('/')}/documentintelligence/info?api-version=2024-11-30"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                headers={
                    "Ocp-Apim-Subscription-Key": AZURE_KEY
                }
            )
        
        elapsed_ms = round((time.time() - start) * 1000, 2)
        
        if response.status_code == 200:
            return AzureHealthResponse(
                status="ok",
                message="Azure Document Intelligence API is working! ✅",
                endpoint_configured=True,
                key_configured=True,
                api_reachable=True,
                response_time_ms=elapsed_ms
            )
        elif response.status_code == 401:
            return AzureHealthResponse(
                status="error",
                message="Authentication failed - check your API key",
                endpoint_configured=True,
                key_configured=True,
                api_reachable=True,
                response_time_ms=elapsed_ms,
                error=f"HTTP 401: Invalid or expired API key"
            )
        elif response.status_code == 404:
            # Try alternative endpoint format for older API versions
            return AzureHealthResponse(
                status="warning",
                message="Endpoint reached but info endpoint not found. API may still work.",
                endpoint_configured=True,
                key_configured=True,
                api_reachable=True,
                response_time_ms=elapsed_ms,
                error=f"HTTP {response.status_code}: Info endpoint not available"
            )
        else:
            return AzureHealthResponse(
                status="error",
                message=f"Unexpected response from Azure API",
                endpoint_configured=True,
                key_configured=True,
                api_reachable=True,
                response_time_ms=elapsed_ms,
                error=f"HTTP {response.status_code}: {response.text[:200]}"
            )
            
    except httpx.TimeoutException:
        return AzureHealthResponse(
            status="error",
            message="Connection timed out",
            endpoint_configured=True,
            key_configured=True,
            api_reachable=False,
            error="Request timed out after 10 seconds"
        )
    except httpx.ConnectError as e:
        return AzureHealthResponse(
            status="error",
            message="Could not connect to Azure endpoint",
            endpoint_configured=True,
            key_configured=True,
            api_reachable=False,
            error=f"Connection error: {str(e)}"
        )
    except Exception as e:
        return AzureHealthResponse(
            status="error",
            message="Unexpected error testing Azure connection",
            endpoint_configured=True,
            key_configured=True,
            api_reachable=False,
            error=str(e)
        )


@router.post("/test-ocr")
async def test_azure_ocr(file: UploadFile = File(...)):
    """
    Test Azure Document Intelligence OCR with an uploaded file.
    Upload a small image or PDF to verify OCR extraction works.
    """
    if not AZURE_ENDPOINT or not AZURE_KEY:
        return {
            "status": "error",
            "error": "Azure credentials not configured in .env"
        }
    
    try:
        content = await file.read()
        start = time.time()
        
        # Determine content type
        filename_lower = file.filename.lower() if file.filename else ""
        if filename_lower.endswith('.pdf'):
            content_type = "application/pdf"
        elif filename_lower.endswith(('.png', '.jpg', '.jpeg')):
            content_type = "image/jpeg" if filename_lower.endswith(('.jpg', '.jpeg')) else "image/png"
        else:
            content_type = "application/octet-stream"
        
        # Call Azure Document Intelligence API - Read model for OCR
        url = f"{AZURE_ENDPOINT.rstrip('/')}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Submit document for analysis
            response = await client.post(
                url,
                headers={
                    "Ocp-Apim-Subscription-Key": AZURE_KEY,
                    "Content-Type": content_type
                },
                content=content
            )
            
            if response.status_code == 202:
                # Get the operation location to poll for results
                operation_location = response.headers.get("Operation-Location")
                
                if operation_location:
                    # Poll for results (max 30 seconds)
                    import asyncio
                    for _ in range(30):
                        await asyncio.sleep(1)
                        result_response = await client.get(
                            operation_location,
                            headers={"Ocp-Apim-Subscription-Key": AZURE_KEY}
                        )
                        result = result_response.json()
                        
                        if result.get("status") == "succeeded":
                            elapsed_ms = round((time.time() - start) * 1000, 2)
                            
                            # Extract text from result
                            analyze_result = result.get("analyzeResult", {})
                            content_text = analyze_result.get("content", "")
                            pages = analyze_result.get("pages", [])
                            
                            return {
                                "status": "ok",
                                "message": "Azure Document Intelligence OCR working! ✅",
                                "file_name": file.filename,
                                "file_size_kb": round(len(content) / 1024, 2),
                                "pages_processed": len(pages),
                                "text_preview": content_text[:500] if content_text else "No text extracted",
                                "text_length": len(content_text),
                                "response_time_ms": elapsed_ms
                            }
                        elif result.get("status") == "failed":
                            return {
                                "status": "error",
                                "error": result.get("error", {}).get("message", "Analysis failed")
                            }
                    
                    return {
                        "status": "error",
                        "error": "Analysis timed out after 30 seconds"
                    }
            
            return {
                "status": "error",
                "error": f"HTTP {response.status_code}: {response.text[:300]}"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }


@router.get("/health")
async def full_health_check():
    """
    Complete health check for Azure Document Intelligence.
    Returns comprehensive status of configuration and connectivity.
    """
    config_check = await check_config()
    connection_check = await test_connection()
    
    overall_status = "ok"
    if config_check["status"] != "ok":
        overall_status = "warning"
    if connection_check.status == "error":
        overall_status = "error"
    
    return {
        "overall_status": overall_status,
        "azure_label": "☁️ Microsoft Azure - Document Intelligence",
        "configuration": config_check,
        "connectivity": connection_check.dict(),
        "usage_note": "Azure AI Document Intelligence is used as a CONDITIONAL fallback when PaddleOCR confidence is low."
    }
