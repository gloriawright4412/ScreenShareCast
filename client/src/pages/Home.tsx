import { useEffect } from "react";
import { useShareContext } from "@/contexts/ShareContext";
import ActionCards from "@/components/ActionCards";
import RecentConnections from "@/components/RecentConnections";
import HowItWorks from "@/components/HowItWorks";
import ShareScreenFlow from "@/components/ShareScreenFlow";
import ReceiveScreenFlow from "@/components/ReceiveScreenFlow";
import ActiveSharingView from "@/components/ActiveSharingView";
import ActiveReceivingView from "@/components/ActiveReceivingView";
import { connectWebSocket } from "@/lib/websocket";

export default function Home() {
  const { 
    activeView,
    generateSessionCode,
    isHost
  } = useShareContext();

  // Connect to WebSocket when component mounts
  useEffect(() => {
    connectWebSocket().catch(console.error);
  }, []);

  // Generate session code if we're on the share screen view
  useEffect(() => {
    if (activeView === "shareScreen") {
      generateSessionCode();
    }
  }, [activeView, generateSessionCode]);

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      {activeView === "home" && (
        <div>
          <ActionCards />
          <RecentConnections />
          <HowItWorks />
        </div>
      )}
      
      {activeView === "shareScreen" && (
        <ShareScreenFlow />
      )}
      
      {activeView === "receiveScreen" && (
        <ReceiveScreenFlow />
      )}
      
      {activeView === "activeSharing" && (
        <ActiveSharingView />
      )}
      
      {activeView === "activeReceiving" && (
        <ActiveReceivingView />
      )}
    </main>
  );
}
