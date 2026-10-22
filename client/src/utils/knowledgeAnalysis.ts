const normalizeTrueFalse = (value: unknown) => {
  const answer = String(value ?? '').trim().toLowerCase();
  if (answer === 'true' || answer === '正确') return 'true';
  if (answer === 'false' || answer === '错误') return 'false';
  return answer;
};

export const answersEqual = (actual: unknown, expected: unknown, type: string) => {
  if (type === 'true_false') return normalizeTrueFalse(actual) === normalizeTrueFalse(expected);
  const normalize = (value: unknown) => Array.isArray(value)
    ? value.map(String).sort()
    : String(value ?? '').trim();
  return JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected));
};

export const getQuestionResult = (exam: any, question: any) => {
  const serverResult = exam.questionResults?.[question.id];
  if (serverResult && (typeof serverResult.earnedScore === 'number' || serverResult.earnedScore === null)) {
    return serverResult;
  }
  if (!exam.submission) return null;
  if (question.type === 'short_answer') {
    const score = exam.submission.manualScores?.[question.id];
    return { earnedScore: typeof score === 'number' ? score : null, correct: null };
  }
  if (question.answer === undefined) return { earnedScore: null, correct: null };
  const correct = answersEqual(exam.submission.answers?.[question.id], question.answer, question.type);
  return { earnedScore: correct ? question.score : 0, correct };
};

export const calculateKnowledgeAnalysis = (exam: any, submissions: any[]) => {
  const totals = new Map<string, { earnedScore: number; possibleScore: number; questionIds: Set<string> }>();
  submissions.forEach(submission => exam.questions.forEach((question: any) => {
    if (!question.knowledgePoints?.length) return;
    const earnedScore = question.type === 'short_answer'
      ? submission.manualScores?.[question.id]
      : answersEqual(submission.answers?.[question.id], question.answer, question.type) ? question.score : 0;
    if (typeof earnedScore !== 'number') return;
    question.knowledgePoints.forEach((knowledgePoint: string) => {
      const total = totals.get(knowledgePoint) || { earnedScore: 0, possibleScore: 0, questionIds: new Set<string>() };
      total.earnedScore += earnedScore;
      total.possibleScore += question.score;
      total.questionIds.add(question.id);
      totals.set(knowledgePoint, total);
    });
  }));
  return {
    examId: exam.id,
    submissionCount: submissions.length,
    knowledgePoints: Array.from(totals, ([knowledgePoint, total]) => ({
      knowledgePoint,
      earnedScore: total.earnedScore,
      possibleScore: total.possibleScore,
      masteryRate: Math.round(total.earnedScore / total.possibleScore * 1000) / 10,
      questionCount: total.questionIds.size,
    })).sort((a, b) => a.knowledgePoint.localeCompare(b.knowledgePoint, 'zh-CN')),
  };
};
