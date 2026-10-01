import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
    viewer: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    date: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

schema.index({ viewer: 1, chapterId: 1, date: 1 }, { unique: true });
schema.index({ novelId: 1, date: 1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ReadEvent || mongoose.model('ReadEvent', schema);
