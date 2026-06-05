'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, LogOut, Plus, Trash2, Download, Edit2, CheckCircle, X, Users, BarChart2 } from 'lucide-react'
import { COURSES } from '@/lib/content'

type User = {
  id: string; username: string; name: string; company: string;
  password: string; allowed_courses: string[]
}
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

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const res = await fetch('/api/users')
    if (res.status === 401) { router.push('/login'); return }
    const d = await res.json()
    setUsers(d.users || [])
    setCompletions(d.completions || [])
    setLoading(false)
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  function openAdd() {
    setEditUser(null)
    setForm({ name: '', username: '', password: '', company: '', allowed_courses: [] })
    setError('')
    setShowForm(true)
  }

  function openEdit(u: User) {
    setEditUser(u)
    setForm({ name: u.name, username: u.username, password: u.password, company: u.company, allowed_courses: u.allowed_courses || [] })
    setError('')
    setShowForm(true)
  }

  async function saveUser() {
    if (!form.name || !form.username || !form.password) { setError('Name, username and password are required.'); return }
    setSaving(true); setError('')
    if (editUser) {
      const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editUser.id, ...form }) })
      const d = await res.json()
      if (d.error) { setError(d.error); setSaving(false); return }
    } else {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (d.error) { setError(d.error); setSaving(false); return }
    }
    setSaving(false); setShowForm(false)
    loadData()
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete ${name}? This will also remove their completion records.`)) return
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadData()
  }

  function toggleCourse(courseId: string) {
    setForm(f => ({
      ...f,
      allowed_courses: f.allowed_courses.includes(courseId)
        ? f.allowed_courses.filter(c => c !== courseId)
        : [...f.allowed_courses, courseId]
    }))
  }

  function getCompletion(userId: string, courseId: string) {
    return completions.find(c => c.user_id === userId && c.course_id === courseId)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6' }}>
      <p style={{ color: '#888' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6' }}>
      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e0e0dc', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} color="#185FA5" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>POSH Portal — Admin</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/api/export" download style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }}>
                <Download size={14} /> Export Excel
              </button>
            </a>
            <button className="btn-secondary" onClick={logout} style={{ fontSize: 13, padding: '6px 14px' }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '1.5rem' }}>
          {[
            { label: 'Total employees', value: users.length, icon: <Users size={18} color="#185FA5" /> },
            { label: 'Completions', value: completions.length, icon: <CheckCircle size={18} color="#3B6D11" /> },
            { label: 'Completion rate', value: users.length > 0 ? Math.round((completions.filter((c,i,a)=>a.findIndex(x=>x.user_id===c.user_id)===i).length/users.length)*100)+'%' : '0%', icon: <BarChart2 size={18} color="#854F0B" /> },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>{s.icon}<span style={{ fontSize: 13, color: '#666' }}>{s.label}</span></div>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid #e0e0dc', marginBottom: '1.5rem' }}>
          {(['users', 'reports'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? '#185FA5' : '#666', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid #185FA5' : '2px solid transparent', marginBottom: -1,
            }}>
              {t === 'users' ? 'Manage Employees' : 'Completion Report'}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add employee</button>
            </div>
            {users.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                No employees yet. Click "Add employee" to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {users.map(u => (
                  <div key={u.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#185FA5', flexShrink: 0 }}>
                      {u.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</p>
                      <p style={{ fontSize: 12, color: '#888' }}>{u.username} · {u.company || '—'}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {COURSES.map(c => {
                          const allowed = (u.allowed_courses || []).includes(c.id)
                          const done = getCompletion(u.id, c.id)
                          if (!allowed) return null
                          return (
                            <span key={c.id} className={done ? 'badge-success' : 'badge-pending'}>
                              {done ? '✓' : '○'} {c.title.replace(' Training','')}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => openEdit(u)}><Edit2 size={14} /></button>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13, color: '#A32D2D', borderColor: '#F7C1C1' }} onClick={() => deleteUser(u.id, u.name)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reports tab */}
        {tab === 'reports' && (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e0e0dc' }}>
                  {['Employee', 'Company', 'Course', 'Status', 'Completed On'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#888', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.flatMap(u =>
                  (u.allowed_courses || []).map(courseId => {
                    const done = getCompletion(u.id, courseId)
                    const course = COURSES.find(c => c.id === courseId)
                    return (
                      <tr key={`${u.id}-${courseId}`} style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 500 }}>{u.name}</td>
                        <td style={{ padding: '10px 16px', color: '#666' }}>{u.company || '—'}</td>
                        <td style={{ padding: '10px 16px', color: '#666' }}>{course?.title}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span className={done ? 'badge-success' : 'badge-pending'}>{done ? 'Completed' : 'Pending'}</span>
                        </td>
                        <td style={{ padding: '10px 16px', color: '#666' }}>
                          {done ? new Date(done.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{editUser ? 'Edit employee' : 'Add new employee'}</h3>
              <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Full name', key: 'name', placeholder: 'e.g. Priya Sharma', type: 'text' },
                { label: 'Username', key: 'username', placeholder: 'e.g. priya.sharma', type: 'text' },
                { label: 'Password', key: 'password', placeholder: 'Set a password for them', type: 'text' },
                { label: 'Company / Organisation', key: 'company', placeholder: 'e.g. Acme Pvt Ltd', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 8 }}>Assign courses</label>
                {COURSES.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `0.5px solid ${form.allowed_courses.includes(c.id) ? '#378ADD' : '#e0e0dc'}`, borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: form.allowed_courses.includes(c.id) ? '#E6F1FB' : '#fff' }}>
                    <input type="checkbox" checked={form.allowed_courses.includes(c.id)} onChange={() => toggleCourse(c.id)} style={{ width: 16, height: 16 }} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{c.title}</p>
                      <p style={{ fontSize: 12, color: '#888' }}>{c.subtitle}</p>
                    </div>
                  </label>
                ))}
              </div>
              {error && <p style={{ color: '#A32D2D', fontSize: 13, background: '#FCEBEB', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}
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
