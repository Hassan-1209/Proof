import React, { useState, useEffect } from 'react';
import { StudyMaterial, Concept, ProofSession, ModelRuntimeStatus } from './types';
import { storage } from './db/storage';
import { aiManager } from './ai/aiManager';
import { Header, ActiveTab } from './components/Header';
import { ModelStatusModal } from './components/ModelStatusModal';
import { DashboardView } from './features/dashboard/DashboardView';
import { ConceptsView } from './features/concepts/ConceptsView';
import { MaterialsView } from './features/materials/MaterialsView';
import { HistoryView } from './features/history/HistoryView';
import { ProveArenaView } from './features/prove/ProveArenaView';
import { RefreshCw, WifiOff, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [sessions, setSessions] = useState<ProofSession[]>([]);
  const [activeConceptToProve, setActiveConceptToProve] = useState<Concept | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelRuntimeStatus>(aiManager.getStatus());
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load persistent data
  const loadData = async () => {
    try {
      await storage.seedInitialDataIfEmpty();
      const [allMats, allConcepts, allSessions] = await Promise.all([
        storage.getAllMaterials(),
        storage.getAllConcepts(),
        storage.getAllSessions(),
      ]);
      setMaterials(allMats);
      setConcepts(allConcepts);
      setSessions(allSessions);
    } catch (err) {
      console.error('Failed to load local IndexedDB data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to AI runtime status
    const unsubscribe = aiManager.subscribe((status) => {
      setModelStatus(status);
    });

    // Initialize default local engine
    aiManager.initializeDefault();

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStartProve = (concept: Concept) => {
    setActiveConceptToProve(concept);
    setActiveTab('prove');
  };

  const handleProveCompleted = async (updatedConcept: Concept) => {
    await storage.saveConcept(updatedConcept);
    await loadData();
    setActiveConceptToProve(null);
    setActiveTab('dashboard');
  };

  const handleExitProve = async () => {
    await loadData();
    setActiveConceptToProve(null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveConceptToProve(null);
          setActiveTab(tab);
        }}
        status={modelStatus}
        onOpenModelModal={() => setIsModelModalOpen(true)}
      />

      {/* Model Engine Configuration Modal */}
      <ModelStatusModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        status={modelStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-zinc-400">Loading local IndexedDB vault...</span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                concepts={concepts}
                materials={materials}
                recentSessions={sessions}
                onStartProve={handleStartProve}
                onNavigateToMaterials={() => setActiveTab('materials')}
                onNavigateToConcepts={() => setActiveTab('concepts')}
              />
            )}

            {activeTab === 'concepts' && (
              <ConceptsView
                concepts={concepts}
                materials={materials}
                onStartProve={handleStartProve}
                onNavigateToMaterials={() => setActiveTab('materials')}
              />
            )}

            {activeTab === 'materials' && (
              <MaterialsView
                materials={materials}
                concepts={concepts}
                onRefreshData={loadData}
                onStartProve={handleStartProve}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                sessions={sessions}
                concepts={concepts}
                onStartProve={handleStartProve}
              />
            )}

            {activeTab === 'prove' && activeConceptToProve && (
              <ProveArenaView
                concept={activeConceptToProve}
                onBack={handleExitProve}
                onCompleted={handleProveCompleted}
              />
            )}
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-5 text-zinc-500 text-xs font-mono text-center px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 font-semibold">PROOF</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> On-Device Data Storage
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-zinc-400">
              <WifiOff className="w-3 h-3" /> Offline Evaluation Supported
            </span>
          </div>
          <div>
            Built for the &ldquo;Build for a Friend&rdquo; Challenge • Open-Weight &amp; Local Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
