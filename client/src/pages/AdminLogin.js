import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

/* ── Eye toggle icons ──────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Shared page shell ─────────────────────────────────────────────── */
const LoginShell = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0F0F1E 0%, #1A1A2E 40%, #16213E 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', 'Outfit', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Background blobs */}
    <div style={{
      position: 'absolute', top: '-100px', right: '-100px',
      width: 450, height: 450, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(232,184,75,0.1) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', bottom: '-120px', left: '-120px',
      width: 500, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(75,127,232,0.08) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    {children}
  </div>
);

/* ── Glass card ─────────────────────────────────────────────────────── */
const GlassCard = ({ children, maxWidth = 440 }) => (
  <div className="animate-fade-in-up" style={{
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 28,
    width: '100%',
    maxWidth,
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
  }}>
    {children}
  </div>
);

/* ── Logo header ────────────────────────────────────────────────────── */
const LogoHeader = ({ subtitle }) => (
  <div style={{ textAlign: 'center', marginBottom: 32 }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 80, height: 80, borderRadius: 22,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: 20,
      boxShadow: '0 0 40px rgba(232,184,75,0.12)',
    }}>
      <img src={logo} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 12 }} />
    </div>
    <h1 style={{
      fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800,
      color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.4px',
    }}>
      Shreerama <span style={{ color: '#E8B84B' }}>Mobiles</span>
    </h1>
    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.05em' }}>
      {subtitle}
    </p>
  </div>
);

/* ── Input field ────────────────────────────────────────────────────── */
const InputField = ({ label, id, type = 'text', value, onChange, placeholder, required, autoFocus, rightSlot }) => (
  <div style={{ marginBottom: 18 }}>
    <label htmlFor={id} style={{
      display: 'block', fontSize: 12, fontWeight: 600,
      color: 'rgba(255,255,255,0.55)', marginBottom: 8, letterSpacing: '0.06em',
    }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.07)',
          border: '1.5px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: rightSlot ? '13px 44px 13px 16px' : '13px 16px',
          fontSize: 14,
          color: '#FFFFFF',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'rgba(232,184,75,0.6)';
          e.target.style.boxShadow = '0 0 0 3px rgba(232,184,75,0.1)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(255,255,255,0.1)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {rightSlot && (
        <div style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center',
        }}>
          {rightSlot}
        </div>
      )}
    </div>
  </div>
);

/* ── Error alert ────────────────────────────────────────────────────── */
const ErrorAlert = ({ message }) => (
  <div style={{
    background: 'rgba(224,82,82,0.12)',
    border: '1px solid rgba(224,82,82,0.3)',
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
    <span style={{ fontSize: 13, color: '#FCA5A5' }}>{message}</span>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════
   ADMIN LOGIN
   ══════════════════════════════════════════════════════════════════════ */
const AdminLogin = () => {
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('admin')) navigate('/dashboard');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/login', { username, password });
      if (res.data.admin) {
        localStorage.setItem('admin', JSON.stringify(res.data.admin));
        navigate('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginShell>
      <GlassCard maxWidth={420}>

        {/* Top content */}
        <div style={{ padding: '44px 40px 32px' }}>
          <LogoHeader subtitle="ADMIN PORTAL" />

          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleSubmit}>
            <InputField
              id="admin-username"
              label="USERNAME"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
            <InputField
              id="admin-password"
              label="PASSWORD"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 0 }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              }
            />

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
              <button
                id="admin-login-btn"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 14, border: 'none',
                  background: loading ? 'rgba(232,184,75,0.5)' : 'linear-gradient(135deg, #E8B84B 0%, #D4920C 100%)',
                  color: '#1A1A2E',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.22s ease',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(232,184,75,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(232,184,75,0.4)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(232,184,75,0.28)'; }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Signing in…
                  </>
                ) : 'Sign In'}
              </button>

              <button
                type="button"
                id="admin-back-btn"
                onClick={() => navigate('/')}
                style={{
                  width: '100%', padding: '13px',
                  borderRadius: 14,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: 'rgba(255,255,255,0.6)',
                  fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                ← Back to Home
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '13px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', margin: 0 }}>
            © {new Date().getFullYear()} Shreerama Mobiles · All rights reserved
          </p>
        </div>
      </GlassCard>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </LoginShell>
  );
};

export default AdminLogin;