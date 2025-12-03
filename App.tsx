import React, { useState, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import SceneCard from './components/SceneCard';
import { analyzeVideoScenes } from './services/geminiService';
import { fileToGenerativePart, captureFrame } from './utils/videoUtils';
import { SceneAnalysis, AppState, FrameData } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [scenes, setScenes] = useState<SceneAnalysis[]>([]);
  const [frames, setFrames] = useState<Record<number, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    setVideoFile(file);
    setAppState(AppState.PROCESSING_VIDEO);
    setLoadingProgress('Converting video for analysis...');
    setErrorMsg('');
    setScenes([]);
    setFrames({});

    try {
      // 1. Prepare file for API
      const base64Data = await fileToGenerativePart(file);
      
      // 2. Call Gemini
      setAppState(AppState.ANALYZING_AI);
      setLoadingProgress('Gemini 3 Pro is analyzing cinematography & long takes...');
      
      const analysisResults = await analyzeVideoScenes(base64Data, file.type);
      setScenes(analysisResults);

      // 3. Extract Frames locally
      setAppState(AppState.EXTRACTING_FRAMES);
      const totalFrames = analysisResults.length;
      setLoadingProgress(`Preparing to extract ${totalFrames} keyframes...`);
      
      let completedCount = 0;

      // We extract frames in parallel but limited to avoid browser lag
      const framePromises = analysisResults.map(async (scene, idx) => {
         try {
             // Add a small delay based on index to spread out the heavy canvas work slightly
             await new Promise(r => setTimeout(r, idx * 200));
             
             const dataUrl = await captureFrame(file, scene.startTimeSeconds);
             setFrames(prev => ({ ...prev, [idx]: dataUrl }));
             
             completedCount++;
             setLoadingProgress(`Extracting visual keyframes (${completedCount}/${totalFrames})...`);
         } catch (e) {
             console.error(`Failed to capture frame for scene ${idx}`, e);
             completedCount++;
             setLoadingProgress(`Extracting visual keyframes (${completedCount}/${totalFrames})...`);
         }
      });

      await Promise.allSettled(framePromises);
      setAppState(AppState.COMPLETED);

    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred during analysis.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setScenes([]);
    setFrames({});
    setVideoFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Smart Scene Breakdown
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            AI-Powered Video Segmentation & Cinematography Analysis
          </p>
        </div>
        {appState !== AppState.IDLE && (
           <button 
             onClick={handleReset}
             className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
           >
             New Analysis
           </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto">
        {appState === AppState.IDLE && (
          <div className="fade-in">
             <div className="mb-8 text-center text-gray-400 max-w-2xl mx-auto">
               <p>Upload a video to automatically detect scenes, analyze camera movement, and generate visual prompts using Gemini 3 Pro.</p>
             </div>
            <UploadZone onFileSelect={handleFileSelect} isProcessing={false} />
          </div>
        )}

        {(appState === AppState.PROCESSING_VIDEO || appState === AppState.ANALYZING_AI || appState === AppState.EXTRACTING_FRAMES) && (
          <div className="flex flex-col items-center justify-center h-64 space-y-6 fade-in">
            <div className="relative w-20 h-20">
               <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-700 rounded-full"></div>
               <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Analyzing Video</h3>
              <p className="text-blue-400 font-mono">{loadingProgress}</p>
            </div>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-6 rounded-xl text-center fade-in">
            <h3 className="text-lg font-bold mb-2">Analysis Failed</h3>
            <p>{errorMsg}</p>
            <button 
              onClick={handleReset}
              className="mt-4 px-6 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results View */}
        {(appState === AppState.EXTRACTING_FRAMES || appState === AppState.COMPLETED) && scenes.length > 0 && (
          <div className="space-y-6 fade-in">
             <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center space-x-4">
                   <div className="text-2xl font-bold text-white">{scenes.length} <span className="text-base font-normal text-gray-500">Shots Detected</span></div>
                </div>
                {videoFile && (
                  <div className="text-sm text-gray-500 font-mono">
                    {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                )}
             </div>

             <div className="grid grid-cols-1 gap-6">
               {scenes.map((scene, index) => (
                 <SceneCard 
                    key={index} 
                    scene={scene} 
                    index={index} 
                    thumbnail={frames[index]}
                 />
               ))}
             </div>
          </div>
        )}
      </main>
      
      <footer className="mt-20 text-center text-gray-600 text-sm pb-8">
        Powered by Google Gemini 3 Pro & React
      </footer>
    </div>
  );
};

export default App;