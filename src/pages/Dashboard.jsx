import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Users, UserCheck, UserX, Clock, Calendar,
  CheckCircle2, AlertCircle, TrendingUp, ArrowUpRight, LogOut
} from 'lucide-react';
import AttendanceActionModals from '../components/common/AttendanceActionModals';
import { formatDuration, calculateDurationFromTimestamps } from '../utils/timeUtils';
import { requestLocationPermission } from '../utils/locationUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  // Modals for employee action
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  const role = user?.role || 'Employee';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const location = await requestLocationPermission();
      const res = await api.post('/attendance/check-in', { location });
      addToast(res.message || 'Checked in successfully!', 'success');
      fetchDashboardData();
    } catch (e) {
      addToast(e.message || 'Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const location = await requestLocationPermission();
      const res = await api.post('/attendance/check-out', { location });
      addToast(res.message || 'Checked out successfully!', 'success');
      fetchDashboardData();
    } catch (e) {
      addToast(e.message || 'Check-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockInClick = () => {
    if (stats?.isCheckedIn) {
      addToast('You are already checked in.', 'warning');
      return;
    }
    setShowScheduleModal(true);
  };

  const handleClockOutClick = () => {
    if (!stats?.isCheckedIn) {
      addToast('Please clock in first.', 'warning');
      return;
    }
    setShowClockOutModal(true);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading dashboard statistics...</div>;
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
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
            Welcome back, {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}!
          </h1>
          <p style={{ opacity: 0.85, fontSize: 14 }}>
            Here is your live enterprise operational overview for today ({new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}).
          </p>
        </div>

        {/* Action button on banner: Always display both buttons side by side */}
        {role === 'Employee' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={handleClockInClick}
              disabled={actionLoading}
              title={stats?.isCheckedIn ? "You are already checked in" : "Click to plan schedule and clock in"}
              style={{
                background: '#16A34A',
                color: '#fff',
                border: 'none',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                fontWeight: 600,
                opacity: actionLoading ? 0.7 : (stats?.isCheckedIn ? 0.8 : 1)
              }}
            >
              <CheckCircle2 size={16} />
              Clock In Now
            </button>

            <button
              type="button"
              className="btn"
              onClick={handleClockOutClick}
              disabled={actionLoading}
              title={!stats?.isCheckedIn ? "Please clock in first" : "Click to log daily work activity and clock out"}
              style={{
                background: '#DC2626',
                color: '#fff',
                border: 'none',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                fontWeight: 600,
                opacity: actionLoading ? 0.7 : (!stats?.isCheckedIn ? 0.8 : 1)
              }}
            >
              <Clock size={16} />
              Clock Out
            </button>
          </div>
        )}
      </div>

      {/* ADMIN DASHBOARD METRICS */}
      {role === 'Admin' && (
        <>
          <div className="stats-grid">
            <div 
              className="stat-card"
              onClick={() => navigate('/admin/employees')}
              style={{ cursor: 'pointer' }}
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

            <div 
              className="stat-card"
              onClick={() => navigate(`/admin/attendance?status=Present&date=${todayStr}`)}
              style={{ cursor: 'pointer' }}
              title="Click to view present employees today"
            >
              <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                <UserCheck size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.presentToday || 0}</span>
                <span className="stat-label">Present Today</span>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => navigate(`/admin/attendance?status=Absent&date=${todayStr}`)}
              style={{ cursor: 'pointer' }}
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

            {/* Today Not Checkout */}
            <div 
              className="stat-card"
              onClick={() => navigate(`/admin/attendance?notCheckedOut=true&date=${todayStr}`)}
              style={{ cursor: 'pointer', border: (stats?.todayNotCheckout || 0) > 0 ? '1px solid #FCD34D' : undefined }}
              title="Click to view employees not checked out today"
            >
              <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <LogOut size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.todayNotCheckout || 0}</span>
                <span className="stat-label">Today Not Checkout</span>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => navigate(`/admin/attendance?status=Late Arrival&date=${todayStr}`)}
              style={{ cursor: 'pointer' }}
              title="Click to view late arrivals"
            >
              <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.lateArrivals || 0}</span>
                <span className="stat-label">Late Arrivals</span>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => navigate('/admin/leaves?status=Pending')}
              style={{ cursor: 'pointer' }}
              title="Click to view pending leave requests"
            >
              <div className="stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                <Calendar size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.pendingLeaveRequests || 0}</span>
                <span className="stat-label">Pending Leave Requests</span>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => navigate('/admin/tasks?status=In Progress')}
              style={{ cursor: 'pointer' }}
              title="Click to view active tasks"
            >
              <div className="stat-icon" style={{ background: '#F3E8FF', color: '#9333EA' }}>
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.activeTasks || 0}</span>
                <span className="stat-label">Active Tasks</span>
              </div>
            </div>
          </div>

          {/* Department Breakdown & Monthly Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Department Distribution</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats?.departmentDistribution?.map(dept => (
                  <div key={dept.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: 8 }}>
                    <span style={{ fontWeight: 600 }}>{dept.name}</span>
                    <span className="badge badge-info">{dept.count} Members</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Weekly Attendance Trends</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats?.monthlyAttendance?.map(item => (
                  <div key={item.day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontWeight: 600, width: 40 }}>{item.day}</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: 'var(--success)', fontSize: 13 }}>Present: {item.present}</span>
                      <span style={{ color: 'var(--danger)', fontSize: 13 }}>Absent: {item.absent}</span>
                      <span style={{ color: 'var(--warning)', fontSize: 13 }}>Late: {item.late}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MANAGER DASHBOARD METRICS */}
      {role === 'Manager' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Users size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats?.totalTeamMembers || 0}</span>
              <span className="stat-label">Total Team Members</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <UserCheck size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats?.presentToday || 0}</span>
              <span className="stat-label">Team Present Today</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats?.assignedTasks || 0}</span>
              <span className="stat-label">Assigned Tasks</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats?.pendingLeaveApprovals || 0}</span>
              <span className="stat-label">Pending Leave Approvals</span>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE DASHBOARD METRICS */}
      {role === 'Employee' && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  {stats?.attendanceToday?.checkIn ? new Date(stats.attendanceToday.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Checked In'}
                </span>
                <span className="stat-label">Check-In Time</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.assignedTasksCount || 0}</span>
                <span className="stat-label">My Assigned Tasks</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.workUpdatesTodayCount || 0}</span>
                <span className="stat-label">Work Updates Today</span>
              </div>
            </div>
          </div>

          {/* Assigned Tasks preview */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">My Assigned Active Tasks</h3>
            </div>
            {stats?.tasks?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: 12 }}>No pending tasks assigned right now.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.tasks?.map(task => (
                      <tr key={task._id}>
                        <td><strong>{task.taskId}</strong></td>
                        <td>{task.title}</td>
                        <td>
                          <span className={`badge ${task.priority === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td>{task.dueDate}</td>
                        <td>
                          <span className="badge badge-info">{task.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shared Attendance Modals for Employee */}
      {role === 'Employee' && (
        <AttendanceActionModals
          showScheduleModal={showScheduleModal}
          onCloseScheduleModal={() => setShowScheduleModal(false)}
          showClockOutModal={showClockOutModal}
          onCloseClockOutModal={() => setShowClockOutModal(false)}
          user={user}
          checkInTime={stats?.activeSession?.checkIn || stats?.attendanceToday?.checkIn}
          attendanceId={stats?.activeSession?._id || stats?.attendanceToday?._id}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default Dashboard;
