import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Financials = () => {
  const [financialData, setFinancialData] = useState({
    revenue_by_department: [],
    monthly_revenue: [],
    parts_cost_analysis: [],
    parts_revenue_analysis: [],
    transaction_revenue_by_department: [],
    transaction_monthly_revenue: [],
    total_jobs_revenue: 0,
    total_service_charges: 0
  });

  // Debug function to validate data
  const validateChartData = (data, type) => {
    if (!Array.isArray(data)) {
      console.warn(`${type} data is not an array:`, data);
      return [];
    }
    
    // Check if data has required fields
    const hasRequiredFields = data.every(item => {
      if (type === 'revenue_by_department') {
        return item.department !== undefined && item.revenue !== undefined;
      } else if (type === 'monthly_revenue') {
        return item.month !== undefined && item.revenue !== undefined;
      } else if (type === 'parts_revenue_analysis') {
        return item.name !== undefined && item.revenue !== undefined;
      }
      return true;
    });
    
    if (!hasRequiredFields) {
      console.warn(`${type} data missing required fields:`, data);
      // Transform data if needed
      if (type === 'revenue_by_department' && typeof data === 'object' && data !== null) {
        return Object.keys(data).map(key => ({
          department: key,
          revenue: data[key]
        })).filter(item => typeof item.revenue === 'number');
      } else if (type === 'monthly_revenue' && typeof data === 'object' && data !== null) {
        return Object.keys(data).map(key => ({
          month: key,
          revenue: data[key]
        })).filter(item => typeof item.revenue === 'number');
      } else if (type === 'parts_revenue_analysis' && typeof data === 'object' && data !== null) {
        return Object.keys(data).map(key => ({
          name: key,
          revenue: data[key]
        })).filter(item => typeof item.revenue === 'number');
      }
    }
    
    return data;
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    month: '',
    year: ''
  });
  const [serviceChargeDetails, setServiceChargeDetails] = useState([]);
  const [showServiceChargeModal, setShowServiceChargeModal] = useState(false);
  const [partsRevenueDetails, setPartsRevenueDetails] = useState([]);
  const [showPartsRevenueModal, setShowPartsRevenueModal] = useState(false);

  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) {
      navigate('/admin/login');
    }
  }, [navigate]);



  // Fetch financial data from the backend
  const fetchData = async (filterParams = filters) => {
    try {
      setLoading(true);
      // Build query string from filters
      const queryParams = new URLSearchParams();
      console.log('Sending filters to API:', filterParams);
      if (filterParams.dateFrom) queryParams.append('dateFrom', filterParams.dateFrom);
      if (filterParams.dateTo) queryParams.append('dateTo', filterParams.dateTo);

      if (filterParams.month) queryParams.append('month', filterParams.month);
      if (filterParams.year) queryParams.append('year', filterParams.year);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/dashboard/financials?${queryString}` : '/dashboard/financials';
      
      const res = await api.get(url);
      console.log('Financial data received:', res.data);
      
      // Validate and transform data if needed
      const validatedData = {
        revenue_by_department: validateChartData(res.data.revenue_by_department, 'revenue_by_department'),
        monthly_revenue: validateChartData(res.data.monthly_revenue, 'monthly_revenue'),
        parts_cost_analysis: res.data.parts_cost_analysis || [],
        parts_revenue_analysis: validateChartData(res.data.parts_revenue_analysis, 'parts_revenue_analysis'),
        transaction_revenue_by_department: res.data.transaction_revenue_by_department || [],
        transaction_monthly_revenue: res.data.transaction_monthly_revenue || [],
        total_jobs_revenue: res.data.total_jobs_revenue || 0,
        total_service_charges: res.data.total_service_charges || 0
      };
      
      // Add service charge details and total service charges to the validated data
      validatedData.service_charge_details = res.data.service_charge_details || [];
      validatedData.total_service_charges = res.data.total_service_charges || 0;
      
      console.log('Validated financial data:', validatedData);
      setFinancialData(validatedData);
      
      // Also update service charge details in state if available
      if (res.data.service_charge_details) {
        setServiceChargeDetails(res.data.service_charge_details);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date range change
  const handleDateRangeChange = (from, to) => {
    setFilters(prev => ({
      ...prev,
      dateFrom: from,
      dateTo: to
    }));
  };
  
  // Function to fetch detailed service charge data
  const fetchServiceChargeDetails = async () => {
    try {
      setLoading(true);
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.year) queryParams.append('year', filters.year);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/dashboard/service-charges-details?${queryString}` : '/dashboard/service-charges-details';
      
      const res = await api.get(url);
      setServiceChargeDetails(res.data);
      setShowServiceChargeModal(true);
    } catch (err) {
      console.error('Error fetching service charge details:', err);
      setError('Failed to fetch service charge details');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch detailed parts revenue data
  const fetchPartsRevenueDetails = async () => {
    try {
      setLoading(true);
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.year) queryParams.append('year', filters.year);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/dashboard/parts-revenue-details?${queryString}` : '/dashboard/parts-revenue-details';
      
      const res = await api.get(url);
      setPartsRevenueDetails(res.data);
      setShowPartsRevenueModal(true);
    } catch (err) {
      console.error('Error fetching parts revenue details:', err);
      setError('Failed to fetch parts revenue details');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      month: '',
      year: ''
    });
  };
  
  // Function to download service charge details as Excel
  const downloadServiceChargesExcel = () => {
    if (!serviceChargeDetails.details || serviceChargeDetails.details.length === 0) {
      setError('No data available to download');
      return;
    }
    
    // Create worksheet from service charge details
    const worksheetData = serviceChargeDetails.details.map((detail, index) => ({
      'S.No': index + 1,
      'Job ID': detail.jobId,
      'Customer Name': detail.customerName,
      'Date': new Date(detail.date).toLocaleDateString(),
      'Service Charge': `Rs ${detail.serviceChargeAmount}`
    }));
    
    // Add total row
    worksheetData.push({
      'S.No': '',
      'Job ID': '',
      'Customer Name': 'TOTAL',
      'Date': '',
      'Service Charge': `Rs ${serviceChargeDetails.totalServiceCharge || 0}`
    });
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Charges');
    
    // Generate file name with current date
    const fileName = `Service-Charges-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  
  // Function to download service charge details as PDF
  const downloadServiceChargesPDF = () => {
    if (!serviceChargeDetails.details || serviceChargeDetails.details.length === 0) {
      setError('No data available to download');
      return;
    }
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Service Charges Details', 14, 20);
    
    // Date range if available
    if (filters.dateFrom && filters.dateTo) {
      doc.setFontSize(12);
      doc.text(`Date Range: ${filters.dateFrom} to ${filters.dateTo}`, 14, 30);
    }
    
    // Table
    const tableColumn = ['S.No', 'Job ID', 'Customer Name', 'Date', 'Service Charge'];
    const tableRows = serviceChargeDetails.details.map((detail, index) => [
      index + 1,
      detail.jobId,
      detail.customerName,
      new Date(detail.date).toLocaleDateString(),
      `Rs ${detail.serviceChargeAmount}`
    ]);
    
    // Add total row
    tableRows.push(['', '', 'TOTAL', '', `Rs ${serviceChargeDetails.totalServiceCharge || 0}`]);
    
    // Add table using autoTable function
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: filters.dateFrom && filters.dateTo ? 35 : 25,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249] // gray-100
      }
    });
    
    // Save the PDF
    doc.save(`Service-Charges-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  // Function to download parts revenue details as Excel
  const downloadPartsRevenueExcel = () => {
    if (!partsRevenueDetails.details || partsRevenueDetails.details.length === 0) {
      setError('No data available to download');
      return;
    }
    
    // Create worksheet from parts revenue details
    const worksheetData = partsRevenueDetails.details.map((detail, index) => ({
      'S.No': index + 1,
      'Job ID': detail.jobId,
      'Customer Name': detail.customerName,
      'Date': new Date(detail.date).toLocaleDateString(),
      'Part Name': detail.partName,
      'Quantity': detail.quantity,
      'Revenue': `Rs ${detail.totalRevenue}`
    }));
    
    // Add total row
    worksheetData.push({
      'S.No': '',
      'Job ID': '',
      'Customer Name': 'TOTAL',
      'Date': '',
      'Part Name': '',
      'Quantity': '',
      'Revenue': `Rs ${partsRevenueDetails.totalPartsRevenue || 0}`
    });
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Parts Revenue');
    
    // Generate file name with current date
    const fileName = `Parts-Revenue-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  
  // Function to download parts revenue details as PDF
  const downloadPartsRevenuePDF = () => {
    if (!partsRevenueDetails.details || partsRevenueDetails.details.length === 0) {
      setError('No data available to download');
      return;
    }
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Parts Revenue Details', 14, 20);
    
    // Date range if available
    if (filters.dateFrom && filters.dateTo) {
      doc.setFontSize(12);
      doc.text(`Date Range: ${filters.dateFrom} to ${filters.dateTo}`, 14, 30);
    }
    
    // Table
    const tableColumn = ['S.No', 'Job ID', 'Customer Name', 'Date', 'Part Name', 'Quantity', 'Revenue'];
    const tableRows = partsRevenueDetails.details.map((detail, index) => [
      index + 1,
      detail.jobId,
      detail.customerName,
      new Date(detail.date).toLocaleDateString(),
      detail.partName,
      detail.quantity,
      `Rs ${detail.totalRevenue}`
    ]);
    
    // Add total row
    tableRows.push(['', '', 'TOTAL', '', '', '', `Rs ${partsRevenueDetails.totalPartsRevenue || 0}`]);
    
    // Add table using autoTable function
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: filters.dateFrom && filters.dateTo ? 35 : 25,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249] // gray-100
      }
    });
    
    // Save the PDF
    doc.save(`Parts-Revenue-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs ${Number(amount).toFixed(2)}`;
  };

  // Calculate trend direction and percentage change
  const calculateTrend = (data, key) => {
    if (!data || data.length < 2) return { direction: 0, percentage: 0 };
    
    const sortedData = [...data].sort((a, b) => {
      // Sort by month if it's monthly data, otherwise by department/revenue
      if (a.month && b.month) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      }
      return 0;
    });
    
    const current = sortedData[sortedData.length - 1][key];
    const previous = sortedData[sortedData.length - 2][key];
    
    if (!previous || previous === 0) return { direction: current > 0 ? 1 : 0, percentage: 0 };
    
    const change = current - previous;
    const percentage = ((change / Math.abs(previous)) * 100).toFixed(2);
    
    return {
      direction: change > 0 ? 1 : change < 0 ? -1 : 0,
      percentage: Math.abs(parseFloat(percentage))
    };
  };

  // Render trend indicator
  const renderTrendIndicator = (data, key) => {
    const trend = calculateTrend(data, key);
    
    if (trend.direction === 0) return null;
    
    return (
      <div className={`inline-flex items-center mt-1 ${trend.direction > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend.direction > 0 ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        <span className="text-xs font-medium">{trend.percentage}%</span>
      </div>
    );
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
    btnDanger: { padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnSuccess: { padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#10B981', color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    statCard: (bg, border) => ({ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: '20px 24px', flex: '1 1 200px', cursor: 'pointer', transition: 'transform 0.2s' })
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Loading financial data...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) {
    return (
      <div style={S.page}>
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Outfit',sans-serif" }}>
              Financial Dashboard
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Overview of your repair shop's financial performance</p>
          </div>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div style={{ ...S.card({ marginBottom: 24, padding: 24 }) }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>Filters</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={S.label}>Date From</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} style={S.input} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={S.label}>Date To</label>
            <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} style={S.input} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={S.label}>Month</label>
            <select value={filters.month} onChange={(e) => handleFilterChange('month', e.target.value)} style={S.input}>
              <option value="">All Months</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={S.label}>Year</label>
            <input type="number" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} placeholder="YYYY" style={S.input} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={() => fetchData()} style={S.btnPrimary}>Apply Filters</button>
          <button type="button" onClick={resetFilters} style={S.btnSecondary}>Reset Filters</button>
        </div>
      </div>
      
      {/* Revenue Summary Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={S.statCard('linear-gradient(135deg, #ECFDF5, #D1FAE5)', '#A7F3D0')}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065F46' }}>Total Jobs Revenue</h3>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#059669' }}>{formatCurrency(financialData.total_jobs_revenue || 0)}</p>
        </div>
        <div style={S.statCard('linear-gradient(135deg, #EFF6FF, #DBEAFE)', '#BFDBFE')} onClick={fetchServiceChargeDetails}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#1E40AF' }}>Service Charges</h3>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#2563EB' }}>{formatCurrency(financialData.total_service_charges || 0)}</p>
        </div>
        <div style={S.statCard('linear-gradient(135deg, #FAF5FF, #F3E8FF)', '#E9D5FF')} onClick={fetchPartsRevenueDetails}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#6B21A8' }}>Parts Revenue</h3>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#7C3AED' }}>{formatCurrency((financialData.parts_revenue_analysis || []).reduce((sum, item) => sum + (item.revenue || 0), 0))}</p>
        </div>
        <div style={S.statCard('linear-gradient(135deg, #FFFBEB, #FEF3C7)', '#FDE68A')}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#92400E' }}>Total Transactions</h3>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#D97706' }}>{formatCurrency((financialData.transaction_revenue_by_department || []).reduce((sum, item) => sum + (item.revenue || 0), 0))}</p>
        </div>
      </div>

      {/* Revenue by Department */}
      <div style={{ ...S.card({ marginBottom: 24, padding: 24 }) }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px 0' }}>Revenue by Department</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={financialData.revenue_by_department && Array.isArray(financialData.revenue_by_department) ? financialData.revenue_by_department : []}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              style={{ background: '#ffffff' }}
              animationBegin={300}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tickFormatter={(value) => `Rs ${value.toLocaleString()}`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 8, color: '#fff' }} formatter={(value) => [`Rs ${value.toLocaleString()}`, 'Revenue']} labelStyle={{ fontWeight: 'bold', color: '#D1D5DB' }} cursor={{ stroke: '#9CA3AF', strokeDasharray: '2 2' }} />
              <Legend />
              <Area type="monotone" dataKey="revenue" fill="url(#colorGradientBlue)" stroke="#3B82F6" strokeWidth={2} name="Revenue" dot={{ stroke: '#3B82F6', strokeWidth: 2, r: 3, fill: '#fff' }} animationBegin={400} animationDuration={800} animationEasing="ease-out" />
              <Line type="monotone" dataKey="revenue" stroke="#1D4ED8" strokeWidth={2} dot={{ r: 4, stroke: '#1D4ED8', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, stroke: '#1E40AF', strokeWidth: 2, fill: '#fff' }} name="Revenue" animationBegin={400} animationDuration={800} animationEasing="ease-out" />
              <defs>
                <linearGradient id="colorGradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      <div style={{ ...S.card({ marginBottom: 24, padding: 24 }) }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px 0' }}>Monthly Revenue Trend</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={financialData.monthly_revenue && Array.isArray(financialData.monthly_revenue) ? financialData.monthly_revenue : []}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              style={{ background: '#ffffff' }}
              animationBegin={300}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tickFormatter={(value) => `Rs ${value.toLocaleString()}`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 8, color: '#fff' }} formatter={(value) => [`Rs ${value.toLocaleString()}`, 'Revenue']} labelStyle={{ fontWeight: 'bold', color: '#D1D5DB' }} cursor={{ stroke: '#9CA3AF', strokeDasharray: '2 2' }} />
              <Legend />
              <Area type="monotone" dataKey="revenue" fill="url(#colorGradientGreen)" stroke="#10B981" strokeWidth={2} name="Revenue" dot={{ stroke: '#10B981', strokeWidth: 2, r: 3, fill: '#fff' }} animationBegin={400} animationDuration={800} animationEasing="ease-out" />
              <Line type="monotone" dataKey="revenue" stroke="#047857" strokeWidth={2} dot={{ r: 4, stroke: '#047857', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, stroke: '#047857', strokeWidth: 2, fill: '#fff' }} name="Revenue" animationBegin={400} animationDuration={800} animationEasing="ease-out" />
              <defs>
                <linearGradient id="colorGradientGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Parts Revenue Analysis */}
      <div style={{ ...S.card({ marginBottom: 24, padding: 24 }) }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px 0' }}>Parts Revenue Analysis</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={financialData.parts_revenue_analysis && Array.isArray(financialData.parts_revenue_analysis) ? financialData.parts_revenue_analysis : []}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              style={{ background: '#ffffff' }}
              animationBegin={300}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tickFormatter={(value) => `Rs ${value.toLocaleString()}`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 8, color: '#fff' }} formatter={(value) => [`Rs ${value.toLocaleString()}`, 'Revenue']} labelStyle={{ fontWeight: 'bold', color: '#D1D5DB' }} cursor={{ stroke: '#9CA3AF', strokeDasharray: '2 2' }} />
              <Legend />
              <Area type="monotone" dataKey="revenue" fill="url(#colorGradientPurple)" stroke="#8B5CF6" strokeWidth={2} name="Revenue" dot={{ stroke: '#8B5CF6', strokeWidth: 2, r: 3, fill: '#fff' }} animationBegin={400} animationDuration={800} animationEasing="ease-out" />
              <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4, stroke: '#7C3AED', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, stroke: '#6D28D9', strokeWidth: 2, fill: '#fff' }} name="Revenue" animationBegin={400} animationDuration={800} animationEasing="ease-out" />
              <defs>
                <linearGradient id="colorGradientPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Parts Cost Analysis */}
      <div style={S.card()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Parts Cost Analysis</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>Part Name</th>
                <th style={S.th}>Category</th>
                <th style={S.th}>Stock</th>
                <th style={S.th}>Cost Price</th>
                <th style={S.th}>Selling Price</th>
                <th style={S.th}>Profit Margin</th>
              </tr>
            </thead>
            <tbody>
              {(financialData.parts_cost_analysis || []).length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ ...S.td, textAlign: 'center', color: '#6B7280', padding: 24 }}>No parts data available</td>
                </tr>
              ) : (
                (financialData.parts_cost_analysis || []).map((part) => (
                  <tr key={part._id} style={{ transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>{part.name}</td>
                    <td style={S.td}>{part.category}</td>
                    <td style={S.td}>{part.stock}</td>
                    <td style={S.td}>{formatCurrency(part.cost_price)}</td>
                    <td style={S.td}>{formatCurrency(part.selling_price)}</td>
                    <td style={{ ...S.td, color: part.profit_margin >= 0 ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                      {part.profit_margin >= 0 ? '+' : ''}{part.profit_margin}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Service Charge Details Modal */}
      {showServiceChargeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...S.card({ width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }) }}>
            <div style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>Service Charge Details</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={downloadServiceChargesPDF} style={S.btnDanger}>PDF</button>
                <button onClick={downloadServiceChargesExcel} style={S.btnSuccess}>Excel</button>
                <button onClick={() => setShowServiceChargeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#6B7280', padding: '0 8px' }}>×</button>
              </div>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={S.th}>Job ID</th>
                    <th style={S.th}>Customer Name</th>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Service Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceChargeDetails.details && serviceChargeDetails.details.length > 0 ? (
                    serviceChargeDetails.details.map((detail, index) => (
                      <tr key={index}>
                        <td style={{ ...S.td, fontWeight: 500, color: '#111827' }}>{detail.jobId}</td>
                        <td style={S.td}>{detail.customerName}</td>
                        <td style={S.td}>{new Date(detail.date).toLocaleDateString()}</td>
                        <td style={{ ...S.td, color: '#2563EB', fontWeight: 500 }}>{formatCurrency(detail.serviceChargeAmount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ ...S.td, textAlign: 'center', padding: 24 }}>No service charge details found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {serviceChargeDetails.totalServiceCharge !== undefined && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Total Service Charges:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>{formatCurrency(serviceChargeDetails.totalServiceCharge)}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Parts Revenue Details Modal */}
      {showPartsRevenueModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...S.card({ width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }) }}>
            <div style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>Parts Revenue Details</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={downloadPartsRevenuePDF} style={S.btnDanger}>PDF</button>
                <button onClick={downloadPartsRevenueExcel} style={S.btnSuccess}>Excel</button>
                <button onClick={() => setShowPartsRevenueModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#6B7280', padding: '0 8px' }}>×</button>
              </div>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={S.th}>Job ID</th>
                    <th style={S.th}>Customer Name</th>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Part Name</th>
                    <th style={S.th}>Quantity</th>
                    <th style={S.th}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {partsRevenueDetails.details && partsRevenueDetails.details.length > 0 ? (
                    partsRevenueDetails.details.map((detail, index) => (
                      <tr key={index}>
                        <td style={{ ...S.td, fontWeight: 500, color: '#111827' }}>{detail.jobId}</td>
                        <td style={S.td}>{detail.customerName}</td>
                        <td style={S.td}>{new Date(detail.date).toLocaleDateString()}</td>
                        <td style={S.td}>{detail.partName}</td>
                        <td style={S.td}>{detail.quantity}</td>
                        <td style={{ ...S.td, color: '#7C3AED', fontWeight: 500 }}>{formatCurrency(detail.totalRevenue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ ...S.td, textAlign: 'center', padding: 24 }}>No parts revenue details found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {partsRevenueDetails.totalPartsRevenue !== undefined && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Total Parts Revenue:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#7C3AED' }}>{formatCurrency(partsRevenueDetails.totalPartsRevenue)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

};

export default Financials;
