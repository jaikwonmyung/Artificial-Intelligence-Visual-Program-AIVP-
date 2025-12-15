import React, { useState, useRef } from 'react';
import { Download, Maximize2, Minimize2, Loader2, Upload, RefreshCw, Zap, LayoutGrid, MousePointerClick, Box, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';

interface ResultViewerProps {
  imageUrl: string | null;
  loading: boolean;
  fileName?: string;
  onSave?: () => void;
  onUpload?: (file: File) => void;
  onInpaint?: () => void;
  onUpscale?: () => void;
  onSelectSector?: (rect: { x: number, y: number, w: number, h: number }) => void;
  onViewChange?: (direction: 'TOP' | 'FRONT' | 'LEFT' | 'RIGHT') => void;
  aspectRatio?: string; // e.g. "16:9"
}

const ResultViewer: React.FC<ResultViewerProps> = ({
  imageUrl,
  loading,
  fileName,
  onSave,
  onUpload,
  onInpaint,
  onUpscale,
  onSelectSector,

  onViewChange,
  aspectRatio = "16:9"
}) => {
  const [viewMode, setViewMode] = useState<'full' | 'fit'>('fit');
  const [showGrid, setShowGrid] = useState(false);
  const [showViewControls, setShowViewControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate aspect ratio string for CSS
  const getAspectRatioStyle = () => {
    const [w, h] = aspectRatio.split(':').map(Number);
    return { aspectRatio: `${w}/${h}` };
  };

  const handle1SectorClick = (row: number, col: number) => {
    if (!onSelectSector) return;
    const x = col * 0.25;      // 0, 0.25, 0.5, 0.75
    const y = row * 0.3333;    // 0, 0.33, 0.66
    const w = 0.25;
    const h = 0.3333;
    onSelectSector({ x, y, w, h });
  };

  // Reset view mode to 'fit' whenever the image changes to ensure full visibility (no cropping) by default
  React.useEffect(() => {
    if (imageUrl) {
      setViewMode('fit');
    }
  }, [imageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUpload) {
      onUpload(e.target.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-zinc-900/20 border border-zinc-800 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 size={32} className="text-white animate-spin duration-[3000ms]" strokeWidth={1} />
        </div>
        <p className="text-zinc-500 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">Processing</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div
        className="w-full h-full bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center text-zinc-700 cursor-pointer hover:bg-zinc-900/50 transition-colors group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Upload size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
        </div>
        <p className="text-xs font-normal uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
          Upload or Generate Image
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4 p-4">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-normal text-white uppercase tracking-widest flex items-center gap-2">
            Output
          </h3>
          <div className="flex items-center gap-2 pl-4 border-l border-zinc-800">
            {onUpscale && (
              <button onClick={onUpscale} className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-normal uppercase tracking-wider text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" title="Upscale">
                <Zap size={12} />
                UPSCALE
              </button>
            )}




            <button
              onClick={() => { setShowGrid(!showGrid); setShowViewControls(false); }}
              className={`flex items-center gap-2 px-2 py-1.5 text-[10px] font-normal uppercase tracking-wider rounded-md transition-colors ${showGrid ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
              title="Toggle Sector Grid"
            >
              <LayoutGrid size={12} />
              GRID
            </button>
          </div>
        </div>

        <div className="flex space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
            title="Replace Image"
          >
            <RefreshCw size={12} />
            Replace
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'fit' ? 'full' : 'fit')}
            className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
          >
            {viewMode === 'fit' ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            {viewMode === 'fit' ? 'EXPAND' : 'SHRINK'}
          </button>
          <a
            href={imageUrl || ''}
            download={`${fileName || `render-${Date.now()}`}.png`}
            onClick={() => onSave && onSave()}
            className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-wider text-white hover:text-zinc-300 transition-colors"
          >
            <Download size={12} />
            Save
          </a>
        </div>
      </div>

      <div className="relative flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #333 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* 
            Constrained Wrapper:
            We use flex-center and max boundaries to let the IMAGE define the Aspect Ratio.
            This ensures the grid (absolute inset-0) perfectly overlays the image without "black bars" or "margins".
        */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center shadow-2xl transition-all duration-300 ${viewMode === 'full' ? 'w-full h-full' : ''}`}
          // Always enforce aspect ratio in 'fit' mode. App.tsx sends exact image ratio for uploads, so this guarantees perfect fit.
          style={viewMode === 'fit' ? getAspectRatioStyle() : {}}
        >
          <img
            src={imageUrl || ''}
            alt="Generated Output"
            // Use w-auto h-auto with max constraints to allow "shrink-wrapping"
            // viewMode 'full' forces cover, 'fit' allows natural size
            className={`block ${viewMode === 'fit' ? 'w-auto h-auto max-w-full max-h-full object-contain' : 'w-full h-full object-cover'}`}
          />

          {/* Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 z-20 grid grid-cols-4 grid-rows-3 border-2 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              {['A', 'B', 'C'].map((rowLabel, rIdx) => (
                <React.Fragment key={rowLabel}>
                  {[1, 2, 3, 4].map((colLabel, cIdx) => (
                    <div
                      key={`${rowLabel}${colLabel}`}
                      onClick={() => handle1SectorClick(rIdx, cIdx)}
                      className="border border-white/10 relative group cursor-pointer hover:bg-white/5 transition-colors"
                      title={`Select Sector ${rowLabel}${colLabel}`}
                    >
                      <span className="absolute top-1 left-1 text-[8px] font-mono text-white/50 group-hover:text-white drop-shadow-md">{rowLabel}{colLabel}</span>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all">
                        <MousePointerClick size={24} className="text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}


        </div>
      </div>
    </div >
  );
};

export default ResultViewer;