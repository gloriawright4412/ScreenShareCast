import { useState, useCallback } from "react";
import { QualitySettings, getConstraintsFromQuality } from "@/lib/peerConnection";

interface ScreenCaptureHook {
  captureScreen: (withMicrophone?: boolean, settings?: QualitySettings) => Promise<MediaStream>;
  captureMicrophone: () => Promise<MediaStream>;
  isCaptureSupported: boolean;
  isMicrophoneSupported: boolean;
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
  
  // Check if microphone capture is supported
  const isMicrophoneSupported = !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia
  );

  // Default quality settings
  const defaultSettings: QualitySettings = {
    resolution: "1080p",
    frameRate: 30,
    quality: "High"
  };

  // Capture microphone function
  const captureMicrophone = useCallback(async (): Promise<MediaStream> => {
    if (!isMicrophoneSupported) {
      const error = new Error("Microphone capture is not supported in this browser");
      setCaptureError(error);
      throw error;
    }

    try {
      setCaptureError(null);
      
      // Get user media with audio constraints
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      return micStream;
    } catch (error) {
      console.error("Error capturing microphone:", error);
      if (error instanceof Error) {
        setCaptureError(error);
        throw error;
      } else {
        const newError = new Error("Failed to capture microphone");
        setCaptureError(newError);
        throw newError;
      }
    }
  }, [isMicrophoneSupported]);

  // Capture screen function
  const captureScreen = useCallback(async (withMicrophone = false, settings?: QualitySettings): Promise<MediaStream> => {
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
        audio: true, // Try to capture system audio if available
      });

      // Add event listener for when stream ends (user stops sharing)
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsCapturing(false);
        setStream(null);
      });

      // If microphone is requested, combine with screen capture
      if (withMicrophone && isMicrophoneSupported) {
        try {
          const micStream = await captureMicrophone();
          
          // Create a new stream combining screen capture and microphone audio
          const combinedStream = new MediaStream();
          
          // Add all tracks from the display stream
          displayStream.getTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
          
          // Add audio tracks from the microphone stream
          micStream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
          
          setStream(combinedStream);
          setIsCapturing(true);
          return combinedStream;
        } catch (micError) {
          console.warn("Could not capture microphone, continuing with screen only:", micError);
          setStream(displayStream);
          setIsCapturing(true);
          return displayStream;
        }
      } else {
        setStream(displayStream);
        setIsCapturing(true);
        return displayStream;
      }
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
  }, [isCaptureSupported, isMicrophoneSupported, captureMicrophone]);

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
      const withMicrophone = stream.getAudioTracks().length > 0;
      
      // Stop current tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Get new stream with updated quality and same audio setup
      const newStream = await captureScreen(withMicrophone, settings);
      setStream(newStream);
    } catch (error) {
      console.error("Error updating quality:", error);
      throw error;
    }
  }, [stream, captureScreen]);

  return {
    captureScreen,
    captureMicrophone,
    isCaptureSupported,
    isMicrophoneSupported,
    isCapturing,
    captureError,
    stopCapture,
    updateQuality
  };
}
