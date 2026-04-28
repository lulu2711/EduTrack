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
  getAllGradeReportFiles,
  loadGradeReport,
  LocalClass,
  LocalStudent,
  ScoreRecord,
} from '../utils/localData';

export const getAllClassesHandler = (req: Request, res: Response): void => {
  try {
    const classes = getAllClasses();
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
    res.status(500).json({ success: false, message: '获取班级列表失败' });
  }
};

export const getClassDetail = (req: Request, res: Response): void => {
  try {
    const { classId } = req.params;
    const cls = getClassById(classId);

    if (!cls) {
      res.status(404).json({ success: false, message: '班级不存在' });
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
    res.status(500).json({ success: false, message: '获取班级详情失败' });
  }
};

export const getAllTeachersHandler = (req: Request, res: Response): void => {
  try {
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
    res.status(500).json({ success: false, message: '获取教师列表失败' });
  }
};

export const getTeacherDetail = (req: Request, res: Response): void => {
  try {
    const { teacherId } = req.params;
    const teacher = findTeacherById(teacherId);

    if (!teacher) {
      res.status(404).json({ success: false, message: '教师不存在' });
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
    res.status(500).json({ success: false, message: '获取教师详情失败' });
  }
};

export const getStudentDetail = (req: Request, res: Response): void => {
  try {
    const { studentId } = req.params;
    const result = findStudentById(studentId);

    if (!result) {
      res.status(404).json({ success: false, message: '学生不存在' });
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
    res.status(500).json({ success: false, message: '获取学生详情失败' });
  }
};

export const getStudentScoresHandler = (req: Request, res: Response): void => {
  try {
    const { studentId } = req.params;
    const result = findStudentById(studentId);

    if (!result) {
      res.status(404).json({ success: false, message: '学生不存在' });
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
    res.status(500).json({ success: false, message: '获取学生成绩失败' });
  }
};

export const getClassScoresHandler = (req: Request, res: Response): void => {
  try {
    const { classId } = req.params;
    const cls = getClassById(classId);

    if (!cls) {
      res.status(404).json({ success: false, message: '班级不存在' });
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
    res.status(500).json({ success: false, message: '获取班级成绩失败' });
  }
};

export const getClassAnalysis = (req: Request, res: Response): void => {
  try {
    const { classId } = req.params;
    const cls = getClassById(classId);

    if (!cls) {
      res.status(404).json({ success: false, message: '班级不存在' });
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

      const subjectAnalysis: Record<string, { avg: number; max: number; min: number }> = {};

      cls.subjects.forEach(subject => {
        const subjectScores = examScores
          .map(s => {
            const scoreStr = s[subject] as string;
            if (!scoreStr) return null;
            const [score] = scoreStr.split('/').map(Number);
            return score;
          })
          .filter((s): s is number => s !== null);

        if (subjectScores.length > 0) {
          subjectAnalysis[subject] = {
            avg: Number((subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length).toFixed(2)),
            max: Math.max(...subjectScores),
            min: Math.min(...subjectScores),
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
    res.status(500).json({ success: false, message: '获取班级分析失败' });
  }
};

export const getExams = (req: Request, res: Response): void => {
  try {
    const exams = getAvailableExams();
    res.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取考试列表失败' });
  }
};

export const getGradeDistribution = (req: Request, res: Response): void => {
  try {
    const { classId } = req.params;
    const { exam } = req.query;
    const cls = getClassById(classId);

    if (!cls) {
      res.status(404).json({ success: false, message: '班级不存在' });
      return;
    }

    const scores = getClassScores(cls.name);
    const examScores = exam
      ? scores.filter(s => s.考试 === exam)
      : scores.filter(s => s.考试 === '期末考试');

    if (examScores.length === 0) {
      res.json({
        success: true,
        data: {
          classId,
          exam: exam || '期末考试',
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
        exam: exam || '期末考试',
        distribution: ranges,
        totalStudents: examScores.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取成绩分布失败' });
  }
};

export const getProgressStudents = (req: Request, res: Response): void => {
  try {
    const { classId } = req.params;
    const cls = getClassById(classId);

    if (!cls) {
      res.status(404).json({ success: false, message: '班级不存在' });
      return;
    }

    const scores = getClassScores(cls.name);
    const studentProgress: Record<string, { name: string; progress: number; currentRank: number; previousRank: number }> = {};

    const exams = ['月考1', '月考2', '月考3', '期中考试', '期末考试'];

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
    res.status(500).json({ success: false, message: '获取进退步学生失败' });
  }
};

export const searchStudents = (req: Request, res: Response): void => {
  try {
    const { keyword } = req.query;
    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json({ success: false, message: '请输入搜索关键词' });
      return;
    }

    const classes = getAllClasses();
    const results: Array<{ student: LocalStudent; classInfo: LocalClass }> = [];

    classes.forEach(cls => {
      cls.students.forEach(student => {
        if (student.name.includes(keyword) || student.id.includes(keyword)) {
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
    res.status(500).json({ success: false, message: '搜索学生失败' });
  }
};

export const getDashboardStats = (req: Request, res: Response): void => {
  try {
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
    res.status(500).json({ success: false, message: '获取统计信息失败' });
  }
};
