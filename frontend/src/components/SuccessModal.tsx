import React from 'react';
import { CheckCircle2, Folder, FileText, X, ArrowRight, RefreshCw } from 'lucide-react';
import type { SplitResultItem } from '../types';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: SplitResultItem[];
  onUploadNew: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  results,
  onUploadNew,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl apple-glass-card shadow-2xl overflow-hidden border border-white/60 p-6 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                Muvaffaqiyatli saqlandi!
              </h3>
              <p className="text-xs text-zinc-500">
                {results.length} ta yangi PDF fayli tegishli papkalarga nusxalandi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="apple-press p-1.5 rounded-full hover:bg-black/5 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white/80 border border-black/5 shadow-xs flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-zinc-800 truncate">
                  {item.folder}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-500 pl-6 text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <FileText className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="font-mono text-zinc-700 truncate">
                    {item.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                    {item.page_count} bet
                  </span>
                  <span>{formatBytes(item.file_size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-black/5 flex items-center justify-end gap-2">
          <button
            onClick={onUploadNew}
            className="apple-press flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-black/5 hover:bg-black/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yangi fayl yuklash</span>
          </button>

          <button
            onClick={onClose}
            className="apple-press flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            <span>Tushunarli, davom etish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
