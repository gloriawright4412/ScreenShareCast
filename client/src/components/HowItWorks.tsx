import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Touchpad, Eye } from "lucide-react";

const HowItWorks = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How It Works</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="bg-primary bg-opacity-10 rounded-full p-4 inline-block mb-3">
              <Touchpad className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">1. Select a Mode</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Choose to share or receive a screen</p>
          </div>
          <div>
            <div className="bg-primary bg-opacity-10 rounded-full p-4 inline-block mb-3">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">2. Connect Devices</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Scan a QR code or enter a connection code</p>
          </div>
          <div>
            <div className="bg-primary bg-opacity-10 rounded-full p-4 inline-block mb-3">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">3. Start Sharing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">View or share your screen instantly</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorks;
