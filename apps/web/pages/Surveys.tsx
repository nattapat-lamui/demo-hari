import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Check, Trash2, Lock, Unlock,
  MessageSquare, CheckCircle2, BarChart3, ClipboardList, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Dropdown } from '../components/Dropdown';
import { Toast } from '../components/Toast';
import {
  useSurveyList,
  useCreateSurvey,
  useCloseSurvey,
  useReopenSurvey,
  useDeleteSurvey,
} from '../hooks/queries';
import type { SurveyCategory } from '../types';

const SURVEY_CATEGORIES: SurveyCategory[] = [
  'Workload', 'Team', 'Growth', 'Work-Life Balance', 'Management',
];

const categoryOptions = SURVEY_CATEGORIES.map((c) => ({ value: c, label: c }));

// ---------------------------------------------------------------------------
// Create Survey Modal (Admin)
// ---------------------------------------------------------------------------

interface QuestionDraft {
  questionText: string;
  category: SurveyCategory;
}

const CreateSurveyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}> = ({ isOpen, onClose, onCreated }) => {
  const createMutation = useCreateSurvey();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { questionText: '', category: 'Workload' },
  ]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { questionText: '', category: 'Workload' }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof QuestionDraft, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const validQuestions = questions.filter((q) => q.questionText.trim());
    if (validQuestions.length === 0) return;

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        questions: validQuestions.map((q, i) => ({
          questionText: q.questionText.trim(),
          category: q.category,
          sortOrder: i,
        })),
      });
      setTitle('');
      setQuestions([{ questionText: '', category: 'Workload' }]);
      onCreated();
      onClose();
    } catch {
      // error handled by toast in parent
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-lg text-text-light dark:text-text-dark">Create New Survey</h3>
          <button onClick={onClose} className="text-text-muted-light hover:text-text-light"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Survey Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q1 2026 Employee Pulse"
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-light dark:text-text-dark">Questions</label>
              <button
                type="button"
                onClick={addQuestion}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => updateQuestion(idx, 'questionText', e.target.value)}
                      placeholder={`Question ${idx + 1}`}
                      className="w-full px-3 py-1.5 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                    />
                    <Dropdown
                      options={categoryOptions}
                      value={q.category}
                      onChange={(val) => updateQuestion(idx, 'category', val)}
                      placeholder="Category"
                    />
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="p-1.5 text-text-muted-light hover:text-red-500 transition-colors mt-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light">Cancel</button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
            >
              <Check size={16} /> {createMutation.isPending ? 'Creating...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ---------------------------------------------------------------------------
// Main Surveys Page
// ---------------------------------------------------------------------------

export const Surveys: React.FC = () => {
  const { user, isAdminView } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAdminView;
  const { data: surveys = [], isLoading } = useSurveyList();
  const closeMutation = useCloseSurvey();
  const reopenMutation = useReopenSurvey();
  const deleteMutation = useDeleteSurvey();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    show: false, message: '', type: 'success',
  });
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleClose = async (id: string) => {
    try {
      await closeMutation.mutateAsync(id);
      showToast('Survey closed successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to close survey', 'error');
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await reopenMutation.mutateAsync(id);
      showToast('Survey reopened successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to reopen survey', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      showToast('Survey deleted successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete survey', 'error');
    }
  };

  const activeSurveys = surveys.filter((s) => s.status === 'active');
  const closedSurveys = surveys.filter((s) => s.status === 'closed');

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-light dark:text-text-dark">Surveys & Feedback</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
            {isAdmin ? 'Create and manage employee surveys.' : 'Share your voice to help improve our workplace.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg text-sm shadow-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
          >
            <Plus size={18} /> Create Survey
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="text-center py-12 text-text-muted-light">Loading surveys...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardList size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-1">No Surveys Yet</h3>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
            {isAdmin ? 'Create your first survey to start collecting feedback.' : 'No surveys available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Surveys */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border-light dark:border-border-dark bg-primary/5">
              <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                Active Surveys
                <span className="ml-auto text-xs font-normal text-text-muted-light bg-background-light dark:bg-background-dark px-2 py-0.5 rounded-full">
                  {activeSurveys.length}
                </span>
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {activeSurveys.length === 0 ? (
                <p className="text-text-muted-light text-center py-4 text-sm">No active surveys.</p>
              ) : (
                activeSurveys.map((survey) => (
                  <div key={survey.id} className="flex justify-between items-center p-4 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="font-semibold text-text-light dark:text-text-dark text-sm truncate">{survey.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-text-muted-light mt-1">
                        <span>{survey.questionCount} questions</span>
                        <span>·</span>
                        <span>{survey.responseCount} responses</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {survey.hasCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          <CheckCircle2 size={12} /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/surveys/${survey.id}`)}
                          className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                        >
                          Take Survey <ArrowRight size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleClose(survey.id)}
                            className="p-1.5 text-text-muted-light hover:text-accent-orange transition-colors"
                            title="Close survey"
                          >
                            <Lock size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(survey.id)}
                            className="p-1.5 text-text-muted-light hover:text-red-500 transition-colors"
                            title="Delete survey"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Closed / History */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                <BarChart3 size={20} className="text-text-muted-light" />
                Closed Surveys
                <span className="ml-auto text-xs font-normal text-text-muted-light bg-background-light dark:bg-background-dark px-2 py-0.5 rounded-full">
                  {closedSurveys.length}
                </span>
              </h2>
            </div>
            {closedSurveys.length === 0 ? (
              <div className="p-5 text-center text-sm text-text-muted-light">No closed surveys yet.</div>
            ) : (
              <div className="divide-y divide-border-light dark:divide-border-dark">
                {closedSurveys.map((survey) => (
                  <div key={survey.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="font-medium text-text-light dark:text-text-dark text-sm truncate">{survey.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-text-muted-light mt-0.5">
                        <span>{survey.responseCount} responses</span>
                        {survey.closedAt && (
                          <>
                            <span>·</span>
                            <span>Closed {new Date(survey.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleReopen(survey.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                            title="Reopen survey"
                          >
                            <Unlock size={12} /> Reopen
                          </button>
                          <button
                            onClick={() => handleDelete(survey.id)}
                            className="p-1.5 text-text-muted-light hover:text-red-500 transition-colors"
                            title="Delete survey"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          <Lock size={12} /> Closed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Survey Modal */}
      <CreateSurveyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => showToast('Survey created successfully!')}
      />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
};
