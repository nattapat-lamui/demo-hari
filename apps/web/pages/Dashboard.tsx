import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EmployeeDashboard } from './EmployeeDashboard';
import { AdminDashboard } from './AdminDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'EMPLOYEE') return <EmployeeDashboard />;
  return <AdminDashboard />;
};
