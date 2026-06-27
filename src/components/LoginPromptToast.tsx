import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, X } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function LoginPromptToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // Show after 5 seconds if not logged in
        const timer = setTimeout(() => {
          setShow(true);
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        setShow(false);
      }
    });

    return unsubscribe;
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-28 md:bottom-32 right-4 md:right-8 z-50 glass border border-marigold/30 shadow-2xl rounded-2xl p-4 max-w-sm flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-marigold/20 flex flex-shrink-0 items-center justify-center text-marigold">
              <Cloud size={20} />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-marigold">Unlock Cloud Sync</h3>
              <p className="text-xs text-cream/70 mt-0.5 leading-relaxed">
                Log in to sync your chat history, voice settings, and PDF context across all your devices and get more out of Swara!
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShow(false)}
            className="text-cream/50 hover:text-cream transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
