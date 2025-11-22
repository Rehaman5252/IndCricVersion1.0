'use server';
/**
 * @fileoverview This flow handles processing a payout request.
 * It updates the payout's status, decrements the global pending payouts counter,
 * and creates an audit log entry for the action.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, runTransaction, increment, serverTimestamp, collection } from 'firebase/firestore';

// Define schemas using z.object() WITHOUT type assertions
const ProcessPayoutInputSchema = z.object({
    payoutId: z.string().describe("The ID of the payout document to process."),
    status: z.enum(['completed', 'failed']).describe("The new status for the payout."),
    adminId: z.string().describe("The ID of the admin processing the request."),
    notes: z.string().optional().describe("Optional notes for the audit log."),
});

export type ProcessPayoutInput = z.infer<typeof ProcessPayoutInputSchema>;

const ProcessPayoutOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export type ProcessPayoutOutput = z.infer<typeof ProcessPayoutOutputSchema>;

export async function processPayout(input: ProcessPayoutInput): Promise<ProcessPayoutOutput> {
    return processPayoutFlow(input);
}

const processPayoutFlow = ai.defineFlow(
    {
        name: 'processPayoutFlow',
        inputSchema: ProcessPayoutInputSchema as any,  // Type assertion for Genkit
        outputSchema: ProcessPayoutOutputSchema as any, // Type assertion for Genkit
    },
    async (input: ProcessPayoutInput): Promise<ProcessPayoutOutput> => {
        if (!db) {
            return { success: false, message: "Database connection not available." };
        }
        
        try {
            const payoutRef = doc(db, 'payouts', input.payoutId);
            const globalStatsRef = doc(db, 'globals', 'stats');
            const auditLogCollection = collection(db, 'audit_logs');

            await runTransaction(db, async (transaction) => {
                const payoutDoc = await transaction.get(payoutRef);

                if (!payoutDoc.exists()) {
                    throw new Error("Payout document not found.");
                }

                const originalStatus = payoutDoc.data().status;
                if (originalStatus !== 'pending') {
                    // If not pending, do nothing to prevent decrementing counter multiple times.
                    return;
                }

                // Update payout status
                transaction.update(payoutRef, { status: input.status });

                // Decrement global pending payouts count
                transaction.set(globalStatsRef, {
                    pendingPayouts: increment(-1)
                }, { merge: true });

                // Create an audit log entry
                const auditLogRef = doc(auditLogCollection);
                transaction.set(auditLogRef, {
                    action: `payout_processed_${input.status}`,
                    targetId: input.payoutId,
                    adminId: input.adminId,
                    timestamp: serverTimestamp(),
                    details: {
                        fromStatus: originalStatus,
                        toStatus: input.status,
                        notes: input.notes,
                    },
                });
            });
            
            return {
                success: true,
                message: `Payout marked as ${input.status} successfully!`,
            };
        } catch (error) {
            console.error("Error in processPayoutFlow:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            return {
                success: false,
                message: `Failed to process payout: ${errorMessage}`,
            };
        }
    }
);