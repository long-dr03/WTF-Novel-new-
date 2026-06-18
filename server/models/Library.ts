import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILibrary extends Document {
    user: mongoose.Types.ObjectId;
    novel: mongoose.Types.ObjectId;
    type: 'history' | 'favorite';
    lastReadChapter?: mongoose.Types.ObjectId;
    lastReadPage?: number;
    createdAt: Date;
    updatedAt: Date;
}

const LibrarySchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    novel: {
        type: Schema.Types.ObjectId,
        ref: 'Novel',
        required: true
    },
    type: {
        type: String,
        enum: ['history', 'favorite'],
        required: true
    },
    lastReadChapter: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter'
    }
}, {
    timestamps: true
});

LibrarySchema.index({ user: 1, novel: 1, type: 1 }, { unique: true });
LibrarySchema.index({ user: 1, type: 1, updatedAt: -1 });

export default (mongoose.models.Library as Model<ILibrary>) || mongoose.model<ILibrary>('Library', LibrarySchema);
