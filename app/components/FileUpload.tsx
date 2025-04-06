import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  selectedFile: File | null;
  isLoading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = "application/pdf",
  selectedFile,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (accept.includes(file.type)) {
      onFileSelect(file);
    } else {
      alert(`Please upload a ${accept} file`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (file) handleFile(file);
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }

  return (
    <div 
      className={`input-area animate-fade-in text-center
        ${isDragOver ? 'border-black bg-gray-50' : 'border-gray-200'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-black hover:shadow-md'}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        ref={fileInputRef}
        disabled={isLoading}
      />
      <label
        htmlFor="file-upload"
        className={`block cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {!selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-800"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-medium text-lg mb-2">Upload PDF Document</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Drag and drop your PDF file here, or click to browse
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg 
                className="w-8 h-8 text-gray-800" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h3 className="font-medium text-lg mb-2">File Selected</h3>
            <p className="text-gray-800">{selectedFile.name}</p>
            <p className="text-gray-500 text-sm mt-1">
              Click to select a different file
            </p>
          </div>
        )}
      </label>
    </div>
  );
};

export default FileUpload;