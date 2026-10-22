import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Send, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const prompts = ['我哪科最弱？', '班级数学成绩为什么下降？', '哪些知识点掌握最差？'];
type Reply = { question: string; answer: string; scope: string; mode: 'model' | 'local'; evidence: any };

export default function AssistantPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState<Reply | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const roleBase = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student';
  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setQuestion(trimmed);
    setError('');
    setReply(null);
    setLoading(true);
    try {
      const response = await api.askAssistant(trimmed);
      setReply({ question: trimmed, ...response.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : '暂时无法完成分析');
    } finally {
      setLoading(false);
    }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void ask(question); };

  return <main className="min-h-screen bg-[#f4f6f4] text-gray-900">
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 md:px-8">
      <button onClick={() => navigate(`${roleBase}/dashboard`)} className="p-2 rounded-md hover:bg-gray-100" aria-label="返回工作台" title="返回"><ArrowLeft size={18} /></button>
      <div className="flex items-center gap-2 ml-3"><Bot size={20} className="text-emerald-700" /><h1 className="font-semibold">智能问答</h1></div>
      <span className="ml-auto text-xs text-gray-500">数据范围：{user?.role === 'student' ? '仅本人' : user?.role === 'teacher' ? '负责班级' : '全校'}</span>
    </header>
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <section className="border-b border-gray-200 pb-8">
        <p className="text-sm font-medium text-emerald-800 flex items-center gap-2"><Sparkles size={16} /> 学业数据分析</p>
        <h2 className="text-2xl font-semibold mt-3">你想了解什么？</h2>
        <p className="text-sm text-gray-600 mt-2">回答仅使用你当前角色有权限查看的成绩数据。</p>
        <div className="flex flex-wrap gap-2 mt-5">{prompts.map(item => <button key={item} onClick={() => void ask(item)} disabled={loading} className="text-sm px-3 py-2 rounded-md border border-gray-300 bg-white hover:border-emerald-600 disabled:opacity-50">{item}</button>)}</div>
      </section>
      <form onSubmit={submit} className="flex items-end gap-2 py-5 border-b border-gray-200">
        <label className="sr-only" htmlFor="assistant-question">输入问题</label>
        <textarea id="assistant-question" value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(question); } }} maxLength={1000} rows={2} placeholder="例如：我哪科最弱？按 Shift + Enter 换行" className="flex-1 resize-y min-h-12 max-h-36 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
        <button type="submit" disabled={loading || !question.trim()} title="发送问题" className="h-11 w-11 shrink-0 grid place-items-center rounded-md bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40"><Send size={18} /></button>
      </form>
      {loading && <p className="py-6 text-sm text-gray-500">正在分析授权范围内的数据…</p>}
      {error && <p role="alert" className="my-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {reply && <article className="py-7 border-b border-gray-200">
        <div className="text-xs text-gray-500 mb-4">{reply.scope} · {reply.mode === 'model' ? '大模型回答' : '数据规则分析'}</div>
        <h3 className="text-sm font-medium text-gray-500">{reply.question}</h3>
        <p className="mt-3 text-[15px] leading-7 whitespace-pre-wrap">{reply.answer}</p>
        {(reply.evidence?.weakestSubjects?.length > 0 || reply.evidence?.weakestKnowledgePoints?.length > 0 || reply.evidence?.classSubjectChanges?.length > 0) && <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {reply.evidence.weakestSubjects?.length > 0 && <section><h4 className="text-sm font-semibold mb-2">科目得分率依据</h4>{reply.evidence.weakestSubjects.map((item: any) => <div key={item.subject} className="flex justify-between py-1.5 border-b border-gray-100 text-sm"><span>{item.subject}</span><span>{item.averageRate}%</span></div>)}</section>}
          {reply.evidence.weakestKnowledgePoints?.length > 0 && <section><h4 className="text-sm font-semibold mb-2">知识点掌握依据</h4>{reply.evidence.weakestKnowledgePoints.map((item: any) => <div key={item.knowledgePoint} className="flex justify-between py-1.5 border-b border-gray-100 text-sm"><span>{item.knowledgePoint}</span><span>{item.masteryRate}%</span></div>)}</section>}
          {reply.evidence.classSubjectChanges?.length > 0 && <section className="md:col-span-2"><h4 className="text-sm font-semibold mb-2">近期班级科目变化</h4>{reply.evidence.classSubjectChanges.map((item: any) => <div key={item.subject} className="flex justify-between py-1.5 border-b border-gray-100 text-sm"><span>{item.subject} · {item.previousExam} → {item.latestExam}</span><span className={item.change < 0 ? 'text-red-600' : 'text-emerald-700'}>{item.change > 0 ? '+' : ''}{item.change} 个百分点</span></div>)}</section>}
        </div>}
      </article>}
    </div>
  </main>;
}
