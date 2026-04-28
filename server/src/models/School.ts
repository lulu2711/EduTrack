import mongoose, { Schema, Document } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  logo?: string;
  gradeStandards: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  defaultPassword: string;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
    },
    gradeStandards: {
      A: { type: Number, default: 90 },
      B: { type: Number, default: 80 },
      C: { type: Number, default: 70 },
      D: { type: Number, default: 60 },
    },
    defaultPassword: {
      type: String,
      default: '123456',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISchool>('School', SchoolSchema);
