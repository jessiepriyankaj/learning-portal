import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

// GET: check attempts for a course in last 24hrs
export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })

  const supabase = supabaseAdmin()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', session.id)
    .eq('course_id', courseId)
    .gte('attempted_at', since)
    .order('attempted_at', { ascending: false })

  return NextResponse.json({ attempts: data || [] })
}

// POST: record a new attempt
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { courseId, score, total, passed } = await req.json()
  const supabase = supabaseAdmin()
  await supabase.from('quiz_attempts').insert({
    user_id: session.id,
    course_id: courseId,
    score,
    total,
    passed,
    attempted_at: new Date().toISOString(),
  })
  return NextResponse.json({ success: true })
}
