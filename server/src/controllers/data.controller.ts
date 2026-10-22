import { Request, Response } from 'express';
import {
  loadSchoolData,
  loadTeachers,
  getStudentScores,
  getClassScores,
  findStudentById,
  findTeacherById,
  findTeacherByName,
  getClassById,
  getAllClasses,
  getAllTeachers,
  getAvailableExams,
  getLatestExam,
  getAllGradeReportFiles,
  loadGradeReport,
  LocalClass,
  LocalStudent,
  ScoreRecord,
  reloadLocalData,
} from '../utils/localData';
import { mongoClasses, mongoClass, mongoStudentScores, mongoClassScores } from '../utils/mongoData';
import { mongoClassAnalysis, mongoExams, mongoDistribution, mongoProgress } from '../utils/mongoAnalysis';
import { sendUnavailable, fail, requireMongoConnection, isStrictMongoMode } from '../utils/dataSource';

export const reloadLocalDataHandler = (req: Request, res: Response): void => {
  try {
    if (isStrictMongoMode()) throw new Error('Strict MongoDB mode blocks local JSON import');
    res.json({
      success: true,
      data: {
        ...reloadLocalData(),
        message: '本地数据已重新加载并完成校验',
      },
    });
  } catch (error) {
    console.error('Local data reload error:', error);
    sendUnavailable(res, error, '本地数据加载失败');
  }
};

export const getAllClassesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongo = await mongoClasses();
    if (mongo) { const visible = req.user?.role === 'admin' ? mongo : req.user?.role === 'teacher' ? mongo.filter(c => c.legacyId === findTeacherById(req.user!.refId)?.classId) : []; res.json({ success: true, data: visible }); return; }
    const allClasses = getAllClasses();
    const user = req.user;
    const classes = user?.role === 'admin'
      ? allClasses
      : user?.role === 'teacher'
        ? allClasses.filter(c => c.id === findTeacherById(user.refId)?.classId)
        : [];
    res.json({
      success: true,
      data: classes.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        studentCount: c.students.length,
        combination: c.combination,
        subjects: c.subjects,
      })),
    });
  } catch (error) {
    sendUnavailable(res, error, '获取班级列表失败');
  }
};

