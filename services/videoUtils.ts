/**
 * Extracts frames from a video file.
 * It samples frames evenly across the duration of the video.
 */
export const extractFramesFromVideo = async (
  videoFile: File,
  maxFrames: number = 10,
  quality: number = 0.8
): Promise<{ data: string; mimeType: string; timestamp: number }[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const frames: { data: string; mimeType: string; timestamp: number }[] = [];
    const mimeType = 'image/jpeg';

    if (!context) {
      reject(new Error('Could not create canvas context'));
      return;
    }

    // Create URL for the video file
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    // Wait for metadata to load to get duration and dimensions
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth; // Could resize here for optimization if needed
      canvas.height = video.videoHeight;
      
      // Calculate timestamps to sample
      const duration = video.duration;
      // Removed the Math.min(maxFrames, 15) cap to allow dense sampling
      const interval = duration / maxFrames; 
      const timestamps: number[] = [];
      
      for (let i = 0; i < maxFrames; i++) {
        timestamps.push(i * interval);
      }

      let currentFrameIndex = 0;

      const captureFrame = () => {
        if (currentFrameIndex >= timestamps.length) {
          // Cleanup
          URL.revokeObjectURL(videoUrl);
          resolve(frames);
          return;
        }

        const time = timestamps[currentFrameIndex];
        video.currentTime = time;
      };

      video.onseeked = () => {
        // Draw frame to canvas
        // Optional: Resize large videos to max 720p height to save tokens
        const scale = Math.min(1, 720 / video.videoHeight);
        const w = video.videoWidth * scale;
        const h = video.videoHeight * scale;
        
        canvas.width = w;
        canvas.height = h;
        context.drawImage(video, 0, 0, w, h);

        const dataUrl = canvas.toDataURL(mimeType, quality);
        // Remove prefix "data:image/jpeg;base64,"
        const base64Data = dataUrl.split(',')[1];
        
        frames.push({
          data: base64Data,
          mimeType: mimeType,
          timestamp: video.currentTime
        });

        currentFrameIndex++;
        captureFrame();
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(videoUrl);
        reject(e);
      };

      // Start capturing
      captureFrame();
    };

    video.onerror = (e) => {
      reject(e);
    };
  });
};