"use client";

import React from "react";
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ content }) => {
  return (
    <div className="latex-preview p-4">
      {content ? (
        <div className="text-gray-950">
          <Latex>{content}</Latex>
        </div>
      ) : (
        <p className="text-gray-400 text-center italic mt-20">
          Preview will appear here as you type.
        </p>
      )}
    </div>
  );
};

export default LatexRenderer;