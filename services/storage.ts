
import { PromptBlock, BlockFormData, GeneratedImage, SavedPrompt, SavedImage } from '../types';

// ==========================================
// STORAGE CONFIGURATION
// ==========================================
// 'API'   - Use PHP Backend
// 'LOCAL' - Use Browser LocalStorage
// Dynamic switch based on env or default to LOCAL
export const STORAGE_MODE: 'API' | 'LOCAL' = (process.env.STORAGE_MODE === 'API') ? 'API' : 'LOCAL';
// export const STORAGE_MODE = 'API';
const API_BASE_URL = 'https://artificialfiretiger.com/promptforgeapi'; 

const LS_KEYS = {
    BLOCKS: 'pf_blocks',
    HISTORY: 'pf_history',
    IMAGES: 'pf_images',
    SAVED: 'pf_saved_prompts',
    SAVED_IMAGES: 'pf_saved_images',
    TOKENS: 'pf_token_usage'
};

// --- Helpers ---

const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

const handleResponse = async (response: Response) => {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || response.statusText);
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("Failed to parse JSON response. Raw text:", text);
    throw new Error("Invalid JSON response from server.");
  }
};

// Generic Local Storage Helpers
const getLS = <T>(key: string, defaultVal: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
    } catch {
        return defaultVal;
    }
};

const setLS = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
};

/* --- Import / Export (Local Storage Only) --- */

export const exportData = async (): Promise<string> => {
    if (STORAGE_MODE === 'API') {
       throw new Error("Export is currently only supported in Local Storage mode.");
    }
    const data = {
        blocks: getLS(LS_KEYS.BLOCKS, []),
        history: getLS(LS_KEYS.HISTORY, []),
        images: getLS(LS_KEYS.IMAGES, []),
        savedPrompts: getLS(LS_KEYS.SAVED, []),
        savedImages: getLS(LS_KEYS.SAVED_IMAGES, [])
    };
    return JSON.stringify(data, null, 2);
}

export const importData = async (json: string): Promise<boolean> => {
    if (STORAGE_MODE === 'API') {
         throw new Error("Import is currently only supported in Local Storage mode.");
    }
    try {
        const data = JSON.parse(json);
        
        // Basic validation
        if (!data.blocks && !data.history && !data.images && !data.savedPrompts && !data.savedImages) {
            throw new Error("Invalid file format: missing PromptForge data.");
        }
        
        if (data.blocks) setLS(LS_KEYS.BLOCKS, data.blocks);
        if (data.history) setLS(LS_KEYS.HISTORY, data.history);
        if (data.images) setLS(LS_KEYS.IMAGES, data.images);
        if (data.savedPrompts) setLS(LS_KEYS.SAVED, data.savedPrompts);
        if (data.savedImages) setLS(LS_KEYS.SAVED_IMAGES, data.savedImages);
        
        return true;
    } catch (e) {
        console.error("Import failed", e);
        throw e;
    }
}

/* --- Token Usage (Always Local Storage) --- */

export interface TokenUsage {
    input: number;
    output: number;
    total: number;
}

export const getTokenUsage = (): TokenUsage => {
    return getLS<TokenUsage>(LS_KEYS.TOKENS, { input: 0, output: 0, total: 0 });
};

export const incrementTokenUsage = (input: number, output: number) => {
    const current = getTokenUsage();
    const updated = {
        input: current.input + input,
        output: current.output + output,
        total: current.total + input + output
    };
    setLS(LS_KEYS.TOKENS, updated);
    
    // Dispatch custom event to update UI
    window.dispatchEvent(new Event('token-usage-updated'));
};

/* --- Blocks --- */

export const getBlocks = async (): Promise<PromptBlock[]> => {
  if (STORAGE_MODE === 'LOCAL') {
      return getLS<PromptBlock[]>(LS_KEYS.BLOCKS, []);
  }

  try {
    const response = await fetch(`${API_BASE_URL}?endpoint=blocks`);
    return handleResponse(response);
  } catch (e) {
    console.warn('API fetch failed, returning empty list.', e);
    return [];
  }
};

