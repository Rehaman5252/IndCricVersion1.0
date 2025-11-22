// app/components/quiz/PreQuizLoader.tsx
'use client';

import { useState, useEffect } from 'react';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { CricketLoading } from '@/components/CricketLoading';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const DURATION = 5000; // 5 seconds
const FACT_INTERVAL = DURATION / 5; // Show 5 facts in total

const getFallbackFacts = (): string[] => [
  "Sir Don Bradman's Test batting average is an incredible 99.94.",
  "The first-ever cricket World Cup was held in 1975 in England.",
  "A 'hat-trick' is when a bowler takes three wickets on three consecutive deliveries.",
  "Jim Laker holds the record for taking 19 wickets in a single Test match.",
  "The longest Test match in history was played between England and South Africa in 1939, lasting 12 days.",
];

interface PreQuizLoaderProps {
  format: string;
  onFinish: () => void;
}

/**
 * Normalize whatever generateCricketFacts returns into string[]
 * Accepts: string[] | Array<{ fact: string; facts?: { fact: string }[]; ... }> | nested structures
 */
function normalizeFacts(input: any): string[] {
  if (!input) return [];
  // If array of strings, return as-is (filter empties)
  if (Array.isArray(input) && input.every((x) => typeof x === 'string')) {
    return (input as string[]).filter(Boolean);
  }

  // If an array of objects, try to extract sensible text fields
  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const item of input) {
      if (!item) continue;
      // common shapes:
      // { fact: string }
      if (typeof item.fact === 'string') {
        out.push(item.fact);
        continue;
      }
      // { facts: [{ fact: string }, ...] } or { facts: string[] }
      if (Array.isArray(item.facts)) {
        for (const f of item.facts) {
          if (!f) continue;
          if (typeof f === 'string') out.push(f);
          else if (typeof f.fact === 'string') out.push(f.fact);
        }
        continue;
      }
      // { originalText, refinedText } etc.
      if (typeof item.refinedText === 'string') {
        out.push(item.refinedText);
        continue;
      }
      if (typeof item.originalText === 'string') {
        out.push(item.originalText);
        continue;
      }
      // fallback: stringified item (last resort)
      if (typeof item === 'object') {
        try {
          const s = JSON.stringify(item);
          if (s && s.length < 200) out.push(s);
        } catch {}
      }
    }
    return out.filter(Boolean);
  }

  // If input is a single object with facts property
  if (typeof input === 'object') {
    if (Array.isArray((input as any).facts)) {
      return normalizeFacts((input as any).facts);
    }
    if (typeof (input as any).fact === 'string') return [(input as any).fact];
    if (typeof (input as any).refinedText === 'string') return [(input as any).refinedText];
  }

  // unknown shape -> empty
  return [];
}

export default function PreQuizLoader({ format, onFinish }: PreQuizLoaderProps) {
  const [facts, setFacts] = useState<string[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadingFacts, setLoadingFacts] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchFacts = async () => {
      try {
        // NOTE: generateCricketFacts expects { context, count } (not { format, count })
        const raw = await generateCricketFacts({ context: format, count: 5 });
        if (!mounted) return;

        const normalized = normalizeFacts(raw);
        if (normalized.length > 0) {
          setFacts(normalized);
        } else {
          setFacts(getFallbackFacts());
        }
      } catch (error) {
        console.error('Failed to fetch facts for pre-loader:', error);
        if (mounted) setFacts(getFallbackFacts());
      } finally {
        if (mounted) setLoadingFacts(false);
      }
    };
    fetchFacts();
    return () => {
      mounted = false;
    };
  }, [format]);

  useEffect(() => {
    if (loadingFacts) return;

    const factTimer = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % (facts.length || 1));
    }, FACT_INTERVAL);

    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(100, p + 100 / (DURATION / 50)));
    }, 50);

    const mainTimer = setTimeout(() => {
      onFinish();
    }, DURATION);

    return () => {
      clearInterval(factTimer);
      clearInterval(progressTimer);
      clearTimeout(mainTimer);
    };
  }, [facts.length, onFinish, loadingFacts]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/50 p-4 text-center">
      <CricketLoading />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
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
              {!loadingFacts && facts.length > 0 && (
                <motion.p
                  key={currentFactIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="text-lg italic text-foreground"
                >
                  "{facts[currentFactIndex]}"
                </motion.p>
              )}
              {!loadingFacts && facts.length === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  No tips available.
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
