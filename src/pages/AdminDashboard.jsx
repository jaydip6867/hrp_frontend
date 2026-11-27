import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Users, UserCheck, UserX, Clock, Calendar, 
  CheckCircle2, AlertCircle, TrendingUp, ShieldCheck, LogOut, ArrowRight
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load admin statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading executive dashboard...</div>;
  }

  return (
    <div>
      {/* Executive Welcome Banner */}
      <div className="welcome-banner" style={{
        background: 'linear-gradient(135deg, #172B4D 0%, #2563EB 100%)',
        borderRadius: 'var(--radius-md)',
        padding: '24px 28px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Executive Admin Control Center
          </h1>
          <p style={{ opacity: 0.9, fontSize: 14 }}>
            System overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Full governance over employees, attendance, tasks and leaves.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: 8 }}>
          <ShieldCheck size={20} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Enterprise Admin</span>
        </div>
      </div>

      {/* 12 Clickable Operational Statistics Grid */}
      <div className="stats-grid">
        {/* 1. Total Employees */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/admin/employees')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view all employees"
        >
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalEmployees || 0}</span>
            <span className="stat-label">Total Employees</span>
          </div>
        </div>

        {/* 2. Active Employees */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/admin/employees?status=Active')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view active workforce"
        >
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.activeEmployees || 0}</span>
            <span className="stat-label">Active Employees</span>
          </div>
        </div>

        {/* 3. Inactive Employees */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/admin/employees?status=Inactive')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view inactive/suspended employees"
        >
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <UserX size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.inactiveEmployees || 0}</span>
            <span className="stat-label">Inactive Employees</span>
          </div>
        </div>

        {/* 4. Present Today */}
        <div 
          className="stat-card" 
          onClick={() => navigate(`/admin/attendance?status=Present&date=${todayStr}`)}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view present employees today"
        >
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.presentToday || 0}</span>
            <span className="stat-label">Present Today</span>
          </div>
        </div>

        {/* 5. Absent Today */}
        <div 
          className="stat-card" 
          onClick={() => navigate(`/admin/attendance?status=Absent&date=${todayStr}`)}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view absent employees today"
        >
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <UserX size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.absentToday || 0}</span>
            <span className="stat-label">Absent Today</span>
          </div>
        </div>

        {/* 6. Today Not Checkout (NEW WIDGET) */}
        <div 
          className="stat-card" 
          onClick={() => navigate(`/admin/attendance?notCheckedOut=true&date=${todayStr}`)}
          style={{ 
            cursor: 'pointer', 
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            border: (stats?.todayNotCheckout || 0) > 0 ? '1px solid #FCD34D' : undefined
          }}
          title="Click to view employees who checked in today but have not checked out yet"
        >
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <LogOut size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.todayNotCheckout || 0}</span>
            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Today Not Checkout
            </span>
          </div>
        </div>

        {/* 7. Employees on Leave */}
        <div 
          className="stat-card" 
          onClick={() => navigate(`/admin/leaves?status=Approved&date=${todayStr}`)}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view employees on approved leave today"
        >
          <div className="stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.employeesOnLeave || 0}</span>
            <span className="stat-label">Employees on Leave</span>
          </div>
        </div>

        {/* 8. Late Arrivals */}
        <div 
          className="stat-card" 
          onClick={() => navigate(`/admin/attendance?status=Late Arrival&date=${todayStr}`)}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view late arrivals today"
        >
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.lateArrivals || 0}</span>
            <span className="stat-label">Late Arrivals</span>
          </div>
        </div>

        {/* 9. Pending Leave Requests */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/admin/leaves?status=Pending')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view pending leave requests"
        >
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.pendingLeaveRequests || 0}</span>
            <span className="stat-label">Pending Leave Requests</span>
          </div>
        </div>

        {/* 10. Active Tasks */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/admin/tasks?status=In Progress')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view active ongoing tasks"
        >
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.activeTasks || 0}</span>
            <span className="stat-label">Active Tasks</span>
          </div>
        </div>

        {/* 11. Completed Tasks */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/admin/tasks?status=Approved / Completed')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view completed tasks"
        >
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.completedTasks || 0}</span>
            <span className="stat-label">Completed Tasks</span>
          </div>
        </div>

        {/* 12. Pending Tasks */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/admin/tasks?status=To Do')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          title="Click to view pending backlog tasks"
        >
          <div className="stat-icon" style={{ background: '#F1F5F9', color: '#64748B' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.pendingTasks || 0}</span>
            <span className="stat-label">Pending Tasks</span>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Department-wise Employees</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats?.departmentDistribution?.map(dept => (
              <div key={dept.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>{dept.name}</span>
                <span className="badge badge-info">{dept.count} Employees</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Attendance Flow</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats?.monthlyAttendance?.map(item => (
              <div key={item.day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 600, width: 45 }}>{item.day}</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>Present: {item.present}</span>
                  <span style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 500 }}>Absent: {item.absent}</span>
                  <span style={{ color: 'var(--warning)', fontSize: 13, fontWeight: 500 }}>Late: {item.late}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
