'use client';

import React, { useCallback, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { confirmToast } from '@/utils/confirmToast';
import { HeroForm } from '@/components/workspace/archive/HeroForm';
import { EnemyForm } from '@/components/workspace/archive/EnemyForm';
import { LootForm } from '@/components/workspace/archive/LootForm';
import { LocationForm } from '@/components/workspace/archive/LocationForm';
import { QuestForm } from '@/components/workspace/archive/QuestForm';
import { FactionForm } from '@/components/workspace/archive/FactionForm';
import { ExtraForm } from '@/components/workspace/archive/ExtraForm';
import { BestiaryForm } from '@/components/workspace/archive/BestiaryForm';
import { CharacterForm } from '@/components/workspace/archive/CharacterForm';
import { EntityImageUploader } from '@/components/workspace/cockpit/EntityImageUploader';

const ALL_CATEGORIES = [
  'heroes', 'enemies', 'loot', 'interactive',
  'locations', 'quests', 'factions', 'extras', 'bestiary', 'characters',
] as const;

export const InspectorPanel = () => {
  const store = useWorkspaceStore();
  const entityId = store.viewedEntityId;
  const inspectorPanelWidth = store.inspectorPanelWidth;
  const setInspectorPanelWidth = store.setInspectorPanelWidth;
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartRef.current = { startX: e.clientX, startWidth: inspectorPanelWidth };
    setIsResizing(true);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current) return;
      // Панель у правого края экрана — тянем влево, чтобы увеличить ширину.
      const delta = resizeStartRef.current.startX - moveEvent.clientX;
      setInspectorPanelWidth(resizeStartRef.current.startWidth + delta);
    };
    const handleUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [inspectorPanelWidth, setInspectorPanelWidth]);

  if (!entityId) return null;

  let category: (typeof ALL_CATEGORIES)[number] | null = null;
  let entity: any = null;

  for (const cat of ALL_CATEGORIES) {
    if (store[cat] && store[cat][entityId]) {
      category = cat;
      entity = store[cat][entityId];
      break;
    }
  }

  if (!entity || !category) return null;

  const handleClose = () => store.setViewedEntityId(null);

  const handleDelete = () => {
    confirmToast('Удалить эту запись без возможности восстановления?', () => {
      store.deleteEntity(category, entityId);
      store.setViewedEntityId(null);
    });
  };

  const updateData = (data: any) => {
    store.updateEntity(category, entityId, data);
  };

  const nodes = store.nodes;
  const charactersList = Object.values(store.characters || {});
  const isReadOnly = store.displayMode === 'player';

  // Локации используют существующее поле mapImage (то же самое, что рендерят мировая
  // карта и автофон тактической карты) — остальные категории получают новое поле `image`.
  const isLocationCategory = category === 'locations';
  const imageUrl: string | null = isLocationCategory ? entity.mapImage || null : entity.image || null;
  const handleImageChange = (url: string | null) => {
    updateData(isLocationCategory ? { mapImage: url } : { image: url });
  };
  const supportsImage = category !== 'interactive';

  return (
    <aside
      className="h-full shrink-0 flex bg-zinc-950 border-l border-zinc-900 z-40 relative"
      style={{ width: inspectorPanelWidth }}
    >
      {/* Драг-ресайзер левого края панели (Блок 5, п.3) */}
      <div
        onMouseDown={handleResizeStart}
        className={`absolute left-0 top-0 bottom-0 w-1.5 -translate-x-1/2 cursor-col-resize z-50 group flex items-center justify-center ${isResizing ? 'bg-indigo-500/50' : ''}`}
        title="Потяните, чтобы изменить ширину панели"
      >
        <div className={`w-0.5 h-10 rounded-full transition-colors ${isResizing ? 'bg-indigo-400' : 'bg-zinc-800 group-hover:bg-indigo-500'}`} />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 shrink-0">
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider truncate pr-2">
          Досье: {entity.name || entity.title || 'Объект'}
        </h3>
        <button
          onClick={handleClose}
          className="text-zinc-500 hover:text-white transition-colors shrink-0"
          aria-label="Закрыть досье"
        >
          <X size={18} />
        </button>
      </div>

      {isReadOnly && (
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-900/40 text-[10px] font-black uppercase tracking-widest text-amber-400 shrink-0">
          👁️ Режим показа игрокам — только просмотр
        </div>
      )}

      {/* fieldset disabled разом блокирует все нативные input/textarea/select/button
          внутри — единая точка защиты от случайных правок для ЛЮБОЙ формы archive/*Form.tsx,
          без необходимости дорабатывать каждую форму по отдельности (Блок 4, п.4). */}
      <fieldset disabled={isReadOnly} className="flex flex-col flex-1 min-h-0 border-0 p-0 m-0">
      <div className="overflow-y-auto custom-scrollbar flex-1 p-4">
        {/* Универсальное изображение сущности — единая точка для ВСЕХ категорий разом
            (Блок 5, п.4), а не доработка каждой из 13 форм по отдельности. */}
        {supportsImage && (
          <EntityImageUploader
            imageUrl={imageUrl}
            onChange={handleImageChange}
            entityId={entityId}
            disabled={isReadOnly}
          />
        )}
        {category === 'heroes' && <HeroForm hero={entity} onUpdate={updateData} />}
        {category === 'enemies' && <EnemyForm enemy={entity} onUpdate={updateData} />}
        {category === 'loot' && <LootForm loot={entity} nodes={nodes} npcs={charactersList as any} onUpdate={updateData} />}
        {category === 'locations' && (
          <LocationForm
            location={entity}
            onUpdate={updateData}
            onPlaceOnMap={() => {
              store.placeLocationOnMap(entityId);
              store.setActiveView('table');
            }}
          />
        )}
        {category === 'quests' && <QuestForm quest={entity} nodes={nodes as any} npcs={charactersList as any} onUpdate={updateData} />}
        {category === 'factions' && <FactionForm faction={entity} nodes={nodes} characters={charactersList} onUpdate={updateData} />}
        {category === 'extras' && <ExtraForm extra={entity} nodes={nodes} onUpdate={updateData} />}
        {category === 'bestiary' && <BestiaryForm threat={entity} onUpdate={updateData} />}
        {category === 'characters' && <CharacterForm character={entity} onUpdate={updateData} />}

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

      <div className="p-3 border-t border-zinc-900 shrink-0">
        <button
          onClick={handleDelete}
          className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-400 hover:bg-red-950/20 rounded-lg border border-transparent hover:border-red-900/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Удалить запись
        </button>
      </div>
      </fieldset>
      </div>
    </aside>
  );
};
