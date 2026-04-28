import mongoose, { Schema, Document } from 'mongoose';

export interface IGrade extends Document {
  name: string;
  order: number;
  schoolId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const GradeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.model<IGrade>('Grade', GradeSchema);
