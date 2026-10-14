import React from 'react';
import {
  Folder,
  Plus,
  Trash2,
  AlertCircle,
  Scissors,
  Layers,
} from 'lucide-react';
import type { FolderCategory, SplitRule } from '../types';

interface SplitterSidebarProps {
  folders: FolderCategory[];
  rules: SplitRule[];
  activeRuleId: string | null;
  onSelectActiveRule: (id: string) => void;
  onAddRule: () => void;
  onRemoveRule: (id: string) => void;
  onUpdateRuleFolder: (id: string, folder: string) => void;
  onUpdateRulePages: (id: string, pages: string) => void;
  onAppendCurrentPageToRule: (id: string) => void;
  currentPage: number;
  onSplitAll: () => void;
  isSplitting: boolean;
  totalPages: number;
}

export const SplitterSidebar: React.FC<SplitterSidebarProps> = ({
  folders,
  rules,
  activeRuleId,
  onSelectActiveRule,
  onAddRule,
  onRemoveRule,
  onUpdateRuleFolder,
  onUpdateRulePages,
  onAppendCurrentPageToRule,
  currentPage,
  onSplitAll,
  isSplitting,
  totalPages,
}) => {
  const hasErrors = rules.some((r) => r.error || !r.folder || r.parsedPages.length === 0);
  const totalAssignedPages = new Set(rules.flatMap((r) => r.parsedPages)).size;

  return (
    <aside className="w-96 h-full flex flex-col apple-glass border-l border-black/5 shadow-xl select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-black/5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Sahifalarni taqsimlash</span>
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {rules.length} ta bo‘lim • {totalAssignedPages} / {totalPages} sahifa tanlandi
          </p>
        </div>

        <button
          onClick={onAddRule}
          className="apple-press inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Bo‘lim qo‘shish</span>
        </button>
      </div>

      {/* Rules Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {rules.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <Folder className="w-10 h-10 stroke-[1.2] mb-2 opacity-50" />
            <p className="text-xs font-medium">Hozircha bo‘limlar yo‘q</p>
            <p className="text-[11px] text-zinc-400 mt-1">
              "Bo‘lim qo‘shish" tugmasini bosing va sahifalarni tanlang.
            </p>
          </div>
        ) : (
          rules.map((rule, index) => {
            const isActive = rule.id === activeRuleId;

            return (
              <div
                key={rule.id}
                onClick={() => onSelectActiveRule(rule.id)}
                className={`p-3.5 rounded-2xl transition-all duration-150 border ${
                  isActive
                    ? 'bg-white ring-2 ring-blue-500/80 border-transparent shadow-md'
                    : 'bg-white/60 hover:bg-white/90 border-black/5 shadow-xs'
                }`}
              >
                {/* Header row: Index badge + Active indicator + Delete */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-800">
                      Bo‘lim #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isActive && (
                      <span className="text-[10px] font-medium text-blue-600 px-2 py-0.5 rounded-full bg-blue-50">
                        Faol qator
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRule(rule.id);
                      }}
                      className="apple-press p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Ushbu bo‘limni o‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dropdown 20 Options */}
                <div className="mb-2">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Tegishli papka (20 tadan biri)
                  </label>
                  <select
                    value={rule.folder}
                    onChange={(e) => onUpdateRuleFolder(rule.id, e.target.value)}
                    className="w-full text-xs font-medium bg-zinc-50/80 hover:bg-zinc-100/80 focus:bg-white border border-zinc-200 rounded-xl px-2.5 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                  >
                    <option value="" disabled>
                      Papkani tanlang...
                    </option>
                    {folders.map((f, i) => (
                      <option key={i} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Page input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-zinc-500">
                      Sahifalar (masalan: 1-3, 5, 8)
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppendCurrentPageToRule(rule.id);
                      }}
                      className="apple-press text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      + p.{currentPage} ni kiritish
                    </button>
                  </div>

                  <input
                    type="text"
                    value={rule.pages}
                    onChange={(e) => onUpdateRulePages(rule.id, e.target.value)}
                    placeholder="Masalan: 1-3, 5, 8-10"
                    className={`w-full text-xs bg-zinc-50/80 focus:bg-white border rounded-xl px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors ${
                      rule.error
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-zinc-200'
                    }`}
                  />

                  {/* Validation error or parsed page tags */}
                  {rule.error ? (
                    <div className="flex items-center gap-1 text-[11px] text-red-600 mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{rule.error}</span>
                    </div>
                  ) : rule.parsedPages.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[10px] font-medium text-zinc-400">
                        Tanlangan:
                      </span>
                      {rule.parsedPages.slice(0, 10).map((p) => (
                        <span
                          key={p}
                          className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/50"
                        >
                          {p}
                        </span>
                      ))}
                      {rule.parsedPages.length > 10 && (
                        <span className="text-[10px] text-zinc-400">
                          +{rule.parsedPages.length - 10} ta
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer with Split & Save All Button */}
      <div className="p-4 border-t border-black/5 apple-glass space-y-2">
        <button
          onClick={onSplitAll}
          disabled={rules.length === 0 || hasErrors || isSplitting}
          className={`apple-press w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition-all ${
            rules.length === 0 || hasErrors || isSplitting
              ? 'bg-zinc-400/80 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
          }`}
        >
          {isSplitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sahifalar ajratilmoqda...</span>
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4 stroke-[2.2]" />
              <span>Barchasini ajratish va saqlash</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-zinc-400">
          Tanlangan sahifalar avtomatik ravishda <code className="bg-black/5 px-1 rounded">shartnomalar/</code> papkasiga saqlanadi.
        </p>
      </div>
    </aside>
  );
};
