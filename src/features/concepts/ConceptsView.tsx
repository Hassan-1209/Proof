import React, { useState } from 'react';
import { Concept, StudyMaterial, ConceptState } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { getEffectiveConceptState } from './stateMachine';
import { Search, Filter, Play, Flame, CheckCircle2, AlertTriangle, Layers, BookOpen, Clock } from 'lucide-react';

interface Props {
  concepts: Concept[];
  materials: StudyMaterial[];
  onStartProve: (concept: Concept) => void;
  onNavigateToMaterials: () => void;
}

export const ConceptsView: React.FC<Props> = ({
  concepts,
  materials,
  onStartProve,
  onNavigateToMaterials,
}) => {
  const [filterState, setFilterState] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('ALL');

  const filtered = concepts
    .map((c) => ({ ...c, effectiveState: getEffectiveConceptState(c) }))
    .filter((c) => {
      if (filterState !== 'ALL' && c.effectiveState !== filterState) return false;
      if (selectedMaterialId !== 'ALL' && c.materialId !== selectedMaterialId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.definition.toLowerCase().includes(q) ||
          (c.detectedWeakness && c.detectedWeakness.toLowerCase().includes(q))
        );
      }
      return true;
    });

  const getMaterialTitle = (id: string) => {
    return materials.find((m) => m.id === id)?.title || 'Custom Notes';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-sans flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>Concept Ledger & Map</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Every testable conceptual unit extracted from your notes, categorized by empirical verification state.
          </p>
        </div>

        <button
          onClick={onNavigateToMaterials}
          className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 self-start sm:self-auto transition-colors border border-zinc-700"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Import Study Material</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts or caught flaws..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/80"
          />
        </div>

        {/* State Filter */}
        <div className="sm:col-span-3">
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="w-full py-1.5 px-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-emerald-500/80 font-mono"
          >
            <option value="ALL">All States ({concepts.length})</option>
            <option value="NEEDS_REPAIR">Needs Repair</option>
            <option value="UNSEEN">Untested / Ready</option>
            <option value="VERIFIED">Verified</option>
            <option value="PARTIALLY_VERIFIED">Partially Verified</option>
            <option value="STALE">Stale (&gt;5 Days)</option>
          </select>
        </div>

        {/* Material Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="w-full py-1.5 px-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-emerald-500/80 font-mono"
          >
            <option value="ALL">All Source Notes</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title.slice(0, 24)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Concept Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="text-zinc-300 font-medium text-sm">No concepts matching filter</div>
          <p className="text-xs text-zinc-500">Try changing your search terms or import a new study chapter.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((concept) => (
            <div
              key={concept.id}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 transition-all ${
                concept.effectiveState === 'NEEDS_REPAIR'
                  ? 'bg-rose-950/15 border-rose-900/50 hover:border-rose-700/60'
                  : concept.effectiveState === 'VERIFIED'
                  ? 'bg-zinc-900/70 border-emerald-900/40 hover:border-emerald-700/50'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      {getMaterialTitle(concept.materialId)}
                    </span>
                    <h3 className="font-semibold text-zinc-100 text-base mt-0.5">{concept.title}</h3>
                  </div>
                  <StatusBadge state={concept.effectiveState} />
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{concept.definition}</p>

                {/* Caught Weakness Banner */}
                {concept.detectedWeakness && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/40 text-xs text-rose-300 font-mono flex items-start gap-2">
                    <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-400">Caught Flaw:</span> {concept.detectedWeakness}
                    </div>
                  </div>
                )}

                {/* Key Principles */}
                {concept.keyPrinciples && concept.keyPrinciples.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Causal Conditions:</span>
                    <ul className="text-xs text-zinc-400 list-disc list-inside space-y-0.5 pl-1">
                      {concept.keyPrinciples.slice(0, 3).map((p, idx) => (
                        <li key={idx} className="line-clamp-1">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <div className="text-[11px] font-mono text-zinc-500">
                  {concept.attemptsCount === 0 ? 'Not yet tested' : `${concept.attemptsCount} attempts`}
                </div>

                <button
                  onClick={() => onStartProve(concept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    concept.effectiveState === 'NEEDS_REPAIR'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                  }`}
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>{concept.effectiveState === 'NEEDS_REPAIR' ? 'Repair' : 'Prove It'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
