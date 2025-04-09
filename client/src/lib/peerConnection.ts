import { WebRTCMessage } from "./webrtc";

// Configuration for WebRTC
export const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

// Constraints for the video stream
export const defaultConstraints: MediaTrackConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30 },
};

export interface PeerConnectionOptions {
  onIceCandidate: (candidate: RTCIceCandidate | null) => void;
  onTrack: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
}

export interface QualitySettings {
  resolution: "720p" | "1080p" | "4K";
  frameRate: 15 | 30 | 60;
  quality: "Low" | "High" | "Ultra";
}

export function getConstraintsFromQuality(settings: QualitySettings): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {
    frameRate: { ideal: settings.frameRate },
  };

  // Set resolution based on quality settings
  switch (settings.resolution) {
    case "720p":
      constraints.width = { ideal: 1280 };
      constraints.height = { ideal: 720 };
      break;
    case "1080p":
      constraints.width = { ideal: 1920 };
      constraints.height = { ideal: 1080 };
      break;
    case "4K":
      constraints.width = { ideal: 3840 };
      constraints.height = { ideal: 2160 };
      break;
  }

  return constraints;
}

export class PeerConnection {
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private options: PeerConnectionOptions;

  constructor(options: PeerConnectionOptions) {
    this.pc = new RTCPeerConnection(rtcConfiguration);
    this.options = options;

    // Set up event handlers
    this.pc.onicecandidate = (event) => {
      this.options.onIceCandidate(event.candidate);
    };

    this.pc.ontrack = (event) => {
      this.options.onTrack(event.streams[0]);
    };

    this.pc.onconnectionstatechange = () => {
      this.options.onConnectionStateChange(this.pc.connectionState);
    };

    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      if (this.options.onDataChannel) {
        this.options.onDataChannel(this.dataChannel);
      }
    };
  }

  // Create a data channel for sending messages
  public createDataChannel(label: string) {
    this.dataChannel = this.pc.createDataChannel(label);
    if (this.options.onDataChannel) {
      this.options.onDataChannel(this.dataChannel);
    }
    return this.dataChannel;
  }

  // Create an offer as the initiator
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  // Set the remote description (offer or answer)
  public async setRemoteDescription(description: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(description));
  }

  // Create an answer as the responder
  public async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  // Add an ICE candidate received from the peer
  public async addIceCandidate(candidate: RTCIceCandidate) {
    await this.pc.addIceCandidate(candidate);
  }

  // Add a media stream to be sent to the peer
  public addStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      this.pc.addTrack(track, stream);
    });
  }

  // Replace the current tracks with new ones (e.g., for quality changes)
  public async replaceTrack(stream: MediaStream) {
    const senders = this.pc.getSenders();
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    for (const sender of senders) {
      if (sender.track?.kind === "video" && videoTrack) {
        await sender.replaceTrack(videoTrack);
      } else if (sender.track?.kind === "audio" && audioTrack) {
        await sender.replaceTrack(audioTrack);
      }
    }
  }

  // Send a message through the data channel
  public sendMessage(message: WebRTCMessage) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Close the connection
  public close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    this.pc.close();
  }

  // Get current connection state
  public getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  // Get ICE connection state
  public getIceConnectionState(): RTCIceConnectionState {
    return this.pc.iceConnectionState;
  }
}
