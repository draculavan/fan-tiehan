import React from 'react';

interface ProgressBarProps {
  progress: number;
  label: string;
  stage: string; // e.g., "Step 2 of 3"
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, stage }) => {
  // Ensure progress is between 0 and 100
  const validProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm shadow-xl fade-in">
      <div className="flex justify-between items-end mb-3">
        <span className="text-gray-200 font-medium text-sm animate-pulse">{label}</span>
        <span className="text-blue-400 text-xs font-bold uppercase tracking-wider bg-blue-900/20 px-2 py-1 rounded border border-blue-900/30">
          {stage}
        </span>
      </div>
      
      <div className="relative w-full bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
        {/* Background glow effect */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-gradient-to-r from-transparent via-white to-transparent transform -translate-x-full animate-[shimmer_2s_infinite]"></div>
        
        <div 
          className="bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${validProgress}%` }}
        >
          {/* Shine effect on the bar itself */}
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 blur-[1px]"></div>
        </div>
      </div>
      
      <div className="flex justify-end mt-2">
        <span className="text-xs text-gray-500 font-mono">{Math.round(validProgress)}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;