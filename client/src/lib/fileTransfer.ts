import { webRTCManager } from "./webrtc";

export interface FileTransferProgress {
  fileName: string;
  totalSize: number;
  transferred: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  error?: string;
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  lastModified?: number;
}

// Chunk size for splitting files (1MB)
const CHUNK_SIZE = 1024 * 1024;

class FileTransferManager {
  private onProgressCallbacks: ((progress: FileTransferProgress) => void)[] = [];
  private onFileReceivedCallbacks: ((file: File) => void)[] = [];
  private fileChunks: { [fileId: string]: ArrayBuffer[] } = {};
  private fileProgress: { [fileId: string]: FileTransferProgress } = {};
  private currentTransfers: { [fileId: string]: { cancel: boolean } } = {};

  constructor() {
    // Set up listener for incoming files when WebRTC is initialized
    this.setupListeners();
  }

  private setupListeners() {
    // Set up WebRTC data channel message handler for file transfers
    webRTCManager.onDataMessage((message) => {
      if (message.type === 'file_transfer_start') {
        this.handleFileTransferStart(message.data);
      } else if (message.type === 'file_chunk') {
        this.handleFileChunk(message.data);
      } else if (message.type === 'file_transfer_complete') {
        this.handleFileTransferComplete(message.data);
      } else if (message.type === 'file_transfer_error') {
        this.handleFileTransferError(message.data);
      }
    });
  }

  /**
   * Send a file to the connected peer
   * @param file The file to send
   * @returns A unique ID for this file transfer
   */
  public async sendFile(file: File): Promise<string> {
    // Generate a unique ID for this file transfer
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create initial progress object
    const progress: FileTransferProgress = {
      fileName: file.name,
      totalSize: file.size,
      transferred: 0,
      status: 'pending'
    };

    this.fileProgress[fileId] = progress;
    this.notifyProgress(fileId);

    // Send file info to peer
    webRTCManager.sendDataMessage('file_transfer_start', {
      fileId,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      }
    });

    // Create a cancellation object
    const cancelObj = { cancel: false };
    this.currentTransfers[fileId] = cancelObj;

    try {
      // Start sending the file in chunks
      progress.status = 'transferring';
      this.notifyProgress(fileId);

      await this.sendFileChunks(file, fileId, cancelObj);

      if (!cancelObj.cancel) {
        // Mark as completed
        progress.status = 'completed';
        progress.transferred = file.size;
        this.notifyProgress(fileId);

        // Send completion message
        webRTCManager.sendDataMessage('file_transfer_complete', { fileId });
      }
    } catch (error) {
      console.error('Error sending file:', error);
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifyProgress(fileId);

      // Notify peer about the error
      webRTCManager.sendDataMessage('file_transfer_error', { 
        fileId, 
        error: progress.error 
      });
    }

    // Clean up
    delete this.currentTransfers[fileId];
    return fileId;
  }

  /**
   * Cancel an in-progress file transfer
   * @param fileId The ID of the file transfer to cancel
   */
  public cancelTransfer(fileId: string): boolean {
    const transfer = this.currentTransfers[fileId];
    if (transfer) {
      transfer.cancel = true;
      
      const progress = this.fileProgress[fileId];
      if (progress) {
        progress.status = 'failed';
        progress.error = 'Transfer cancelled';
        this.notifyProgress(fileId);
      }

      // Notify peer about cancellation
      webRTCManager.sendDataMessage('file_transfer_error', { 
        fileId, 
        error: 'Transfer cancelled by sender' 
      });
      
      return true;
    }
    return false;
  }

  /**
   * Register a callback for file transfer progress updates
   * @param callback Function to call with progress updates
   */
  public onProgress(callback: (progress: FileTransferProgress) => void): void {
    this.onProgressCallbacks.push(callback);
  }

  /**
   * Register a callback for when a file is fully received
   * @param callback Function to call with the received file
   */
  public onFileReceived(callback: (file: File) => void): void {
    this.onFileReceivedCallbacks.push(callback);
  }

  /**
   * Get the current progress of a file transfer
   * @param fileId The ID of the file transfer
   */
  public getProgress(fileId: string): FileTransferProgress | undefined {
    return this.fileProgress[fileId];
  }

  /**
   * Get all current file transfers
   */
  public getAllTransfers(): FileTransferProgress[] {
    return Object.values(this.fileProgress);
  }

  // Private methods for handling the file transfer

  private async sendFileChunks(file: File, fileId: string, cancelObj: { cancel: boolean }): Promise<void> {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const progress = this.fileProgress[fileId];

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Check if transfer was cancelled
      if (cancelObj.cancel) {
        return;
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const arrayBuffer = await chunk.arrayBuffer();

      // Send the chunk
      webRTCManager.sendDataMessage('file_chunk', {
        fileId,
        chunkIndex,
        totalChunks,
        data: arrayBuffer
      });

      // Update progress
      progress.transferred = end;
      this.notifyProgress(fileId);

      // Small delay to avoid overwhelming the data channel
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private handleFileTransferStart(data: any): void {
    const { fileId, fileInfo } = data;
    
    // Initialize array to store chunks
    this.fileChunks[fileId] = [];
    
    // Create progress object
    const progress: FileTransferProgress = {
      fileName: fileInfo.name,
      totalSize: fileInfo.size,
      transferred: 0,
      status: 'pending'
    };
    
    this.fileProgress[fileId] = progress;
    this.notifyProgress(fileId);
  }

  private handleFileChunk(data: any): void {
    const { fileId, chunkIndex, data: chunkData } = data;
    
    // Get progress
    const progress = this.fileProgress[fileId];
    if (!progress) {
      console.error('Received chunk for unknown file:', fileId);
      return;
    }
    
    // Store the chunk
    this.fileChunks[fileId][chunkIndex] = chunkData;
    
    // Update progress
    progress.status = 'transferring';
    progress.transferred += chunkData.byteLength;
    this.notifyProgress(fileId);
  }

  private handleFileTransferComplete(data: any): void {
    const { fileId } = data;
    
    // Get progress and chunks
    const progress = this.fileProgress[fileId];
    const chunks = this.fileChunks[fileId];
    
    if (!progress || !chunks) {
      console.error('Received completion for unknown file:', fileId);
      return;
    }
    
    // Combine chunks into a single blob
    const fileBlob = new Blob(chunks, { type: 'application/octet-stream' });
    const file = new File([fileBlob], progress.fileName, { 
      type: fileBlob.type,
      lastModified: Date.now()
    });
    
    // Update progress
    progress.status = 'completed';
    progress.transferred = progress.totalSize;
    this.notifyProgress(fileId);
    
    // Notify callbacks
    this.onFileReceivedCallbacks.forEach(callback => callback(file));
    
    // Clean up
    delete this.fileChunks[fileId];
  }

  private handleFileTransferError(data: any): void {
    const { fileId, error } = data;
    
    // Get progress
    const progress = this.fileProgress[fileId];
    if (!progress) {
      console.error('Received error for unknown file:', fileId);
      return;
    }
    
    // Update progress
    progress.status = 'failed';
    progress.error = error;
    this.notifyProgress(fileId);
    
    // Clean up
    delete this.fileChunks[fileId];
    
    console.error('File transfer error:', fileId, error);
  }

  private notifyProgress(fileId: string): void {
    const progress = this.fileProgress[fileId];
    if (progress) {
      this.onProgressCallbacks.forEach(callback => callback({...progress}));
    }
  }
}

// Create singleton instance
export const fileTransferManager = new FileTransferManager();