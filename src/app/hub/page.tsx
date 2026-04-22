'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function HubPage() {
  const router = useRouter()
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Получаем кампании, сортируем новые сверху
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
    const name = window.prompt('Название новой кампании:')
    if (!name || name.trim() === '') return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{ name, user_id: user.id }])
      .select()
      .single()

    if (data) setCampaigns([data, ...campaigns])
  }

  const deleteCampaign = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation() // Останавливаем клик, чтобы не открыть кампанию
    
    // Защита от случайного удаления
    if (window.confirm(`Вы уверены, что хотите навсегда удалить кампанию "${name}"? Все локации и квесты будут стерты.`)) {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      
      if (!error) {
        setCampaigns(campaigns.filter(c => c.id !== id))
      } else {
        alert('Ошибка при удалении: ' + error.message)
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (isLoading) return <div className="h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Загрузка Хаба...</div>

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Шапка Хаба */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">GM's Second Brain</h1>
            <p className="text-zinc-500 text-sm mt-1">Управление кампаниями</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-zinc-500 hover:text-red-400 text-sm font-semibold transition-colors"
          >
            Выйти
          </button>
        </div>

        {/* Сетка кампаний */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Кнопка создания новой */}
          <div 
            onClick={createCampaign}
            className="h-48 rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer bg-zinc-900/20 hover:bg-indigo-950/10"
          >
            <span className="text-3xl mb-2">+</span>
            <span className="font-bold uppercase tracking-widest text-xs">Новая кампания</span>
          </div>

          {/* Список существующих */}
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id}
              onClick={() => router.push(`/hub/${campaign.id}`)}
              className="h-48 rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between cursor-pointer hover:border-zinc-600 transition-all group relative overflow-hidden"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{campaign.name}</h2>
                <p className="text-xs text-zinc-500 font-mono">ID: {campaign.id.substring(0,8)}</p>
              </div>
              
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                Открыть рабочую область →
              </div>

              {/* Кнопка удаления (появляется при наведении) */}
              <button
                onClick={(e) => deleteCampaign(e, campaign.id, campaign.name)}
                className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                title="Удалить кампанию"
              >
                ✕
              </button>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}