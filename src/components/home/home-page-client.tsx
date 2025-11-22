// src/components/home/home-page-client.tsx
'use client';

import React, { memo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { useToast } from '@/hooks/use-toast';
import { encodeAttempt } from '@/lib/quiz-utils';
import { brandData } from '@/components/home/brandData';
import type { CubeBrand } from '@/components/home/brandData';

/**
 * Dynamic loaders return a module-like object: { default: Component }
 * This keeps next/dynamic + TypeScript happy and preserves prop typing.
 */

/* CricketFact props */
type CricketFactProps = { format?: string };

/* HomeClientContent props */
type HomeClientContentProps = {
  selectedBrand: CubeBrand;
  setSelectedBrand: (b: CubeBrand) => void;
  handleStartQuiz: (b?: CubeBrand) => void;
};

/* StartQuizButton props */
type StartQuizButtonProps = {
  brandFormat?: string; // The error suggests this should be string | undefined, but 'format' is string, so it's fine.
  onClick?: () => void;
  isDisabled?: boolean;
  hasPlayed?: boolean;
};

// FIX 1: Corrected dynamic loading for CricketFact
const CricketFact = dynamic<CricketFactProps>(
  () =>
    import('@/components/home/CricketFact').then((m) => {
      // Assuming CricketFact has a named export or a default export
      const comp = m.default || (m as any).CricketFact;
      // This is the structure next/dynamic expects to be returned
      return { default: comp } as { default: React.ComponentType<CricketFactProps> };
    }),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);

// FIX 2: Corrected dynamic loading for HomeClientContent
const HomeClientContent = dynamic<HomeClientContentProps>(
  () =>
    import('@/components/home/HomeClientContent').then((m) => {
      const comp = m.default || (m as any).HomeClientContent;
      return { default: comp } as { default: React.ComponentType<HomeClientContentProps> };
    }),
  { loading: () => <Skeleton className="h-80 w-full" />, ssr: false }
);

// FIX 3: Corrected dynamic loading for StartQuizButton
const StartQuizButton = dynamic<StartQuizButtonProps>(
  () =>
    import('@/components/home/StartQuizButton').then((m) => {
      const comp = m.default || (m as any).StartQuizButton;
      return { default: comp } as { default: React.ComponentType<StartQuizButtonProps> };
    }),
  { loading: () => <Skeleton className="h-12 w-full rounded-full" />, ssr: false }
);

/* Skeleton used while auth/brands load */
const HomeContentSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    <div className="text-center mb-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
    </div>
    <div className="flex justify-center items-center h-[200px]">
      <Skeleton className="w-48 h-48 rounded-lg" />
    </div>
    <Skeleton className="h-[124px] w-full rounded-2xl" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-[92px] w-full" />
      <Skeleton className="h-[92px] w-full" />
      <Skeleton className="h-[92px] w-full" />
      <Skeleton className="h-[92px] w-full" />
    </div>
    <Skeleton className="h-16 w-full rounded-full" />
  </div>
);

/* Fair-play warning component */
function MalpracticeWarning() {
  const { profile } = useAuth();
  if (!profile) return null;

  const noBallCount = profile.noBallCount || 0;
  if (noBallCount <= 0 || noBallCount >= 3) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastNoBallDay = profile.lastNoBallTimestamp
    ? new Date(profile.lastNoBallTimestamp.seconds * 1000).setHours(0, 0, 0, 0)
    : null;

  if (lastNoBallDay !== today.getTime()) return null;

  const warningsLeft = 3 - noBallCount;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Fair Play Warning!</AlertTitle>
        <AlertDescription>
          You have {noBallCount} No-Ball(s) today. {warningsLeft} more and you're Out for the Day! Please contact support to appeal.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

/* Main page component */
function HomePageClient() {
  // Real context hooks from your project
  const { user, isProfileComplete, lastAttemptInSlot, loading: authLoading } = useAuth();
  const { isLoading: isQuizStatusLoading } = useQuizStatus();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedBrand, setSelectedBrand] = useState<CubeBrand>(brandData[0]);
  const hasPlayedInCurrentSlot = !!lastAttemptInSlot;

  const handleStartQuiz = useCallback(
    (brandToPlay?: CubeBrand) => {
      const brand = brandToPlay || selectedBrand;

      if (!user) {
        router.push(`/auth/login?from=/`);
        return;
      }

      if (hasPlayedInCurrentSlot && lastAttemptInSlot) {
        router.push(`/quiz/results?attempt=${encodeAttempt(lastAttemptInSlot)}`);
        toast({
          title: "You've already played this innings!",
          description: `Showing your results for the ${lastAttemptInSlot.format} quiz. You can only attempt one quiz per slot.`,
        });
        return;
      }

      if (!user.emailVerified) {
        toast({
          title: 'Email not verified',
          description: 'Please verify your email address before playing a quiz.',
          variant: 'destructive',
        });
        return;
      }

      if (!isProfileComplete) {
        toast({
          title: 'Profile Incomplete',
          description: 'Please complete your profile to start playing quizzes.',
          variant: 'destructive',
        });
        router.push('/profile');
        return;
      }

      router.push(`/quiz?brand=${encodeURIComponent(brand.brand)}&format=${encodeURIComponent(brand.format)}`);
    },
    [user, hasPlayedInCurrentSlot, lastAttemptInSlot, isProfileComplete, selectedBrand, router, toast]
  );

  if (authLoading) return <HomeContentSkeleton />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-6">
      <MalpracticeWarning />

      <HomeClientContent selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} handleStartQuiz={handleStartQuiz} />

      <div className="mt-6">
        <StartQuizButton
          // FIX 4: Ensure the prop value matches the type, which is CubeBrand.format (string) or undefined.
          // lastAttemptInSlot.format is a string.
          brandFormat={hasPlayedInCurrentSlot ? lastAttemptInSlot!.format : selectedBrand.format}
          onClick={() => handleStartQuiz()}
          isDisabled={isQuizStatusLoading}
          hasPlayed={hasPlayedInCurrentSlot}
        />
      </div>

      <div className="mt-8">
        <CricketFact format={selectedBrand.format} />
      </div>
    </motion.div>
  );
}

export default memo(HomePageClient);