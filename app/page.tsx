"use client";

import { useState } from "react";
import FileUpload from "./components/FileUpload";
import LatexPreview from "./components/LatexPreview";
import { convertPdfToLatex } from "./services/convertService";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [latexContent, setLatexContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setError(null);
  };

  const handleConvert = async () => {
    if (!pdfFile) {
      setError("Please select a PDF file first");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const latex = await convertPdfToLatex(pdfFile);
      setLatexContent(latex);
    } catch (err) {
      console.error("Error converting file:", err);
      setError("Error converting PDF to LaTeX. Please try again.");
      setLatexContent(""); // Clear any previous content
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-gray-50">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">LaTeX Converter</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload PDF</h2>
            
            <FileUpload 
              onFileSelect={handleFileSelect}
              selectedFile={pdfFile}
              isLoading={isLoading}
            />
            
            {error && (
              <p className="mt-2 text-red-500 text-sm">{error}</p>
            )}
            
            {pdfFile && (
              <button
                onClick={handleConvert}
                disabled={isLoading}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-blue-300"
              >
                {isLoading ? "Converting..." : "Convert to LaTeX"}
              </button>
            )}
          </div>
          
          {/* Output Preview Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">LaTeX Output</h2>
            <LatexPreview content={latexContent} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </main>
  );
}