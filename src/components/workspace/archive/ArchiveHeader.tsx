import { LibraryCategory } from '@/types/workspace'

interface ArchiveHeaderProps {
  activeTab: LibraryCategory
  setActiveTab: (tab: LibraryCategory) => void
  query: string
  setQuery: (query: string) => void
  handleAdd: () => void
  handleExport: () => void
  handleImport: () => void
  handleDownloadTemplate: () => void
  isLootTab: boolean
  setIsLootModalOpen: (open: boolean) => void
  tabs: { id: string; label: string }[]
}

export const ArchiveHeader = ({
  activeTab,
  setActiveTab,
  query,
  setQuery,
  handleAdd,
  handleExport,
  handleImport,
  handleDownloadTemplate,
  isLootTab,
  setIsLootModalOpen,
  tabs
}: ArchiveHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
      <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
        {tabs.find((t) => t.id === activeTab)?.label}
      </h2>
      <div className="flex items-center gap-3">
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск..."
            className="w-64 bg-zinc-950/60 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-300 outline-none focus:border-indigo-500/50 placeholder:text-zinc-600"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
        >
          + Создать
        </button>
        {isLootTab && (
          <button
            onClick={() => setIsLootModalOpen(true)}
            className="bg-emerald-700 text-white px-4 py-2 rounded font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20"
          >
            🎲 Умный генератор лута
          </button>
        )}
      </div>
    </div>
  )
}
