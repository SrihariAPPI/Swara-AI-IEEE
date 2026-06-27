export async function playPCM(base64Data: string): Promise<void> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext not supported");
      return;
    }
    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    try {
      // First try to automatically decode (if it's WAV or has headers)
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
         audioCtx.decodeAudioData(bytes.buffer.slice(0), resolve, reject);
      });
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
      
      return new Promise<void>(resolve => {
        source.onended = () => resolve();
      });
    } catch (decodeError) {
      console.warn("decodeAudioData failed, assuming raw 16-bit PCM", decodeError);
      
      // Fallback: Assume raw 16-bit 24kHz PCM
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
      
      return new Promise<void>(resolve => {
        source.onended = () => resolve();
      });
    }
  } catch (error) {
    console.error("Error playing audio, falling back to basic Audio HTML element:", error);
    try {
      const audio = new Audio("data:audio/wav;base64," + base64Data);
      await audio.play();
      return new Promise<void>(resolve => {
        audio.onended = () => resolve();
      });
    } catch (fallbackError) {
       console.error("Fallback audio playback failed:", fallbackError);
    }
  }
}

