import React, { useState } from 'react';
import { Concept, ChallengeOutput, EvaluationVerdict, ProofSession } from '../../types';
import { aiManager } from '../../ai/aiManager';
import { storage } from '../../db/storage';
import { computeNextStateFromVerdict } from '../concepts/stateMachine';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  EyeOff,
  Flame,
  HelpCircle,
  RotateCcw,
  ChevronLeft,
  FileText,
  ShieldCheck,
  Quote,
} from 'lucide-react';

interface Props {
  concept: Concept;
  onBack: () => void;
  onCompleted: (updatedConcept: Concept) => void;
}

type Stage =
  | 'EXPLAIN' // Step 1: Blank slate explanation without notes
  | 'GENERATING_CHALLENGE' // Local AI parsing claims & crafting adversarial probe
  | 'CHALLENGE' // Step 2: Friend defends against the counterexample
  | 'EVALUATING_DEFENSE' // Local AI grading defense
  | 'VERDICT' // Step 3: Objective inspection report
  | 'REPAIR' // Step 4: Targeted micro-repair if failed
  | 'EVALUATING_REPAIR' // Local AI verifying repair
  | 'FINAL_SUCCESS'; // Verified!

export const ProveArenaView: React.FC<Props> = ({ concept, onBack, onCompleted }) => {
  const [stage, setStage] = useState<Stage>('EXPLAIN');
  const [explanation, setExplanation] = useState('');
  const [challengeData, setChallengeData] = useState<ChallengeOutput | null>(null);
  const [defense, setDefense] = useState('');
  const [verdict, setVerdict] = useState<EvaluationVerdict | null>(null);
  const [repairInput, setRepairInput] = useState('');
  const [repairFeedback, setRepairFeedback] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showSourcePeek, setShowSourcePeek] = useState(false);

  // Quick-test helper for judging demo
  const isPageFault = concept.id === 'c-page-fault' || concept.title.toLowerCase().includes('page fault');

  const fillSampleFlawedAnswer = () => {
    setExplanation(
      'A page fault is an error that occurs when physical RAM is 100% full, so the CPU has to pause the program and swap unused memory to the disk to free up bytes for the new process.'
    );
  };

  const fillSampleSoundAnswer = () => {
    setExplanation(
      'A page fault is a hardware interrupt triggered when an instruction references a virtual address whose Page Table Entry has its Valid/Invalid bit set to 0 (Invalid). It does NOT require RAM to be full; in demand paging, the first access to an unmapped page always faults so the OS can load it from secondary storage into an available physical frame and mark the entry Valid.'
    );
  };

  // --- Step 1: Submit Explanation & Generate Challenge ---
  const handleSubmitExplanation = async () => {
    if (!explanation.trim() || explanation.trim().length < 15) return;

    setStage('GENERATING_CHALLENGE');
    setStatusMessage('Decomposing claims against ground truth and hunting for weak assumptions...');

    try {
      const provider = aiManager.getProvider();
      const challenge = await provider.generateChallenge(
        concept.sourceExcerpt || concept.definition,
        concept.title,
        explanation.trim()
      );

      setChallengeData(challenge);
      setStage('CHALLENGE');
    } catch (err: any) {
      console.error('Challenge generation error:', err);
      setStatusMessage(`Evaluation error: ${err.message || String(err)}`);
      setStage('EXPLAIN');
    }
  };

  // --- Step 2: Submit Defense against Counterexample ---
  const handleSubmitDefense = async () => {
    if (!defense.trim() || !challengeData) return;

    setStage('EVALUATING_DEFENSE');
    setStatusMessage('Grading defense against ground-truth mechanics...');

    try {
      const provider = aiManager.getProvider();
      const evalResult = await provider.evaluateDefense(
        concept.sourceExcerpt || concept.definition,
        concept.title,
        explanation.trim(),
        challengeData.counterexamplePrompt,
        defense.trim()
      );

      setVerdict(evalResult);

      // Determine new concept state and persist
      const { nextState, detectedWeakness } = computeNextStateFromVerdict(concept.state, evalResult);
      const updated: Concept = {
        ...concept,
        state: nextState,
        attemptsCount: concept.attemptsCount + 1,
        lastVerifiedAt: evalResult.verdict === 'VERIFIED' ? Date.now() : concept.lastVerifiedAt,
        detectedWeakness,
      };

      await storage.saveConcept(updated);

      // Save session audit record
      const sessionRecord: ProofSession = {
        id: 'session-' + Date.now(),
        conceptId: concept.id,
        conceptTitle: concept.title,
        materialId: concept.materialId,
        originalExplanation: explanation,
        claimsIdentified: challengeData.claimsIdentified,
        challengePrompt: challengeData.counterexamplePrompt,
        challengeType: challengeData.challengeType,
        targetedWeakness: challengeData.targetedWeakness,
        defenseText: defense,
        verdict: evalResult.verdict,
        whatGotRight: evalResult.whatGotRight,
        whatBroke: evalResult.whatBroke,
        whyItMatters: evalResult.whyItMatters,
        whatToFix: evalResult.whatToFix,
        repairDirective: evalResult.repairDirective,
        timestamp: Date.now(),
      };
      await storage.saveSession(sessionRecord);

      if (evalResult.verdict === 'VERIFIED') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setStage('VERDICT');
    } catch (err: any) {
      console.error('Defense evaluation error:', err);
      setStatusMessage(`Evaluation failed: ${err.message}`);
      setStage('CHALLENGE');
    }
  };

  // --- Step 3: Targeted Repair Attempt ---
  const handleSubmitRepair = async () => {
    if (!repairInput.trim() || !verdict) return;

    setStage('EVALUATING_REPAIR');
    setStatusMessage('Verifying if causal gap is successfully bridged...');

    try {
      const provider = aiManager.getProvider();
      const repairResult = await provider.evaluateRepair(
        concept.sourceExcerpt || concept.definition,
        concept.title,
        verdict.whatBroke || 'Weak premise',
        repairInput.trim()
      );

      if (repairResult.passed) {
        // Upgrade concept to VERIFIED
        const updated: Concept = {
          ...concept,
          state: 'VERIFIED',
          lastVerifiedAt: Date.now(),
          detectedWeakness: undefined,
        };
        await storage.saveConcept(updated);

        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.5 },
        });

        setRepairFeedback(repairResult.feedback);
        setStage('FINAL_SUCCESS');
      } else {
        setRepairFeedback(repairResult.feedback);
        setStage('REPAIR');
      }
    } catch (err: any) {
      console.error('Repair evaluation failed:', err);
      setStatusMessage(`Repair verification error: ${err.message}`);
      setStage('REPAIR');
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 p-1 rounded hover:bg-zinc-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit Arena</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline">
            Stress Test Target:
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
            {concept.title}
          </span>
        </div>
      </div>

      {/* STAGE 1: EXPLAIN (CLOSED NOTES) */}
      {stage === 'EXPLAIN' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider">
              <EyeOff className="w-4 h-4" />
              <span>Closed Notes • Explain From Memory</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-sans">
              Prove: <span className="text-emerald-400">{concept.title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Explain this mechanism from first principles in your own words. Focus on the cause, what system transition occurs, and how it behaves under edge conditions.
            </p>
          </div>

          {/* Quick Pre-fill buttons for testing */}
          {isPageFault && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Demonstration Quick-Fill (Test observed student misconception vs. first-principles reasoning):</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={fillSampleFlawedAnswer}
                  className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/70 text-rose-300 font-mono text-[11px]"
                >
                  Insert Observed Misconception ("RAM is full")
                </button>
                <button
                  type="button"
                  onClick={fillSampleSoundAnswer}
                  className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/70 text-emerald-300 font-mono text-[11px]"
                >
                  Insert First-Principles Explanation
                </button>
              </div>
            </div>
          )}

          {/* Text Input */}
          <div className="space-y-2">
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="What triggers this mechanism? What exact hardware/software steps happen? What is a common edge case or misconception?"
              rows={8}
              className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none transition-all resize-y font-sans leading-relaxed"
            />
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-1">
              <span>{explanation.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>Min. 15 words for deep decomposition</span>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowSourcePeek(!showSourcePeek)}
              className="text-xs text-zinc-500 hover:text-zinc-400 underline font-mono flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              {showSourcePeek ? 'Hide reference hint' : 'Peek at reference text'}
            </button>

            <button
              onClick={handleSubmitExplanation}
              disabled={explanation.trim().split(/\s+/).filter(Boolean).length < 8}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40"
            >
              <span>Subject to Stress Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {showSourcePeek && (
            <div className="p-4 bg-zinc-950 border border-amber-900/50 rounded-xl text-xs text-amber-200 font-mono space-y-1">
              <span className="font-bold text-amber-400 block uppercase">Reference Excerpt:</span>
              <p className="italic">"{concept.sourceExcerpt || concept.definition}"</p>
            </div>
          )}
        </div>
      )}

      {/* LOADING STATE: GENERATING CHALLENGE */}
      {stage === 'GENERATING_CHALLENGE' && (
        <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-zinc-200 text-base">Local Open-Weight Model Reasoning</h3>
            <p className="text-xs font-mono text-zinc-400">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* STAGE 2: ADVERSARIAL CHALLENGE */}
      {stage === 'CHALLENGE' && challengeData && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Adversarial Probe Generated</span>
          </div>

          {/* What the Local AI Extracted */}
          <div className="space-y-2">
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">What the Local AI Extracted:</h2>
            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
              <div>
                <span className="font-mono text-zinc-500">Your Claims:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-zinc-300">
                  {challengeData.claimsIdentified.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              {challengeData.hiddenAssumption && (
                <div className="pt-2 border-t border-zinc-800 text-rose-300">
                  <span className="font-mono text-rose-400 font-bold">Unproven Assumption / Vulnerability: </span>
                  {challengeData.hiddenAssumption}
                </div>
              )}
            </div>
          </div>

          {/* The Counterexample Challenge */}
          <div className="p-5 bg-zinc-950 border border-blue-900/60 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-blue-300 uppercase">
              <AlertTriangle className="w-4 h-4 text-blue-400" />
              <span>Counterexample Challenge:</span>
            </div>
            <p className="text-zinc-100 font-medium text-sm sm:text-base leading-relaxed">
              "{challengeData.counterexamplePrompt}"
            </p>
          </div>

          {/* Defense Input */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-zinc-300 uppercase tracking-wider">
              Defend Your Explanation (Address the probe directly):
            </label>
            <textarea
              value={defense}
              onChange={(e) => setDefense(e.target.value)}
              placeholder="State why your mental model survives this edge case. What specific flag or causal step handles this?"
              rows={5}
              className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none transition-all resize-y font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSubmitDefense}
              disabled={!defense.trim() || defense.trim().length < 8}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-950/40"
            >
              <span>Submit Defense to Local Evaluator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE: EVALUATING DEFENSE */}
      {stage === 'EVALUATING_DEFENSE' && (
        <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-zinc-200 text-base">Evaluating Defense Against Ground Truth</h3>
            <p className="text-xs font-mono text-zinc-400">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* STAGE 3: OBJECTIVE VERDICT & INSPECTION REPORT */}
      {stage === 'VERDICT' && verdict && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Stress Test Result</span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1 font-sans">{concept.title}</h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-sm px-3.5 py-1.5 rounded-lg font-bold border flex items-center gap-2 ${
                  verdict.verdict === 'VERIFIED'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : verdict.verdict === 'PARTIALLY_VERIFIED'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                    : 'bg-rose-950/80 text-rose-300 border-rose-700'
                }`}
              >
                {verdict.verdict === 'VERIFIED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                )}
                <span>{verdict.verdict}</span>
              </span>
            </div>
          </div>

          {/* Evidence Confidence & Flaw Category Meta Bar */}
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evidence: {verdict.evidenceConfidence}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
              Category: {verdict.flawCategory}
            </span>
          </div>

          {/* Detailed Inspection Cards */}
          <div className="grid gap-3 sm:gap-4 text-xs sm:text-sm">
            {/* What you got right */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-900/40 space-y-1">
              <span className="font-mono text-xs font-semibold uppercase text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> What Was Mechanically Sound:
              </span>
              <p className="text-zinc-200">{verdict.whatGotRight}</p>
            </div>

            {/* What broke */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-rose-900/40 space-y-1">
              <span className="font-mono text-xs font-semibold uppercase text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Where Understanding Broke:
              </span>
              <p className="text-zinc-200">{verdict.whatBroke}</p>
            </div>

            {/* Verbatim Ground Truth Citation (Anti-Hallucination) */}
            {verdict.sourceGroundingQuote && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="font-mono text-xs font-semibold uppercase text-zinc-400 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-zinc-400" /> Ground Truth Excerpt From Notes:
                </span>
                <p className="text-zinc-300 italic font-mono text-xs bg-zinc-900/80 p-2.5 rounded border border-zinc-800">
                  &ldquo;{verdict.sourceGroundingQuote}&rdquo;
                </p>
              </div>
            )}

            {/* Why it matters */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="font-mono text-xs font-semibold uppercase text-zinc-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" /> Why This Distinction Matters:
              </span>
              <p className="text-zinc-300">{verdict.whyItMatters}</p>
            </div>
          </div>

          {/* Next Steps Buttons */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => {
                setStage('EXPLAIN');
                setDefense('');
              }}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 p-2 rounded hover:bg-zinc-800 transition-colors w-full sm:w-auto justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-Attempt From Blank Slate</span>
            </button>

            {verdict.verdict !== 'VERIFIED' ? (
              <button
                onClick={() => setStage('REPAIR')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/40"
              >
                <Flame className="w-4 h-4" />
                <span>Begin Targeted Micro-Repair</span>
              </button>
            ) : (
              <button
                onClick={() => onCompleted({ ...concept, state: 'VERIFIED', lastVerifiedAt: Date.now() })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Return to Concept Map</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* STAGE 4: TARGETED MICRO-REPAIR */}
      {stage === 'REPAIR' && verdict && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              <span>Targeted Micro-Repair</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 font-sans">Repair the Specific Missing Link</h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              PROOF does not lecture you. Bridge the single mechanical gap identified below to earn verification.
            </p>
          </div>

          {/* Repair Directive */}
          <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl space-y-1.5">
            <span className="text-xs font-mono font-semibold text-rose-400 uppercase">Repair Directive:</span>
            <p className="text-sm font-medium text-zinc-100">
              &ldquo;{verdict.repairDirective || verdict.whatToFix}&rdquo;
            </p>
          </div>

          {repairFeedback && (
            <div className="p-3 bg-amber-950/40 border border-amber-900/50 rounded-lg text-xs text-amber-300 font-mono">
              {repairFeedback}
            </div>
          )}

          {/* Input */}
          <div className="space-y-2">
            <textarea
              value={repairInput}
              onChange={(e) => setRepairInput(e.target.value)}
              placeholder="State the missing link in 1-2 precise sentences..."
              rows={4}
              className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none transition-all font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStage('VERDICT')}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200"
            >
              Back to Verdict
            </button>
            <button
              onClick={handleSubmitRepair}
              disabled={!repairInput.trim()}
              className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-rose-950/40"
            >
              <span>Verify Repair with Local Model</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FINAL SUCCESS SCREEN */}
      {stage === 'FINAL_SUCCESS' && (
        <div className="bg-zinc-900 border border-emerald-900/60 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-zinc-100 font-sans">Understanding Verified</h2>
            <p className="text-sm text-zinc-400">
              You survived the adversarial counterexample and successfully repaired the cognitive vulnerability.
            </p>
            {repairFeedback && (
              <p className="text-xs font-mono text-emerald-400 bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/50 mt-3">
                {repairFeedback}
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => onCompleted({ ...concept, state: 'VERIFIED', lastVerifiedAt: Date.now() })}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
