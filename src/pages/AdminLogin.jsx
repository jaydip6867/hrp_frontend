import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, User } from 'lucide-react';

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await adminLogin(identifier, password);
      addToast(`Welcome, Administrator!`, 'success');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      addToast(err.message || 'Invalid Admin Credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #172B4D 0%, #0F172A 100%)',
      padding: 20
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '40px 36px',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #172B4D, #2563EB)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: 16
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#172B4D', marginBottom: 6 }}>
            Admin Portal Login
          </h2>
          <p style={{ color: '#64748B', fontSize: 13 }}>
            Executive Workforce Management & System Governance
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 38 }}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or admin@ems.com"
                required
              />
              <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 12, background: '#172B4D' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: 13, color: '#64748B' }}>
          Are you an employee?{' '}
          <Link to="/employee/login" style={{ color: '#2563EB', fontWeight: 600 }}>
            Employee Login
          </Link>
          <span style={{ margin: '0 8px' }}>•</span>
          <Link to="/employee/register" style={{ color: '#2563EB', fontWeight: 600 }}>
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
