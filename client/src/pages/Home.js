import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) navigate('/dashboard');
  }, [navigate]);

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

      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,184,75,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-120px', left: '-100px',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(75,127,232,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div className="animate-fade-in-up" style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 28,
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
      }}>

        {/* Top section */}
        <div style={{ padding: '48px 40px 36px', textAlign: 'center' }}>

          {/* Logo with glow ring */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 90,
            height: 90,
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 24,
            boxShadow: '0 0 40px rgba(232,184,75,0.15)',
          }}>
            <img src={logo} alt="Shreerama Mobiles Logo" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 12 }} />
          </div>

          {/* Brand */}
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 6px',
            letterSpacing: '-0.5px',
          }}>
            Shreerama <span style={{ color: '#E8B84B' }}>Mobiles</span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 40px', letterSpacing: '0.04em' }}>
            Mobile Repair Management System
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Admin Panel */}
            <button
              id="home-admin-btn"
              onClick={() => navigate('/admin/login')}
              style={{
                width: '100%',
                padding: '15px 20px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #E8B84B 0%, #D4920C 100%)',
                color: '#1A1A2E',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.22s ease',
                boxShadow: '0 4px 20px rgba(232,184,75,0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(232,184,75,0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(232,184,75,0.3)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin Panel
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Staff Access */}
            <button
              id="home-staff-btn"
              onClick={() => navigate('/employee/login')}
              style={{
                width: '100%',
                padding: '15px 20px',
                borderRadius: 14,
                border: '1.5px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.22s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Staff Access
            </button>
          </div>
        </div>

        {/* Footer strip */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '14px 24px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
            © {new Date().getFullYear()} Shreerama Mobiles · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;