"""
Demo route to quickly test OCR and LLM functionality
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
import time
from groq_client import groq_chat, list_models

router = APIRouter(prefix="/api/demo", tags=["Demo"])

MODEL_NAME = "llama-3.1-8b-instant"


@router.get("/ping")
async def ping():
    """Basic health check"""
    return {"status": "ok", "message": "Demo API is running"}


@router.get("/test-groq")
async def test_groq():
    """Test if Groq LLM is responding"""
    try:
        start = time.time()
        response = groq_chat(
            model=MODEL_NAME,
            messages=[{'role': 'user', 'content': 'Say "Hello" in one word only.'}],
            temperature=0.1,
            max_tokens=10
        )
        elapsed = round(time.time() - start, 2)
        return {
            "status": "ok",
            "model": MODEL_NAME,
            "response": response['message']['content'],
            "time_seconds": elapsed
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "hint": "Make sure GROQ_API_KEY is set in your .env file"
        }


@router.get("/test-ocr")
async def test_ocr():
    """Test if PaddleOCR is working with a simple image"""
    try:
        from paddleocr import PaddleOCR
        import numpy as np
        
        start = time.time()
        
        # Create a simple test image with text
        img = Image.new('RGB', (200, 50), color='white')
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), "Test OCR 12sss3", fill='black')
        
        # Convert to numpy array
        img_np = np.array(img)
        
        # Run OCR
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        result = ocr.ocr(img_np, cls=True)
        
        elapsed = round(time.time() - start, 2)
        
        # Extract text
        text = ""
        if result and result[0]:
            text = " ".join([line[1][0] for line in result[0]])
        
        return {
            "status": "ok",
            "extracted_text": text,
            "time_seconds": elapsed
        }
    except Exception as e:
        return {
            "status": "error", 
            "error": str(e)
        }


@router.post("/test-full-pipeline")
async def test_full_pipeline(file: UploadFile = File(...)):
    """
    Test the full OCR + LLM pipeline with an uploaded file.
    Upload a small image or single-page PDF to test.
    """
    try:
        content = await file.read()
        results = {
            "file_name": file.filename,
            "file_size_kb": round(len(content) / 1024, 2),
            "steps": []
        }
        
        total_start = time.time()
        
        # Step 1: OCR
        step_start = time.time()
        from routers.ocr_llm import extract_structured_from_image, extract_structured_from_pdf
        
        file_lower = file.filename.lower()
        if file_lower.endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff')):
            doc_result = extract_structured_from_image(content)
        elif file_lower.endswith('.pdf'):
            doc_result = extract_structured_from_pdf(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        ocr_time = round(time.time() - step_start, 2)
        text_preview = doc_result.pages[0].text[:200] if doc_result.pages else "No text"
        
        results["steps"].append({
            "step": "OCR",
            "status": "ok",
            "time_seconds": ocr_time,
            "pages_found": len(doc_result.pages),
            "text_preview": text_preview
        })
        
        # Step 2: LLM Analysis (just first page)
        if doc_result.pages and doc_result.pages[0].text.strip():
            step_start = time.time()
            from routers.ocr_llm import analyze_page_with_llm
            
            analysis = analyze_page_with_llm(doc_result.pages[0])
            llm_time = round(time.time() - step_start, 2)
            
            results["steps"].append({
                "step": "LLM Analysis",
                "status": "ok",
                "time_seconds": llm_time,
                "findings_count": len(analysis.findings),
                "confidence": analysis.extraction_confidence,
                "warnings": analysis.warnings,
                "raw_response_preview": getattr(analysis, 'raw_text_preview', 'N/A')[:200]
            })
        else:
            results["steps"].append({
                "step": "LLM Analysis",
                "status": "skipped",
                "reason": "No text extracted from OCR"
            })
        
        results["total_time_seconds"] = round(time.time() - total_start, 2)
        results["status"] = "ok"
        
        return results
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }


@router.get("/check-model")
async def check_model():
    """Check if the required Groq model is available"""
    try:
        models_data = list_models()
        model_names = [m['name'] for m in models_data.get('models', [])]
        
        has_model = any(MODEL_NAME in name for name in model_names)
        
        return {
            "required_model": MODEL_NAME,
            "available_models": model_names,
            "model_ready": has_model,
            "hint": "Groq models are cloud-based - no pulling required"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "hint": "Make sure GROQ_API_KEY is set in your .env file"
        }
