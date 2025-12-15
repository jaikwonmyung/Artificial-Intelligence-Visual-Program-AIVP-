import { useState } from 'react';
import { ImageFile, ImageSize, AspectRatio } from '../types';
import { generateImage, ensureApiKey } from '../services/geminiService';
import { RANDOM_SEED_MAX } from '../constants';

export const useImageGeneration = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = async (
        prompt: string,
        referenceImages: (ImageFile | null)[],
        imageSize: ImageSize,
        isTurbo: boolean,
        isCameraControlEnabled: boolean,
        isSeedFixed: boolean,
        currentSeed: number | null,
        aspectRatio: AspectRatio,
        isMasterFixed: boolean = false,
        isThinkingMode: boolean = false
    ) => {
        setIsGenerating(true);
        setError(null);

        try {
            const isReady = await ensureApiKey();
            if (!isReady) {
                // If ensureApiKey returns false, it usually means the user needs to select a key 
                // or the environment is not set up. 
                // We'll throw a specific error that App.tsx can recognize to show the UI.
                throw new Error('API_KEY_MISSING');
            }

            let seedToUse = currentSeed;
            if (!isSeedFixed || currentSeed === null) {
                seedToUse = Math.floor(Math.random() * RANDOM_SEED_MAX);
            }

            const url = await generateImage(
                prompt,
                referenceImages,
                imageSize,
                isTurbo,
                isCameraControlEnabled,
                seedToUse,
                aspectRatio,
                isMasterFixed,
                isThinkingMode
            );

            return { url, seed: seedToUse };

        } catch (err: any) {
            console.error("Generation failed:", err);
            // Don't set error state for 'API_KEY_MISSING' as the UI handles that via setApiKeyReady
            if (err.message !== 'API_KEY_MISSING') {
                setError(err.message || "Unknown error occurred");
                throw err;
            }
            throw err;
        } finally {
            setIsGenerating(false);
        }
    };

    return { generate, isGenerating, error, setError, setIsGenerating };
};
