import React from 'react';
import { X, Shield, Heart } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export const InspectorPanel = () => {
  const { 
    viewedEntityId, 
    setViewedEntityId, 
    heroes, 
    npcs, 
    locations, 
    quests, 
    loot,
    openLocalMap,
    setActiveView
  } = useWorkspaceStore();

  const allEntities = {
    ...heroes,
    ...npcs,
    ...locations,
    ...quests,
    ...loot
  };

  const entity = viewedEntityId ? (allEntities[viewedEntityId] as any) : null;
  const isLocation = entity && locations[entity.id];

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
          {isLocation && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openLocalMap(viewedEntityId);
                setActiveView('map');
              }} 
              className="w-full mb-4 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-inner flex items-center justify-center gap-2"
            >
              🗺️ Войти в локацию
            </button>
          )}

          {(entity.description || entity.content) && (
            <p className="text-sm leading-relaxed">{entity.description || entity.content}</p>
          )}

          {(entity.hp !== undefined || entity.ac !== undefined) && (
            <div className="flex gap-4 pt-2">
              {entity.hp !== undefined && (
                <div className="flex items-center gap-2 text-rose-500">
                  <Heart size={18} />
                  <span>HP: {entity.hp}</span>
                </div>
              )}
              {entity.ac !== undefined && (
                <div className="flex items-center gap-2 text-sky-500">
                  <Shield size={18} />
                  <span>AC: {entity.ac}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
