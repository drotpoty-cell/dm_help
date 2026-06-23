'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { HeroForm } from '@/components/workspace/archive/HeroForm';
import { NpcForm } from '@/components/workspace/archive/NpcForm';
import { EnemyForm } from '@/components/workspace/archive/EnemyForm';
import { CrowdForm } from '@/components/workspace/archive/CrowdForm';
import { LootForm } from '@/components/workspace/archive/LootForm';

export default function EntityViewerModal() {
  const store = useWorkspaceStore();
  const entityId = store.viewedEntityId;

  if (!entityId) return null;

  const categories: ('heroes' | 'npcs' | 'enemies' | 'crowd' | 'loot' | 'interactive')[] = 
    ['heroes', 'npcs', 'enemies', 'crowd', 'loot', 'interactive'];
  
  let category: any = null;
  let entity: any = null;

  for (const cat of categories) {
    if (store[cat] && store[cat][entityId]) {
      category = cat;
      entity = store[cat][entityId];
      break;
    }
  }

  if (!entity) return null;

  const handleClose = () => store.setViewedEntityId(null);

  const updateData = (data: any) => {
    store.updateEntity(category, entityId, data);
  };

  // Подтягиваем списки для селектов внутри полных форм
  const nodes = store.nodes;
  const npcsList = Object.values(store.npcs || {});

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-zinc-900/50">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
            Досье: {entity.name || 'Объект'}
          </h3>
          <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors text-2xl leading-none">
            &times;
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
          {category === 'heroes' && <HeroForm hero={entity} onUpdate={updateData} />}
          {category === 'npcs' && <NpcForm npc={entity} nodes={nodes} onUpdate={updateData} />}
          {category === 'enemies' && <EnemyForm enemy={entity} onUpdate={updateData} />}
          {category === 'crowd' && <CrowdForm crowd={entity} nodes={nodes} onUpdate={updateData} />}
          {category === 'loot' && <LootForm loot={entity} nodes={nodes} npcs={npcsList as any} onUpdate={updateData} />}
          
          {category === 'interactive' && (
            <div className="flex flex-col gap-4 text-zinc-300">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Название</label>
                <input 
                  value={entity.name || ''} 
                  onChange={(e) => updateData({ name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  {entity.type === 'check' ? 'Описание общее' : 'Описание'}
                </label>
                <textarea 
                  value={entity.description || ''} 
                  onChange={(e) => updateData({ description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 h-32 resize-none outline-none focus:border-indigo-500"
                />
              </div>
              {entity.type === 'check' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Сложность (DC)</label>
                    <input 
                      type="number" 
                      value={entity.dc || 10} 
                      onChange={(e) => updateData({ dc: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Результат успеха</label>
                    <textarea
                      value={entity.successResult || ''}
                      onChange={(e) => updateData({ successResult: e.target.value })}
                      placeholder="Что произойдет при успехе..."
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 h-24 resize-none outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Результат провала</label>
                    <textarea
                      value={entity.failureResult || ''}
                      onChange={(e) => updateData({ failureResult: e.target.value })}
                      placeholder="Что произойдет при провале..."
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 h-24 resize-none outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
