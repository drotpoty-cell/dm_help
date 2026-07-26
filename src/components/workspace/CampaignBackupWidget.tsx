'use client';

import React, { useRef } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { toast } from 'sonner';

export const CampaignBackupWidget = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      // Забираем весь глобальный стейт приложения
      const state = useWorkspaceStore.getState();
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `gm_assistant_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Бэкап кампании успешно скачан!');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при создании бэкапа.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        
        // Полностью перезаписываем стейт приложения
        useWorkspaceStore.setState(data);
        toast.success('Кампания успешно восстановлена из бэкапа!');
      } catch (error) {
        console.error(error);
        toast.error('Ошибка чтения файла бэкапа. Возможно, файл поврежден.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
      <h2 className="text-white text-lg font-black mb-2 uppercase tracking-wider">Управление кампанией</h2>
      <p className="text-neutral-400 text-sm mb-6">
        Полное сохранение и восстановление базы данных. Включает Архив, настройки тактических карт, расстановку токенов, погоду и текущее время.
      </p>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleExport}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center gap-3"
        >
          <span className="text-xl">💾</span> Скачать полный бэкап
        </button>
        <label className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center gap-3 cursor-pointer border border-neutral-700">
          <span className="text-xl">📂</span> Восстановить кампанию
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
        </label>
      </div>
    </div>
  );
};
