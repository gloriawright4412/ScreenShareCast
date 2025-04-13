import { PeerConnection, PeerConnectionOptions, QualitySettings, getConstraintsFromQuality } from "./peerConnection";
import { sendWebSocketMessage } from "./websocket";

export interface WebRTCMessage {
  type: string;
  data: any;
}

export class WebRTCManager {
  private peerConnection: PeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private clientId: string | null = null;
  private targetId: string | null = null;
  private sessionCode: string | null = null;
  private isHost: boolean = false;
  private qualitySettings: QualitySettings = {
    resolution: "1080p",
    frameRate: 30,
    quality: "High",
  };

  private onTrackCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private onDataMessageCallback: ((message: any) => void) | null = null;

  // Initialize WebRTC manager with client ID from signaling server
  public initialize(clientId: string) {
    this.clientId = clientId;
  }

  // Set the session details
  public setSessionDetails(sessionCode: string, isHost: boolean, targetId?: string) {
    this.sessionCode = sessionCode;
    this.isHost = isHost;
    if (targetId) {
      this.targetId = targetId;
    }
  }

  // Register callbacks
  public onTrack(callback: (stream: MediaStream) => void) {
    this.onTrackCallback = callback;
    return this;
  }

  public onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
    return this;
  }

  public onDataMessage(callback: (message: any) => void) {
    this.onDataMessageCallback = callback;
    return this;
  }

  // Set quality settings for the stream
  public setQualitySettings(settings: QualitySettings) {
    this.qualitySettings = settings;
    
    // If we have an active stream, update it
    if (this.localStream && this.peerConnection) {
      this.updateStreamQuality();
    }
  }

  private async monitorConnectionQuality() {
    if (!this.peerConnection) return;
    
    // Use requestAnimationFrame for smoother monitoring
    const monitorStats = async () => {
      const stats = await this.peerConnection.getStats();
      let totalPacketsLost = 0;
      let totalPackets = 0;

      stats.forEach(stat => {
        if (stat.type === 'outbound-rtp') {
          totalPacketsLost += stat.packetsLost || 0;
          totalPackets += stat.packetsSent || 0;
        }
      });

      requestAnimationFrame(() => monitorStats());
    };

    monitorStats();

      stats.forEach(stat => {
        if (stat.type === 'outbound-rtp') {
          totalPacketsLost += stat.packetsLost || 0;
          totalPackets += stat.packetsSent || 0;
        }
      });

      const lossRate = totalPackets > 0 ? (totalPacketsLost / totalPackets) : 0;
      
      // Adapt quality based on packet loss
      if (lossRate > 0.1) { // More than 10% packet loss
        this.setQualitySettings({
          ...this.qualitySettings,
          frameRate: 15,
          quality: "Low"
        });
      } else if (lossRate < 0.05) { // Less than 5% packet loss
        this.setQualitySettings({
          ...this.qualitySettings,
          frameRate: 30,
          quality: "High"
        });
      }
    }, 5000);
  }

  // Update the stream quality based on current settings
  private async updateStreamQuality() {
    if (!this.localStream) return;
    
    const constraints = getConstraintsFromQuality(this.qualitySettings);
    
    // Stop all current tracks
    this.localStream.getTracks().forEach(track => track.stop());
    
    // Get new stream with updated constraints
    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: constraints,
        audio: true
      });
      
      this.localStream = newStream;
      
      // Replace tracks in the peer connection
      if (this.peerConnection) {
        await this.peerConnection.replaceTrack(newStream);
      }
    } catch (error) {
      console.error("Error updating stream quality:", error);
    }
  }

  // Create and start a screen sharing session
  public async startScreenSharing() {
    try {
      const constraints = getConstraintsFromQuality(this.qualitySettings);
      this.localStream = await navigator.mediaDevices.getDisplayMedia({
        video: constraints,
        audio: true
      });
      
      return this.localStream;
    } catch (error) {
      console.error("Error starting screen sharing:", error);
      throw error;
    }
  }

  // Create a peer connection for hosting
  public async createHostConnection() {
    if (!this.clientId || !this.targetId || !this.localStream) {
      throw new Error("Missing required data for host connection");
    }

    const options: PeerConnectionOptions = {
      onIceCandidate: (candidate) => {
        if (candidate && this.targetId) {
          sendWebSocketMessage("ice_candidate", {
            candidate,
            targetId: this.targetId,
            fromId: this.clientId
          });
        }
      },
      onTrack: (stream) => {
        this.remoteStream = stream;
        if (this.onTrackCallback) {
          this.onTrackCallback(stream);
        }
      },
      onConnectionStateChange: (state) => {
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(state);
        }
      },
      onDataChannel: (channel) => {
        channel.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (this.onDataMessageCallback) {
              this.onDataMessageCallback(message);
            }
          } catch (error) {
            console.error("Error parsing data channel message:", error);
          }
        };
      }
    };

    this.peerConnection = new PeerConnection(options);
    this.peerConnection.createDataChannel("control");
    this.peerConnection.addStream(this.localStream);
    
    const offer = await this.peerConnection.createOffer();
    sendWebSocketMessage("offer", {
      offer,
      targetId: this.targetId,
      fromId: this.clientId
    });
  }

  // Create a peer connection as a client
  public async createClientConnection(offer: RTCSessionDescriptionInit, fromId: string) {
    if (!this.clientId) {
      throw new Error("Missing client ID for client connection");
    }

    this.targetId = fromId;

    const options: PeerConnectionOptions = {
      onIceCandidate: (candidate) => {
        if (candidate && this.targetId) {
          sendWebSocketMessage("ice_candidate", {
            candidate,
            targetId: this.targetId,
            fromId: this.clientId
          });
        }
      },
      onTrack: (stream) => {
        this.remoteStream = stream;
        if (this.onTrackCallback) {
          this.onTrackCallback(stream);
        }
      },
      onConnectionStateChange: (state) => {
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(state);
        }
      },
      onDataChannel: (channel) => {
        channel.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (this.onDataMessageCallback) {
              this.onDataMessageCallback(message);
            }
          } catch (error) {
            console.error("Error parsing data channel message:", error);
          }
        };
      }
    };

    this.peerConnection = new PeerConnection(options);
    await this.peerConnection.setRemoteDescription(offer);
    
    const answer = await this.peerConnection.createAnswer();
    sendWebSocketMessage("answer", {
      answer,
      targetId: this.targetId,
      fromId: this.clientId
    });
  }

  // Handle ICE candidate from remote peer
  public async handleIceCandidate(candidate: RTCIceCandidate) {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(candidate);
    }
  }

  // Handle answer from client
  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(answer);
    }
  }

  // Send a message through the data channel
  public sendDataMessage(type: string, data: any) {
    if (this.peerConnection) {
      return this.peerConnection.sendMessage({ type, data });
    }
    return false;
  }

  // Disconnect and clean up
  public disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.sessionCode) {
      sendWebSocketMessage("disconnect", {
        sessionCode: this.sessionCode,
        clientId: this.clientId
      });

      this.sessionCode = null;
    }

    this.targetId = null;
  }
}

// Export singleton instance
export const webRTCManager = new WebRTCManager();
