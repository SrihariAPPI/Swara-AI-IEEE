import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
  mood?: string;
  speed?: number;
  pitch?: number;
  emotion?: string;
}

export default function Visualizer({ state, mood = "yaman", emotion = "neutral" }: VisualizerProps) {
  const [overrideEmotion, setOverrideEmotion] = useState<string | null>(null);
  const activeEmotion = overrideEmotion || emotion;

  useEffect(() => {
    if (overrideEmotion) {
      const timer = setTimeout(() => {
        setOverrideEmotion(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [overrideEmotion]);

  // Head Bobbing Animation
  const bobbingAnim = {
    y: state === "listening" ? [-5, 8, -2, 6, -5] : state === "speaking" ? [-8, 4, -6, 2, -10, 0, -8] : state === "idle" ? [0, -12, 0] : [-12, 12, -12],
    rotate: state === "processing" ? [-2, 2, -2] : state === "listening" ? [3, -2, 4, -1, 3] : state === "idle" ? [0, 1.5, -1.5, 0] : [0, -3, 2, -2, 4, 0],
    scale: state === "idle" ? [1, 1.02, 1] : state === "speaking" ? [1, 1.03, 0.98, 1.01, 1] : 1,
    transition: {
        duration: state === "speaking" ? 1.5 : state === "listening" ? 2.0 : state === "processing" ? 0.6 : 2.5,
        repeat: Infinity,
        ease: "easeInOut",
        times: state === "speaking" ? [0, 0.2, 0.4, 0.6, 0.8, 0.9, 1] : undefined
    }
  };

  // Emotion-driven eye animations
  let leftEyeRotate = state === "idle" ? 22 : state === "listening" ? 0 : state === "processing" ? 0 : -15;
  let rightEyeRotate = state === "idle" ? -22 : state === "listening" ? 0 : state === "processing" ? 0 : 15;
  let eyeHeight = state === "listening" ? "1.5rem" : "0.5rem";
  let eyeBorderRadius = state === "listening" ? "50%" : "9999px";

  if (state === "speaking" || state === "idle") {
    if (activeEmotion === "happy") {
      eyeBorderRadius = "50% 50% 10% 10%";
      eyeHeight = "1rem";
    } else if (activeEmotion === "sad") {
      leftEyeRotate = 15;
      rightEyeRotate = -15;
    } else if (activeEmotion === "angry") {
      leftEyeRotate = -30;
      rightEyeRotate = 30;
    } else if (activeEmotion === "surprised") {
      eyeHeight = "2rem";
      eyeBorderRadius = "50%";
      leftEyeRotate = 0;
      rightEyeRotate = 0;
    } else if (activeEmotion === "sassy") {
      leftEyeRotate = -15;
      rightEyeRotate = 0;
      eyeHeight = "0.75rem";
    }
  }

  const leftEyeAnim = {
      rotate: leftEyeRotate,
      scaleY: state === "listening" ? [2.5, 2.8, 2.4, 2.6, 2.5] : 1,
      scaleX: state === "listening" ? 1.5 : 1,
      borderRadius: eyeBorderRadius,
      height: eyeHeight,
      transition: state === "listening" ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 300, damping: 20 }
  };

  const rightEyeAnim = {
      rotate: rightEyeRotate,
      scaleY: state === "listening" ? [2.5, 2.4, 2.7, 2.3, 2.5] : 1,
      scaleX: state === "listening" ? 1.5 : 1,
      borderRadius: eyeBorderRadius,
      height: eyeHeight,
      transition: state === "listening" ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 300, damping: 20 }
  };

  const mouthAnim = {
     height: state === "speaking" ? ["0.25rem", "1.5rem", "0.4rem", "1.2rem", "0.6rem", "1.8rem", "0.25rem"] : state === "idle" ? "0.75rem" : state === "processing" ? "0.25rem" : "0.5rem",
     width: state === "listening" ? ["1rem", "1.2rem", "0.9rem", "1.1rem", "1rem"] : state === "speaking" ? ["1.5rem", "1.2rem", "1.8rem", "1.4rem", "1.5rem"] : "1.5rem",
     borderRadius: state === "speaking" ? "50%" : state === "idle" ? "0 0 1rem 1rem" : "9999px",
     borderBottomWidth: state === "idle" ? "4px" : "0px",
     backgroundColor: state === "idle" ? "transparent" : state === "speaking" ? ["#ffffff", "#ffecd2", "#ffffff", "#ffecd2", "#ffffff"] : "white",
     marginTop: state === "idle" ? "1.5rem" : "2rem",
     transition: state === "speaking" ? { duration: 0.8, repeat: Infinity, ease: "easeInOut", times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1] } 
                 : state === "listening" ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                 : { type: "spring" }
  };

  const getThemeVars = () => {
     const themes: Record<string, any> = {
        yaman: { primary: "rgba(255, 159, 28, 0.4)", accent1: "from-amber-100 to-orange-200", accent2: "from-orange-400 to-amber-200", dark: "rgba(255, 159, 28, 0.8)", light: "rgba(255, 200, 100, 1)" },
        bhairavi: { primary: "rgba(139, 92, 246, 0.4)", accent1: "from-purple-100 to-fuchsia-200", accent2: "from-fuchsia-400 to-purple-200", dark: "rgba(139, 92, 246, 0.8)", light: "rgba(200, 150, 255, 1)" },
        megh: { primary: "rgba(34, 211, 238, 0.4)", accent1: "from-cyan-100 to-blue-200", accent2: "from-blue-400 to-cyan-200", dark: "rgba(34, 211, 238, 0.8)", light: "rgba(100, 240, 255, 1)" },
        deepak: { primary: "rgba(239, 68, 68, 0.4)", accent1: "from-red-100 to-rose-200", accent2: "from-rose-400 to-red-200", dark: "rgba(239, 68, 68, 0.8)", light: "rgba(255, 120, 120, 1)" },
        malhar: { primary: "rgba(52, 211, 153, 0.4)", accent1: "from-emerald-100 to-teal-200", accent2: "from-teal-400 to-emerald-200", dark: "rgba(52, 211, 153, 0.8)", light: "rgba(120, 255, 200, 1)" },
        darbari: { primary: "rgba(129, 140, 248, 0.4)", accent1: "from-indigo-100 to-violet-200", accent2: "from-violet-400 to-indigo-200", dark: "rgba(129, 140, 248, 0.8)", light: "rgba(180, 180, 255, 1)" },
     };
     return themes[mood] || themes.yaman;
  };

  const themeVars = getThemeVars();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none p-10 z-20">
       <motion.div 
         animate={bobbingAnim} 
         drag 
         dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }} 
         dragElastic={0.2}
         onDoubleClick={() => setOverrideEmotion("happy")}
         onDragStart={() => setOverrideEmotion("happy")}
         onDragEnd={() => {
            setTimeout(() => setOverrideEmotion(null), 1000);
         }}
         onPointerMove={(e) => {
           if (e.buttons > 0) return; // Don't trigger if dragging
           // Randomly set to happy if mouse moves over it vigorously (simple 5% chance per move event)
           if (Math.random() < 0.05 && activeEmotion !== "happy") {
             setOverrideEmotion("happy");
           }
         }}
         className="relative flex flex-col items-center mt-[-10vh] pointer-events-auto cursor-grab active:cursor-grabbing scale-50 md:scale-75 transform-origin-center"
       >
          
          {/* Background Aura */}
          <motion.div 
             animate={{ 
                scale: state === 'speaking' ? [1, 1.25, 0.95, 1.15, 1] : state === 'listening' ? [1, 1.1, 1] : 1, 
                opacity: state === 'speaking' ? [0.6, 0.9, 0.7, 1, 0.6] : state === 'listening' ? [0.4, 0.7, 0.4] : 0.4 
             }}
             transition={{ duration: state === 'speaking' ? 1.2 : state === 'listening' ? 2 : 1, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[60px]"
             style={{ backgroundColor: themeVars.primary }}
          />

          {/* Head */}
          <div className={`relative w-48 h-48 md:w-56 md:h-56 z-10 transition-transform hover:scale-105 duration-300 pointer-events-auto cursor-pointer drop-shadow-[0_25px_30px_rgba(0,0,0,0.7)] group`}>
             
             {/* Left Ear */}
             <div className={`absolute -left-5 top-16 w-8 h-16 bg-gradient-to-b ${themeVars.accent1} rounded-[2rem_0_0_2rem] shadow-[inset_-3px_-5px_10px_rgba(0,0,0,0.3),inset_2px_2px_5px_rgba(255,255,255,0.9),0_10px_15px_rgba(0,0,0,0.4)] flex items-center justify-center z-0 border border-white/40`}>
                <div className="w-1.5 h-6 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
             </div>
             
             {/* Right Ear */}
             <div className={`absolute -right-5 top-16 w-8 h-16 bg-gradient-to-b ${themeVars.accent1} rounded-[0_2rem_2rem_0] shadow-[inset_3px_-5px_10px_rgba(0,0,0,0.3),inset_-2px_2px_5px_rgba(255,255,255,0.9),0_10px_15px_rgba(0,0,0,0.4)] flex items-center justify-center z-0 border border-white/40`}>
                <div className="w-1.5 h-6 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
             </div>

             {/* Headset wire (Right side) */}
             <div className="absolute -right-[1.1rem] top-[4.5rem] w-8 h-24 border-r-[3px] border-b-[3px] border-white/60 rounded-br-[1rem] shadow-[2px_2px_5px_rgba(0,0,0,0.2)] z-[-1]" />
             
             {/* Casing (Holographic/Silver look - Highly 3D) */}
             <div className="w-full h-full bg-gradient-to-br from-[#ffffff] via-[#e2e8f0] to-[#cbd5e1] rounded-[45%] shadow-[inset_-10px_-15px_25px_rgba(0,0,0,0.15),inset_10px_10px_20px_rgba(255,255,255,1),0_0_0_2px_rgba(255,255,255,0.5)] p-[8px] relative overflow-hidden z-10 box-border">
                
                {/* Inner Black Screen (Deep Recess) */}
                <div 
                   className="w-full h-full rounded-[42%] shadow-[inset_10px_10px_30px_rgba(0,0,0,0.9),inset_-5px_-5px_15px_rgba(0,0,0,0.8),0_2px_10px_rgba(255,255,255,0.5)] relative flex flex-col items-center justify-center overflow-hidden border border-[#050505]"
                   style={{ background: 'radial-gradient(ellipse at top right, #2a2d35 0%, #111318 50%, #050505 100%)' }}
                >
                   
                   {/* Glass glare (Top) */}
                   <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-white/10 to-transparent rounded-[50%] rotate-[-15deg] pointer-events-none blur-[2px]" />
                   {/* Glass reflection curve (Bottom) */}
                   <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[30%] bg-gradient-to-t from-white/5 to-transparent rounded-[50%] rotate-[10deg] pointer-events-none blur-[4px]" />
                   
                   {/* Eyes Container */}
                   <div className="flex justify-between w-24 md:w-28 mt-2 z-10 relative">
                       {/* Left Eye */}
                       <motion.div 
                          className="w-9 h-2.5 bg-[#ffffff] origin-right"
                          style={{ boxShadow: "0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.4)" }}
                          animate={leftEyeAnim}
                       />
                       {/* Right Eye */}
                       <motion.div 
                          className="w-9 h-2.5 bg-[#ffffff] origin-left"
                          style={{ boxShadow: "0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.4)" }}
                          animate={rightEyeAnim}
                       />
                   </div>

                   {/* Mouth */}
                   <motion.div 
                      className="border-white z-10 relative"
                      style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8)) drop-shadow(0 0 15px rgba(255,255,255,0.4))" }}
                      animate={mouthAnim}
                   />
                </div>
             </div>
          </div>

          {/* Body (Chibi Jacket, Arms Crossed - Highly 3D) */}
          <div className="relative -mt-4 z-0 flex flex-col items-center drop-shadow-[0_25px_25px_rgba(0,0,0,0.5)]">
              {/* Jacket */}
              <div className="w-28 h-24 md:w-32 md:h-28 rounded-[1.5rem_1.5rem_0.5rem_0.5rem] bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] shadow-[inset_-8px_-10px_20px_rgba(0,0,0,0.15),inset_5px_5px_15px_rgba(255,255,255,1),0_0_0_2px_rgba(255,255,255,0.6)] relative overflow-hidden flex flex-col items-center z-10 box-border border-b-2 border-gray-300 border-x-2 border-x-white/50">
                 {/* Zipper line */}
                 <div className="h-full w-1.5 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 absolute left-1/2 -translate-x-1/2 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2)]" />
                 {/* Pocket details */}
                 <div className="absolute bottom-4 left-4 w-4 h-6 rounded-sm bg-gradient-to-br from-white to-gray-100 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_3px_rgba(0,0,0,0.1),1px_1px_3px_rgba(0,0,0,0.1)]" />
                 <div className="absolute bottom-4 right-4 w-4 h-6 rounded-sm bg-gradient-to-br from-white to-gray-100 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_3px_rgba(0,0,0,0.1),1px_1px_3px_rgba(0,0,0,0.1)]" />
                 
                 {/* Arms crossed (3D pills) */}
                 <div className="absolute mt-6 flex justify-center w-full z-10 drop-shadow-[0_8px_10px_rgba(0,0,0,0.3)]">
                    {/* Upper Arm Left */}
                    <div className="w-16 h-6 bg-gradient-to-tr from-gray-300 to-gray-50 rounded-full transform rotate-[25deg] translate-x-3 translate-y-1 shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_2px_2px_5px_rgba(255,255,255,0.9)] z-10" />
                    {/* Upper Arm Right (Overlaps) */}
                    <div className="w-16 h-6 bg-gradient-to-tl from-gray-300 to-white rounded-full transform rotate-[-25deg] -translate-x-3 shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,1)] z-20 flex items-center">
                        {/* Blue cuff accent */}
                        <div className={`w-3 h-full bg-gradient-to-r ${themeVars.accent2} ml-0.5 rounded-l-full shadow-[inset_1px_0_3px_rgba(255,255,255,0.6)]`} />
                    </div>
                 </div>
              </div>
              
              {/* Legs */}
              <div className="flex gap-4 -mt-2 z-[-1]">
                 <div className={`w-6 h-10 bg-gradient-to-b from-[#cbd5e1] ${themeVars.accent1.split(' ')[1]} rounded-b-xl shadow-[inset_-2px_-5px_10px_rgba(0,0,0,0.2),inset_2px_2px_5px_rgba(255,255,255,0.6),0_5px_10px_rgba(0,0,0,0.3)] relative`}>
                     {/* Foot accent */}
                     <div className="absolute -bottom-1 -left-2 w-10 h-3 rounded-[50%] blur-[4px] opacity-80" style={{ backgroundColor: themeVars.light }} />
                 </div>
                 <div className={`w-6 h-10 bg-gradient-to-b from-[#cbd5e1] ${themeVars.accent2.split(' ')[1]} rounded-b-xl shadow-[inset_2px_-5px_10px_rgba(0,0,0,0.2),inset_-2px_2px_5px_rgba(255,255,255,0.6),0_5px_10px_rgba(0,0,0,0.3)] relative`}>
                     {/* Foot accent */}
                     <div className="absolute -bottom-1 -right-2 w-10 h-3 rounded-[50%] blur-[4px] opacity-80" style={{ backgroundColor: themeVars.light }} />
                 </div>
              </div>
          </div>
       </motion.div>
    </div>
  );
}
