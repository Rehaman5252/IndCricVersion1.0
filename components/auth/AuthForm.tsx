// app/components/history/QuizHistoryContent.tsx
'use client';

import React, { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Award,
  Ban,
  Sparkles,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  ServerCrash,
  WifiOff,
  Check,
  Loader2,
} from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AdDialog } from '@/components/AdDialog';
// Use named ad helper imports
import { getAdForSlot, getInterstitialAdForSlot } from '@/lib/ads';
import AnalysisDialog from '@/components/history/AnalysisDialog';
import ReviewDialog from '@/components/history/ReviewDialog';
import { useAuth } from '@/context/AuthProvider';
// NOTE: different toast implementations vary; call toast via returned object
import { useToast } from '@/hooks/use-toast';
import { normalizeTimestamp } from '@/lib/dates';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';

// local fallback image path (dev)
const LOCAL_FALLBACK_AD = '/assets/fallback-ad.png';

// Skeleton and error components (unchanged)
export const HistoryItemSkeleton = () => (
  <Card className="bg-card/80 shadow-lg">
    <CardHeader>
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-8 rounded-md mt-1 flex-shrink-0" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex justify-end gap-2">
      <Skeleton className="h-9 w-24 rounded-md" />
      <Skeleton className="h-9 w-24 rounded-md" />
    </CardContent>
  </Card>
);

