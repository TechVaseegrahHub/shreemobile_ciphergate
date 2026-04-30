import React, { useState, useEffect } from 'react';
import { getBatches, createBatch, updateBatch, deleteBatch } from '../utils/batchUtils';
import api from '../services/api';

const Settings = () => {
  const [batches, setBatches] = useState([]);
  const [locationSettings, setLocationSettings] = useState({
    enabled: false,
    latitude: 0,
    longitude: 0,
    radius: 100
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [currentBatch, setCurrentBatch] = useState({
    id: null,
    name: '',
    workingTime: { from: '', to: '' },
    lunchTime: { from: '', to: '', enabled: true },
    breakTime: { from: '', to: '', enabled: true }
  });

  // Load batches and location settings on component mount
  useEffect(() => {
    const loadBatches = async () => {
      const loadedBatches = await getBatches();
      setBatches(loadedBatches);
    };
    
    const loadLocationSettings = async () => {
      try {
        const response = await api.get('/admin/location-settings');
        setLocationSettings(response.data);
      } catch (error) {
        console.error('Error loading location settings:', error);
      }
    };
    
    loadBatches();
    loadLocationSettings();
  }, []);

  const handleAddNewBatch = () => {
    setCurrentBatch({
      id: null,
      name: '',
      workingTime: { from: '', to: '' },
      lunchTime: { from: '', to: '', enabled: true },
      breakTime: { from: '', to: '', enabled: true }
    });
    setShowModal(true);
  };

  const handleEditBatch = (batch) => {
    setCurrentBatch(batch);
    setShowModal(true);
  };

  const confirmDeleteBatch = (batch) => {
    setBatchToDelete(batch);
    setShowDeleteConfirm(true);
  };

  const handleDeleteBatch = async () => {
    if (batchToDelete) {
      try {
        await deleteBatch(batchToDelete._id);
        const updatedBatches = batches.filter(batch => batch._id !== batchToDelete._id);
        setBatches(updatedBatches);
      } catch (error) {
        console.error('Error deleting batch:', error);
        // You might want to show an error message to the user
      }
      setShowDeleteConfirm(false);
      setBatchToDelete(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setCurrentBatch(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setCurrentBatch(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLocationChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setLocationSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleToggle = (section) => {
    setCurrentBatch(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentBatch._id) {
        // Edit existing batch
        const updatedBatch = await updateBatch(currentBatch._id, {
          name: currentBatch.name,
          workingTime: currentBatch.workingTime,
          lunchTime: currentBatch.lunchTime,
          breakTime: currentBatch.breakTime
        });
        
        // Update the batches state with the updated batch
        const updatedBatches = batches.map(batch => 
          batch._id === currentBatch._id ? { ...updatedBatch, _id: currentBatch._id } : batch
        );
        setBatches(updatedBatches);
      } else {
        // Add new batch
        const newBatchData = {
          name: currentBatch.name,
          workingTime: currentBatch.workingTime,
          lunchTime: currentBatch.lunchTime,
          breakTime: currentBatch.breakTime
        };
        
        const newBatch = await createBatch(newBatchData);
        setBatches([...batches, newBatch]);
      }
    } catch (error) {
      console.error('Error saving batch:', error);
      // You might want to show an error message to the user
    }
    
    setShowModal(false);
  };

  const handleSaveLocationSettings = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.put('/admin/location-settings', locationSettings);
      
      if (response.status === 200) {
        alert('Location settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving location settings:', error);
      alert('Error saving location settings');
    }
  };

  const getCurrentLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please use a modern browser with location services enabled.');
      return;
    }
    
    // Check if we're in a secure context (HTTPS or localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      alert('Location services require a secure connection (HTTPS). Please access this application over HTTPS or localhost.');
      return;
    }
    
    console.log('Attempting to get current location in Settings...');
    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location retrieved successfully in Settings:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        
        setLocationSettings(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setIsGettingLocation(false);
        alert('Location captured successfully!');
      },
      (error) => {
        console.error('Geolocation error in Settings:', error);
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please ensure location services are enabled on your device and try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or check your network connection.';
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving location. Please try again.';
            break;
        }
        console.error('Location error details in Settings:', errorMessage);
        alert(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: false, // Try with lower accuracy first
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 60000 // Accept positions up to 1 minute old
      }
    );
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setBatchToDelete(null);
  };

  /* ── styles ─────────────────────────────────────────────── */
  const S = {
    page: { minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '28px 24px', fontFamily: "'Inter', sans-serif" },
    card: (extra = {}) => ({ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: 24, marginBottom: 24, ...extra }),
    input: { backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 },
    th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', textAlign: 'left', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' },
    td: { padding: '14px 16px', fontSize: 13.5, color: '#374151', borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle' },
    btnPrimary: { padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(37,99,235,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnSecondary: { padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnDanger: { padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnSuccess: { padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#10B981', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    modalHeader: { borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' },
    modalBody: { padding: '20px 24px', overflowY: 'auto', maxHeight: '70vh' },
    modalFooter: { borderTop: '1px solid #E5E7EB', padding: '16px 24px', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 12 },
  };

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)'
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Settings
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Manage application settings and preferences</p>
          </div>
        </div>
      </div>
      
      {/* Location Settings Section */}
      <div style={S.card()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 20px 0' }}>Location Settings</h2>
        
        <form onSubmit={handleSaveLocationSettings}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="enabled"
                checked={locationSettings.enabled}
                onChange={handleLocationChange}
                style={{ width: 18, height: 18, accentColor: '#2563EB', cursor: 'pointer' }}
              />
              <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 600, color: '#374151' }}>Enable Location Restriction</span>
            </label>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '6px 0 0 28px' }}>
              When enabled, workers can only mark attendance when within the specified location
            </p>
          </div>
          
          {locationSettings.enabled && (
            <div style={{ padding: 20, backgroundColor: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={S.label}>Latitude</label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={locationSettings.latitude}
                    onChange={handleLocationChange}
                    step="any"
                    style={S.input}
                    required
                  />
                </div>
                
                <div style={{ flex: '1 1 200px' }}>
                  <label style={S.label}>Longitude</label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={locationSettings.longitude}
                    onChange={handleLocationChange}
                    step="any"
                    style={S.input}
                    required
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Radius (meters)</label>
                <input
                  type="number"
                  id="radius"
                  name="radius"
                  value={locationSettings.radius}
                  onChange={handleLocationChange}
                  min="10"
                  max="1000"
                  style={S.input}
                  required
                />
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
                  Recommended range: 50-1000 meters. Workers must be within this radius to mark attendance.
                </p>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  style={{ ...S.btnSuccess, opacity: isGettingLocation ? 0.7 : 1, cursor: isGettingLocation ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isGettingLocation ? 'Getting Location...' : 'Capture Current Location'}
                </button>
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
                  Click to automatically fill in your current location coordinates
                </p>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
            <button type="submit" style={S.btnPrimary}>Save Location Settings</button>
          </div>
        </form>
      </div>
      
      {/* Batch Management Section */}
      <div style={{ ...S.card(), padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Batch Management</h2>
          <button onClick={handleAddNewBatch} style={S.btnPrimary}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Batch
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>Batch Name</th>
                <th style={S.th}>Working Hours</th>
                <th style={S.th}>Lunch Time</th>
                <th style={S.th}>Break Time</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ ...S.td, textAlign: 'center', padding: 24, color: '#6B7280' }}>No batches found. Create one to get started.</td>
                </tr>
              ) : (
                batches.map(batch => (
                  <tr key={batch.id} style={{ transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>{batch.name}</td>
                    <td style={S.td}>{batch.workingTime.from} - {batch.workingTime.to}</td>
                    <td style={S.td}>
                      {batch.lunchTime.enabled ? `${batch.lunchTime.from} - ${batch.lunchTime.to}` : <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Disabled</span>}
                    </td>
                    <td style={S.td}>
                      {batch.breakTime.enabled ? `${batch.breakTime.from} - ${batch.breakTime.to}` : <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Disabled</span>}
                    </td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => handleEditBatch(batch)} style={{ ...S.btnSecondary, padding: '6px 12px', fontSize: 12 }}>Edit</button>
                        <button onClick={() => confirmDeleteBatch(batch)} style={{ ...S.btnDanger, padding: '6px 12px', fontSize: 12 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding/Editing Batch */}
      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>{currentBatch.id ? 'Edit Batch' : 'Add New Batch'}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#6B7280' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={S.modalBody}>
                <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>Batch Name</label>
                  <input
                    type="text"
                    name="name"
                    value={currentBatch.name}
                    onChange={handleChange}
                    style={S.input}
                    required
                  />
                </div>
                
                {/* Working Time */}
                <div style={{ marginBottom: 24, padding: 16, border: '1px solid #E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#111827' }}>Working Time</h4>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>From</label>
                      <input type="time" name="workingTime.from" value={currentBatch.workingTime.from} onChange={handleChange} style={S.input} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>To</label>
                      <input type="time" name="workingTime.to" value={currentBatch.workingTime.to} onChange={handleChange} style={S.input} required />
                    </div>
                  </div>
                </div>
                
                {/* Lunch Time */}
                <div style={{ marginBottom: 24, padding: 16, border: '1px solid #E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: currentBatch.lunchTime.enabled ? 16 : 0 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Lunch Time</h4>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={currentBatch.lunchTime.enabled} onChange={() => handleToggle('lunchTime')} style={{ width: 16, height: 16, accentColor: '#2563EB', cursor: 'pointer' }} />
                      <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: '#374151' }}>Enable</span>
                    </label>
                  </div>
                  
                  {currentBatch.lunchTime.enabled && (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label style={S.label}>From</label>
                        <input type="time" name="lunchTime.from" value={currentBatch.lunchTime.from} onChange={handleChange} style={S.input} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={S.label}>To</label>
                        <input type="time" name="lunchTime.to" value={currentBatch.lunchTime.to} onChange={handleChange} style={S.input} />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Break Time */}
                <div style={{ marginBottom: 12, padding: 16, border: '1px solid #E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: currentBatch.breakTime.enabled ? 16 : 0 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Break Time</h4>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={currentBatch.breakTime.enabled} onChange={() => handleToggle('breakTime')} style={{ width: 16, height: 16, accentColor: '#2563EB', cursor: 'pointer' }} />
                      <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: '#374151' }}>Enable</span>
                    </label>
                  </div>
                  
                  {currentBatch.breakTime.enabled && (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label style={S.label}>From</label>
                        <input type="time" name="breakTime.from" value={currentBatch.breakTime.from} onChange={handleChange} style={S.input} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={S.label}>To</label>
                        <input type="time" name="breakTime.to" value={currentBatch.breakTime.to} onChange={handleChange} style={S.input} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={S.modalFooter}>
                <button type="button" onClick={closeModal} style={S.btnSecondary}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>{currentBatch.id ? 'Update Batch' : 'Add Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modalContent, maxWidth: 400 }}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>Confirm Delete</h3>
              <button onClick={closeDeleteConfirm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#6B7280' }}>×</button>
            </div>
            
            <div style={S.modalBody}>
              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete the batch <strong style={{ color: '#111827' }}>"{batchToDelete?.name}"</strong>? 
                <br /><br />
                <span style={{ color: '#EF4444' }}>This action cannot be undone.</span>
              </p>
            </div>
            
            <div style={S.modalFooter}>
              <button type="button" onClick={closeDeleteConfirm} style={S.btnSecondary}>Cancel</button>
              <button onClick={handleDeleteBatch} style={S.btnDanger}>Delete Batch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default Settings;
