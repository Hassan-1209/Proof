import { IAIProvider, ConceptExtractInput } from '../types';
import { ChallengeOutput, EvaluationVerdict } from '../../types';
import {
  PROMPT_SYSTEM_EVALUATOR,
  buildConceptExtractionPrompt,
  buildChallengePrompt,
  buildDefenseEvaluationPrompt,
  buildRepairEvaluationPrompt,
} from '../prompts';

export class OllamaProvider implements IAIProvider {
  id = 'ollama';
  name = 'Ollama Local Daemon (localhost:11434)';
  modelIdentifier = 'gemma2:latest';
  private endpoint = 'http://localhost:11434';

  setEndpoint(url: string) {
    this.endpoint = url;
  }

  setModel(model: string) {
    this.modelIdentifier = model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async initialize(onProgress?: (progress: { text: string; progress?: number }) => void): Promise<void> {
    onProgress?.({ text: 'Checking connection to local Ollama daemon...', progress: 20 });
    const ok = await this.isAvailable();
    if (!ok) {
      throw new Error(`Cannot reach Ollama at ${this.endpoint}. Make sure 'ollama serve' is running.`);
    }
    onProgress?.({ text: `Connected to Ollama. Using local model: ${this.modelIdentifier}`, progress: 100 });
  }

  private async generateJSON(prompt: string, systemPrompt = PROMPT_SYSTEM_EVALUATOR): Promise<any> {
    const res = await fetch(`${this.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelIdentifier,
        system: systemPrompt,
        prompt: prompt + '\nReturn ONLY a valid JSON object. No explanation.',
        format: 'json',
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama generation failed with HTTP status ${res.status}`);
    }

    const data = await res.json();
    try {
      const match = data.response.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : data.response);
    } catch (err) {
      throw new Error(`Failed to parse JSON response from Ollama: ${data.response}`);
    }
  }

  async extractConcepts(materialTitle: string, sourceText: string): Promise<ConceptExtractInput[]> {
    const prompt = buildConceptExtractionPrompt(materialTitle, sourceText);
    const data = await this.generateJSON(prompt);
    return data.concepts || [];
  }

  async generateChallenge(
    sourceExcerpt: string,
    conceptTitle: string,
    userExplanation: string
  ): Promise<ChallengeOutput> {
    const prompt = buildChallengePrompt(sourceExcerpt, conceptTitle, userExplanation);
    const data = await this.generateJSON(prompt);
    return {
      claimsIdentified: data.claimsIdentified || ['Explanation analyzed by local Ollama model'],
      omissions: data.omissions || [],
      hiddenAssumption: data.hiddenAssumption || 'Unstated operational assumption',
      challengeType: data.challengeType || 'counterexample',
      targetedWeakness: data.targetedWeakness || 'Key mechanism left unproven',
      counterexamplePrompt: data.counterexamplePrompt || 'Defend your explanation against edge cases.',
    };
  }

  async evaluateDefense(
    sourceExcerpt: string,
    conceptTitle: string,
    originalExplanation: string,
    challenge: string,
    defense: string
  ): Promise<EvaluationVerdict> {
    const prompt = buildDefenseEvaluationPrompt(sourceExcerpt, conceptTitle, originalExplanation, challenge, defense);
    const data = await this.generateJSON(prompt);
    return {
      verdict: data.verdict || 'NEEDS_REPAIR',
      groundedInSource: true,
      evidenceConfidence: data.verdict === 'VERIFIED' ? 'HIGH_EVIDENCE' : 'LIMITED_EVIDENCE',
      flawCategory: data.verdict === 'VERIFIED' ? 'SOUND_LOGIC' : 'MISSING_CAUSALITY',
      sourceGroundingQuote: sourceExcerpt.slice(0, 180),
      whatGotRight: data.whatGotRight || 'Recalled core high-level terms.',
      whatBroke: data.whatBroke || 'Failed to explain the causal mechanism under challenge.',
      whyItMatters: data.whyItMatters || 'Leaves you vulnerable during real technical evaluation.',
      whatToFix: data.whatToFix || 'Clarify the exact trigger condition.',
      repairDirective: data.repairDirective,
      counterexampleResolved: Boolean(data.counterexampleResolved),
    };
  }

  async evaluateRepair(
    sourceExcerpt: string,
    conceptTitle: string,
    originalWeakness: string,
    repairResponse: string
  ): Promise<{ passed: boolean; feedback: string }> {
    const prompt = buildRepairEvaluationPrompt(sourceExcerpt, conceptTitle, originalWeakness, repairResponse);
    const data = await this.generateJSON(prompt);
    return {
      passed: Boolean(data.passed),
      feedback: data.feedback || 'Repair evaluated.',
    };
  }
}
