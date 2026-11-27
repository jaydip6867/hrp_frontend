import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Calendar, Users, Plus, Video } from 'lucide-react';

const Meetings = () => {
  const { addToast } = useToast();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetingDate: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    location: 'Conference Room 3A',
    meetingLink: 'https://meet.google.com/ems-sprint'
  });

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meetings');
      if (res.success) setMeetings(res.data);
    } catch (e) {
      addToast('Failed to load meetings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/meetings', { ...formData, organizer: 'Alexander Wright', participants: ['Team'] });
      addToast('Meeting scheduled successfully', 'success');
      setShowModal(false);
      fetchMeetings();
    } catch (e) {
      addToast('Meeting scheduling failed', 'error');
    }
  };

  return (
    <div>
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Meeting Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Schedule, join video conferences, and track sprint alignment calls</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {meetings.map(m => (
          <div key={m._id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="badge badge-info">{m.status}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.meetingDate}</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--primary-navy)' }}>{m.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{m.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              <div>⏰ <strong>{m.startTime} - {m.endTime}</strong></div>
              <div>📍 {m.location}</div>
            </div>
            {m.meetingLink && (
              <a href={m.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                <Video size={14} /> Join Video Conference
              </a>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Schedule Team Meeting</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Meeting Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
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
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.startTime} 
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.endTime} 
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Room</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.location} 
                  onChange={e => setFormData({ ...formData, location: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
