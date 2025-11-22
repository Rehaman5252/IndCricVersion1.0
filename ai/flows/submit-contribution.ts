'use server';
/**
 * @fileoverview This flow handles submissions of user-generated content like facts, posts, and questions.
 * It validates the input, saves it to a 'userContributions' collection, and updates the user's contribution counts.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, runTransaction, doc, increment } from 'firebase/firestore';

// Schemas for different contribution types
const FactSchema = z.object({
    type: z.literal('fact'),
    content: z.string().min(10, "Fact must be at least 10 characters.").max(280, "Fact cannot exceed 280 characters."),
});

const PostSchema = z.object({
    type: z.literal('post'),
    title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title cannot exceed 100 characters."),
    content: z.string().min(50, "Post must be at least 50 characters.").max(5000, "Post cannot exceed 5000 characters."),
});

const QuestionSchema = z.object({
    type: z.literal('question'),
    question: z.string().min(10, "Question must be at least 10 characters.").max(200, "Question cannot exceed 200 characters."),
    options: z.array(z.string().min(1, "Option cannot be empty.")).length(4, "There must be exactly 4 options."),
    correctAnswer: z.string().min(1, "You must provide a correct answer."),
    explanation: z.string().optional(),
});

// Union schema for any contribution
const ContributionInputSchema = z.object({
    userId: z.string(),
}).and(z.union([FactSchema, PostSchema, QuestionSchema]));

export type ContributionInput = z.infer<typeof ContributionInputSchema>;

const ContributionOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    contributionId: z.string().optional(),
});

export type ContributionOutput = z.infer<typeof ContributionOutputSchema>;

export async function submitContribution(input: ContributionInput): Promise<ContributionOutput> {
    return submitContributionFlow(input);
}

const submitContributionFlow = ai.defineFlow(
    {
        name: 'submitContributionFlow',
        inputSchema: ContributionInputSchema as any,
        outputSchema: ContributionOutputSchema as any,
    },
    async (input: ContributionInput): Promise<ContributionOutput> => {
        if (!db) {
            return { success: false, message: "Database connection not available." };
        }
        
        try {
            const { userId, ...contributionData } = input;
            const userRef = doc(db, 'users', userId);
            const contributionsCollection = collection(db, 'userContributions');
            const globalStatsRef = doc(db, 'globals', 'stats');

            const contributionDoc = {
                ...contributionData,
                userId,
                submittedAt: serverTimestamp(),
                status: 'under-verification', // initial status
            };

            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User not found.");
                }
                const userData = userDoc.data();

                // Add the new contribution
                const newContributionRef = doc(collection(db!, "userContributions"));
                transaction.set(newContributionRef, contributionDoc);

                // Update user's contribution counts
                const userUpdate: { [key: string]: any } = {};
                const countField = `${input.type}sSubmitted`; // e.g., factsSubmitted, postsSubmitted
                userUpdate[countField] = (userData[countField] || 0) + 1;
                transaction.update(userRef, userUpdate);

                // Update global pending submissions count
                transaction.set(globalStatsRef, {
                    pendingSubmissions: increment(1)
                }, { merge: true });
            });
            
            return {
                success: true,
                message: 'Your contribution has been submitted for verification. Thank you!',
            };
        } catch (error) {
            console.error("Error in submitContributionFlow:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            return {
                success: false,
                message: `Failed to submit contribution: ${errorMessage}`,
            };
        }
    }
);