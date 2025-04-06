import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LatexPreviewProps {
  content: string;
  isLoading?: boolean;
}

const LatexPreview: React.FC<LatexPreviewProps> = ({ content, isLoading = false }) => {
  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-200 h-64 overflow-auto font-mono text-sm">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="md" />
        </div>
      ) : content ? (
        <pre className="whitespace-pre-wrap text-gray-950">{content}</pre>
      ) : (
        <p className="text-gray-400 text-center italic mt-20">
          LaTeX content will appear here after conversion.
        </p>
      )}
    </div>
  );
};

export default LatexPreview;