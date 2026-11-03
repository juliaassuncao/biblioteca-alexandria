import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPLETION_STORAGE_KEY, normalizeCompletion, readCompletion, saveCompletion, toggleCompletion } from '../src/services/reader-completion.ts';
import { readingProgress } from '../src/services/reading-progress.ts';

test('marcação manual separa obra e capítulo e permite desfazer sem afetar os demais', () => {
  let entries = toggleCompletion([], 'morte-a-linguagem', 'cap-01');
  entries = toggleCompletion(entries, 'outra-obra', 'cap-01');
  entries = toggleCompletion(entries, 'morte-a-linguagem', 'cap-02');
  entries = toggleCompletion(entries, 'morte-a-linguagem', 'cap-01');
  assert.deepEqual(entries, [{ workId: 'outra-obra', chapterId: 'cap-01' }, { workId: 'morte-a-linguagem', chapterId: 'cap-02' }]);
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.equal(saveCompletion(storage, entries), true);
  assert.ok(data.has(COMPLETION_STORAGE_KEY));
  assert.deepEqual(readCompletion(storage), entries);
});

test('marcações corrompidas, duplicadas e armazenamento bloqueado têm recuperação segura', () => {
  const entry = { workId: 'morte-a-linguagem', chapterId: 'cap-01' };
  assert.deepEqual(normalizeCompletion([entry, entry, null, {}, { ...entry, chapterId: '../01' }]), [entry]);
  assert.deepEqual(readCompletion({ getItem: () => '{invalid' }), []);
  assert.deepEqual(readCompletion({ getItem() { throw Error('Blocked'); } }), []);
  assert.equal(saveCompletion({ setItem() { throw Error('Quota'); } }, [entry]), false);
});

test('progresso considera somente a área narrativa e não modifica marcações', () => {
  const entries = [{ workId: 'morte-a-linguagem', chapterId: 'cap-01' }];
  assert.equal(readingProgress(0, 800, 1200, 4800), 0);
  assert.equal(readingProgress(1200, 800, 1200, 4800), 0);
  assert.equal(readingProgress(3200, 800, 1200, 4800), 50);
  assert.equal(readingProgress(5200, 800, 1200, 4800), 100);
  assert.equal(readingProgress(9000, 800, 1200, 4800), 100);
  assert.deepEqual(entries, [{ workId: 'morte-a-linguagem', chapterId: 'cap-01' }]);
  assert.equal(readingProgress(0, 800, 900, 200), 0);
  assert.equal(readingProgress(400, 800, 900, 200), 100);
  for (const args of [[NaN, 800, 0, 1000], [0, 0, 0, 1000], [0, 800, 0, 0]]) assert.equal(readingProgress(...args), 0);
});
