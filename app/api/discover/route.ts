import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getLiveSignals } from '@/lib/signals';
import { calculateOpportunityScore, Signal } from '@/lib/data';

export const maxDuration = 90;

// Flash is fast and cheap on tokens — this route has no paid API key behind
// it, so avoid pro/preview models here. Note the free tier's real bottleneck
// isn't per-minute rate limits, it's a hard 20 REQUESTS-PER-DAY cap per
// model — since each opportunity below costs one request, keep RESULT_COUNT
// and the oversample margin conservative so a handful of scans a day doesn't
// exhaust it (once exhausted, every scan gracefully falls back to the cached
// examples until the quota resets — see the catch block below).
const MODEL = 'gemini-2.5-flash';

// How many distinct opportunities a single scan surfaces. Higher = more ideas
// per scan, but also more of the 20/day free-tier request quota per scan.
const RESULT_COUNT = 3;

// ── Structured output schema — the model's response is validated against this ──
const OpportunitySchema = z.object({
  title: z.string().describe('Short, compelling opportunity title (under 60 characters)'),
  problem: z.string().describe('2-3 sentences describing the specific problem and why it is painful today'),
  suggestedStartup: z.string().describe('One sentence describing the startup idea that solves it'),
  evidence: z.array(z.string()).min(3).max(4).describe('Concrete, specific evidence points — ideally referencing the real signals provided'),
  mvp: z.array(z.string()).min(3).max(4).describe('Concrete MVP features to build first'),
  potentialCustomers: z.array(z.string()).min(2).max(4).describe('Specific customer segments'),
  competitionLevel: z.enum(['Low', 'Medium', 'High']),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        moat: z.string(),
        weaknesses: z.array(z.string()).min(1).max(3),
      })
    )
    .max(3)
    .describe('Real or realistic competitors — empty array only if genuinely nobody is doing this'),
  metrics: z.object({
    trendGrowth: z.number().min(0).max(100),
    demandGrowth: z.number().min(0).max(100),
    marketScore: z.number().min(0).max(100),
    competitionScore: z.number().min(0).max(100),
  }),
  marketDetails: z.object({
    tam: z.string().describe('Total addressable market, e.g. "$12B"'),
    sam: z.string().describe('Serviceable addressable market, e.g. "$3B"'),
    som: z.string().describe('Serviceable obtainable market / realistic near-term target, e.g. "$400M"'),
    description: z.string(),
  }),
});

type SeedOpportunity = z.infer<typeof OpportunitySchema>;

