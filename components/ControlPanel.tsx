import React, { Dispatch, SetStateAction } from 'react';
import { Loader2, Terminal, Brain, Lock, Ruler, Dices, Zap, Ratio, ArrowRight } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { ImageFile, AspectRatio } from '../types';

interface ControlPanelProps {
    // Prompt
    prompt: string;
    setPrompt: Dispatch<SetStateAction<string>>;
    onEnhancePrompt: () => void;
    isEnhancing: boolean;

    // Toggles
    isThinkingMode: boolean;
    setIsThinkingMode: Dispatch<SetStateAction<boolean>>;
    isMasterFixed: boolean;
    setIsMasterFixed: Dispatch<SetStateAction<boolean>>;
    isSeedFixed: boolean;
    toggleSeedFixed: () => void; // Wrapped handler

    // Settings
    resolution: 'SD' | 'HD' | '4K';
    setResolution: Dispatch<SetStateAction<'SD' | 'HD' | '4K'>>;
    aspectRatio: AspectRatio;
    setAspectRatio: Dispatch<SetStateAction<AspectRatio>>;

    // References
    referenceImages: (ImageFile | null)[];
    setReferenceImages: Dispatch<SetStateAction<(ImageFile | null)[]>>;

    // Generation Action
    activeTab: 'create' | 'gallery';
    setActiveTab?: (tab: 'create' | 'gallery') => void; // Optional if not on mobile, but passed for logic
    onGenerate: () => void;
    isGenerating: boolean;
    error: string | null;
    apiKeyReady: boolean;
    onSelectKey: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    prompt, setPrompt, onEnhancePrompt, isEnhancing,
    isThinkingMode, setIsThinkingMode,
    isMasterFixed, setIsMasterFixed,
    isSeedFixed, toggleSeedFixed,
    resolution, setResolution,
    aspectRatio, setAspectRatio,
    referenceImages, setReferenceImages,
    activeTab, setActiveTab,
    onGenerate, isGenerating, error, apiKeyReady, onSelectKey
}) => {

    // Logic for cycling aspect ratio
    const cycleAspectRatio = () => {
        const ratios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:4'];
        const currentIndex = ratios.indexOf(aspectRatio as any);
        if (currentIndex === -1) {
            setAspectRatio('16:9');
        } else {
            const nextIndex = (currentIndex + 1) % ratios.length;
            setAspectRatio(ratios[nextIndex]);
        }
    };

    // Logic for cycling resolution
    const cycleResolution = () => {
        const resOptions: ('SD' | 'HD' | '4K')[] = ['SD', 'HD', '4K'];
        const nextIndex = (resOptions.indexOf(resolution) + 1) % resOptions.length;
        setResolution(resOptions[nextIndex]);
    };

    const handleRefChange = (file: ImageFile | null, index: number) => {
        if (file) {
            const newRefs = [...referenceImages];
            newRefs[index] = file;
            if (index === newRefs.length - 1) newRefs.push(null);
            setReferenceImages(newRefs);
        } else {
            const newRefs = referenceImages.filter((_, i) => i !== index);
            if (newRefs.length === 0 || newRefs[newRefs.length - 1] !== null) newRefs.push(null);
            setReferenceImages(newRefs);
        }
    };

    return (
        <div className={`${activeTab === 'create' ? 'flex animate-in fade-in duration-300' : 'hidden'} lg:flex lg:col-span-4 flex-col h-full lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 pb-20 lg:pb-0`}>
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 lg:space-y-8 scrollbar-hide">
                {/* Prompt */}
                <div className="space-y-4">
                    <label className="text-[10px] font-normal text-zinc-500 uppercase tracking-widest block">
                        Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="TYPE YOUR VISION HERE..."
                        className="w-full h-32 lg:h-32 bg-transparent border-b border-zinc-800 rounded-none p-0 text-[16px] lg:text-[13px] text-white placeholder-zinc-800 focus:border-white focus:ring-0 resize-none outline-none transition-all leading-relaxed uppercase font-normal"
                    />
                    <div className="flex items-center justify-end mt-2 gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            onClick={onEnhancePrompt}
                            disabled={isEnhancing || !prompt.trim()}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 lg:py-1.5 rounded-full border text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${isEnhancing ? 'bg-zinc-800 text-zinc-500 border-zinc-800' : 'bg-transparent text-emerald-500 border-zinc-800 hover:border-emerald-500 hover:text-emerald-400'}`}
                            title="Enhance Prompt (Prompt+)"
                        >
                            {isEnhancing ? <Loader2 size={11} className="animate-spin" /> : <Terminal size={11} />}
                            {isEnhancing ? 'CODING' : 'PROMPT+'}
                        </button>

                        <button
                            onClick={() => setIsThinkingMode(!isThinkingMode)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 lg:py-1.5 rounded-full border text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${isThinkingMode ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300'}`}
                            title="Deep Thinking Mode (5min Timeout)"
                        >
                            <Brain size={11} />
                            {isThinkingMode ? 'DEEP' : 'FAST'}
                        </button>

                        <button
                            onClick={() => setIsMasterFixed(!isMasterFixed)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 lg:py-1.5 rounded-full border text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${isMasterFixed ? 'bg-orange-950 text-orange-400 border-orange-800' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300'}`}
                            title="Lock Composition (Master Reference)"
                        >
                            {isMasterFixed ? <Lock size={11} /> : <Ruler size={11} />}
                            {isMasterFixed ? 'LOCKED' : 'FREE'}
                        </button>

                        <button
                            onClick={toggleSeedFixed}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 lg:py-1.5 rounded-full border text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${isSeedFixed ? 'bg-green-950 text-green-400 border-green-800' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300'}`}
                            title="Lock Generation Seed (Randomness)"
                        >
                            <Dices size={11} />
                            {isSeedFixed ? 'FIXED' : 'RANDOM'}
                        </button>

                        <button
                            onClick={cycleResolution}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 lg:py-1.5 rounded-full border text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${resolution === 'SD' ? 'bg-yellow-900/30 text-yellow-500 border-yellow-800' : resolution === '4K' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700'}`}
                        >
                            <Zap size={11} />
                            {resolution === 'SD' ? 'TURBO' : resolution === 'HD' ? 'PRO' : 'ULTRA'}
                        </button>

                        <button
                            onClick={cycleAspectRatio}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 lg:py-1.5 rounded-full border border-zinc-800 bg-transparent text-zinc-500 text-[10px] font-medium uppercase tracking-wider hover:border-zinc-500 hover:text-zinc-300 transition-all whitespace-nowrap active:scale-95"
                        >
                            <Ratio size={11} />
                            {aspectRatio}
                        </button>
                    </div>
                </div>

                {/* Reference Images */}
                <div className="space-y-4">
                    <label className="text-[10px] font-normal text-zinc-500 uppercase tracking-widest block">
                        REFERENCE IMAGES
                    </label>
                    <div className="space-y-3">
                        {referenceImages.map((ref, index) => (
                            <ImageUploader
                                key={index}
                                label={index === 0 ? "REFERENCE 1 (MASTER)" : `REFERENCE ${index + 1} (ASSET)`}
                                subLabel={index === 0 ? "Spatial Context" : "Style / Object"}
                                image={ref}
                                onImageChange={(file) => handleRefChange(file, index)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Area */}
            <div className="mt-8 pt-6 border-t border-white/10 bg-black z-10 lg:mt-auto">
                <button
                    onClick={() => {
                        onGenerate();
                        // Mobile switch tab
                        if (window.innerWidth < 1024 && setActiveTab) {
                            setActiveTab('gallery');
                        }
                    }}
                    disabled={isGenerating}
                    className="w-full h-14 lg:h-12 bg-white text-black font-normal uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-28 lg:mb-0 active:scale-95"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={14} />
                            PROCESSING
                        </>
                    ) : (
                        <>
                            GENERATE
                            <ArrowRight size={14} />
                        </>
                    )}
                </button>

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-[10px] mt-4 uppercase">
                        {error}
                        {!apiKeyReady && (
                            <button onClick={onSelectKey} className="ml-2 underline hover:text-red-300">
                                SET API KEY
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ControlPanel;
