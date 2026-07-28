import mongoose from 'mongoose';

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose | null> | null;
}

const globalForMongoose = globalThis as unknown as { _mongooseCache?: MongooseCache };

const cached: MongooseCache = globalForMongoose._mongooseCache || { conn: null, promise: null };
globalForMongoose._mongooseCache = cached;

export const connectDB = async (): Promise<typeof mongoose | null> => {
    const mongodbUri = process.env.MONGODB_URI;

    if (!mongodbUri) {
        console.warn('⚠️ MONGODB_URI chưa được cấu hình trong .env');
        return null;
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(mongodbUri, {
                serverSelectionTimeoutMS: 8000,
                socketTimeoutMS: 45000,
            })
            .then((m) => {
                console.log('✅ MongoDB connected successfully');
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
                return null;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};
