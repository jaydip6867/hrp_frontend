import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Plus, Check, X, Palmtree, Calendar, RotateCcw, 
  Search, Settings, ShieldCheck, AlertCircle, Clock, Filter 
} from 'lucide-react';
import EmployeeSelectFilter from '../components/common/EmployeeSelectFilter';

const ALLOWED_LEAVE_TYPES = ['Sick Leave', 'Unpaid Leave', 'Emergency Leave'];

const Leaves = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Leave Quotas State for Admin
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaFormData, setQuotaFormData] = useState({
    'Sick Leave': 10,
    'Unpaid Leave': 30,
    'Emergency Leave': 5
  });
  const [quotaSubmitting, setQuotaSubmitting] = useState(false);

  // Filters for Admin
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const [formData, setFormData] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    totalDays: 1,
    reason: ''
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

      const [leaveRes, balRes, empRes, policyRes] = await Promise.all([
        api.get('/leaves', params),
        api.get('/leave-balances'),
        isAdmin ? api.get('/employees') : Promise.resolve({ success: true, data: [] }),
        api.get('/leave-policies')
      ]);

      if (leaveRes.success) setLeaves(leaveRes.data);
      if (balRes.success) setBalances(balRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data);

      if (policyRes.success && policyRes.data) {
        const allowedPolicies = policyRes.data.filter(p => ALLOWED_LEAVE_TYPES.includes(p.leaveType));
        const map = {};
        allowedPolicies.forEach(p => {
          map[p.leaveType] = p.daysPerYear;
        });
        setQuotaFormData(prev => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load leave records', 'error');
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
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setSearchFilter('');
    fetchData({ fromDate: '', toDate: '', employeeId: '' });
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', formData);
      addToast('Leave application submitted for approval', 'success');
      setShowApplyModal(false);
      setFormData({
        leaveType: 'Sick Leave',
        startDate: '',
        endDate: '',
        totalDays: 1,
        reason: ''
      });
      fetchData();
    } catch (err) {
      addToast(err.message || 'Application failed', 'error');
    }
  };

  const handleDecision = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      addToast(`Leave request ${status.toLowerCase()} successfully`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  const handleSaveQuotas = async (e) => {
    e.preventDefault();
    setQuotaSubmitting(true);
    try {
      const res = await api.put('/leave-quotas', { quotas: quotaFormData });
      if (res.success) {
        addToast('Leave quotas updated and synced successfully', 'success');
        setShowQuotaModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to update leave quotas', 'error');
    } finally {
      setQuotaSubmitting(false);
    }
  };

  const myBalance = balances.find(b => b.employee === user?.employeeId) || balances[0];

  // Filter leaves dynamically
  const displayedLeaves = leaves.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const emp = (l.employeeName || '').toLowerCase();
      const reason = (l.reason || '').toLowerCase();
      const type = (l.leaveType || '').toLowerCase();
      if (!emp.includes(q) && !reason.includes(q) && !type.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>
            Leave Management & Quotas
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isAdmin 
              ? 'Review employee leave applications, configure annual quotas, and track approvals'
              : 'Annual quotas, balances, and submission matrix'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => setShowQuotaModal(true)}>
              <Settings size={16} /> Configure Quotas
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
            <Plus size={16} /> Apply for Leave
          </button>
        </div>
      </div>

      {/* Admin Leave Quotas Cards */}
      {isAdmin && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-navy)' }}>
              Annual Leave Quotas
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Standard categories: Sick Leave, Unpaid Leave, Emergency Leave
            </span>
          </div>

          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid #2563EB' }}>
              <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <ShieldCheck size={24} />
              </div>
              <div className="stat-info">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="stat-value">{quotaFormData['Sick Leave'] ?? 10}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Days / Year</span>
                </div>
                <span className="stat-label">Sick Leave Quota</span>
                <span style={{ fontSize: 11, color: '#16A34A', marginTop: 4, display: 'block', fontWeight: 500 }}>
                  Paid Medical • Enforced Quota Limit
                </span>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #F59E0B' }}>
              <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="stat-value">{quotaFormData['Unpaid Leave'] ?? 30}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Days / Year</span>
                </div>
                <span className="stat-label">Unpaid Leave Quota</span>
                <span style={{ fontSize: 11, color: '#D97706', marginTop: 4, display: 'block', fontWeight: 500 }}>
                  Leave Without Pay • Zero Deduction on Paid Balances
                </span>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #DC2626' }}>
              <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <AlertCircle size={24} />
              </div>
              <div className="stat-info">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="stat-value">{quotaFormData['Emergency Leave'] ?? 5}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Days / Year</span>
                </div>
                <span className="stat-label">Emergency Leave Quota</span>
                <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                  Urgent Emergency • Enforced Quota Limit
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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

          {/* Status Filter */}
          <div style={{ flex: '0 1 150px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Leave Status
            </label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

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
          {(selectedEmployeeId || statusFilter || fromDate || toDate || appliedFromDate || appliedToDate || searchFilter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
            >
              <RotateCcw size={14} /> Clear Filter
            </button>
          )}

          {/* Search Input */}
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Quick Search
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={isAdmin ? "Search reason, employee, leave type..." : "Search reason, leave type..."}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Leave Balances Grid for Current Employee (Strictly the 3 allowed categories) */}
      {!isAdmin && myBalance && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {(myBalance.balances || [])
            .filter(b => ALLOWED_LEAVE_TYPES.includes(b.leaveType))
            .map(b => (
              <div key={b.leaveType} className="stat-card">
                <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <Palmtree size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{b.available}</span>
                  <span className="stat-label">{b.leaveType} Available (Used: {b.used}/{b.total})</span>
                  {b.leaveType === 'Unpaid Leave' && (
                    <span style={{ fontSize: 11, color: '#64748B', marginTop: 2, display: 'block' }}>
                      Non-paid category (zero deduction on paid balance)
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Leave Applications Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              {role === 'Admin' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={role === 'Admin' ? 8 : 7} style={{ textAlign: 'center', padding: 24 }}>Loading leave requests...</td></tr>
            ) : displayedLeaves.length === 0 ? (
              <tr><td colSpan={role === 'Admin' ? 8 : 7} style={{ textAlign: 'center', padding: 24 }}>No leave requests found {appliedFromDate || appliedToDate ? 'matching the selected date range.' : 'matching criteria.'}</td></tr>
            ) : (
              displayedLeaves.map(l => (
                <tr key={l._id}>
                  <td><strong>{l.employeeName || 'Unknown Employee'}</strong></td>
                  <td>
                    <span className={`badge ${
                      l.leaveType === 'Sick Leave' ? 'badge-info' :
                      l.leaveType === 'Emergency Leave' ? 'badge-danger' :
                      l.leaveType === 'Unpaid Leave' ? 'badge-warning' : 'badge-secondary'
                    }`}>
                      {l.leaveType}
                    </span>
                  </td>
                  <td>{l.startDate}</td>
                  <td>{l.endDate}</td>
                  <td>{l.totalDays} days</td>
                  <td>{l.reason}</td>
                  <td>
                    <span className={`badge ${
                      l.status === 'Approved' ? 'badge-success' :
                      l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  {role === 'Admin' && (
                    <td>
                      {l.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ color: 'var(--success)' }}
                            onClick={() => handleDecision(l._id, 'Approved')}
                            title="Approve Leave"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDecision(l._id, 'Rejected')}
                            title="Reject Leave"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Decision Recorded</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Configure Leave Quotas Modal (Admin Only) */}
      {showQuotaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 8, background: '#EFF6FF', borderRadius: 8, color: '#2563EB' }}>
                <Settings size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-navy)' }}>
                  Configure Leave Quotas
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Set annual quotas for the 3 authorized leave categories
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveQuotas}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Sick Leave Annual Quota (Days) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  className="form-input"
                  value={quotaFormData['Sick Leave'] ?? 10}
                  onChange={e => setQuotaFormData({ ...quotaFormData, 'Sick Leave': Number(e.target.value) })}
                  required
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Paid medical recuperation allowance. Enforces balance check on application.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Unpaid Leave Annual Quota (Days) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  className="form-input"
                  value={quotaFormData['Unpaid Leave'] ?? 30}
                  onChange={e => setQuotaFormData({ ...quotaFormData, 'Unpaid Leave': Number(e.target.value) })}
                  required
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Leave without pay. Does not deduct from paid balances.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Emergency Leave Annual Quota (Days) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  className="form-input"
                  value={quotaFormData['Emergency Leave'] ?? 5}
                  onChange={e => setQuotaFormData({ ...quotaFormData, 'Emergency Leave': Number(e.target.value) })}
                  required
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Unforeseen urgent emergencies allowance. Enforces balance check.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQuotaModal(false)}
                  disabled={quotaSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={quotaSubmitting}
                >
                  {quotaSubmitting ? 'Saving Quotas...' : 'Save Quotas & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply for Leave Modal (Strictly Sick Leave, Unpaid Leave, Emergency Leave) */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Apply for Leave</h3>
            <form onSubmit={handleApply}>
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select
                  className="form-select"
                  value={formData.leaveType}
                  onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                  required
                >
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Days Requested</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="form-input"
                  required
                  value={formData.totalDays}
                  onChange={e => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Absence</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="State the reason for this leave request..."
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
