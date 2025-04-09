import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Laptop, Smartphone, Tv } from "lucide-react";
import { useShareContext } from "@/contexts/ShareContext";
import { Connection } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

const RecentConnections = () => {
  const { clientId, setActiveView, setSessionCode } = useShareContext();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        const response = await apiRequest("GET", `/api/connections/${clientId}`);
        const data = await response.json();
        setConnections(data);
      } catch (error) {
        console.error("Error fetching recent connections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [clientId]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "tv":
        return <Tv className="h-5 w-5" />;
      case "laptop":
        return <Laptop className="h-5 w-5" />;
      case "mobile":
      case "phone":
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Laptop className="h-5 w-5" />;
    }
  };

  const formatLastConnected = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleConnect = (connection: Connection) => {
    // Placeholder for reconnecting to a recent device
    // This would need to be implemented with actual session creation
    console.log("Reconnecting to:", connection);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Recent Connections</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">No recent connections</p>
          </div>
        ) : (
          connections.map((connection) => (
            <div 
              key={connection.id}
              className="border-b border-gray-200 dark:border-gray-700 py-4 flex justify-between items-center last:border-b-0"
            >
              <div className="flex items-center">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 mr-4">
                  {getDeviceIcon(connection.deviceType)}
                </div>
                <div>
                  <h3 className="font-medium">{connection.deviceName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last connected {formatLastConnected(connection.lastConnected)}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary-dark"
                onClick={() => handleConnect(connection)}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RecentConnections;
