import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Plus, CheckSquare, Clock, AlertCircle, RotateCcw, 
  Search, X, Paperclip, Calendar, User, FileText, CheckCircle2, Filter 
} from 'lucide-react';
import EmployeeSelectFilter from '../components/common/EmployeeSelectFilter';

const Tasks = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([
    'Development Tasks', 'Customer Calls', 'Follow-ups', 'Sales', 
    'Designs', 'Data Entry', 'Projects', 'Teaching Hours', 'General'
  ]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Selected file attachments
  const [selectedFiles, setSelectedFiles] = useState([]);

  const role = user?.role || 'Employee';
  const isAdmin = role === 'Admin';

  const loggedInEmployeeName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`.trim()
    : (user?.username || 'Authenticated Employee');

  const initialFormState = {
    title: '',
    description: '',
    assignedEmployees: role === 'Employee' && user?.employeeId ? [user.employeeId] : [],
    priority: 'Medium',
    category: 'Development Tasks',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    estimatedHours: 8,
    additionalNotes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchTasks = async (customParams = {}) => {
    try {
      setLoading(true);
      const params = {};
      const from = customParams.fromDate !== undefined ? customParams.fromDate : appliedFromDate;
      const to = customParams.toDate !== undefined ? customParams.toDate : appliedToDate;
      const emp = customParams.employeeId !== undefined ? customParams.employeeId : selectedEmployeeId;

      if (from) params.fromDate = from;
      if (to) params.toDate = to;
      if (emp) params.employeeId = emp;

      const [taskRes, empRes, catRes] = await Promise.all([
        api.get('/tasks', params),
        api.get('/employees'),
        api.get('/work-categories').catch(() => null)
      ]);

      if (taskRes.success) setTasks(taskRes.data);
      if (empRes.success) setEmployees(empRes.data);
      if (catRes && catRes.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
        const fetchedNames = catRes.data.map(c => c.name);
        setCategories(Array.from(new Set([...fetchedNames, 'Development Tasks', 'General'])));
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedEmployeeId]);

  const handleApplyFilter = () => {
    if (fromDate && toDate && toDate < fromDate) {
      addToast('To Date must not be earlier than From Date', 'error');
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    fetchTasks({ fromDate, toDate });
  };

  const handleResetFilters = () => {
    setSelectedEmployeeId('');
    setSearchFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    fetchTasks({ fromDate: '', toDate: '', employeeId: '' });
  };

  const hasActiveFilters = !!(
    selectedEmployeeId || searchFilter || statusFilter || priorityFilter || fromDate || toDate || appliedFromDate || appliedToDate
  );

  const displayedTasks = tasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const title = (t.title || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const id = (t.taskId || '').toLowerCase();
      const empNames = (t.assignedEmployeeNames || []).join(' ').toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !id.includes(q) && !empNames.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleOpenModal = () => {
    setFormData({
      ...initialFormState,
      assignedEmployees: role === 'Employee' && user?.employeeId ? [user.employeeId] : []
    });
    setSelectedFiles([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setShowModal(false);
    setSelectedFiles([]);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Task Title is required', 'error');
      return;
    }
    if (!formData.description.trim()) {
      addToast('Task Description is required', 'error');
      return;
    }

    try {
      setSubmitting(true);

      if (selectedFiles.length > 0) {
        // Use FormData for file upload
        const multipart = new FormData();
        multipart.append('title', formData.title.trim());
        multipart.append('description', formData.description.trim());
        multipart.append('priority', formData.priority);
        multipart.append('category', formData.category);
        multipart.append('startDate', formData.startDate);
        multipart.append('dueDate', formData.dueDate);
        multipart.append('estimatedHours', formData.estimatedHours);
        if (formData.additionalNotes) {
          multipart.append('additionalNotes', formData.additionalNotes.trim());
        }
        if (role === 'Admin') {
          formData.assignedEmployees.forEach(id => multipart.append('assignedEmployees', id));
          const selectedEmp = employees.find(emp => emp._id === formData.assignedEmployees[0]);
          if (selectedEmp) {
            multipart.append('assignedEmployeeNames', `${selectedEmp.firstName} ${selectedEmp.lastName}`);
          }
        }
        selectedFiles.forEach(file => {
          multipart.append('attachments', file);
        });

        await api.post('/tasks', multipart, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Use standard JSON payload
        const selectedEmp = role === 'Admin'
          ? employees.find(emp => emp._id === formData.assignedEmployees[0])
          : null;

        const payload = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          category: formData.category,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          estimatedHours: formData.estimatedHours,
          additionalNotes: formData.additionalNotes ? formData.additionalNotes.trim() : '',
          assignedEmployees: role === 'Admin' ? formData.assignedEmployees : [user?.employeeId],
          assignedEmployeeNames: role === 'Admin' && selectedEmp 
            ? [`${selectedEmp.firstName} ${selectedEmp.lastName}`] 
            : [loggedInEmployeeName]
        };

        await api.post('/tasks', payload);
      }

      addToast('Task created and assigned successfully', 'success');
      setShowModal(false);
      setSelectedFiles([]);
      await fetchTasks();
    } catch (err) {
      addToast(err.message || 'Task creation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      addToast(`Task moved to ${newStatus}`, 'success');
      fetchTasks();
    } catch (e) {
      addToast('Failed to update task status', 'error');
    }
  };

  const kanbanColumns = ['To Do', 'In Progress', 'Submitted for Review', 'Approved / Completed'];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-navy)' }}>Task Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isAdmin 
              ? 'Company-wide task distribution, sprints, deliverables, and approval reviews' 
              : 'Your personal task deliverables, sprint milestones, and progress tracking'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#E2E8F0', padding: 3, borderRadius: 8 }}>
            <button 
              className="btn btn-sm"
              onClick={() => setViewMode('list')}
              style={{ background: viewMode === 'list' ? '#fff' : 'transparent', border: 'none', fontWeight: 600 }}
            >
              List View
            </button>
            <button 
              className="btn btn-sm"
              onClick={() => setViewMode('kanban')}
              style={{ background: viewMode === 'kanban' ? '#fff' : 'transparent', border: 'none', fontWeight: 600 }}
            >
              Kanban Board
            </button>
          </div>

          {/* Create & Assign Task Button - Clearly visible for both Employee & Admin */}
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={handleOpenModal}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontWeight: 600 }}
          >
            <Plus size={16} /> Create & Assign Task
          </button>
        </div>
      </div>

      {/* Task Filters Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          {/* Search Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Search Tasks
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search task title, ID, assignee..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Status
            </label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted for Review">Submitted for Review</option>
              <option value="Approved / Completed">Approved / Completed</option>
              <option value="Rework Required">Rework Required</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ flex: '1 1 130px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Priority
            </label>
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* From Date */}
          <div style={{ flex: '0 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              From Date
            </label>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div style={{ flex: '0 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              To Date
            </label>
            <input
              type="date"
              className="form-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Apply Filter Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApplyFilter}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
          >
            <Filter size={14} /> Apply Filter
          </button>

          {/* Admin Assigned Employee Filter */}
          {isAdmin && (
            <div style={{ flex: '1 1 200px' }}>
              <EmployeeSelectFilter
                employees={employees}
                selectedEmployeeId={selectedEmployeeId}
                onChange={(id) => setSelectedEmployeeId(id)}
                label="Assigned Employee"
                placeholder="All Employees"
              />
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
            >
              <RotateCcw size={14} /> Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* List View Table */}
      {viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Task Title & Description</th>
                <th>Assigned Employee</th>
                <th>Priority</th>
                <th>Start Date</th>
                <th>Due Date</th>
                <th>Task Status</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>Loading tasks...</td></tr>
              ) : displayedTasks.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>No tasks found {appliedFromDate || appliedToDate ? 'matching the selected date range.' : 'matching criteria.'}</td></tr>
              ) : (
                displayedTasks.map(task => {
                  const createdDateFormatted = task.createdAt 
                    ? new Date(task.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                  return (
                    <tr key={task._id}>
                      <td><strong style={{ color: 'var(--primary-blue)' }}>{task.taskId}</strong></td>
                      <td style={{ maxWidth: 300 }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{task.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                          {task.description?.length > 100 ? `${task.description.slice(0, 100)}...` : task.description}
                        </div>
                        {task.category && (
                          <span style={{ fontSize: 10, background: '#E2E8F0', color: '#475569', padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>
                            {task.category}
                          </span>
                        )}
                      </td>
                      <td>{task.assignedEmployeeNames?.join(', ') || 'Unassigned'}</td>
                      <td>
                        <span className={`badge ${
                          task.priority === 'Critical' || task.priority === 'Urgent' || task.priority === 'High' ? 'badge-danger' :
                          task.priority === 'Medium' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>{task.startDate || '—'}</td>
                      <td>{task.dueDate || '—'}</td>
                      <td>
                        <span className={`badge ${
                          task.status === 'Approved / Completed' ? 'badge-success' :
                          task.status === 'In Progress' ? 'badge-info' :
                          task.status === 'Submitted for Review' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td>{createdDateFormatted}</td>
                      <td>
                        <select 
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: 12, width: 140 }}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Submitted for Review">Submitted</option>
                          <option value="Approved / Completed">Approved</option>
                          <option value="Rework Required">Rework</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban Board View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {kanbanColumns.map(col => {
            const colTasks = displayedTasks.filter(t => t.status === col);
            return (
              <div key={col} style={{ background: '#F1F5F9', borderRadius: 'var(--radius-md)', padding: 14, minHeight: 450 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary-navy)' }}>{col}</span>
                  <span className="badge badge-neutral">{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {colTasks.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>No tasks</div>
                  ) : (
                    colTasks.map(t => (
                      <div key={t._id} style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-blue)' }}>{t.taskId}</span>
                          <span className={`badge ${
                            t.priority === 'Critical' || t.priority === 'High' ? 'badge-danger' :
                            t.priority === 'Medium' ? 'badge-warning' : 'badge-neutral'
                          }`} style={{ fontSize: 10, padding: '2px 6px' }}>
                            {t.priority}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          {t.description?.length > 80 ? `${t.description.slice(0, 80)}...` : t.description}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
                          Assignee: <strong>{t.assignedEmployeeNames?.join(', ') || 'Self'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                          <span>Due: {t.dueDate || '—'}</span>
                          <select 
                            value={t.status} 
                            onChange={(e) => handleStatusChange(t._id, e.target.value)}
                            style={{ fontSize: 11, border: '1px solid #CBD5E1', borderRadius: 4, padding: '2px 4px' }}
                          >
                            {kanbanColumns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE & ASSIGN TASK MODAL                                */}
      {/* ======================================================== */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#EFF6FF', color: '#2563EB', padding: 8, borderRadius: 8 }}>
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>Create & Assign Task</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {isAdmin ? 'Define and delegate sprint tasks across team members' : 'Plan, schedule, and assign your personal work task'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCloseModal} 
                disabled={submitting}
                style={{ background: 'transparent', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask}>
              {/* Row 1: Task Title */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Task Title <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Implement Responsive Navigation & Audit Controls"
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  required 
                />
              </div>

              {/* Row 2: Task Description */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Task Description <span style={{ color: 'red' }}>*</span></label>
                <textarea 
                  className="form-textarea" 
                  rows="3"
                  placeholder="Provide detailed deliverables, acceptance criteria, or goals for this task..."
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  required 
                />
              </div>

              {/* Row 3: Assign To & Task Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Assign To <span style={{ color: 'red' }}>*</span></label>
                  {role === 'Employee' ? (
                    <div>
                      <input 
                        type="text" 
                        className="form-input"
                        value={loggedInEmployeeName}
                        readOnly
                        disabled
                        style={{ background: '#F8FAFC', color: '#1E293B', fontWeight: 600, cursor: 'not-allowed' }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>
                        Assigned to you automatically (read-only)
                      </span>
                    </div>
                  ) : (
                    <select 
                      className="form-select"
                      value={formData.assignedEmployees[0] || ''}
                      onChange={e => setFormData({ ...formData, assignedEmployees: [e.target.value] })}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.departmentName || 'General'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Task Priority <span style={{ color: 'red' }}>*</span></label>
                  <select 
                    className="form-select"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Start Date & Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.startDate} 
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.dueDate} 
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              {/* Row 5: Task Category & Estimated Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Task Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Working Hours</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5"
                    max="100"
                    className="form-input" 
                    value={formData.estimatedHours} 
                    onChange={e => setFormData({ ...formData, estimatedHours: Number(e.target.value) })} 
                    required 
                  />
                </div>
              </div>

              {/* Row 6: Additional Notes (Optional) */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Additional Notes (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  rows="2"
                  placeholder="Add any special instructions, references, or links..."
                  value={formData.additionalNotes} 
                  onChange={e => setFormData({ ...formData, additionalNotes: e.target.value })} 
                />
              </div>

              {/* Row 7: Attachments (Optional) */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Attachments (Optional)</label>
                <input 
                  type="file" 
                  className="form-input" 
                  multiple 
                  onChange={handleFileChange}
                />
                {selectedFiles.length > 0 && (
                  <div style={{ fontSize: 12, color: '#2563EB', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Paperclip size={12} /> {selectedFiles.length} file(s) selected: {selectedFiles.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140, justifyContent: 'center' }}
                >
                  {submitting ? 'Creating Task...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
