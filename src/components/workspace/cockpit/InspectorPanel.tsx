'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { HeroForm } from '@/components/workspace/archive/HeroForm';
import { NpcForm } from '@/components/workspace/archive/NpcForm';
import { EnemyForm } from '@/components/workspace/archive/EnemyForm';
import { CrowdForm } from '@/components/workspace/archive/CrowdForm';
import { LootForm } from '@/components/workspace/archive/LootForm';

export const InspectorPanel = () => {
  const store = useWorkspaceStore();
  const entityId = store.viewedEntityId;

  if (!entityId) return null;

  const categories: ('heroes' | 'npcs' | 'enemies' | 'crowd' | 'loot' | 'interactive')[] =
    ['heroes', 'npcs', 'enemies', 'crowd', 'loot', 'interactive'];

  let category: (typeof categories)[number] | null = null;
  let entity: any = null;

  for (const cat of categories) {
    if (store[cat] && store[cat][entityId]) {
      category = cat;
      entity = store[cat][entityId];
      break;
    }
  }

  if (!entity || !category) return null;

  const handleClose = () => store.setViewedEntityId(null);

  const updateData = (data: any) => {
    store.updateEntity(category, entityId, data);
  };

  const nodes = store.nodes;
  const npcsList = Object.values(store.npcs || {});

  return (
    <aside className="w-96 h-full shrink-0 flex flex-col bg-zinc-950 border-l border-zinc-900 z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 shrink-0">
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider truncate pr-2">
          Досье: {entity.name || 'Объект'}
        </h3>
        <button
          onClick={handleClose}
          className="text-zinc-500 hover:text-white transition-colors shrink-0"
          aria-label="Закрыть досье"
        >
          <X size={18} />
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 p-4">
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
    </aside>
  );
};
