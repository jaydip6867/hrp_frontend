import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { 
  Bell, Search, ShieldCheck, User, Menu, 
  LogOut, ChevronDown, Settings 
} from 'lucide-react';

const Topbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.success && res.data) {
          setNotifications(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    if (addToast) addToast('Logged out successfully', 'info');
    navigate(user?.role === 'Admin' ? '/admin/login' : '/employee/login', { replace: true });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const fullName = user?.employee 
    ? `${user.employee.firstName} ${user.employee.lastName}` 
    : (user?.username || 'Admin');
  const roleTitle = user?.role === 'Admin' ? 'Administrator' : (user?.employee?.designation || 'Employee');
  const userAvatar = user?.employee?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2563EB&color=fff`;

  return (
    <header style={{
      height: 'var(--header-height)',
      background: '#FFFFFF',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Left side: Hamburger Toggle & Search */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={toggleSidebar}
          className="sidebar-toggle-btn"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div 
          className="topbar-search-box"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-main)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            width: 300,
            maxWidth: '100%'
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search records, tasks..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Role Pill */}
        <span className={`badge ${user?.role === 'Admin' ? 'badge-danger' : 'badge-info'}`}>
          {user?.role === 'Admin' ? <ShieldCheck size={12} style={{ marginRight: 4 }} /> : <User size={12} style={{ marginRight: 4 }} />}
          {user?.role}
        </span>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              padding: 6,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: '#DC2626',
                color: '#fff',
                fontSize: 10,
                width: 16,
                height: 16,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 40,
              width: 300,
              maxWidth: '90vw',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              padding: 12,
              zIndex: 100
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
                System Notifications
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n._id} style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Button */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div 
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            role="button"
            tabIndex={0}
            title="User Account Menu"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              background: showProfileDropdown ? 'var(--bg-main)' : 'transparent',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; }}
            onMouseLeave={(e) => { 
              if (!showProfileDropdown) e.currentTarget.style.background = 'transparent'; 
            }}
          >
            <img 
              src={userAvatar} 
              alt="Profile" 
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span className="topbar-user-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {fullName}
              </span>
              <span className="topbar-user-designation" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {roleTitle}
              </span>
            </div>
            <ChevronDown 
              size={14} 
              color="var(--text-muted)" 
              style={{
                transition: 'transform 0.2s ease',
                transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                marginLeft: 2
              }}
            />
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 230,
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              padding: '8px 0',
              zIndex: 100,
              animation: 'fadeIn 0.15s ease'
            }}>
              {/* User Header Info */}
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-navy)' }}>
                  {fullName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, wordBreak: 'break-all' }}>
                  {user?.email || user?.username}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: 0.5,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: user?.role === 'Admin' ? 'var(--danger-bg)' : 'var(--primary-blue-light)',
                    color: user?.role === 'Admin' ? 'var(--danger)' : 'var(--primary-blue)'
                  }}>
                    {user?.role} Account
                  </span>
                </div>
              </div>

              {/* Navigation Options */}
              <div style={{ padding: '4px 0' }}>
                {user?.role === 'Employee' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/employee/profile');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <User size={16} color="var(--primary-blue)" />
                    <span>My Profile</span>
                  </button>
                )}

                {user?.role === 'Admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/admin/settings');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Settings size={16} color="var(--text-secondary)" />
                    <span>Company Settings</span>
                  </button>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

              {/* Logout Button */}
              <div style={{ padding: '4px 8px' }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'none',
                    border: 'none',
                    borderRadius: 6,
                    color: '#DC2626',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.background = 'var(--danger-bg)'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.background = 'none'; 
                  }}
                >
                  <LogOut size={16} color="#DC2626" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
