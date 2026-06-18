import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMusic extends Document {
    name: string;
    url: string;
    type: 'system' | 'author' | 'user';
    owner?: mongoose.Types.ObjectId;
    duration?: number;
    createdAt: Date;
    updatedAt: Date;
}

const MusicSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['system', 'author', 'user'],
        required: true,
        default: 'user'
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function (this: IMusic) {
            return this.type !== 'system';
        }
    },
    duration: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

MusicSchema.index({ type: 1 });
MusicSchema.index({ owner: 1 });

export default (mongoose.models.Music as Model<IMusic>) || mongoose.model<IMusic>('Music', MusicSchema);