// Fallback opportunities — used only if the live model call fails (no API key,
// rate limit, network error). Clearly marked `sourced: 'cached'` in the response
// so the UI never presents these as a fresh scan result.
const SEED_OPPORTUNITIES: SeedOpportunity[] = [
  {
    title: 'AI-Powered Compliance Automation for SMB Manufacturers',
    problem: 'Small manufacturers face an avalanche of shifting safety and environmental regulations but cannot afford legal or compliance teams. Manual tracking via spreadsheets leads to costly fines and operational shutdowns.',
    suggestedStartup: 'A SaaS platform that ingests regulatory PDFs and auto-generates factory-floor checklists with real-time update alerts.',
    evidence: ['OSHA rule changes up 42% in the last two years', 'SMB compliance software market growing at 18% CAGR', 'Job postings for compliance managers at small manufacturers doubled'],
    mvp: ['PDF-to-checklist converter', 'Mobile sign-off app for workers', 'Automated monthly compliance reports'],
    potentialCustomers: ['Small metal fabrication shops', 'Food packaging facilities', 'Local automotive parts manufacturers'],
    competitionLevel: 'Low',
    competitors: [{ name: 'SAP / Oracle ERP', description: 'Enterprise compliance modules', moat: 'Deep integration', weaknesses: ['Too expensive for SMBs', 'Requires months of setup'] }],
    metrics: { trendGrowth: 94, demandGrowth: 88, marketScore: 85, competitionScore: 12 },
    marketDetails: { tam: '$14B', sam: '$3.2B', som: '$450M', description: 'Global SMB compliance software market' },
  },
  {
    title: 'Precision Cooling Intelligence for AI Data Centers',
    problem: 'AI GPU clusters generate extreme heat that conventional room-level cooling wastes millions managing. Operators have no rack-level visibility into thermal stress until hardware fails.',
    suggestedStartup: 'Smart thermal management software pairing with existing sensors to predict hot spots and direct cooling at the rack level.',
    evidence: ['AI data center energy spending up 300% since 2022', 'Liquid cooling patent filings grew 180% in 18 months', 'Hyperscalers committed to efficiency targets with no tooling to measure them'],
    mvp: ['Sensor integration dashboard', 'Hot-spot prediction model', 'Energy savings report generator'],
    potentialCustomers: ['Mid-size colo providers', 'Enterprise private AI clusters', 'GPU cloud startups'],
    competitionLevel: 'Low',
    competitors: [{ name: 'Traditional DCIM vendors', description: 'Data center infrastructure management', moat: 'Installed base', weaknesses: ['No AI workload awareness', 'Requires expensive proprietary hardware'] }],
    metrics: { trendGrowth: 98, demandGrowth: 95, marketScore: 90, competitionScore: 18 },
    marketDetails: { tam: '$28B', sam: '$8B', som: '$900M', description: 'AI data center cooling and efficiency market' },
  },
  {
    title: 'Secure Cross-Border Shipment Data Vault',
    problem: 'New GDPR and data-localisation laws make sharing shipment data containing customer names legally risky, causing delays and rejected customs filings for freight companies.',
    suggestedStartup: 'A cryptographic data proxy that proves shipment legitimacy to customs authorities without exposing buyer or seller personal data.',
    evidence: ['EU enacted three new data-transit rules in 18 months', 'Customs rejection rates for data violations up 24%', 'Freight software vendors publicly struggling to comply'],
    mvp: ['Encrypted shipment ID service', 'Automated GDPR-compliant customs form generator', 'Carrier dashboard'],
    potentialCustomers: ['Global freight forwarders', 'International e-commerce brands', 'Customs brokers'],
    competitionLevel: 'Medium',
    competitors: [{ name: 'Flexport', description: 'Digital freight platform', moat: 'Massive user base', weaknesses: ['Wants access to all your data', 'Not designed for privacy-first flows'] }],
    metrics: { trendGrowth: 85, demandGrowth: 92, marketScore: 88, competitionScore: 25 },
    marketDetails: { tam: '$18B', sam: '$5B', som: '$650M', description: 'Supply chain visibility and compliance software' },
  },
  {
    title: 'Automated Passkey Migration for SMEs',
    problem: 'Mid-sized e-commerce sites are struggling with the transition from legacy passwords to passkeys due to the extreme complexity of integration, causing lost sales at checkout.',
    suggestedStartup: 'A drop-in passkey migration service for Shopify and WooCommerce merchants.',
    evidence: ['New security standards mandate stronger authentication', 'Passkey adoption is lagging in medium-sized businesses', 'High cart abandonment rates due to password resets'],
    mvp: ['Shopify app for 1-click passkey enablement', 'Fallback passwordless login', 'Migration analytics dashboard'],
    potentialCustomers: ['Medium Shopify merchants', 'DTC brands', 'WooCommerce agencies'],
    competitionLevel: 'Low',
    competitors: [{ name: 'Okta / Auth0', description: 'Enterprise IAM', moat: 'Ecosystem', weaknesses: ['Too complex and expensive for SMEs'] }],
    metrics: { trendGrowth: 95, demandGrowth: 85, marketScore: 90, competitionScore: 10 },
    marketDetails: { tam: '$8B', sam: '$3B', som: '$500M', description: 'Identity and access management for SMEs' },
  },
  {
    title: 'Rare Earth Supply Chain Monitor',
    problem: 'Manufacturers are blind to upstream disruptions in rare earth mineral supply chains, leading to unexpected production halts for electronics and EV components.',
    suggestedStartup: 'An AI tool that maps a company\'s bill of materials against real-time global mineral export and shipping data.',
    evidence: ['Geopolitical tensions restricting rare-earth exports', 'Increasing demand for EV batteries and magnets', 'Lack of transparency in tier-3+ suppliers'],
    mvp: ['BOM ingestion engine', 'Geopolitical news parser', 'Risk scoring dashboard'],
    potentialCustomers: ['Electronics manufacturers', 'Automotive companies', 'Defense contractors'],
    competitionLevel: 'Medium',
    competitors: [{ name: 'Resilinc', description: 'Supply chain mapping', moat: 'Established network', weaknesses: ['Relies on supplier surveys rather than raw macro signals'] }],
    metrics: { trendGrowth: 85, demandGrowth: 88, marketScore: 80, competitionScore: 18 },
    marketDetails: { tam: '$15B', sam: '$4B', som: '$600M', description: 'Supply chain risk management software' },
  },
  {
    title: 'Spatial Computing EU Compliance Toolkit',
    problem: 'Developers building AR/VR apps are struggling to navigate the EU\'s strict new regulations on biometric data collected by mixed-reality headsets.',
    suggestedStartup: 'An SDK that anonymizes spatial tracking data (eye, hand, room mesh) before it ever leaves the headset.',
    evidence: ['New EU AI Act rulings target spatial and biometric data', 'Increasing adoption of enterprise mixed reality', 'Lack of developer tooling for spatial privacy'],
    mvp: ['Unity / Unreal SDK plugin', 'Local data anonymization layer', 'Compliance reporting dashboard'],
    potentialCustomers: ['AR/VR app developers', 'Enterprise training companies', 'Industrial XR vendors'],
    competitionLevel: 'Low',
    competitors: [{ name: 'General privacy tools (OneTrust)', description: 'Web/app privacy management', moat: 'Brand awareness', weaknesses: ['No spatial data understanding or engine integration'] }],
    metrics: { trendGrowth: 90, demandGrowth: 85, marketScore: 92, competitionScore: 8 },
    marketDetails: { tam: '$4B', sam: '$1B', som: '$150M', description: 'Privacy software for spatial computing' },
  },
  {
    title: 'Future-Proof Security for Legacy Hospital Systems',
    problem: 'Hospitals run medical record and imaging systems that are decades old and cannot be easily upgraded to modern security standards, leaving patient data exposed to next-generation cyberattacks.',
    suggestedStartup: 'A drop-in network appliance that sits beside legacy hospital systems and encrypts every connection leaving the building, without touching the underlying software.',
    evidence: ['New healthcare data encryption standards were finalized this year', 'Job postings for healthcare security engineers are up sharply', 'Hospitals are being fined record amounts for patient data breaches'],
    mvp: ['Drop-in network appliance for legacy systems', 'Connection manager for old EHR software', 'Compliance audit log for regulators'],
    potentialCustomers: ['Regional hospital networks', 'Medical device manufacturers', 'Long-term care facilities'],
    competitionLevel: 'Low',
    competitors: [{ name: 'Cloud security platforms (AWS/Azure security)', description: 'Broad cloud-focused security tooling', moat: 'Massive platform reach', weaknesses: ['Cannot secure old on-premise systems physically inside the hospital'] }],
    metrics: { trendGrowth: 99, demandGrowth: 82, marketScore: 78, competitionScore: 8 },
    marketDetails: { tam: '$7.8B', sam: '$2.1B', som: '$300M', description: 'Cybersecurity modernization for healthcare' },
  },
  {
    title: 'Embedded Compliance for Vertical Fintech Apps',
    problem: 'Niche fintech startups building on banking-as-a-service platforms still have to manually stitch together KYC, AML, and state money-transmitter licensing, burning months of engineering time before they can launch.',
    suggestedStartup: 'A compliance-as-code layer that plugs into BaaS providers and auto-generates the KYC/AML workflows and licensing paperwork a vertical fintech needs.',
    evidence: ['State-level money transmitter rules are multiplying', 'Recent BaaS platform outages exposed gaps in who owns compliance', 'Fintech compliance job postings are up sharply'],
    mvp: ['KYC/AML workflow builder', 'State licensing tracker', 'Audit-ready compliance dashboard'],
    potentialCustomers: ['Vertical fintech startups', 'Embedded finance teams at non-finance companies', 'BaaS platform customers'],
    competitionLevel: 'Medium',
    competitors: [{ name: 'Alloy / Unit', description: 'Identity and banking infrastructure platforms', moat: 'Existing BaaS integrations', weaknesses: ['Compliance is a bolt-on feature, not the core product'] }],
    metrics: { trendGrowth: 88, demandGrowth: 86, marketScore: 84, competitionScore: 22 },
    marketDetails: { tam: '$9B', sam: '$2.5B', som: '$350M', description: 'Compliance infrastructure for embedded finance' },
  },
];

