import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Keyboard, Send, Trash2, Settings as SettingsIcon, Search, Sparkles, Image as ImageIcon, CheckSquare, Code, Paperclip, FileText, X, ExternalLink, Loader2, ShieldCheck, BarChart3 } from "lucide-react";
import { getSwaraResponse, getSwaraAudio, resetSwaraSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import VoiceSettings from "./components/VoiceSettings";
import ChatHistory from "./components/ChatHistory";
import ArtGenerator from "./components/ArtGenerator";
import TaskManager from "./components/TaskManager";
import EmbedWidgetModal from "./components/EmbedWidgetModal";
import MicPromptModal from "./components/MicPromptModal";
import Auth from "./components/Auth";
import LoginPromptToast from "./components/LoginPromptToast";
import Onboarding from "./components/Onboarding";
import PdfSearchModal from "./components/PdfSearchModal";
import DesktopRecommendation from "./components/DesktopRecommendation";
import VerificationModal from "./components/verification/VerificationModal";
import VerificationDashboard from "./components/dashboard/VerificationDashboard";
import VerificationResultView from "./components/verification/VerificationResult";
import type { VerificationResult } from "./services/verificationService";
import { auth } from "./lib/firebase";
import { saveMessage, subscribeToMessages, saveUserSettings, loadUserSettings, wipeHistory } from "./services/firebaseService";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "swara";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [user, setUser] = useState(auth.currentUser);

  // Settings State
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("swara_is_muted") === "true");
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem("swara_selected_voice") || "Kore");
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem("swara_selected_mood") || "sassy");
  const [voiceSpeed, setVoiceSpeed] = useState(() => parseFloat(localStorage.getItem("swara_voice_speed") || "1.0"));
  const [voicePitch, setVoicePitch] = useState(() => parseInt(localStorage.getItem("swara_voice_pitch") || "0"));
  const [voiceAccent, setVoiceAccent] = useState(() => localStorage.getItem("swara_voice_accent") || "Neutral Indian");
  const [selectedLanguageModel, setSelectedLanguageModel] = useState(() => {
    const saved = localStorage.getItem("swara_language_model");
    if (!saved || saved.includes("image") || saved.includes("imagen")) return "gemini-3.1-flash-lite-preview";
    return saved;
  });
  const [selectedImageModel, setSelectedImageModel] = useState(() => {
    const saved = localStorage.getItem("swara_image_model");
    if (!saved || saved === "gemini-2.5-flash-image" || saved === "imagen-3.0-generate-001") return "imagen-3.0-generate-002";
    return saved;
  });
  const [targetLanguage, setTargetLanguage] = useState(() => localStorage.getItem("swara_target_language") || "auto");
  const [aiTemperature, setAiTemperature] = useState(() => parseFloat(localStorage.getItem("swara_ai_temp") || "0.7"));
  const [aiMaxTokens, setAiMaxTokens] = useState(() => parseInt(localStorage.getItem("swara_ai_max_tokens") || "800", 10));
  
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showArtGenerator, setShowArtGenerator] = useState(false);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [showPdfSearch, setShowPdfSearch] = useState(false);
  const [showEmbedWidget, setShowEmbedWidget] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [showVerificationDashboard, setShowVerificationDashboard] = useState(false);
  const [selectedVerificationResult, setSelectedVerificationResult] = useState<VerificationResult | null>(null);
  const [pdfContexts, setPdfContexts] = useState<{id: string, name: string, data: string, mimeType: string, selected: boolean}[]>([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [micState, setMicState] = useState<"checking" | "granted" | "prompt">("checking");
  const [currentEmotion, setCurrentEmotion] = useState("neutral");

  useEffect(() => {
    const checkMic = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
           setMicState("prompt");
           return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicLabels = devices.some(d => d.kind === 'audioinput' && d.label);
        if (hasMicLabels) {
          setMicState("granted");
        } else {
          setMicState("prompt");
        }
      } catch (e) {
        setMicState("prompt");
      }
    };
    checkMic();

    // Listen for device changes (e.g. if a user plugs in a mic)
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', checkMic);
      return () => navigator.mediaDevices.removeEventListener('devicechange', checkMic);
    }
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (auth.currentUser) return []; // Will be loaded from Firebase
    const saved = localStorage.getItem("swara_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      
      // Cleanup previous message subscription
      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
      }

      if (u) {
        // Load initial settings from Firebase
        loadUserSettings().then(settings => {
          if (settings) {
            setSelectedVoice(settings.selectedVoice);
            setSelectedMood(settings.selectedMood);
            setVoiceSpeed(settings.voiceSpeed);
            setVoicePitch(settings.voicePitch);
            setVoiceAccent(settings.voiceAccent);
            setIsMuted(settings.isMuted);
          }
        });

        // Subscribe to messages
        unsubscribeMessages = subscribeToMessages(u, (fetchedMessages) => {
          setMessages(fetchedMessages);
        });
      } else {
        // Load from local storage if logged out
        const saved = localStorage.getItem("swara_chat_history");
        if (saved) {
          try {
            setMessages(JSON.parse(saved));
          } catch (e) {
            setMessages([]);
          }
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    if (!user) localStorage.setItem("swara_chat_history", JSON.stringify(messages));
  }, [messages, user]);

  useEffect(() => {
    if (!user) localStorage.setItem("swara_selected_voice", selectedVoice);
    if (user) saveUserSettings({ selectedVoice, selectedMood, isMuted, voiceSpeed, voicePitch, voiceAccent });
    if (liveSessionRef.current) {
      liveSessionRef.current.voiceName = selectedVoice === "Custom" ? "Kore" : selectedVoice;
    }
  }, [selectedVoice, user]);

  useEffect(() => {
    if (!user) localStorage.setItem("swara_selected_mood", selectedMood);
    if (user) saveUserSettings({ selectedVoice, selectedMood, isMuted, voiceSpeed, voicePitch, voiceAccent });
    if (liveSessionRef.current) {
      liveSessionRef.current.mood = selectedMood;
    }
  }, [selectedMood, user]);

  useEffect(() => {
    if (!user) localStorage.setItem("swara_voice_speed", voiceSpeed.toString());
    if (user) saveUserSettings({ selectedVoice, selectedMood, isMuted, voiceSpeed, voicePitch, voiceAccent });
    if (liveSessionRef.current) {
      liveSessionRef.current.voiceSpeed = voiceSpeed;
    }
  }, [voiceSpeed, user]);

  useEffect(() => {
    if (!user) localStorage.setItem("swara_voice_pitch", voicePitch.toString());
    if (user) saveUserSettings({ selectedVoice, selectedMood, isMuted, voiceSpeed, voicePitch, voiceAccent });
    if (liveSessionRef.current) {
      liveSessionRef.current.voicePitch = voicePitch;
    }
  }, [voicePitch, user]);

  useEffect(() => {
    if (!user) localStorage.setItem("swara_voice_accent", voiceAccent);
    if (user) saveUserSettings({ selectedVoice, selectedMood, isMuted, voiceSpeed, voicePitch, voiceAccent });
    if (liveSessionRef.current) {
      liveSessionRef.current.voiceAccent = voiceAccent;
    }
  }, [voiceAccent, user]);

  useEffect(() => {
    if (!user) localStorage.setItem("swara_is_muted", isMuted.toString());
    if (user) saveUserSettings({ selectedVoice, selectedMood, isMuted, voiceSpeed, voicePitch, voiceAccent });
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted, user]);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [hasPromptedName, setHasPromptedName] = useState(() => localStorage.getItem("swara_has_prompted_name") === "true");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  // Ask the user who is using
  useEffect(() => {
    if (!hasPromptedName && messages.length === 0 && appState === "idle" && micState === "granted") {
      setHasPromptedName(true);
      localStorage.setItem("swara_has_prompted_name", "true");
      
      const promptUser = async () => {
        const greeting = "Namaste! Main Swara hoon. Kya main jaan sakti hoon ki aaj app kaun use kar raha hai?";
        if (auth.currentUser) {
           saveMessage("swara", greeting);
        } else {
           setMessages((prev) => [...prev, { id: Date.now().toString() + "-welcome", sender: "swara", text: greeting }]);
        }
        
        if (!isMuted) {
          setAppState("speaking");
          const voiceToUse = selectedVoice === "Custom" ? "Kore" : selectedVoice;
          const audioBase64 = await getSwaraAudio(greeting, voiceToUse);
          if (audioBase64) {
             await playPCM(audioBase64);
          } else {
             const utterance = new SpeechSynthesisUtterance(greeting);
             window.speechSynthesis.speak(utterance);
          }
          setAppState("idle");
        }
      };
      
      const timer = setTimeout(promptUser, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasPromptedName, messages.length, appState, isMuted, selectedVoice]);

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    if (user) {
      saveMessage("user", finalTranscript);
    } else {
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: finalTranscript }]);
    }
    
    // If live session is active, send text through it
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");

    // 1. Check for browser commands
    const commandResult = processCommand(finalTranscript);

    let responseText = "";

    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      if (user) {
        saveMessage("swara", responseText);
      } else {
        setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "swara", text: responseText }]);
      }
      
      if (!isMuted) {
        setAppState("speaking");
        const voiceToUse = selectedVoice === "Custom" ? "Kore" : selectedVoice;
        const audioBase64 = await getSwaraAudio(responseText, voiceToUse);
        if (audioBase64) {
          await playPCM(audioBase64);
        } else {
          const utterance = new SpeechSynthesisUtterance(responseText);
          window.speechSynthesis.speak(utterance);
        }
      }

      setAppState("idle");

      setTimeout(() => {
        if (commandResult.url) {
          window.open(commandResult.url, "_blank");
        }
      }, 1500);
    } else {
      // 2. General Chit-Chat via Gemini
      const userName = auth.currentUser?.displayName || "the user";
      const activePdfs = pdfContexts.filter(pdf => pdf.selected);
      const aiResponse = await getSwaraResponse(finalTranscript, messagesRef.current, selectedMood, { speed: voiceSpeed, pitch: voicePitch, accent: voiceAccent }, userName, selectedLanguageModel, aiTemperature, aiMaxTokens, targetLanguage, activePdfs);
      
      responseText = aiResponse.text;
      setCurrentEmotion(aiResponse.emotion);

      if (user) {
        saveMessage("swara", responseText);
      } else {
        setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "swara", text: responseText }]);
      }
      
      if (!isMuted) {
        setAppState("speaking");
        const voiceToUse = selectedVoice === "Custom" ? "Kore" : selectedVoice;
        const audioBase64 = await getSwaraAudio(responseText, voiceToUse);
        if (audioBase64) {
          await playPCM(audioBase64);
        } else {
          const utterance = new SpeechSynthesisUtterance(responseText);
          window.speechSynthesis.speak(utterance);
        }
      }
      setAppState("idle");
    }
  }, [isMuted, isSessionActive, selectedVoice, selectedMood]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetSwaraSession();
    } else {
      try {
        setIsSessionActive(true);
        resetSwaraSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        session.voiceName = selectedVoice === "Custom" ? "Kore" : selectedVoice;
        session.mood = selectedMood;
        session.voiceSpeed = voiceSpeed;
        session.voicePitch = voicePitch;
        session.voiceAccent = voiceAccent;
        session.targetLanguage = targetLanguage;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };
        
        session.onMessage = (sender, text) => {
          if (auth.currentUser) {
            saveMessage(sender, text);
          } else {
            setMessages((prev) => [...prev, { id: Date.now().toString() + "-" + sender, sender, text }]);
          }
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            window.open(url, "_blank");
          }, 1000);
        };

        await session.start();
      } catch (e: any) {
        console.error("Failed to start session", e);
        setPermissionError(e.message || "Failed to start live session.");
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const validFiles = files.filter(file => file.type === "application/pdf");
    
    if (validFiles.length > 0) {
      setIsPdfProcessing(true);
      setAppState("processing");
      try {
        const { extractTextFromPdf } = await import('./services/pdfService');
        
        const MAX_FILE_SIZE_MB = 10;
        
        for (const file of validFiles) {
          if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            alert(`File "${file.name}" is too large. Please upload PDFs smaller than ${MAX_FILE_SIZE_MB}MB.`);
            continue;
          }

          const extractedText = await extractTextFromPdf(file);
          
          setPdfContexts(prev => {
            const currentTotalChars = prev.filter(p => p.selected).reduce((acc, curr) => acc + curr.data.length, 0);
            const MAX_CHARS = 100000;
            
            let textToAdd = extractedText;
            let warnUser = false;
            
            if (currentTotalChars + extractedText.length > MAX_CHARS) {
              const allowedChars = MAX_CHARS - currentTotalChars;
              if (allowedChars <= 0) {
                alert(`Cannot add "${file.name}". You have reached the 100,000 character limit for PDF context limit.`);
                return prev;
              }
              textToAdd = extractedText.substring(0, allowedChars) + "\n...[TRUNCATED DUE TO 100K CHAR LIMIT]";
              warnUser = true;
            }

            if (warnUser) {
              alert(`Warning: "${file.name}" was truncated to fit within the 100,000 character limit for PDF context.`);
            }

            return [...prev, {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              data: textToAdd, // Now storing extracted text instead of base64
              mimeType: "text/plain", // Change to text/plain since we extracted text
              selected: true
            }];
          });
        }
      } catch (error: any) {
        console.error("PDF read error:", error);
        if (error?.message?.includes('Password') || error?.name === 'PasswordException') {
            alert("Failed to read PDF file: The PDF is password protected. Please unlock it and try again.");
        } else if (error?.name === 'InvalidPDFException' || error?.message?.includes('Invalid or corrupted')) {
            alert("Failed to read PDF file: The PDF seems to be invalid or corrupted.");
        } else {
            alert(`Failed to read PDF file: ${error?.message || 'Unknown error occurred or file is corrupted.'}`);
        }
      } finally {
        setIsPdfProcessing(false);
        setAppState("idle");
      }
    } else if (files.length > 0) {
      alert("Please upload valid PDF files ending with .pdf.");
    }
    
    // reset input
    if (e.target) {
      e.target.value = "";
    }
  };

  const getThemeBackground = () => {
    switch (selectedMood) {
      case "sassy": return "radial-gradient(circle at 10% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(153, 27, 27, 0.4) 0%, #0b141d 100%), url(\"data:image/svg+xml,%3Csvg width='800' height='800' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.1' stroke-opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='45'/%3E%3Ccircle cx='50' cy='50' r='35'/%3E%3Ccircle cx='50' cy='50' r='25'/%3E%3Cpath d='M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(-45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(90 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10'/%3E%3C/g%3E%3C/svg%3E\"), url(\"https://www.transparenttextures.com/patterns/natural-paper.png\")";
      case "calm": return "radial-gradient(circle at 10% 20%, rgba(34, 211, 238, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(34, 197, 94, 0.08) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(21, 94, 117, 0.4) 0%, #0b141d 100%), url(\"data:image/svg+xml,%3Csvg width='800' height='800' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.1' stroke-opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='45'/%3E%3Ccircle cx='50' cy='50' r='35'/%3E%3Ccircle cx='50' cy='50' r='25'/%3E%3Cpath d='M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(-45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(90 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10'/%3E%3C/g%3E%3C/svg%3E\"), url(\"https://www.transparenttextures.com/patterns/natural-paper.png\")";
      case "playful": return "radial-gradient(circle at 10% 20%, rgba(255, 159, 28, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(231, 111, 81, 0.08) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(38, 70, 83, 0.4) 0%, #0b141d 100%), url(\"data:image/svg+xml,%3Csvg width='800' height='800' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.1' stroke-opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='45'/%3E%3Ccircle cx='50' cy='50' r='35'/%3E%3Ccircle cx='50' cy='50' r='25'/%3E%3Cpath d='M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(-45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(90 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10'/%3E%3C/g%3E%3C/svg%3E\"), url(\"https://www.transparenttextures.com/patterns/natural-paper.png\")";
      case "formal": return "radial-gradient(circle at 10% 20%, rgba(129, 140, 248, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.4) 0%, #0b141d 100%), url(\"data:image/svg+xml,%3Csvg width='800' height='800' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.1' stroke-opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='45'/%3E%3Ccircle cx='50' cy='50' r='35'/%3E%3Ccircle cx='50' cy='50' r='25'/%3E%3Cpath d='M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(-45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(90 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10'/%3E%3C/g%3E%3C/svg%3E\"), url(\"https://www.transparenttextures.com/patterns/natural-paper.png\")";
      default: return "radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(231, 111, 81, 0.08) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(38, 70, 83, 0.4) 0%, #0b141d 100%), url(\"data:image/svg+xml,%3Csvg width='800' height='800' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.1' stroke-opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='45'/%3E%3Ccircle cx='50' cy='50' r='35'/%3E%3Ccircle cx='50' cy='50' r='25'/%3E%3Cpath d='M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(-45 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10' transform='rotate(90 50 50)'/%3E%3Cellipse cx='50' cy='50' rx='40' ry='10'/%3E%3C/g%3E%3C/svg%3E\"), url(\"https://www.transparenttextures.com/patterns/natural-paper.png\")";
    }
  };

  return (
    <div className="h-[100dvh] w-screen hindustani-bg text-cream flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0" style={{ backgroundImage: getThemeBackground() }}>
      <Onboarding />
      <DesktopRecommendation />
      <LoginPromptToast />
      
      {showPermissionModal && (
        <PermissionModal 
          onClose={() => setShowPermissionModal(false)}
          errorMessage={permissionError}
        />
      )}

      <AnimatePresence>
        {micState === "prompt" && (
          <MicPromptModal 
            onGranted={() => setMicState("granted")} 
            onDismiss={() => { setMicState("granted"); setShowTextInput(true); }} // Let them pass into the app without microphone
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVoiceSettings && (
          <VoiceSettings
            currentVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            currentMood={selectedMood}
            onMoodChange={setSelectedMood}
            voiceSpeed={voiceSpeed}
            onSpeedChange={setVoiceSpeed}
            voicePitch={voicePitch}
            onPitchChange={setVoicePitch}
            voiceAccent={voiceAccent}
            onAccentChange={setVoiceAccent}
            currentLanguageModel={selectedLanguageModel}
            onLanguageModelChange={(model) => {
              setSelectedLanguageModel(model);
              localStorage.setItem("swara_language_model", model);
            }}
            currentImageModel={selectedImageModel}
            onImageModelChange={(model) => {
              setSelectedImageModel(model);
              localStorage.setItem("swara_image_model", model);
            }}
            targetLanguage={targetLanguage}
            onTargetLanguageChange={(lang) => {
              setTargetLanguage(lang);
              localStorage.setItem("swara_target_language", lang);
            }}
            aiTemperature={aiTemperature}
            onTemperatureChange={(temp) => {
              setAiTemperature(temp);
              localStorage.setItem("swara_ai_temp", temp.toString());
            }}
            aiMaxTokens={aiMaxTokens}
            onMaxTokensChange={(tokens) => {
              setAiMaxTokens(tokens);
              localStorage.setItem("swara_ai_max_tokens", tokens.toString());
            }}
            pdfContexts={pdfContexts}
            setPdfContexts={setPdfContexts}
            onClose={() => setShowVoiceSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChatHistory && (
          <ChatHistory
            messages={messages}
            onClose={() => setShowChatHistory(false)}
            onClearHistory={() => {
              if (user) {
                wipeHistory();
              } else {
                setMessages([]);
                resetSwaraSession();
              }
              setShowChatHistory(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showArtGenerator && (
          <ArtGenerator onClose={() => setShowArtGenerator(false)} aiModel={selectedImageModel} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTaskManager && (
          <TaskManager onClose={() => setShowTaskManager(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmbedWidget && (
          <EmbedWidgetModal onClose={() => setShowEmbedWidget(false)} />
        )}
      </AnimatePresence>

      {/* Cinematic Background Gradients & Monument */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Monument Silhouette Base */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[60vh] md:h-[80vh] w-full opacity-20 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=2934')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)',
            filter: 'sepia(30%)'
          }}
        />

        <motion.div 
          animate={{
            backgroundColor: selectedMood === 'sassy' ? 'rgba(239, 68, 68, 0.15)' : 
                             selectedMood === 'calm' ? 'rgba(34, 211, 238, 0.15)' :
                             selectedMood === 'playful' ? 'rgba(255, 159, 28, 0.15)' :
                             'rgba(129, 140, 248, 0.15)'
          }}
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000" 
        />
        <motion.div 
          animate={{
            backgroundColor: selectedMood === 'sassy' ? 'rgba(245, 158, 11, 0.15)' : 
                             selectedMood === 'calm' ? 'rgba(34, 197, 94, 0.15)' :
                             selectedMood === 'playful' ? 'rgba(231, 111, 81, 0.15)' :
                             'rgba(59, 130, 246, 0.15)'
          }}
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000" 
        />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-20 shrink-0 px-4 py-4 md:px-12 md:py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 group cursor-default"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-marigold to-terracotta flex items-center justify-center shadow-lg border border-marigold/30 group-hover:rotate-12 transition-transform duration-300">
            <Sparkles size={16} className="text-peacock fill-peacock/20 md:w-5 md:h-5" />
          </div>
          <h1 className="text-xl md:text-2xl font-cute font-bold text-marigold tracking-tight drop-shadow-md group-hover:scale-105 transition-transform duration-300">Swara</h1>
        </motion.div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => window.open('https://advance-swara.vercel.app/', '_blank')}
            className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 md:py-2 md:px-4 rounded-full glass hover:bg-cream/10 border-marigold/20 text-marigold transition-all font-medium text-xs md:text-sm shadow-sm"
            title="Open Advance Swara"
          >
            Advance Swara
            <ExternalLink size={14} className="md:w-4 md:h-4 opacity-80" />
          </button>
          <Auth />
          <button
            onClick={() => setShowEmbedWidget(true)}
            className="p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors"
            title="Embed Swara"
          >
            <Code size={16} className="text-saffron md:w-[18px] md:h-[18px]" />
          </button>
          <button
            id="onboarding-tasks"
            onClick={() => setShowTaskManager(true)}
            className="p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors"
            title="My Tasks"
          >
            <CheckSquare size={16} className="text-saffron md:w-[18px] md:h-[18px]" />
          </button>
          <button
            id="onboarding-art"
            onClick={() => setShowArtGenerator(true)}
            className="p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors"
            title="Generate Art"
          >
            <ImageIcon size={16} className="text-saffron md:w-[18px] md:h-[18px]" />
          </button>
          <input 
            type="file" 
            accept="application/pdf"
            multiple
            className="hidden" 
            ref={fileInputRef}
            onChange={handlePdfUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors ${pdfContexts.length > 0 ? 'bg-marigold/20' : ''}`}
            title={pdfContexts.length > 0 ? `${pdfContexts.length} PDF(s) loaded` : "Upload PDF Context"}
            disabled={isPdfProcessing}
          >
            {isPdfProcessing ? (
              <Loader2 size={16} className="text-marigold md:w-[18px] md:h-[18px] animate-spin" />
            ) : (
              <FileText size={16} className={`${pdfContexts.length > 0 ? 'text-marigold' : 'text-saffron'} md:w-[18px] md:h-[18px]`} />
            )}
          </button>
          <button
            onClick={() => setShowChatHistory(true)}
            className="p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors"
            title="Chat History"
          >
            <Search size={16} className="text-saffron md:w-[18px] md:h-[18px]" />
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX size={16} className="text-saffron md:w-[18px] md:h-[18px]" />
            ) : (
              <Volume2 size={16} className="text-saffron md:w-[18px] md:h-[18px]" />
            )}
          </button>
          <button
            onClick={() => setShowVerification(true)}
            className="p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors"
            title="Verify Information"
          >
            <ShieldCheck size={16} className="text-marigold md:w-[18px] md:h-[18px]" />
          </button>
          <button
            onClick={() => setShowVerificationDashboard(true)}
            className="p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors"
            title="Verification Dashboard"
          >
            <BarChart3 size={16} className="text-marigold md:w-[18px] md:h-[18px]" />
          </button>
          <button
            id="onboarding-settings"
            onClick={() => setShowVoiceSettings(true)}
            className="p-1.5 md:p-2 rounded-full glass hover:bg-cream/10 transition-colors"
            title="Voice Settings"
          >
            <SettingsIcon size={16} className="text-saffron md:w-[18px] md:h-[18px]" />
          </button>
        </div>
      </header>

      {/* Main Content - Visualizer & Chat */}
      <main className="absolute inset-0 flex flex-row items-center justify-between w-full h-full z-10 overflow-hidden pt-20 pb-24 px-4 md:px-12 pointer-events-none">
        
        {/* Left Column: Swara Status */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
          <div className="h-16 flex items-center">
            <AnimatePresence>
              {appState === "processing" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  className="flex items-center gap-2 p-3 px-4 rounded-[2rem] rounded-bl-sm glass border border-cream/20 shadow-xl"
                >
                  <div className="flex gap-1.5 items-center justify-center h-4">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-saffron"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-saffron"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-saffron"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Visualizer (Fixed Full Screen Background) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer 
            state={appState} 
            mood={selectedMood}
            pitch={voicePitch}
            speed={voiceSpeed}
            emotion={currentEmotion}
          />
        </div>

        {/* Right Column: User Status */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
           <div className="h-16 flex items-center justify-end">
            <AnimatePresence>
              {appState === "listening" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  className="flex items-center gap-3 p-3 px-4 rounded-[2rem] rounded-br-sm glass border border-cream/20 shadow-xl flex-row-reverse"
                >
                   <div className="flex gap-1 items-center justify-center h-4 w-4">
                     <motion.div className="w-1 h-3 rounded-full bg-marigold" animate={{ height: [12, 20, 12] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0 }} />
                     <motion.div className="w-1 h-4 rounded-full bg-marigold" animate={{ height: [16, 24, 16] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                     <motion.div className="w-1 h-2 rounded-full bg-marigold" animate={{ height: [8, 16, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* Controls */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-6 md:pb-8 z-20 shrink-0 gap-4">
        <AnimatePresence>
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md flex flex-col items-center gap-2"
            >
              <form 
                onSubmit={handleTextSubmit}
                className="w-full flex items-center gap-2 glass rounded-full p-1 pl-4 shadow-2xl"
              >
                <input 
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type a message to Swara..."
                  className="flex-1 bg-transparent border-none outline-none text-cream placeholder:text-cream/30 text-sm"
                  autoFocus
                />
                
                <input 
                  type="file" 
                  accept="application/pdf"
                  multiple
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full text-cream/70 hover:text-marigold hover:bg-white/5 transition-colors"
                  title="Upload PDF Context"
                  disabled={isPdfProcessing}
                >
                  {isPdfProcessing ? <Loader2 size={16} className="animate-spin text-marigold" /> : <Paperclip size={16} />}
                </button>

                <button 
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-2 rounded-full bg-marigold text-peacock hover:bg-saffron disabled:opacity-50 disabled:hover:bg-marigold transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
              
              <AnimatePresence>
                {pdfContexts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-wrap items-center justify-center gap-2 mt-2"
                  >
                    {pdfContexts.map(pdf => (
                      <div 
                        key={pdf.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors cursor-pointer ${
                          pdf.selected 
                            ? 'bg-marigold/20 border-marigold/40 text-marigold' 
                            : 'bg-black/20 border-cream/10 text-cream/50'
                        }`}
                        onClick={() => setPdfContexts(prev => prev.map(p => p.id === pdf.id ? { ...p, selected: !p.selected } : p))}
                      >
                        <FileText size={12} className={pdf.selected ? 'opacity-100' : 'opacity-50'} />
                        <span className="max-w-[150px] truncate">{pdf.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPdfContexts(prev => prev.filter(p => p.id !== pdf.id));
                          }} 
                          className="hover:text-red-400 ml-1 transition-colors"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowPdfSearch(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-marigold/30 bg-marigold/10 text-marigold text-xs hover:bg-marigold/20 transition-colors"
                    >
                      <Search size={12} />
                      Search PDFs
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Modals */}
      <AnimatePresence>
        {showPdfSearch && (
          <PdfSearchModal 
            pdfContexts={pdfContexts} 
            onClose={() => setShowPdfSearch(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVerification && (
          <VerificationModal onClose={() => {
            setShowVerification(false);
            setSelectedVerificationResult(null);
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVerificationDashboard && (
          <VerificationDashboard 
            onClose={() => setShowVerificationDashboard(false)}
            onViewResult={(result) => {
              setSelectedVerificationResult(result);
              setShowVerificationDashboard(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVerificationResult && (
          <VerificationResultView 
            result={selectedVerificationResult}
            onClose={() => setSelectedVerificationResult(null)}
          />
        )}
      </AnimatePresence>

        <div className="flex items-center gap-4">
          <button
            id="onboarding-session"
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-full font-medium tracking-widest transition-all duration-300 shadow-2xl uppercase text-sm glass
              ${
                isSessionActive
                  ? "bg-terracotta/20 text-terracotta border-terracotta/50 hover:bg-terracotta/30"
                  : "text-marigold border-marigold/40 hover:bg-marigold/20 hover:scale-105"
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff size={20} />
                <span>End Session</span>
              </>
            ) : (
              <>
                <Mic size={20} className="group-hover:animate-bounce" />
                <span>Start Session</span>
              </>
            )}
          </button>
          
          {!isSessionActive && (
            <button
              id="onboarding-keyboard"
              onClick={() => setShowTextInput(!showTextInput)}
              className="p-4 rounded-full glass hover:bg-cream/10 transition-colors shadow-2xl"
              title="Type instead"
            >
              <Keyboard size={20} className="text-saffron" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
