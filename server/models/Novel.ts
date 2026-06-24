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
    slug?: string;
    commentsEnabled?: boolean;
    reportsEnabled?: boolean;
    adImage?: string;
    adLink?: string;
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
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    commentsEnabled: {
        type: Boolean,
        default: true
    },
    reportsEnabled: {
        type: Boolean,
        default: true
    },
    // Quảng cáo riêng của truyện (ghi đè quảng cáo chung khi đọc truyện này)
    adImage: {
        type: String,
        default: ''
    },
    adLink: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Helper function to slugify Vietnamese title
export const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
        .replace(/[đĐ]/g, 'd')
        .replace(/([^a-z0-9\s-]|_)/g, '') // remove non-alphanumeric characters except space and dash
        .trim()
        .replace(/\s+/g, '-') // replace spaces with dashes
        .replace(/-+/g, '-'); // collapse multiple dashes
};

NovelSchema.pre('save', async function (this: any) {
    if (this.isModified('title') || !this.slug) {
        let baseSlug = slugify((this.title as string) || '');
        if (!baseSlug) {
            baseSlug = 'novel';
        }
        
        let slug = baseSlug;
        let count = 0;
        
        const NovelModel = this.constructor as mongoose.Model<any>;
        while (true) {
            const query: any = { slug };
            if (!this.isNew) {
                query._id = { $ne: this._id };
            }
            const existing = await NovelModel.findOne(query);
            if (!existing) {
                break;
            }
            count++;
            slug = `${baseSlug}-${count}`;
        }
        this.slug = slug;
    }
});

NovelSchema.index({ title: 'text' });
NovelSchema.index({ author: 1 });
NovelSchema.index({ genres: 1 });
NovelSchema.index({ status: 1 });
NovelSchema.index({ publishStatus: 1 });
NovelSchema.index({ views: -1, createdAt: -1 });
NovelSchema.index({ slug: 1 });

export default (mongoose.models.Novel as Model<INovel>) || mongoose.model<INovel>('Novel', NovelSchema);
