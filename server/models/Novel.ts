import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INovel extends Document {
    title: string;
    description: string;
    image: string;
    author: mongoose.Types.ObjectId;
    genres: mongoose.Types.ObjectId[];
    status: 'ongoing' | 'completed' | 'hiatus';
    publishStatus: 'pending' | 'published' | 'rejected';
    isFeatured: boolean;
    views: number;
    likes: number;
    adminComment?: string;
}

const NovelSchema: Schema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    genres: [{
        type: Schema.Types.ObjectId,
        ref: 'Genre'
    }],
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'hiatus'],
        default: 'ongoing'
    },
    publishStatus: {
        type: String,
        enum: ['pending', 'published', 'rejected'],
        default: 'pending'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    adminComment: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

NovelSchema.index({ title: 'text' });
NovelSchema.index({ author: 1 });
NovelSchema.index({ genres: 1 });
NovelSchema.index({ status: 1 });
NovelSchema.index({ publishStatus: 1 });
NovelSchema.index({ views: -1, createdAt: -1 });

export default (mongoose.models.Novel as Model<INovel>) || mongoose.model<INovel>('Novel', NovelSchema);
