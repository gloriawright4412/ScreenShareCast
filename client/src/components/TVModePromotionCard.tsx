import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tv, Laptop, Monitor, Smartphone } from "lucide-react";
import { useShareContext } from "@/contexts/ShareContext";

export default function TVModePromotionCard() {
  const { setActiveView } = useShareContext();

  return (
    <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-900 shadow-lg">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.floor(Math.random() * 10) + 4 + "px",
                  height: Math.floor(Math.random() * 10) + 4 + "px",
                  left: Math.floor(Math.random() * 100) + "%",
                  top: Math.floor(Math.random() * 100) + "%",
                }}
                animate={{
                  y: [0, Math.random() * -30 - 10],
                  opacity: [0.2, 0.8, 0],
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              />
            ))}
          </div>
        
          <div className="relative flex items-center gap-4">
            <motion.div
              className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg"
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1)", 
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1)", 
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                ] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror"
              }}
            >
              <Tv className="h-8 w-8 text-purple-500" />
            </motion.div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">TV Mode</h3>
              <p className="text-purple-100">
                Optimized viewing experience for large screens
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2">Perfect for Viewing On:</h4>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-full">
                <Tv className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Smart TVs</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-full">
                <Monitor className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">External Displays</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-full">
                <Laptop className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Laptops</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-full">
                <Smartphone className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Tablets</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-300">1</span>
              </div>
              <div>
                <h5 className="font-medium">Remote Control Optimized</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Large, easy-to-navigate UI optimized for remote control and touch input.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-300">2</span>
              </div>
              <div>
                <h5 className="font-medium">Full-Screen Experience</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Maximized viewing area with minimal distractions for immersive viewing.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-300">3</span>
              </div>
              <div>
                <h5 className="font-medium">One-Click Recording</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Easily record what you're watching with simple on-screen controls.
                </p>
              </div>
            </div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setActiveView("tvMode")}
            >
              Enter TV Mode
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}