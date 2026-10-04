import React from 'react';
import { ModelRuntimeStatus } from '../types';
import { ShieldCheck, Cpu, WifiOff, Sparkles, BookOpen, Layers, History, LayoutDashboard } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'concepts' | 'materials' | 'history' | 'prove';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  status: ModelRuntimeStatus;
  onOpenModelModal: () => void;
}

export const Header: React.FC<Props> = ({ activeTab, onSelectTab, status, onOpenModelModal }) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-base shadow-xs">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-zinc-100 font-mono text-base">PROOF</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 hidden sm:inline-block">
                Open-Weight AI
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans hidden sm:block">
              Don't tell me you understand it. Prove it.
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('concepts')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'concepts'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Concepts
          </button>
          <button
            onClick={() => onSelectTab('materials')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Study Notes
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Proof Log
          </button>
        </nav>

        {/* Runtime Status Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenModelModal}
            title="Click to view local model status & configure engine"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-xs font-mono"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300 hidden sm:inline">{status.name.split(' ')[0]}</span>
            <span className="text-emerald-400 font-semibold text-[11px]">LOCAL</span>
            <Cpu className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
          </button>

          <div
            title="100% of study notes and explanations remain on your local device."
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800/80 text-[11px] font-mono text-zinc-400"
          >
            <WifiOff className="w-3 h-3 text-emerald-400" />
            <span>OFFLINE READY</span>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-800/80 bg-zinc-950 py-1 px-2 text-xs">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-medium' : 'text-zinc-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => onSelectTab('concepts')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 ${
            activeTab === 'concepts' ? 'text-emerald-400 font-medium' : 'text-zinc-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Concepts</span>
        </button>
        <button
          onClick={() => onSelectTab('materials')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 ${
            activeTab === 'materials' ? 'text-emerald-400 font-medium' : 'text-zinc-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Notes</span>
        </button>
        <button
          onClick={() => onSelectTab('history')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 ${
            activeTab === 'history' ? 'text-emerald-400 font-medium' : 'text-zinc-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log</span>
        </button>
      </div>
    </header>
  );
};
