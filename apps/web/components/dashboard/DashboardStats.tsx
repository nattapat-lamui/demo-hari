import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, UserPlus, UserMinus } from 'lucide-react';
import { StatCard } from '../StatCard';

interface DashboardStatsProps {
  activeEmployeesCount: number;
  onLeaveCount: number;
  newHiresCount: number;
  pendingRequestsCount: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = React.memo(({
  activeEmployeesCount,
  onLeaveCount,
  newHiresCount,
  pendingRequestsCount,
}) => {
  const { t } = useTranslation(['dashboard', 'common']);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard
        title={t('dashboard:stats.activeEmployees')}
        value={activeEmployeesCount}
        icon={<Users size={24} />}
        trend={3}
        color="primary"
      />
      <StatCard
        title={t('dashboard:stats.onLeaveToday')}
        value={onLeaveCount}
        icon={<UserMinus size={24} />}
        color="orange"
      />
      <StatCard
        title={t('dashboard:stats.newJoiners')}
        value={newHiresCount}
        icon={<UserPlus size={24} />}
        trend={5}
        color="green"
      />
      <StatCard
        title={t('dashboard:stats.pendingApprovals')}
        value={pendingRequestsCount}
        icon={<TrendingUp size={24} />}
        color="red"
      />
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