export const ErrorStateDisplay = ({ message }: { message: string }) => (
  <Alert variant="destructive" className="mt-4">
    {message.includes('offline') || message.includes('unavailable') ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
    <AlertTitle>Error Loading History</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

const getSlotTimings = (timestamp: any) => {
  const attemptDate = normalizeTimestamp(timestamp);
  if (!attemptDate) return 'Invalid Time';

  const minutes = attemptDate.getMinutes();
  const slotStartMinute = Math.floor(minutes / 10) * 10;

  const slotStartTime = new Date(attemptDate);
  slotStartTime.setMinutes(slotStartMinute, 0, 0);

  const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

  return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
};

type AdDialogConfig = {
  type: 'image' | 'video';
  url: string;
  title?: string;
  duration?: number;
  skippableAfter?: number;
  hint?: string;
};

const HistoryItemComponent = ({ attempt }: { attempt: QuizAttempt }) => {
  const { markAttemptAsReviewed } = useAuth();
  const toastApi = useToast(); // call toastApi.toast(...)
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isReviewed, setIsReviewed] = useState(Boolean(attempt.reviewed));
  const [isReviewing, setIsReviewing] = useState(false);
  const [adConfig, setAdConfig] = useState<AdDialogConfig | null>(null);

  const isDisqualified = Boolean(attempt.reason);

  const handleReviewClick = useCallback(async () => {
    if (isDisqualified || isReviewing) return;
    if (isReviewed) {
      setShowReviewDialog(true);
      return;
    }

    setIsReviewing(true);

    try {
      // try to get interstitial config first
      const interstitial = await getInterstitialAdForSlot((attempt as any).adSlot);
      if (interstitial) {
        setAdConfig({
          type: interstitial.type === 'video' ? 'video' : 'image',
          url: interstitial.videoUrl ?? interstitial.logoUrl ?? LOCAL_FALLBACK_AD,
          title: interstitial.videoTitle ?? interstitial.logoHint ?? 'Sponsored',
          duration: interstitial.durationSec ?? Math.round((interstitial.durationMs ?? 7000) / 1000),
          skippableAfter: interstitial.skippableAfterSec ?? 5,
          hint: interstitial.hint,
        });
      } else {
        // fallback to DB ad object (if any)
        const dbAd = await getAdForSlot((attempt as any).adSlot);
        if (dbAd) {
          setAdConfig({
            type: dbAd.adType === 'video' ? 'video' : 'image',
            url: dbAd.mediaUrl || LOCAL_FALLBACK_AD,
            title: dbAd.companyName || 'Sponsored',
            duration: 7,
            skippableAfter: 5,
            hint: dbAd.companyName,
          });
        } else {
          // final fallback
          setAdConfig({
            type: 'image',
            url: LOCAL_FALLBACK_AD,
            title: 'Sponsored',
            duration: 7,
            skippableAfter: 5,
            hint: 'Sponsored',
          });
        }
      }
    } catch (err) {
      console.error('[HistoryItem] fetch ad error', err);
      // fallback
      setAdConfig({
        type: 'image',
        url: LOCAL_FALLBACK_AD,
        title: 'Sponsored',
        duration: 7,
        skippableAfter: 5,
        hint: 'Sponsored',
      });
    } finally {
      setShowAdDialog(true);
    }
  }, [attempt, isDisqualified, isReviewing, isReviewed]);

  const handleAdFinished = useCallback(async () => {
    setShowAdDialog(false);
    try {
      const { success, reason } = await markAttemptAsReviewed(attempt.slotId);
      if (success) {
        setIsReviewed(true);
        toastApi.toast?.({
          title: 'Success',
          description: 'You can now review your answers.',
        });
        setShowReviewDialog(true);
      } else {
        toastApi.toast?.({
          title: 'Update Failed',
          description: `Could not save review state: ${reason || 'Please check connection.'}`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsReviewing(false);
    }
  }, [attempt.slotId, markAttemptAsReviewed, toastApi]);

  const handleAdDialogClose = (open: boolean) => {
    if (!open) {
      if (isReviewing && !showReviewDialog) {
        setIsReviewing(false);
      }
    }
    setShowAdDialog(open);
  };

  const attemptDate = normalizeTimestamp(attempt.timestamp);
  const isPerfectScore = attempt.score === attempt.totalQuestions && !attempt.reason;
  const slotTiming = getSlotTimings(attempt.timestamp);

  const formattedDate = attemptDate
    ? attemptDate
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .replace(/\//g, '-')
    : 'Invalid Date';

  return (
    <>
      <Card key={attempt.slotId} className="bg-card/80 shadow-lg animate-fade-in-up">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex-shrink-0">
              {isDisqualified ? <Ban className="h-8 w-8 text-destructive" /> : isPerfectScore ? <Award className="h-8 w-8 text-primary" /> : <CheckCircle className="h-8 w-8 text-primary" />}
            </div>
            <div className="flex-grow">
              <CardTitle className="text-lg">{attempt.format} Quiz</CardTitle>
              <CardDescription>Sponsored by {attempt.brand}</CardDescription>
              <CardDescription className="pt-2">{isDisqualified ? 'Disqualified (No Ball)' : `Scored ${attempt.score}/${attempt.totalQuestions}`}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{slotTiming} (IST)</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleReviewClick} disabled={isDisqualified || isReviewing}>
              {isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isReviewed ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Eye className="mr-2 h-4 w-4 text-primary" />}
              {isReviewing ? 'Processing...' : isReviewed ? 'Reviewed' : 'Review'}
            </Button>

            <Button variant="secondary" size="sm" onClick={() => setIsAnalysisOpen(true)} disabled={isDisqualified}>
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {showAdDialog && adConfig && (
        <AdDialog
          open={showAdDialog}
          onOpenChange={handleAdDialogClose}
          onAdFinished={handleAdFinished}
          duration={adConfig.duration ?? 7}
          skippableAfter={adConfig.skippableAfter ?? 5}
          adTitle={adConfig.title ?? 'Sponsored'}
          adType={adConfig.type}
          adUrl={adConfig.url}
          adHint={adConfig.hint}
        >
          <p className="text-xs text-muted-foreground mt-2">Watch this ad to review your answers. This is a one-time action per quiz.</p>
        </AdDialog>
      )}

      {attempt && <ReviewDialog open={showReviewDialog} onOpenChange={setShowReviewDialog} attempt={attempt} />}
      {attempt && <AnalysisDialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen} attempt={attempt} />}
    </>
  );
};

export const HistoryItem = memo(HistoryItemComponent);

// Main wrapper component
interface QuizHistoryContentProps {
  attempts: QuizAttempt[];
  isLoading: boolean;
  error: string | null;
}

export default function QuizHistoryContent({ attempts, isLoading, error }: QuizHistoryContentProps) {
  if (error) return <ErrorStateDisplay message={error} />;
  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <HistoryItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!attempts || attempts.length === 0) {
    return <EmptyState Icon={Award} title="No Quiz History" description="You haven't taken any quizzes yet. Start a quiz to see your history here." />;
  }

  return (
    <div className="space-y-4 pt-4">
      {attempts.map((attempt) => (
        <HistoryItem key={attempt.slotId} attempt={attempt} />
      ))}
    </div>
  );
}
