import React from 'react';
import { Trash2 } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryStripProps {
    history: HistoryItem[];
    onHistoryClick: (item: HistoryItem) => void;
    onClearHistory: () => void;
}

const HistoryStrip: React.FC<HistoryStripProps> = ({ history, onHistoryClick, onClearHistory }) => {
    return (
        <div className="h-24 mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {history.length === 0 && (
                <div className="w-full flex items-center justify-center text-[10px] text-zinc-600 uppercase tracking-widest border border-white/5 border-dashed">
                    SESSION HISTORY EMPTY
                </div>
            )}
            {history.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onHistoryClick(item)}
                    className="min-w-[6rem] h-full bg-zinc-900 border border-white/5 relative group cursor-pointer hover:border-white/20 transition-colors"
                >
                    <img src={item.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/80 backdrop-blur-sm">
                        <p className="text-[8px] text-zinc-400 truncate uppercase">{item.prompt}</p>
                    </div>
                </div>
            ))}
            {history.length > 0 && (
                <button
                    onClick={onClearHistory}
                    className="min-w-[3rem] h-full flex items-center justify-center border border-white/5 hover:bg-red-900/20 hover:border-red-900/50 hover:text-red-500 transition-colors"
                    title="Clear Session History"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

export default HistoryStrip;
