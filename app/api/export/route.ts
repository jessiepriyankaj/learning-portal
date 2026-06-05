import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET() {
  const session = getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = supabaseAdmin()
  const { data: users } = await supabase.from('users').select('*')
  const { data: completions } = await supabase.from('completions').select('*')

  const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]))

  const rows = (completions || []).map((c: any) => {
    const u = userMap[c.user_id] || {}
    return {
      'Employee Name': u.name || '',
      'Username': u.username || '',
      'Company': u.company || '',
      'Course ID': c.course_id,
      'Course Name': c.course_id === 'posh-basic' ? 'POSH Awareness Training' : 'ICC Committee Training',
      'Completed On': new Date(c.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Note': 'No completions yet' }])
  XLSX.utils.book_append_sheet(wb, ws, 'Completions')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="posh-completions-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
