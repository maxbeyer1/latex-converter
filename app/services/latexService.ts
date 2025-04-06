// Service for handling LaTeX to PDF conversion

/**
 * Convert LaTeX code to PDF and receive a Blob URL
 */
export const renderLatexToPdf = async (latexCode: string): Promise<string> => {
  try {
    const response = await fetch("http://localhost:8000/export-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latex: latexCode }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }

    // Get the PDF as blob
    const pdfBlob = await response.blob();
    
    // Create a URL for the blob
    const pdfUrl = URL.createObjectURL(pdfBlob);
    return pdfUrl;
  } catch (error) {
    console.error("Error rendering LaTeX to PDF:", error);
    throw error;
  }
};