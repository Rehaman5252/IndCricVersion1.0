// src/ai/flows/report-question-flow.ts
'use server';

/**
 * @fileOverview A flow to handle user reports for quiz questions.
 * This flow writes the report to a 'reportedQuestions' collection in Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Export the input schema so other modules (forms, resolvers) can import it:
 *  import { ReportQuestionInputSchema } from '@/ai/flows/report-question-flow';
 */
export const ReportQuestionInputSchema = z.object({
  questionId: z.string().describe("The ID of the question being reported."),
  questionText: z.string().describe("The full text of the question."),
  reason: z.string().min(1, { message: "A reason is required." }).describe("The reason for the report."),
  comment: z.string().optional().describe("An optional comment from the user."),
  userId: z.string().describe("The ID of the user submitting the report."),
});

export type ReportQuestionInput = z.infer<typeof ReportQuestionInputSchema>;

export const ReportQuestionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  reportId: z.string().optional(),
});

export type ReportQuestionOutput = z.infer<typeof ReportQuestionOutputSchema>;

/**
 * A small wrapper exported function that other code can call
 * (e.g. reportQuestion(...) from the UI server actions).
 */
export async function reportQuestion(input: ReportQuestionInput): Promise<ReportQuestionOutput> {
  return reportQuestionFlow(input);
}

/**
 * Define the actual flow using your `ai.defineFlow` helper.
 * Note: we pass the schemas to the flow definition (cast to any
 * if the helper expects a particular runtime shape).
 */
export const reportQuestionFlow = ai.defineFlow(
  {
    name: 'reportQuestionFlow',
    inputSchema: ReportQuestionInputSchema as any,
    outputSchema: ReportQuestionOutputSchema as any,
  },
  async (input: ReportQuestionInput): Promise<ReportQuestionOutput> => {
    if (!db) {
      return { success: false, message: "Database connection not available." };
    }

    try {
      const reportedQuestionsCollection = collection(db, 'reportedQuestions');
      const docRef = await addDoc(reportedQuestionsCollection, {
        ...input,
        reportedAt: serverTimestamp(),
        status: 'new', // e.g., 'new', 'reviewed', 'resolved'
      });

      return {
        success: true,
        message: 'Your report has been submitted successfully. Thank you for helping us improve!',
        reportId: docRef.id,
      };
    } catch (error) {
      console.error("Error in reportQuestionFlow:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        message: `Failed to submit report: ${errorMessage}`,
      };
    }
  }
);