export const saveBlock = async (block: BlockFormData): Promise<PromptBlock> => {
  if (STORAGE_MODE === 'LOCAL') {
      const newBlock: PromptBlock = {
          ...block,
          id: generateId(),
          createdAt: Date.now()
      };
      const blocks = getLS<PromptBlock[]>(LS_KEYS.BLOCKS, []);
      setLS(LS_KEYS.BLOCKS, [newBlock, ...blocks]);
      return newBlock;
  }

  const response = await fetch(`${API_BASE_URL}?endpoint=blocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(block),
  });
  return handleResponse(response);
};

export const updateBlock = async (id: string, data: BlockFormData): Promise<PromptBlock> => {
  if (STORAGE_MODE === 'LOCAL') {
      const blocks = getLS<PromptBlock[]>(LS_KEYS.BLOCKS, []);
      const index = blocks.findIndex(b => b.id === id);
      if (index === -1) throw new Error("Block not found");
      
      const updatedBlock = { ...blocks[index], ...data };
      blocks[index] = updatedBlock;
      setLS(LS_KEYS.BLOCKS, blocks);
      return updatedBlock;
  }

  const response = await fetch(`${API_BASE_URL}?endpoint=blocks&id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteBlock = async (id: string): Promise<void> => {
  if (STORAGE_MODE === 'LOCAL') {
      const blocks = getLS<PromptBlock[]>(LS_KEYS.BLOCKS, []);
      setLS(LS_KEYS.BLOCKS, blocks.filter(b => b.id !== id));
      return;
  }

  const response = await fetch(`${API_BASE_URL}?endpoint=blocks&id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete block');
};

/* --- Prompt History --- */

export const saveHistory = async (prompt: string): Promise<void> => {
    if (!prompt || !prompt.trim()) return;

    if (STORAGE_MODE === 'LOCAL') {
        const history = getLS<{content: string}[]>(LS_KEYS.HISTORY, []);
        // Prevent dupes at the top
        if (history.length > 0 && history[0].content === prompt) return;
        
        const newHistory = [{ content: prompt }, ...history].slice(0, 50);
        setLS(LS_KEYS.HISTORY, newHistory);
        return;
    }

    try {
        await fetch(`${API_BASE_URL}?endpoint=history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: prompt }),
        });
    } catch (e) {
        console.error('Failed to save history', e);
    }
}

export const getHistory = async (): Promise<string[]> => {
    if (STORAGE_MODE === 'LOCAL') {
        const history = getLS<{content: string}[]>(LS_KEYS.HISTORY, []);
        return history.map(h => h.content);
    }

    try {
        const response = await fetch(`${API_BASE_URL}?endpoint=history`);
        const data = await handleResponse(response);
        return Array.isArray(data) ? data.map((item: any) => item.content || item) : []; 
    } catch {
        return [];
    }
}

export const clearHistory = async (): Promise<void> => {
    if (STORAGE_MODE === 'LOCAL') {
        setLS(LS_KEYS.HISTORY, []);
        return;
    }
    await fetch(`${API_BASE_URL}?endpoint=history`, { method: 'DELETE' });
}

/* --- Image History (Transient) --- */

export const saveImageToHistory = async (image: GeneratedImage): Promise<void> => {
  if (STORAGE_MODE === 'LOCAL') {
      const images = getLS<GeneratedImage[]>(LS_KEYS.IMAGES, []);
      const newImages = [image, ...images].slice(0, 20); 
      setLS(LS_KEYS.IMAGES, newImages);
      return;
  }

  try {
    await fetch(`${API_BASE_URL}?endpoint=images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(image),
    });
  } catch (e) {
    console.error("Failed to save image history", e);
  }
};

export const getImageHistory = async (): Promise<GeneratedImage[]> => {
  if (STORAGE_MODE === 'LOCAL') {
      return getLS<GeneratedImage[]>(LS_KEYS.IMAGES, []);
  }

  try {
    const response = await fetch(`${API_BASE_URL}?endpoint=images`);
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const clearImageHistory = async (): Promise<void> => {
    if (STORAGE_MODE === 'LOCAL') {
        setLS(LS_KEYS.IMAGES, []);
        return;
    }
    await fetch(`${API_BASE_URL}?endpoint=images`, { method: 'DELETE' });
};

/* --- Saved Images (Persistent) --- */

export const getSavedImages = async (): Promise<SavedImage[]> => {
  if (STORAGE_MODE === 'LOCAL') {
      return getLS<SavedImage[]>(LS_KEYS.SAVED_IMAGES, []);
  }

  try {
    const response = await fetch(`${API_BASE_URL}?endpoint=saved-images`);
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const saveSavedImage = async (image: GeneratedImage): Promise<SavedImage> => {
  if (STORAGE_MODE === 'LOCAL') {
      const newSaved: SavedImage = {
          ...image,
          id: generateId()
      };
      const saved = getLS<SavedImage[]>(LS_KEYS.SAVED_IMAGES, []);
      setLS(LS_KEYS.SAVED_IMAGES, [newSaved, ...saved]);
      return newSaved;
  }

  const response = await fetch(`${API_BASE_URL}?endpoint=saved-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(image),
  });
  return handleResponse(response);
};

export const deleteSavedImage = async (id: string): Promise<void> => {
  if (STORAGE_MODE === 'LOCAL') {
      const saved = getLS<SavedImage[]>(LS_KEYS.SAVED_IMAGES, []);
      setLS(LS_KEYS.SAVED_IMAGES, saved.filter(s => s.id !== id));
      return;
  }
  await fetch(`${API_BASE_URL}?endpoint=saved-images&id=${id}`, { method: 'DELETE' });
};

