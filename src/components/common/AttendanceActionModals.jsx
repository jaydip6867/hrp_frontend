import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, X, AlertCircle, CheckSquare, Send, Lock } from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';
import { requestLocationPermission } from '../../utils/locationUtils';

export const AttendanceActionModals = ({
  showScheduleModal,
  onCloseScheduleModal,
  showClockOutModal,
  onCloseClockOutModal,
  user,
  checkInTime,
  attendanceId,
  onSuccess
}) => {
  const { addToast } = useToast();

  // Schedule Modal State
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    startTime: '09:30',
    endTime: '18:30',
    priority: 'Medium',
    notes: ''
  });

  // Clock Out / Work Activity Modal State
  const [submittingWork, setSubmittingWork] = useState(false);
  const [workError, setWorkError] = useState('');
  const [workForm, setWorkForm] = useState({
    date: new Date().toISOString().split('T')[0],
    completedTasks: '',
    workDescription: '',
    totalWorkHours: 8.0,
    pendingTasks: '',
    challenges: '',
    notes: ''
  });

  const employeeFullName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : (user?.username || 'Authenticated Employee');

  // Recalculate working hours whenever Clock Out modal opens
  useEffect(() => {
    if (showClockOutModal) {
      setWorkError('');
      const now = new Date();
      let calculatedHours = 8.0;

      if (checkInTime) {
        const checkInDate = new Date(checkInTime);
        const diffMs = now.getTime() - checkInDate.getTime();
        calculatedHours = Math.max(0.1, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
      }

      setWorkForm({
        date: new Date().toISOString().split('T')[0],
        completedTasks: '',
        workDescription: '',
        totalWorkHours: calculatedHours,
        pendingTasks: '',
        challenges: '',
        notes: ''
      });
    }
  }, [showClockOutModal, checkInTime]);

  // Reset schedule form when Schedule modal opens
  useEffect(() => {
    if (showScheduleModal) {
      setScheduleError('');
      setScheduleForm({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        startTime: '09:30',
        endTime: '18:30',
        priority: 'Medium',
        notes: ''
      });
    }
  }, [showScheduleModal]);

  // Handle Schedule submission
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleError('');

    if (!scheduleForm.title.trim()) {
      setScheduleError("Today's Planned Tasks field is required");
      return;
    }
    if (!scheduleForm.description.trim()) {
      setScheduleError("Work Description is required");
      return;
    }
    if (!scheduleForm.startTime || !scheduleForm.endTime) {
      setScheduleError("Planned Start Time and End Time are required");
      return;
    }

    try {
      setSubmittingSchedule(true);

      // Step 1: Request Geolocation permission before Clock In
      let location = null;
      try {
        location = await requestLocationPermission();
      } catch (locErr) {
        setScheduleError(locErr.message || 'Location permission is required to Clock In. Please allow access.');
        addToast(locErr.message || 'Location permission is required to Clock In', 'error');
        setSubmittingSchedule(false);
        return;
      }

      const payload = {
        title: scheduleForm.title.trim(),
        description: scheduleForm.notes
          ? `${scheduleForm.description.trim()}\n\nAdditional Notes: ${scheduleForm.notes.trim()}`
          : scheduleForm.description.trim(),
        employee: user?.employeeId,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        priority: scheduleForm.priority,
        status: 'Planned',
        reminder: true
      };

      // Step 2: Save daily schedule
      const schedRes = await api.post('/schedules', payload);
      if (!schedRes.success) {
        throw new Error(schedRes.message || 'Failed to save daily schedule');
      }

      // Step 3: Record actual Clock In timestamp & location
      const checkInRes = await api.post('/attendance/check-in', { location });
      if (!checkInRes.success) {
        throw new Error(checkInRes.message || 'Failed to complete clock-in');
      }

      addToast('Daily schedule saved & Clocked In successfully with verified location!', 'success');
      onCloseScheduleModal();
      if (onSuccess) await onSuccess();
    } catch (err) {
      setScheduleError(err.message || 'Failed to complete schedule and clock-in');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // Handle Work Log submission & Clock-Out
  const handleWorkAndClockOutSubmit = async (e) => {
    e.preventDefault();
    setWorkError('');

    if (!workForm.completedTasks.trim()) {
      setWorkError("Completed Tasks field is required before clocking out");
      return;
    }
    if (!workForm.workDescription.trim()) {
      setWorkError("Work Summary / Description is required");
      return;
    }
    if (!workForm.pendingTasks.trim()) {
      setWorkError("Pending Tasks field is required before clocking out");
      return;
    }
    if (!workForm.challenges.trim()) {
      setWorkError("Challenges / Issues field is required before clocking out");
      return;
    }

    try {
      setSubmittingWork(true);

      // Step 1: Request Geolocation permission before Clock Out
      let location = null;
      try {
        location = await requestLocationPermission();
      } catch (locErr) {
        setWorkError(locErr.message || 'Location permission is required to Clock Out. Please allow access.');
        addToast(locErr.message || 'Location permission is required to Clock Out', 'error');
        setSubmittingWork(false);
        return;
      }

      // Step 2: Submit Work Activity Log
      const workPayload = {
        date: workForm.date,
        workTitle: workForm.completedTasks.trim().substring(0, 80),
        completedTasks: workForm.completedTasks.trim(),
        workDescription: workForm.workDescription.trim(),
        timeSpent: parseFloat(workForm.totalWorkHours) || 8,
        pendingTasks: workForm.pendingTasks.trim(),
        challenges: workForm.challenges.trim(),
        notes: workForm.notes.trim(),
        attendanceId: attendanceId || null,
        progressPercentage: 100
      };

      await api.post('/work-updates', workPayload);

      // Step 3: Complete Attendance Clock Out with location
      const checkOutRes = await api.post('/attendance/check-out', { location });

      addToast(checkOutRes.message || 'Daily work activity logged & clocked out successfully with verified location!', 'success');
      onCloseClockOutModal();
      if (onSuccess) await onSuccess();
    } catch (err) {
      setWorkError(err.message || 'Failed to complete clock-out activity');
    } finally {
      setSubmittingWork(false);
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* MODAL 1: Create My Daily Schedule Modal                  */}
      {/* ======================================================== */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => !submittingSchedule && onCloseScheduleModal()}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#DCFCE7', color: '#16A34A', padding: 8, borderRadius: 8 }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>Create My Daily Schedule</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Plan and publish your agenda and deliverables for today</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onCloseScheduleModal} 
                disabled={submittingSchedule}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {scheduleError && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit}>
              {/* Row 1: Work Date & Employee Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Work Date <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="date"
                    className="form-input"
                    value={scheduleForm.date}
                    onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Employee Name <Lock size={12} style={{ color: '#64748B' }} />
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={employeeFullName}
                    readOnly
                    disabled
                    style={{ background: '#F1F5F9', color: '#475569', cursor: 'not-allowed', fontWeight: 500 }}
                  />
                </div>
              </div>

              {/* Row 2: Today's Planned Tasks */}
              <div className="form-group">
                <label className="form-label">Today's Planned Tasks <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Implement authentication, API verification, and client review"
                  value={scheduleForm.title}
                  onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  required
                />
              </div>

              {/* Row 3: Work Description */}
              <div className="form-group">
                <label className="form-label">Work Description <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Provide details about what you plan to accomplish, modules involved, and key deliverables..."
                  value={scheduleForm.description}
                  onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  required
                />
              </div>

              {/* Row 4: Planned Start Time, Planned End Time, Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Planned Start Time <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.startTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Planned End Time <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.endTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={scheduleForm.priority}
                    onChange={e => setScheduleForm({ ...scheduleForm, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Additional Notes */}
              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Any dependencies, blockers, or reminders for today's schedule..."
                  value={scheduleForm.notes}
                  onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onCloseScheduleModal}
                  disabled={submittingSchedule}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingSchedule}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <CheckSquare size={16} />
                  {submittingSchedule ? 'Starting Session & Clocking In...' : 'Save Schedule & Clock In Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Log Daily Work Activity Modal (Clock Out)       */}
      {/* ======================================================== */}
      {showClockOutModal && (
        <div className="modal-overlay" onClick={() => !submittingWork && onCloseClockOutModal()}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 8, borderRadius: 8 }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>Log Daily Work Activity</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Submit your daily work summary to complete Clock Out</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onCloseClockOutModal} 
                disabled={submittingWork}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Attendance Session Summary Banner */}
            <div style={{ 
              background: '#EFF6FF', 
              border: '1px solid #BFDBFE', 
              borderRadius: 6, 
              padding: '10px 14px', 
              fontSize: 12, 
              color: '#1E40AF',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <div>
                <strong>Check-In Time:</strong>{' '}
                {checkInTime 
                  ? new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : 'N/A'}
              </div>
              <div>
                <strong>Clock-Out Session:</strong> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div>
                <strong>Duration:</strong> {formatDuration(workForm.totalWorkHours)}
              </div>
            </div>

            {workError && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{workError}</span>
              </div>
            )}

            <form onSubmit={handleWorkAndClockOutSubmit}>
              {/* Row 1: Work Date, Employee Name, Auto Calculated Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Work Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={workForm.date}
                    readOnly
                    disabled
                    style={{ background: '#F1F5F9', color: '#475569', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Employee Name <Lock size={12} style={{ color: '#64748B' }} />
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={employeeFullName}
                    readOnly
                    disabled
                    style={{ background: '#F1F5F9', color: '#475569', cursor: 'not-allowed', fontWeight: 500 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Total Work Hours <Lock size={12} style={{ color: '#64748B' }} />
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formatDuration(workForm.totalWorkHours)}
                    readOnly
                    disabled
                    style={{ background: '#F1F5F9', color: '#1E293B', cursor: 'not-allowed', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Row 2: Completed Tasks */}
              <div className="form-group">
                <label className="form-label">Completed Tasks <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Resolved customer tickets, implemented search API, unit tests"
                  value={workForm.completedTasks}
                  onChange={e => setWorkForm({ ...workForm, completedTasks: e.target.value })}
                  required
                />
              </div>

              {/* Row 3: Work Summary / Description */}
              <div className="form-group">
                <label className="form-label">Work Summary / Description <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Comprehensive description of today's work accomplishments, deliverables, and progress made..."
                  value={workForm.workDescription}
                  onChange={e => setWorkForm({ ...workForm, workDescription: e.target.value })}
                  required
                />
              </div>

              {/* Row 4: Pending Tasks & Challenges (Both Required) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Pending Tasks <span style={{ color: 'red' }}>*</span></label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Tasks carried forward to next working day..."
                    value={workForm.pendingTasks}
                    onChange={e => setWorkForm({ ...workForm, pendingTasks: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Challenges / Issues <span style={{ color: 'red' }}>*</span></label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Any blockers or technical challenges faced..."
                    value={workForm.challenges}
                    onChange={e => setWorkForm({ ...workForm, challenges: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Row 5: Additional Notes */}
              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Any handover comments, reminders, or general notes..."
                  value={workForm.notes}
                  onChange={e => setWorkForm({ ...workForm, notes: e.target.value })}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onCloseClockOutModal}
                  disabled={submittingWork}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={submittingWork}
                  style={{ 
                    background: '#DC2626', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    cursor: submittingWork ? 'not-allowed' : 'pointer',
                    padding: '9px 18px'
                  }}
                >
                  <Send size={15} />
                  {submittingWork ? 'Submitting & Clocking Out...' : 'Submit Work & Clock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceActionModals;
