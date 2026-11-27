import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  CheckCircle2, Clock, Calendar, AlertTriangle, RotateCcw, Filter, 
  MapPin, Pencil, Trash2, ChevronDown, ChevronUp, ExternalLink, X 
} from 'lucide-react';
import EmployeeSelectFilter from '../components/common/EmployeeSelectFilter';
import AttendanceActionModals from '../components/common/AttendanceActionModals';
import { formatDuration, calculateDurationFromTimestamps } from '../utils/timeUtils';
import { requestLocationPermission } from '../utils/locationUtils';

const Attendance = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params passed from Dashboard clicks
  const urlDate = searchParams.get('date');
  const urlStatus = searchParams.get('status');
  const urlNotCheckedOut = searchParams.get('notCheckedOut') === 'true';

  const [attendanceList, setAttendanceList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [backendSummary, setBackendSummary] = useState(null);
  const [backendEmployeeSummaries, setBackendEmployeeSummaries] = useState([]);

  // Filters for Admin & Employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState(urlDate || '');
  const [toDate, setToDate] = useState(urlDate || '');
  const [appliedFromDate, setAppliedFromDate] = useState(urlDate || '');
  const [appliedToDate, setAppliedToDate] = useState(urlDate || '');
  const [statusFilter, setStatusFilter] = useState(urlStatus || '');
  const [checkoutFilter, setCheckoutFilter] = useState(urlNotCheckedOut ? 'notCheckedOut' : '');
  const [search, setSearch] = useState('');

  // Accordion State
  const [summaryAccordionOpen, setSummaryAccordionOpen] = useState(true);
  const [logsAccordionOpen, setLogsAccordionOpen] = useState(true);

  // Modals
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState('Present');

  // Attendance Edit Modal (Admin)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'Present',
    reason: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Employee Portal Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  const isAdmin = user?.role === 'Admin';
  const role = user?.role || 'Employee';

  const fetchAttendance = async (customParams = {}) => {
    try {
      setLoading(true);
      const params = {};
      const from = customParams.fromDate !== undefined ? customParams.fromDate : appliedFromDate;
      const to = customParams.toDate !== undefined ? customParams.toDate : appliedToDate;
      const emp = customParams.employeeId !== undefined ? customParams.employeeId : selectedEmployeeId;

      if (from) params.fromDate = from;
      if (to) params.toDate = to;
      if (emp && isAdmin) params.employeeId = emp;

      const [attRes, empRes] = await Promise.all([
        api.get('/attendance', params),
        isAdmin ? api.get('/employees') : Promise.resolve({ success: true, data: [] })
      ]);

      if (attRes.success) {
        setAttendanceList(attRes.data);
        if (attRes.workingHoursSummary) {
          setBackendSummary(attRes.workingHoursSummary);
        }
        if (attRes.employeeSummaries) {
          setBackendEmployeeSummaries(attRes.employeeSummaries);
        }
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (e) {
      console.error(e);
      addToast(e.message || 'Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedEmployeeId]);

  const handleApplyFilter = () => {
    if (fromDate && toDate && toDate < fromDate) {
      addToast('To Date must not be earlier than From Date', 'error');
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    fetchAttendance({ fromDate, toDate });
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setSelectedEmployeeId('');
    setStatusFilter('');
    setCheckoutFilter('');
    setSearch('');
    setSearchParams({});
    fetchAttendance({ fromDate: '', toDate: '', employeeId: '' });
  };

  const handleOpenEdit = (record) => {
    setEditingAttendanceRecord(record);
    const getTimeStr = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      return !isNaN(d) ? d.toTimeString().slice(0, 5) : '';
    };
    setEditFormData({
      date: record.date || '',
      checkInTime: getTimeStr(record.checkIn),
      checkOutTime: getTimeStr(record.checkOut),
      status: record.status || 'Present',
      reason: record.correctionReason || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.date) {
      addToast('Date is required', 'error');
      return;
    }
    setEditSubmitting(true);
    try {
      const d = editFormData.date;
      const checkInIso = editFormData.checkInTime ? new Date(`${d}T${editFormData.checkInTime}:00`).toISOString() : null;
      const checkOutIso = editFormData.checkOutTime ? new Date(`${d}T${editFormData.checkOutTime}:00`).toISOString() : null;

      const res = await api.put(`/attendance/${editingAttendanceRecord._id}`, {
        date: editFormData.date,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        status: editFormData.status,
        reason: editFormData.reason || 'Admin updated session details'
      });

      if (res.success) {
        addToast('Attendance session updated successfully', 'success');
        setShowEditModal(false);
        setEditingAttendanceRecord(null);
        fetchAttendance();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update attendance session', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteAttendance = async (record) => {
    if (!window.confirm(`Are you sure you want to permanently delete the attendance record of ${record.employeeName || 'this employee'} on ${record.date}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/attendance/${record._id}`);
      if (res.success) {
        addToast(res.message || 'Attendance session deleted successfully', 'success');
        fetchAttendance();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete attendance session', 'error');
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const location = await requestLocationPermission();
      const res = await api.post('/attendance/check-in', { location });
      addToast(res.message || 'Checked in successfully!', 'success');
      await fetchAttendance();
    } catch (e) {
      addToast(e.message || 'Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCorrection = (record) => {
    setSelectedRecord(record);
    setCorrectionStatus(record.status);
    setCorrectionReason('');
    setShowCorrectionModal(true);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/correct', {
        attendanceId: selectedRecord._id,
        status: correctionStatus,
        reason: correctionReason,
        checkIn: selectedRecord.checkIn,
        checkOut: selectedRecord.checkOut
      });
      addToast('Attendance correction recorded with audit trace', 'success');
      setShowCorrectionModal(false);
      fetchAttendance();
    } catch (e) {
      addToast(e.message || 'Correction failed', 'error');
    }
  };

  const handleResetFilters = () => {
    setSelectedEmployeeId('');
    setSelectedDate('');
    setSearch('');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const mySessions = attendanceList.filter(a => 
    a.employee === user?.employeeId || 
    a.employeeId === user?.employeeId || 
    a.employee?._id === user?.employeeId
  );
  const activeSession = mySessions.find(a => a.checkIn && !a.checkOut);
  const isCheckedIn = !!activeSession;

  const handleClockInClick = () => {
    if (isCheckedIn) {
      addToast('You are already checked in.', 'warning');
      return;
    }
    setShowScheduleModal(true);
  };

  const handleClockOutClick = () => {
    if (!isCheckedIn) {
      addToast('Please clock in first.', 'warning');
      return;
    }
    setShowClockOutModal(true);
  };

  // Filter list by search text and active filters
  const displayedAttendance = attendanceList.filter(record => {
    // Checkout session filter
    if (checkoutFilter === 'notCheckedOut') {
      if (!record.checkIn || record.checkOut) return false;
    } else if (checkoutFilter === 'checkedOut') {
      if (!record.checkOut) return false;
    }

    // Status filter
    if (statusFilter) {
      if (statusFilter === 'Present') {
        if (record.status !== 'Present' && record.status !== 'Late Arrival' && record.status !== 'Half Day') return false;
      } else if (statusFilter === 'Late Arrival') {
        if (record.status !== 'Late Arrival' && !record.isLate) return false;
      } else if (statusFilter === 'Absent') {
        if (record.status !== 'Absent') return false;
      } else if (record.status !== statusFilter) {
        return false;
      }
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (record.employeeName || '').toLowerCase();
    const code = (record.employeeCode || '').toLowerCase();
    const status = (record.status || '').toLowerCase();
    return name.includes(q) || code.includes(q) || status.includes(q);
  });

  // Calculate Absent Employees if Absent status filter is active
  const targetDateForAbsent = appliedFromDate || todayStr;
  const attendedIdsSet = new Set(attendanceList.filter(a => a.date === targetDateForAbsent).map(a => a.employee || a.employeeId));
  const absentEmployeesToday = (statusFilter === 'Absent' && employees.length > 0)
    ? employees.filter(e => !attendedIdsSet.has(e._id) && e.employeeStatus === 'Active')
    : [];

  // Calculate working hours summary for the current view:
  // For Employee: calculates working hours strictly for the logged-in employee from their displayed attendance.
  // For Admin: calculates working hours for the selected employee or all displayed attendance.
  // Calculates both:
  //  1) totalWorkingHoursSum: sum of actual session durations (hours and minutes)
  //  2) totalWorkingDays: count of unique completed dates (both checkIn and checkOut exist)
  const computeClientWorkingHours = (records) => {
    const validDates = new Set();
    let totalMinutes = 0;

    records.forEach(r => {
      if (r && r.checkIn && r.checkOut) {
        const d = r.date || (typeof r.checkIn === 'string' ? r.checkIn.slice(0, 10) : '');
        if (d) validDates.add(d);

        // Calculate actual duration in minutes between checkIn and checkOut
        const start = new Date(r.checkIn).getTime();
        const end = new Date(r.checkOut).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          totalMinutes += Math.round((end - start) / (1000 * 60));
        } else if (r.workingHours && !isNaN(parseFloat(r.workingHours))) {
          totalMinutes += Math.round(parseFloat(r.workingHours) * 60);
        }
      }
    });

    const totalWorkingDays = validDates.size;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formattedDuration = hours > 0 
      ? (minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`)
      : `${minutes} min`;

    const decimalHours = parseFloat((totalMinutes / 60).toFixed(2));

    return { 
      totalWorkingDays, 
      totalWorkingHours: decimalHours, 
      formattedDuration,
      totalMinutes 
    };
  };

  // Compute summary for the current user's displayed attendance
  const effectiveSummary = computeClientWorkingHours(displayedAttendance);

  // Filter employee summaries for Admin if search is applied
  const filteredEmployeeSummaries = backendEmployeeSummaries.filter(emp => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (emp.employeeName || '').toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>
            {isAdmin ? 'Attendance Management & Audit' : 'My Attendance & Clock Session'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isAdmin 
              ? 'Enterprise clock-in tracking, working hours deduction, and audit corrections'
              : 'View your clock-in history, work durations, and log daily activities'}
          </p>
        </div>

        {/* Employee Portal Action Buttons: Always display both buttons side by side */}
        {!isAdmin && (
          <div className="welcome-banner-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className="btn"
              onClick={handleClockInClick}
              disabled={actionLoading}
              title={isCheckedIn ? "You are already checked in" : "Click to plan schedule and clock in"}
              style={{ 
                background: '#16A34A', 
                color: '#fff', 
                border: 'none', 
                padding: '9px 18px',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                opacity: actionLoading ? 0.7 : (isCheckedIn ? 0.8 : 1),
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
              }}
            >
              <CheckCircle2 size={16} />
              Clock In Now
            </button>

            <button 
              type="button"
              className="btn"
              onClick={handleClockOutClick}
              disabled={actionLoading}
              title={!isCheckedIn ? "Please clock in first" : "Click to log daily work activity and clock out"}
              style={{ 
                background: '#DC2626', 
                color: '#fff', 
                border: 'none', 
                padding: '9px 18px',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                opacity: actionLoading ? 0.7 : (!isCheckedIn ? 0.8 : 1),
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
              }}
            >
              <Clock size={16} />
              Clock Out
            </button>
          </div>
        )}
      </div>

      {/* Working Hours Summary Cards (Both Employee & Admin) - Daily Working Hours Removed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        {/* Card 1: Total Completed Working Days */}
        <div className="card" style={{
          padding: '18px 20px',
          borderLeft: '4px solid #2563EB',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Working Days
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 2 }}>
              {effectiveSummary.totalWorkingDays} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Days</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Completed working days
            </div>
          </div>
        </div>

        {/* Card 2: Total Working Hours (Calculated strictly for the logged-in / filtered employee) */}
        <div className="card" style={{
          padding: '18px 20px',
          borderLeft: '4px solid #16A34A',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#DCFCE7',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Working Hours
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#16A34A', marginTop: 2 }}>
              {effectiveSummary.formattedDuration}
              {effectiveSummary.totalMinutes > 0 && (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 8 }}>
                  ({effectiveSummary.totalWorkingHours} hrs)
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Total calculated working duration
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar (Both Admin & Employee) */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          {/* Searchable Employee Name Filter (Admin Only) */}
          {isAdmin && (
            <div style={{ flex: '1 1 200px' }}>
              <EmployeeSelectFilter
                employees={employees}
                selectedEmployeeId={selectedEmployeeId}
                onChange={(id) => setSelectedEmployeeId(id)}
                label="Filter by Employee Name"
                placeholder="All Employees"
              />
            </div>
          )}

          {/* Status Filter Dropdown */}
          <div style={{ flex: '0 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Status
            </label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Present">Present (All)</option>
              <option value="Late Arrival">Late Arrival</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
              <option value="Approved Leave">Approved Leave</option>
            </select>
          </div>

          {/* Checkout Status Dropdown */}
          <div style={{ flex: '0 1 160px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Session State
            </label>
            <select
              className="form-select"
              value={checkoutFilter}
              onChange={(e) => setCheckoutFilter(e.target.value)}
            >
              <option value="">All Sessions</option>
              <option value="notCheckedOut">Not Checked Out</option>
              <option value="checkedOut">Checked Out (Completed)</option>
            </select>
          </div>

          {/* From Date */}
          <div style={{ flex: '0 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              From Date
            </label>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div style={{ flex: '0 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              To Date
            </label>
            <input
              type="date"
              className="form-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Apply Filter Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApplyFilter}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
          >
            <Filter size={14} /> Apply Filter
          </button>

          {/* Clear Filter Button */}
          {(selectedEmployeeId || fromDate || toDate || appliedFromDate || appliedToDate || search || statusFilter || checkoutFilter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
            >
              <RotateCcw size={14} /> Clear Filter
            </button>
          )}

          {/* Keyword Search */}
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Quick Search
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={isAdmin ? "Search name, code, status..." : "Search date, status..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Active Query Filter Badges */}
        {(statusFilter || checkoutFilter || appliedFromDate) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Active Filters:</span>
            {statusFilter && (
              <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Status: {statusFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('')} />
              </span>
            )}
            {checkoutFilter === 'notCheckedOut' && (
              <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Active (Not Checked Out)
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setCheckoutFilter('')} />
              </span>
            )}
            {appliedFromDate && (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Date: {appliedFromDate} {appliedToDate && appliedToDate !== appliedFromDate ? `to ${appliedToDate}` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Accordion 1: Employee-wise Working Hours Summary (Admin Portal Only) */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <div 
            onClick={() => setSummaryAccordionOpen(!summaryAccordionOpen)}
            style={{ 
              padding: '14px 18px', 
              background: '#F8FAFC', 
              borderBottom: summaryAccordionOpen ? '1px solid var(--border-color)' : 'none', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                Employee Working Hours Summary
              </h4>
              <span className="badge badge-info">{filteredEmployeeSummaries.length} Employee(s)</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                (Standard 6 Hours / Working Day)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
              <span>{summaryAccordionOpen ? 'Collapse' : 'Expand'}</span>
              {summaryAccordionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>

          {summaryAccordionOpen && (
            <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Employee Code</th>
                    <th>Department</th>
                    <th>Total Working Days</th>
                    <th>Daily Working Hours</th>
                    <th>Total Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Loading summary...</td></tr>
                  ) : filteredEmployeeSummaries.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No employee summary data available.</td></tr>
                  ) : (
                    filteredEmployeeSummaries.map(emp => (
                      <tr key={emp.employeeId || emp.employeeCode}>
                        <td><strong>{emp.employeeName}</strong></td>
                        <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.employeeCode}</span></td>
                        <td>{emp.department || '—'}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                            {emp.totalWorkingDays} Days
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {emp.dailyWorkingHours} Hours
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#16A34A', fontSize: 14 }}>
                            {emp.totalWorkingHours} Hours
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                            ({emp.totalWorkingDays} × {emp.dailyWorkingHours})
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Accordion 2: Attendance Session Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div 
          onClick={() => setLogsAccordionOpen(!logsAccordionOpen)}
          style={{ 
            padding: '14px 18px', 
            background: '#F8FAFC', 
            borderBottom: logsAccordionOpen ? '1px solid var(--border-color)' : 'none', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
              Attendance Session Logs
            </h4>
            <span className="badge badge-info">{displayedAttendance.length} Session(s)</span>
            {checkoutFilter === 'notCheckedOut' && (
              <span className="badge badge-warning">Not Checked Out Only</span>
            )}
            {statusFilter && (
              <span className="badge badge-neutral">{statusFilter} Only</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
            <span>{logsAccordionOpen ? 'Collapse' : 'Expand'}</span>
            {logsAccordionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {logsAccordionOpen && (
          <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Working Hours</th>
                  <th>Location</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: 24 }}>Loading attendance logs...</td></tr>
                ) : (displayedAttendance.length === 0 && absentEmployeesToday.length === 0) ? (
                  <tr><td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: 24 }}>No attendance records found matching criteria.</td></tr>
                ) : (
                  <>
                    {displayedAttendance.map(record => (
                      <tr key={record._id}>
                        <td>
                          <strong>{record.employeeName || 'Unknown Employee'}</strong>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{record.employeeCode || '—'}</div>
                        </td>
                        <td>{record.date}</td>
                        <td>
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td>
                          {record.checkOut ? (
                            new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: 11 }}>In Progress</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                          {calculateDurationFromTimestamps(record.checkIn, record.checkOut, formatDuration(record.workingHours))}
                        </td>

                        {/* Location Column */}
                        <td>
                          {record.checkInLocation ? (
                            <div style={{ fontSize: 11 }}>
                              <a
                                href={`https://www.google.com/maps?q=${record.checkInLocation.latitude},${record.checkInLocation.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Click to view Check-In spot on Google Maps"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16A34A', textDecoration: 'none', fontWeight: 600 }}
                              >
                                <MapPin size={12} />
                                In: {Number(record.checkInLocation.latitude).toFixed(3)}, {Number(record.checkInLocation.longitude).toFixed(3)}
                              </a>
                              {record.checkOutLocation && (
                                <div style={{ marginTop: 2 }}>
                                  <a
                                    href={`https://www.google.com/maps?q=${record.checkOutLocation.latitude},${record.checkOutLocation.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Click to view Check-Out spot on Google Maps"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#DC2626', textDecoration: 'none' }}
                                  >
                                    <MapPin size={12} />
                                    Out: {Number(record.checkOutLocation.latitude).toFixed(3)}, {Number(record.checkOutLocation.longitude).toFixed(3)}
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        <td>
                          <span className={`badge ${
                            record.status === 'Present' ? 'badge-success' :
                            record.status === 'Late Arrival' ? 'badge-warning' :
                            record.status === 'Half Day' ? 'badge-info' :
                            record.status === 'Absent' ? 'badge-danger' : 'badge-neutral'
                          }`}>
                            {record.status}
                          </span>
                          {record.isManualCorrection && (
                            <div style={{ fontSize: 10, color: 'var(--warning)', marginTop: 2 }}>[Corrected]</div>
                          )}
                        </td>

                        {/* Actions: Edit, Delete, Correct */}
                        {isAdmin && (
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenEdit(record)}
                                title="Edit Session"
                                style={{ padding: '4px 7px', color: 'var(--primary-navy)' }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDeleteAttendance(record)}
                                title="Delete Session"
                                style={{ padding: '4px 7px', color: '#DC2626' }}
                              >
                                <Trash2 size={13} />
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenCorrection(record)}
                                title="Audit Correction"
                                style={{ padding: '4px 8px', fontSize: 11 }}
                              >
                                Correct
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}

                    {/* Display Absent Employees if Absent Filter was Selected */}
                    {statusFilter === 'Absent' && absentEmployeesToday.map(emp => (
                      <tr key={`absent-${emp._id}`} style={{ background: '#FFF1F2' }}>
                        <td>
                          <strong>{emp.firstName} {emp.lastName}</strong>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.employeeCode}</div>
                        </td>
                        <td>{targetDateForAbsent}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>0h</td>
                        <td>—</td>
                        <td>
                          <span className="badge badge-danger">Absent Today</span>
                        </td>
                        {isAdmin && <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not Clocked In</span></td>}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance Edit Modal for Admin */}
      {showEditModal && editingAttendanceRecord && (
        <div className="modal-overlay" onClick={() => !editSubmitting && setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Edit Attendance Session
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Employee: <strong>{editingAttendanceRecord.employeeName}</strong> ({editingAttendanceRecord.employeeCode || '—'})
            </p>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={editFormData.date}
                  onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Check-In Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editFormData.checkInTime}
                    onChange={e => setEditFormData({ ...editFormData, checkInTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Check-Out Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editFormData.checkOutTime}
                    onChange={e => setEditFormData({ ...editFormData, checkOutTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Attendance Status</label>
                <select
                  className="form-select"
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="Present">Present</option>
                  <option value="Late Arrival">Late Arrival</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                  <option value="Approved Leave">Approved Leave</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Weekly Off">Weekly Off</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Notes for Modification</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="State reason for editing this session..."
                  value={editFormData.reason}
                  onChange={e => setEditFormData({ ...editFormData, reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Session Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal for Admin */}
      {showCorrectionModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowCorrectionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Manual Attendance Correction
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Employee: <strong>{selectedRecord.employeeName}</strong> ({selectedRecord.date})
            </p>

            <form onSubmit={handleSaveCorrection}>
              <div className="form-group">
                <label className="form-label">Attendance Status</label>
                <select 
                  className="form-select"
                  value={correctionStatus}
                  onChange={e => setCorrectionStatus(e.target.value)}
                >
                  <option value="Present">Present</option>
                  <option value="Late Arrival">Late Arrival</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                  <option value="Approved Leave">Approved Leave</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Weekly Off">Weekly Off</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Correction (Audited) <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Explain why this attendance entry is being manually corrected..."
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCorrectionModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Employee Portal Attendance Modals */}
      {!isAdmin && (
        <AttendanceActionModals
          showScheduleModal={showScheduleModal}
          onCloseScheduleModal={() => setShowScheduleModal(false)}
          showClockOutModal={showClockOutModal}
          onCloseClockOutModal={() => setShowClockOutModal(false)}
          user={user}
          checkInTime={activeSession?.checkIn}
          attendanceId={activeSession?._id}
          onSuccess={fetchAttendance}
        />
      )}
    </div>
  );
};

export default Attendance;
