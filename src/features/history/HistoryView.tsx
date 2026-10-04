import React from 'react';
import { ProofSession, Concept } from '../../types';
import { History, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  sessions: ProofSession[];
  concepts: Concept[];
  onStartProve: (concept: Concept) => void;
}

export const HistoryView: React.FC<Props> = ({ sessions, concepts, onStartProve }) => {
  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-sans flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-400" />
          <span>Proof Log & Audit Trail</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Historical record of explanations subjected to adversarial stress tests, vulnerabilities exposed, and defenses evaluated.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
          <History className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="text-zinc-300 font-medium text-sm">No stress tests completed yet</div>
          <p className="text-xs text-zinc-500">
            Pick a concept from the dashboard to run your first adversarial verification.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const relatedConcept = concepts.find((c) => c.id === session.conceptId);

            return (
              <div
                key={session.id}
                className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-4 text-xs sm:text-sm"
              >
                {/* Session Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-zinc-100 text-base">{session.conceptTitle}</span>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded border font-medium ${
                        session.verdict === 'VERIFIED'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : session.verdict === 'PARTIALLY_VERIFIED'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                          : 'bg-rose-950/80 text-rose-400 border-rose-800'
                      }`}
                    >
                      {session.verdict || 'UNGRADED'}
                    </span>
                  </div>

                  <span className="text-zinc-500 font-mono text-[11px]">
                    {new Date(session.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Original Explanation */}
                <div className="space-y-1">
                  <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider block">
                    Student's Explanation (From Memory):
                  </span>
                  <p className="p-3 bg-zinc-950/80 rounded-lg text-zinc-300 italic font-serif leading-relaxed">
                    "{session.originalExplanation}"
                  </p>
                </div>

                {/* The Counterexample Challenge */}
                <div className="p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-lg space-y-1 text-xs">
                  <span className="font-mono font-semibold text-blue-400 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Adversarial Counterexample Posed:
                  </span>
                  <p className="text-zinc-200">"{session.challengePrompt}"</p>
                </div>

                {/* Student's Defense */}
                {session.defenseText && (
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider block">
                      Student's Defense:
                    </span>
                    <p className="p-3 bg-zinc-950/80 rounded-lg text-zinc-300 font-sans leading-relaxed">
                      "{session.defenseText}"
                    </p>
                  </div>
                )}

                {/* Verdict Inspection */}
                {(session.whatGotRight || session.whatBroke) && (
                  <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs">
                    {session.whatGotRight && (
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-0.5">
                        <span className="font-mono font-semibold text-emerald-400 uppercase">Mechanically Sound:</span>
                        <p className="text-zinc-300">{session.whatGotRight}</p>
                      </div>
                    )}
                    {session.whatBroke && (
                      <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 space-y-0.5">
                        <span className="font-mono font-semibold text-rose-400 uppercase">Exposed Weakness:</span>
                        <p className="text-zinc-300">{session.whatBroke}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action */}
                {relatedConcept && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onStartProve(relatedConcept)}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-Test Concept</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
