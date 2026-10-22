import { useEffect, useState } from 'react';
import TeacherLayout from './components/TeacherLayout';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ReactECharts from 'echarts-for-react';
import { calculateKnowledgeAnalysis } from '../../utils/knowledgeAnalysis';

type DraftQuestion = {
  type: 'single_choice' | 'true_false' | 'short_answer';
  content: string;
  options: string[];
  answer: string;
  score: number;
  knowledgePoints: string;
};

const blankQuestion = (): DraftQuestion => ({
  type: 'single_choice',
  content: '',
  options: ['', '', '', ''],
  answer: '',
  score: 5,
  knowledgePoints: '',
});

export default function OnlineExamsPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(45);
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()]);
  const [message, setMessage] = useState('');
  const [review, setReview] = useState<any | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [reviewError, setReviewError] = useState('');
  const [saving, setSaving] = useState(false);
  const [knowledgeAnalysis, setKnowledgeAnalysis] = useState<any | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  const load = async () => {
    const [classResponse, examResponse] = await Promise.all([api.getClasses(), api.getOnlineExams()]);
    if (classResponse.success) setClasses(classResponse.data);
    if (examResponse.success) setExams(examResponse.data);
  };

  useEffect(() => { load().catch(() => setMessage('数据加载失败')); }, []);

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setQuestions(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await api.createOnlineExam({
        title, subject, durationMinutes: duration, classId: user?.classId,
        questions: questions.map(question => ({
          ...question,
          options: question.type === 'single_choice' ? question.options : undefined,
          answer: question.type === 'true_false' ? question.answer : question.answer,
          knowledgePoints: question.knowledgePoints.split(/[,，]/).map(item => item.trim()).filter(Boolean),
        })),
      });
      if (response.success) {
        setMessage('作业发布成功，学生现在可以在线完成');
        setTitle('');
        setQuestions([blankQuestion()]);
        await load();
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : '发布失败'); }
  };

  const viewResults = async (exam: any) => {
    setReview(null);
    setResults([]);
    setReviewError('');
    setKnowledgeAnalysis(null);
    setAnalysisError('');
    try {
      // 试卷和成绩是打开页面的核心数据；分析接口失败时仍应允许教师查看答卷。
      const [detail, response] = await Promise.all([api.getOnlineExam(exam.id), api.getOnlineExamResults(exam.id)]);
      setSelectedExam(detail.data);
      if (response.success) setResults(response.data);
      const fallbackAnalysis = calculateKnowledgeAnalysis(detail.data, response.data || []);
      setKnowledgeAnalysis(fallbackAnalysis);
      try {
        const analysis = await api.getClassKnowledgeAnalysis(exam.id);
        if (analysis.success) setKnowledgeAnalysis(analysis.data);
      } catch (error) {
        setAnalysisError('');
      }
    } catch (error) { setReviewError(error instanceof Error ? error.message : '成绩加载失败'); }
  };

  const openReview = (item: any) => {
    setReview(item);
    setReviewError('');
    setScores(Object.fromEntries(selectedExam.questions.filter((q: any) => q.type === 'short_answer')
      .map((q: any) => [q.id, item.manualScores?.[q.id] === undefined ? '' : String(item.manualScores[q.id])])));
  };

  const saveReview = async () => {
    if (Object.values(scores).some(score => score.trim() === '')) { setReviewError('请填写所有主观题得分'); return; }
    setSaving(true);
    setReviewError('');
    try {
      const response = await api.gradeOnlineSubmission(selectedExam.id, review.studentId,
        Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, Number(score)])));
      const updated = { ...review, ...response.data };
      const updatedResults = results.map(item => item.studentId === updated.studentId ? updated : item);
      setReview(updated);
      setResults(updatedResults);
      setKnowledgeAnalysis(calculateKnowledgeAnalysis(selectedExam, updatedResults));
      try {
        const analysis = await api.getClassKnowledgeAnalysis(selectedExam.id);
        if (analysis.success) setKnowledgeAnalysis(analysis.data);
      } catch {
        // 批阅已保存时，不因附加分析刷新失败而误报保存失败。
      }
    } catch (error) { setReviewError(error instanceof Error ? error.message : '批阅保存失败'); }
    finally { setSaving(false); }
  };

  return (
    <TeacherLayout title="在线作业">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <form onSubmit={create} className="xl:col-span-3 bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">创建新作业</h3>
            <p className="text-sm text-gray-500 mt-1">当前作业将发布给你的负责班级</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="作业名称" className="px-3 py-2.5 rounded-xl border border-gray-200" />
            <input required value={subject} onChange={e => setSubject(e.target.value)} placeholder="科目" className="px-3 py-2.5 rounded-xl border border-gray-200" />
            <input type="number" min={5} value={duration} onChange={e => setDuration(Number(e.target.value))} className="px-3 py-2.5 rounded-xl border border-gray-200" />
          </div>
          {questions.map((question, index) => (
            <div key={index} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">第 {index + 1} 题</span>
                <select value={question.type} onChange={e => updateQuestion(index, { type: e.target.value as DraftQuestion['type'] })} className="px-2 py-1 rounded-lg border border-gray-200 text-sm">
                  <option value="single_choice">单选题</option>
                  <option value="true_false">判断题</option>
                  <option value="short_answer">简答题</option>
                </select>
              </div>
              <input required value={question.content} onChange={e => updateQuestion(index, { content: e.target.value })} placeholder="请输入题目内容" className="w-full px-3 py-2.5 rounded-xl border border-gray-200" />
              {question.type === 'single_choice' && (
                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((option, optionIndex) => (
                    <input key={optionIndex} required value={option} onChange={e => {
                      const options = [...question.options]; options[optionIndex] = e.target.value; updateQuestion(index, { options });
                    }} placeholder={`选项 ${String.fromCharCode(65 + optionIndex)}`} className="px-3 py-2 rounded-lg border border-gray-200" />
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input required value={question.answer} onChange={e => updateQuestion(index, { answer: e.target.value })} placeholder={question.type === 'true_false' ? '答案：正确或错误' : question.type === 'short_answer' ? '参考答案' : '正确选项，如 A'} className="flex-1 px-3 py-2 rounded-lg border border-gray-200" />
                <input type="number" min={1} value={question.score} onChange={e => updateQuestion(index, { score: Number(e.target.value) })} className="w-20 px-3 py-2 rounded-lg border border-gray-200" />
              </div>
              <input required value={question.knowledgePoints} onChange={e => updateQuestion(index, { knowledgePoints: e.target.value })} placeholder="知识点（多个用逗号分隔）" className="w-full px-3 py-2 rounded-lg border border-gray-200" />
            </div>
          ))}
          <div className="flex gap-3">
            <button type="button" onClick={() => setQuestions(items => [...items, blankQuestion()])} className="px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-700">添加题目</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white">发布作业</button>
          </div>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </form>
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">已发布作业</h3>
          <div className="space-y-3">
            {exams.map(exam => (
              <button key={exam.id} onClick={() => viewResults(exam)} className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-emerald-300">
                <div className="flex justify-between"><span className="font-medium">{exam.title}</span><span className="text-sm text-gray-500">{exam.subject}</span></div>
                <p className="text-sm text-gray-500 mt-1">{exam.questionCount} 道题 · {exam.durationMinutes} 分钟</p>
              </button>
            ))}
            {exams.length === 0 && <p className="text-sm text-gray-400">还没有发布作业</p>}
          </div>
          {selectedExam && <div className="mt-6 border-t pt-4"><h4 className="font-medium">{selectedExam.title} 成绩</h4>{results.map(item => <button type="button" key={item.studentId} onClick={() => openReview(item)} className="w-full text-left flex justify-between gap-3 py-3 border-b text-sm"><span>{item.studentName}（{item.studentId}）<span className="block text-gray-500">{selectedExam.questions.some((q: any) => q.type === 'short_answer') ? item.gradedAt ? '已批阅' : '待批阅' : '自动评分'} · 查看答卷</span></span><span>{item.totalScore} 分</span></button>)}{results.length === 0 && <p className="text-sm text-gray-400 mt-2">暂时没有提交记录</p>}</div>}
          {reviewError && !review && <p role="alert" className="text-red-600">{reviewError}</p>}
        </div>
      </div>
      {selectedExam && <section className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4"><div><h3 className="text-lg font-semibold text-gray-900">班级知识点掌握柱状图</h3><p className="text-sm text-gray-500 mt-1">{selectedExam.title} · 基于 {knowledgeAnalysis?.submissionCount ?? 0} 份提交，未批阅主观题暂不计入</p></div><span className="text-xs text-gray-400">掌握度 = 知识点实得分 ÷ 可得分</span></div>
        {knowledgeAnalysis?.knowledgePoints?.length > 0 ? <>
          <ReactECharts style={{ height: 360 }} option={{ tooltip: { trigger: 'axis', formatter: (items: any[]) => { const point = knowledgeAnalysis.knowledgePoints[items[0].dataIndex]; return `${point.knowledgePoint}<br/>掌握度：${point.masteryRate}%<br/>得分：${point.earnedScore}/${point.possibleScore}<br/>涉及题目：${point.questionCount} 道`; } }, grid: { left: 55, right: 25, bottom: 80, top: 35 }, xAxis: { type: 'category', data: knowledgeAnalysis.knowledgePoints.map((item: any) => item.knowledgePoint), axisLabel: { interval: 0, rotate: knowledgeAnalysis.knowledgePoints.length > 5 ? 25 : 0 } }, yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } }, series: [{ type: 'bar', barMaxWidth: 56, label: { show: true, position: 'top', formatter: '{c}%' }, data: knowledgeAnalysis.knowledgePoints.map((item: any) => ({ value: item.masteryRate, itemStyle: { color: item.masteryRate >= 80 ? '#10b981' : item.masteryRate >= 60 ? '#f59e0b' : '#ef4444' } })) }] }} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">{knowledgeAnalysis.knowledgePoints.map((item: any) => <div key={item.knowledgePoint} className="rounded-xl border border-gray-100 p-3"><p className="text-sm font-medium truncate" title={item.knowledgePoint}>{item.knowledgePoint}</p><p className="text-xl font-bold text-emerald-700 mt-1">{item.masteryRate}%</p><p className="text-xs text-gray-500">{item.earnedScore} / {item.possibleScore} 分</p></div>)}</div>
        </> : <div className="py-12 text-center text-gray-400">{analysisError || (results.length === 0 ? '暂无学生提交，完成作业后将生成图表' : '该作业暂无可分析的知识点得分')}</div>}
      </section>}
      {selectedExam && <section className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-4"><h3 className="text-lg font-semibold text-gray-900">作业内容与参考答案</h3><p className="text-sm text-gray-500 mt-1">教师可直接查阅已发布作业的题目、选项、知识点和标准答案</p></div>
        <div className="space-y-4">{selectedExam.questions.map((question: any, index: number) => <article key={question.id} className="rounded-xl border border-gray-100 p-4 space-y-2"><div className="flex items-start justify-between gap-3"><p className="font-medium">{index + 1}. {question.content}</p><span className="shrink-0 text-sm text-gray-500">{question.score} 分</span></div>{question.options?.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{question.options.map((option: string, optionIndex: number) => <p key={optionIndex} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">{String.fromCharCode(65 + optionIndex)}. {option}</p>)}</div>}<p className="text-sm"><span className="text-gray-500">参考答案：</span><span className="font-medium text-emerald-700">{Array.isArray(question.answer) ? question.answer.join('、') : question.answer}</span></p><p className="text-sm text-gray-600"><span className="text-gray-500">知识点：</span>{question.knowledgePoints?.length ? question.knowledgePoints.join('、') : '未标注'}</p></article>)}</div>
      </section>}
      {review && selectedExam && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="学生答卷批阅">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto p-6">
          <div className="flex justify-between gap-4"><h3 className="text-lg font-semibold">{review.studentName}的答卷</h3><button onClick={() => setReview(null)}>关闭</button></div>
          <p className="text-sm text-gray-600 my-3">客观题 {review.objectiveScore} 分 · 主观题 {review.manualScore} 分 · 当前总分 {review.totalScore} 分{review.gradedAt ? ' · 已批阅' : ' · 未完成批阅'}</p>
          {selectedExam.questions.map((q: any, index: number) => <div key={q.id} className="py-4 border-t space-y-2 break-words">
            <p className="font-medium">{index + 1}. {q.content}（满分 {q.score} 分）</p>
            <p className="text-xs text-emerald-700">知识点：{q.knowledgePoints?.length ? q.knowledgePoints.join('、') : '旧版试卷未标注'}</p>
            {q.options?.map((option: string, i: number) => <p key={i} className="text-sm text-gray-500">{String.fromCharCode(65 + i)}. {option}</p>)}
            <p className="whitespace-pre-wrap">学生答案：{Array.isArray(review.answers[q.id]) ? review.answers[q.id].join(', ') : review.answers[q.id] || '未作答'}</p>
            <p className="text-sm text-gray-600">{q.type === 'short_answer' ? '参考答案' : '正确答案'}：{Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}</p>
            {q.type === 'short_answer' && <label className="flex gap-2 items-center">得分<input aria-label={`第${index + 1}题得分`} type="number" min={0} max={q.score} step="0.5" value={scores[q.id] ?? ''} onChange={e => setScores(values => ({ ...values, [q.id]: e.target.value }))} className="border rounded px-3 py-2 w-24" /> / {q.score}</label>}
          </div>)}
          {reviewError && <p role="alert" className="text-red-600 my-3">{reviewError}</p>}
          {selectedExam.questions.some((q: any) => q.type === 'short_answer') && <button disabled={saving} onClick={saveReview} className="bg-emerald-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">{saving ? '保存中...' : review.gradedAt ? '更新批阅成绩' : '保存批阅成绩'}</button>}
        </div>
      </div>}
    </TeacherLayout>
  );
}
