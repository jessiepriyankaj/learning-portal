'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COURSES, CATEGORIES } from '@/lib/content'

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mm-bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--mm-pale)', borderTopColor: 'var(--mm-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#888', fontSize: 14 }}>Loading your courses...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const allowed = session?.allowed_courses || []
  const totalAllowed = allowed.length
  const totalCompleted = completions.filter((c: string) => allowed.includes(c)).length
  const pct = totalAllowed > 0 ? Math.round((totalCompleted / totalAllowed) * 100) : 0

  // Group courses by category, only show categories that have allowed courses
  const categoriesWithCourses = CATEGORIES.map(cat => ({
    ...cat,
    courses: COURSES.filter(c => c.category === cat.id),
  })).filter(cat => cat.courses.length > 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mm-bg)' }}>
      {/* Top accent */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, var(--mm-gold) 0%, var(--mm-light) 100%)' }} />

      {/* Nav */}
      <nav style={{ background: 'var(--mm-navy)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 38 38" fill="none">
                <path d="M19 3L35 12V26L19 35L3 26V12L19 3Z" stroke="#C9A84C" strokeWidth="2.5" fill="none"/>
                <circle cx="19" cy="19" r="5" fill="#C9A84C"/>
              </svg>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Merit Matters</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.06em' }}>LEARNING PORTAL</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Welcome, <strong style={{ color: '#fff' }}>{session?.name?.split(' ')[0]}</strong></span>
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Hero progress card */}
        <div style={{ background: 'linear-gradient(135deg, var(--mm-navy) 0%, var(--mm-blue) 100%)', borderRadius: 16, padding: '2rem', marginBottom: '2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Your learning progress</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{pct}% Complete</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{totalCompleted} of {totalAllowed} assigned course{totalAllowed !== 1 ? 's' : ''} completed</p>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--mm-gold), #e8c56a)', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{totalAllowed - totalCompleted} course{totalAllowed - totalCompleted !== 1 ? 's' : ''} remaining</p>
          </div>
        </div>

        {/* Courses by category */}
        {categoriesWithCourses.map(cat => (
          <div key={cat.id} style={{ marginBottom: '2rem' }}>
            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <div style={{ width: 4, height: 20, background: 'var(--mm-blue)', borderRadius: 99 }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--mm-navy)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat.label}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {cat.courses.map(course => {
                const isAllowed = allowed.includes(course.id)
                const isDone = completions.includes(course.id)
                return (
                  <div
                    key={course.id}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      opacity: isAllowed ? 1 : 0.45,
                      cursor: isAllowed && !isDone ? 'pointer' : 'default',
                      transition: 'box-shadow 0.15s, transform 0.15s',
                      borderLeft: `3px solid ${isAllowed ? 'var(--mm-blue)' : 'var(--mm-border)'}`,
                    }}
                    onMouseEnter={e => { if (isAllowed && !isDone) { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(27,79,138,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = '' }}
                    onClick={() => isAllowed && !isDone && router.push(`/course/${course.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: isAllowed ? 'var(--mm-pale)' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {isAllowed ? '📘' : '🔒'}
                      </div>
                      {isDone && <span className="badge-success">✓ Done</span>}
                      {!isDone && !isAllowed && <span className="badge-locked">Locked</span>}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--mm-navy)', marginBottom: 4, lineHeight: 1.3 }}>{course.title}</p>
                    <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 10 }}>{course.subtitle}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#aaa' }}>⏱ {course.duration}</span>
                      {isAllowed && !isDone && (
                        <span style={{ fontSize: 12, color: 'var(--mm-blue)', fontWeight: 600 }}>Start →</span>
                      )}
                      {isDone && (
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/course/${course.id}`) }}
                          style={{ fontSize: 11, color: 'var(--mm-green)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >View certificate</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ background: 'var(--mm-navy)', marginTop: '2rem', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>© {new Date().getFullYear()} Merit Matters — Skills &amp; Spirits › Future Perfect &nbsp;|&nbsp; Bengaluru, India</p>
      </div>
    </div>
  )
}
