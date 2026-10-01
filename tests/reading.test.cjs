/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
  module._compile(output.outputText, filename);
};
const mongoose = require('mongoose');
const Novel = require('../server/models/Novel.ts').default;
const Chapter = require('../server/models/Chapter.ts').default;
const ReadEvent = require('../server/models/ReadEvent.ts').default;
const { getChapterContent } = require('../server/controllers/getNovel.ts');
const { trackRead } = require('../server/controllers/read.controller.ts');
const { uploadChapter } = require('../server/controllers/uploadNovel.ts');

function response() {
  return { code: 200, headers: {}, status(code) { this.code = code; return this; }, json(value) { this.value = value; return this; }, setHeader(key, value) { this.headers[key] = value; return this; } };
}
function query(value) {
  const result = { lean: async () => value, select() { return this; }, sort() { return this; }, populate() { return this; } };
  return result;
}
const authorId = new mongoose.Types.ObjectId();
const novelId = new mongoose.Types.ObjectId();
const chapterId = new mongoose.Types.ObjectId();
const chapter = { _id: chapterId, novelId, chapterNumber: 2, status: 'draft', content: 'Secret', contentJson: { type: 'doc' }, views: 0 };

test('public chapter read excludes drafts and does not mutate views', async t => {
  t.mock.method(Novel, 'findOne', filter => { assert.equal(filter.publishStatus, 'published'); return query({ _id: novelId, author: authorId }); });
  t.mock.method(Chapter, 'findOne', filter => { assert.ok(filter.$or); return query(null); });
  t.mock.method(Chapter, 'updateOne', () => assert.fail('GET wrote a view'));
  const res = response();
  await getChapterContent({ params: { novelId: String(novelId), chapterNumber: '2' }, query: {} }, res);
  assert.equal(res.code, 404);
});

test('owner preview can read a draft without counting or public cache', async t => {
  t.mock.method(Novel, 'findOne', () => query({ _id: novelId, author: authorId }));
  t.mock.method(Chapter, 'findOne', filter => query(filter.chapterNumber === 2 ? chapter : null));
  t.mock.method(Chapter, 'updateOne', () => assert.fail('GET wrote a view'));
  const res = response();
  await getChapterContent({ params: { novelId: String(novelId), chapterNumber: '2' }, query: { preview: 'true' }, userId: String(authorId) }, res);
  assert.equal(res.code, 200);
  assert.equal(res.value.data.content, 'Secret');
  assert.equal(res.headers['Cache-Control'], 'private, no-store');
});

test('outsider cannot preview a draft', async t => {
  t.mock.method(Novel, 'findOne', () => query({ _id: novelId, author: authorId }));
  const User = require('../server/models/User.ts').default;
  t.mock.method(User, 'exists', async () => null);
  const res = response();
  await getChapterContent({ params: { novelId: String(novelId), chapterNumber: '2' }, query: { preview: 'true' }, userId: String(new mongoose.Types.ObjectId()) }, res);
  assert.equal(res.code, 404);
});

test('duplicate read receipt does not increment counters', async t => {
  t.mock.method(Chapter, 'findOne', () => query({ _id: chapterId, novelId }));
  t.mock.method(Novel, 'exists', async () => ({ _id: novelId }));
  t.mock.method(ReadEvent, 'create', async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); });
  t.mock.method(Chapter, 'updateOne', () => assert.fail('duplicate updated chapter'));
  t.mock.method(Novel, 'updateOne', () => assert.fail('duplicate updated novel'));
  const res = response();
  await trackRead({ body: { chapterId: String(chapterId), sessionId: '00000000-0000-4000-8000-000000000000' } }, res);
  assert.equal(res.value.data.counted, false);
});

test('a scheduled chapter needs a future date', async t => {
  t.mock.method(Novel, 'findById', async () => ({ _id: novelId, author: authorId }));
  const res = response();
  await uploadChapter({ userId: String(authorId), body: { data: { novelId: String(novelId), title: 'X', content: 'X', status: 'scheduled' } } }, res);
  assert.equal(res.code, 400);
});

test('a first read records one receipt and updates both counters', async t => {
  t.mock.method(Chapter, 'findOne', () => query({ _id: chapterId, novelId }));
  t.mock.method(Novel, 'exists', async () => ({ _id: novelId }));
  let receipt = 0, chapterViews = 0, novelViews = 0;
  t.mock.method(ReadEvent, 'create', async data => { assert.equal(String(data.chapterId), String(chapterId)); receipt++; });
  t.mock.method(Chapter, 'updateOne', async (_filter, update) => { chapterViews += update.$inc.views; });
  t.mock.method(Novel, 'updateOne', async (_filter, update) => { novelViews += update.$inc.views; });
  const res = response();
  await trackRead({ body: { chapterId: String(chapterId), sessionId: '00000000-0000-4000-8000-000000000000' } }, res);
  assert.equal(res.value.data.counted, true);
  assert.deepEqual([receipt, chapterViews, novelViews], [1, 1, 1]);
});
