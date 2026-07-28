'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'gm-assistant:cookie-consent-accepted'

/**
 * Section 3.2 — Cookie & Local Storage Consent Banner.
 *
 * Показывается один раз при первом заходе (пока в localStorage браузера нет флага
 * принятия) и исчезает навсегда после нажатия «Принять». Намеренно НЕ блокирует
 * взаимодействие с остальным приложением (не модальное окно, не оверлей на весь экран) —
 * ненавязчивая плавающая плашка снизу, в духе остального тёмного минимализма продукта.
 *
 * Рендерится в корневом layout (app/layout.tsx), поэтому видна на любой странице сайта,
 * а не только внутри конкретной кампании.
 */
export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Читаем флаг только на клиенте (localStorage недоступен при серверном рендере) —
    // если его ещё нет, показываем баннер.
    // Section 1.2-style SSR-safety: localStorage недоступен при серверном рендере, поэтому
    // проверка идёт именно в эффекте (клиент-only), а не в ленивом useState(() => ...) —
    // иначе была бы hydration mismatch между SSR-разметкой (баннер скрыт) и клиентом.
    try {
      const accepted = window.localStorage.getItem(STORAGE_KEY)
      if (!accepted) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsVisible(true)
      }
    } catch {
      // localStorage может быть недоступен (приватный режим/ограничения браузера) —
      // в этом случае просто не показываем баннер, чтобы не блокировать доступ к сайту.
    }
  }, [])

  const handleAccept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // см. комментарий выше — если сохранить флаг не получилось, баннер просто покажется
      // снова в следующий раз, это не критично.
    }
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="text-xs text-neutral-400 leading-relaxed flex-1">
          Мы используем локальное хранилище и базы данных для сохранения ваших игровых
          кампаний и настроек. Продолжая использовать сайт, вы соглашаетесь на обработку
          данных. Контакты администратора:{' '}
          <a href="mailto:dmitriy671games@list.ru" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            dmitriy671games@list.ru
          </a>
          . Подробнее — в{' '}
          <a href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            политике конфиденциальности
          </a>
          .
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-950/40 transition-colors"
        >
          Принять
        </button>
      </div>
    </div>
  )
}
