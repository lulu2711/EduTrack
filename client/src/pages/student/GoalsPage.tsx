import { useState } from 'react';
import StudentLayout from './components/StudentLayout';

// Icons
const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

interface Goal {
  id: string;
  subject: string;
  targetScore: number;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      subject: '数学',
      targetScore: 130,
      deadline: '2024-07-01',
      completed: false,
      createdAt: '2024-06-01'
    },
    {
      id: '2',
      subject: '英语',
      targetScore: 135,
      deadline: '2024-07-01',
      completed: true,
      createdAt: '2024-05-15'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    subject: '',
    targetScore: '',
    deadline: ''
  });

  const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];

  const handleAddGoal = () => {
    if (!newGoal.subject || !newGoal.targetScore || !newGoal.deadline) return;

    const goal: Goal = {
      id: Date.now().toString(),
      subject: newGoal.subject,
      targetScore: parseInt(newGoal.targetScore),
      deadline: newGoal.deadline,
      completed: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setGoals([...goals, goal]);
    setNewGoal({ subject: '', targetScore: '', deadline: '' });
    setShowAddModal(false);
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

  return (
    <StudentLayout title="学习目标">
      <div className="space-y-6">
        {/* Progress Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">目标完成进度</h3>
              <p className="text-sm text-gray-500 mt-1">
                已完成 {completedCount} / {goals.length} 个目标
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold">
              {Math.round(progress)}%
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Add Goal Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-amber-500 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon />
          <span>添加新目标</span>
        </button>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`bg-white rounded-2xl shadow-sm p-5 transition-all ${
                goal.completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleGoal(goal.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    goal.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-gray-300 hover:border-amber-500'
                  }`}
                >
                  {goal.completed && <CheckIcon />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className={`font-medium ${goal.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {goal.subject}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-600">
                      目标: {goal.targetScore}分
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    截止日期: {goal.deadline}
                  </p>
                </div>

                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {goals.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <TargetIcon />
            </div>
            <p className="text-gray-500">还没有设置学习目标</p>
            <p className="text-sm text-gray-400 mt-1">点击上方按钮添加你的第一个目标</p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
          <h4 className="font-medium text-amber-900 mb-2">💡 目标设定建议</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• 目标要具体可衡量，比如"数学达到130分"</li>
            <li>• 设定合理的截止日期，给自己充足的时间</li>
            <li>• 定期回顾目标完成情况，及时调整</li>
            <li>• 完成目标后记得给自己一些奖励哦！</li>
          </ul>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">添加新目标</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">科目</label>
                <select
                  value={newGoal.subject}
                  onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                >
                  <option value="">选择科目</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">目标分数</label>
                <input
                  type="number"
                  value={newGoal.targetScore}
                  onChange={(e) => setNewGoal({ ...newGoal, targetScore: e.target.value })}
                  placeholder="例如: 130"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">截止日期</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddGoal}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg transition-all"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
