'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useWorkspaceStore, getEmptyWorldState } from '@/store/useWorkspaceStore';

export default function HubPage() {
  const router = useRouter()
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Состояние для модалки создания
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setCampaigns(data)
      setIsLoading(false)
    }

    fetchCampaigns()
  }, [router, supabase])

  const createCampaign = async () => {
    if (!newCampaignName.trim()) return
    setCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Стартовый контент, чтобы убить страх белого листа
      const initialMapData = getEmptyWorldState();

      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ 
          name: newCampaignName, 
          user_id: user.id,
          map_data: initialMapData
        }])
        .select()
        .single()

      if (data) {
        setCampaigns(prev => [data, ...prev])
        setIsModalOpen(false)
        setNewCampaignName('')
        // Можно сразу редиректнуть в новую кампанию
        router.push(`/hub/${data.id}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const deleteCampaign = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      setDeletingId(null);
    }
  }

  if (isLoading) return <div className="h-screen bg-[#050505] flex items-center justify-center text-zinc-500 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Initializing Hub...</div>

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 p-8 md:p-12 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-16">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              MY WORLDS
            </h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              {campaigns.length} активных вселенных
            </p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))}
            className="px-4 py-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Выход
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* CREATE CARD */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="group h-64 rounded-2xl border-2 border-dashed border-zinc-900 bg-zinc-900/10 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl text-zinc-500 group-hover:scale-110 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition-all mb-4">
              +
            </div>
            <span className="font-black uppercase tracking-[0.2em] text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
              Создать новую историю
            </span>
          </div>

          {/* CAMPAIGN CARDS */}
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id}
              onClick={() => router.push(`/hub/${campaign.id}`)}
              className="group h-64 rounded-2xl border border-zinc-900 bg-zinc-900/40 p-8 flex flex-col justify-between cursor-pointer hover:border-indigo-500/40 hover:translate-y-[-4px] transition-all relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-6">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{campaign.name}</h2>
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-600 uppercase">Локации</span>
                        <span className="text-xs font-mono text-zinc-400">{campaign.map_data?.nodes?.length || 0}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-600 uppercase">День</span>
                        <span className="text-xs font-mono text-zinc-400">{campaign.map_data?.currentDay || 1}</span>
                    </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-6 border-t border-zinc-800/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Войти в сознание →
                </span>
                
                {/* Инлайн-подтверждение удаления */}
                {deletingId === campaign.id ? (
                  <button
                    onClick={(e) => deleteCampaign(e, campaign.id)}
                    onMouseLeave={() => setDeletingId(null)}
                    className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] z-10"
                  >
                    Сжечь мир?
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingId(campaign.id); }}
                    className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 z-10"
                    title="Удалить кампанию"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CREATE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Создание новой вселенной</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Название кампании</label>
                <input 
                  autoFocus
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Напр: Тени Фандалина"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button 
                  onClick={createCampaign}
                  disabled={creating || !newCampaignName}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                >
                  {creating ? 'Создание...' : 'Сотворить Мир'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}