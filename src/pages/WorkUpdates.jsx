import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, CheckCircle, XCircle, AlertCircle, Clock, RotateCcw, Search, Filter } from 'lucide-react';
import EmployeeSelectFilter from '../components/common/EmployeeSelectFilter';
import { formatDuration } from '../utils/timeUtils';

const WorkUpdates = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [updates, setUpdates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters for Admin
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const [formData, setFormData] = useState({
    relatedTask: '',
    taskTitle: '',
    workTitle: '',
    workDescription: '',
    startTime: '09:30',
    endTime: '12:30',
    timeSpent: 3,
    progressPercentage: 50
  });

  const role = user?.role || 'Employee';
  const isAdmin = role === 'Admin';

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

      const [updateRes, taskRes, empRes] = await Promise.all([
        api.get('/work-updates', params),
        api.get('/tasks'),
        isAdmin ? api.get('/employees') : Promise.resolve({ success: true, data: [] })
      ]);
      if (updateRes.success) setUpdates(updateRes.data);
      if (taskRes.success) setTasks(taskRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
    } catch (e) {
      console.error(e);
      addToast('Failed to load work updates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEmployeeId]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedTask = tasks.find(t => t._id === formData.relatedTask);
      const empName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user?.username || 'Employee');

      await api.post('/work-updates', {
        ...formData,
        employeeName: empName,
        taskTitle: selectedTask ? selectedTask.title : '',
        date: new Date().toISOString().split('T')[0]
      });
      addToast('Daily work update submitted successfully', 'success');
      setShowModal(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Submission failed', 'error');
    }
  };

  const handleReview = async (id, status) => {
    const remarks = prompt(`Enter review remarks for marking as ${status}:`);
    if (remarks !== null) {
      try {
        await api.put(`/work-updates/${id}/review`, { status, remarks });
        addToast(`Work update marked as ${status}`, 'success');
        fetchData();
      } catch (err) {
        addToast(err.message || 'Review action failed', 'error');
      }
    }
  };

  // Filter display by search
  const displayedUpdates = updates.filter(u => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const title = (u.workTitle || '').toLowerCase();
      const desc = (u.workDescription || '').toLowerCase();
      const emp = (u.employeeName || '').toLowerCase();
      const task = (u.taskTitle || '').toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !emp.includes(q) && !task.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Daily Work Updates</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isAdmin
              ? 'Review employee daily deliverables, working times, achievements and blockers'
              : 'Submit multiple daily work logs and track management review status'}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Submit Work Update
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
              Search Updates
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={isAdmin ? "Search work title, description, employee..." : "Search work title, description..."}
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
              <th>Work Title & Description</th>
              <th>Related Task</th>
              <th>Duration</th>
              <th>Progress</th>
              <th>Review Status</th>
              {role === 'Admin' && <th>Admin Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24 }}>Loading work logs...</td></tr>
            ) : displayedUpdates.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24 }}>No work updates found {appliedFromDate || appliedToDate ? 'matching the selected date range.' : 'matching criteria.'}</td></tr>
            ) : (
              displayedUpdates.map(u => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.employeeName || 'Unknown Employee'}</strong>
                    {u.employeeCode && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.employeeCode}</div>}
                  </td>
                  <td>{u.date}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{u.workTitle}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>{u.workDescription}</div>
                    {u.completedTasks && (
                      <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4 }}>
                        <strong>Completed Tasks:</strong> {u.completedTasks}
                      </div>
                    )}
                    {u.pendingTasks && (
                      <div style={{ fontSize: 11, color: '#D97706', marginTop: 2 }}>
                        <strong>Pending:</strong> {u.pendingTasks}
                      </div>
                    )}
                    {u.challenges && (
                      <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>
                        <strong>Challenges/Blockers:</strong> {u.challenges}
                      </div>
                    )}
                    {u.notes && (
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        <strong>Notes:</strong> {u.notes}
                      </div>
                    )}
                  </td>
                  <td>{u.taskTitle || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                    {formatDuration(u.timeSpent)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${u.progressPercentage || 0}%`, height: '100%', background: '#2563EB' }} />
                      </div>
                      <span style={{ fontSize: 12 }}>{u.progressPercentage}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.workStatus === 'Approved' ? 'badge-success' :
                        u.workStatus === 'Rejected' ? 'badge-danger' :
                          u.workStatus === 'Revision Requested' ? 'badge-warning' : 'badge-info'
                      }`}>
                      {u.workStatus}
                    </span>
                    {u.remarks && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>"{u.remarks}"</div>}
                  </td>
                  {role === 'Admin' && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleReview(u._id, 'Approved')}
                          title="Approve"
                          style={{ color: 'var(--success)' }}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleReview(u._id, 'Revision Requested')}
                          title="Request Revision"
                          style={{ color: 'var(--warning)' }}
                        >
                          <AlertCircle size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleReview(u._id, 'Rejected')}
                          title="Reject"
                          style={{ color: 'var(--danger)' }}
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Submit Daily Work Log</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Related Project Task</label>
                <select
                  className="form-select"
                  value={formData.relatedTask}
                  onChange={e => setFormData({ ...formData, relatedTask: e.target.value })}
                >
                  <option value="">-- Standalone Work Update --</option>
                  {tasks.map(t => (
                    <option key={t._id} value={t._id}>{t.title} ({t.taskId})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Work Title <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Implemented User Role Authentication Guard"
                  value={formData.workTitle}
                  onChange={e => setFormData({ ...formData, workTitle: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Work Accomplishments <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  required
                  placeholder="Comprehensive description of items completed, tests verified, bug fixes, or commits..."
                  value={formData.workDescription}
                  onChange={e => setFormData({ ...formData, workDescription: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Time Spent (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="form-input"
                    value={formData.timeSpent}
                    onChange={e => setFormData({ ...formData, timeSpent: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Progress Percentage ({formData.progressPercentage}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    style={{ width: '100%', marginTop: 8 }}
                    value={formData.progressPercentage}
                    onChange={e => setFormData({ ...formData, progressPercentage: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit for Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkUpdates;
