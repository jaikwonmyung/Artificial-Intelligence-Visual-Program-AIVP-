import React from 'react';
import { Eraser } from 'lucide-react';

interface NavBarProps {
    onReset: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onReset }) => {
    return (
        <nav className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-50 pt-safe-top">
            <div className="w-full px-4 lg:px-8 h-14 lg:h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col justify-center">
                        <div className="flex items-baseline gap-2 lg:gap-3">
                            <h1 className="text-lg lg:text-xl font-normal tracking-tighter text-white select-none hover:text-zinc-300 transition-colors cursor-pointer">
                                GENTLE MONSTER
                            </h1>
                            <span className="text-[8px] lg:text-[10px] font-normal text-zinc-500 tracking-[0.2em] uppercase hidden sm:inline-block">
                                Space Division
                            </span>
                        </div>
                        <p className="text-[9px] font-normal text-zinc-600 tracking-wider uppercase mt-0.5 hidden lg:block">
                            Unified Multimodal AI Engine for Spatial Design, Visualization, and Creative Generation
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-zinc-600 font-mono tracking-widest uppercase">
                            ENGINE v1.0.0 <span className="text-zinc-800 mx-1">|</span> 2025.12.15
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-[10px] uppercase tracking-widest"
                        >
                            <Eraser size={12} />
                            <span className="hidden sm:inline">RESET</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
