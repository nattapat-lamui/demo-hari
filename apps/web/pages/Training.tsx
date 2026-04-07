import React, { useState } from 'react';
import {
  GraduationCap, Plus, BookOpen, Users, AlertCircle, BarChart3,
  Pencil, Trash2, ToggleLeft, ToggleRight, UserPlus,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import {
  useTrainingModules,
  useTrainingAnalytics,
  useCreateTrainingModule,
  useUpdateTrainingModule,
  useDeleteTrainingModule,
  useBulkAssignTraining,
} from '../hooks/queries';
import { useAllEmployees } from '../hooks/queries';
import type { TrainingModule } from '../types';

export const Training: React.FC = () => {
  const { data: modules, isLoading } = useTrainingModules();
  const { data: analytics } = useTrainingAnalytics();
  const createMutation = useCreateTrainingModule();
  const updateMutation = useUpdateTrainingModule();
  const deleteMutation = useDeleteTrainingModule();
  const bulkAssignMutation = useBulkAssignTraining();
  const { data: employees } = useAllEmployees();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formType, setFormType] = useState('Course');

  // Bulk assign state
  const [bulkModuleId, setBulkModuleId] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  const openCreateForm = () => {
    setEditingModule(null);
    setFormTitle('');
    setFormDescription('');
    setFormDuration('');
    setFormType('Course');
    setIsFormOpen(true);
  };

  const openEditForm = (mod: TrainingModule) => {
    setEditingModule(mod);
    setFormTitle(mod.title);
    setFormDescription(mod.description || '');
    setFormDuration(mod.duration);
    setFormType(mod.type);
    setIsFormOpen(true);
  };

  const handleSaveModule = async () => {
    if (!formTitle) return;
    try {
      if (editingModule) {
        await updateMutation.mutateAsync({
          id: editingModule.id,
          data: { title: formTitle, description: formDescription, duration: formDuration, type: formType as TrainingModule['type'] },
        });
        showToast('Module updated');
      } else {
        await createMutation.mutateAsync({
          title: formTitle, description: formDescription, duration: formDuration, type: formType as TrainingModule['type'],
        });
        showToast('Module created');
      }
      setIsFormOpen(false);
    } catch {
      showToast('Failed to save module', 'error');
    }
  };

  const handleToggleActive = async (mod: TrainingModule) => {
    try {
      await updateMutation.mutateAsync({
        id: mod.id,
        data: { isActive: !mod.isActive } as Partial<TrainingModule>,
      });
      showToast(mod.isActive ? 'Module deactivated' : 'Module activated');
    } catch {
      showToast('Failed to update module', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      showToast('Module deactivated');
    } catch {
      showToast('Failed to delete module', 'error');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkModuleId || selectedEmployees.length === 0) return;
    try {
      const result = await bulkAssignMutation.mutateAsync({
        employeeIds: selectedEmployees,
        moduleId: bulkModuleId,
        dueDate: bulkDueDate || undefined,
      });
      showToast(`Training assigned to ${(result as any).assigned} employees`);
      setIsBulkAssignOpen(false);
      setSelectedEmployees([]);
      setBulkModuleId('');
      setBulkDueDate('');
    } catch {
      showToast('Failed to assign training', 'error');
    }
  };

  const activeModules = modules?.filter(m => m.isActive !== false) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-light dark:text-text-dark flex items-center gap-2">
            <GraduationCap size={28} /> Training Management
          </h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            Manage training modules and track employee progress
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsBulkAssignOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            <UserPlus size={16} /> Bulk Assign
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Create Module
          </button>
        </div>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2 text-text-muted-light dark:text-text-muted-dark text-xs mb-1">
              <BookOpen size={14} /> Total Modules
            </div>
            <p className="text-2xl font-bold text-text-light dark:text-text-dark">{analytics.activeModules}</p>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2 text-text-muted-light dark:text-text-muted-dark text-xs mb-1">
              <Users size={14} /> Assignments
            </div>
            <p className="text-2xl font-bold text-text-light dark:text-text-dark">{analytics.totalAssignments}</p>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2 text-text-muted-light dark:text-text-muted-dark text-xs mb-1">
              <BarChart3 size={14} /> Completion Rate
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.completionRate}%</p>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2 text-text-muted-light dark:text-text-muted-dark text-xs mb-1">
              <AlertCircle size={14} /> Overdue
            </div>
            <p className={`text-2xl font-bold ${analytics.overdueCount > 0 ? 'text-red-500' : 'text-text-light dark:text-text-dark'}`}>
              {analytics.overdueCount}
            </p>
          </div>
        </div>
      )}

      {/* Modules Table */}
      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark">Training Modules</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-text-muted-light dark:text-text-muted-dark">Loading...</div>
        ) : !modules?.length ? (
          <div className="p-12 text-center text-text-muted-light dark:text-text-muted-dark">
            <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
            <p>No training modules yet</p>
            <p className="text-xs mt-1">Create your first module to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {modules.map((mod) => (
              <div key={mod.id} className={`flex items-center justify-between px-6 py-4 hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors ${!mod.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-text-light dark:text-text-dark">{mod.title}</p>
                    <div className="flex items-center gap-3 text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                      <span>{mod.type}</span>
                      <span>{mod.duration}</span>
                      {mod.description && <span className="truncate max-w-[200px]">{mod.description}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${mod.isActive ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {mod.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => handleToggleActive(mod)} className="p-1.5 text-text-muted-light hover:text-primary rounded transition-colors" title={mod.isActive ? 'Deactivate' : 'Activate'}>
                    {mod.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => openEditForm(mod)} className="p-1.5 text-text-muted-light hover:text-primary rounded transition-colors" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(mod.id)} className="p-1.5 text-text-muted-light hover:text-red-500 rounded transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Department Completion Stats */}
      {analytics && analytics.completionsByDepartment.length > 0 && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-6">
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Completion by Department</h2>
          <div className="space-y-3">
            {analytics.completionsByDepartment.map((dept) => (
              <div key={dept.department} className="flex items-center gap-4">
                <span className="text-sm text-text-light dark:text-text-dark w-32 truncate">{dept.department}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                  <div
                    className="bg-primary rounded-full h-2.5 transition-all"
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-text-light dark:text-text-dark w-16 text-right">
                  {dept.completed}/{dept.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Module Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingModule ? 'Edit Module' : 'Create Module'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Title *</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Data Security Basics"
              className="w-full px-3 py-2 text-sm bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Duration</label>
              <input
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="e.g., 2h, 30m"
                className="w-full px-3 py-2 text-sm bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
              >
                <option value="Video">Video</option>
                <option value="Quiz">Quiz</option>
                <option value="Reading">Reading</option>
                <option value="Course">Course</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:hover:text-text-dark">Cancel</button>
            <button
              onClick={handleSaveModule}
              disabled={!formTitle || createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingModule ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal isOpen={isBulkAssignOpen} onClose={() => setIsBulkAssignOpen(false)} title="Bulk Assign Training" maxWidth="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Training Module *</label>
            <select
              value={bulkModuleId}
              onChange={(e) => setBulkModuleId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
            >
              <option value="">Select a module...</option>
              {activeModules.map((mod) => (
                <option key={mod.id} value={mod.id}>{mod.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Due Date (Optional)</label>
            <input
              type="date"
              value={bulkDueDate}
              onChange={(e) => setBulkDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
              Select Employees ({selectedEmployees.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-border-light dark:border-border-dark rounded-lg p-2 space-y-1">
              {employees?.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2 p-1.5 hover:bg-background-light dark:hover:bg-background-dark rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={(e) => {
                      setSelectedEmployees(prev =>
                        e.target.checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id)
                      );
                    }}
                    className="w-4 h-4 text-primary rounded border-border-light dark:border-border-dark focus:ring-primary"
                  />
                  <span className="text-sm text-text-light dark:text-text-dark">{emp.name}</span>
                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{emp.department}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsBulkAssignOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:hover:text-text-dark">Cancel</button>
            <button
              onClick={handleBulkAssign}
              disabled={!bulkModuleId || selectedEmployees.length === 0 || bulkAssignMutation.isPending}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {bulkAssignMutation.isPending ? 'Assigning...' : `Assign to ${selectedEmployees.length} employees`}
            </button>
          </div>
        </div>
      </Modal>

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      )}
    </div>
  );
};
