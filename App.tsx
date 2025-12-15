import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { DEFAULT_POSITIVE_PROMPT, MAX_HISTORY_ITEMS } from './constants';

import { ImageFile, ImageSize, HistoryItem, AspectRatio } from './types';
import { ensureApiKey, openApiKeySelection, enhancePrompt, changeView, upscaleImage, editImage } from './services/geminiService'; // Added missing imports if any

import ResultViewer from './components/ResultViewer';
import CanvasEditor from './components/CanvasEditor';
import NavBar from './components/NavBar';
import MobileNav from './components/MobileNav';
import ControlPanel from './components/ControlPanel';
import HistoryStrip from './components/HistoryStrip';

// Hooks & Utils
import { useImageGeneration } from './hooks/useImageGeneration';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { processInpainting, processComposition } from './utils/canvasHelpers';
import { compressBase64Image } from './utils/imageCompression';


const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [referenceImages, setReferenceImages] = useState<(ImageFile | null)[]>([null, null]);

    // Config
    // const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.RES_1K); // Removed, derived from resolution
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    // const [isTurbo, setIsTurbo] = useState<boolean>(false); // Derived from resolution
    const [isCameraControlEnabled, setIsCameraControlEnabled] = useState<boolean>(false);
    const [isSeedFixed, setIsSeedFixed] = useState<boolean>(false);
    const [isMasterFixed, setIsMasterFixed] = useState<boolean>(false);
    const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
    const [resolution, setResolution] = useState<'SD' | 'HD' | '4K'>('HD');
    const [currentSeed, setCurrentSeed] = useState<number | null>(null);
    const [isEnhancing, setIsEnhancing] = useState<boolean>(false);


    // Canvas State
    const [showCanvas, setShowCanvas] = useState(false);
    const [canvasMode, setCanvasMode] = useState<'inpainting' | 'composition'>('inpainting');
    const [canvasBaseImage, setCanvasBaseImage] = useState<string>('');
    const [canvasOverlayImage, setCanvasOverlayImage] = useState<string | null>(null);
    const [canvasInitialMask, setCanvasInitialMask] = useState<{ x: number, y: number, w: number, h: number } | undefined>(undefined);

    // Global State
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);



    // Custom Hook: Image Generation
    const { generate, isGenerating, error, setError, setIsGenerating } = useImageGeneration();

    useEffect(() => {
        const checkKey = async () => {
            try {
                const ready = await ensureApiKey();
                setApiKeyReady(ready);
            } catch (e) {
                setApiKeyReady(false);
            }
        };
        checkKey();
    }, []);

    // Helper: Select Key
    const handleSelectKey = async () => {
        await openApiKeySelection();
        const ready = await ensureApiKey();
        setApiKeyReady(ready);
    };

    // Helper: Clear History
    const handleClearHistory = () => {
        setHistory([]);
        try {
            localStorage.removeItem('render_history');
        } catch (e) { /* ignore */ }
    };

    // Feature: Enhance Prompt
    const handleEnhancePrompt = async () => {
        if (!prompt.trim()) return;
        setIsEnhancing(true);
        try {
            console.log("Enhancing prompt:", prompt);
            const enhanced = await enhancePrompt(prompt);
            console.log("Enhanced result:", enhanced);

            if (enhanced === prompt) {
                alert("Prompt Enhancer returned the same text. (AI might have failed or found it perfect). Check Console.");
            } else {
                setPrompt(enhanced);
            }
        } catch (e: any) {
            console.error("Enhance Prompt Error:", e);
            alert(`Prompt Enhance Failed: ${e.message}`);
        } finally {
            setIsEnhancing(false);
        }
    };

    // Helper: Get Size from Resolution
    const getSizeFromResolution = (): { size: ImageSize, isTurbo: boolean } => {
        let size: ImageSize;
        let isTurbo = false;
        if (resolution === '4K') size = ImageSize.RES_4K;
        else if (resolution === 'HD') size = ImageSize.RES_2K;
        else {
            size = ImageSize.RES_1K;
            isTurbo = true;
        }
        return { size, isTurbo };
    };

    // --- Generation Handler ---
    const handleGenerate = async () => {
        if (!prompt.trim() && !referenceImages[0]) {
            setError("Please enter a prompt or upload an image.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const { size, isTurbo } = getSizeFromResolution();

            const { url, seed: generatedSeed } = await generate(
                prompt,
                referenceImages,
                size,
                isTurbo,
                isCameraControlEnabled,
                isSeedFixed,
                currentSeed,
                aspectRatio,
                isMasterFixed,
                isThinkingMode
            );

            setGeneratedImage(url);

            // Add to History
            const newItem: HistoryItem = {
                id: generateId(),
                url,
                prompt,
                timestamp: Date.now(),
                seed: generatedSeed,
                settings: {
                    aspectRatio,
                    imageSize: size,
                    isTurbo
                }
            };

            setHistory(prev => [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS));

            if (isSeedFixed) {
                setCurrentSeed(generatedSeed);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Feature: Canvas Save
    const handleCanvasSave = async (result: any) => {
        console.log('[App] handleCanvasSave triggered');
        const startTime = Date.now();
        setShowCanvas(false);
        setIsGenerating(true);
        setError(null);

        try {
            await ensureApiKey();
            const promptToUse = result.prompt || prompt;
            let url = '';

            const { size, isTurbo } = getSizeFromResolution();

            console.log('[App] Starting processing...');
            if (result.mask) {
                console.log('[App] Mode: Inpainting');
                url = await processInpainting(result.composite, result.mask, promptToUse, result.referenceImage);
            } else {
                console.log('[App] Mode: Composition');
                url = await processComposition(
                    result.composite,
                    promptToUse,
                    referenceImages,
                    size,
                    isTurbo,
                    isCameraControlEnabled,
                    isSeedFixed,
                    currentSeed,
                    aspectRatio
                );
            }
            console.log(`[App] API Response received in ${Date.now() - startTime}ms`);

            setGeneratedImage(url);

            // Add to History
            const compressedUrl = await compressBase64Image(url);
            const newItem: HistoryItem = {
                id: generateId(),
                url: compressedUrl,
                prompt: promptToUse,
                timestamp: Date.now(),
                settings: {
                    size: size,
                    model: isTurbo ? 'Turbo' : 'Pro',
                    refCount: result.mask ? 'Inpaint' : 'Composition'
                }
            };
            setHistory(prev => [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS));

        } catch (error: any) {
            console.error("Canvas Operation Failed:", error);
            setError(error.message || "Canvas operation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Feature: Upscale
    const handleUpscale = async () => {
        if (!generatedImage) return;
        setIsGenerating(true);
        try {
            let base64 = '';
            if (generatedImage.startsWith('blob:')) {
                const response = await fetch(generatedImage);
                const blob = await response.blob();
                const reader = new FileReader();
                base64 = await new Promise((resolve, reject) => {
                    reader.onloadend = () => {
                        const res = reader.result as string;
                        resolve(res.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                base64 = generatedImage.split(',')[1];
            }

            const url = await upscaleImage(base64);
            setGeneratedImage(url);
        } catch (error: any) {
            alert(`Upscale failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Feature: Change View
    const handleViewChange = async (direction: 'TOP' | 'FRONT' | 'LEFT' | 'RIGHT') => {
        if (!generatedImage) return;
        setIsGenerating(true);
        try {
            let base64 = '';
            if (generatedImage.startsWith('blob:')) {
                const response = await fetch(generatedImage);
                const blob = await response.blob();
                const reader = new FileReader();
                base64 = await new Promise((resolve, reject) => {
                    reader.onloadend = () => {
                        const res = reader.result as string;
                        resolve(res.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                base64 = generatedImage.split(',')[1];
            }

            const url = await changeView(base64, direction);
            setGeneratedImage(url);
            // Add to History
            const newItem: HistoryItem = {
                id: generateId(),
                url,
                prompt: `${direction} VIEW: ${prompt}`,
                timestamp: Date.now(),
                settings: {
                    imageSize: ImageSize.RES_2K,
                    isTurbo: false,
                }
            };
            setHistory(prev => [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS));

        } catch (error: any) {
            alert(`View Change Failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // UI Handlers
    const handleOutputUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                const result = e.target.result as string;
                // Auto-detect aspect ratio
                const img = new Image();
                img.src = result;
                img.onload = () => {
                    const w = img.width;
                    const h = img.height;
                    const ratio = w / h;

                    let closest: AspectRatio = '1:1';
                    const validRatios: { r: number, k: AspectRatio }[] = [
                        { r: 1, k: '1:1' },
                        { r: 16 / 9, k: '16:9' },
                        { r: 9 / 16, k: '9:16' },
                        { r: 4 / 3, k: '4:3' },
                        { r: 3 / 4, k: '3:4' }
                    ];

                    let minDiff = Infinity;
                    validRatios.forEach(vr => {
                        const diff = Math.abs(ratio - vr.r);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closest = vr.k;
                        }
                    });

                    setAspectRatio(closest);
                    setGeneratedImage(result);
                };
            }
        };
        reader.readAsDataURL(file);
    };

    const handleHistoryClick = (item: HistoryItem) => {
        setGeneratedImage(item.url);
        setPrompt(item.prompt);
    };

    const handleInpaintOpen = () => {
        if (!generatedImage) return;
        setCanvasBaseImage(generatedImage);
        setCanvasMode('inpainting');
        setShowCanvas(true);
    };

    const handleCompositionOpen = () => { // Unused in this refactor? Used by ResultViewer maybe not... Wait, CanvasEditor.
        // Ah, the logic for opening canvas is likely triggered from ResultViewer or tools.
        // There is no button in ControlPanel for this yet, wait.
        const masterRef = referenceImages[0];
        if (!masterRef) {
            alert("Please upload Reference 1 (Master) first.");
            return;
        }
        setCanvasBaseImage(masterRef.previewUrl);
        const assetRef = referenceImages[1];
        setCanvasOverlayImage(assetRef ? assetRef.previewUrl : null);
        setCanvasMode('composition');
        setShowCanvas(true);
    };

    const handleSectorSelect = (rect: { x: number, y: number, w: number, h: number }) => {
        if (!generatedImage) return;
        setCanvasBaseImage(generatedImage);
        setCanvasMode('inpainting');
        setCanvasInitialMask(rect);
        setShowCanvas(true);
    };

    // Reset mask when closing canvas
    useEffect(() => {
        if (!showCanvas) {
            setCanvasInitialMask(undefined);
        }
    }, [showCanvas]);

    // Custom Hook: Keyboard Shortcuts
    useKeyboardShortcuts({
        generate: handleGenerate,
        upscale: handleUpscale,
        escape: () => setShowCanvas(false)
    });

    // Mobile Tab State
    const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');

    const toggleSeedFixed = () => {
        if (isSeedFixed) {
            setIsSeedFixed(false);
            setCurrentSeed(null);
        } else {
            setIsSeedFixed(true);
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200 selection:bg-white/20 pb-safe">

            {showCanvas && (
                <CanvasEditor
                    mode={canvasMode}
                    baseImage={canvasBaseImage}
                    overlayImage={canvasOverlayImage}
                    onSave={handleCanvasSave}
                    onClose={() => setShowCanvas(false)}
                    initialMaskRect={canvasInitialMask}
                />
            )}

            {/* Navbar */}
            <NavBar
                onReset={() => {
                    if (confirm('RESET ALL SETTINGS AND INPUTS?')) {
                        setPrompt('');
                        setReferenceImages([null, null]);
                        setGeneratedImage(null);
                        setHistory([]);
                    }
                }}
            />

            <main className="w-full px-4 lg:px-8 py-4 lg:py-8 lg:h-[calc(100vh-4rem)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 h-full">

                    {/* LEFT PANEL: Inputs */}
                    <ControlPanel
                        prompt={prompt}
                        setPrompt={setPrompt}
                        onEnhancePrompt={handleEnhancePrompt}
                        isEnhancing={isEnhancing}
                        isThinkingMode={isThinkingMode}
                        setIsThinkingMode={setIsThinkingMode}
                        isMasterFixed={isMasterFixed}
                        setIsMasterFixed={setIsMasterFixed}
                        isSeedFixed={isSeedFixed}
                        toggleSeedFixed={toggleSeedFixed}
                        resolution={resolution}
                        setResolution={setResolution}
                        aspectRatio={aspectRatio}
                        setAspectRatio={setAspectRatio}
                        referenceImages={referenceImages}
                        setReferenceImages={setReferenceImages}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        error={error}
                        apiKeyReady={apiKeyReady}
                        onSelectKey={handleSelectKey}
                    />

                    {/* RIGHT PANEL: Results */}
                    <div className={`${activeTab === 'gallery' ? 'flex animate-in fade-in duration-300' : 'hidden'} lg:flex lg:col-span-8 flex-col h-full lg:h-[calc(100vh-8rem)] pb-20 lg:pb-0`}>
                        <div className="flex-1 bg-zinc-900/30 border border-white/5 flex items-center justify-center relative overflow-hidden group min-h-[50vh] lg:min-h-0">
                            <ResultViewer
                                imageUrl={generatedImage}
                                loading={isGenerating}
                                onInpaint={handleInpaintOpen}
                                onUpscale={handleUpscale}
                                onSelectSector={handleSectorSelect}
                                onUpload={handleOutputUpload}
                                aspectRatio={aspectRatio}
                                onViewChange={handleViewChange}
                            />
                        </div>

                        {/* History Strip */}
                        <HistoryStrip
                            history={history}
                            onHistoryClick={handleHistoryClick}
                            onClearHistory={handleClearHistory}
                        />
                    </div>

                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div >
    );
};

export default App;
