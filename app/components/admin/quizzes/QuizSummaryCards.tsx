'use client';

import React from 'react';
import { QuizAnalytics } from '@/lib/quiz-types';

interface QuizSummaryCardsProps {
  analytics: QuizAnalytics;
}

export default function QuizSummaryCards({ analytics }: QuizSummaryCardsProps) {
  const safeNumber = (value: number | undefined) =>
    (value ?? 0).toLocaleString();

  const cards = [
    {
      title: 'Total Quizzes',
      value: safeNumber(analytics.totalQuizzesAllTime),
      icon: '❓',
      color: 'from-purple-600 to-purple-700',
      description: 'All-time quizzes',
    },
    {
      title: 'Planned Today',
      value: safeNumber(analytics.plannedToday),
      icon: '📅',
      color: 'from-blue-600 to-blue-700',
      description: 'Scheduled slots',
    },
    {
      title: 'Total Participants',
      value: safeNumber(analytics.totalParticipantsToday),
      icon: '👥',
      color: 'from-green-600 to-green-700',
      description: 'Playing today',
    },
    {
      title: 'Questions Displayed',
      value:
        ((analytics.totalQuestionsDisplayed ?? 0) / 1_000_000).toFixed(1) + 'M',
      icon: '📊',
      color: 'from-yellow-600 to-yellow-700',
      description: 'All-time total',
    },
    {
      title: 'Active Slots',
      value: safeNumber(analytics.activeSlots),
      icon: '🔴',
      color: 'from-red-600 to-red-700',
      description: 'Running now',
    },
    {
      title: 'Failed AI Gen',
      value: safeNumber(analytics.failedAIGenerations),
      icon: '⚠️',
      color: 'from-orange-600 to-orange-700',
      isCritical: true,
      description: 'Last 24h',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 shadow-xl border border-opacity-20 border-white hover:shadow-2xl transition-all ${
            card.isCritical ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white text-sm font-semibold opacity-90">
                {card.title}
              </p>
              <p className="text-gray-200 text-xs mt-1">{card.description}</p>
            </div>
            <span className="text-3xl">{card.icon}</span>
          </div>

          <p className="text-4xl font-black text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
