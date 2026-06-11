export interface Signal {
  id: string;
  source: 'News' | 'Tech' | 'Jobs' | 'Funding' | 'Grants' | 'Social' | 'Community';
  content: string;
  timestamp: string;
}

export interface Opportunity {
  id: string;
  title: string;
  problem: string;
  opportunityScore: number;
  metrics: {
    trendGrowth: number;
    demandGrowth: number;
    marketScore: number;
    competitionScore: number;
  };
  marketDetails: {
    tam: string;
    sam: string;
    som: string;
    description: string;
  };
  evidence: string[];
  suggestedStartup: string;
  mvp: string[];
  potentialCustomers: string[];
  competitionLevel: 'Low' | 'Medium' | 'High';
  competitors: Array<{ name: string; description: string; moat: string; weaknesses: string[] }>;
}

export function calculateOpportunityScore(metrics: { trendGrowth: number; demandGrowth: number; marketScore: number; competitionScore: number; }) {
  const raw = (metrics.trendGrowth * metrics.demandGrowth * metrics.marketScore) / Math.max(metrics.competitionScore, 1);
  return Math.min(Math.round((raw / 100000) * 100), 100);
}

export const RECENT_SIGNALS: Signal[] = [
  { id: '1', source: 'News', content: 'Local news reports indicate that large internet companies are struggling to keep their computers cool in unexpected heatwaves.', timestamp: '2 days ago' },
  { id: '2', source: 'Tech', content: 'New laws in Europe are making it hard for shipping companies to track packages without breaking strict privacy rules.', timestamp: '5 days ago' },
  { id: '3', source: 'Jobs', content: 'Mayo Clinic is hiring engineers to help update old hospital systems to prevent future post-quantum hacking capabilities.', timestamp: '1 week ago' },
  { id: '4', source: 'Funding', content: 'Investors are putting millions into companies that can precisely track if local farms have enough water reserves.', timestamp: '2 weeks ago' },
  { id: '5', source: 'Grants', content: 'Millions in government grants are now available for anyone building software to help small factories file safety paperwork easily.', timestamp: '3 weeks ago' },
];

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opt-1',
    title: 'Easy Safety Compliance for Small Factories',
    problem: 'Small factories are getting crushed by new safety rules. They don\'t have money for big legal teams, and trying to track shifting environmental rules with paper and spreadsheets is a nightmare.',
    opportunityScore: 0,
    metrics: {
      trendGrowth: 94,
      demandGrowth: 88,
      marketScore: 85,
      competitionScore: 12,
    },
    marketDetails: {
      tam: '$14.2B',
      sam: '$3.2B',
      som: '$450M',
      description: 'The massive global market for factory safety and compliance.',
    },
    evidence: [
      'Government safety rule changes are up 42% this year.',
      'Small factories have doubled their hiring for safety managers.',
      'We noticed very few startups focusing on these smaller, older factories.'
    ],
    suggestedStartup: 'An AI helper that reads old safety PDFs and automatically builds a checklist for the factory floor.',
    mvp: [
      'File upload that turns messy PDFs into simple to-do lists.',
      'A mobile app so workers can check off safety steps.',
      'Automatic monthly safety reports.'
    ],
    potentialCustomers: [
      'Small manufacturing shops',
      'Local delivery and warehouse owners',
      'Food packaging centers'
    ],
    competitionLevel: 'Low',
    competitors: [
      { name: 'Huge Corporate Software (SAP, Oracle)', description: 'Massive systems for global companies.', moat: 'Deep lock-in', weaknesses: ['Way too expensive', 'Too hard to set up'] },
      { name: 'Local Consultants', description: 'People you hire to do checklists manually.', moat: 'Local trust', weaknesses: [ 'Very expensive', 'Slow to react to new rules'] }
    ]
  },
  {
    id: 'opt-2',
    title: 'Smart Cooling for Energy-Hungry AI Servers',
    problem: 'Computer centers are getting incredibly hot as AI grows. Current air conditioning cools the whole room, which wastes millions of dollars instead of just cooling the hot computers.',
    opportunityScore: 0,
    metrics: {
      trendGrowth: 98,
      demandGrowth: 95,
      marketScore: 90,
      competitionScore: 18,
    },
    marketDetails: {
      tam: '$28.5B',
      sam: '$8.4B',
      som: '$900M',
      description: 'Cooling infrastructure for the booming AI data center industry.',
    },
    evidence: [
      'New AI chips require twice as much electricity and cooling as before.',
      'Government grants for energy-efficient computing are up 300%.',
      'A massive surge in tech discussions about targeted cooling.'
    ],
    suggestedStartup: 'Smart robotic fans that automatically direct cold air exactly where it is needed instead of chilling the whole room.',
    mvp: [
      'Thermal cameras that detect hot spots in the computer room.',
      'Software that predicts which servers will get hot before they do.',
      'A simple dashboard showing missed energy savings.'
    ],
    potentialCustomers: [
      'Medium-sized local data centers',
      'Companies running their own AI servers',
      'Crypto mining operations'
    ],
    competitionLevel: 'Low',
    competitors: [
      { name: 'Traditional A/C companies', description: 'Large scale building cooling vendors.', moat: 'Hardware presence', weaknesses: ['No smart software', 'Waste massive amounts of energy'] }
    ]
  },
  {
    id: 'opt-3',
    title: 'Secure Cross-Border Shipping Data Locker',
    problem: 'New privacy laws make tracking international shipments legally risky. Companies are scared to share shipping data if it contains customer info, causing massive delays at customs.',
    opportunityScore: 0,
    metrics: {
      trendGrowth: 85,
      demandGrowth: 92,
      marketScore: 88,
      competitionScore: 25,
    },
    marketDetails: {
      tam: '$18.7B',
      sam: '$5.1B',
      som: '$650M',
      description: 'Supply chain visibility and tracking software.',
    },
    evidence: [
      'Europe has passed aggressive new laws about data transit.',
      'Shipping software speeds have dropped 24% because they have to manually route around privacy rules.',
      'Customs forms are increasingly getting rejected for data violations.'
    ],
    suggestedStartup: 'A "black box" data service that proves a shipment is safe without revealing the buyer or seller\'s private data.',
    mvp: [
      'A secure data locker for warehouse scanners.',
      'An automated customs form generator that hides private names.',
      'A simple dashboard for the shipping company.'
    ],
    potentialCustomers: [
      'Global freight companies',
      'International manufacturers',
      'Customs agents'
    ],
    competitionLevel: 'Medium',
    competitors: [
      { name: 'Big Shipping Platforms (Flexport)', description: 'Digital freight forwarding platform.', moat: 'Massive user base', weaknesses: ['They want all your data', 'Hard to trust with competitor info'] }
    ]
  },
  {
    id: 'opt-4',
    title: 'Future-Proof Security for Old Hospitals',
    problem: 'Hospitals use medical record systems that are decades old. These systems can\'t be easily updated to modern security standards, leaving patient data vulnerable to next-generation hackers.',
    opportunityScore: 0,
    metrics: {
      trendGrowth: 99,
      demandGrowth: 82,
      marketScore: 78,
      competitionScore: 8,
    },
    marketDetails: {
      tam: '$7.8B',
      sam: '$2.1B',
      som: '$300M',
      description: 'Cybersecurity modernizations for healthcare.',
    },
    evidence: [
      'New encryption standards were finalized just last month by the government.',
      'Job postings for advanced security engineers in healthcare are up 412%.',
      'Hospitals are being fined record amounts for data breaches.'
    ],
    suggestedStartup: 'A simple "guard dog" server that sits next to the old hospital system and encrypts all communications leaving the building.',
    mvp: [
      'A simple installable software block.',
      'A connection manager for old systems.',
      'A compliance log that proves to the government the data is safe.'
    ],
    potentialCustomers: [
      'Regional hospital networks',
      'Medical device builders',
      'Long-term nursing facilities'
    ],
    competitionLevel: 'Low',
    competitors: [
      { name: 'Amazon / Microsoft Cloud', description: 'Massive cloud security.', moat: 'They own the internet', weaknesses: ['Cannot secure old local computers physically inside the hospital'] }
    ]
  },
  {
    id: 'opt-5',
    title: 'Local Farm Water Scarcity Tracker for Brands',
    problem: 'Huge food brands like Coca-Cola or Nestle have no idea if the specific farms they buy ingredients from are running out of water, leading to sudden shortages and factory shutdowns.',
    opportunityScore: 0,
    metrics: {
      trendGrowth: 88,
      demandGrowth: 90,
      marketScore: 92,
      competitionScore: 15,
    },
    marketDetails: {
      tam: '$12.4B',
      sam: '$4.2B',
      som: '$850M',
      description: 'Climate risk tracking for large food companies.',
    },
    evidence: [
      'Water scarcity is now a top 3 risk metric for global investors.',
      'Dozens of new satellites just launched that can measure soil moisture from space.',
      'Major brands have pledged to be "Water Positive" but have no tools to measure it.'
    ],
    suggestedStartup: 'A dashboard that automatically pairs a brand\'s supplier invoices with satellite images to predict water shortages months in advance.',
    mvp: [
      'An importer for supplier farm addresses.',
      'Automatic satellite data pairing to those exact addresses.',
      'An alert system predicting dry spells 3 months out.'
    ],
    potentialCustomers: [
      'Large food conglomerate brands',
      'Clothing and cotton manufacturers',
      'Agricultural chemical companies'
    ],
    competitionLevel: 'Low',
    competitors: [
      { name: 'Big Audit Firms (PwC, EY)', description: 'Provide massive custom PDF reports.', moat: 'Brand trust', weaknesses: ['Slow and static', 'Data is outdated immediately'] },
      { name: 'General Climate Software', description: 'Carbon-focused platforms.', moat: 'Broad features', weaknesses: ['Water tracking is completely manual and hard to use'] }
    ]
  }
];

// Initialize scores
INITIAL_OPPORTUNITIES.forEach(opt => {
  opt.opportunityScore = calculateOpportunityScore(opt.metrics);
});
