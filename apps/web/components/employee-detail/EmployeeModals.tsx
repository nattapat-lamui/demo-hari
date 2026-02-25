import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Check,
    User,
    Mail,
    Hash,
    Lock,
    HeartPulse,
    Phone,
    AlignLeft,
    Star,
    Trash2,
    TrendingUp,
    ArrowRightLeft,
    AlertTriangle,
} from 'lucide-react';
import { DatePicker } from '../../components/DatePicker';
import { Dropdown } from '../../components/Dropdown';
import { ThaiAddressForm } from '../../components/ThaiAddressForm';
import { EmployeeModalsProps } from './EmployeeDetailTypes';
import { DEPARTMENTS, JOB_TITLES } from '../../types';
import { PHONE_COUNTRY_CODES, parsePhoneNumber } from '../../lib/phoneUtils';

const OFFICE_LOCATIONS = ['Office', 'Remote'];

export const EmployeeModals: React.FC<EmployeeModalsProps> = ({
    // Edit Profile Modal
    isEditProfileOpen,
    editForm,
    permissions,
    onCloseEditProfile,
    onProfileChange,
    onProfileSave,

    // Add History Modal
    isAddHistoryModalOpen,
    newHistoryForm,
    onSetNewHistoryForm,
    onCloseAddHistory,
    onSaveNewHistory,

    // Review Modal
    isReviewModalOpen,
    reviewForm,
    isAdmin,
    onSetReviewForm,
    onCloseReviewModal,
    onSaveReview,

    // Delete Confirmation Modal
    deleteConfirmId,
    onCancelDelete,
    onConfirmDelete,

    // Promote Modal
    isPromoteOpen,
    promoteForm,
    onPromoteFormChange,
    onClosePromote,
    onConfirmPromote,

    // Transfer Modal
    isTransferOpen,
    transferDepartment,
    onTransferDepartmentChange,
    onCloseTransfer,
    onConfirmTransfer,

    // Terminate Modal
    isTerminateOpen,
    onCloseTerminate,
    onConfirmTerminate,
}) => {
    const { canEditSensitiveInfo, isOwnProfile } = permissions;

    // Phone: split into country code + number for the UI, combine before saving
    const [phoneCode, setPhoneCode] = useState('+66');
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        if (isEditProfileOpen) {
            const parsed = parsePhoneNumber(editForm.phone || '');
            setPhoneCode(parsed.code);
            setPhoneNumber(parsed.number);
        }
    }, [isEditProfileOpen]);

    const handlePhoneChange = (code: string, number: string) => {
        setPhoneCode(code);
        setPhoneNumber(number);
        onProfileChange('phone', number ? `${code}${number}` : '');
    };

    const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Ctrl/Cmd+Enter → save from anywhere
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onProfileSave();
            return;
        }

        // Enter → focus next field (Shift+Enter for newline in textarea)
        if (e.key === 'Enter' && !e.shiftKey) {
            const target = e.target as HTMLElement;

            e.preventDefault();
            const focusable = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>(
                    'input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
                )
            );
            const idx = focusable.indexOf(target);
            const next = idx >= 0 ? focusable[idx + 1] : undefined;
            if (next) next.focus();
        }
    };

    return (
        <>
            {/* Edit Profile Modal */}
            {isEditProfileOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-text-light dark:text-text-dark">
                                Edit Employee Profile
                            </h3>
                            <button
                                onClick={onCloseEditProfile}
                                className="text-text-muted-light hover:text-text-light"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div
                            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto"
                            onKeyDown={handleFormKeyDown}
                        >
                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light" size={16} />
                                    <input
                                        type="text"
                                        value={editForm.name || ''}
                                        onChange={(e) => onProfileChange('name', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                                    Role / Title
                                    {!canEditSensitiveInfo && <Lock size={12} className="inline ml-2 text-text-muted-light" />}
                                </label>
                                <Dropdown
                                    value={editForm.role || ''}
                                    onChange={(val) => onProfileChange('role', val)}
                                    placeholder="Select role"
                                    disabled={!canEditSensitiveInfo}
                                    options={[
                                        ...(editForm.role && !JOB_TITLES.includes(editForm.role as any)
                                            ? [{ value: editForm.role, label: editForm.role }]
                                            : []),
                                        ...JOB_TITLES.map((t) => ({ value: t, label: t })),
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                                    Department
                                    {!canEditSensitiveInfo && <Lock size={12} className="inline ml-2 text-text-muted-light" />}
                                </label>
                                <Dropdown
                                    value={editForm.department || ''}
                                    onChange={(val) => onProfileChange('department', val)}
                                    placeholder="Select department"
                                    disabled={!canEditSensitiveInfo}
                                    options={[
                                        ...(editForm.department && !DEPARTMENTS.includes(editForm.department as any)
                                            ? [{ value: editForm.department, label: editForm.department }]
                                            : []),
                                        ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light" size={16} />
                                    <input
                                        type="email"
                                        value={editForm.email || ''}
                                        onChange={(e) => onProfileChange('email', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Slack Handle</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light" size={16} />
                                    <input
                                        type="text"
                                        value={editForm.slack || ''}
                                        onChange={(e) => onProfileChange('slack', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                                        placeholder="@username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                                    Location
                                    {!canEditSensitiveInfo && <Lock size={12} className="inline ml-2 text-text-muted-light" />}
                                </label>
                                <Dropdown
                                    value={editForm.location || ''}
                                    onChange={(val) => onProfileChange('location', val)}
                                    placeholder="Select location"
                                    disabled={!canEditSensitiveInfo}
                                    options={[
                                        ...(editForm.location && !OFFICE_LOCATIONS.includes(editForm.location)
                                            ? [{ value: editForm.location, label: editForm.location }]
                                            : []),
                                        ...OFFICE_LOCATIONS.map((loc) => ({ value: loc, label: loc })),
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                                    Join Date
                                    {!canEditSensitiveInfo && <Lock size={12} className="inline ml-2 text-text-muted-light" />}
                                </label>
                                <DatePicker
                                    value={editForm.joinDate || ''}
                                    onChange={(date) => onProfileChange('joinDate', date)}
                                    placeholder="Select join date"
                                    disabled={!canEditSensitiveInfo}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                                    Status
                                    {!canEditSensitiveInfo && <Lock size={12} className="inline ml-2 text-text-muted-light" />}
                                </label>
                                <Dropdown
                                    value={editForm.status || 'Active'}
                                    onChange={(val) => onProfileChange('status', val)}
                                    disabled={!canEditSensitiveInfo}
                                    options={[
                                        { value: 'Active', label: 'Active' },
                                        { value: 'On Leave', label: 'On Leave' },
                                        { value: 'Terminated', label: 'Terminated' },
                                    ]}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Emergency Contact</label>
                                <div className="relative">
                                    <HeartPulse className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light" size={16} />
                                    <input
                                        type="text"
                                        value={editForm.emergencyContact || ''}
                                        onChange={(e) => onProfileChange('emergencyContact', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                                        placeholder="Name - Relation - Phone Number"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Phone Number</label>
                                <div className="flex gap-2">
                                    <Dropdown
                                        value={phoneCode}
                                        onChange={(code) => handlePhoneChange(code, phoneNumber)}
                                        options={PHONE_COUNTRY_CODES}
                                        className="w-28"
                                    />
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light" size={16} />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 10) handlePhoneChange(phoneCode, val);
                                            }}
                                            maxLength={10}
                                            className="w-full pl-10 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                                            placeholder="812345678"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Bio</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-3 top-3 text-text-muted-light" size={16} />
                                    <textarea
                                        rows={3}
                                        value={editForm.bio || ''}
                                        onChange={(e) => onProfileChange('bio', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark resize-none"
                                        placeholder="Short professional biography..."
                                    />
                                </div>
                            </div>

                            {/* Current Address — Thai autocomplete */}
                            <ThaiAddressForm
                                value={editForm.address}
                                onChange={(addr) => onProfileChange('address', addr)}
                            />
                        </div>

                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex gap-3">
                                <button
                                    onClick={onCloseEditProfile}
                                    className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:text-text-muted-dark dark:hover:text-text-dark"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onProfileSave}
                                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2"
                                >
                                    <Check size={16} /> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add History Modal */}
            {isAddHistoryModalOpen && (isAdmin || isOwnProfile) && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-text-light dark:text-text-dark">
                                Add Employment History
                            </h3>
                            <button
                                onClick={onCloseAddHistory}
                                className="text-text-muted-light hover:text-text-light"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Role</label>
                                <input
                                    type="text"
                                    value={newHistoryForm.role || ''}
                                    onChange={(e) => onSetNewHistoryForm({ ...newHistoryForm, role: e.target.value })}
                                    placeholder="e.g. Senior Developer"
                                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Department</label>
                                <input
                                    type="text"
                                    value={newHistoryForm.department || ''}
                                    onChange={(e) => onSetNewHistoryForm({ ...newHistoryForm, department: e.target.value })}
                                    placeholder="e.g. Engineering"
                                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <DatePicker
                                        label="Start Date"
                                        value={newHistoryForm.startDate || ''}
                                        onChange={(date) => onSetNewHistoryForm({ ...newHistoryForm, startDate: date })}
                                        placeholder="Select start date"
                                    />
                                </div>
                                <div>
                                    <DatePicker
                                        label="End Date"
                                        value={newHistoryForm.endDate && newHistoryForm.endDate !== 'Present' ? newHistoryForm.endDate : ''}
                                        onChange={(date) => onSetNewHistoryForm({ ...newHistoryForm, endDate: date })}
                                        placeholder="Select end date"
                                        disabled={newHistoryForm.endDate === 'Present'}
                                    />
                                    <label className="flex items-center mt-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newHistoryForm.endDate === 'Present'}
                                            onChange={(e) => onSetNewHistoryForm({ ...newHistoryForm, endDate: e.target.checked ? 'Present' : '' })}
                                            className="w-4 h-4 text-primary bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded focus:ring-2 focus:ring-primary"
                                        />
                                        <span className="ml-2 text-sm text-text-muted-light dark:text-text-muted-dark">Current Position</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Description</label>
                                <textarea
                                    value={newHistoryForm.description || ''}
                                    onChange={(e) => onSetNewHistoryForm({ ...newHistoryForm, description: e.target.value })}
                                    rows={3}
                                    placeholder="Key responsibilities and achievements..."
                                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark resize-none"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                onClick={onCloseAddHistory}
                                className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:text-text-muted-dark dark:hover:text-text-dark"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSaveNewHistory}
                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2"
                            >
                                <Check size={16} /> Save Position
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Performance Review Modal */}
            {isReviewModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-text-light dark:text-text-dark">
                                {reviewForm.id ? 'Edit Performance Review' : 'New Performance Review'}
                            </h3>
                            <button
                                onClick={onCloseReviewModal}
                                className="text-text-muted-light hover:text-text-light"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Reviewer</label>
                                <input
                                    type="text"
                                    value={reviewForm.reviewer || ''}
                                    onChange={(e) => isAdmin ? onSetReviewForm({ ...reviewForm, reviewer: e.target.value }) : undefined}
                                    readOnly={!isAdmin}
                                    placeholder="Reviewer Name"
                                    className={`w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark ${!isAdmin ? 'opacity-70 cursor-default' : ''}`}
                                />
                            </div>

                            <div>
                                <DatePicker
                                    label="Date"
                                    value={reviewForm.date || ''}
                                    onChange={(date) => onSetReviewForm({ ...reviewForm, date: date })}
                                    placeholder="Select review date"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => onSetReviewForm({ ...reviewForm, rating: star })}
                                            className="focus:outline-none"
                                        >
                                            <Star
                                                size={24}
                                                className={`${star <= (reviewForm.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Notes</label>
                                <textarea
                                    value={reviewForm.notes || ''}
                                    onChange={(e) => onSetReviewForm({ ...reviewForm, notes: e.target.value })}
                                    rows={4}
                                    placeholder="Detailed feedback..."
                                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark resize-none"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                onClick={onCloseReviewModal}
                                className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:text-text-muted-dark dark:hover:text-text-dark"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSaveReview}
                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2"
                            >
                                <Check size={16} /> Save Review
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Promote Modal */}
            {isPromoteOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-text-light dark:text-text-dark flex items-center gap-2">
                                <TrendingUp size={20} className="text-primary" /> Promote Employee
                            </h3>
                            <button onClick={onClosePromote} className="text-text-muted-light hover:text-text-light">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">New Role</label>
                                <Dropdown
                                    value={promoteForm.role}
                                    onChange={(val) => onPromoteFormChange('role', val)}
                                    placeholder="Select new role"
                                    options={[
                                        ...(promoteForm.role && !JOB_TITLES.includes(promoteForm.role as any)
                                            ? [{ value: promoteForm.role, label: promoteForm.role }]
                                            : []),
                                        ...JOB_TITLES.map((t) => ({ value: t, label: t })),
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">New Salary</label>
                                <input
                                    type="number"
                                    value={promoteForm.salary}
                                    onChange={(e) => onPromoteFormChange('salary', e.target.value)}
                                    placeholder="e.g. 85000"
                                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                            <button onClick={onClosePromote} className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:text-text-muted-dark dark:hover:text-text-dark">
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmPromote}
                                disabled={!promoteForm.role}
                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check size={16} /> Confirm Promotion
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Transfer Modal */}
            {isTransferOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-text-light dark:text-text-dark flex items-center gap-2">
                                <ArrowRightLeft size={20} className="text-primary" /> Transfer Employee
                            </h3>
                            <button onClick={onCloseTransfer} className="text-text-muted-light hover:text-text-light">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">New Department</label>
                                <Dropdown
                                    value={transferDepartment}
                                    onChange={onTransferDepartmentChange}
                                    placeholder="Select new department"
                                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                            <button onClick={onCloseTransfer} className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:text-text-muted-dark dark:hover:text-text-dark">
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmTransfer}
                                disabled={!transferDepartment}
                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check size={16} /> Confirm Transfer
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Terminate Confirmation Modal */}
            {isTerminateOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-text-light dark:text-text-dark mb-2">
                                Terminate Employee?
                            </h3>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                                This will mark the employee as terminated and automatically reassign their direct reports to their manager. This action can be reversed by changing status back to Active.
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                            <button onClick={onCloseTerminate} className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:text-text-muted-dark dark:hover:text-text-dark">
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmTerminate}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2"
                            >
                                <AlertTriangle size={16} /> Terminate
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <Trash2 className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-text-light dark:text-text-dark mb-2">
                                Delete Review?
                            </h3>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                                This action cannot be undone. Are you sure you want to delete this performance review?
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                onClick={onCancelDelete}
                                className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:text-text-muted-dark dark:hover:text-text-dark"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmDelete}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
