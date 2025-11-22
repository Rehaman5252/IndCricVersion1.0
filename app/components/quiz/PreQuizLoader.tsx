// app/components/quiz/PreQuizLoader.tsx
'use client';

import { useState, useEffect } from 'react';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { CricketLoading } from '@/components/CricketLoading';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const DURATION = 5000; // total pre-quiz duration in ms
const DEFAULT_FACT_COUNT = 5; // how many facts to show during the loader

const getFallbackFacts = (): string[] => [
  "Sir Don Bradman's Test batting average is an incredible 99.94.",
  "The first-ever cricket World Cup was held in 1975 in England.",
  "A 'hat-trick' is when a bowler takes three wickets on three consecutive deliveries.",
  "Jim Laker holds the record for taking 19 wickets in a single Test match.",
  "The longest Test match in history was played between England and South Africa in 1939, lasting 12 days."
];

interface PreQuizLoaderProps {
  format?: string; // optional string describing format (T20/IPL/ODI/etc.)
  onFinish: () => void;
}

export default function PreQuizLoader({ format, onFinish }: PreQuizLoaderProps) {
  const [facts, setFacts] = useState<string[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadingFacts, setLoadingFacts] = useState(true);

  // normalize whatever shape generateCricketFacts returns into string[]
  const normalizeFacts = (raw: unknown): string[] => {
    try {
      if (!raw) return [];
      // case: array of strings
      if (Array.isArray(raw) && raw.length && typeof raw[0] === 'string') {
        return raw as string[];
      }
      // case: array of objects like { fact: string, category?: string }
      if (Array.isArray(raw) && raw.length && typeof raw[0] === 'object' && raw[0] !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr = raw as any[];
        const mapped = arr.map(item => item?.fact ?? (typeof item === 'string' ? item : '')).filter(Boolean);
        return mapped.length ? mapped : [];
      }
      // case: object with .facts property { facts: [{ fact: '...' }, ...] }
      if (typeof raw === 'object' && raw !== null && (raw as any).facts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyRaw = raw as any;
        if (Array.isArray(anyRaw.facts)) {
          const mapped = anyRaw.facts.map((f: any) => f?.fact ?? (typeof f === 'string' ? f : '')).filter(Boolean);
          return mapped.length ? mapped : [];
        }
      }
    } catch (e) {
      // defensive
      console.warn('normalizeFacts error', e);
    }
    return [];
  };

  useEffect(() => {
    let mounted = true;
    const fetchFacts = async () => {
      setLoadingFacts(true);
      try {
        // many of your flows expect an object like { context, count }
        const raw = await generateCricketFacts({ context: format ?? 'general', count: DEFAULT_FACT_COUNT });
        const normalized = normalizeFacts(raw);
        if (mounted) {
          setFacts(normalized.length ? normalized : getFallbackFacts());
        }
      } catch (err) {
        console.error('Failed to fetch facts for pre-loader:', err);
        if (mounted) setFacts(getFallbackFacts());
      } finally {
        if (mounted) setLoadingFacts(false);
      }
    };
    fetchFacts();
    return () => { mounted = false; };
  }, [format]);

  useEffect(() => {
    if (loadingFacts) return;

    // ensure we have at least one fact to display
    const factList = facts.length ? facts : getFallbackFacts();
    const count = factList.length || 1;
    const factInterval = Math.max(500, Math.floor(DURATION / count));

    // rotate facts
    const factTimer = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % factList.length);
    }, factInterval);

    // progress updater
    const progressStepMs = 50; // update every 50ms
    const steps = Math.ceil(DURATION / progressStepMs);
    let step = 0;
    const progressTimer = setInterval(() => {
      step += 1;
      setProgress(Math.min(100, Math.round((step / steps) * 100)));
    }, progressStepMs);

    // finish timer
    const finishTimer = setTimeout(() => {
      setProgress(100);
      onFinish();
    }, DURATION);

    return () => {
      clearInterval(factTimer);
      clearInterval(progressTimer);
      clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facts, loadingFacts, onFinish]);

  const displayFacts = facts.length ? facts : getFallbackFacts();
  const shownFact = displayFacts[currentFactIndex % displayFacts.length] ?? '';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/50 p-4 text-center">
      <CricketLoading />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
      >
        <h2 className="text-2xl font-bold text-foreground mt-4">Getting the Pitch Ready...</h2>
        <p className="text-muted-foreground mt-2 mb-6">Here are some tips to get you warmed up!</p>
      </motion.div>

      <Card className="w-full max-w-lg bg-card/50 shadow-lg border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lightbulb className="text-primary h-5 w-5" />
            <h3 className="font-semibold text-primary">Pre-Quiz Tip</h3>
          </div>
          <div className="h-24 w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!loadingFacts && displayFacts.length > 0 && (
                <motion.p
                  key={currentFactIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="text-lg italic text-foreground"
                >
                  &quot;{shownFact}&quot;
                </motion.p>
              )}
              {loadingFacts && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg italic text-foreground"
                >
                  Loading tips...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Progress value={progress} className="w-full max-w-sm mt-8 h-2" />
    </div>
  );
}
