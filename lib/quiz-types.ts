// lib/quiz-types.ts

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  format: 'IPL' | 'Test' | 'T20I' | 'ODI' | 'General';
  confidence?: number; // AI confidence score 0-100
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
  isRetired: boolean;
}

export interface QuestionPool {
  id: string;
  format: 'IPL' | 'Test' | 'T20I' | 'ODI' | 'General';
  difficulty: 'easy' | 'medium' | 'hard';
  totalQuestions: number;
  usedThisMonth: number;
  remaining: number;
  retiredQuestions: number;
  lastUpdated: Date;
}

/**
 * Winner record for detailed winner lists
 */
export interface WinnerRecord {
  userId: string;
  username: string;
  score: number;
  rank: number;
  prize: number;
}

/**
 * QuizSlot represents a scheduled/run quiz slot.
 *
 * NOTE:
 * - `winners` is kept as a numeric count to match code that expects a number.
 * - `winnersList` (optional) provides structured winner records when available.
 */
export interface QuizSlot {
  id: string;
  slotNumber: number;
  scheduledDate: Date;
  startTime: string; // "01:00 PM"
  endTime: string; // "01:10 PM"
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  participants: number;

  /**
   * Numeric winners count (keeps compatibility with places expecting a number)
   */
  winners: number;

  /**
   * Optional detailed winner records (use this when you need the actual winner entries)
   */
  winnersList?: WinnerRecord[];

  questionsPerUser: number; // Usually 5
  questionGeneration: {
    method: 'ai' | 'pool' | 'manual';
    status: 'success' | 'fallback' | 'failed' | 'pending';
    aiModel?: string;
    confidenceScore?: number;
    errorMessage?: string;
  };
  questions: Question[];
  userParticipationMapping: {
    userId: string;
    assignedQuestions: string[];
    score: number;
    timestamp: Date;
  }[];
  payoutLocked: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface AIGenerationStatus {
  id: string;
  slotId: string;
  timestamp: Date;
  apiProvider: 'gemini' | 'openai' | 'custom';
  successRate: number;
  averageGenerationTime: number; // ms
  fallbackUsed: number;
  failedAttempts: number;
  errorLog: {
    timestamp: Date;
    error: string;
    retryCount: number;
  }[];
}

export interface UserQuestionsMapping {
  id: string;
  userId: string;
  slotId: string;
  assignedQuestions: {
    questionId: string;
    assignedAt: Date;
  }[];
  neverSeenBefore: boolean; // User hasn't seen these Q before
  dateCreated: Date;
}

export interface QuizInsight {
  message: string;
  type: 'warning' | 'info' | 'success';
  metric: string;
}

export interface QuizAnalytics {
  totalQuizzesAllTime: number;
  plannedToday: number;
  totalParticipantsToday: number;
  totalQuestionsDisplayed: number;
  activeSlots: number;
  failedAIGenerations: number;
}