/** Ranks seeds by relevance to `topic` (word overlap against title/problem/description) and returns the top `count`, falling back to a shuffled sample when nothing matches or no topic was given. */
function pickSeeds(topic: string, count: number): SeedOpportunity[] {
  const clean = topic.trim().toLowerCase();
  if (clean) {
    const scored = SEED_OPPORTUNITIES.map((s) => {
      const haystack = `${s.title} ${s.problem} ${s.marketDetails.description}`.toLowerCase();
      const score = clean.split(/\s+/).filter((w) => w.length > 2 && haystack.includes(w)).length;
      return { s, score };
    });
    const relevant = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    if (relevant.length > 0) return relevant.slice(0, count).map((x) => x.s);
  }
  // No topic, or nothing matched it — a random distinct sample still beats one repeated idea.
  return [...SEED_OPPORTUNITIES].sort(() => Math.random() - 0.5).slice(0, count);
}

const SYSTEM_PROMPT = `You are an expert startup opportunity analyst working for Scout, a tool that helps entrepreneurs find real, underserved market gaps before they become obvious.

You will be given a topic (optional) and a list of real, current signals pulled live from Hacker News, arXiv, RemoteOK, SEC EDGAR Form D filings, USAspending.gov federal awards, and GitHub. Use these signals as grounding where they are genuinely relevant — cite the underlying trend they point to in your evidence — but do not force a connection that isn't real. It's fine to draw on your own broader knowledge of markets and technology too.

Identify ONE specific, high-value, underserved market gap. Be concrete: name the exact problem, the exact buyer, and why it is painful right now. Avoid generic, overused startup ideas.`;

