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
import time
import re
import asyncio
from collections import Counter

def log(message):
    """Simple timestamped logging function"""
    timestamp = time.strftime('%H:%M:%S')
    print(f"[{timestamp}] {message}", flush=True)

# Load environment variables
load_dotenv()

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
model_name = "gemini-2.5-pro-preview-03-25"

# Get prompts from environment variables
base_prompt = os.getenv("PROMPT", "")
equation_prompt = os.getenv("EQUATION_PROMPT", "")
diagram_prompt = os.getenv("DIAGRAM_PROMPT", "")
structure_prompt = os.getenv("STRUCTURE_PROMPT", "")
judge_prompt = os.getenv("JUDGE_PROMPT", "")
syntax_prompt = os.getenv("SYNTAX_PROMPT", "")

# Define diverse prompts for voters using the base prompts from .env
voter_prompts = [
    # Voter 1: General Purpose with emphasis on accuracy
    f"{base_prompt}\nPrioritize accuracy and correct syntax for a complete document that will compile successfully.",
    
    # Voter 2: Emphasis on equations and math
    f"{base_prompt}\n{equation_prompt}\nPay special attention to mathematical notation and equations.",
    
    # Voter 3: Emphasis on document structure
    f"{base_prompt}\nPrioritize clean document structure with proper sectioning and environments.",
    
    # Voter 4: Emphasis on diagrams and figures
    f"{base_prompt}\n{diagram_prompt}\nPay special attention to diagrams and figures.",
    
    # Voter 5: Conservative approach focused on compilation
    f"{base_prompt}\nPrioritize guaranteed compilation over perfect visual matching. For complex diagrams, create simple placeholders."
]

# Initialize FastAPI
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

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    overall_start_time = time.time()
    log(f"Processing upload: {file.filename}")
    
    try:
        if not file:
            log("No upload file sent")
            return {"message": "No upload file sent"}
            
        # Create the uploads directory if it doesn't exist
        os.makedirs("./api/uploads", exist_ok=True)
        
        # Save the uploaded file
        file_path = f"./api/uploads/{file.filename}"
        contents = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(contents)
            
        log(f"File saved to {file_path}")
        
        # Get LaTeX code through voting system
        log(f"Starting voter system with {len(voter_prompts)} voters")
        start_time = time.time()
        latex_code = await process_with_voter_system(contents)
        log(f"Voter system completed in {time.time() - start_time:.2f} seconds")
        
        # Validate and fix syntax
        log("Validating LaTeX syntax")
        start_time = time.time()
        latex_code = await validate_latex_syntax(latex_code, contents)
        log(f"Syntax validation completed in {time.time() - start_time:.2f} seconds")
        
        # Return the final LaTeX code
        total_time = time.time() - overall_start_time
        log(f"Total processing time: {total_time:.2f} seconds")
        
        return JSONResponse(content={"latex": latex_code})
    
    except Exception as e:
        log(f"Error processing upload: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

async def process_with_voter_system(pdf_contents):
    """Process PDF with multiple parallel voters and take majority consensus"""
    
    # Create tasks for all voters
    voter_tasks = []
    
    for i, prompt in enumerate(voter_prompts):
        task = asyncio.create_task(
            get_voter_response(pdf_contents, prompt, f"Voter {i+1}")
        )
        voter_tasks.append(task)
    
    # Get all voter responses
    log("Waiting for all voters to complete")
    voter_responses = await asyncio.gather(*voter_tasks)
    
    # Process the responses
    log("All voters completed, processing consensus")
    return await get_consensus(voter_responses, pdf_contents)


async def get_voter_response(pdf_contents, prompt, voter_name, max_retries=3):
    """
    Get LaTeX conversion from a single voter with simple retry logic.
    Retries up to `max_retries` times if the Gemini API fails or returns empty text.
    """
    start_time = time.time()
    latex_code = ""

    for attempt in range(1, max_retries + 1):
        try:
            log(f"Starting {voter_name}, attempt {attempt}")
            
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_bytes(data=pdf_contents, mime_type="application/pdf"),
                    prompt
                ]
            )

            # Extract text from the response, defaulting to empty if it's None
            latex_code = response.text if response and response.text else ""

            # Remove any Markdown code blocks if present
            if "```latex" in latex_code:
                match = re.search(r"```latex\n(.*?)```", latex_code, re.DOTALL)
                if match:
                    latex_code = match.group(1)
            elif "```" in latex_code:
                match = re.search(r"```\n(.*?)```", latex_code, re.DOTALL)
                if match:
                    latex_code = match.group(1)

            # If we got some non-empty LaTeX code, break out of retry loop
            if latex_code.strip():
                break
            else:
                log(
                    f"Warning: {voter_name} returned an empty response. "
                    + (
                        f"Retrying... (Attempt {attempt}/{max_retries})"
                        if attempt < max_retries
                        else "No more retries left."
                    )
                )

        except Exception as e:
            log(f"Error calling Gemini API for {voter_name}, attempt {attempt}: {str(e)}")
            if attempt < max_retries:
                log("Retrying...")
            else:
                log("No more retries left.")
                latex_code = ""  # Return empty if we've exhausted retries

        # Optional small delay before next retry attempt
        await asyncio.sleep(1)

    log(f"{voter_name} completed in {time.time() - start_time:.2f} seconds")
    return latex_code

