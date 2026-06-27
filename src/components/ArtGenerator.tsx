import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, X, Sparkles, Loader2, Download } from 'lucide-react';
import { generateSwaraImage } from '../services/geminiService';

interface ArtGeneratorProps {
  onClose: () => void;
  aiModel?: string;
}

export default function ArtGenerator({ onClose, aiModel = "imagen-3.0-generate-002" }: ArtGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
      const artPrompt = `High quality, aesthetic, digital art: ${prompt}`;
      const imageUrl = await generateSwaraImage(artPrompt, aiModel);
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
      } else {
        setError("Failed to generate image. Please try a different prompt.");
      }
    } catch (err: any) {
      if (err.message?.includes("quota")) {
        setError("We are over the image generation quota right now. Try again later.");
      } else {
        setError("An error occurred while generating the image.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass border-marigold/30 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-cute font-bold text-marigold flex items-center gap-2">
            <ImageIcon size={20} />
            Swara's Canvas
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="text-cream" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {!generatedImageUrl ? (
            <div className="flex flex-col items-center justify-center text-center py-8 opacity-60">
              <Sparkles size={48} className="text-marigold mb-4" />
              <p className="text-sm font-medium">Describe your imagination, and I will paint it for you.</p>
            </div>
          ) : (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-lg group">
              <img src={generatedImageUrl} alt={prompt} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                <a 
                  href={generatedImageUrl} 
                  download={`Swara-Art-${Date.now()}.png`}
                  className="p-2 bg-marigold text-peacock rounded-full hover:bg-saffron transition-colors"
                  title="Download Image"
                >
                  <Download size={20} />
                </a>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-black/20 border-t border-white/10">
          <form onSubmit={handleGenerate} className="flex flex-col gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A digital artwork of a classic Indian palace at sunset..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-marigold/50 transition-colors"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-wide uppercase text-sm transition-all shadow-lg bg-gradient-to-r from-marigold to-terracotta text-peacock hover:shadow-marigold/20 disabled:opacity-50 disabled:grayscale"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Painting...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Art
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
