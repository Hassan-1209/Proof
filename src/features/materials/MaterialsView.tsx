import React, { useState } from 'react';
import { StudyMaterial, Concept } from '../../types';
import { storage } from '../../db/storage';
import { aiManager } from '../../ai/aiManager';
import { BookOpen, Plus, Trash2, ArrowRight, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  materials: StudyMaterial[];
  concepts: Concept[];
  onRefreshData: () => Promise<void>;
  onStartProve: (concept: Concept) => void;
}

export const MaterialsView: React.FC<Props> = ({
  materials,
  concepts,
  onRefreshData,
  onStartProve,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    setSource(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setContent(text);
    };
    reader.readAsText(file);
  };

  const handleSaveAndExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsExtracting(true);
    setExtractStatus('Saving study notes into local IndexedDB...');
    setErrorMsg(null);

    try {
      const materialId = 'mat-' + Date.now();
      const newMaterial: StudyMaterial = {
        id: materialId,
        title: title.trim(),
        source: source.trim() || 'Pasted Notes',
        content: content.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await storage.saveMaterial(newMaterial);

      setExtractStatus('Local open-weight model extracting testable concepts...');
      const provider = aiManager.getProvider();
      const extracted = await provider.extractConcepts(newMaterial.title, newMaterial.content);

      if (extracted.length === 0) {
        throw new Error('No conceptual units could be extracted from this text. Ensure text contains descriptive paragraphs.');
      }

      const newConcepts: Concept[] = extracted.map((ex, idx) => ({
        id: `concept-${materialId}-${idx}`,
        materialId,
        title: ex.title,
        definition: ex.definition,
        keyPrinciples: ex.keyPrinciples,
        sourceExcerpt: ex.sourceExcerpt || content.slice(0, 300),
        state: 'UNSEEN',
        attemptsCount: 0,
        createdAt: Date.now(),
      }));

      await storage.saveConcepts(newConcepts);
      await onRefreshData();

      // Reset form
      setTitle('');
      setSource('');
      setContent('');
      setIsAdding(false);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMsg(err.message || 'Failed to extract concepts from material.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDeleteMaterial = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this study chapter and all its associated concepts?')) return;
    await storage.deleteMaterial(id);
    await onRefreshData();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-sans flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <span>Study Notes & Ingestion</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Store raw lecture notes or textbook chapters. PROOF decomposes them locally into adversarial verification targets.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Study Notes</span>
          </button>
        )}
      </div>

      {/* Add Material Form */}
      {isAdding && (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-100 text-base">Import Notes into Local Vault</h2>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveAndExtract} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                  Topic / Chapter Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus (Raft / Paxos)"
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-emerald-500/80"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                  Source Reference (Optional)
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Lecture 4 Slides / Paper Excerpt"
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-emerald-500/80"
                />
              </div>
            </div>

            {/* Quick File Drop */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Upload Plain Text / Markdown File (.txt, .md)
              </label>
              <input
                type="file"
                accept=".txt,.md,.markdown"
                onChange={handleFileUpload}
                className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
              />
            </div>

            {/* Paste Content */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Content / Notes Body *
              </label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the core concepts, definitions, and operational mechanisms here..."
                rows={8}
                className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-emerald-500/80 font-mono text-xs leading-relaxed"
              />
              <span className="text-[11px] font-mono text-zinc-500">
                {content.length} characters (100% stored in client IndexedDB; never uploaded to cloud)
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300 font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isExtracting || !title.trim() || !content.trim()}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{extractStatus}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Extract Concepts with Open AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Materials List */}
      <div className="grid gap-4">
        {materials.map((mat) => {
          const matConcepts = concepts.filter((c) => c.materialId === mat.id);
          const verifiedCount = matConcepts.filter((c) => c.state === 'VERIFIED').length;
          const repairCount = matConcepts.filter((c) => c.state === 'NEEDS_REPAIR').length;

          return (
            <div
              key={mat.id}
              className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-4 hover:border-zinc-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-100 text-base">{mat.title}</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {mat.source}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    {matConcepts.length} concepts extracted • {verifiedCount} verified • {repairCount} need repair
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteMaterial(mat.id, e)}
                    className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Delete material and its concepts"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Concepts preview pill bar */}
              <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-mono text-zinc-500">Concepts:</span>
                {matConcepts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onStartProve(c)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono border flex items-center gap-1.5 transition-all ${
                      c.state === 'VERIFIED'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                        : c.state === 'NEEDS_REPAIR'
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    <span>{c.title}</span>
                    <ArrowRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
