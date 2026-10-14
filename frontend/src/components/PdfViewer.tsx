import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  PlusCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { getPdfStreamUrl } from '../api/client';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerProps {
  documentId: string;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onAddCurrentPage: (page: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  documentId,
  totalPages,
  currentPage,
  onPageChange,
  onAddCurrentPage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [zoom, setZoom] = useState<number>(1.1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Load document
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setRenderError(null);

    const pdfUrl = getPdfStreamUrl(documentId);
    const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });

    loadingTask.promise
      .then((doc) => {
        if (!isCancelled) {
          setPdfDoc(doc);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load PDF doc', err);
          setRenderError('PDF hujjatini yuklashda xatolik yuz berdi.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      loadingTask.destroy();
    };
  }, [documentId]);

  // Render current page to canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Render at high resolution for crisp text (Apple retina feel)
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: zoom * pixelRatio });

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.height = `${viewport.height / pixelRatio}px`;
        canvas.style.width = `${viewport.width / pixelRatio}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Page render error', err);
        }
      }
    },
    [pdfDoc, zoom]
  );

  useEffect(() => {
    renderPage(currentPage);
  }, [renderPage, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setZoom(1.1);
  };

  return (
    <div className="relative flex-1 h-full flex flex-col bg-[#e5e5ea] overflow-hidden select-none">
      {/* Floating Apple-Style Control Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full apple-glass border border-white/60 shadow-lg shadow-black/5 text-xs text-zinc-800">
        {/* Pagination Controls */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="apple-press p-1.5 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none text-zinc-700"
          title="Oldingi sahifa"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 px-1 font-medium">
          <span className="font-semibold text-zinc-900">{currentPage}</span>
          <span className="text-zinc-400">/</span>
          <span className="text-zinc-600">{totalPages}</span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="apple-press p-1.5 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none text-zinc-700"
          title="Keyingi sahifa"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-300/80 mx-1" />

        {/* Zoom Controls */}
        <button
          onClick={handleZoomOut}
          className="apple-press p-1.5 rounded-full hover:bg-black/5 text-zinc-700"
          title="Kichiklashtirish"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetZoom}
          className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-zinc-600 hover:bg-black/5"
          title="Asl o‘lcham"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={handleZoomIn}
          className="apple-press p-1.5 rounded-full hover:bg-black/5 text-zinc-700"
          title="Kattalashtirish"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-300/80 mx-1" />

        {/* Quick Add Page to Section Button */}
        <button
          onClick={() => onAddCurrentPage(currentPage)}
          className="apple-press flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs text-xs"
          title={`Sahifa ${currentPage} ni tanlangan bo'limga qo'shish`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Sahifa {currentPage}</span>
        </button>
      </div>

      {/* Main Content Area: Thumbnails + Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page Thumbnails Strip */}
        <div className="w-20 shrink-0 border-r border-black/5 apple-glass flex flex-col py-4 px-2 overflow-y-auto gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`apple-press flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all ${
                p === currentPage
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'hover:bg-black/5 text-zinc-600'
              }`}
            >
              <FileText className="w-4 h-4 mb-0.5" />
              <span>{p}</span>
            </button>
          ))}
        </div>

        {/* Canvas Display Viewport */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex items-center justify-center p-8 pt-20"
        >
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Hujjat yuklanmoqda...</span>
            </div>
          )}

          {renderError && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
              {renderError}
            </div>
          )}

          <div
            className={`transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-2xl border border-black/10 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
