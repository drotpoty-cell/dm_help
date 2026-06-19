import React, { useState } from 'react';
import { X, Shield, Heart, Sparkles, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export const InspectorPanel = () => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { 
    viewedEntityId, 
    setViewedEntityId, 
    heroes, 
    npcs, 
    updateHero,
    updateNpc,
    updateEntity,
    locations, 
    quests, 
    loot,
    extras,
    nodes,
    openLocalMap,
    setActiveView
  } = useWorkspaceStore();

  const handleAIGenerate = async (field: string, contextPrompt: string) => {
    setIsGenerating(field);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: contextPrompt }),
      });
      const data = await response.json();
      if (data.text) {
        updateEntity('extras', entity.id, { [field]: data.text });
      }
    } catch (error) {
      console.error('AI Generation error:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  const allEntities = {
    ...heroes,
    ...npcs,
    ...locations,
    ...quests,
    ...loot,
    ...extras
  };

  // Добавляем POI и Checks из extras для поиска, если они там живут
  const entity = viewedEntityId ? (allEntities[viewedEntityId] as any) : null;
  const isLocationNode = viewedEntityId ? (nodes.some(n => n.id === viewedEntityId) || locations[viewedEntityId]) : false;

  const entityType = (viewedEntityId && heroes[viewedEntityId]) ? 'hero' : (viewedEntityId && npcs[viewedEntityId]) ? 'npc' : null;

  const handleHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHp = parseInt(e.target.value) || 0;
    if (entityType === 'hero') {
      updateHero(entity.id, { hp: newHp });
    } else if (entityType === 'npc') {
      updateNpc(entity.id, { hp: newHp });
    }
  };

  const handleMaxHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxHp = parseInt(e.target.value) || 0;
    if (entityType === 'hero') {
      updateHero(entity.id, { maxHp: newMaxHp });
    } else if (entityType === 'npc') {
      updateNpc(entity.id, { maxHp: newMaxHp });
    }
  };

  const handleAcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAc = parseInt(e.target.value) || 0;
    if (entityType === 'hero') {
      updateHero(entity.id, { ac: newAc });
    } else if (entityType === 'npc') {
      updateNpc(entity.id, { ac: newAc });
    }
  };

  const changeHp = (delta: number) => {
    const currentHp = entity.hp || 0;
    const newHp = Math.max(0, currentHp + delta);
    if (entityType === 'hero') {
      updateHero(entity.id, { hp: newHp });
    } else if (entityType === 'npc') {
      updateNpc(entity.id, { hp: newHp });
    }
  };

  if (!viewedEntityId) return null;

  return (
    <div className={`absolute right-0 top-0 bottom-0 w-96 bg-neutral-950 border-l border-neutral-800 shadow-2xl z-50 transition-transform duration-300 ${!entity ? 'translate-x-full' : 'translate-x-0'}`}>
      <div className="flex items-center justify-between p-5 border-b border-neutral-800">
        <h2 className="text-xl font-bold text-white truncate">{entity?.name || entity?.title || 'Unknown'}</h2>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setViewedEntityId(null);
          }}
          className="text-neutral-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>
      
      {entity && (
        <div className="p-5 space-y-4 text-neutral-300">
          {entity.tokenType === 'poi' && (
            <div className="space-y-4">
              <input value={entity.name} onChange={(e) => updateEntity('extras', entity.id, { name: e.target.value })} className="w-full bg-neutral-900 text-white p-2 rounded text-lg font-bold" />
              <div className="relative">
                <textarea value={entity.description} onChange={(e) => updateEntity('extras', entity.id, { description: e.target.value })} className="w-full bg-neutral-900 text-white p-2 pr-10 rounded text-sm h-32" placeholder="Описание..." />
                <button 
                  onClick={() => handleAIGenerate('description', `Сгенерируй атмосферное описание для точки интереса с названием: ${entity.name}.`)}
                  disabled={isGenerating === 'description'}
                  className="absolute top-2 right-2 p-2 text-indigo-400 hover:text-indigo-300 disabled:text-neutral-600"
                >
                  {isGenerating === 'description' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>
            </div>
          )}
          {entity.tokenType === 'check' && (
            <div className="space-y-4">
              <input value={entity.name} onChange={(e) => updateEntity('extras', entity.id, { name: e.target.value })} className="w-full bg-neutral-900 text-white p-2 rounded text-lg font-bold" />
              <textarea value={entity.context || ''} onChange={(e) => updateEntity('extras', entity.id, { context: e.target.value })} className="w-full bg-neutral-900 text-white p-2 rounded text-sm h-20" placeholder="Что происходит..." />
              
              <div className="relative">
                <textarea value={entity.successResult || ''} onChange={(e) => updateEntity('extras', entity.id, { successResult: e.target.value })} className="w-full bg-neutral-900 text-white p-2 pr-10 rounded text-sm h-20" placeholder="Результат успеха..." />
                <button 
                  onClick={() => handleAIGenerate('successResult', `Сгенерируй описание успеха для проверки "${entity.name}" при контексте: ${entity.context || 'без контекста'}.`)}
                  disabled={isGenerating === 'successResult'}
                  className="absolute top-2 right-2 p-2 text-indigo-400 hover:text-indigo-300 disabled:text-neutral-600"
                >
                  {isGenerating === 'successResult' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>

              <div className="relative">
                <textarea value={entity.failureResult || ''} onChange={(e) => updateEntity('extras', entity.id, { failureResult: e.target.value })} className="w-full bg-neutral-900 text-white p-2 pr-10 rounded text-sm h-20" placeholder="Результат провала..." />
                <button 
                  onClick={() => handleAIGenerate('failureResult', `Сгенерируй описание провала для проверки "${entity.name}" при контексте: ${entity.context || 'без контекста'}.`)}
                  disabled={isGenerating === 'failureResult'}
                  className="absolute top-2 right-2 p-2 text-indigo-400 hover:text-indigo-300 disabled:text-neutral-600"
                >
                  {isGenerating === 'failureResult' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm">Сложность (DC):</label>
                <input type="number" value={entity.dc || 0} onChange={(e) => updateEntity('extras', entity.id, { dc: parseInt(e.target.value) || 0 })} className="w-16 bg-neutral-900 text-white p-2 rounded" />
              </div>
            </div>
          )}
          
          {isLocationNode && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openLocalMap(viewedEntityId);
                setActiveView('map');
              }} 
              className="w-full mt-4 mb-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-inner flex items-center justify-center gap-2"
            >
              🗺️ Войти на тактическую карту
            </button>
          )}

          {!entity.tokenType && (entity.description || entity.content) && (
            <p className="text-sm leading-relaxed">{entity.description || entity.content}</p>
          )}

          {!entity.tokenType && (entity.hp !== undefined || entity.ac !== undefined) && (
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Боевые характеристики</h3>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 block mb-1">HP</label>
                  <input type="number" value={entity.hp || 0} onChange={handleHpChange} className="w-full bg-neutral-800 text-white p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 block mb-1">Max HP</label>
                  <input type="number" value={entity.maxHp || 0} onChange={handleMaxHpChange} className="w-full bg-neutral-800 text-white p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 block mb-1">AC</label>
                  <input type="number" value={entity.ac || 0} onChange={handleAcChange} className="w-full bg-neutral-800 text-white p-2 rounded text-sm" />
                </div>
              </div>

              <div className="flex gap-2">
                {[-5, -1, 1, 5].map((delta) => (
                  <button key={delta} onClick={() => changeHp(delta)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-1.5 rounded text-xs">
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
