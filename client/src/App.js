import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import JobIntake from './pages/JobIntake';
import ActiveJobs from './pages/ActiveJobs';
import Departments from './pages/Departments';
import Inventory from './pages/Inventory';
import Workers from './pages/Workers';
import JobDetail from './pages/JobDetail';
import Financials from './pages/Financials';
import Dashboard from './pages/Dashboard';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeJobs from './pages/EmployeeJobs';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import Attendance from './pages/Attendance';
import WorkerAttendance from './pages/WorkerAttendance';
import Settings from './pages/Settings';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Holidays from './pages/Holidays';
import Salary from './pages/Salary';
import CancelledJobs from './pages/CancelledJobs';

import EmployeeSidebar from './components/EmployeeSidebar';

const SIDEBAR_COLLAPSED = 72;
const SIDEBAR_EXPANDED  = 230;

/* ── Routes where sidebar is never shown ───────────────────────────── */
const NO_SIDEBAR_ROUTES = ['/', '/admin/login', '/employee/login'];

/* ── Component to conditionally render Sidebar ──────────────────────── */
const ConditionalSidebar = ({
  location,
  isSidebarOpen,
  toggleSidebar,
  onExpand,
  onCollapse,
}) => {
  const isHiddenRoute    = NO_SIDEBAR_ROUTES.includes(location.pathname);
  const isEmployeeDash   = location.pathname.startsWith('/employee/') && location.pathname.endsWith('/dashboard');
  const isEmployeeJobs   = location.pathname.startsWith('/employee/') && location.pathname.endsWith('/jobs');
  const isEmployeeAttend = location.pathname.startsWith('/employee/') && location.pathname.endsWith('/attendance');

  const isAdmin    = localStorage.getItem('admin');
  const isEmployee = localStorage.getItem('employee');

  const showSidebar =
    !isHiddenRoute &&
    (isAdmin || (isEmployee && (isEmployeeDash || isEmployeeJobs || isEmployeeAttend)));

  if (!showSidebar) return null;

  if (isEmployee && (isEmployeeDash || isEmployeeJobs || isEmployeeAttend)) {
    try {
      const employee = JSON.parse(localStorage.getItem('employee'));
      return (
        <EmployeeSidebar
          worker={employee}
          onLogout={() => {
            localStorage.removeItem('employee');
            window.location.href = '/employee/login';
          }}
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onExpand={onExpand}
          onCollapse={onCollapse}
        />
      );
    } catch (e) {
      return null;
    }
  }

  return (
    <Sidebar
      isOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
      onExpand={onExpand}
      onCollapse={onCollapse}
    />
  );
};

/* ── Main app content ───────────────────────────────────────────────── */
function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [location]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  /* ── Determine if this route shows a sidebar ── */
  const isHiddenRoute    = NO_SIDEBAR_ROUTES.includes(location.pathname);
  const isEmployeeDash   = location.pathname.startsWith('/employee/') && location.pathname.endsWith('/dashboard');
  const isEmployeeJobs   = location.pathname.startsWith('/employee/') && location.pathname.endsWith('/jobs');
  const isEmployeeAttend = location.pathname.startsWith('/employee/') && location.pathname.endsWith('/attendance');

  const isAdmin    = localStorage.getItem('admin');
  const isEmployee = localStorage.getItem('employee');

  const hasSidebar =
    !isHiddenRoute &&
    (isAdmin || (isEmployee && (isEmployeeDash || isEmployeeJobs || isEmployeeAttend)));

  /* ── Content margin pushes with sidebar ── */
  const contentMarginLeft = hasSidebar
    ? (sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED)
    : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <ConditionalSidebar
        location={location}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onExpand={() => setSidebarExpanded(true)}
        onCollapse={() => setSidebarExpanded(false)}
      />

      <div
        style={{
          flex: 1,
          marginLeft: contentMarginLeft,
          transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
          minWidth: 0, // prevent flex overflow
        }}
      >
        <Routes>
          <Route path="/"                          element={<Home />} />
          <Route path="/admin/login"               element={<AdminLogin />} />
          <Route path="/dashboard"                 element={<Dashboard />} />
          <Route path="/jobs/new"                  element={<JobIntake />} />
          <Route path="/jobs"                      element={<ActiveJobs />} />
          <Route path="/jobs/:id"                  element={<JobDetail />} />
          <Route path="/departments"               element={<Departments />} />
          <Route path="/inventory"                 element={<Inventory />} />
          <Route path="/workers"                   element={<Workers />} />
          <Route path="/attendance"                element={<Attendance />} />
          <Route path="/holidays"                  element={<Holidays />} />
          <Route path="/admin/salary"              element={<Salary />} />
          <Route path="/financials"                element={<Financials />} />
          <Route path="/settings"                  element={<Settings />} />
          <Route path="/suppliers"                 element={<Suppliers />} />
          <Route path="/purchases"                 element={<Purchases />} />
          <Route path="/cancelled-jobs"            element={<CancelledJobs />} />
          <Route path="/employee/login"            element={<EmployeeLogin />} />
          <Route path="/employee/:id/dashboard"    element={<EmployeeDashboard />} />
          <Route path="/employee/:id/jobs"         element={<EmployeeJobs />} />
          <Route path="/employee/:id/attendance"   element={<WorkerAttendance />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;