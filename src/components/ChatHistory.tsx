import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, MessageSquare, Calendar, User, Bot, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: "user" | "swara";
  text: string;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  onClose: () => void;
  onClearHistory: () => void;
}

export default function ChatHistory({ messages, onClose, onClearHistory }: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return [...messages].reverse();
    return messages
      .filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
      .reverse();
  }, [messages, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-end bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md h-full glass border-l flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-marigold/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-marigold/10 flex items-center justify-center border border-marigold/30">
              <MessageSquare className="text-marigold" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-semibold text-marigold tracking-tight">Chat History</h2>
              <p className="text-xs text-cream/40 px-1">Past interactions with Swara</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cream/10 transition-colors"
          >
            <X size={20} className="text-cream/60" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white/[0.01]">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30 group-focus-within:text-marigold transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-cream/5 border border-cream/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-cream placeholder:text-cream/20 outline-none focus:border-marigold/50 focus:bg-cream/[0.08] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/20 hover:text-cream/60 transition-colors font-medium text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  msg.sender === "user" 
                    ? "bg-cream/[0.03] border-cream/5" 
                    : "bg-marigold/5 border-marigold/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {msg.sender === "user" ? (
                    <User size={12} className="text-cream/30" />
                  ) : (
                    <Bot size={12} className="text-marigold" />
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    msg.sender === "user" ? "text-cream/40" : "text-marigold/80"
                  }`}>
                    {msg.sender}
                  </span>
                </div>
                <p className="text-sm text-cream/80 leading-relaxed font-body">{msg.text}</p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-8">
              <Search size={48} className="mb-4 text-marigold" />
              <p className="text-lg font-serif">No matches found</p>
              <p className="text-sm mt-1">Try a different keyword or explore more conversations.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-marigold/10 bg-white/[0.02]">
          <button
            onClick={() => {
              if (confirm("This will permanently delete all your conversation history. Proceed?")) {
                onClearHistory();
              }
            }}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm text-terracotta hover:text-saffron transition-colors group"
          >
            <Trash2 size={16} className="group-hover:animate-bounce" />
            <span>Wipe Memories</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
