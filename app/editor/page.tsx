"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { renderLatexToPdf } from "../services/latexService";
import { useAppStore } from "../services/appState";
import { debounce } from "lodash";
import LoadingSpinner from "../components/LoadingSpinner";
import Link from "next/link";

// Dynamically import components to prevent SSR issues
const CodeEditor = dynamic(() => import("../components/CodeEditor"), {
  ssr: false,
});

const PdfPreview = dynamic(() => import("../components/PdfPreview"), {
  ssr: false,
});

export default function EditorPage() {
  const router = useRouter();
  // Get LaTeX content from global state
  const storedLatexContent = useAppStore((state) => state.latexContent);
  const clearLatexContent = useAppStore((state) => state.clearLatexContent);
  
  // Default LaTeX content if none is provided
  const defaultLatex = `\\documentclass{article}
\\begin{document}
\\section{Introduction}
Hello, world! This is a simple LaTeX document.

$$E = mc^2$$

\\end{document}`;
  
  // Use stored content or default
  const initialLatex = storedLatexContent || defaultLatex;
  
  const [latexCode, setLatexCode] = useState<string>(initialLatex);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cleanup function for Blob URLs
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Debounced render function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRender = useCallback(
    debounce(async (code: string) => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Clean up any previous URL
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        
        const newPdfUrl = await renderLatexToPdf(code);
        setPdfUrl(newPdfUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error("Error rendering PDF:", err);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    }, 1000), // 1 second delay
    []
  );

  // Handle code changes
  const handleCodeChange = (value: string) => {
    setLatexCode(value);
    debouncedRender(value);
  };

  // Render once on initial load
  useEffect(() => {
    debouncedRender(latexCode);
  }, [latexCode, debouncedRender]);

  // Show full-screen loading on initial load
  if (isInitialLoad && isLoading) {
    return <LoadingSpinner size="lg" text="Preparing your LaTeX document..." fullScreen={true} />;
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 py-4">
        <div className="container-center flex justify-between items-center">
          <Link href="/" className="text-black hover:text-gray-700 transition-colors">
            <span className="text-xl font-bold">LaTeX</span>
          </Link>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => clearLatexContent()}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              New Document
            </button>
          </div>
        </div>
      </header>
      
      {/* Editor and Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 border-gray-100">
        <div className="animate-fade-in flex flex-col h-[calc(100vh-72px)]">
          <div className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <h2 className="font-medium">Editor</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={latexCode}
              onChange={handleCodeChange}
            />
          </div>
        </div>
        
        <div className="animate-fade-in lg:border-l border-gray-100 flex flex-col h-[calc(100vh-72px)]">
          <div className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <h2 className="font-medium">PDF Preview</h2>
            {isLoading && (
              <div className="flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-xs text-gray-500">Rendering...</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-4 bg-gray-50">
            <div className="h-full shadow-sm">
              <PdfPreview 
                pdfUrl={pdfUrl} 
                isLoading={isLoading} 
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}