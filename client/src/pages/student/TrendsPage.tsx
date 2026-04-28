import { useEffect, useState, useRef, useCallback } from 'react';
import StudentLayout from './components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import * as echarts from 'echarts';

interface ScoreRecord {
  班级: string;
  学号: string;
  姓名: string;
  考试: string;
  总分: number;
  满分: number;
  排名: number;
  班级人数: number;
  [subject: string]: string | number;
}

interface StudentInfo {
  id: string;
  name: string;
  classId: string;
  className: string;
  grade: string;
  combination: {
    physics_history: string;
    electives: string[];
  };
  subjects: string[];
  scores: ScoreRecord[];
}

function getOrCreateChart(container: HTMLDivElement): echarts.ECharts {
  const existing = echarts.getInstanceByDom(container);
  if (existing) {
    existing.clear();
    return existing;
  }
  return echarts.init(container);
}

export default function TrendsPage() {
  const { user } = useAuthStore();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('总分');
  
  const totalScoreChartRef = useRef<HTMLDivElement>(null);
  const rankChartRef = useRef<HTMLDivElement>(null);
  const subjectChartRef = useRef<HTMLDivElement>(null);

  const loadStudentData = useCallback(async () => {
    if (!user?.studentId) return;
    try {
      const response = await api.getStudentDetail(user.studentId);
      if (response.success) {
        setStudentInfo(response.data);
      }
    } catch (error) {
      console.error('加载学生数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.studentId]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const initCharts = useCallback(() => {
    if (!studentInfo || studentInfo.scores.length === 0) return;

    const exams = studentInfo.scores.map(s => s.考试);
    const totalScores = studentInfo.scores.map(s => s.总分);
    const ranks = studentInfo.scores.map(s => s.排名);

    if (totalScoreChartRef.current) {
      const chart = getOrCreateChart(totalScoreChartRef.current);
      chart.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>总分: {c}分'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: exams,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          min: Math.min(...totalScores) - 50,
          max: Math.max(...totalScores) + 50,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
          axisLabel: { color: '#6b7280' }
        },
        series: [{
          name: '总分',
          type: 'line',
          data: totalScores,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#f59e0b',
            width: 3
          },
          itemStyle: {
            color: '#f59e0b',
            borderWidth: 2,
            borderColor: '#fff'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
              ]
            }
          }
        }]
      });
    }

    if (rankChartRef.current) {
      const chart = getOrCreateChart(rankChartRef.current);
      chart.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>排名: 第{c}名'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: exams,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          inverse: true,
          min: 1,
          max: Math.max(...ranks) + 5,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
          axisLabel: { color: '#6b7280' }
        },
        series: [{
          name: '排名',
          type: 'line',
          data: ranks,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#8b5cf6',
            width: 3
          },
          itemStyle: {
            color: '#8b5cf6',
            borderWidth: 2,
            borderColor: '#fff'
          }
        }]
      });
    }

    updateSubjectChart();
  }, [studentInfo]);

  const updateSubjectChart = useCallback(() => {
    if (!studentInfo || !subjectChartRef.current) return;

    const exams = studentInfo.scores.map(s => s.考试);
    const chart = getOrCreateChart(subjectChartRef.current);
    
    if (selectedSubject === '总分') {
      const scores = studentInfo.scores.map(s => (s.总分 / s.满分 * 100).toFixed(1));
      
      chart.setOption({
        title: {
          text: '总分得分率趋势',
          left: 'center',
          textStyle: { fontSize: 14, color: '#374151' }
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>得分率: {c}%'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: exams,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
          axisLabel: { color: '#6b7280', formatter: '{value}%' }
        },
        series: [{
          name: '得分率',
          type: 'bar',
          data: scores,
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
    } else {
      const scores = studentInfo.scores.map(s => {
        const scoreStr = s[selectedSubject] as string;
        if (!scoreStr) return 0;
        const [score, fullScore] = scoreStr.split('/').map(Number);
        return (score / fullScore * 100).toFixed(1);
      });

      chart.setOption({
        title: {
          text: `${selectedSubject}得分率趋势`,
          left: 'center',
          textStyle: { fontSize: 14, color: '#374151' }
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>得分率: {c}%'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: exams,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
          axisLabel: { color: '#6b7280', formatter: '{value}%' }
        },
        series: [{
          name: '得分率',
          type: 'bar',
          data: scores,
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
  }, [studentInfo, selectedSubject]);

  useEffect(() => {
    if (studentInfo && !loading) {
      initCharts();
    }
  }, [studentInfo, loading, initCharts]);

  useEffect(() => {
    if (studentInfo && !loading) {
      updateSubjectChart();
    }
  }, [selectedSubject, studentInfo, loading, updateSubjectChart]);

  useEffect(() => {
    const handleResize = () => {
      if (totalScoreChartRef.current) {
        const c1 = echarts.getInstanceByDom(totalScoreChartRef.current);
        c1?.resize();
      }
      if (rankChartRef.current) {
        const c2 = echarts.getInstanceByDom(rankChartRef.current);
        c2?.resize();
      }
      if (subjectChartRef.current) {
        const c3 = echarts.getInstanceByDom(subjectChartRef.current);
        c3?.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (totalScoreChartRef.current) {
        const c1 = echarts.getInstanceByDom(totalScoreChartRef.current);
        c1?.dispose();
      }
      if (rankChartRef.current) {
        const c2 = echarts.getInstanceByDom(rankChartRef.current);
        c2?.dispose();
      }
      if (subjectChartRef.current) {
        const c3 = echarts.getInstanceByDom(subjectChartRef.current);
        c3?.dispose();
      }
    };
  }, []);

  const calculateStats = () => {
    if (!studentInfo || studentInfo.scores.length === 0) return null;

    const scores = studentInfo.scores;
    const totalScores = scores.map(s => s.总分);
    const ranks = scores.map(s => s.排名);

    const avgScore = (totalScores.reduce((a, b) => a + b, 0) / totalScores.length).toFixed(1);
    const maxScore = Math.max(...totalScores);
    const minScore = Math.min(...totalScores);
    const bestRank = Math.min(...ranks);
    const worstRank = Math.max(...ranks);

    const firstScore = totalScores[0];
    const lastScore = totalScores[totalScores.length - 1];
    const totalChange = lastScore - firstScore;

    return {
      avgScore,
      maxScore,
      minScore,
      bestRank,
      worstRank,
      totalChange,
      examCount: scores.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <StudentLayout title="趋势分析">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="趋势分析">
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">平均分</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgScore}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">最高分</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.maxScore}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">最佳排名</p>
              <p className="text-2xl font-bold text-violet-600">第{stats.bestRank}名</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">总体变化</p>
              <p className={`text-2xl font-bold ${stats.totalChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.totalChange >= 0 ? '+' : ''}{stats.totalChange}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">总分趋势</h3>
          <div ref={totalScoreChartRef} style={{ height: '300px', width: '100%' }}></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">排名趋势</h3>
          <div ref={rankChartRef} style={{ height: '300px', width: '100%' }}></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">科目成绩趋势</h3>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none bg-white"
            >
              <option value="总分">总分</option>
              {studentInfo?.subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div ref={subjectChartRef} style={{ height: '300px', width: '100%' }}></div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">趋势分析总结</h3>
          <div className="space-y-2 text-amber-100">
            {stats && (
              <>
                <p>• 共参加 {stats.examCount} 次考试，平均分为 {stats.avgScore} 分</p>
                <p>• 最高分为 {stats.maxScore} 分，最低分为 {stats.minScore} 分</p>
                <p>• 最佳排名为第 {stats.bestRank} 名</p>
                <p>• 总体趋势：{stats.totalChange > 0 ? '上升' : stats.totalChange < 0 ? '下降' : '平稳'} 
                  ({stats.totalChange >= 0 ? '+' : ''}{stats.totalChange} 分)</p>
              </>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
