import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserStatus } from '../contexts/UserStatusContext';
import { useAuth } from '../contexts/AuthContext';
import { StatusIndicator } from './StatusIndicator';
import type { AvailabilityStatus } from '../types';

interface StatusPickerProps {
  onClose?: () => void;
}

const statusOptions: AvailabilityStatus[] = ['online', 'busy', 'away'];

export const StatusPicker: React.FC<StatusPickerProps> = ({ onClose }) => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { getStatus, getStatusMessage, updateMyStatus } = useUserStatus();

  const currentStatus = user?.id ? getStatus(user.id) : 'online';
  const currentMessage = user?.id ? getStatusMessage(user.id) : '';
  const [message, setMessage] = useState(currentMessage);
  const handleSelect = (status: AvailabilityStatus) => {
    updateMyStatus(status, message);
    onClose?.();
  };

  const handleMessageSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateMyStatus(currentStatus === 'offline' ? 'online' : currentStatus, message);
      onClose?.();
    }
  };

  return (
    <div className="py-1">
      <p className="px-4 py-1.5 text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wide">
        {t('availability.title')}
      </p>
      {statusOptions.map((status) => {
        const isActive = currentStatus === status;
        return (
          <button
            key={status}
            onClick={() => handleSelect(status)}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 min-h-[40px] hover:bg-background-light dark:hover:bg-background-dark transition-colors ${
              isActive ? 'bg-primary/5 dark:bg-primary/10 font-medium' : 'text-text-light dark:text-text-dark'
            }`}
          >
            <StatusIndicator status={status} size="md" />
            <span className="flex-1">{t(`availability.${status}`)}</span>
            {isActive && (
              <Check size={14} className="text-primary flex-shrink-0" />
            )}
          </button>
        );
      })}
      <div className="px-3 py-2 border-t border-border-light dark:border-border-dark">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 100))}
          onKeyDown={handleMessageSubmit}
          placeholder={t('availability.messagePlaceholder')}
          className="w-full px-3 py-1.5 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-text-light dark:text-text-dark"
        />
      </div>
    </div>
  );
};
