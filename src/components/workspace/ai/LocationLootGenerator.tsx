'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { generateAiText } from '@/utils/aiClient'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { type Loot } from '@/types/workspace'
import { Sparkles, Loader2 } from 'lucide-react'

interface LocationLootGeneratorProps {
  locationId: string
  locationName: string
  locationDescription: string
  locationType: string
}

export default function LocationLootGenerator({ 
  locationId, 
  locationName, 
  locationDescription, 
  locationType 
}: LocationLootGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Omit<Loot, 'id' | 'ownerId'>[]>([])
  
  const addEntity = useWorkspaceStore((state) => state.addEntity)

  const handleGenerate = async () => {
    setLoading(true)
    setResults([]) // Очищаем предыдущие результаты
    
    try {
      const atmosphere = locationType === 'hostile' ? 'Враждебная и опасная' 
                       : locationType === 'tense' ? 'Напряженная и пугающая' 
                       : 'Спокойная и безопасная';

      const prompt = `Игроки тщательно обыскивают локацию: "${locationName}".
Описание места: "${locationDescription || 'Неизвестно'}".
Атмосфера: ${atmosphere}.

Сгенерируй 3 уникальных предмета лута, которые логично найти именно в этом месте.
1 обычный (common), 1 редкий (rare), 1 эпический/сюжетный (epic).
Верни СТРОГО валидный JSON-массив из 3 объектов без какого-либо текста до или после.
Формат объекта:
{ "name": string, "description": string, "rarity": "common" | "rare" | "epic", "price": number, "weight": number, "stats": string }`

      const response = await generateAiText(prompt)
      
      // Очистка от маркдауна и парсинг
      const cleaned = response.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      
      if (Array.isArray(parsed)) {
        setResults(parsed)
      } else {
        throw new Error('ИИ вернул не массив')
      }
      
    } catch (error) {
      console.error('Ошибка парсинга лута:', error)
      toast.error('Не удалось сгенерировать лут. ИИ вернул неверный формат.')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = (item: Omit<Loot, 'id' | 'ownerId'>, index: number) => {
    const newItem: Loot = {
      ...item,
      id: `loot-${Date.now()}-${index}`,
      ownerId: locationId // Привязываем лут к текущей локации
    }
    addEntity('loot', newItem)
    toast.success(`"${item.name}" спрятан в локации!`)
    
    // Убираем предмет из предложенных
    setResults(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-xl p-4 mb-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Умный поиск лута
          </h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">
            Сгенерировать предметы под лор локации
          </p>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Думает...</> : 'Искать'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-indigo-900/30">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center mb-1">
            Выберите, что оставить в локации:
          </p>
          {results.map((item, idx) => (
            <div key={idx} className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-700/50 flex flex-col gap-2 relative group overflow-hidden">
              <div className={`absolute left-0 top-0 w-1 h-full ${item.rarity === 'epic' ? 'bg-purple-500' : item.rarity === 'rare' ? 'bg-blue-500' : 'bg-zinc-500'}`}></div>
              
              <div className="pl-2 flex justify-between items-start gap-4">
                <div>
                  <div className={`font-bold text-sm ${item.rarity === 'epic' ? 'text-purple-400' : item.rarity === 'rare' ? 'text-blue-400' : 'text-zinc-300'}`}>
                    {item.name}
                  </div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 flex gap-2">
                    <span>{item.rarity}</span>
                    {item.price > 0 && <span className="text-amber-500/70">{item.price} gp</span>}
                    {item.stats && <span className="text-indigo-400/70">{item.stats}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => handleClaim(item, idx)}
                  className="bg-emerald-600/20 hover:bg-emerald-500/40 text-emerald-500 border border-emerald-500/30 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-colors shrink-0"
                >
                  Спрятать здесь
                </button>
              </div>
              <div className="pl-2 text-xs text-zinc-400 leading-relaxed italic">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}