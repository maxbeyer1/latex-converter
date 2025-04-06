"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import components to prevent SSR issues
const CodeEditor = dynamic(() => import("../components/CodeEditor"), {
  ssr: false,
});

const LatexRenderer = dynamic(() => import("../components/LatexRenderer"), {
  ssr: false,
});

export default function EditorPage() {
  const [latexCode, setLatexCode] = useState<string>(`% Start typing your LaTeX here
\\documentclass{article}
\\begin{document}
\\section{Introduction}
Hello, world! This is a simple LaTeX document.

$$E = mc^2$$

\\end{document}`);

  const handleCodeChange = (value: string) => {
    setLatexCode(value);
  };

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
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Preview</h2>
            <div className="h-[70vh] border border-gray-200 rounded overflow-auto bg-white">
              <LatexRenderer content={latexCode} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}