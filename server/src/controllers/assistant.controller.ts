import { Request, Response } from 'express';
import {
  findStudentById,
  findTeacherById,
  getAllClasses,
  getClassById,
  getClassScores,
  getStudentScores,
  ScoreRecord,
} from '../utils/localData';

type SubjectStat = { subject: string; averageRate: number; records: number };
type KnowledgeStat = { knowledgePoint: string; earnedScore: number; possibleScore: number; masteryRate: number };
type AssistantContext = {
  scope: string;
  studentCount: number;
  exams: string[];
  weakestSubjects: SubjectStat[];
  classSubjectChanges: Array<{ subject: string; previousExam: string; previousRate: number; latestExam: string; latestRate: number; change: number }>;
  weakestKnowledgePoints: KnowledgeStat[];
};

const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ success: false, error: { code, message, details: [] } });

const subjectRates = (records: ScoreRecord[]): SubjectStat[] => {
  const totals = new Map<string, { rate: number; count: number }>();
  records.forEach(record => Object.entries(record).forEach(([key, value]) => {
    if (['班级', '学号', '姓名', '考试', '总分', '满分', '排名', '班级人数'].includes(key) || typeof value !== 'string') return;
    const match = value.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
    if (!match) return;
    const score = Number(match[1]);
    const full = Number(match[2]);
    if (full <= 0) return;
    const current = totals.get(key) || { rate: 0, count: 0 };
    current.rate += score / full * 100;
    current.count += 1;
    totals.set(key, current);
  }));
  return Array.from(totals, ([subject, total]) => ({
    subject,
    averageRate: Number((total.rate / total.count).toFixed(1)),
    records: total.count,
  })).sort((a, b) => a.averageRate - b.averageRate);
};

const classChanges = (records: ScoreRecord[]) => {
  const exams = Array.from(new Set(records.map(record => record.考试))).sort();
  if (exams.length < 2) return [];
  const previousExam = exams[exams.length - 2];
  const latestExam = exams[exams.length - 1];
  const previous = subjectRates(records.filter(record => record.考试 === previousExam));
  const latest = subjectRates(records.filter(record => record.考试 === latestExam));
  return latest.flatMap(item => {
    const old = previous.find(candidate => candidate.subject === item.subject);
    return old ? [{
      subject: item.subject,
      previousExam,
      previousRate: old.averageRate,
      latestExam,
      latestRate: item.averageRate,
      change: Number((item.averageRate - old.averageRate).toFixed(1)),
    }] : [];
  }).sort((a, b) => a.change - b.change);
};

const getKnowledgeStats = (classIds: string[], studentIds: string[] | null): KnowledgeStat[] => {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  const { getLocalDataDir } = require('../utils/localData') as typeof import('../utils/localData');
  const file = path.join(getLocalDataDir(), 'online_exams.json');
  if (!fs.existsSync(file)) return [];
  const store = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    exams: Array<{ id: string; classId: string; questions: Array<{ id: string; type: string; score: number; answer: unknown; knowledgePoints?: string[] }> }>;
    submissions: Array<{ examId: string; studentId: string; answers: Record<string, unknown>; manualScores?: Record<string, number> }>;
  };
  const totals = new Map<string, { earned: number; possible: number }>();
  store.exams.filter(exam => classIds.includes(exam.classId)).forEach(exam => {
    store.submissions.filter(submission => submission.examId === exam.id && (!studentIds || studentIds.includes(submission.studentId))).forEach(submission => {
      exam.questions.forEach(question => {
        if (!question.knowledgePoints?.length) return;
        let earned: number | undefined;
        if (question.type === 'short_answer') earned = submission.manualScores?.[question.id];
        else {
          const actual = String(submission.answers?.[question.id] ?? '').trim().toLowerCase();
          const expected = String(question.answer ?? '').trim().toLowerCase();
          const normalize = (value: string) => value === 'true' || value === '正确' ? 'true' : value === 'false' || value === '错误' ? 'false' : value;
          earned = (question.type === 'true_false' ? normalize(actual) === normalize(expected) : actual === expected) ? question.score : 0;
        }
        if (earned === undefined) return;
        question.knowledgePoints.forEach(point => {
          const total = totals.get(point) || { earned: 0, possible: 0 };
          total.earned += earned!;
          total.possible += question.score;
          totals.set(point, total);
        });
      });
    });
  });
  return Array.from(totals, ([knowledgePoint, total]) => ({
    knowledgePoint,
    earnedScore: total.earned,
    possibleScore: total.possible,
    masteryRate: Number((total.earned / total.possible * 100).toFixed(1)),
  })).sort((a, b) => a.masteryRate - b.masteryRate);
};