def normalize_line(line: str) -> str:
    """
    Collapses multiple spaces, strips leading/trailing spaces, etc.,
    making lines more likely to match if they're only off by whitespace.
    """
    # Remove leading/trailing whitespace
    line = line.strip()
    # Collapse multiple spaces into one
    line = re.sub(r"\s+", " ", line)
    return line

async def get_consensus(voter_responses, pdf_contents):
    """Get consensus from multiple voter responses, with normalized lines to reduce tiebreakers."""
    
    # Replace any None or empty string with "" (just to be safe)
    voter_responses = [resp if resp else "" for resp in voter_responses]

    # Split responses into lines
    response_lines = [response.split('\n') for response in voter_responses]
    
    # Find the maximum number of lines
    max_lines = max(len(lines) for lines in response_lines)
    
    # Pad shorter responses with empty lines
    for i in range(len(response_lines)):
        if len(response_lines[i]) < max_lines:
            response_lines[i].extend([''] * (max_lines - len(response_lines[i])))
    
    # Initialize result
    result_lines = []
    tiebreaker_count = 0
    
    # Process each line
    for line_index in range(max_lines):
        # Gather each voter's line, normalized
        line_versions = [normalize_line(lines[line_index]) for lines in response_lines]
        
        # Count occurrences of each version
        counter = Counter(line_versions)
        
        # Get the most common versions
        most_common = counter.most_common()
        
        # If there's a clear majority, use that
        # (with 5 voters, any version that appears 3+ times is a majority)
        if most_common[0][1] > len(response_lines) / 2:
            result_lines.append(most_common[0][0])
        # Otherwise, we have a tie or no majority
        else:
            log(f"Tie on line {line_index+1}, using tiebreaker")
            tiebreaker_count += 1
            
            # Get up to 3 most common options to break the tie
            options = [option for option, _ in most_common[:3]]
            tiebreaker_result = await resolve_tiebreaker(options, pdf_contents)
            
            # Pick the chosen option
            result_lines.append(options[tiebreaker_result - 1])
    
    log(f"Consensus building completed with {tiebreaker_count} tiebreakers used")
    
    # Join back into a single string
    return '\n'.join(result_lines)

