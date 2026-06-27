import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, X } from 'lucide-react';

export default function DesktopRecommendation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile screens and if not dismissed before
    const hasDismissed = localStorage.getItem('swara_desktop_recommendation_dismissed');
    
    // Check if the screen width is mobile size (e.g. less than 768px for standard md breakpoint)
    const isMobile = window.innerWidth < 768;

    if (isMobile && !hasDismissed) {
      // Delay showing it slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('swara_desktop_recommendation_dismissed', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-4 left-4 right-4 z-[90] p-4 glass rounded-2xl border border-marigold/30 shadow-2xl flex flex-col gap-3"
          // We set z-index to 90 so it stays above standard UI but below the onboarding tour (which is z-[100])
        >
          <div className="flex justify-between items-start gap-3">
            <div className="bg-marigold/20 p-2 rounded-xl text-marigold shrink-0">
              <Monitor size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-marigold font-bold text-sm mb-1 leading-tight">Desktop Mode Recommended</h4>
              <p className="text-cream/80 text-xs">For the full, immersive Swara experience, including dynamic visualizations and task management, we highly recommend switching to a desktop device or turning your phone horizontally.</p>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-cream/40 hover:text-red-400 p-1 shrink-0 transition-colors"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
          <button 
            onClick={handleDismiss}
            className="w-full mt-2 py-2.5 rounded-lg bg-marigold text-peacock font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest"
          >
            I Understand, Continue
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
