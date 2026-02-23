import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EmployeeDashboard } from './EmployeeDashboard';
import { AdminDashboard } from './AdminDashboard';

export const Dashboard: React.FC = () => {
  const { isAdminView } = useAuth();
  if (!isAdminView) return <EmployeeDashboard />;
  return <AdminDashboard />;
};
