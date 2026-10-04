import { IAIProvider, ConceptExtractInput } from '../types';
import { ChallengeOutput, EvaluationVerdict } from '../../types';
import {
  PROMPT_SYSTEM_EVALUATOR,
  buildConceptExtractionPrompt,
  buildChallengePrompt,
  buildDefenseEvaluationPrompt,
  buildRepairEvaluationPrompt,
} from '../prompts';

export class WebLLMProvider implements IAIProvider {
  id = 'webllm';
  name = 'WebLLM (In-Browser WebGPU)';
  modelIdentifier = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
  private engine: any = null;
  private isLoaded = false;

  async isAvailable(): Promise<boolean> {
    if (typeof navigator === 'undefined') return false;
    // Check WebGPU availability
    return 'gpu' in navigator && !!(navigator as any).gpu;
  }

  async initialize(onProgress?: (progress: { text: string; progress?: number }) => void): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('WebGPU is not supported or enabled in this browser environment.');
    }

    try {
      onProgress?.({ text: 'Importing WebLLM WebGPU engine...', progress: 10 });
      const webllm = await import('@mlc-ai/web-llm');
      
      onProgress?.({ text: `Downloading ${this.modelIdentifier} into local cache...`, progress: 25 });
      
      this.engine = await webllm.CreateMLCEngine(this.modelIdentifier, {
        initProgressCallback: (report: any) => {
          const percent = report.progress ? Math.round(report.progress * 100) : undefined;
          onProgress?.({
            text: report.text || 'Loading local open-weight model...',
            progress: percent,
          });
        },
      });

      this.isLoaded = true;
      onProgress?.({ text: `${this.modelIdentifier} ready in local GPU memory.`, progress: 100 });
    } catch (err: any) {
      this.isLoaded = false;
      throw new Error(`Failed to initialize WebLLM: ${err.message || String(err)}`);
    }
  }

  private async generateJSON(prompt: string, systemPrompt = PROMPT_SYSTEM_EVALUATOR): Promise<any> {
    if (!this.engine || !this.isLoaded) {
      throw new Error('WebLLM engine is not initialized.');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const reply = await this.engine.chat.completions.create({
      messages,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = reply.choices[0]?.message?.content || '{}';
    try {
      // Find JSON block if wrapped
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.warn('JSON parse error from WebLLM:', e, content);
      throw new Error('Model produced non-JSON output. Retrying or falling back.');
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
      claimsIdentified: data.claimsIdentified || ['Explanation analyzed by local model'],
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
