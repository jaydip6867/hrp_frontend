import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, Clock, Calendar, AlertTriangle, RotateCcw, Filter } from 'lucide-react';
import EmployeeSelectFilter from '../components/common/EmployeeSelectFilter';
import AttendanceActionModals from '../components/common/AttendanceActionModals';
import { formatDuration, calculateDurationFromTimestamps } from '../utils/timeUtils';
import { requestLocationPermission } from '../utils/locationUtils';

const Attendance = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [attendanceList, setAttendanceList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [backendSummary, setBackendSummary] = useState(null);
  const [backendEmployeeSummaries, setBackendEmployeeSummaries] = useState([]);

  // Filters for Admin
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState('Present');

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
    setSearch('');
    fetchAttendance({ fromDate: '', toDate: '', employeeId: '' });
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

  // Filter list by search text if present
  const displayedAttendance = attendanceList.filter(record => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (record.employeeName || '').toLowerCase();
    const code = (record.employeeCode || '').toLowerCase();
    const status = (record.status || '').toLowerCase();
    return name.includes(q) || code.includes(q) || status.includes(q);
  });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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
            <div style={{ flex: '1 1 220px' }}>
              <EmployeeSelectFilter
                employees={employees}
                selectedEmployeeId={selectedEmployeeId}
                onChange={(id) => setSelectedEmployeeId(id)}
                label="Filter by Employee Name"
                placeholder="All Employees"
              />
            </div>
          )}

          {/* From Date */}
          <div style={{ flex: '0 1 150px' }}>
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
          <div style={{ flex: '0 1 150px' }}>
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
          {(selectedEmployeeId || fromDate || toDate || appliedFromDate || appliedToDate || search) && (
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
          <div style={{ flex: '1 1 180px' }}>
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
      </div>

      {/* Employee-wise Working Hours Summary Table (Admin Portal Only) */}
      {isAdmin && (
        <div className="table-container" style={{ marginBottom: 24 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-navy)' }}>
                Employee Working Hours Summary
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Standard 6 Hours / Working Day • Calculated across all matching records (independent of pagination)
              </p>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {filteredEmployeeSummaries.length} employee(s)
            </span>
          </div>
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

      {/* Attendance Log Table */}
      <div className="table-container">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-navy)' }}>
            Attendance Session Logs
          </h4>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Displaying {displayedAttendance.length} session record(s)
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Working Hours</th>
              <th>Status</th>
              {isAdmin && <th>Audit / Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: 24 }}>Loading attendance logs...</td></tr>
            ) : displayedAttendance.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: 24 }}>No attendance records found {appliedFromDate || appliedToDate ? 'matching the selected date range.' : 'matching criteria.'}</td></tr>
            ) : (
              displayedAttendance.map(record => (
                <tr key={record._id}>
                  <td>
                    <strong>{record.employeeName || 'Unknown Employee'}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{record.employeeCode || '—'}</div>
                  </td>
                  <td>{record.date}</td>
                  <td>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                    {calculateDurationFromTimestamps(record.checkIn, record.checkOut, formatDuration(record.workingHours))}
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
                  {isAdmin && (
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenCorrection(record)}
                      >
                        Correct
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
