import { ArrowRight, Cast, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useShareContext } from "@/contexts/ShareContext";

const ActionCards = () => {
  const { setActiveView } = useShareContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Button
        variant="outline"
        className="p-0 h-auto device-card bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg overflow-hidden"
        onClick={() => setActiveView("shareScreen")}
      >
        <Card className="border-0 shadow-none">
          <CardContent className="p-6 text-left">
            <div className="flex items-center mb-4">
              <MonitorOff className="h-8 w-8 text-primary mr-3" />
              <h2 className="text-xl font-semibold">Share Your Screen</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Broadcast your device's screen to another device.</p>
            <div className="flex justify-end">
              <span className="text-primary flex items-center">
                Get started
                <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Button>
      
      <Button
        variant="outline"
        className="p-0 h-auto device-card bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg overflow-hidden"
        onClick={() => setActiveView("receiveScreen")}
      >
        <Card className="border-0 shadow-none">
          <CardContent className="p-6 text-left">
            <div className="flex items-center mb-4">
              <Cast className="h-8 w-8 text-secondary mr-3" />
              <h2 className="text-xl font-semibold">Receive a Screen</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">View another device's screen on this device.</p>
            <div className="flex justify-end">
              <span className="text-secondary flex items-center">
                Get started
                <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Button>
    </div>
  );
};

export default ActionCards;
