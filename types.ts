
export interface PromptBlock {
  id: string;
  title: string;
  content: string;
  tag: string;
  subTag?: string;
  createdAt: number;
}

export type BlockFormData = Omit<PromptBlock, 'id' | 'createdAt'>;

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
  seed?: number;
}

export interface SavedImage extends GeneratedImage {
  id: string;
}

export interface SavedPrompt {
  id: string;
  content: string;
  timestamp: number;
}

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  GALLERY = 'GALLERY'
}

declare global {
  interface Window {
    google?: any;
  }
}
