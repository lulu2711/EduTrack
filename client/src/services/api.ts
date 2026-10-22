const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(response.ok ? '服务器返回格式不正确，请重启后端服务' : `请求失败（HTTP ${response.status}）`);
    }
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || '请求失败');
    }

    return data;
  }

  // 认证相关
  async loginAdmin(username: string, password: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/login/admin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async loginTeacher(employeeId: string, password: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/login/teacher', {
      method: 'POST',
      body: JSON.stringify({ employeeId, password }),
    });
  }

  async loginStudent(studentId: string, password: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/login/student', {
      method: 'POST',
      body: JSON.stringify({ studentId, password }),
    });
  }

  async getCurrentUser() {
    return this.request<{ success: boolean; data: { user: any; role: string } }>('/auth/me');
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.request<{ success: boolean; data: { message: string; requiresReauthentication: boolean } }>(
      '/auth/change-password',
      { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }
    );
  }

  // 数据相关
  async getDashboardStats() {
    return this.request<{ success: boolean; data: any }>('/data/dashboard/stats');
  }

  async getClasses() {
    return this.request<{ success: boolean; data: any[] }>('/data/classes');
  }

  async getClassDetail(classId: string) {
    return this.request<{ success: boolean; data: any }>(`/data/classes/${classId}`);
  }

  async getClassScores(classId: string) {
    return this.request<{ success: boolean; data: any }>(`/data/classes/${classId}/scores`);
  }

  async getClassAnalysis(classId: string) {
    return this.request<{ success: boolean; data: any }>(`/data/classes/${classId}/analysis`);
  }

  async getClassProgress(classId: string) {
    return this.request<{ success: boolean; data: any }>(`/data/classes/${classId}/progress`);
  }

  async getClassDistribution(classId: string, exam: string) {
    return this.request<{ success: boolean; data: any }>(
      `/data/classes/${classId}/distribution?exam=${encodeURIComponent(exam)}`
    );
  }

  async getTeachers() {
    return this.request<{ success: boolean; data: any[] }>('/data/teachers');
  }

  async getTeacherDetail(teacherId: string) {
    return this.request<{ success: boolean; data: any }>(`/data/teachers/${teacherId}`);
  }

  async getStudentDetail(studentId: string) {
    return this.request<{ success: boolean; data: any }>(`/data/students/${studentId}`);
  }

  async getStudentScores(studentId: string) {
    return this.request<{ success: boolean; data: any }>(`/data/students/${studentId}/scores`);
  }

  async searchStudents(keyword: string) {
    return this.request<{ success: boolean; data: any[] }>(`/data/students/search?keyword=${encodeURIComponent(keyword)}`);
  }

  async getExams() {
    return this.request<{ success: boolean; data: string[] }>('/data/exams');
  }

  async reloadLocalData() {
    return this.request<{ success: boolean; data: {
      message: string;
      gradeReportFiles: number;
      classCount: number;
      studentCount: number;
      teacherCount: number;
    } }>('/data/import/reload', { method: 'POST' });
  }

  async getOnlineExams() {
    return this.request<{ success: boolean; data: any[] }>('/online-exams');
  }
  async getForum() { return this.request<{ success: boolean; data: { posts: any[]; classes: any[] } }>('/forum'); }
  async createForumPost(payload: { title: string; content: string; classId: string | null; subject: string }) { return this.request<{ success: boolean; data: any }>('/forum/posts', { method: 'POST', body: JSON.stringify(payload) }); }
  async replyForumPost(postId: string, content: string) { return this.request<{ success: boolean; data: any }>(`/forum/posts/${postId}/replies`, { method: 'POST', body: JSON.stringify({ content }) }); }
  async likeForumPost(postId: string) { return this.request<{ success: boolean; data: any }>(`/forum/posts/${postId}/like`, { method: 'POST' }); }
  async reportForumPost(postId: string, reason: string) { return this.request<{ success: boolean }>(`/forum/posts/${postId}/report`, { method: 'POST', body: JSON.stringify({ reason }) }); }
  async moderateForumPost(postId: string, status: string) { return this.request<{ success: boolean; data: any }>(`/forum/posts/${postId}/moderate`, { method: 'PATCH', body: JSON.stringify({ status }) }); }

  async getOnlineExam(examId: string) {
    return this.request<{ success: boolean; data: any }>(`/online-exams/${examId}`);
  }

  async createOnlineExam(payload: any) {
    return this.request<{ success: boolean; data: any }>('/online-exams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async submitOnlineExam(examId: string, answers: Record<string, string | string[]>) {
    return this.request<{ success: boolean; data: any }>(`/online-exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getOnlineExamResults(examId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/online-exams/${examId}/results`);
  }
  async getClassKnowledgeAnalysis(examId: string) {
    return this.request<{ success: boolean; data: any }>(`/online-exams/${examId}/knowledge-analysis/class`);
  }
  async getMyKnowledgeAnalysis(examId: string) {
    return this.request<{ success: boolean; data: any }>(`/online-exams/${examId}/knowledge-analysis/me`);
  }
  async askAssistant(question: string) {
    return this.request<{ success: boolean; data: { answer: string; mode: 'model' | 'local'; scope: string; evidence: any } }>('/assistant/ask', {
      method: 'POST', body: JSON.stringify({ question }),
    });
  }  async gradeOnlineSubmission(examId: string, studentId: string, scores: Record<string, number>) {
    return this.request<{ success: boolean; data: any }>(`/online-exams/${examId}/submissions/${studentId}/grade`, {
      method: 'POST', body: JSON.stringify({ scores }),
    });
  }
}

export const api = new ApiService();


