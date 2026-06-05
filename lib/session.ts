import { cookies } from 'next/headers'

export function getSession() {
  const cookieStore = cookies()
  const raw = cookieStore.get('posh_session')?.value
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}
