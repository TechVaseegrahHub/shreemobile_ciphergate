import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

/* ── Avatar color picker ────────────────────────────────────────────── */
const avatarGradients = [
  'linear-gradient(135deg,#E8B84B,#D4920C)',
  'linear-gradient(135deg,#4B7FE8,#3563C9)',
  'linear-gradient(135deg,#3DBE7A,#2A9C5D)',
  'linear-gradient(135deg,#8B5CF6,#6D35E3)',
  'linear-gradient(135deg,#E05252,#C03030)',
  'linear-gradient(135deg,#06B6D4,#0284C7)',
];
const pickGradient = (name = '') => avatarGradients[name.charCodeAt(0) % avatarGradients.length];
const getInitials  = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

/* ── Eye icons ──────────────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Error alert ────────────────────────────────────────────────────── */
const ErrorAlert = ({ message }) => (
  <div style={{
    background: 'rgba(224,82,82,0.12)', border: '1px solid rgba(224,82,82,0.3)',
    borderRadius: 10, padding: '11px 14px', marginBottom: 18,
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
    <span style={{ fontSize: 13, color: '#FCA5A5' }}>{message}</span>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════
   EMPLOYEE LOGIN
   ══════════════════════════════════════════════════════════════════════ */
const EmployeeLogin = () => {
  const [workers, setWorkers]                   = useState([]);
  const [filteredWorkers, setFilteredWorkers]   = useState([]);
  const [selectedWorker, setSelectedWorker]     = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword]                 = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [fetchLoading, setFetchLoading]         = useState(true);
  const [error, setError]                       = useState('');
  const [searchTerm, setSearchTerm]             = useState('');
  const navigate = useNavigate();

  /* Fetch workers */
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await api.get('/workers');
        setWorkers(res.data);
        setFilteredWorkers(res.data);
      } catch (err) {
        setError('Failed to load employee list. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  /* Filter */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWorkers(workers);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredWorkers(workers.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.email.toLowerCase().includes(q) ||
        (w.department?.name || '').toLowerCase().includes(q)
      ));
    }
  }, [searchTerm, workers]);

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    setShowPasswordForm(true);
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/workers/login', { workerId: selectedWorker._id, password });
      if (res.data.worker) {
        localStorage.setItem('employee', JSON.stringify(res.data.worker));
        navigate(`/employee/${selectedWorker._id}/dashboard`);
      } else {
        setError('Login failed. Please check your password.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setShowPasswordForm(false);
    setSelectedWorker(null);
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  /* ── Shared page shell ───────────────────────────────────────────── */
  return (
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

      {/* Blobs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,184,75,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(75,127,232,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Main card */}
      <div className="animate-fade-in-up" style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 28,
        width: '100%',
        maxWidth: 680,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
      }}>

        {/* Header */}
        <div style={{ padding: '40px 40px 0', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 18, boxShadow: '0 0 36px rgba(232,184,75,0.1)',
          }}>
            <img src={logo} alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 10 }} />
          </div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 5px', letterSpacing: '-0.3px' }}>
            Shreerama <span style={{ color: '#E8B84B' }}>Mobiles</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px', letterSpacing: '0.07em' }}>
            EMPLOYEE PORTAL
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '0 40px 32px' }}>

          {error && !showPasswordForm && <ErrorAlert message={error} />}

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              id="employee-search"
              type="text"
              placeholder="Search by name, email or department…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '12px 14px 12px 42px',
                fontSize: 13.5,
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(232,184,75,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,184,75,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginBottom: 14, fontWeight: 500 }}>
            Select your profile to continue:
          </p>

          {/* Worker grid */}
          <div style={{
            maxHeight: 340,
            overflowY: 'auto',
            marginBottom: 20,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}>
            {fetchLoading ? (
              /* Skeleton */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 10, width: '50%', background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }}>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                {workers.length === 0 ? 'No employees found' : 'No matching employees'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {filteredWorkers.map((worker) => (
                  <button
                    key={worker._id}
                    id={`emp-card-${worker._id}`}
                    onClick={() => handleWorkerSelect(worker)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1.5px solid rgba(255,255,255,0.08)',
                      borderRadius: 14,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(232,184,75,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(232,184,75,0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: pickGradient(worker.name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                      flexShrink: 0,
                    }}>
                      {getInitials(worker.name)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {worker.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {worker.department?.name || 'No Department'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Back to home */}
          <button
            id="emp-back-home-btn"
            onClick={() => navigate('/')}
            style={{
              width: '100%', padding: '13px',
              borderRadius: 14,
              border: '1.5px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            ← Back to Home
          </button>
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
      </div>

      {/* ── Password Modal ─────────────────────────────────────────── */}
      {showPasswordForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: 24,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div className="animate-fade-in-up" style={{
            background: '#1A1A2E',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 420,
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ padding: '36px 36px 28px' }}>

              {/* Selected worker display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: pickGradient(selectedWorker?.name || ''),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {getInitials(selectedWorker?.name)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                    {selectedWorker?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {selectedWorker?.department?.name || 'No Department'}
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />

              {error && <ErrorAlert message={error} />}

              <form onSubmit={handlePasswordSubmit}>
                {/* Password field */}
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 8, letterSpacing: '0.07em' }}>
                  PASSWORD
                </label>
                <div style={{ position: 'relative', marginBottom: 28 }}>
                  <input
                    id="emp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1.5px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, padding: '13px 44px 13px 16px',
                      fontSize: 14, color: '#fff', outline: 'none',
                      boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(232,184,75,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,184,75,0.09)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    id="emp-modal-back-btn"
                    onClick={handleBackToList}
                    style={{
                      flex: 1, padding: '13px',
                      borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'rgba(255,255,255,0.55)',
                      fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    id="emp-login-btn"
                    disabled={loading}
                    style={{
                      flex: 2, padding: '13px',
                      borderRadius: 12, border: 'none',
                      background: loading ? 'rgba(232,184,75,0.45)' : 'linear-gradient(135deg, #E8B84B 0%, #D4920C 100%)',
                      color: '#1A1A2E',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14, fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: loading ? 'none' : '0 4px 18px rgba(232,184,75,0.25)',
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,184,75,0.38)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 18px rgba(232,184,75,0.25)'; }}
                  >
                    {loading ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                        Verifying…
                      </>
                    ) : 'Sign In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default EmployeeLogin;