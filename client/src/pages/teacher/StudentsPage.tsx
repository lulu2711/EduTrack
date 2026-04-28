import { useEffect, useState } from 'react';
import TeacherLayout from './components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

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

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

interface Student {
  id: string;
  name: string;
  currentRank?: number;
  previousRank?: number;
  currentScore?: number;
}

interface StudentDetail {
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
  scores: Array<{
    班级: string;
    学号: string;
    姓名: string;
    考试: string;
    总分: number;
    满分: number;
    排名: number;
    班级人数: number;
    [subject: string]: string | number;
  }>;
}

export default function StudentsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string>('');

  useEffect(() => {
    if (user?.classId) {
      loadStudents();
    }
  }, [user]);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);

  const loadStudents = async () => {
    try {
      const [classRes, progressRes] = await Promise.all([
        api.getClassDetail(user!.classId!),
        api.getClassProgress(user!.classId!)
      ]);

      if (classRes.success) {
        const progressMap = new Map();
        if (progressRes.success) {
          progressRes.data.progressStudents.forEach((s: any) => {
            progressMap.set(s.name, { currentRank: s.currentRank, previousRank: s.previousRank });
          });
          progressRes.data.declineStudents.forEach((s: any) => {
            progressMap.set(s.name, { currentRank: s.currentRank, previousRank: s.previousRank });
          });
        }

        const studentsWithProgress = classRes.data.students.map((s: any) => ({
          ...s,
          ...progressMap.get(s.name)
        }));

        setStudents(studentsWithProgress);
        setFilteredStudents(studentsWithProgress);
      }
    } catch (error) {
      console.error('加载学生失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredStudents(filtered);
  };

  const handleViewDetail = async (student: Student) => {
    try {
      const response = await api.getStudentDetail(student.id);
      if (response.success) {
        setSelectedStudent(response.data);
        if (response.data.scores.length > 0) {
          setSelectedExam(response.data.scores[response.data.scores.length - 1].考试);
        }
        setShowModal(true);
      }
    } catch (error) {
      console.error('加载学生详情失败:', error);
    }
  };

  const getRankChange = (student: Student) => {
    if (!student.currentRank || !student.previousRank) return null;
    return student.previousRank - student.currentRank;
  };

  const getSelectedScore = () => {
    return selectedStudent?.scores.find(s => s.考试 === selectedExam);
  };

  if (loading) {
    return (
      <TeacherLayout title="学生管理">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TeacherLayout>
    );
  }

  const selectedScore = getSelectedScore();

  return (
    <TeacherLayout title="学生管理">
      <div className="space-y-6">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索学生姓名或学号..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
            />
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div>
              <span className="text-sm text-gray-500">班级人数</span>
              <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const rankChange = getRankChange(student);
            return (
              <div
                key={student.id}
                onClick={() => handleViewDetail(student)}
                className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
                    {student.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500">{student.id}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <ChevronRightIcon />
                  </div>
                </div>

                {rankChange !== null && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className={`flex items-center gap-1 text-sm ${
                      rankChange > 0 ? 'text-emerald-600' : rankChange < 0 ? 'text-rose-600' : 'text-gray-500'
                    }`}>
                      {rankChange > 0 ? <TrendingUpIcon /> : rankChange < 0 ? <TrendingDownIcon /> : <MinusIcon />}
                      <span>较上次 {rankChange > 0 ? `进步 ${rankChange} 名` : rankChange < 0 ? `退步 ${Math.abs(rankChange)} 名` : '持平'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <SearchIcon />
            </div>
            <p className="text-gray-500">未找到匹配的学生</p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.className} · 学号: {selectedStudent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[70vh]">
              {/* Exam Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择考试</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white"
                >
                  {selectedStudent.scores.map(score => (
                    <option key={score.考试} value={score.考试}>{score.考试}</option>
                  ))}
                </select>
              </div>

              {/* Score Overview */}
              {selectedScore && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                    <p className="text-emerald-100 text-sm mb-1">总分</p>
                    <p className="text-2xl font-bold">{selectedScore.总分}</p>
                    <p className="text-emerald-200 text-sm">/ {selectedScore.满分}</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <p className="text-gray-500 text-sm mb-1">班级排名</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedScore.排名}</p>
                    <p className="text-gray-400 text-sm">/ {selectedScore.班级人数}</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <p className="text-gray-500 text-sm mb-1">得分率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {((selectedScore.总分 / selectedScore.满分) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Subject Scores */}
              {selectedScore && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">各科成绩</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedStudent.subjects.map((subject) => {
                      const scoreStr = selectedScore[subject] as string;
                      if (!scoreStr) return null;
                      const [score, fullScore] = scoreStr.split('/').map(Number);
                      const percentage = (score / fullScore) * 100;
                      const level = percentage >= 90 ? '优秀' : percentage >= 80 ? '良好' : percentage >= 60 ? '及格' : '待提高';
                      const color = percentage >= 90 ? 'bg-emerald-50 text-emerald-600' : percentage >= 80 ? 'bg-blue-50 text-blue-600' : percentage >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600';

                      return (
                        <div key={subject} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">{subject}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{level}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-gray-900">{score}</span>
                            <span className="text-sm text-gray-400">/{fullScore}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Score History */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">历次考试成绩</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">考试</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">总分</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">排名</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">得分率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedStudent.scores.map((score) => (
                        <tr
                          key={score.考试}
                          className={score.考试 === selectedExam ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}
                          onClick={() => setSelectedExam(score.考试)}
                        >
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{score.考试}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-700">{score.总分}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-700">{score.排名}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-700">
                            {((score.总分 / score.满分) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
