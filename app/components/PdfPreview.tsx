"use client";

import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface PdfPreviewProps {
  pdfUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ pdfUrl, isLoading, error }) => {
  return (
    <div className="h-full bg-gray-100 rounded border border-gray-200 overflow-hidden relative">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full p-4 text-red-600">
          <div className="text-center">
            <p className="font-bold mb-2">Error Rendering PDF</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : pdfUrl ? (
        <iframe 
          src={pdfUrl} 
          className="w-full h-full border-0"
          title="PDF Preview"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-center italic">
            Edit the LaTeX code to generate a preview.
          </p>
        </div>
      )}
    </div>
  );
};

export default PdfPreview;