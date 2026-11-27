import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Download, Filter, RotateCcw } from 'lucide-react';

const Reports = () => {
  const { addToast } = useToast();
  const [reportType, setReportType] = useState('attendance');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  const fetchReport = async (customParams = {}) => {
    setLoading(true);
    try {
      const params = {};
      const from = customParams.fromDate !== undefined ? customParams.fromDate : appliedFromDate;
      const to = customParams.toDate !== undefined ? customParams.toDate : appliedToDate;

      if (from) params.fromDate = from;
      if (to) params.toDate = to;

      let res;
      if (reportType === 'attendance') res = await api.get('/attendance', params);
      else if (reportType === 'tasks') res = await api.get('/tasks', params);
      else if (reportType === 'leaves') res = await api.get('/leaves', params);
      else if (reportType === 'work-counts') res = await api.get('/work-counts', params);
      else res = await api.get('/employees', params);

      if (res.success) {
        setData(res.data);
      }
    } catch (e) {
      addToast(e.message || 'Error fetching report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleApplyFilter = () => {
    if (fromDate && toDate && toDate < fromDate) {
      addToast('To Date must not be earlier than From Date', 'error');
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    fetchReport({ fromDate, toDate });
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    fetchReport({ fromDate: '', toDate: '' });
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      addToast('No data available to export', 'warning');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(v => typeof v === 'object' ? JSON.stringify(v) : `"${v}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EMS_${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV export downloaded successfully', 'success');
  };

  return (
    <div>
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Reports & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Enterprise auditing, executive attendance, performance data, and CSV/Excel exports</p>
        </div>

        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={16} /> Export to CSV
        </button>
      </div>

      {/* Domain Selection & Date Range Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Select Report Domain
            </label>
            <select 
              className="form-select"
              style={{ width: 220 }}
              value={reportType}
              onChange={e => {
                setReportType(e.target.value);
              }}
            >
              <option value="attendance">Attendance & Working Hours</option>
              <option value="tasks">Tasks & Sprints</option>
              <option value="leaves">Leave Management & Balances</option>
              <option value="work-counts">Work Output & Targets</option>
              <option value="employees">Employee Headcount & Profiles</option>
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
          {(fromDate || toDate || appliedFromDate || appliedToDate) && (
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
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
          {reportType.toUpperCase()} DATASET PREVIEW ({data.length} records found {appliedFromDate || appliedToDate ? 'for selected range' : ''})
        </div>
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {data.length > 0 && Object.keys(data[0]).slice(0, 7).map(key => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24 }}>Generating report query...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24 }}>No records found {appliedFromDate || appliedToDate ? 'matching the selected date range.' : ''}</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr key={row._id || i}>
                    {Object.values(row).slice(0, 7).map((val, idx) => (
                      <td key={idx}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
