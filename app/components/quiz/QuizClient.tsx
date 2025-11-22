// app/components/quiz/QuizClient.tsx
'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from 'react';
import QuizView from '@/components/quiz/QuizView';
import { getAuth } from 'firebase/auth';
import { AdDialog } from '@/components/AdDialog';
import { getInterstitialAdForSlot } from '@/lib/ads';
import { getAdBySlot } from '@/lib/ad-service';
import { CricketLoading } from '@/components/CricketLoading';
import { motion } from 'framer-motion';
import type { QuizQuestion } from '@/ai/schemas';

interface QuizClientProps {
  brand: string;
  format: string;
}

interface QuizData {
  questions: QuizQuestion[];
  title?: string;
  description?: string;
}

type QuizState = 'loading' | 'playing' | 'answered' | 'loading-next' | 'completed';

// local fallback asset uploaded during debugging — used as last-resort ad URL
const LOCAL_FALLBACK_AD = '/mnt/data/cc6c0ab7-1085-4ed4-92e6-5716728b9feb.png';

/**
 * Lightweight fallback summary (rendered when real QuizSummary module is missing).
 */
function FallbackQuizSummary({
  quizData,
  userAnswers,
  brand,
  format,
  score,
  totalQuestions,
}: {
  quizData: QuizData;
  userAnswers: (string | null)[];
  brand: string;
  format: string;
  score: number;
  totalQuestions: number;
}) {
  return (
    <div className="bg-card/80 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold">{quizData?.title ?? 'Quiz Results'}</h2>
      {quizData?.description && <p className="text-sm text-muted-foreground mt-1">{quizData.description}</p>}

      <div className="mt-4">
        <p className="text-lg font-semibold">Score: {score}/{totalQuestions}</p>
        <p className="text-sm text-gray-400 mt-2">Brand: {brand} • Format: {format}</p>
      </div>

      <div className="mt-6 space-y-3 text-sm">
        {quizData?.questions?.map((q, i) => (
          <div key={(q as any).id ?? i} className="p-3 rounded bg-gray-800/40">
            <div className="font-medium">{i + 1}. {q.question}</div>
            <div className="mt-1">
              Your answer: <span className="font-semibold">{userAnswers[i] ?? '—'}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Correct: {q.correctAnswer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuizClient({ brand, format }: QuizClientProps) {
  const auth = getAuth();

  const [userId, setUserId] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  const [showBetweenQuestionAd, setShowBetweenQuestionAd] = useState(false);
  const [currentInterstitialConfig, setCurrentInterstitialConfig] = useState<any | null>(null);

  const [showAfterQuizAd, setShowAfterQuizAd] = useState(false);
  const [afterQuizAd, setAfterQuizAd] = useState<any | null>(null);

  // timers as numbers (returned by window.setTimeout)
  const adTimerRef = useRef<number | null>(null);
  const questionTimerRef = useRef<number | null>(null);
  const adFetchedForIndexRef = useRef<number | null>(null);

  // dynamic QuizSummary loader with runtime fallback
  const [QuizSummaryComp, setQuizSummaryComp] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    let mounted = true;
    // Tell TS to ignore compile-time resolution of this optional module.
    // At runtime we'll attempt to import it, and fallback if missing.
    // @ts-ignore
    import('@/components/quiz/QuizSummary')
      .then((mod) => {
        if (mounted && mod && mod.default) setQuizSummaryComp(() => mod.default);
      })
      .catch(() => {
        if (mounted) setQuizSummaryComp(() => FallbackQuizSummary);
      });
    return () => { mounted = false; };
  }, []);

  const getBetweenQuestionAdSlot = useCallback((qIndex: number): string | null => {
    if (qIndex === 1) return 'Q1_Q2';
    if (qIndex === 2) return 'Q2_Q3';
    if (qIndex === 3) return 'Q3_Q4';
    if (qIndex === 4) return 'Q4_Q5';
    return null;
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.uid) setUserId(user.uid);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const initializeQuiz = async () => {
      if (!userId) return;
      try {
        setQuizState('loading');
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/quiz?brand=${encodeURIComponent(brand)}&format=${encodeURIComponent(format)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch quiz');
        const data = await res.json();
        if (!data.questions || data.questions.length === 0) throw new Error('No questions');
        setQuizData(data);
        setUserAnswers(Array(data.questions.length).fill(null));
        setQuizState('playing');
      } catch (err) {
        console.error('initializeQuiz error', err);
        setQuizState('completed'); // degrade into completed so user can see fallback UI
      }
    };
    if (userId) initializeQuiz();
  }, [userId, brand, format, auth]);

  const continueToNextQuestion = useCallback(() => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    if (adTimerRef.current) window.clearTimeout(adTimerRef.current);
    if (questionTimerRef.current) window.clearTimeout(questionTimerRef.current);

    if (nextQuestionIndex < (quizData?.questions?.length ?? 0)) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setSelectedOption(null);
      setQuizState('playing');
      setShowBetweenQuestionAd(false);
      setCurrentInterstitialConfig(null);
    } else {
      setQuizState('completed');
      setShowBetweenQuestionAd(false);
      setCurrentInterstitialConfig(null);
      if (userId) fetchAfterQuizAd();
    }
  }, [currentQuestionIndex, quizData, userId]);

  const proceedAfterAnswer = useCallback(async () => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    const adSlot = getBetweenQuestionAdSlot(nextQuestionIndex);

    if (adSlot && nextQuestionIndex < (quizData?.questions?.length ?? 0)) {
      if (adFetchedForIndexRef.current !== nextQuestionIndex) {
        try {
          const interstitialConfig = await getInterstitialAdForSlot(adSlot as any);
          if (interstitialConfig) {
            setCurrentInterstitialConfig(interstitialConfig);
            adFetchedForIndexRef.current = nextQuestionIndex;
            setShowBetweenQuestionAd(true);
            setQuizState('loading-next');

            adTimerRef.current = window.setTimeout(() => {
              continueToNextQuestion();
            }, interstitialConfig.durationMs ?? (interstitialConfig.durationSec ? interstitialConfig.durationSec * 1000 : 10000));
            return;
          } else {
            adFetchedForIndexRef.current = nextQuestionIndex;
            continueToNextQuestion();
            return;
          }
        } catch (err) {
          console.error('proceedAfterAnswer - ad fetch error', err);
          adFetchedForIndexRef.current = nextQuestionIndex;
          continueToNextQuestion();
          return;
        }
      } else {
        if (currentInterstitialConfig) {
          setShowBetweenQuestionAd(true);
          setQuizState('loading-next');
          adTimerRef.current = window.setTimeout(() => {
            continueToNextQuestion();
          }, currentInterstitialConfig.durationMs ?? 10000);
          return;
        } else {
          continueToNextQuestion();
          return;
        }
      }
    } else {
      continueToNextQuestion();
    }
  }, [currentQuestionIndex, quizData, getBetweenQuestionAdSlot, currentInterstitialConfig, continueToNextQuestion]);

  const handleAnswer = useCallback(async (answer: string) => {
    if (quizState !== 'playing' || !quizData) return;
    setSelectedOption(answer);

    setUserAnswers(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] = answer;
      return copy;
    });

    setQuizState('answered');

    const currentQuestion = quizData.questions[currentQuestionIndex];
    if (answer !== 'no-ball' && currentQuestion.correctAnswer === answer) {
      setQuizScore(prev => prev + 1);
    }

    questionTimerRef.current = window.setTimeout(() => {
      proceedAfterAnswer();
    }, 1500);
  }, [currentQuestionIndex, quizState, quizData, proceedAfterAnswer]);

  const handleNoBall = useCallback(() => {
    handleAnswer('no-ball');
  }, [handleAnswer]);

  const handleHintRequest = useCallback(async () => 'Hint', []);

  const fetchAfterQuizAd = useCallback(async () => {
    try {
      const ad = await getAdBySlot('AfterQuiz');
      if (ad) {
        setAfterQuizAd(ad);
        setShowAfterQuizAd(true);
      }
    } catch (err) {
      console.error('fetchAfterQuizAd error', err);
    }
  }, []);

  const handleAfterQuizAdFinished = useCallback(() => {
    setShowAfterQuizAd(false);
    setAfterQuizAd(null);
  }, []);

  useEffect(() => {
    return () => {
      if (adTimerRef.current) window.clearTimeout(adTimerRef.current);
      if (questionTimerRef.current) window.clearTimeout(questionTimerRef.current);
    };
  }, []);

  // early loading state
  if (authLoading || quizState === 'loading' || !quizData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <CricketLoading />
        <p className="text-gray-400 text-sm">Loading quiz...</p>
      </div>
    );
  }

  // between-question static interstitial
  if (showBetweenQuestionAd && currentInterstitialConfig) {
    if (currentInterstitialConfig.type === 'static' && currentInterstitialConfig.logoUrl) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-3">
            <h2 className="text-lg font-bold text-white">Quick Break!</h2>
            <p className="text-gray-400 text-sm">{currentInterstitialConfig.logoHint ?? 'Featured sponsor'}</p>
          </div>

          <img src={currentInterstitialConfig.logoUrl || LOCAL_FALLBACK_AD} alt="Ad" className="h-56 w-full rounded-lg shadow-lg object-cover" />

          <p className="text-center text-gray-500 text-xs">Loading next question...</p>
        </motion.div>
      );
    }

    if (currentInterstitialConfig.type === 'video' && currentInterstitialConfig.videoUrl) {
      return (
        <AdDialog
          open={true}
          onOpenChange={() => {}}
          onAdFinished={() => continueToNextQuestion()}
          duration={currentInterstitialConfig.durationSec ?? 10}
          skippableAfter={currentInterstitialConfig.skippableAfterSec ?? 10}
          adTitle={currentInterstitialConfig.videoTitle ?? 'Advertisement'}
          adType="video"
          adUrl={currentInterstitialConfig.videoUrl}
        />
      );
    }
  }

  // playing state: show quiz view
  if (quizState === 'playing' && quizData) {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto px-4 py-8">
        <QuizView
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={quizData.questions.length}
          onAnswer={handleAnswer}
          onNoBall={handleNoBall}
          brand={brand}
          format={format}
          onHintRequest={handleHintRequest}
          hint={null}
          isHintLoading={false}
          soundEnabled={false}
          quizSource="fallback"
        />
      </motion.div>
    );
  }

  // completed: show after-quiz ad (if any) and summary
  if (quizState === 'completed') {
    const Summary = QuizSummaryComp ?? FallbackQuizSummary;
    return (
      <div className="space-y-8 max-w-4xl mx-auto px-4 py-8">
        {showAfterQuizAd && afterQuizAd && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdDialog
              open={showAfterQuizAd}
              onOpenChange={(open) => {
                if (!open) handleAfterQuizAdFinished();
              }}
              onAdFinished={handleAfterQuizAdFinished}
              duration={afterQuizAd?.duration ?? 15}
              skippableAfter={afterQuizAd?.skippableAfter ?? 15}
              adTitle={afterQuizAd?.companyName ?? 'Sponsored'}
              adType={afterQuizAd?.adType === 'video' ? 'video' : 'image'}
              adUrl={afterQuizAd?.mediaUrl ?? LOCAL_FALLBACK_AD}
              // adHint may not exist in DB schema — prefer companyName
              adHint={(afterQuizAd as any)?.hint ?? afterQuizAd?.companyName}
            >
              <p className="text-xs text-muted-foreground mt-2">Watch this ad to view your results.</p>
            </AdDialog>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Suspense fallback={<FallbackQuizSummary quizData={quizData} userAnswers={userAnswers} brand={brand} format={format} score={quizScore} totalQuestions={quizData.questions.length} />}>
            <Summary
              quizData={quizData}
              userAnswers={userAnswers}
              brand={brand}
              format={format}
              score={quizScore}
              totalQuestions={quizData.questions.length}
            />
          </Suspense>
        </motion.div>
      </div>
    );
  }

  return null;
}
