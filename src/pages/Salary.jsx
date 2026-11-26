import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { DollarSign, Plus, CheckCircle } from 'lucide-react';

const Salary = () => {
  const { addToast } = useToast();
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    employee: '',
    month: '2026-11',
    basicSalary: 6000,
    allowances: 1000,
    overtimePay: 200,
    deductions: 250,
    paymentStatus: 'Paid',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: 'Monthly salary disbursement'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salRes, empRes] = await Promise.all([
        api.get('/salary'),
        api.get('/employees')
      ]);
      if (salRes.success) setSalaries(salRes.data);
      if (empRes.success) setEmployees(empRes.data);
    } catch (e) {
      addToast('Failed to load salary payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const selectedEmp = employees.find(emp => emp._id === formData.employee);
      const netSalary = formData.basicSalary + formData.allowances + formData.overtimePay - formData.deductions;

      await api.post('/salary', {
        ...formData,
        netSalary,
        employeeName: selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : ''
      });
      addToast('Salary voucher generated and recorded', 'success');
      setShowModal(false);
      fetchData();
    } catch (e) {
      addToast('Failed to generate salary voucher', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Salary & Compensation Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Confidential payroll, allowances, overtime pay and monthly disbursements</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Process Payroll Voucher
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Month</th>
              <th>Basic Salary</th>
              <th>Allowances</th>
              <th>Overtime</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Disbursement Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>Loading payroll records...</td></tr>
            ) : salaries.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>No payroll records yet.</td></tr>
            ) : (
              salaries.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.employeeName || 'Staff Member'}</strong></td>
                  <td>{s.month}</td>
                  <td>${s.basicSalary}</td>
                  <td>${s.allowances}</td>
                  <td>${s.overtimePay}</td>
                  <td style={{ color: 'var(--danger)' }}>-${s.deductions}</td>
                  <td><strong style={{ color: 'var(--success)' }}>${s.netSalary}</strong></td>
                  <td><span className="badge badge-success">{s.paymentStatus}</span></td>
                  <td>{s.paymentDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Process Employee Salary</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select 
                  className="form-select"
                  value={formData.employee}
                  onChange={e => setFormData({ ...formData, employee: e.target.value })}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Pay Month</label>
                  <input 
                    type="month" 
                    className="form-input" 
                    value={formData.month} 
                    onChange={e => setFormData({ ...formData, month: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Basic Salary ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.basicSalary} 
                    onChange={e => setFormData({ ...formData, basicSalary: Number(e.target.value) })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Allowances ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.allowances} 
                    onChange={e => setFormData({ ...formData, allowances: Number(e.target.value) })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deductions ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.deductions} 
                    onChange={e => setFormData({ ...formData, deductions: Number(e.target.value) })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;
