import { Button } from "@/components/ui/button";
import { useShareContext } from "@/contexts/ShareContext";
import { useState, useEffect } from "react";

export function ConnectingModal() {
  const { cancelConnection } = useShareContext();
  const [progress, setProgress] = useState(0);
  
  // Fun connection messages
  const messages = [
    "Sending digital carrier pigeons...",
    "Aligning the quantum flux capacitors...",
    "Warming up the pixel transmitters...",
    "Establishing secure connection tunnel...",
    "Preparing screen sharing magic...",
    "Converting coffee to code...",
    "Synchronizing screen particles..."
  ];
  
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
    }, 2000);
    
    return () => clearInterval(messageInterval);
  }, [messages.length]);
  
  // Simulate progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prevProgress => {
        // Make progress go up and down between 10% and 90% for a fun effect
        const nextProgress = prevProgress + (Math.random() * 10 - 3);
        return Math.min(Math.max(nextProgress, 10), 90);
      });
    }, 800);
    
    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-11/12 max-w-md border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Animated connecting devices illustration */}
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping"></div>
            <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary/40 rounded-full animate-bounce"></div>
            
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="96"
              height="96"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute inset-0 text-primary animate-[spin_3s_ease-in-out_infinite]"
            >
              <path d="M7 18a4.6 4.4 0 0 1 0-12"></path>
              <path d="M17 6a4.6 4.4 0 0 1 0 12"></path>
            </svg>
            
            <svg 
              className="absolute inset-0 text-primary animate-[pulse_2s_ease-in-out_infinite]" 
              width="96" 
              height="96" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                strokeLinecap="round" 
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Establishing Connection
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 h-6 transition-all duration-500 ease-in-out">
            {messages[messageIndex]}
          </p>
          
          <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-8">
            {/* Animated progress bars */}
            <div 
              className="absolute inset-y-0 left-0 bg-primary/50 rounded-full animate-[progress_2.5s_ease-in-out_infinite]"
              style={{ width: `${progress}%` }}
            ></div>
            <div 
              className="absolute inset-y-0 left-0 bg-primary rounded-full w-16 animate-[progressPulse_2s_ease-in-out_infinite]"
              style={{ left: `${progress - 15}%` }}
            ></div>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            className="relative overflow-hidden group border-primary/20 hover:border-primary/60 transition-all duration-300"
            onClick={cancelConnection}
          >
            <span className="relative z-10">Cancel Connection</span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></span>
          </Button>
        </div>
      </div>
    </div>
  );
}