export const getClassDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongo = await mongoClass(req.params.classId);
    if (mongo) { res.json({ success: true, data: mongo }); return; }
    const { classId } = req.params;
    const cls = getClassById(classId);

    if (!cls) {
      fail(res, 404, 'NOT_FOUND', '班级不存在');
      return;
    }

    res.json({
      success: true,
      data: {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        combination: cls.combination,
        subjects: cls.subjects,
        students: cls.students,
        studentCount: cls.students.length,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取班级详情失败');
  }
};

export const getAllTeachersHandler = (req: Request, res: Response): void => {
  try {
    requireMongoConnection();
    const teachers = getAllTeachers();
    res.json({
      success: true,
      data: teachers.map(t => ({
        id: t.id,
        name: t.name,
        classId: t.classId,
        className: t.className,
        grade: t.grade,
      })),
    });
  } catch (error) {
    sendUnavailable(res, error, '获取教师列表失败');
  }
};

export const getTeacherDetail = (req: Request, res: Response): void => {
  try {
    const { teacherId } = req.params;
    const teacher = findTeacherById(teacherId);

    if (!teacher) {
      fail(res, 404, 'NOT_FOUND', '教师不存在');
      return;
    }

    const cls = getClassById(teacher.classId);

    res.json({
      success: true,
      data: {
        id: teacher.id,
        name: teacher.name,
        classId: teacher.classId,
        className: teacher.className,
        grade: teacher.grade,
        studentCount: cls?.students.length || 0,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取教师详情失败');
  }
};

export const getStudentDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongoScores = await mongoStudentScores(req.params.studentId);
    if (mongoScores) { const models = await import('../models'); const student = await models.Student.findOne({ studentId: req.params.studentId }).lean(); const cls = student ? await models.Class.findById(student.classId).lean() : null; const grade = student ? await models.Grade.findById(student.gradeId).lean() : null; res.json({ success: true, data: { id: req.params.studentId, name: student?.name, classId: cls ? String(cls._id) : undefined, className: cls?.name, grade: grade?.name, combination: { physics_history: cls?.combination?.physicsHistory, electives: cls?.combination?.electives }, subjects: cls?.subjects || [], scores: mongoScores } }); return; }
    const { studentId } = req.params;
    const result = findStudentById(studentId);

    if (!result) {
      fail(res, 404, 'NOT_FOUND', '学生不存在');
      return;
    }

    const { student, classInfo } = result;
    const scores = getStudentScores(studentId);

    res.json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        classId: classInfo.id,
        className: classInfo.name,
        grade: classInfo.grade,
        combination: classInfo.combination,
        subjects: classInfo.subjects,
        scores: scores,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取学生详情失败');
  }
};

export const getStudentScoresHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongoScores = await mongoStudentScores(req.params.studentId);
    if (mongoScores) { res.json({ success: true, data: { studentId: req.params.studentId, studentName: mongoScores[0]?.姓名, className: mongoScores[0]?.班级, scores: mongoScores } }); return; }
    const { studentId } = req.params;
    const result = findStudentById(studentId);

    if (!result) {
      fail(res, 404, 'NOT_FOUND', '学生不存在');
      return;
    }

    const scores = getStudentScores(studentId);

    res.json({
      success: true,
      data: {
        studentId,
        studentName: result.student.name,
        className: result.classInfo.name,
        scores: scores,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取学生成绩失败');
  }
};

export const getClassScoresHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongo = await mongoClassScores(req.params.classId);
    if (mongo) { const examScores: Record<string, ScoreRecord[]> = {}; mongo.scores.forEach(score => { (examScores[score.考试] ||= []).push(score as ScoreRecord); }); res.json({ success: true, data: { classId: req.params.classId, className: mongo.cls.name, examScores } }); return; }
    const { classId } = req.params;
    const cls = getClassById(classId);

    if (!cls) {
      fail(res, 404, 'NOT_FOUND', '班级不存在');
      return;
    }

    const scores = getClassScores(cls.name);

    const examScores: Record<string, ScoreRecord[]> = {};
    scores.forEach(score => {
      if (!examScores[score.考试]) {
        examScores[score.考试] = [];
      }
      examScores[score.考试].push(score);
    });

    res.json({
      success: true,
      data: {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        subjects: cls.subjects,
        examScores,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取班级成绩失败');
  }
};

export const getClassAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongo = await mongoClassAnalysis(req.params.classId);
    if (mongo) { res.json({ success: true, data: mongo }); return; }
    const { classId } = req.params;
    const cls = getClassById(classId);

    if (!cls) {
      fail(res, 404, 'NOT_FOUND', '班级不存在');
      return;
    }

    const scores = getClassScores(cls.name);
    const exams = getAvailableExams();

    const analysis: Record<string, any> = {};

    exams.forEach(exam => {
      const examScores = scores.filter(s => s.考试 === exam);
      if (examScores.length === 0) return;

      const totalScores = examScores.map(s => s.总分);
      const avgScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
      const maxScore = Math.max(...totalScores);
      const minScore = Math.min(...totalScores);

      const subjectAnalysis: Record<string, { avg: number; avgRate: number; max: number; min: number }> = {};

      cls.subjects.forEach(subject => {
        const subjectScores = examScores
          .map(s => {
            const scoreStr = s[subject] as string;
            if (!scoreStr) return null;
            const [score, fullScore] = scoreStr.split('/').map(Number);
            return { score, fullScore };
          })
          .filter((s): s is { score: number; fullScore: number } => s !== null && Number.isFinite(s.score) && s.fullScore > 0);

        if (subjectScores.length > 0) {
          subjectAnalysis[subject] = {
            avg: Number((subjectScores.reduce((sum, item) => sum + item.score, 0) / subjectScores.length).toFixed(2)),
            avgRate: Number((
              subjectScores.reduce((sum, item) => sum + item.score / item.fullScore, 0) /
              subjectScores.length *
              100
            ).toFixed(2)),
            max: Math.max(...subjectScores.map(item => item.score)),
            min: Math.min(...subjectScores.map(item => item.score)),
          };
        }
      });

      analysis[exam] = {
        studentCount: examScores.length,
        averageScore: Number(avgScore.toFixed(2)),
        highestScore: maxScore,
        lowestScore: minScore,
        subjectAnalysis,
      };
    });

    res.json({
      success: true,
      data: {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        analysis,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取班级分析失败');
  }
};

export const getExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongo = await mongoExams();
    if (mongo) { res.json({ success: true, data: mongo }); return; }
    const exams = getAvailableExams();
    res.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    sendUnavailable(res, error, '获取考试列表失败');
  }
};

export const getGradeDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongo = await mongoDistribution(req.params.classId, typeof req.query.exam === 'string' ? req.query.exam : undefined);
    if (mongo) { res.json({ success: true, data: mongo }); return; }
    const { classId } = req.params;
    const { exam } = req.query;
    const cls = getClassById(classId);

    if (!cls) {
      fail(res, 404, 'NOT_FOUND', '班级不存在');
      return;
    }

    const scores = getClassScores(cls.name);
    const selectedExam = typeof exam === 'string' ? exam : getLatestExam();
    const examScores = selectedExam
      ? scores.filter(s => s.考试 === selectedExam)
      : [];

    if (examScores.length === 0) {
      res.json({
        success: true,
        data: {
          classId,
          exam: selectedExam,
          distribution: {},
        },
      });
      return;
    }

    const ranges = {
      '700+': 0,
      '650-699': 0,
      '600-649': 0,
      '550-599': 0,
      '500-549': 0,
      '450-499': 0,
      '400-449': 0,
      '350-399': 0,
      '<350': 0,
    };

    examScores.forEach(score => {
      const total = score.总分;
      if (total >= 700) ranges['700+']++;
      else if (total >= 650) ranges['650-699']++;
      else if (total >= 600) ranges['600-649']++;
      else if (total >= 550) ranges['550-599']++;
      else if (total >= 500) ranges['500-549']++;
      else if (total >= 450) ranges['450-499']++;
      else if (total >= 400) ranges['400-449']++;
      else if (total >= 350) ranges['350-399']++;
      else ranges['<350']++;
    });

    res.json({
      success: true,
      data: {
        classId,
        className: cls.name,
        exam: selectedExam,
        distribution: ranges,
        totalStudents: examScores.length,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取成绩分布失败');
  }
};

export const getProgressStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongo = await mongoProgress(req.params.classId);
    if (mongo) { res.json({ success: true, data: mongo }); return; }
    const { classId } = req.params;
    const cls = getClassById(classId);

    if (!cls) {
      fail(res, 404, 'NOT_FOUND', '班级不存在');
      return;
    }

    const scores = getClassScores(cls.name);
    const studentProgress: Record<string, { name: string; progress: number; currentRank: number; previousRank: number }> = {};

    const exams = getAvailableExams();

    cls.students.forEach(student => {
      const studentScores = scores.filter(s => s.学号 === student.id);
      if (studentScores.length >= 2) {
        studentScores.sort((a, b) => exams.indexOf(a.考试) - exams.indexOf(b.考试));
        const current = studentScores[studentScores.length - 1];
        const previous = studentScores[studentScores.length - 2];
        const progress = previous.排名 - current.排名;

        studentProgress[student.id] = {
          name: student.name,
          progress,
          currentRank: current.排名,
          previousRank: previous.排名,
        };
      }
    });

    const progressList = Object.values(studentProgress)
      .filter(s => s.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 10);

    const declineList = Object.values(studentProgress)
      .filter(s => s.progress < 0)
      .sort((a, b) => a.progress - b.progress)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        classId,
        className: cls.name,
        progressStudents: progressList,
        declineStudents: declineList,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取进退步学生失败');
  }
};

export const searchStudents = (req: Request, res: Response): void => {
  try {
    requireMongoConnection();
    const { keyword } = req.query;
    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json({ success: false, message: '请输入搜索关键词' });
      return;
    }

    const allClasses = getAllClasses();
    const user = req.user;
    const classes = user?.role === 'admin'
      ? allClasses
      : user?.role === 'teacher'
        ? allClasses.filter(c => c.id === findTeacherById(user.refId)?.classId)
        : [];
    const results: Array<{ student: LocalStudent; classInfo: LocalClass }> = [];

    classes.forEach(cls => {
      cls.students.forEach(student => {
        const canSeeStudent =
          user?.role === 'admin' ||
          (user?.role === 'teacher' &&
            findTeacherById(user.refId)?.classId === cls.id);
        const isSelfMatch = user?.role === 'student' && student.id === user.refId;

        if ((canSeeStudent || isSelfMatch) &&
          (student.name.includes(keyword) || student.id.includes(keyword))) {
          results.push({ student, classInfo: cls });
        }
      });
    });

    res.json({
      success: true,
      data: results.map(r => ({
        studentId: r.student.id,
        studentName: r.student.name,
        classId: r.classInfo.id,
        className: r.classInfo.name,
        grade: r.classInfo.grade,
      })),
    });
  } catch (error) {
    sendUnavailable(res, error, '搜索学生失败');
  }
};

export const getDashboardStats = (req: Request, res: Response): void => {
  try {
    requireMongoConnection();
    const classes = getAllClasses();
    const teachers = getAllTeachers();
    const files = getAllGradeReportFiles();

    const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);

    const gradeStats: Record<string, { classes: number; students: number }> = {};
    classes.forEach(cls => {
      if (!gradeStats[cls.grade]) {
        gradeStats[cls.grade] = { classes: 0, students: 0 };
      }
      gradeStats[cls.grade].classes++;
      gradeStats[cls.grade].students += cls.students.length;
    });

    res.json({
      success: true,
      data: {
        totalClasses: classes.length,
        totalStudents,
        totalTeachers: teachers.length,
        totalExams: files.length,
        gradeStats,
      },
    });
  } catch (error) {
    sendUnavailable(res, error, '获取统计信息失败');
  }
};





