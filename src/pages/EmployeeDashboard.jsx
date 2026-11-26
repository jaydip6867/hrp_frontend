import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Target,
  ArrowRight,
  FileText,
  Hourglass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AttendanceActionModals from '../components/common/AttendanceActionModals';
import { requestLocationPermission } from '../utils/locationUtils';
import { formatDuration, calculateDurationFromTimestamps } from '../utils/timeUtils';

const ALLOWED_LEAVE_TYPES = ['Sick Leave', 'Unpaid Leave', 'Emergency Leave'];

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  const employeeFullName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : (user?.username || 'Authenticated Employee');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load employee metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const location = await requestLocationPermission();
      const res = await api.post('/attendance/check-in', { location });
      addToast(res.message || 'Checked in successfully!', 'success');
      await fetchStats();
    } catch (e) {
      addToast(e.message || 'Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockInClick = () => {
    if (isCheckedIn) {
      addToast('You are already checked in.', 'warning');
      return;
    }
    setShowScheduleModal(true);
  };

  const handleClockOutClick = () => {
    if (!isCheckedIn) {
      addToast('Please clock in first.', 'warning');
      return;
    }
    setShowClockOutModal(true);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your dashboard...</div>;
  }

  // Active attendance session determination
  const isCheckedIn = stats?.isCheckedIn !== undefined
    ? stats.isCheckedIn
    : (!!stats?.activeSession || (!!stats?.todayAttendance?.checkIn && !stats?.todayAttendance?.checkOut));

  // Current session duration
  const activeCheckIn = stats?.activeSession?.checkIn || (isCheckedIn ? stats?.todayAttendance?.checkIn : null);
  const workingDuration = activeCheckIn
    ? calculateDurationFromTimestamps(
      activeCheckIn,
      new Date().toISOString(),
      formatDuration(stats?.todayAttendance?.workingHours)
    )
    : (stats?.todayAttendance?.workingHours ? formatDuration(stats.todayAttendance.workingHours) : '0 min');

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
        boxShadow: 'var(--shadow-md)',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Welcome, {employeeFullName}!
          </h1>
          <p style={{ opacity: 0.9, fontSize: 14 }}>
            Designation: <strong>{user?.employee?.designation || 'Employee'}</strong> • Code: <strong>{user?.employee?.employeeCode || 'N/A'}</strong>
          </p>
        </div>

        {/* Attendance Action Buttons: Always display both buttons side by side */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={handleClockInClick}
            disabled={actionLoading}
            title={isCheckedIn ? "You are already checked in" : "Click to plan schedule and clock in"}
            style={{
              background: '#16A34A',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              opacity: actionLoading ? 0.7 : (isCheckedIn ? 0.8 : 1),
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
            title={!isCheckedIn ? "Please clock in first" : "Click to log daily work activity and clock out"}
            style={{
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              opacity: actionLoading ? 0.7 : (!isCheckedIn ? 0.8 : 1),
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <Clock size={16} />
            Clock Out
          </button>
        </div>
      </div>

      {/* Employee Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {activeCheckIn
                ? new Date(activeCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : (stats?.todayAttendance?.checkIn ? new Date(stats.todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Clocked In')}
            </span>
            <span className="stat-label">Check-In Time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {isCheckedIn
                ? 'In Progress'
                : (stats?.todayAttendance?.checkOut ? new Date(stats.todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—')}
            </span>
            <span className="stat-label">Check-Out Time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Hourglass size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{workingDuration}</span>
            <span className="stat-label">Working Hours {isCheckedIn ? '(Active Session)' : 'Today'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
            <Target size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.dailyWorkUpdatesCount || 0}</span>
            <span className="stat-label">Daily Updates Today</span>
          </div>
        </div>
      </div>

      {/* Monthly / Working Hours Calculation Summary */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
              Working Hours Summary ({stats?.workingHoursSummary?.period || 'Current Month'})
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, margin: 0 }}>
              Calculated from completed working sessions for your profile
            </p>
          </div>
          <Link to="/employee/attendance" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} /> View Attendance Log <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {/* Total Working Days */}
          <div style={{
            padding: '16px 18px',
            background: '#F8FAFC',
            borderRadius: 8,
            borderLeft: '4px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Working Days
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 2 }}>
                {stats?.workingHoursSummary?.totalWorkingDays ?? 0} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Days</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Completed working days
              </div>
            </div>
          </div>

          {/* Total Working Hours */}
          <div style={{
            padding: '16px 18px',
            background: '#F8FAFC',
            borderRadius: 8,
            borderLeft: '4px solid #16A34A',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Working Hours
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A', marginTop: 2 }}>
                {stats?.workingHoursSummary?.formattedDuration || `${stats?.workingHoursSummary?.totalWorkingHours ?? 0} hrs`}
                {stats?.workingHoursSummary?.totalMinutes > 0 && stats?.workingHoursSummary?.formattedDuration && (
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 6 }}>
                    ({stats?.workingHoursSummary?.totalWorkingHours} hrs)
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Total completed working hours
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Action Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #16A34A' }}>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary-navy)', marginBottom: 4 }}>Daily Schedule Planner</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {isCheckedIn ? 'Checked in today. Plan today\'s agenda & tasks.' : 'Clock in first to begin your working day.'}
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowScheduleModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Calendar size={14} /> Create Schedule
          </button>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #2563EB' }}>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary-navy)', marginBottom: 4 }}>Work Updates & Logs</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {stats?.dailyWorkUpdatesCount > 0 ? `${stats.dailyWorkUpdatesCount} work update(s) recorded today.` : 'Log your deliverables upon clock out.'}
            </p>
          </div>
          <Link to="/employee/work-updates" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} /> View Work Logs
          </Link>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">My Current Sprint Tasks</h3>
          <Link to="/employee/tasks" className="btn btn-secondary btn-sm">
            View All Tasks <ArrowRight size={14} />
          </Link>
        </div>
        {stats?.tasks?.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: 16 }}>No sprint tasks currently assigned.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task Title</th>
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
                      <span className={`badge ${task.priority === 'High' || task.priority === 'Urgent' ? 'badge-danger' : 'badge-warning'}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>{task.dueDate || '—'}</td>
                    <td><span className="badge badge-info">{task.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Balance Quotas: Exclusively Sick Leave, Unpaid Leave, Emergency Leave */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 className="card-title">My Annual Leave Quotas</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Dynamic annual quotas & available balances synchronized with administrative policies
            </p>
          </div>
          <Link to="/employee/leaves" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Apply for Leave <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {(stats?.leaveBalance || [])
            .filter(b => ALLOWED_LEAVE_TYPES.includes(b.leaveType))
            .map(b => {
              const isSick = b.leaveType === 'Sick Leave';
              const isUnpaid = b.leaveType === 'Unpaid Leave';
              const isEmergency = b.leaveType === 'Emergency Leave';

              const accentColor = isSick ? '#2563EB' : isUnpaid ? '#D97706' : '#DC2626';
              const badgeBg = isSick ? '#EFF6FF' : isUnpaid ? '#FEF3C7' : '#FEE2E2';

              return (
                <div
                  key={b.leaveType}
                  style={{
                    padding: '18px 20px',
                    background: '#FFFFFF',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    borderTop: `4px solid ${accentColor}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-navy)' }}>
                        {b.leaveType}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: badgeBg,
                        color: accentColor
                      }}>
                        {isUnpaid ? 'Unpaid Quota' : 'Paid Quota'}
                      </span>
                    </div>

                    <div style={{ marginBottom: 14, padding: '10px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Remaining Leaves
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: accentColor, lineHeight: 1.2, marginTop: 2 }}>
                        {b.available} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Days Available</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Total Allocated:</span>
                        <strong style={{ color: 'var(--primary-navy)', fontSize: 13 }}>{b.total} Days</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Used Leaves:</span>
                        <strong style={{ color: '#64748B', fontSize: 13 }}>{b.used} Days</strong>
                      </div>
                    </div>
                  </div>

                  {isUnpaid && (
                    <div style={{ fontSize: 11, color: '#D97706', marginTop: 12, fontWeight: 500, background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 10px', borderRadius: 6 }}>
                      • Zero deduction on Sick or Emergency balances
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Shared Modals */}
      <AttendanceActionModals
        showScheduleModal={showScheduleModal}
        onCloseScheduleModal={() => setShowScheduleModal(false)}
        showClockOutModal={showClockOutModal}
        onCloseClockOutModal={() => setShowClockOutModal(false)}
        user={user}
        checkInTime={stats?.activeSession?.checkIn || stats?.todayAttendance?.checkIn}
        attendanceId={stats?.activeSession?._id || stats?.todayAttendance?._id}
        onSuccess={fetchStats}
      />
    </div>
  );
};

export default EmployeeDashboard;
