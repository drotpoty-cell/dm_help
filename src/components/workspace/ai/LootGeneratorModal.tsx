'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { generateAiText } from '@/utils/aiClient'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { type Loot } from '@/types/workspace'

interface LootGeneratorModalProps {
  onClose: () => void
}

const LootGeneratorModal = ({ onClose }: LootGeneratorModalProps) => {
  const [location, setLocation] = useState('')
  const [level, setLevel] = useState(1)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Omit<Loot, 'id' | 'ownerId'>[]>([])
  
  const addEntity = useWorkspaceStore((state) => state.addEntity)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const prompt = `Сгенерируй 3 предмета лута для группы ${level} уровня, найденные в ${location}. Выведи строго валидный JSON-массив из 3 объектов. Формат объекта: { "name": string, "description": string, "rarity": "common" | "rare" | "epic", "price": number, "weight": number, "stats": string }`
      const response = await generateAiText(prompt)
      
      // Clean up response if it's wrapped in markdown
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      
      setResults(parsed)
    } catch (error) {
      console.error(error)
      toast.error('Ошибка при генерации лута')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = (item: Omit<Loot, 'id' | 'ownerId'>) => {
    const newItem: Loot = {
      ...item,
      id: crypto.randomUUID(),
      ownerId: null
    }
    addEntity('loot', newItem)
    toast.success(`Предмет ${item.name} добавлен в библиотеку!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-white">🎲 Умный генератор лута</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Где ищем или с кого упало?</label>
            <input 
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
              placeholder="Сундук гоблина..."
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Уровень группы: {level}</label>
            <input 
              type="range"
              min="1" max="20"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading || !location}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded font-medium"
          >
            {loading ? 'Генерация...' : 'Сгенерировать 3 варианта'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="grid gap-3">
            {results.map((item, idx) => (
              <div key={idx} className="bg-zinc-800 p-3 rounded border border-zinc-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-xs text-zinc-400">{item.rarity.toUpperCase()} • {item.price} gp • {item.weight} lb</div>
                  <div className="text-sm text-zinc-300 mt-1">{item.description}</div>
                </div>
                <button 
                  onClick={() => handleClaim(item)}
                  className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm text-white"
                >
                  Забрать
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LootGeneratorModal
