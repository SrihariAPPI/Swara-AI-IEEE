import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Settings, Mic, CheckSquare, ImageIcon, Keyboard } from 'lucide-react';

interface OnboardingStep {
  title: string;
  content: string;
  targetId?: string;
  icon: React.ReactNode;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(-1); // -1 for welcome screen
  const [isVisible, setIsVisible] = useState(false);
  const [dimensions, setDimensions] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const steps: OnboardingStep[] = [
    {
      title: "Meet Swara",
      content: "I'm your cultural AI companion. I can be sassy, calm, or playful based on your mood. Let's set up my personality!",
      targetId: "onboarding-settings",
      icon: <Settings className="text-marigold" />
    },
    {
      title: "Interactive Voice",
      content: "Press 'Start Session' to talk to me live. I'll listen and respond in real-time with my unique voice.",
      targetId: "onboarding-session",
      icon: <Mic className="text-marigold" />
    },
    {
      title: "Silent Mode",
      content: "Prefer typing? Use the keyboard icon to chat with me quietly anytime.",
      targetId: "onboarding-keyboard",
      icon: <Keyboard className="text-marigold" />
    },
    {
      title: "Productivity & Art",
      content: "I'm not just a talker! I can manage your tasks and generate beautiful Indian-themed art on the fly.",
      targetId: "onboarding-tasks",
      icon: <CheckSquare className="text-marigold" />
    }
  ];

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('swara_onboarding_complete');
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (currentStep >= 0 && currentStep < steps.length) {
        const target = document.getElementById(steps[currentStep].targetId || '');
        if (target) {
          const rect = target.getBoundingClientRect();
          setDimensions({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > -1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('swara_onboarding_complete', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Dimmed Background */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 pointer-events-auto"
        onClick={handleComplete}
      />

      <AnimatePresence mode="wait">
        {currentStep === -1 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass p-8 rounded-3xl border border-marigold/30 shadow-2xl pointer-events-auto mx-4"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-marigold to-terracotta flex items-center justify-center shadow-xl rotate-3">
                <Sparkles size={40} className="text-peacock drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-3xl font-cute font-bold text-marigold mb-2">Swagat Hei!</h2>
                <p className="text-cream/80 text-lg">Welcome to Swara. I'm your sophisticated, AI-powered cultural companion. Ready for a quick tour?</p>
              </div>
              <div className="flex w-full gap-3">
                <button 
                  onClick={handleComplete}
                  className="flex-1 py-3 rounded-xl border border-marigold/30 text-marigold/70 hover:bg-white/5 transition-colors font-medium"
                >
                  Skip Tour
                </button>
                <button 
                  onClick={() => setCurrentStep(0)}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-marigold to-saffron text-peacock font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  Let's Go <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div key="tutorial-step" className="absolute inset-0 pointer-events-none">
            {/* Highlight Hole */}
            <motion.div 
              layoutId="highlight"
              className="absolute border-4 border-marigold rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-0"
              animate={{ 
                top: dimensions.top - 8, 
                left: dimensions.left - 8, 
                width: dimensions.width + 16, 
                height: dimensions.height + 16 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                top: dimensions.top > window.innerHeight / 2 ? dimensions.top - 200 : dimensions.top + dimensions.height + 24,
                left: Math.min(Math.max(20, dimensions.left + dimensions.width / 2 - 160), window.innerWidth - 340)
              }}
              className="absolute w-80 glass p-6 rounded-2xl border border-marigold/30 shadow-2xl pointer-events-auto z-10"
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="flex gap-4">
                <div className="shrink-0 p-2 rounded-lg bg-marigold/10 h-min">
                  {steps[currentStep].icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-marigold font-bold mb-1">{steps[currentStep].title}</h3>
                  <p className="text-cream/80 text-sm leading-relaxed">{steps[currentStep].content}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-marigold' : 'w-1.5 bg-marigold/20'}`} 
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrev}
                    className="p-2 rounded-lg hover:bg-white/5 text-marigold/60"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-marigold text-peacock font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleComplete}
                className="absolute top-2 right-2 p-1 text-cream/30 hover:text-red-400 transition-colors"
                title="End Tour"
              >
                <X size={16} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
