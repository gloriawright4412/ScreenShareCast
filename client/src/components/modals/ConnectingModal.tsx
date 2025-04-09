import { Button } from "@/components/ui/button";
import { useShareContext } from "@/contexts/ShareContext";

export function ConnectingModal() {
  const { cancelConnection } = useShareContext();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-11/12 max-w-md">
        <div className="text-center">
          <div className="connection-pulse inline-block">
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
              className="text-primary text-5xl mb-4 mx-auto animate-pulse"
            >
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
              <path d="M8 12h8"></path>
              <path d="M12 16V8"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Establishing Connection</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 relative after:content-['...'] after:animate-[dots_1.5s_infinite]">
            Please wait
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-6">
            <div 
              className="bg-primary h-full rounded-full animate-[progress_2s_infinite_linear]"
              style={{ width: "70%" }}
            ></div>
          </div>
          
          <Button
            variant="outline"
            onClick={cancelConnection}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
