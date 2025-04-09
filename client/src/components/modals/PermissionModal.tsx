import { Button } from "@/components/ui/button";
import { useShareContext } from "@/contexts/ShareContext";

export function PermissionModal() {
  const { 
    hidePermissionRequest,
    requestScreenCapture
  } = useShareContext();

  const handlePermissionDeny = () => {
    hidePermissionRequest();
  };

  const handlePermissionAllow = async () => {
    try {
      await requestScreenCapture();
    } catch (error) {
      console.error("Error requesting screen capture:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-11/12 max-w-md">
        <div className="text-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary text-5xl mb-2 mx-auto"
          >
            <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M17 8l5-5" />
            <path d="M17 3h5v5" />
          </svg>
          <h3 className="text-xl font-semibold">Permission Required</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          ScreenCast needs permission to capture your screen. This is required to share your screen with other devices.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handlePermissionDeny}
            className="order-2 sm:order-1"
          >
            Deny
          </Button>
          <Button
            className="bg-primary hover:bg-primary-dark text-white order-1 sm:order-2"
            onClick={handlePermissionAllow}
          >
            Allow
          </Button>
        </div>
      </div>
    </div>
  );
}
