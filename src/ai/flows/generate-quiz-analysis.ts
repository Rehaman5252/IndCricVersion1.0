// lib/quiz-data.ts
import {
  Question,
  QuestionPool,
  QuizSlot,
  AIGenerationStatus,
  QuizAnalytics,
  QuizInsight,
  Winner,
} from './quiz-types';

/**
 * Mock analytics overview
 */
export const mockQuizAnalytics: QuizAnalytics = {
  totalQuizzesAllTime: 12584,
  plannedToday: 96,
  totalParticipantsToday: 45210,
  totalQuestionsDisplayed: 1_800_000,
  activeSlots: 5,
  failedAIGenerations: 3,
};

/**
 * Mock question pools
 */
export const mockQuestionPools: QuestionPool[] = [
  {
    id: 'pool_ipl_hard',
    format: 'IPL',
    difficulty: 'hard',
    totalQuestions: 2000,
    usedThisMonth: 310,
    remaining: 1690,
    retiredQuestions: 45,
    lastUpdated: new Date('2025-11-07'),
  },
  {
    id: 'pool_test_medium',
    format: 'Test',
    difficulty: 'medium',
    totalQuestions: 5000,
    usedThisMonth: 2000,
    remaining: 3000,
    retiredQuestions: 120,
    lastUpdated: new Date('2025-11-07'),
  },
  {
    id: 'pool_t20i_easy',
    format: 'T20I',
    difficulty: 'easy',
    totalQuestions: 3000,
    usedThisMonth: 1200,
    remaining: 1800,
    retiredQuestions: 80,
    lastUpdated: new Date('2025-11-07'),
  },
  {
    id: 'pool_odi_medium',
    format: 'ODI',
    difficulty: 'medium',
    totalQuestions: 4000,
    usedThisMonth: 1500,
    remaining: 2500,
    retiredQuestions: 100,
    lastUpdated: new Date('2025-11-07'),
  },
];

/**
 * Mock quiz slots
 * Note: winnersCount (number) and winnersList (structured array) used to avoid duplicate property/type issues.
 */
export const mockQuizSlots: QuizSlot[] = [
  {
    id: 'slot_001',
    slotNumber: 1542,
    scheduledDate: new Date('2025-10-30'),
    startTime: '01:00 PM',
    endTime: '01:10 PM',
    durationMinutes: 10,
    status: 'completed',
    participants: 180,
    winnersCount: 3, // numeric winners count
    questionsPerUser: 5,
    questionGeneration: {
      method: 'ai',
      status: 'success',
      aiModel: 'gemini-2.0',
      confidenceScore: 94.5,
    },
    questions: [] as Question[],
    userParticipationMapping: [] as any[],
    winnersList: [
      { userId: 'u1', username: 'Arjun Singh', score: 5, rank: 1, prize: 8166 },
      { userId: 'u2', username: 'Priya Sharma', score: 4, rank: 2, prize: 5000 },
      { userId: 'u3', username: 'Rajesh Kumar', score: 3, rank: 3, prize: 3334 },
    ],
    payoutLocked: true,
    createdBy: 'admin_001',
    createdAt: new Date('2025-10-29T10:00:00'),
    updatedAt: new Date('2025-10-30T01:15:00'),
    notes: 'AI generation successful. All questions verified.',
  },

  {
    id: 'slot_002',
    slotNumber: 1543,
    scheduledDate: new Date('2025-10-30'),
    startTime: '01:10 PM',
    endTime: '01:20 PM',
    durationMinutes: 10,
    status: 'live',
    participants: 312,
    winnersCount: 0,
    questionsPerUser: 5,
    questionGeneration: {
      method: 'pool',
      status: 'success',
    },
    questions: [] as Question[],
    userParticipationMapping: [] as any[],
    winnersList: [], // empty when none
    payoutLocked: false,
    createdBy: 'admin_001',
    createdAt: new Date('2025-10-29T10:05:00'),
    updatedAt: new Date('2025-10-30T01:10:00'),
    notes: 'Running live. Questions from verified pool.',
  },

  {
    id: 'slot_003',
    slotNumber: 1544,
    scheduledDate: new Date('2025-10-30'),
    startTime: '01:20 PM',
    endTime: '01:30 PM',
    durationMinutes: 10,
    status: 'cancelled',
    participants: 0,
    winnersCount: 0,
    questionsPerUser: 5,
    questionGeneration: {
      method: 'ai',
      status: 'failed',
      errorMessage: 'AI API timeout. Fallback pool exhausted.',
    },
    questions: [] as Question[],
    userParticipationMapping: [] as any[],
    winnersList: [],
    payoutLocked: false,
    createdBy: 'admin_001',
    createdAt: new Date('2025-10-29T10:10:00'),
    updatedAt: new Date('2025-10-30T01:18:00'),
    notes: 'Cancelled due to AI generation failure and pool exhaustion.',
  },

  {
    id: 'slot_004',
    slotNumber: 1545,
    scheduledDate: new Date('2025-10-30'),
    startTime: '03:00 PM',
    endTime: '03:10 PM',
    durationMinutes: 10,
    status: 'scheduled',
    participants: 0,
    winnersCount: 0,
    questionsPerUser: 5,
    questionGeneration: {
      method: 'ai',
      status: 'pending',
    },
    questions: [] as Question[],
    userParticipationMapping: [] as any[],
    winnersList: [],
    payoutLocked: false,
    createdBy: 'admin_001',
    createdAt: new Date('2025-10-29T10:15:00'),
    updatedAt: new Date('2025-10-29T10:15:00'),
    notes: 'Scheduled. AI generation pending.',
  },
];

/**
 * Mock AI generation status logs
 */
export const mockAIGenerationStatus: AIGenerationStatus = {
  id: 'ai_status_001',
  slotId: 'slot_001',
  timestamp: new Date('2025-10-30T01:00:00'),
  apiProvider: 'gemini',
  successRate: 98.3,
  averageGenerationTime: 2450,
  fallbackUsed: 12,
  failedAttempts: 3,
  errorLog: [
    {
      timestamp: new Date('2025-10-30T00:45:00'),
      error: 'API timeout after 30s',
      retryCount: 1,
    },
    {
      timestamp: new Date('2025-10-30T00:50:00'),
      error: 'Invalid JSON response',
      retryCount: 2,
    },
  ],
};

/**
 * Mock quick insights
 */
export const mockQuizInsights: QuizInsight[] = [
  {
    message: '98.3% AI question generation success rate (Last 24h)',
    type: 'success',
    metric: 'AI Success',
  },
  {
    message: 'Question pool "IPL Hard" running low: 1,690 remaining',
    type: 'warning',
    metric: 'Pool Health',
  },
  {
    message: '9:00 PM slot is peak participation time: 95% engagement',
    type: 'info',
    metric: 'Peak Hours',
  },
  {
    message: '12 fallbacks used in last 24h - AI quality score dropping',
    type: 'warning',
    metric: 'Fallbacks',
  },
];
