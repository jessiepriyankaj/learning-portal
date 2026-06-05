'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, LogOut, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import { COURSES } from '@/lib/content'

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [completions, setCompletions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return }
      setSession(d.user)
      setCompletions(d.completions || [])
      setLoading(false)
    })
  }, [])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6' }}>
      <p style={{ color: '#888' }}>Loading...</p>
    </div>
  )

  const allowed = session?.allowed_courses || []
  const totalAllowed = allowed.length
  const totalCompleted = completions.filter(c => allowed.includes(c)).length
  const pct = totalAllowed > 0 ? Math.round((totalCompleted / totalAllowed) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6' }}>
      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e0e0dc', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} color="#185FA5" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>POSH Training Portal</span>
          </div>
          <button className="btn-secondary" onClick={logout} style={{ fontSize: 13, padding: '6px 14px' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Welcome, {session?.name?.split(' ')[0]}</h2>
          <p style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{session?.company || 'Your assigned training courses are listed below'}</p>
        </div>

        {/* Progress */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#666' }}>Overall progress</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: '#eee', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#378ADD', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
          <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
            {totalCompleted} of {totalAllowed} course{totalAllowed !== 1 ? 's' : ''} completed
          </p>
        </div>

        {/* Courses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {COURSES.map(course => {
            const isAllowed = allowed.includes(course.id)
            const isDone = completions.includes(course.id)
            return (
              <div
                key={course.id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex', alignItems: 'center', gap: 16,
                  opacity: isAllowed ? 1 : 0.5,
                  cursor: isAllowed && !isDone ? 'pointer' : 'default',
                }}
                onClick={() => isAllowed && !isDone && router.push(`/course/${course.id}`)}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: isAllowed ? '#E6F1FB' : '#f0f0ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isAllowed ? <Shield size={22} color="#185FA5" /> : <Lock size={20} color="#aaa" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{course.title}</p>
                  <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{course.subtitle}</p>
                  <p style={{ fontSize: 12, color: '#aaa', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {course.duration}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {isDone ? (
                    <span className="badge-success"><CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />Completed</span>
                  ) : isAllowed ? (
                    <button className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }}
                      onClick={e => { e.stopPropagation(); router.push(`/course/${course.id}`) }}>
                      Start <ChevronRight size={14} />
                    </button>
                  ) : (
                    <span className="badge-locked">Not assigned</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
