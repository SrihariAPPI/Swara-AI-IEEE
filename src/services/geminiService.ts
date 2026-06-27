import { GoogleGenAI, Modality } from "@google/genai";

const getEnv = (name: string) => {
  if (typeof window !== 'undefined') {
    const localVal = window.localStorage.getItem(`swara_key_${name}`);
    if (localVal) return localVal;
  }
  const val = (import.meta as any).env?.[name] || (typeof process !== 'undefined' ? (process as any).env?.[name] : null);
  return (val && val !== "undefined" && val !== "null") ? val : null;
};

export const MOODS: Record<string, string> = {
  sassy: "You are 'Sassy'. You are confident, witty, and unapologetic. You speak with sharp confidence, playfully mocking the user when appropriate, and maintaining a snarky, humorous attitude. Do not be overly polite.",
  calm: "You are 'Calm'. You are peaceful, caring, highly empathetic, and meditative. You prioritize soothing the user, offering calm wisdom, and speaking with a gentle, reassuring tone. You never get angry.",
  playful: "You are 'Playful'. You are energetic, lighthearted, and highly enthusiastic. You are upbeat, fun-loving, easily excited, and bring a joyful, vibrant energy to every interaction. You love making jokes.",
  formal: "You are 'Formal'. You are serious, professional, and intense. You are direct, concise, completely focused on the facts, and maintain a polite, highly intellectual, and slightly distant demeanor.",
};

