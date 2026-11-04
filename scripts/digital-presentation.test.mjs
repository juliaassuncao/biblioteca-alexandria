import test from 'node:test';
import assert from 'node:assert/strict';
import { applyChapterPresentation, sourceBlocks } from '../src/services/chapter-presentation.ts';
import { validateBlocks } from '../src/services/chapter-content.ts';
import { transformBlocks } from '../src/services/export/export-content.ts';

test('mensagens no mesmo parágrafo preservam remetentes, ênfase e origem', () => {
  const text = 'Pessoa A: Oi! Pessoa B: Olá.\nTudo bem?';
  const original = [{ id: 'p', type: 'paragraph', text, segments: [{ type: 'emphasis', children: [{ type: 'text', text }] }] }];
  const blocks = applyChapterPresentation('cap', original, { chapterId: 'cap', groups: [{ type: 'chat', start: 'p', end: 'p', inlineSenders: ['Pessoa A', 'Pessoa B'], rightSenders: ['Pessoa B'] }] });
  assert.deepEqual(sourceBlocks(blocks), original);
  assert.deepEqual(validateBlocks(blocks), []);
  assert.equal(blocks[0].entries.length, 2);
  assert.equal(blocks[0].entries[1].side, 'right');
  assert.equal(blocks[0].entries[1].body[0].text, 'Olá.\nTudo bem?');
  assert.equal(blocks[0].entries[1].body[0].segments[0].type, 'emphasis');
});

test('publicações e respostas preservam parágrafos e não criam métricas', () => {
  const original = [{ id: 'p', type: 'paragraph', text: '@perfil: Primeiro parágrafo.' }, { id: 'q', type: 'paragraph', text: 'Segundo parágrafo.\n|\n@outro replying to @perfil: Resposta!' }];
  const blocks = applyChapterPresentation('cap', original, { chapterId: 'cap', groups: [{ type: 'tweet', start: 'p', end: 'q' }] });
  assert.deepEqual(sourceBlocks(blocks), original);
  assert.deepEqual(validateBlocks(blocks), []);
  assert.equal(blocks[0].posts.length, 2);
  assert.equal(blocks[0].posts[0].body.length, 2);
  assert.equal(blocks[0].posts[1].replyTo, '@perfil');
  assert.equal(blocks[0].posts[0].metrics, undefined);
  assert.equal(blocks[0].posts[0].date, undefined);
  const serialized = JSON.stringify(transformBlocks(blocks));
  for (const text of ['Primeiro parágrafo.', 'Segundo parágrafo.', 'Resposta!', '@perfil', '@outro']) assert.ok(serialized.includes(text));
});
