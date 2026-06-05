import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

function requireAdmin() {
  const session = getSession()
  if (!session || session.role !== 'admin') return false
  return true
}

// GET all users with their completions
export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = supabaseAdmin()
  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  const { data: completions } = await supabase.from('completions').select('*')
  return NextResponse.json({ users: users || [], completions: completions || [] })
}

// POST create new user
export async function POST(req: NextRequest) {
  if (!requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const supabase = supabaseAdmin()
  const { data, error } = await supabase.from('users').insert({
    username: body.username.toLowerCase().trim(),
    password: body.password,
    name: body.name,
    company: body.company,
    allowed_courses: body.allowed_courses || [],
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data })
}

// DELETE user
export async function DELETE(req: NextRequest) {
  if (!requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const supabase = supabaseAdmin()
  await supabase.from('completions').delete().eq('user_id', id)
  await supabase.from('users').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

// PATCH update user (edit allowed_courses or reset password)
export async function PATCH(req: NextRequest) {
  if (!requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  const supabase = supabaseAdmin()
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data })
}
