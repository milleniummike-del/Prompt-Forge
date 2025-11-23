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

export interface SavedPrompt {
  id: string;
  content: string;
  timestamp: number;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  GALLERY = 'GALLERY'
}