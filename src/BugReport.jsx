import { useState, useEffect, useRef } from 'react'
import { useT } from './i18n/index.jsx'

const BMAC_URL = import.meta.env.VITE_BMAC_URL || 'https://buymeacoffee.com/jordanjoin'

// TODO: configure VITE_BUG_REPORT_WEBHOOK
// to receive reports (Discord webhook, email service, etc.)
// For Discord webhooks, wrap payload in { "content": JSON.stringify(payload) }
const WEBHOOK_URL    = import.meta.env.VITE_BUG_REPORT_WEBHOOK
const RATE_LIMIT_KEY = 'pjt-bug-report-last'
const RATE_LIMIT_MS  = 60 * 1000

const CATEGORY_IDS = ['visual', 'data', 'broken', 'suggest']

function getRemainingCooldown() {
  const last = localStorage.getItem(RATE_LIMIT_KEY)
  if (!last) return 0
  const elapsed = Date.now() - parseInt(last, 10)
  return Math.max(0, Math.ceil((RATE_LIMIT_MS - elapsed) / 1000))
}

export default function BugReport({ open, onClose, page = '' }) {
  const t = useT()
  const [category,    setCategory]    = useState('')
  const [description, setDescription] = useState('')
  const [pageCtx,     setPageCtx]     = useState(page)
  const [contact,     setContact]     = useState('')
  const [status,      setStatus]      = useState('idle') // idle | loading | success | error
  const [cooldown,    setCooldown]    = useState(0)
  const [toast,       setToast]       = useState(false)
  const modalRef = useRef(null)

  useEffect(() => { if (open) setPageCtx(page) }, [open, page])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  useEffect(() => {
    if (open) setCooldown(getRemainingCooldown())
  }, [open])

  function closeModal() {
    onClose?.()
    setTimeout(() => {
      setCategory('')
      setDescription('')
      setContact('')
      setStatus('idle')
    }, 200)
  }

  // Focus trap + ESC
  useEffect(() => {
    if (!open || !modalRef.current) return
    const modal = modalRef.current
    const sel   = 'button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])'

    function focusables() {
      return [...modal.querySelectorAll(sel)]
    }

    function onKey(e) {
      if (e.key === 'Escape') { closeModal(); return }
      if (e.key !== 'Tab') return
      const els   = focusables()
      const first = els[0]
      const last  = els[els.length - 1]
      if (!first) return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', onKey)
    setTimeout(() => focusables()[0]?.focus(), 50)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    const remaining = getRemainingCooldown()
    if (remaining > 0) { setCooldown(remaining); return }

    setStatus('loading')

    const catLabel = t(`bug.cat.${category}`)
    const payload = {
      category:    catLabel,
      description,
      page:        pageCtx || '(non précisée)',
      url:         window.location.href,
      contact:     contact || '(non renseigné)',
      timestamp:   new Date().toISOString(),
      userAgent:   navigator.userAgent,
    }

    try {
      if (WEBHOOK_URL) {
        const res = await fetch(WEBHOOK_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        console.log('[BugReport] payload (no webhook configured):', payload)
        await new Promise(r => setTimeout(r, 600))
      }

      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
      setStatus('success')
      setToast(true)
      setTimeout(() => closeModal(), 2500)
      setTimeout(() => setToast(false), 3200)
    } catch {
      setStatus('error')
    }
  }

  const canSubmit = category && description.trim().length > 0
    && status !== 'loading' && cooldown === 0

  if (!open && !toast) return null

  return (
    <>
      {open && (
        <div
          className="bugrep-backdrop"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bugrep-title"
        >
          <div
            ref={modalRef}
            className="bugrep-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="bugrep-header">
              <div>
                <h2 id="bugrep-title" className="bugrep-title">{t('bug.title')}</h2>
                <p className="bugrep-subtitle">{t('bug.subtitle')}</p>
              </div>
              <button className="bugrep-close" onClick={closeModal} aria-label={t('bug.close')}>✕</button>
            </div>

            {status === 'success' ? (
              <div className="bugrep-success">
                <span className="bugrep-success-icon">✅</span>
                <p className="bugrep-success-title">{t('bug.success_title')}</p>
                <p className="bugrep-success-sub">{t('bug.success_sub')}</p>
                {BMAC_URL && (
                  <div className="bugrep-bmac-banner">
                    <p className="bugrep-bmac-text">Tu aimes le projet ? Tu peux soutenir l'hébergement ☕</p>
                    <a href={BMAC_URL} target="_blank" rel="noopener noreferrer" className="bmac-btn">
                      ☕ Buy me a coffee
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <form className="bugrep-form" onSubmit={handleSubmit} noValidate>

                <fieldset className="bugrep-field">
                  <legend className="bugrep-label">
                    {t('bug.category')} <span className="bugrep-required">{t('bug.required')}</span>
                  </legend>
                  <div className="bugrep-pills" role="radiogroup">
                    {CATEGORY_IDS.map(id => (
                      <label
                        key={id}
                        className={`bugrep-pill${category === id ? ' bugrep-pill--active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={id}
                          checked={category === id}
                          onChange={() => setCategory(id)}
                          className="bugrep-radio-hidden"
                        />
                        {t(`bug.cat.${id}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="bugrep-field">
                  <label className="bugrep-label" htmlFor="bugrep-desc">
                    {t('bug.description')} <span className="bugrep-required">{t('bug.required')}</span>
                  </label>
                  <div className="bugrep-textarea-wrap">
                    <textarea
                      id="bugrep-desc"
                      className="bugrep-textarea"
                      placeholder={t('bug.desc_ph')}
                      value={description}
                      onChange={e => setDescription(e.target.value.slice(0, 1000))}
                      rows={5}
                    />
                    <span className={`bugrep-charcount${description.length >= 900 ? ' bugrep-charcount--warn' : ''}`}>
                      {description.length}/1000
                    </span>
                  </div>
                </div>

                {pageCtx && (
                  <div className="bugrep-field">
                    <span className="bugrep-label">{t('bug.page')}</span>
                    <div className="bugrep-page-chip">
                      <span>📍 {pageCtx}</span>
                      <button
                        type="button"
                        className="bugrep-page-clear"
                        onClick={() => setPageCtx('')}
                        aria-label={t('bug.clear_page')}
                      >✕</button>
                    </div>
                  </div>
                )}

                <div className="bugrep-field">
                  <label className="bugrep-label" htmlFor="bugrep-contact">{t('bug.contact')}</label>
                  <input
                    id="bugrep-contact"
                    type="text"
                    className="bugrep-input"
                    placeholder={t('bug.contact_ph')}
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                  />
                </div>

                {status === 'error' && (
                  <p className="bugrep-error-msg">{t('bug.error')}</p>
                )}

                {cooldown > 0 && (
                  <p className="bugrep-cooldown-msg">{t('bug.cooldown')}</p>
                )}

                <div className="bugrep-actions">
                  <button type="submit" className="bugrep-submit" disabled={!canSubmit}>
                    {status === 'loading' ? (
                      <><span className="bugrep-spinner" aria-hidden="true" /> {t('bug.submitting')}</>
                    ) : cooldown > 0 ? (
                      t('bug.retry', { s: cooldown })
                    ) : (
                      t('bug.submit')
                    )}
                  </button>
                  <button type="button" className="bugrep-cancel" onClick={closeModal}>
                    {t('bug.cancel')}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="bugrep-toast" role="status" aria-live="polite">
          {t('bug.toast')}
        </div>
      )}
    </>
  )
}
