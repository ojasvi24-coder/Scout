import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are an expert startup opportunity analyst. Identify a specific high-value underserved market gap.

Respond ONLY with a valid JSON object — no markdown, no backticks, no preamble. Exact shape required:

{
  "title": "Short compelling opportunity title",
  "problem": "2-3 sentence description of the specific problem and why it is painful today",
  "suggestedStartup": "One sentence describing the startup idea",
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

// Seed opportunities returned if the Anthropic API key is missing or the call fails
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
    competitionLevel: 'Low' as const,
    competitors: [
      { name: 'SAP / Oracle ERP', description: 'Enterprise compliance modules', moat: 'Deep integration', weaknesses: ['Too expensive for SMBs', 'Requires months of implementation'] },
    ],
    metrics: { trendGrowth: 94, demandGrowth: 88, marketScore: 85, competitionScore: 12 },
    marketDetails: { tam: '$14B', sam: '$3.2B', som: '$450M', description: 'Global SMB compliance software market' },
  },
  {
    title: 'Precision Cooling Intelligence for AI Data Centers',
    problem: 'AI GPU clusters generate heat that conventional room-level cooling wastes millions of dollars managing. Operators have no granular visibility into which racks are thermally stressed until hardware fails.',
    suggestedStartup: 'Smart thermal management software that pairs with existing sensors to predict hot spots and direct cooling resources at the rack level.',
    evidence: [
      'AI data center energy spending up 300% since 2022',
      'Liquid cooling patent filings grew 180% in 18 months',
      'Hyperscalers publicly committed to energy-efficiency targets with no tooling to measure them',
    ],
    mvp: ['Sensor integration dashboard', 'Hot-spot prediction model', 'Energy savings report generator'],
    potentialCustomers: ['Mid-size colo providers', 'Enterprise private AI clusters', 'GPU cloud startups'],
    competitionLevel: 'Low' as const,
    competitors: [
      { name: 'Traditional DCIM vendors', description: 'Data center infrastructure management', moat: 'Installed base', weaknesses: ['No AI workload awareness', 'Expensive proprietary hardware required'] },
    ],
    metrics: { trendGrowth: 98, demandGrowth: 95, marketScore: 90, competitionScore: 18 },
    marketDetails: { tam: '$28B', sam: '$8B', som: '$900M', description: 'AI data center cooling and efficiency market' },
  },
];

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // No API key — return a seed opportunity immediately so the scan always works
    if (!apiKey) {
      const seed = SEED_OPPORTUNITIES[Math.floor(Math.random() * SEED_OPPORTUNITIES.length)];
      return NextResponse.json({ opportunity: seed });
    }

    const userMessage = topic?.trim()
      ? `Find a specific underserved startup opportunity in: ${topic}. Be concrete and specific about the exact problem.`
      : `Find a specific underserved startup opportunity in any emerging technology or market. Be creative and very specific — avoid generic ideas.`;

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
      // API error — fall back to seed data so the user always gets a result
      console.error('Anthropic API error:', anthropicRes.status, await anthropicRes.text());
      const seed = SEED_OPPORTUNITIES[Math.floor(Math.random() * SEED_OPPORTUNITIES.length)];
      return NextResponse.json({ opportunity: seed });
    }

    const data = await anthropicRes.json();
    const rawText: string = data.content?.[0]?.text ?? '';

    // Strip accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const opportunity = JSON.parse(cleaned);

    return NextResponse.json({ opportunity });

  } catch (err) {
    console.error('Discovery route error:', err);
    // Any parse/network failure — return seed data, never a 500
    const seed = SEED_OPPORTUNITIES[Math.floor(Math.random() * SEED_OPPORTUNITIES.length)];
    return NextResponse.json({ opportunity: seed });
  }
}
