import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
    novelId: mongoose.Types.ObjectId;
    chapterId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    content: string;
    likes: mongoose.Types.ObjectId[];
    parentId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
    novelId: {
        type: Schema.Types.ObjectId,
        ref: 'Novel',
        required: true
    },
    chapterId: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
        required: false
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    }
}, {
    timestamps: true
});

CommentSchema.index({ novelId: 1 });
CommentSchema.index({ chapterId: 1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ createdAt: -1 });

export default (mongoose.models.Comment as Model<IComment>) || mongoose.model<IComment>('Comment', CommentSchema);
