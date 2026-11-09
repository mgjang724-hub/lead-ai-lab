// 데이터 무결성 검사: npm run check:data
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(path.join(root, 'content/data', p), 'utf8'));
/* public/ 기준 경로("/images/...")의 파일이 실제로 있는지 */
const publicFile = (p) => typeof p === 'string' && p.startsWith('/') && existsSync(path.join(root, 'public', p));
const AREAS = ['ai-in-education', 'learning-analytics', 'instructional-design', 'teacher-competency', 'hrd'];
const TYPES = ['journal', 'book', 'conference'];
const NEWS_CATS = ['notice', 'conference', 'publication', 'award', 'event', 'member'];
const errors = [];
const warn = [];
const assert = (cond, msg) => {
  if (!cond) errors.push(msg);
};
const unique = (arr, label) => {
  const seen = new Set();
  for (const v of arr) {
    if (seen.has(v)) errors.push(`${label}: 중복 "${v}"`);
    seen.add(v);
  }
};
const isAreaList = (areas, label) => {
  assert(Array.isArray(areas), `${label}: areas 는 배열이어야 합니다`);
  for (const a of areas || []) assert(AREAS.includes(a), `${label}: 알 수 없는 분야 "${a}"`);
};

// publications
const pubs = read('publications.json');
unique(pubs.items.map((p) => p.id), 'publications.id');
for (const t of TYPES) {
  const n = pubs.items.filter((p) => p.type === t).length;
  assert(n === pubs.counts[t], `publications: ${t} 건수 ${n} != counts.${t} ${pubs.counts[t]}`);
}
for (const p of pubs.items) {
  assert(TYPES.includes(p.type), `${p.id}: type "${p.type}"`);
  assert(typeof p.title === 'string' && p.title.trim(), `${p.id}: 제목 없음`);
  assert(typeof p.venue === 'string', `${p.id}: venue 없음`);
  assert(['professor', 'lab'].includes(p.scope), `${p.id}: scope "${p.scope}"`);
  isAreaList(p.areas, p.id);
  if (p.year === null) warn.push(`${p.id}: 연도 미상 (date="${p.date}")`);
  else assert(String(p.year) === String(p.sortKey).slice(0, 4), `${p.id}: year/sortKey 불일치`);
  if (!p.areas?.length) warn.push(`${p.id}: 분야 미분류`);
  if (p.cover && !publicFile(p.cover)) errors.push(p.id + ': cover 파일 없음 "' + p.cover + '"');
  if (p.doi && !/^10\./.test(p.doi)) errors.push(`${p.id}: DOI 형식 "${p.doi}"`);
}

// projects
const prj = read('projects.json');
unique(prj.items.map((p) => p.id), 'projects.id');
for (const p of prj.items) {
  assert(p.title && p.funder && p.period, `${p.id}: title/funder/period 누락`);
  assert(Number.isInteger(p.startYear) && Number.isInteger(p.endYear) && p.startYear <= p.endYear, `${p.id}: 연도 범위 오류`);
  assert(['ongoing', 'completed'].includes(p.status), `${p.id}: status "${p.status}"`);
  isAreaList(p.areas, p.id);
}

// career
const career = read('career.json');
unique(career.items.map((c) => c.id), 'career.id');
for (const c of career.items) {
  assert(c.role && c.org && c.start, `${c.id}: role/org/start 누락`);
  assert(c.current === (c.end === null), `${c.id}: current 와 end 불일치`);
}

// members
const members = read('members.json');
const profileLists = (p) => {
  for (const k of ['research', 'awards', 'history']) {
    if (p[k] == null) continue;
    assert(Array.isArray(p[k]) && p[k].every((e) => e && e.period && e.title), `${p.slug}: ${k} 항목은 { period, title, detail? } 형식이어야 합니다`);
  }
};
unique([...members.members, ...members.alumni].map((m) => m.slug), 'members.slug');
for (const m of members.members) {
  assert(m.slug && m.name, 'member: slug/name 누락');
  assert(['phd', 'master', 'undergrad', 'researcher', 'other'].includes(m.role), `${m.slug}: role "${m.role}"`);
  if (m.areas) isAreaList(m.areas, m.slug);
  if (m.photo && !publicFile(m.photo)) errors.push(m.slug + ': photo 파일 없음 "' + m.photo + '"');
  profileLists(m);
  if (m.isSample) warn.push(m.slug + ": 예시 구성원 (가상 인물 — 화면에 '예시' 표시, 실제 명단 확정 후 삭제)");
}
for (const a of members.alumni) {
  assert(a.slug && a.name && Number.isInteger(a.graduatedYear), 'alumni: slug/name/graduatedYear 누락');
  assert(['phd', 'master'].includes(a.degree), `${a.slug}: degree "${a.degree}"`);
  if (a.areas) isAreaList(a.areas, a.slug);
  if (a.photo && !publicFile(a.photo)) errors.push(a.slug + ': photo 파일 없음 "' + a.photo + '"');
  profileLists(a);
  if (a.isSample) warn.push(`${a.slug}: 예시 졸업생 (가상 인물 — 화면에 '예시' 표시, 실제 명단 확정 후 삭제)`);
}

// news
const news = read('news.json');
unique(news.items.map((n) => n.slug), 'news.slug');
for (const n of news.items) {
  assert(/^\d{4}(-\d{2}){0,2}$/.test(n.date), `${n.slug}: date "${n.date}" (YYYY, YYYY-MM, YYYY-MM-DD)`);
  assert(NEWS_CATS.includes(n.category), `${n.slug}: category "${n.category}"`);
  assert(n.title, `${n.slug}: 제목 없음`);
  if (/\[예시/.test(n.title) && !n.isSample) errors.push(`${n.slug}: 예시 제목인데 isSample 이 없습니다`);
  if (n.category === 'award' && n.isSample) errors.push(`${n.slug}: 수상 소식은 예시로 두지 마세요`);
  if (n.isSample) warn.push(`${n.slug}: 예시 콘텐츠 (화면에 '예시' 표시)`);
}

// lab history
const hist = read('lab-history.json');
for (const h of hist.items) assert(/^\d{4}$/.test(h.year) && h.title, 'lab-history: year/title 형식');

const total = `논문 ${pubs.counts.journal} · 저역서 ${pubs.counts.book} · 학술발표 ${pubs.counts.conference} · 프로젝트 ${prj.items.length} · 경력 ${career.items.length} · 구성원 ${members.members.length} · 졸업생 ${members.alumni.length} · 소식 ${news.items.length}`;
console.log(`[check:data] ${total}`);
for (const w of warn) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (errors.length) {
  console.log(`[check:data] ${errors.length} error(s)`);
  process.exit(1);
}
console.log('[check:data] OK');
