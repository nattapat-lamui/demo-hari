import React, { useState } from 'react';
import { Modal } from '../Modal';
import { TrainingModule } from '../../types';

interface AssignTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: TrainingModule[];
  onAssign: (moduleId: string, dueDate?: string) => void;
  isLoading?: boolean;
}

export const AssignTrainingModal: React.FC<AssignTrainingModalProps> = ({
  isOpen,
  onClose,
  modules,
  onAssign,
  isLoading,
}) => {
  const [selectedModule, setSelectedModule] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleClose = () => {
    setSelectedModule('');
    setDueDate('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    onAssign(selectedModule, dueDate || undefined);
    setSelectedModule('');
    setDueDate('');
  };

  const activeModules = modules.filter(m => m.isActive !== false);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Training">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Training Module
          </label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
          >
            <option value="">Select a module...</option>
            {activeModules.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.title} ({mod.type} - {mod.duration})
              </option>
            ))}
          </select>
          {activeModules.length === 0 && (
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
              No training modules available. Create one first in the Training page.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Due Date (Optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:hover:text-text-dark"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedModule || isLoading}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Assigning...' : 'Assign Training'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
