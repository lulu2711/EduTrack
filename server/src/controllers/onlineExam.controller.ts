import { Request, Response } from 'express';
import { getClassById, findStudentById, findTeacherById } from '../utils/localData';
import {
  createOnlineExam,
  findOnlineExam,
  findSubmission,
  listOnlineExams,
  listSubmissions,
  OnlineExam,
  OnlineQuestion,
  saveSubmission,
} from '../utils/onlineExamStore';
import { answersEqual, calculateKnowledgeMastery } from '../utils/onlineExamScoring';
import { sendUnavailable, fail } from '../utils/dataSource';


export const getOnlineExams = async (req: Request, res: Response): Promise<void> => { try {
  const user = req.user!;
  let exams = (await listOnlineExams()).filter(exam => exam.status === 'published');
  if (user.role === 'teacher') exams = exams.filter(exam => exam.teacherId === user.refId);
  if (user.role === 'student') {
    const student = findStudentById(user.refId);
    exams = exams.filter(exam => exam.classId === student?.classInfo.id);
  }
  res.json({ success: true, data: await Promise.all(exams.map(async ({ questions, ...exam }) => ({
    ...exam,
    questionCount: questions.length,
    ...(user.role === 'student' ? { submitted: Boolean(await findSubmission(exam.id, user.refId)) } : {}),
  }))) }); } catch (error) { sendUnavailable(res, error, '在线作业处理失败'); } };

export const getOnlineExam = async (req: Request, res: Response): Promise<void> => { try {
  const exam = await findOnlineExam(req.params.examId);
  if (!exam) return fail(res, 404, 'NOT_FOUND', '在线作业不存在');
  const user = req.user!;
  if (user.role === 'teacher' && exam.teacherId !== user.refId) return fail(res, 403, 'FORBIDDEN', '无权访问此在线作业');
  const student = user.role === 'student' ? findStudentById(user.refId) : null;
  if (user.role === 'student' && exam.classId !== student?.classInfo.id) return fail(res, 403, 'FORBIDDEN', '无权访问此在线作业');
  const submission = user.role === 'student' ? await findSubmission(exam.id, user.refId) : null;
  const questions = user.role === 'student' && !submission
    ? exam.questions.map(({ answer, ...question }) => question)
    : exam.questions;
  const questionResults = submission ? Object.fromEntries(exam.questions.map(question => {
    const earnedScore = question.type === 'short_answer'
      ? submission.manualScores?.[question.id]
      : answersEqual(submission.answers[question.id], question.answer, question.type) ? question.score : 0;
    return [question.id, {
      earnedScore: typeof earnedScore === 'number' ? earnedScore : null,
      correct: question.type === 'short_answer' || typeof earnedScore !== 'number'
        ? null
        : earnedScore === question.score,
    }];
  })) : undefined;
  res.json({ success: true, data: { ...exam, questions, submission, questionResults } }); } catch (error) { sendUnavailable(res, error, '在线作业处理失败'); } };

export const createOnlineExamHandler = async (req: Request, res: Response): Promise<void> => { try {
  const { title, subject, classId, durationMinutes, questions } = req.body;
  const teacher = findTeacherById(req.user!.refId);
  const cls = getClassById(classId);
  if (!teacher || teacher.classId !== classId) return fail(res, 403, 'FORBIDDEN', '只能为自己负责的班级创建考试');
  if (!cls || !Array.isArray(questions) || questions.length === 0) {
    return fail(res, 400, 'INVALID_INPUT', '班级和题目不能为空');
  }
  if (questions.some((question: OnlineQuestion) => !Array.isArray(question.knowledgePoints) ||
      question.knowledgePoints.every(item => !String(item).trim()))) {
    return fail(res, 400, 'INVALID_INPUT', '请为每道题至少关联一个知识点');
  }
  const normalizedQuestions: OnlineQuestion[] = questions.map((question: OnlineQuestion, index: number) => ({
    id: question.id || `q-${Date.now()}-${index}`,
    type: question.type,
    content: question.content.trim(),
    options: question.options,
    answer: question.answer,
    score: Number(question.score),
    knowledgePoints: Array.from(new Set(
      (question.knowledgePoints || []).map(item => String(item).trim()).filter(Boolean)
    )),
  }));
  const exam: OnlineExam = {
    id: `online-${Date.now()}`,
    title: title.trim(),
    subject: subject.trim(),
    classId,
    teacherId: teacher.id,
    durationMinutes: Number(durationMinutes),
    status: 'published',
    createdAt: new Date().toISOString(),
    questions: normalizedQuestions,
  };
  res.status(201).json({ success: true, data: await createOnlineExam(exam) }); } catch (error) { sendUnavailable(res, error, '在线作业处理失败'); } };

