import React from 'react';
import { useNavigate } from 'react-router-dom';

interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  delay?: number;
}

const RoleCard: React.FC<RoleCardProps> = ({
  title,
  description,
  icon,
  path,
  color,
  delay = 0,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="group relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => navigate(`/login?role=${path}`)}
    >
      {/* 背景渐变 */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${color}`}
      />

      {/* 图标 */}
      <div
        className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${color} bg-opacity-10`}
      >
        <div className={`text-3xl ${color.replace('bg-', 'text-')}`}>{icon}</div>
      </div>

      {/* 标题 */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-gray-900">
        {title}
      </h3>

      {/* 描述 */}
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>

      {/* 箭头 */}
      <div className="mt-6 flex items-center text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
        <span>进入系统</span>
        <svg
          className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
};

export default RoleCard;
