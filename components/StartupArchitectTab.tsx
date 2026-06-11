import { Opportunity } from '@/lib/data';
import { Target, Users, LayoutGrid, CheckCircle2, Presentation, Rocket } from 'lucide-react';
import { cn } from '@/components/Sidebar';

export function StartupArchitectTab({ selectedOpportunity, onGoToPitch }: { selectedOpportunity: Opportunity | null, onGoToPitch: () => void }) {
  if (!selectedOpportunity) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-indigo-100">
          <Rocket className="w-12 h-12 text-indigo-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-3xl font-extrabold text-slate-800 mb-4">Let&apos;s Build Something!</h3>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Choose a great idea from the <span className="font-bold text-indigo-500">Great Ideas</span> feed to start building your startup step-by-step.
        </p>
      </div>
    );
  }

  const opt = selectedOpportunity;

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-12">
      <header className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-full text-sm mb-6">
          <Rocket className="w-4 h-4" /> Active Startup Project
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 leading-tight">{opt.title}</h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl">
          {opt.suggestedStartup}
        </p>
        
        <div className="mt-10 flex justify-center">
           <button onClick={onGoToPitch} className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-full shadow-lg shadow-indigo-200 hover:-translate-y-1 transition-all flex items-center gap-3 text-lg">
             <Presentation className="w-5 h-5" /> Generate Pitch Deck
           </button>
        </div>
      </header>

      <section>
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6 pl-2">
          <Target className="w-8 h-8 text-indigo-500 bg-indigo-50 p-1.5 rounded-lg" /> Who needs this?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opt.potentialCustomers.map((cust, i) => (
             <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                   <Users className="w-6 h-6 text-green-500" />
                </div>
                <div>
                   <h4 className="font-bold text-slate-800 text-lg mb-1">Target Audience {i+1}</h4>
                   <p className="text-slate-600 font-medium">{cust}</p>
                </div>
             </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6 pl-2 mt-12">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-lg" /> What features to build first (MVP)
        </h3>
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
           <p className="text-slate-500 text-lg mb-6">Don&apos;t overbuild. Start with just these core features to test the market:</p>
           <div className="space-y-4">
             {opt.mvp.map((item, i) => (
               <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                 <div className="w-8 h-8 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center font-bold text-emerald-600 shrink-0">
                    {i+1}
                 </div>
                 <span className="text-lg font-semibold text-slate-700">{item}</span>
               </div>
             ))}
           </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6 pl-2 mt-12">
          <LayoutGrid className="w-8 h-8 text-amber-500 bg-amber-50 p-1.5 rounded-lg" /> Who else is doing this?
        </h3>
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
           {opt.competitors.length === 0 ? (
              <div className="p-8 text-center bg-slate-50">
                 <p className="text-xl font-bold text-slate-700">Great news! 🚀</p>
                 <p className="text-slate-500 mt-2">There is almost nobody doing exactly this right now. You have an open field.</p>
              </div>
           ) : (
              <div className="divide-y divide-slate-100">
                <div className="bg-slate-50 p-6 flex flex-col md:flex-row gap-6">
                   <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-lg mb-2">You</h4>
                      <p className="text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded inline-block">Your new fast approach</p>
                   </div>
                   <div className="flex-1 border-l border-slate-200 pl-6">
                      <p className="text-slate-600 italic">No legacy baggage, focused entirely on the modern problem.</p>
                   </div>
                </div>
                {opt.competitors.map((comp, i) => (
                  <div key={i} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-50 transition-colors">
                     <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-lg mb-2">{comp.name}</h4>
                        <p className="text-slate-500 font-medium text-sm">{comp.description}</p>
                     </div>
                     <div className="flex-1 border-l border-slate-100 pl-6">
                        <p className="text-sm font-bold text-slate-800 mb-2">Their Weaknesses:</p>
                        <ul className="space-y-2 text-rose-600 text-sm font-medium">
                           {comp.weaknesses.map((w, j) => (
                              <li key={j} className="flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> {w}
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>
                ))}
              </div>
           )}
        </div>
      </section>

    </div>
  );
}
