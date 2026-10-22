import type { OnlineExam, OnlineSubmission, QuestionType } from './onlineExamStore';

const normalizeAnswer = (answer: unknown): string | string[] => {
  if (Array.isArray(answer)) return answer.map(String).sort();
  return String(answer ?? '').trim();
};

const normalizeTrueFalseAnswer = (answer: unknown): string => {
  const normalized = String(answer ?? '').trim().toLowerCase();
  if (normalized === 'true' || normalized === '正确') return 'true';
  if (normalized === 'false' || normalized === '错误') return 'false';
  return normalized;
};

export const answersEqual = (
  actual: unknown,
  expected: unknown,
  questionType?: QuestionType
): boolean => {
  if (questionType === 'true_false') {
    return normalizeTrueFalseAnswer(actual) === normalizeTrueFalseAnswer(expected);
  }
  return JSON.stringify(normalizeAnswer(actual)) === JSON.stringify(normalizeAnswer(expected));
};

export interface KnowledgeMastery {
  knowledgePoint: string;
  earnedScore: number;
  possibleScore: number;
  masteryRate: number;
  questionCount: number;
}

export const calculateKnowledgeMastery = (
  exam: OnlineExam,
  submissions: OnlineSubmission[]
): KnowledgeMastery[] => {
  const totals = new Map<string, { earnedScore: number; possibleScore: number; questionIds: Set<string> }>();

  submissions.forEach(submission => {
    exam.questions.forEach(question => {
      const knowledgePoints = question.knowledgePoints?.filter(Boolean) || [];
      if (knowledgePoints.length === 0) return;

      let earnedScore: number | null;
      if (question.type === 'short_answer') {
        const manualScore = submission.manualScores?.[question.id];
        earnedScore = typeof manualScore === 'number' ? manualScore : null;
      } else {
        earnedScore = answersEqual(submission.answers[question.id], question.answer, question.type)
          ? question.score
          : 0;
      }
      if (earnedScore === null) return;

      knowledgePoints.forEach(knowledgePoint => {
        const current = totals.get(knowledgePoint) || {
          earnedScore: 0,
          possibleScore: 0,
          questionIds: new Set<string>(),
        };
        current.earnedScore += earnedScore;
        current.possibleScore += question.score;
        current.questionIds.add(question.id);
        totals.set(knowledgePoint, current);
      });
    });
  });

  return Array.from(totals, ([knowledgePoint, total]) => ({
    knowledgePoint,
    earnedScore: total.earnedScore,
    possibleScore: total.possibleScore,
    masteryRate: total.possibleScore === 0
      ? 0
      : Math.round(total.earnedScore / total.possibleScore * 1000) / 10,
    questionCount: total.questionIds.size,
  })).sort((a, b) => a.knowledgePoint.localeCompare(b.knowledgePoint, 'zh-CN'));
};
