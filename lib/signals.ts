// Server-only module — only ever imported from Route Handlers (app/api/**).
// Pulls real, live market signals from free public data sources, no API keys
// required. Used by /api/signals (the Trends feed) and /api/discover (to
// ground AI-generated opportunities in real, current data).
import { Signal, SignalSource, timeAgo } from '@/lib/data';

type SourceStatus = { ok: boolean; count: number; error?: string };

export interface LiveSignalsResult {
  signals: Signal[];
  fetchedAt: string;
  sources: Record<string, SourceStatus>;
}

// Plain "app name + contact" form — SEC EDGAR's WAF (efts.sec.gov) 403s on
// UA strings that look bot-like (parentheses, "+http", etc.), so keep this simple.
const UA = 'Scout Research Tool ojasvi24@berkeley.edu';

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, headers: { 'User-Agent': UA, ...(init.headers || {}) } });
  } finally {
    clearTimeout(id);
  }
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#39;|&apos;|&amp;|&lt;|&gt;|&quot;|&nbsp;/g, (m) => HTML_ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s: string, max: number): string {
  const clean = s.trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

// RemoteOK (and occasionally other sources) sometimes serve UTF-8 text that got
// decoded as Latin-1 upstream, producing mojibake like "referÃªncia" instead of
// "referência". Detect that pattern and repair it; leave normal text untouched.
const MOJIBAKE_PATTERN = /[ÃÂ][\x80-\xBF]|â€™|â€œ|â€/;
function fixMojibake(s: string): string {
  if (!MOJIBAKE_PATTERN.test(s)) return s;
  try {
    return Buffer.from(s, 'latin1').toString('utf8');
  } catch {
    return s;
  }
}

// ── Hacker News (Tech) ──────────────────────────────────────────────────────
async function fetchHackerNews(limit: number): Promise<Signal[]> {
  const idsRes = await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/topstories.json');
  if (!idsRes.ok) throw new Error(`HN topstories ${idsRes.status}`);
  const ids: number[] = (await idsRes.json()).slice(0, limit * 2);

  const items = await Promise.all(
    ids.slice(0, limit).map(async (id) => {
      try {
        const res = await fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })
  );

  return items
    .filter((item): item is { id: number; title: string; time: number; url?: string; score?: number } => !!item?.title)
    .map((item) => ({
      id: `hn-${item.id}`,
      source: 'Tech' as SignalSource,
      origin: 'Hacker News',
      content: `${item.title}${item.score ? ` (${item.score} points)` : ''}`,
      timestamp: timeAgo(new Date(item.time * 1000)),
      url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
    }));
}

// ── arXiv (Research) ────────────────────────────────────────────────────────
const ARXIV_CATEGORY_SETS = [
  ['cs.AI', 'cs.LG', 'cs.CL'],
  ['cs.CR', 'cs.RO', 'cs.CY'],
  ['q-bio.QM', 'physics.app-ph', 'cs.CE'],
];

async function fetchArxiv(limit: number): Promise<Signal[]> {
  const cats = ARXIV_CATEGORY_SETS[Math.floor(Math.random() * ARXIV_CATEGORY_SETS.length)];
  const query = cats.map((c) => `cat:${c}`).join('+OR+');
  const url = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=${limit}`;
  const res = await fetchWithTimeout(url, {}, 8000);
  if (!res.ok) throw new Error(`arXiv ${res.status}`);
  const xml = await res.text();

  const entries = xml.split('<entry>').slice(1);
  return entries.slice(0, limit).map((entry) => {
    const title = (entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Untitled paper').replace(/\s+/g, ' ').trim();
    const idUrl = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim();
    const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim();
    return {
      id: `arxiv-${idUrl?.split('/abs/')[1] ?? Math.random()}`,
      source: 'Research' as SignalSource,
      origin: 'arXiv',
      content: title,
      timestamp: published ? timeAgo(new Date(published)) : 'recently',
      url: idUrl,
    };
  });
}

// ── RemoteOK (Jobs) ──────────────────────────────────────────────────────────
async function fetchRemoteOk(limit: number): Promise<Signal[]> {
  const res = await fetchWithTimeout('https://remoteok.com/api');
  if (!res.ok) throw new Error(`RemoteOK ${res.status}`);
  const data = await res.json();
  const jobs = Array.isArray(data) ? data.filter((d) => d && d.id && d.position) : [];

  return jobs.slice(0, limit).map((job) => {
    const company = fixMojibake(job.company ?? 'A company');
    const position = fixMojibake(job.position);
    const desc = job.description ? fixMojibake(truncate(stripHtml(job.description), 140)) : '';
    return {
      id: `remoteok-${job.id}`,
      source: 'Jobs' as SignalSource,
      origin: 'RemoteOK',
      content: `${company} is hiring — ${position}${desc ? `: ${desc}` : ''}`,
      timestamp: job.epoch ? timeAgo(new Date(job.epoch * 1000)) : 'recently',
      url: job.url ?? (job.slug ? `https://remoteok.com/remote-jobs/${job.slug}` : undefined),
    };
  });
}

