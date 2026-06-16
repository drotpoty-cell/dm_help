'use client'

import React from 'react'
import { Plus, Trash2, Shield, User, Heart, Target } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

const HeroesBoard = () => {
  const { heroes, updateEntity, addEntity, deleteEntity } = useWorkspaceStore()
  const heroesArray = Object.values(heroes)

  const handleCreateHero = () => {
    const newHero = {
      id: crypto.randomUUID(),
      name: 'Новый герой',
      class: 'Воин',
      level: 1,
      hp: 10,
      maxHp: 10,
      ac: 10,
      passivePerception: 10,
      initiativeModifier: 0,
      notes: ''
    }
    addEntity('heroes', newHero)
  }

  return (
    <div className="w-full h-full overflow-y-auto p-8 bg-gray-900 text-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Герои</h1>
        <button
          onClick={handleCreateHero}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
        >
          <Plus size={18} /> Создать героя
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {heroesArray.map((hero: any) => (
          <div key={hero.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <input
                className="bg-transparent text-xl font-bold w-full focus:outline-none focus:border-b border-blue-500"
                value={hero.name}
                onChange={(e) => updateEntity('heroes', hero.id, { name: e.target.value })}
              />
              <button
                onClick={() => confirm('Удалить героя?') && deleteEntity('heroes', hero.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-400 block">Класс/Раса</label>
                <input
                  className="bg-gray-900 w-full p-2 rounded focus:outline-none"
                  value={hero.class || ''}
                  onChange={(e) => updateEntity('heroes', hero.id, { class: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block">Уровень</label>
                <input
                  type="number"
                  className="bg-gray-900 w-full p-2 rounded focus:outline-none"
                  value={hero.level || 1}
                  onChange={(e) => updateEntity('heroes', hero.id, { level: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="text-center">
                <Heart size={16} className="mx-auto text-red-500" />
                <input
                  type="number"
                  className="bg-gray-900 w-full text-center p-1 rounded mt-1"
                  value={hero.hp}
                  onChange={(e) => updateEntity('heroes', hero.id, { hp: parseInt(e.target.value) })}
                />
              </div>
              <div className="text-center">
                <Shield size={16} className="mx-auto text-blue-400" />
                <input
                  type="number"
                  className="bg-gray-900 w-full text-center p-1 rounded mt-1"
                  value={hero.ac}
                  onChange={(e) => updateEntity('heroes', hero.id, { ac: parseInt(e.target.value) })}
                />
              </div>
              <div className="text-center">
                <Target size={16} className="mx-auto text-green-400" />
                <input
                  type="number"
                  className="bg-gray-900 w-full text-center p-1 rounded mt-1"
                  value={hero.initiativeModifier}
                  onChange={(e) => updateEntity('heroes', hero.id, { initiativeModifier: parseInt(e.target.value) })}
                />
              </div>
              <div className="text-center text-xs">
                <span className="block text-gray-400">PP</span>
                <input
                  type="number"
                  className="bg-gray-900 w-full text-center p-1 rounded mt-1"
                  value={hero.passivePerception}
                  onChange={(e) => updateEntity('heroes', hero.id, { passivePerception: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <textarea
              className="bg-gray-900 w-full p-2 rounded h-24 focus:outline-none text-sm"
              placeholder="Заметки..."
              value={hero.notes || ''}
              onChange={(e) => updateEntity('heroes', hero.id, { notes: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default HeroesBoard
