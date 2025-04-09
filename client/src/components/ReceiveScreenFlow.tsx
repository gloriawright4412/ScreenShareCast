import { useState } from "react";
import { ArrowLeft, Camera, RefreshCw, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeInput } from "@/components/ui/code-input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useShareContext } from "@/contexts/ShareContext";
import { sendWebSocketMessage } from "@/lib/websocket";

const ReceiveScreenFlow = () => {
  const { toast } = useToast();
  const { 
    setActiveView, 
    clientId,
    setConnecting,
    setSessionCode,
    setIsHost
  } = useShareContext();
  
  const [connectionCode, setConnectionCode] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [nearbyDevices, setNearbyDevices] = useState<any[]>([]);

  // Handle connection code submit
  const handleCodeConnect = async () => {
    if (!connectionCode || connectionCode.length < 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit connection code",
        variant: "destructive",
      });
      return;
    }

    try {
      setConnecting(true);
      
      // Join the session via WebSocket
      sendWebSocketMessage("join_session", {
        sessionCode: connectionCode,
        clientId
      });
      
      // Store the session code
      setSessionCode(connectionCode);
      setIsHost(false);
      
    } catch (error) {
      console.error("Error joining session:", error);
      setConnecting(false);
      toast({
        title: "Connection failed",
        description: "Could not connect to the sharing device",
        variant: "destructive",
      });
    }
  };

  // Handle QR code scanning
  const handleScanQRCode = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera not supported",
        description: "Your device does not support camera access",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    
    // In a real implementation, we would initiate QR code scanning here
    // For now, we'll just show a toast and set up a timeout to simulate scanning
    toast({
      title: "Scanning QR code",
      description: "Position the QR code in front of your camera",
    });
    
    // Simulate QR code scanning after 3 seconds
    setTimeout(() => {
      setScanning(false);
      
      // Generate a fake session code for demonstration
      const scannedCode = "123-456";
      setConnectionCode(scannedCode);
      
      toast({
        title: "QR code detected",
        description: `Connection code: ${scannedCode}`,
      });
    }, 3000);
  };

  // Handle refresh nearby devices
  const handleRefreshNearbyDevices = () => {
    setRefreshing(true);
    
    // Simulate refreshing the nearby devices list
    setTimeout(() => {
      setRefreshing(false);
      
      // No devices found for this demo
      toast({
        title: "No devices found",
        description: "No sharing devices found nearby",
      });
    }, 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Receive a Screen</h2>
        <p className="text-gray-600 dark:text-gray-300">View another device's screen on this device.</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Enter connection code</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Ask the person sharing their screen for the 6-digit code.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <CodeInput
                length={6}
                onComplete={(code) => setConnectionCode(code)}
                value={connectionCode}
                onChange={(value) => setConnectionCode(value)}
                className="flex-1"
                autoFocus
              />
            </div>
            <Button
              className="bg-primary hover:bg-primary-dark text-white"
              onClick={handleCodeConnect}
              disabled={!connectionCode || connectionCode.length < 6}
            >
              Connect
            </Button>
          </div>
          
          <div className="relative">
            <Separator className="my-4" />
            <div className="relative flex justify-center -mt-3">
              <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 text-xs">or</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Scan QR code</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Scan the QR code displayed on the sharing device.
          </p>
          
          <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <div className="mb-4">
              <Camera className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Position the QR code in front of your camera
            </p>
            
            <Button
              className="bg-secondary hover:bg-secondary-dark text-white mx-auto"
              onClick={handleScanQRCode}
              disabled={scanning}
            >
              {scanning ? "Scanning..." : "Scan QR Code"}
              <Camera className="ml-2 h-4 w-4" />
            </Button>
            
            <p className="text-sm text-gray-500 mt-4">
              Camera permission required for scanning
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Nearby devices</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Select a device that's sharing their screen nearby:
          </p>
          
          {nearbyDevices.length === 0 ? (
            <div className="text-center mt-4">
              <p className="text-gray-500">No devices found nearby</p>
              <Button
                variant="link"
                className="mt-2 text-primary"
                onClick={handleRefreshNearbyDevices}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          ) : (
            nearbyDevices.map((device) => (
              <div
                key={device.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 flex justify-between items-center hover:border-primary cursor-pointer transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 mr-4">
                    {/* Device icon based on type */}
                  </div>
                  <div>
                    <h3 className="font-medium">{device.name}</h3>
                    <p className="text-xs text-gray-500">Ready to connect</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))
          )}
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
      </div>
    </div>
  );
};

export default ReceiveScreenFlow;
