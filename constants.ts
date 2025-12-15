import { ImageSize } from './types';

export const DEFAULT_POSITIVE_PROMPT = `CG High Quality Rendering; UE5 (Lumen, Nanite, Path Tracer); Low Angle; Precise 3-Point Perspective & Vanishing Point; ACES Tone Mapping; 8K; 35/85mm; Physically Based Rendering (PBR); Smooth Fill & Rim Light; Contact Shadows, SSAO/GTAO; EV Exposure; White Balance 5600K/3200K; PBR Shaders (Roughness/Metal/Normal/Displacement); Filmic Contrast, Negative Space.`;

export const DEFAULT_NEGATIVE_PROMPT = `lowpoly, waxy/plastic, fake HDR, oversaturation, highlight clipping, black crush, perspective mismatch, horizontal tilt, texture stretching, repetition, limb duplication, banding, excessive CA, watermark/text/border, hallucination, glitch, floating objects, mutated hands, extra fingers, distorted face, unnatural anatomy, impossible geometry, blurry, erratic artifacting`;

export const MODEL_NAME_PRO = 'gemini-3-pro-image-preview'; // High-Fidelity
export const MODEL_NAME_TURBO = 'gemini-2.5-flash-image';   // High-Speed

export const PLACEHOLDER_IMAGE = "https://picsum.photos/1920/1080";

export const MAX_HISTORY_ITEMS = 20;

export const STORAGE_KEYS = {
    SEQUENCE: 'sequence_number',
    HISTORY: 'render_history',
    API_KEY: 'gemini_api_key'
} as const;

export const RANDOM_SEED_MAX = 1000000000;

export const KEYBOARD_SHORTCUTS = {
    GENERATE: 'Meta+Enter', // Mac: Cmd+Enter, Windows: Ctrl+Enter
    UPSCALE: 'Meta+U',
    ESCAPE: 'Escape'
} as const;
