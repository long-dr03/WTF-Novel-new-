import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReport extends Document {
    reporter: mongoose.Types.ObjectId;
    novel?: mongoose.Types.ObjectId;
    chapter?: mongoose.Types.ObjectId;
    reason: string;
    description: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: Date;
    updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
    reporter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    novel: {
        type: Schema.Types.ObjectId,
        ref: 'Novel',
        required: false
    },
    chapter: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
        required: false
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

ReportSchema.index({ reporter: 1 });
ReportSchema.index({ novel: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

export default (mongoose.models.Report as Model<IReport>) || mongoose.model<IReport>('Report', ReportSchema);
