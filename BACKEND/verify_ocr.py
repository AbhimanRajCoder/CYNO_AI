import io
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont
from main import app

client = TestClient(app)

def create_dummy_medical_image():
    # Create a white image
    img = Image.new('RGB', (800, 600), color='white')
    d = ImageDraw.Draw(img)
    
    # Add some text acting as a medical report
    text = """
    CYNO HEALTHCARE REPORT
    Date: 2024-10-25
    Patient: John Doe
    
    Findings:
    The patient shows signs of mild hypertension.
    Blood pressure: 140/90 mmHg.
    Heart rate: 80 bpm.
    
    Diagnosis:
    Stage 1 Hypertension.
    
    Recommendations:
    - Reduce salt intake.
    - Daily exercise for 30 mins.
    - Follow up in 2 weeks.
    
    Medications:
    - Lisinopril 10mg daily.
    """
    
    # Use default font
    d.text((10, 10), text, fill=(0, 0, 0))
    
    # Save to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr

def test_ocr_llm_endpoint():
    print("Generating dummy medical image...")
    image_bytes = create_dummy_medical_image()
    
    print("Sending request to /api/ai/analyze-medical-document...")
    response = client.post(
        "/api/ai/analyze-medical-document",
        files={"file": ("report.png", image_bytes, "image/png")}
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response JSON:")
        print(response.json())
    else:
        print("Error Response:")
        print(response.text)

if __name__ == "__main__":
    test_ocr_llm_endpoint()
