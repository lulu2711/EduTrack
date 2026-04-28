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

interface Student {
  id: string;
  name: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [searchQuery, selectedGrade, classes]);

  const loadClasses = async () => {
    try {
      const response = await api.getClasses();
      if (response.success) {
        setClasses(response.data);
        setFilteredClasses(response.data);
      }
    } catch (error) {
      console.error('加载班级失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    let filtered = classes;

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(c => c.grade === selectedGrade);
    }

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredClasses(filtered);
  };

  const handleViewDetail = async (cls: Class) => {
    try {
      const response = await api.getClassDetail(cls.id);
      if (response.success) {
        setSelectedClass(response.data);
        setStudents(response.data.students || []);
        setShowModal(true);
      }
    } catch (error) {
      console.error('加载班级详情失败:', error);
    }
  };

  const grades = ['all', ...Array.from(new Set(classes.map(c => c.grade))).sort()];

  if (loading) {
    return (
      <AdminLayout title="班级管理">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="班级管理">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索班级名称或编号..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all outline-none"
            />
          </div>

          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all outline-none bg-white"
          >
            <option value="all">全部年级</option>
            {grades.filter(g => g !== 'all').map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <div>
            <span className="text-sm text-gray-500">总班级数</span>
            <p className="text-2xl font-bold text-gray-900">{filteredClasses.length}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">总学生数</span>
            <p className="text-2xl font-bold text-gray-900">
              {filteredClasses.reduce((sum, c) => sum + c.studentCount, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleViewDetail(cls)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                  {cls.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">班级编号: {cls.id}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <ChevronRightIcon />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {cls.grade}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                {cls.combination.physics_history}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <UsersIcon />
                <span>{cls.studentCount} 名学生</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">选科组合</p>
              <div className="flex flex-wrap gap-1">
                {cls.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-600"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredClasses.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <SearchIcon />
          </div>
          <p className="text-gray-500">未找到匹配的班级</p>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedClass.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedClass.grade} · {selectedClass.combination.physics_history} · {students.length}名学生
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-auto max-h-[60vh]">
              {/* Subjects */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">开设科目</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClass.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1.5 rounded-lg text-sm bg-violet-50 text-violet-600"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Students List */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">学生名单</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {student.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
