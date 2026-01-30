from fastapi import FastAPI
from pydantic import BaseModel
from main_pipeline import analyze_crisis

app = FastAPI()

class InputData(BaseModel):
    text: str
    source: str
    location: str

#Define check_health route
@app.get('/')
def check_health():
    return {"success": "true",
            "status": "ok",
            "message": "ML service is running."}

#Define FastAPI app
@app.post('/analyze_crisis')
def analyze_crisis_endpoint(input_data: InputData):
    result = analyze_crisis(
        text=input_data.text,
        source=input_data.source,
        location=input_data.location
    )
    return result