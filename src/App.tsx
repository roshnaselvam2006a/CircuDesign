import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { ApprovalPage } from './components/ApprovalPage';
import { PipelineCanvas } from './components/PipelineCanvas';
import { ResultsDashboard } from './components/ResultsDashboard';
import { HumanInTheLoopModal } from './components/HumanInTheLoopModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SdgImpactFooter } from './components/SdgImpactFooter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { SAMPLE_BOMS } from './data/sampleBoms';
import { PipelineRun, AgentLog, BOMItem, ParsedCADModel } from './types';

function MainApp() {
  const { currentUser, logout } = useAuth();

  const [activeBom, setActiveBom] = useState<{ name: string; items: BOMItem[] }>({
    name: SAMPLE_BOMS[0].name,
    items: SAMPLE_BOMS[0].items
  });

  const [currentRun, setCurrentRun] = useState<PipelineRun | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'auth' | 'dashboard' | 'pipeline' | 'results' | 'approval'>('landing');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showHumanGate, setShowHumanGate] = useState(false);
  const [cadModel, setCadModel] = useState<ParsedCADModel | null>(null);

  // Auto-switch to dashboard on auth change if on auth page
  useEffect(() => {
    if (currentUser && viewMode === 'auth') {
      setViewMode('dashboard');
    }
  }, [currentUser]);

  // Load user history from Firestore (or fallback to backend API) on auth change
  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const fetchHistory = async () => {
    try {
      if (currentUser && !currentUser.isAnonymous) {
        // Query user's private Firestore subcollection: users/{uid}/runs
        const runsRef = collection(db, 'users', currentUser.uid, 'runs');
        const q = query(runsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const userRuns: PipelineRun[] = snapshot.docs.map(doc => doc.data() as PipelineRun);
        setRuns(userRuns);
      } else {
        const uid = currentUser ? currentUser.uid : 'guest-session';
        const res = await fetch(`/api/runs?userUid=${uid}`);
        const data = await res.json();
        if (data && data.runs) {
          setRuns(data.runs);
        }
      }
    } catch (err) {
      console.warn('Could not fetch run history from Firestore/API:', err);
    }
  };

  const handleSelectSampleBOM = (bom: typeof SAMPLE_BOMS[0]) => {
    setActiveBom({ name: bom.name, items: bom.items });
    setCurrentRun(null);
    setLogs([]);
    setCadModel(null);
    setViewMode('pipeline');
  };

  const handleCustomFileUpload = (items: BOMItem[], fileName: string) => {
    setActiveBom({ name: fileName, items });
    setCurrentRun(null);
    setLogs([]);
    if (!/\.(step|stp)$/i.test(fileName)) setCadModel(null);
    setViewMode('pipeline');
  };

  const handleCADModelLoaded = (model: ParsedCADModel) => {
    setCadModel(model);
  };

  const addLog = (agentId: 'bom' | 'material' | 'structural' | 'lifecycle' | 'orchestrator', agentName: string, message: string, details?: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        agentId,
        agentName,
        timestamp: new Date().toISOString(),
        status: 'processing',
        message,
        details
      }
    ]);
  };

  const runPipeline = async () => {
    setIsProcessing(true);
    setViewMode('pipeline');
    setLogs([]);
    setCurrentRun(null);

    setCurrentAgentId('bom');
    addLog('bom', '1. BOM Deconstruction Agent', 'Validating and analyzing the submitted bill of materials...');
    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: activeBom.items,
          bomName: activeBom.name,
          userUid: currentUser?.uid || 'guest-session'
        })
      });

      const data = await response.json();
      if (!response.ok || !data?.success || !data.run) {
        throw new Error(data?.error || `Pipeline request failed (${response.status})`);
      }
      if (data && data.success && data.run) {
        const runRecord: PipelineRun = data.run;
        setCurrentRun(runRecord);

        const outputs = runRecord.agentOutputs;
        addLog('material', '2. Material Science Agent', `Researched alternatives for ${Object.keys(outputs.materialScience?.proposedSwaps || {}).length} BOM part(s).`);
        addLog('structural', '3. Structural Integrity Agent', outputs.structuralIntegrity?.overallStatus === 'failed_needs_swap'
          ? 'One or more substitutions remain below the structural threshold after checking available alternatives.'
          : `Validated substitutions. Structural status: ${outputs.structuralIntegrity?.overallStatus || 'unknown'}.`);
        addLog('lifecycle', '4. Circular Lifecycle Agent', `Calculated lifecycle impact: ${runRecord.carbonSavedPercent}% carbon reduction and ${runRecord.recyclabilityScore}% recyclability.`);
        addLog('orchestrator', '5. Orchestrator Agent', outputs.orchestrator?.finalVerdict || 'Pipeline complete.');

        // Save run directly to user's private Firestore subcollection: users/{uid}/runs/{runId}
        if (currentUser && !currentUser.isAnonymous) {
          try {
            await setDoc(doc(db, 'users', currentUser.uid, 'runs', runRecord.id), runRecord);
          } catch (fsErr) {
            console.warn('Could not persist run to Firestore:', fsErr);
          }
        }

        fetchHistory();

        if (data.run.agentOutputs?.orchestrator?.humanGateRequired) {
          setViewMode('approval'); // HARD HALT: Direct to approval screen
        } else {
          setViewMode('results');
        }
      }
    } catch (error) {
      console.error('Error running pipeline:', error);
      addLog('orchestrator', '5. Orchestrator Agent', error instanceof Error ? `Pipeline failed: ${error.message}` : 'Pipeline failed. Please retry.');
    } finally {
      setIsProcessing(false);
      setCurrentAgentId(null);
    }
  };

  const handleApproveSwap = (partId: string) => {
    if (!currentRun) return;
    const flagged = currentRun.agentOutputs?.orchestrator?.flaggedSwaps || [];
    const remaining = flagged.filter(f => f.partId !== partId);
    if (remaining.length === 0) {
      setShowHumanGate(false);
      setViewMode('results');
    }
  };

  const handleApproveAllSwaps = () => {
    setViewMode('results');
  };

  const handleRejectAllSwaps = () => {
    setViewMode('dashboard');
    setCurrentRun(null);
  };

  const handleDeleteRun = async (id: string) => {
    try {
      if (currentUser && !currentUser.isAnonymous) {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'runs', id));
      } else {
        const uid = currentUser ? currentUser.uid : 'guest-session';
        await fetch(`/api/runs/${id}?userUid=${uid}`, { method: 'DELETE' });
      }
      fetchHistory();
    } catch (err) {
      console.warn('Could not delete run:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B1220] text-slate-100">
      {/* Top Navbar */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={() => {
          if (currentUser) {
            setViewMode('dashboard');
          } else {
            setViewMode('landing');
          }
          setCurrentRun(null);
          setCadModel(null);
        }}
        activeRunTitle={activeBom.name}
        isProcessing={isProcessing}
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {viewMode === 'landing' && (
          <LandingHero onGetStarted={() => setViewMode(currentUser ? 'dashboard' : 'auth')} />
        )}

        {viewMode === 'auth' && (
          <AuthPage
            onSuccess={() => setViewMode('dashboard')}
            onBackToLanding={() => setViewMode('landing')}
          />
        )}

        {viewMode === 'dashboard' && (
          <ProtectedRoute fallback={<AuthPage onSuccess={() => setViewMode('dashboard')} onBackToLanding={() => setViewMode('landing')} />}>
            <Dashboard
              onSelectSampleBOM={handleSelectSampleBOM}
              onCustomFileUpload={handleCustomFileUpload}
              onCADModelLoaded={handleCADModelLoaded}
            />
          </ProtectedRoute>
        )}

        {viewMode === 'approval' && currentRun && (
          <ProtectedRoute fallback={<AuthPage onSuccess={() => setViewMode('dashboard')} onBackToLanding={() => setViewMode('landing')} />}>
            <ApprovalPage
              flaggedSwaps={currentRun.agentOutputs?.orchestrator?.flaggedSwaps || []}
              onApproveAll={handleApproveAllSwaps}
              onRejectAll={handleRejectAllSwaps}
              onApproveSwap={handleApproveSwap}
              runTitle={activeBom.name}
              userName={currentUser?.displayName || (currentUser?.isAnonymous ? 'Guest Engineer' : 'Lead Engineer')}
            />
          </ProtectedRoute>
        )}

        {viewMode === 'pipeline' && (
          <ProtectedRoute fallback={<AuthPage onSuccess={() => setViewMode('dashboard')} onBackToLanding={() => setViewMode('landing')} />}>
            <PipelineCanvas
              outputs={currentRun ? currentRun.agentOutputs : null}
              logs={logs}
              isProcessing={isProcessing}
              currentAgentId={currentAgentId}
              onTriggerRun={runPipeline}
              onTriggerHumanGate={() => setViewMode('approval')}
            />
          </ProtectedRoute>
        )}

        {viewMode === 'results' && currentRun && (
          <ProtectedRoute fallback={<AuthPage onSuccess={() => setViewMode('dashboard')} onBackToLanding={() => setViewMode('landing')} />}>
            <ResultsDashboard
              key={currentRun.id}
              run={currentRun}
              onRunNewPipeline={() => setViewMode('dashboard')}
              cadModel={cadModel}
            />
          </ProtectedRoute>
        )}

        {/* SDG Impact Footer Panel */}
        {(viewMode === 'pipeline' || viewMode === 'results') && (
          <SdgImpactFooter
            carbonSavedKg={currentRun ? currentRun.carbonSavedKg : 14.2}
            carbonSavedPercent={currentRun ? currentRun.carbonSavedPercent : 38}
            recyclabilityPercent={currentRun ? currentRun.recyclabilityScore : 88}
            disassemblyScore={currentRun ? currentRun.disassemblyScore : 85}
          />
        )}
      </main>

      {/* Human-in-the-Loop Safety Modal */}
      {showHumanGate && currentRun && (
        <HumanInTheLoopModal
          flaggedSwaps={currentRun.agentOutputs?.orchestrator?.flaggedSwaps || []}
          onApproveSwap={handleApproveSwap}
          onRejectSwap={handleApproveSwap}
          onApproveAll={handleApproveAllSwaps}
          onClose={() => {
            setShowHumanGate(false);
            setViewMode('results');
          }}
        />
      )}

      {/* History Side Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        runs={runs}
        onSelectRun={(run) => {
          setCurrentRun(run);
          setCadModel(null);
          setViewMode('results');
        }}
        onDeleteRun={handleDeleteRun}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