// A single scan fires RESULT_COUNT of these calls in parallel (see POST below)
// rather than asking the model for an array of opportunities in one call —
// Gemini's structured-output engine rejects that shape with a 400 ("too many
// states for serving") once OpportunitySchema's own nested min/max arrays get
// wrapped in an outer array. N parallel single-object calls sidestep that
// entirely and reuse the exact schema shape that's known to validate cleanly.
// Each call gets a different "angle" nudge so the batch comes back varied
// instead of N near-duplicates of the same idea.
const ANGLE_HINTS = [
  'Focus on an enterprise or B2B buyer.',
  'Focus on a completely different customer segment — consumer, prosumer, or a niche SMB vertical.',
  'Focus on a regulatory, compliance, or legal-risk angle.',
  'Focus on an infrastructure, hardware, or operational-efficiency angle.',
  'Focus on a workflow or productivity angle for a specific job role.',
  'Focus on a data, security, or trust angle.',
];

async function generateOne(
  ai: GoogleGenAI,
  topic: string,
  signalsBlock: string,
  angleHint: string
): Promise<SeedOpportunity | null> {
  const userMessage = topic
    ? `Find a specific underserved startup opportunity in: ${topic}. It must genuinely fit that focus area — do not drift into unrelated markets. ${angleHint} Be concrete about the exact problem.${signalsBlock}`
    : `Find a specific underserved startup opportunity in any emerging technology or market. ${angleHint} Be creative and very specific.${signalsBlock}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        // Gemini's structured-output schema is a restricted subset of JSON
        // Schema, but it covers everything OpportunitySchema uses (object/
        // array/enum, min/max items, descriptions) — see the SDK's
        // GenerateContentConfig.responseJsonSchema docs for the exact list.
        responseJsonSchema: z.toJSONSchema(OpportunitySchema),
      },
    });

    if (response.promptFeedback?.blockReason) {
      throw new Error(`Model blocked the request: ${response.promptFeedback.blockReason}`);
    }
    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');

    const parsed = OpportunitySchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      throw new Error(`Model response did not match the expected schema: ${parsed.error.message}`);
    }
    return parsed.data;
  } catch (err) {
    console.error('[discover] One parallel generation failed (continuing with the rest):', err);
    return null;
  }
}

const STOPWORDS = new Set(['a', 'an', 'the', 'for', 'and', 'or', 'of', 'to', 'in', 'on', 'with', 'ai', 'startup']);

/** Significant words from a title+problem, for a crude but effective similarity check. */
function keywordSet(o: SeedOpportunity): Set<string> {
  return new Set(
    `${o.title} ${o.problem}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Parallel calls occasionally converge on the same underlying idea from
 * different angles (e.g. "EV Charging Cybersecurity" vs "EV Charging
 * Compliance Platform") — an exact-title check alone won't catch that.
 * Drops opportunities whose title+problem overlap heavily with one already
 * kept, keeping the first (highest-ranked) occurrence of each idea.
 */
function dedupeSimilar(opts: SeedOpportunity[], threshold = 0.35): SeedOpportunity[] {
  const kept: { opt: SeedOpportunity; words: Set<string> }[] = [];
  for (const opt of opts) {
    const words = keywordSet(opt);
    const isDuplicate = kept.some((k) => jaccardSimilarity(k.words, words) >= threshold);
    if (!isDuplicate) kept.push({ opt, words });
  }
  return kept.map((k) => k.opt);
}

function rankByScore(opts: SeedOpportunity[]): SeedOpportunity[] {
  return [...opts].sort((a, b) => calculateOpportunityScore(b.metrics) - calculateOpportunityScore(a.metrics));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const topic: string = (body?.topic ?? '').toString().slice(0, 200);

  // Best-effort grounding context — never let a signals outage block discovery.
  let liveSignals: Signal[] = [];
  try {
    const { signals } = await getLiveSignals({ perSourceLimit: 4 });
    liveSignals = signals;
  } catch (err) {
    console.error('[discover] Failed to fetch grounding signals (continuing without them):', err);
  }

  // Every parallel call gets its own shuffled slice of the live signals rather
  // than one shared sample — otherwise all N calls latch onto the same single
  // most-salient signal and the batch comes back as near-duplicates.
  function signalsBlockFor(): string {
    if (liveSignals.length === 0) return '';
    const sample = [...liveSignals].sort(() => Math.random() - 0.5).slice(0, 10);
    return `\n\nHere are real signals pulled live just now:\n${sample
      .map((s) => `- [${s.source} via ${s.origin ?? 'unknown'}] ${s.content}`)
      .join('\n')}`;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const ai = new GoogleGenAI({ apiKey });
    // One extra call beyond RESULT_COUNT — parallel generations sometimes
    // converge on the same idea from different angles, so this gives
    // dedupeSimilar() a little room to filter that out and still land near
    // RESULT_COUNT, without spending more of the 20/day quota than needed.
    const callCount = Math.min(RESULT_COUNT + 1, ANGLE_HINTS.length);
    const shuffledHints = [...ANGLE_HINTS].sort(() => Math.random() - 0.5);
    const results = await Promise.all(
      Array.from({ length: callCount }, (_, i) => generateOne(ai, topic, signalsBlockFor(), shuffledHints[i]))
    );

    const opportunities = dedupeSimilar(results.filter((o): o is SeedOpportunity => o !== null));
    if (opportunities.length === 0) {
      throw new Error('Every live generation failed or was filtered out as a duplicate');
    }

    const ranked = rankByScore(opportunities).slice(0, RESULT_COUNT);
    return NextResponse.json({ opportunities: ranked.map((o) => ({ ...o, sourced: 'live' as const })) });
  } catch (err) {
    console.error('[discover] Live generation failed, falling back to cached examples:', err);
    const seeds = pickSeeds(topic, RESULT_COUNT);
    return NextResponse.json({ opportunities: rankByScore(seeds).map((s) => ({ ...s, sourced: 'cached' as const })) });
  }
}
