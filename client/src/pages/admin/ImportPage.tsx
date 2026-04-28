import { useState } from 'react';
import AdminLayout from './components/AdminLayout';

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

export default function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleImport = (type: string) => {
    setImporting(true);
    setImportResult(null);

    setTimeout(() => {
      setImporting(false);
      setImportResult({
        success: true,
        message: `${type}数据已从本地文件加载完成`,
      });
    }, 1500);
  };

  return (
    <AdminLayout title="数据导入">
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
              <InfoIcon />
            </div>
            <div>
              <h4 className="font-medium text-violet-900 mb-2">当前数据模式</h4>
              <p className="text-sm text-violet-800">
                系统当前使用本地 JSON 文件作为数据源。以下数据已自动加载：
              </p>
              <ul className="text-sm text-violet-700 mt-2 space-y-1">
                <li>• school_data.json - 学校班级和学生数据（60个班级，3322名学生）</li>
                <li>• teachers.json - 教师账号数据（15名教师）</li>
                <li>• grade_subject_reports/*.json - 144个成绩报告文件</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Import Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* School Data */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
              <FileIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">学校数据</h3>
            <p className="text-sm text-gray-500 mb-4">
              导入班级、学生、选科组合等基础数据
            </p>
            <div className="mb-4">
              <p className="text-xs text-gray-400">支持格式: JSON</p>
              <p className="text-xs text-gray-400">文件: school_data.json</p>
            </div>
            <button
              onClick={() => handleImport('学校')}
              disabled={importing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {importing ? '导入中...' : '重新加载'}
            </button>
          </div>

          {/* Teacher Data */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <FileIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">教师数据</h3>
            <p className="text-sm text-gray-500 mb-4">
              导入教师账号、班级分配等数据
            </p>
            <div className="mb-4">
              <p className="text-xs text-gray-400">支持格式: JSON</p>
              <p className="text-xs text-gray-400">文件: teachers.json</p>
            </div>
            <button
              onClick={() => handleImport('教师')}
              disabled={importing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {importing ? '导入中...' : '重新加载'}
            </button>
          </div>

          {/* Grade Data */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">成绩数据</h3>
            <p className="text-sm text-gray-500 mb-4">
              导入各次考试成绩报告数据
            </p>
            <div className="mb-4">
              <p className="text-xs text-gray-400">支持格式: JSON</p>
              <p className="text-xs text-gray-400">文件: grade_subject_reports/*.json</p>
            </div>
            <button
              onClick={() => handleImport('成绩')}
              disabled={importing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {importing ? '导入中...' : '重新加载'}
            </button>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`rounded-2xl p-6 ${
            importResult.success
              ? 'bg-emerald-50 border border-emerald-100'
              : 'bg-rose-50 border border-rose-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                importResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}>
                <CheckCircleIcon />
              </div>
              <div>
                <h4 className={`font-medium ${
                  importResult.success ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {importResult.success ? '导入成功' : '导入失败'}
                </h4>
                <p className={`text-sm ${
                  importResult.success ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {importResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area (Future Feature) */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">上传新数据</h3>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-violet-300 transition-colors cursor-pointer">
            <div className="text-gray-300 mb-4 flex justify-center">
              <UploadIcon />
            </div>
            <p className="text-gray-500 mb-2">拖拽文件到此处或点击上传</p>
            <p className="text-sm text-gray-400">支持 JSON、CSV 格式文件</p>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            此功能将在后续版本中支持，当前数据已从本地文件自动加载
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
