'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import { submitContribution } from '@/ai/flows/submit-contribution';
import { refineText } from '@/ai/flows/refine-text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const QuestionFormSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters.").max(200, "Question cannot exceed 200 characters."),
  options: z.array(z.object({ value: z.string().min(1, "Option cannot be empty.") })).length(4, "There must be exactly 4 options."),
  correctAnswer: z.string().min(1, "You must select a correct answer."),
  explanation: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof QuestionFormSchema>;

export default function QuestionForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRefining, setIsRefining] = useState<string | null>(null);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(QuestionFormSchema),
    defaultValues: {
      question: '',
      options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
      correctAnswer: '',
      explanation: '',
    },
  });

  const { fields } = useFieldArray({ control: form.control, name: "options" });
  const { isSubmitting } = form.formState;
  const optionsWatch = form.watch('options');

  // Normalize responses from refineText into a string (supports both legacy string and new object shape)
  const extractRefinedText = (res: unknown): string | null => {
    if (!res) return null;
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyRes = res as any;
      // common property names that may hold refined text
      if (typeof anyRes.refinedText === 'string' && anyRes.refinedText.trim().length > 0) return anyRes.refinedText;
      if (typeof anyRes.text === 'string' && anyRes.text.trim().length > 0) return anyRes.text;
      if (typeof anyRes.result === 'string' && anyRes.result.trim().length > 0) return anyRes.result;
    }
    return null;
  };

  /**
   * fieldName may be:
   * - 'question'
   * - 'explanation'
   * - `options.${index}.value` (string template)
   */
  const handleRefine = async (fieldName: 'question' | 'explanation' | `options.${number}.value`) => {
    // get current value (works for nested field names too)
    // react-hook-form getValues supports nested string paths
    // but types require casting to any for dynamic template strings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawValue = (form.getValues as any)(fieldName);

    if (!rawValue || (typeof rawValue === 'string' && rawValue.trim() === '')) {
      toast({ title: "Nothing to refine", description: `Please write some text in the field first.`, variant: "destructive" });
      return;
    }

    setIsRefining(fieldName);
    try {
      // Pass the required refinementType (change 'clarity' to 'grammar' or 'professional' if desired)
      const response = await refineText({ text: String(rawValue), refinementType: 'clarity' });
      const refined = extractRefinedText(response);

      if (refined) {
        // set the refined value back into the form
        (form.setValue as any)(fieldName, refined, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Refined", description: "AI refined the text." });
      } else {
        toast({ title: "No refinement", description: "AI returned no refined text. Try again or edit manually.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Refine error:", err);
      toast({ title: "Error", description: "Could not refine the text.", variant: "destructive" });
    } finally {
      setIsRefining(null);
    }
  };

  const onSubmit = async (values: QuestionFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit a question.", variant: "destructive" });
      return;
    }

    const stringOptions = values.options.map(opt => opt.value);
    if (!stringOptions.includes(values.correctAnswer)) {
      toast({ title: "Invalid Answer", description: "The correct answer must be one of the options provided.", variant: "destructive" });
      return;
    }

    try {
      const result = await submitContribution({
        userId: user.uid,
        type: 'question',
        question: values.question,
        options: stringOptions,
        correctAnswer: values.correctAnswer,
        explanation: values.explanation,
      });

      if (result.success) {
        toast({ title: "Question Submitted!", description: result.message });
        form.reset();
        onSubmitted();
      } else {
        toast({ title: "Submission Failed", description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle>Submit a Quiz Question</CardTitle>
        <CardDescription>Create a multiple-choice question for other players.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="question" control={form.control} render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Question</FormLabel>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRefine('question')} disabled={!!isRefining}>
                    {isRefining === 'question' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                    <span className="ml-2">Refine</span>
                  </Button>
                </div>
                <FormControl>
                  <Textarea placeholder="e.g., Who won the Man of the Match in the 2011 World Cup Final?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {fields.map((fld, idx) => (
              <FormField key={fld.id} name={`options.${idx}.value`} control={form.control} render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Option {idx + 1}</FormLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRefine(`options.${idx}.value`)} disabled={!!isRefining}>
                      {isRefining === `options.${idx}.value` ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      <span className="ml-2">Refine</span>
                    </Button>
                  </div>
                  <FormControl>
                    <Input placeholder={`Enter option ${idx + 1}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}

            <FormField name="correctAnswer" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Correct Answer</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      {optionsWatch.map((opt, index) => (
                        opt.value ? <SelectItem key={index} value={opt.value}>{opt.value}</SelectItem> : null
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="explanation" control={form.control} render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Explanation (Optional)</FormLabel>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRefine('explanation')} disabled={!!isRefining}>
                    {isRefining === 'explanation' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                    <span className="ml-2">Refine</span>
                  </Button>
                </div>
                <FormControl>
                  <Textarea placeholder="Briefly explain why the answer is correct." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={!user || isSubmitting || !!isRefining} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Question
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
