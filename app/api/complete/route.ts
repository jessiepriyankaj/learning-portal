import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || session.role === 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await req.json()
  const supabase = supabaseAdmin()

  // Check not already completed
  const { data: existing } = await supabase
    .from('completions')
    .select('id')
    .eq('user_id', session.id)
    .eq('course_id', courseId)
    .single()

  if (!existing) {
    // Save completion
    await supabase.from('completions').insert({
      user_id: session.id,
      course_id: courseId,
      completed_at: new Date().toISOString(),
    })

    // Send email notification to admin
    try {
      await resend.emails.send({
        from: 'POSH Portal <notifications@yourdomain.com>',
        to: process.env.ADMIN_EMAIL!,
        subject: `✅ ${session.name} completed POSH training`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
            <h2 style="color: #185FA5;">Training Completed</h2>
            <p><strong>${session.name}</strong> from <strong>${session.company || 'N/A'}</strong> has successfully completed the POSH training.</p>
            <table style="width:100%; border-collapse: collapse; margin-top: 1rem;">
              <tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #eee;">Employee</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.name}</td></tr>
              <tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #eee;">Username</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.username}</td></tr>
              <tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #eee;">Company</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.company || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #eee;">Course</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${courseId}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            </table>
            <p style="margin-top: 1.5rem; font-size: 13px; color: #999;">This is an automated notification from your POSH Training Portal.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Email failed:', emailErr)
    }
  }

  return NextResponse.json({ success: true })
}
