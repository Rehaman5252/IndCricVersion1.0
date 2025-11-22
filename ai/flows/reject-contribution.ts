'use server';
/**
 * @fileoverview This flow handles the rejection of a user-generated contribution.
 * It updates the contribution's status to 'rejected' and decrements the global
 * pending submissions counter.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';

const RejectContributionInputSchema = z.object({
    contributionId: z.string().describe("The ID of the contribution document to reject."),
});

export type RejectContributionInput = z.infer<typeof RejectContributionInputSchema>;

const RejectContributionOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export type RejectContributionOutput = z.infer<typeof RejectContributionOutputSchema>;

export async function rejectContribution(input: RejectContributionInput): Promise<RejectContributionOutput> {
    return rejectContributionFlow(input);
}

const rejectContributionFlow = ai.defineFlow(
    {
        name: 'rejectContributionFlow',
        inputSchema: RejectContributionInputSchema as any,
        outputSchema: RejectContributionOutputSchema as any,
    },
    async (input: RejectContributionInput): Promise<RejectContributionOutput> => {
        if (!db) {
            return { success: false, message: "Database connection not available." };
        }
        
        try {
            const contributionRef = doc(db, 'userContributions', input.contributionId);
            const globalStatsRef = doc(db, 'globals', 'stats');

            await runTransaction(db, async (transaction) => {
                const contributionDoc = await transaction.get(contributionRef);

                if (!contributionDoc.exists()) {
                    throw new Error("Contribution document not found.");
                }

                if (contributionDoc.data().status === 'rejected') {
                     // If already rejected, do nothing to prevent decrementing counter twice.
                    return;
                }

                // Update contribution status
                transaction.update(contributionRef, { status: 'rejected' });

                // Decrement global pending submissions count only if it was pending
                 if (contributionDoc.data().status === 'under-verification') {
                    transaction.set(globalStatsRef, {
                        pendingSubmissions: increment(-1)
                    }, { merge: true });
                }
            });
            
            return {
                success: true,
                message: 'Contribution rejected successfully.',
            };
        } catch (error) {
            console.error("Error in rejectContributionFlow:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            return {
                success: false,
                message: `Failed to reject contribution: ${errorMessage}`,
            };
        }
    }
);