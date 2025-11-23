import { PromptBlock, BlockFormData, GeneratedImage, SavedPrompt } from '../types';

const STORAGE_KEY = 'promptforge_blocks';
const HISTORY_KEY = 'promptforge_history';
const IMAGE_HISTORY_KEY = 'promptforge_image_history';
const SAVED_PROMPTS_KEY = 'promptforge_saved_prompts';

const SEED_DATA: PromptBlock[] = [
  {
    id: '1',
    title: 'Cyberpunk City',
    content: 'futuristic cyberpunk city, neon lights, rain-slicked streets, towering skyscrapers, high tech low life, cinematic lighting, 8k resolution',
    tag: 'Style',
    subTag: 'Sci-Fi',
    createdAt: Date.now(),
  },
  {
    id: '2',
    title: 'Portrait Lighting',
    content: 'soft studio lighting, rim light, bokeh background, sharp focus on eyes, professional photography, 85mm lens',
    tag: 'Lighting',
    subTag: 'Portrait',
    createdAt: Date.now() - 1000,
  },
  {
    id: '3',
    title: 'Oil Painting',
    content: 'oil painting style, thick brushstrokes, impasto, vibrant colors, masterpiece, classical art style',
    tag: 'Medium',
    subTag: 'Traditional',
    createdAt: Date.now() - 2000,
  },
  {
    id: '4',
    title: 'Unreal Engine 5',
    content: 'unreal engine 5 render, ray tracing, global illumination, highly detailed, photorealistic, 4k texture',
    tag: 'Quality',
    subTag: '3D',
    createdAt: Date.now() - 3000,
  },
  {
    id: '5',
    title: 'Anime Production',
    content: 'high quality anime art, studio ghibli style, makoto shinkai backgrounds, vibrant colors, detailed clouds, atmospheric lighting, 4k',
    tag: 'Style',
    subTag: 'Anime',
    createdAt: Date.now() - 4000,
  },
  {
    id: '6',
    title: 'Analog Film',
    content: 'analog photography, kodak portra 400, film grain, light leaks, vintage aesthetic, candid shot, soft colors',
    tag: 'Style',
    subTag: 'Photography',
    createdAt: Date.now() - 5000,
  },
  {
    id: '7',
    title: 'Dark Fantasy',
    content: 'dark fantasy, eldritch horror, greg rutkowski style, oil painting, ominous atmosphere, intricate details, dramatic lighting',
    tag: 'Style',
    subTag: 'Fantasy',
    createdAt: Date.now() - 6000,
  },
  {
    id: '8',
    title: 'Vaporwave',
    content: 'vaporwave aesthetic, neon pink and blue, greek statues, glitch art, 90s computer graphics, surreal, dreamlike',
    tag: 'Style',
    subTag: 'Retro',
    createdAt: Date.now() - 7000,
  },
  {
    id: '9',
    title: 'Forest Guardian',
    content: 'mystical forest guardian, humanoid deer creature, antlers made of branches with glowing flowers, bioluminescent moss, misty ancient forest, ethereal',
    tag: 'Character',
    subTag: 'Fantasy',
    createdAt: Date.now() - 8000,
  },
  {
    id: '10',
    title: 'Cyber-Ronin',
    content: 'cybernetic samurai warrior, traditional kimono mixed with carbon fiber armor, glowing katana, rain-soaked neon city rooftop, intense stare, action pose',
    tag: 'Character',
    subTag: 'Sci-Fi',
    createdAt: Date.now() - 9000,
  },
  {
    id: '11',
    title: 'Space Smuggler',
    content: 'roguish space smuggler, worn leather jacket, blaster pistol at hip, smirk, leaning against a rusty spaceship hull, alien spaceport background',
    tag: 'Character',
    subTag: 'Sci-Fi',
    createdAt: Date.now() - 10000,
  },
  {
    id: '12',
    title: 'Steampunk Aviator',
    content: 'female steampunk aviator, brass goggles, leather flight cap, mechanical wings, clouds background, golden hour lighting, adventurous expression',
    tag: 'Character',
    subTag: 'Steampunk',
    createdAt: Date.now() - 11000,
  }
];

export const getBlocks = (): PromptBlock[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Initialize with seed data if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load blocks', e);
    return [];
  }
};

export const saveBlock = (block: BlockFormData): PromptBlock => {
  const blocks = getBlocks();
  const newBlock: PromptBlock = {
    ...block,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const updated = [newBlock, ...blocks];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newBlock;
};

export const updateBlock = (id: string, data: BlockFormData): PromptBlock[] => {
  const blocks = getBlocks();
  const updated = blocks.map(b => b.id === id ? { ...b, ...data } : b);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteBlock = (id: string): PromptBlock[] => {
  const blocks = getBlocks();
  const updated = blocks.filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const saveHistory = (prompt: string) => {
    if (!prompt || !prompt.trim()) return;
    // Simple history LIFO
    const history = getHistory();
    if (history[0] === prompt) return; // Dedupe recent
    const newHistory = [prompt, ...history].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
}

export const getHistory = (): string[] => {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
}

export const saveImageToHistory = (image: GeneratedImage) => {
  const history = getImageHistory();
  // Limit to 5 images to prevent localStorage quota issues with base64 data
  const newHistory = [image, ...history].slice(0, 5);
  try {
    localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.warn("Storage quota exceeded for image history, clearing oldest and retrying");
    // If it fails, try clearing older ones aggressively
    if (newHistory.length > 1) {
         try {
            localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify([image]));
         } catch (e2) {}
    }
  }
};

export const getImageHistory = (): GeneratedImage[] => {
  try {
    const data = localStorage.getItem(IMAGE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const clearImageHistory = () => {
    localStorage.removeItem(IMAGE_HISTORY_KEY);
};

// Saved Prompts
export const getSavedPrompts = (): SavedPrompt[] => {
  try {
    const data = localStorage.getItem(SAVED_PROMPTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveSavedPrompt = (content: string): SavedPrompt[] => {
  const prompts = getSavedPrompts();
  const newPrompt: SavedPrompt = {
    id: crypto.randomUUID(),
    content,
    timestamp: Date.now(),
  };
  const updated = [newPrompt, ...prompts];
  localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteSavedPrompt = (id: string): SavedPrompt[] => {
  const prompts = getSavedPrompts();
  const updated = prompts.filter(p => p.id !== id);
  localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updated));
  return updated;
};

export const clearSavedPrompts = () => {
    localStorage.removeItem(SAVED_PROMPTS_KEY);
};