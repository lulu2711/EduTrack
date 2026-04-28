import mongoose, { Schema, Document } from 'mongoose';

export interface IScore extends Document {
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subject: string;
  score: number;
  totalScore: number;
  rank: number;
  gradeRank: number;
  classSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScoreSchema: Schema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalScore: {
      type: Number,
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    gradeRank: {
      type: Number,
      default: 0,
    },
    classSize: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 复合索引
ScoreSchema.index({ studentId: 1, examId: 1, subject: 1 }, { unique: true });
ScoreSchema.index({ classId: 1, examId: 1 });
ScoreSchema.index({ examId: 1, subject: 1 });

export default mongoose.model<IScore>('Score', ScoreSchema);
