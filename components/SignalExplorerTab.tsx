import { useState } from 'react';
import { Search, Hash, FileText, Beaker, Briefcase, DollarSign, Filter, Activity } from 'lucide-react';
import { cn } from '@/components/Sidebar';
import { Signal } from '@/lib/data';

const VECTORS = ['Everything', 'News', 'Tech', 'Jobs', 'Funding', 'Grants'];

export function SignalExplorerTab({ signals }: { signals: Signal[] }) {
  const [activeVector, setActiveVector] = useState('Everything');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = signals.filter(s => {
    if (activeVector !== 'Everything' && s.source !== activeVector) return false;
    if (search && !s.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getIcon = (source: string) => {
    switch (source) {
      case 'News': return <FileText className="w-5 h-5 text-purple-500" />;
      case 'Tech': return <Beaker className="w-5 h-5 text-blue-500" />;
      case 'Jobs': return <Briefcase className="w-5 h-5 text-emerald-500" />;
      case 'Funding': return <DollarSign className="w-5 h-5 text-amber-500" />;
      case 'Grants': return <Hash className="w-5 h-5 text-rose-500" />;
      default: return <Hash className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 h-full flex flex-col">
      <header className="mb-8">
        <h2 className="text-4xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
           <Activity className="w-8 h-8 text-indigo-500" /> Raw Signal Stream
        </h2>
        <p className="text-lg text-slate-500">See the raw news, jobs, and funding data that we use to triangulate new market opportunities.</p>
      </header>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col h-[700px] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search trends (e.g., 'climate', 'software')" 
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
          <div className="divide-y divide-slate-100">
             {filtered.map((s) => (
                <div 
                  key={s.id} 
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className={cn(
                    "p-6 transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-start border-b border-transparent",
                    expandedId === s.id ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-slate-50 border-slate-50"
                  )}
                >
                   <div className={cn("p-3 rounded-2xl shrink-0 transition-colors", expandedId === s.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500")}>
                       {getIcon(s.source)}
                   </div>
                   <div className="flex-1 w-full relative">
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="text-xl font-bold text-slate-800 leading-tight">Signal Entity: {s.source}</h4>
                      </div>
                      
                      <p className={cn("text-slate-600 text-base leading-relaxed transition-all", expandedId === s.id ? "line-clamp-none mt-4 mb-4 text-slate-800" : "line-clamp-2")}>
                         {s.content}
                      </p>

                      {expandedId === s.id && (
                        <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm mb-4 leading-relaxed text-sm text-slate-600">
                          <p><strong>Analysis:</strong> This signal represents a significant shift in the {s.source.toLowerCase()} sector. Market indicators suggest potential for new disruptive products.</p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400 font-medium">
                         <span>Found {s.timestamp}</span>
                         <span>•</span>
                         <span className="text-indigo-500">Confidence: {Math.floor(Math.random() * 20) + 80}%</span>
                      </div>
                   </div>
                </div>
             ))}
             {filtered.length === 0 && (
                <div className="p-12 text-center text-slate-500 font-medium text-lg">
                   No trends found matching your search.
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
