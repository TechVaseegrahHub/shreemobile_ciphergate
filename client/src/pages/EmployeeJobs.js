import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const EmployeeJobs = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [workerRemarks, setWorkerRemarks] = useState('');
  const [updatingRemarks, setUpdatingRemarks] = useState(false);

  // Parts state
  const [availableParts, setAvailableParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [partsSearchTerm, setPartsSearchTerm] = useState('');
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [newPart, setNewPart] = useState({ part: '', quantity: 1 });
  const [addingPart, setAddingPart] = useState(false);
  const [partsSuccess, setPartsSuccess] = useState('');
  const [partsError, setPartsError] = useState('');
  const partsDropdownRef = useRef(null);

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchWorkerData = useCallback(async () => {
    try {
      const res = await api.get(`/workers/${id}`);
      setWorker(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch worker data');
    }
  }, [id]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get(`/jobs/worker/${id}`);
      setJobs(res.data);
      setFilteredJobs(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Check if employee is logged in
    const storedEmployee = localStorage.getItem('employee');
    if (!storedEmployee) {
      navigate('/employee/login');
      return;
    }

    const storedWorker = localStorage.getItem('employee');
    if (storedWorker) {
      const parsedWorker = JSON.parse(storedWorker);
      setWorker(parsedWorker);
    }

    fetchWorkerData();
    fetchJobs();
  }, [id, fetchWorkerData, fetchJobs, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('employee');
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    navigate('/employee/login');
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...jobs];

    // Status filter
    if (statusFilter === 'inprogress') {
      // "In Progress" means all active jobs: not done, not cancelled, not picked up
      filtered = filtered.filter(job => !['Done', 'Cancelled', 'Picked Up'].includes(job.status));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(job => new Date(job.repair_job_taken_time) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(job => new Date(job.repair_job_taken_time) <= toDate);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.customer?.name?.toLowerCase().includes(term) ||
        job.device_model?.toLowerCase().includes(term) ||
        job.reported_issue?.toLowerCase().includes(term) ||
        job.job_card_number?.includes(term)
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, statusFilter, dateFrom, dateTo, searchTerm]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    setSearchTerm('');
  };

  const viewJobDetail = (job) => {
    setSelectedJob(job);
    setWorkerRemarks(job.worker_remarks || '');
    setShowJobDetail(true);
    fetchAvailableParts();
  };

  const closeJobDetail = () => {
    setShowJobDetail(false);
    setSelectedJob(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Intake': return 'bg-gray-200 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Done': return 'bg-green-100 text-green-800';
      case 'Ready': return 'bg-purple-100 text-purple-800';
      case 'Pending Approval': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const markAsReady = async () => {
    if (!selectedJob) return;
    if (!window.confirm('Mark this job as Ready? The admin will be notified.')) return;
    try {
      setAddingPart(true); // reuse loading state
      const response = await api.put(`/jobs/${selectedJob._id}/update`, { status: 'Ready' });
      if (response.data.success) {
        const updatedJob = response.data.job;
        setSelectedJob(updatedJob);
        setJobs(prev => prev.map(j => j._id === updatedJob._id ? updatedJob : j));
        setFilteredJobs(prev => prev.map(j => j._id === updatedJob._id ? updatedJob : j));
        setPartsSuccess('Job marked as Ready! Admin has been notified.');
        setTimeout(() => setPartsSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Error marking job as ready:', err);
      setPartsError('Failed to update status. Please try again.');
    } finally {
      setAddingPart(false);
    }
  };

  const updateWorkerRemarks = async () => {
    if (!selectedJob) return;

    try {
      setUpdatingRemarks(true);

      const response = await api.put(`/jobs/${selectedJob._id}/update`, {
        worker_remarks: workerRemarks
      });

      if (response.data.success) {
        const updatedJob = response.data.job;
        setSelectedJob(updatedJob);
        setJobs(prevJobs => prevJobs.map(job =>
          job._id === updatedJob._id ? updatedJob : job
        ));
        setFilteredJobs(prevFilteredJobs => prevFilteredJobs.map(job =>
          job._id === updatedJob._id ? updatedJob : job
        ));
        setShowRemarkModal(false);
        alert('Remarks saved successfully!');
      } else {
        alert('Failed to save remarks');
      }
    } catch (err) {
      console.error('Error updating worker remarks:', err);
      alert('Error saving remarks: ' + err.message);
    } finally {
      setUpdatingRemarks(false);
    }
  };

  // Fetch all inventory parts for the parts picker
  const fetchAvailableParts = async () => {
    try {
      const res = await api.get('/inventory');
      setAvailableParts(res.data);
      setFilteredParts(res.data);
    } catch (err) {
      console.error('Failed to fetch parts:', err);
    }
  };

  // Filter parts list based on search term
  const handlePartsSearch = (value) => {
    setPartsSearchTerm(value);
    if (value.trim() === '') {
      setFilteredParts(availableParts);
    } else {
      setFilteredParts(
        availableParts.filter(p =>
          p.name.toLowerCase().includes(value.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(value.toLowerCase()))
        )
      );
    }
  };

  // Add a part to the selected job
  const addPartToJob = async () => {
    if (!newPart.part || newPart.quantity <= 0) {
      setPartsError('Please select a part and enter a valid quantity');
      return;
    }
    try {
      setAddingPart(true);
      setPartsError('');
      const currentParts = selectedJob.parts_used || [];
      const existingIndex = currentParts.findIndex(p => {
        const pid = typeof p.part === 'object' ? p.part._id : p.part;
        return pid === newPart.part;
      });
      let updatedParts;
      if (existingIndex >= 0) {
        updatedParts = currentParts.map((p, i) =>
          i === existingIndex ? { ...p, quantity: p.quantity + parseInt(newPart.quantity) } : p
        );
      } else {
        updatedParts = [...currentParts, { part: newPart.part, quantity: parseInt(newPart.quantity) }];
      }
      const response = await api.put(`/jobs/${selectedJob._id}/update`, { parts_used: updatedParts });
      if (response.data.success) {
        const updatedJob = response.data.job;
        setSelectedJob(updatedJob);
        setJobs(prev => prev.map(j => j._id === updatedJob._id ? updatedJob : j));
        setFilteredJobs(prev => prev.map(j => j._id === updatedJob._id ? updatedJob : j));
        setNewPart({ part: '', quantity: 1 });
        setPartsSearchTerm('');
        setFilteredParts(availableParts);
        setShowPartsModal(false);
        setPartsSuccess('Part added successfully!');
        setTimeout(() => setPartsSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Error adding part:', err);
      setPartsError('Failed to add part. Please try again.');
    } finally {
      setAddingPart(false);
    }
  };

  // Remove a part from the selected job
  const removePartFromJob = async (partIndex) => {
    if (!window.confirm('Remove this part from the job?')) return;
    try {
      setAddingPart(true);
      const updatedParts = (selectedJob.parts_used || []).filter((_, i) => i !== partIndex);
      const response = await api.put(`/jobs/${selectedJob._id}/update`, { parts_used: updatedParts });
      if (response.data.success) {
        const updatedJob = response.data.job;
        setSelectedJob(updatedJob);
        setJobs(prev => prev.map(j => j._id === updatedJob._id ? updatedJob : j));
        setFilteredJobs(prev => prev.map(j => j._id === updatedJob._id ? updatedJob : j));
        setPartsSuccess('Part removed successfully!');
        setTimeout(() => setPartsSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Error removing part:', err);
      setPartsError('Failed to remove part.');
    } finally {
      setAddingPart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Error</h3>
              <p className="mt-2 text-gray-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-full mx-auto p-2 sm:p-4">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
          <div className="px-2 py-2 sm:px-4">
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">My Job History</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              View and filter your assigned jobs
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
          <div className="px-2 py-2 sm:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by customer, device, or issue..."
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="inprogress">In Progress (Active)</option>
                  <option value="Done">Done</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-xs sm:text-sm text-gray-500">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </div>
              {(dateFrom || dateTo || statusFilter !== 'all' || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-2 py-2 sm:px-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Job List</h2>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {jobs.length === 0
                  ? "You don't have any jobs assigned yet."
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-2 sm:py-2 md:px-3 md:py-3">
                      ID
                    </th>
                    <th scope="col" className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-2 sm:py-2 md:px-3 md:py-3">
                      Customer
                    </th>
                    <th scope="col" className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-2 sm:py-2 md:px-3 md:py-3">
                      Device
                    </th>
                    <th scope="col" className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-2 sm:py-2 md:px-3 md:py-3">
                      Issue
                    </th>
                    <th scope="col" className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-2 sm:py-2 md:px-3 md:py-3">
                      Status
                    </th>
                    <th scope="col" className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-2 sm:py-2 md:px-3 md:py-3">
                      Date
                    </th>
                    <th scope="col" className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-2 sm:py-2 md:px-3 md:py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job._id} className="hover:bg-gray-50">
                      <td className="px-1 py-1 whitespace-nowrap text-xs font-medium text-gray-900 sm:px-2 sm:py-2 md:px-3 md:py-4">
                        {job._id}
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 sm:px-2 sm:py-2 md:px-3 md:py-4 max-w-[60px] sm:max-w-[80px] md:max-w-xs truncate" title={job.customer?.name || 'N/A'}>
                        {job.customer?.name || 'N/A'}
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 sm:px-2 sm:py-2 md:px-3 md:py-4 max-w-[60px] sm:max-w-[80px] md:max-w-xs truncate" title={job.device_brand ? `${job.device_brand} ${job.device_model}` : job.device_model || 'N/A'}>
                        {job.device_brand ? `${job.device_brand} ${job.device_model}` : job.device_model || 'N/A'}
                      </td>
                      <td className="px-1 py-1 text-xs text-gray-900 max-w-[60px] sm:max-w-[80px] md:max-w-xs truncate sm:px-2 sm:py-2 md:px-3 md:py-4" title={job.reported_issue || 'N/A'}>
                        {job.reported_issue || 'N/A'}
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap sm:px-2 sm:py-2 md:px-3 md:py-4">
                        <span className={`px-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                          {job.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 sm:px-2 sm:py-2 md:px-3 md:py-4">
                        {formatDate(job.repair_job_taken_time)}
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap text-xs font-medium sm:px-2 sm:py-2 md:px-3 md:py-4">
                        <button
                          onClick={() => viewJobDetail(job)}
                          className="text-blue-600 hover:text-blue-900 mr-2 text-xs"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setWorkerRemarks(job.worker_remarks || '');
                            setShowRemarkModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          Remark
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Job Detail Modal */}
      {showJobDetail && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Job Details - {selectedJob._id}
              </h3>
              <button
                onClick={closeJobDetail}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="p-2 sm:p-4 md:p-6">
                {/* Customer Information */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Customer Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{selectedJob.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedJob.customer?.phone || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{selectedJob.customer?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Device Information */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Device Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Brand & Model</p>
                      <p className="font-medium">
                        {selectedJob.device_brand ? `${selectedJob.device_brand} ${selectedJob.device_model}` : selectedJob.device_model || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">IMEI Number</p>
                      <p className="font-medium">{selectedJob.imei_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Serial Number</p>
                      <p className="font-medium">{selectedJob.serial_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Device Condition</p>
                      <p className="font-medium">{selectedJob.device_condition || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Job Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Reported Issue</p>
                      <p className="font-medium">{selectedJob.reported_issue || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Repair Type</p>
                      <p className="font-medium">{selectedJob.repair_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Urgency Level</p>
                      <p className="font-medium">{selectedJob.urgency_level || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedJob.status)}`}>
                        {selectedJob.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Financial Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Service Charges</p>
                      <p className="font-medium">₹{(selectedJob.service_charges || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Parts Cost</p>
                      <p className="font-medium">₹{(selectedJob.parts_cost || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-medium">₹{(selectedJob.total_amount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Advance Payment</p>
                      <p className="font-medium">₹{(selectedJob.advance_payment || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium">{selectedJob.payment_method || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Discount Amount</p>
                      <p className="font-medium">₹{(selectedJob.discount_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Dates</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Job Taken Time</p>
                      <p className="font-medium">{formatDate(selectedJob.repair_job_taken_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estimated Delivery</p>
                      <p className="font-medium">{formatDate(selectedJob.estimated_delivery_date)}</p>
                    </div>
                    {selectedJob.repair_done_time && (
                      <div>
                        <p className="text-sm text-gray-500">Repair Done Time</p>
                        <p className="font-medium">{formatDate(selectedJob.repair_done_time)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Worker */}
                {selectedJob.assigned_technician && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Assigned Technician</h4>
                    <p className="font-medium">{selectedJob.assigned_technician.name || 'N/A'}</p>
                  </div>
                )}

                {/* Parts Used */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h4 className="text-base sm:text-lg font-medium text-gray-900">Parts Used</h4>
                    <button
                      onClick={() => { setShowPartsModal(true); setPartsError(''); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Part
                    </button>
                  </div>

                  {/* Success / Error banners */}
                  {partsSuccess && (
                    <div className="mb-2 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs rounded-md">
                      {partsSuccess}
                    </div>
                  )}
                  {partsError && (
                    <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                      {partsError}
                    </div>
                  )}

                  {selectedJob.parts_used && selectedJob.parts_used.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedJob.parts_used.map((partUsed, index) => {
                            const partData = partUsed.part;
                            const partName = partData?.name || 'N/A';
                            const quantity = partUsed.quantity || 0;
                            // Cross-reference with availableParts to get selling_price reliably
                            const partId = typeof partData === 'object' ? partData?._id : partData;
                            const inventoryPart = availableParts.find(p => p._id === partId);
                            const sellingPrice = inventoryPart?.selling_price ?? partData?.selling_price ?? 0;
                            const unitPrice = partUsed.edited_cost !== undefined ? partUsed.edited_cost : sellingPrice;
                            const total = quantity * unitPrice;
                            return (
                              <tr key={index}>
                                <td className="px-2 py-1 text-xs sm:text-sm text-gray-900 max-w-[80px] sm:max-w-xs truncate" title={partName}>{partName}</td>
                                <td className="px-2 py-1 text-xs sm:text-sm text-gray-900">{quantity}</td>
                                <td className="px-2 py-1 text-xs sm:text-sm text-gray-900">₹{unitPrice.toFixed(2)}</td>
                                <td className="px-2 py-1 text-xs sm:text-sm text-gray-900">₹{total.toFixed(2)}</td>
                                <td className="px-2 py-1">
                                  <button
                                    onClick={() => removePartFromJob(index)}
                                    disabled={addingPart}
                                    className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No parts added yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer — Mark as Ready */}
            {!['Ready', 'Done', 'Cancelled'].includes(selectedJob.status) && (
              <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
                <button
                  onClick={markAsReady}
                  disabled={addingPart}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-md hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {addingPart ? 'Updating...' : 'Mark as Ready'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900">Add Part to Job</h3>
              <button
                onClick={() => { setShowPartsModal(false); setNewPart({ part: '', quantity: 1 }); setPartsSearchTerm(''); setFilteredParts(availableParts); setPartsError(''); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
              {partsError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                  {partsError}
                </div>
              )}

              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search Part</label>
                <input
                  type="text"
                  value={partsSearchTerm}
                  onChange={(e) => handlePartsSearch(e.target.value)}
                  placeholder="Search by name or SKU..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Parts List */}
              <div className="border border-gray-200 rounded-md overflow-y-auto max-h-52">
                {filteredParts.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">No parts found</p>
                ) : (
                  filteredParts.map(part => (
                    <button
                      key={part._id}
                      onClick={() => setNewPart(prev => ({ ...prev, part: part._id }))}
                      className={`w-full text-left px-3 py-2 flex justify-between items-center hover:bg-blue-50 transition text-sm border-b border-gray-100 last:border-0 ${newPart.part === part._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{part.name}</p>
                        <p className="text-xs text-gray-500">SKU: {part.sku || 'N/A'} &nbsp;|&nbsp; Stock: {part.stock ?? 0}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">₹{(part.selling_price || 0).toFixed(2)}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Selected Part Info */}
              {newPart.part && (
                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                  ✓ Selected: <strong>{availableParts.find(p => p._id === newPart.part)?.name}</strong>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-3">
              <button
                onClick={() => { setShowPartsModal(false); setNewPart({ part: '', quantity: 1 }); setPartsSearchTerm(''); setFilteredParts(availableParts); setPartsError(''); }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addPartToJob}
                disabled={addingPart || !newPart.part}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {addingPart ? 'Adding...' : 'Add to Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
              <h3 className="text-lg font-semibold text-gray-900">Add/Edit Remarks</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Description
                </label>
                <textarea
                  value={workerRemarks}
                  onChange={(e) => setWorkerRemarks(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you did for this work..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRemarkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={updateWorkerRemarks}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Remarks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeJobs;