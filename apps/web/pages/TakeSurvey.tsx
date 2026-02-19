import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Send, Shield, CheckCircle2 } from 'lucide-react';
import { Toast } from '../components/Toast';
import { useSurveyDetail, useSubmitSurveyResponse } from '../hooks/queries';
import type { SurveyQuestion } from '../types';

// ---------------------------------------------------------------------------
// Category color mapping
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  Workload: 'bg-blue-500',
  Team: 'bg-teal-500',
  Growth: 'bg-purple-500',
  'Work-Life Balance': 'bg-amber-500',
  Management: 'bg-indigo-500',
};

const CATEGORY_BG: Record<string, string> = {
  Workload: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Team: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  Growth: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'Work-Life Balance': 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Management: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
};

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TakeSurvey: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: survey, isLoading } = useSurveyDetail(id);
  const submitMutation = useSubmitSurveyResponse();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success',
  });

  const questions: SurveyQuestion[] = survey?.questions ?? [];
  const total = questions.length;
  const current = questions[currentIndex];
  const answeredCount = Object.keys(ratings).length;
  const allAnswered = answeredCount === total;

  // Group questions by category for the mini-map
  const categoryGroups = useMemo(() => {
    const groups: { category: string; questions: SurveyQuestion[]; startIndex: number }[] = [];
    let lastCategory = '';
    questions.forEach((q, idx) => {
      if (q.category !== lastCategory) {
        groups.push({ category: q.category, questions: [], startIndex: idx });
        lastCategory = q.category;
      }
      groups[groups.length - 1]!.questions.push(q);
    });
    return groups;
  }, [questions]);

  const handleRate = useCallback((rating: number) => {
    if (!current) return;
    setRatings((prev) => ({ ...prev, [current.id]: rating }));
    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentIndex < total - 1) {
        setCurrentIndex((i) => i + 1);
      }
    }, 300);
  }, [current, currentIndex, total]);

  const handleSubmit = async () => {
    if (!survey || !allAnswered) return;
    try {
      await submitMutation.mutateAsync({
        surveyId: survey.id,
        responses: questions.map((q) => ({
          questionId: q.id,
          rating: ratings[q.id]!,
        })),
      });
      setSubmitted(true);
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to submit', type: 'error' });
    }
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-text-muted-light dark:text-text-muted-dark text-sm">Loading survey...</p>
        </div>
      </div>
    );
  }

  // --- Not found / already completed ---
  if (!survey) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">Survey Not Found</h2>
        <button onClick={() => navigate('/surveys')} className="text-primary text-sm hover:underline">Back to Surveys</button>
      </div>
    );
  }

  if (survey.hasCompleted && !submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">Already Completed</h2>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4">You have already submitted your response for this survey.</p>
        <button onClick={() => navigate('/surveys')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors">
          Back to Surveys
        </button>
      </div>
    );
  }

  // --- Success screen ---
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">Thank You!</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark mb-6 max-w-md">
          Your anonymous response has been submitted successfully. Your feedback helps us build a better workplace.
        </p>
        <button onClick={() => navigate('/surveys')} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Back to Surveys
        </button>
      </div>
    );
  }

  // --- Main survey form ---
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/surveys')}
          className="flex items-center gap-1 text-sm text-text-muted-light hover:text-text-light dark:hover:text-text-dark transition-colors mb-3"
        >
          <ChevronLeft size={16} /> Back to Surveys
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark">{survey.title}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <Shield size={14} className="text-primary" />
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
            Your responses are <span className="font-medium text-primary">completely anonymous</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark">
            Question {currentIndex + 1} of {total}
          </span>
          <span className="text-xs font-semibold text-primary">
            {answeredCount}/{total} answered
          </span>
        </div>

        {/* Segmented category progress */}
        <div className="flex gap-1.5 w-full">
          {categoryGroups.map((group) => {
            const groupAnswered = group.questions.filter((q) => ratings[q.id] !== undefined).length;
            const groupTotal = group.questions.length;
            const groupComplete = groupAnswered === groupTotal;
            const groupActive = currentIndex >= group.startIndex && currentIndex < group.startIndex + groupTotal;
            const groupProgress = groupTotal > 0 ? (groupAnswered / groupTotal) * 100 : 0;
            const color = CATEGORY_COLORS[group.category] || 'bg-primary';

            return (
              <button
                key={group.category}
                onClick={() => setCurrentIndex(group.startIndex)}
                className="flex-1 min-w-0 group"
                title={`${group.category} — ${groupAnswered}/${groupTotal}`}
              >
                {/* Bar */}
                <div className={`relative h-2 rounded-full overflow-hidden transition-all duration-200 ${
                  groupActive ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-background-light dark:ring-offset-background-dark' : ''
                } bg-gray-200 dark:bg-gray-700`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${color} ${groupComplete ? 'opacity-100' : 'opacity-75'}`}
                    style={{ width: `${groupProgress}%` }}
                  />
                </div>
                {/* Label */}
                <div className={`mt-1.5 text-[10px] font-medium truncate transition-colors ${
                  groupActive
                    ? 'text-text-light dark:text-text-dark'
                    : 'text-text-muted-light/60 dark:text-text-muted-dark/60 group-hover:text-text-muted-light dark:group-hover:text-text-muted-dark'
                }`}>
                  {group.category}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question card */}
      {current && (
        <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
          {/* Category badge */}
          <div className="px-6 pt-5 pb-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${CATEGORY_BG[current.category] || 'bg-gray-50 text-gray-600'}`}>
              <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[current.category] || 'bg-gray-400'}`} />
              {current.category}
            </span>
          </div>

          {/* Question text */}
          <div className="px-6 py-8">
            <h2 className="text-lg sm:text-xl font-semibold text-text-light dark:text-text-dark leading-relaxed">
              {current.questionText}
            </h2>
          </div>

          {/* Star rating */}
          <div className="px-6 pb-8">
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => {
                const isActive = (ratings[current.id] ?? 0) >= n;
                const isHovered = hoveredStar >= n;
                return (
                  <button
                    key={n}
                    onClick={() => handleRate(n)}
                    onMouseEnter={() => setHoveredStar(n)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={36}
                      className={`transition-colors duration-150 ${
                        isHovered
                          ? 'fill-yellow-300 text-yellow-300'
                          : isActive
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm font-medium text-text-muted-light dark:text-text-muted-dark min-w-[70px]">
                {RATING_LABELS[hoveredStar || ratings[current.id] || 0]}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30 flex justify-between items-center">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-text-muted-light hover:text-text-light dark:hover:text-text-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} /> Previous
            </button>

            {currentIndex === total - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
                {submitMutation.isPending ? 'Submitting...' : 'Submit'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Next <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      )}

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
