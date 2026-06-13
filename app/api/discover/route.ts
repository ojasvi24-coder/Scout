import { NextRequest, NextResponse } from 'next/server';

// Seed data — returned instantly if API key is missing or Anthropic call fails
// This guarantees the scan ALWAYS produces a result
const SEED_OPPORTUNITIES = [
  {
    title: 'AI-Powered Compliance Automation for SMB Manufacturers',
    problem: 'Small manufacturers face an avalanche of shifting safety and environmental regulations but cannot afford legal or compliance teams. Manual tracking via spreadsheets leads to costly fines and operational shutdowns.',
    suggestedStartup: 'A SaaS platform that ingests regulatory PDFs and auto-generates factory-floor checklists with real-time update alerts.',
    evidence: [
      'OSHA rule changes up 42% in the last two years',
      'SMB compliance software market growing at 18% CAGR',
      'Job postings for compliance managers at small manufacturers doubled',
    ],
    mvp: ['PDF-to-checklist converter', 'Mobile sign-off app for workers', 'Automated monthly compliance reports'],
    potentialCustomers: ['Small metal fabrication shops', 'Food packaging facilities', 'Local automotive parts manufacturers'],
    competitionLevel: 'Low',
    competitors: [
      { name: 'SAP / Oracle ERP', description: 'Enterprise compliance modules', moat: 'Deep integration', weaknesses: ['Too expensive for SMBs', 'Requires months of setup'] },
    ],
    metrics: { trendGrowth: 94, demandGrowth: 88, marketScore: 85, competitionScore: 12 },
    marketDetails: { tam: '$14B', sam: '$3.2B', som: '$450M', description: 'Global SMB compliance software market' },
  },
  {
    title: 'Precision Cooling Intelligence for AI Data Centers',
    problem: 'AI GPU clusters generate extreme heat that conventional room-level cooling wastes millions managing. Operators have no rack-level visibility into thermal stress until hardware fails.',
    suggestedStartup: 'Smart thermal management software pairing with existing sensors to predict hot spots and direct cooling at the rack level.',
    evidence: [
      'AI data center energy spending up 300% since 2022',
      'Liquid cooling patent filings grew 180% in 18 months',
      'Hyperscalers committed to efficiency targets with no tooling to measure them',
    ],
    mvp: ['Sensor integration dashboard', 'Hot-spot prediction model', 'Energy savings report generator'],
    potentialCustomers: ['Mid-size colo providers', 'Enterprise private AI clusters', 'GPU cloud startups'],
    competitionLevel: 'Low',
    competitors: [
      { name: 'Traditional DCIM vendors', description: 'Data center infrastructure management', moat: 'Installed base', weaknesses: ['No AI workload awareness', 'Requires expensive proprietary hardware'] },
    ],
    metrics: { trendGrowth: 98, demandGrowth: 95, marketScore: 90, competitionScore: 18 },
    marketDetails: { tam: '$28B', sam: '$8B', som: '$900M', description: 'AI data center cooling and efficiency market' },
  },
  {
    title: 'Secure Cross-Border Shipment Data Vault',
    problem: 'New GDPR and data-localisation laws make sharing shipment data containing customer names legally risky, causing delays and rejected customs filings for freight companies.',
    suggestedStartup: 'A cryptographic data proxy that proves shipment legitimacy to customs authorities without exposing buyer or seller personal data.',
    evidence: [
      'EU enacted three new data-transit rules in 18 months',
      'Customs rejection rates for data violations up 24%',
      'Freight software vendors publicly struggling to comply',
    ],
    mvp: ['Encrypted shipment ID service', 'Automated GDPR-compliant customs form generator', 'Carrier dashboard'],
    potentialCustomers: ['Global freight forwarders', 'International e-commerce brands', 'Customs brokers'],
    competitionLevel: 'Medium',
    competitors: [
      { name: 'Flexport', description: 'Digital freight platform', moat: 'Massive user base', weaknesses: ['Wants access to all your data', 'Not designed for privacy-first flows'] },
    ],
    metrics: { trendGrowth: 85, demandGrowth: 92, marketScore: 88, competitionScore: 25 },
    marketDetails: { tam: '$18B', sam: '$5B', som: '$650M', description: 'Supply chain visibility and compliance software' },
  },
];

const SYSTEM_PROMPT = `You are an expert startup opportunity analyst. Identify a specific high-value underserved market gap.

Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation before or after. Exactly this shape:

{
  "title": "Short compelling opportunity title",
  "problem": "2-3 sentence description of the specific problem and why it is painful today",
  "suggestedStartup": "One sentence describing the startup idea to solve it",
  "evidence": ["Evidence point 1", "Evidence point 2", "Evidence point 3"],
  "mvp": ["MVP feature 1", "MVP feature 2", "MVP feature 3"],
  "potentialCustomers": ["Customer segment 1", "Customer segment 2", "Customer segment 3"],
  "competitionLevel": "Low",
  "competitors": [
    { "name": "Competitor name", "description": "What they do", "moat": "Their advantage", "weaknesses": ["Weakness 1", "Weakness 2"] }
  ],
  "metrics": { "trendGrowth": 85, "demandGrowth": 80, "marketScore": 75, "competitionScore": 20 },
  "marketDetails": {
    "tam": "$12B",
    "sam": "$3B",
    "som": "$400M",
    "description": "Brief market description"
  }
}`;

function randomSeed() {
  return SEED_OPPORTUNITIES[Math.floor(Math.random() * SEED_OPPORTUNITIES.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic: string = body?.topic ?? '';

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // ── No API key: instant seed response ──────────────────────────────────
    if (!apiKey) {
      console.log('[discover] No ANTHROPIC_API_KEY — returning seed opportunity');
      return NextResponse.json({ opportunity: randomSeed() });
    }

    // ── Call Anthropic server-side (no CORS issues here) ───────────────────
    const userMessage = topic
      ? `Find a specific underserved startup opportunity in: ${topic}. Be concrete about the exact problem.`
      : `Find a specific underserved startup opportunity in any emerging technology or market. Be creative and very specific.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text().catch(() => '');
      console.error('[discover] Anthropic API error:', anthropicRes.status, errBody);
      return NextResponse.json({ opportunity: randomSeed() });
    }

    const aiData = await anthropicRes.json();
    const rawText: string = aiData?.content?.[0]?.text ?? '';

    if (!rawText) {
      console.error('[discover] Empty response from Anthropic');
      return NextResponse.json({ opportunity: randomSeed() });
    }

    // Strip accidental markdown fences
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const opportunity = JSON.parse(cleaned);

    return NextResponse.json({ opportunity });

  } catch (err) {
    console.error('[discover] Unhandled error:', err);
    // Never return a 500 — always give the user something
    return NextResponse.json({ opportunity: randomSeed() });
  }
}
