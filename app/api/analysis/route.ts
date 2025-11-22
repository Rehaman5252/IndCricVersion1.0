import { NextResponse } from "next/server";
import { generateQuizAnalysis } from "@/ai/flows/generate-quiz-analysis";
import { QuizAnalysisOutputSchema } from "@/ai/schemas";
import type { QuizAnalysisOutput, QuizAttempt } from "@/ai/schemas";
import { sanitizeQuizAttempt } from "@/lib/sanitizeUserProfile";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/app/lib/logger";

const getFallbackAnalysisForApi = (attempt: any): QuizAnalysisOutput => {
  const format = attempt?.format || "cricket";
  const score = attempt?.score ?? "a good";
  const total = attempt?.totalQuestions ?? "your";

  return {
    summary: `A solid effort on the ${format} quiz! You scored ${score} out of ${total}. We're showing general feedback as the AI coach is unavailable.`,
    strengths: ["Consistency in completing quizzes.", "Willingness to learn and improve."],
    weaknesses: ["Potential gaps in specific eras or player stats.", "Time management on difficult questions."],
    recommendations: ["Review questions you were unsure about.", "Focus on one cricket format to build deep knowledge.", "Try to answer questions you're confident about more quickly."],
    source: "fallback",
  };
};

export async function POST(req: Request) {
  const requestId = uuidv4();
  let attemptBody: any;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !body.attempt) {
      logger.warn(`[Analysis] Invalid request body.`, { requestId });
      return NextResponse.json({ ok: false, analysis: getFallbackAnalysisForApi({}), requestId }, { status: 400 });
    }

    attemptBody = body.attempt;

    // --- Step 1: Try AI Flow ---
    try {
      // sanitize incoming attempt first
      const sanitizedAttempt = sanitizeQuizAttempt(attemptBody) as QuizAttempt;

      // Normalize questions: merge each question with userAnswers and compute isCorrect
      // Expectation: sanitizedAttempt.questions: { question, correctAnswer, ... }[]
      //                sanitizedAttempt.userAnswers: string[] (aligned by index)
      const userAnswers: string[] = Array.isArray(sanitizedAttempt.userAnswers) ? sanitizedAttempt.userAnswers : [];

      const normalizedQuestions = (Array.isArray(sanitizedAttempt.questions) ? sanitizedAttempt.questions : []).map((q: any, idx: number) => {
        const userAnswer = userAnswers[idx] ?? "";
        const correctAnswer = q.correctAnswer ?? q.answer ?? "";
        const isCorrect = userAnswer !== "" ? userAnswer === correctAnswer : false;

        return {
          question: q.question ?? q.text ?? "",
          correctAnswer,
          userAnswer,
          isCorrect,
        };
      });

      // Build analysis input in the shape expected by generateQuizAnalysis
      // Keep other fields from sanitizedAttempt (userId, score, format, etc.)
      const analysisInput = {
        ...sanitizedAttempt,
        // replace/ensure questions has the expected shape
        questions: normalizedQuestions,
      };

      const analysis = await generateQuizAnalysis(analysisInput);

      // Final validation before sending to client
      const parsed = QuizAnalysisOutputSchema.safeParse(analysis);

      if (!parsed.success) {
        logger.error(`[Analysis AI Error] reqId=${requestId} - AI output failed validation`, { error: parsed.error, userId: sanitizedAttempt.userId });
        // Fall through to static fallback
      } else {
        logger.info(`[Analysis] Successfully generated analysis.`, { requestId, source: parsed.data.source, userId: sanitizedAttempt.userId });
        return NextResponse.json({ ok: true, analysis: parsed.data, requestId });
      }
    } catch (aiError: any) {
      logger.error(`[Analysis AI Exception] reqId=${requestId}`, { error: aiError?.message ?? aiError, userId: attemptBody?.userId });
      // Fall through to static fallback
    }

    // --- Step 2: Static Fallback ---
    logger.warn(`[Analysis] Serving fallback analysis.`, { requestId, userId: attemptBody?.userId });
    const fallbackAnalysis = getFallbackAnalysisForApi(attemptBody);
    return NextResponse.json({ ok: true, analysis: fallbackAnalysis, fallback: true, requestId });
  } catch (err: any) {
    logger.error(`[Analysis Route Error] reqId=${requestId}`, { error: err.message });
    return NextResponse.json(
      { ok: false, error: "Invalid request body.", requestId },
      { status: 400 }
    );
  }
}
