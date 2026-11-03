import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { validateBlocks, validateChapterContent } from '../src/services/chapter-content.ts';
import { applyChapterPresentation, sourceBlocks } from '../src/services/chapter-presentation.ts';

const here = dirname(fileURLToPath(import.meta.url));
export const readCatalog = () => JSON.parse(readFileSync(resolve(here, '../src/content/works.json'), 'utf8'));

export function validateCatalog(works) {
  const errors = [];
  if (!Array.isArray(works) || works.length===0) return ['O catálogo deve conter ao menos uma obra.'];
  const ids = new Set(); const slugs = new Set();
  for (const [index,work] of works.entries()) {
    const where = `Obra ${index+1} (${work?.id ?? 'sem id'})`;
    if (typeof work?.id!=='string' || !/^[a-z0-9-]+$/.test(work.id)) errors.push(`${where}: ID inválido`);
    if (ids.has(work.id)) errors.push(`${where}: ID duplicado`); ids.add(work.id);
    if (typeof work?.slug!=='string' || !/^[a-z0-9-]+$/.test(work.slug)) errors.push(`${where}: slug inválido`);
    if (slugs.has(work.slug)) errors.push(`${where}: slug duplicado`); slugs.add(work.slug);
    if (!work?.title?.trim() || !work?.synopsis?.trim()) errors.push(`${where}: falta título ou sinopse`);
    for (const field of ['ao3Authors', 'relationships', 'characters']) {
      if (work[field] !== undefined && (!Array.isArray(work[field]) || !work[field].every(value => typeof value === 'string' && value.trim()))) errors.push(`${where}: ${field} inválido`);
    }
    if (work.workNotes !== undefined) errors.push(...validateBlocks(work.workNotes, `${where}, notas da obra`));
    if (!['internal','external'].includes(work?.reading?.mode)) errors.push(`${where}: modo de leitura inválido`);
    if (work.downloads !== undefined && (typeof work.downloads?.enabled !== 'boolean' || (work.downloads.enabled && work.reading?.mode !== 'internal'))) errors.push(`${where}: configuração de downloads inválida ou habilitada em obra externa`);
    if (!['ongoing','completed','unknown'].includes(work?.status)) errors.push(`${where}: status inválido`);
    if (!Array.isArray(work?.chapters)) {errors.push(`${where}: capítulos não são lista`);continue;}
    if (work.reading.mode==='external' && work.chapters.length) errors.push(`${where}: site externo não pode armazenar capítulos internos`);
    if (work.reading.mode==='internal') {
      if (work.stats?.publishedChapters!==work.chapters.length) errors.push(`${where}: quantidade de capítulos divergente`);
      const chapters = new Set();
      for (const [j,ch] of work.chapters.entries()) {
        if (!ch || typeof ch !== 'object') { errors.push(`${where}: capítulo ${j+1} inválido`); continue; }
        if (typeof ch.id !== 'string' || !/^[a-z0-9-]+$/.test(ch.id)) errors.push(`${where}: ID do capítulo ${j+1} inválido`);
        if (ch.number!==j+1) errors.push(`${where}: numeração do capítulo ${j+1} inválida`);
        if (chapters.has(ch.id)) errors.push(`${where}: ID de capítulo duplicado`); chapters.add(ch.id);
        if (!ch.title?.trim()) errors.push(`${where}: capítulo ${j+1} sem título`);
        if (!Array.isArray(ch.blocks) || !Array.isArray(ch.notes?.before) || !Array.isArray(ch.notes?.after)) errors.push(`${where}: blocos de conteúdo e notas devem ser arrays`);
        if (typeof ch.notes?.hasBefore !== 'boolean' || typeof ch.notes?.hasAfter !== 'boolean') errors.push(`${where}: indicação de notas inválida`);
        if (!Array.isArray(ch.contentWarnings) || !ch.contentWarnings.every(warning => typeof warning === 'string' && warning.trim())) errors.push(`${where}: avisos de capítulo inválidos`);
        const blockIds = new Set();
        for (const [label, blocks] of [['narrativa', ch.blocks], ['notas antes', ch.notes?.before], ['notas depois', ch.notes?.after]]) {
          errors.push(...validateBlocks(blocks, `${where}, capítulo ${j+1}, ${label}`, blockIds));
        }
      }
    }
    for (const [name,url] of [['original',work.links?.original],['externalUrl',work.reading?.externalUrl],['authorLink',work.author?.authorLink]]) {
      if (url===null || url===undefined) continue;
      try { const parsed=new URL(url); if (!['https:','http:'].includes(parsed.protocol)) throw Error(); }
      catch{errors.push(`${where}: link ${name} não é HTTP(S) válido`);}
    }
  }
  return errors;
}

