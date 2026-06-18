import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITiptapContent {
    type: string;
    content?: ITiptapContent[];
    attrs?: Record<string, unknown>;
    marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
    text?: string;
}

export interface IChapter extends Document {
    novelId: mongoose.Types.ObjectId;
    chapterNumber: number;
    title: string;
    content: string;
    contentJson?: ITiptapContent | null;
    wordCount: number;
    charCount: number;
    status: 'draft' | 'published' | 'scheduled';
    scheduledAt?: Date;
    publishedAt?: Date;
    views: number;
    authorNote?: string;
    audioUrl?: string;
    audioStatus: 'none' | 'processing' | 'completed' | 'failed';
    audioDuration?: number;
    audioGeneratedAt?: Date;
    audioSource?: 'upload' | 'tts' | 'uploadthing';
    backgroundMusic?: mongoose.Types.ObjectId;
}

const ChapterSchema: Schema = new Schema({
    novelId: {
        type: Schema.Types.ObjectId,
        ref: 'Novel',
        required: true
    },
    chapterNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true
    },
    contentJson: {
        type: Schema.Types.Mixed,
        required: false,
        default: null
    },
    wordCount: {
        type: Number,
        default: 0,
        min: 0
    },
    charCount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'scheduled'],
        default: 'draft'
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    publishedAt: {
        type: Date,
        default: null
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    authorNote: {
        type: String,
        maxlength: 1000,
        default: null
    },
    audioUrl: {
        type: String,
        default: null
    },
    audioStatus: {
        type: String,
        enum: ['none', 'processing', 'completed', 'failed'],
        default: 'none'
    },
    audioDuration: {
        type: Number,
        default: null
    },
    audioGeneratedAt: {
        type: Date,
        default: null
    },
    audioSource: {
        type: String,
        enum: ['upload', 'tts', 'uploadthing'],
        default: null
    },
    backgroundMusic: {
        type: Schema.Types.ObjectId,
        ref: 'Music',
        default: null
    }
}, {
    timestamps: true
});

ChapterSchema.index({ novelId: 1, chapterNumber: 1 }, { unique: true });
ChapterSchema.index({ novelId: 1, status: 1 });
ChapterSchema.index({ status: 1, scheduledAt: 1 });
ChapterSchema.index({ publishedAt: -1 });
ChapterSchema.index({ views: -1 });
ChapterSchema.index({ audioStatus: 1 });

ChapterSchema.virtual('readingTime').get(function (this: IChapter) {
    return Math.ceil(this.wordCount / 200);
});

ChapterSchema.pre('save', function (this: IChapter, next) {
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

export default (mongoose.models.Chapter as Model<IChapter>) || mongoose.model<IChapter>('Chapter', ChapterSchema);
