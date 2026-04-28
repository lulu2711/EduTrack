import { useEffect, useState } from 'react';
import AdminLayout from './components/AdminLayout';
import { api } from '../../services/api';

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
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

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

interface Class {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
  combination: {
    physics_history: string;
    electives: string[];
  };
  subjects: string[];
}

interface ExamScore {
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

export default function ExamsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classScores, setClassScores] = useState<ExamScore[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, examsRes] = await Promise.all([
        api.getClasses(),
        api.getExams()
      ]);
      if (classesRes.success) setClasses(classesRes.data);
      if (examsRes.success) {
        setExams(examsRes.data);
        if (examsRes.data.length > 0) setSelectedExam(examsRes.data[0]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClassScores = async (cls: Class) => {
    setSelectedClass(cls);
    setShowModal(true);
    setModalLoading(true);
    try {
      const response = await api.getClassScores(cls.id);
      if (response.success) {
        const examScores = response.data.examScores;
        if (examScores && examScores[selectedExam]) {
          setClassScores(examScores[selectedExam]);
        } else {
          const firstExam = Object.keys(examScores || {})[0];
          if (firstExam) {
            setClassScores(examScores[firstExam]);
            setSelectedExam(firstExam);
          } else {
            setClassScores([]);
          }
        }
      }
    } catch (error) {
      console.error('加载成绩失败:', error);
      setClassScores([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleExamChange = async (exam: string) => {
    setSelectedExam(exam);
    if (!selectedClass) return;
    setModalLoading(true);
    try {
      const response = await api.getClassScores(selectedClass.id);
      if (response.success) {
        setClassScores(response.data.examScores?.[exam] || []);
      }
    } catch (error) {
      console.error('加载成绩失败:', error);
      setClassScores([]);
    } finally {
      setModalLoading(false);
    }
  };

  const examOrder = ['月考1', '月考2', '月考3', '期中考试', '期末考试'];

  const gradeGroups = classes.reduce((acc, cls) => {
    if (!acc[cls.grade]) acc[cls.grade] = [];
    acc[cls.grade].push(cls);
    return acc;
  }, {} as Record<string, Class[]>);

  if (loading) {
    return (
      <AdminLayout title="考试管理">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="考试管理">
      <div className="space-y-6">
        {/* Exam Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">考试列表</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {examOrder.map((exam) => {
              const available = exams.includes(exam);
              return (
                <button
                  key={exam}
                  onClick={() => available && setSelectedExam(exam)}
                  disabled={!available}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedExam === exam
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : available
                        ? 'border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 text-gray-700'
                        : 'border-gray-50 bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileTextIcon />
                    <span className="font-medium">{exam}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {available ? '有数据' : '暂无数据'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Classes by Grade */}
        {Object.entries(gradeGroups).sort(([a], [b]) => a.localeCompare(b)).map(([grade, gradeClasses]) => (
          <div key={grade} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{grade}</h3>
              <span className="text-sm text-gray-500">{gradeClasses.length} 个班级</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gradeClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => handleViewClassScores(cls)}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                      <FileTextIcon />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">{cls.name}</h4>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <UsersIcon />
                        <span>{cls.studentCount}人</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                    <ChevronRightIcon />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Class Scores Modal */}
      {showModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedClass.name} - 成绩查询</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedClass.grade} · {selectedClass.studentCount}名学生</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedExam}
                  onChange={(e) => handleExamChange(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all outline-none bg-white"
                >
                  {exams.map(exam => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <XIcon />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[65vh]">
              {modalLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : classScores.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">排名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">学号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">姓名</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">总分</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">满分</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">得分率</th>
                        {selectedClass.subjects.map(subject => (
                          <th key={subject} className="px-4 py-3 text-center text-xs font-medium text-gray-500">{subject}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {classScores
                        .sort((a, b) => a.排名 - b.排名)
                        .map((score) => {
                          const percentage = (score.总分 / score.满分) * 100;
                          return (
                            <tr key={score.学号} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
                                  score.排名 <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {score.排名}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{score.学号}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{score.姓名}</td>
                              <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{score.总分}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-500">{score.满分}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  percentage >= 90 ? 'bg-emerald-50 text-emerald-600' :
                                  percentage >= 80 ? 'bg-blue-50 text-blue-600' :
                                  percentage >= 60 ? 'bg-amber-50 text-amber-600' :
                                  'bg-rose-50 text-rose-600'
                                }`}>
                                  {percentage.toFixed(1)}%
                                </span>
                              </td>
                              {selectedClass.subjects.map(subject => {
                                const scoreStr = score[subject] as string;
                                return (
                                  <td key={subject} className="px-4 py-3 text-sm text-center text-gray-700">
                                    {scoreStr || '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <SearchIcon />
                  </div>
                  <p className="text-gray-500">该考试暂无成绩数据</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
