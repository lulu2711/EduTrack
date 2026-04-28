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

  async loginTeacher(name: string, password: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/login/teacher', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
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
}

export const api = new ApiService();
