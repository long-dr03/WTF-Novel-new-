import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdSlot {
    enabled: boolean;
    imageUrl: string;
    link: string;
}

export interface ISetting extends Document {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    emailNotification: boolean;
    autoApproveNovels: boolean;
    minWordsPerChapter: number;
    ads: {
        enabled: boolean;
        left: IAdSlot;
        right: IAdSlot;
    };
    popup: {
        enabled: boolean;
        title: string;
        description: string;
        imageUrl: string;
        link: string;
    };
}

const AdSlotSchema = new Schema<IAdSlot>({
    enabled: { type: Boolean, default: false },
    imageUrl: { type: String, default: '' },
    link: { type: String, default: '' }
}, { _id: false });

const AdsSchema = new Schema({
    enabled: { type: Boolean, default: false },
    left: { type: AdSlotSchema, default: () => ({}) },
    right: { type: AdSlotSchema, default: () => ({}) }
}, { _id: false });

const PopupSchema = new Schema({
    enabled: { type: Boolean, default: false },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    link: { type: String, default: '' }
}, { _id: false });

const SettingSchema: Schema = new Schema({
    siteName: { type: String, default: 'Novel' },
    siteDescription: { type: String, default: 'Nền tảng đọc truyện online hàng đầu Việt Nam' },
    maintenanceMode: { type: Boolean, default: false },
    emailNotification: { type: Boolean, default: true },
    autoApproveNovels: { type: Boolean, default: false },
    minWordsPerChapter: { type: Number, default: 1000 },
    ads: { type: AdsSchema, default: () => ({}) },
    popup: { type: PopupSchema, default: () => ({}) }
}, {
    timestamps: true
});

export default (mongoose.models.Setting as Model<ISetting>) || mongoose.model<ISetting>('Setting', SettingSchema);
