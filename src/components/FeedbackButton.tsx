import React, { useState } from 'react';

type FeedbackType = 'General Feedback' | 'Bug Report' | 'Feature Request' | 'Data Correction';

const TYPES: FeedbackType[] = ['General Feedback', 'Bug Report', 'Feature Request', 'Data Correction'];

const FeedbackButton: React.FC = () => {
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [type,    setType]    = useState<FeedbackType>('General Feedback');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errMsg,  setErrMsg]  = useState('');

  const reset = () => {
    setName(''); setEmail(''); setType('General Feedback');
    setMessage(''); setStatus('idle'); setErrMsg('');
  };

  const handleClose = () => { setOpen(false); reset(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) { setErrMsg('Please write a longer message.'); return; }
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, type, message }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Server error');
      }
      setStatus('success');
    } catch (err: any) {
      setErrMsg(err.message || 'Failed to send. Please try again later.');
      setStatus('error');
      console.error('[Feedback]', err.message);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: 6,
    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 1.1rem', borderRadius: 100,
          background: 'var(--color-outbreak)', color: '#fff',
          border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
          boxShadow: '0 4px 16px rgba(229,62,62,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div
          className="modal-backdrop"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          style={{ zIndex: 10000 }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 460, width: '100%' }}
          >
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Thank you!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Your feedback has been sent directly to the dashboard team.
                </p>
                <button className="tab-btn active" onClick={handleClose}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h2 className="modal-title" id="feedback-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }} aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Send Feedback
                  </h2>
                  <button type="button" className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.25rem 0 1rem' }}>
                  {/* Type selector */}
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Type</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {TYPES.map(t => (
                        <button
                          key={t} type="button"
                          onClick={() => setType(t)}
                          style={{
                            padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.75rem',
                            fontWeight: 600, cursor: 'pointer', border: '1px solid',
                            borderColor: type === t ? 'var(--color-outbreak)' : 'var(--border-color)',
                            background:  type === t ? 'rgba(229,62,62,0.15)' : 'transparent',
                            color:       type === t ? 'var(--color-outbreak)' : 'var(--text-muted)',
                          }}
                        >{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor="fb-name" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Name (optional)</label>
                    <input id="fb-name" type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" style={inputStyle} maxLength={80} />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="fb-email" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Email (optional — for a reply)</label>
                    <input id="fb-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" style={inputStyle} maxLength={120} />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="fb-message" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Message *</label>
                    <textarea id="fb-message" value={message} onChange={e => { setMessage(e.target.value); setErrMsg(''); }}
                      placeholder="Tell us what you think, report a bug, or suggest a feature…"
                      required rows={5} maxLength={2000}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 100, fontFamily: 'var(--font-sans)' }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {message.length} / 2000
                    </div>
                  </div>

                  {errMsg && (
                    <div style={{ color: '#fc8181', fontSize: '0.8rem', background: 'rgba(229,62,62,0.1)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                      {errMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    style={{
                      padding: '0.65rem', borderRadius: 8, border: 'none',
                      background: 'var(--color-outbreak)', color: '#fff',
                      fontWeight: 700, fontSize: '0.9rem', cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                      opacity: status === 'sending' ? 0.7 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {status === 'sending' ? 'Sending…' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
