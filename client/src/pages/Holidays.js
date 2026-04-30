import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    appliesTo: 'all', // 'all' or 'specific'
  });
  
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Fetch holidays and workers from the backend
  useEffect(() => {
    fetchHolidays();
    fetchWorkers();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await api.get('/holidays');
      setHolidays(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch holidays');
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch workers');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle employee selection
  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...holidays];
    
    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end day
      
      filtered = filtered.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= start && holidayDate <= end;
      });
    }
    
    // Upcoming only filter
    if (showUpcomingOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate >= today;
      });
    }
    
    return filtered;
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setShowUpcomingOnly(false);
  };

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      name: '',
      date: '',
      description: '',
      appliesTo: 'all'
    });
    setSelectedEmployees([]);
    setIsEditing(false);
    setEditingHolidayId(null);
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (holiday) => {
    setFormData({
      name: holiday.name,
      date: formatDateForInput(holiday.date),
      description: holiday.description,
      appliesTo: holiday.appliesTo
    });
    
    if (holiday.appliesTo === 'specific' && holiday.employees) {
      setSelectedEmployees(holiday.employees.map(emp => emp._id));
    } else {
      setSelectedEmployees([]);
    }
    
    setIsEditing(true);
    setEditingHolidayId(holiday._id);
    setShowModal(true);
  };

  // Format date for input field
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if holiday is in the past
  const isPastHoliday = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(dateString);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate < today;
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingHolidayId(null);
    setFormData({
      name: '',
      date: '',
      description: '',
      appliesTo: 'all'
    });
    setSelectedEmployees([]);
    setError('');
    setSuccess('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation (removed description as required field)
    if (!formData.name || !formData.date) {
      setError('Name and Date are required');
      return;
    }
    
    if (formData.appliesTo === 'specific' && selectedEmployees.length === 0) {
      setError('Please select at least one employee');
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        employees: formData.appliesTo === 'specific' ? selectedEmployees : []
      };
      
      if (isEditing) {
        // Update existing holiday
        await api.put(`/holidays/${editingHolidayId}`, submitData);
        setSuccess('Holiday updated successfully');
      } else {
        // Create new holiday
        await api.post('/holidays', submitData);
        setSuccess('Holiday created successfully');
      }
      
      closeModal();
      fetchHolidays(); // Refresh the list
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} holiday`);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await api.delete(`/holidays/${id}`);
        setSuccess('Holiday deleted successfully');
        fetchHolidays(); // Refresh the list
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to delete holiday');
      }
    }
  };

  // Get status badge
  const getStatusBadge = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(dateString);
    holidayDate.setHours(0, 0, 0, 0);
    
    if (holidayDate < today) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">Past</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-800">Upcoming</span>;
    }
  };

  // Get applies to text (modified to show only names without emails)
  const getAppliesToText = (holiday) => {
    if (holiday.appliesTo === 'all') {
      return 'All Employees';
    } else {
      if (holiday.employees && holiday.employees.length > 0) {
        return `${holiday.employees.length} Employee${holiday.employees.length > 1 ? 's' : ''}`;
      } else {
        return 'None Selected';
      }
    }
  };

  /* ── styles ─────────────────────────────────────────────── */
  const S = {
    page: { minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '28px 24px', fontFamily: "'Inter', sans-serif" },
    card: (extra = {}) => ({ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...extra }),
    input: { backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 },
    th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', textAlign: 'left', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' },
    td: { padding: '14px 16px', fontSize: 13.5, color: '#374151', borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle' },
    btnPrimary: { padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(37,99,235,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnSecondary: { padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnDanger: { padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' },
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading holidays…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const filteredHolidays = applyFilters();

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Holiday Management
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Manage company holidays</p>
          </div>
        </div>
        <button onClick={openCreateModal} style={S.btnPrimary}>Add Holiday</button>
      </div>

      {error && !showModal && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>
      )}

      {success && !showModal && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{success}</div>
      )}

      {/* Filters Section */}
      <div style={{ ...S.card({ marginBottom: 24 }) }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Filters</h3>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={S.label}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={S.input} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={S.label}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={S.input} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={applyFilters} style={S.btnPrimary}>Apply Range</button>
              <button 
                onClick={() => setShowUpcomingOnly(!showUpcomingOnly)} 
                style={{ ...S.btnSecondary, backgroundColor: showUpcomingOnly ? '#D1FAE5' : '#FFFFFF', borderColor: showUpcomingOnly ? '#A7F3D0' : '#D1D5DB', color: showUpcomingOnly ? '#065F46' : '#374151' }}
              >
                {showUpcomingOnly ? 'Showing Upcoming' : 'Show Upcoming'}
              </button>
              <button onClick={clearFilters} style={S.btnSecondary}>Clear Filters</button>
            </div>
          </div>
        </div>
      </div>

      {/* Holidays List */}
      <div style={S.card()}>
        <div style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 20px' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Holidays List ({filteredHolidays.length})</h3>
        </div>
        {filteredHolidays.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
            No holidays found. Click "Add Holiday" to add one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Description</th>
                  <th style={S.th}>Applies To</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Created</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHolidays.map((holiday) => (
                  <tr key={holiday._id} style={{ transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{holiday.name}</div>
                    </td>
                    <td style={{ ...S.td, color: '#4B5563' }}>{formatDateForDisplay(holiday.date)}</td>
                    <td style={{ ...S.td, color: '#6B7280', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{holiday.description}</td>
                    <td style={{ ...S.td, color: '#4B5563' }}>{getAppliesToText(holiday)}</td>
                    <td style={S.td}>{getStatusBadge(holiday.date)}</td>
                    <td style={{ ...S.td, color: '#9CA3AF', fontSize: 12 }}>{new Date(holiday.createdAt).toLocaleDateString()}</td>
                    <td style={S.td}>
                      <button onClick={() => openEditModal(holiday)} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginRight: 12 }}>Edit</button>
                      <button 
                        onClick={() => handleDelete(holiday._id)} 
                        disabled={isPastHoliday(holiday.date)}
                        title={isPastHoliday(holiday.date) ? 'Cannot delete past holidays' : ''}
                        style={{ background: 'none', border: 'none', color: isPastHoliday(holiday.date) ? '#9CA3AF' : '#EF4444', fontWeight: 600, fontSize: 13, cursor: isPastHoliday(holiday.date) ? 'not-allowed' : 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Holiday Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...S.card({ width: '100%', maxWidth: 650, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }) }}>
            <div style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>{isEditing ? 'Edit Holiday' : 'Add New Holiday'}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                    <label style={S.label}>Holiday Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. New Year's Day" style={S.input} required />
                  </div>
                  <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                    <label style={S.label}>Date *</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} style={S.input} required />
                  </div>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Description / Reason</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Describe the holiday..." style={{ ...S.input, resize: 'vertical' }}></textarea>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Applies To *</label>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                      <input type="radio" name="appliesTo" value="all" checked={formData.appliesTo === 'all'} onChange={handleInputChange} style={{ cursor: 'pointer' }} />
                      All Employees
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                      <input type="radio" name="appliesTo" value="specific" checked={formData.appliesTo === 'specific'} onChange={handleInputChange} style={{ cursor: 'pointer' }} />
                      Specific Employees
                    </label>
                  </div>
                </div>
                
                {formData.appliesTo === 'specific' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Select Employees</label>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, maxHeight: 240, overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
                      {workers.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, margin: 0 }}>No workers available</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                          {workers.map((worker) => (
                            <label key={worker._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, backgroundColor: '#FFF', border: '1px solid #E5E7EB' }}>
                              <input type="checkbox" checked={selectedEmployees.includes(worker._id)} onChange={() => handleEmployeeToggle(worker._id)} style={{ cursor: 'pointer' }} />
                              {worker.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {error && (
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 16 }}>{error}</div>
                )}
                
                {success && (
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 16 }}>{success}</div>
                )}
              </div>
              
              <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 20px', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 12, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                <button type="button" onClick={closeModal} style={S.btnSecondary}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>{isEditing ? 'Update Holiday' : 'Create Holiday'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;