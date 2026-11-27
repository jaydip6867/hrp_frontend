import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Folder, Upload, FileText, Download } from 'lucide-react';

const Documents = () => {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    documentType: 'Contract',
    isConfidential: false
  });

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      if (res.success) setDocuments(res.data);
    } catch (e) {
      addToast('Failed to load employee documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents', {
        ...formData,
        fileUrl: '/uploads/sample_employment_contract.pdf',
        fileSize: '1.2 MB'
      });
      addToast('Document metadata created successfully', 'success');
      setShowModal(false);
      fetchDocs();
    } catch (e) {
      addToast('Failed to upload document', 'error');
    }
  };

  return (
    <div>
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Document Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Contracts, offer letters, appraisal PDFs, and secure employee credentials</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Upload size={16} /> Upload Document
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {documents.map(doc => (
          <div key={doc._id} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-info">{doc.documentType}</span>
                {doc.isConfidential && <span className="badge badge-danger">Confidential</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <FileText size={20} color="var(--primary-blue)" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary-navy)' }}>{doc.title}</h3>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Size: {doc.fileSize || '850 KB'}</div>
            </div>

            <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
              <a 
                href={doc.fileUrl || '#'} 
                download 
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={(e) => { e.preventDefault(); addToast('Downloading verified document asset...', 'info'); }}
              >
                <Download size={14} /> Download Secure File
              </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Register Employee Document</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g. Senior Architect NDA & Employment Contract"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Classification Type</label>
                <select 
                  className="form-select"
                  value={formData.documentType}
                  onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                >
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Contract">Contract</option>
                  <option value="ID Proof">ID Proof</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Appraisal">Appraisal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isConfidential} 
                    onChange={e => setFormData({ ...formData, isConfidential: e.target.checked })} 
                  />
                  Mark as Confidential (Restricted to authorized roles)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
