import { Exam } from '../models';
import { mongoReady } from './mongoAuth';
import { mongoClassScores } from './mongoData';
import { getClassById } from './localData';

function aggregateStudentExamRows(scores: any[]) {
  const groups = new Map<string, any>();
  for (const score of scores) {
    const key = `${score.学号}|${score.考试}`;
    const row = groups.get(key) || { ...score, 总分: 0, 满分: 0 };
    row.总分 += Number(score.总分 || 0);
    row.满分 += Number(score.满分 || 0);
    row[score.科目] = `${score.总分}/${score.满分}`;
    groups.set(key, row);
  }
  return [...groups.values()];
}

export async function mongoClassAnalysis(classId: string) {
  const data = await mongoClassScores(classId); if (!data) return null;
  const rows = aggregateStudentExamRows(data.scores);
  const cls = getClassById(classId); const subjects = cls?.subjects || data.cls.subjects || [];
  const analysis: Record<string, any> = {};
  for (const exam of [...new Set(rows.map(s => s.考试))]) {
    const examRows = rows.filter(s => s.考试 === exam); const totals = examRows.map(s => s.总分); const subjectAnalysis: Record<string, any> = {};
    for (const subject of subjects) {
      const values = examRows.map(s => { const raw = (s as any)[subject]; if (typeof raw !== 'string') return null; const [score, full] = raw.split('/').map(Number); return Number.isFinite(score) && full > 0 ? { score, full } : null; }).filter((v): v is { score: number; full: number } => Boolean(v));
      if (values.length) subjectAnalysis[subject] = { avg: Number((values.reduce((a, b) => a + b.score, 0) / values.length).toFixed(2)), avgRate: Number((values.reduce((a, b) => a + b.score / b.full, 0) / values.length * 100).toFixed(2)), max: Math.max(...values.map(v => v.score)), min: Math.min(...values.map(v => v.score)) };
    }
    analysis[exam] = { studentCount: examRows.length, averageScore: Number((totals.reduce((a,b) => a+b, 0) / totals.length).toFixed(2)), highestScore: Math.max(...totals), lowestScore: Math.min(...totals), subjectAnalysis };
  }
  return { classId, className: data.cls.name, grade: cls?.grade || '', analysis };
}
export async function mongoExams() { if (!mongoReady()) return null; return (await Exam.distinct('name')).sort(); }
export async function mongoDistribution(classId: string, examName?: string) {
  const data = await mongoClassScores(classId); if (!data) return null; const rows = aggregateStudentExamRows(data.scores); const selected = examName || [...new Set(rows.map(s => s.考试))].pop(); const examRows = rows.filter(s => s.考试 === selected);
  const ranges: Record<string, number> = {'700+':0,'650-699':0,'600-649':0,'550-599':0,'500-549':0,'450-499':0,'400-449':0,'350-399':0,'<350':0};
  examRows.forEach(s => { const n=s.总分; if(n>=700)ranges['700+']++;else if(n>=650)ranges['650-699']++;else if(n>=600)ranges['600-649']++;else if(n>=550)ranges['550-599']++;else if(n>=500)ranges['500-549']++;else if(n>=450)ranges['450-499']++;else if(n>=400)ranges['400-449']++;else if(n>=350)ranges['350-399']++;else ranges['<350']++; });
  return { classId, className: data.cls.name, exam: selected, distribution: ranges, totalStudents: examRows.length };
}
export async function mongoProgress(classId: string) {
  const data = await mongoClassScores(classId); if (!data) return null; const rows = aggregateStudentExamRows(data.scores); const exams = [...new Set(rows.map(s => s.考试))]; const groups = new Map<string, any[]>();
  rows.forEach(s => { const list=groups.get(s.学号)||[]; list.push(s); groups.set(s.学号,list); }); const result:any[]=[];
  groups.forEach(scores => { const byExam=new Map(scores.map(s=>[s.考试,s])); if(exams.length>=2){const prev=byExam.get(exams[exams.length-2]);const cur=byExam.get(exams[exams.length-1]);if(prev&&cur)result.push({name:scores[0].姓名,progress:prev.排名-cur.排名,currentRank:cur.排名,previousRank:prev.排名});}});
  return {classId,className:data.cls.name,progressStudents:result.filter(x=>x.progress>0).sort((a,b)=>b.progress-a.progress).slice(0,10),declineStudents:result.filter(x=>x.progress<0).sort((a,b)=>a.progress-b.progress).slice(0,10)};
}

