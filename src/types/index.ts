export type ConceptState = 
  | 'UNSEEN' 
  | 'INTRODUCED' 
  | 'PRACTICED' 
  | 'NEEDS_REPAIR' 
  | 'PARTIALLY_VERIFIED' 
  | 'VERIFIED' 
  | 'STALE';

export interface StudyMaterial {
  id: string;
  title: string;
  source: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Concept {
  id: string;
  materialId: string;
  title: string;
  definition: string;
  keyPrinciples: string[];
  sourceExcerpt: string;
  state: ConceptState;
  attemptsCount: number;
  lastVerifiedAt?: number;
  detectedWeakness?: string;
  createdAt: number;
}

export interface ChallengeOutput {
  claimsIdentified: string[];
  omissions: string[];
  hiddenAssumption: string;
  challengeType: 'counterexample' | 'edge_case' | 'cause_reversal' | 'scenario';
  counterexamplePrompt: string;
  targetedWeakness: string;
  isOffTopic?: boolean;
}

export interface EvaluationVerdict {
  verdict: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_REPAIR';
  groundedInSource: boolean;
  evidenceConfidence: 'HIGH_EVIDENCE' | 'LIMITED_EVIDENCE' | 'UNCERTAIN';
  flawCategory: 'MISCONCEPTION' | 'MISSING_CAUSALITY' | 'SUPERFICIAL_SUMMARY' | 'OFF_TOPIC' | 'SOUND_LOGIC';
  sourceGroundingQuote?: string;
  whatGotRight: string;
  whatBroke: string;
  whyItMatters: string;
  whatToFix: string;
  repairDirective?: string;
  counterexampleResolved: boolean;
}

export interface ProofSession {
  id: string;
  conceptId: string;
  conceptTitle: string;
  materialId: string;
  originalExplanation: string;
  claimsIdentified: string[];
  challengePrompt: string;
  challengeType: string;
  targetedWeakness: string;
  defenseText?: string;
  verdict?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_REPAIR';
  whatGotRight?: string;
  whatBroke?: string;
  whyItMatters?: string;
  whatToFix?: string;
  repairDirective?: string;
  repairResponse?: string;
  retestVerdict?: 'VERIFIED' | 'NEEDS_REPAIR';
  timestamp: number;
  completedAt?: number;
}

export type ProviderType = 'webllm' | 'ollama' | 'local_heuristic';

export interface ModelRuntimeStatus {
  type: ProviderType;
  name: string;
  state: 'unloaded' | 'loading' | 'ready' | 'error';
  progressText?: string;
  progressPercent?: number;
  errorDetails?: string;
  isWebGPUSupported: boolean;
  isOfflineCapable: boolean;
}
