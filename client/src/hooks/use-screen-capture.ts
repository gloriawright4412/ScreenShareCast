import { useState, useCallback } from "react";
import { QualitySettings, getConstraintsFromQuality } from "@/lib/peerConnection";

interface ScreenCaptureHook {
  captureScreen: () => Promise<MediaStream>;
  isCaptureSupported: boolean;
  isCapturing: boolean;
  captureError: Error | null;
  stopCapture: () => void;
  updateQuality: (settings: QualitySettings) => Promise<void>;
}

export function useScreenCapture(): ScreenCaptureHook {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureError, setCaptureError] = useState<Error | null>(null);
  
  // Check if screen capture is supported in this browser
  const isCaptureSupported = !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getDisplayMedia
  );

  // Default quality settings
  const defaultSettings: QualitySettings = {
    resolution: "1080p",
    frameRate: 30,
    quality: "High"
  };

  // Capture screen function
  const captureScreen = useCallback(async (settings?: QualitySettings): Promise<MediaStream> => {
    if (!isCaptureSupported) {
      const error = new Error("Screen capture is not supported in this browser");
      setCaptureError(error);
      throw error;
    }

    try {
      setCaptureError(null);
      setIsCapturing(true);

      // Get display media with specified constraints
      const constraints = getConstraintsFromQuality(settings || defaultSettings);
      
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: constraints,
        audio: true,
      });

      // Add event listener for when stream ends (user stops sharing)
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsCapturing(false);
        setStream(null);
      });

      setStream(displayStream);
      setIsCapturing(true);
      return displayStream;
    } catch (error) {
      console.error("Error capturing screen:", error);
      setIsCapturing(false);
      if (error instanceof Error) {
        setCaptureError(error);
        throw error;
      } else {
        const newError = new Error("Failed to capture screen");
        setCaptureError(newError);
        throw newError;
      }
    }
  }, [isCaptureSupported]);

  // Stop capture function
  const stopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCapturing(false);
    }
  }, [stream]);

  // Update quality of current stream
  const updateQuality = useCallback(async (settings: QualitySettings): Promise<void> => {
    if (!stream) {
      return;
    }

    try {
      // Stop current tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Get new stream with updated quality
      const newStream = await captureScreen(settings);
      setStream(newStream);
    } catch (error) {
      console.error("Error updating quality:", error);
      throw error;
    }
  }, [stream, captureScreen]);

  return {
    captureScreen,
    isCaptureSupported,
    isCapturing,
    captureError,
    stopCapture,
    updateQuality
  };
}
