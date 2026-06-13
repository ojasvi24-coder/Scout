import { useState } from 'react';
import { Opportunity } from '@/lib/data';
import { ArrowRight, Star, TrendingUp, Compass, Target, Hammer, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiscoveryModal } from '@/components/DiscoveryModal';

export function OpportunityFeedTab({ 
  opportunities,
  onSelectOpportunity,
  onAddNewOpportunity 
}: { 
  opportunities: Opportunity[], 
  onSelectOpportunity: (opt: Opportunity) => void,
  onAddNewOpportunity: (opt: Opportunity) => void 
}) {
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);

  const handleDiscoveryComplete = (opt: Opportunity) => {
    setIsDiscoveryOpen(false);
    onAddNewOpportunity(opt);
  };

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

      <div className="space-y-8">
        {opportunities.map((opt, index) => (
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

