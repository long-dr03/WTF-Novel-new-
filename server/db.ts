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
        throw new Error('MONGODB_URI chưa được cấu hình');
    }

    if (cached.conn?.connection.readyState === 1) return cached.conn;
    if (cached.conn) {
        cached.conn = null;
        cached.promise = null;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(mongodbUri, {
                serverSelectionTimeoutMS: 8000,
                socketTimeoutMS: 45000,
            })
            .then((m) => {
                console.log('✅ MongoDB connected successfully');
                return m;
            })
            .catch((err) => {
                cached.promise = null;
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};
