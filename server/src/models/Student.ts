import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  studentId: string;
  name: string;
  classId: mongoose.Types.ObjectId;
  gradeId: mongoose.Types.ObjectId;
  goals: Map<string, number>;
  teacherSuggestions: Map<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    gradeId: {
      type: Schema.Types.ObjectId,
      ref: 'Grade',
      required: true,
    },
    goals: {
      type: Map,
      of: Number,
      default: {},
    },
    teacherSuggestions: {
      type: Map,
      of: String,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
StudentSchema.index({ studentId: 1 }, { unique: true });
StudentSchema.index({ classId: 1 });
StudentSchema.index({ gradeId: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