const buildAnswer = (question: string, context: AssistantContext): string => {
  if (/知识点|掌握/.test(question)) {
    if (!context.weakestKnowledgePoints.length) return '当前权限范围内还没有已关联知识点且可计分的作业数据。教师批阅主观题后，相关知识点掌握度会一并纳入分析。';
    const items = context.weakestKnowledgePoints.slice(0, 5).map(item => `${item.knowledgePoint}（${item.masteryRate}%，${item.earnedScore}/${item.possibleScore}分）`).join('、');
    return `目前掌握度较低的知识点是：${items}。掌握度按实得分 ÷ 可得分计算；未批阅的主观题不计入。`;
  }
  if (/为什么|原因|下降/.test(question) && context.classSubjectChanges.length) {
    const declines = context.classSubjectChanges.filter(item => item.change < 0).slice(0, 3);
    if (!declines.length) return `对比${context.classSubjectChanges[0].previousExam}与${context.classSubjectChanges[0].latestExam}，目前没有发现班级科目平均得分率下降。不同满分采用得分率比较。`;
    return `从${declines[0].previousExam}到${declines[0].latestExam}，${declines.map(item => `${item.subject}下降${Math.abs(item.change)}个百分点（${item.previousRate}% → ${item.latestRate}%）`).join('；')}。这说明班级总体表现回落，但汇总成绩不能单独确定原因；建议结合试卷难度、缺考人数、题型和知识点失分进一步判断。`;
  }
  if (!context.weakestSubjects.length) return '当前权限范围内暂时没有可用于分析的科目成绩记录。';
  const weakest = context.weakestSubjects.slice(0, 3).map(item => `${item.subject}（平均得分率 ${item.averageRate}%）`).join('、');
  return `按当前权限范围内各科有效成绩的平均得分率计算，薄弱科目是：${weakest}。统计覆盖 ${context.exams.length} 场考试、${context.studentCount} 名学生。采用得分率便于比较满分不同的科目。`;
};

const askModel = async (question: string, context: AssistantContext): Promise<string | null> => {
  const { LLM_API_KEY, LLM_BASE_URL, LLM_MODEL } = process.env;
  if (!LLM_API_KEY || !LLM_BASE_URL || !LLM_MODEL) return null;
  const response = await fetch(`${LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM_API_KEY}` },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: '你是学校成绩分析助手。只能基于给定的已授权汇总数据回答；不得推测个人隐私、不得尝试查询范围外数据。明确区分事实与可能原因，使用中文简洁回答。' },
        { role: 'user', content: `问题：${question}\n授权范围汇总数据：${JSON.stringify(context)}` },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    const errorBody = (await response.text()).slice(0, 500);
    throw new Error(`LLM request failed (${response.status}): ${errorBody}`);
  }
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content?.trim() || null;
};

export const askAssistant = async (req: Request, res: Response): Promise<void> => {
  const question = typeof req.body.question === 'string' ? req.body.question.trim() : '';
  if (!question || question.length > 1000) return void fail(res, 400, 'INVALID_INPUT', '问题不能为空且不能超过1000字');
  const user = req.user!;
  let scope: string;
  let classIds: string[];
  let studentIds: string[] | null = null;
  if (user.role === 'student') {
    const found = findStudentById(user.refId);
    if (!found) return void fail(res, 403, 'FORBIDDEN', '无法确认当前学生的数据范围');
    scope = '学生本人';
    classIds = [found.classInfo.id];
    studentIds = [found.student.id];
  } else if (user.role === 'teacher') {
    const teacher = findTeacherById(user.refId);
    if (!teacher || !getClassById(teacher.classId)) return void fail(res, 403, 'FORBIDDEN', '无法确认当前教师负责的班级');
    scope = `教师负责班级：${teacher.className}`;
    classIds = [teacher.classId];
  } else {
    scope = '全校';
    classIds = getAllClasses().map(item => item.id);
  }

  try {
    const classLookup = new Map(getAllClasses().map(item => [item.id, item]));
    const records = classIds.flatMap(classId => {
      const cls = classLookup.get(classId);
      if (!cls) return [];
      const scores = studentIds ? getStudentScores(studentIds[0]) : getClassScores(cls.name);
      return scores;
    });
    const subjects = subjectRates(records);
    const context: AssistantContext = {
      scope: user.role === 'student' ? '学生本人' : scope,
      studentCount: studentIds ? 1 : new Set(records.map(record => record.学号)).size,
      exams: Array.from(new Set(records.map(record => record.考试))).sort(),
      weakestSubjects: subjects,
      classSubjectChanges: user.role === 'student' ? [] : classChanges(records),
      weakestKnowledgePoints: getKnowledgeStats(classIds, studentIds),
    };
    let answer: string;
    const mode: 'model' = 'model';
    try {
      const modelAnswer = await askModel(question, context);
      if (!modelAnswer) throw new Error('LLM configuration is incomplete or the model returned an empty answer');
      answer = modelAnswer;
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      console.error('Assistant model request failed:', details);
      return void fail(res, 502, 'LLM_UNAVAILABLE', '大模型暂时不可用，请检查模型配置或稍后重试');
    }
    res.json({ success: true, data: { answer, mode, scope, evidence: {
      exams: context.exams,
      studentCount: context.studentCount,
      weakestSubjects: context.weakestSubjects.slice(0, 5),
      weakestKnowledgePoints: context.weakestKnowledgePoints.slice(0, 5),
      classSubjectChanges: context.classSubjectChanges.slice(0, 5),
    } } });
  } catch (error) {
    console.error('Assistant query failed:', error);
    fail(res, 500, 'ASSISTANT_FAILED', '分析数据时发生错误，请稍后再试');
  }
};







