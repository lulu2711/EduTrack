import mongoose, { Schema } from 'mongoose';
const QuestionSchema = new Schema({ id: String, type: String, content: String, options: [String], answer: Schema.Types.Mixed, score: Number, knowledgePoints: [String] }, { _id: false });
const ExamSchema = new Schema({ id: { type: String, unique: true }, title: String, subject: String, classId: String, teacherId: String, durationMinutes: Number, status: String, createdAt: String, questions: [QuestionSchema] }, { collection: 'online_exams' });
const SubmissionSchema = new Schema({ examId: String, studentId: String, answers: Schema.Types.Mixed, objectiveScore: Number, manualScore: Number, totalScore: Number, submittedAt: String, manualScores: Schema.Types.Mixed, gradedAt: String }, { _id: false });
ExamSchema.add({ submissions: [SubmissionSchema] });
export default mongoose.models.OnlineExam || mongoose.model('OnlineExam', ExamSchema);
