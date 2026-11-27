import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, Edit, Trash2, KeyRound,
  CheckCircle, XCircle, Copy, AlertTriangle, Eye, EyeOff, RotateCcw, Calendar,
  Clock, ShieldCheck, Filter, ChevronDown, ChevronUp, MapPin
} from 'lucide-react';
import { formatDuration } from '../utils/timeUtils';

const Employees = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Accordion States for Employee Working Hours Summary & Attendance Session Logs
  const [attendanceList, setAttendanceList] = useState([]);
  const [employeeSummaries, setEmployeeSummaries] = useState([]);
  const [summaryAccordionOpen, setSummaryAccordionOpen] = useState(false);
  const [logsAccordionOpen, setLogsAccordionOpen] = useState(false);

  // Password Management States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmpForPassword, setSelectedEmpForPassword] = useState(null);
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPass, setShowCustomPass] = useState(false);
  const [passwordMode, setPasswordMode] = useState('temp'); // 'temp' or 'manual'
  const [generatedTempPassword, setGeneratedTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    gender: 'Male',
    departmentName: 'General',
    designation: 'Employee',
    employmentType: 'Full-Time',
    workLocation: 'Headquarters',
    employeeStatus: 'Active',
    basicSalary: 6000
  });

  const loadData = async (customParams = {}) => {
    try {
      setLoading(true);
      const params = {};
      const from = customParams.fromDate !== undefined ? customParams.fromDate : appliedFromDate;
      const to = customParams.toDate !== undefined ? customParams.toDate : appliedToDate;

      if (from) params.fromDate = from;
      if (to) params.toDate = to;
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      if (designationFilter) params.designation = designationFilter;
      if (statusFilter) params.status = statusFilter;
      if (weekFilter) params.week = weekFilter;
      if (monthFilter) params.month = monthFilter;

      const [empRes, deptRes, attRes] = await Promise.all([
        api.get('/employees', params),
        api.get('/departments'),
        api.get('/attendance')
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
      if (attRes.success && attRes.data) {
        setAttendanceList(attRes.data);
        if (attRes.employeeSummaries) {
          setEmployeeSummaries(attRes.employeeSummaries);
        }
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, deptFilter, designationFilter, statusFilter, weekFilter, monthFilter]);

  const handleApplyFilter = () => {
    if (fromDate && toDate && toDate < fromDate) {
      addToast('To Date must not be earlier than From Date', 'error');
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    loadData({ fromDate, toDate });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDeptFilter('');
    setDesignationFilter('');
    setStatusFilter('');
    setWeekFilter('');
    setMonthFilter('');
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    loadData({ fromDate: '', toDate: '' });
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      gender: 'Male',
      departmentName: departments[0]?.name || 'General',
      designation: 'Employee',
      employmentType: 'Full-Time',
      workLocation: 'Headquarters',
      employeeStatus: 'Active',
      basicSalary: 6000
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditing(true);
    setCurrentId(emp._id);
    setFormData({
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      username: emp.username || '',
      email: emp.email,
      phone: emp.phone,
      gender: emp.gender || 'Male',
      departmentName: emp.departmentName || 'General',
      designation: emp.designation || 'Employee',
      employmentType: emp.employmentType || 'Full-Time',
      workLocation: emp.workLocation || 'Headquarters',
      employeeStatus: emp.employeeStatus || 'Active',
      basicSalary: emp.salaryInformation?.basicSalary || 6000
    });
    setShowModal(true);
  };

  // Password Management Handlers
  const handleOpenPasswordModal = (emp) => {
    setSelectedEmpForPassword(emp);
    setPasswordMode('temp');
    setCustomPassword('');
    setGeneratedTempPassword('');
    setCopied(false);
    setShowPasswordModal(true);
  };

  const handleProcessPasswordReset = async (e) => {
    e.preventDefault();
    if (!selectedEmpForPassword) return;

    setPasswordSubmitting(true);
    setGeneratedTempPassword('');
    setCopied(false);

    try {
      const payload = passwordMode === 'temp'
        ? { isTemporary: true }
        : { newPassword: customPassword, isTemporary: false };

      const res = await api.post(`/auth/admin/reset-password/${selectedEmpForPassword._id}`, payload);

      if (res.success) {
        addToast(res.message, 'success');
        loadData();
        if (res.temporaryPassword) {
          setGeneratedTempPassword(res.temporaryPassword);
        } else {
          setShowPasswordModal(false);
        }
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Password reset failed', 'error');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (generatedTempPassword) {
      navigator.clipboard.writeText(generatedTempPassword);
      setCopied(true);
      addToast('Temporary password copied to clipboard!', 'info');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/employees/${currentId}`, formData);
        addToast('Employee updated successfully', 'success');
      } else {
        await api.post('/employees', formData);
        addToast('Employee added and user credentials provisioned', 'success');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.patch(`/employees/${id}/status`, { status: newStatus });
      addToast(`Employee status updated to ${newStatus}`, 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete ${name}? This will delete the employee profile and their login account from the database.`)) {
      try {
        await api.delete(`/employees/${id}`);
        addToast('Employee permanently deleted from database', 'success');
        loadData();
      } catch (err) {
        addToast(err.message || 'Action failed', 'error');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Employee Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Manage employee & intern profiles, credentials, access statuses, and records.
          </p>
        </div>
        {user?.role === 'Admin' && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Employee
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-main)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search code, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 140 }}
          value={designationFilter}
          onChange={(e) => setDesignationFilter(e.target.value)}
        >
          <option value="">All Designations</option>
          <option value="Intern">Intern</option>
          <option value="Employee">Employee</option>
        </select>

        <select
          className="form-select"
          style={{ width: 150 }}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d._id} value={d.name}>{d.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 130 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Terminated">Terminated</option>
        </select>

        {/* Weekly Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Week:</span>
          <input
            type="week"
            className="form-input"
            value={weekFilter}
            onChange={(e) => {
              setWeekFilter(e.target.value);
              if (e.target.value) setMonthFilter(''); // Mutually clear month when week is selected
            }}
            title="Filter employees by joining/created week"
            style={{ width: 150, padding: '6px 8px', fontSize: 12 }}
          />
        </div>

        {/* Monthly Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Month:</span>
          <input
            type="month"
            className="form-input"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              if (e.target.value) setWeekFilter(''); // Mutually clear week when month is selected
            }}
            title="Filter employees by joining/created month"
            style={{ width: 140, padding: '6px 8px', fontSize: 12 }}
          />
        </div>

        {/* From Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>From:</span>
          <input
            type="date"
            className="form-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="Filter employees from joining/created date"
            style={{ width: 135, padding: '6px 8px', fontSize: 12 }}
          />
        </div>

        {/* To Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>To:</span>
          <input
            type="date"
            className="form-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="Filter employees up to joining/created date"
            style={{ width: 135, padding: '6px 8px', fontSize: 12 }}
          />
        </div>

        {/* Apply Filter Button */}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleApplyFilter}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px' }}
        >
          <Filter size={13} /> Apply Filter
        </button>

        {/* Clear/Reset Filters */}
        {(search || deptFilter || designationFilter || statusFilter || weekFilter || monthFilter || fromDate || toDate || appliedFromDate || appliedToDate) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetFilters}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px' }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        )}
      </div>

      {/* 14 Table Columns (including Login Password Management) */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>1. Emp ID</th>
              <th>2. First Name</th>
              <th>3. Last Name</th>
              <th>4. Emp Code</th>
              <th>5. Phone</th>
              <th>6. Email</th>
              <th>7. Username</th>
              <th>8. Designation</th>
              <th>9. Department</th>
              <th>10. Joining Date</th>
              <th>11. Account Status</th>
              <th>12. Registration Date</th>
              <th>13. Login Password</th>
              <th>14. Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="14" style={{ textAlign: 'center', padding: 24 }}>Loading workforce records...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan="14" style={{ textAlign: 'center', padding: 24 }}>No employee records found {appliedFromDate || appliedToDate ? 'matching the selected date range.' : 'matching the filters.'}</td></tr>
            ) : (
              employees.map(emp => (
                <tr key={emp._id}>
                  <td><span style={{ fontSize: 11, color: '#64748B' }}>{emp._id?.slice(0, 8)}...</span></td>
                  <td><strong>{emp.firstName}</strong></td>
                  <td><strong>{emp.lastName}</strong></td>
                  <td><span className="badge badge-info">{emp.employeeCode}</span></td>
                  <td>{emp.phone}</td>
                  <td>{emp.email}</td>
                  <td><span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{emp.username || '—'}</span></td>
                  <td>
                    <span className={`badge ${emp.designation === 'Intern' ? 'badge-warning' : 'badge-info'}`}>
                      {emp.designation}
                    </span>
                  </td>
                  <td>{emp.departmentName || 'General'}</td>
                  <td>{emp.joiningDate ? emp.joiningDate.split('T')[0] : '—'}</td>
                  <td>
                    <span className={`badge ${emp.accountStatus === 'Active' && emp.employeeStatus === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.accountStatus === 'Active' && emp.employeeStatus === 'Active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                      <span className={`badge ${emp.mustChangePassword ? 'badge-warning' : 'badge-success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, whiteSpace: 'nowrap' }}>
                        {emp.mustChangePassword ? <Clock size={12} /> : <ShieldCheck size={12} />}
                        {emp.mustChangePassword ? 'Temp (Change Pending)' : 'Configured / Active'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenPasswordModal(emp)}
                        title="Reset Employee Password"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', color: '#2563EB', borderColor: '#BFDBFE', whiteSpace: 'nowrap' }}
                      >
                        <KeyRound size={12} /> Reset Password
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Activate / Deactivate Toggle */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleStatus(emp._id, emp.employeeStatus)}
                        title={emp.employeeStatus === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        style={{ color: emp.employeeStatus === 'Active' ? 'var(--danger)' : 'var(--success)' }}
                      >
                        {emp.employeeStatus === 'Active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>

                      {/* Edit Details */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(emp)}
                        title="Edit Details"
                      >
                        <Edit size={14} />
                      </button>

                      {/* Safe Delete */}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(emp._id, `${emp.firstName} ${emp.lastName}`)}
                        title="Safe Deletion"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================== */}
      {/* ACCORDION 1: Employee Working Hours Summary              */}
      {/* ======================================================== */}
      <div className="card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div 
          onClick={() => setSummaryAccordionOpen(!summaryAccordionOpen)}
          style={{ 
            padding: '16px 20px', 
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
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
              Employee Working Hours Summary
            </h4>
            <span className="badge badge-info">{employeeSummaries.length} Employee(s)</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              (Standard 6 Hours / Working Day)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
            <span>{summaryAccordionOpen ? 'Collapse' : 'Expand Accordion'}</span>
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
                {employeeSummaries.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No working hours summary available.</td></tr>
                ) : (
                  employeeSummaries.map(emp => (
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

      {/* ======================================================== */}
      {/* ACCORDION 2: Attendance Session Logs                     */}
      {/* ======================================================== */}
      <div className="card" style={{ marginTop: 20, marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div 
          onClick={() => setLogsAccordionOpen(!logsAccordionOpen)}
          style={{ 
            padding: '16px 20px', 
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
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
              Attendance Session Logs
            </h4>
            <span className="badge badge-info">{attendanceList.length} Record(s)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
            <span>{logsAccordionOpen ? 'Collapse' : 'Expand Accordion'}</span>
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
                </tr>
              </thead>
              <tbody>
                {attendanceList.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>No attendance records found.</td></tr>
                ) : (
                  attendanceList.slice(0, 50).map(record => (
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
                        {formatDuration(record.workingHours)}
                      </td>
                      <td>
                        {record.checkInLocation ? (
                          <a
                            href={`https://www.google.com/maps?q=${record.checkInLocation.latitude},${record.checkInLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16A34A', textDecoration: 'none', fontSize: 11, fontWeight: 600 }}
                          >
                            <MapPin size={12} />
                            {Number(record.checkInLocation.latitude).toFixed(3)}, {Number(record.checkInLocation.longitude).toFixed(3)}
                          </a>
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Management Confirmation Modal */}
      {showPasswordModal && selectedEmpForPassword && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 8, background: '#EFF6FF', borderRadius: 8, color: '#2563EB' }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-navy)' }}>
                  Reset Employee Password Confirmation
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Target: <strong>{selectedEmpForPassword.firstName} {selectedEmpForPassword.lastName}</strong> ({selectedEmpForPassword.designation} • {selectedEmpForPassword.employeeCode} • @{selectedEmpForPassword.username})
                </p>
              </div>
            </div>

            {/* Display newly generated temporary password ONCE */}
            {generatedTempPassword ? (
              <div style={{ padding: 20, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                  <CheckCircle size={18} color="#16A34A" />
                  Temporary Password Generated (One-Time View)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '12px 16px', borderRadius: 8, border: '1px solid #86EFAC', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <code style={{ fontSize: 18, fontWeight: 700, color: '#15803D', letterSpacing: 1.5, flex: 1, fontFamily: 'monospace' }}>
                    {generatedTempPassword}
                  </code>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyPassword}
                    style={{ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                  >
                    <Copy size={15} /> {copied ? 'Copied!' : 'Copy Password'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#166534', marginTop: 10, lineHeight: 1.4 }}>
                  <strong>Important:</strong> Provide this temporary password to the employee securely. For corporate security, this password will not be displayed again, and the employee will be <strong>required to change it at their next login</strong> before accessing their workstation.
                </p>
                <div style={{ marginTop: 18, textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setShowPasswordModal(false);
                      loadData();
                    }}
                  >
                    Done & Return
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessPasswordReset}>
                <div style={{ padding: 12, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.4 }}>
                    Confirming this action will immediately revoke the existing password for <strong>{selectedEmpForPassword.firstName} {selectedEmpForPassword.lastName}</strong>. A temporary credential will be issued and the employee must set a new password on login.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => setPasswordMode('temp')}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: passwordMode === 'temp' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: passwordMode === 'temp' ? '#EFF6FF' : '#fff',
                      color: passwordMode === 'temp' ? '#2563EB' : '#475569',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Generate Temporary Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordMode('manual')}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: passwordMode === 'manual' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: passwordMode === 'manual' ? '#EFF6FF' : '#fff',
                      color: passwordMode === 'manual' ? '#2563EB' : '#475569',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Set Custom Password
                  </button>
                </div>

                {passwordMode === 'temp' ? (
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16, fontSize: 13, color: '#475569' }}>
                    <p style={{ marginBottom: 6 }}>
                      This will automatically generate a cryptographically secure 10-character temporary password conforming to corporate complexity standards (uppercase, lowercase, numbers, special characters).
                    </p>
                    <p style={{ fontSize: 11, color: '#64748B' }}>
                      The generated temporary password will be shown to you once so you can copy and provide it to the employee.
                    </p>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">New Password (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCustomPass ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter compliant new password"
                        value={customPassword}
                        onChange={e => setCustomPassword(e.target.value)}
                        required
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomPass(!showCustomPass)}
                        style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                      >
                        {showCustomPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={passwordSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={passwordSubmitting}
                  >
                    {passwordSubmitting ? 'Processing...' : (passwordMode === 'temp' ? 'Confirm & Generate Temp Password' : 'Confirm & Reset Password')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {isEditing ? 'Edit Employee Details' : 'Add Employee Manually'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Employee Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.employeeCode}
                    onChange={e => setFormData({ ...formData, employeeCode: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select
                    className="form-select"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  >
                    <option value="Intern">Intern</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={formData.departmentName}
                    onChange={e => setFormData({ ...formData, departmentName: e.target.value })}
                  >
                    {departments.map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
