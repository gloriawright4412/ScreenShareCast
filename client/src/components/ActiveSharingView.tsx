import { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, FolderClosed, Layers, Pause, Settings, CirclePlus, Mic, MicOff, FileIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useShareContext } from "@/contexts/ShareContext";
import { webRTCManager } from "@/lib/webrtc";
import { QualitySettings } from "@/lib/peerConnection";

const ActiveSharingView = () => {
  const { 
    sessionCode, 
    setActiveView,
    connectedDevices,
    localStream,
    stopSharing,
    useMicrophone,
    setUseMicrophone
  } = useShareContext();
  
  const [sharingTime, setSharingTime] = useState<number>(0);
  const [resolutionValue, setResolutionValue] = useState<number>(2);
  const [framerateValue, setFramerateValue] = useState<number>(2);
  const [qualityValue, setQualityValue] = useState<number>(2);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [shareAudio, setShareAudio] = useState<boolean>(true);
  const [showCursor, setShowCursor] = useState<boolean>(true);
  const [enhanceReadability, setEnhanceReadability] = useState<boolean>(false);
  const [networkQuality, setNetworkQuality] = useState<number>(85);
  const [stats, setStats] = useState({
    bitrate: "5.2 Mbps",
    latency: "120 ms",
    packetLoss: "0.1%",
    devices: connectedDevices.length.toString()
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerInterval = useRef<number | null>(null);

  // Setup the local stream in the video element and sync the mic state
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      
      // Initialize audio tracks based on useMicrophone setting
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = useMicrophone;
      });
      setShareAudio(useMicrophone);
    }
  }, [localStream, videoRef, useMicrophone]);

  // Start the timer when the component mounts
  useEffect(() => {
    timerInterval.current = window.setInterval(() => {
      setSharingTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  // Format the sharing time as MM:SS
  const formatSharingTime = () => {
    const minutes = Math.floor(sharingTime / 60);
    const seconds = sharingTime % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Quality setting helpers
  const getResolutionText = () => {
    switch (resolutionValue) {
      case 1: return "720p";
      case 2: return "1080p";
      case 3: return "4K";
      default: return "1080p";
    }
  };

  const getFramerateText = () => {
    switch (framerateValue) {
      case 1: return "15 fps";
      case 2: return "30 fps";
      case 3: return "60 fps";
      default: return "30 fps";
    }
  };

  const getQualityText = () => {
    switch (qualityValue) {
      case 1: return "Low";
      case 2: return "High";
      case 3: return "Ultra";
      default: return "High";
    }
  };

  // Apply quality changes
  const applyQualityChanges = () => {
    const settings: QualitySettings = {
      resolution: getResolutionText() as "720p" | "1080p" | "4K",
      frameRate: parseInt(getFramerateText().split(" ")[0]) as 15 | 30 | 60,
      quality: getQualityText() as "Low" | "High" | "Ultra"
    };
    
    webRTCManager.setQualitySettings(settings);
  };

  // Toggle stream pausing
  const togglePause = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      
      videoTracks.forEach(track => {
        track.enabled = isPaused; // Toggle in the opposite direction of current state
      });
      
      setIsPaused(!isPaused);
    }
  };

  // Toggle audio sharing
  const handleAudioToggle = (checked: boolean) => {
    setShareAudio(checked);
    
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      
      audioTracks.forEach(track => {
        track.enabled = checked;
      });
    }
  };

  // Handle disconnect from a specific device
  const handleDisconnectDevice = (deviceId: string) => {
    // In a real implementation, this would send a disconnect signal to the specific client
    console.log("Disconnecting device:", deviceId);
  };

  // Device icon based on type
  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "mobile":
      case "phone":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        );
      case "tv":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
            <polyline points="17 2 12 7 7 2"></polyline>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        );
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-1">Sharing Your Screen</h2>
          <div className="flex items-center text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            <span>Live · </span>
            <span className="ml-1" id="sharingTime">{formatSharingTime()}</span>
            
            {useMicrophone && (
              <Badge variant="outline" className="ml-3 flex items-center gap-1 text-primary border-primary">
                <Mic className="h-3 w-3" />
                Microphone active
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={`${useMicrophone ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
            onClick={() => {
              setUseMicrophone(!useMicrophone);
              handleAudioToggle(!useMicrophone);
            }}
          >
            {useMicrophone ? <Mic className="h-4 w-4 mr-1" /> : <MicOff className="h-4 w-4 mr-1" />}
            {useMicrophone ? 'Mic On' : 'Mic Off'}
          </Button>
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
            Stop Sharing
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden mb-6">
            <div className="bg-gray-900 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Layers className="text-white mr-2 h-5 w-5" />
                <h3 className="text-white font-medium">Your Screen</h3>
              </div>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white p-1 rounded hover:bg-gray-700"
                  title={isPaused ? "Resume" : "Pause"}
                  onClick={togglePause}
                >
                  <Pause className="h-5 w-5" />
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
              {localStream ? (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Layers className="h-12 w-12 mb-2 mx-auto" />
                    <p>Your entire screen is being shared</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
            </CardHeader>
            <CardContent>
              {connectedDevices.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No devices connected</p>
                </div>
              ) : (
                connectedDevices.map((device) => (
                  <div 
                    key={device.id}
                    className="border-b border-gray-200 dark:border-gray-700 py-4 flex justify-between items-center last:border-b-0"
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 mr-4">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{device.name}</h4>
                        <p className="text-xs text-gray-500 flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                          Connected
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-red-500"
                      title="Disconnect"
                      onClick={() => handleDisconnectDevice(device.id)}
                    >
                      <FolderClosed className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
              
              <Button
                variant="outline"
                className="mt-4 w-full"
              >
                <CirclePlus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Streaming Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="activeResolution" className="text-sm font-medium">Resolution</label>
                    <span className="text-xs text-gray-500">{getResolutionText()}</span>
                  </div>
                  <Slider
                    id="activeResolution"
                    min={1}
                    max={3}
                    step={1}
                    value={[resolutionValue]}
                    onValueChange={(values) => setResolutionValue(values[0])}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="activeFramerate" className="text-sm font-medium">Frame Rate</label>
                    <span className="text-xs text-gray-500">{getFramerateText()}</span>
                  </div>
                  <Slider
                    id="activeFramerate"
                    min={1}
                    max={3}
                    step={1}
                    value={[framerateValue]}
                    onValueChange={(values) => setFramerateValue(values[0])}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="activeQuality" className="text-sm font-medium">Quality</label>
                    <span className="text-xs text-gray-500">{getQualityText()}</span>
                  </div>
                  <Slider
                    id="activeQuality"
                    min={1}
                    max={3}
                    step={1}
                    value={[qualityValue]}
                    onValueChange={(values) => setQualityValue(values[0])}
                  />
                </div>
                
                <div className="pt-2">
                  <Button
                    className="w-full bg-primary-light bg-opacity-10 text-primary hover:bg-opacity-20"
                    onClick={applyQualityChanges}
                  >
                    Apply Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Bitrate</p>
                  <p className="font-medium">{stats.bitrate}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Latency</p>
                  <p className="font-medium">{stats.latency}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Packet Loss</p>
                  <p className="font-medium">{stats.packetLoss}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Devices</p>
                  <p className="font-medium">{connectedDevices.length}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium mb-2">Network Quality</h4>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${networkQuality}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">Excellent</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-3">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    <Label htmlFor="audioToggle" className="cursor-pointer">Share Audio</Label>
                  </div>
                  <Switch
                    id="audioToggle"
                    checked={shareAudio}
                    onCheckedChange={handleAudioToggle}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-3">
                      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                      <path d="M13 13l6 6"></path>
                    </svg>
                    <Label htmlFor="mouseToggle" className="cursor-pointer">Show Mouse Cursor</Label>
                  </div>
                  <Switch 
                    id="mouseToggle"
                    checked={showCursor}
                    onCheckedChange={setShowCursor}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-3">
                      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                      <path d="M8.5 8.5a1 1 0 0 0 2 0 1 1 0 0 0-2 0"></path>
                      <path d="M14.5 13.5a1 1 0 0 0 2 0 1 1 0 0 0-2 0"></path>
                    </svg>
                    <Label htmlFor="enhanceToggle" className="cursor-pointer">Enhance Readability</Label>
                  </div>
                  <Switch
                    id="enhanceToggle"
                    checked={enhanceReadability}
                    onCheckedChange={setEnhanceReadability}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActiveSharingView;
