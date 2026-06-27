import React from 'react';
import { motion } from 'motion/react';
import { MicOff } from 'lucide-react';

interface Props {
  onClose: () => void;
  errorMessage?: string;
}

export default function PermissionModal({ onClose, errorMessage }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-terracotta to-marigold" />
        
        <div className="w-16 h-16 rounded-full bg-terracotta/20 flex items-center justify-center mb-6">
          <MicOff size={32} className="text-terracotta" />
        </div>
        
        <h2 className="text-2xl font-serif font-medium text-marigold mb-3">Microphone Blocked</h2>
        <p className="text-cream/60 text-sm mb-6 leading-relaxed">
          {errorMessage || "Your browser has blocked microphone access for this site. Swara cannot hear you until you allow it."}
        </p>
        
        <div className="bg-cream/5 border border-cream/10 rounded-xl p-4 text-left w-full mb-8">
          <p className="text-sm text-cream/80 font-medium mb-2 font-serif text-marigold">How to fix this:</p>
          <ol className="text-xs text-cream/60 list-decimal pl-4 space-y-2">
            <li>Click the <strong>lock icon (🔒)</strong> or <strong>tune icon (⚙️)</strong> next to the URL bar at the top of your browser.</li>
            <li>Find <strong>Microphone</strong> and change it to <strong>Allow</strong>.</li>
            <li>Refresh this page.</li>
          </ol>
        </div>
        
        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-marigold text-peacock font-medium rounded-xl hover:bg-saffron transition-colors"
          >
            I've allowed it, Refresh Page
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 px-4 bg-cream/5 text-cream/70 font-medium rounded-xl hover:bg-cream/10 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
