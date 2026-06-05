'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError('Invalid username or password. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, background: '#E6F1FB', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Shield size={28} color="#185FA5" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>POSH Training Portal</h1>
          <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Sign in with credentials provided by your administrator</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <p style={{ color: '#A32D2D', fontSize: 13, background: '#FCEBEB', padding: '8px 12px', borderRadius: 8, border: '0.5px solid #F7C1C1' }}>
                {error}
              </p>
            )}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: '1.5rem' }}>
          Access is provided by your POSH consultant only
        </p>
      </div>
    </div>
  )
}
