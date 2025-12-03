export interface SceneAnalysis {
  startTimeSeconds: number;
  endTimeSeconds: number;
  startTimeFormatted: string;
  description: string;
  shotType: string;
  cameraMovement: string;
  mood: string;
  imagePrompt: string;
}

export interface FrameData {
  timestamp: number;
  imageUrl: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING_VIDEO = 'PROCESSING_VIDEO', // Converting to base64
  ANALYZING_AI = 'ANALYZING_AI', // Waiting for Gemini
  EXTRACTING_FRAMES = 'EXTRACTING_FRAMES', // Grabbing images from video
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}