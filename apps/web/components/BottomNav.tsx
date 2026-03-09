import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Clock, Calendar, Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation('common');
  const { unreadCount } = useNotifications();
  const { isAdminView } = useAuth();

  const items = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
    { icon: Clock, label: t('nav.attendance'), path: isAdminView ? '/admin-attendance' : '/attendance' },
    { icon: Calendar, label: isAdminView ? t('nav.leaveRequests') : t('nav.timeOff'), path: isAdminView ? '/leave-requests' : '/time-off' },
    { icon: Bell, label: t('header.notifications'), path: '/notifications', badge: unreadCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card-light dark:bg-card-dark border-t border-border-light dark:border-border-dark md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted-light dark:text-text-muted-dark'
              }`
            }
          >
            <item.icon size={22} />
            <span className="text-[10px] font-medium mt-0.5 leading-tight">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="absolute top-0.5 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-accent-red rounded-full">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
