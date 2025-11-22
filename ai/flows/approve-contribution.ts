'use server';
/**
 * @fileoverview This flow handles the approval of a user-generated contribution.
 * It updates the contribution's status to 'verified' and decrements the global
 * pending submissions counter.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';

const ApproveContributionInputSchema = z.object({
    contributionId: z.string().describe("The ID of the contribution document to approve."),
});

export type ApproveContributionInput = z.infer<typeof ApproveContributionInputSchema>;

const ApproveContributionOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export type ApproveContributionOutput = z.infer<typeof ApproveContributionOutputSchema>;

export async function approveContribution(input: ApproveContributionInput): Promise<ApproveContributionOutput> {
    return approveContributionFlow(input);
}

const approveContributionFlow = ai.defineFlow(
    {
        name: 'approveContributionFlow',
        inputSchema: ApproveContributionInputSchema as any,
        outputSchema: ApproveContributionOutputSchema as any,
    },
    async (input: ApproveContributionInput): Promise<ApproveContributionOutput> => {
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

                if (contributionDoc.data().status === 'verified') {
                    // If already verified, do nothing to prevent decrementing counter twice.
                    return;
                }

                // Update contribution status
                transaction.update(contributionRef, { status: 'verified' });

                // Decrement global pending submissions count only if it was pending
                if (contributionDoc.data().status === 'under-verification') {
                    transaction.set(globalStatsRef, {
                        pendingSubmissions: increment(-1)
                    }, { merge: true });
                }
            });
            
            return {
                success: true,
                message: 'Contribution approved successfully!',
            };
        } catch (error) {
            console.error("Error in approveContributionFlow:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            return {
                success: false,
                message: `Failed to approve contribution: ${errorMessage}`,
            };
        }
    }
);