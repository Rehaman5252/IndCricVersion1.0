// src/components/quiz/ReportQuestionDialog.tsx
'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import * as reportFlow from '@/ai/flows/report-question-flow';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { QuizQuestion } from '@/ai/schemas';

// Props
interface ReportQuestionDialogProps {
  question: QuizQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportReasons = [
  "Incorrect Answer",
  "Typo in Question/Options",
  "Question is Ambiguous",
  "Inappropriate Content",
  "Technical Issue",
  "Other",
];

// Choose schema exported by the flow if present (supports either name)
const Schema = (reportFlow as any).ReportQuestionInputSchema ?? (reportFlow as any).ReportQuestionInput ?? null;
// Function to call
const reportQuestion = (reportFlow as any).reportQuestion ?? (reportFlow as any).default ?? undefined;

// When schema isn't available we use a loose any for form values to avoid compile-time mismatch.
type ReportFormValues = any;

export default function ReportQuestionDialog({ question, open, onOpenChange }: ReportQuestionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<ReportFormValues>({
    resolver: Schema ? zodResolver(Schema) : undefined,
    defaultValues: {
      questionId: question?.id || "",
      questionText: question?.question || "",
      reason: "",
      comment: "",
      userId: user?.uid || "",
    },
  });

  useEffect(() => {
    if (question) {
      form.reset({
        questionId: question.id,
        questionText: question.question,
        reason: "",
        comment: "",
        userId: user?.uid || "",
      });
    }
  }, [question, user, form]);

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: ReportFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be signed in to report a question.', variant: 'destructive' });
      return;
    }

    if (typeof reportQuestion !== 'function') {
      console.error('reportQuestion not exported from report-question-flow.');
      toast({ title: 'Error', description: 'Reporting is currently unavailable.', variant: 'destructive' });
      return;
    }

    try {
      const result = await reportQuestion({ ...data, userId: user.uid });
      if (result?.success) {
        toast({ title: 'Report Submitted', description: result.message });
        onOpenChange(false);
        form.reset();
      } else {
        toast({ title: 'Submission Failed', description: result?.message ?? 'Unknown error', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Help us improve the quiz by reporting any issues with this question.
            <p className="text-xs italic mt-2 bg-muted p-2 rounded-md">"{question?.question}"</p>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="report-question-form">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason for your report" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reportReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optional Comment</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide any additional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="report-question-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
