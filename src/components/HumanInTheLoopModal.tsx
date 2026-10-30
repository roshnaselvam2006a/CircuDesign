import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, XCircle, ArrowRight, ArrowUpRight, Scale, Sparkles, Leaf, Database, Globe } from 'lucide-react';
import { FlaggedSwap } from '../types';

interface HumanInTheLoopModalProps {
  flaggedSwaps: FlaggedSwap[];
  onApproveSwap: (partId: string) => void;
  onRejectSwap: (partId: string) => void;
  onApproveAll: () => void;
  onClose: () => void;
}

export const HumanInTheLoopModal: React.FC<HumanInTheLoopModalProps> = ({
  flaggedSwaps,
  onApproveSwap,
  onRejectSwap,
  onApproveAll,
  onClose
}) => {
  if (flaggedSwaps.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl glass-panel-amber rounded-3xl p-6 sm:p-8 border border-amber-500/30 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with Caution Glow */}
        <div className="flex items-start justify-between gap-4 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 glow-amber">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-white">
                  Human-in-the-Loop Safety Gate
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                  {flaggedSwaps.length} Swap(s) Need Review
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                The Structural Integrity Agent flagged these bio-material substitutions for engineering approval due to tensile or cost trade-offs.
              </p>
            </div>
          </div>
        </div>

        {/* List of Flagged Swaps */}
        <div className="mt-6 space-y-4">
          {flaggedSwaps.map((swap) => (
            <div
              key={swap.partId}
              className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {swap.partId}
                  </span>
                  <span className="font-display text-base font-bold text-white">
                    {swap.partName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Confidence Score:</span>
                  <span className="font-bold text-amber-300">{swap.confidenceScore}%</span>
                </div>
              </div>

              {/* Material Swap Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Current Material</span>
                  <p className="text-sm font-semibold text-slate-200">{swap.currentMaterial}</p>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Proposed Sustainable Swap</span>
                    {swap.proposedMaterial.source === 'curated' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                        <Leaf className="h-3 w-3 text-emerald-400" /> Curated
                      </span>
                    )}
                    {swap.proposedMaterial.source === 'csv' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                        <Database className="h-3 w-3 text-blue-400" /> CSV Dataset
                      </span>
                    )}
                    {swap.proposedMaterial.source === 'kaggle' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                        <Database className="h-3 w-3 text-cyan-400" /> Kaggle
                      </span>
                    )}
                    {swap.proposedMaterial.source === 'web' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                        <Globe className="h-3 w-3 text-amber-400" /> Web Search
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">{swap.proposedMaterial.name}</p>
                  <p className="text-xs text-emerald-400/80">{swap.proposedMaterial.reasoning}</p>
                </div>
              </div>

              {/* Trade-off Engineering Metrics */}
              <div className="grid grid-cols-3 gap-3 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <div>
                  <span className="block text-[10px] text-slate-400">Tensile Strength</span>
                  <span className={`text-sm font-bold ${swap.tensileStrengthDeltaPercent >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {swap.tensileStrengthDeltaPercent >= 0 ? `+${swap.tensileStrengthDeltaPercent}%` : `${swap.tensileStrengthDeltaPercent}%`}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Cost Impact</span>
                  <span className={`text-sm font-bold ${swap.costDeltaPercent <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {swap.costDeltaPercent <= 0 ? `${swap.costDeltaPercent}%` : `+${swap.costDeltaPercent}%`}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">CO2e Saved</span>
                  <span className="text-sm font-bold text-emerald-400">
                    +{swap.carbonSavingsPercent}%
                  </span>
                </div>
              </div>

              {/* Risk Reason Explanation */}
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{swap.riskReason}</span>
              </div>

              {/* Action Buttons for this specific swap */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => onRejectSwap(swap.partId)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject Swap
                </button>
                <button
                  onClick={() => onApproveSwap(swap.partId)}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 glow-emerald"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Approve Swap
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-amber-500/20 pt-4">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Review Later
          </button>

          <button
            onClick={onApproveAll}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Approve All Flagged Swaps & Finish Loop
          </button>
        </div>
      </div>
    </div>
  );
};
