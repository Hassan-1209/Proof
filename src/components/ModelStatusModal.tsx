import React, { useState } from 'react';
import { ModelRuntimeStatus, ProviderType } from '../types';
import { aiManager } from '../ai/aiManager';
import { ShieldCheck, Cpu, HardDrive, WifiOff, AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: ModelRuntimeStatus;
}

export const ModelStatusModal: React.FC<Props> = ({ isOpen, onClose, status }) => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>(status.type);
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (selectedProvider === status.type) {
      onClose();
      return;
    }
    setIsSwitching(true);
    try {
      await aiManager.setProvider(selectedProvider);
    } finally {
      setIsSwitching(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-zinc-100">Local Open-Weight Intelligence</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {/* Active status card */}
          <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono text-zinc-400 tracking-wider">Active Engine</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {status.state.toUpperCase()}
              </span>
            </div>
            <div className="font-medium text-zinc-200 text-base">{status.name}</div>
            <p className="text-xs text-zinc-400 font-mono">{status.progressText}</p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                <WifiOff className="w-3.5 h-3.5 text-emerald-400" /> Offline Evaluation Supported
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> On-Device Processing
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Local IndexedDB Storage
              </span>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Select Evaluation Engine & Model Path
            </label>

            {/* Option 1: Local Heuristic Evaluator */}
            <label
              className={`block p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedProvider === 'local_heuristic'
                  ? 'border-emerald-500/80 bg-emerald-950/20'
                  : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="provider"
                  value="local_heuristic"
                  checked={selectedProvider === 'local_heuristic'}
                  onChange={() => setSelectedProvider('local_heuristic')}
                  className="mt-1 accent-emerald-500"
                />
                <div>
                  <div className="font-medium text-zinc-200 flex items-center gap-2">
                    Deterministic Local Fallback
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Standard Default
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Deterministic local reasoning/evaluation fallback. Runs client-side claim parsing, term extraction, and ground-truth boundary checks. Zero network calls, zero GPU requirements, and zero model download needed.
                  </p>
                </div>
              </div>
            </label>

            {/* Option 2: WebLLM */}
            <label
              className={`block p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedProvider === 'webllm'
                  ? 'border-emerald-500/80 bg-emerald-950/20'
                  : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="provider"
                  value="webllm"
                  checked={selectedProvider === 'webllm'}
                  onChange={() => setSelectedProvider('webllm')}
                  className="mt-1 accent-emerald-500"
                />
                <div>
                  <div className="font-medium text-zinc-200 flex items-center gap-2">
                    WebLLM — Open-Weight Llama 3.2 1B (In-Browser)
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      WebGPU Open-Weight
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Generative open-weight model running locally in the browser via WebGPU. Downloads model weights to CacheStorage on first setup; runs offline once cached.
                  </p>
                  {!status.isWebGPUSupported && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      WebGPU is not detected on this browser session.
                    </div>
                  )}
                </div>
              </div>
            </label>

            {/* Option 3: Ollama */}
            <label
              className={`block p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedProvider === 'ollama'
                  ? 'border-emerald-500/80 bg-emerald-950/20'
                  : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="provider"
                  value="ollama"
                  checked={selectedProvider === 'ollama'}
                  onChange={() => setSelectedProvider('ollama')}
                  className="mt-1 accent-emerald-500"
                />
                <div>
                  <div className="font-medium text-zinc-200 flex items-center gap-2">
                    Ollama Local Bridge
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      localhost:11434
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Connects directly to your desktop's local Ollama instance running Gemma 2 9B, Qwen 2.5 7B, or Llama 3.2.
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isSwitching}
            className="px-4 py-1.5 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSwitching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Initializing...
              </>
            ) : (
              'Apply Engine'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
