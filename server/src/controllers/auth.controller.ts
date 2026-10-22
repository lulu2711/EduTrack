import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { sendUnavailable } from '../utils/dataSource';
import {
  findStudentById,
  findTeacherByName,
  findTeacherById,
  getClassById,
  loadTeachers,
  getCredentialHash,
  saveCredentialHash,
} from '../utils/localData';
import { findMongoStudent, findMongoTeacher, mongoReady, verifyMongoPassword } from '../utils/mongoAuth';
import { Student } from '../models';

const getAdminAccount = () => ({
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  id: 'admin001',
  name: '系统管理员',
});

/**
 * 学生登录
 * POST /api/v1/auth/login/student
 */
export const studentLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, password } = req.body;
    if (mongoReady()) {
      const result = await findMongoStudent(String(studentId).trim());
      if (!result || !(await verifyMongoPassword(result.user.password, password))) {
        res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: '学号或密码错误' } }); return;
      }
      const token = generateToken({ userId: String(result.user._id), role: 'student', refId: result.student.studentId });
      res.json({ success: true, data: { token, user: { id: result.student.studentId, studentId: result.student.studentId, name: result.student.name, role: 'student', classId: result.cls?._id ? String(result.cls._id) : undefined, className: result.cls?.name, grade: result.grade?.name } } }); return;
    }


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

    // 本地 JSON 模式暂时使用环境变量中的演示密码。
    // 迁移到数据库后，学生密码也应改为每个用户独立的 bcrypt 哈希。
    const defaultPassword = studentId.slice(-6);
    const savedStudentHash = getCredentialHash('student', studentId);
    const passwordMatches = savedStudentHash
      ? await bcrypt.compare(password, savedStudentHash)
      : password === defaultPassword || password === process.env.STUDENT_DEMO_PASSWORD;
    if (!passwordMatches) {
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
    sendUnavailable(res, error, '登录失败，请稍后重试');
  }
};

/**
 * 教师登录（工号 + 密码）
 * POST /api/v1/auth/login/teacher
 */
export const teacherLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, password } = req.body;
    if (mongoReady()) {
      const result = await findMongoTeacher(String(employeeId).trim());
      if (!result || !(await verifyMongoPassword(result.user.password, password))) {
        res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: '工号或密码错误' } }); return;
      }
      const local = result.local;
      const token = generateToken({ userId: String(result.user._id), role: 'teacher', refId: local?.id || String(result.user.username) });
      res.json({ success: true, data: { token, user: { id: local?.id || String(result.user.username), name: result.teacher.name, role: 'teacher', classId: local?.classId || (result.cls?._id ? String(result.cls._id) : undefined), className: result.cls?.name || local?.className, grade: result.grade?.name || local?.grade, studentCount: result.cls?._id ? await Student.countDocuments({ classId: result.cls._id }) : 0 } } }); return;
    }


    if (!employeeId || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '请提供工号和密码' },
      });
      return;
    }

    // 从本地数据查找教师
    const teacher = findTeacherById(String(employeeId).trim());
    if (!teacher) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '工号或密码错误' },
      });
      return;
    }

    // 支持 bcrypt 哈希；迁移前的明文密码不再接受。
    const passwordHash = getCredentialHash('teacher', teacher.id);
    const passwordMatches = await bcrypt.compare(password, passwordHash || teacher.password);
    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '工号或密码错误' },
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
    sendUnavailable(res, error, '登录失败，请稍后重试');
  }
};

/**
 * 管理员登录
 * POST /api/v1/auth/login/admin
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const adminAccount = getAdminAccount();

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '请提供账号和密码' },
      });
      return;
    }

    // 验证管理员账号
    const passwordHash = getCredentialHash('admin', adminAccount.id);
    const passwordMatches = passwordHash
      ? await bcrypt.compare(password, passwordHash)
      : username === adminAccount.username && password === adminAccount.password;
    if (username !== adminAccount.username || !passwordMatches) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '账号或密码错误' },
      });
      return;
    }

    // 生成 Token
    const token = generateToken({
      userId: adminAccount.id,
      role: 'admin',
      refId: adminAccount.id,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: adminAccount.id,
          username: adminAccount.username,
          name: adminAccount.name,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    sendUnavailable(res, error, '登录失败，请稍后重试');
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

    if (newPassword === oldPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '新密码不能与旧密码相同', details: [] },
      });
      return;
    }

    let passwordMatches = false;
    if (role === 'admin') {
      const account = getAdminAccount();
      const savedHash = getCredentialHash('admin', account.id);
      passwordMatches = savedHash
        ? await bcrypt.compare(oldPassword, savedHash)
        : oldPassword === account.password;
    } else if (role === 'teacher') {
      const teacher = findTeacherById(userId);
      const savedHash = teacher && getCredentialHash('teacher', teacher.id);
      passwordMatches = Boolean(teacher) && await bcrypt.compare(
        oldPassword,
        savedHash || teacher!.password
      );
    } else if (role === 'student') {
      const student = findStudentById(userId);
      const savedHash = getCredentialHash('student', userId);
      passwordMatches = Boolean(student) && (
        savedHash
          ? await bcrypt.compare(oldPassword, savedHash)
          : oldPassword === userId.slice(-6) || oldPassword === process.env.STUDENT_DEMO_PASSWORD
      );
    }

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '旧密码不正确', details: [] },
      });
      return;
    }

    await saveCredentialHash(
      role!,
      role === 'admin' ? 'admin001' : userId,
      await bcrypt.hash(newPassword, 12)
    );

    res.json({
      success: true,
      data: { message: '密码修改成功，请重新登录', requiresReauthentication: true },
    });
  } catch (error) {
    console.error('Change password error:', error);
    sendUnavailable(res, error, '密码修改失败，请稍后重试');
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
    const adminAccount = getAdminAccount();
    if (mongoReady() && role === 'student') {
      const result = await findMongoStudent(refId);
      if (result) userInfo = { id: result.student.studentId, studentId: result.student.studentId, name: result.student.name, classId: result.cls?._id ? String(result.cls._id) : undefined, className: result.cls?.name, grade: result.grade?.name };
    } else if (mongoReady() && role === 'teacher') {
      const result = await findMongoTeacher(refId);
      if (result) userInfo = { id: result.local?.id || String(result.user.username), name: result.teacher.name, classId: result.local?.classId || (result.cls?._id ? String(result.cls._id) : undefined), className: result.cls?.name || result.local?.className, grade: result.grade?.name || result.local?.grade, studentCount: result.cls?._id ? await Student.countDocuments({ classId: result.cls._id }) : 0 };
    }

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
        id: adminAccount.id,
        username: adminAccount.username,
        name: adminAccount.name,
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
    sendUnavailable(res, error, '获取用户信息失败');
  }
};






