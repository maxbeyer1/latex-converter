"use client";

import { useState, useEffect } from "react";
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
  const [animatedText, setAnimatedText] = useState<string>("");
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  
  // Get the store setter
  const setLatexContent = useAppStore((state) => state.setLatexContent);
  const latexContent = useAppStore((state) => state.latexContent);

  // Animation for the terminal-style typing effect
  useEffect(() => {
    const fullText = "\\documentclass{article}\n\\begin{document}\n\\title{PDF To LaTeX Converter}\n\\author{\\texttt{powered by AI}}\n\\date{\\today}\n\\maketitle\n\\end{document}";
    let currentIndex = 0;
    
    if (!animationComplete) {
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setAnimatedText(fullText.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setAnimationComplete(true);
        }
      }, 50);
      
      return () => clearInterval(typingInterval);
    }
  }, [animationComplete]);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    
    return () => clearInterval(cursorInterval);
  }, []);

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

  // Keyboard shortcut component
  const KeyboardShortcut = ({ command }: { command: string }) => (
    <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-xs text-gray-700">
      {command}
    </span>
  );

  return (
    <main className="min-h-screen flex flex-col">
      {/* Terminal-like header with monospaced title */}
      <header className="w-full bg-black text-white py-3 px-6">
        <div className="container-center flex items-center">
          <div className="flex space-x-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h1 className="font-mono text-sm flex-1 text-center">~/latex-converter</h1>
        </div>
      </header>

      <div className="container-center flex-1 py-10 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column: Terminal-like animation and title */}
          <div className="lg:col-span-2 animate-fade-in">
            <div className="flex flex-col h-full">
              <div className="mb-8">
                <h1 className="font-mono text-4xl font-bold mb-2 border-b-2 border-black pb-2 inline-block">
                  LaTeX<span className="text-gray-500">Converter</span>
                </h1>
                <p className="font-mono text-sm text-gray-600 mt-2">
                  [<span className="text-blue-600">pdf</span>] → [<span className="text-green-600">tex</span>]
                </p>
                
                {latexContent && (
                  <div className="mt-6 animate-slide-fade">
                    <Link 
                      href="/editor" 
                      className="font-mono text-gray-700 hover:text-black transition-colors flex items-center gap-2 hover-lift"
                    >
                      <span>$ continue_editing</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Animated code block */}
              <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 p-4 font-mono text-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-bl">
                  LaTeX
                </div>
                <pre className="text-gray-800 whitespace-pre-wrap">
                  {animatedText}
                  {!animationComplete && <span className={`inline-block w-2 h-4 ml-1 bg-black ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}></span>}
                </pre>
              </div>
              
              {/* Keyboard shortcuts */}
              <div className="mt-6 font-mono text-xs text-gray-600 border-t border-gray-200 pt-4">
                Shortcuts: Press <KeyboardShortcut command="Ctrl+H" /> to go home, 
                <KeyboardShortcut command="Ctrl+/" /> for help
              </div>
            </div>
          </div>
          
          {/* Right column: Upload and features */}
          <div className="lg:col-span-3">
            <div className="card border-2 p-8 shadow-md animate-slide-up stagger-1 hover-scale mb-8">
              <FileUpload 
                onFileSelect={handleFileSelect}
                selectedFile={pdfFile}
                isLoading={isLoading}
              />
              
              {error && (
                <p className="mt-4 text-red-500 text-sm text-center font-mono">{error}</p>
              )}
              
              {pdfFile && (
                <div className="flex justify-center w-full mt-6 animate-slide-up stagger-2">
                  <button
                    onClick={handleConvert}
                    disabled={isLoading}
                    className="btn-primary hover-lift font-mono flex items-center gap-2"
                  >
                    <span>Convert to LaTeX</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 12h14" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {/* Features section with code-inspired design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up stagger-3">
              <div className="card border border-gray-100 hover:border-black transition-colors p-6 hover-scale bg-white">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-black text-white mb-4 font-mono">
                  <span>01</span>
                </div>
                <h3 className="font-mono text-sm uppercase tracking-wider mb-2">Accurate Conversion</h3>
                <p className="font-mono text-xs text-gray-600">
                  {'>> preserve_document_structure()'}
                </p>
              </div>
              
              <div className="card border border-gray-100 hover:border-black transition-colors p-6 hover-scale bg-white">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-black text-white mb-4 font-mono">
                  <span>02</span>
                </div>
                <h3 className="font-mono text-sm uppercase tracking-wider mb-2">Interactive Editor</h3>
                <p className="font-mono text-xs text-gray-600">
                  {'>> edit_with_syntax_highlight()'}
                </p>
              </div>
              
              <div className="card border border-gray-100 hover:border-black transition-colors p-6 hover-scale bg-white">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-black text-white mb-4 font-mono">
                  <span>03</span>
                </div>
                <h3 className="font-mono text-sm uppercase tracking-wider mb-2">Live Preview</h3>
                <p className="font-mono text-xs text-gray-600">
                  {'>> render_in_real_time()'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Terminal-like footer */}
        <div className="mt-16 pt-6 border-t border-dashed border-gray-300">
          <div className="font-mono text-xs text-gray-500 flex flex-wrap gap-y-2">
            <span className="block w-full md:w-auto md:inline-block">[user@latex-converter]$ </span>
            <span className="animate-pulse-subtle ml-0 md:ml-1">ready to convert PDFs to LaTeX _</span>
          </div>
        </div>
      </div>
    </main>
  );
}