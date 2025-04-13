/**
 * Screen Recorder Service
 * 
 * This service handles recording screen content using the MediaRecorder API
 * and saves recordings locally in the browser.
 */

interface RecordingOptions {
  mimeType: string;
  videoBitsPerSecond: number;
  audioBitsPerSecond?: number;
  includeAudio: boolean;
}

interface RecordingInfo {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  size: number;
  url: string;
  blob: Blob;
}

// Default recording options
const DEFAULT_OPTIONS: RecordingOptions = {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2500000, // 2.5 Mbps
  audioBitsPerSecond: 128000,  // 128 Kbps
  includeAudio: true
};

class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStream: MediaStream | null = null;
  private startTime: number = 0;
  private timerId: number | null = null;
  private currentRecordingId: string | null = null;
  private recordingState: 'inactive' | 'recording' | 'paused' = 'inactive';
  private onStateChangeCallbacks: ((state: string) => void)[] = [];
  private onRecordingCompleteCallbacks: ((recording: RecordingInfo) => void)[] = [];
  private onDurationChangeCallbacks: ((duration: number) => void)[] = [];
  private currentDuration: number = 0;
  
  /**
   * Start recording the provided media stream
   * @param stream The MediaStream to record
   * @param options Recording options
   * @returns Promise that resolves when recording starts
   */
  async startRecording(stream: MediaStream, options: Partial<RecordingOptions> = {}): Promise<string> {
    if (this.mediaRecorder && this.recordingState !== 'inactive') {
      throw new Error('Recording already in progress');
    }
    
    try {
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      
      // Create a new recording stream
      const tracks = stream.getVideoTracks();
      if (tracks.length === 0) {
        throw new Error('No video tracks found in the stream');
      }
      
      // Clone the stream to avoid conflicts with screen sharing
      const videoStream = new MediaStream(tracks);
      
      // Add audio track if requested
      if (mergedOptions.includeAudio && stream.getAudioTracks().length > 0) {
        stream.getAudioTracks().forEach(track => {
          videoStream.addTrack(track);
        });
      }
      
      this.recordingStream = videoStream;
      
      // Check for supported MIME types
      const mimeType = this.getSupportedMimeType();
      
      // Create recorder
      const recorderOptions = {
        mimeType,
        videoBitsPerSecond: mergedOptions.videoBitsPerSecond,
        audioBitsPerSecond: mergedOptions.audioBitsPerSecond
      };
      
      this.mediaRecorder = new MediaRecorder(videoStream, recorderOptions);
      this.recordedChunks = [];
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.finalizeRecording();
      };
      
      // Generate a unique ID for this recording
      this.currentRecordingId = `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Start the recorder
      this.mediaRecorder.start(1000); // Collect data every second
      this.startTime = Date.now();
      this.recordingState = 'recording';
      this.currentDuration = 0;
      
      // Start the timer to track duration
      this.startDurationTimer();
      
      // Notify state change
      this.notifyStateChange('recording');
      
      return this.currentRecordingId;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }
  
  /**
   * Pause the current recording
   */
  pauseRecording(): boolean {
    if (!this.mediaRecorder || this.recordingState !== 'recording') {
      return false;
    }
    
    try {
      this.mediaRecorder.pause();
      this.recordingState = 'paused';
      this.stopDurationTimer();
      this.notifyStateChange('paused');
      return true;
    } catch (error) {
      console.error('Error pausing recording:', error);
      return false;
    }
  }
  
  /**
   * Resume a paused recording
   */
  resumeRecording(): boolean {
    if (!this.mediaRecorder || this.recordingState !== 'paused') {
      return false;
    }
    
    try {
      this.mediaRecorder.resume();
      this.recordingState = 'recording';
      this.startDurationTimer();
      this.notifyStateChange('recording');
      return true;
    } catch (error) {
      console.error('Error resuming recording:', error);
      return false;
    }
  }
  
  /**
   * Stop the current recording and save it
   */
  stopRecording(): boolean {
    if (!this.mediaRecorder || this.recordingState === 'inactive') {
      return false;
    }
    
    try {
      this.mediaRecorder.stop();
      this.stopDurationTimer();
      
      if (this.recordingStream) {
        this.recordingStream.getTracks().forEach(track => track.stop());
        this.recordingStream = null;
      }
      
      this.recordingState = 'inactive';
      this.notifyStateChange('inactive');
      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return false;
    }
  }
  
  /**
   * Cancel the current recording without saving
   */
  cancelRecording(): boolean {
    if (!this.mediaRecorder || this.recordingState === 'inactive') {
      return false;
    }
    
    try {
      // Stop but don't save
      if (this.recordingStream) {
        this.recordingStream.getTracks().forEach(track => track.stop());
        this.recordingStream = null;
      }
      
      this.mediaRecorder.stop();
      this.stopDurationTimer();
      this.recordedChunks = [];
      this.recordingState = 'inactive';
      this.notifyStateChange('cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling recording:', error);
      return false;
    }
  }
  
  /**
   * Get the current recording state
   */
  getRecordingState(): string {
    return this.recordingState;
  }
  
  /**
   * Get the current recording duration in seconds
   */
  getCurrentDuration(): number {
    return this.currentDuration;
  }
  
  /**
   * Register a callback for recording state changes
   */
  onStateChange(callback: (state: string) => void): void {
    this.onStateChangeCallbacks.push(callback);
  }
  
  /**
   * Register a callback for when a recording is completed
   */
  onRecordingComplete(callback: (recording: RecordingInfo) => void): void {
    this.onRecordingCompleteCallbacks.push(callback);
  }
  
  /**
   * Register a callback for duration updates
   */
  onDurationChange(callback: (duration: number) => void): void {
    this.onDurationChangeCallbacks.push(callback);
  }
  
  /**
   * Create a downloadable link for the saved recording
   */
  private finalizeRecording(): void {
    if (this.recordedChunks.length === 0 || !this.currentRecordingId) {
      return;
    }
    
    // Combine chunks into a single blob
    const mimeType = this.getSupportedMimeType();
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const timestamp = this.startTime;
    
    // Create recording info
    const recordingInfo: RecordingInfo = {
      id: this.currentRecordingId,
      name: `Recording-${new Date(timestamp).toLocaleString()}`,
      timestamp,
      duration,
      size: blob.size,
      url,
      blob
    };
    
    // Notify completion
    this.onRecordingCompleteCallbacks.forEach(callback => {
      callback(recordingInfo);
    });
    
    // Reset state
    this.recordedChunks = [];
    this.currentRecordingId = null;
    this.currentDuration = 0;
  }
  
  /**
   * Get a supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return '';
  }
  
  /**
   * Start timer to track recording duration
   */
  private startDurationTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
    
    this.timerId = window.setInterval(() => {
      this.currentDuration = Math.round((Date.now() - this.startTime) / 1000);
      this.notifyDurationChange(this.currentDuration);
    }, 1000);
  }
  
  /**
   * Stop the duration timer
   */
  private stopDurationTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  
  /**
   * Notify state change listeners
   */
  private notifyStateChange(state: string): void {
    this.onStateChangeCallbacks.forEach(callback => {
      callback(state);
    });
  }
  
  /**
   * Notify duration change listeners
   */
  private notifyDurationChange(duration: number): void {
    this.onDurationChangeCallbacks.forEach(callback => {
      callback(duration);
    });
  }
}

// Create a singleton instance
export const screenRecorder = new ScreenRecorder();

// Export interfaces for use in components
export type { RecordingOptions, RecordingInfo };