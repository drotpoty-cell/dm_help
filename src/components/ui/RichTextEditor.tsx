'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useEditor, EditorContent, ReactRenderer, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useMentionableEntities, type MentionableEntity } from '@/hooks/useMentionableEntities'

// ---------------------------------------------------------------------------
// Выпадающий список автокомплита @mention
// ---------------------------------------------------------------------------
const MentionList = forwardRef(function MentionList(
  props: { items: MentionableEntity[]; command: (item: { id: string; label: string }) => void },
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  useEffect(() => setSelectedIndex(0), [props.items])

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) props.command({ id: item.id, label: item.name })
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + props.items.length - 1) % props.items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % props.items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (props.items.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl px-3 py-2 text-xs text-zinc-500">
        Ничего не найдено
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1 max-h-64 overflow-y-auto w-64">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
            index === selectedIndex ? 'bg-indigo-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          <span>{item.icon}</span>
          <span className="truncate">{item.name}</span>
        </button>
      ))}
    </div>
  )
})

/**
 * Конфигурация suggestion для Mention-расширения Tiptap. Без tippy.js — позиционируем
 * всплывающий список вручную через clientRect(), которую даёт сам Tiptap, чтобы не тащить
 * лишнюю зависимость ради простого автокомплита.
 *
 * entitiesRef — реф, а не массив: живой список кандидатов должен быть актуален прямо в
 * момент открытия автокомплита (например, если ГМ только что создал нового персонажа),
 * без пересоздания редактора (и потери фокуса/курсора) при каждом изменении Архива.
 */
function createMentionSuggestion(entitiesRef: React.MutableRefObject<MentionableEntity[]>) {
  return {
    items: ({ query }: { query: string }) => {
      const q = query.toLowerCase()
      return entitiesRef.current.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 8)
    },
    render: () => {
      let component: ReactRenderer<any>
      let popup: HTMLDivElement | null = null

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, { props, editor: props.editor })
          popup = document.createElement('div')
          popup.style.position = 'fixed'
          popup.style.zIndex = '9999'
          document.body.appendChild(popup)
          popup.appendChild(component.element)
          const rect = props.clientRect?.()
          if (rect && popup) {
            popup.style.left = `${rect.left}px`
            popup.style.top = `${rect.bottom + 4}px`
          }
        },
        onUpdate: (props: any) => {
          component.updateProps(props)
          const rect = props.clientRect?.()
          if (rect && popup) {
            popup.style.left = `${rect.left}px`
            popup.style.top = `${rect.bottom + 4}px`
          }
        },
        onKeyDown: (props: any) => {
          if (props.event.key === 'Escape') {
            popup?.remove()
            return true
          }
          return (component.ref as any)?.onKeyDown(props) ?? false
        },
        onExit: () => {
          popup?.remove()
          popup = null
          component.destroy()
        },
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Мини-тулбар форматирования
// ---------------------------------------------------------------------------
function ToolbarButton({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // не отбирать фокус у редактора при клике
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  return (
    <div className="flex items-center gap-0.5 border-b border-zinc-800 px-2 py-1 bg-zinc-950/60 rounded-t-lg">
      <ToolbarButton title="Жирный" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarButton>
      <ToolbarButton title="Курсив" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolbarButton>
      <ToolbarButton title="Заголовок" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H</ToolbarButton>
      <ToolbarButton title="Список" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolbarButton>
      <ToolbarButton title="Цитата" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;</ToolbarButton>
      <span className="ml-auto text-[9px] text-zinc-600 pr-2 font-bold uppercase tracking-widest">@ для упоминания</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Сам редактор
// ---------------------------------------------------------------------------
interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  /** Если не передан, читается из глобального displayMode (режим показа игрокам = read-only). */
  editable?: boolean
  showToolbar?: boolean
}

export function RichTextEditor({
  content, onChange, placeholder, minHeight = '150px', editable, showToolbar = true,
}: RichTextEditorProps) {
  const setViewedEntityId = useWorkspaceStore((s) => s.setViewedEntityId)
  const isPlayerMode = useWorkspaceStore((s) => s.displayMode === 'player')
  const isEditable = editable ?? !isPlayerMode

  const entities = useMentionableEntities()
  const entitiesRef = useRef(entities)
  entitiesRef.current = entities

  const suggestionRef = useRef(createMentionSuggestion(entitiesRef))

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || 'Начните печатать...' }),
      Mention.configure({
        HTMLAttributes: { class: 'mention', 'data-type': 'mention' },
        suggestion: suggestionRef.current,
      }),
    ],
    content,
    editable: isEditable,
    editorProps: {
      attributes: {
        class: 'tiptap-content prose-sm max-w-none focus:outline-none text-zinc-300 leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  })

  // Синхронизация editable-состояния без пересоздания редактора (GM/Player переключатель).
  useEffect(() => {
    if (editor && editor.isEditable !== isEditable) editor.setEditable(isEditable)
  }, [editor, isEditable])

  // Синхронизация внешних изменений content (например, применение результата AiWand),
  // но только если это действительно внешнее изменение — иначе была бы петля с onUpdate.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor])

  const handleClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-type="mention"]')
    if (target) {
      const id = target.getAttribute('data-id')
      if (id) setViewedEntityId(id)
    }
  }

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-950/80 overflow-hidden focus-within:border-indigo-500 transition-colors">
      {showToolbar && isEditable && <Toolbar editor={editor} />}
      <div onClick={handleClick} style={{ minHeight }} className="px-4 py-3 cursor-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
