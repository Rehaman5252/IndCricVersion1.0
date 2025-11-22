// src/app/components/admin/quizzes/QuestionPoolManager.tsx
'use client';

import React, { useState } from 'react';
import { QuestionPool } from '@/lib/quiz-types';
import { Plus, Edit2, AlertTriangle } from 'lucide-react';

interface QuestionPoolManagerProps {
  pools: QuestionPool[];
}

export default function QuestionPoolManager({ pools }: QuestionPoolManagerProps) {
  const [expandedPool, setExpandedPool] = useState<string | null>(null);

  // Accept possibly-undefined inputs, return safe result
  const getPoolHealth = (remaining: number, total: number) => {
    const safeTotal = total > 0 ? total : 1; // avoid divide-by-zero
    const percentage = (remaining / safeTotal) * 100;
    if (percentage >= 50) return { color: 'from-green-600 to-green-700', label: 'Healthy', percentage };
    if (percentage >= 30) return { color: 'from-yellow-600 to-yellow-700', label: 'Caution', percentage };
    return { color: 'from-red-600 to-red-700', label: 'Critical', percentage };
  };

  return (
    <div className="bg-gray-900 border border-yellow-600 border-opacity-20 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">🧠 Question Pool Manager (Backup System)</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition">
          <Plus className="h-5 w-5" />
          Add Pool
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pools.map((pool) => {
          // Provide safe defaults for possibly undefined fields
          const remainingNum = typeof pool.remaining === 'number' ? pool.remaining : 0;
          const totalNum = typeof pool.totalQuestions === 'number' ? pool.totalQuestions : 0;
          const usedThisMonthNum = typeof pool.usedThisMonth === 'number' ? pool.usedThisMonth : 0;
          const retiredQuestionsNum = typeof pool.retiredQuestions === 'number' ? pool.retiredQuestions : 0;

          const health = getPoolHealth(remainingNum, totalNum);
          // health.percentage comes from getPoolHealth which already clamps divide-by-zero
          const percentage = Math.max(0, Math.min(100, health.percentage ?? 0));
          const isLowHealth = percentage < 30;

          // Make difficulty safe to use
          const difficultyLabel = typeof pool.difficulty === 'string' ? pool.difficulty.toUpperCase() : 'N/A';

          // Normalize lastUpdated to Date or null
          const lastUpdatedDate =
            pool.lastUpdated instanceof Date
              ? pool.lastUpdated
              : typeof pool.lastUpdated === 'string' && pool.lastUpdated
              ? new Date(pool.lastUpdated)
              : null;

          const lastUpdatedStr = lastUpdatedDate ? lastUpdatedDate.toLocaleDateString() : 'Unknown';

          return (
            <div
              key={pool.id}
              className={`bg-gradient-to-br ${health.color} rounded-2xl p-6 shadow-lg border-2 border-opacity-20 border-white hover:shadow-2xl transition-all cursor-pointer ${
                isLowHealth ? 'ring-2 ring-red-500' : ''
              }`}
              onClick={() => setExpandedPool(expandedPool === pool.id ? null : pool.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-lg">{pool.format}</p>
                  <p className="text-white text-sm opacity-90">{difficultyLabel}</p>
                </div>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-white text-xs font-bold">
                  {health.label}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Total Questions</span>
                  <span className="text-white font-black text-xl">{(totalNum || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Used (This Month)</span>
                  <span className="text-white font-black">{usedThisMonthNum.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Remaining</span>
                  <span className={`font-black text-lg ${isLowHealth ? 'text-red-300' : 'text-green-300'}`}>
                    {remainingNum.toLocaleString()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-white h-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                {isLowHealth && (
                  <div className="flex items-center gap-2 text-red-300 text-sm mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>⚠️ Pool running low - refill recommended</span>
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {expandedPool === pool.id && (
                <div className="mt-4 pt-4 border-t border-white border-opacity-20 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white opacity-90">Retired Questions</span>
                    <span className="text-white font-bold">{retiredQuestionsNum}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white opacity-90">Last Updated</span>
                    <span className="text-white font-mono text-xs">{lastUpdatedStr}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded font-bold text-sm transition">
                      <Edit2 className="inline-block mr-2 h-4 w-4" /> Edit
                    </button>
                    <button className="flex-1 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded font-bold text-sm transition">
                      Refill
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
