import { useMemo, useState } from 'react';
import { Opportunity } from '@/lib/data';
import { ArrowRight, Star, TrendingUp, Compass, Target, Hammer, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiscoveryModal } from '@/components/DiscoveryModal';

export function OpportunityFeedTab({
  opportunities,
  onSelectOpportunity,
  onAddNewOpportunity
}: {
  opportunities: Opportunity[],
  onSelectOpportunity: (opt: Opportunity) => void,
  onAddNewOpportunity: (opts: Opportunity[]) => void
}) {
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  // The feed below is ranked by overall quality score, which has nothing to
  // do with keyword relevance — a great "healthcare" match can still have a
  // lower raw score than an unrelated pre-loaded idea and get buried at the
  // bottom of a long list. So a scan's own results are also pinned here,
  // separately, in the order the scan ranked them, until the next scan (or
  // dismissal) replaces them.
  const [scanResults, setScanResults] = useState<{ topic: string; items: Opportunity[] } | null>(null);

  const handleDiscoveryComplete = (opts: Opportunity[], topic: string) => {
    onAddNewOpportunity(opts);
    setScanResults({ topic, items: opts });
  };

  // Rank ideas highest score first, regardless of scan/insertion order.
  const rankedOpportunities = useMemo(
    () => [...opportunities].sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0)),
    [opportunities]
  );

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <header className="mb-10 text-center relative">
        <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Great Ideas to Build</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          We&apos;ve found these amazing opportunities where lots of people have a problem, but nobody has built a good solution yet. Pick one to get started!
        </p>

        <button 
          onClick={() => setIsDiscoveryOpen(true)}
          className="mx-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-full transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Search className="w-5 h-5 relative z-10" /> 
          <span className="relative z-10">Run Autonomous Discovery Scan</span>
        </button>
      </header>

      <DiscoveryModal
        isOpen={isDiscoveryOpen}
        onClose={() => setIsDiscoveryOpen(false)}
        onComplete={handleDiscoveryComplete}
      />

      {scanResults && (
        <div className="mb-10 bg-indigo-50/60 border border-indigo-100 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              {scanResults.topic ? `Search results for "${scanResults.topic}"` : 'Latest scan results'}
            </h3>
            <button
              onClick={() => setScanResults(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors shrink-0"
              aria-label="Dismiss search results"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {scanResults.items.map((opt, i) => (
              <div
                key={opt.id}
                onClick={() => onSelectOpportunity(opt)}
                className="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="bg-indigo-50 rounded-full w-9 h-9 flex items-center justify-center shrink-0 text-indigo-600 font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{opt.title}</h4>
                    {opt.sourced === 'cached' && (
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600"
                        title="The live AI scan was unavailable, so this example was shown instead of a fresh result."
                      >
                        Example (offline)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{opt.problem}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600">
                    {opt.opportunityScore}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">match</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {rankedOpportunities.map((opt, index) => (
          <div key={opt.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border-b border-indigo-100">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {index === 0 && (
                    <span className="bg-white text-indigo-600 font-bold px-4 py-1.5 rounded-full shadow-sm text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 fill-indigo-500 text-indigo-500" /> Top Opportunity
                    </span>
                  )}
                  <span className={cn(
                    "text-sm font-bold px-4 py-1.5 rounded-full shadow-sm",
                    opt.competitionLevel === 'Low' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {opt.competitionLevel} Competition
                  </span>
                  {opt.sourced === 'live' && (
                    <span className="text-sm font-bold px-4 py-1.5 rounded-full shadow-sm bg-indigo-600 text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Live AI Scan
                    </span>
                  )}
                  {opt.sourced === 'cached' && (
                    <span
                      className="text-sm font-bold px-4 py-1.5 rounded-full shadow-sm bg-slate-200 text-slate-600"
                      title="The live AI scan was unavailable, so this example was shown instead of a fresh result."
                    >
                      Example (offline)
                    </span>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">{opt.title}</h3>
                <p className="text-slate-600 leading-relaxed text-lg">{opt.problem}</p>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-50 text-center shrink-0 min-w-[160px] flex flex-col justify-center">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Match Score</div>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600">
                  {opt.opportunityScore || 90}
                </div>
                <div className="text-slate-400 font-medium mt-1">out of 100</div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-3 mb-5">
                  <TrendingUp className="w-6 h-6 text-emerald-500" /> Why this is a great idea
                </h4>
                <div className="space-y-4">
                  {opt.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl">
                      <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 shadow-sm text-indigo-600 font-bold">
                        {i + 1}
                      </div>
                      <span className="text-slate-700 font-medium leading-relaxed">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-3 mb-5">
                  <Hammer className="w-6 h-6 text-purple-500" /> Our Suggestion
                </h4>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 mb-6">
                  <p className="text-lg font-semibold text-purple-900 leading-relaxed">{opt.suggestedStartup}</p>
                </div>
                
                <div className={cn("grid gap-4", opt.marketDetails?.tam ? "grid-cols-2" : "grid-cols-1")}>
                   {opt.marketDetails?.tam && (
                    <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-slate-500 text-sm font-medium mb-1">Potential Market</p>
                        <p className="text-2xl font-bold text-slate-800">{opt.marketDetails.tam}</p>
                    </div>
                   )}
                   {opt.marketDetails?.som && (
                    <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-slate-500 text-sm font-medium mb-1">Target Goal</p>
                        <p className="text-2xl font-bold text-slate-800">{opt.marketDetails.som}</p>
                    </div>
                   )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex justify-end">
              <button 
                onClick={() => onSelectOpportunity(opt)}
                className="flex items-center justify-center gap-3 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-4 rounded-full shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 w-full md:w-auto"
              >
                Build This Startup <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

