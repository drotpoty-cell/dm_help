import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Политика конфиденциальности — GM Assistant',
  description: 'Данные, которые собирает и хранит GM Assistant, и права пользователя.',
}

const CONTACT_EMAIL = 'dmitriy671games@list.ru'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-zinc-900 pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold text-zinc-100 mb-3">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

/**
 * Section 3.2 — Privacy Policy & Terms of Use. Обычная страница (не модалка) — доступна по
 * прямой ссылке /privacy с лендинга и из баннера согласия, без необходимости логиниться.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> На главную
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">Политика конфиденциальности</h1>
        <p className="text-xs text-zinc-600 mb-10">Действует для сайта GM Assistant (dm-help.vercel.app)</p>

        <div className="space-y-6">
          <Section title="Администратор и контакты">
            <p>
              Проект ведётся независимым разработчиком-энтузиастом как некоммерческий
              инструмент для личного использования. По вопросам обработки данных, запросам
              на просмотр, изменение или удаление ваших данных пишите на:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </Section>

          <Section title="Какие данные собираются">
            <p>Сайт хранит только то, что необходимо для работы самого инструмента:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Параметры ваших кампаний: карты, локации, персонажи, квесты, лут, тексты сюжета и заметки, которые вы вводите сами.</li>
              <li>Учётные данные входа (email), если вы регистрируетесь через Supabase Auth.</li>
              <li>Технические настройки браузера (личный тон ИИ, ширина панелей и т.п.) — хранятся локально в вашем браузере (localStorage) и не передаются на сервер.</li>
            </ul>
            <p>Мы не собираем данные для рекламы, аналитики поведения или продажи третьим лицам.</p>
          </Section>

          <Section title="Сторонние сервисы">
            <p>Для работы приложения используются следующие внешние провайдеры инфраструктуры:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li><span className="text-zinc-300 font-medium">Vercel</span> — хостинг и раздача самого приложения.</li>
              <li><span className="text-zinc-300 font-medium">Supabase</span> — база данных (хранение кампаний), аутентификация и файловое хранилище изображений.</li>
              <li>Если вы указываете собственный ключ API в настройках, запросы на генерацию текста уходят напрямую выбранному вами провайдеру ИИ (Google Gemini или OpenRouter) — подробности см. в предупреждении рядом с полем ключа в настройках приложения.</li>
            </ul>
          </Section>

          <Section title="Ваши права">
            <p>Вы можете в любой момент:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Посмотреть все данные своей кампании — они видны прямо в интерфейсе (Архив, Сюжет и т.д.).</li>
              <li>Изменить или удалить любую запись — штатными инструментами удаления в приложении.</li>
              <li>Полностью удалить кампанию целиком или запросить удаление своей учётной записи — напишите на контактный email выше.</li>
            </ul>
          </Section>

          <Section title="Фан-контент и интеллектуальная собственность">
            <p>
              GM Assistant — независимый некоммерческий инструмент для личного ведения
              настольных ролевых игр (в духе D&D и совместимых с OGL систем). Проект не
              аффилирован с Wizards of the Coast и другими правообладателями настольных
              систем, не претендует на их интеллектуальную собственность и не используется
              в коммерческих целях.
            </p>
          </Section>

          <Section title="Локальное хранилище и куки">
            <p>
              Приложение использует localStorage браузера (не рекламные куки) для личных
              настроек интерфейса и офлайн-кэша тяжёлых изображений тактических карт.
              Продолжая пользоваться сайтом после появления баннера согласия, вы соглашаетесь
              с этим использованием.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
