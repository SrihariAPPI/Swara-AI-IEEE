export function processCommand(command: string): {
  action: string;
  url?: string;
  isBrowserAction: boolean;
} {
  const lowerCmd = command.toLowerCase().trim();

  // Directions / Maps
  const directionMatch = lowerCmd.match(/^(?:get directions to|show me directions to|navigate to)\s+(.+)$/);
  if (directionMatch) {
    const destination = encodeURIComponent(directionMatch[1].trim());
    return {
      action: `Getting directions to ${directionMatch[1]}. Drive safe.`,
      url: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      isBrowserAction: true,
    };
  }

  const mapMatch = lowerCmd.match(/^(?:where is|show me a map of)\s+(.+)$/);
  if (mapMatch && !lowerCmd.includes("diagram")) {
    const location = encodeURIComponent(mapMatch[1].trim());
    return {
      action: `Locating ${mapMatch[1]} on Maps. Hope you're not lost.`,
      url: `https://www.google.com/maps/search/?api=1&query=${location}`,
      isBrowserAction: true,
    };
  }

  // E-commerce Search
  const amazonMatch = lowerCmd.match(/^search\s+(?:for\s+)?(.+?)\s+on\s+amazon$/);
  if (amazonMatch) {
    const query = encodeURIComponent(amazonMatch[1].trim());
    return {
      action: `Searching Amazon for ${amazonMatch[1]}. Ready to spend some money?`,
      url: `https://www.amazon.com/s?k=${query}`,
      isBrowserAction: true,
    };
  }

  // Wikipedia Search
  const wikiMatch = lowerCmd.match(/^search\s+(?:for\s+)?(.+?)\s+on\s+wikipedia$/);
  if (wikiMatch) {
    const query = encodeURIComponent(wikiMatch[1].trim());
    return {
      action: `Opening Wikipedia for ${wikiMatch[1]}. Let's learn something new.`,
      url: `https://en.wikipedia.org/w/index.php?search=${query}`,
      isBrowserAction: true,
    };
  }

  // Weather Search
  const weatherMatch = lowerCmd.match(/^(?:what is the weather like in|weather in|how is the weather in)\s+(.+)$/);
  if (weatherMatch) {
    const query = encodeURIComponent(`weather in ${weatherMatch[1].trim()}`);
    return {
      action: `Checking the weather for ${weatherMatch[1]}. Stay comfortable.`,
      url: `https://www.google.com/search?q=${query}`,
      isBrowserAction: true,
    };
  }

  // General Browsing: "Open [website name]"
  const openMatch = lowerCmd.match(/^(?:open|go to|show me)\s+(.+)$/);
  if (
    openMatch &&
    !lowerCmd.includes("youtube") &&
    !lowerCmd.includes("spotify") &&
    !lowerCmd.includes("google")
  ) {
    let target = openMatch[1].trim();
    
    // Heuristic: If it looks like a sentence or a search query (multiple words, contains 'of', 'for', 'diagram', etc.)
    const searchKeywords = ['of', 'for', 'diagram', 'image', 'picture', 'how', 'what', 'why'];
    const looksLikeSearch = target.split(/\s+/).length > 2 || searchKeywords.some(word => target.includes(` ${word} `) || target.endsWith(` ${word}`));

    if (looksLikeSearch || lowerCmd.includes("show me") || lowerCmd.includes("diagram")) {
      const query = encodeURIComponent(target);
      return {
        action: `Searching for that diagram of ${target} for you. Just a second.`,
        url: `https://www.google.com/search?q=${query}&tbm=isch`, // tbm=isch for images
        isBrowserAction: true,
      };
    }

    // If it's already a full URL or starts with http, don't prepend https://www.
    if (target.startsWith("http://") || target.startsWith("https://")) {
      return {
        action: `Opening ${openMatch[1]} for you, ugh.`,
        url: target,
        isBrowserAction: true,
      };
    }

    // Clean up spaces for domain construction
    let domain = target.replace(/\s+/g, "");
    if (!domain.includes(".")) {
      domain += ".com";
    }
    
    return {
      action: `Opening ${openMatch[1]} for you, ugh.`,
      url: `https://www.${domain}`,
      isBrowserAction: true,
    };
  }

  // Google Search: "Search for [query]" or "Search [query]"
  const searchMatch = lowerCmd.match(/^search\s+(?:for\s+)?(.+?)(?:\s+on\s+google)?$/);
  if (searchMatch && !lowerCmd.includes("youtube") && !lowerCmd.includes("spotify") && !lowerCmd.includes("amazon") && !lowerCmd.includes("wikipedia")) {
    const query = encodeURIComponent(searchMatch[1].trim());
    return {
      action: `Searching Google for "${searchMatch[1]}". As if you couldn't do it yourself.`,
      url: `https://www.google.com/search?q=${query}`,
      isBrowserAction: true,
    };
  }

  // Media Search: "Play [song/video] on YouTube"
  const ytMatch = lowerCmd.match(/^play\s+(.+?)\s+on\s+youtube$/);
  if (ytMatch) {
    const query = encodeURIComponent(ytMatch[1].trim());
    return {
      action: `Playing ${ytMatch[1]} on YouTube. Don't judge my music taste.`,
      url: `https://www.youtube.com/results?search_query=${query}`,
      isBrowserAction: true,
    };
  }

  // Media Search: "Search [query] on Spotify"
  const spotifyMatch = lowerCmd.match(/^search\s+(.+?)\s+on\s+spotify$/);
  if (spotifyMatch) {
    const query = encodeURIComponent(spotifyMatch[1].trim());
    return {
      action: `Searching ${spotifyMatch[1]} on Spotify. Hope it's a banger.`,
      url: `https://open.spotify.com/search/${query}`,
      isBrowserAction: true,
    };
  }

  // WhatsApp Web: "Send a WhatsApp message to [contact] saying [message]"
  const waMatch = lowerCmd.match(
    /^send\s+a\s+whatsapp\s+message\s+to\s+(.+?)\s+saying\s+(.+)$/,
  );
  if (waMatch) {
    const contact = waMatch[1].trim();
    const message = encodeURIComponent(waMatch[2].trim());
    
    // If the contact is a phone number (mostly digits and +)
    if (/^[\d\+\s\-]+$/.test(contact)) {
      const number = contact.replace(/\s+|\-/g, "");
      return {
        action: `Sending your message. Let's hope they reply.`,
        url: `https://web.whatsapp.com/send?phone=${number}&text=${message}`,
        isBrowserAction: true,
      };
    } else {
      // If it's a name, web browsers cannot silently read phone contacts for security reasons.
      // We pre-fill the message and open WhatsApp so the user can just tap the person's name!
      return {
        action: `I can't read your phone's contacts to find "${contact}" due to privacy rules, but I've typed the message for you. Just select their name!`,
        url: `https://api.whatsapp.com/send?text=${message}`,
        isBrowserAction: true,
      };
    }
  }

  return { action: "", isBrowserAction: false };
}
