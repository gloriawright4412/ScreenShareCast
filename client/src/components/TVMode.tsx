import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useShareContext } from "@/contexts/ShareContext";
import { Button } from "@/components/ui/button";
import { Settings, Maximize, Volume2, VolumeX, Download, CircleDot, Square } from "lucide-react";

/**
 * TV Mode component provides a simplified interface optimized for TV screens
 * and remote control navigation
 */
export default function TVMode() {
  const { 
    remoteStream, 
    connectedDeviceName, 
    stopSharing,
    isRecording,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    recordingState,
    downloadRecording,
    setActiveView
  } = useShareContext();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [quality, setQuality] = useState("High");
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    const checkActivity = () => {
      if (Date.now() - lastActivity > 5000) {
        setShowControls(false);
      }
    };
    
    const interval = setInterval(checkActivity, 1000);
    return () => clearInterval(interval);
  }, [lastActivity]);
  
  // Register event listeners for remote control and keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setLastActivity(Date.now());
      setShowControls(true);
      
      // Handle key navigation
      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
        case "Enter":
          // Handle remote control navigation
          break;
        case "Escape":
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
      }
    };
    
    const handleMouseMove = () => {
      setLastActivity(Date.now());
      setShowControls(true);
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isFullscreen]);
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      exitFullscreen();
    }
  };
  
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  };
  
  // Toggle audio mute
  const toggleMute = () => {
    if (remoteStream) {
      remoteStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (!isRecording) {
      startRecording(true); // Start with audio
    } else {
      if (recordingState === "paused") {
        resumeRecording();
      } else {
        pauseRecording();
      }
    }
  };
  
  // Stop recording and save
  const endRecording = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Main video display */}
      <div className="absolute inset-0 flex items-center justify-center">
        {remoteStream ? (
          <video
            ref={(videoRef) => {
              if (videoRef && remoteStream) {
                videoRef.srcObject = remoteStream;
              }
            }}
            autoPlay
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-white text-xl">Waiting for stream...</div>
        )}
      </div>

      {/* TV-optimized UI controls - made large and spaced out for easy remote navigation */}
      {showControls && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-white text-2xl font-bold">
                {connectedDeviceName ? `Viewing: ${connectedDeviceName}` : "TV Mode"}
              </div>
              <div className="text-white text-xl">
                Quality: {quality}
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-6">
              <Button 
                className="p-6 flex flex-col items-center justify-center gap-2"
                onClick={toggleMute}
                size="lg"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </Button>
              
              <Button 
                className="p-6 flex flex-col items-center justify-center gap-2"
                onClick={toggleFullscreen}
                size="lg"
              >
                <Maximize size={24} />
                <span>{isFullscreen ? "Exit Full" : "Full Screen"}</span>
              </Button>
              
              <Button 
                className="p-6 flex flex-col items-center justify-center gap-2"
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
              >
                {isRecording ? <Square size={24} /> : <CircleDot size={24} />}
                <span>{isRecording ? "Pause" : "Record"}</span>
              </Button>
              
              {isRecording && (
                <Button 
                  className="p-6 flex flex-col items-center justify-center gap-2"
                  onClick={endRecording}
                  variant="outline"
                  size="lg"
                >
                  <Download size={24} />
                  <span>Save</span>
                </Button>
              )}
              
              <Button 
                className="p-6 flex flex-col items-center justify-center gap-2"
                onClick={() => setActiveView("receiveScreen")}
                variant="outline"
                size="lg"
              >
                <Settings size={24} />
                <span>Settings</span>
              </Button>
              
              <Button 
                className="p-6 flex flex-col items-center justify-center gap-2"
                onClick={stopSharing}
                variant="destructive"
                size="lg"
              >
                <span>Exit TV Mode</span>
              </Button>
            </div>
            
            <div className="text-white/70 text-center mt-2 text-sm">
              Press any key or move mouse to show controls
            </div>
            
            {isRecording && (
              <div className="flex items-center justify-center">
                <div className="bg-red-500 h-3 w-3 rounded-full mr-2 animate-pulse"></div>
                <span className="text-white">Recording in progress</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Press any key to show controls hint */}
      {!showControls && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/40 px-4 py-2 rounded-full text-white/70 text-sm">
          Press any key or move mouse to show controls
        </div>
      )}
    </div>
  );
}