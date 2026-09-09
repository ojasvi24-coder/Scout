import { useState } from 'react';
import { Search, Cpu, FlaskConical, Briefcase, DollarSign, Landmark, Github, Filter, Activity, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Signal, SignalSource } from '@/lib/data';

const VECTORS: (SignalSource | 'Everything')[] = ['Everything', 'Tech', 'Research', 'Jobs', 'Funding', 'Grants', 'Community'];

const SOURCE_META: Record<SignalSource, { icon: typeof Cpu; color: string; label: string }> = {
  Tech: { icon: Cpu, color: 'text-blue-500', label: 'Tech' },
  Research: { icon: FlaskConical, color: 'text-purple-500', label: 'Research' },
  Jobs: { icon: Briefcase, color: 'text-emerald-500', label: 'Jobs' },
  Funding: { icon: DollarSign, color: 'text-amber-500', label: 'Funding' },
  Grants: { icon: Landmark, color: 'text-rose-500', label: 'Grants' },
  Community: { icon: Github, color: 'text-slate-500', label: 'Community' },
};

export function SignalExplorerTab({
  signals,
  isLoading = false,
  lastUpdated = null,
  onRefresh,
}: {
  signals: Signal[];
  isLoading?: boolean;
  lastUpdated?: string | null;
  onRefresh?: () => void;
}) {
  const [activeVector, setActiveVector] = useState<(SignalSource | 'Everything')>('Everything');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = signals.filter(s => {
    if (activeVector !== 'Everything' && s.source !== activeVector) return false;
    if (search && !s.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto pb-24 h-full flex flex-col">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
             <Activity className="w-8 h-8 text-indigo-500" /> Raw Signal Stream
          </h2>
          <p className="text-lg text-slate-500">
            Real, live data from Hacker News, arXiv, RemoteOK, SEC EDGAR, USAspending.gov, and GitHub — the same feed used to generate opportunities.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastUpdated && (
            <span className="text-sm text-slate-400 font-medium">Updated {lastUpdated}</span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-full transition-all shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            {isLoading ? 'Scanning...' : 'Refresh'}
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col h-[700px] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search signals (e.g., 'climate', 'security')"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
            <Filter className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
            {VECTORS.map(v => (
              <button
                key={v}
                onClick={() => setActiveVector(v)}
                className={cn(
                  "px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap transition-all shadow-sm",
                  activeVector === v
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {isLoading && signals.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium text-lg flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              Pulling live signals...
            </div>
          ) : (
          <div className="divide-y divide-slate-100">
             {filtered.map((s) => {
                const meta = SOURCE_META[s.source];
                const Icon = meta?.icon ?? Activity;
                return (
                <div
                  key={s.id}
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className={cn(
                    "p-6 transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-start border-b border-transparent",
                    expandedId === s.id ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-slate-50 border-slate-50"
                  )}
                >
                   <div className={cn("p-3 rounded-2xl shrink-0 transition-colors bg-slate-100", expandedId === s.id && "bg-indigo-100")}>
                       <Icon className={cn("w-5 h-5", meta?.color ?? 'text-slate-500')} />
                   </div>
                   <div className="flex-1 w-full relative">
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="text-xl font-bold text-slate-800 leading-tight">{meta?.label ?? s.source}{s.origin ? ` · ${s.origin}` : ''}</h4>
                      </div>

                      <p className={cn("text-slate-600 text-base leading-relaxed transition-all", expandedId === s.id ? "line-clamp-none mt-4 mb-4 text-slate-800" : "line-clamp-2")}>
                         {s.content}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400 font-medium">
                         <span>Found {s.timestamp}</span>
                         {s.url && (
                           <>
                             <span>•</span>
                             <a
                               href={s.url}
                               target="_blank"
                               rel="noopener noreferrer"
                               onClick={(e) => e.stopPropagation()}
                               className="text-indigo-500 hover:text-indigo-700 flex items-center gap-1 font-bold"
                             >
                               View source <ExternalLink className="w-3.5 h-3.5" />
                             </a>
                           </>
                         )}
                      </div>
                   </div>
                </div>
              );})}
             {filtered.length === 0 && (
                <div className="p-12 text-center text-slate-500 font-medium text-lg">
                   No signals found matching your search.
                </div>
             )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
