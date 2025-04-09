import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, User } from "lucide-react";

const Header = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-primary mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
              <line x1="2" y1="20" x2="2" y2="20"></line>
            </svg>
          </span>
          <h1 className="text-xl font-semibold">ScreenCast</h1>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full ml-2"
            onClick={() => setShowProfile(!showProfile)}
            title="Profile"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
