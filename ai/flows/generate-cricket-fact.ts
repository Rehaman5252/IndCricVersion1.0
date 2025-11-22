'use server';

import { ai, MODEL_NAME } from '@/ai/genkit';
import { z } from 'zod';

const IS_DEV = process.env.NODE_ENV !== 'production';

const GenerateFactsInputSchema = z.object({
  context: z.string().describe('Context or topic for the cricket fact'),
  count: z.number().min(1).max(10).default(1).describe('Number of facts to generate'),
});

export type GenerateFactsInput = z.infer<typeof GenerateFactsInputSchema>;

const GenerateFactsOutputSchema = z.object({
  facts: z.array(
    z.object({
      fact: z.string().min(10).describe('The cricket fact text'),
      category: z.enum(['player', 'team', 'record', 'historical', 'rules', 'tournament']),
      difficulty: z.enum(['easy', 'medium', 'hard']),
    })
  ),
  source: z.enum(['ai', 'fallback']),
});

export type GenerateFactsOutput = z.infer<typeof GenerateFactsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateCricketFactsPrompt',
  model: MODEL_NAME,
  input: { schema: GenerateFactsInputSchema as any },
  output: { schema: GenerateFactsOutputSchema as any },
  prompt: `
Generate {{count}} interesting, accurate cricket fact(s) related to: "{{context}}".

## Guidelines:
- Each fact should be unique and verifiable
- Include player stats, team records, or historical moments
- Make facts engaging and surprising
- Categorize appropriately
- Assign difficulty level

Return exactly {{count}} fact(s).
  `,
  config: {
    temperature: 0.8,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const getFallbackFacts = (count: number): GenerateFactsOutput => {
  const fallbackFactsPool = [
    { fact: "Sachin Tendulkar is the highest run-scorer in Test cricket with 15,921 runs.", category: 'player' as const, difficulty: 'easy' as const },
    { fact: "The first Test match was played between Australia and England in 1877.", category: 'historical' as const, difficulty: 'medium' as const },
    { fact: "Chris Gayle holds the record for highest individual score in T20I with 175*.", category: 'record' as const, difficulty: 'medium' as const },
    { fact: "India won its first Cricket World Cup in 1983 under Kapil Dev.", category: 'tournament' as const, difficulty: 'easy' as const },
    { fact: "A cricket ball must weigh between 155.9 and 163 grams.", category: 'rules' as const, difficulty: 'hard' as const },
  ];
  
  return {
    facts: fallbackFactsPool.slice(0, Math.min(count, fallbackFactsPool.length)),
    source: 'fallback',
  };
};

export const generateCricketFactsFlow = ai.defineFlow(
  {
    name: 'generateCricketFactsFlow',
    inputSchema: GenerateFactsInputSchema as any,
    outputSchema: GenerateFactsOutputSchema as any,
  },
  async (input: GenerateFactsInput): Promise<GenerateFactsOutput> => {
    try {
      const { output } = await prompt(input);
      const validation = GenerateFactsOutputSchema.safeParse(output);
      
      if (!validation.success) {
        console.warn('[generateCricketFactsFlow] Validation failed, using fallback');
        return getFallbackFacts(input.count);
      }

      return { ...validation.data, source: 'ai' as const };
    } catch (error: any) {
      console.error('[generateCricketFactsFlow] Error:', error?.message);
      return getFallbackFacts(input.count);
    }
  }
);

// Client-callable wrapper
export async function generateCricketFacts(input: GenerateFactsInput): Promise<GenerateFactsOutput> {
  try {
    return await generateCricketFactsFlow(input);
  } catch (error: any) {
    return getFallbackFacts(input.count);
  }
}