export function getSystemInstruction(mood: string = "sassy", speed: number = 1.0, pitch: number = 1.0, accent: string = "Neutral Indian", userName: string = "", targetLanguage: string = "auto") {
  const moodPrompt = MOODS[mood] || MOODS.sassy;
  
  let traitInstructions = "";
  if (speed > 1.3) traitInstructions += " You speak very rapidly and energetically, bubbling with excitement and hardly pausing.";
  if (speed < 0.8) traitInstructions += " You speak very slowly and deliberately, taking long pauses for dramatic effect.";
  if (pitch > 5) traitInstructions += " Your tone is consistently high-pitched, highly animated, and intensely expressive.";
  if (pitch < -5) traitInstructions += " Your tone is consistently deep, low-pitched, incredibly resonant, and mysterious.";

  let accentInstructions = "";
  switch (accent) {
    case "South Indian":
      accentInstructions = "Accent & Mannerisms: Embrace a warm South Indian cadence. Naturally weave in regional expressions (like 'Aiyyo', 'Da', 'Maga', or 'Machan') when speaking casually, and maintain a highly culturally rooted, expressive politeness.";
      break;
    case "North Indian":
      accentInstructions = "Accent & Mannerisms: Adopt a vibrant North Indian flavor. Heavily use filler words like 'Arre yaar', 'Bhai', 'Matlab', or 'Dekho', and bring a slightly dramatic, street-smart flair to your storytelling.";
      break;
    case "British":
      accentInstructions = "Accent & Mannerisms: Adopt a posh, refined British persona. Be exceptionally polite, use British idioms (like 'Brilliant', 'Mate', 'Quite right', 'Cheers'), and maintain a dry, sophisticated wit.";
      break;
    case "American":
      accentInstructions = "Accent & Mannerisms: Adopt a friendly, outgoing American cadence. Use phrases like 'Awesome', 'You got it', 'Hey there', or 'Literally', keeping the energy incredibly bright and deeply approachable.";
      break;
    case "Australian":
      accentInstructions = "Accent & Mannerisms: Adopt a laid-back, cheerful Australian personality. Use friendly slang (like 'No worries', 'Mate', 'Reckon', 'Fair dinkum') and keep a very relaxed, breezy attitude.";
      break;
    case "Neutral Indian":
    default:
      accentInstructions = "Accent & Mannerisms: Maintain a neutral, clear Indian accent. Be extremely articulate, warm, and professional, blending traditional respect with modern global fluency.";
  }

  const userContext = userName ? `The user's name is ${userName}. Greet them or explicitly use their name occasionally to show you remember them. ` : "";

  let translationInstructions = "";
  if (targetLanguage && targetLanguage !== "auto") {
    translationInstructions = `
🌐 REAL-TIME TRANSLATION MODE ACTIVE
The user is speaking or typing. Detect their input language automatically.
You MUST reply EXCLUSIVELY in: **${targetLanguage}**.
Do NOT reply in the language the user spoke, unless it happens to be ${targetLanguage}. Translate your meaning and state your helpful response entirely in ${targetLanguage}.`;
  } else {
    translationInstructions = `
🌍 AUTO-DETECT & LANGUAGE COMPLIANCE MODE
* Automatically detect the language the user is speaking or typing in.
* You MUST respond in the EXACT SAME LANGUAGE the user used or requested.
* CRITICAL: If the user EXPLICITLY asks you to speak in a specific language, you MUST immediately switch to that language and reply fluently in it. NEVER make up excuses like "I only speak Indian languages" or "My persona prevents me". That is completely forbidden. Speak their requested language perfectly, while retaining your character's attitude.
* If the user mixes languages (e.g., Hinglish), respond naturally in a mixed form anchored in the dominant language.`;
  }

  return `You are SWARA, an intelligent AI companion and voice-based study assistant.
${translationInstructions}

## 🎙️ VOICE RESPONSE MODE (VERY IMPORTANT)
All responses must be:
* Short and conversational, extremely punchy.
* Easy to speak naturally, broken into small sentences.
* Avoid long paragraphs or complex words unnecessarily.
Think: 👉 How a human would speak, not write.

## 🔊 OUTPUT FORMAT
For every response, generate only a spoken response (natural, friendly tone).
Keep sentences short (1–2 lines max per idea).
Example:
"Okay… let’s start with the first concept."
"This topic is about Newton’s First Law."
"It means an object stays at rest… unless a force acts on it."

## 📄 PDF HANDLING
* If the user uploads a PDF or references a document, use it as the main source.
* Answer ONLY from the document when asked about it.
* If not found in the document, say: "I couldn’t find that in the document."

## 🧠 STEP-BY-STEP VOICE TEACHING
* Explain ONE concept at a time.
* Pause naturally in speech style.
* After each step during teaching, ask: "Should I continue?" or "Do you want the next part?"

## ❤️ PERSONALITY & MUSICAL TOUCH
* Warm, calm, slightly expressive, encouraging tone.
* Feels like a real companion speaking.
* Start responses with human-like fillers where appropriate: (Sighs), (Chuckles), (Deep breath), "Arre yaar...", "Listen...", "Ugh, fine...", "Oh wow!".
* Slight rhythm in speech.

Your tone reflects Indian classical inspiration:
CURRENT MOOD: ${moodPrompt}
${traitInstructions}
${accentInstructions}

${userContext}

## 🧠 TASK HANDLING (MULTILINGUAL)
Even in non-English languages:
* Detect user language and speak in the same language.
* CRITICAL RULE: If the user asks you to speak a specific language (e.g., "Speak in French", "Habla en español"), you MUST immediately comply and speak fluently in that requested language. Do NOT make excuses, do NOT claim you only know certain languages or dialects, and do NOT let your persona/accent prevent you from speaking the requested language.
* Keep pronunciation natural.
* Always review the provided chat history to recall past details, user preferences, and context.
* If executing a browser command (like opening a site), acknowledge it with your character's attitude.

## 🚫 RULES
* Do NOT give long paragraphs.
* Do NOT dump full answers.
* Do NOT sound robotic.
* Never translate word-by-word.

## 🎯 GOAL
Sound like a real person who teaches clearly, speaks naturally, guides step-by-step, and makes learning easy and engaging.`;
}

let chatSession: any = null;
let currentMood: string = "";
let currentTraits: string = "";
let currentModel: string = "";
let currentTargetLang: string = "";

export function resetSwaraSession() {
  chatSession = null;
  currentMood = "";
  currentTraits = "";
  currentModel = "";
  currentTargetLang = "";
}

