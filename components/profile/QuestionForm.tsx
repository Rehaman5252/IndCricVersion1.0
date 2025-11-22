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
  question: z.string().min(10, 'Question must be at least 10 characters.').max(200, 'Question cannot exceed 200 characters.'),
  options: z.array(z.object({ value: z.string().min(1, 'Option cannot be empty.') })).length(4, 'There must be exactly 4 options.'),
  correctAnswer: z.string().min(1, 'You must select a correct answer.'),
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

  const { fields } = useFieldArray({ control: form.control, name: 'options' });
  const { isSubmitting } = form.formState;
  const optionsWatch = form.watch('options');

  const handleRefine = async (fieldName: 'question' | 'explanation' | `options.${number}.value`) => {
    const value = form.getValues(fieldName as any);
    if (!value) {
      toast({ title: 'Nothing to refine', description: 'Please write some text in the field first.', variant: 'destructive' });
      return;
    }
    setIsRefining(fieldName);
    try {
      // For questions and explanations, 'clarity' is reasonable; for options, use 'concise'
      const refinementType = fieldName.startsWith('options') ? 'concise' : 'clarity';
      const result = await refineText({ text: value, refinementType });

      let refinedString: string;
      if (typeof result === 'string') {
        refinedString = result;
      } else if (result && typeof result === 'object' && 'refinedText' in result && typeof result.refinedText === 'string') {
        refinedString = result.refinedText;
      } else {
        refinedString = value;
      }

      form.setValue(fieldName as any, refinedString, { shouldValidate: true });
      toast({ title: 'Refined', description: 'Field refined.' });
    } catch (error) {
      console.error('Refine error', error);
      toast({ title: 'Error', description: 'Could not refine the text.', variant: 'destructive' });
    } finally {
      setIsRefining(null);
    }
  };

  const onSubmit = async (values: QuestionFormValues) => {
    if (!user) return;

    const stringOptions = values.options.map((opt) => opt.value);
    if (!stringOptions.includes(values.correctAnswer)) {
      toast({ title: 'Invalid Answer', description: 'The correct answer must be one of the options provided.', variant: 'destructive' });
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
        toast({ title: 'Question Submitted!', description: result.message });
        form.reset();
        onSubmitted();
      } else {
        toast({ title: 'Submission Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
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
                <FormControl><Textarea placeholder="e.g., Who won the Man of the Match in the 2011 World Cup Final?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {fields.map((field, index) => (
              <FormField key={field.id} name={`options.${index}.value`} control={form.control} render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Option {index + 1}</FormLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRefine(`options.${index}.value`)} disabled={!!isRefining}>
                      {isRefining === `options.${index}.value` ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      <span className="ml-2">Refine</span>
                    </Button>
                  </div>
                  <FormControl><Input placeholder={`Enter option ${index + 1}`} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}

            <FormField name="correctAnswer" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Correct Answer</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select the correct option" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {optionsWatch.map((opt, index) => (
                      opt.value && <SelectItem key={index} value={opt.value}>{opt.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <FormControl><Textarea placeholder="Briefly explain why the answer is correct." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={isSubmitting || !!isRefining} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Question
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