async def resolve_tiebreaker(options, pdf_contents):
    """Use a judge API call to resolve ties."""
    
    # Format options for the judge
    options_text = ""
    for i, option in enumerate(options):
        options_text += f"Option {i+1}: {option}\n\n"
    
    full_judge_prompt = f"{judge_prompt}\n\nHere are the options:\n{options_text}"
    
    # Call the judge
    response = client.models.generate_content(
        model=model_name,
        contents=[
            types.Part.from_bytes(data=pdf_contents, mime_type="application/pdf"),
            full_judge_prompt
        ]
    )
    
    # Extract the choice (expecting just a number)
    choice_text = response.text.strip()
    
    # Try to extract a number
    try:
        matches = re.findall(r'\d+', choice_text)
        if matches:
            choice = int(matches[0])
            if choice < 1 or choice > len(options):
                choice = 1
        else:
            choice = 1
    except:
        choice = 1
    
    return choice

async def validate_latex_syntax(latex_code, pdf_contents):
    """Validate and fix LaTeX syntax issues."""
    
    full_syntax_prompt = f"{syntax_prompt}\n\nHere is the LaTeX code:\n{latex_code}"
    
    # Call the syntax validator
    response = client.models.generate_content(
        model=model_name,
        contents=[full_syntax_prompt]
    )
    
    # Check if issues were found
    if "NO_ISSUES_FOUND" in response.text:
        log("No syntax issues found")
        return latex_code
    
    log("Syntax issues found, applying fixes")
    
    # Get fixed code by calling another API with instruction to fix
    fix_prompt = f"""You are a LaTeX expert. Fix all syntax errors in the following LaTeX code to ensure it compiles successfully:

{latex_code}

Return ONLY the corrected LaTeX code without any explanations or markdown formatting.
"""
    
    fix_response = client.models.generate_content(
        model=model_name,
        contents=[fix_prompt]
    )
    
    fixed_code = fix_response.text
    
    # Remove markdown if present
    if "```latex" in fixed_code:
        match = re.search(r"```latex\n(.*?)```", fixed_code, re.DOTALL)
        if match:
            fixed_code = match.group(1)
    elif "```" in fixed_code:
        match = re.search(r"```\n(.*?)```", fixed_code, re.DOTALL)
        if match:
            fixed_code = match.group(1)
    
    return fixed_code

