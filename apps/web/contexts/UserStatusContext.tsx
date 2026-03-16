import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';
import type { AvailabilityStatus, UserStatusInfo } from '../types';

interface UserStatusContextType {
  statuses: Map<string, UserStatusInfo>;
  getStatus: (employeeId: string) => AvailabilityStatus;
  getStatusMessage: (employeeId: string) => string;
  updateMyStatus: (status: AvailabilityStatus, statusMessage?: string) => void;
}

const UserStatusContext = createContext<UserStatusContextType | undefined>(undefined);

export const UserStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Map<string, UserStatusInfo>>(new Map());

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    const employeeId = user.id;

    // When we receive the full status map from server
    const onInitial = (data: Record<string, { status: AvailabilityStatus; statusMessage: string; updatedAt: string }>) => {
      const map = new Map<string, UserStatusInfo>();
      for (const [empId, info] of Object.entries(data)) {
        map.set(empId, { employeeId: empId, ...info });
      }
      setStatuses(map);
    };

    // When a single user's status changes
    const onChanged = (data: { employeeId: string; status: AvailabilityStatus; statusMessage: string; updatedAt: string }) => {
      setStatuses(prev => {
        const next = new Map(prev);
        next.set(data.employeeId, {
          employeeId: data.employeeId,
          status: data.status,
          statusMessage: data.statusMessage,
          updatedAt: data.updatedAt,
        });
        return next;
      });
    };

    // Re-join on reconnect so the server maps the new socket.id to our employeeId
    const onConnect = () => {
      socket.emit('user-status:join', employeeId);
    };

    socket.on('user-status:initial', onInitial);
    socket.on('user-status:changed', onChanged);
    socket.on('connect', onConnect);

    // Join immediately if already connected
    if (socket.connected) {
      socket.emit('user-status:join', employeeId);
    }

    return () => {
      socket.off('user-status:initial', onInitial);
      socket.off('user-status:changed', onChanged);
      socket.off('connect', onConnect);
    };
  }, [user?.id]);

  const getStatus = useCallback((employeeId: string): AvailabilityStatus => {
    return statuses.get(employeeId)?.status ?? 'offline';
  }, [statuses]);

  const getStatusMessage = useCallback((employeeId: string): string => {
    return statuses.get(employeeId)?.statusMessage ?? '';
  }, [statuses]);

  const updateMyStatus = useCallback((status: AvailabilityStatus, statusMessage?: string) => {
    const socket = getSocket();
    socket.emit('user-status:update', { status, statusMessage });
  }, []);

  return (
    <UserStatusContext.Provider value={{ statuses, getStatus, getStatusMessage, updateMyStatus }}>
      {children}
    </UserStatusContext.Provider>
  );
};

export const useUserStatus = () => {
  const context = useContext(UserStatusContext);
  if (!context) {
    throw new Error('useUserStatus must be used within a UserStatusProvider');
  }
  return context;
};
