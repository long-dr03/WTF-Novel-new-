import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    email: string;
    avatar: string;
    password: string;
    role: string;
    isBanned: boolean;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    avatar: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'author'],
        default: 'user'
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isBanned: 1 });

UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

/**
 * So sánh password được nhập với password hash trong DB
 * @param candidatePassword Password cần kiểm tra
 */
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
