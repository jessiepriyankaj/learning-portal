import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ user: null })

  if (session.role === 'admin') {
    return NextResponse.json({ user: session, completions: [] })
  }

  const supabase = supabaseAdmin()
  const { data: completions } = await supabase
    .from('completions')
    .select('course_id')
    .eq('user_id', session.id)

  return NextResponse.json({
    user: session,
    completions: (completions || []).map((c: any) => c.course_id),
  })
}
