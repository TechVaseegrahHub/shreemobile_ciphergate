import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { exportCancelledJobs } from '../utils/reportUtils';

/* ── helpers ──────────────────────────────────────────────── */
const formatCurrency = (amount) =>
  `₹ ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (ds) =>
  ds ? new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

/* ────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────── */
const CancelledJobs = () => {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/jobs/cancelled');
        setJobs(res.data);
      } catch { setError('Failed to fetch cancelled jobs.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = search
    ? jobs.filter(j =>
        j.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        j.device_brand?.toLowerCase().includes(search.toLowerCase()) ||
        j.device_model?.toLowerCase().includes(search.toLowerCase()) ||
        String(j.job_card_number).includes(search))
    : jobs;

  /* ── styles ─────────────────────────────────────────────── */
  const S = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#F9FAFB', // Light gray background
      padding: '28px 24px',
      fontFamily: "'Inter', sans-serif",
    },
    card: (extra = {}) => ({
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      ...extra,
    }),
    input: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #D1D5DB',
      borderRadius: 10,
      padding: '10px 14px 10px 38px',
      color: '#111827',
      fontSize: 14,
      outline: 'none',
      width: '100%',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    },
    th: {
      padding: '12px 16px',
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#6B7280',
      textAlign: 'left',
      borderBottom: '1px solid #E5E7EB',
      backgroundColor: '#F9FAFB',
    },
    td: {
      padding: '14px 16px',
      fontSize: 13.5,
      color: '#374151',
      borderBottom: '1px solid #E5E7EB',
      verticalAlign: 'middle',
    },
  };

  /* ── loading ─────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid #E5E7EB', borderTopColor: '#EF4444',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 14px',
        }} />
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading cancelled jobs…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ ...S.page }}>
      <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '16px 20px', fontSize: 14 }}>
        {error}
      </div>
    </div>
  );

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
        }}>
          <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
            Cancelled Jobs
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            Jobs that were cancelled by customers
          </p>
        </div>
      </div>

      {/* Search + Export */}
      <div style={{ ...S.card({ padding: '16px 20px', marginBottom: 20 }), display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, device, job ID…"
            style={S.input}
            onFocus={(e) => { e.target.style.borderColor = '#EF4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
          {filtered.length} of {jobs.length} records
        </span>
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            Clear
          </button>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => exportCancelledJobs(api, 'pdf')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #FECACA',
              backgroundColor: '#FEF2F2', color: '#DC2626',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
          >
            ↓ PDF
          </button>
          <button
            onClick={() => exportCancelledJobs(api, 'excel')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #BBF7D0',
              backgroundColor: '#F0FDF4', color: '#16A34A',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DCFCE7'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F0FDF4'}
          >
            ↓ Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={S.card({ overflow: 'hidden' })}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Cancelled Job List &nbsp;
            <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600, backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: 12 }}>
              {filtered.length}
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🚫</div>
            <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500 }}>No cancelled jobs found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Job ID', 'Customer', 'Device', 'Issue', 'Amount', 'Date', 'Reason', 'Status'].map((h, i) => (
                    <th key={h} style={{ ...S.th, borderTopLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === 7 ? 8 : 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#FFFFFF' }}>
                {filtered.map(job => (
                  <tr
                    key={job._id}
                    style={{ transition: 'background-color 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <td style={{ ...S.td, fontWeight: 600, color: '#374151', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 13 }}>
                      #{job.job_card_number}
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{job.customer?.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{job.customer?.phone}</div>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600, color: '#1F2937' }}>{job.device_brand}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{job.device_model}</div>
                    </td>
                    <td style={{ ...S.td, maxWidth: 180 }}>
                      <span style={{ color: '#4B5563', fontSize: 13 }} title={job.reported_issue}>
                        {job.reported_issue?.substring(0, 30)}{job.reported_issue?.length > 30 ? '…' : ''}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#059669' }}>
                      {formatCurrency(job.total_amount)}
                    </td>
                    <td style={{ ...S.td, fontSize: 12.5, color: '#6B7280' }}>
                      {formatDate(job.repair_job_taken_time)}
                    </td>
                    <td style={{ ...S.td, maxWidth: 180 }}>
                      <span style={{ color: '#6B7280', fontSize: 12.5 }} title={job.cancellation_reason}>
                        {job.cancellation_reason?.substring(0, 28) || 'N/A'}
                        {job.cancellation_reason?.length > 28 ? '…' : ''}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 9999,
                        backgroundColor: '#FEF2F2', color: '#DC2626',
                        fontSize: 12, fontWeight: 600,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CancelledJobs;