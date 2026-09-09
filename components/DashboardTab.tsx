import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Opportunity, Signal, SignalSource } from '@/lib/data';

import { Sparkles, TrendingUp, Star, ChevronRight, Zap } from 'lucide-react';

const SOURCE_COLORS: Record<SignalSource, string> = {
  Tech: '#3b82f6',
  Research: '#a855f7',
  Jobs: '#10b981',
  Funding: '#f59e0b',
  Grants: '#f43f5e',
  Community: '#64748b',
};

export function DashboardTab({ opportunities, signals, onSelectOpportunity }: { opportunities: Opportunity[], signals: Signal[], onSelectOpportunity: (opt: Opportunity) => void }) {
  const [tickerIndex, setTickerIndex] = useState(0);

  const tickerMessages = useMemo(() => {
    if (signals.length === 0) {
      return ['Pulling live signals from Hacker News, arXiv, and federal filings...'];
    }
    return signals.slice(0, 6).map(s => `[${s.source}${s.origin ? ` · ${s.origin}` : ''}] ${s.content}`);
  }, [signals]);

  useEffect(() => {
    setTickerIndex(0);
  }, [signals]);

  useEffect(() => {
    if (tickerMessages.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [tickerMessages.length]);

  const signalMix = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of signals) counts[s.source] = (counts[s.source] ?? 0) + 1;
    return (Object.keys(SOURCE_COLORS) as SignalSource[])
      .map(source => ({ source, count: counts[source] ?? 0 }))
      .filter(d => d.count > 0);
  }, [signals]);

  // The highest-scored idea, not just the first one added — "Highest Conviction"
  // should reflect actual rank, independent of scan/insertion order.
  const topOpportunity = useMemo(
    () => opportunities.reduce<Opportunity | null>(
      (best, o) => (!best || (o.opportunityScore ?? 0) > (best.opportunityScore ?? 0)) ? o : best,
      null
    ),
    [opportunities]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="mb-4">
        <h2 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight flex items-center gap-3">
          <Zap className="w-8 h-8 text-indigo-500 fill-indigo-500" />
          Autonomous Discovery Dashboard
        </h2>
        <p className="text-lg text-slate-500 font-medium">Monitoring live data streams to isolate high-value market voids.</p>
      </header>

      {/* Ticker */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <Sparkles className="w-6 h-6 text-indigo-500 shrink-0" />
        <div className="relative h-6 w-full overflow-hidden text-base font-medium text-indigo-900">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={tickerIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center truncate pr-4"
            >
              {tickerMessages[tickerIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm col-span-2">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-500 w-6 h-6" /> Live Signal Mix
          </h3>
          <div className="h-64 w-full min-h-[256px]">
            {signalMix.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium">
                Waiting for live signals...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={0}>
                <BarChart data={signalMix}>
                  <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} signals`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {signalMix.map((entry) => (
                      <Cell key={entry.source} fill={SOURCE_COLORS[entry.source]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-md flex flex-col justify-between text-white relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay group-hover:opacity-20 transition-opacity" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-indigo-100 mb-2">Active Markers</h3>
            <p className="text-6xl font-bold mb-4">{opportunities.length}<span className="text-2xl text-indigo-200 ml-2">total</span></p>
            <p className="text-indigo-100 font-medium">Active markers extracted from {signals.length} live signals.</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 mt-6 backdrop-blur-sm relative z-10">
             <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                <div>
                   <p className="text-sm font-bold">Highest Conviction</p>
                   <p className="text-xs text-indigo-100 truncate w-40">{topOpportunity?.title || "Loading..."}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mb-8 pt-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Most Recent Detections
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.slice(0, 3).map((opt) => (
            <div
              key={opt.id}
              onClick={() => onSelectOpportunity(opt)}
              className="bg-white border border-slate-100 cursor-pointer rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-full text-sm">
                  Confidence Score: {opt.opportunityScore || 90}
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
              <h4 className="font-bold text-xl text-slate-800 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">{opt.title}</h4>
              <p className="text-slate-500 line-clamp-3 mt-auto text-sm leading-relaxed">{opt.problem}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
