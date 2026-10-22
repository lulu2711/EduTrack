import { useEffect, useState } from 'react';
import StudentLayout from './components/StudentLayout';
import { api } from '../../services/api';
import ReactECharts from 'echarts-for-react';
import { calculateKnowledgeAnalysis, getQuestionResult } from '../../utils/knowledgeAnalysis';

export default function OnlineExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [exam, setExam] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [knowledgeAnalysis, setKnowledgeAnalysis] = useState<any | null>(null);

  useEffect(() => {
    api.getOnlineExams().then(async response => {
      if (!response.success) return;
      // 以每份作业详情中的真实提交记录为准，兼容未返回 submitted 字段的旧服务端。
      const items = await Promise.all(response.data.map(async item => {
        try {
          const detail = await api.getOnlineExam(item.id);
          return { ...item, submitted: Boolean(detail.data.submission) };
        } catch {
          return item;
        }
      }));
      setExams(items);
    }).catch(() => setMessage('作业加载失败'));
  }, []);

  const start = async (examId: string) => {
    const response = await api.getOnlineExam(examId);
    if (response.success) { setExam(response.data); setAnswers({}); setMessage(''); setKnowledgeAnalysis(null); if (response.data.submission) { setKnowledgeAnalysis(calculateKnowledgeAnalysis(response.data, [response.data.submission])); api.getMyKnowledgeAnalysis(examId).then(result => { if (result.success) setKnowledgeAnalysis(result.data); }).catch(() => undefined); } }
  };

  const submit = async () => {
    if (!exam) return;
    try {
      const response = await api.submitOnlineExam(exam.id, answers);
      if (response.success) {
        setMessage('作业提交成功，可在下方查看作答情况和得分');
        const detail = await api.getOnlineExam(exam.id);
        if (detail.success) setExam(detail.data);
        if (detail.success) setKnowledgeAnalysis(calculateKnowledgeAnalysis(detail.data, [detail.data.submission]));
        api.getMyKnowledgeAnalysis(exam.id).then(analysis => { if (analysis.success) setKnowledgeAnalysis(analysis.data); }).catch(() => undefined);
        setExams(items => items.map(item => item.id === exam.id ? { ...item, submitted: true } : item));
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : '提交失败'); }
  };

  return (
    <StudentLayout title="在线作业">
      {!exam ? (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">在线作业</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map(item => <button key={item.id} onClick={() => start(item.id)} className="text-left p-5 rounded-xl border border-gray-100 hover:border-amber-300"><div className="flex items-start justify-between gap-3"><h4 className="font-medium">{item.title}</h4><span className={`shrink-0 text-xs px-2 py-1 rounded-full ${item.submitted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.submitted ? '已完成' : '待完成'}</span></div><p className="text-sm text-gray-500 mt-2">{item.subject} · {item.questionCount} 道题 · {item.durationMinutes} 分钟</p></button>)}
          </div>
          {exams.length === 0 && <p className="text-gray-400">当前没有在线作业</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center"><div><h3 className="text-xl font-semibold">{exam.title}</h3><p className="text-sm text-gray-500 mt-1">{exam.subject} · 满分 {exam.questions.reduce((sum: number, q: any) => sum + q.score, 0)} 分</p></div><button onClick={() => setExam(null)} className="text-sm text-gray-500">返回列表</button></div>
          {exam.submission && <div className="rounded-xl bg-amber-50 p-4"><h4 className="font-semibold text-amber-900">我的成绩：{exam.submission.totalScore} / {exam.questions.reduce((sum: number, q: any) => sum + q.score, 0)} 分</h4><p className="text-sm text-amber-800 mt-1">客观题 {exam.submission.objectiveScore} 分 · 主观题 {exam.submission.manualScore} 分 · {exam.submission.gradedAt ? '教师已批阅' : '主观题待教师批阅'}</p></div>}
          {exam.questions.map((question: any, index: number) => { const result = getQuestionResult(exam, question); return <div key={question.id} className="border-b border-gray-100 pb-5"><div className="flex justify-between gap-3"><p className="font-medium mb-3">{index + 1}. {question.content} <span className="text-xs text-gray-400">（{question.score}分）</span></p>{exam.submission && <span className={`shrink-0 text-sm font-medium ${result?.correct === false ? 'text-red-600' : result?.earnedScore === null ? 'text-gray-500' : 'text-emerald-600'}`}>{result?.earnedScore === null || result?.earnedScore === undefined ? (question.type === 'short_answer' ? '待批阅' : '得分待同步') : `${result.earnedScore} / ${question.score} 分`}</span>}</div>{!exam.submission && question.type === 'single_choice' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{question.options.map((option: string, optionIndex: number) => <label key={optionIndex} className="flex gap-2 items-center p-2 rounded-lg hover:bg-amber-50"><input type="radio" name={question.id} value={String.fromCharCode(65 + optionIndex)} onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })} />{String.fromCharCode(65 + optionIndex)}. {option}</label>)}</div>}{!exam.submission && question.type === 'true_false' && <div className="flex gap-4"><label><input type="radio" name={question.id} value="正确" onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })} /> 正确</label><label><input type="radio" name={question.id} value="错误" onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })} /> 错误</label></div>}{!exam.submission && question.type === 'short_answer' && <textarea value={answers[question.id] || ''} onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })} placeholder="请输入答案，提交后由教师评分" className="w-full min-h-24 px-3 py-2 rounded-xl border border-gray-200" />}{exam.submission && <div className="space-y-2 text-sm"><p className="whitespace-pre-wrap"><span className="text-gray-500">我的答案：</span>{Array.isArray(exam.submission.answers[question.id]) ? exam.submission.answers[question.id].join('、') : exam.submission.answers[question.id] || '未作答'}</p>{question.answer !== undefined && <p className="whitespace-pre-wrap"><span className="text-gray-500">参考答案：</span>{Array.isArray(question.answer) ? question.answer.join('、') : question.answer}</p>}{question.knowledgePoints?.length > 0 && <p className="text-emerald-700">知识点：{question.knowledgePoints.join('、')}</p>}</div>}</div>; })}
          {!exam.submission && <button onClick={submit} className="px-6 py-3 rounded-xl bg-amber-500 text-white">提交作业</button>}
          {message && <p className="text-sm text-amber-700">{message}</p>}
          {exam.submission && <section className="border-t pt-5"><h4 className="text-lg font-semibold">个人知识点掌握雷达图</h4><p className="text-sm text-gray-500 mt-1">掌握度按各知识点实得分与可得分计算，未批阅主观题暂不计入</p>{knowledgeAnalysis?.knowledgePoints?.length > 0 ? <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center"><div className="lg:col-span-3"><ReactECharts style={{ height: 380 }} option={{ tooltip: { formatter: (item: any) => knowledgeAnalysis.knowledgePoints.map((point: any, index: number) => `${point.knowledgePoint}：${item.value[index]}%`).join('<br/>') }, radar: { indicator: knowledgeAnalysis.knowledgePoints.map((item: any) => ({ name: item.knowledgePoint, max: 100 })), radius: '65%', splitNumber: 5 }, series: [{ type: 'radar', data: [{ value: knowledgeAnalysis.knowledgePoints.map((item: any) => item.masteryRate), name: '掌握度', areaStyle: { color: 'rgba(245,158,11,.25)' }, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' } }] }] }} /></div><div className="lg:col-span-2 space-y-2">{knowledgeAnalysis.knowledgePoints.map((item: any) => <div key={item.knowledgePoint} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3"><div><p className="font-medium text-gray-800">{item.knowledgePoint}</p><p className="text-xs text-gray-500">{item.earnedScore} / {item.possibleScore} 分 · {item.questionCount} 道题</p></div><span className="text-lg font-bold text-amber-700">{item.masteryRate}%</span></div>)}</div></div> : <div className="py-10 text-center text-gray-400">暂无可分析的知识点得分，主观题批阅后会自动更新</div>}</section>}
        </div>
      )}
    </StudentLayout>
  );
}
