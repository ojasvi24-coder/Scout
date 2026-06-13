import { Home, Lightbulb, Compass, Hammer, Presentation, Radar } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'DASHBOARD' | 'IDEAS FEED' | 'TRENDS' | 'STARTUP BUILDER' | 'PITCH DECK';

const navigation = [
  { name: 'DASHBOARD' as Tab, icon: Home },
  { name: 'IDEAS FEED' as Tab, icon: Lightbulb },
  { name: 'TRENDS' as Tab, icon: Compass },
  { name: 'STARTUP BUILDER' as Tab, icon: Hammer },
  { name: 'PITCH DECK' as Tab, icon: Presentation },
];

export function Sidebar({ currentTab, setCurrentTab }: { currentTab: Tab; setCurrentTab: (tab: Tab) => void }) {
  return (
    <div className="flex flex-col w-72 bg-gradient-to-b from-slate-50 flex-shrink-0 to-white h-screen sticky top-0 border-r border-slate-200">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-2 shadow-lg shadow-emerald-200">
          <Radar className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-bold text-2xl tracking-tight text-slate-800">
          Scout
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => setCurrentTab(item.name)}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300',
              currentTab === item.name
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200 scale-[1.02]'
                : 'text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm'
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", currentTab === item.name ? "text-emerald-100" : "")} strokeWidth={currentTab === item.name ? 2.5 : 2} />
            {item.name.replace('IDEAS FEED', 'Great Ideas').replace('STARTUP BUILDER', 'Startup Builder').replace('PITCH DECK', 'Pitch Deck').replace('TRENDS', 'Trending Now').replace('DASHBOARD', 'Overview')}
          </button>
        ))}
      </nav>

      <div className="p-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 text-center">
           <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
             <Radar className="w-6 h-6 text-emerald-600" />
           </div>
           <p className="text-sm font-bold text-slate-800 mb-1">Scanning 24/7</p>
           <p className="text-xs text-slate-500">We analyze trends so you don&apos;t have to.</p>
        </div>
      </div>
    </div>
  );
}
