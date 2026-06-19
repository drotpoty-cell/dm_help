import { LibraryCategory } from '@/types/workspace'
import { ArchiveTooltip } from './ArchiveTooltip'
import EntityCard from './EntityCard'

interface ArchiveSidebarProps {
  tabs: { id: string; label: string }[]
  activeTab: LibraryCategory | 'interactive'
  handleTabChange: (tab: LibraryCategory | 'interactive') => void
  library: any
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleExport: () => void
  handleDownloadTemplate: () => void
  onOpenDataSync: () => void
}

export const ArchiveSidebar = ({
  tabs,
  activeTab,
  handleTabChange,
  library,
  fileInputRef,
  handleExport,
  handleDownloadTemplate,
  onOpenDataSync
}: ArchiveSidebarProps) => {
  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col gap-2 overflow-y-auto shrink-0 relative shadow-[5px_0_15px_rgba(0,0,0,0.3)] z-20">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 pl-4">
        Категории
      </div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id as LibraryCategory | 'interactive')}
          className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === tab.id
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent'
          }`}
        >
          {tab.label}{' '}
          <span className="float-right text-zinc-600">
            {tab.id === 'interactive' 
              ? Object.values(library.extras || {}).filter((item: any) => item.tokenType === 'poi' || item.tokenType === 'check').length
              : Object.keys(library[tab.id as LibraryCategory] || {}).length
            }
          </span>
        </button>
      ))}

      <div className="mt-auto pt-6 border-t border-zinc-900 flex flex-col gap-3">
        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1 text-center">
          База Данных
        </div>

        <button
          onClick={onOpenDataSync}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 text-[10px] font-bold uppercase tracking-widest rounded border border-indigo-800 transition-colors"
        >
          Управление данными / ИИ
        </button>
      </div>
    </div>
  )
}
