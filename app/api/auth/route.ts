import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  // Check if admin
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const cookieStore = cookies()
    cookieStore.set('posh_session', JSON.stringify({ role: 'admin', username: 'admin', name: 'Admin' }), {
      httpOnly: true, maxAge: 60 * 60 * 8, path: '/',
    })
    return NextResponse.json({ success: true, role: 'admin' })
  }

  // Check employee in Supabase
  const supabase = supabaseAdmin()
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase().trim())
    .eq('password', password)
    .single()

  if (error || !user) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const cookieStore = cookies()
  cookieStore.set('posh_session', JSON.stringify({
    role: 'employee',
    id: user.id,
    username: user.username,
    name: user.name,
    company: user.company,
    allowed_courses: user.allowed_courses || [],
  }), { httpOnly: true, maxAge: 60 * 60 * 8, path: '/' })

  return NextResponse.json({ success: true, role: 'employee' })
}

export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete('posh_session')
  return NextResponse.json({ success: true })
}
