/* eslint-disable @typescript-eslint/no-require-imports */
// Run once per minute from the deployment's scheduler, independently of web traffic.
require('@next/env').loadEnvConfig(process.cwd());
const mongoose = require('mongoose');

async function main() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    const result = await mongoose.connection.collection('chapters').updateMany(
        { status: 'scheduled', scheduledAt: { $type: 'date', $lte: new Date() } },
        [{ $set: { status: 'published', publishedAt: '$scheduledAt', updatedAt: '$$NOW' } }],
    );
    console.log(`Published ${result.modifiedCount} scheduled chapters`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
