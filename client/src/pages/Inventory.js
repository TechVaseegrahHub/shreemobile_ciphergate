import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { exportInventory } from '../utils/reportUtils';

const Inventory = () => {
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPartId, setEditingPartId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', stock: 0, min_stock_alert: 5,
    cost_price: 0, selling_price: 0, location: '', supplier: '', color: ''
  });
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin/login');
  }, [navigate]);

  const fetchParts = async () => {
    try {
      const res = await api.get('/inventory');
      setParts(res.data);
    } catch (err) {
      setError('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: res.data[0]._id }));
      }
    } catch (err) {
      setError('Failed to fetch categories');
    }
  }, [formData.category]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchParts();
    fetchCategories();
    fetchSuppliers();
  }, [fetchCategories]);

  const filteredParts = parts.filter(part => {
    const s = searchTerm.toLowerCase();
    return (
      part.name.toLowerCase().includes(s) ||
      part.sku.toLowerCase().includes(s) ||
      (part.category?.name && part.category.name.toLowerCase().includes(s)) ||
      (part.supplier?.name && part.supplier.name.toLowerCase().includes(s))
    );
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === 'other') setShowCategoryModal(true);
    else setFormData({ ...formData, category: value });
  };

  const handleCustomCategorySubmit = async () => {
    if (customCategory.trim()) {
      try {
        const res = await api.post('/categories', { name: customCategory.trim() });
        setCategories(prev => [...prev, res.data]);
        setFormData({ ...formData, category: res.data._id });
        setShowCategoryModal(false);
        setCustomCategory('');
        setSuccess('Category created successfully');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to create category');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return setError('Part name is required');
    if (!formData.sku?.trim()) return setError('SKU is required');
    if (!formData.category) return setError('Category is required');
    if (typeof formData.category !== 'string' || !formData.category) return setError('Please select a valid category');
    if (categories.length === 0) return setError('Categories are not loaded yet.');
    const categoryExists = categories.some(cat => cat._id === formData.category);
    if (!categoryExists && formData.category !== 'other') return setError('Please select a valid category');
    if (!/^[0-9a-fA-F]{24}$/.test(formData.category)) return setError('Category ID format is invalid.');

    try {
      let submitData = {
        name: formData.name.trim(), sku: formData.sku.trim(), category: formData.category,
        stock: Number(formData.stock) || 0, min_stock_alert: Number(formData.min_stock_alert) || 0,
        cost_price: Number(formData.cost_price) || 0, selling_price: Number(formData.selling_price) || 0,
        location: formData.location || '', supplier: formData.supplier || '', color: formData.color || ''
      };

      if (formData.supplier?.trim()) {
        if (!/^[0-9a-fA-F]{24}$/.test(formData.supplier)) return setError('Supplier ID format is invalid.');
        submitData.supplier = formData.supplier;
      } else {
        delete submitData.supplier;
      }

      if (isEditing) {
        await api.put(`/inventory/${editingPartId}`, submitData);
        setSuccess('Part updated successfully');
      } else {
        await api.post('/inventory', submitData);
        setSuccess('Part added successfully');
      }
      closeModal();
      fetchParts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error.includes('SKU already exists') ? 'This SKU already exists.' : 'Server Error: ' + err.response.data.error);
      } else {
        setError(`Failed to ${isEditing ? 'update' : 'add'} part. Error: ` + err.message);
      }
      setTimeout(() => setError(''), 5000);
    }
  };

  const closeModal = () => {
    setShowModal(false); setIsEditing(false); setEditingPartId(null);
    setFormData({
      name: '', sku: '', category: categories.length > 0 ? categories[0]._id : '',
      stock: 0, min_stock_alert: 5, cost_price: 0, selling_price: 0,
      location: '', supplier: '', color: ''
    });
    setError('');
  };

  const closeCategoryModal = () => { setShowCategoryModal(false); setCustomCategory(''); };

  const handleEdit = (part) => {
    setFormData({
      name: part.name, sku: part.sku,
      category: part.category?._id || (categories.length > 0 ? categories[0]._id : ''),
      stock: part.stock, min_stock_alert: part.min_stock_alert,
      cost_price: part.cost_price, selling_price: part.selling_price,
      location: part.location || '', supplier: part.supplier?._id || '', color: part.color || ''
    });
    setIsEditing(true); setEditingPartId(part._id); setShowModal(true);
  };

  const handleDelete = async (partId) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      try {
        setDeleting(true);
        await api.delete(`/inventory/${partId}`);
        setSuccess('Part deleted successfully!');
        fetchParts();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete part. Please try again.');
        setTimeout(() => setError(''), 5000);
      } finally {
        setDeleting(false);
      }
    }
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
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading inventory…</p>
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
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139,92,246,0.25)',
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Inventory
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Manage your repair parts</p>
          </div>
        </div>
        <button onClick={() => { setFormData({ ...formData, category: categories.length > 0 ? categories[0]._id : '' }); setShowModal(true); }} style={S.btnPrimary}>
          + Add Product
        </button>
      </div>

      {/* Messages */}
      {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{success}</div>}

      {/* Search + Export */}
      <div style={{ ...S.card({ padding: '16px 20px', marginBottom: 20 }), display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search parts, SKU, category…" style={{ ...S.input, paddingLeft: 38 }}
            onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
          {filteredParts.length} of {parts.length} records
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportInventory(api, 'pdf')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>↓ PDF</button>
          <button onClick={() => exportInventory(api, 'excel')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', color: '#16A34A', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>↓ Excel</button>
        </div>
      </div>

      {/* Table */}
      <div style={S.card({ overflow: 'hidden' })}>
        {filteredParts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📦</div>
            <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500 }}>{searchTerm ? 'No parts match your search.' : 'No parts found in inventory.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>SKU</th>
                  <th style={S.th}>Category</th>
                  <th style={S.th}>Stock</th>
                  <th style={S.th}>Supplier</th>
                  <th style={S.th}>Price (Rs)</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#FFFFFF' }}>
                {filteredParts.map(part => {
                  const isLow = part.stock <= part.min_stock_alert;
                  return (
                    <tr key={part._id} style={{ transition: 'background-color 0.15s', backgroundColor: isLow ? '#FEF2F2' : '#FFFFFF' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = isLow ? '#FEE2E2' : '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = isLow ? '#FEF2F2' : '#FFFFFF'}>
                      <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>
                        {part.name}
                        {part.color && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: 500 }}>{part.color}</div>}
                      </td>
                      <td style={{ ...S.td, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{part.sku}</td>
                      <td style={S.td}>{part.category?.name || '—'}</td>
                      <td style={S.td}>
                        <span style={{ fontWeight: 700, color: isLow ? '#EF4444' : '#111827' }}>{part.stock}</span>
                        {isLow && <span style={{ marginLeft: 8, padding: '2px 6px', backgroundColor: '#FECACA', color: '#B91C1C', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Low</span>}
                      </td>
                      <td style={S.td}>{part.supplier?.name || '—'}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600, color: '#10B981' }}>{part.selling_price?.toFixed(2) || '0.00'}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Cost: {part.cost_price?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td style={S.td}>
                        <button onClick={() => handleEdit(part)} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: 13, marginRight: 16, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(part._id)} disabled={deleting} style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.5 : 1 }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Left Col */}
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Part Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={S.input} required />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>SKU *</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} style={S.input} required />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Color</label>
                    <input type="text" name="color" value={formData.color} onChange={handleInputChange} style={S.input} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Category *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select name="category" value={formData.category} onChange={handleCategoryChange} style={{ ...S.input, flex: 1 }} required>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        <option value="other">-- Add New Category --</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} style={S.input} />
                  </div>
                </div>

                {/* Right Col */}
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Supplier</label>
                    <select name="supplier" value={formData.supplier} onChange={handleInputChange} style={S.input}>
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={S.label}>Stock Qty</label>
                      <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} style={S.input} min="0" />
                    </div>
                    <div>
                      <label style={S.label}>Min Alert</label>
                      <input type="number" name="min_stock_alert" value={formData.min_stock_alert} onChange={handleInputChange} style={S.input} min="0" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={S.label}>Cost Price</label>
                      <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} style={S.input} min="0" step="0.01" />
                    </div>
                    <div>
                      <label style={S.label}>Selling Price</label>
                      <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} style={S.input} min="0" step="0.01" />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={!formData.name || !formData.sku || !formData.category} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: (!formData.name || !formData.sku || !formData.category) ? 0.5 : 1 }}>
                  {isEditing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 360, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Add New Category</h3>
            </div>
            <div style={{ padding: 20 }}>
              <label style={S.label}>Category Name *</label>
              <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={S.input} autoFocus />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 10, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
              <button onClick={closeCategoryModal} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', backgroundColor: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCustomCategorySubmit} disabled={!customCategory.trim()} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !customCategory.trim() ? 0.5 : 1 }}>Create</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;