'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import { submitContribution } from '@/ai/flows/submit-contribution';
import { refineText } from '@/ai/flows/refine-text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PostFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title cannot exceed 100 characters."),
  content: z.string().min(50, "Post must be at least 50 characters.").max(5000, "Post cannot exceed 5000 characters."),
});

type PostFormValues = z.infer<typeof PostFormSchema>;

export default function PostForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  // track which field is being refined, or null
  const [isRefining, setIsRefining] = useState<'title' | 'content' | null>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(PostFormSchema),
    defaultValues: { title: '', content: '' },
  });

  const { isSubmitting } = form.formState;

  const handleRefine = async (field: 'title' | 'content') => {
    const value = form.getValues(field);
    if (!value) {
      toast({ title: "Nothing to refine", description: `Please write a ${field} first.`, variant: "destructive" });
      return;
    }
    setIsRefining(field);
    try {
      // Pass refinementType and a helpful context for better results
      const refined = await refineText({
        text: value,
        refinementType: field === 'title' ? 'concise' : 'professional',
        context: field === 'title' ? 'Short post title' : 'Long form cricket article / post content'
      });

      if (refined && typeof refined.refinedText === 'string') {
        form.setValue(field, refined.refinedText, { shouldValidate: true });
      } else {
        console.warn('[PostForm] refineText returned unexpected shape; keeping original text.');
      }
    } catch (error) {
      console.error('[PostForm] refineText error:', error);
      toast({ title: "Error", description: "Could not refine the text.", variant: "destructive" });
    } finally {
      setIsRefining(null);
    }
  };

  const onSubmit = async (values: PostFormValues) => {
    if (!user) return;
    try {
      const result = await submitContribution({
        userId: user.uid,
        type: 'post',
        ...values,
      });
      if (result.success) {
        toast({ title: "Post Submitted!", description: result.message });
        form.reset();
        onSubmitted();
      } else {
        toast({ title: "Submission Failed", description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error('[PostForm] submit error:', error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: 'destructive' });
    }
  };

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle>Write a Post</CardTitle>
        <CardDescription>Share your analysis, opinion, or a short story about cricket.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Title</FormLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRefine('title')} disabled={!!isRefining || isSubmitting}>
                      {isRefining === 'title' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      <span className="ml-2">Refine</span>
                    </Button>
                  </div>
                  <FormControl>
                    <Input placeholder="e.g., The evolution of T20 batting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Content</FormLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRefine('content')} disabled={!!isRefining || isSubmitting}>
                      {isRefining === 'content' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      <span className="ml-2">Refine</span>
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea placeholder="Write your post here..." {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || !!isRefining} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Post
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
