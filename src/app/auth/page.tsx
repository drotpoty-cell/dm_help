'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (action: 'login' | 'signup') => {
    setLoading(true)
    setError(null)
    
    try {
      if (action === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Успешно! Теперь войдите с этими данными.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/hub') // Перекидываем в Дашборд после входа
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-100">
          GM's Second Brain
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex gap-4">
              <button
                onClick={() => handleAuth('login')}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Войти
              </button>
              <button
                onClick={() => handleAuth('signup')}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-zinc-600 rounded-md shadow-sm text-sm font-medium text-zinc-300 bg-transparent hover:bg-zinc-800 focus:outline-none"
              >
                Регистрация
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}