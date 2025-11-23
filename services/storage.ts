import { PromptBlock, BlockFormData, GeneratedImage, SavedPrompt } from '../types';

declare const process: any;

// ==========================================
// STORAGE CONFIGURATION
// ==========================================
// 'API'   - Use PHP Backend (e.g. yourdomain.com/api/)
// 'LOCAL' - Use Browser LocalStorage (no server required)
export const STORAGE_MODE: 'API' | 'LOCAL' = (process.env.STORAGE_MODE as 'API' | 'LOCAL') || 'LOCAL'; 

// Points to the folder containing index.php. 
// Using './api' allows the app to be deployed in a subdirectory (e.g. domain.com/apps/promptforge/)
const API_BASE_URL = './api';

const LS_KEYS = {
    BLOCKS: 'pf_blocks',
    HISTORY: 'pf_history',
    IMAGES: 'pf_images',
    SAVED: 'pf_saved_prompts'
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

/* --- Blocks --- */

export const getBlocks = async (): Promise<PromptBlock[]> => {
  if (STORAGE_MODE === 'LOCAL') {
      return getLS<PromptBlock[]>(LS_KEYS.BLOCKS, []);
  }

  try {
    // GET ./api?endpoint=blocks
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

  // PUT ./api?endpoint=blocks&id=123
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

  // DELETE ./api?endpoint=blocks&id=123
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
        // Avoid consecutive duplicates
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

/* --- Image History --- */

export const saveImageToHistory = async (image: GeneratedImage): Promise<void> => {
  if (STORAGE_MODE === 'LOCAL') {
      const images = getLS<GeneratedImage[]>(LS_KEYS.IMAGES, []);
      const newImages = [image, ...images].slice(0, 20); // Keep last 20
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