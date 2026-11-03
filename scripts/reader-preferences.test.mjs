import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_READER_PREFERENCES, FONT_SIZE, READER_STORAGE_KEY,
  normalizeReaderPreferences, readReaderPreferences, saveReaderPreferences,
} from '../src/services/reader-preferences.ts';

test('preferências inválidas e dados corrompidos usam padrões seguros', () => {
  for (const value of [null, [], 'dark', {}, { theme: 'unknown', width: '__proto__', lineHeight: 'toString', fontSize: Infinity }]) {
    assert.deepEqual(normalizeReaderPreferences(value), DEFAULT_READER_PREFERENCES);
  }
  assert.deepEqual(readReaderPreferences({ getItem: () => '{invalid' }), DEFAULT_READER_PREFERENCES);
});

test('fonte respeita limites mínimo e máximo', () => {
  assert.equal(normalizeReaderPreferences({ fontSize: 5 }).fontSize, FONT_SIZE.min);
  assert.equal(normalizeReaderPreferences({ fontSize: 999 }).fontSize, FONT_SIZE.max);
  assert.equal(normalizeReaderPreferences({ fontSize: NaN }).fontSize, FONT_SIZE.default);
});

test('tema, coluna, fonte e espaçamento sobrevivem a uma nova leitura do armazenamento', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const preferences = { theme: 'dark', font: 'sans', width: 'narrow', fontSize: 26, lineHeight: 'spacious' };
  assert.equal(saveReaderPreferences(storage, preferences), true);
  assert.ok(data.has(READER_STORAGE_KEY));
  assert.deepEqual(readReaderPreferences(storage), preferences);
});

test('preferências da fase anterior recebem fonte serifada sem perder ajustes', () => {
  const old = { theme: 'sepia', width: 'wide', fontSize: 24, lineHeight: 'spacious' };
  assert.deepEqual(normalizeReaderPreferences(old), { ...old, font: 'serif' });
});

test('armazenamento indisponível não interrompe a experiência de leitura', () => {
  const storage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Quota'); } };
  assert.deepEqual(readReaderPreferences(storage), DEFAULT_READER_PREFERENCES);
  assert.equal(saveReaderPreferences(storage, DEFAULT_READER_PREFERENCES), false);
});
