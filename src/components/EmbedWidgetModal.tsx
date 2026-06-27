import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Code, Copy, Check, X, Presentation } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function EmbedWidgetModal({ onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOffice, setCopiedOffice] = useState(false);
  const [activeTab, setActiveTab] = useState<'web' | 'office'>('web');
  
  // The production Vercel deployment URL where Swara is officially hosted
  const appUrl = 'https://advance-swara-a7vm.vercel.app/';

  const avatarDataUrl = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%0A%20%20%3Cdefs%3E%0A%20%20%20%20%3CradialGradient%20id%3D%22face%22%20cx%3D%2250%25%22%20cy%3D%2250%25%22%20r%3D%2250%25%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%2280%25%22%20stop-color%3D%22%23141414%22%2F%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%232a2a2a%22%2F%3E%0A%20%20%20%20%3C%2FradialGradient%3E%0A%20%20%20%20%3Cfilter%20id%3D%22glow%22%3E%0A%20%20%20%20%20%20%3CfeGaussianBlur%20stdDeviation%3D%222%22%20result%3D%22coloredBlur%22%2F%3E%0A%20%20%20%20%20%20%3CfeMerge%3E%0A%20%20%20%20%20%20%20%20%3CfeMergeNode%20in%3D%22coloredBlur%22%2F%3E%0A%20%20%20%20%20%20%20%20%3CfeMergeNode%20in%3D%22SourceGraphic%22%2F%3E%0A%20%20%20%20%20%20%3C%2FfeMerge%3E%0A%20%20%20%20%3C%2Ffilter%3E%0A%20%20%3C%2Fdefs%3E%0A%20%20%0A%20%20%3Cpath%20d%3D%22M%2015%2035%20C%200%2035%200%2065%2015%2065%20Z%22%20fill%3D%22%23ffebc2%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M%2085%2035%20C%20100%2035%20100%2065%2085%2065%20Z%22%20fill%3D%22%23ffebc2%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%0A%20%20%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2245%22%20fill%3D%22%23e2e8f0%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2241%22%20fill%3D%22url(%23face)%22%2F%3E%0A%0A%20%20%3Cpath%20d%3D%22M%2028%2045%20Q%2036%2041%2042%2047%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M%2072%2045%20Q%2064%2041%2058%2047%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%0A%20%20%3Cpath%20d%3D%22M%2043%2062%20Q%2050%2068%2057%2062%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3C%2Fsvg%3E";

  const embedCode = `<script>
(function(){
  var appUrl = '${appUrl}';
  var avatarUrl = '${avatarDataUrl}';
  var d = document.createElement('a');
  d.href = appUrl;
  d.target = '_blank';
  d.id = 'swara-widget-btn';
  d.style.position = 'fixed';
  d.style.bottom = '24px';
  d.style.right = '24px';
  d.style.width = '64px';
  d.style.height = '64px';
  d.style.cursor = 'pointer';
  d.style.zIndex = '999999';
  d.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  d.style.animation = 'swara-idle-bounce 3s infinite ease-in-out';
  d.title = 'Talk to Swara AI';

  // Inject keyframes
  var style = document.createElement('style');
  style.innerHTML = '@keyframes swara-idle-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }';
  document.head.appendChild(style);
  
  d.onmouseover = function() { d.style.animationPlayState = 'paused'; d.style.transform = 'scale(1.1) translateY(-5px)'; };
  d.onmouseout = function() { d.style.transform = ''; d.style.animationPlayState = 'running'; };

  var img = document.createElement('img');
  img.src = avatarUrl;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.filter = 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))';

  d.appendChild(img);
  document.body.appendChild(d);
})();
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyOfficeHtml = async () => {
    try {
      // MS Office apps don't handle SVG data URLs well via clipboard.
      // We'll draw the SVG to a canvas and convert to a PNG data URL.
      const img = new Image();
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      img.src = avatarDataUrl;
      await loadPromise;

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, 100, 100);
      const pngDataUrl = canvas.toDataURL('image/png');

      // Add StartFragment/EndFragment for MS Word/PPT compatibility
      const htmlString = `<html><body><!--StartFragment--><a href="${appUrl}"><img src="${pngDataUrl}" alt="Swara Avatar" width="100" height="100" /></a><!--EndFragment--></body></html>`;
      
      const blobHtml = new Blob([htmlString], { type: "text/html" });
      const blobText = new Blob([appUrl], { type: "text/plain" });

      const data = [new ClipboardItem({ 
        "text/html": blobHtml,
        "text/plain": blobText
      })];
      
      await navigator.clipboard.write(data);
      setCopiedOffice(true);
      setTimeout(() => setCopiedOffice(false), 2000);
    } catch (e) {
      console.warn("Clipboard API failed for text/html, fallback to text", e);
      navigator.clipboard.writeText(appUrl);
      setCopiedOffice(true);
      setTimeout(() => setCopiedOffice(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-[#111318]/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-10 flex flex-col"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-marigold to-terracotta" />
        
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-marigold/10 flex items-center justify-center border border-marigold/20">
              {activeTab === 'web' ? <Code size={20} className="text-marigold" /> : <Presentation size={20} className="text-marigold" />}
            </div>
            <div>
              <h2 className="text-xl font-cute font-bold text-cream">Embed Swara</h2>
              <p className="text-xs text-cream/50">Add Swara everywhere</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-cream/60 hover:text-cream"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex px-6 pt-4 gap-4 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('web')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'web' ? 'border-marigold text-marigold' : 'border-transparent text-cream/50 hover:text-cream/80'}`}
          >
            Website Widget
          </button>
          <button 
            onClick={() => setActiveTab('office')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'office' ? 'border-marigold text-marigold' : 'border-transparent text-cream/50 hover:text-cream/80'}`}
          >
            PPT & Word (Docs)
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-6">
          {activeTab === 'web' && (
            <>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                 <p className="text-sm text-cream/80 leading-relaxed mb-4">
                   Copy and paste this snippet anywhere inside the <code>&lt;body&gt;</code> tag of your website. It will add a beautiful, interactive 3D Swara floating button to the bottom right corner of your site.
                 </p>

                 <div className="relative group">
                    <div className="absolute right-4 top-4 z-10">
                       <button 
                         onClick={copyToClipboard}
                         className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2d35] hover:bg-[#3a3d45] border border-white/10 rounded-lg text-xs font-medium text-cream/90 transition-colors"
                       >
                         {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                         {copied ? "Copied!" : "Copy Code"}
                       </button>
                    </div>
                    <pre className="bg-[#050505] p-6 rounded-xl border border-white/10 overflow-x-auto text-[11px] leading-[1.6] text-emerald-300 font-mono shadow-inner">
                      {embedCode}
                    </pre>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 bg-marigold/5 border border-marigold/10 p-4 rounded-xl">
                 <style>{`@keyframes gentle-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
                 <div 
                    className="w-12 h-12 shrink-0 drop-shadow-lg"
                    style={{ animation: 'gentle-bounce 3s infinite ease-in-out' }}
                 >
                   <img src={avatarDataUrl} className="w-full h-full" alt="Avatar Widget Preview" />
                 </div>
                 <p className="text-xs text-marigold/80 leading-relaxed font-medium">
                   <strong>Preview:</strong> This is what the widget will look like on your website. It uses pure HTML and CSS to create the 3D effect instantly.
                 </p>
              </div>
            </>
          )}

          {activeTab === 'office' && (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-cream mb-2">Option 1: Drag & Drop</h3>
                <p className="text-xs text-cream/70 leading-relaxed mb-4">
                  Drag this avatar directly into your PowerPoint slide or Word document. It's already linked to Swara. When clicked in presentation mode, it will open the app!
                </p>
                <div className="bg-[#050505] p-6 rounded-xl border border-white/10 flex justify-center items-center">
                  <a href={appUrl} target="_blank" rel="noreferrer" title="Click to open Swara" className="hover:scale-110 transition-transform">
                    <img src={avatarDataUrl} alt="Swara Avatar" className="w-24 h-24 drop-shadow-xl cursor-grab active:cursor-grabbing" draggable="true" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-cream mb-2">Option 2: Copy to Clipboard</h3>
                <p className="text-xs text-cream/70 leading-relaxed mb-4">
                  Click the button below to copy a rich-text version of the Avatar. Paste it (Ctrl+V) into your document.
                </p>
                <button 
                  onClick={copyOfficeHtml}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-marigold to-terracotta hover:opacity-90 rounded-xl text-sm font-bold text-peacock transition-all shadow-lg"
                >
                  {copiedOffice ? <Check size={18} /> : <Copy size={18} />}
                  {copiedOffice ? "Copied to Clipboard!" : "Copy Avatar to Clipboard"}
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-cream mb-2">Option 3: Manual Link</h3>
                <p className="text-xs text-cream/70 leading-relaxed mb-3">
                  If the above options don't work, insert any shape or image in PowerPoint, right-click it, select <strong>Link</strong> (or Hyperlink), and paste this URL:
                </p>
                <div className="flex gap-2">
                  <input type="text" readOnly value={appUrl} className="flex-1 bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-cream/80 font-mono outline-none" />
                  <button onClick={copyLink} className="flex items-center gap-2 px-3 py-2 bg-[#2a2d35] hover:bg-[#3a3d45] border border-white/10 rounded-lg text-xs font-medium text-cream/90 transition-colors">
                    {copiedLink ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
