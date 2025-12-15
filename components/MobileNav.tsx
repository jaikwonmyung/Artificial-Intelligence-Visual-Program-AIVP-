import React from 'react';
import { Paintbrush, Camera } from 'lucide-react';

interface MobileNavProps {
    activeTab: 'create' | 'gallery';
    setActiveTab: (tab: 'create' | 'gallery') => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-auto min-h-[4rem] bg-black border-t border-white/10 flex lg:hidden z-50 pb-safe pt-1">
            <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${activeTab === 'create' ? 'text-white' : 'text-zinc-600'}`}
            >
                <Paintbrush size={18} />
                <span className="text-[8px] uppercase tracking-widest">Create</span>
            </button>
            <div className="w-px h-8 bg-white/10 self-center" />
            <button
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${activeTab === 'gallery' ? 'text-white' : 'text-zinc-600'}`}
            >
                <Camera size={18} />
                <span className="text-[8px] uppercase tracking-widest">Gallery</span>
            </button>
        </div>
    );
};

export default MobileNav;
