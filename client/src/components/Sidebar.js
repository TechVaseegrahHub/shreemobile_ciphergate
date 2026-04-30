import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

/* ══════════════════════════════════════════════════════════════════════
   ICON COLORS — each nav item gets its own accent colour
   ══════════════════════════════════════════════════════════════════════ */
const ITEM_COLORS = {
  dashboard:     '#4B7FE8',
  intake:        '#3DBE7A',
  activeJobs:    '#E8B84B',
  cancelledJobs: '#E05252',
  departments:   '#8B5CF6',
  inventory:     '#06B6D4',
  suppliers:     '#F97316',
  purchases:     '#EC4899',
  workers:       '#6366F1',
  attendance:    '#10B981',
  holidays:      '#F43F5E',
  salary:        '#D97706',
  financials:    '#84CC16',
  settings:      '#94A3B8',
  logout:        '#E05252',
};

/* ══════════════════════════════════════════════════════════════════════
   SVG ICONS
   ══════════════════════════════════════════════════════════════════════ */
const Ico = ({ children, color, size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {children}
  </svg>
);

const ICONS = {
  dashboard:    (c) => <Ico color={c}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Ico>,
  intake:       (c) => <Ico color={c}><path d="M12 5v14M5 12h14"/></Ico>,
  activeJobs:   (c) => <Ico color={c}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></Ico>,
  cancelledJobs:(c) => <Ico color={c}><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></Ico>,
  departments:  (c) => <Ico color={c}><path d="M3 21h18M6 21V7a2 2 0 012-2h4a2 2 0 012 2v14M16 21V11a2 2 0 012-2h0a2 2 0 012 2v10"/></Ico>,
  inventory:    (c) => <Ico color={c}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></Ico>,
  suppliers:    (c) => <Ico color={c}><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Ico>,
  purchases:    (c) => <Ico color={c}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></Ico>,
  workers:      (c) => <Ico color={c}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></Ico>,
  attendance:   (c) => <Ico color={c}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></Ico>,
  holidays:     (c) => <Ico color={c}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></Ico>,
  salary:       (c) => <Ico color={c}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></Ico>,
  financials:   (c) => <Ico color={c}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ico>,
  settings:     (c) => <Ico color={c}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></Ico>,
  logout:       (c) => <Ico color={c}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></Ico>,
  menu:         (c) => <Ico color={c}><path d="M4 6h16M4 12h16M4 18h16"/></Ico>,
  close:        (c) => <Ico color={c}><path d="M18 6L6 18M6 6l12 12"/></Ico>,
};

/* ══════════════════════════════════════════════════════════════════════
   MENU CONFIG
   ══════════════════════════════════════════════════════════════════════ */
const MENU_ITEMS = [
  { name: 'Dashboard',      path: '/dashboard',      key: 'dashboard' },
  { name: 'New Intake',     path: '/jobs/new',       key: 'intake' },
  { name: 'Active Jobs',    path: '/jobs',           key: 'activeJobs' },
  { name: 'Cancelled Jobs', path: '/cancelled-jobs', key: 'cancelledJobs' },
  'divider',
  { name: 'Departments',    path: '/departments',    key: 'departments' },
  { name: 'Inventory',      path: '/inventory',      key: 'inventory' },
  { name: 'Suppliers',      path: '/suppliers',      key: 'suppliers' },
  { name: 'Purchases',      path: '/purchases',      key: 'purchases' },
  'divider',
  { name: 'Workers',        path: '/workers',        key: 'workers' },
  { name: 'Attendance',     path: '/attendance',     key: 'attendance' },
  { name: 'Holidays',       path: '/holidays',       key: 'holidays' },
  { name: 'Salary',         path: '/admin/salary',   key: 'salary' },
  { name: 'Financials',     path: '/financials',     key: 'financials' },
  'divider',
  { name: 'Settings',       path: '/settings',       key: 'settings' },
];

const SIDEBAR_COLLAPSED = 72;
const SIDEBAR_EXPANDED  = 230;

/* ══════════════════════════════════════════════════════════════════════
   MAIN SIDEBAR COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
const Sidebar = ({ isOpen, toggleSidebar, onExpand, onCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded]                   = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleExpand = () => { setExpanded(true);  onExpand?.();  };
  const handleCollapse = () => { setExpanded(false); onCollapse?.(); };

  const isActive = (path) => location.pathname === path;

  const handleNavClick = () => {
    if (window.innerWidth < 1024) toggleSidebar();
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    if (window.innerWidth < 1024) toggleSidebar();
  };

  const confirmLogout = () => {
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  /* ── Single nav row ───────────────────────────────────────────────── */
  const NavItem = ({ item }) => {
    const active  = isActive(item.path);
    const color   = ITEM_COLORS[item.key];
    const iconCol = active ? '#fff' : color;

    return (
      <Link
        to={item.path}
        onClick={handleNavClick}
        title={item.name}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 8px',          /* ← FIXED, never changes */
          justifyContent: 'flex-start', /* ← FIXED, icons always left-anchored */
          borderRadius: 13,
          textDecoration: 'none',
          background: active ? color : 'transparent',
          boxShadow: active ? `0 4px 14px ${color}38` : 'none',
          marginBottom: 2,
          transition: 'background 0.18s ease, box-shadow 0.18s ease',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${color}16`; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Icon — absolutely stable, never moves */}
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
          transition: 'background 0.18s',
        }}>
          {ICONS[item.key] && ICONS[item.key](iconCol)}
        </span>

        {/* Label — fades in to the RIGHT of the stable icon */}
        <span style={{
          fontSize: 13.5,
          fontWeight: active ? 700 : 500,
          color: active ? '#fff' : '#374151',
          opacity: expanded ? 1 : 0,
          maxWidth: expanded ? 160 : 0,
          transition: 'opacity 0.18s ease, max-width 0.28s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          letterSpacing: '0.01em',
          fontFamily: "'Inter', sans-serif",
          pointerEvents: 'none',
        }}>
          {item.name}
        </span>
      </Link>
    );
  };

  /* ── Logout button ────────────────────────────────────────────────── */
  const LogoutRow = () => (
    <button
      onClick={handleLogoutClick}
      title="Logout"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 8px',          /* ← FIXED */
        justifyContent: 'flex-start', /* ← FIXED */
        borderRadius: 13,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        width: '100%',
        transition: 'background 0.18s ease',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${ITEM_COLORS.logout}14`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      }}>
        {ICONS.logout(ITEM_COLORS.logout)}
      </span>
      <span style={{
        fontSize: 13.5, fontWeight: 500,
        color: ITEM_COLORS.logout,
        opacity: expanded ? 1 : 0,
        maxWidth: expanded ? 160 : 0,
        transition: 'opacity 0.18s ease, max-width 0.28s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
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
        <div
          className="sidebar-overlay lg:hidden"
          onClick={toggleSidebar}
        />
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          paddingTop: 14,
          paddingBottom: 14,
          paddingLeft: 10,  /* ← FIXED — icons never shift */
          paddingRight: 10, /* ← FIXED */
          boxShadow: expanded
            ? '4px 0 32px rgba(0,0,0,0.12)'
            : '2px 0 12px rgba(0,0,0,0.06)',
          borderRight: '1px solid rgba(0,0,0,0.05)',
          zIndex: 45,
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s ease',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        {/* Logo row — ALWAYS flex-start so logo never moves */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          padding: '4px 0',
          justifyContent: 'flex-start', /* ← FIXED */
          flexShrink: 0,
        }}>
          {/* Logo box — fixed size, never moves */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#1A1A2E,#2E2E50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(26,26,46,0.28)',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <img src={logo} alt="Logo" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 5 }} />
          </div>

          {/* Brand name — slides in to the RIGHT of the fixed logo */}
          <div style={{
            opacity: expanded ? 1 : 0,
            maxWidth: expanded ? 160 : 0,
            overflow: 'hidden',
            transition: 'opacity 0.18s ease, max-width 0.28s cubic-bezier(0.4,0,0.2,1)',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 800, color: '#1A1A2E', lineHeight: 1.2 }}>Shreerama</div>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: '#E8B84B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mobiles</div>
          </div>
        </div>

        {/* Top divider — fixed width, no animation */}
        <div style={{ height: 1.5, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginBottom: 10 }} />

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {MENU_ITEMS.map((item, idx) =>
            item === 'divider' ? (
              <div key={`div-${idx}`} style={{
                height: 1.5, background: 'rgba(0,0,0,0.06)', borderRadius: 2,
                margin: '6px 0',
              }} />
            ) : (
              <NavItem key={item.key} item={item} />
            )
          )}
        </nav>

        {/* Bottom divider + logout */}
        <div>
          <div style={{ height: 1.5, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginBottom: 8 }} />
          <LogoutRow />
        </div>
      </aside>

      {/* ── Logout Confirmation Modal ─────────────────────── */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal__icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </div>
            <h3 className="logout-modal__title">Signing out?</h3>
            <p className="logout-modal__body">You'll need to log in again to access the admin panel.</p>
            <div className="logout-modal__actions">
              <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;