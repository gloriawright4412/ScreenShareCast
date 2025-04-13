import React from 'react';
import { useShareContext } from '@/contexts/ShareContext';
import { RecordingInfo } from '@/lib/screenRecorder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileVideo2, Download, Trash2, Play, Pause, StopCircle, ArrowLeft } from 'lucide-react';

export default function RecordingsView() {
  const { 
    recordings, 
    isRecording, 
    recordingState, 
    recordingDuration, 
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording, 
    cancelRecording, 
    downloadRecording, 
    deleteRecording,
    setActiveView,
    localStream
  } = useShareContext();

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={() => setActiveView("activeSharing")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sharing
        </Button>
        <h1 className="text-2xl font-bold">Screen Recordings</h1>
      </div>

      <Tabs defaultValue="recordings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="record">Record Screen</TabsTrigger>
        </TabsList>

        <TabsContent value="recordings">
          {recordings.length === 0 ? (
            <Alert className="mb-6">
              <AlertTitle>No recordings yet</AlertTitle>
              <AlertDescription>
                Go to the "Record Screen" tab to create your first recording.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {recordings.map((recording: RecordingInfo) => (
                  <Card key={recording.id} className="overflow-hidden">
                    <CardHeader className="bg-muted">
                      <div className="flex items-center justify-center h-32 bg-black/10 rounded-md">
                        <FileVideo2 className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <CardTitle className="text-lg truncate" title={recording.name}>
                        {recording.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-2">
                        <div className="flex flex-col gap-1">
                          <div>Recorded: {formatTimestamp(recording.timestamp)}</div>
                          <div>Duration: {formatDuration(recording.duration)}</div>
                          <div>Size: {formatFileSize(recording.size)}</div>
                        </div>
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="bg-card pt-0 pb-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => downloadRecording(recording.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => deleteRecording(recording.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="record">
          <Card>
            <CardHeader>
              <CardTitle>Record Your Screen</CardTitle>
              <CardDescription>
                {isRecording ? 
                  `Recording in progress: ${formatDuration(recordingDuration)}` : 
                  "Start a new screen recording"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!localStream ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>No screen capture active</AlertTitle>
                  <AlertDescription>
                    You need to start screen sharing before you can record.
                  </AlertDescription>
                </Alert>
              ) : isRecording ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <div>Recording {formatDuration(recordingDuration)}</div>
                  </div>
                  <Progress value={recordingDuration % 60 * (100/60)} className="h-2" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24 mb-4 rounded-full border-4 flex items-center justify-center">
                    <FileVideo2 className="h-12 w-12" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    Click the button below to start recording your screen
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center gap-2">
              {isRecording ? (
                <>
                  {recordingState === 'recording' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => pauseRecording()}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => resumeRecording()}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button 
                    variant="default" 
                    onClick={() => stopRecording()}
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop & Save
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => cancelRecording()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="default" 
                    onClick={() => startRecording(false)}
                    disabled={!localStream}
                  >
                    <FileVideo2 className="h-4 w-4 mr-2" />
                    Record Screen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => startRecording(true)}
                    disabled={!localStream}
                  >
                    <FileVideo2 className="h-4 w-4 mr-2" />
                    Record with Audio
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}