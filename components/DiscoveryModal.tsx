/* eslint-disable */
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

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTopic('');
      setIsScanning(false);
      setCurrentStepIndex(0);
      setLogs([]);
      setError('');
    }
  }, [isOpen]);

  // Handle the fake scanning log progression
  useEffect(() => {
    if (!isScanning) return;

    let timeoutId: NodeJS.Timeout;

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
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        throw new Error('Discovery engine failed to respond.');
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setTimeout(() => {
        setIsScanning(false);
        const newOpt: Opportunity = {
          ...data.opportunity,
          id: `opt-auto-${Date.now()}`,
          opportunityScore: Math.floor(Math.random() * 15) + 85,
        };
        onComplete(newOpt);
      }, 500); 

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during discovery.');
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
                    The agent will scan thousands of data points across arXiv, latest YC batches, NSF grant issuances, and tech job boards to triangulate a novel market gap.
                  </p>
                </div>
              </div>

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
                 {/* Visual Progress Steps */}
                 <div className="w-1/3 border-r border-slate-100 pr-4 space-y-4">
                    {SCAN_STEPS.map((step, idx) => {
                       const Icon = step.icon;
                       const isActive = currentStepIndex === idx;
                       const isPast = currentStepIndex > idx;
                       const isFuture = currentStepIndex < idx;
                       
                       return (
                         <div key={step.id} className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : isPast ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                              {isPast ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                           </div>
                           <span className={`text-xs font-bold ${isActive ? 'text-indigo-700' : isPast ? 'text-slate-500' : 'text-slate-300'}`}>
                             {step.id.toUpperCase()}
                           </span>
                         </div>
                       )
                    })}
                 </div>

                 {/* Console Output */}
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

               {error && (
                 <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                   {error}
                 </div>
               )}

            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
