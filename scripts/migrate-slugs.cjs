/* eslint-disable @typescript-eslint/no-require-imports */
require('@next/env').loadEnvConfig(process.cwd());
const mongoose = require('mongoose');

async function main() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    const novels = mongoose.connection.collection('novels');
    const cursor = novels.find({ $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }] }, { projection: { title: 1 } });
    let count = 0;
    for await (const novel of cursor) {
        const base = String(novel.title || '').toLowerCase().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
            .replace(/([^a-z0-9\s-]|_)/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'novel';
        // The ID suffix makes backfilling deterministic and collision resistant.
        const slug = `${base}-${novel._id}`;
        await novels.updateOne({ _id: novel._id, $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }] }, { $set: { slug } });
        count++;
    }
    console.log(`Migrated ${count} novels`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
