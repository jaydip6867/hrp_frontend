import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, Building, ShieldCheck, 
  CalendarCheck, Clock, CheckSquare, FileText, 
  Palmtree, Target, BarChart2, Bell, 
  FolderMinus, LogOut, Settings, Award, User, X
} from 'lucide-react';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const handleLinkClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    borderRadius: 8,
    color: isActive ? '#FFFFFF' : '#94A3B8',
    background: isActive ? '#2563EB' : 'transparent',
    fontWeight: isActive ? 600 : 500,
    fontSize: 14,
    marginBottom: 4,
    transition: 'all 0.15s ease'
  });

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: isAdmin ? 'linear-gradient(135deg, #172B4D, #2563EB)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            flexShrink: 0
          }}>
            {isAdmin ? 'A' : 'E'}
          </div>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>Enterprise EMS</div>
            <div style={{ color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
              {isAdmin ? 'Administrator Portal' : 'Employee Portal'}
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="sidebar-close-btn"
          title="Close Navigation"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <div style={{
        flex: 1,
        padding: '16px 12px',
        overflowY: 'auto'
      }}>
        <NavLink 
          to={isAdmin ? "/admin/dashboard" : "/employee/dashboard"} 
          style={navItemStyle}
          onClick={handleLinkClick}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {isAdmin ? (
          /* ADMIN MENU */
          <>
            <NavLink to="/admin/employees" style={navItemStyle} onClick={handleLinkClick}>
              <Users size={18} />
              <span>Employee Management</span>
            </NavLink>

            <NavLink to="/admin/departments" style={navItemStyle} onClick={handleLinkClick}>
              <Building size={18} />
              <span>Departments</span>
            </NavLink>

            <NavLink to="/admin/attendance" style={navItemStyle} onClick={handleLinkClick}>
              <CalendarCheck size={18} />
              <span>Attendance & Audit</span>
            </NavLink>

            <NavLink to="/admin/schedules" style={navItemStyle} onClick={handleLinkClick}>
              <Clock size={18} />
              <span>Schedules & Shifts</span>
            </NavLink>

            <NavLink to="/admin/tasks" style={navItemStyle} onClick={handleLinkClick}>
              <CheckSquare size={18} />
              <span>Task Assignment</span>
            </NavLink>

            <NavLink to="/admin/work-updates" style={navItemStyle} onClick={handleLinkClick}>
              <FileText size={18} />
              <span>Work Update Review</span>
            </NavLink>

            <NavLink to="/admin/leaves" style={navItemStyle} onClick={handleLinkClick}>
              <Palmtree size={18} />
              <span>Leave Approvals</span>
            </NavLink>

            <NavLink to="/admin/work-count" style={navItemStyle} onClick={handleLinkClick}>
              <Target size={18} />
              <span>Work Count Targets</span>
            </NavLink>

            <NavLink to="/admin/reports" style={navItemStyle} onClick={handleLinkClick}>
              <BarChart2 size={18} />
              <span>Company Reports</span>
            </NavLink>

            <NavLink to="/admin/audit-logs" style={navItemStyle} onClick={handleLinkClick}>
              <ShieldCheck size={18} />
              <span>Security Audit Logs</span>
            </NavLink>

            <NavLink to="/admin/settings" style={navItemStyle} onClick={handleLinkClick}>
              <Settings size={18} />
              <span>Company Settings</span>
            </NavLink>
          </>
        ) : (
          /* EMPLOYEE MENU */
          <>
            <NavLink to="/employee/profile" style={navItemStyle} onClick={handleLinkClick}>
              <User size={18} />
              <span>My Profile</span>
            </NavLink>

            <NavLink to="/employee/attendance" style={navItemStyle} onClick={handleLinkClick}>
              <CalendarCheck size={18} />
              <span>My Attendance</span>
            </NavLink>

            <NavLink to="/employee/schedules" style={navItemStyle} onClick={handleLinkClick}>
              <Clock size={18} />
              <span>My Schedule</span>
            </NavLink>

            <NavLink to="/employee/tasks" style={navItemStyle} onClick={handleLinkClick}>
              <CheckSquare size={18} />
              <span>My Tasks</span>
            </NavLink>

            <NavLink to="/employee/work-updates" style={navItemStyle} onClick={handleLinkClick}>
              <FileText size={18} />
              <span>Daily Work Updates</span>
            </NavLink>

            <NavLink to="/employee/leaves" style={navItemStyle} onClick={handleLinkClick}>
              <Palmtree size={18} />
              <span>Apply Leave & Balance</span>
            </NavLink>

            <NavLink to="/employee/work-count" style={navItemStyle} onClick={handleLinkClick}>
              <Target size={18} />
              <span>Submit Work Count</span>
            </NavLink>

            <NavLink to="/employee/reports" style={navItemStyle} onClick={handleLinkClick}>
              <BarChart2 size={18} />
              <span>Personal Reports</span>
            </NavLink>

            <NavLink to="/employee/documents" style={navItemStyle} onClick={handleLinkClick}>
              <FolderMinus size={18} />
              <span>My Documents</span>
            </NavLink>
          </>
        )}
      </div>

      {/* User Footer & Logout */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img 
            src={user?.employee?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.username || user?.email}&background=2563EB&color=fff`} 
            alt="User avatar" 
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ maxWidth: 125, overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user?.username || 'Admin')}
            </div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#EF4444',
            padding: 8,
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
