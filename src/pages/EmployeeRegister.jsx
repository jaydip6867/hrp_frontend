import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff, BadgeAlert, ArrowRight, RotateCcw } from 'lucide-react';

const EmployeeRegister = () => {
  const navigate = useNavigate();
  const { employeeRegister } = useAuth();
  const { addToast } = useToast();

  const initialForm = {
    firstName: '',
    lastName: '',
    employeeCode: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    designation: 'Employee' // Default options: 'Intern' or 'Employee'
  };

  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errorMsg) setErrorMsg('');
  };

  const handleReset = () => {
    setFormData(initialForm);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Frontend validations
    const cleanPhone = formData.phone.replace(/[\s\-()]/g, '');
    if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setErrorMsg('Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character');
      return;
    }

    setLoading(true);
    try {
      const res = await employeeRegister(formData);
      if (res.success) {
        addToast('Registration successful! Please login with your Username and Password.', 'success', 5000);
        navigate('/employee/login');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
      addToast(err.message || 'Registration failed', 'error');
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
      padding: '30px 20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '36px 32px',
        maxWidth: 580,
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: 12
          }}>
            <UserPlus size={28} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#172B4D', marginBottom: 4 }}>
            Employee Self-Registration
          </h2>
          <p style={{ color: '#64748B', fontSize: 13 }}>
            Join the company portal. Once registered, your profile is immediately active.
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <BadgeAlert size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 1 & 2. First Name & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                placeholder="e.g. John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                placeholder="e.g. Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* 3 & 4. Employee Code & Phone Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Employee Code * (Unique)</label>
              <input
                type="text"
                name="employeeCode"
                className="form-input"
                placeholder="e.g. EMP-202"
                value={formData.employeeCode}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number * (10 Digits)</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* 5. Email */}
          <div className="form-group">
            <label className="form-label">Email Address * (Unique)</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="e.g. john.doe@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* 6. Username */}
          <div className="form-group">
            <label className="form-label">Username * (Unique, for login)</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="e.g. john_doe"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          {/* 7. Password */}
          <div className="form-group">
            <label className="form-label">Password * (Min 8 chars, Aa, 12, #)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Strong password (e.g. Secret@123)"
                value={formData.password}
                onChange={handleChange}
                style={{ paddingRight: 40 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* 8. Designation Dropdown (Intern or Employee) */}
          <div className="form-group">
            <label className="form-label">Designation *</label>
            <select
              name="designation"
              className="form-select"
              value={formData.designation}
              onChange={handleChange}
              required
            >
              <option value="Intern">Intern</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          {/* Registration Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ flex: 1 }}
              disabled={loading}
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Employee'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Link to Employee Login page */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: 13, color: '#64748B' }}>
          Already have an employee account?{' '}
          <Link to="/employee/login" style={{ color: '#2563EB', fontWeight: 600 }}>
            Employee Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegister;
