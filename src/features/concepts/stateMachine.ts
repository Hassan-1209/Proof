import { Concept, ConceptState, EvaluationVerdict } from '../../types';

export const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export function getEffectiveConceptState(concept: Concept): ConceptState {
  if (concept.state === 'VERIFIED' && concept.lastVerifiedAt) {
    if (Date.now() - concept.lastVerifiedAt > FIVE_DAYS_MS) {
      return 'STALE';
    }
  }
  return concept.state;
}

export function computeNextStateFromVerdict(
  currentState: ConceptState,
  verdict: EvaluationVerdict
): { nextState: ConceptState; detectedWeakness?: string } {
  if (verdict.verdict === 'VERIFIED') {
    return {
      nextState: 'VERIFIED',
      detectedWeakness: undefined,
    };
  }

  if (verdict.verdict === 'PARTIALLY_VERIFIED') {
    return {
      nextState: 'PARTIALLY_VERIFIED',
      detectedWeakness: verdict.whatBroke || 'Incomplete causal boundary condition.',
    };
  }

  // NEEDS_REPAIR
  return {
    nextState: 'NEEDS_REPAIR',
    detectedWeakness: verdict.whatBroke || 'Critical misconception or circular explanation.',
  };
}

export function getStatusBadgeInfo(state: ConceptState): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
} {
  switch (state) {
    case 'VERIFIED':
      return {
        label: 'VERIFIED',
        bgClass: 'bg-emerald-950/40',
        textClass: 'text-emerald-400',
        borderClass: 'border-emerald-800/60',
        dotClass: 'bg-emerald-400',
      };
    case 'PARTIALLY_VERIFIED':
      return {
        label: 'PARTIALLY VERIFIED',
        bgClass: 'bg-amber-950/30',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-700/50',
        dotClass: 'bg-amber-400',
      };
    case 'NEEDS_REPAIR':
      return {
        label: 'NEEDS REPAIR',
        bgClass: 'bg-rose-950/40',
        textClass: 'text-rose-400',
        borderClass: 'border-rose-800/60',
        dotClass: 'bg-rose-400 animate-pulse',
      };
    case 'PRACTICED':
      return {
        label: 'PRACTICED',
        bgClass: 'bg-blue-950/40',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-800/50',
        dotClass: 'bg-blue-400',
      };
    case 'INTRODUCED':
      return {
        label: 'INTRODUCED',
        bgClass: 'bg-indigo-950/40',
        textClass: 'text-indigo-300',
        borderClass: 'border-indigo-800/40',
        dotClass: 'bg-indigo-400',
      };
    case 'STALE':
      return {
        label: 'STALE (>5 DAYS)',
        bgClass: 'bg-zinc-800/60',
        textClass: 'text-zinc-400',
        borderClass: 'border-zinc-700',
        dotClass: 'bg-zinc-500',
      };
    case 'UNSEEN':
    default:
      return {
        label: 'UNTESTED',
        bgClass: 'bg-zinc-900',
        textClass: 'text-zinc-400',
        borderClass: 'border-zinc-800',
        dotClass: 'bg-zinc-600',
      };
  }
}
