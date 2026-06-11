'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DashboardTab } from '@/components/DashboardTab';
import { OpportunityFeedTab } from '@/components/OpportunityFeedTab';
import { SignalExplorerTab } from '@/components/SignalExplorerTab';
import { StartupArchitectTab } from '@/components/StartupArchitectTab';
import { PitchEngineTab } from '@/components/PitchEngineTab';
import { Opportunity, INITIAL_OPPORTUNITIES, RECENT_SIGNALS, Signal } from '@/lib/data';

type Tab = 'DASHBOARD' | 'IDEAS FEED' | 'TRENDS' | 'STARTUP BUILDER' | 'PITCH DECK';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<Tab>('DASHBOARD');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [signals, setSignals] = useState<Signal[]>(RECENT_SIGNALS);

  const handleSelectOpportunity = (opt: Opportunity) => {
    setSelectedOpportunity(opt);
    setCurrentTab('STARTUP BUILDER');
  };

  const handleAddNewOpportunity = (opt: Opportunity) => {
    setOpportunities(prev => [opt, ...prev]);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <main className="flex-1 overflow-y-auto w-full h-screen relative">
        <div className="p-6 md:p-10 lg:p-12 h-full max-w-7xl mx-auto">
          {currentTab === 'DASHBOARD' && <DashboardTab opportunities={opportunities} signals={signals} onSelectOpportunity={handleSelectOpportunity} />}
          {currentTab === 'IDEAS FEED' && (
            <OpportunityFeedTab 
              opportunities={opportunities} 
              onSelectOpportunity={handleSelectOpportunity} 
              onAddNewOpportunity={handleAddNewOpportunity}
            />
          )}
          {currentTab === 'TRENDS' && <SignalExplorerTab signals={signals} />}
          {currentTab === 'STARTUP BUILDER' && <StartupArchitectTab selectedOpportunity={selectedOpportunity} onGoToPitch={() => setCurrentTab('PITCH DECK')} />}
          {currentTab === 'PITCH DECK' && <PitchEngineTab selectedOpportunity={selectedOpportunity} />}
        </div>
      </main>
    </div>
  );
}
