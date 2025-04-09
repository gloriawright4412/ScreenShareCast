import { Button } from "@/components/ui/button";

interface ConnectionSuccessModalProps {
  deviceName: string;
  onContinue: () => void;
}

export function ConnectionSuccessModal({ 
  deviceName, 
  onContinue 
}: ConnectionSuccessModalProps) {
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
            className="text-green-500 text-5xl mb-2 mx-auto"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3 className="text-xl font-semibold">Connected Successfully!</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
          You are now connected to <span className="font-medium">{deviceName}</span>.
        </p>
        
        <Button
          className="w-full bg-primary hover:bg-primary-dark text-white"
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
