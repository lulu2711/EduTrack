import { useEffect, useState } from 'react';
import StudentLayout from './components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

// Icons
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

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

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'total' | 'subjects'>('total');
  const [selectedExam, setSelectedExam] = useState<string>('');

  useEffect(() => {
    if (user?.studentId) {
      loadStudentData();
    }
  }, [user]);

  const loadStudentData = async () => {
    try {
      const response = await api.getStudentDetail(user!.studentId!);
      if (response.success) {
        setStudentInfo(response.data);
        if (response.data.scores.length > 0) {
          setSelectedExam(response.data.scores[response.data.scores.length - 1].考试);
        }
      }
    } catch (error) {
      console.error('加载学生数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedScore = () => {
    return studentInfo?.scores.find(s => s.考试 === selectedExam);
  };

  const getRankChange = (currentRank: number, examName: string) => {
    const examOrder = ['月考1', '月考2', '月考3', '期中考试', '期末考试'];
    const currentIndex = examOrder.indexOf(examName);
    if (currentIndex <= 0) return null;

    const prevExam = examOrder[currentIndex - 1];
    const prevScore = studentInfo?.scores.find(s => s.考试 === prevExam);
    if (!prevScore) return null;

    const change = prevScore.排名 - currentRank;
    return change;
  };

  const getScoreLevel = (score: number, fullScore: number) => {
    const percentage = (score / fullScore) * 100;
    if (percentage >= 90) return { level: '优秀', color: 'text-emerald-600 bg-emerald-50' };
    if (percentage >= 80) return { level: '良好', color: 'text-blue-600 bg-blue-50' };
    if (percentage >= 60) return { level: '及格', color: 'text-amber-600 bg-amber-50' };
    return { level: '待提高', color: 'text-rose-600 bg-rose-50' };
  };

  if (loading) {
    return (
      <StudentLayout title="成绩查询">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </StudentLayout>
    );
  }

  const selectedScore = getSelectedScore();
  const rankChange = selectedScore ? getRankChange(selectedScore.排名, selectedScore.考试) : null;

  return (
    <StudentLayout title="成绩查询">
      <div className="space-y-6">
        {/* Student Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                {studentInfo?.name?.[0]}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{studentInfo?.name}</h3>
                <p className="text-gray-500">{studentInfo?.className}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                    {studentInfo?.combination.physics_history}
                  </span>
                </div>
              </div>
            </div>

            {/* Exam Selector */}
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none bg-white"
            >
              {studentInfo?.scores.map((score) => (
                <option key={score.考试} value={score.考试}>{score.考试}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('total')}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'total' ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              总分成绩
              {activeTab === 'total' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'subjects' ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              各科成绩
              {activeTab === 'subjects' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
              )}
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'total' && selectedScore && (
              <div className="space-y-6">
                {/* Total Score Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                    <p className="text-amber-100 text-sm mb-1">总分</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{selectedScore.总分}</span>
                      <span className="text-amber-200">/ {selectedScore.满分}</span>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20`}>
                        {getScoreLevel(selectedScore.总分, selectedScore.满分).level}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6">
                    <p className="text-gray-500 text-sm mb-1">班级排名</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">{selectedScore.排名}</span>
                      <span className="text-gray-400">/ {selectedScore.班级人数}</span>
                    </div>
                    {rankChange !== null && rankChange !== undefined && (
                      <div className={`mt-3 flex items-center gap-1 text-sm ${
                        rankChange > 0 ? 'text-emerald-600' : rankChange < 0 ? 'text-rose-600' : 'text-gray-500'
                      }`}>
                        {rankChange > 0 ? <TrendingUpIcon /> : rankChange < 0 ? <TrendingDownIcon /> : <MinusIcon />}
                        <span>较上次 {rankChange > 0 ? `进步 ${rankChange} 名` : rankChange < 0 ? `退步 ${Math.abs(rankChange)} 名` : '持平'}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6">
                    <p className="text-gray-500 text-sm mb-1">得分率</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {((selectedScore.总分 / selectedScore.满分) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${(selectedScore.总分 / selectedScore.满分) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Score Trend Table */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">历次考试总分趋势</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">考试</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">总分</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">班级排名</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">进退步</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">得分率</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {studentInfo?.scores.map((score, index) => {
                          const prevScore = index > 0 ? studentInfo.scores[index - 1] : null;
                          const change = prevScore ? prevScore.排名 - score.排名 : 0;
                          return (
                            <tr
                              key={score.考试}
                              className={score.考试 === selectedExam ? 'bg-amber-50/50' : 'hover:bg-gray-50'}
                              onClick={() => setSelectedExam(score.考试)}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{score.考试}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700">{score.总分}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700">{score.排名}</td>
                              <td className="px-4 py-3 text-sm text-center">
                                {index === 0 ? (
                                  <span className="text-gray-400">-</span>
                                ) : (
                                  <span className={`flex items-center justify-center gap-1 ${
                                    change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-gray-500'
                                  }`}>
                                    {change > 0 ? '+' : ''}{change}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700">
                                {((score.总分 / score.满分) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subjects' && selectedScore && (
              <div className="space-y-6">
                {/* Subject Scores Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {studentInfo?.subjects.map((subject) => {
                    const scoreStr = selectedScore[subject] as string;
                    if (!scoreStr) return null;
                    const [score, fullScore] = scoreStr.split('/').map(Number);
                    const level = getScoreLevel(score, fullScore);

                    return (
                      <div key={subject} className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">{subject}</p>
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                          <span className="text-2xl font-bold text-gray-900">{score}</span>
                          <span className="text-sm text-gray-400">/{fullScore}</span>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${level.color}`}>
                          {level.level}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Subject Detail Table */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">各科成绩详情</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">科目</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">分数</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">满分</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">得分率</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">等级</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {studentInfo?.subjects.map((subject) => {
                          const scoreStr = selectedScore[subject] as string;
                          if (!scoreStr) return null;
                          const [score, fullScore] = scoreStr.split('/').map(Number);
                          const level = getScoreLevel(score, fullScore);

                          return (
                            <tr key={subject} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700">{score}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-500">{fullScore}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700">
                                {((score / fullScore) * 100).toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${level.color}`}>
                                  {level.level}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
