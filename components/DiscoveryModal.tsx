import { useState, useEffect } from 'react';
import { Opportunity } from '@/lib/data';
import { X, Search, Terminal, Cpu, Network, Database, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SCAN_STEPS = [
  { id: 'arxiv', icon: Network, label: 'Scanning arXiv preprint patterns...', duration: 800 },
  { id: 'patents', icon: Database, label: 'Cross-referencing USPTO filings...', duration: 900 },
  { id: 'jobs', icon: Search, label: 'Analyzing Greenhouse & Lever tech roles...', duration: 700 },
  { id: 'funding', icon: Cpu, label: 'Triangulating recent Series Seed anomalies...', duration: 800 },
  { id: 'synth', icon: Terminal, label: 'Synthesizing novel startup opportunity...', duration: 1200 },
];

const SYSTEM_PROMPT = `You are an expert startup opportunity analyst. Given a focus area (or no area for a random discovery), identify a specific high-value underserved market gap.

Respond ONLY with a valid JSON object — no markdown, no backticks, no explanation. The JSON must match this exact shape:

{
  "title": "Short compelling opportunity title",
  "problem": "2-3 sentence description of the specific problem and why it's painful",
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

export function DiscoveryModal({
  isOpen,
  onClose,
  onComplete
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (opt: Opportunity) => void;
}) {
  const [topic, setTopic] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTopic('');
      setIsScanning(false);
      setCurrentStepIndex(0);
      setLogs([]);
      setError('');
    }
  }, [isOpen]);

  // Animate scan steps independently of the API call
  useEffect(() => {
    if (!isScanning) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const step = SCAN_STEPS[currentStepIndex];
    if (step) {
      setLogs(prev => [...prev, `> [SYS] ${step.label}`]);
      timeoutId = setTimeout(() => {
        setLogs(prev => [...prev, `  |_ OK. Acquired signals.`]);
        setCurrentStepIndex(prev => prev + 1);
      }, step.duration);
    }
    return () => clearTimeout(timeoutId);
  }, [isScanning, currentStepIndex]);

  const handleStartScan = async () => {
    setIsScanning(true);
    setCurrentStepIndex(0);
    setLogs(['> [SYS] Initializing Discovery Agent...']);
    setError('');

    try {
      const userMessage = topic.trim()
        ? `Find a specific underserved startup opportunity in the area of: ${topic}`
        : `Find a specific underserved startup opportunity in any emerging technology or market area. Be creative and specific.`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const rawText = data.content?.[0]?.text ?? '';

      // Strip any accidental markdown fences
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // Wait for animation to finish (at least 4 steps worth)
      await new Promise(r => setTimeout(r, 500));

      setIsScanning(false);
      const newOpt: Opportunity = {
        ...parsed,
        id: `opt-auto-${Date.now()}`,
        opportunityScore: Math.floor(Math.random() * 15) + 85,
      };
      onComplete(newOpt);

    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'An error occurred during discovery.';
      setError(msg);
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="text-indigo-600 w-5 h-5" />
              Autonomous Discovery Agent
            </h3>
            <p className="text-sm text-slate-500 font-medium">Command the AI to scan global signals</p>
          </div>
          <button
            onClick={onClose}
            disabled={isScanning}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {!isScanning ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Focus Area (Optional)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleStartScan()}
                  placeholder="e.g., Space tech, Elderly care, Logistics, Cybersecurity..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-lg placeholder:text-slate-400"
                />
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex gap-4">
                <div className="bg-indigo-100 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 mb-1">Deep Scan Protocol</h4>
                  <p className="text-sm text-indigo-700/80 leading-relaxed">
                    The agent will use AI to triangulate novel market gaps from signals across research, patents, jobs, and funding trends.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                onClick={handleStartScan}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <Search className="w-5 h-5" /> Execute Autonomous Scan
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-1/3 border-r border-slate-100 pr-4 space-y-4">
                  {SCAN_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = currentStepIndex === idx;
                    const isPast = currentStepIndex > idx;
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : isPast ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                          {isPast ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs font-bold ${isActive ? 'text-indigo-700' : isPast ? 'text-slate-500' : 'text-slate-300'}`}>
                          {step.id.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="w-2/3 bg-slate-900 rounded-2xl p-4 font-mono text-xs overflow-hidden h-64 flex flex-col justify-end relative shadow-inner">
                  <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-slate-900 to-transparent z-10" />
                  <div className="flex flex-col gap-1.5 text-emerald-400">
                    <AnimatePresence>
                      {logs.map((log, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                          key={i} className={`${log.includes('_ OK') ? 'text-slate-400 pl-4' : 'text-emerald-400'}`}
                        >
                          {log}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-3 bg-emerald-400 mt-1" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
