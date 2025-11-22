'use server';

import { ai, MODEL_NAME } from '@/ai/genkit';
import { z } from 'zod';

const RefineTextInputSchema = z.object({
  text: z.string().min(1),
  refinementType: z.enum(['grammar', 'clarity', 'professional', 'casual', 'concise']),
  context: z.string().optional(),
});

export type RefineTextInput = z.infer<typeof RefineTextInputSchema>;

const RefineTextOutputSchema = z.object({
  originalText: z.string(),
  refinedText: z.string(),
  changes: z.array(z.string()),
  improvementSuggestions: z.array(z.string()).optional(),
  source: z.enum(['ai', 'fallback']),
});

export type RefineTextOutput = z.infer<typeof RefineTextOutputSchema>;

const prompt = ai.definePrompt({
  name: 'refineTextPrompt',
  model: MODEL_NAME,
  input: { schema: RefineTextInputSchema as any },
  output: { schema: RefineTextOutputSchema as any },
  prompt: `
Refine this text according to {{refinementType}} type:

"{{text}}"

Provide refined version, list changes, and suggestions.
  `,
  config: {
    temperature: 0.5,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 800,
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const getFallbackRefinement = (input: RefineTextInput): RefineTextOutput => {
  let refinedText = input.text.trim().replace(/\s+/g, ' ');
  
  return {
    originalText: input.text,
    refinedText,
    changes: ['Cleaned whitespace', 'Basic formatting applied'],
    improvementSuggestions: ['Consider using AI for better results'],
    source: 'fallback',
  };
};

export const refineTextFlow = ai.defineFlow(
  {
    name: 'refineTextFlow',
    inputSchema: RefineTextInputSchema as any,
    outputSchema: RefineTextOutputSchema as any,
  },
  async (input: RefineTextInput): Promise<RefineTextOutput> => {
    try {
      const { output } = await prompt(input);
      const validation = RefineTextOutputSchema.safeParse(output);
      
      if (!validation.success) {
        return getFallbackRefinement(input);
      }

      return { ...validation.data, originalText: input.text, source: 'ai' as const };
    } catch (error: any) {
      return getFallbackRefinement(input);
    }
  }
);

// Client-callable wrapper
export async function refineText(input: RefineTextInput): Promise<RefineTextOutput> {
  try {
    return await refineTextFlow(input);
  } catch (error: any) {
    return getFallbackRefinement(input);
  }
}