import { IAIProvider } from './types';
import { LocalHeuristicEngine } from './providers/localEngine';
import { WebLLMProvider } from './providers/webllmProvider';
import { OllamaProvider } from './providers/ollamaProvider';
import { ModelRuntimeStatus, ProviderType } from '../types';

export class AIManager {
  private providers: Map<string, IAIProvider> = new Map();
  private activeProvider: IAIProvider;
  private statusListeners: Set<(status: ModelRuntimeStatus) => void> = new Set();

  private status: ModelRuntimeStatus = {
    type: 'local_heuristic',
    name: 'PROOF Local Evaluator (On-Device)',
    state: 'unloaded',
    progressText: 'Initializing local reasoning engine...',
    isWebGPUSupported: false,
    isOfflineCapable: true,
  };

  constructor() {
    const local = new LocalHeuristicEngine();
    const webllm = new WebLLMProvider();
    const ollama = new OllamaProvider();

    this.providers.set(local.id, local);
    this.providers.set(webllm.id, webllm);
    this.providers.set(ollama.id, ollama);

    this.activeProvider = local;
  }

  getStatus(): ModelRuntimeStatus {
    return { ...this.status };
  }

  subscribe(listener: (status: ModelRuntimeStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notify() {
    const s = this.getStatus();
    this.statusListeners.forEach((l) => l(s));
  }

  async checkWebGPUSupport(): Promise<boolean> {
    if (typeof navigator === 'undefined') return false;
    const hasGPU = 'gpu' in navigator && !!(navigator as any).gpu;
    this.status.isWebGPUSupported = hasGPU;
    this.notify();
    return hasGPU;
  }

  async setProvider(type: ProviderType): Promise<void> {
    const target = this.providers.get(type);
    if (!target) throw new Error(`Unknown provider: ${type}`);

    this.activeProvider = target;
    this.status.type = type;
    this.status.name = target.name;
    this.status.state = 'loading';
    this.status.progressText = `Switching to ${target.name}...`;
    this.status.progressPercent = 10;
    this.notify();

    try {
      await target.initialize((prog) => {
        this.status.progressText = prog.text;
        this.status.progressPercent = prog.progress;
        this.notify();
      });

      this.status.state = 'ready';
      this.status.progressPercent = 100;
      this.status.progressText = `Ready. Running 100% locally.`;
      this.status.errorDetails = undefined;
      this.notify();
    } catch (err: any) {
      console.warn(`Provider ${type} initialization failed:`, err);
      this.status.state = 'error';
      this.status.errorDetails = err.message || String(err);
      this.status.progressText = `Failed to initialize ${target.name}.`;
      this.notify();

      // Graceful fallback to local heuristic
      if (type !== 'local_heuristic') {
        console.info('Falling back safely to Local Heuristic Evaluator.');
        setTimeout(() => {
          this.setProvider('local_heuristic');
        }, 1500);
      }
    }
  }

  async initializeDefault(): Promise<void> {
    await this.checkWebGPUSupport();
    // Default to robust on-device local heuristic evaluator for instant readiness,
    // while giving user option in UI to upgrade to WebGPU Llama-3.2 / Gemma-2 or local Ollama.
    await this.setProvider('local_heuristic');
  }

  getProvider(): IAIProvider {
    return this.activeProvider;
  }
}

export const aiManager = new AIManager();
