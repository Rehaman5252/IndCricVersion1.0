'use server';

import { googleAI_SDK, MODEL_NAME } from '@/ai/genkit';

interface QuizAnalysisInput {
  questions: Array<{
    question: string;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
  }>;
  score: number;
  totalQuestions: number;
  format: string;
}

interface QuizAnalysis {
  overallFeedback: string; // ✅ Match Results page
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}

export async function generateQuizAnalysis(input: QuizAnalysisInput): Promise<QuizAnalysis> {
  console.log(`[generateQuizAnalysis] 📊 Analyzing quiz performance: ${input.score}/${input.totalQuestions}`);
  
  try {
    const model = googleAI_SDK.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      },
    });

    const questionsText = input.questions
      .map((q, i) => `Q${i + 1}: ${q.question}\nYour answer: ${q.userAnswer}\nCorrect: ${q.isCorrect ? 'Yes' : 'No'}`)
      .join('\n\n');

    const prompt = `You are a cricket quiz coach analyzing a student's performance.

Quiz Details:
- Format: ${input.format} cricket
- Score: ${input.score} out of ${input.totalQuestions} (${Math.round((input.score / input.totalQuestions) * 100)}%)

Questions and Answers:
${questionsText}

Generate a JSON analysis with this structure:
{
  "overallFeedback": "A 2-sentence summary of performance",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "areasForImprovement": ["Area to improve 1", "Area to improve 2"],
  "recommendations": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"]
}

Rules:
- Be specific to their answers
- Keep overall feedback to 2 sentences max
- Provide 2 strengths, 2 areas for improvement, 3 recommendations
- Focus on cricket knowledge gaps (eras, players, stats, rules, etc.)
- Keep each point to 15 words or less
- Return ONLY valid JSON, no markdown formatting`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('[generateQuizAnalysis] ✅ AI response received');

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as QuizAnalysis;

    // Validate response structure
    if (!analysis.overallFeedback || !Array.isArray(analysis.strengths)) {
      throw new Error('Invalid analysis structure from AI');
    }

    console.log('[generateQuizAnalysis] ✅ Analysis generated successfully');
    return analysis;
  } catch (error: any) {
    console.error('[generateQuizAnalysis] ❌ Error:', error?.message || error);

    // Return fallback analysis
    const percentage = Math.round((input.score / input.totalQuestions) * 100);
    return {
      overallFeedback: `A solid effort on the ${input.format} quiz! You scored ${input.score} out of ${input.totalQuestions}. We're showing general feedback as the AI coach is unavailable.`,
      strengths: [
        'Consistency in completing quizzes.',
        'Willingness to learn and improve.',
      ],
      areasForImprovement: [
        'Potential gaps in specific eras or player stats.',
        'Time management on difficult questions.',
      ],
      recommendations: [
        'Review questions you were unsure about.',
        `Focus on one cricket format to build deep knowledge.`,
        "Try to answer questions you're confident about more quickly.",
      ],
    };
  }
}
