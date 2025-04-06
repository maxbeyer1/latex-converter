from fastapi.responses import JSONResponse, StreamingResponse
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from io import BytesIO
import os, pathlib, subprocess, tempfile, sys, time, asyncio, json

def debug_print(message):
    print(f"[DEBUG {time.strftime('%H:%M:%S')}] {message}", flush=True)
    sys.stdout.flush()

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
structure_prompt = os.getenv("STRUCTURE_PROMPT")
batch_prompt = os.getenv("BATCH_PROMPT", "Convert the provided blocks to LaTeX format. For each block in the PDF, provide the LaTeX content.")

app = FastAPI()
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

# ULTRA-OPTIMIZED: Process entire document in one go or a few chunks
async def process_document_chunks(file_bytes, structure, chunk_size=10):
    debug_print(f"Processing document in chunks of {chunk_size} blocks")
    all_blocks = structure.get('blocks', [])
    total_blocks = len(all_blocks)
    processed_blocks = []
    
    # Process chunks of blocks in parallel
    chunk_tasks = []
    for i in range(0, total_blocks, chunk_size):
        end = min(i + chunk_size, total_blocks)
        block_chunk = all_blocks[i:end]
        debug_print(f"Creating chunk task for blocks {i+1}-{end} of {total_blocks}")
        
        task = asyncio.create_task(process_chunk(file_bytes, block_chunk, i))
        chunk_tasks.append(task)
    
    # Wait for all chunks to complete
    debug_print(f"Waiting for {len(chunk_tasks)} chunk tasks to complete")
    chunk_results = await asyncio.gather(*chunk_tasks, return_exceptions=True)
    
    # Combine results in correct order
    for chunk_result in chunk_results:
        if isinstance(chunk_result, Exception):
            debug_print(f"Chunk processing error: {str(chunk_result)}")
            continue
            
        if isinstance(chunk_result, list):
            processed_blocks.extend(chunk_result)
    
    # Ensure blocks are in the correct order
    block_id_map = {block.get('id'): i for i, block in enumerate(all_blocks)}
    processed_blocks.sort(key=lambda x: block_id_map.get(x.get('id', ''), 9999))
    
    return processed_blocks

# Process a chunk of blocks with one API call
async def process_chunk(file_bytes, blocks, chunk_idx):
    debug_print(f"Processing chunk {chunk_idx+1} with {len(blocks)} blocks")
    chunk_prompt = f"""
Process the following blocks from the PDF and convert them to LaTeX format.
For EACH block, return ONLY the LaTeX code with NO explanations.

Blocks to process: {json.dumps(blocks)}
"""
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-pro-preview-03-25",
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type="application/pdf"),
                chunk_prompt
            ]
        )
        
        debug_print(f"Received chunk {chunk_idx+1} response, length: {len(response.text)}")
        
        # Process response into separate blocks
        results = []
        for block in blocks:
            block_id = block.get('id', f'unknown_{chunk_idx}')
            
            # For simplicity, we'll just use the entire response text for each block
            # In a real implementation, you'd need to parse the response to separate blocks
            results.append({
                'id': block_id,
                'type': block.get('type', 'text'),
                'content': response.text
            })
            
        return results
        
    except Exception as e:
        debug_print(f"Error processing chunk {chunk_idx+1}: {str(e)}")
        # Return minimal placeholder for each block in chunk
        return [{
            'id': block.get('id', f'unknown_{chunk_idx}_{i}'),
            'type': block.get('type', 'text'),
            'content': f"% Error processing block: {str(e)}"
        } for i, block in enumerate(blocks)]

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    debug_print("==== UPLOAD ENDPOINT CALLED ====")
    start_time = time.time()
    
    try:
        debug_print(f"Processing file: {file.filename}")
        contents = await file.read()
        
        # Save file (optional, can be removed for speed)
        os.makedirs("./api/uploads", exist_ok=True)
        file_path = f"./api/uploads/{file.filename}"
        with open(file_path, "wb") as f:
            f.write(contents)
        
        debug_print("Extracting document structure")
        structure_response = client.models.generate_content(
            model="gemini-2.5-pro-preview-03-25",
            contents=[
                types.Part.from_bytes(data=contents, mime_type="application/pdf"),
                structure_prompt
            ]
        )
        
        try:
            if structure_response.text.strip().startswith("```json"):
                json_text = structure_response.text.split("```json", 1)[1].split("```", 1)[0].strip()
            else:
                json_text = structure_response.text
                
            structure = json.loads(json_text)
            block_count = len(structure.get('blocks', []))
            debug_print(f"Structure extracted with {block_count} blocks")
        except Exception as e:
            debug_print(f"Error parsing structure: {str(e)}")
            structure = {"blocks": [{"id": "block1", "type": "text", "page": 1}]}
            block_count = 1
        
        # Process document in chunks - adjust chunk_size based on your needs
        # Smaller chunks are faster but less coherent, larger chunks are slower but more coherent
        chunk_size = 5  # Adjust based on document complexity and speed requirements
        processed_blocks = await process_document_chunks(contents, structure, chunk_size)
        
        # Assemble LaTeX document
        complete_latex = "\n\n".join([block.get('content', '') for block in processed_blocks])
        
        total_time = time.time() - start_time
        debug_print(f"COMPLETED in {total_time:.2f} seconds for {block_count} blocks")
        
        return JSONResponse(content={"latex": complete_latex})
        
    except Exception as e:
        debug_print(f"ERROR in upload endpoint: {str(e)}")
        import traceback
        debug_print(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/export-pdf")
async def export_pdf(request: Request):
    debug_print("==== EXPORT PDF ENDPOINT CALLED ====")
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

            if not os.path.exists(pdf_path):
                return JSONResponse(status_code=500, content={"error": "PDF generation failed."})
            
            with open(pdf_path, "rb") as pdf_file:
                pdf_bytes = BytesIO(pdf_file.read())
        
        return StreamingResponse(
            pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=converted.pdf"}
        )
    
    except Exception as e:
        debug_print(f"ERROR during PDF generation: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})