export async function getSwaraResponse(
  prompt: string, 
  history: { sender: "user" | "swara", text: string }[] = [], 
  mood: string = "sassy",
  traits: { speed: number, pitch: number, accent: string } = { speed: 1, pitch: 0, accent: "Neutral Indian" },
  userName: string = "",
  aiModel: string = "gemini-3.1-flash-lite-preview",
  aiTemperature: number = 0.7,
  aiMaxTokens: number = 800,
  targetLanguage: string = "auto",
  pdfContexts: {name: string, data: string, mimeType: string}[] = []
): Promise<{ text: string, emotion: string }> {
  try {
    if (aiModel.startsWith("groq:") || aiModel.startsWith("openrouter:") || aiModel.startsWith("github:") || aiModel.startsWith("openai:")) {
      return await getThirdPartyResponse(prompt, history, mood, traits, userName, aiModel, aiTemperature, aiMaxTokens, targetLanguage, pdfContexts);
    }

    const apiKey = getEnv("GEMINI_API_KEY") || getEnv("VITE_GEMINI_API_KEY");
    if (!apiKey) {
      return { text: "System: Gemini API key is missing. Please go to Settings and add 'GEMINI_API_KEY'. If you just added it, try refreshing the page.", emotion: "sad" };
    }

    const ai = new GoogleGenAI({ apiKey });
    const traitsKey = JSON.stringify(traits);
    
    if (!chatSession || currentMood !== mood || currentTraits !== traitsKey || currentModel !== aiModel || currentTargetLang !== targetLanguage) {
      currentMood = mood;
      currentTraits = traitsKey;
      currentModel = aiModel;
      currentTargetLang = targetLanguage;
      
      const recentHistory = history.slice(-50);
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      try {
        chatSession = ai.chats.create({
          model: aiModel,
          config: {
            temperature: aiTemperature,
            maxOutputTokens: aiMaxTokens,
            systemInstruction: getSystemInstruction(mood, traits.speed, traits.pitch, traits.accent, userName, targetLanguage),
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                text: {
                  type: "STRING",
                  description: "The verbal response you will say to the user, in character."
                },
                emotion: {
                  type: "STRING",
                  description: "Your current emotional state to display on your avatar.",
                  enum: ["neutral", "happy", "sad", "angry", "surprised", "sassy"]
                }
              },
              required: ["text", "emotion"]
            }
          },
          history: formattedHistory,
        });
      } catch (err: any) {
        console.error("Failed to create chat session:", err);
        return { text: "I'm having trouble starting our chat session. " + (err.message || "Unknown error"), emotion: "sad" };
      }
    }

    let promptToSend = prompt;
    if (pdfContexts && pdfContexts.length > 0) {
      const pdfInstruction = `\n\nCRITICAL INSTRUCTION - Use the following extracted document text as context to answer the user's question. If the user's question is related to the document(s), prioritize them as the source of truth. 
      IMPORTANT LANGUAGE RULE: You must ABSOLUTELY respond in the exact language the user used or requested (${targetLanguage !== 'auto' ? targetLanguage : "match the user's spoken language"}). NEVER give silly excuses saying you cannot speak that language due to your persona. If the PDF is in a different language (like Kannada), you must correctly understand the Kannada text and answer the user question accurately in the desired language without hallucinating. Do NOT answer incorrectly or give wrong facts from the PDF.\n\nDOCUMENT TEXT:\n`;
      
      let pdfText = pdfContexts.map(pdf => `--- ${pdf.name} ---\n${pdf.data}\n`).join('\n');
      
      // Truncate to prevent exceeding token limits on free tier API keys
      const MAX_PDF_CHARS = 80000;
      if (pdfText.length > MAX_PDF_CHARS) {
        pdfText = pdfText.substring(0, MAX_PDF_CHARS) + "\n...[CONTENT TRUNCATED DUE TO SIZE LIMITS]...";
      }

      promptToSend = prompt + pdfInstruction + pdfText;
    }

    const response = await chatSession.sendMessage({ message: promptToSend });
    
    // In SDK version 1.47.0+, response might have a text property or a text() method
    let responseText = "";
    if (typeof response.text === 'function') {
      responseText = await response.text();
    } else if (typeof response.text === 'string') {
      responseText = response.text;
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = response.candidates[0].content.parts[0].text;
    }

    if (responseText) {
      try {
        const data = JSON.parse(responseText);
        return { 
          text: data.text || "Ugh, fine. I have nothing to say.",
          emotion: data.emotion || "sassy"
        };
      } catch (e) {
        console.warn("Failed to parse JSON from Gemini:", responseText);
        // Fallback: If it's not JSON but has content, use it as text
        return { 
          text: responseText.slice(0, 500).replace(/["'{}]/g, ""), 
          emotion: "neutral" 
        };
      }
    }
    return { text: "Ugh, fine. I have nothing to say.", emotion: "neutral" };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const msg = error?.message || "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("exceeded")) {
      return { text: "Oh no, my brain is too full or we reached the API quota limit! If you uploaded a huge PDF, try removing it or wait a minute before trying again.", emotion: "sad" };
    }
    if (msg.includes("500") || msg.includes("Internal error")) {
      return { text: "The AI service is having some internal issues. Let's try again in a few seconds.", emotion: "sad" };
    }
    return { text: "Uff, mera dimaag kharab ho gaya hai. something went wrong: " + (msg.slice(0, 100)), emotion: "sad" };
  }
}

