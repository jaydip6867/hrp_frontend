import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { KeyRound, ShieldAlert, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

const ForcePasswordChangeModal = () => {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Complexity helpers
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isMatch = newPassword && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && isMatch && currentPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      addToast('Please ensure the new password satisfies all security requirements and matches the confirmation.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/employee/change-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim()
      });

      if (res.success) {
        addToast('Password updated successfully! Welcome to your workstation.', 'success');
        updateUser({ mustChangePassword: false });
      }
    } catch (err) {
      console.error('Password change error:', err);
      addToast(err.message || 'Current temporary password does not match. Please verify.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '32px 28px',
        maxWidth: 520,
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #E2E8F0'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-navy)', marginBottom: 4 }}>
              Action Required: Set New Password
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              You have logged in with a <strong>temporary password</strong> assigned by your Administrator. Corporate security policy requires you to create a secure permanent password before continuing.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Current Temporary Password */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
              Current Temporary Password <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter the temporary password provided by Admin"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
              New Permanent Password <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a strong password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
              Confirm New Password <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              className="form-input"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Password Complexity Checklist */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 20,
            fontSize: 12
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Password Requirements:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <span style={{ color: hasMinLength ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> At least 8 characters
              </span>
              <span style={{ color: hasUpper ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Uppercase letter (A-Z)
              </span>
              <span style={{ color: hasLower ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Lowercase letter (a-z)
              </span>
              <span style={{ color: hasNumber ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Number (0-9)
              </span>
              <span style={{ color: hasSpecial ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Special symbol (!@#$...)
              </span>
              <span style={{ color: isMatch ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Passwords match
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={logout}
              style={{ fontSize: 13 }}
              title="Sign out from this session"
            >
              Sign Out
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !isFormValid}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontWeight: 600,
                opacity: isFormValid ? 1 : 0.6
              }}
            >
              <KeyRound size={16} />
              {submitting ? 'Updating Password...' : 'Save Password & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChangeModal;
