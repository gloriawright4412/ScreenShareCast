import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { webRTCManager } from "@/lib/webrtc";
import { useToast } from "@/hooks/use-toast";
import { generateShareCode } from "@/utils/generateShareCode";
import { sendWebSocketMessage, addMessageListener, removeMessageListener, getClientId } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";
import { useScreenCapture } from "@/hooks/use-screen-capture";
import { fileTransferManager, FileTransferProgress } from "@/lib/fileTransfer";
import { useScreenRecorder } from "@/hooks/use-screen-recorder";
import { RecordingInfo } from "@/lib/screenRecorder";

// Types
export type DeviceType = "laptop" | "mobile" | "tv";

export interface ConnectedDevice {
  id: string;
  name: string;
  type: DeviceType;
}

export type ActiveView = "home" | "shareScreen" | "receiveScreen" | "activeSharing" | "activeReceiving" | "fileTransfer" | "recordings" | "tvMode";

// Context interface
interface ShareContextProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  clientId: string | null;
  isHost: boolean;
  setIsHost: (isHost: boolean) => void;
  sessionCode: string | null;
  setSessionCode: (code: string | null) => void;
  connecting: boolean;
  setConnecting: (connecting: boolean) => void;
  showPermissionRequest: boolean;
  setShowPermissionRequest: (show: boolean) => void;
  hidePermissionRequest: () => void;
  connectionSuccess: boolean;
  setConnectionSuccess: (success: boolean) => void;
  hideConnectionSuccess: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectedDeviceName: string | null;
  setConnectedDeviceName: (name: string | null) => void;
  connectedDevices: ConnectedDevice[];
  generateSessionCode: () => void;
  cancelConnection: () => void;
  useMicrophone: boolean;
  setUseMicrophone: (useMic: boolean) => void;
  requestScreenCapture: () => Promise<void>;
  stopSharing: () => void;
  // File transfer methods
  sendFile: (file: File) => Promise<string>;
  cancelFileTransfer: (fileId: string) => boolean;
  fileTransfers: FileTransferProgress[];
  receivedFiles: File[];
  // Screen recording methods
  startRecording: (includeAudio?: boolean) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  downloadRecording: (recordingId: string) => void;
  deleteRecording: (recordingId: string) => void;
  recordings: RecordingInfo[];
  isRecording: boolean;
  recordingDuration: number;
  recordingState: string;
}

// Create context with default values
const ShareContext = createContext<ShareContextProps>({
  activeView: "home",
  setActiveView: () => {},
  clientId: null,
  isHost: false,
  setIsHost: () => {},
  sessionCode: null,
  setSessionCode: () => {},
  connecting: false,
  setConnecting: () => {},
  showPermissionRequest: false,
  setShowPermissionRequest: () => {},
  hidePermissionRequest: () => {},
  connectionSuccess: false,
  setConnectionSuccess: () => {},
  hideConnectionSuccess: () => {},
  localStream: null,
  remoteStream: null,
  connectedDeviceName: null,
  setConnectedDeviceName: () => {},
  connectedDevices: [],
  generateSessionCode: () => {},
  cancelConnection: () => {},
  useMicrophone: false,
  setUseMicrophone: () => {},
  requestScreenCapture: async () => {},
  stopSharing: () => {},
  // File transfer defaults
  sendFile: async () => '',
  cancelFileTransfer: () => false,
  fileTransfers: [],
  receivedFiles: [],
  // Screen recording defaults
  startRecording: async () => {},
  stopRecording: () => {},
  pauseRecording: () => {},
  resumeRecording: () => {},
  cancelRecording: () => {},
  downloadRecording: () => {},
  deleteRecording: () => {},
  recordings: [],
  isRecording: false,
  recordingDuration: 0,
  recordingState: 'inactive'
});

