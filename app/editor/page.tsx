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

  // State for keyboard shortcuts
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  
  // Keyboard shortcut handler for Cmd+S to save (simulate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcuts panel with Cmd+/
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      
      // Auto-compile with Cmd+Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        debouncedRender(latexCode);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [latexCode, debouncedRender]);

  // Show full-screen loading on initial load
  if (isInitialLoad && isLoading) {
    return <LoadingSpinner size="lg" text="Preparing your LaTeX document..." fullScreen={true} />;
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header bar */}
      <header className="h-12 bg-white z-10 fixed top-0 w-full border-b border-gray-100 backdrop-blur-sm bg-white/80">
        <div className="relative h-full w-full">
          {/* Logo - absolutely positioned to left */}
          <div className="absolute left-6 top-0 h-full flex items-center">
            <Link href="/" className="text-black font-medium hover:text-gray-700 transition-colors">
              LaTeX Converter
            </Link>
          </div>
          
          {/* Center content - loading indicator */}
          <div className="h-full flex items-center justify-center">
            {isLoading && (
              <div className="flex items-center px-3 py-1 bg-gray-50 rounded-full text-xs animate-pulse-subtle">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-gray-500">Rendering...</span>
              </div>
            )}
          </div>
          
          {/* Actions - absolutely positioned to right */}
          <div className="absolute right-6 top-0 h-full flex items-center">
            <div className="flex items-center space-x-2">
              <div className="tooltip tooltip-left" data-tip="Return home">
                <Link
                  href="/"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
              </div>
              <div className="tooltip" data-tip="Keyboard shortcuts">
                <button 
                  onClick={() => setShowShortcuts(prev => !prev)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </div>
              <div className="tooltip tooltip-right" data-tip="New document">
                <button 
                  onClick={() => {
                    clearLatexContent();
                    // Reset the editor state
                    setLatexCode(defaultLatex);
                    setIsLoading(true);
                    debouncedRender(defaultLatex);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Editor and Preview - Full height with minimal design */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 pt-12 h-screen">
        {/* Editor Side */}
        <div className="animate-fade-in flex flex-col h-[calc(100vh-48px)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full z-10 px-4 py-3 bg-white/70 backdrop-blur-sm border-b border-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <h2 className="text-xs text-gray-500 uppercase tracking-wide font-medium">LaTeX Editor</h2>
              </div>
              <div className="text-xs text-gray-400">
                ⌘+Enter to compile
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden pt-10">
            <CodeEditor
              value={latexCode}
              onChange={handleCodeChange}
            />
          </div>
        </div>
        
        {/* Preview Side */}
        <div className="animate-fade-in lg:border-l border-gray-100 flex flex-col h-[calc(100vh-48px)] relative">
          <div className="absolute top-0 left-0 w-full z-10 px-4 py-3 bg-white/70 backdrop-blur-sm border-b border-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <h2 className="text-xs text-gray-500 uppercase tracking-wide font-medium">PDF Preview</h2>
              </div>
              {isLoading && (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-xs text-gray-500">Rendering...</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-50 transition-all duration-500">
            <div className="h-full p-12 pt-16">
              <div 
                className={`h-full shadow-lg transform transition-all duration-500 animate-scale rounded-lg 
                  ${isLoading ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'}`}
              >
                <PdfPreview 
                  pdfUrl={pdfUrl} 
                  isLoading={isLoading} 
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Keyboard shortcuts panel */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}  
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Keyboard Shortcuts</h3>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="text-gray-400 hover:text-black"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Compile document</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">⌘ + Enter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Toggle shortcuts</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">⌘ + /</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}