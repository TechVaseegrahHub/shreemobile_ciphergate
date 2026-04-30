import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { exportSuppliers } from '../utils/reportUtils';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', contactPerson: '', email: '', phone: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    gstNumber: '', paymentTerms: '', isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      setError('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/suppliers/${editingSupplierId}`, formData);
        setSuccess('Supplier updated successfully');
      } else {
        await api.post('/suppliers', formData);
        setSuccess('Supplier created successfully');
      }
      closeModal();
      fetchSuppliers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} supplier`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name, contactPerson: supplier.contactPerson || '',
      email: supplier.email || '', phone: supplier.phone || '',
      address: {
        street: supplier.address?.street || '', city: supplier.address?.city || '',
        state: supplier.address?.state || '', zipCode: supplier.address?.zipCode || '',
        country: supplier.address?.country || ''
      },
      gstNumber: supplier.gstNumber || '', paymentTerms: supplier.paymentTerms || '',
      isActive: supplier.isActive !== undefined ? supplier.isActive : true
    });
    setIsEditing(true);
    setEditingSupplierId(supplier._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.delete(`/suppliers/${id}`);
        fetchSuppliers();
        setSuccess('Supplier deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete supplier');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingSupplierId(null);
    setFormData({
      name: '', contactPerson: '', email: '', phone: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      gstNumber: '', paymentTerms: '', isActive: true
    });
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
      boxSizing: 'border-box',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    },
    label: {
      display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6
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
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading suppliers…</p>
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
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Suppliers
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Manage your vendors</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={S.btnPrimary}>
          + Add Supplier
        </button>
      </div>

      {/* Messages */}
      {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{success}</div>}

      {/* Export row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <button onClick={() => exportSuppliers(api, 'pdf')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>↓ PDF</button>
        <button onClick={() => exportSuppliers(api, 'excel')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', color: '#16A34A', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>↓ Excel</button>
      </div>

      {/* Table */}
      <div style={S.card({ overflow: 'hidden' })}>
        {suppliers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🚚</div>
            <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500 }}>No suppliers found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Contact Person</th>
                  <th style={S.th}>Email & Phone</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#FFFFFF' }}>
                {suppliers.map(sup => (
                  <tr key={sup._id} style={{ transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                    <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>{sup.name}</td>
                    <td style={S.td}>{sup.contactPerson || '—'}</td>
                    <td style={S.td}>
                      <div style={{ color: '#374151', fontSize: 13 }}>{sup.email || '—'}</div>
                      <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>{sup.phone || '—'}</div>
                    </td>
                    <td style={S.td}>
                      <span style={{ padding: '4px 10px', borderRadius: 9999, backgroundColor: sup.isActive ? '#DCFCE7' : '#FEE2E2', color: sup.isActive ? '#16A34A' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                        {sup.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button onClick={() => handleEdit(sup)} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: 13, marginRight: 16, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(sup._id)} style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, fontSize: 13, marginRight: 16, cursor: 'pointer' }}>Delete</button>
                      <button onClick={() => navigate(`/admin/purchases?supplier=${sup._id}`)} style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Purchases</button>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
                {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                
                {/* Left Column */}
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Supplier Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={S.input} required />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Contact Person</label>
                    <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} style={S.input} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={S.input} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} style={S.input} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>GST Number</label>
                    <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} style={S.input} />
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Payment Terms</label>
                    <input type="text" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} style={S.input} placeholder="e.g. Net 30 days" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Street Address</label>
                    <input type="text" name="address.street" value={formData.address.street} onChange={handleInputChange} style={S.input} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={S.label}>City</label>
                      <input type="text" name="address.city" value={formData.address.city} onChange={handleInputChange} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>State</label>
                      <input type="text" name="address.state" value={formData.address.state} onChange={handleInputChange} style={S.input} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={S.label}>ZIP Code</label>
                      <input type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleInputChange} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Country</label>
                      <input type="text" name="address.country" value={formData.address.country} onChange={handleInputChange} style={S.input} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} id="activeCheck" style={{ width: 18, height: 18 }} />
                    <label htmlFor="activeCheck" style={{ marginLeft: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>Active Supplier</label>
                  </div>
                </div>

              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={!formData.name} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: !formData.name ? 0.5 : 1 }}>
                  {isEditing ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;