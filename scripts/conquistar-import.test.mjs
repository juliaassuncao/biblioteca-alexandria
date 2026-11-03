import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readCatalog,readChapterFiles} from './validate-catalog.mjs';
import {createChapterService} from '../src/services/chapter-data.ts';
const work=readCatalog().find(w=>w.id==='como-conquistar-e-perder');
const files=readChapterFiles().filter(f=>f.workId===work.id);
const report=JSON.parse(readFileSync(new URL('../docs/IMPORTACAO-COMO-CONQUISTAR-E-PERDER.json',import.meta.url)));
const hash=t=>createHash('sha256').update(t).digest('hex');
test('Okada: créditos, fonte e metadados oficiais',()=>{
 assert.equal(work.author.displayName,'Okada');assert.equal(work.author.ao3Name,'medvegoals');assert.equal(work.author.authorLink,'https://x.com/medvegoals');assert.equal(work.stats.words,99521);assert.equal(work.stats.plannedChapters,null);assert.equal(work.cover.ornament,'contract');assert.equal(work.editorial.contentReady,false);
});
test('30 capítulos preservam texto, notas e hashes das duas extrações',async()=>{
 assert.equal(files.length,30);
 const loaders=Object.fromEntries(files.map(f=>[`../content/chapters/${work.id}/${f.chapterId}.json`,async()=>f.content]));const service=createChapterService(loaders);
 for(const c of report.chapters){const f=files.find(f=>f.chapterId===c.id);const text=[...f.content.notes.before,...f.content.blocks,...f.content.notes.after].map(b=>b.text??'').join('\n\n');assert.equal(hash(text),c.structuredTextSha256);assert.equal(hash(text.replace(/\s/gu,'')),c.sourceGlyphSha256);assert.equal(c.sourceGlyphSha256,c.independentGlyphSha256);assert.equal((await service.load(work,c.number)).status,'ready');assert.equal(work.chapters[c.number-1].title,c.title);}
 assert.equal(service.neighbors(work,1).previous,undefined);assert.equal(service.neighbors(work,30).next,undefined);
});
