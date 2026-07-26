'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Calendar, Sun, CloudRain, Cloud, CloudLightning, Snowflake, Wind, Droplets, BookOpen, Users, CloudUpload, CloudCheck, CloudAlert, Loader2, LayoutDashboard, Library, Eye, Pencil, Globe, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { confirmToast } from '@/utils/confirmToast';
import type { CampaignSyncStatus } from '@/hooks/useCampaignSync';

const SYNC_STATUS_CONFIG: Record<CampaignSyncStatus, { icon: React.ReactNode; label: string; className: string }> = {
  loading: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Загрузка…', className: 'text-zinc-500' },
  idle: { icon: <CloudCheck className="w-3 h-3" />, label: 'Сохранено', className: 'text-zinc-600' },
  saving: { icon: <CloudUpload className="w-3 h-3 animate-pulse" />, label: 'Сохранение…', className: 'text-indigo-400' },
  saved: { icon: <CloudCheck className="w-3 h-3" />, label: 'Сохранено', className: 'text-emerald-500' },
  error: { icon: <CloudAlert className="w-3 h-3" />, label: 'Ошибка сохранения', className: 'text-red-500' },
};

const CockpitHeader = ({
  syncStatus, hasLegacyData, forceSync, campaignName, renameCampaign,
}: {
  syncStatus?: CampaignSyncStatus;
  hasLegacyData?: boolean;
  forceSync?: () => Promise<void>;
  campaignName?: string | null;
  renameCampaign?: (name: string) => Promise<boolean>;
}) => {
  const { currentDay, currentHour, weather, activeView, setActiveView, migrateLegacyData, displayMode, toggleDisplayMode } = useWorkspaceStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [isForcingSync, setIsForcingSync] = useState(false);

  const startEditingName = () => {
    setNameDraft(campaignName || '');
    setIsEditingName(true);
  };

  const handleForceSync = async () => {
    if (!forceSync || isForcingSync) return;
    setIsForcingSync(true);
    try {
      await forceSync();
      toast.success('Кампания синхронизирована с облаком');
    } catch {
      toast.error('Не удалось синхронизировать кампанию');
    } finally {
      setIsForcingSync(false);
    }
  };

  const handleRenameSubmit = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || !renameCampaign) {
      setIsEditingName(false);
      return;
    }
    const ok = await renameCampaign(trimmed);
    toast[ok ? 'success' : 'error'](ok ? 'Кампания переименована' : 'Не удалось переименовать кампанию');
    setIsEditingName(false);
  };

  const handleMigrate = () => {
    confirmToast(
      'Эта кампания была сохранена в старом формате (отдельные категории NPC и Массовка). ' +
      'Перенести их данные в объединённые категории «Персонажи» и «Второстепенные»?',
      () => {
        const { migratedNpcCount, migratedCrowdCount } = migrateLegacyData();
        toast.success(`Перенесено: ${migratedNpcCount} NPC и ${migratedCrowdCount} персонажей массовки.`);
      },
      { confirmLabel: 'Перенести', description: 'Действие безопасно и не удаляет существующие записи.' }
    );
  };

  const navItems = [
    { id: 'table', label: 'Игровой стол', icon: LayoutDashboard },
    { id: 'archive', label: 'Архив', icon: Library },
    { id: 'story', label: 'Сценарий', icon: BookOpen },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    { id: 'weather', label: 'Погода', icon: Cloud },
  ];

  const weatherIcons: Record<string, React.ReactNode> = {
    'Ясно': <Sun className="w-4 h-4 text-amber-400" />,
    'Облачно': <Cloud className="w-4 h-4 text-neutral-400" />,
    'Дождь': <CloudRain className="w-4 h-4 text-blue-400" />,
    'Ливень': <CloudRain className="w-4 h-4 text-blue-600" />,
    'Гроза': <CloudLightning className="w-4 h-4 text-yellow-500" />,
    'Снег': <Snowflake className="w-4 h-4 text-white" />,
    'Вьюга': <Wind className="w-4 h-4 text-neutral-200" />,
    'Туман': <Cloud className="w-4 h-4 text-neutral-500" />,
    'Песчаная буря': <Wind className="w-4 h-4 text-amber-600" />
  };

  const weatherIcon = weatherIcons[weather.condition] || <Sun className="w-4 h-4 text-amber-400" />;

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-neutral-800 bg-neutral-950 text-neutral-200">
      <div className="flex items-center gap-6">
        <h1 className="font-bold text-sm tracking-tight">GM Assistant</h1>

        {/* Индикатор открытого мира (Блок 5): клик — принудительная синхронизация с
            Supabase прямо сейчас; карандаш — переименование кампании. */}
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg pl-2.5 pr-1.5 py-1">
          {isEditingName ? (
            <>
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') { setNameDraft(campaignName || ''); setIsEditingName(false); }
                }}
                className="bg-transparent text-xs font-bold text-white outline-none w-40 border-b border-indigo-500"
              />
              <button onClick={handleRenameSubmit} className="text-emerald-500 hover:text-emerald-400 p-0.5" title="Сохранить">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setNameDraft(campaignName || ''); setIsEditingName(false); }} className="text-neutral-500 hover:text-neutral-300 p-0.5" title="Отмена">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleForceSync}
                disabled={isForcingSync}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 hover:text-indigo-400 transition-colors disabled:opacity-50"
                title="Нажмите, чтобы принудительно синхронизировать эту кампанию с облаком прямо сейчас"
              >
                <Globe className={`w-3.5 h-3.5 ${isForcingSync ? 'animate-spin' : ''}`} />
                <span className="max-w-[160px] truncate">{campaignName || 'Без названия'}</span>
              </button>
              <button
                onClick={startEditingName}
                className="text-neutral-600 hover:text-neutral-300 p-0.5"
                title="Переименовать кампанию"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        <nav className="flex items-center gap-4 text-[11px] text-neutral-500 font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const normalizedView = activeView === 'dashboard' || activeView === 'map' ? 'table' : activeView;
            const isActive = normalizedView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 transition-colors ${isActive ? 'text-blue-500' : 'hover:text-neutral-200'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDisplayMode}
          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors ${
            displayMode === 'player'
              ? 'bg-amber-950/40 border-amber-700/60 text-amber-400 hover:bg-amber-950/60'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
          title={
            displayMode === 'gm'
              ? 'Режим ГМа: формы редактируются. Нажмите, чтобы переключиться в режим показа игрокам (только просмотр).'
              : 'Режим показа игрокам: формы заблокированы от случайных правок. Нажмите, чтобы вернуться в режим ГМа.'
          }
        >
          {displayMode === 'gm' ? <Pencil className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {displayMode === 'gm' ? 'Режим ГМа' : 'Показ игрокам'}
        </button>
        {hasLegacyData && (
          <button
            onClick={handleMigrate}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-900/50 bg-amber-950/30 px-2 py-1 rounded hover:bg-amber-950/50 transition-colors"
            title="Кампания сохранена в старом формате — перенести NPC/Массовку в объединённые категории"
          >
            Мигрировать данные кампании
          </button>
        )}
        {syncStatus && (
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${SYNC_STATUS_CONFIG[syncStatus].className}`} title="Статус синхронизации с облаком">
            {SYNC_STATUS_CONFIG[syncStatus].icon}
            <span className="hidden sm:inline">{SYNC_STATUS_CONFIG[syncStatus].label}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-[11px] font-mono bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800">
          <span className="text-neutral-400">День {currentDay}</span>
          <span className="text-neutral-700">|</span>
          <span>{currentHour.toString().padStart(2, '0')}:00</span>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1">
            {weatherIcon} {weather.temp}°C
          </div>
        </div>
      </div>
    </header>
  );
};

export default CockpitHeader;
