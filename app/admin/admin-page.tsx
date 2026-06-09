'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COURSES, CATEGORIES } from '@/lib/content'

type User = { id: string; username: string; name: string; company: string; password: string; allowed_courses: string[] }
type Completion = { user_id: string; course_id: string; completed_at: string }

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'users' | 'reports'>('users')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', username: '', password: '', company: '', allowed_courses: [] as string[] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const res = await fetch('/api/users')
    if (res.status === 401) { router.push('/login'); return }
    const d = await res.json()
    setUsers(d.users || []); setCompletions(d.completions || []); setLoading(false)
  }

  async function logout() { await fetch('/api/auth', { method: 'DELETE' }); router.push('/login') }

  function openAdd() { setEditUser(null); setForm({ name: '', username: '', password: '', company: '', allowed_courses: [] }); setError(''); setShowForm(true) }
  function openEdit(u: User) { setEditUser(u); setForm({ name: u.name, username: u.username, password: u.password, company: u.company, allowed_courses: u.allowed_courses || [] }); setError(''); setShowForm(true) }

  async function saveUser() {
    if (!form.name || !form.username || !form.password) { setError('Name, username and password are required.'); return }
    setSaving(true); setError('')
    const method = editUser ? 'PATCH' : 'POST'
    const body = editUser ? { id: editUser.id, ...form } : form
    const res = await fetch('/api/users', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json()
    if (d.error) { setError(d.error); setSaving(false); return }
    setSaving(false); setShowForm(false); loadData()
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete ${name}? This removes all their data.`)) return
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadData()
  }

  function toggleCourse(courseId: string) {
    setForm(f => ({ ...f, allowed_courses: f.allowed_courses.includes(courseId) ? f.allowed_courses.filter(c => c !== courseId) : [...f.allowed_courses, courseId] }))
  }

  function toggleCategory(catId: string) {
    const catCourses = COURSES.filter(c => c.category === catId).map(c => c.id)
    const allSelected = catCourses.every(id => form.allowed_courses.includes(id))
    setForm(f => ({
      ...f,
      allowed_courses: allSelected
        ? f.allowed_courses.filter(id => !catCourses.includes(id))
        : Array.from(new Set([...f.allowed_courses, ...catCourses]))
    }))
  }

  const getCompletion = (userId: string, courseId: string) => completions.find(c => c.user_id === userId && c.course_id === courseId)

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.company?.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const totalAssigned = users.reduce((acc, u) => acc + (u.allowed_courses || []).length, 0)
  const totalCompleted = completions.length
  const uniqueCompleted = new Set(completions.map(c => c.user_id)).size

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mm-bg)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--mm-pale)', borderTopColor: 'var(--mm-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mm-bg)' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg, var(--mm-gold) 0%, var(--mm-light) 100%)' }} />
      <nav style={{ background: 'var(--mm-navy)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 38 38" fill="none"><path d="M19 3L35 12V26L19 35L3 26V12L19 3Z" stroke="#C9A84C" strokeWidth="2.5" fill="none"/><circle cx="19" cy="19" r="5" fill="#C9A84C"/></svg>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Merit Matters</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.08em' }}>ADMIN PANEL</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/api/export" download style={{ textDecoration: 'none' }}>
              <button style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '0.5px solid rgba(201,168,76,0.3)', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>⬇ Export Excel</button>
            </a>
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.15)', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '2rem' }}>
          {[
            { label: 'Employees', value: users.length, emoji: '👥' },
            { label: 'Courses Assigned', value: totalAssigned, emoji: '📚' },
            { label: 'Completions', value: totalCompleted, emoji: '✅' },
            { label: 'Employees Trained', value: uniqueCompleted, emoji: '🏆' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '1.25rem', borderTop: '3px solid var(--mm-blue)' }}>
              <p style={{ fontSize: 24, marginBottom: 4 }}>{s.emoji}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--mm-navy)' }}>{s.value}</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--mm-border)', marginBottom: '1.5rem' }}>
          {(['users', 'reports'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? 'var(--mm-blue)' : '#666', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
              borderBottom: tab === t ? '2px solid var(--mm-blue)' : '2px solid transparent', marginBottom: -1,
            }}>
              {t === 'users' ? '👥 Manage Employees' : '📊 Completion Report'}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Search by name, company or username..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 'auto', flex: 1, minWidth: 200, maxWidth: 360 }} />
              <button className="btn-primary" onClick={openAdd}>+ Add Employee</button>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                {search ? 'No employees match your search.' : 'No employees yet. Click "Add Employee" to get started.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredUsers.map(u => {
                  const userCompletions = completions.filter(c => c.user_id === u.id)
                  const userAllowed = (u.allowed_courses || []).length
                  const userDone = userCompletions.length
                  const pct = userAllowed > 0 ? Math.round((userDone / userAllowed) * 100) : 0
                  return (
                    <div key={u.id} className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--mm-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#fff', flexShrink: 0 }}>
                        {u.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--mm-navy)' }}>{u.name}</p>
                        <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{u.username} · {u.company || '—'}</p>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: '#888' }}>Progress</span>
                            <span style={{ fontSize: 11, color: '#888' }}>{userDone}/{userAllowed}</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--mm-border)', borderRadius: 99, overflow: 'hidden', width: 200 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--mm-green)' : 'var(--mm-blue)', borderRadius: 99 }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => openEdit(u)}>✏️ Edit</button>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13, color: 'var(--mm-red)', borderColor: '#f7c1c1' }} onClick={() => deleteUser(u.id, u.name)}>🗑</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Reports tab */}
        {tab === 'reports' && (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--mm-pale)' }}>
                  {['Employee', 'Company', 'Course', 'Category', 'Status', 'Completed On'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, color: 'var(--mm-navy)', fontWeight: 700, letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.flatMap(u =>
                  (u.allowed_courses || []).map(courseId => {
                    const done = getCompletion(u.id, courseId)
                    const course = COURSES.find(c => c.id === courseId)
                    const cat = CATEGORIES.find(c => c.id === course?.category)
                    return (
                      <tr key={`${u.id}-${courseId}`} style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--mm-navy)' }}>{u.name}</td>
                        <td style={{ padding: '10px 16px', color: '#666' }}>{u.company || '—'}</td>
                        <td style={{ padding: '10px 16px', color: '#444' }}>{course?.title}</td>
                        <td style={{ padding: '10px 16px' }}><span className="badge-cat">{cat?.label?.split(' ')[0]}</span></td>
                        <td style={{ padding: '10px 16px' }}><span className={done ? 'badge-success' : 'badge-pending'}>{done ? '✓ Completed' : '○ Pending'}</span></td>
                        <td style={{ padding: '10px 16px', color: '#666' }}>
                          {done ? new Date(done.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
                {users.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>No data yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--mm-navy)', marginTop: '3rem', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>© {new Date().getFullYear()} Merit Matters Learning Portal · Admin Panel</p>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,37,69,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--mm-navy)' }}>{editUser ? 'Edit employee' : 'Add new employee'}</h3>
              <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 18 }} onClick={() => setShowForm(false)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Full Name', key: 'name', placeholder: 'e.g. Priya Sharma' },
                { label: 'Username', key: 'username', placeholder: 'e.g. priya.sharma' },
                { label: 'Password', key: 'password', placeholder: 'Set a password for them' },
                { label: 'Company / Organisation', key: 'company', placeholder: 'e.g. Acme Pvt Ltd' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--mm-navy)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--mm-navy)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assign Courses</label>
                {CATEGORIES.map(cat => {
                  const catCourses = COURSES.filter(c => c.category === cat.id)
                  const allSelected = catCourses.every(c => form.allowed_courses.includes(c.id))
                  const someSelected = catCourses.some(c => form.allowed_courses.includes(c.id))
                  return (
                    <div key={cat.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }} onClick={() => toggleCategory(cat.id)}>
                        <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected }} onChange={() => toggleCategory(cat.id)} style={{ width: 15, height: 15, accentColor: 'var(--mm-navy)' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mm-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.label}</span>
                      </div>
                      <div style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {catCourses.map(c => (
                          <label key={c.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                            border: `0.5px solid ${form.allowed_courses.includes(c.id) ? 'var(--mm-blue)' : 'var(--mm-border)'}`,
                            borderRadius: 8, cursor: 'pointer', fontSize: 13,
                            background: form.allowed_courses.includes(c.id) ? 'var(--mm-pale)' : '#fff',
                          }}>
                            <input type="checkbox" checked={form.allowed_courses.includes(c.id)} onChange={() => toggleCourse(c.id)} style={{ width: 14, height: 14, accentColor: 'var(--mm-blue)' }} />
                            <span style={{ fontWeight: form.allowed_courses.includes(c.id) ? 600 : 400, color: 'var(--mm-navy)' }}>{c.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {error && <p style={{ color: 'var(--mm-red)', fontSize: 13, background: 'var(--mm-red-lt)', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}
              <button className="btn-primary" onClick={saveUser} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                {saving ? 'Saving...' : editUser ? 'Save changes' : 'Add employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
