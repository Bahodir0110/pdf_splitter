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
  Plus,
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

interface PdfPageItemProps {
  pageNum: number;
  pdfDoc: any;
  zoom: number;
  isCurrent: boolean;
  onVisible: (num: number) => void;
  onAddPage: (num: number) => void;
}

const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pageNum,
  pdfDoc,
  zoom,
  isCurrent,
  onVisible,
  onAddPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Measure initial viewport dimensions for placeholder
  useEffect(() => {
    let active = true;
    if (pdfDoc) {
      pdfDoc.getPage(pageNum).then((page: any) => {
        if (!active) return;
        const vp = page.getViewport({ scale: zoom });
        setDimensions({ width: vp.width, height: vp.height });
      });
    }
    return () => {
      active = false;
    };
  }, [pdfDoc, zoom, pageNum]);

  const renderCanvas = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: zoom * pixelRatio });

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.height = `${viewport.height / pixelRatio}px`;
      canvas.style.width = `${viewport.width / pixelRatio}px`;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
      setIsRendered(true);
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error(`Page ${pageNum} render error`, err);
      }
    }
  }, [pdfDoc, zoom, pageNum]);

  // Observer for rendering and visibility tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Visibility observer to track active page as user scrolls
    const visObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            onVisible(pageNum);
          }
        });
      },
      { threshold: [0.4, 0.7] }
    );
    visObserver.observe(el);

    // Render observer (render when within 800px of viewport)
    const renderObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            renderCanvas();
          }
        });
      },
      { rootMargin: '800px 0px' }
    );
    renderObserver.observe(el);

    return () => {
      visObserver.disconnect();
      renderObserver.disconnect();
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, zoom, pageNum, onVisible, renderCanvas]);

  // Re-render when zoom changes
  useEffect(() => {
    renderCanvas();
  }, [zoom, renderCanvas]);

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNum}`}
      className={`relative group mb-8 mx-auto transition-all duration-150 rounded-xl overflow-hidden shadow-xl border ${
        isCurrent ? 'ring-2 ring-blue-500/80 border-blue-400' : 'border-black/10'
      } bg-white`}
      style={{
        minHeight: dimensions ? `${dimensions.height}px` : '600px',
        width: dimensions ? `${dimensions.width}px` : 'auto',
      }}
    >
      {/* Floating page tag & quick add button on hover */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white shadow-xs">
          {pageNum}
        </span>
        <button
          onClick={() => onAddPage(pageNum)}
          className="apple-press hidden group-hover:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
          title={`Sahifa ${pageNum} ni tanlangan bo'limga qo'shish`}
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
          <span>Qo‘shish</span>
        </button>
      </div>

      {!isRendered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin mb-1 text-blue-500" />
          <span className="text-[11px] font-medium">Sahifa {pageNum}...</span>
        </div>
      )}

      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
  documentId,
  totalPages,
  currentPage,
  onPageChange,
  onAddCurrentPage,
}) => {
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

  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onPageChange(pageNum);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scrollToPage(currentPage + 1);
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

        {/* Quick Add Current Visible Page */}
        <button
          onClick={() => onAddCurrentPage(currentPage)}
          className="apple-press flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs text-xs"
          title={`Sahifa ${currentPage} ni tanlangan bo'limga qo'shish`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Sahifa {currentPage}</span>
        </button>
      </div>

      {/* Main Content Area: Left Thumbnails + Scrollable Canvas Feed */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page Thumbnails Strip */}
        <div className="w-20 shrink-0 border-r border-black/5 apple-glass flex flex-col py-4 px-2 overflow-y-auto gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => scrollToPage(p)}
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

        {/* Continuous Scroll Viewport */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-auto p-8 pt-20 flex flex-col items-center scroll-smooth"
        >
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-zinc-500 my-auto">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Hujjat yuklanmoqda...</span>
            </div>
          )}

          {renderError && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200 my-auto">
              {renderError}
            </div>
          )}

          {!isLoading && pdfDoc && (
            <div className="w-full flex flex-col items-center pb-16">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PdfPageItem
                  key={p}
                  pageNum={p}
                  pdfDoc={pdfDoc}
                  zoom={zoom}
                  isCurrent={p === currentPage}
                  onVisible={onPageChange}
                  onAddPage={onAddCurrentPage}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