export function readChapterFiles(root = resolve(here, '../src/content/chapters')) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const work of readdirSync(root, { withFileTypes: true })) {
    if (!work.isDirectory()) continue;
    for (const file of readdirSync(resolve(root, work.name), { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith('.json')) continue;
      const path = `${work.name}/${file.name}`;
      try {
        files.push({ path, workId: work.name, chapterId: file.name.slice(0, -5), content: JSON.parse(readFileSync(resolve(root, path), 'utf8')) });
      } catch {
        files.push({ path, workId: work.name, chapterId: file.name.slice(0, -5), error: 'JSON inválido ou arquivo ilegível' });
      }
    }
  }
  return files;
}

export function validateChapterFiles(works, files) {
  const errors = [];
  const paths = new Set();
  for (const file of files) {
    if (paths.has(file.path)) errors.push(`${file.path}: arquivo duplicado`);
    paths.add(file.path);
    const work = works.find(item => item.id === file.workId);
    if (!work) { errors.push(`${file.path}: obra não cadastrada`); continue; }
    if (work.reading.mode !== 'internal') { errors.push(`${file.path}: obra externa não pode ter conteúdo interno`); continue; }
    const chapter = work.chapters.find(item => item.id === file.chapterId);
    if (!chapter) { errors.push(`${file.path}: capítulo não cadastrado`); continue; }
    if (file.error) { errors.push(`${file.path}: ${file.error}`); continue; }
    errors.push(...validateChapterContent(file.content, chapter).map(error => `${file.path}: ${error}`));
  }
  return errors;
}

export const readPresentationFiles = () => readChapterFiles(resolve(here, '../src/content/presentation'));

export function validatePresentationFiles(works, chapters, files) {
  const errors = [];
  const paths = new Set();
  for (const file of files) {
    if (paths.has(file.path)) errors.push(`${file.path}: apresentação duplicada`);
    paths.add(file.path);
    const work = works.find(item => item.id === file.workId);
    const chapter = work?.chapters.find(item => item.id === file.chapterId);
    const source = chapters.find(item => item.workId === file.workId && item.chapterId === file.chapterId);
    if (!work || work.reading.mode !== 'internal' || !chapter || !source?.content) { errors.push(`${file.path}: apresentação sem capítulo interno importado`); continue; }
    if (file.error) { errors.push(`${file.path}: ${file.error}`); continue; }
    try {
      const blocks = applyChapterPresentation(chapter.id, source.content.blocks, file.content);
      errors.push(...validateChapterContent({ ...source.content, blocks }, chapter).map(error => `${file.path}: ${error}`));
      if (!isDeepStrictEqual(sourceBlocks(blocks), source.content.blocks)) errors.push(`${file.path}: apresentação alterou conteúdo, IDs ou ordem original`);
    } catch (error) { errors.push(`${file.path}: ${error.message}`); }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const catalog = readCatalog();
  const files = readChapterFiles();
  const presentations = readPresentationFiles();
  const errors = [...validateCatalog(catalog), ...validateChapterFiles(catalog, files), ...validatePresentationFiles(catalog, files, presentations)];
  if (errors.length) {console.error(errors.join('\n'));process.exitCode=1;}
  else console.log(`Catálogo validado: ${catalog.length} obras. Capítulos cadastrados: ${catalog.reduce((sum,w)=>sum+w.chapters.length,0)}. Arquivos de capítulo importados e validados: ${files.length}. Apresentações verificadas: ${presentations.length}.`);
}