@app.post("/export-pdf")
async def export_pdf(request: Request):
    try:
        log("Processing PDF export request")
        start_time = time.time()
        
        body = await request.json()
        latex_code = body.get("latex")

        if not latex_code:
            return JSONResponse(status_code=400, content={"error":"No LaTeX content provided."})

        log(f"Received LaTeX code, length: {len(latex_code)} characters")
        
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, "document.tex")
            pdf_path = os.path.join(tmpdir, "document.pdf")

            with open(tex_path, "w") as f:
                f.write(latex_code)

            log("Running pdflatex")
            result = subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "-output-directory", tmpdir, tex_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=120
            )

            log(f"pdflatex exit code: {result.returncode}")
            
            # If first compilation fails, try again with diagram placeholders
            if not os.path.exists(pdf_path):
                log("First compilation failed, trying with diagram placeholders")
                
                # Replace TikZ diagrams with placeholders
                modified_latex = replace_diagrams_with_placeholders(latex_code)
                
                with open(tex_path, "w") as f:
                    f.write(modified_latex)
                
                log("Running pdflatex with placeholders")
                result = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", "-output-directory", tmpdir, tex_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=90
                )
                
                log(f"Second pdflatex attempt exit code: {result.returncode}")
            
            # If still no PDF, create an emergency PDF with error message
            if not os.path.exists(pdf_path):
                log("Both compilation attempts failed, creating emergency document")
                
                # Get LaTeX errors from log file
                error_log = os.path.join(tmpdir, "document.log")
                error_messages = "Unknown compilation error"
                
                if os.path.exists(error_log):
                    with open(error_log, "r") as f:
                        errors = []
                        for line in f:
                            if line.startswith("!"):
                                errors.append(line.strip())
                        if errors:
                            error_messages = "\\begin{itemize}\n"
                            for error in errors[:5]:  # Show first 5 errors
                                # Make underscores safe in LaTeX
                                error_messages += "\\item " + error.replace("_", r"\_") + "\n"
                            error_messages += "\\end{itemize}"
                
                # Create emergency document with error info
                emergency_latex = f"""
\\documentclass{{article}}
\\usepackage{{xcolor}}
\\begin{{document}}
\\section*{{\\textcolor{{red}}{{LaTeX Compilation Failed}}}}

\\subsection*{{Error Messages:}}
{error_messages}

\\vspace{{1cm}}
\\fbox{{\\parbox{{0.9\\textwidth}}{{
  The LaTeX code could not be compiled automatically.\\\\
  \\textbf{{Suggestions:}}\\\\
  1. Check for syntax errors in equations and environments\\\\
  2. Simplify or remove complex diagrams\\\\
  3. Ensure all environments are properly closed\\\\
  4. Check for missing or conflicting packages
}}}}

\\vspace{{1cm}}
\\textbf{{Note:}} This application is in beta. You may need to modify the generated LaTeX code manually.
\\end{{document}}
"""
                
                with open(tex_path, "w") as f:
                    f.write(emergency_latex)
                
                log("Running pdflatex with emergency document")
                result = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", "-output-directory", tmpdir, tex_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=60
                )
            
            # Final check
            if not os.path.exists(pdf_path):
                return JSONResponse(
                    status_code=500,
                    content={"error": "PDF generation failed after multiple attempts."}
                )
            
            log("PDF generated successfully")
            with open(pdf_path, "rb") as pdf_file:
                pdf_bytes = BytesIO(pdf_file.read())
        
        total_time = time.time() - start_time
        log(f"PDF export completed in {total_time:.2f} seconds")
        
        return StreamingResponse(
            pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=converted.pdf"}
        )
    
    except Exception as e:
        log(f"PDF generation error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

def replace_diagrams_with_placeholders(latex_code):
    """Replace TikZ diagrams with placeholder boxes of similar dimensions."""
    
    # Find tikzpicture environments
    tikz_pattern = r"\\begin\{tikzpicture\}(.*?)\\end\{tikzpicture\}"
    tikz_matches = re.findall(tikz_pattern, latex_code, re.DOTALL)
    
    modified_latex = latex_code
    
    # For each diagram, create an appropriate placeholder
    for i, tikz_code in enumerate(tikz_matches):
        # Default dimensions
        width = 6  # cm
        height = 4  # cm
        
        # Look for 'width=' or 'height=' in the tikz code
        width_match = re.search(r"width=(\d+(\.\d+)?)", tikz_code)
        if width_match:
            width = float(width_match.group(1))
        
        height_match = re.search(r"height=(\d+(\.\d+)?)", tikz_code)
        if height_match:
            height = float(height_match.group(1))
        
        # Check coordinate extremes
        x_coords = re.findall(r"\(\s*(-?\d+(\.\d+)?)\s*,", tikz_code)
        if x_coords:
            x_values = [float(x[0]) for x in x_coords]
            if x_values and (max(x_values) - min(x_values) > 0):
                width = max(width, max(x_values) - min(x_values))
        
        y_coords = re.findall(r",\s*(-?\d+(\.\d+)?)\s*\)", tikz_code)
        if y_coords:
            y_values = [float(y[0]) for y in y_coords]
            if y_values and (max(y_values) - min(y_values) > 0):
                height = max(height, max(y_values) - min(y_values))
        
        # Create a placeholder environment
        placeholder = f"""
% Original diagram replaced with placeholder
\\begin{{center}}
\\fbox{{\\parbox{{{width}cm}}{{
  \\centering
  \\vspace{{{height/2}cm}}
  \\textbf{{Diagram Placeholder}}\\\\
  This diagram was too complex to render automatically.\\\\
  Please replace with appropriate TikZ code.
  \\vspace{{{height/2}cm}}
}}}}
\\end{{center}}
"""
        original_tikz = f"\\begin{{tikzpicture}}{tikz_code}\\end{{tikzpicture}}"
        modified_latex = modified_latex.replace(original_tikz, placeholder, 1)
    
    return modified_latex
