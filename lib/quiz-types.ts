// src/lib/quiz-types.ts
export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionFormat = string;

export interface Question {
  id: string;
  poolId?: string;
  format: QuestionFormat;
  difficulty?: Difficulty;
  question: string;
  options?: string[];
  answerIndex?: number;
  explanation?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  retired?: boolean;
  metadata?: Record<string, any>;
}

export interface QuestionPool {
  id: string;
  format: QuestionFormat;
  difficulty?: Difficulty;
  totalQuestions: number;
  usedThisMonth?: number;
  remaining?: number;
  retiredQuestions?: number;
  lastUpdated?: Date | string;
  notes?: string;
}

export interface Winner {
  userId: string;
  username?: string;
  score?: number;
  rank?: number;
  prize?: number;
  awardedAt?: Date | string;
}

/** Small insight shape for admin dashboards */
export interface QuizInsight {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | string;
  metric?: string;
  value?: number | string;
  timestamp?: Date | string;
}

export interface QuizAnalytics {
  totalQuizzesAllTime?: number;
  plannedToday?: number;
  totalParticipantsToday?: number;
  totalQuestionsDisplayed?: number;
  activeSlots?: number;
  failedAIGenerations?: number;
  [k: string]: any;
}

export interface AIGenerationStatus {
  id: string;
  slotId?: string;
  timestamp?: Date | string;
  apiProvider?: string;
  successRate?: number; // percentage 0-100
  averageGenerationTime?: number; // ms
  fallbackUsed?: number;
  failedAttempts?: number;
  errorLog?: Array<{
    timestamp?: Date | string;
    error: string;
    retryCount?: number;
  }>;
  notes?: string;
}

export type QuizSlotStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'paused' | string;

export interface QuizSlot {
  id: string;
  slotNumber?: number;
  scheduledDate?: Date | string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  status?: QuizSlotStatus;
  participants?: number;

  /**
   * Numeric winners count — matches the usage in your mock data (winners: 3).
   * Keep this for quick checks (and to avoid changing many data files).
   */
  winners?: number;

  /**
   * Optional more-structured winner list (full objects).
   * Use either `winners` (count) or `winnersList` (object array) depending on context.
   */
  winnersList?: Winner[];

  /** Backwards-compatible alias some code might expect */
  winnersCount?: number;

  questionsPerUser?: number;
  questionGeneration?: {
    method?: 'ai' | 'pool' | string;
    status?: 'pending' | 'success' | 'failed' | string;
    aiModel?: string;
    confidenceScore?: number;
    errorMessage?: string;
    [k: string]: any;
  };
  questions?: Question[];
  userParticipationMapping?: Array<Record<string, any>>;
  payoutLocked?: boolean;
  createdBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  notes?: string;
}
