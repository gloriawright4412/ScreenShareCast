import { useState, useEffect, useRef } from "react";
import { useShareContext } from "@/contexts/ShareContext";
import { motion } from "framer-motion";
import { 
  Record, 
  Pause, 
  StopCircle,
  Volume2, 
  VolumeX,
  ChevronLeft,
  Maximize,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * TV Mode component provides a simplified interface optimized for TV screens
 * and remote control navigation
 */
export default function TVMode() {
  const { 
    remoteStream, 
    connectedDeviceName,
    setActiveView,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    recordingState,
    recordingDuration
  } = useShareContext();

  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(0.8); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [keyboardNavIndex, setKeyboardNavIndex] = useState(0);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation for TV remotes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          setKeyboardNavIndex(prev => Math.max(prev - 1, 0));
          setShowControls(true);
          resetInactivityTimer();
          break;
        case "ArrowDown":
          setKeyboardNavIndex(prev => Math.min(prev + 1, 5)); // 5 is the number of controls
          setShowControls(true);
          resetInactivityTimer();
          break;
        case "ArrowLeft":
          // Decrease volume
          if (keyboardNavIndex === 1) {
            setVolume(prev => Math.max(prev - 0.1, 0));
            if (videoRef.current) videoRef.current.volume = Math.max(volume - 0.1, 0);
          }
          resetInactivityTimer();
          break;
        case "ArrowRight":
          // Increase volume
          if (keyboardNavIndex === 1) {
            setVolume(prev => Math.min(prev + 0.1, 1));
            if (videoRef.current) videoRef.current.volume = Math.min(volume + 0.1, 1);
          }
          resetInactivityTimer();
          break;
        case "Enter":
        case " ": // Space key
          handleControlAction(keyboardNavIndex);
          resetInactivityTimer();
          break;
        case "Escape":
          setActiveView("activeReceiving");
          break;
        default:
          // Any movement should show controls
          setShowControls(true);
          resetInactivityTimer();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyboardNavIndex, volume, setActiveView, resetInactivityTimer]);

  // Connect video element to remote stream
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.volume = volume;
    }
  }, [remoteStream, volume]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    resetInactivityTimer();
    
    // Clean up timer on unmount
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, []);

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000); // Hide controls after 5 seconds of inactivity
    
    setInactivityTimer(timer);
  }

  function handleControlAction(index: number) {
    switch (index) {
      case 0: // Exit TV Mode
        setActiveView("activeReceiving");
        break;
      case 1: // Volume
        toggleMute();
        break;
      case 2: // Record
        if (isRecording) {
          if (recordingState === "recording") {
            pauseRecording();
          } else if (recordingState === "paused") {
            resumeRecording();
          }
        } else {
          startRecording(true); // true = with audio
        }
        break;
      case 3: // Stop Recording
        if (isRecording) {
          stopRecording();
        }
        break;
      case 4: // Fullscreen
        requestFullscreen();
        break;
      case 5: // Settings (placeholder)
        // Future implementation
        break;
    }
  }

  function toggleMute() {
    if (videoRef.current) {
      const newMuteState = !isMuted;
      videoRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
    }
  }

  function requestFullscreen() {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  }

  // Format recording duration as MM:SS
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div 
      className="h-screen w-screen bg-black relative flex items-center justify-center overflow-hidden"
      onClick={() => {
        setShowControls(true);
        resetInactivityTimer();
      }}
      onMouseMove={() => {
        setShowControls(true);
        resetInactivityTimer();
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-contain"
      />

      {/* Controls overlay - shown or hidden based on activity */}
      <motion.div
        ref={controlsRef}
        className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/60"
        initial={{ opacity: 1 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: showControls ? "auto" : "none" }}
      >
        {/* Top bar with device name */}
        <div className="p-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="lg"
              className={`text-white text-xl flex items-center ${keyboardNavIndex === 0 ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}`}
              onClick={() => handleControlAction(0)}
            >
              <ChevronLeft className="h-6 w-6 mr-2" />
              Exit TV Mode
            </Button>
            <div className="ml-auto text-white text-xl font-medium">
              {connectedDeviceName ? `${connectedDeviceName}'s Screen` : "Connected Screen"}
            </div>
          </div>
        </div>

        {/* Bottom control bar */}
        <div className="p-6">
          {isRecording && (
            <div className="mb-4 flex items-center justify-center">
              <div className="bg-black/60 text-white px-4 py-2 rounded-full flex items-center">
                {recordingState === "recording" ? (
                  <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse mr-2"></span>
                ) : (
                  <span className="h-3 w-3 rounded-full bg-amber-500 mr-2"></span>
                )}
                <span>
                  {recordingState === "recording" ? "Recording: " : "Paused: "}
                  {formatDuration(recordingDuration)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-6">
            {/* Volume control */}
            <Button
              variant="ghost"
              size="lg"
              className={`text-white rounded-full p-4 ${keyboardNavIndex === 1 ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}`}
              onClick={() => handleControlAction(1)}
            >
              {isMuted ? (
                <VolumeX className="h-8 w-8" />
              ) : (
                <Volume2 className="h-8 w-8" />
              )}
            </Button>

            {/* Record */}
            <Button
              variant="ghost"
              size="lg"
              className={`text-white rounded-full p-4 ${keyboardNavIndex === 2 ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}`}
              onClick={() => handleControlAction(2)}
            >
              {isRecording ? (
                recordingState === "recording" ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Record className="h-8 w-8" />
                )
              ) : (
                <Record className="h-8 w-8" />
              )}
            </Button>

            {/* Stop Recording (only shown when recording) */}
            {isRecording && (
              <Button
                variant="ghost"
                size="lg"
                className={`text-white rounded-full p-4 ${keyboardNavIndex === 3 ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}`}
                onClick={() => handleControlAction(3)}
              >
                <StopCircle className="h-8 w-8" />
              </Button>
            )}

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="lg"
              className={`text-white rounded-full p-4 ${keyboardNavIndex === 4 ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}`}
              onClick={() => handleControlAction(4)}
            >
              <Maximize className="h-8 w-8" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="lg"
              className={`text-white rounded-full p-4 ${keyboardNavIndex === 5 ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}`}
              onClick={() => handleControlAction(5)}
            >
              <Settings className="h-8 w-8" />
            </Button>
          </div>
          
          {/* Volume indicator - only shown when adjusting volume */}
          {keyboardNavIndex === 1 && (
            <div className="w-full max-w-md mx-auto mt-4 bg-gray-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full" 
                style={{ width: `${volume * 100}%` }}
              ></div>
            </div>
          )}

          {/* Remote control instructions */}
          <div className="text-white/70 text-center mt-6 text-sm">
            <p>Use ← → to adjust volume | ↑ ↓ to navigate | Enter to select | Esc to exit</p>
          </div>
        </div>
      </motion.div>

      {/* Loading state when no stream */}
      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Waiting for Screen...</h2>
            <p className="text-gray-400">TV Mode is ready to display content</p>
          </div>
        </div>
      )}
    </div>
  );
}