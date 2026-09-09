import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getLiveSignals } from '@/lib/signals';

export const maxDuration = 60;

// Flash is fast and sits comfortably in the free tier's rate limits — this
// route has no paid API key behind it, so avoid pro/preview models here.
const MODEL = 'gemini-2.5-flash';

// ── Structured output schema — Claude's response is validated against this ──
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
];

function pickSeed(topic: string): SeedOpportunity {
  const clean = topic.trim().toLowerCase();
  if (clean) {
    const scored = SEED_OPPORTUNITIES.map((s) => {
      const haystack = `${s.title} ${s.problem} ${s.marketDetails.description}`.toLowerCase();
      const score = clean.split(/\s+/).filter((w) => w.length > 2 && haystack.includes(w)).length;
      return { s, score };
    });
    scored.sort((a, b) => b.score - a.score);
    if (scored[0].score > 0) return scored[0].s;
  }
  return SEED_OPPORTUNITIES[Math.floor(Math.random() * SEED_OPPORTUNITIES.length)];
}

const SYSTEM_PROMPT = `You are an expert startup opportunity analyst working for Scout, a tool that helps entrepreneurs find real, underserved market gaps before they become obvious.

You will be given a topic (optional) and a list of real, current signals pulled live from Hacker News, arXiv, RemoteOK, SEC EDGAR Form D filings, USAspending.gov federal awards, and GitHub. Use these signals as grounding where they are genuinely relevant — cite the underlying trend they point to in your evidence — but do not force a connection that isn't real. It's fine to draw on your own broader knowledge of markets and technology too.

Identify ONE specific, high-value, underserved market gap. Be concrete: name the exact problem, the exact buyer, and why it is painful right now. Avoid generic, overused startup ideas.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const topic: string = (body?.topic ?? '').toString().slice(0, 200);

  // Best-effort grounding context — never let a signals outage block discovery.
  let signalsBlock = '';
  try {
    const { signals } = await getLiveSignals({ perSourceLimit: 4 });
    if (signals.length > 0) {
      const sample = signals.slice(0, 10);
      signalsBlock = `\n\nHere are real signals pulled live just now:\n${sample
        .map((s) => `- [${s.source} via ${s.origin ?? 'unknown'}] ${s.content}`)
        .join('\n')}`;
    }
  } catch (err) {
    console.error('[discover] Failed to fetch grounding signals (continuing without them):', err);
  }

  const userMessage = topic
    ? `Find a specific underserved startup opportunity in: ${topic}. Be concrete about the exact problem.${signalsBlock}`
    : `Find a specific underserved startup opportunity in any emerging technology or market. Be creative and very specific.${signalsBlock}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const ai = new GoogleGenAI({ apiKey });
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
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = OpportunitySchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      throw new Error(`Model response did not match the expected schema: ${parsed.error.message}`);
    }

    return NextResponse.json({ opportunity: { ...parsed.data, sourced: 'live' } });
  } catch (err) {
    console.error('[discover] Live generation failed, falling back to a cached example:', err);
    const seed = pickSeed(topic);
    return NextResponse.json({ opportunity: { ...seed, sourced: 'cached' } });
  }
}
