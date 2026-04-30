import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [filterSupplier, setFilterSupplier] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', supplier: '', paymentStatus: [],
    minAmount: '', maxAmount: '', invoiceNumber: '', part: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '', sku: '', category: '', supplier: '', cost_price: '', selling_price: '',
    stock: 1, min_stock_alert: 5, location: '', color: ''
  });
  const [formData, setFormData] = useState({
    supplier: filterSupplier || '', purchaseDate: '', invoiceNumber: '',
    items: [{ part: '', quantity: 1, unitPrice: 0, showSearch: false, searchTerm: '', filteredParts: [] }],
    subtotal: 0, tax: 0, discount: 0, totalAmount: 0, paymentStatus: 'Pending', notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);

  // Dropdown data
  const [suppliers, setSuppliers] = useState([]);
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const supplierId = queryParams.get('supplier');
    if (supplierId) setFilterSupplier(supplierId);
  }, [location]);

  const fetchData = useCallback(async () => {
    try {
      const [suppliersRes, partsRes, categoriesRes] = await Promise.all([
        api.get('/suppliers'), api.get('/inventory'), api.get('/categories')
      ]);
      setSuppliers(suppliersRes.data); setParts(partsRes.data); setCategories(categoriesRes.data);

      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.supplier) queryParams.append('supplier', filters.supplier);
      if (filters.paymentStatus.length > 0) filters.paymentStatus.forEach(status => queryParams.append('paymentStatus', status));
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
      if (filters.invoiceNumber) queryParams.append('invoiceNumber', filters.invoiceNumber);
      if (filters.part) queryParams.append('part', filters.part);
      
      let purchasesRes;
      if (filterSupplier) {
        const supplierQuery = queryParams.toString() ? `/purchases/supplier/${filterSupplier}?${queryParams.toString()}` : `/purchases/supplier/${filterSupplier}`;
        purchasesRes = await api.get(supplierQuery);
      } else {
        const queryString = queryParams.toString() ? `/purchases?${queryParams.toString()}` : '/purchases';
        purchasesRes = await api.get(queryString);
      }
      setPurchases(purchasesRes.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filterSupplier, filters]);

  useEffect(() => { fetchData(); }, [filterSupplier, filters, fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? value : updatedItems[index].unitPrice;
      updatedItems[index].totalPrice = quantity * unitPrice;
    }
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const tax = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const totalAmount = subtotal + tax - discount;
    setFormData(prev => ({ ...prev, subtotal, totalAmount }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev, items: [{ part: '', quantity: 1, unitPrice: 0, showSearch: false, searchTerm: '', filteredParts: [] }, ...prev.items]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = [...formData.items];
      updatedItems.splice(index, 1);
      setFormData(prev => ({ ...prev, items: updatedItems }));
      calculateTotals(updatedItems);
    }
  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.sku || !newProductForm.category) {
      return setError('Please fill in all required fields: Name, SKU, and Category');
    }
    try {
      const submitData = {
        name: newProductForm.name.trim(), sku: newProductForm.sku.trim(), category: newProductForm.category,
        stock: Number(newProductForm.stock) || 0, min_stock_alert: Number(newProductForm.min_stock_alert) || 5,
        cost_price: Number(newProductForm.cost_price) || 0, selling_price: Number(newProductForm.selling_price) || 0,
        location: newProductForm.location, supplier: newProductForm.supplier || undefined, color: newProductForm.color
      };
      const response = await api.post('/inventory', submitData);
      setParts(prev => [...prev, response.data]);
      
      const itemIndex = formData.items.findIndex(item => item.showAddNewProductModal);
      if (itemIndex !== -1) {
        const updatedItems = [...formData.items];
        updatedItems[itemIndex].part = response.data._id;
        updatedItems[itemIndex].showAddNewProductModal = false;
        setFormData(prev => ({ ...prev, items: updatedItems }));
      }
      setSuccess('New product added successfully!');
      setShowNewProductModal(false);
      setNewProductForm({ name: '', sku: '', category: '', supplier: '', cost_price: '', selling_price: '', stock: 1, min_stock_alert: 5, location: '', color: '' });
      const resetItems = formData.items.map(item => ({ ...item, showAddNewProductModal: false }));
      setFormData(prev => ({ ...prev, items: resetItems }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add new product. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openNewProductModal = (itemIndex) => {
    const updatedItems = [...formData.items];
    updatedItems[itemIndex].showAddNewProductModal = true;
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setShowNewProductModal(true);
  };

  const closeNewProductModal = () => {
    setShowNewProductModal(false);
    const updatedItems = formData.items.map(item => ({ ...item, showAddNewProductModal: false }));
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setNewProductForm({ name: '', sku: '', category: '', supplier: '', cost_price: '', selling_price: '', stock: 1, min_stock_alert: 5, location: '', color: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/purchases/${editingPurchaseId}`, formData);
        setSuccess('Purchase updated successfully');
      } else {
        await api.post('/purchases', formData);
        setSuccess('Purchase created successfully');
      }
      closeModal();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} purchase`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (purchase) => {
    setFormData({
      supplier: purchase.supplier._id || purchase.supplier,
      purchaseDate: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : '',
      invoiceNumber: purchase.invoiceNumber || '',
      items: purchase.items.map(item => ({
        part: item.part ? (item.part._id || item.part) : '',
        quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice,
        showSearch: false, searchTerm: '', filteredParts: []
      })),
      subtotal: purchase.subtotal || 0, tax: purchase.tax || 0, discount: purchase.discount || 0,
      totalAmount: purchase.totalAmount || 0, paymentStatus: purchase.paymentStatus || 'Pending',
      notes: purchase.notes || ''
    });
    setIsEditing(true); setEditingPurchaseId(purchase._id); setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await api.delete(`/purchases/${id}`);
        fetchData();
        setSuccess('Purchase deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete purchase');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleView = async (purchase) => {
    try {
      const response = await api.get(`/purchases/${purchase._id}`);
      const fullPurchase = response.data;
      setFormData({
        supplier: fullPurchase.supplier._id || fullPurchase.supplier,
        purchaseDate: fullPurchase.purchaseDate ? new Date(fullPurchase.purchaseDate).toISOString().split('T')[0] : '',
        invoiceNumber: fullPurchase.invoiceNumber || '',
        items: fullPurchase.items.map(item => ({
          part: item.part ? (item.part._id || item.part) : '',
          quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice,
          showSearch: false, searchTerm: '', filteredParts: []
        })),
        subtotal: fullPurchase.subtotal || 0, tax: fullPurchase.tax || 0, discount: fullPurchase.discount || 0,
        totalAmount: fullPurchase.totalAmount || 0, paymentStatus: fullPurchase.paymentStatus || 'Pending',
        notes: fullPurchase.notes || ''
      });
      setIsEditing(false); setEditingPurchaseId(fullPurchase._id); setShowModal(true);
    } catch (err) {
      handleEdit(purchase); setIsEditing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false); setIsEditing(false); setEditingPurchaseId(null);
    setFormData({
      supplier: filterSupplier || '', purchaseDate: '', invoiceNumber: '',
      items: [{ part: '', quantity: 1, unitPrice: 0 }],
      subtotal: 0, tax: 0, discount: 0, totalAmount: 0, paymentStatus: 'Pending', notes: ''
    });
    setError('');
  };

  const downloadPDF = async () => {
    const invoiceElement = document.getElementById('purchase-invoice');
    if (!invoiceElement) return setError('Unable to generate PDF');
    try {
      const canvas = await html2canvas(invoiceElement, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210, pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight, position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const invoiceNumber = formData.invoiceNumber || 'invoice';
      const date = formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      pdf.save(`purchase_invoice_${invoiceNumber}_${date}.pdf`);
      setSuccess('PDF downloaded successfully');
    } catch (err) {
      setError('Failed to generate PDF');
    }
  };

  const handleFilterChange = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));
  const handlePaymentStatusChange = (status) => setFilters(prev => ({
    ...prev, paymentStatus: prev.paymentStatus.includes(status) ? prev.paymentStatus.filter(s => s !== status) : [...prev.paymentStatus, status]
  }));
  const applyFilters = () => fetchData();
  const clearFilters = () => setFilters({ startDate: '', endDate: '', supplier: '', paymentStatus: [], minAmount: '', maxAmount: '', invoiceNumber: '', part: '' });
  const hasActiveFilters = () => filters.startDate || filters.endDate || filters.supplier || filters.paymentStatus.length > 0 || filters.minAmount || filters.maxAmount || filters.invoiceNumber || filters.part;
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const formatCurrency = (amount) => `Rs ${amount.toFixed(2)}`;
  
  const getFilterSummary = () => {
    const summaries = [];
    if (filters.startDate || filters.endDate) summaries.push(`Date: ${filters.startDate ? formatDate(filters.startDate) : 'Beginning'} to ${filters.endDate ? formatDate(filters.endDate) : 'Today'}`);
    if (filters.supplier) summaries.push(`Supplier: ${suppliers.find(s => s._id === filters.supplier)?.name || 'Unknown'}`);
    if (filters.paymentStatus.length > 0) summaries.push(`Status: ${filters.paymentStatus.join(', ')}`);
    if (filters.minAmount || filters.maxAmount) summaries.push(`Amount: Rs ${filters.minAmount || '0'} - Rs ${filters.maxAmount || '∞'}`);
    if (filters.invoiceNumber) summaries.push(`Invoice: ${filters.invoiceNumber}`);
    if (filters.part) summaries.push(`Part: ${parts.find(p => p._id === filters.part)?.name || 'Unknown'}`);
    return summaries;
  };

  const setDateRange = (days) => {
    const end = new Date(), start = new Date(); start.setDate(start.getDate() - days);
    setFilters(prev => ({ ...prev, startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }));
  };
  const setAmountRange = (min, max) => setFilters(prev => ({ ...prev, minAmount: min, maxAmount: max }));

  /* ── styles ─────────────────────────────────────────────── */
  const S = {
    page: { minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '28px 24px', fontFamily: "'Inter', sans-serif" },
    card: (extra = {}) => ({ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...extra }),
    input: { backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 },
    th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', textAlign: 'left', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' },
    td: { padding: '14px 16px', fontSize: 13.5, color: '#374151', borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle' },
    btnPrimary: { padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(37,99,235,0.1)' },
    btnSecondary: { padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' },
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading purchases…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Purchases
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              {filterSupplier ? `Supplier: ${suppliers.find(s => s._id === filterSupplier)?.name}` : 'Manage purchase orders'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {filterSupplier && <button onClick={() => { setFilterSupplier(''); navigate('/admin/purchases'); }} style={S.btnSecondary}>Clear Supplier Filter</button>}
          <button onClick={() => setShowFilters(!showFilters)} style={S.btnSecondary}>{showFilters ? 'Hide Filters' : 'Filter Options'}</button>
          <button onClick={() => setShowModal(true)} style={S.btnPrimary}>+ New Purchase</button>
        </div>
      </div>

      {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{success}</div>}

      {/* Filter Panel */}
      {showFilters && (
        <div style={{ ...S.card({ padding: 24, marginBottom: 24 }) }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div>
              <label style={S.label}>Date Range (From)</label>
              <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Date Range (To)</label>
              <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Supplier</label>
              <select value={filters.supplier} onChange={e => handleFilterChange('supplier', e.target.value)} style={S.input}>
                <option value="">All Suppliers</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Invoice Number</label>
              <input type="text" value={filters.invoiceNumber} onChange={e => handleFilterChange('invoiceNumber', e.target.value)} style={S.input} placeholder="Search invoice..." />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button onClick={clearFilters} style={{ ...S.btnSecondary, padding: '8px 16px' }}>Clear All</button>
            <button onClick={applyFilters} style={{ ...S.btnPrimary, padding: '8px 16px' }}>Apply Filters</button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && !showFilters && (
        <div style={{ padding: '12px 16px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>Active Filters:</span>
          {getFilterSummary().map((sum, i) => (
            <span key={i} style={{ padding: '4px 10px', backgroundColor: '#FFFFFF', borderRadius: 20, fontSize: 12, border: '1px solid #DBEAFE', color: '#1E3A8A' }}>{sum}</span>
          ))}
          <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, fontWeight: 600, marginLeft: 'auto', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div style={S.card({ overflow: 'hidden' })}>
        {purchases.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🧾</div>
            <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500 }}>No purchases found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Supplier</th>
                  <th style={S.th}>Invoice</th>
                  <th style={S.th}>Items</th>
                  <th style={S.th}>Total (Rs)</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#FFFFFF' }}>
                {purchases.map(purchase => (
                  <tr key={purchase._id} style={{ transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{formatDate(purchase.purchaseDate)}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>{purchase.supplier?.name || '—'}</td>
                    <td style={{ ...S.td, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{purchase.invoiceNumber || '—'}</td>
                    <td style={S.td}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 600 }}>{purchase.items?.length || 0} items</span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 700, color: '#111827' }}>{purchase.totalAmount?.toFixed(2) || '0.00'}</td>
                    <td style={S.td}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        backgroundColor: purchase.paymentStatus === 'Paid' ? '#DCFCE7' : purchase.paymentStatus === 'Pending' ? '#FEF9C3' : purchase.paymentStatus === 'Partial' ? '#DBEAFE' : '#FEE2E2',
                        color: purchase.paymentStatus === 'Paid' ? '#16A34A' : purchase.paymentStatus === 'Pending' ? '#CA8A04' : purchase.paymentStatus === 'Partial' ? '#2563EB' : '#EF4444'
                      }}>
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button onClick={() => handleView(purchase)} style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 600, fontSize: 13, marginRight: 12, cursor: 'pointer' }}>View</button>
                      <button onClick={() => handleEdit(purchase)} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: 13, marginRight: 12, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(purchase._id)} style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Form/View Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: (!isEditing && editingPurchaseId) ? 800 : 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
                {isEditing ? 'Edit Purchase' : (editingPurchaseId ? 'Purchase Invoice' : 'Add New Purchase')}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
            </div>

            {(isEditing || (!isEditing && !editingPurchaseId)) ? (
              // EDIT / ADD FORM
              <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={S.label}>Supplier *</label>
                    <select name="supplier" value={formData.supplier} onChange={handleInputChange} style={S.input} required disabled={editingPurchaseId && !isEditing}>
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Purchase Date *</label>
                    <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} style={S.input} required disabled={editingPurchaseId && !isEditing} />
                  </div>
                  <div>
                    <label style={S.label}>Invoice Number</label>
                    <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} style={S.input} disabled={editingPurchaseId && !isEditing} />
                  </div>
                  <div>
                    <label style={S.label}>Payment Status</label>
                    <select name="paymentStatus" value={formData.paymentStatus} onChange={handleInputChange} style={S.input} disabled={editingPurchaseId && !isEditing}>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partial</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>Purchase Items</h4>
                    <button type="button" onClick={addItem} style={{ ...S.btnSecondary, padding: '6px 12px', fontSize: 12 }}>+ Add Item</button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} style={{ padding: 16, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 12, position: 'relative' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
                        <div>
                          <label style={{ ...S.label, fontSize: 12 }}>Part *</label>
                          <div style={{ position: 'relative' }}>
                            <select value={item.part} onChange={e => handleItemChange(index, 'part', e.target.value)} style={{ ...S.input, display: item.showSearch ? 'none' : 'block' }} required disabled={editingPurchaseId && !isEditing}>
                              <option value="">Select Part</option>
                              {parts.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                            </select>
                            <input type="text" placeholder="Search..." value={item.searchTerm || ''} onChange={e => {
                                const up = [...formData.items]; up[index].searchTerm = e.target.value;
                                up[index].filteredParts = parts.filter(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()) || p.sku.toLowerCase().includes(e.target.value.toLowerCase()));
                                setFormData(prev => ({...prev, items: up}));
                              }} style={{ ...S.input, display: item.showSearch ? 'block' : 'none' }} disabled={editingPurchaseId && !isEditing} />
                            
                            {item.showSearch && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: '#FFF', border: '1px solid #D1D5DB', borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                <div style={{ padding: 8, borderBottom: '1px solid #E5E7EB' }}>
                                  <button type="button" onClick={() => openNewProductModal(index)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add New Product</button>
                                </div>
                                {item.filteredParts?.map(p => (
                                  <div key={p._id} onClick={() => {
                                      const up = [...formData.items]; up[index].part = p._id; up[index].showSearch = false; up[index].searchTerm = ''; up[index].filteredParts = [];
                                      setFormData(prev => ({...prev, items: up}));
                                    }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                    <div style={{ color: '#6B7280', fontSize: 11 }}>{p.sku}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button type="button" onClick={() => {
                            const up = [...formData.items]; up[index].showSearch = !up[index].showSearch; up[index].searchTerm = ''; up[index].filteredParts = parts;
                            setFormData(prev => ({...prev, items: up}));
                          }} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, marginTop: 6, cursor: 'pointer', padding: 0 }} disabled={editingPurchaseId && !isEditing}>
                            {item.showSearch ? 'Cancel Search' : 'Search / Add New'}
                          </button>
                        </div>
                        <div>
                          <label style={{ ...S.label, fontSize: 12 }}>Qty</label>
                          <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} style={S.input} disabled={editingPurchaseId && !isEditing} />
                        </div>
                        <div>
                          <label style={{ ...S.label, fontSize: 12 }}>Unit Price</label>
                          <input type="number" step="0.01" min="0" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} style={S.input} disabled={editingPurchaseId && !isEditing} />
                        </div>
                        <div>
                          <label style={{ ...S.label, fontSize: 12 }}>Total</label>
                          <input type="text" readOnly value={item.totalPrice?.toFixed(2) || '0.00'} style={{ ...S.input, backgroundColor: '#F3F4F6', color: '#111827', fontWeight: 600 }} />
                        </div>
                      </div>
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} style={{ position: 'absolute', top: -10, right: -10, width: 24, height: 24, borderRadius: '50%', backgroundColor: '#EF4444', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>×</button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, border: '1px solid #BFDBFE', marginBottom: 24 }}>
                  <div>
                    <label style={{ ...S.label, color: '#1D4ED8' }}>Subtotal</label>
                    <input type="text" readOnly value={formData.subtotal.toFixed(2)} style={{ ...S.input, backgroundColor: 'transparent', borderColor: '#93C5FD' }} />
                  </div>
                  <div>
                    <label style={{ ...S.label, color: '#1D4ED8' }}>Tax</label>
                    <input type="number" step="0.01" min="0" name="tax" value={formData.tax} onChange={handleInputChange} style={S.input} disabled={editingPurchaseId && !isEditing} />
                  </div>
                  <div>
                    <label style={{ ...S.label, color: '#1D4ED8' }}>Discount</label>
                    <input type="number" step="0.01" min="0" name="discount" value={formData.discount} onChange={handleInputChange} style={S.input} disabled={editingPurchaseId && !isEditing} />
                  </div>
                  <div>
                    <label style={{ ...S.label, color: '#1D4ED8', fontWeight: 800 }}>Final Total</label>
                    <input type="text" readOnly value={formData.totalAmount.toFixed(2)} style={{ ...S.input, backgroundColor: '#DBEAFE', borderColor: '#60A5FA', fontWeight: 800, color: '#1E3A8A' }} />
                  </div>
                </div>

                <div>
                  <label style={S.label}>Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} style={{ ...S.input, minHeight: 80 }} disabled={editingPurchaseId && !isEditing} placeholder="Additional info..."></textarea>
                </div>
              </form>
            ) : (
              // VIEW ONLY (Invoice Report)
              <div id="purchase-invoice" style={{ padding: 32, overflowY: 'auto' }}>
                <div style={{ borderBottom: '2px solid #E5E7EB', paddingBottom: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>INVOICE #{formData.invoiceNumber || 'N/A'}</h2>
                    <div style={{ fontSize: 14, color: '#6B7280' }}>Date: {formData.purchaseDate ? new Date(formData.purchaseDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ padding: '6px 14px', borderRadius: 20, backgroundColor: formData.paymentStatus === 'Paid' ? '#DCFCE7' : '#FEF9C3', color: formData.paymentStatus === 'Paid' ? '#16A34A' : '#CA8A04', fontWeight: 700, fontSize: 14, display: 'inline-block' }}>
                      {formData.paymentStatus}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Supplier Details</h4>
                  <div style={{ backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{suppliers.find(s => s._id === formData.supplier)?.name || 'N/A'}</div>
                    <div style={{ fontSize: 14, color: '#4B5563' }}>{suppliers.find(s => s._id === formData.supplier)?.email || 'No email provided'}</div>
                    <div style={{ fontSize: 14, color: '#4B5563' }}>{suppliers.find(s => s._id === formData.supplier)?.phone || 'No phone provided'}</div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, borderTop: '1px solid #E5E7EB', borderBottom: '2px solid #E5E7EB' }}>Part Description</th>
                      <th style={{ ...S.th, borderTop: '1px solid #E5E7EB', borderBottom: '2px solid #E5E7EB', textAlign: 'center' }}>Qty</th>
                      <th style={{ ...S.th, borderTop: '1px solid #E5E7EB', borderBottom: '2px solid #E5E7EB', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ ...S.th, borderTop: '1px solid #E5E7EB', borderBottom: '2px solid #E5E7EB', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((it, i) => {
                      const p = parts.find(x => x._id === it.part);
                      return (
                        <tr key={i}>
                          <td style={{ ...S.td, padding: '16px' }}>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{p?.name || 'Unknown'}</div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>SKU: {p?.sku || '—'}</div>
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>{it.quantity}</td>
                          <td style={{ ...S.td, textAlign: 'right' }}>Rs {it.unitPrice?.toFixed(2)}</td>
                          <td style={{ ...S.td, textAlign: 'right', fontWeight: 600 }}>Rs {it.totalPrice?.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: 300 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#4B5563' }}>
                      <span>Subtotal</span><span>Rs {formData.subtotal?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#4B5563' }}>
                      <span>Tax</span><span>Rs {formData.tax?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#4B5563' }}>
                      <span>Discount</span><span style={{ color: '#EF4444' }}>-Rs {formData.discount?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: 8, borderTop: '2px solid #E5E7EB', fontSize: 18, fontWeight: 800, color: '#111827' }}>
                      <span>Total</span><span>Rs {formData.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {formData.notes && (
                  <div style={{ marginTop: 32, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 8, fontSize: 14, color: '#4B5563' }}>
                    <strong style={{ color: '#111827' }}>Notes:</strong> {formData.notes}
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={closeModal} style={S.btnSecondary}>
                {(!isEditing && editingPurchaseId) ? 'Close' : 'Cancel'}
              </button>
              {(!isEditing && editingPurchaseId) && (
                <button type="button" onClick={downloadPDF} style={S.btnPrimary}>↓ Download PDF</button>
              )}
              {(isEditing || (!isEditing && !editingPurchaseId)) && (
                <button type="button" onClick={handleSubmit} style={S.btnPrimary}>
                  {editingPurchaseId ? 'Update Purchase' : 'Save Purchase'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Product Sub-Modal */}
      {showNewProductModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Add Quick Product</h3>
            </div>
            <form onSubmit={handleAddNewProduct} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Product Name *</label>
                <input type="text" name="name" value={newProductForm.name} onChange={handleNewProductChange} style={S.input} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={S.label}>SKU *</label>
                  <input type="text" name="sku" value={newProductForm.sku} onChange={handleNewProductChange} style={S.input} required />
                </div>
                <div>
                  <label style={S.label}>Category *</label>
                  <select name="category" value={newProductForm.category} onChange={handleNewProductChange} style={S.input} required>
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={S.label}>Cost Price</label>
                  <input type="number" name="cost_price" value={newProductForm.cost_price} onChange={handleNewProductChange} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Selling Price</label>
                  <input type="number" name="selling_price" value={newProductForm.selling_price} onChange={handleNewProductChange} style={S.input} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={closeNewProductModal} style={S.btnSecondary}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Purchases;