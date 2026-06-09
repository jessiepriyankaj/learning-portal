'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SLIDES, COURSES, getRandomQuestions } from '@/lib/content'

type Screen = 'slides' | 'quiz' | 'result' | 'certificate' | 'locked'

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const course = COURSES.find(c => c.id === courseId)

  const [session, setSession] = useState<any>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [screen, setScreen] = useState<Screen>('slides')
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [attemptsToday, setAttemptsToday] = useState(0)
  const [nextResetIn, setNextResetIn] = useState('')
  const [loading, setLoading] = useState(true)
  const certRef = useRef<HTMLDivElement>(null)

  const courseSlides = SLIDES[courseId] || []
  const MAX_ATTEMPTS = 3

  useEffect(() => {
    async function init() {
      const me = await fetch('/api/users/me').then(r => r.json())
      if (!me.user) { router.push('/login'); return }
      const allowed = me.user.allowed_courses || []
      if (!allowed.includes(courseId)) { router.push('/dashboard'); return }
      setSession(me.user)

      if ((me.completions || []).includes(courseId)) {
        setAlreadyDone(true); setScreen('certificate'); setLoading(false); return
      }

      const att = await fetch(`/api/attempts?courseId=${courseId}`).then(r => r.json())
      const count = (att.attempts || []).length
      setAttemptsToday(count)

      if (count >= MAX_ATTEMPTS) {
        // calculate reset time
        const oldest = att.attempts[att.attempts.length - 1]
        const resetAt = new Date(new Date(oldest.attempted_at).getTime() + 24 * 60 * 60 * 1000)
        const diff = resetAt.getTime() - Date.now()
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        setNextResetIn(`${h}h ${m}m`)
        setScreen('locked')
      }
      setLoading(false)
    }
    init()
  }, [])

  function startQuiz() {
    setQuestions(getRandomQuestions(courseId, 8))
    setAnswers({})
    setScreen('quiz')
  }

  async function submitQuiz() {
    if (Object.keys(answers).length < questions.length) { alert('Please answer all questions.'); return }
    let s = 0
    questions.forEach((q: any, i: number) => { if (answers[i] === q.correct) s++ })
    setScore(s)
    const passed = (s / questions.length) >= 0.75

    setSubmitting(true)
    await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, score: s, total: questions.length, passed }),
    })
    setAttemptsToday(a => a + 1)

    if (passed && !alreadyDone) {
      await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      setAlreadyDone(true)
    }
    setSubmitting(false)
    setScreen('result')
  }

  async function downloadCert() {
    if (!certRef.current) return
    // dynamic import html2canvas
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' })
    const link = document.createElement('a')
    link.download = `${session?.name?.replace(/\s/g,'_')}_${courseId}_certificate.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mm-bg)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--mm-pale)', borderTopColor: 'var(--mm-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const slide = courseSlides[slideIndex]
  const passed = questions.length > 0 && (score / questions.length) >= 0.75
  const attemptsLeft = MAX_ATTEMPTS - attemptsToday

  function Nav() {
    return (
      <div>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--mm-gold) 0%, var(--mm-light) 100%)' }} />
        <nav style={{ background: 'var(--mm-navy)', padding: '0 2rem' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 15 }}>{course?.title}</span>
          </div>
        </nav>
      </div>
    )
  }

  // LOCKED SCREEN
  if (screen === 'locked') return (
    <div style={{ minHeight: '100vh', background: 'var(--mm-bg)' }}>
      <Nav />
      <div style={{ maxWidth: 500, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: '#FDF3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: 32 }}>⏳</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--mm-navy)', marginBottom: 8 }}>3 attempts used today</h2>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7 }}>You have used all 3 quiz attempts allowed in a 24-hour period. Your attempts will reset in approximately <strong>{nextResetIn}</strong>.</p>
        <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>Use this time to review the course material again before your next attempt.</p>
        <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => { setScreen('slides'); setSlideIndex(0) }}>📖 Review slides</button>
      </div>
    </div>
  )

  // SLIDES SCREEN
  if (screen === 'slides') return (
    <div style={{ minHeight: '100vh', background: 'var(--mm-bg)' }}>
      <Nav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: 4, background: 'var(--mm-border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((slideIndex + 1) / courseSlides.length) * 100}%`, background: 'var(--mm-blue)', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>Slide {slideIndex + 1} / {courseSlides.length}</span>
        </div>

        {/* Slide */}
        {slide && (
          <div className="card" style={{ padding: '2.5rem', minHeight: 320, marginBottom: '1.5rem', borderTop: '3px solid var(--mm-blue)' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: slide.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {['📘','⚠️','🏢','👥','📋','🤝','🛡️','⭐','🚩','🔒','📄','✅','✏️','🧠','💼','🏦','🎧','🩺'][slideIndex % 18]}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--mm-navy)', marginBottom: 16 }}>{slide.heading}</h2>
                <div style={{ fontSize: 14, color: 'var(--mm-sub)', lineHeight: 1.85 }}>
                  {slide.body.split('\n').map((line: string, i: number) => (
                    <p key={i} style={{ marginBottom: line === '' ? 10 : 5 }}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-secondary" style={{ visibility: slideIndex === 0 ? 'hidden' : 'visible' }} onClick={() => setSlideIndex(i => i - 1)}>← Previous</button>
          <div style={{ display: 'flex', gap: 5 }}>
            {courseSlides.map((_: any, i: number) => (
              <div key={i} onClick={() => setSlideIndex(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: i === slideIndex ? 'var(--mm-blue)' : 'var(--mm-border)', cursor: 'pointer', transition: 'background 0.2s' }} />
            ))}
          </div>
          {slideIndex < courseSlides.length - 1 ? (
            <button className="btn-primary" onClick={() => setSlideIndex(i => i + 1)}>Next →</button>
          ) : (
            <button className="btn-primary" onClick={startQuiz} disabled={attemptsLeft <= 0 && !alreadyDone}>
              {attemptsLeft > 0 ? `Take Quiz (${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left)` : 'No attempts left'}
            </button>
          )}
        </div>

        {/* Attempts warning */}
        {attemptsLeft <= 1 && attemptsLeft > 0 && !alreadyDone && (
          <div style={{ marginTop: '1rem', background: '#FDF3DC', border: '0.5px solid #e8d08a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#7a5a1a', textAlign: 'center' }}>
            ⚠️ You have <strong>{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''}</strong> remaining today. Use them wisely!
          </div>
        )}
      </div>
    </div>
  )

  // QUIZ SCREEN
  if (screen === 'quiz') return (
    <div style={{ minHeight: '100vh', background: 'var(--mm-bg)' }}>
      <Nav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--mm-navy)' }}>Knowledge Check</h2>
          <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Answer all {questions.length} questions — you need 75% to pass. Questions are randomised each attempt.</p>
        </div>

        {questions.map((q: any, qi: number) => (
          <div key={qi} className="card" style={{ padding: '1.5rem', marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--mm-navy)', marginBottom: 14 }}>
              <span style={{ background: 'var(--mm-pale)', color: 'var(--mm-blue)', padding: '2px 8px', borderRadius: 6, fontSize: 12, marginRight: 8 }}>Q{qi + 1}</span>
              {q.q}
            </p>
            {q.options.map((opt: string, oi: number) => (
              <label key={oi} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                border: `1.5px solid ${answers[qi] === oi ? 'var(--mm-blue)' : 'var(--mm-border)'}`,
                borderRadius: 8, marginBottom: 8, cursor: 'pointer', fontSize: 14,
                background: answers[qi] === oi ? 'var(--mm-pale)' : '#fff',
                transition: 'all 0.15s', color: answers[qi] === oi ? 'var(--mm-navy)' : 'var(--mm-sub)',
                fontWeight: answers[qi] === oi ? 600 : 400,
              }}>
                <input type="radio" name={`q${qi}`} checked={answers[qi] === oi}
                  onChange={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                  style={{ accentColor: 'var(--mm-blue)', width: 16, height: 16 }} />
                {opt}
              </label>
            ))}
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={() => { setSlideIndex(0); setScreen('slides') }}>← Back to slides</button>
          <button className="btn-primary" onClick={submitQuiz} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit answers'}</button>
        </div>
      </div>
    </div>
  )

  // RESULT SCREEN
  if (screen === 'result') return (
    <div style={{ minHeight: '100vh', background: 'var(--mm-bg)' }}>
      <Nav />
      <div style={{ maxWidth: 540, margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: passed ? 'var(--mm-green-lt)' : 'var(--mm-red-lt)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', fontSize: 36
        }}>{passed ? '🎉' : '😔'}</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: passed ? 'var(--mm-green)' : 'var(--mm-red)', marginBottom: 8 }}>
          {passed ? 'Congratulations!' : 'Keep going!'}
        </h2>
        <p style={{ fontSize: 16, color: '#444', marginBottom: 6 }}>
          You scored <strong>{score}/{questions.length}</strong> ({Math.round((score / questions.length) * 100)}%)
        </p>
        <p style={{ fontSize: 14, color: '#888', marginBottom: '2rem' }}>
          {passed ? 'You have passed this training. Your certificate is ready.' :
           attemptsToday >= MAX_ATTEMPTS ? `You've used all 3 attempts for today. Come back tomorrow with fresh eyes!` :
           `You need 75% to pass. You have ${MAX_ATTEMPTS - attemptsToday} attempt${MAX_ATTEMPTS - attemptsToday !== 1 ? 's' : ''} remaining today.`}
        </p>

        {/* Score breakdown */}
        <div style={{ background: '#fff', border: '0.5px solid var(--mm-border)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          {questions.map((q: any, i: number) => {
            const correct = answers[i] === q.correct
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < questions.length - 1 ? '0.5px solid #f0f0ee' : 'none' }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{correct ? '✅' : '❌'}</span>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--mm-sub)', marginBottom: 2 }}>{q.q}</p>
                  {!correct && <p style={{ fontSize: 12, color: 'var(--mm-green)', fontWeight: 500 }}>Correct: {q.options[q.correct]}</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {passed ? (
            <button className="btn-primary" onClick={() => setScreen('certificate')}>🏆 View Certificate</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => { setSlideIndex(0); setScreen('slides') }}>📖 Review slides</button>
              {attemptsToday < MAX_ATTEMPTS && (
                <button className="btn-primary" onClick={startQuiz}>🔄 Retry quiz</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  // CERTIFICATE SCREEN
  return (
    <div style={{ minHeight: '100vh', background: 'var(--mm-bg)' }}>
      <Nav />
      <div style={{ maxWidth: 680, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--mm-navy)', marginBottom: 4 }}>Your Certificate</h2>
          <p style={{ fontSize: 13, color: '#888' }}>Download and share your achievement</p>
        </div>

        {/* Certificate — printable */}
        <div ref={certRef} style={{
          background: '#fff', border: '1px solid var(--mm-border)', borderRadius: 16, padding: '3rem',
          position: 'relative', overflow: 'hidden', fontFamily: 'Georgia, serif',
        }}>
          {/* Gold top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, var(--mm-gold), #e8c56a)' }} />
          {/* Navy bottom bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: 'var(--mm-navy)' }} />
          {/* Side accents */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--mm-navy)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, background: 'var(--mm-navy)' }} />

          {/* Watermark */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.04, pointerEvents: 'none' }}>
            <svg width="300" height="300" viewBox="0 0 38 38" fill="none">
              <path d="M19 1L37 11V27L19 37L1 27V11L19 1Z" stroke="#0B2545" strokeWidth="1" fill="#0B2545"/>
            </svg>
          </div>

          <div style={{ textAlign: 'center', position: 'relative' }}>
            {/* MM Logo */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem', background: 'var(--mm-navy)', padding: '10px 20px', borderRadius: 10 }}>
              <svg width="22" height="22" viewBox="0 0 38 38" fill="none">
                <path d="M19 3L35 12V26L19 35L3 26V12L19 3Z" stroke="#C9A84C" strokeWidth="2.5" fill="none"/>
                <circle cx="19" cy="19" r="5" fill="#C9A84C"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'sans-serif', letterSpacing: '-0.01em' }}>Merit Matters</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'sans-serif', letterSpacing: '0.06em' }}>SKILLS & SPIRITS › FUTURE PERFECT</p>
              </div>
            </div>

            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: 8 }}>Certificate of Completion</p>
            <p style={{ fontSize: 14, color: '#666', fontFamily: 'sans-serif', marginBottom: 20 }}>This is to certify that</p>

            <h1 style={{ fontSize: 34, fontWeight: 400, color: 'var(--mm-navy)', letterSpacing: '-0.01em', borderBottom: '2px solid var(--mm-gold)', paddingBottom: 12, marginBottom: 20, display: 'inline-block', minWidth: 300 }}>
              {session?.name}
            </h1>

            <p style={{ fontSize: 14, color: '#666', fontFamily: 'sans-serif', marginBottom: 8 }}>of <strong style={{ color: 'var(--mm-navy)' }}>{session?.company || 'your organisation'}</strong></p>
            <p style={{ fontSize: 14, color: '#666', fontFamily: 'sans-serif', marginBottom: 24 }}>has successfully completed</p>

            <div style={{ background: 'var(--mm-pale)', border: '1px solid var(--mm-border)', borderRadius: 10, padding: '14px 24px', display: 'inline-block', marginBottom: 24 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--mm-navy)', fontFamily: 'sans-serif' }}>{course?.title}</p>
              <p style={{ fontSize: 13, color: '#666', fontFamily: 'sans-serif', marginTop: 4 }}>{course?.subtitle}</p>
            </div>

            <p style={{ fontSize: 13, color: '#888', fontFamily: 'sans-serif', marginBottom: 28 }}>
              Issued on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {/* Signature line */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #ccc', paddingTop: 8, minWidth: 160 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mm-navy)', fontFamily: 'sans-serif' }}>Merit Matters</p>
                  <p style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif' }}>Authorised by</p>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #ccc', paddingTop: 8, minWidth: 160 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mm-navy)', fontFamily: 'sans-serif' }}>Certified Professional</p>
                  <p style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif' }}>Designation</p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 11, color: '#bbb', fontFamily: 'sans-serif', marginTop: 24, letterSpacing: '0.04em' }}>
              CERTIFIED BY MERIT MATTERS · meritmatters.in · BENGALURU, INDIA
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={downloadCert}>⬇ Download Certificate</button>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')}>← Back to dashboard</button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 12 }}>Certificate downloads as a high-resolution PNG image</p>
      </div>
    </div>
  )
}