export const clearSavedImages = async (): Promise<void> => {
    if (STORAGE_MODE === 'LOCAL') {
        setLS(LS_KEYS.SAVED_IMAGES, []);
        return;
    }
    await fetch(`${API_BASE_URL}?endpoint=saved-images`, { method: 'DELETE' });
};

/* --- Saved Prompts --- */

export const getSavedPrompts = async (): Promise<SavedPrompt[]> => {
  if (STORAGE_MODE === 'LOCAL') {
      return getLS<SavedPrompt[]>(LS_KEYS.SAVED, []);
  }

  try {
    const response = await fetch(`${API_BASE_URL}?endpoint=saved-prompts`);
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const saveSavedPrompt = async (content: string): Promise<SavedPrompt> => {
  if (STORAGE_MODE === 'LOCAL') {
      const newSaved: SavedPrompt = {
          id: generateId(),
          content,
          timestamp: Date.now()
      };
      const saved = getLS<SavedPrompt[]>(LS_KEYS.SAVED, []);
      setLS(LS_KEYS.SAVED, [newSaved, ...saved]);
      return newSaved;
  }

  const response = await fetch(`${API_BASE_URL}?endpoint=saved-prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return handleResponse(response);
};

export const deleteSavedPrompt = async (id: string): Promise<void> => {
  if (STORAGE_MODE === 'LOCAL') {
      const saved = getLS<SavedPrompt[]>(LS_KEYS.SAVED, []);
      setLS(LS_KEYS.SAVED, saved.filter(s => s.id !== id));
      return;
  }
  await fetch(`${API_BASE_URL}?endpoint=saved-prompts&id=${id}`, { method: 'DELETE' });
};

export const clearSavedPrompts = async (): Promise<void> => {
    if (STORAGE_MODE === 'LOCAL') {
        setLS(LS_KEYS.SAVED, []);
        return;
    }
    await fetch(`${API_BASE_URL}?endpoint=saved-prompts`, { method: 'DELETE' });
};

// Seed Data for First Run in LOCAL mode
const SEED_DATA: PromptBlock[] = [
    { id: '1', title: 'Cyberpunk City', content: 'neon-lit futuristic city, raining, reflections, towering skyscrapers', tag: 'Setting', createdAt: Date.now() },
    { id: '2', title: 'Golden Hour', content: 'golden hour lighting, warm tones, soft shadows, sun flare', tag: 'Lighting', createdAt: Date.now() },
    { id: '3', title: 'Portrait Shot', content: '85mm lens, f/1.8, bokeh background, sharp focus on eyes', tag: 'Camera', createdAt: Date.now() },
    { id: '4', title: 'Oil Painting', content: 'oil painting style, thick brushstrokes, textured canvas, impasto', tag: 'Style', createdAt: Date.now() },
    { id: '5', title: 'Anime Style', content: 'anime style, cel shaded, vibrant colors, studio ghibli inspired', tag: 'Style', createdAt: Date.now() },
    { id: '6', title: 'Analog Film', content: 'analog film, 35mm, kodak portra 400, film grain, vintage feel', tag: 'Style', createdAt: Date.now() },
    { id: '7', title: 'Dark Fantasy', content: 'dark fantasy, eldritch horror, gloomy atmosphere, mist, muted colors', tag: 'Style', createdAt: Date.now() },
    { id: '8', title: 'Vaporwave', content: 'vaporwave aesthetic, pink and blue neon, retro 80s, glitch art, statue bust', tag: 'Style', createdAt: Date.now() },
    { id: '9', title: 'Forest Guardian', content: 'ancient forest guardian, moss-covered stone golem, glowing runes, vines, mystical forest background', tag: 'Character', createdAt: Date.now() },
    { id: '10', title: 'Cyber-Ronin', content: 'cybernetic samurai, glowing katana, futuristic armor, rain-slicked street, neon signs', tag: 'Character', createdAt: Date.now() },
    { id: '11', title: 'Space Smuggler', content: 'rogue space smuggler, leather jacket, blaster pistol, spaceship cockpit, starfield background', tag: 'Character', createdAt: Date.now() },
    { id: '12', title: 'Steampunk Aviator', content: 'steampunk aviator, brass goggles, leather flight cap, clockwork wings, clouds background', tag: 'Character', createdAt: Date.now() }
];

// Initialize Seed Data
if (STORAGE_MODE === 'LOCAL' && !localStorage.getItem(LS_KEYS.BLOCKS)) {
    setLS(LS_KEYS.BLOCKS, SEED_DATA);
}
