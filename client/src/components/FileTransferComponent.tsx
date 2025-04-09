import React, { useRef, useState } from 'react';
import { useShareContext } from '@/contexts/ShareContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTransferProgress } from '@/lib/fileTransfer';
import { Upload, Download, File, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

export default function FileTransferComponent() {
  const { 
    connectedDeviceName, 
    sendFile, 
    cancelFileTransfer,
    fileTransfers,
    receivedFiles 
  } = useShareContext();
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setUploadingFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  // Trigger file input click
  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Send selected files
  const handleSendFiles = async () => {
    if (uploadingFiles.length === 0) return;

    for (const file of uploadingFiles) {
      try {
        await sendFile(file);
      } catch (error) {
        console.error("Failed to send file:", file.name, error);
      }
    }

    // Clear the selected files after sending
    setUploadingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download a received file
  const handleDownloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Cancel file transfer
  const handleCancelTransfer = (transfer: FileTransferProgress) => {
    // Find the file ID in our list and cancel it
    const fileIdPrefix = transfer.fileName.replace(/\.\w+$/, '');
    cancelFileTransfer(fileIdPrefix);
  };

  // Remove file from upload queue
  const handleRemoveFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get status icon based on file transfer status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'transferring':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">File Transfer</CardTitle>
          <CardDescription>
            Connected to: {connectedDeviceName || 'Unknown device'}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send Files</TabsTrigger>
          <TabsTrigger value="receive">Received Files</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send Files</CardTitle>
              <CardDescription>
                Send files directly to the connected device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 mb-6 text-center">
                <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="mb-2">Drag and drop files here, or</p>
                <Button onClick={handleBrowseFiles}>Browse Files</Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
              </div>

              {uploadingFiles.length > 0 && (
                <div className="mb-6">
                  <Label className="text-md font-medium mb-2 block">Selected Files</Label>
                  <ScrollArea className="h-52 rounded-md border">
                    <div className="p-4">
                      {uploadingFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <File className="h-5 w-5 text-blue-500" />
                            <span>{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveFile(index)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setUploadingFiles([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Clear All
              </Button>
              <Button
                onClick={handleSendFiles}
                disabled={uploadingFiles.length === 0}
              >
                Send Files ({uploadingFiles.length})
              </Button>
            </CardFooter>
          </Card>

          {fileTransfers.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Transfer Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {fileTransfers.map((transfer, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transfer.status)}
                          <span>{transfer.fileName}</span>
                        </div>
                        <span className="text-xs">
                          {Math.round((transfer.transferred / transfer.totalSize) * 100)}%
                          ({Math.round(transfer.transferred / 1024)} / {Math.round(transfer.totalSize / 1024)} KB)
                        </span>
                      </div>
                      <Progress 
                        value={(transfer.transferred / transfer.totalSize) * 100} 
                        className="h-2"
                      />
                      {transfer.status === 'transferring' && (
                        <div className="flex justify-end mt-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCancelTransfer(transfer)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {transfer.status === 'failed' && transfer.error && (
                        <p className="text-xs text-red-500 mt-1">{transfer.error}</p>
                      )}
                      {index < fileTransfers.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="receive">
          <Card>
            <CardHeader>
              <CardTitle>Received Files</CardTitle>
              <CardDescription>
                Files received from the connected device
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivedFiles.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Download className="h-10 w-10 mx-auto mb-2" />
                  <p>No files received yet</p>
                </div>
              ) : (
                <ScrollArea className="h-72">
                  {receivedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-accent rounded-md">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(file.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}