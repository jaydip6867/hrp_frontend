import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Settings, Save, Building } from 'lucide-react';

const CompanySettings = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    address: '',
    timezone: 'UTC+05:30',
    currency: 'USD ($)',
    workHoursPerDay: 8.5,
    gracePeriodMinutes: 15
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch (e) {
        addToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      addToast('Company settings successfully updated', 'success');
    } catch (e) {
      addToast('Failed to update company settings', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading configuration parameters...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Company Settings & Policies</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Enterprise brand configuration, timezone, work shifts and financial parameters</p>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={settings.companyName || ''} 
              onChange={e => setSettings({ ...settings, companyName: e.target.value })} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Corporate Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={settings.companyEmail || ''} 
                onChange={e => setSettings({ ...settings, companyEmail: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Support Phone</label>
              <input 
                type="text" 
                className="form-input" 
                value={settings.companyPhone || ''} 
                onChange={e => setSettings({ ...settings, companyPhone: e.target.value })} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Headquarters Address</label>
            <input 
              type="text" 
              className="form-input" 
              value={settings.address || ''} 
              onChange={e => setSettings({ ...settings, address: e.target.value })} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Default Shift Work Hours</label>
              <input 
                type="number" 
                step="0.5" 
                className="form-input" 
                value={settings.workHoursPerDay || 8.5} 
                onChange={e => setSettings({ ...settings, workHoursPerDay: Number(e.target.value) })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Grace Period (Minutes)</label>
              <input 
                type="number" 
                className="form-input" 
                value={settings.gracePeriodMinutes || 15} 
                onChange={e => setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })} 
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">System Timezone</label>
              <input 
                type="text" 
                className="form-input" 
                value={settings.timezone || 'UTC+05:30'} 
                onChange={e => setSettings({ ...settings, timezone: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Operational Currency</label>
              <input 
                type="text" 
                className="form-input" 
                value={settings.currency || 'USD ($)'} 
                onChange={e => setSettings({ ...settings, currency: e.target.value })} 
                required 
              />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save System Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettings;
