import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase-клиент для серверного кода (Route Handlers, Server Components).
 * В отличие от utils/supabase/client.ts, умеет читать cookie сессии пользователя,
 * что нужно, чтобы API-роуты могли проверять, что запрос пришёл от авторизованного
 * пользователя, а не от произвольного анонимного клиента.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // setAll может быть вызван из Server Component, где нельзя писать cookie —
            // это безопасно игнорировать, если рядом есть middleware, обновляющий сессию.
          }
        },
      },
    }
  )
}
