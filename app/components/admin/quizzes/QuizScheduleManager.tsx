// src/app/components/admin/quizzes/QuizScheduleManager.tsx
'use client';

import React, { useState } from 'react';
import { QuizSlot } from '@/lib/quiz-types';
import { Play, Edit2, RotateCcw, Trash2, Eye, Zap } from 'lucide-react';

interface QuizScheduleManagerProps {
  slots: QuizSlot[];
}

type SlotFilter = 'all' | 'scheduled' | 'live' | 'completed' | 'cancelled';
type SlotStatusKey = 'scheduled' | 'live' | 'completed' | 'cancelled';
type GenStatusKey = 'success' | 'fallback' | 'failed' | 'pending';

export default function QuizScheduleManager({ slots }: QuizScheduleManagerProps) {
  const [filter, setFilter] = useState<SlotFilter>('all');

  const filteredSlots =
    filter === 'all' ? slots : slots.filter((s) => s.status === filter);

  const statusColorMap: Record<SlotStatusKey, string> = {
    scheduled: 'bg-blue-900 text-blue-200',
    live: 'bg-green-900 text-green-200 animate-pulse',
    completed: 'bg-gray-900 text-gray-200',
    cancelled: 'bg-red-900 text-red-200',
  };

  const statusIconMap: Record<SlotStatusKey, string> = {
    scheduled: '📅',
    live: '🔴',
    completed: '✅',
    cancelled: '❌',
  };

  const genStatusIconMap: Record<GenStatusKey, string> = {
    success: '✅',
    fallback: '⚠️',
    failed: '❌',
    pending: '⏳',
  };

  const getStatusColor = (status?: string) => {
    const key = (status as SlotStatusKey) ?? 'scheduled';
    return statusColorMap[key] ?? statusColorMap.scheduled;
  };

  const getStatusIcon = (status?: string) => {
    const key = (status as SlotStatusKey) ?? 'scheduled';
    return statusIconMap[key] ?? statusIconMap.scheduled;
  };

  const getGenStatusIcon = (genStatus?: string) => {
    const key = (genStatus as GenStatusKey) ?? 'pending';
    return genStatusIconMap[key] ?? genStatusIconMap.pending;
  };

  // safe renderer helpers
  const formatDateSafe = (d?: string | Date | null) => {
    if (!d) return 'Unknown';
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return 'Invalid Date';
    return dt.toLocaleDateString('en-IN');
  };

  const safeToUpper = (s?: string) => (typeof s === 'string' ? s.toUpperCase() : 'N/A');

  return (
    <div className="bg-gray-900 border border-yellow-600 border-opacity-20 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">📅 Quiz Schedule Manager</h2>
        <div className="flex gap-2">
          {(['all', 'scheduled', 'live', 'completed', 'cancelled'] as SlotFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                filter === f ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 bg-gray-800">
              <th className="text-left px-4 py-3 font-bold text-yellow-500">SLOT</th>
              <th className="text-left px-4 py-3 font-bold text-yellow-500">DATE</th>
              <th className="text-left px-4 py-3 font-bold text-yellow-500">TIME</th>
              <th className="text-left px-4 py-3 font-bold text-yellow-500">STATUS</th>
              <th className="text-left px-4 py-3 font-bold text-yellow-500">PARTICIPANTS</th>
              <th className="text-left px-4 py-3 font-bold text-yellow-500">QUESTIONS</th>
              <th className="text-left px-4 py-3 font-bold text-yellow-500">AI STATUS</th>
              <th className="text-left px-4 py-3 font-bold text-yellow-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredSlots.map((slot) => {
              // defensive locals
              const scheduledDate = formatDateSafe(slot.scheduledDate);
              const status = slot.status ?? 'scheduled';
              const participants = typeof slot.participants === 'number' ? slot.participants : 0;
              const qGen = slot.questionGeneration ?? {};
              const qMethod = typeof qGen.method === 'string' ? qGen.method : 'unknown';
              const qGenStatus = typeof qGen.status === 'string' ? qGen.status : 'pending';
              const confidenceScore = typeof qGen.confidenceScore === 'number' ? qGen.confidenceScore : undefined;

              return (
                <tr key={slot.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                  <td className="px-4 py-3 text-white font-bold">#{slot.slotNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{scheduledDate}</td>
                  <td className="px-4 py-3 text-gray-300">{slot.startTime ?? '—'} - {slot.endTime ?? '—'}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(status)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(status)}`}>
                        {safeToUpper(status)}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-white font-bold">{participants}</td>

                  <td className="px-4 py-3 text-gray-300">{safeToUpper(qMethod)}</td>

                  <td className="px-4 py-3 flex items-center gap-2">
                    <span>{getGenStatusIcon(qGenStatus)}</span>
                    <span className="text-xs text-gray-400">{qGenStatus}</span>
                    {typeof confidenceScore === 'number' && (
                      <span className="text-xs font-bold text-green-400">{confidenceScore}%</span>
                    )}
                  </td>

                  <td className="px-4 py-3 flex gap-2">
                    {status === 'scheduled' && (
                      <button className="p-2 bg-green-600 hover:bg-green-700 rounded text-white transition" title="Start">
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {status === 'live' && (
                      <button className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition" title="Stop">
                        <Zap className="h-4 w-4" />
                      </button>
                    )}
                    {status === 'cancelled' && (
                      <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition" title="Restore">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}

                    <button className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded text-black transition" title="View">
                      <Eye className="h-4 w-4" />
                    </button>

                    <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {status !== 'cancelled' && (
                      <button className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition" title="Cancel">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Showing {filteredSlots.length} of {slots.length} slots
      </div>
    </div>
  );
}
