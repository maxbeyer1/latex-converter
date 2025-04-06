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
    <div className="h-full bg-white rounded-lg overflow-hidden relative transition-all duration-300">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full p-4 text-red-600">
          <div className="text-center max-w-sm">
            <svg 
              className="w-12 h-12 text-red-400 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="font-medium text-lg mb-2">Error Rendering PDF</p>
            <p className="text-sm text-gray-700">{error}</p>
          </div>
        </div>
      ) : pdfUrl ? (
        <div className="relative w-full h-full">
          <div className="absolute top-4 right-4 space-x-2 z-10 opacity-50 hover:opacity-100 transition-opacity duration-200">
            <button 
              className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
              onClick={() => window.open(pdfUrl, '_blank')}
              title="Open in new tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
          <iframe 
            src={pdfUrl} 
            className="w-full h-full border-0 animate-fade-in rounded-lg"
            title="PDF Preview"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-sm">
            <svg 
              className="w-12 h-12 text-gray-300 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <p className="text-gray-400 font-medium">
              Edit the LaTeX code to generate a preview
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfPreview;