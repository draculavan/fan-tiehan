import React, { useState } from 'react';
import { SceneAnalysis } from '../types';

interface SceneCardProps {
  scene: SceneAnalysis;
  thumbnail?: string;
  index: number;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, thumbnail, index }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scene.imagePrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-500 transition-colors shadow-lg">
      {/* Thumbnail Section */}
      <div className="w-full md:w-64 h-40 md:h-auto flex-shrink-0 bg-black relative group">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={`Shot ${index + 1}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-xs">Processing Frame...</span>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-mono px-2 py-1 rounded">
          #{index + 1}
        </div>
        <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
          {scene.startTimeFormatted}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">
              {scene.shotType} <span className="text-gray-400 text-sm font-normal">| {scene.cameraMovement}</span>
            </h3>
            <span className="text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded border border-blue-900 whitespace-nowrap ml-2">
              {scene.mood}
            </span>
          </div>
          
          <p className="text-gray-300 text-sm leading-relaxed">
            {scene.description}
          </p>
        </div>

        <div className="bg-gray-900/80 rounded-md border border-gray-700 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center px-3 py-2 bg-gray-800/50 border-b border-gray-700">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
              Visual Prompt
            </span>
            <button 
              onClick={handleCopy}
              className="text-gray-400 hover:text-white transition-colors focus:outline-none flex items-center bg-gray-700/50 hover:bg-gray-600 px-2 py-1 rounded text-xs"
              title="Copy prompt to clipboard"
            >
              {copied ? (
                <span className="flex items-center text-green-400 font-semibold">
                  <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Prompt
                </span>
              )}
            </button>
          </div>
          <div className="p-3 bg-black/20 overflow-y-auto max-h-32">
             <p className="text-gray-400 text-xs font-mono whitespace-pre-wrap break-words leading-relaxed selection:bg-blue-500/30 selection:text-white">
              {scene.imagePrompt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneCard;