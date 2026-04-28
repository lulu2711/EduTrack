import React from 'react';

// 简单的铃铛图标
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface AnnouncementBannerProps {
  announcements?: Announcement[];
}

const defaultAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '欢迎使用 EduTrack',
    content: 'EduTrack 是专为学校设计的考试成绩追踪分析系统，支持学生、教师、管理员三种角色。',
    date: '2024-01-01',
  },
  {
    id: '2',
    title: '系统功能介绍',
    content: '学生可查看成绩趋势，教师可管理班级和分析数据，管理员可配置系统设置。',
    date: '2024-01-01',
  },
];

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcements = defaultAnnouncements,
}) => {
  if (announcements.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <BellIcon />
          <span className="text-amber-600">
            <BellIcon />
          </span>
          <h3 className="font-semibold text-gray-800">公告通知</h3>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {announcements.map((item) => (
          <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium text-gray-800">{item.title}</h4>
              <span className="text-xs text-gray-400">{item.date}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBanner;
