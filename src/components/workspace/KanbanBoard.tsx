'use client'

import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function KanbanBoard() {
  const currentDay = useWorkspaceStore(state => state.currentDay)
  
  // Достаем квесты, события и узлы карты
  const quests = useWorkspaceStore(state => Object.values(state.quests || {}))
  const events = useWorkspaceStore(state => Object.values(state.events || {}))
  const nodes = useWorkspaceStore(state => state.nodes)
  
  const updateEntity = useWorkspaceStore(state => state.updateEntity)

  // Объединяем квесты и события в единый массив задач
  const allItems = [
    ...quests.map(q => ({ ...q, type: 'quest' })),
    ...events.map(e => ({ ...e, type: 'event' }))
  ]

  const columns = [
    { id: 'backlog', title: 'В планах / Слухи' },
    { id: 'active', title: 'В процессе' },
    { id: 'completed', title: 'Завершено / Провалено' }
  ]

  return (
    <div className="absolute inset-0 bg-[#09090b] p-8 flex flex-col z-10">
      <div className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-1">Сюжеты и События</h2>
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
            Текущий день: {currentDay}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        {columns.map(col => {
          // Ищем задачи для конкретной колонки.
          // У квестов статус 'available', 'active', 'completed', 'failed'.
          // У событий статус 'backlog', 'active', 'completed'.
          const itemsInColumn = allItems.filter(item => {
            if (col.id === 'backlog') return item.status === 'available' || item.status === 'backlog'
            if (col.id === 'active') return item.status === 'active'
            if (col.id === 'completed') return item.status === 'completed' || item.status === 'failed'
            return false
          })

          return (
            <div key={col.id} className="flex-1 flex flex-col bg-zinc-950/50 border border-zinc-900 rounded-2xl overflow-hidden">
              {/* Шапка колонки */}
              <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{col.title}</h3>
                <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {itemsInColumn.length}
                </span>
              </div>

              {/* Список карточек */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {itemsInColumn.map((item: any) => {
                  const isEvent = item.type === 'event'
                  
                  // Ищем название локации
                  const locationNode = nodes.find(n => n.id === item.locationId)
                  const locationName = locationNode ? locationNode.data.label : 'В мире / Неизвестно'

                  // Проверка на просрочку
                  const isExpired = item.status === 'active' && item.deadline && currentDay > (item.startDay + item.deadline)

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border flex flex-col gap-3 shadow-lg ${
                        item.status === 'failed' ? 'bg-red-950/10 border-red-900/30' :
                        isEvent ? 'bg-cyan-950/10 border-cyan-900/30' : 
                        'bg-zinc-900/40 border-zinc-800'
                      }`}
                    >
                      {/* Заголовок */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className={`font-bold ${item.status === 'failed' ? 'text-red-400 line-through opacity-70' : 'text-zinc-200'}`}>
                            {isEvent && <span className="text-cyan-400 mr-2">✨</span>}
                            {item.title || item.name}
                          </div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">
                            {isEvent ? 'Глобальное событие' : 'Сюжетный квест'}
                          </div>
                        </div>
                        
                        {/* ТОТ САМЫЙ ПУЛЬСИРУЮЩИЙ ЗНАК ДЕДЛАЙНА */}
                        {isExpired && (
                          <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 flex items-center justify-center font-black animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0" title="Срок вышел!">
                            !
                          </div>
                        )}
                      </div>

                      {/* Описание */}
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        {item.hook || item.description || 'Нет описания.'}
                      </p>

                      {/* Мета-данные (Локация и Сроки) */}
                      <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50 mt-auto">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase truncate max-w-[50%]">
                          📍 {locationName}
                        </span>
                        
                        {item.status === 'active' && (
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isExpired ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                            {isEvent ? `Длится: ${item.duration} дн.` : (item.deadline ? `Осталось: ${(item.startDay + item.deadline) - currentDay} дн.` : 'Без срока')}
                          </span>
                        )}
                        {item.status === 'failed' && <span className="text-red-500 text-[10px] font-black uppercase">Провалено</span>}
                        {item.status === 'completed' && <span className="text-emerald-500 text-[10px] font-black uppercase">Успех</span>}
                      </div>

                      {/* Кнопки управления статусом */}
                      {col.id !== 'completed' && (
                        <div className="flex gap-2 mt-2">
                          {col.id === 'backlog' && (
                            <button 
                              onClick={() => updateEntity(isEvent ? 'events' : 'quests', item.id, { status: 'active', startDay: currentDay })}
                              className="flex-1 py-2 bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[9px] font-black uppercase tracking-widest rounded transition-colors"
                            >
                              Начать
                            </button>
                          )}
                          {col.id === 'active' && (
                            <>
                              <button 
                                onClick={() => updateEntity(isEvent ? 'events' : 'quests', item.id, { status: 'completed' })}
                                className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/30 text-emerald-500 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest rounded transition-colors"
                              >
                                Завершить
                              </button>
                              {!isEvent && (
                                <button 
                                  onClick={() => updateEntity('quests', item.id, { status: 'failed' })}
                                  className="flex-1 py-2 bg-red-600/10 hover:bg-red-600/30 text-red-500 border border-red-500/30 text-[9px] font-black uppercase tracking-widest rounded transition-colors"
                                >
                                  Провал
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  )
                })}

                {itemsInColumn.length === 0 && (
                  <div className="text-center text-zinc-600 text-xs font-bold uppercase tracking-widest py-10 border border-dashed border-zinc-800 rounded-xl">
                    Пусто
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}