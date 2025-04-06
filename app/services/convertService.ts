// Service for handling PDF to LaTeX conversion

// Mock LaTeX content for demonstration
const mockLatexContent = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage[utf8]{inputenc}

\\title{Sample Document}
\\author{LaTeX Converter}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a sample converted document. The actual conversion will be implemented later.

\\section{Equations}
Here is a sample equation:
\\begin{equation}
    E = mc^2
\\end{equation}

\\section{Lists}
\\begin{itemize}
    \\item First item
    \\item Second item
    \\item Third item
\\end{itemize}

\\end{document}`;

// Mock implementation (to be replaced with actual API call)
// export const convertPdfToLatex = async (file: File): Promise<string> => {
//   return new Promise((resolve) => {
//     // Simulate API call with a timeout
//     setTimeout(() => {
//       resolve(mockLatexContent);
//     }, 1500);
//   });
// };

/**
  * Convert PDF file to LaTeX format using the backend API 
 */
export const convertPdfToLatex = async (file: File): Promise<string> => {
  try {    
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();

    // Remove ```latex from the start and ``` from the end and strip any whitespace
    const latexContent = data.latex.replace(/```latex/g, "").replace(/```/g, "").trim();

    return latexContent || "";
  } catch (error) {
    console.error("Error converting PDF:", error);
    throw error;
  }
};