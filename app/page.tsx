'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DashboardTab } from '@/components/DashboardTab';
import { OpportunityFeedTab } from '@/components/OpportunityFeedTab';
import { SignalExplorerTab } from '@/components/SignalExplorerTab';
import { StartupArchitectTab } from '@/components/StartupArchitectTab';
import { PitchEngineTab } from '@/components/PitchEngineTab';
import { Opportunity, INITIAL_OPPORTUNITIES, RECENT_SIGNALS, Signal } from '@/lib/data';
import { Menu, X } from 'lucide-react';

type Tab = 'DASHBOARD' | 'IDEAS FEED' | 'TRENDS' | 'STARTUP BUILDER' | 'PITCH DECK';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<Tab>('DASHBOARD');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [signals, setSignals] = useState<Signal[]>(RECENT_SIGNALS);

  const handleSelectOpportunity = (opt: Opportunity) => {
    setSelectedOpportunity(opt);
    setCurrentTab('STARTUP BUILDER');
    setIsSidebarOpen(false); // Close sidebar on mobile after selecting
  };

  const handleAddNewOpportunity = (opt: Opportunity) => {
    setOpportunities(prev => [opt, ...prev]);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 xl:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out xl:relative xl:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar currentTab={currentTab} setCurrentTab={(t) => { setCurrentTab(t); setIsSidebarOpen(false); }} />
         
         {/* Mobile Close Button (Inside Sidebar) */}
         <button 
           onClick={() => setIsSidebarOpen(false)}
           className="absolute top-6 right-4 p-2 text-slate-500 hover:bg-slate-100 rounded-full xl:hidden"
         >
           <X className="w-5 h-5" />
         </button>
      </div>
      
      <main className="flex-1 overflow-y-auto w-full h-screen relative flex flex-col">
        {/* Mobile Header for hamburger */}
        <div className="xl:hidden flex items-center p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 mr-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-bold text-xl tracking-tight text-slate-800">Scout</div>
        </div>

        <div className="p-4 sm:p-6 md:p-10 lg:p-12 h-full max-w-7xl mx-auto w-full">
          {currentTab === 'DASHBOARD' && <DashboardTab opportunities={opportunities} signals={signals} onSelectOpportunity={handleSelectOpportunity} />}
          {currentTab === 'IDEAS FEED' && (
            <OpportunityFeedTab 
              opportunities={opportunities} 
              onSelectOpportunity={handleSelectOpportunity} 
              onAddNewOpportunity={handleAddNewOpportunity}
            />
          )}
          {currentTab === 'TRENDS' && <SignalExplorerTab signals={signals} />}
          {currentTab === 'STARTUP BUILDER' && <StartupArchitectTab selectedOpportunity={selectedOpportunity} onGoToPitch={() => {setCurrentTab('PITCH DECK'); setIsSidebarOpen(false);}} />}
          {currentTab === 'PITCH DECK' && <PitchEngineTab selectedOpportunity={selectedOpportunity} />}
        </div>
      </main>
    </div>
  );
}
