import { Concept, ChallengeOutput, EvaluationVerdict } from '../types';

export interface ConceptExtractInput {
  title: string;
  definition: string;
  keyPrinciples: string[];
  sourceExcerpt: string;
}

export interface IAIProvider {
  id: string;
  name: string;
  modelIdentifier: string;
  isAvailable(): Promise<boolean>;
  initialize(onProgress?: (progress: { text: string; progress?: number }) => void): Promise<void>;
  extractConcepts(materialTitle: string, sourceText: string): Promise<ConceptExtractInput[]>;
  generateChallenge(
    sourceExcerpt: string,
    conceptTitle: string,
    userExplanation: string
  ): Promise<ChallengeOutput>;
  evaluateDefense(
    sourceExcerpt: string,
    conceptTitle: string,
    originalExplanation: string,
    challenge: string,
    defense: string
  ): Promise<EvaluationVerdict>;
  evaluateRepair(
    sourceExcerpt: string,
    conceptTitle: string,
    originalWeakness: string,
    repairResponse: string
  ): Promise<{ passed: boolean; feedback: string }>;
}
