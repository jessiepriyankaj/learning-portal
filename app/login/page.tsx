'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(data.role === 'admin' ? '/admin' : '/dashboard')
      } else {
        setError('Invalid username or password. Please try again.')
      }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mm-navy)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--mm-gold) 0%, var(--mm-light) 100%)' }} />

      {/* Logo area */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 16 }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <path d="M19 3L35 12V26L19 35L3 26V12L19 3Z" stroke="#C9A84C" strokeWidth="2" fill="none"/>
            <path d="M19 9L29 15V23L19 29L9 23V15L19 9Z" fill="rgba(201,168,76,0.2)" stroke="#C9A84C" strokeWidth="1.5"/>
            <circle cx="19" cy="19" r="4" fill="#C9A84C"/>
          </svg>
        </div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Merit Matters</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Learning Portal</p>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--mm-navy)', marginBottom: 6 }}>Sign in to your account</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: '1.75rem' }}>Credentials are provided by your administrator</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mm-navy)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" required autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mm-navy)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          {error && (
            <p style={{ color: 'var(--mm-red)', fontSize: 13, background: 'var(--mm-red-lt)', padding: '8px 12px', borderRadius: 8, border: '0.5px solid #f7c1c1' }}>{error}</p>
          )}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '12px', fontSize: 15, background: 'var(--mm-navy)' }}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: '2rem' }}>
        © {new Date().getFullYear()} Merit Matters — Skills &amp; Spirits › Future Perfect
      </p>
    </div>
  )
}
