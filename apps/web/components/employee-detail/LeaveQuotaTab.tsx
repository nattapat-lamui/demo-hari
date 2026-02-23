import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import type { EffectiveLeaveQuota } from '../../types';
import {
    useEmployeeLeaveQuotas,
    useUpdateEmployeeLeaveQuotas,
    useDeleteLeaveQuotaOverride,
} from '../../hooks/queries';

interface LeaveQuotaTabProps {
    employeeId: string;
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LeaveQuotaTab: React.FC<LeaveQuotaTabProps> = ({ employeeId, showToast }) => {
    const { data: quotas, isPending } = useEmployeeLeaveQuotas(employeeId);
    const updateMutation = useUpdateEmployeeLeaveQuotas();
    const deleteMutation = useDeleteLeaveQuotaOverride();

    // Local editable state: { [leaveType]: totalValue }
    const [editValues, setEditValues] = useState<Record<string, number>>({});
    const [dirty, setDirty] = useState(false);

    // Sync from server data
    useEffect(() => {
        if (quotas) {
            const map: Record<string, number> = {};
            quotas.forEach((q: EffectiveLeaveQuota) => {
                map[q.type] = q.total;
            });
            setEditValues(map);
            setDirty(false);
        }
    }, [quotas]);

    const handleChange = (type: string, value: string) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return;
        setEditValues(prev => ({ ...prev, [type]: num }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!quotas) return;

        // Build overrides: only send types whose value differs from default
        const overrides: Array<{ leaveType: string; total: number }> = [];
        for (const q of quotas) {
            const editVal = editValues[q.type];
            if (editVal !== undefined && editVal !== q.defaultTotal) {
                overrides.push({ leaveType: q.type, total: editVal });
            }
        }

        // Also delete overrides that were reset back to default
        const toReset = quotas.filter(
            q => q.isOverride && editValues[q.type] === q.defaultTotal
        );

        try {
            // Delete resets first
            for (const q of toReset) {
                await deleteMutation.mutateAsync({ employeeId, leaveType: q.type });
            }
            // Upsert remaining overrides
            if (overrides.length > 0) {
                await updateMutation.mutateAsync({ employeeId, overrides });
            }
            showToast('Leave quotas updated successfully!', 'success');
            setDirty(false);
        } catch (error: any) {
            showToast(error.message || 'Failed to update leave quotas', 'error');
        }
    };

    const handleReset = async (type: string) => {
        try {
            await deleteMutation.mutateAsync({ employeeId, leaveType: type });
            showToast(`${type} quota reset to default`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to reset quota', 'error');
        }
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-text-muted-light dark:text-text-muted-dark">Loading quotas...</span>
            </div>
        );
    }

    if (!quotas || quotas.length === 0) {
        return (
            <div className="text-center py-12 text-text-muted-light dark:text-text-muted-dark">
                No leave types configured.
            </div>
        );
    }

    const isSaving = updateMutation.isPending || deleteMutation.isPending;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">Leave Quotas</h3>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        Override default quotas for this employee. Changes affect future leave requests.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!dirty || isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border-light dark:border-border-dark">
                            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Leave Type</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Default</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Current Quota</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Status</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotas.map((q: EffectiveLeaveQuota) => {
                            const currentVal = editValues[q.type] ?? q.total;
                            const isEdited = currentVal !== q.defaultTotal;
                            const isCurrentlyOverride = q.isOverride;

                            return (
                                <tr
                                    key={q.type}
                                    className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <span className="font-medium text-text-light dark:text-text-dark">{q.type}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="text-text-muted-light dark:text-text-muted-dark">
                                            {q.defaultTotal === -1 ? 'Unlimited' : `${q.defaultTotal} days`}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {q.defaultTotal === -1 ? (
                                            <span className="text-text-muted-light dark:text-text-muted-dark">Unlimited</span>
                                        ) : (
                                            <input
                                                type="number"
                                                min={0}
                                                value={currentVal}
                                                onChange={e => handleChange(q.type, e.target.value)}
                                                className="w-20 text-center px-2 py-1 border border-border-light dark:border-border-dark rounded-md bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary"
                                            />
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {isEdited || isCurrentlyOverride ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                Custom
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                Default
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {isCurrentlyOverride && q.defaultTotal !== -1 && (
                                            <button
                                                onClick={() => handleReset(q.type)}
                                                disabled={isSaving}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-text-muted-light dark:text-text-muted-dark hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                                title="Reset to default"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                Reset
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
