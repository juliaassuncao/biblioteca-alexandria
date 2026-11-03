import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog, validateCatalog } from './validate-catalog.mjs';
const catalog=readCatalog();

test('dados cadastrados passam nas regras do catálogo',()=>{
  assert.deepEqual(validateCatalog(catalog),[]);
});
test('Morte à Linguagem tem 14 capítulos publicados e link AO3 real',()=>{
  const pilot=catalog.find((w)=>w.id==='morte-a-linguagem');
  assert.ok(pilot);
  assert.equal(pilot.reading.mode,'internal');
  assert.equal(pilot.chapters.length,14);
  assert.equal(pilot.stats.plannedChapters,17);
  assert.equal(pilot.links.original,'https://archiveofourown.org/works/78179326');
  assert.equal(pilot.chapters[13].title,'Semana 3 - Doce-amargo');
  assert.ok(pilot.chapters[13].contentWarnings.length>0);
});
test('Bones e Custode são projetos externos sem conteúdo duplicado',()=>{
  for (const id of ['bones','custode']) {
    const work=catalog.find((w)=>w.id===id);
    assert.ok(work);
    assert.equal(work.reading.mode,'external');
    assert.equal(work.chapters.length,0);
    assert.equal(work.reading.externalUrl,null);
  }
});
test('validador rejeita IDs duplicados',()=>{
  const dup=structuredClone(catalog);
  dup[1].id=dup[0].id;
  assert.ok(validateCatalog(dup).some((e)=>e.includes('duplicado')));
});
