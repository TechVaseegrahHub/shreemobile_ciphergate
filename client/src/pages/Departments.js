import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { exportDepartments } from '../utils/reportUtils';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/departments');
      setDepartments(res.data);
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await axios.put(`/api/departments/${editingDepartment._id}`, { name: departmentName });
        setSuccess('Department updated successfully');
      } else {
        await axios.post('/api/departments', { name: departmentName });
        setSuccess('Department created successfully');
      }
      setDepartmentName('');
      setShowModal(false);
      setEditingDepartment(null);
      fetchDepartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editingDepartment ? 'update' : 'create'} department`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await axios.delete(`/api/departments/${id}`);
        setSuccess('Department deleted successfully');
        fetchDepartments();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete department');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setDepartmentName('');
    setError('');
  };

  /* ── styles ─────────────────────────────────────────────── */
  const S = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
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
    btnPrimary: {
      padding: '10px 20px', borderRadius: 8, border: 'none',
      backgroundColor: '#2563EB', color: '#FFFFFF',
      fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
      boxShadow: '0 1px 2px rgba(37,99,235,0.1)',
    },
  };

  /* ── loader ─────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading departments…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Departments
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Manage shop departments</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={S.btnPrimary}>
          + Add Department
        </button>
      </div>

      {/* Messages */}
      {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{success}</div>}

      {/* Export row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <button onClick={() => exportDepartments(api, 'pdf')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>↓ PDF</button>
        <button onClick={() => exportDepartments(api, 'excel')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', color: '#16A34A', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>↓ Excel</button>
      </div>

      {/* Table */}
      <div style={S.card({ overflow: 'hidden' })}>
        {departments.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📁</div>
            <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500 }}>No departments found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: '70%' }}>Name</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#FFFFFF' }}>
                {departments.map(dept => (
                  <tr key={dept._id} style={{ transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                    <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>{dept.name}</td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      <button onClick={() => handleEdit(dept)} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: 13, marginRight: 16, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(dept._id)} style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Department Name</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  style={S.input}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                  required
                  autoFocus
                />
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Departments;