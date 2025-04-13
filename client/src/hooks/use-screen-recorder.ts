import { useState, useEffect, useCallback } from 'react';
import { screenRecorder, RecordingInfo, RecordingOptions } from '@/lib/screenRecorder';

/**
 * Custom hook for using the screen recorder in React components
 */
export function useScreenRecorder() {
  const [recordingState, setRecordingState] = useState<string>('inactive');
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  // Listen for state changes from the recorder
  useEffect(() => {
    const handleStateChange = (state: string) => {
      setRecordingState(state);
      if (state === 'inactive' || state === 'cancelled') {
        setRecordingId(null);
      }
    };
    
    const handleDurationChange = (newDuration: number) => {
      setDuration(newDuration);
    };
    
    const handleRecordingComplete = (recording: RecordingInfo) => {
      setRecordings(prev => [...prev, recording]);
    };
    
    // Register listeners
    screenRecorder.onStateChange(handleStateChange);
    screenRecorder.onDurationChange(handleDurationChange);
    screenRecorder.onRecordingComplete(handleRecordingComplete);
    
    // Initial state
    setRecordingState(screenRecorder.getRecordingState());
    setDuration(screenRecorder.getCurrentDuration());
    
    // Cleanup on unmount
    return () => {
      // No need for cleanup as the recorder is a singleton
    };
  }, []);
  
  /**
   * Start recording the provided media stream
   */
  const startRecording = useCallback(async (stream: MediaStream, options?: Partial<RecordingOptions>) => {
    try {
      setError(null);
      const id = await screenRecorder.startRecording(stream, options);
      setRecordingId(id);
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error starting recording');
      setError(error);
      throw error;
    }
  }, []);
  
  /**
   * Pause the current recording
   */
  const pauseRecording = useCallback(() => {
    try {
      return screenRecorder.pauseRecording();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error pausing recording');
      setError(error);
      return false;
    }
  }, []);
  
  /**
   * Resume a paused recording
   */
  const resumeRecording = useCallback(() => {
    try {
      return screenRecorder.resumeRecording();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error resuming recording');
      setError(error);
      return false;
    }
  }, []);
  
  /**
   * Stop the current recording and save it
   */
  const stopRecording = useCallback(() => {
    try {
      return screenRecorder.stopRecording();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error stopping recording');
      setError(error);
      return false;
    }
  }, []);
  
  /**
   * Cancel the current recording without saving
   */
  const cancelRecording = useCallback(() => {
    try {
      return screenRecorder.cancelRecording();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error cancelling recording');
      setError(error);
      return false;
    }
  }, []);
  
  /**
   * Delete a recording from the list
   */
  const deleteRecording = useCallback((id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id));
  }, []);
  
  /**
   * Download a recording to the user's device
   */
  const downloadRecording = useCallback((recording: RecordingInfo) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `${recording.name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);
  
  /**
   * Format duration as MM:SS
   */
  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  return {
    recordingState,
    recordingId,
    duration,
    recordings,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    deleteRecording,
    downloadRecording,
    formatDuration,
    isRecording: recordingState === 'recording',
    isPaused: recordingState === 'paused',
    isInactive: recordingState === 'inactive'
  };
}