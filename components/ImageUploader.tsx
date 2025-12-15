import React, { useRef, useState } from 'react';
import { X, Plus, UploadCloud } from 'lucide-react';
import { ImageFile } from '../types';
import { fileToCtx } from '../services/geminiService';

interface ImageUploaderProps {
  label: string;
  subLabel: string;
  image: ImageFile | null;
  onImageChange: (img: ImageFile | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, subLabel, image, onImageChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (file.type.startsWith('image/')) {
      try {
        const imgCtx = await fileToCtx(file);
        onImageChange(imgCtx);
      } catch (err) {
        console.error("Error processing image", err);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const triggerUpload = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{subLabel}</span>
      </div>

      <div
        onClick={triggerUpload}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
            relative group cursor-pointer 
            border transition-all duration-300 ease-in-out
            h-40 flex flex-col items-center justify-center text-center overflow-hidden
            ${isDragging
            ? 'border-white bg-zinc-900 scale-[1.02]'
            : image
              ? 'border-white bg-black'
              : 'border-zinc-800 hover:border-zinc-500 bg-zinc-900/20 hover:bg-zinc-900/40'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {image ? (
          <>
            <img
              src={image.previewUrl}
              alt="Reference"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity grayscale hover:grayscale-0 duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleRemove}
                className="bg-white text-black p-2 rounded-full hover:scale-110 transition-transform shadow-xl"
              >
                <X size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-600 group-hover:text-zinc-300 transition-colors pointer-events-none">
            {isDragging ? (
              <>
                <UploadCloud size={32} className="text-white animate-bounce" />
                <span className="text-[10px] text-white uppercase tracking-widest">Drop to Upload</span>
              </>
            ) : (
              <>
                <Plus size={24} strokeWidth={1} />
                <span className="text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Upload or Drop
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;