import { useEffect, useState, useRef, useCallback } from 'react';
import TeacherLayout from './components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import * as echarts from 'echarts';

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

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
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

export default function ProgressPage() {
  const { user } = useAuthStore();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const progressChartRef = useRef<HTMLDivElement>(null);
  const declineChartRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!user?.classId) return;
    try {
      const response = await api.getClassProgress(user.classId);
      if (response.success) {
        setProgressData(response.data);
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
    if (!progressData) return;

    if (progressChartRef.current && progressData.progressStudents.length > 0) {
      const chart = getOrCreateChart(progressChartRef.current);
      const topProgress = progressData.progressStudents.slice(0, 10);

      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>进步: {c} 名' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { color: '#6b7280', formatter: '{value} 名' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
        yAxis: { type: 'category', data: topProgress.map(s => s.name).reverse(), axisLabel: { color: '#6b7280' } },
        series: [{
          type: 'bar',
          data: topProgress.map(s => s.progress).reverse(),
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#34d399' }, { offset: 1, color: '#10b981' }] },
            borderRadius: [0, 4, 4, 0]
          },
          label: { show: true, position: 'right', formatter: '+{c}', color: '#10b981' }
        }]
      });
    }

    if (declineChartRef.current && progressData.declineStudents.length > 0) {
      const chart = getOrCreateChart(declineChartRef.current);
      const topDecline = progressData.declineStudents.slice(0, 10);

      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>退步: {c} 名' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { color: '#6b7280', formatter: '{value} 名' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
        yAxis: { type: 'category', data: topDecline.map(s => s.name).reverse(), axisLabel: { color: '#6b7280' } },
        series: [{
          type: 'bar',
          data: topDecline.map(s => Math.abs(s.progress)).reverse(),
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#f87171' }, { offset: 1, color: '#ef4444' }] },
            borderRadius: [0, 4, 4, 0]
          },
          label: { show: true, position: 'right', formatter: '-{c}', color: '#ef4444' }
        }]
      });
    }
  }, [progressData]);

  useEffect(() => {
    if (progressData && !loading) {
      initCharts();
    }
  }, [progressData, loading, initCharts]);

  useEffect(() => {
    const handleResize = () => {
      if (progressChartRef.current) echarts.getInstanceByDom(progressChartRef.current)?.resize();
      if (declineChartRef.current) echarts.getInstanceByDom(declineChartRef.current)?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (progressChartRef.current) echarts.getInstanceByDom(progressChartRef.current)?.dispose();
      if (declineChartRef.current) echarts.getInstanceByDom(declineChartRef.current)?.dispose();
    };
  }, []);

  if (loading) {
    return (
      <TeacherLayout title="进退步分析">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="进退步分析">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUpIcon /></div>
              <span className="text-emerald-100">进步学生</span>
            </div>
            <p className="text-3xl font-bold">{progressData?.progressStudents.length || 0}</p>
            <p className="text-emerald-200 text-sm mt-1">较上次考试排名上升</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><TrendingDownIcon /></div>
              <span className="text-rose-100">退步学生</span>
            </div>
            <p className="text-3xl font-bold">{progressData?.declineStudents.length || 0}</p>
            <p className="text-rose-200 text-sm mt-1">较上次考试排名下降</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><AwardIcon /></div>
              <span className="text-amber-100">最大进步</span>
            </div>
            <p className="text-3xl font-bold">{progressData?.progressStudents[0]?.progress || 0}</p>
            <p className="text-amber-200 text-sm mt-1">{progressData?.progressStudents[0]?.name || '暂无数据'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUpIcon /></div>
              <h3 className="text-lg font-semibold text-gray-900">进步学生 TOP10</h3>
            </div>
            {progressData && progressData.progressStudents.length > 0 ? (
              <div ref={progressChartRef} style={{ height: '400px', width: '100%' }}></div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">暂无进步学生数据</div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><TrendingDownIcon /></div>
              <h3 className="text-lg font-semibold text-gray-900">退步学生 TOP10</h3>
            </div>
            {progressData && progressData.declineStudents.length > 0 ? (
              <div ref={declineChartRef} style={{ height: '400px', width: '100%' }}></div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">暂无退步学生数据</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">进步学生名单</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">排名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">姓名</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">上次排名</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">本次排名</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">进步</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {progressData?.progressStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-medium">{index + 1}</span></td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">{student.previousRank}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">{student.currentRank}</td>
                      <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">+{student.progress}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退步学生名单</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">排名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">姓名</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">上次排名</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">本次排名</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">退步</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {progressData?.declineStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-medium">{index + 1}</span></td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">{student.previousRank}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">{student.currentRank}</td>
                      <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-600">{student.progress}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0"><AlertIcon /></div>
            <div>
              <h4 className="font-medium text-amber-900 mb-2">教学建议</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• 对进步学生给予表扬和鼓励，分析其学习方法以便推广</li>
                <li>• 关注退步学生，及时了解原因并提供帮助</li>
                <li>• 定期与学生进行一对一谈话，了解学习状态</li>
                <li>• 根据进退步情况调整教学策略和重点</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