export const submitOnlineExam = async (req: Request, res: Response): Promise<void> => { try {
  const exam = await findOnlineExam(req.params.examId);
  const student = findStudentById(req.user!.refId);
  if (!exam || !student || exam.classId !== student.classInfo.id) return fail(res, 403, 'FORBIDDEN', '无权提交此在线作业');
  if (await findSubmission(exam.id, student.student.id)) return fail(res, 409, 'ALREADY_SUBMITTED', '该在线作业已经完成');
  const answers = req.body.answers as Record<string, string | string[]>;
  let objectiveScore = 0;
  let manualScore = 0;
  exam.questions.forEach(question => {
    if (question.type === 'short_answer') manualScore += question.score;
    else if (answersEqual(answers?.[question.id], question.answer, question.type)) objectiveScore += question.score;
  });
  const submission = await saveSubmission({
    examId: exam.id,
    studentId: student.student.id,
    answers: answers || {},
    objectiveScore,
    manualScore: 0,
    totalScore: objectiveScore,
    submittedAt: new Date().toISOString(),
  });
  res.status(201).json({ success: true, data: submission }); } catch (error) { sendUnavailable(res, error, '在线作业处理失败'); } };

export const getOnlineExamResults = async (req: Request, res: Response): Promise<void> => { try {
  const exam = await findOnlineExam(req.params.examId);
  if (!exam) return fail(res, 404, 'NOT_FOUND', '在线作业不存在');
  if (req.user!.role === 'teacher' && exam.teacherId !== req.user!.refId) return fail(res, 403, 'FORBIDDEN', '无权查看此在线作业成绩');
  const results = (await listSubmissions(exam.id)).map(item => ({
    ...item,
    studentName: findStudentById(item.studentId)?.student.name || item.studentId,
  }));
  res.json({ success: true, data: results }); } catch (error) { sendUnavailable(res, error, '在线作业处理失败'); } };

export const getClassKnowledgeAnalysis = async (req: Request, res: Response): Promise<void> => { try {
  const exam = await findOnlineExam(req.params.examId);
  if (!exam) return fail(res, 404, 'NOT_FOUND', '在线作业不存在');
  if (req.user!.role === 'teacher' && exam.teacherId !== req.user!.refId) {
    return fail(res, 403, 'FORBIDDEN', '无权查看此在线作业的知识点分析');
  }
  const submissions = await listSubmissions(exam.id);
  res.json({
    success: true,
    data: {
      examId: exam.id,
      submissionCount: submissions.length,
      knowledgePoints: calculateKnowledgeMastery(exam, submissions),
    },
  }); } catch (error) { sendUnavailable(res, error, '在线作业处理失败'); } };

export const getMyKnowledgeAnalysis = async (req: Request, res: Response): Promise<void> => { try {
  const exam = await findOnlineExam(req.params.examId);
  const student = findStudentById(req.user!.refId);
  if (!exam || !student || exam.classId !== student.classInfo.id) {
    return fail(res, 403, 'FORBIDDEN', '无权查看此在线作业的知识点分析');
  }
  const submission = await findSubmission(exam.id, student.student.id);
  if (!submission) return fail(res, 404, 'NOT_FOUND', '提交作业后才能查看知识点分析');
  res.json({
    success: true,
    data: {
      examId: exam.id,
      studentId: student.student.id,
      knowledgePoints: calculateKnowledgeMastery(exam, [submission]),
    },
  }); } catch (error) { sendUnavailable(res, error, '在线作业处理失败'); } };

export const gradeOnlineSubmission = async (req: Request, res: Response): Promise<void> => { try {
  const exam = await findOnlineExam(req.params.examId);
  if (!exam) return fail(res, 404, 'NOT_FOUND', '在线作业不存在');
  if (exam.teacherId !== req.user!.refId) return fail(res, 403, 'FORBIDDEN', '只能批阅自己发布的考试');
  const submission = await findSubmission(exam.id, req.params.studentId);
  if (!submission) return fail(res, 404, 'NOT_FOUND', '学生尚未提交作业');
  const scores = req.body.scores;
  const manualQuestions = exam.questions.filter(question => question.type === 'short_answer');
  if (!scores || typeof scores !== 'object' || Array.isArray(scores) ||
      Object.keys(scores).some(id => !manualQuestions.some(question => question.id === id)) ||
      manualQuestions.some(question => typeof scores[question.id] !== 'number' ||
        !Number.isFinite(scores[question.id]) || scores[question.id] < 0 || scores[question.id] > question.score)) {
    return fail(res, 400, 'INVALID_INPUT', '请为每道主观题填写有效得分，得分必须在零分与题目满分之间');
  }
  const manualScore = manualQuestions.reduce((sum, question) => sum + scores[question.id], 0);
  res.json({ success: true, data: await saveSubmission({
    ...submission, manualScores: scores, manualScore,
    totalScore: submission.objectiveScore + manualScore, gradedAt: new Date().toISOString(),
  }) }); } catch (error) { sendUnavailable(res, error, '在线作业处理失败'); } };



