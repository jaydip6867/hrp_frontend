import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import ForcePasswordChangeModal from '../common/ForcePasswordChangeModal';

const AppLayout = () => {
  const { user } = useAuth();
  const showForcePasswordChange = user?.role === 'Employee' && !!user?.mustChangePassword;

  return (
    <div className="app-container">
      {showForcePasswordChange && <ForcePasswordChangeModal />}
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
