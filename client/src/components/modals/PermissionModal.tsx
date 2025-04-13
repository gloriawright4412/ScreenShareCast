import { Button } from "@/components/ui/button";
import { useShareContext } from "@/contexts/ShareContext";
import { useState } from "react";
import { motion } from "framer-motion";

export function PermissionModal() {
  const { 
    hidePermissionRequest,
    requestScreenCapture
  } = useShareContext();
  
  const [isDenyHovered, setIsDenyHovered] = useState(false);
  const [isAllowHovered, setIsAllowHovered] = useState(false);

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

  // Fun animations for the modal
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        type: "spring",
        stiffness: 120,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-11/12 max-w-md border border-gray-200 dark:border-gray-700"
      >
        <motion.div 
          className="text-center mb-6"
          variants={itemVariants}
        >
          <div className="relative w-28 h-28 mx-auto mb-4">
            {/* Animated screen share illustration */}
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-float"></div>
            
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary absolute inset-0 m-auto"
            >
              <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
            
            {/* Animated sharing icons */}
            <motion.div 
              animate={{ 
                rotate: [0, 360],
                x: [0, 30, 0], 
                y: [0, -20, 0],
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6] 
              }}
              transition={{ 
                duration: 4,
                ease: "easeInOut",
                times: [0, 0.5, 1],
                repeat: Infinity
              }}
              className="absolute top-1 right-1"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            
            {/* Moving cursor animation */}
            <motion.div 
              animate={{ 
                x: [-20, 10, -5], 
                y: [15, -10, 5],
                opacity: [1, 0.8, 1] 
              }}
              transition={{ 
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute bottom-3 left-3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-700 dark:text-gray-300">
                <path d="M4 4l16 16M9 15l-1 4c-.5 2 1 3 3 2l4-1m-6-9l7-7c1-1 3 1 2 2l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </div>
          
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Permission Required
          </h3>
        </motion.div>
        
        <motion.p 
          className="text-gray-700 dark:text-gray-300 mb-8 text-center leading-relaxed"
          variants={itemVariants}
        >
          ScreenCast needs permission to capture your screen. This allows you to share your content with other devices.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 justify-center"
          variants={itemVariants}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handlePermissionDeny}
            onMouseEnter={() => setIsDenyHovered(true)}
            onMouseLeave={() => setIsDenyHovered(false)}
            className="order-2 sm:order-1 relative border-gray-300 dark:border-gray-600"
          >
            <span className="relative z-10">Deny</span>
            {isDenyHovered && (
              <motion.span 
                className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{ zIndex: 0 }}
              />
            )}
          </Button>
          
          <Button
            size="lg"
            onClick={handlePermissionAllow}
            onMouseEnter={() => setIsAllowHovered(true)}
            onMouseLeave={() => setIsAllowHovered(false)}
            className="order-1 sm:order-2 relative overflow-hidden bg-primary text-white"
          >
            <span className="relative z-10">
              Allow Screen Sharing
            </span>
            {isAllowHovered && (
              <motion.span 
                className="absolute inset-0 bg-primary-foreground/10 rounded-md"
                initial={{ x: -100, opacity: 0.5 }}
                animate={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ zIndex: 0 }}
              />
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
