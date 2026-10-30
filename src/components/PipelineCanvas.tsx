import React, { useState } from 'react';
import { Cpu, Atom, ShieldCheck, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, ArrowDown, ChevronRight, Terminal, Layers } from 'lucide-react';
import { AgentLog, AgentOutputs } from '../types';

interface PipelineCanvasProps {
  outputs: AgentOutputs | null;
  logs: AgentLog[];
  isProcessing: boolean;
  currentAgentId: string | null;
  onTriggerRun: () => void;
  onTriggerHumanGate?: () => void;
}

export const PipelineCanvas: React.FC<PipelineCanvasProps> = ({
  outputs,
  logs,
  isProcessing,
  currentAgentId,
  onTriggerRun,
  onTriggerHumanGate
}) => {
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  const agents = [
    {
      id: 'bom',
      name: 'BOM Deconstruction',
      role: 'Parses raw Bill of Materials structure and attributes.',
      icon: Layers,
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-cyan-500/30',
      activeColor: 'glass-panel-active',
      dataKey: 'bomDeconstruction'
    },
    {
      id: 'material',
      name: 'Material Science Research',
      role: 'Identifies sustainable bio-based and recycled alternatives.',
      icon: Atom,
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30',
      activeColor: 'glass-panel-active',
      dataKey: 'materialScience'
    },
    {
      id: 'structural',
      name: 'Structural Integrity Verification',
      role: 'Calculates yield stress safety margins.',
      icon: ShieldCheck,
      color: 'from-blue-600/20 to-indigo-500/20',
      borderColor: 'border-blue-500/30',
      activeColor: 'glass-panel-active',
      dataKey: 'structuralIntegrity'
    },
    {
      id: 'lifecycle',
      name: 'Circular Lifecycle Evaluation',
      role: 'Calculates recyclability and disassembly scores.',
      icon: RefreshCw,
      color: 'from-teal-500/20 to-emerald-600/20',
      borderColor: 'border-teal-500/30',
      activeColor: 'glass-panel-active',
      dataKey: 'circularLifecycle'
    },
    {
      id: 'orchestrator',
      name: 'Orchestrator Synthesis',
      role: 'Verifies constraint quadrants and triggers engineering approval.',
      icon: Cpu,
      color: 'from-amber-500/20 to-emerald-500/20',
      borderColor: 'border-amber-500/30',
      activeColor: 'glass-panel-active',
      dataKey: 'orchestrator'
    }
  ];

  return (
    <div className="relative w-full space-y-6">
      {/* Canvas Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">
              Multi-Agent Optimization Pipeline
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 border border-white/10"
          >
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span>Agent Logs ({logs.length})</span>
          </button>

          <button
            onClick={onTriggerRun}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Run Agent Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Pipeline Agents List */}
      <div className="relative space-y-4">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const isActive = currentAgentId === agent.id;
          const agentData = outputs ? (outputs as any)[agent.dataKey] : null;
          const isDone = Boolean(agentData);

          return (
            <React.Fragment key={agent.id}>
              {/* Agent Liquid Glass Panel */}
              <div
                className={`relative rounded-2xl p-5 border transition-all duration-500 ${
                  isActive
                    ? 'glass-panel-active scale-[1.01]'
                    : isDone
                    ? 'glass-panel border-emerald-500/30'
                    : 'glass-panel opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${agent.color} border border-white/10 text-emerald-300 shrink-0`}>
                      <Icon className={`h-6 w-6 ${isActive ? 'animate-bounce text-emerald-400' : ''}`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold text-white">
                          {agent.name}
                        </h4>
                        {isDone && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Completed
                          </span>
                        )}
                        {isActive && (
                          <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                            Reasoning...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        {agent.role}
                      </p>
                    </div>
                  </div>

                  {/* Agent Summary Snippet */}
                  {agentData && (
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-slate-300 sm:max-w-xs w-full">
                      {agent.id === 'bom' && (
                        <div>
                          <span className="font-semibold text-emerald-400">{agentData.totalParts} Parts Parsed</span>
                          <p className="text-[11px] text-slate-400">Baseline Carbon: {agentData.baselineCarbonKgCO2} kg CO2e</p>
                        </div>
                      )}
                      {agent.id === 'material' && (
                        <div>
                          <span className="font-semibold text-emerald-400">+{agentData.totalBioBasedIncreasePercent}% Bio-Based Resins</span>
                          <p className="text-[11px] text-slate-400">RAG DB Matched</p>
                        </div>
                      )}
                      {agent.id === 'structural' && (
                        <div>
                          <span className={`font-semibold ${agentData.overallStatus === 'passed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            Status: {agentData.overallStatus}
                          </span>
                          <p className="text-[11px] text-slate-400">Safety Margins Checked</p>
                        </div>
                      )}
                      {agent.id === 'lifecycle' && (
                        <div>
                          <span className="font-semibold text-emerald-400">-{agentData.carbonSavingsPercent}% Carbon CO2e</span>
                          <p className="text-[11px] text-slate-400">Recyclability: {agentData.recyclabilityPercent}%</p>
                        </div>
                      )}
                      {agent.id === 'orchestrator' && (
                        <div>
                          <span className={`font-semibold ${agentData.humanGateRequired ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {agentData.finalVerdict}
                          </span>
                          {agentData.humanGateRequired && onTriggerHumanGate && (
                            <button
                              onClick={onTriggerHumanGate}
                              className="mt-1 block text-[10px] font-bold text-amber-300 underline"
                            >
                              Review {agentData.flaggedSwaps?.length} Flagged Swap(s)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Animated Connector Line between agents */}
              {index < agents.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ArrowDown className={`h-4 w-4 ${isActive ? 'text-emerald-400 animate-bounce' : 'text-slate-600'}`} />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Expandable Agent System Log Drawer */}
      {showLogDrawer && (
        <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3 bg-slate-950/90 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 text-slate-400">
            <span className="font-bold flex items-center gap-1.5 text-cyan-400">
              <Terminal className="h-4 w-4" /> System Agent Reasoning Stream
            </span>
            <span>{logs.length} events logged</span>
          </div>

          {logs.length === 0 ? (
            <p className="text-slate-500 italic">No logs recorded yet. Click "Run Agent Pipeline" to trigger execution.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="space-y-0.5 border-l-2 border-emerald-500/40 pl-3 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">[{log.timestamp.split('T')[1]?.substring(0, 8)}]</span>
                  <span className="font-bold text-emerald-400">{log.agentName}:</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
                {log.details && (
                  <p className="text-[11px] text-slate-400 pl-4">{log.details}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
