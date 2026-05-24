import Link from "next/link";
import { Sparkles, Map, Database, Scroll, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      
      {/* Навигация (Header) */}
      <header className="w-full max-w-6xl flex justify-between items-center p-6">
        <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Scroll className="w-4 h-4 text-white" />
          </div>
          GM Assistant
        </div>
        <Link 
          href="/auth" 
          className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Войти
        </Link>
      </header>

      {/* Главный экран (Hero Section) */}
      <main className="flex-1 w-full max-w-6xl flex flex-col items-center justify-center px-6 py-20 text-center">
        
        {/* Бейдж */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 mb-8">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Второй мозг для твоих D&D кампаний</span>
        </div>

        {/* Заголовок */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-6">
          Мастерская <br className="hidden md:block" /> Подземелий
        </h1>

        {/* Подзаголовок */}
        <p className="max-w-2xl text-lg md:text-xl text-zinc-400 leading-relaxed mb-10">
          Интерактивные карты, библиотека NPC, генерация лута и управление сюжетом в одном элегантном хабе. Вся кампания под полным контролем.
        </p>

        {/* Кнопка призыва к действию (CTA) */}
        <Link
          href="/auth"
          className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(79,70,229,0.2)] hover:shadow-[0_0_40px_rgba(79,70,229,0.4)]"
        >
          Начать приключение
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Сетка фичей (Features) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-32 text-left">
          <FeatureCard 
            icon={<Map className="w-6 h-6" />} 
            title="Интерактивные карты" 
            desc="Удобное управление локациями, расстановка токенов и трекинг перемещений партии в реальном времени." 
          />
          <FeatureCard 
            icon={<Database className="w-6 h-6" />} 
            title="Единая база знаний" 
            desc="Удобный архив квестов и персонажей. Вся история мира структурирована и всегда под рукой." 
          />
          <FeatureCard 
            icon={<Sparkles className="w-6 h-6" />} 
            title="Встроенный ИИ-ассистент" 
            desc="Генерируй лут, описывай локации и улучшай тексты на лету, не отрываясь от проведения сессии." 
          />
        </div>
      </main>

    </div>
  );
}

// Вспомогательный компонент для карточек
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700/50 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-zinc-800 text-indigo-400 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-zinc-100 mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}