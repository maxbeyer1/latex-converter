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
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="container-center">
        <div className="flex flex-col md:flex-row items-center gap-12 mb-12">
          <div className="md:w-1/2 animate-fade-in">
            <h1 className="text-3xl font-bold mb-4">Transform your documents</h1>
            <p className="text-gray-600 mb-6">
              Seamlessly convert PDFs to editable LaTeX format with intelligent parsing and precise formatting
            </p>
            
            {latexContent && (
              <div className="mt-2 mb-6 animate-slide-fade">
                <Link 
                  href="/editor" 
                  className="text-gray-700 hover:text-black transition-colors flex items-center gap-2 hover-lift"
                >
                  <span>Continue editing</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </Link>
              </div>
            )}
          </div>
          
          <div className="md:w-1/2 w-full">
            <div className="card p-8 shadow-md animate-slide-up stagger-1 hover-scale">
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
                    className="btn-primary hover-lift"
                  >
                    Convert to LaTeX
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-slide-up stagger-3">
          <div className="card p-6 hover-scale">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black/5 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Accurate Conversion</h3>
            <p className="text-gray-600 text-sm">Maintain the structure and formatting of your original document</p>
          </div>
          
          <div className="card p-6 hover-scale">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black/5 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Interactive Editor</h3>
            <p className="text-gray-600 text-sm">Edit and refine your LaTeX with our intuitive interface</p>
          </div>
          
          <div className="card p-6 hover-scale">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black/5 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Live Preview</h3>
            <p className="text-gray-600 text-sm">See changes in real-time with our side-by-side preview</p>
          </div>
        </div>
      </div>
    </main>
  );
}