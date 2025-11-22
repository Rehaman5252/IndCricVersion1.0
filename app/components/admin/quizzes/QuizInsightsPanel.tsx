'use client';

import React from 'react';
import { QuizInsight } from '@/lib/quiz-types';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface QuizInsightsPanelProps {
  insights: QuizInsight[];
}

// Ensure only known literal keys are allowed
type InsightType = 'success' | 'warning' | 'info';

export default function QuizInsightsPanel({ insights }: QuizInsightsPanelProps) {
  const iconMap: Record<InsightType, JSX.Element> = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />,
  };

  const bgMap: Record<InsightType, string> = {
    success: 'bg-green-950 border-green-700',
    warning: 'bg-yellow-950 border-yellow-700',
    info: 'bg-blue-950 border-blue-700',
  };

  const getIcon = (type: QuizInsight['type']) =>
    iconMap[(type as InsightType) ?? 'info'];

  const getBgColor = (type: QuizInsight['type']) =>
    bgMap[(type as InsightType) ?? 'info'];

  return (
    <div className="bg-gray-900 border border-yellow-600 border-opacity-20 rounded-2xl p-8 shadow-xl">
      <h2 className="text-2xl font-black text-white mb-6">💡 Quiz System Insights</h2>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`border-2 ${getBgColor(
              insight.type
            )} rounded-xl p-4 flex items-start gap-4`}
          >
            <div className="mt-1">{getIcon(insight.type)}</div>

            <div className="flex-1">
              <p className="text-white font-semibold">{insight.message}</p>
              <p className="text-gray-400 text-xs mt-1">
                Metric: {insight.metric ?? 'Unknown'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg border border-purple-700">
        <p className="text-purple-200 text-sm font-semibold mb-2">
          🔬 System Recommendations:
        </p>
        <ul className="text-purple-200 text-xs space-y-1">
          <li>• Refill "IPL Hard" pool – running below 20%</li>
          <li>• Monitor 8 PM slot – 3 consecutive failures</li>
          <li>• Schedule AI model update – confidence score trending down</li>
          <li>• Review fallback logic – 12 uses in 24h is above threshold</li>
        </ul>
      </div>
    </div>
  );
}