// Provider component
export const ShareProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { captureScreen } = useScreenCapture();
  const { 
    startRecording: startScreenRecording,
    stopRecording: stopScreenRecording,
    pauseRecording: pauseScreenRecording,
    resumeRecording: resumeScreenRecording,
    cancelRecording: cancelScreenRecording,
    downloadRecording: downloadScreenRecording,
    deleteRecording: deleteScreenRecording,
    recordings: screenRecordings,
    isRecording: isScreenRecording,
    recordingState: screenRecordingState,
    duration: recordingDuration,
    formatDuration
  } = useScreenRecorder();
  
  // State
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [isHost, setIsHost] = useState<boolean>(true);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState<boolean>(false);
  const [connectionSuccess, setConnectionSuccess] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false);
  
  // File transfer state
  const [fileTransfers, setFileTransfers] = useState<FileTransferProgress[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<File[]>([]);
  
  // Hide permission request modal
  const hidePermissionRequest = useCallback(() => {
    setShowPermissionRequest(false);
  }, []);
  
  // Hide connection success modal
  const hideConnectionSuccess = useCallback(() => {
    setConnectionSuccess(false);
    
    // Navigate to appropriate view based on host status
    if (isHost) {
      setActiveView("activeSharing");
    } else {
      setActiveView("activeReceiving");
    }
  }, [isHost]);
  
  // Generate a unique session code
  const generateSessionCode = useCallback(() => {
    const code = generateShareCode();
    setSessionCode(code);
    
    // Create session in signaling server
    const clientId = getClientId();
    if (clientId) {
      sendWebSocketMessage("create_session", {
        sessionCode: code,
        clientId
      });
      
      // Also save session in the database
      apiRequest("POST", "/api/sessions", {
        sessionCode: code,
        hostId: clientId
      }).catch(error => {
        console.error("Error creating session:", error);
      });
    }
  }, []);
  
  // Cancel an in-progress connection attempt
  const cancelConnection = useCallback(() => {
    setConnecting(false);
    webRTCManager.disconnect();
  }, []);
  
  // Request screen capture from user
  const requestScreenCapture = useCallback(async () => {
    try {
      hidePermissionRequest();
      setConnecting(true);
      
      // Request screen capture with microphone if enabled
      const stream = await captureScreen(useMicrophone);
      setLocalStream(stream);
      
      // Setup WebRTC for the captured stream
      webRTCManager.onTrack((stream) => {
        setRemoteStream(stream);
      });
      
      webRTCManager.onConnectionStateChange((state) => {
        console.log("Connection state changed:", state);
        
        if (state === "connected") {
          setConnecting(false);
          setConnectionSuccess(true);
        } else if (state === "disconnected" || state === "failed" || state === "closed") {
          setConnecting(false);
          toast({
            title: "Connection lost",
            description: "The connection was interrupted",
            variant: "destructive",
          });
        }
      });
      
      // Store the stream and set up WebRTC
      const localStreamInstance = await webRTCManager.startScreenSharing();
      setLocalStream(localStreamInstance);
      
      // Show success after 1 second to simulate connection (in a real app we'd wait for the actual connection)
      setTimeout(() => {
        setConnecting(false);
        setConnectionSuccess(true);
        // Add a fake connected device (in a real app this would come from WebRTC)
        setConnectedDevices([
          {
            id: "device-1",
            name: "Connected Device",
            type: "mobile"
          }
        ]);
      }, 1000);
    } catch (error) {
      console.error("Error capturing screen:", error);
      setConnecting(false);
      
      toast({
        title: "Permission denied",
        description: "Screen capture permission was denied",
        variant: "destructive",
      });
    }
  }, [captureScreen, hidePermissionRequest, toast, useMicrophone]);
  
  // Stop sharing screen or disconnect from shared screen
  const stopSharing = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    webRTCManager.disconnect();
    setRemoteStream(null);
    setConnectedDevices([]);
    setActiveView("home");
  }, [localStream]);
  
  // Send a file to the connected peer
  const sendFile = useCallback(async (file: File): Promise<string> => {
    try {
      // Ensure we have a connection before sending
      if (!connectionSuccess) {
        throw new Error("No active connection");
      }
      
      const fileId = await fileTransferManager.sendFile(file);
      return fileId;
    } catch (error) {
      console.error("Error sending file:", error);
      
      toast({
        title: "File transfer failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [connectionSuccess, toast]);
  
  // Cancel an in-progress file transfer
  const cancelFileTransfer = useCallback((fileId: string): boolean => {
    return fileTransferManager.cancelTransfer(fileId);
  }, []);
  
  // Screen recording methods
  const startRecording = useCallback(async (includeAudio = false) => {
    try {
      if (!localStream) {
        toast({
          title: "Screen capture required",
          description: "Please start screen sharing before recording",
          variant: "destructive",
        });
        return;
      }
      
      await startScreenRecording(localStream, {
        includeAudio,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: includeAudio ? 128000 : undefined,
      });
      
      toast({
        title: "Recording started",
        description: "Your screen is now being recorded",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [localStream, startScreenRecording, toast]);
  
  const stopRecording = useCallback(() => {
    try {
      stopScreenRecording();
      toast({
        title: "Recording completed",
        description: "Your recording has been saved",
      });
    } catch (error) {
      console.error("Error stopping recording:", error);
      toast({
        title: "Error stopping recording",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [stopScreenRecording, toast]);
  
  const pauseRecording = useCallback(() => {
    try {
      pauseScreenRecording();
      toast({
        title: "Recording paused",
        description: "Your recording has been paused",
      });
    } catch (error) {
      console.error("Error pausing recording:", error);
      toast({
        title: "Error pausing recording",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [pauseScreenRecording, toast]);
  
  const resumeRecording = useCallback(() => {
    try {
      resumeScreenRecording();
      toast({
        title: "Recording resumed",
        description: "Your recording has been resumed",
      });
    } catch (error) {
      console.error("Error resuming recording:", error);
      toast({
        title: "Error resuming recording",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [resumeScreenRecording, toast]);
  
  const cancelRecording = useCallback(() => {
    try {
      cancelScreenRecording();
      toast({
        title: "Recording cancelled",
        description: "Your recording has been discarded",
      });
    } catch (error) {
      console.error("Error cancelling recording:", error);
      toast({
        title: "Error cancelling recording",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [cancelScreenRecording, toast]);
  
  const downloadRecording = useCallback((recordingId: string) => {
    try {
      const recording = screenRecordings.find(rec => rec.id === recordingId);
      if (recording) {
        downloadScreenRecording(recording);
        toast({
          title: "Download started",
          description: `${recording.name} is being downloaded`,
        });
      } else {
        toast({
          title: "Recording not found",
          description: "The requested recording could not be found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error downloading recording:", error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [downloadScreenRecording, screenRecordings, toast]);
  
  const deleteRecording = useCallback((recordingId: string) => {
    try {
      deleteScreenRecording(recordingId);
      toast({
        title: "Recording deleted",
        description: "The recording has been removed",
      });
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [deleteScreenRecording, toast]);
  
  // Set up WebSocket message listeners
  useEffect(() => {
    const handleSessionCreated = (data: any) => {
      if (data.success) {
        console.log("Session created successfully:", data.sessionCode);
      } else {
        toast({
          title: "Session creation failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    };
    
    const handleSessionJoined = (data: any) => {
      if (data.success) {
        console.log("Joined session:", data.sessionCode, "Host ID:", data.hostId);
        setConnecting(false);
        setConnectionSuccess(true);
        setConnectedDeviceName("Host Device");
      } else {
        setConnecting(false);
        toast({
          title: "Failed to join session",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    };
    
    const handleClientJoined = (data: any) => {
      console.log("Client joined:", data.clientId, "Session:", data.sessionCode);
      
      // Create WebRTC connection and send an offer
      setConnectedDevices(prev => [
        ...prev,
        {
          id: data.clientId,
          name: "Connected Device",
          type: "mobile"
        }
      ]);
      
      // In a real implementation, we would set up WebRTC here
      webRTCManager.setSessionDetails(data.sessionCode, true, data.clientId);
      webRTCManager.createHostConnection().catch(error => {
        console.error("Error creating host connection:", error);
      });
    };
    
    const handleParticipantDisconnected = (data: any) => {
      console.log("Participant disconnected:", data.clientId);
      
      // Remove from connected devices
      setConnectedDevices(prev => prev.filter(device => device.id !== data.clientId));
    };
    
    // Add listeners
    addMessageListener("session_created", handleSessionCreated);
    addMessageListener("session_joined", handleSessionJoined);
    addMessageListener("client_joined", handleClientJoined);
    addMessageListener("participant_disconnected", handleParticipantDisconnected);
    
    // Cleanup
    return () => {
      removeMessageListener("session_created", handleSessionCreated);
      removeMessageListener("session_joined", handleSessionJoined);
      removeMessageListener("client_joined", handleClientJoined);
      removeMessageListener("participant_disconnected", handleParticipantDisconnected);
    };
  }, [toast]);
  
  // Set up file transfer progress listener
  useEffect(() => {
    const progressHandler = (progress: FileTransferProgress) => {
      setFileTransfers(prev => {
        const index = prev.findIndex(p => p.fileName === progress.fileName);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = progress;
          return updated;
        } else {
          return [...prev, progress];
        }
      });
      
      // Show toast notifications for completed or failed transfers
      if (progress.status === 'completed') {
        toast({
          title: "File received",
          description: `Received ${progress.fileName} (${Math.round(progress.totalSize / 1024)}KB)`,
        });
      } else if (progress.status === 'failed') {
        toast({
          title: "File transfer failed",
          description: progress.error || "Unknown error",
          variant: "destructive",
        });
      }
    };
    
    const fileReceivedHandler = (file: File) => {
      setReceivedFiles(prev => [...prev, file]);
      
      toast({
        title: "File ready",
        description: `${file.name} is ready to download (${Math.round(file.size / 1024)}KB)`,
      });
    };
    
    // Register handlers with file transfer manager
    fileTransferManager.onProgress(progressHandler);
    fileTransferManager.onFileReceived(fileReceivedHandler);
    
    return () => {
      // No way to unregister in our current implementation, but in a real app,
      // we would remove the listeners here
    };
  }, [toast]);
  
  // Get clientId from WebSocket
  const clientId = getClientId();
  
  // Context value
  const value = {
    activeView,
    setActiveView,
    clientId,
    isHost,
    setIsHost,
    sessionCode,
    setSessionCode,
    connecting,
    setConnecting,
    showPermissionRequest,
    setShowPermissionRequest,
    hidePermissionRequest,
    connectionSuccess,
    setConnectionSuccess,
    hideConnectionSuccess,
    localStream,
    remoteStream,
    connectedDeviceName,
    setConnectedDeviceName,
    connectedDevices,
    generateSessionCode,
    cancelConnection,
    useMicrophone,
    setUseMicrophone,
    requestScreenCapture,
    stopSharing,
    // File transfer
    sendFile,
    cancelFileTransfer,
    fileTransfers,
    receivedFiles,
    // Screen recording
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    downloadRecording,
    deleteRecording,
    recordings: screenRecordings,
    isRecording: isScreenRecording,
    recordingDuration,
    recordingState: screenRecordingState
  };
  
  return (
    <ShareContext.Provider value={value}>
      {children}
    </ShareContext.Provider>
  );
};

// Custom hook to use the context
export const useShareContext = (): ShareContextProps => useContext(ShareContext);
