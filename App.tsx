import React, { useState, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import SceneCard from './components/SceneCard';
import ProgressBar from './components/ProgressBar';
import { analyzeVideoScenes } from './services/geminiService';
import { fileToGenerativePart, captureFrame } from './utils/videoUtils';
import { SceneAnalysis, AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [scenes, setScenes] = useState<SceneAnalysis[]>([]);
  const [frames, setFrames] = useState<Record<number, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Progress State
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [progressValue, setProgressValue] = useState<number>(0);

  // Effect to simulate progress during the indeterminate AI analysis phase
  useEffect(() => {
    let interval: any;
    if (appState === AppState.ANALYZING_AI) {
      // Start slightly above 10% (assuming file read is done)
      setProgressValue(15);
      
      // We want to simulate progress up to ~85% over roughly 10-15 seconds
      // which is a typical response time for Flash on medium videos.
      interval = setInterval(() => {
        setProgressValue(prev => {
          // Cap at 85% so we wait for the actual response
          if (prev >= 85) return 85;
          // Add random small increments to make it look organic
          return prev + (Math.random() * 1.5 + 0.2);
        });
      }, 400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [appState]);

  const handleFileSelect = async (file: File) => {
    setVideoFile(file);
    setAppState(AppState.PROCESSING_VIDEO);
    setLoadingProgress('Reading video file...');
    setProgressValue(5);
    setErrorMsg('');
    setScenes([]);
    setFrames({});

    try {
      // Stage 1: File Read
      // Normally fast for <20MB, so we just await it.
      const base64Data = await fileToGenerativePart(file);
      setProgressValue(10); // File read complete
      
      // Stage 2: AI Analysis
      setAppState(AppState.ANALYZING_AI);
      setLoadingProgress('Gemini 2.5 Flash is analyzing scenes...');
      // The useEffect above will handle 10% -> 85% simulation
      
      const analysisResults = await analyzeVideoScenes(base64Data, file.type);
      setScenes(analysisResults);
      
      // Stage 3: Frame Extraction
      // Jump to 85% immediately upon receiving data, then fill the rest based on real frame processing
      setProgressValue(85);
      setAppState(AppState.EXTRACTING_FRAMES);
      const totalFrames = analysisResults.length;
      setLoadingProgress(`Processing ${totalFrames} scenes...`);
      
      let completedCount = 0;

      // We extract frames in parallel but limited to avoid browser lag
      const framePromises = analysisResults.map(async (scene, idx) => {
         try {
             // Add a small delay based on index to spread out the heavy canvas work slightly
             await new Promise(r => setTimeout(r, idx * 200));
             
             const dataUrl = await captureFrame(file, scene.startTimeSeconds);
             setFrames(prev => ({ ...prev, [idx]: dataUrl }));
             
             completedCount++;
             
             // Calculate remaining 15% (85 -> 100)
             const extractionProgress = (completedCount / totalFrames) * 15;
             const totalProgress = 85 + extractionProgress;
             
             setProgressValue(totalProgress);
             setLoadingProgress(`Extracting keyframe ${completedCount}/${totalFrames}...`);
         } catch (e) {
             console.error(`Failed to capture frame for scene ${idx}`, e);
             completedCount++;
             // Still increment progress even on error
             const extractionProgress = (completedCount / totalFrames) * 15;
             setProgressValue(85 + extractionProgress);
         }
      });

      await Promise.allSettled(framePromises);
      setProgressValue(100);
      setLoadingProgress('Analysis Complete!');
      // Small delay to let user see 100%
      setTimeout(() => {
        setAppState(AppState.COMPLETED);
      }, 500);

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
    setProgressValue(0);
  };

  const getStageLabel = () => {
    if (appState === AppState.PROCESSING_VIDEO) return "Step 1 of 3";
    if (appState === AppState.ANALYZING_AI) return "Step 2 of 3";
    if (appState === AppState.EXTRACTING_FRAMES) return "Step 3 of 3";
    return "";
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
               <p>Upload a video to automatically detect scenes, analyze camera movement, and generate visual prompts using Gemini 2.5 Flash.</p>
             </div>
            <UploadZone onFileSelect={handleFileSelect} isProcessing={false} />
          </div>
        )}

        {/* Progress View */}
        {(appState === AppState.PROCESSING_VIDEO || appState === AppState.ANALYZING_AI || appState === AppState.EXTRACTING_FRAMES) && (
          <div className="flex flex-col items-center justify-center h-64 space-y-6 fade-in w-full">
            <ProgressBar 
              progress={progressValue} 
              label={loadingProgress} 
              stage={getStageLabel()} 
            />
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-6 rounded-xl text-center fade-in">
            <h3 className="text-lg font-bold mb-2">Analysis Failed</h3>
            <p>{errorMsg}</p>
            <p className="text-sm text-red-300 mt-2">Try uploading a smaller video file (under 20MB) to prevent network timeouts.</p>
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
        Powered by Google Gemini 2.5 Flash & React
      </footer>
    </div>
  );
};

export default App;