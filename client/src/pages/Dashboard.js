import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

/* ─────────────────────────────────────────────────────────────────────
   HELPER: Get initials from customer name
   ───────────────────────────────────────────────────────────────────── */
const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

/* ─────────────────────────────────────────────────────────────────────
   HELPER: Avatar background colour based on name
   ───────────────────────────────────────────────────────────────────── */
const avatarColors = [
  'linear-gradient(135deg,#4B7FE8,#3563C9)',
  'linear-gradient(135deg,#E8B84B,#D4920C)',
  'linear-gradient(135deg,#3DBE7A,#2A9C5D)',
  'linear-gradient(135deg,#8B5CF6,#6D35E3)',
  'linear-gradient(135deg,#E05252,#C03030)',
];
const pickColor = (str = '') =>
  avatarColors[str.charCodeAt(0) % avatarColors.length];

/* ─────────────────────────────────────────────────────────────────────
   STATUS BADGE
   ───────────────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    Intake:      'status-badge--intake',
    'In Progress': 'status-badge--progress',
    Done:        'status-badge--done',
    Ready:       'status-badge--ready',
  };
  const cls = map[status] || 'status-badge--default';
  return <span className={`status-badge ${cls}`}>{status || 'Unknown'}</span>;
};

/* ─────────────────────────────────────────────────────────────────────
   SKELETON LOADER (shimmer placeholders)
   ───────────────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div style={{
    background: 'white',
    borderRadius: 'var(--radius-md)',
    padding: '22px 20px',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-card)',
  }}>
    <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 14, marginBottom: 16 }} />
    <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
    <div className="skeleton" style={{ width: '40%', height: 14 }} />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────
   STAT CARD
   ───────────────────────────────────────────────────────────────────── */
const StatCard = ({ icon, value, label, accent, delay = 0 }) => (
  <div
    className="premium-stat-card animate-fade-in-up"
    style={{ '--card-accent': accent, animationDelay: `${delay}s` }}
  >
    <div
      className="premium-stat-card__icon-wrap"
      style={{ background: `${accent}18` }}
    >
      <svg
        width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={accent} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      >
        {icon}
      </svg>
    </div>
    <div className="premium-stat-card__value">{value}</div>
    <div className="premium-stat-card__label">{label}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────
   QUICK ACTION CARD
   ───────────────────────────────────────────────────────────────────── */
const QuickAction = ({ to, icon, label, accent }) => (
  <Link to={to} className="premium-quick-action" style={{ textDecoration: 'none' }}>
    <div className="premium-quick-action__icon" style={{ background: `${accent}15` }}>
      <svg
        width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={accent} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      >
        {icon}
      </svg>
    </div>
    <span style={{ color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 600 }}>{label}</span>
  </Link>
);

/* ─────────────────────────────────────────────────────────────────────
   MAIN DASHBOARD COMPONENT
   ───────────────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    total_revenue_today: 0,
    assigned_jobs_count: 0,
    in_progress_count: 0,
    completed_jobs_count: 0,
    low_stock_count: 0,
    recent_jobs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /* Auth guard */
  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin/login');
  }, [navigate]);

  const fetchDashboardSummary = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/summary');
      setDashboardData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data');
      setLoading(false);
      if (err.response?.status === 401) {
        localStorage.removeItem('admin');
        navigate('/admin/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (localStorage.getItem('admin')) fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  /* Format currency */
  const formatCurrency = (amount) =>
    `₹ ${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  /* Current date string */
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  /* ── Loading skeleton ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="premium-dashboard">
        <div style={{ marginBottom: 28 }}>
          <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 280, height: 16 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', height: 300, border: '1px solid var(--border-light)' }}>
          <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="premium-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 48px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid rgba(224,82,82,0.15)',
          maxWidth: 420,
        }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--accent-red-light)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px' }}>{error}</p>
          <button
            onClick={fetchDashboardSummary}
            style={{
              padding: '10px 24px', background: 'var(--accent-blue)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────────────── */
  return (
    <div className="premium-dashboard">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="premium-dashboard__header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="premium-dashboard__greeting">Welcome back, Admin 👋</h1>
          <p className="premium-dashboard__subtitle">Here's what's happening in your shop today.</p>
        </div>
        <div className="premium-dashboard__date-chip animate-fade-in">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {todayStr}
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          delay={0.05}
          accent="var(--accent-green)"
          value={formatCurrency(dashboardData.total_revenue_today)}
          label="Revenue Today"
          icon={
            <>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </>
          }
        />
        <StatCard
          delay={0.10}
          accent="var(--accent-blue)"
          value={dashboardData.assigned_jobs_count}
          label="Assigned Jobs"
          icon={
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          }
        />
        <StatCard
          delay={0.15}
          accent="var(--accent-yellow)"
          value={dashboardData.in_progress_count}
          label="In Progress"
          icon={
            <>
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </>
          }
        />
        <StatCard
          delay={0.20}
          accent="var(--accent-purple)"
          value={dashboardData.completed_jobs_count}
          label="Completed Jobs"
          icon={
            <>
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </>
          }
        />
        <StatCard
          delay={0.25}
          accent="var(--accent-red)"
          value={dashboardData.low_stock_count ?? 0}
          label="Low Stock Items"
          icon={
            <>
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            </>
          }
        />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
          <QuickAction
            to="/jobs/new"
            accent="var(--accent-blue)"
            label="New Intake"
            icon={<path d="M12 5v14M5 12h14" />}
          />
          <QuickAction
            to="/jobs"
            accent="var(--accent-yellow)"
            label="Active Jobs"
            icon={<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />}
          />
          <QuickAction
            to="/inventory"
            accent="var(--accent-green)"
            label="Inventory"
            icon={<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /></>}
          />
          <QuickAction
            to="/workers"
            accent="var(--accent-purple)"
            label="Workers"
            icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>}
          />
          <QuickAction
            to="/financials"
            accent="#E8B84B"
            label="Financials"
            icon={<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>}
          />
          <QuickAction
            to="/attendance"
            accent="var(--accent-red)"
            label="Attendance"
            icon={<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>}
          />
        </div>
      </div>

      {/* ── Recent Jobs ───────────────────────────────────────────── */}
      <div className="premium-table-card">
        <div className="premium-table-card__header">
          <div>
            <h2 className="premium-table-card__title">Recent Jobs</h2>
            <p className="premium-table-card__subtitle">Latest repair intake activity</p>
          </div>
          <Link
            to="/jobs"
            style={{
              fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            View All
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th className="hidden md:table-cell">Customer</th>
                <th>Device</th>
                <th>Status</th>
                <th className="hidden sm:table-cell">Technician</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recent_jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px', opacity: 0.35 }}>
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    No recent jobs found
                  </td>
                </tr>
              ) : (
                dashboardData.recent_jobs.map((job) => {
                  const customerName = job.customer?.name || 'Unknown';
                  const techName    = job.taken_by_worker?.name || '—';
                  return (
                    <tr key={job._id}>
                      <td>
                        <span className="job-id-pill">#{job._id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            className="avatar-initials"
                            style={{ background: pickColor(customerName), width: 30, height: 30, fontSize: 10 }}
                          >
                            {getInitials(customerName)}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{customerName}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>
                          {job.device_model || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="hidden sm:table-cell" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {techName}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(job.repair_job_taken_time).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;