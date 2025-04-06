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

# Claude Dependencies
import asyncio
import json

load_dotenv()

# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
prompt = os.getenv("PROMPT")

# Claude prompts
structure_prompt = os.getenv("STRUCTURE_PROMPT")
equation_prompt = os.getenv("EQUATION_PROMPT")
validation_prompt = os.getenv("VALIDATION_PROMPT")

app = FastAPI()

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://localhost:3001",
                    "http://localhost:3002"
                ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],   
    allow_headers=["Content-Type", "Authorization"],
)

# Claude helper functions BELOW
# ------------------------------------------------

# ***ERROR FIXED BELOW***
# Identify block function
async def extract_structure(file_path):
    model = "gemini-2.5-pro-preview-03-25"
    path = pathlib.Path(file_path)
    response = client.models.generate_content(
        model = model,
        contents = [
            types.Part.from_bytes(
                data=path.read_bytes(),
                mime_type="application/pdf",
            ),
            structure_prompt
        ]
    )
    
    # Try to parse the JSON response, with fallback if it fails
    try:
        # Check if response text starts with a code block marker
        if response.text.strip().startswith("```json"):
            # Extract JSON from markdown code block
            json_text = response.text.split("```json", 1)[1].split("```", 1)[0].strip()
            print("Extracted JSON from code block")
        else:
            json_text = response.text
        
        parsed_data = json.loads(json_text)
        return parsed_data
    except json.JSONDecodeError:
        print(f"Failed to parse JSON from response: {response.text[:200]}...")
        # Return a default structure instead of crashing
        return {"blocks": [
            {"id": "block1", "type": "text", "page": 1, "region": "full", "summary": "Document content"}
        ]}

# Process equation block with Gemini instances and voting philosophy
async def process_equation_block(block_data, file_path):
    model = "gemini-2.5-pro-preview-03-25"
    path = pathlib.Path(file_path)

    # Create 3 parallel equation conversion tasks
    conversion_tasks = []
    for i in range(3):
        conversion_tasks.append(
            client.models.generate_content(
                model = model,
                contents = [
                    types.Part.from_bytes(
                        data=path.read_bytes(),
                        mime_type = "application/pdf",
                    ),
                    f"{equation_prompt}\n\nBlock info: {json.dumps(block_data)}"
                ]
            )
        )
    
    try:
        # Run conversions in parallel and get results
        equation_results = await asyncio.gather(*conversion_tasks)
        
        # Extract text from each response object BEFORE passing to weighted_vote
        text_results = []
        for result in equation_results:
            try:
                if hasattr(result, 'text'):
                    text_results.append(result.text)
                else:
                    print(f"Warning: Response object does not have 'text' attribute: {type(result)}")
                    text_results.append(str(result))
            except Exception as e:
                print(f"Error extracting text from response: {str(e)}")
                continue
        
        if not text_results:
            print("Warning: No valid text results extracted from responses")
            return "No valid equation conversion results"
            
        # Weighted Voting with properly extracted text strings
        return weighted_vote(text_results)
    except Exception as e:
        print(f"Error in process_equation_block: {str(e)}")
        return f"Error processing equation: {str(e)}"

# Weighted vote feature
def weighted_vote(results):
    try:
        # Defensive check to ensure we have results to process
        if not results:
            print("Warning: No results provided to weighted_vote")
            return ""
            
        # Count occurrences of each result
        result_counts = {}
        for result in results:
            # Ensure the key is always a string (hashable)
            hashable_key = str(result) if result is not None else "None"
            result_counts[hashable_key] = result_counts.get(hashable_key, 0) + 1

        if not result_counts:
            print("Warning: No valid results to count")
            return ""
            
        # Find the most common key
        most_common_key = max(result_counts.items(), key=lambda x: x[1])[0]
        
        # Return the original result that matches the most common key
        for result in results:
            if str(result) == most_common_key:
                return result
            
        # Fallback to the key itself if no matching original result found
        return most_common_key
    except Exception as e:
        print(f"[DEBUG] Error in weighted_vote: {str(e)}")
        # Fallback to first result if voting fails
        return results[0] if results else ""

# LaTeX Syntax Corrector
async def validate_latex(latex_content):
    model = "gemini-2.5-pro-preview-03-25"
    response = client.models.generate_content(
        model=model,
        contents=[validation_prompt, latex_content]
    )
    return response.text

# ------------------------------------------------

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
        
        # CLAUDE SECTION BELOW
        # --------------------------------------------------------

        # Get document structure
        structure = await extract_structure(file_path)
        print(f"Document structure extracted: {len(structure['blocks'])} blocks found")

        # Process each block appropriately
        processed_blocks = []
        for block in structure['blocks']:
            if block['type'] in ['equation', 'complex_equation', 'simple_equation']:
                # Use multi-model voting for equations
                latex = await process_equation_block(block, file_path)
            else:
                # Use single model for text blocks
                model = "gemini-2.5-pro-preview-03-25"
                path = pathlib.Path(file_path)
                response = client.models.generate_content(
                    model = model,
                    contents=[
                        types.Part.from_bytes(
                            data=path.read_bytes(),
                            mime_type = "application/pdf",
                        ),
                        f"{prompt}\n\nBlock info: {json.dumps(block)}"
                    ]
                )
                latex = response.text
            
            processed_blocks.append({
                'id': block['id'],
                'type': block['type'],
                'content': latex
            })

        # Assemble document
        complete_latex = "\n\n".join([block['content'] for block in processed_blocks])

        # Final validation
        validated_latex = await validate_latex(complete_latex)

        print("LaTeX conversion complete")
        return JSONResponse(content={"latex": validated_latex})
        # --------------------------------------------------------
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
                timeout=60
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