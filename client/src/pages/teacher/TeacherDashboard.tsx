import { useEffect, useState, useRef, useCallback } from 'react';
import TeacherLayout from './components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import * as echarts from 'echarts';

// Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const AwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
);

const BarChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

function getOrCreateChart(container: HTMLDivElement): echarts.ECharts {
  const existing = echarts.getInstanceByDom(container);
  if (existing) {
    existing.clear();
    return existing;
  }
  return echarts.init(container);
}

interface ClassAnalysis {
  classId: string;
  className: string;
  grade: string;
  analysis: Record<string, {
    studentCount: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    subjectAnalysis: Record<string, {
      avg: number;
      max: number;
      min: number;
    }>;
  }>;
}

interface ProgressStudent {
  name: string;
  progress: number;
  currentRank: number;
  previousRank: number;
}

interface ProgressData {
  classId: string;
  className: string;
  progressStudents: ProgressStudent[];
  declineStudents: ProgressStudent[];
}

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [analysis, setAnalysis] = useState<ClassAnalysis | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string>('期末考试');
  
  const scoreDistChartRef = useRef<HTMLDivElement>(null);
  const subjectChartRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!user?.classId) return;
    try {
      const [analysisRes, progressRes] = await Promise.all([
        api.getClassAnalysis(user.classId),
        api.getClassProgress(user.classId)
      ]);
      
      if (analysisRes.success) {
        setAnalysis(analysisRes.data);
      }
      if (progressRes.success) {
        setProgressData(progressRes.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const initCharts = useCallback(() => {
    if (!analysis) return;

    const examData = analysis.analysis[selectedExam];
    if (!examData) return;

    if (scoreDistChartRef.current) {
      const chart = getOrCreateChart(scoreDistChartRef.current);
      const ranges = ['400-', '400-449', '450-499', '500-549', '550-599', '600-649', '650+'];
      const counts = [2, 5, 8, 12, 10, 8, 5];
      
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: ranges,
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } }
        },
        series: [{
          data: counts,
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#34d399' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          }
        }]
      });
    }

    if (subjectChartRef.current && examData.subjectAnalysis) {
      const chart = getOrCreateChart(subjectChartRef.current);
      const subjects = Object.keys(examData.subjectAnalysis);
      const avgs = subjects.map(s => examData.subjectAnalysis[s].avg);
      
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: subjects,
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } }
        },
        series: [{
          data: avgs,
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#f59e0b' },
                { offset: 1, color: '#fbbf24' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          }
        }]
      });
    }
  }, [analysis, selectedExam]);

  useEffect(() => {
    if (analysis && !loading) {
      initCharts();
    }
  }, [analysis, loading, initCharts]);

  useEffect(() => {
    const handleResize = () => {
      if (scoreDistChartRef.current) {
        const c = echarts.getInstanceByDom(scoreDistChartRef.current);
        c?.resize();
      }
      if (subjectChartRef.current) {
        const c = echarts.getInstanceByDom(subjectChartRef.current);
        c?.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scoreDistChartRef.current) {
        const c = echarts.getInstanceByDom(scoreDistChartRef.current);
        c?.dispose();
      }
      if (subjectChartRef.current) {
        const c = echarts.getInstanceByDom(subjectChartRef.current);
        c?.dispose();
      }
    };
  }, []);

  const getExamData = () => {
    return analysis?.analysis[selectedExam];
  };

  const examData = getExamData();

  if (loading) {
    return (
      <TeacherLayout title="班级分析">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TeacherLayout>
    );
  }

  const exams = Object.keys(analysis?.analysis || {});

  return (
    <TeacherLayout title="班级分析">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{analysis?.className}</h3>
              <p className="text-gray-500 mt-1">{analysis?.grade} · 共 {examData?.studentCount || 0} 名学生</p>
            </div>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white"
            >
              {exams.map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </div>
        </div>

        {examData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BarChartIcon />
                </div>
                <span className="text-sm text-gray-500">平均分</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{examData.averageScore.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AwardIcon />
                </div>
                <span className="text-sm text-gray-500">最高分</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{examData.highestScore}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDownIcon />
                </div>
                <span className="text-sm text-gray-500">最低分</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{examData.lowestScore}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <UsersIcon />
                </div>
                <span className="text-sm text-gray-500">参考人数</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{examData.studentCount}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">成绩分布</h3>
            <div ref={scoreDistChartRef} style={{ height: '300px', width: '100%' }}></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">各科平均分</h3>
            <div ref={subjectChartRef} style={{ height: '300px', width: '100%' }}></div>
          </div>
        </div>

        {progressData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUpIcon />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">进步学生 TOP5</h3>
              </div>
              <div className="space-y-3">
                {progressData.progressStudents.slice(0, 5).map((student, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">
                        第{student.previousRank}名 → 第{student.currentRank}名
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">
                      +{student.progress}
                    </span>
                  </div>
                ))}
                {progressData.progressStudents.length === 0 && (
                  <p className="text-center text-gray-400 py-4">暂无进步学生数据</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDownIcon />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">退步学生 TOP5</h3>
              </div>
              <div className="space-y-3">
                {progressData.declineStudents.slice(0, 5).map((student, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50">
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">
                        第{student.previousRank}名 → 第{student.currentRank}名
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-600">
                      {student.progress}
                    </span>
                  </div>
                ))}
                {progressData.declineStudents.length === 0 && (
                  <p className="text-center text-gray-400 py-4">暂无退步学生数据</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
