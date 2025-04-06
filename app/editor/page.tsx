"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { renderLatexToPdf } from "../services/latexService";
import { debounce } from "lodash"; // Assuming lodash is available or can be installed

// Dynamically import components to prevent SSR issues
const CodeEditor = dynamic(() => import("../components/CodeEditor"), {
  ssr: false,
});

const PdfPreview = dynamic(() => import("../components/PdfPreview"), {
  ssr: false,
});

export default function EditorPage() {
  const [latexCode, setLatexCode] = useState<string>(`\\documentclass{article}
\\begin{document}
\\section{Introduction}
Hello, world! This is a simple LaTeX document.

$$E = mc^2$$

\\end{document}`);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-gray-50 pt-0">
      <div className="w-full max-w-6xl mt-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">LaTeX Editor</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Editor</h2>
            <div className="h-[70vh] border border-gray-200 rounded overflow-hidden">
              <CodeEditor
                value={latexCode}
                onChange={handleCodeChange}
              />
            </div>
          </div>
          
          {/* Preview Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">PDF Preview</h2>
            <div className="h-[70vh]">
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