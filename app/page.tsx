"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "./components/FileUpload";
import LoadingSpinner from "./components/LoadingSpinner";
import { convertPdfToLatex } from "./services/convertService";
import { useAppStore } from "./services/appState";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the store setter
  const setLatexContent = useAppStore((state) => state.setLatexContent);
  const latexContent = useAppStore((state) => state.latexContent);

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

  // Show a full-screen loading spinner during the conversion process
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Converting your PDF to LaTeX..." fullScreen={true} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-12">
      <div className="container-center">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3">PDF to LaTeX</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Convert your PDF documents to LaTeX format with precision
          </p>
        </div>
        
        <div className="card p-8 animate-slide-up stagger-1">
          <FileUpload 
            onFileSelect={handleFileSelect}
            selectedFile={pdfFile}
            isLoading={isLoading}
          />
          
          {error && (
            <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
          )}
          
          {pdfFile && (
            <div className="flex justify-center w-full mt-6 animate-slide-up stagger-2">
              <button
                onClick={handleConvert}
                disabled={isLoading}
                className="btn-primary"
              >
                Convert to LaTeX
              </button>
            </div>
          )}
        </div>

        {latexContent && (
          <div className="mt-6 text-center animate-slide-up stagger-3">
            <Link 
              href="/editor" 
              className="text-gray-600 hover:text-black transition-colors text-sm"
            >
              Continue to previous session →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}