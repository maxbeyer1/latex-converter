import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  fullScreen = false
}) => {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  }[size];

  const spinner = (
    <div className={`animate-spin ${sizeClass} border-2 border-black rounded-full border-t-transparent`}></div>
  );

  if (fullScreen) {
    return (
      <div className="page-transition animate-fade-in">
        <div className="flex flex-col items-center">
          {spinner}
          {text && (
            <p className="mt-4 font-medium text-gray-800 animate-slide-up stagger-1">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {spinner}
      {text && <p className="ml-3 text-sm text-gray-700">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;