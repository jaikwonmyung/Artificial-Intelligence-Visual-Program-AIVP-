import { ImageFile, ImageSize, AspectRatio } from '../types';
import { generateImage, editImage } from '../services/geminiService';
import { RANDOM_SEED_MAX } from '../constants';

export const processInpainting = async (
    composite: string,
    mask: string,
    promptText: string,
    referenceImage?: string
): Promise<string> => {
    // If composite is full data URL, split it.
    // editImage expects base64 strings (no prefix)
    const base64Base = composite.includes(',') ? composite.split(',')[1] : composite;
    const base64Mask = mask.includes(',') ? mask.split(',')[1] : mask;

    let base64Ref: string | undefined = undefined;
    if (referenceImage) {
        base64Ref = referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage;
    }

    return await editImage(base64Base, base64Mask, promptText, base64Ref);
};

export const processComposition = async (
    composite: string,
    promptText: string,
    referenceImages: (ImageFile | null)[],
    imageSize: ImageSize,
    isTurbo: boolean,
    isCameraControlEnabled: boolean,
    isSeedFixed: boolean,
    currentSeed: number | null,
    aspectRatio: AspectRatio
): Promise<string> => {
    const compositeFile: ImageFile = {
        file: new File([], "composite.png"),
        previewUrl: composite,
        base64: composite.includes(',') ? composite.split(',')[1] : composite,
        mimeType: 'image/png'
    };

    let seedToUse = currentSeed;
    if (!isSeedFixed || currentSeed === null) {
        seedToUse = Math.floor(Math.random() * RANDOM_SEED_MAX);
    }

    // Logic: Combine Composite (Master) with valid Asset References (Index 1+)
    const validAssets = referenceImages.slice(1).filter(ref => ref !== null) as ImageFile[];
    const finalImages = [compositeFile, ...validAssets];

    console.log('[canvasHelpers] processComposition calling generateImage...');
    console.log(`[canvasHelpers] Composite size: ${(composite.length / 1024).toFixed(2)} KB`);
    console.log(`[canvasHelpers] Assets attached: ${validAssets.length}`);

    return await generateImage(
        promptText,
        finalImages,
        imageSize,
        isTurbo,
        isCameraControlEnabled,
        seedToUse,
        aspectRatio
    );
};
