import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, ShieldAlert, Keyboard } from 'lucide-react';

interface Props {
  onGranted: () => void;
  onDismiss: () => void;
}

export default function MicPromptModal({ onGranted, onDismiss }: Props) {
  const [denied, setDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestAccess = async () => {
    setIsLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not available.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Clean up the stream immediately since we just wanted the permission
      stream.getTracks().forEach(track => track.stop());
      onGranted();
    } catch (e: any) {
      console.error("Microphone access error:", e);
      setDenied(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-terracotta to-marigold" />
        
        <button 
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-cream/40 hover:text-cream/80 transition-colors"
        >
          ✕
        </button>

        {!denied ? (
          <>
            <div className="w-20 h-20 bg-marigold/10 rounded-full flex items-center justify-center mb-6 border border-marigold/20">
              <Mic size={40} className="text-marigold" />
            </div>
            <h2 className="text-2xl font-cute font-bold text-marigold mb-3">Hello!</h2>
            <p className="text-cream/80 text-sm mb-8 leading-relaxed">
              Swara is a voice-first AI assistant. To interact with her using your voice, please allow microphone access.
            </p>
            
            <button 
              onClick={requestAccess}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-marigold to-terracotta text-peacock font-bold tracking-wide uppercase text-sm rounded-xl hover:shadow-[0_0_20px_rgba(255,159,28,0.4)] hover:scale-105 transition-all disabled:opacity-50 mb-3"
            >
              {isLoading ? "Requesting..." : "Grant Microphone Access"}
            </button>
            <button 
              onClick={onDismiss}
              className="w-full py-3.5 px-4 bg-white/5 text-cream/80 font-bold tracking-wide uppercase text-sm rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Keyboard size={16} /> Continue with Text Only
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <ShieldAlert size={40} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-cute font-bold text-red-400 mb-3">Access Denied</h2>
            <p className="text-cream/80 text-sm mb-6 leading-relaxed">
              Microphone access was denied. You can still use Swara by typing.
            </p>
            
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-left w-full mb-8">
              <p className="text-sm text-cream/90 font-medium mb-2 font-cute">How to fix later:</p>
              <ol className="text-xs text-cream/60 list-decimal pl-4 space-y-2">
                <li>Click the <strong>lock icon 🔒</strong> in your browser's address bar.</li>
                <li>Find the <strong>Microphone</strong> setting and change it to <strong>Allow</strong>.</li>
              </ol>
            </div>

            <button 
              onClick={onDismiss}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-marigold to-terracotta text-peacock font-bold tracking-wide uppercase text-sm rounded-xl hover:scale-105 transition-all mb-3"
            >
              Use Text Input
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3.5 px-4 bg-white/10 text-white font-bold tracking-wide text-sm rounded-xl hover:bg-white/20 transition-all"
            >
              I fixed it, reload page
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
