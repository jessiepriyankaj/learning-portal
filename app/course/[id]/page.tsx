'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, AlertTriangle, Building, Users, Clipboard, Heart, CheckCircle, XCircle, Award } from 'lucide-react'
import { SLIDES, QUIZ, COURSES } from '@/lib/content'

const ICON_MAP: any = {
  'book-open': BookOpen, 'alert-triangle': AlertTriangle, 'building': Building,
  'users': Users, 'clipboard': Clipboard, 'heart-handshake': Heart,
}

type Screen = 'slides' | 'quiz' | 'result' | 'certificate'

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [session, setSession] = useState<any>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [screen, setScreen] = useState<Screen>('slides')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)

  const course = COURSES.find(c => c.id === courseId)

  useEffect(() => {
    fetch('/api/users/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return }
      const allowed = d.user.allowed_courses || []
      if (!allowed.includes(courseId)) { router.push('/dashboard'); return }
      setSession(d.user)
      if ((d.completions || []).includes(courseId)) {
        setAlreadyDone(true)
        setScreen('certificate')
      }
    })
  }, [])

  function formatBody(text: string) {
    return text.split('\n').map((line, i) => <p key={i} style={{ marginBottom: line === '' ? 8 : 4, lineHeight: 1.75 }}>{line}</p>)
  }

  async function submitQuiz() {
    if (Object.keys(answers).length < QUIZ.length) {
      alert('Please answer all questions before submitting.')
      return
    }
    let s = 0
    QUIZ.forEach((q, i) => { if (answers[i] === q.correct) s++ })
    setScore(s)
    setScreen('result')

    const passed = (s / QUIZ.length) >= 0.75
    if (passed && !alreadyDone) {
      setSubmitting(true)
      await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      setSubmitting(false)
    }
  }

  if (!session) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6' }}>
      <p style={{ color: '#888' }}>Loading...</p>
    </div>
  )

  const slide = SLIDES[slideIndex]
  const SlideIcon = ICON_MAP[slide?.icon] || BookOpen
  const passed = (score / QUIZ.length) >= 0.75

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6' }}>
      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e0e0dc', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{course?.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* SLIDES */}
        {screen === 'slides' && (
          <>
            {/* Dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
              {SLIDES.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === slideIndex ? '#378ADD' : '#ddd', transition: 'background 0.2s' }} />
              ))}
            </div>

            {/* Slide card */}
            <div className="card" style={{ padding: '2rem', minHeight: 280, marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: slide.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SlideIcon size={24} color={slide.iconColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 14 }}>{slide.heading}</h2>
                  <div style={{ fontSize: 14, color: '#444', lineHeight: 1.75 }}>{formatBody(slide.body)}</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-secondary" style={{ visibility: slideIndex === 0 ? 'hidden' : 'visible' }}
                onClick={() => setSlideIndex(i => i - 1)}>
                <ArrowLeft size={16} /> Previous
              </button>
              <span style={{ fontSize: 13, color: '#888' }}>Slide {slideIndex + 1} of {SLIDES.length}</span>
              {slideIndex < SLIDES.length - 1 ? (
                <button className="btn-primary" onClick={() => setSlideIndex(i => i + 1)}>
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn-primary" onClick={() => setScreen('quiz')}>
                  Take Quiz <ArrowRight size={16} />
                </button>
              )}
            </div>
          </>
        )}

        {/* QUIZ */}
        {screen === 'quiz' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Knowledge Check</h2>
              <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Answer all {QUIZ.length} questions. You need 75% to pass.</p>
            </div>
            {QUIZ.map((q, qi) => (
              <div className="card" key={qi} style={{ padding: '1.25rem 1.5rem', marginBottom: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>{qi + 1}. {q.q}</p>
                {q.options.map((opt, oi) => (
                  <label key={oi} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', border: `0.5px solid ${answers[qi] === oi ? '#378ADD' : '#e0e0dc'}`,
                    borderRadius: 8, marginBottom: 6, cursor: 'pointer', fontSize: 14,
                    background: answers[qi] === oi ? '#E6F1FB' : '#fff', transition: 'all 0.15s',
                  }}>
                    <input type="radio" name={`q${qi}`} value={oi}
                      checked={answers[qi] === oi}
                      onChange={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                      style={{ width: 16, height: 16 }} />
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => setScreen('slides')}>
                <ArrowLeft size={16} /> Back to slides
              </button>
              <button className="btn-primary" onClick={submitQuiz} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit answers'}
              </button>
            </div>
          </>
        )}

        {/* RESULT */}
        {screen === 'result' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: passed ? '#EAF3DE' : '#FCEBEB',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
            }}>
              {passed
                ? <CheckCircle size={36} color="#3B6D11" />
                : <XCircle size={36} color="#A32D2D" />
              }
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: passed ? '#3B6D11' : '#A32D2D' }}>
              {passed ? 'Congratulations!' : 'Not quite there yet'}
            </h2>
            <p style={{ fontSize: 15, color: '#666', marginTop: 8 }}>
              You scored {score}/{QUIZ.length} ({Math.round((score / QUIZ.length) * 100)}%)
            </p>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              {passed ? 'You have passed this training.' : 'You need 75% to pass. Please review the slides and retry.'}
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12, justifyContent: 'center' }}>
              {passed ? (
                <button className="btn-primary" onClick={() => setScreen('certificate')}>
                  <Award size={16} /> View certificate
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => { setSlideIndex(0); setScreen('slides') }}>
                    Review slides
                  </button>
                  <button className="btn-primary" onClick={() => { setAnswers({}); setScreen('quiz') }}>
                    Retry quiz
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* CERTIFICATE */}
        {screen === 'certificate' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              background: '#fff', border: '2px solid #378ADD', borderRadius: 16,
              padding: '3rem 2rem', maxWidth: 520, margin: '0 auto'
            }}>
              <div style={{ width: 60, height: 60, background: '#E6F1FB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Award size={30} color="#185FA5" />
              </div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', color: '#888', marginBottom: 8 }}>Certificate of Completion</p>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Prevention of Sexual Harassment</h2>
              <p style={{ fontSize: 13, color: '#666', marginBottom: '1.5rem' }}>POSH Awareness Training — Workplace Safety</p>
              <div style={{ borderTop: '0.5px solid #eee', borderBottom: '0.5px solid #eee', padding: '1rem 0', margin: '0 0 1.5rem' }}>
                <p style={{ fontSize: 13, color: '#888' }}>This is to certify that</p>
                <p style={{ fontSize: 22, fontWeight: 700, margin: '6px 0' }}>{session?.name}</p>
                <p style={{ fontSize: 13, color: '#666' }}>{session?.company}</p>
                <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>has successfully completed this training</p>
              </div>
              <p style={{ fontSize: 13, color: '#888' }}>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => router.push('/dashboard')}>
              <ArrowLeft size={16} /> Back to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
