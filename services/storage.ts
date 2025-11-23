import { PromptBlock, BlockFormData, GeneratedImage, SavedPrompt } from '../types';

// Default to port 8000 for PHP development server
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper to handle response errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }
  return response.json();
};

/* --- Blocks (MySQL Table: prompt_blocks) --- */

export const getBlocks = async (): Promise<PromptBlock[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/blocks`);
    return handleResponse(response);
  } catch (e) {
    console.error('Failed to fetch blocks:', e);
    return [];
  }
};

export const saveBlock = async (block: BlockFormData): Promise<PromptBlock> => {
  const response = await fetch(`${API_BASE_URL}/blocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(block),
  });
  return handleResponse(response);
};

export const updateBlock = async (id: string, data: BlockFormData): Promise<PromptBlock> => {
  const response = await fetch(`${API_BASE_URL}/blocks/${id}`, {
    method: 'PUT', // or PATCH
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteBlock = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/blocks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete block');
};

/* --- Prompt History (MySQL Table: prompt_history) --- */

export const saveHistory = async (prompt: string): Promise<void> => {
    if (!prompt || !prompt.trim()) return;
    try {
        await fetch(`${API_BASE_URL}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: prompt }),
        });
    } catch (e) {
        console.error('Failed to save history', e);
    }
}

export const getHistory = async (): Promise<string[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/history`);
        const data = await handleResponse(response);
        // Map backend objects { content: string } to simple string[]
        return data.map((item: any) => item.content || item); 
    } catch {
        return [];
    }
}

export const clearHistory = async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/history`, { method: 'DELETE' });
}

/* --- Image History (MySQL Table: generated_images) --- */

export const saveImageToHistory = async (image: GeneratedImage): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(image),
    });
  } catch (e) {
    console.error("Failed to save image history", e);
  }
};

export const getImageHistory = async (): Promise<GeneratedImage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/images`);
    return handleResponse(response);
  } catch {
    return [];
  }
};

export const clearImageHistory = async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/images`, { method: 'DELETE' });
};

/* --- Saved Prompts (MySQL Table: saved_prompts) --- */

export const getSavedPrompts = async (): Promise<SavedPrompt[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-prompts`);
    return handleResponse(response);
  } catch {
    return [];
  }
};

export const saveSavedPrompt = async (content: string): Promise<SavedPrompt> => {
  const response = await fetch(`${API_BASE_URL}/saved-prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return handleResponse(response);
};

export const deleteSavedPrompt = async (id: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/saved-prompts/${id}`, { method: 'DELETE' });
};

export const clearSavedPrompts = async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/saved-prompts`, { method: 'DELETE' });
};