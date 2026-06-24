import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI chưa được cấu hình trong .env');
}

/**
 * Cache kết nối trên globalThis để tránh tạo nhiều kết nối mỗi lần hot-reload
 * (dev) hoặc mỗi lần invoke serverless. Đây là mẫu chuẩn cho Mongoose + Next.js.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as { _mongooseCache?: MongooseCache };

const cached: MongooseCache = globalForMongoose._mongooseCache || { conn: null, promise: null };
globalForMongoose._mongooseCache = cached;

export const connectDB = async (): Promise<typeof mongoose> => {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI as string)
            .then((m) => {
                console.log('✅ MongoDB connected successfully');
                // Run background migration for novels without slugs
                import('./models/Novel').then(async (module) => {
                    const Novel = module.default;
                    try {
                        const novelsWithoutSlug = await Novel.find({ $or: [{ slug: { $exists: false } }, { slug: '' }] });
                        if (novelsWithoutSlug.length > 0) {
                            console.log(`🔧 [Migration] Found ${novelsWithoutSlug.length} novels without slug. Migrating...`);
                            for (const novel of novelsWithoutSlug) {
                                await novel.save();
                            }
                            console.log(`🔧 [Migration] Migrated ${novelsWithoutSlug.length} novels successfully.`);
                        }
                    } catch (err) {
                        console.error('❌ [Migration] Error migrating novels:', err);
                    }
                }).catch(e => console.error('Failed to import Novel model in db.ts:', e));
                return m;
            })
            .catch((err) => {
                cached.promise = null;
                console.error('❌ MongoDB connection error:', err);
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};
