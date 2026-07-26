import { toast } from 'sonner'

/**
 * Замена window.confirm() красивым неблокирующим тостом sonner с кнопками
 * "подтвердить"/"отмена" (Блок 4, п.6 — унификация уведомлений).
 *
 * ВАЖНО: в отличие от window.confirm(), это НЕ блокирует выполнение кода — onConfirm
 * вызывается асинхронно по клику. Так что `if (!confirmToast(...)) return` не работает;
 * весь код, который раньше шёл ПОСЛЕ confirm(), нужно перенести внутрь onConfirm.
 */
export function confirmToast(
  message: string,
  onConfirm: () => void,
  options?: { confirmLabel?: string; description?: string }
) {
  toast(message, {
    description: options?.description,
    duration: 8000,
    action: {
      label: options?.confirmLabel || 'Удалить',
      onClick: onConfirm,
    },
    cancel: {
      label: 'Отмена',
      onClick: () => {},
    },
  })
}
