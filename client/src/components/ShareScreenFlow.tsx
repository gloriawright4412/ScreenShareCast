import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Copy, Laptop, Layers, Chrome, Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useShareContext } from "@/contexts/ShareContext";
import { webRTCManager } from "@/lib/webrtc";
import { sendWebSocketMessage } from "@/lib/websocket";
import { QualitySettings } from "@/lib/peerConnection";

const ShareScreenFlow = () => {
  const { toast } = useToast();
  const { 
    setActiveView, 
    sessionCode, 
    clientId,
    setShowPermissionRequest,
    setConnecting,
    useMicrophone,
    setUseMicrophone
  } = useShareContext();
  
  const [shareOption, setShareOption] = useState<string>("entire-screen");
  const [resolutionValue, setResolutionValue] = useState<number>(2); // 1=720p, 2=1080p, 3=4K
  const [framerateValue, setFramerateValue] = useState<number>(2); // 1=15fps, 2=30fps, 3=60fps
  const [qualityValue, setQualityValue] = useState<number>(2); // 1=Low, 2=High, 3=Ultra
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds

  // Create timer for code expiration
  useEffect(() => {
    if (!sessionCode) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionCode]);

  // Format the time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Map slider values to actual settings
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

  // Apply quality settings to WebRTC
  const applyQualitySettings = () => {
    const settings: QualitySettings = {
      resolution: getResolutionText() as "720p" | "1080p" | "4K",
      frameRate: parseInt(getFramerateText().split(" ")[0]) as 15 | 30 | 60,
      quality: getQualityText() as "Low" | "High" | "Ultra"
    };
    
    webRTCManager.setQualitySettings(settings);
  };

  // Copy session code to clipboard
  const copyCodeToClipboard = () => {
    if (!sessionCode) return;
    
    navigator.clipboard.writeText(sessionCode)
      .then(() => {
        toast({
          title: "Code copied",
          description: "Connection code copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy code to clipboard",
          variant: "destructive",
        });
      });
  };

  // Start screen sharing
  const startSharing = async () => {
    try {
      // Apply quality settings
      applyQualitySettings();
      
      // Request screen capture permission
      setShowPermissionRequest(true);
    } catch (error) {
      console.error("Error starting screen sharing:", error);
      toast({
        title: "Error",
        description: "Could not start screen sharing",
        variant: "destructive",
      });
    }
  };

  // Generate QR code URL
  const getQRCodeUrl = () => {
    if (!sessionCode) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=screencast-${sessionCode}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Share Your Screen</h2>
        <p className="text-gray-600 dark:text-gray-300">Let others view what's on your device's screen.</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Step 1: Select what to share</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Button
              variant="outline"
              className={`p-4 h-auto text-center transition-all ${
                shareOption === "entire-screen" 
                  ? "bg-primary bg-opacity-10 border-primary" 
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
              onClick={() => setShareOption("entire-screen")}
            >
              <div className="flex flex-col items-center">
                <Laptop className={`h-6 w-6 mb-2 ${
                  shareOption === "entire-screen" ? "text-primary" : "text-gray-600 dark:text-gray-300"
                }`} />
                <p className={shareOption === "entire-screen" ? "font-medium text-primary" : "font-medium"}>
                  Entire Screen
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className={`p-4 h-auto text-center transition-all ${
                shareOption === "application" 
                  ? "bg-primary bg-opacity-10 border-primary" 
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
              onClick={() => setShareOption("application")}
            >
              <div className="flex flex-col items-center">
                <Layers className={`h-6 w-6 mb-2 ${
                  shareOption === "application" ? "text-primary" : "text-gray-600 dark:text-gray-300"
                }`} />
                <p className={shareOption === "application" ? "font-medium text-primary" : "font-medium"}>
                  Application Window
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className={`p-4 h-auto text-center transition-all ${
                shareOption === "browser-tab" 
                  ? "bg-primary bg-opacity-10 border-primary" 
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
              onClick={() => setShareOption("browser-tab")}
            >
              <div className="flex flex-col items-center">
                <Chrome className={`h-6 w-6 mb-2 ${
                  shareOption === "browser-tab" ? "text-primary" : "text-gray-600 dark:text-gray-300"
                }`} />
                <p className={shareOption === "browser-tab" ? "font-medium text-primary" : "font-medium"}>
                  Chrome Tab
                </p>
              </div>
            </Button>
          </div>
          
          <h3 className="font-medium mb-4">Step 2: Quality settings</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="resolution" className="text-sm font-medium">Resolution</label>
                <span className="text-xs text-gray-500">{getResolutionText()}</span>
              </div>
              <Slider
                id="resolution"
                min={1}
                max={3}
                step={1}
                value={[resolutionValue]}
                onValueChange={(values) => setResolutionValue(values[0])}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>720p</span>
                <span>1080p</span>
                <span>4K</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="framerate" className="text-sm font-medium">Frame Rate</label>
                <span className="text-xs text-gray-500">{getFramerateText()}</span>
              </div>
              <Slider
                id="framerate"
                min={1}
                max={3}
                step={1}
                value={[framerateValue]}
                onValueChange={(values) => setFramerateValue(values[0])}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15 fps</span>
                <span>30 fps</span>
                <span>60 fps</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="quality" className="text-sm font-medium">Quality</label>
                <span className="text-xs text-gray-500">{getQualityText()}</span>
              </div>
              <Slider
                id="quality"
                min={1}
                max={3}
                step={1}
                value={[qualityValue]}
                onValueChange={(values) => setQualityValue(values[0])}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>High</span>
                <span>Ultra</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Step 3: Connect with another device</h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <p className="mb-3 text-gray-600 dark:text-gray-300">Share this code with the receiving device:</p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center mb-4">
                <div className="text-2xl font-bold tracking-widest text-primary">
                  {sessionCode || "Generating..."}
                </div>
                <p className="text-sm text-gray-500 mt-2">Code expires in {formatTimeLeft()}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={copyCodeToClipboard}
                disabled={!sessionCode}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>
            
            <div className="flex-1">
              <p className="mb-3 text-gray-600 dark:text-gray-300">Or scan this QR code:</p>
              <div className="bg-white p-2 rounded-lg inline-block mb-2">
                {sessionCode ? (
                  <img 
                    src={getQRCodeUrl()} 
                    alt="QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">Generating...</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">Scan with the ScreenCast app or your camera</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Audio Options</h3>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <Mic className={`h-5 w-5 ${useMicrophone ? "text-primary" : "text-gray-400"}`} />
              <Label htmlFor="micToggle" className="cursor-pointer">
                Share microphone audio
              </Label>
            </div>
            <Switch
              id="micToggle"
              checked={useMicrophone}
              onCheckedChange={setUseMicrophone}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2 pl-8">
            {useMicrophone 
              ? "Your voice will be transmitted to viewers. Perfect for presentations and online classes."
              : "Only screen content will be shared. Enable microphone to speak to viewers."
            }
          </p>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setActiveView("home")}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={startSharing}
          className="flex items-center bg-primary hover:bg-primary-dark text-white"
        >
          Start Sharing
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ShareScreenFlow;
