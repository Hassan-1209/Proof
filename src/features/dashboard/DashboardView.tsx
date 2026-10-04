import React from 'react';
import { Concept, StudyMaterial, ProofSession } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { getEffectiveConceptState } from '../concepts/stateMachine';
import {
  Flame,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Zap,
  Play,
  WifiOff,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';

interface Props {
  concepts: Concept[];
  materials: StudyMaterial[];
  recentSessions: ProofSession[];
  onStartProve: (concept: Concept) => void;
  onNavigateToMaterials: () => void;
  onNavigateToConcepts: () => void;
}

export const DashboardView: React.FC<Props> = ({
  concepts,
  materials,
  recentSessions,
  onStartProve,
  onNavigateToMaterials,
  onNavigateToConcepts,
}) => {
  const effectiveConcepts = concepts.map((c) => ({
    ...c,
    effectiveState: getEffectiveConceptState(c),
  }));

  const needsRepair = effectiveConcepts.filter((c) => c.effectiveState === 'NEEDS_REPAIR');
  const readyToProve = effectiveConcepts.filter(
    (c) => c.effectiveState === 'UNSEEN' || c.effectiveState === 'INTRODUCED' || c.effectiveState === 'PRACTICED'
  );
  const verified = effectiveConcepts.filter((c) => c.effectiveState === 'VERIFIED');
  const stale = effectiveConcepts.filter((c) => c.effectiveState === 'STALE');

  // Find the signature demo concept: Page Fault Mechanism
  const demoConcept = concepts.find((c) => c.id === 'c-page-fault') || concepts[0];

  return (
    <div className="space-y-8 pb-12">
      {/* 3-Minute Judge Quick-Demo Callout */}
      {demoConcept && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                3-Minute Demonstration
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium">
              Experience the core loop: Test how PROOF isolates a questionable assumption (observed in our test with Operating Systems paging) and attacks it with an adversarial counterexample.
            </p>
          </div>

          <button
            onClick={() => onStartProve(demoConcept)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Launch Stress Test</span>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 text-xs font-mono text-zinc-300">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local & Offline Evaluation Supported</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-sans">
            Don't tell me you understand it. <br className="hidden sm:inline" />
            <span className="text-emerald-400 font-mono">Prove it.</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-medium">
            PROOF isn't an AI tutor. PROOF is an understanding stress test.
          </p>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Most study tools ask whether you can recognize the right answer. PROOF asks whether your reasoning can survive an adversarial counterexample. Hides your notes, exposes your reasoning, identifies weak assumptions, and verifies understanding through defense and repair.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {needsRepair.length > 0 ? (
              <button
                onClick={() => onStartProve(needsRepair[0])}
                className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-rose-950/40"
              >
                <Flame className="w-4 h-4" />
                <span>Repair Vulnerability: {needsRepair[0].title}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            ) : readyToProve.length > 0 ? (
              <button
                onClick={() => onStartProve(readyToProve[0])}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Stress Test: {readyToProve[0].title}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={onNavigateToMaterials}
                className="px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs sm:text-sm flex items-center gap-2 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Add Study Notes</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            )}

            <button
              onClick={onNavigateToMaterials}
              className="px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs sm:text-sm font-medium transition-colors"
            >
              Upload Notes
            </button>
          </div>
        </div>
      </section>

      {/* Cognitive State Triage Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Needs Repair */}
        <div
          onClick={onNavigateToConcepts}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            needsRepair.length > 0
              ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-700'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>NEEDS REPAIR</span>
            <ShieldAlert className={`w-4 h-4 ${needsRepair.length > 0 ? 'text-rose-400' : 'text-zinc-600'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-100">{needsRepair.length}</div>
          <p className="mt-1 text-xs text-zinc-400">Exposed weaknesses waiting for repair</p>
        </div>

        {/* Ready to Prove */}
        <div
          onClick={onNavigateToConcepts}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>UNTESTED / READY</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-100">{readyToProve.length}</div>
          <p className="mt-1 text-xs text-zinc-400">Concepts waiting for stress-test</p>
        </div>

        {/* Verified */}
        <div
          onClick={onNavigateToConcepts}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>VERIFIED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-100">{verified.length}</div>
          <p className="mt-1 text-xs text-zinc-400">Survived adversarial counterexamples</p>
        </div>

        {/* Stale */}
        <div
          onClick={onNavigateToConcepts}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>STALE (&gt;5 DAYS)</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-100">{stale.length}</div>
          <p className="mt-1 text-xs text-zinc-400">Retention window expired</p>
        </div>
      </section>

      {/* Priority Action: Needs Immediate Repair */}
      {needsRepair.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-rose-400">
                Cognitive Vulnerabilities Detected ({needsRepair.length})
              </h2>
            </div>
            <span className="text-xs text-zinc-400">Proof broke under stress</span>
          </div>

          <div className="grid gap-3">
            {needsRepair.map((concept) => (
              <div
                key={concept.id}
                className="p-4 bg-zinc-900 border border-rose-900/50 hover:border-rose-700 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-zinc-100 text-sm sm:text-base">{concept.title}</h3>
                    <StatusBadge state={concept.effectiveState} />
                  </div>
                  {concept.detectedWeakness && (
                    <p className="text-xs text-rose-300 font-mono bg-rose-950/40 p-2.5 rounded border border-rose-900/40">
                      <span className="font-bold text-rose-400">Exposed Flaw:</span> {concept.detectedWeakness}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 line-clamp-1">{concept.definition}</p>
                </div>

                <button
                  onClick={() => onStartProve(concept)}
                  className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-md"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Repair Now
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Concepts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-zinc-300">
            Available Concepts ({effectiveConcepts.length})
          </h2>
          <button
            onClick={onNavigateToConcepts}
            className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {effectiveConcepts.slice(0, 4).map((concept) => (
            <div
              key={concept.id}
              className="p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-zinc-100 text-sm">{concept.title}</h3>
                  <StatusBadge state={concept.effectiveState} />
                </div>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{concept.definition}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">
                  {concept.attemptsCount === 0 ? 'No attempts yet' : `${concept.attemptsCount} stress tests`}
                </span>
                <button
                  onClick={() => onStartProve(concept)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                >
                  Prove It <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The Open-Weight AI Architecture */}
      <section className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-zinc-200 font-mono uppercase tracking-wider">
            Why Local & Open-Weight Execution Matters Here
          </h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 pt-1 text-zinc-400">
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="font-semibold text-zinc-200 block">Adversarial Evaluation Contract</span>
            <p>PROOF is deliberately designed around adversarial evaluation rather than conversational assistance, keeping prompts constrained strictly to evidence verification.</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="font-semibold text-zinc-200 block">Local Data Privacy</span>
            <p>Study materials, explanations, and diagnosed gaps remain stored in the browser's IndexedDB rather than sending notes to remote application servers.</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="font-semibold text-zinc-200 block">No Per-Request Cloud API Cost</span>
            <p>Running local evaluation or on-device open-weight models avoids per-query token fees when operating on client hardware.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
