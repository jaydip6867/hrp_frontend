import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Target, CheckCircle, Award, RotateCcw, Search, Filter } from 'lucide-react';
import EmployeeSelectFilter from '../components/common/EmployeeSelectFilter';

const WorkCount = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [counts, setCounts] = useState([]);
  const [categories, setCategories] = useState([]);
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
    category: '',
    target: 10,
    actualCompleted: 8,
    description: '',
    date: new Date().toISOString().split('T')[0]
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

      const [countRes, catRes, empRes] = await Promise.all([
        api.get('/work-counts', params),
        api.get('/work-categories'),
        isAdmin ? api.get('/employees') : Promise.resolve({ success: true, data: [] })
      ]);
      if (countRes.success) setCounts(countRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
      if (catRes.success) {
        setCategories(catRes.data);
        if (catRes.data.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            category: catRes.data[0].name,
            target: catRes.data[0].defaultDailyTarget || 10
          }));
        }
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load work counts', 'error');
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
      await api.post('/work-counts', formData);
      addToast('Work count metrics logged successfully', 'success');
      setShowModal(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Submission failed', 'error');
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/work-counts/${id}/verify`, { status });
      addToast(`Work output verified`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Verification failed', 'error');
    }
  };

  // Filter display dynamically
  const displayedCounts = counts.filter(c => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const emp = (c.employeeName || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      if (!emp.includes(q) && !cat.includes(q) && !desc.includes(q)) return false;
    }
    return true;
  });

  // Dynamic recalculation of totals and summary metrics based on filtered records
  const totalTarget = displayedCounts.reduce((sum, c) => sum + (Number(c.target) || 0), 0);
  const totalCompleted = displayedCounts.reduce((sum, c) => sum + (Number(c.actualCompleted) || 0), 0);
  const averageAchievement = totalTarget > 0 
    ? parseFloat(((totalCompleted / totalTarget) * 100).toFixed(1)) 
    : (totalCompleted > 0 ? 100 : 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Work Count Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isAdmin 
              ? 'Standardized departmental KPI targets, employee output quotas, and achievement verifications'
              : 'Log your daily activity units and track your performance target percentages'}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Log Work Count
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
              Search Outputs
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={isAdmin ? "Search category, description, employee..." : "Search category, description..."}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Recalculated Summary Totals Grid */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{displayedCounts.length}</span>
            <span className="stat-label">Total Logged Records</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{totalTarget}</span>
            <span className="stat-label">Total Target Units</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value" style={{ color: '#16A34A' }}>{totalCompleted}</span>
            <span className="stat-label">Total Actual Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value" style={{ color: averageAchievement >= 100 ? '#16A34A' : averageAchievement >= 70 ? '#2563EB' : '#D97706' }}>
              {averageAchievement}%
            </span>
            <span className="stat-label">Overall Achievement Rate</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Category</th>
              <th>Target</th>
              <th>Actual</th>
              <th>Achievement</th>
              <th>Description</th>
              <th>Status</th>
              {role === 'Admin' && <th>Admin Verification</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>Loading work counts...</td></tr>
            ) : displayedCounts.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>No work count records found {appliedFromDate || appliedToDate ? 'matching the selected date range.' : 'matching criteria.'}</td></tr>
            ) : (
              displayedCounts.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.employeeName || 'Unknown Employee'}</strong></td>
                  <td>{c.date}</td>
                  <td><span className="badge badge-info">{c.category}</span></td>
                  <td><strong>{c.target}</strong></td>
                  <td><strong>{c.actualCompleted}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${c.achievementPercentage >= 100 ? 'badge-success' : c.achievementPercentage >= 70 ? 'badge-info' : 'badge-warning'}`}>
                        {c.achievementPercentage}%
                      </span>
                    </div>
                  </td>
                  <td>{c.description || '—'}</td>
                  <td>
                    <span className={`badge ${c.verificationStatus === 'Verified' ? 'badge-success' : 'badge-warning'}`}>
                      {c.verificationStatus}
                    </span>
                  </td>
                  {role === 'Admin' && (
                    <td>
                      {c.verificationStatus === 'Pending' ? (
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--success)' }}
                          onClick={() => handleVerify(c._id, 'Verified')}
                        >
                          <CheckCircle size={14} /> Verify
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Verified</span>
                      )}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Log Daily Work Output</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name} (Unit: {cat.unit})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Assigned Target</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Actual Units Completed</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={formData.actualCompleted}
                    onChange={e => setFormData({ ...formData, actualCompleted: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Optional deliverables details or batch references..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Output Metrics</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkCount;
