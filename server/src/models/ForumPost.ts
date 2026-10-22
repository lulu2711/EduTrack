import mongoose, { Schema } from 'mongoose';
const ReplySchema = new Schema({ id: String, postId: String, authorId: String, authorRole: String, content: String, status: String, createdAt: String }, { _id: false });
const ReportSchema = new Schema({ id: String, reporterId: String, reason: String, createdAt: String, status: String }, { _id: false });
const ForumPostSchema = new Schema({ id: { type: String, unique: true }, title: String, content: String, classId: String, className: String, subject: String, authorId: String, authorRole: String, status: String, createdAt: String, updatedAt: String, likedBy: [String], replies: [ReplySchema], reports: [ReportSchema] }, { collection: 'forum_posts' });
ForumPostSchema.index({ classId: 1, status: 1, createdAt: -1 });
export default mongoose.models.ForumPost || mongoose.model('ForumPost', ForumPostSchema);
