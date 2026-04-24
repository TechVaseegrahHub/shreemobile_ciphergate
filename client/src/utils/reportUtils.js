import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Utility function to format currency
export const formatCurrency = (amount) => {
  return `Rs ${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Utility function to format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Utility function to format time
export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Function to generate PDF report
export const generatePDFReport = (title, headers, data, fileName) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 40,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: [255, 255, 255],
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    margin: { left: 14, right: 14 },
    styles: {
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246], // gray-100
    },
  });
  
  // Save the PDF
  doc.save(`${fileName}.pdf`);
};

// Function to generate Excel report
export const generateExcelReport = (title, headers, data, fileName) => {
  // Create worksheet with headers and data
  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title);
  
  // Add metadata
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    [title],
    [`Generated on: ${new Date().toLocaleString()}`],
    [] // Empty row
  ]), 'Metadata');
  
  // Export the file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Function to export active jobs
export const exportActiveJobs = async (api, format = 'pdf') => {
  try {
    const response = await api.get('/jobs/active');
    const jobs = response.data;
    
    const headers = ['Job ID', 'Customer', 'Phone', 'Device', 'Issue', 'Status', 'Amount', 'Date'];
    const data = jobs.map(job => [
      job.job_card_number || job._id.slice(-6),
      job.customer?.name || 'N/A',
      job.customer?.phone || 'N/A',
      `${job.device_brand || ''} ${job.device_model || ''}`.trim(),
      job.reported_issue || 'N/A',
      job.status,
      formatCurrency(job.total_amount || 0),
      formatDate(job.repair_job_taken_time)
    ]);
    
    if (format === 'pdf') {
      generatePDFReport('Active Jobs Report', headers, data, 'active_jobs_report');
    } else {
      generateExcelReport('Active Jobs Report', headers, data, 'active_jobs_report');
    }
  } catch (error) {
    console.error('Error exporting active jobs:', error);
    throw error;
  }
};

// Function to export cancelled jobs
export const exportCancelledJobs = async (api, format = 'pdf') => {
  try {
    const response = await api.get('/jobs/cancelled');
    const jobs = response.data;
    
    const headers = ['Job ID', 'Customer', 'Phone', 'Device', 'Issue', 'Amount', 'Date', 'Reason'];
    const data = jobs.map(job => [
      job.job_card_number || job._id.slice(-6),
      job.customer?.name || 'N/A',
      job.customer?.phone || 'N/A',
      `${job.device_brand || ''} ${job.device_model || ''}`.trim(),
      job.reported_issue || 'N/A',
      formatCurrency(job.total_amount || 0),
      formatDate(job.repair_job_taken_time),
      job.cancellation_reason || 'N/A'
    ]);
    
    if (format === 'pdf') {
      generatePDFReport('Cancelled Jobs Report', headers, data, 'cancelled_jobs_report');
    } else {
      generateExcelReport('Cancelled Jobs Report', headers, data, 'cancelled_jobs_report');
    }
  } catch (error) {
    console.error('Error exporting cancelled jobs:', error);
    throw error;
  }
};

// Function to export inventory
export const exportInventory = async (api, format = 'pdf', categoryFilter = null) => {
  try {
    const response = await api.get('/inventory');
    let parts = response.data;
    
    // Filter by category if specified
    if (categoryFilter) {
      parts = parts.filter(part => part.category?._id === categoryFilter || part.category?.name === categoryFilter);
    }
    
    const headers = ['Name', 'SKU', 'Category', 'Stock', 'Min Stock', 'Cost Price', 'Selling Price', 'Supplier', 'Location'];
    const data = parts.map(part => [
      part.name,
      part.sku,
      part.category?.name || 'N/A',
      part.stock,
      part.min_stock_alert,
      formatCurrency(part.cost_price || 0),
      formatCurrency(part.selling_price || 0),
      part.supplier?.name || 'N/A',
      part.location || 'N/A'
    ]);
    
    const title = categoryFilter ? `Inventory Report - ${categoryFilter}` : 'Inventory Report';
    const fileName = categoryFilter ? `inventory_report_${categoryFilter}` : 'inventory_report';
    
    if (format === 'pdf') {
      generatePDFReport(title, headers, data, fileName);
    } else {
      generateExcelReport(title, headers, data, fileName);
    }
  } catch (error) {
    console.error('Error exporting inventory:', error);
    throw error;
  }
};

// Function to export suppliers
export const exportSuppliers = async (api, format = 'pdf') => {
  try {
    const response = await api.get('/suppliers');
    const suppliers = response.data;
    
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Contact Person', 'Created Date'];
    const data = suppliers.map(supplier => [
      supplier.name,
      supplier.email || 'N/A',
      supplier.phone || 'N/A',
      supplier.address || 'N/A',
      supplier.contact_person || 'N/A',
      formatDate(supplier.createdAt)
    ]);
    
    if (format === 'pdf') {
      generatePDFReport('Suppliers Report', headers, data, 'suppliers_report');
    } else {
      generateExcelReport('Suppliers Report', headers, data, 'suppliers_report');
    }
  } catch (error) {
    console.error('Error exporting suppliers:', error);
    throw error;
  }
};

// Function to export workers
export const exportWorkers = async (api, format = 'pdf') => {
  try {
    const response = await api.get('/workers');
    const workers = response.data;
    
    const headers = ['Name', 'Email', 'Role', 'Department', 'Salary', 'Created Date'];
    const data = workers.map(worker => [
      worker.name,
      worker.email,
      worker.role,
      worker.department?.name || 'N/A',
      worker.salary ? formatCurrency(worker.salary) : 'N/A',
      formatDate(worker.createdAt)
    ]);
    
    if (format === 'pdf') {
      generatePDFReport('Workers Report', headers, data, 'workers_report');
    } else {
      generateExcelReport('Workers Report', headers, data, 'workers_report');
    }
  } catch (error) {
    console.error('Error exporting workers:', error);
    throw error;
  }
};

// Function to export departments
export const exportDepartments = async (api, format = 'pdf') => {
  try {
    const response = await api.get('/departments');
    const departments = response.data;
    
    const headers = ['Name', 'Created Date'];
    const data = departments.map(dept => [
      dept.name,
      formatDate(dept.createdAt)
    ]);
    
    if (format === 'pdf') {
      generatePDFReport('Departments Report', headers, data, 'departments_report');
    } else {
      generateExcelReport('Departments Report', headers, data, 'departments_report');
    }
  } catch (error) {
    console.error('Error exporting departments:', error);
    throw error;
  }
};

// Function to export attendance
export const exportAttendance = async (api, format = 'pdf', filters = { filterType: 'date', startDate: new Date(), endDate: new Date() }) => {
  try {
    const response = await api.get('/workers/attendance');
    const workers = response.data;
    
    // Flatten attendance records from all workers
    const flattenedAttendance = [];
    workers.forEach(worker => {
      if (worker.attendanceRecords && worker.attendanceRecords.length > 0) {
        worker.attendanceRecords.forEach(record => {
          flattenedAttendance.push({
            ...record,
            worker: {
              name: worker.name,
              department: worker.department
            }
          });
        });
      }
    });

    // Apply date filters
    const filteredAttendance = flattenedAttendance.filter(record => {
      if (filters.filterType === 'all') return true;
      
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      
      if (filters.filterType === 'date') {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        return recordDate.getTime() === start.getTime();
      }
      
      if (filters.filterType === 'dateRange') {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        return recordDate.getTime() >= start.getTime() && recordDate.getTime() <= end.getTime();
      }
      
      return true;
    });
    
    // Sort by date (newest first)
    filteredAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Group attendance by date
    const groupedData = {};
    filteredAttendance.forEach(record => {
      const dateStr = formatDate(record.date);
      if (!groupedData[dateStr]) {
        groupedData[dateStr] = [];
      }
      groupedData[dateStr].push([
        record.worker?.name || 'N/A',
        formatTime(record.checkIn),
        formatTime(record.checkOut),
        record.method || 'N/A',
        record.worker?.department?.name || 'N/A'
      ]);
    });
    
    const headers = ['Worker Name', 'Check-in', 'Check-out', 'Method', 'Department'];
    const title = 'Attendance Report';
    const fileName = 'attendance_report';

    if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      
      // Add metadata date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      let finalY = 40;
      
      if (Object.keys(groupedData).length === 0) {
        doc.text("No attendance records found.", 14, finalY);
      } else {
        Object.keys(groupedData).forEach((dateStr, index) => {
          // Add date header
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(`Date: ${dateStr}`, 14, finalY);
          
          autoTable(doc, {
            head: [headers],
            body: groupedData[dateStr],
            startY: finalY + 5,
            theme: 'grid',
            headStyles: {
              fillColor: [59, 130, 246], // blue-500
              textColor: [255, 255, 255],
              fontSize: 10,
            },
            bodyStyles: {
              fontSize: 9,
            },
            margin: { left: 14, right: 14 },
            styles: {
              cellPadding: 5,
            },
            alternateRowStyles: {
              fillColor: [243, 244, 246], // gray-100
            },
          });
          
          finalY = doc.lastAutoTable.finalY + 15;
          
          // Add a new page if the next section might get cut off
          if (finalY > 250 && index < Object.keys(groupedData).length - 1) {
            doc.addPage();
            finalY = 20;
          }
        });
      }
      
      doc.save(`${fileName}.pdf`);
      
    } else {
      // Excel Format
      const worksheetData = [];
      
      if (Object.keys(groupedData).length === 0) {
        worksheetData.push(['No attendance records found.']);
      } else {
        Object.keys(groupedData).forEach((dateStr) => {
          // Add a date header row
          worksheetData.push([`Date: ${dateStr}`, '', '', '', '']); 
          // Add column headers
          worksheetData.push(headers);
          // Add data rows
          groupedData[dateStr].forEach(row => {
            worksheetData.push(row);
          });
          // Add an empty row for nice spacing
          worksheetData.push([]);
        });
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, title);
      
      // Add metadata tab
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
        [title],
        [`Generated on: ${new Date().toLocaleString()}`],
        []
      ]), 'Metadata');
      
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting attendance:', error);
    throw error;
  }
};