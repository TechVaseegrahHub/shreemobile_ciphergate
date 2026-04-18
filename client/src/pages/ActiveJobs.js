import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { exportActiveJobs } from '../utils/reportUtils';

const LIMIT = 15;

const ActiveJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [filter, setFilter] = useState('today');   // 'today' | 'all' | 'range'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rangeApplied, setRangeApplied] = useState(false);

  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) navigate('/admin/login');
  }, [navigate]);

  // Build API params
  const buildParams = useCallback((pageNum, currentFilter, sd, ed) => {
    const params = { filter: currentFilter, page: pageNum, limit: LIMIT };
    if (currentFilter === 'range') {
      params.startDate = sd;
      params.endDate = ed;
    }
    return params;
  }, []);

  // Initial / filter change fetch
  const fetchJobs = useCallback(async (currentFilter, sd, ed) => {
    setLoading(true);
    setError('');
    try {
      const params = buildParams(1, currentFilter, sd, ed);
      const res = await api.get('/jobs/active', { params });
      setJobs(res.data.jobs);
      setTotal(res.data.total);
      setHasMore(res.data.hasMore);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Load more — append to existing list
  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = buildParams(nextPage, filter, startDate, endDate);
      const res = await api.get('/jobs/active', { params });
      setJobs(prev => [...prev, ...res.data.jobs]);
      setTotal(res.data.total);
      setHasMore(res.data.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Trigger fetch on filter change (but not on 'range' until user clicks Apply)
  useEffect(() => {
    if (filter !== 'range') {
      setRangeApplied(false);
      fetchJobs(filter, '', '');
    }
  }, [filter]); // eslint-disable-line

  const handleApplyRange = () => {
    if (!startDate || !endDate) return;
    setRangeApplied(true);
    fetchJobs('range', startDate, endDate);
  };

  // Client-side search on loaded jobs
  const filteredJobs = searchTerm
    ? jobs.filter(job => {
        const term = searchTerm.toLowerCase();
        return (
          job.customer?.name?.toLowerCase().includes(term) ||
          job.device_model?.toLowerCase().includes(term) ||
          job.reported_issue?.toLowerCase().includes(term) ||
          job.job_card_number?.includes(term) ||
          job._id.slice(-6).includes(term)
        );
      })
    : jobs;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Intake':      return 'bg-gray-200 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Done':        return 'bg-green-100 text-green-800';
      case 'Ready':       return 'bg-purple-100 text-purple-800';
      default:            return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatCreationDate = (objectId) => {
    if (!objectId) return 'N/A';
    try {
      const timestamp = parseInt(objectId.substring(0, 8), 16) * 1000;
      return new Date(timestamp).toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'N/A'; }
  };

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  // ── UI ──────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Active Jobs</h1>
        <p className="text-gray-600">Manage ongoing repair jobs</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'today'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 Today — {todayLabel}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 All Jobs
          </button>
          <button
            onClick={() => setFilter('range')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'range'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🗓️ Date Range
          </button>
        </div>

        {/* Date Range Picker */}
        {filter === 'range' && (
          <div className="flex flex-col sm:flex-row gap-3 items-end mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleApplyRange}
              disabled={!startDate || !endDate}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Apply
            </button>
            {rangeApplied && (
              <span className="text-xs text-green-600 font-medium">✔ Filter applied</span>
            )}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Jobs</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, device, issue, job ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <div className="flex items-end">
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {searchTerm
            ? `Showing ${filteredJobs.length} search results`
            : `Showing ${jobs.length} of ${total} jobs`}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Job List ({searchTerm ? filteredJobs.length : total})
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportActiveJobs(api, 'pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition text-sm"
            >
              Export PDF
            </button>
            <button
              onClick={() => exportActiveJobs(api, 'excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
            <p>Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm
              ? 'No jobs match your search criteria.'
              : filter === 'today'
              ? 'No active jobs found for today.'
              : 'No active jobs found.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map(job => (
                    <tr key={job._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        ...{job._id.slice(-6)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {job.customer?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {job.device_model || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {job.reported_issue?.substring(0, 30) || 'N/A'}
                        {job.reported_issue?.length > 30 ? '...' : ''}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                          {job.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatCreationDate(job._id)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Link to={`/jobs/${job._id}`} className="text-blue-600 hover:text-blue-900">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More */}
            {!searchTerm && hasMore && (
              <div className="p-5 border-t border-gray-200 flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold">{jobs.length}</span> of{' '}
                  <span className="font-semibold">{total}</span> jobs
                </p>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}

            {/* All loaded indicator */}
            {!searchTerm && !hasMore && jobs.length > 0 && (
              <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-400">
                ✅ All {total} jobs loaded
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActiveJobs;
