import React, { useState } from "react";
import { X, Check, Upload, Music, Sunrise, Moon, CloudRain, Flame, FileText, Trash2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceSettingsProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
  currentMood: string;
  onMoodChange: (mood: string) => void;
  voiceSpeed: number;
  onSpeedChange: (speed: number) => void;
  voicePitch: number;
  onPitchChange: (pitch: number) => void;
  voiceAccent: string;
  onAccentChange: (accent: string) => void;
  currentLanguageModel?: string;
  onLanguageModelChange?: (model: string) => void;
  currentImageModel?: string;
  onImageModelChange?: (model: string) => void;
  targetLanguage?: string;
  onTargetLanguageChange?: (lang: string) => void;
  aiTemperature?: number;
  onTemperatureChange?: (temp: number) => void;
  aiMaxTokens?: number;
  onMaxTokensChange?: (tokens: number) => void;
  pdfContexts?: {id: string, name: string, data: string, mimeType: string, selected: boolean}[];
  setPdfContexts?: React.Dispatch<React.SetStateAction<{id: string, name: string, data: string, mimeType: string, selected: boolean}[]>>;
  onClose: () => void;
}

const PREBUILT_VOICES = [
  { id: "Kore", name: "Kore (Default)", gender: "Female", mood: "Balanced" },
  { id: "Puck", name: "Puck", gender: "Male", mood: "Playful" },
  { id: "Charon", name: "Charon", gender: "Male", mood: "Deep" },
  { id: "Fenrir", name: "Fenrir", gender: "Male", mood: "Aggressive" },
  { id: "Aoede", name: "Aoede", gender: "Female", mood: "Soft" },
  { id: "Zephyr", name: "Zephyr", gender: "Male", mood: "Calm" },
];

const MOOD_OPTIONS = [
  { id: "sassy", name: "Sassy", icon: Flame, color: "text-terracotta", bg: "bg-terracotta/10", desc: "Confident, witty, unapologetic" },
  { id: "calm", name: "Calm", icon: Moon, color: "text-sky-400", bg: "bg-sky-500/10", desc: "Peaceful, caring, reassuring" },
  { id: "playful", name: "Playful", icon: Sunrise, color: "text-marigold", bg: "bg-marigold/10", desc: "Energetic, enthusiastic, fun" },
  { id: "formal", name: "Formal", icon: CloudRain, color: "text-indigo-400", bg: "bg-indigo-500/10", desc: "Serious, professional, concise" },
];

const ApiKeysSettings = () => {
  const keys = [
    { id: "GEMINI_API_KEY", label: "Gemini API Key" },
    { id: "GITHUB_TOKEN", label: "GitHub Token" },
    { id: "GROQ_API_KEY", label: "Groq API Key" },
    { id: "OPENROUTER_API_KEY", label: "OpenRouter API Key" },
    { id: "OPENAI_API_KEY", label: "OpenAI API Key" },
  ];

  const handleKeyChange = (id: string, value: string) => {
    if (value) {
      localStorage.setItem(`swara_key_${id}`, value);
    } else {
      localStorage.removeItem(`swara_key_${id}`);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <label className="text-xs font-semibold text-cream/40 uppercase tracking-widest pl-1">API Keys</label>
      <div className="bg-cream/5 p-4 rounded-xl border border-cream/5 space-y-3">
        {keys.map((key) => (
          <div key={key.id} className="space-y-1">
            <label className="text-[10px] uppercase text-cream/60 tracking-wider pl-1">{key.label}</label>
            <input
              type="password"
              placeholder={`Enter ${key.label}`}
              defaultValue={localStorage.getItem(`swara_key_${key.id}`) || ""}
              onChange={(e) => handleKeyChange(key.id, e.target.value)}
              className="w-full bg-black/20 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream/80 outline-none focus:border-marigold/50 transition-colors"
            />
          </div>
        ))}
        <p className="text-[10px] text-cream/40 mt-2 ml-1">
          Keys entered here are stored locally in your browser and will override environment variables. Let's you easily use other models without redeploying.
        </p>
      </div>
    </div>
  );
};

export default function VoiceSettings({  
  currentVoice, 
  onVoiceChange, 
  currentMood, 
  onMoodChange, 
  voiceSpeed,
  onSpeedChange,
  voicePitch,
  onPitchChange,
  voiceAccent,
  onAccentChange,
  currentLanguageModel = "gemini-3.1-flash-lite-preview",
  onLanguageModelChange,
  currentImageModel = "imagen-3.0-generate-002",
  onImageModelChange,
  targetLanguage = "auto",
  onTargetLanguageChange,
  aiTemperature = 0.7,
  onTemperatureChange,
  aiMaxTokens = 800,
  onMaxTokensChange,
  pdfContexts = [],
  setPdfContexts,
  onClose 
}: VoiceSettingsProps) {
  const [customModelName, setCustomModelName] = useState<string | null>(
    localStorage.getItem("swara_custom_voice_name")
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload this to a server or process it.
      // For now, we simulate "loading" a custom profile.
      setCustomModelName(file.name);
      localStorage.setItem("swara_custom_voice_name", file.name);
      onVoiceChange("Custom");
      alert(`Voice profile "${file.name}" loaded! Swara will now adapt to this model (Simulation).`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass rounded-3xl w-full max-w-md p-6 overflow-y-auto max-h-[90dvh] relative scrollbar-hide shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-cream/10 transition-colors"
        >
          <X size={20} className="text-cream/60" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-marigold/10 flex items-center justify-center border border-marigold/30">
            <Music className="text-marigold" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-serif font-semibold text-marigold tracking-tight">AI Settings</h2>
            <p className="text-sm text-cream/40">Tune Swara's voice and personality.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Mood Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-cream/40 uppercase tracking-widest pl-1">Swara's Current Mood</label>
            <div className="grid grid-cols-2 gap-2">
              {MOOD_OPTIONS.map((mood) => {
                const Icon = mood.icon;
                const isActive = currentMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => onMoodChange(mood.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      isActive 
                        ? `${mood.bg} border-marigold/40 text-cream shadow-lg` 
                        : "bg-cream/5 border-cream/5 text-cream/60 hover:bg-cream/10"
                    }`}
                  >
                    <Icon size={18} className={isActive ? mood.color : "opacity-40"} />
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-sm">{mood.name}</span>
                      <span className="text-[10px] opacity-40">{mood.desc}</span>
                    </div>
                    {isActive && <div className={`ml-auto w-1.5 h-1.5 rounded-full ${
                      mood.id === 'sassy' ? 'bg-terracotta' : 
                      mood.id === 'calm' ? 'bg-sky-400' : 
                      mood.id === 'playful' ? 'bg-marigold' : 
                      'bg-indigo-400'
                    }`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-cream/40 uppercase tracking-widest pl-1">Voice Profile</label>
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-hide">
              {PREBUILT_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => onVoiceChange(voice.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    currentVoice === voice.id
                      ? "bg-marigold/10 border-marigold/50 text-cream"
                      : "bg-cream/5 border-cream/5 text-cream/60 hover:bg-cream/10"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium font-serif">{voice.name}</div>
                    <div className="text-xs opacity-60">
                      {voice.gender} • {voice.mood}
                    </div>
                  </div>
                  {currentVoice === voice.id && <Check size={18} className="text-marigold" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-cream/10">
            <label className="block text-sm font-medium text-cream/60 mb-3">Custom Voice Model</label>
            <div className="relative">
              <input
                type="file"
                className="hidden"
                id="voice-upload"
                accept=".json,.bin,.model,.wav"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="voice-upload"
                className={`flex items-center gap-3 p-4 rounded-xl border border-dashed cursor-pointer transition-all duration-200 ${
                  currentVoice === "Custom"
                    ? "bg-terracotta/10 border-terracotta/50 text-cream"
                    : "bg-cream/5 border-cream/10 text-cream/60 hover:bg-cream/10"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-terracotta/20 flex items-center justify-center border border-terracotta/20">
                  <Upload size={18} className="text-terracotta" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium truncate">
                    {customModelName ? `Loaded: ${customModelName}` : "Upload voice model"}
                  </div>
                  <div className="text-xs opacity-60">Supports .json, .model, or voice samples</div>
                </div>
                {currentVoice === "Custom" && <Check size={18} className="text-terracotta" />}
              </label>
            </div>
          </div>

          {/* Language Model Section */}
          {onLanguageModelChange && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-cream/40 uppercase tracking-widest pl-1">Language Model</label>
              <div className="bg-cream/5 p-4 rounded-xl border border-cream/5">
                <select 
                  value={currentLanguageModel}
                  onChange={(e) => onLanguageModelChange(e.target.value)}
                  className="w-full bg-cream/5 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream/80 outline-none focus:border-marigold/50 transition-colors"
                >
                  <optgroup label="Google Gemini" className="bg-[#1a2e35]">
                    <option value="gemini-3.1-flash-lite-preview" className="bg-[#1a2e35]">Gemini 3.1 Flash Lite Preview</option>
                    <option value="gemini-3.1-flash-preview" className="bg-[#1a2e35]">Gemini 3.1 Flash Preview</option>
                    <option value="gemini-3.1-pro-preview" className="bg-[#1a2e35]">Gemini 3.1 Pro Preview</option>
                    <option value="gemini-2.5-flash" className="bg-[#1a2e35]">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro" className="bg-[#1a2e35]">Gemini 2.5 Pro</option>
                  </optgroup>
                  <optgroup label="Groq" className="bg-[#1a2e35]">
                    <option value="groq:llama-3.1-8b-instant">Llama 3.1 8B (Groq)</option>
                    <option value="groq:llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                    <option value="groq:mixtral-8x7b-32768">Mixtral 8x7B (Groq)</option>
                  </optgroup>
                  <optgroup label="OpenRouter" className="bg-[#1a2e35]">
                    <option value="openrouter:meta-llama/llama-3-8b-instruct">Llama 3 8B (OpenRouter)</option>
                    <option value="openrouter:anthropic/claude-3.7-sonnet">Claude 3.7 Sonnet (OpenRouter)</option>
                  </optgroup>
                  <optgroup label="GitHub Models" className="bg-[#1a2e35]">
                    <option value="github:gpt-4o">GPT-4o (GitHub)</option>
                    <option value="github:gpt-4o-mini">GPT-4o Mini (GitHub)</option>
                  </optgroup>
                  <optgroup label="OpenAI" className="bg-[#1a2e35]">
                    <option value="openai:gpt-4o">GPT-4o (OpenAI)</option>
                    <option value="openai:gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                    <option value="openai:gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
                  </optgroup>
                </select>
                <p className="text-[10px] text-cream/40 mt-2 ml-1 mb-4">
                  Higher-end models (like Pro) are smarter but slower. Lite/Flash models are faster for voice chats.
                </p>

                {onImageModelChange && (
                  <div className="space-y-2 pt-4 border-t border-cream/10 mb-4 mt-2">
                    <label className="text-xs font-semibold text-cream/40 uppercase tracking-widest px-1">Image Generation Model</label>
                    <select 
                      value={currentImageModel}
                      onChange={(e) => onImageModelChange(e.target.value)}
                      className="w-full bg-cream/5 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream/80 outline-none focus:border-marigold/50 transition-colors"
                    >
                      <optgroup label="Recommended" className="bg-[#1a2e35]">
                        <option value="gemini-2.5-flash-image" className="bg-[#1a2e35]">Gemini 2.5 Flash Image (Fastest)</option>
                        <option value="gemini-3.1-flash-image-preview" className="bg-[#1a2e35]">Gemini 3.1 Flash Image (High Quality)</option>
                      </optgroup>
                      <optgroup label="Google Imagen" className="bg-[#1a2e35]">
                        <option value="imagen-3.0-generate-001" className="bg-[#1a2e35]">Imagen 3.0 Generate</option>
                        <option value="imagen-3.0-fast-generate-001" className="bg-[#1a2e35]">Imagen 3.0 Fast Generate</option>
                      </optgroup>
                    </select>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* API Keys Section */}
          <ApiKeysSettings />

          {/* AI Settings Section */}
          {onTemperatureChange && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-cream/40 uppercase tracking-widest pl-1">AI Parameters</label>
              <div className="bg-cream/5 p-4 rounded-xl border border-cream/5 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-cream/60 text-xs">AI Temperature (Creativity)</span>
                    <span className="text-marigold">{aiTemperature.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="2.0" 
                    step="0.05"
                    value={aiTemperature}
                    onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-cream/10 rounded-lg appearance-none cursor-pointer accent-marigold"
                  />
                  <div className="flex justify-between text-[10px] text-cream/30 uppercase tracking-tighter">
                    <span>Precise & Factual</span>
                    <span>Highly Creative</span>
                  </div>
                </div>

                {onMaxTokensChange && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-cream/60 text-xs">Max Tokens (Response Length)</span>
                      <span className="text-marigold">{aiMaxTokens}</span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="4000" 
                      step="100"
                      value={aiMaxTokens}
                      onChange={(e) => onMaxTokensChange(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-cream/10 rounded-lg appearance-none cursor-pointer accent-marigold"
                    />
                    <div className="flex justify-between text-[10px] text-cream/30 uppercase tracking-tighter">
                      <span>Short</span>
                      <span>Detailed</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voice Modulation Section */}
          <div className="space-y-4 pt-2">
            <label className="text-xs font-semibold text-cream/40 uppercase tracking-widest pl-1">Voice Modulation</label>
            
            <div className="space-y-4 bg-cream/5 p-4 rounded-xl border border-cream/5">
              {/* Pitch Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-cream/60 text-xs">Pitch Adjustment</span>
                  <span className="text-marigold">{voicePitch > 0 ? `+${voicePitch}` : voicePitch}</span>
                </div>
                <input 
                  type="range" 
                  min="-10" 
                  max="10" 
                  step="1"
                  value={voicePitch}
                  onChange={(e) => onPitchChange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-cream/10 rounded-lg appearance-none cursor-pointer accent-marigold"
                />
                <div className="flex justify-between text-[10px] text-cream/30 uppercase tracking-tighter">
                  <span>Deep</span>
                  <span>High</span>
                </div>
              </div>

              {/* Speed Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-cream/60 text-xs">Speech Speed</span>
                  <span className="text-marigold">{voiceSpeed}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-cream/10 rounded-lg appearance-none cursor-pointer accent-marigold"
                />
                <div className="flex justify-between text-[10px] text-cream/30 uppercase tracking-tighter">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Accent Selector */}
              <div className="space-y-2 border-b border-cream/10 pb-4 mb-2">
                <label className="text-xs font-medium text-cream/60">Preferred Accent</label>
                <select 
                  value={voiceAccent}
                  onChange={(e) => onAccentChange(e.target.value)}
                  className="w-full bg-cream/5 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream/80 outline-none focus:border-marigold/50 transition-colors"
                >
                  <option value="Neutral Indian" className="bg-[#1a2e35]">Neutral Indian</option>
                  <option value="British" className="bg-[#1a2e35]">British</option>
                  <option value="American" className="bg-[#1a2e35]">American</option>
                  <option value="South Indian" className="bg-[#1a2e35]">South Indian</option>
                  <option value="North Indian" className="bg-[#1a2e35]">North Indian</option>
                  <option value="Australian" className="bg-[#1a2e35]">Australian</option>
                </select>
              </div>

              {/* Interaction Language Mode */}
              {onTargetLanguageChange && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-medium text-cream/60">Swara's Response Language</label>
                  <select 
                    value={targetLanguage}
                    onChange={(e) => onTargetLanguageChange(e.target.value)}
                    className="w-full bg-cream/5 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream/80 outline-none focus:border-terracotta/50 transition-colors"
                  >
                    <option value="auto" className="bg-[#1a2e35]">Auto-Detect (Match My Language)</option>
                    <option value="Hindi" className="bg-[#1a2e35]">Respond in Hindi</option>
                    <option value="English" className="bg-[#1a2e35]">Respond in English</option>
                    <option value="Kannada" className="bg-[#1a2e35]">Respond in Kannada</option>
                    <option value="Telugu" className="bg-[#1a2e35]">Respond in Telugu</option>
                    <option value="Tamil" className="bg-[#1a2e35]">Respond in Tamil</option>
                    <option value="Marathi" className="bg-[#1a2e35]">Respond in Marathi</option>
                    <option value="Bengali" className="bg-[#1a2e35]">Respond in Bengali</option>
                    <option value="Spanish" className="bg-[#1a2e35]">Respond in Spanish</option>
                    <option value="French" className="bg-[#1a2e35]">Respond in French</option>
                    <option value="German" className="bg-[#1a2e35]">Respond in German</option>
                    <option value="Italian" className="bg-[#1a2e35]">Respond in Italian</option>
                    <option value="Portuguese" className="bg-[#1a2e35]">Respond in Portuguese</option>
                    <option value="Russian" className="bg-[#1a2e35]">Respond in Russian</option>
                    <option value="Arabic" className="bg-[#1a2e35]">Respond in Arabic</option>
                    <option value="Japanese" className="bg-[#1a2e35]">Respond in Japanese</option>
                    <option value="Mandarin" className="bg-[#1a2e35]">Respond in Mandarin</option>
                    <option value="Korean" className="bg-[#1a2e35]">Respond in Korean</option>
                    <option value="Turkish" className="bg-[#1a2e35]">Respond in Turkish</option>
                    <option value="Vietnamese" className="bg-[#1a2e35]">Respond in Vietnamese</option>
                    <option value="Thai" className="bg-[#1a2e35]">Respond in Thai</option>
                    <option value="Indonesian" className="bg-[#1a2e35]">Respond in Indonesian</option>
                  </select>
                  <p className="text-[10px] text-cream/40 mt-1">Swara will automatically understand whatever language you speak. Select 'Auto-Detect' to let her reply in the same language, or force her to always reply in a specific language.</p>
                </div>
              )}
            </div>
          </div>

          {/* PDF Context Section */}
          {setPdfContexts && (
            <div className="space-y-3 pt-4 border-t border-cream/10">
              <label className="text-xs font-semibold text-cream/40 uppercase tracking-widest pl-1">Uploaded PDF Contexts</label>
              {pdfContexts.length === 0 ? (
                <div className="p-4 bg-cream/5 rounded-xl border border-cream/5 text-center text-cream/40 text-sm">
                  No PDFs uploaded yet. Upload from the main chat bar.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-hide">
                  {pdfContexts.map((pdf) => (
                    <div 
                      key={pdf.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                        pdf.selected ? 'bg-marigold/10 border-marigold/30' : 'bg-cream/5 border-cream/10'
                      }`}
                    >
                      <button 
                        onClick={() => setPdfContexts(prev => prev.map(p => p.id === pdf.id ? { ...p, selected: !p.selected } : p))}
                        className={`p-1.5 rounded-full transition-colors ${
                          pdf.selected ? 'text-marigold' : 'text-cream/40 hover:text-cream/80 hover:bg-cream/10'
                        }`}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate font-medium ${pdf.selected ? 'text-cream' : 'text-cream/70'}`}>
                          {pdf.name}
                        </p>
                        <p className="text-[10px] text-cream/40 uppercase mt-0.5">
                          {pdf.selected ? 'Active Context' : 'Inactive'}
                        </p>
                      </div>
                      <button 
                        onClick={() => setPdfContexts(prev => prev.filter(p => p.id !== pdf.id))}
                        className="p-1.5 text-cream/40 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                        title="Remove PDF"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 p-4 bg-marigold text-peacock font-bold h-14 rounded-xl hover:bg-saffron active:scale-[0.98] transition-all shadow-lg"
        >
          Save Settings
        </button>
      </motion.div>
    </motion.div>
  );
}
