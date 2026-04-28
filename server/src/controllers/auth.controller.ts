import { Request, Response } from 'express';
import { generateToken } from '../utils/jwt';
import {
  findStudentById,
  findTeacherByName,
  getClassById,
  loadTeachers,
} from '../utils/localData';

const MOCK_ADMIN = {
  username: 'admin',
  password: 'admin123',
  id: 'admin001',
  name: '系统管理员',
};

/**
 * 学生登录
 * POST /api/v1/auth/login/student
 */
export const studentLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '请提供学号和密码' },
      });
      return;
    }

    // 从本地数据查找学生
    const result = findStudentById(studentId);
    if (!result) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '学号或密码错误' },
      });
      return;
    }

    // 验证密码（默认密码为学号后6位或123456）
    const defaultPassword = studentId.slice(-6);
    if (password !== defaultPassword && password !== '123456') {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '学号或密码错误' },
      });
      return;
    }

    const { student, classInfo } = result;

    // 生成 Token
    const token = generateToken({
      userId: student.id,
      role: 'student',
      refId: student.id,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: student.id,
          studentId: student.id,
          name: student.name,
          role: 'student',
          classId: classInfo.id,
          className: classInfo.name,
          grade: classInfo.grade,
        },
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '登录失败，请稍后重试' },
    });
  }
};

/**
 * 教师登录（步骤1：姓名 + 密码）
 * POST /api/v1/auth/login/teacher
 */
export const teacherLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '请提供姓名和密码' },
      });
      return;
    }

    // 从本地数据查找教师
    const teacher = findTeacherByName(name);
    if (!teacher) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '姓名或密码错误' },
      });
      return;
    }

    // 验证密码
    if (password !== teacher.password) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '姓名或密码错误' },
      });
      return;
    }

    // 获取班级信息
    const cls = getClassById(teacher.classId);

    // 生成 Token
    const token = generateToken({
      userId: teacher.id,
      role: 'teacher',
      refId: teacher.id,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: teacher.id,
          name: teacher.name,
          role: 'teacher',
          classId: teacher.classId,
          className: teacher.className,
          grade: teacher.grade,
          studentCount: cls?.students.length || 0,
        },
      },
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '登录失败，请稍后重试' },
    });
  }
};

/**
 * 管理员登录
 * POST /api/v1/auth/login/admin
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '请提供账号和密码' },
      });
      return;
    }

    // 验证管理员账号
    if (username !== MOCK_ADMIN.username || password !== MOCK_ADMIN.password) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '账号或密码错误' },
      });
      return;
    }

    // 生成 Token
    const token = generateToken({
      userId: MOCK_ADMIN.id,
      role: 'admin',
      refId: MOCK_ADMIN.id,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: MOCK_ADMIN.id,
          username: MOCK_ADMIN.username,
          name: MOCK_ADMIN.name,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '登录失败，请稍后重试' },
    });
  }
};

/**
 * 修改密码
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未认证' },
      });
      return;
    }

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '请提供旧密码和新密码' },
      });
      return;
    }

    // TODO: 实现密码修改逻辑（需要保存密码到本地文件或数据库）
    res.json({
      success: true,
      message: '密码修改成功（演示模式）',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '密码修改失败，请稍后重试' },
    });
  }
};

/**
 * 获取当前用户信息
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const refId = req.user?.refId;

    if (!userId || !role || !refId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未认证' },
      });
      return;
    }

    let userInfo: any = null;

    // 根据角色获取详细信息
    if (role === 'student') {
      const result = findStudentById(refId);
      if (result) {
        userInfo = {
          id: result.student.id,
          studentId: result.student.id,
          name: result.student.name,
          classId: result.classInfo.id,
          className: result.classInfo.name,
          grade: result.classInfo.grade,
        };
      }
    } else if (role === 'teacher') {
      const teachers = loadTeachers();
      const teacher = teachers.teachers.find(t => t.id === refId);
      if (teacher) {
        const cls = getClassById(teacher.classId);
        userInfo = {
          id: teacher.id,
          name: teacher.name,
          classId: teacher.classId,
          className: teacher.className,
          grade: teacher.grade,
          studentCount: cls?.students.length || 0,
        };
      }
    } else if (role === 'admin') {
      userInfo = {
        id: MOCK_ADMIN.id,
        username: MOCK_ADMIN.username,
        name: MOCK_ADMIN.name,
      };
    }

    if (!userInfo) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '用户不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: userInfo,
        role,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取用户信息失败' },
    });
  }
};