// ── SEC EDGAR Form D filings (Funding) ──────────────────────────────────────
// Note: EDGAR's full-text search index for Form D is sparse on descriptive
// text (the form itself is mostly structured fields), so phrase-searching a
// keyword tends to surface old, stale filings. Pulling the newest filings
// unfiltered keeps this signal genuinely current.
async function fetchSecFormD(limit: number): Promise<Signal[]> {
  const url = 'https://efts.sec.gov/LATEST/search-index?forms=D';
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`SEC EDGAR ${res.status}`);
  const data = await res.json();
  const hits: Array<{ _id: string; _source: Record<string, unknown> }> = data?.hits?.hits ?? [];

  return hits.slice(0, limit).map((hit) => {
    const src = hit._source as { display_names?: string[]; file_date?: string; biz_states?: string[]; ciks?: string[] };
    const name = (src.display_names?.[0] ?? 'A company').replace(/\s+\(CIK.*\)$/, '');
    const state = src.biz_states?.[0];
    const cik = src.ciks?.[0];
    return {
      id: `secd-${hit._id}`,
      source: 'Funding' as SignalSource,
      origin: 'SEC EDGAR (Form D)',
      content: `${name} filed a new Form D — a notice of a private capital raise${state ? ` (${state})` : ''}.`,
      timestamp: src.file_date ? timeAgo(new Date(src.file_date)) : 'recently',
      url: cik ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=D` : undefined,
    };
  });
}

// ── USAspending.gov (Grants) ────────────────────────────────────────────────
const GRANT_KEYWORDS = ['artificial intelligence', 'clean energy', 'cybersecurity', 'advanced manufacturing', 'quantum computing', 'biotechnology'];

async function fetchGrants(limit: number): Promise<Signal[]> {
  const keyword = GRANT_KEYWORDS[Math.floor(Math.random() * GRANT_KEYWORDS.length)];
  const start = new Date();
  start.setDate(start.getDate() - 180);

  const res = await fetchWithTimeout('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        award_type_codes: ['02', '03', '04', '05'],
        time_period: [{ start_date: start.toISOString().slice(0, 10), end_date: new Date().toISOString().slice(0, 10) }],
        keywords: [keyword],
      },
      fields: ['Recipient Name', 'Award Amount', 'Description', 'Start Date', 'Awarding Agency'],
      sort: 'Start Date',
      order: 'desc',
      limit,
      page: 1,
    }),
  }, 8000);
  if (!res.ok) throw new Error(`USAspending ${res.status}`);
  const data = await res.json();
  const results: Array<Record<string, unknown>> = data?.results ?? [];

  return results.slice(0, limit).map((r, i) => {
    const recipient = String(r['Recipient Name'] ?? 'A recipient');
    const amount = Number(r['Award Amount'] ?? 0);
    const agency = String(r['Awarding Agency'] ?? 'a federal agency');
    const desc = String(r['Description'] ?? '');
    const amountStr = amount >= 1000000 ? `$${(amount / 1000000).toFixed(1)}M` : `$${Math.round(amount / 1000)}K`;
    return {
      id: `usaspending-${i}-${recipient}`,
      source: 'Grants' as SignalSource,
      origin: 'USAspending.gov',
      content: `${recipient} received a ${amountStr} federal grant from ${agency} related to "${keyword}"${desc ? ` — ${truncate(desc, 120)}` : ''}`,
      timestamp: r['Start Date'] ? timeAgo(new Date(String(r['Start Date']))) : 'recently',
    };
  });
}

// ── GitHub (Community) ──────────────────────────────────────────────────────
async function fetchGithubTrending(limit: number): Promise<Signal[]> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const url = `https://api.github.com/search/repositories?q=created:>${since.toISOString().slice(0, 10)}&sort=stars&order=desc&per_page=${limit}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  const items: Array<Record<string, unknown>> = data?.items ?? [];

  return items.slice(0, limit).map((repo) => ({
    id: `github-${repo.id}`,
    source: 'Community' as SignalSource,
    origin: 'GitHub',
    content: `${repo.full_name} is trending${repo.description ? ` — ${truncate(String(repo.description), 140)}` : ''} (${repo.stargazers_count}★ this week)`,
    timestamp: repo.created_at ? timeAgo(new Date(String(repo.created_at))) : 'recently',
    url: repo.html_url as string | undefined,
  }));
}

// ── Orchestration + in-memory cache ─────────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache: { result: LiveSignalsResult; expiresAt: number } | null = null;

async function collectSignals(perSourceLimit: number): Promise<LiveSignalsResult> {
  const fetchers: [SignalSource | string, () => Promise<Signal[]>][] = [
    ['Tech', () => fetchHackerNews(perSourceLimit)],
    ['Research', () => fetchArxiv(perSourceLimit)],
    ['Jobs', () => fetchRemoteOk(perSourceLimit)],
    ['Funding', () => fetchSecFormD(perSourceLimit)],
    ['Grants', () => fetchGrants(perSourceLimit)],
    ['Community', () => fetchGithubTrending(perSourceLimit)],
  ];

  const sources: Record<string, SourceStatus> = {};
  const settled = await Promise.allSettled(fetchers.map(([, fn]) => fn()));

  const signals: Signal[] = [];
  settled.forEach((result, i) => {
    const [name] = fetchers[i];
    if (result.status === 'fulfilled') {
      sources[name] = { ok: true, count: result.value.length };
      signals.push(...result.value);
    } else {
      sources[name] = { ok: false, count: 0, error: result.reason instanceof Error ? result.reason.message : String(result.reason) };
      console.error(`[signals] ${name} fetch failed:`, result.reason);
    }
  });

  // Interleave sources instead of grouping, then trim.
  signals.sort(() => Math.random() - 0.5);

  return { signals, fetchedAt: new Date().toISOString(), sources };
}

/** Returns live signals, using a short in-memory cache to avoid hammering upstream APIs. */
export async function getLiveSignals(opts: { perSourceLimit?: number; force?: boolean } = {}): Promise<LiveSignalsResult> {
  const { perSourceLimit = 6, force = false } = opts;
  if (!force && cache && cache.expiresAt > Date.now()) {
    return cache.result;
  }
  const result = await collectSignals(perSourceLimit);
  // Only cache if we got at least some real data — don't cache a total outage.
  if (result.signals.length > 0) {
    cache = { result, expiresAt: Date.now() + CACHE_TTL_MS };
  }
  return result;
}
