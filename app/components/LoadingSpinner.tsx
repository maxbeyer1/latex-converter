import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }[size];

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin ${sizeClass} border-2 border-blue-500 rounded-full border-t-transparent`}></div>
    </div>
  );
};

export default LoadingSpinner;