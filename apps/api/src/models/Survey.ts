export const SURVEY_CATEGORIES = [
  'Workload',
  'Team',
  'Growth',
  'Work-Life Balance',
  'Management',
  'Communication',
  'Teamwork',
  'Problem Solving',
  'Time Management',
  'Adaptability',
  'Technical Skills',
  'Innovation & Learning',
  'Quality & Responsibility',
  'Blueprint',
  'Action',
  'Nurturing',
  'Knowledge',
] as const;

export type SurveyCategory = (typeof SURVEY_CATEGORIES)[number];

export interface CreateSurveyQuestion {
  questionText: string;
  category: SurveyCategory;
  sortOrder: number;
}

export interface CreateSurveyRequest {
  title: string;
  questions: CreateSurveyQuestion[];
  allowRetake?: boolean;
}

export interface SubmitSurveyResponse {
  questionId: string;
  rating: number;
}

export interface SubmitSurveyRequest {
  responses: SubmitSurveyResponse[];
}

export interface SurveyQuestion {
  id: string;
  questionText: string;
  category: SurveyCategory;
  sortOrder: number;
}

export interface SurveyListItem {
  id: string;
  title: string;
  status: 'active' | 'closed';
  allowRetake: boolean;
  createdAt: string;
  closedAt: string | null;
  questionCount: number;
  responseCount: number;
  hasCompleted: boolean;
}

export interface SurveyDetail {
  id: string;
  title: string;
  status: 'active' | 'closed';
  allowRetake: boolean;
  createdAt: string;
  closedAt: string | null;
  questions: SurveyQuestion[];
  hasCompleted: boolean;
}

export interface CategoryScore {
  category: string;
  score: number;
  responseCount: number;
}

export interface SentimentDistribution {
  positive: number; // % of ratings 4-5
  neutral: number;  // % of rating 3
  negative: number; // % of ratings 1-2
}

export interface SentimentOverview {
  overallScore: number;
  responseRate: number;
  totalResponses: number;
  totalEmployees: number;
  categoryBreakdown: CategoryScore[];
  distribution: SentimentDistribution;
}
