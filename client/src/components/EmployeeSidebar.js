import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

/* ── Colors ────────────────────────────────────────────────────────── */
const COLORS = {
  dashboard:  '#4B7FE8',
  jobs:       '#E8B84B',
  attendance: '#10B981',
  logout:     '#E05252',
};

/* ── Tiny icon helper ───────────────────────────────────────────────── */
const Ico = ({ children, color, size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {children}
  </svg>
);

const ICONS = {
  dashboard:  (c) => <Ico color={c}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Ico>,
  jobs:       (c) => <Ico color={c}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></Ico>,
  attendance: (c) => <Ico color={c}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></Ico>,
  logout:     (c) => <Ico color={c}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></Ico>,
  menu:       (c) => <Ico color={c}><path d="M4 6h16M4 12h16M4 18h16"/></Ico>,
};

/* ── Avatar helpers ─────────────────────────────────────────────────── */
const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'EE';

const SIDEBAR_COLLAPSED = 72;
const SIDEBAR_EXPANDED  = 230;

/* ══════════════════════════════════════════════════════════════════════
   EMPLOYEE SIDEBAR
   ══════════════════════════════════════════════════════════════════════ */
const EmployeeSidebar = ({ worker, onLogout, isOpen, toggleSidebar, onExpand, onCollapse }) => {
  const location = useLocation();
  const [expanded, setExpanded]                   = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleExpand   = () => { setExpanded(true);  onExpand?.();  };
  const handleCollapse = () => { setExpanded(false); onCollapse?.(); };

  const isActive    = (path) => location.pathname === path;
  const handleNavClick = () => { if (window.innerWidth < 1024) toggleSidebar(); };
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    if (window.innerWidth < 1024) toggleSidebar();
  };

  const initials = getInitials(worker?.name);

  /* ── Nav row ────────────────────────────────────────────────────── */
  const NavItem = ({ to, iconKey, label }) => {
    const active   = isActive(to);
    const color    = COLORS[iconKey];
    const iconCol  = active ? '#fff' : color;

    return (
      <Link
        to={to}
        onClick={handleNavClick}
        title={label}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '6px 8px',           /* FIXED */
          justifyContent: 'flex-start',  /* FIXED */
          borderRadius: 13, textDecoration: 'none',
          background: active ? color : 'transparent',
          boxShadow: active ? `0 4px 14px ${color}38` : 'none',
          marginBottom: 3,
          transition: 'background 0.18s ease, box-shadow 0.18s',
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${color}16`; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
        }}>
          {ICONS[iconKey](iconCol)}
        </span>
        <span style={{
          fontSize: 13.5, fontWeight: active ? 700 : 500,
          color: active ? '#fff' : '#374151',
          opacity: expanded ? 1 : 0,
          maxWidth: expanded ? 160 : 0,
          transition: 'opacity 0.18s ease, max-width 0.28s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden', fontFamily: "'Inter', sans-serif",
          pointerEvents: 'none',
        }}>
          {label}
        </span>
      </Link>
    );
  };

  /* ── Logout row ─────────────────────────────────────────────────── */
  const LogoutRow = () => (
    <button
      onClick={handleLogoutClick}
      title="Logout"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '6px 8px',           /* FIXED */
        justifyContent: 'flex-start',  /* FIXED */
        borderRadius: 13, border: 'none', background: 'transparent',
        cursor: 'pointer', width: '100%',
        transition: 'background 0.18s ease',
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${COLORS.logout}14`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}>
        {ICONS.logout(COLORS.logout)}
      </span>
      <span style={{
        fontSize: 13.5, fontWeight: 500, color: COLORS.logout,
        opacity: expanded ? 1 : 0, maxWidth: expanded ? 160 : 0,
        transition: 'opacity 0.18s ease, max-width 0.28s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden', fontFamily: "'Inter', sans-serif",
        pointerEvents: 'none',
      }}>
        Logout
      </span>
    </button>
  );

  return (
    <>
      {/* ── Mobile hamburger ─────────────────────────────── */}
      <button
        className="mobile-menu-btn sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Open menu"
      >
        {ICONS.menu('#fff')}
      </button>

      {/* ── Mobile overlay ───────────────────────────────── */}
      {isOpen && (
        <div className="sidebar-overlay lg:hidden" onClick={toggleSidebar} />
      )}

      {/* ══════════════════════════════════════════════════
          HOVER-EXPAND RAIL
          ══════════════════════════════════════════════════ */}
      <aside
        onMouseEnter={handleExpand}
        onMouseLeave={handleCollapse}
        className={`slim-sidebar ${isOpen ? 'is-open' : ''}`}
        style={{
          width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
          background: '#FFFFFF',
          minHeight: '100vh',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
          paddingTop: 14, paddingBottom: 14,
          paddingLeft: 10,  /* FIXED — icons never shift */
          paddingRight: 10, /* FIXED */
          boxShadow: expanded ? '4px 0 32px rgba(0,0,0,0.12)' : '2px 0 12px rgba(0,0,0,0.06)',
          borderRight: '1px solid rgba(0,0,0,0.05)',
          zIndex: 45,
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s ease',
          overflowX: 'hidden', overflowY: 'auto',
        }}
      >
        {/* Logo row — FIXED justifyContent so logo never shakes */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 14, padding: '4px 0',
          justifyContent: 'flex-start', /* FIXED */
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#1A1A2E,#2E2E50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(26,26,46,0.28)',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src={logo} alt="Logo" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 5 }} />
          </div>
          <div style={{
            opacity: expanded ? 1 : 0, maxWidth: expanded ? 160 : 0,
            overflow: 'hidden',
            transition: 'opacity 0.18s ease, max-width 0.28s cubic-bezier(0.4,0,0.2,1)',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 800, color: '#1A1A2E', lineHeight: 1.2 }}>Shreerama</div>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: '#E8B84B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Employee Portal</div>
          </div>
        </div>

        <div style={{ height: 1.5, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginBottom: 10 }} />

        {/* Worker avatar chip — FIXED alignment */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 10, padding: '6px 4px',
          justifyContent: 'flex-start', /* FIXED */
          borderRadius: 12,
          background: expanded ? 'rgba(232,184,75,0.08)' : 'transparent',
          border: expanded ? '1px solid rgba(232,184,75,0.15)' : '1px solid transparent',
          transition: 'background 0.25s ease, border-color 0.25s ease',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#E8B84B,#D4920C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            boxShadow: '0 3px 10px rgba(232,184,75,0.3)',
          }}>
            {initials}
          </div>
          <div style={{
            opacity: expanded ? 1 : 0, maxWidth: expanded ? 160 : 0,
            overflow: 'hidden', transition: 'opacity 0.2s ease, max-width 0.25s ease',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{worker?.name || 'Employee'}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{worker?.role || 'Technician'}</div>
          </div>
        </div>

        <div style={{ height: 1.5, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginBottom: 10, width: expanded ? '100%' : 32, marginLeft: expanded ? 0 : 'auto', marginRight: expanded ? 0 : 'auto', transition: 'width 0.25s ease' }} />

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          <NavItem to={`/employee/${worker?._id}/dashboard`} iconKey="dashboard" label="Dashboard" />
          <NavItem to={`/employee/${worker?._id}/jobs`}      iconKey="jobs"       label="My Jobs"   />
          <NavItem to={`/employee/${worker?._id}/attendance`}iconKey="attendance" label="Attendance"/>
        </nav>

        {/* Logout */}
        <div>
          <div style={{ height: 1.5, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginBottom: 8, width: expanded ? '100%' : 32, marginLeft: expanded ? 0 : 'auto', marginRight: expanded ? 0 : 'auto', transition: 'width 0.25s ease' }} />
          <LogoutRow />
        </div>
      </aside>

      {/* ── Logout Modal ─────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal__icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </div>
            <h3 className="logout-modal__title">Signing out?</h3>
            <p className="logout-modal__body">You'll be redirected to the employee login page.</p>
            <div className="logout-modal__actions">
              <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={onLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeSidebar;