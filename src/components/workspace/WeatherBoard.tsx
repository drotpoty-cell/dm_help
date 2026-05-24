'use client'

import { useRef } from 'react'
import { useWorkspaceStore, ClimateType } from '@/store/useWorkspaceStore'
import { toast } from 'sonner'

const getWeatherIconLarge = (condition: string) => {
  const baseClasses = "w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]";
  switch(condition) {
    case 'Ясно': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-amber-400`}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42 1.42"/></svg>;
    case 'Облачно': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-zinc-400`}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
    case 'Дождь': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-blue-400`}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M16 14v6M8 14v6M12 16v6"/></svg>;
    case 'Гроза': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-purple-400`}><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>;
    case 'Снег': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-cyan-200`}><path d="M20 12h-6M4 12h6M12 20v-6M12 4v6M17.5 17.5l-4-4M6.5 6.5l 4 4M17.5 6.5l-4-4M6.5 17.5l 4-4"/></svg>;
    case 'Вьюга': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-blue-300`}><path d="M20 12h-6M4 12h6M12 20v-6M12 4v6M17.5 17.5l-4-4M6.5 6.5l 4 4M17.5 6.5l-4-4M6.5 17.5l 4-4"/><path d="M22 22l-4-4M2 2l4 4"/></svg>;
    case 'Туман': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-zinc-500`}><path d="M4 14h16M4 18h16M8 10h8M11 6h2"/></svg>;
    case 'Песчаная буря': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-orange-400`}><path d="M4 14h16M4 18h16M8 10h8M11 6h2M20 22l-2-2M4 2l2 2"/></svg>;
    default: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${baseClasses} text-zinc-400`}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
  }
}

export default function WeatherBoard() {
  const weather = useWorkspaceStore(state => state.weather)
  const setWeather = useWorkspaceStore(state => state.setWeather)
  const generateForecast = useWorkspaceStore(state => state.generateForecast)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // БЕЗОПАСНОЕ ЧТЕНИЕ (чтобы не падало на старых сохранениях)
  const safeForecast = weather.forecast || {}

  // --- ИМПОРТ / ЭКСПОРТ ---
  const handleExport = () => {
    const data = { forecast: safeForecast, climate: weather.climate, mode: weather.mode };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result
        const imported = JSON.parse(typeof raw === 'string' ? raw : String(raw)) as unknown

        const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
        if (!isPlainObject(imported) || !('forecast' in imported) || !isPlainObject((imported as Record<string, unknown>).forecast)) {
          throw new Error('INVALID_FORMAT')
        }

        const payload = imported as { forecast: Record<string, unknown>; climate?: unknown; mode?: unknown }
        setWeather({
          forecast: (payload.forecast as any) || {},
          climate: (typeof payload.climate === 'string' ? (payload.climate as ClimateType) : weather.climate),
          mode: (typeof payload.mode === 'string' ? (payload.mode as any) : weather.mode)
        })
        toast.success('Данные успешно загружены')
      } catch {
        toast.error('Неверный формат файла')
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadAiTemplate = () => {
    const template = {
      _AI_PROMPT_: "Ты — метеоролог фэнтези-мира. Сгенерируй погоду на 30 дней. Ключ — номер дня, значение — { condition, temp }. Доступные условия: Ясно, Облачно, Дождь, Гроза, Снег, Вьюга, Туман, Песчаная буря.",
      climate: "temperate",
      mode: "dynamic",
      forecast: {
        "1": { "condition": "Ясно", "temp": 22 },
        "2": { "condition": "Дождь", "temp": 18 }
      }
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_weather_template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 bg-[#09090b] flex z-10 overflow-y-auto p-10">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
      
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
        
        {/* ВЕРХНЯЯ ПАНЕЛЬ С КНОПКАМИ */}
        <div className="flex justify-between items-start border-b border-zinc-800/80 pb-6">
          <div className="text-left">
            <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] mb-2">Экология</h2>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Управление климатом и календарем осадков</p>
          </div>

          <div className="flex gap-3">
             <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase rounded border border-zinc-800 transition-all">Загрузить</button>
             <button onClick={handleExport} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase rounded border border-zinc-800 transition-all">Экспорт</button>
             <button onClick={downloadAiTemplate} className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase rounded border border-indigo-500/20 transition-all">Умный шаблон (ИИ)</button>
          </div>
        </div>

        {/* РЕЖИМЫ */}
        <div className="grid grid-cols-3 gap-6">
          {['disabled', 'static', 'dynamic'].map((m) => (
            <div 
              key={m} onClick={() => setWeather({ mode: m as any })}
              className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col gap-2 ${weather.mode === m ? 'bg-indigo-950/30 border-indigo-500 shadow-lg' : 'bg-zinc-950 border-zinc-900 hover:border-zinc-700'}`}
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">{m === 'disabled' ? 'Выкл' : m === 'static' ? 'Ручная' : 'Динамика'}</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed uppercase font-bold">{m === 'dynamic' ? 'Авто-генерация' : 'Фиксированные данные'}</p>
            </div>
          ))}
        </div>

        {weather.mode !== 'disabled' && (
          <div className="grid grid-cols-3 gap-10 bg-zinc-900/30 border border-zinc-800 rounded-3xl p-10 items-center">
            
            <div className="flex flex-col items-center justify-center bg-zinc-950/50 rounded-2xl border border-zinc-800 p-8 shadow-inner">
               <div className="text-[10px] font-black uppercase text-zinc-600 mb-6 tracking-widest">Текущий статус</div>
               <div className="mb-4">{getWeatherIconLarge(weather.condition)}</div>
               <div className="text-2xl font-black text-white">{weather.condition}</div>
               <div className="text-lg font-bold text-zinc-400">{weather.temp}°C</div>
            </div>

            <div className="col-span-2 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block tracking-widest">Биом климата</label>
                    <select 
                      value={weather.climate} 
                      onChange={e => setWeather({ climate: e.target.value as ClimateType })}
                      className="w-full bg-zinc-950 border border-zinc-800 text-sm font-bold text-zinc-200 p-4 rounded-xl outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="temperate">🌳 Умеренный</option>
                      <option value="winter">❄️ Северный</option>
                      <option value="desert">🏜️ Пустыня</option>
                      <option value="tropical">🌴 Тропики</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block tracking-widest">Магия прогноза</label>
                    <button 
                      onClick={() => generateForecast(30)}
                      className="w-full py-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                      Сгенерировать на 30 дней
                    </button>
                  </div>
               </div>

               <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl text-[10px] text-zinc-500 uppercase font-bold tracking-[0.1em] leading-loose">
                 &gt; Сгенерированный прогноз закрепится в календаре.<br/>
                 &gt; При смене дня система автоматически возьмет погоду из прогноза.
               </div>
            </div>
          </div>
        )}

        {/* ПРЕДПРОСМОТР КАЛЕНДАРЯ (МИНИ ЛЕНТА) */}
        {Object.keys(safeForecast).length > 0 && weather.mode !== 'disabled' && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] text-center">Прогноз на ближайшие дни (Лента)</h3>
            <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
              {Object.entries(safeForecast).sort((a,b) => Number(a[0]) - Number(b[0])).slice(0, 14).map(([day, data]) => (
                <div key={day} className="flex-shrink-0 w-24 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-1">
                  <div className="text-[9px] font-black text-zinc-600 uppercase">День {day}</div>
                  <div className="text-lg cursor-help" title={data.condition}>
                    {data.condition === 'Ясно' ? '☀️' : 
                     data.condition === 'Облачно' ? '⛅' : 
                     data.condition === 'Дождь' ? '🌧️' : 
                     data.condition === 'Гроза' ? '⛈️' : 
                     data.condition === 'Снег' ? '❄️' : 
                     data.condition === 'Вьюга' ? '🌪️' : 
                     data.condition === 'Песчаная буря' ? '🏜️' : '🌫️'}
                  </div>
                  <div className="text-[10px] font-black text-zinc-300">{data.temp}°</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ШПАРГАЛКА ПО ЭФФЕКТАМ */}
        <div className="mt-4 border-t border-zinc-800/50 pt-10 pb-20">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 text-center">Шпаргалка: Влияние на перемещение</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 text-center flex flex-col items-center gap-2">
               <span className="text-xl">☀️</span>
               <span className="text-[10px] font-black uppercase text-zinc-300">Ясно / Облачно</span>
               <span className="text-[9px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Норма</span>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 text-center flex flex-col items-center gap-2">
               <span className="text-xl">🌧️</span>
               <span className="text-[10px] font-black uppercase text-zinc-300">Дождь / Снег</span>
               <span className="text-[9px] font-bold uppercase text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Время пути x1.5</span>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 text-center flex flex-col items-center gap-2">
               <span className="text-xl">⛈️</span>
               <span className="text-[10px] font-black uppercase text-zinc-300">Гроза / Вьюга</span>
               <span className="text-[9px] font-bold uppercase text-red-500 bg-red-500/10 px-2 py-1 rounded">Время пути x2.0</span>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 text-center flex flex-col items-center gap-2">
               <span className="text-xl">🌫️</span>
               <span className="text-[10px] font-black uppercase text-zinc-300">Туман / Буря</span>
               <span className="text-[9px] font-bold uppercase text-red-500 bg-red-500/10 px-2 py-1 rounded">Время пути x2.0</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}