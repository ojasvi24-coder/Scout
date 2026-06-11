import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Opportunity, Signal } from '@/lib/data';
import { Sparkles, TrendingUp, Users, Heart, Star, ChevronRight, Zap } from 'lucide-react';

const TICKER_MESSAGES = [
  "New trend spotted: Sovereign supply chain encryption is breaking out. 🚀",
  "Anomaly detected: 412% surge in post-quantum cryptography jobs. 📊",
  "AI data center cooling energy caps are creating immediate startup voids. 📉",
  "We found a new unserved market in local logistics. 🚚",
];

const MACRO_TRENDS = [
  { month: 'Jan', ai: 400, health: 240, environment: 200 },
  { month: 'Feb', ai: 450, health: 250, environment: 280 },
  { month: 'Mar', ai: 500, health: 290, environment: 350 },
  { month: 'Apr', ai: 620, health: 310, environment: 400 },
  { month: 'May', ai: 800, health: 350, environment: 550 },
  { month: 'Jun', ai: 950, health: 400, environment: 680 },
];

export function DashboardTab({ opportunities, signals, onSelectOpportunity }: { opportunities: Opportunity[], signals: Signal[], onSelectOpportunity: (opt: Opportunity) => void }) {
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="mb-4">
        <h2 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight flex items-center gap-3">
          <Zap className="w-8 h-8 text-indigo-500 fill-indigo-500" />
          Autonomous Discovery Dashboard
        </h2>
        <p className="text-lg text-slate-500 font-medium">Monitoring global data streams to isolate high-value market voids.</p>
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
              className="absolute inset-0 flex items-center"
            >
              {TICKER_MESSAGES[tickerIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm col-span-2">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-500 w-6 h-6" /> Data Stream Anomalies (30-Day)
          </h3>
          <div className="h-64 w-full min-h-[256px]">
            <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={0}>
              <AreaChart data={MACRO_TRENDS}>
                <defs>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEnv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" name="Applied AI Research" dataKey="ai" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorAi)" />
                <Area type="monotone" name="Climate Constraints" dataKey="environment" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorEnv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-md flex flex-col justify-between text-white relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay group-hover:opacity-20 transition-opacity" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-indigo-100 mb-2">Active Markers</h3>
            <p className="text-6xl font-bold mb-4">{opportunities.length}<span className="text-2xl text-indigo-200 ml-2">total</span></p>
            <p className="text-indigo-100 font-medium">Active markers extracted from {signals.length} raw signals.</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 mt-6 backdrop-blur-sm relative z-10">
             <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                <div>
                   <p className="text-sm font-bold">Highest Conviction</p>
                   <p className="text-xs text-indigo-100 truncate w-40">{opportunities[0]?.title || "Loading..."}</p>
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