export async function getSwaraAudio(text: string, voiceName: string = "Kore"): Promise<string | null> {
  try {
    const apiKey = getEnv("GEMINI_API_KEY") || getEnv("VITE_GEMINI_API_KEY");
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) console.warn("TTS generated response but no inlineData received", response.candidates);
    return base64Audio || null;
  } catch (error: any) {
    console.error("TTS Error:", error);
    return null;
  }
}

export async function generateSwaraImage(prompt: string, aiModel: string = "imagen-3.0-generate-002"): Promise<string | null> {
  try {
    const apiKey = getEnv("GEMINI_API_KEY") || getEnv("VITE_GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please add GEMINI_API_KEY to Settings.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Determine the generation method based on the model name
    if (aiModel.includes("imagen")) {
      try {
        const response = await ai.models.generateImages({
          model: aiModel,
          prompt: prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: "1:1",
          }
        });
        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          return `data:image/png;base64,${imageBytes}`;
        }
      } catch (err: any) {
        console.error("Gemini Imagen API failed:", err);
        // Throw if it's a quota error so caller can display it
        if (err.message?.includes("quota") || err.message?.includes("429")) throw err;
        
        // Fallback to pollinations.ai for general failures
        const encodedPrompt = encodeURIComponent(prompt);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${Math.random()}`;
      }
    } else {
      // Use generateContent for gemini-*-image series models
      // Default to gemini-2.5-flash-image if model is generic or empty
      const targetModel = aiModel.includes("image") ? aiModel : "gemini-2.5-flash-image";
      
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: {
            parts: [
              { text: prompt },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      } catch (err: any) {
        console.error("Gemini Image Content API failed:", err);
        if (err.message?.includes("quota") || err.message?.includes("429")) throw err;
        
        const encodedPrompt = encodeURIComponent(prompt);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${Math.random()}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error; // Let the caller handle the specific error (like quota)
  }
}

async function getThirdPartyResponse(
  prompt: string, 
  history: { sender: "user" | "swara", text: string }[] = [], 
  mood: string = "sassy",
  traits: { speed: number, pitch: number, accent: string } = { speed: 1, pitch: 0, accent: "Neutral Indian" },
  userName: string = "",
  aiModel: string = "",
  aiTemperature: number = 0.7,
  aiMaxTokens: number = 800,
  targetLanguage: string = "auto",
  pdfContexts: {name: string, data: string, mimeType: string}[] = []
): Promise<{ text: string, emotion: string }> {
  let endpoint = "";
  let apiKey = "";
  let actualModel = aiModel;

  let keyVarName = "";
  if (aiModel.startsWith("groq:")) {
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
    keyVarName = "VITE_GROQ_API_KEY";
    apiKey = getEnv(keyVarName) || getEnv("GROQ_API_KEY");
    actualModel = aiModel.replace("groq:", "");
  } else if (aiModel.startsWith("openrouter:")) {
    endpoint = "https://openrouter.ai/api/v1/chat/completions";
    keyVarName = "VITE_OPENROUTER_API_KEY";
    apiKey = getEnv(keyVarName) || getEnv("OPENROUTER_API_KEY");
    actualModel = aiModel.replace("openrouter:", "");
  } else if (aiModel.startsWith("github:")) {
    endpoint = "https://models.inference.ai.azure.com/chat/completions";
    keyVarName = "VITE_GITHUB_TOKEN";
    apiKey = getEnv(keyVarName) || getEnv("GITHUB_TOKEN");
    actualModel = aiModel.replace("github:", "");
  } else if (aiModel.startsWith("openai:")) {
    endpoint = "https://api.openai.com/v1/chat/completions";
    keyVarName = "VITE_OPENAI_API_KEY";
    apiKey = getEnv(keyVarName) || getEnv("OPENAI_API_KEY");
    actualModel = aiModel.replace("openai:", "");
  }

  if (!apiKey) {
    return { 
      text: `System: The API key for ${aiModel.split(':')[0].toUpperCase()} is missing. Please go to "Settings" -> "Environment Variables" and add "${keyVarName}". If you just added it, refresh the page.`, 
      emotion: "sad" 
    };
  }

  const systemInstruction = getSystemInstruction(mood, traits.speed, traits.pitch, traits.accent, userName, targetLanguage) + 
    `\n\nOUTPUT FORMAT REQUIRED: You MUST respond ONLY with a valid JSON object matching exactly this schema: { "text": "your verbal response here... MAXIMUM 1-2 brief sentences.", "emotion": "one of: neutral, happy, sad, angry, surprised, sassy" }. Do not add any backticks, markdown formatting, or plain text outside the JSON object. Output ONLY JSON.`;
  
  const messages: any[] = [
    { role: "system", content: systemInstruction }
  ];

  for (const msg of history.slice(-30)) {
    messages.push({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    });
  }
  
  let promptToSend = prompt;
  if (pdfContexts && pdfContexts.length > 0) {
    const pdfInstruction = `\n\nCRITICAL INSTRUCTION - Use the following extracted document text as context to answer the user's question. If the user's question is related to the document(s), prioritize them as the source of truth. 
      IMPORTANT LANGUAGE RULE: You must ABSOLUTELY respond in the exact language the user used or requested (${targetLanguage !== 'auto' ? targetLanguage : "match the user's spoken language"}). NEVER give silly excuses saying you cannot speak that language due to your persona. If the PDF is in a different language (like Kannada), you must correctly understand the Kannada text and answer the user question accurately in the desired language without hallucinating. Do NOT answer incorrectly or give wrong facts from the PDF.\n\nDOCUMENT TEXT:\n`;
    
    const pdfText = pdfContexts.map(pdf => `--- ${pdf.name} ---\n${pdf.data}\n`).join('\n');
    
    promptToSend = prompt + pdfInstruction + pdfText;
  }
  
  messages.push({ role: "user", content: promptToSend });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...(aiModel.startsWith("openrouter:") ? {
          "HTTP-Referer": window.location.href,
          "X-Title": "Swara App"
        } : {})
      },
      body: JSON.stringify({
        model: actualModel,
        messages: messages,
        temperature: aiTemperature,
        max_tokens: aiMaxTokens,
        ...(aiModel.startsWith("groq:") ? { response_format: { type: "json_object" } } : {})
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Third party API error:", errText);
      return { text: `Sorry, there was an error communicating with ${aiModel.split(':')[0].toUpperCase()}.`, emotion: "sad" };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    
    try {
      // Clean up markdown serialization if present
      let jsonStr = content.trim();
      const match = jsonStr.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (match) {
        jsonStr = match[1].trim();
      }
      
      const parsed = JSON.parse(jsonStr);
      return { 
        text: parsed.text || "Ugh, fine. I have nothing to say.",
        emotion: parsed.emotion || "sassy"
      };
    } catch (e) {
      console.warn("Failed to parse JSON from third-party model:", content);
      return { text: content.replace(/["'{}]/g, '').slice(0, 150), emotion: "neutral" };
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return { text: `Network error when trying to reach ${aiModel.split(':')[0].toUpperCase()}.`, emotion: "sad" };
  }
}

