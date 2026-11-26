import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, Plus, Clock, Tag, AlertCircle, RotateCcw, Search, Filter } from 'lucide-react';
import EmployeeSelectFilter from '../components/common/EmployeeSelectFilter';

const Schedules = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Admin Filters
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const isAdmin = user?.role === 'Admin';
  const authenticatedEmployeeName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : (user?.username || 'Current Employee');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    employee: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:30',
    priority: 'Medium',
    status: 'Planned',
    reminder: false
  });

  const fetchData = async (customParams = {}) => {
    try {
      setLoading(true);
      const params = {};
      const from = customParams.fromDate !== undefined ? customParams.fromDate : appliedFromDate;
      const to = customParams.toDate !== undefined ? customParams.toDate : appliedToDate;
      const emp = customParams.employeeId !== undefined ? customParams.employeeId : selectedEmployeeId;

      if (from) params.fromDate = from;
      if (to) params.toDate = to;
      if (emp && isAdmin) params.employeeId = emp;

      const [schedRes, empRes] = await Promise.all([
        api.get('/schedules', params),
        isAdmin ? api.get('/employees') : Promise.resolve({ success: true, data: [] })
      ]);

      if (schedRes.success) setSchedules(schedRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
    } catch (e) {
      console.error(e);
      addToast(e.message || 'Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, selectedEmployeeId]);

  const handleApplyFilter = () => {
    if (fromDate && toDate && toDate < fromDate) {
      addToast('To Date must not be earlier than From Date', 'error');
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    fetchData({ fromDate, toDate });
  };

  const handleResetFilters = () => {
    setSelectedEmployeeId('');
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setSearchFilter('');
    fetchData({ fromDate: '', toDate: '', employeeId: '' });
  };

  const handleOpenModal = () => {
    setFormError('');
    setFormData({
      title: '',
      description: '',
      // If Employee, automatically set their own employeeId
      employee: isAdmin ? (employees[0]?._id || '') : (user?.employeeId || ''),
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:30',
      priority: 'Medium',
      status: 'Planned',
      reminder: false
    });
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      let selectedEmpName = authenticatedEmployeeName;
      let targetEmployeeId = user?.employeeId;

      if (isAdmin) {
        if (!formData.employee) {
          setFormError('Please select an employee');
          setSubmitting(false);
          return;
        }
        targetEmployeeId = formData.employee;
        const selectedEmp = employees.find(e => e._id === formData.employee);
        selectedEmpName = selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : '';
      }

      const payload = {
        ...formData,
        employee: targetEmployeeId,
        employeeName: selectedEmpName
      };

      const res = await api.post('/schedules', payload);
      if (res.success) {
        addToast(res.message || 'Daily schedule published successfully!', 'success');
        setShowModal(false);
        fetchData();
      }
    } catch (e) {
      console.error('Schedule creation error:', e);
      const errMsg = e.data?.message || e.message || 'Failed to publish schedule';
      setFormError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Displayed schedules filtered by search
  const displayedSchedules = schedules.filter(s => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const title = (s.title || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      const emp = (s.employeeName || '').toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !emp.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>
            {isAdmin ? 'Schedule Management & Assignments' : 'My Daily Schedule'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isAdmin 
              ? 'Plan employee work commitments, agendas, time slots and shifts' 
              : 'View and create your daily calendar slots and planned agendas'}
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={16} /> Assign Schedule
        </button>
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
          {(selectedEmployeeId || fromDate || toDate || appliedFromDate || appliedToDate || searchFilter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
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
              placeholder={isAdmin ? "Search agenda, employee, notes..." : "Search agenda, notes..."}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Schedule Agenda</th>
              <th>Time Slot</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24 }}>Loading schedules...</td></tr>
            ) : displayedSchedules.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24 }}>No schedules planned {appliedFromDate || appliedToDate ? 'matching the selected date range.' : 'matching criteria. Click "Assign Schedule" to add one.'}</td></tr>
            ) : (
              displayedSchedules.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.employeeName || 'Assigned Staff'}</strong></td>
                  <td>{s.date}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{s.title}</div>
                    {s.description && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.description}</div>}
                  </td>
                  <td>{s.startTime} - {s.endTime}</td>
                  <td>
                    <span className={`badge ${s.priority === 'High' || s.priority === 'Urgent' ? 'badge-danger' : s.priority === 'Medium' ? 'badge-warning' : 'badge-neutral'}`}>
                      {s.priority}
                    </span>
                  </td>
                  <td><span className="badge badge-info">{s.status}</span></td>
                  <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.assignedBy || 'Admin'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {isAdmin ? 'Assign Schedule to Employee' : 'Create My Daily Schedule'}
            </h3>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate}>
              {/* Employee Field: Auto-populated for Employee, Selectable for Admin */}
              <div className="form-group">
                <label className="form-label">Employee</label>
                {isAdmin ? (
                  <select 
                    className="form-select"
                    value={formData.employee}
                    onChange={e => setFormData({ ...formData, employee: e.target.value })}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.designation})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={authenticatedEmployeeName}
                    disabled
                    readOnly
                    style={{ background: '#F1F5F9', cursor: 'not-allowed', color: '#1E293B', fontWeight: 600 }}
                  />
                )}
                {!isAdmin && (
                  <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                    Automatically linked to your authenticated employee profile.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Schedule Agenda Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g. Sprint Backlog Grooming & System Review"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  rows="2"
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Provide context, meeting objectives, or milestones..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Schedule Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.date} 
                  onChange={e => setFormData({ ...formData, date: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.startTime} 
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.endTime} 
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Publishing...' : 'Publish Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
