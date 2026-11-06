import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
import { researchAreas } from '@/content/research-areas';
import { getAlumni, getMembers, getNews } from '@/lib/content';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, '');
  const now = new Date(site.dataAsOf);
  const top = ['', '/about', '/research', '/projects', '/people', '/publications', '/books', '/news', '/contact'].map((p) => ({
    url: `${base}${p || '/'}`,
    lastModified: now,
    changeFrequency: (p === '' || p === '/news' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
    priority: p === '' ? 1 : 0.8,
  }));
  const areas = researchAreas.map((a) => ({ url: `${base}/research/${a.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 }));
  const people = [...getMembers().filter((m) => !m.isSample).map((m) => m.slug), ...getAlumni().filter((a) => !a.isSample).map((a) => a.slug)].map((s) => ({ url: `${base}/people/${s}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 }));
  const news = getNews().map((n) => ({ url: `${base}/news/${n.slug}`, lastModified: new Date(n.date.length === 4 ? `${n.date}-01-01` : n.date.length === 7 ? `${n.date}-01` : n.date), changeFrequency: 'yearly' as const, priority: 0.4 }));
  return [...top, ...areas, ...people, ...news];
}
