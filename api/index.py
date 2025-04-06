from fastapi.responses import JSONResponse, StreamingResponse
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
from google import genai
from google.genai import types
from io import BytesIO
import os
import pathlib
import subprocess
import tempfile

load_dotenv()

# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
prompt = os.getenv("PROMPT")

app = FastAPI()

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000, http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],   
    allow_headers=["Content-Type", "Authorization"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        if not file:
            print("No upload file sent")
            return {"message": "No upload file sent"}
        else:
            print("Upload file received: ", file.filename)
            
        # Create the uploads directory if it doesn't exist
        os.makedirs("./api/uploads", exist_ok=True)
        
        # Save the uploaded file
        file_path = f"./api/uploads/{file.filename}"
        
        print("File path: ", file_path)
        
        contents = await file.read()
        
        print("File contents successfully read")
                
        with open(file_path, "wb") as f:
            f.write(contents)
            
        print("File saved successfully")
        
        path = pathlib.Path(file_path)
        
        model = "gemini-2.5-pro-preview-03-25"
        
        print("Calling Gemini with parameters: ", model, prompt)
        print("File path: ", path)

        # Call the model with the file
        response = client.models.generate_content(
            model=model,
            contents=[
                types.Part.from_bytes(
                    data=path.read_bytes(),
                    mime_type="application/pdf",
                ),
                prompt])
        
        print("Response: ", response.text)

        return JSONResponse(content={"latex": response.text})
    
    except Exception as e:
        # Log the specific error
        print(f"Error processing upload: {str(e)}")
        # Return a proper error response
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/export-pdf")
async def export_pdf(request: Request):
    try:
        body = await request.json()
        latex_code = body.get("latex")

        if not latex_code:
            return JSONResponse(status_code=400, content={"error":"No LaTeX content provided."})

        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, "document.tex")
            pdf_path = os.path.join(tmpdir, "document.pdf")

            with open(tex_path, "w") as f:
                f.write(latex_code)

            result = subprocess.run(
                ["pdflatex", "-output-directory", tmpdir, tex_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=10
            )

            print(f"Result: {result}")

            if not os.path.exists(pdf_path):
                return JSONResponse(
                    status_code=500,
                    content={"error": "PDF generation failed.", "log": result.stderr.decode()}
                )
            
            # load pdf file into memory before leaving 'with' block
            with open(pdf_path, "rb") as pdf_file:
                pdf_bytes = BytesIO(pdf_file.read())
        
        # stream pdf file to client after tempdir is gone
        return StreamingResponse(
            pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=converted.pdf"}
        )
    
    except Exception as e:
        print(f"PDF generation error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})