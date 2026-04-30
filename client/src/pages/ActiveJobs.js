import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { exportActiveJobs } from '../utils/reportUtils';

const LIMIT = 15;

/* ── Status config ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  'Intake':      { color: '#4B5563', bg: '#F3F4F6', dot: '#9CA3AF' },
  'In Progress': { color: '#1D4ED8', bg: '#DBEAFE', dot: '#3B82F6' },
  'Done':        { color: '#15803D', bg: '#DCFCE7', dot: '#22C55E' },
  'Ready':       { color: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },
  'default':     { color: '#B45309', bg: '#FEF3C7', dot: '#F59E0B' },
};

const getStatusCfg = (s) => STATUS_CONFIG[s] || STATUS_CONFIG['default'];

const formatCreationDate = (objectId) => {
  if (!objectId) return 'N/A';
  try {
    const ts = parseInt(objectId.substring(0, 8), 16) * 1000;
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return 'N/A'; }
};

/* ── Search icon ──────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);

/* ────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────── */
const ActiveJobs = () => {
  const [jobs,        setJobs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState('');
  const [searchTerm,  setSearchTerm]  = useState('');
  const [filter,      setFilter]      = useState('today');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [rangeApplied,setRangeApplied]= useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin/login');
  }, [navigate]);

  const buildParams = useCallback((pageNum, currentFilter, sd, ed) => {
    const params = { filter: currentFilter, page: pageNum, limit: LIMIT };
    if (currentFilter === 'range') { params.startDate = sd; params.endDate = ed; }
    return params;
  }, []);

  const fetchJobs = useCallback(async (currentFilter, sd, ed) => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/jobs/active', { params: buildParams(1, currentFilter, sd, ed) });
      setJobs(res.data.jobs); setTotal(res.data.total); setHasMore(res.data.hasMore); setPage(1);
    } catch { setError('Failed to fetch jobs.'); }
    finally { setLoading(false); }
  }, [buildParams]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await api.get('/jobs/active', { params: buildParams(next, filter, startDate, endDate) });
      setJobs(prev => [...prev, ...res.data.jobs]);
      setTotal(res.data.total); setHasMore(res.data.hasMore); setPage(next);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  };

  useEffect(() => {
    if (filter !== 'range') { setRangeApplied(false); fetchJobs(filter, '', ''); }
  }, [filter]); // eslint-disable-line

  const handleApplyRange = () => {
    if (!startDate || !endDate) return;
    setRangeApplied(true); fetchJobs('range', startDate, endDate);
  };

  const filteredJobs = searchTerm
    ? jobs.filter(j => {
        const t = searchTerm.toLowerCase();
        return j.customer?.name?.toLowerCase().includes(t)
          || j.device_model?.toLowerCase().includes(t)
          || j.reported_issue?.toLowerCase().includes(t)
          || j.job_card_number?.includes(t)
          || j._id.slice(-6).includes(t);
      })
    : jobs;

  const todayLabel = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── style helpers ──────────────────────────────────────── */
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
    filterBtn: (active) => ({
      padding: '8px 18px',
      borderRadius: 20,
      border: active ? '1px solid #2563EB' : '1px solid #E5E7EB',
      backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
      color: active ? '#1D4ED8' : '#6B7280',
      fontWeight: active ? 600 : 500,
      fontSize: 13,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      boxShadow: active ? '0 1px 2px rgba(37,99,235,0.1)' : 'none',
    }),
    input: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #D1D5DB',
      borderRadius: 10,
      padding: '10px 14px',
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

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Active Jobs
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Manage ongoing repair jobs
            </p>
          </div>
        </div>
      </div>

      {/* Filter + Search row */}
      <div style={{ ...S.card({ padding: '18px 20px', marginBottom: 16 }) }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: filter === 'range' ? 14 : 0 }}>
          {[
            { key: 'today', label: `📅 Today — ${todayLabel}` },
            { key: 'all',   label: '📋 All Jobs' },
            { key: 'range', label: '🗓️ Date Range' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={S.filterBtn(filter === f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Range picker */}
        {filter === 'range' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginTop: 12, padding: '12px', backgroundColor: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            {[['From', startDate, setStartDate], ['To', endDate, setEndDate]].map(([lbl, val, set]) => (
              <div key={lbl}>
                <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 4, fontWeight: 600 }}>{lbl}</div>
                <input type="date" value={val} onChange={e => set(e.target.value)} style={{ ...S.input, width: 'auto' }} />
              </div>
            ))}
            <button
              onClick={handleApplyRange}
              disabled={!startDate || !endDate}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                backgroundColor: startDate && endDate ? '#2563EB' : '#E5E7EB',
                color: startDate && endDate ? '#FFFFFF' : '#9CA3AF',
                fontWeight: 600, fontSize: 13, cursor: startDate && endDate ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
            >
              Apply Filter
            </button>
            {rangeApplied && (
              <span style={{ fontSize: 13, color: '#10B981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Applied
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search + Export */}
      <div style={{ ...S.card({ padding: '16px 20px', marginBottom: 20 }), display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search customer, device, issue, job ID…"
            style={{ ...S.input, paddingLeft: 38 }}
            onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', minWidth: 120 }}>
          {searchTerm
            ? `${filteredJobs.length} result${filteredJobs.length !== 1 ? 's' : ''}`
            : `${jobs.length} of ${total} jobs`}
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
          >
            Clear
          </button>
        )}
        {/* Export buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => exportActiveJobs(api, 'pdf')}
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
            onClick={() => exportActiveJobs(api, 'excel')}
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

      {/* Table card */}
      <div style={S.card({ overflow: 'hidden' })}>
        {/* Table header row */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Job List &nbsp;
            <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, backgroundColor: '#F3F4F6', padding: '2px 8px', borderRadius: 12 }}>
              {searchTerm ? filteredJobs.length : total}
            </span>
          </h2>
        </div>

        {/* States: loading / error / empty / table */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid #E5E7EB', borderTopColor: '#3B82F6',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading jobs…</p>
          </div>
        ) : error ? (
          <div style={{ padding: 32 }}>
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, padding: '12px 16px', fontSize: 14 }}>
              {error}
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🔍</div>
            <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500 }}>
              {searchTerm ? 'No jobs match your search.' : filter === 'today' ? 'No active jobs today.' : 'No active jobs found.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Job ID', 'Customer', 'Device', 'Issue', 'Status', 'Created', 'Action'].map((h, i) => (
                      <th key={h} style={{ ...S.th, borderTopLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === 6 ? 8 : 0 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#FFFFFF' }}>
                  {filteredJobs.map((job, idx) => {
                    const cfg = getStatusCfg(job.status);
                    return (
                      <tr
                        key={job._id}
                        style={{ transition: 'background-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      >
                        <td style={{ ...S.td, fontWeight: 600, color: '#374151', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 13 }}>
                          #{job.job_card_number || job._id.slice(-6)}
                        </td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{job.customer?.name || 'N/A'}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{job.customer?.phone || ''}</div>
                        </td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, color: '#1F2937' }}>{job.device_brand || ''}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{job.device_model || 'N/A'}</div>
                        </td>
                        <td style={{ ...S.td, maxWidth: 180 }}>
                          <span style={{ color: '#4B5563', fontSize: 13 }}>
                            {job.reported_issue?.substring(0, 32) || 'N/A'}
                            {job.reported_issue?.length > 32 ? '…' : ''}
                          </span>
                        </td>
                        <td style={S.td}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 9999,
                            backgroundColor: cfg.bg, color: cfg.color,
                            fontSize: 12, fontWeight: 600,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dot }} />
                            {job.status || 'N/A'}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontSize: 12.5, color: '#6B7280' }}>
                          {formatCreationDate(job._id)}
                        </td>
                        <td style={S.td}>
                          <Link
                            to={`/jobs/${job._id}`}
                            style={{
                              padding: '6px 12px', borderRadius: 6,
                              backgroundColor: '#EFF6FF', color: '#2563EB',
                              fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                              display: 'inline-block', transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More */}
            {!searchTerm && hasMore && (
              <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                  Showing <strong style={{ color: '#111827' }}>{jobs.length}</strong> of{' '}
                  <strong style={{ color: '#111827' }}>{total}</strong> jobs
                </p>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF', color: '#374151',
                    fontWeight: 600, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => !loadingMore && (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                  onMouseOut={(e) => !loadingMore && (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  {loadingMore ? (
                    <>
                      <span style={{ width: 14, height: 14, border: '2px solid #E5E7EB', borderTopColor: '#6B7280', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                      Loading…
                    </>
                  ) : 'Load More Jobs'}
                </button>
              </div>
            )}

            {/* All loaded */}
            {!searchTerm && !hasMore && jobs.length > 0 && (
              <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #E5E7EB', color: '#9CA3AF', fontSize: 13, backgroundColor: '#F9FAFB' }}>
                ✅ All {total} jobs loaded
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ActiveJobs;
