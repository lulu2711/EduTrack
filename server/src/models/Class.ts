import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  gradeId: mongoose.Types.ObjectId;
  combination: {
    physicsHistory: '物理' | '历史';
    electives: string[];
  };
  subjects: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gradeId: {
      type: Schema.Types.ObjectId,
      ref: 'Grade',
      required: true,
    },
    combination: {
      physicsHistory: {
        type: String,
        enum: ['物理', '历史'],
        required: true,
      },
      electives: [{
        type: String,
        enum: ['政治', '地理', '化学', '生物'],
      }],
    },
    subjects: [{
      type: String,
      required: true,
    }],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
ClassSchema.index({ gradeId: 1 });

export default mongoose.model<IClass>('Class', ClassSchema);
