import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Bell, Search, ShieldCheck, User } from 'lucide-react';

const Topbar = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header style={{
      height: 'var(--header-height)',
      background: '#FFFFFF',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-main)',
        padding: '8px 14px',
        borderRadius: 'var(--radius-sm)',
        width: 340
      }}>
        <Search size={16} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search records, tasks, employees..." 
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Role Pill */}
        <span className={`badge ${user?.role === 'Admin' ? 'badge-danger' : 'badge-info'}`}>
          {user?.role === 'Admin' ? <ShieldCheck size={12} style={{ marginRight: 4 }} /> : <User size={12} style={{ marginRight: 4 }} />}
          {user?.role}
        </span>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
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
              width: 320,
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

        {/* User profile preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img 
            src={user?.employee?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.username || user?.email}&background=2563EB&color=fff`} 
            alt="Profile" 
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user?.username || 'Admin')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {user?.employee ? `${user.employee.designation} (${user.employee.employeeCode})` : 'System Administrator'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
