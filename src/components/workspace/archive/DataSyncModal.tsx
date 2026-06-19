'use client'

import { useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { generateAIPromptTemplate } from '@/utils/aiTemplateGenerator'

interface DataSyncModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DataSyncModal = ({ isOpen, onClose }: DataSyncModalProps) => {
  const [importJson, setImportJson] = useState('')
  const { plotNodes, npcs, extras, locations, importAIData } = useWorkspaceStore()

  if (!isOpen) return null

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportEmptyTemplate = () => {
    const template = generateAIPromptTemplate()
    handleDownload('world-template.txt', template)
  }

  const exportCurrentWorld = () => {
    const data = { plotNodes, npcs, extras, locations }
    const template = generateAIPromptTemplate(data)
    handleDownload('world-export.txt', template)
  }

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson)
      importAIData(parsed)
      onClose()
    } catch (e) {
      alert('Ошибка при парсинге JSON')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-gray-900 p-6 text-white shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Управление данными / ИИ</h2>
        
        <div className="mb-6 space-y-4">
          <div className="rounded border border-gray-700 p-4">
            <h3 className="mb-2 font-semibold">1. Экспорт пустого шаблона</h3>
            <button onClick={exportEmptyTemplate} className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700">Скачать шаблон</button>
          </div>

          <div className="rounded border border-gray-700 p-4">
            <h3 className="mb-2 font-semibold">2. Экспорт текущего мира</h3>
            <button onClick={exportCurrentWorld} className="rounded bg-green-600 px-4 py-2 hover:bg-green-700">Скачать данные мира</button>
          </div>

          <div className="rounded border border-gray-700 p-4">
            <h3 className="mb-2 font-semibold">3. Импорт данных</h3>
            <textarea 
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="mb-2 w-full rounded bg-gray-800 p-2 text-sm"
              rows={4}
              placeholder="Вставьте JSON сюда..."
            />
            <button onClick={handleImport} className="rounded bg-purple-600 px-4 py-2 hover:bg-purple-700">Загрузить</button>
          </div>
        </div>

        <button onClick={onClose} className="w-full rounded border border-gray-600 py-2 hover:bg-gray-800">Закрыть</button>
      </div>
    </div>
  )
}
