import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Building, Plus, Trash2, Edit } from 'lucide-react';

const Departments = () => {
  const { addToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerName, setManagerName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, desRes] = await Promise.all([
        api.get('/departments'),
        api.get('/designations')
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (desRes.success) setDesignations(desRes.data);
    } catch (e) {
      addToast('Failed to load department data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', { name, description, managerName });
      addToast('Department created successfully', 'success');
      setShowModal(false);
      setName('');
      setDescription('');
      loadData();
    } catch (e) {
      addToast('Failed to create department', 'error');
    }
  };

  return (
    <div>
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Departments & Designations</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Corporate hierarchy, organizational structure and teams</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 30 }}>
        {departments.map(d => (
          <div key={d._id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ padding: 10, background: '#EFF6FF', color: '#2563EB', borderRadius: 8 }}>
                <Building size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary-navy)' }}>{d.name}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lead: {d.managerName || 'Pending Assignment'}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.description}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Corporate Designations & Roles</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Designation Title</th>
                <th>Department</th>
                <th>Role Scope Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {designations.map(des => (
                <tr key={des._id}>
                  <td><strong>{des.title}</strong></td>
                  <td>{des.departmentName}</td>
                  <td>{des.description}</td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create New Department</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manager / Lead Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={managerName} 
                  onChange={e => setManagerName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department Scope Description</label>
                <textarea 
                  className="form-textarea" 
                  rows="3"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
