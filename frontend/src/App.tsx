import { useState, useEffect } from 'react';
import { AppleHeader } from './components/AppleHeader';
import { FileUploader } from './components/FileUploader';
import { PdfViewer } from './components/PdfViewer';
import { SplitterSidebar } from './components/SplitterSidebar';
import { SuccessModal } from './components/SuccessModal';
import type { FolderCategory, UploadResponse, SplitRule, SplitResultItem } from './types';
import { fetchFolders, uploadPdfFile, executeSplit, triggerZipDownload } from './api/client';
import { parseClientPageRange, formatPageRangeString } from './utils/pageParser';

export function App() {
  const [folders, setFolders] = useState<FolderCategory[]>([]);
  const [document, setDocument] = useState<UploadResponse | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rules, setRules] = useState<SplitRule[]>([]);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [splitResults, setSplitResults] = useState<SplitResultItem[]>([]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Load 20 categories on startup
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await fetchFolders();
      setFolders(data);
    } catch (err: any) {
      console.error('Error fetching folders:', err);
    }
  };

  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Upload handler
  const handleFileUpload = async (file: File) => {
    setIsLoadingDoc(true);
    try {
      const doc = await uploadPdfFile(file);
      setDocument(doc);
      setCurrentPage(1);

      // Create an initial rule for convenience
      const defaultFolder = folders.length > 0 ? folders[0].name : '';
      const initialRuleId = crypto.randomUUID();
      const initialRule: SplitRule = {
        id: initialRuleId,
        folder: defaultFolder,
        pages: '1',
        parsedPages: [1],
      };
      setRules([initialRule]);
      setActiveRuleId(initialRuleId);
    } catch (err: any) {
      showNotification(err.message || 'PDF yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  // Reset handler
  const handleReset = () => {
    setDocument(null);
    setRules([]);
    setActiveRuleId(null);
    setCurrentPage(1);
    setSplitResults([]);
  };

  // Add a new section rule
  const handleAddRule = () => {
    if (!document) return;
    const newId = crypto.randomUUID();
    // Default to next unused folder or first folder
    const usedFolders = new Set(rules.map((r) => r.folder));
    const nextFolder = folders.find((f) => !usedFolders.has(f.name))?.name || (folders[0]?.name ?? '');

    const newRule: SplitRule = {
      id: newId,
      folder: nextFolder,
      pages: `${currentPage}`,
      parsedPages: [currentPage],
    };
    setRules((prev) => [...prev, newRule]);
    setActiveRuleId(newId);
  };

  // Remove section rule
  const handleRemoveRule = (id: string) => {
    setRules((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      if (activeRuleId === id) {
        setActiveRuleId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  // Update folder selection on a rule
  const handleUpdateRuleFolder = (id: string, folder: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, folder } : r))
    );
  };

  // Update page numbers text on a rule
  const handleUpdateRulePages = (id: string, pagesText: string) => {
    if (!document) return;
    const { pages, error } = parseClientPageRange(pagesText, document.total_pages);
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              pages: pagesText,
              parsedPages: pages,
              error: pagesText.trim() ? error : undefined,
            }
          : r
      )
    );
  };

  // Append current page to a specific rule
  const handleAppendPageToRule = (ruleId: string, pageNum: number) => {
    if (!document) return;
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const currentPages = new Set(r.parsedPages);
        currentPages.add(pageNum);
        const sortedPages = Array.from(currentPages).sort((a, b) => a - b);
        const newPagesStr = formatPageRangeString(sortedPages);
        return {
          ...r,
          pages: newPagesStr,
          parsedPages: sortedPages,
          error: undefined,
        };
      })
    );
  };

  // Add current page from toolbar into active rule (or create rule if none)
  const handleAddCurrentPageFromViewer = (pageNum: number) => {
    if (!document) return;
    if (rules.length === 0) {
      handleAddRule();
      return;
    }
    const targetId = activeRuleId || rules[0].id;
    handleAppendPageToRule(targetId, pageNum);
  };

  // Execute Batch Split
  const handleSplitAll = async () => {
    if (!document || rules.length === 0) return;

    // Check for any client-side validation errors
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      if (!r.folder) {
        showNotification(`${i + 1}-qatorda papka tanlanmagan.`);
        return;
      }
      if (r.parsedPages.length === 0) {
        showNotification(`${i + 1}-qatorda to'g'ri sahifalar kiritilmagan.`);
        return;
      }
    }

    setIsSplitting(true);
    try {
      const mappings = rules.map((r) => ({
        folder: r.folder,
        pages: r.pages,
      }));

      const res = await executeSplit(document.document_id, mappings);
      setSplitResults(res.results);
      setIsSuccessModalOpen(true);
      // Reload folders to update file counts
      loadFolders();
    } catch (err: any) {
      showNotification(err.message || 'Ajratishda xatolik yuz berdi.', 'error');
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#f5f5f7] overflow-hidden select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-lg border text-xs font-medium ${
              notification.type === 'error'
                ? 'bg-red-50/95 text-red-700 border-red-200/80 backdrop-blur-md'
                : 'bg-emerald-50/95 text-emerald-700 border-emerald-200/80 backdrop-blur-md'
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}

      {/* Top Header */}
      <AppleHeader
        document={document}
        onReset={handleReset}
        folderCount={folders.length}
        totalFileCount={folders.reduce((acc, f) => acc + (f.file_count || 0), 0)}
        onDownloadZip={triggerZipDownload}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {!document ? (
          <FileUploader
            onFileUpload={handleFileUpload}
            isLoading={isLoadingDoc}
            folders={folders}
          />
        ) : (
          <>
            {/* Left: Interactive PDF preview */}
            <PdfViewer
              documentId={document.document_id}
              totalPages={document.total_pages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onAddCurrentPage={handleAddCurrentPageFromViewer}
            />

            {/* Right: Splitter sidebar with 20 options & pages */}
            <SplitterSidebar
              folders={folders}
              rules={rules}
              activeRuleId={activeRuleId}
              onSelectActiveRule={setActiveRuleId}
              onAddRule={handleAddRule}
              onRemoveRule={handleRemoveRule}
              onUpdateRuleFolder={handleUpdateRuleFolder}
              onUpdateRulePages={handleUpdateRulePages}
              onAppendCurrentPageToRule={(id) => handleAppendPageToRule(id, currentPage)}
              currentPage={currentPage}
              onSplitAll={handleSplitAll}
              isSplitting={isSplitting}
              totalPages={document.total_pages}
            />
          </>
        )}
      </main>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        results={splitResults}
        onUploadNew={() => {
          setIsSuccessModalOpen(false);
          handleReset();
        }}
      />
    </div>
  );
}

export default App;
