import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: 'admin' | 'teacher' | 'student' }>();
  const { logout, user, isAuthenticated } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated || !user || user.role !== role) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('新密码长度必须为 6 到 128 个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setSaving(true);
    try {
      const response = await api.changePassword(oldPassword, newPassword);
      setMessage(response.data.message);
      setTimeout(() => {
        logout();
        navigate(`/login?role=${role || 'student'}`, { replace: true });
      }, 900);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '密码修改失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          返回上一页
        </button>
        <h1 className="text-2xl font-bold text-gray-900">修改密码</h1>
        <p className="text-sm text-gray-500 mt-2">修改成功后需要使用新密码重新登录。</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">旧密码</span>
            <input
              type="password"
              value={oldPassword}
              onChange={event => setOldPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">新密码</span>
            <input
              type="password"
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">确认新密码</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-amber-500 px-4 py-3 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? '提交中...' : '确认修改'}
          </button>
        </form>
      </div>
    </div>
  );
}
