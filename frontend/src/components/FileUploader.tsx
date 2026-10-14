import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp, Folder } from 'lucide-react';
import type { FolderCategory } from '../types';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  folders: FolderCategory[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  isLoading,
  folders,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onFileUpload(file);
      } else {
        alert('Iltimos, faqat PDF formatidagi faylni yuklang.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-2xl flex flex-col items-center text-center my-auto">
        {/* Title */}
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">
          Shartnoma va hujjatlarni ajratish
        </h1>
        <p className="text-zinc-500 text-sm max-w-lg mb-8">
          Ko‘p sahifali PDF shartnomani yuklang. Hujjatni qulay ko‘rib chiqqan holda sahifalarni tanlang va ularni 20 ta tegishli papkalarga avtomatik joylashtiring.
        </p>

        {/* Dropzone Card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center apple-glass-card group ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
              : 'border-zinc-300/80 hover:border-zinc-400'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 shadow-sm">
            {isLoading ? (
              <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 stroke-[1.8]" />
            )}
          </div>

          <h3 className="text-base font-semibold text-zinc-800 mb-1">
            {isLoading ? 'PDF tahlil qilinmoqda...' : 'PDF faylni bu yerga tashlang yoki tanlang'}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Maksimal hajm: 100 MB • Faqat .pdf formati
          </p>

          <button
            type="button"
            disabled={isLoading}
            className="apple-press inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <FileUp className="w-4 h-4" />
            <span>Faylni kompyuterdan tanlash</span>
          </button>
        </div>

        {/* Categories preview */}
        {folders.length > 0 && (
          <div className="w-full mt-10 text-left">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Mavjud 20 ta bo‘lim papkalari
              </span>
              <span className="text-xs text-zinc-400">
                shartnomalar/ katalogida
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 pr-2">
              {folders.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/70 border border-black/[0.04] text-xs text-zinc-700 shadow-xs"
                >
                  <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate font-medium">{f.name}</span>
                  {f.file_count > 0 && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 shrink-0">
                      {f.file_count} fayl
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
