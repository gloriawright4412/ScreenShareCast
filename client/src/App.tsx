import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Header from "@/components/Header";
import { useShareContext } from "@/contexts/ShareContext";
import { ConnectingModal } from "./components/modals/ConnectingModal";
import { PermissionModal } from "./components/modals/PermissionModal";
import { ConnectionSuccessModal } from "./components/modals/ConnectionSuccessModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { 
    connecting, 
    showPermissionRequest,
    connectionSuccess,
    hideConnectionSuccess,
    connectedDeviceName
  } = useShareContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
        <Header />
        <Router />
        
        {/* Application Modals */}
        {connecting && <ConnectingModal />}
        {showPermissionRequest && <PermissionModal />}
        {connectionSuccess && (
          <ConnectionSuccessModal 
            deviceName={connectedDeviceName || "Device"}
            onContinue={hideConnectionSuccess}
          />
        )}
        
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
