import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  name: string;
  type: 'monthly' | 'midterm' | 'final' | 'other';
  date: Date;
  gradeId: mongoose.Types.ObjectId;
  subjectScores: Map<string, number>;
  difficulty: '简单' | '一般' | '困难';
  createdAt: Date;
}

const ExamSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['monthly', 'midterm', 'final', 'other'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    gradeId: {
      type: Schema.Types.ObjectId,
      ref: 'Grade',
      required: true,
    },
    subjectScores: {
      type: Map,
      of: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['简单', '一般', '困难'],
      default: '一般',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// 索引
ExamSchema.index({ gradeId: 1, date: -1 });

export default mongoose.model<IExam>('Exam', ExamSchema);
