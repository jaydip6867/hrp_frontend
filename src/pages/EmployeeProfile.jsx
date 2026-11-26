import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Phone, MapPin, Calendar, Shield, Save, KeyRound, Eye, EyeOff } from 'lucide-react';

const EmployeeProfile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        if (user?.employeeId) {
          const res = await api.get(`/employees/${user.employeeId}`);
          if (res.success && res.data) {
            setProfile(res.data);
            setFormData({
              phone: res.data.phone || '',
              address: res.data.address || '',
              emergencyContact: res.data.emergencyContact || { name: '', relationship: '', phone: '' }
            });
          }
        }
      } catch (e) {
        addToast('Failed to load profile details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${user.employeeId}`, formData);
      addToast('Personal profile information updated successfully', 'success');
      setEditing(false);
    } catch (e) {
      addToast(e.message || 'Profile update failed', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }

    setPassSubmitting(true);
    try {
      const res = await api.post('/auth/employee/change-password', {
        currentPassword,
        newPassword
      });
      if (res.success) {
        addToast(res.message || 'Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Password change failed. Check your current password.', 'error');
    } finally {
      setPassSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading your profile...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>My Personal Profile</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>View your registered employment information and update contact details</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Profile Identity Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <img
            src={profile?.profilePhoto || `https://ui-avatars.com/api/?name=${profile?.firstName}+${profile?.lastName}&background=2563EB&color=fff&size=120`}
            alt="Profile Avatar"
            style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 16px', objectFit: 'cover' }}
          />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-navy)' }}>
            {profile?.firstName} {profile?.lastName}
          </h3>
          <div style={{ color: 'var(--primary-blue)', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            {profile?.designation}
          </div>
          <span className={`badge ${profile?.employeeStatus === 'Active' ? 'badge-success' : 'badge-danger'}`}>
            {profile?.employeeStatus}
          </span>

          <div style={{ marginTop: 24, textAlign: 'left', borderTop: '1px solid var(--border-light)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div><strong>Code:</strong> {profile?.employeeCode}</div>
            <div><strong>Username:</strong> {profile?.username || user?.username}</div>
            <div><strong>Department:</strong> {profile?.departmentName || 'General'}</div>
            <div><strong>Location:</strong> {profile?.workLocation || 'Headquarters'}</div>
            <div><strong>Joining Date:</strong> {profile?.joiningDate?.split('T')[0] || '—'}</div>
          </div>
        </div>

        {/* Profile Details & Change Password Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Contact Details Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title">Contact & Personal Details</h3>
              {!editing && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                  Edit Contact Info
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Email Address (Registered)</label>
                  <input type="text" className="form-input" value={profile?.email || ''} disabled style={{ background: '#F8FAFC' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editing}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editing}
                  placeholder="Enter your current address"
                />
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 12 }}>Emergency Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.emergencyContact.name}
                    onChange={e => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.emergencyContact.relationship}
                    onChange={e => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.emergencyContact.phone}
                    onChange={e => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })}
                    disabled={!editing}
                  />
                </div>
              </div>

              {editing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} color="var(--primary-blue)" />
                <h3 className="card-title">Change Account Password</h3>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Update your account credentials. You must provide your current password to set a new password.
            </p>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">New Password * (Min 8 chars, Aa, 12, #)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className="form-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      required
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passSubmitting}
                >
                  <KeyRound size={16} /> {passSubmitting ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
