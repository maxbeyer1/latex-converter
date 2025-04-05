from fastapi.responses import JSONResponse
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
import google.generativeai as genai
import os

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Save uploaded file
    file_path = f"./uploads/{file.filename}"
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Read image bytes
    with open(file_path, "rb") as img_file:
        image_bytes = img_file.read()

    model = genai.GenerativeModel("gemini-pro-vision")

    prompt = "Extract the math content in LaTeX format."

    response = model.generate_content([prompt, image_bytes])

    return JSONResponse(content={"latex": response.text})
