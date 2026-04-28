import React from 'react';
import RoleCard from './components/RoleCard';
import AnnouncementBanner from './components/AnnouncementBanner';

// 简单的 SVG 图标组件
const GraduationCapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const HomePage: React.FC = () => {
  const roles = [
    {
      title: '学生入口',
      description: '查看个人成绩、成绩趋势分析、设定学习目标、下载成绩报告',
      icon: <GraduationCapIcon />,
      path: 'student',
      color: 'bg-amber-500',
      delay: 0,
    },
    {
      title: '教师入口',
      description: '管理班级学生、录入成绩、班级分析、查看进退步学生',
      icon: <UsersIcon />,
      path: 'teacher',
      color: 'bg-emerald-500',
      delay: 100,
    },
    {
      title: '管理员入口',
      description: '管理学校数据、配置系统设置、批量导入导出、全校分析',
      icon: <ShieldIcon />,
      path: 'admin',
      color: 'bg-violet-500',
      delay: 200,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCapIcon />
            </div>
            {/* 网站名称 */}
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              EduTrack
            </h1>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 欢迎区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            考试成绩追踪分析系统
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            让成绩管理更智能，让教学决策更有据
          </p>
        </div>

        {/* 公告区域 */}
        <div className="max-w-3xl mx-auto mb-12">
          <AnnouncementBanner />
        </div>

        {/* 角色入口卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((role) => (
            <RoleCard key={role.title} {...role} />
          ))}
        </div>

        {/* 底部信息 */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400">
            © 2024 EduTrack. 专为教育场景设计的成绩管理系统
          </p>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
