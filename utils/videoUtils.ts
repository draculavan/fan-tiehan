/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:video/mp4;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Formats seconds into MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Extracts a frame from a video file at a specific timestamp.
 */
export const captureFrame = async (videoFile: File, timestamp: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      video.currentTime = timestamp;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        // Limit resolution for performance/memory
        const scale = Math.min(1, 640 / video.videoWidth); 
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } else {
          reject(new Error("Could not get canvas context"));
        }
      } catch (e) {
        reject(e);
      }
    };

    video.onerror = () => {
      reject(new Error("Error loading video for frame capture"));
    };
  });
};