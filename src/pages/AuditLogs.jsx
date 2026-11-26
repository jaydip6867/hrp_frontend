import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, UserCheck, Activity, Filter, RotateCcw, Search } from 'lucide-react';

const AuditLogs = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async (customParams = {}) => {
    try {
      setLoading(true);
      const params = {};
      const from = customParams.fromDate !== undefined ? customParams.fromDate : appliedFromDate;
      const to = customParams.toDate !== undefined ? customParams.toDate : appliedToDate;

      if (from) params.fromDate = from;
      if (to) params.toDate = to;

      const res = await api.get('/audit-logs', params);
      if (res.success) setLogs(res.data);
    } catch (e) {
      addToast(e.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleApplyFilter = () => {
    if (fromDate && toDate && toDate < fromDate) {
      addToast('To Date must not be earlier than From Date', 'error');
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    fetchLogs({ fromDate, toDate });
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setSearch('');
    fetchLogs({ fromDate: '', toDate: '' });
  };

  const displayedLogs = logs.filter(log => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const action = (log.action || '').toLowerCase();
    const user = (log.performedBy || '').toLowerCase();
    const mod = (log.module || '').toLowerCase();
    const details = (log.details || '').toLowerCase();
    return action.includes(q) || user.includes(q) || mod.includes(q) || details.includes(q);
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Security & System Audit Logs</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Immutable record of administrator decisions, authentication events and data adjustments</p>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          {/* Quick Search */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Search Audit Trail
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Search action, user, module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
          {(fromDate || toDate || appliedFromDate || appliedToDate || search) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
            >
              <RotateCcw size={14} /> Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Performed By</th>
              <th>Role</th>
              <th>Module</th>
              <th>Event Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}>Loading security trail...</td></tr>
            ) : displayedLogs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}>No audit records found {appliedFromDate || appliedToDate ? 'matching the selected date range.' : ''}</td></tr>
            ) : (
              displayedLogs.map(log => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td><span className="badge badge-info">{log.action}</span></td>
                  <td><strong>{log.performedBy}</strong></td>
                  <td><span className="badge badge-neutral">{log.role || 'Admin'}</span></td>
                  <td>{log.module}</td>
                  <td>{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
