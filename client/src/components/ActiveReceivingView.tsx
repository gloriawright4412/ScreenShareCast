import { useState, useEffect, useRef } from "react";
import { FolderClosed, Settings, Maximize, AlertTriangle, FileIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useShareContext } from "@/contexts/ShareContext";

const ActiveReceivingView = () => {
  const { 
    connectedDeviceName,
    stopSharing,
    remoteStream,
    setActiveView
  } = useShareContext();
  
  const [qualityPreference, setQualityPreference] = useState<number>(2); // 1=Performance, 2=Balanced, 3=Quality
  const [fitToScreen, setFitToScreen] = useState<boolean>(true);
  const [playAudio, setPlayAudio] = useState<boolean>(true);
  const [enhanceReadability, setEnhanceReadability] = useState<boolean>(false);
  const [connectionQuality, setConnectionQuality] = useState<number>(85);
  const [stats, setStats] = useState({
    latency: "120 ms",
    resolution: "1080p"
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup the remote stream in the video element
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, videoRef]);

  // Quality preference text
  const getQualityPreferenceText = () => {
    switch (qualityPreference) {
      case 1: return "Performance";
      case 2: return "Balanced";
      case 3: return "Quality";
      default: return "Balanced";
    }
  };

  // Handle audio toggle
  const handleAudioToggle = (checked: boolean) => {
    setPlayAudio(checked);
    
    if (videoRef.current) {
      videoRef.current.muted = !checked;
    }
  };

  // Request fullscreen
  const requestFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-1">Receiving Screen</h2>
          <div className="flex items-center text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            <span>Connected to </span>
            <span className="ml-1 font-medium">{connectedDeviceName || "Unknown Device"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-blue-50 text-blue-600 border-blue-200"
            onClick={() => setActiveView("fileTransfer")}
          >
            <FileIcon className="h-4 w-4 mr-1" />
            Share Files
          </Button>
          <Button
            onClick={stopSharing}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <FolderClosed className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden mb-6">
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mr-2">
              <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
              <line x1="2" y1="20" x2="2" y2="20"></line>
            </svg>
            <h3 className="text-white font-medium">{connectedDeviceName || "Unknown Device"}'s Screen</h3>
          </div>
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="text-white p-1 rounded hover:bg-gray-700"
              title="Full Screen"
              onClick={requestFullscreen}
            >
              <Maximize className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white p-1 rounded hover:bg-gray-700 ml-2"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="relative aspect-video bg-black">
          {remoteStream ? (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              className={`w-full h-full ${fitToScreen ? 'object-contain' : 'object-cover'}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse mb-2 mx-auto">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <p>Receiving screen content...</p>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Viewing Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-3">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <Label htmlFor="fitToggle" className="cursor-pointer">Fit to Screen</Label>
                </div>
                <Switch
                  id="fitToggle"
                  checked={fitToScreen}
                  onCheckedChange={setFitToScreen}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-3">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                  <Label htmlFor="audioReceiveToggle" className="cursor-pointer">Play Audio</Label>
                </div>
                <Switch
                  id="audioReceiveToggle"
                  checked={playAudio}
                  onCheckedChange={handleAudioToggle}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-3">
                    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                    <path d="M8.5 8.5a1 1 0 0 0 2 0 1 1 0 0 0-2 0"></path>
                    <path d="M14.5 13.5a1 1 0 0 0 2 0 1 1 0 0 0-2 0"></path>
                  </svg>
                  <Label htmlFor="enhanceReceiveToggle" className="cursor-pointer">Enhance Readability</Label>
                </div>
                <Switch
                  id="enhanceReceiveToggle"
                  checked={enhanceReadability}
                  onCheckedChange={setEnhanceReadability}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Quality</h3>
            
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="qualityPreference" className="text-sm font-medium">Quality Preference</label>
                <span className="text-xs text-gray-500">{getQualityPreferenceText()}</span>
              </div>
              <Slider
                id="qualityPreference"
                min={1}
                max={3}
                step={1}
                value={[qualityPreference]}
                onValueChange={(values) => setQualityPreference(values[0])}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Performance</span>
                <span>Balanced</span>
                <span>Quality</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Connection</h3>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Latency</p>
                <p className="font-medium">{stats.latency}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Resolution</p>
                <p className="font-medium">{stats.resolution}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium mb-2">Connection Quality</h4>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${connectionQuality}%` }}
                ></div>
              </div>
              <p className="text-right text-xs text-gray-500 mt-1">Excellent</p>
            </div>
            
            <Button
              variant="outline"
              className="mt-4 w-full flex items-center justify-center"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActiveReceivingView;
