import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
  classIds: mongoose.Types.ObjectId[];
  gradeIds: mongoose.Types.ObjectId[];
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    classIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Class',
    }],
    gradeIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Grade',
    }],
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
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

export default mongoose.model<ITeacher>('Teacher', TeacherSchema);
