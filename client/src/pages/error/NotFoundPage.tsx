import { useNavigate } from 'react-router-dom';

// Icons
const GraduationCapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white mb-8">
          <GraduationCapIcon />
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-bold text-gray-200 mb-4">404</h1>
        
        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h2>
        <p className="text-gray-500 mb-8">
          抱歉，您访问的页面不存在或已被移除。
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm transition-all"
          >
            <ArrowLeftIcon />
            <span>返回上一页</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg transition-all"
          >
            <HomeIcon />
            <span>返回首页</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-400 mt-12">
          EduTrack 智能成绩管理与分析系统
        </p>
      </div>
    </div>
  );
}
