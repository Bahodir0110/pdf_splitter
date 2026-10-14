import React from 'react';
import { FileText, FolderArchive, RefreshCw, Download } from 'lucide-react';
import type { UploadResponse } from '../types';

interface AppleHeaderProps {
  document: UploadResponse | null;
  onReset: () => void;
  folderCount: number;
  totalFileCount: number;
  onDownloadZip: () => void;
}

export const AppleHeader: React.FC<AppleHeaderProps> = ({
  document,
  onReset,
  folderCount,
  totalFileCount,
  onDownloadZip,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full h-14 apple-glass border-b border-black/5 flex items-center justify-between px-6 select-none">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
          <FileText className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900 text-[15px] tracking-tight">
            Shartnoma Splitter
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-600 font-medium tracking-tight">
            {folderCount} ta papka
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Apple-Style Download ZIP Button */}
        <button
          onClick={onDownloadZip}
          className="apple-press flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-950 bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.06] rounded-full transition-all shadow-2xs"
          title="Barcha papkalarni ZIP arxiv ko‘rinishida yuklab olish"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 stroke-[2.2]" />
          <span>ZIP yuklab olish</span>
          {totalFileCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold text-[10px]">
              {totalFileCount}
            </span>
          )}
        </button>

        {document ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.04]">
              <span className="text-xs font-medium text-zinc-700 max-w-[200px] truncate">
                {document.filename}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
              <span className="text-xs font-semibold text-blue-600">
                {document.total_pages} sahifa
              </span>
            </div>

            <button
              onClick={onReset}
              className="apple-press flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-black/[0.03] hover:bg-black/[0.06] rounded-full transition-colors"
              title="Boshqa PDF yuklash"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Yangi hujjat</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <FolderArchive className="w-4 h-4 text-zinc-400" />
            <span>shartnomalar/ ({folderCount} ta toifa)</span>
          </div>
        )}
      </div>
    </header>
  );
};
