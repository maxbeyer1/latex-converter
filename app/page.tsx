"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "./components/FileUpload";
import LoadingSpinner from "./components/LoadingSpinner";
import { convertPdfToLatex } from "./services/convertService";
import { useAppStore } from "./services/appState";

export default function Home() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the store setter
  const setLatexContent = useAppStore((state) => state.setLatexContent);

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
      
      // Store the LaTeX content in the shared state
      setLatexContent(latex);
      
      // Redirect to the editor page
      router.push("/editor");
    } catch (err) {
      console.error("Error converting file:", err);
      setError("Error converting PDF to LaTeX. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-gray-50 pt-0">
      <div className="w-full max-w-4xl mt-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">PDF to LaTeX Converter</h1>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Input Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Upload PDF</h2>
            
            <FileUpload 
              onFileSelect={handleFileSelect}
              selectedFile={pdfFile}
              isLoading={isLoading}
            />
            
            {error && (
              <p className="mt-2 text-red-500 text-sm text-center">{error}</p>
            )}
            
            {pdfFile && (
              <div className="flex justify-center w-full">
                <button
                  onClick={handleConvert}
                  disabled={isLoading}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-blue-300"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Converting...</span>
                    </span>
                  ) : "Convert to LaTeX"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}