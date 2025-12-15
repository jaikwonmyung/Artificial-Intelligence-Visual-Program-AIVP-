export enum ImageSize {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K',
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export type AspectRatio = string;

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  seed?: number;
  settings?: {
    size?: ImageSize;
    aspectRatio?: AspectRatio;
    imageSize?: ImageSize;
    isTurbo?: boolean;
    model?: string;
    refCount?: string;
    seed?: number; // Added to fix lint and support seed tracking
  };
}