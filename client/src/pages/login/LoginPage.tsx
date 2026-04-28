import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const GraduationCapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') as 'student' | 'teacher' | 'admin' | null;
  
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    studentId: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  if (!role) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    let credentials = {};
    if (role === 'admin') {
      credentials = { username: formData.username, password: formData.password };
    } else if (role === 'teacher') {
      credentials = { name: formData.name, password: formData.password };
    } else {
      credentials = { studentId: formData.studentId, password: formData.password };
    }

    await login(role, credentials);
    
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      navigate(`/${role}/dashboard`);
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return '管理员登录';
      case 'teacher': return '教师登录';
      case 'student': return '学生登录';
      default: return '登录';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin': return 'from-violet-500 to-purple-600';
      case 'teacher': return 'from-emerald-500 to-teal-600';
      case 'student': return 'from-amber-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white mb-4">
            <GraduationCapIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">EduTrack</h1>
          <p className="text-gray-500 mt-1">智能成绩管理与分析系统</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getRoleColor()} px-8 py-6`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <ArrowLeftIcon />
              </button>
              <h2 className="text-xl font-semibold text-white">{getRoleLabel()}</h2>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    账号
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <UserIcon />
                    </div>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                      placeholder="请输入管理员账号"
                      required
                    />
                  </div>
                </div>
              )}

              {role === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <UserIcon />
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      placeholder="请输入教师姓名"
                      required
                    />
                  </div>
                </div>
              )}

              {role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学号
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <UserIcon />
                    </div>
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                      placeholder="请输入学号"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <LockIcon />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 transition-all outline-none ${
                      role === 'teacher' 
                        ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200' 
                        : 'focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                    }`}
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-medium text-white shadow-lg shadow-opacity-20 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${getRoleColor()}`}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 mb-2">演示账号：</p>
              {role === 'admin' && (
                <p className="text-sm text-gray-700">账号: admin | 密码: admin123</p>
              )}
              {role === 'teacher' && (
                <p className="text-sm text-gray-700">姓名: 梁浩然 | 密码: 123456</p>
              )}
              {role === 'student' && (
                <p className="text-sm text-gray-700">学号: 10101 | 密码: 学号后6位或123456</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
