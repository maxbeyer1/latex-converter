import React, { useState, useEffect } from 'react';

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
  
  // Loading tips that rotate during the wait
  const loadingTips = [
    "Converting your content to LaTeX...",
    "Processing mathematical expressions...",
    "Formatting document structure...",
    "Generating PDF preview...",
    "Analyzing document structure...",
    "Optimizing LaTeX code...",
    "Rendering tables and figures...",
    "Preparing bibliography and citations...",
    "Making sure equations look beautiful...",
    "Adding finishing touches to your document..."
  ];
  
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Rotate through tips every 3 seconds
  useEffect(() => {
    if (fullScreen) {
      const tipInterval = setInterval(() => {
        setCurrentTipIndex(prevIndex => (prevIndex + 1) % loadingTips.length);
      }, 3000);
      
      // Create a timer that counts up
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      return () => {
        clearInterval(tipInterval);
        clearInterval(timer);
      };
    }
  }, [fullScreen, loadingTips.length]);
  
  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Create a more engaging spinner with multiple animation elements
  const spinner = (
    <div className="relative">
      {fullScreen ? (
        <div className="flex items-center justify-center">
          <div className="relative flex items-center justify-center w-28 h-28">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-b-transparent border-black opacity-20" 
                style={{ animationDuration: '3s' }}></div>
            
            {/* Middle spinning ring */}
            <div className="absolute w-20 h-20 animate-spin rounded-full border-2 border-l-transparent border-r-transparent border-black" 
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            
            {/* Orbital dots container */}
            <div className="absolute w-16 h-16 animate-orbit-rotate">
              {/* Orbital dots */}
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute h-2 w-2 rounded-full bg-black opacity-70 animate-orbit-pulse"
                  style={{
                    left: '50%',
                    top: '50%',
                    marginLeft: '-3px',
                    marginTop: '-3px',
                    transform: `rotate(${i * 60}deg) translateY(-28px)`,
                    animationDelay: `${i * 0.25}s`
                  }}
                ></div>
              ))}
            </div>
            
            {/* Timer in center */}
            <div className="absolute bg-white rounded-full h-10 w-10 flex items-center justify-center z-10 shadow-sm border border-gray-100">
              <div className="text-black font-mono text-xs">
                {elapsedTime > 0 && formatTime(elapsedTime)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`animate-spin ${sizeClass} border-2 border-black rounded-full border-t-transparent`}></div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="page-transition animate-fade-in">
        <div className="flex flex-col items-center max-w-md mx-auto p-8">
          <div className="mb-8 w-full">
            {/* Progress indicator bar */}
            <div className="w-full h-1 bg-gray-100 rounded-full mb-8 overflow-hidden">
              <div 
                className="h-full bg-black animate-pulse-subtle transition-all duration-300 ease-out"
                style={{ 
                  width: `${Math.min((currentTipIndex + 1) * 10, 100)}%`,
                  transitionProperty: 'width',
                  transitionDuration: '3s'
                }}
              ></div>
            </div>
            
            {/* Main spinner with timer */}
            {spinner}
            
            {/* Rotating tips */}
            <div className="h-20 mt-6 text-center overflow-hidden">
              <div 
                className="transition-all duration-300" 
                style={{ 
                  transform: `translateY(-${currentTipIndex * 5}rem)`,
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                {loadingTips.map((tip, i) => (
                  <p 
                    key={i} 
                    className={`h-20 font-medium flex items-center justify-center transition-all duration-300
                      ${i === currentTipIndex ? 'text-gray-800 scale-100' : 'text-gray-400 scale-95'}`}
                  >
                    {tip}
                  </p>
                ))}
              </div>
              {text && (
                <p className="text-sm text-gray-500 mt-2 animate-slide-up stagger-1">
                  {text}
                </p>
              )}
            </div>
            
            {/* Helpful info */}
            <div className="mt-16 text-xs text-gray-500 text-center p-4 animate-gradient rounded-lg">
              <p>This may take up to 30 seconds for complex documents.</p>
              <p className="mt-1">We're using advanced AI to ensure the best conversion possible.</p>
            </div>
          </div>
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