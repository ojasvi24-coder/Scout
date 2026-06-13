'use client';
import { useState, useEffect } from 'react';
import { Home, Lightbulb, Compass, Hammer, Presentation, Radar, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'DASHBOARD' | 'IDEAS FEED' | 'TRENDS' | 'STARTUP BUILDER' | 'PITCH DECK';

const navigation = [
  { name: 'DASHBOARD'       as Tab, icon: Home,         label: 'Overview'        },
  { name: 'IDEAS FEED'      as Tab, icon: Lightbulb,    label: 'Great Ideas'     },
  { name: 'TRENDS'          as Tab, icon: Compass,      label: 'Trending Now'    },
  { name: 'STARTUP BUILDER' as Tab, icon: Hammer,       label: 'Startup Builder' },
  { name: 'PITCH DECK'      as Tab, icon: Presentation, label: 'Pitch Deck'      },
];

interface SidebarProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
}

// ─── Shared nav content (used by both desktop sidebar and mobile drawer) ───
function NavContent({
  currentTab,
  setCurrentTab,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-2 shadow-lg shadow-emerald-200">
          <Radar className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-bold text-2xl tracking-tight text-slate-800">Scout</h1>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              setCurrentTab(item.name);
              onNavigate?.();
            }}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200',
              currentTab === item.name
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200 scale-[1.02]'
                : 'text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm'
            )}
          >
            <item.icon
              className={cn('w-5 h-5 shrink-0', currentTab === item.name ? 'text-emerald-100' : '')}
              strokeWidth={currentTab === item.name ? 2.5 : 2}
            />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer card */}
      <div className="p-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Radar className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">Scanning 24/7</p>
          <p className="text-xs text-slate-500">We analyze trends so you don't have to.</p>
        </div>
      </div>
    </>
  );
}

// ─── Main exported Sidebar (desktop only — hidden on mobile) ───────────────
export function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-slate-50 to-white flex-shrink-0 h-screen sticky top-0 border-r border-slate-200">
      <NavContent currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </aside>
  );
}

// ─── Mobile header bar + slide-in drawer ──────────────────────────────────
export function MobileNav({ currentTab, setCurrentTab }: SidebarProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close drawer on route change
  const handleNavigate = () => setOpen(false);

  const currentLabel = navigation.find(n => n.name === currentTab)?.label ?? 'Scout';

  return (
    <>
      {/* ── Sticky top bar (mobile only) ── */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-1.5">
            <Radar className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800">Scout</span>
        </div>

        <span className="text-sm font-semibold text-slate-500">{currentLabel}</span>

        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-in drawer ── */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-slate-50 to-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        <NavContent
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onNavigate={handleNavigate}
        />
      </div>
    </>
  );
}

