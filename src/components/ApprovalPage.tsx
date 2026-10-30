import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Info, Clock, User } from 'lucide-react';
import { FlaggedSwap } from '../types';

interface ApprovalPageProps {
  flaggedSwaps: FlaggedSwap[];
  onApproveAll: () => void;
  onRejectAll: () => void;
  onApproveSwap: (partId: string) => void;
  runTitle: string;
  userName?: string;
}

export const ApprovalPage: React.FC<ApprovalPageProps> = ({
  flaggedSwaps,
  onApproveAll,
  onRejectAll,
  onApproveSwap,
  runTitle,
  userName = 'Guest Engineer'
}) => {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const pendingCount = flaggedSwaps.filter(s => !approvedIds.has(s.partId)).length;
  const approvedCount = approvedIds.size;
  const totalConstraints = 4;
  const satisfiedConstraints = pendingCount > 0 ? totalConstraints - 1 : totalConstraints;

  const handleApproveOne = (partId: string) => {
    setApprovedIds(prev => {
      const next = new Set(prev);
      next.add(partId);
      return next;
    });
    onApproveSwap(partId);
  };

  const allApproved = pendingCount === 0 && approvedCount > 0;

  return (
    <div className="max-w-4xl mx-auto my-6 animate-fade-in space-y-6">
      {/* Risk Alert Banner */}
      <div className={`glass-panel rounded-3xl p-6 flex items-start gap-4 ${allApproved ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
        <div className={`p-3 rounded-2xl shrink-0 ${allApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {allApproved ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
        </div>
        <div className="space-y-1 flex-1">
          <h2 className="font-display text-lg font-bold text-white">
            {allApproved ? 'All Substitutions Authorized — Proceeding to Results' : 'Engineering Authorization Required (HITL Gate)'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {allApproved
              ? `All ${approvedCount} flagged swap(s) have been authorized by ${userName}. Click "Continue to Results" to view the optimized BOM.`
              : <>The multi-agent optimization for <strong>{runTitle}</strong> flagged {flaggedSwaps.length} substitution(s) with structural safety or cost concerns. Each must be individually approved or rejected.</>
            }
          </p>
          {/* Constraint status indicator */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              allApproved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            }`}>
              {allApproved ? `${totalConstraints}/${totalConstraints} Constraints — Loop Satisfied` : `${satisfiedConstraints}/${totalConstraints} — ${pendingCount} awaiting approval`}
            </span>
          </div>
        </div>
      </div>

      {/* Per-Swap Inline Approval Cards */}
      <div className="space-y-4">
        {flaggedSwaps.map((swap, idx) => {
          const isApproved = approvedIds.has(swap.partId);

          return (
            <div
              key={swap.partId}
              className={`glass-panel rounded-2xl p-5 border transition-all duration-300 ${
                isApproved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{swap.partId}</span>
                  <span className="text-sm font-bold text-white">{swap.partName}</span>
                </div>
                <div className={`text-[10px] rounded-full px-2.5 py-0.5 font-bold border ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {isApproved ? '✓ Approved' : '⚠ Pending Approval'}
                </div>
              </div>

              {/* Swap details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block mb-1">Original Material</span>
                  <p className="font-medium text-slate-200">{swap.currentMaterial}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block mb-1">Proposed Alternative</span>
                  <p className="font-medium text-emerald-300">{swap.proposedMaterial.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block mb-1">Tensile Δ / Cost Δ</span>
                  <p className="font-medium text-slate-200">
                    {swap.tensileStrengthDeltaPercent >= 0 ? '+' : ''}{swap.tensileStrengthDeltaPercent}% / +{swap.costDeltaPercent}%
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block mb-1">CO2e Savings</span>
                  <p className="font-medium text-emerald-400">-{swap.carbonSavingsPercent}%</p>
                </div>
              </div>

              {/* Risk reason */}
              <div className="flex items-start gap-1.5 text-[11px] text-amber-300/90 py-2 border-t border-white/5">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{swap.riskReason}</span>
              </div>

              {/* Action buttons or approval record */}
              {isApproved ? (
                <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-300/80 bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20">
                  <User className="h-3.5 w-3.5" />
                  <span>Approved by <strong>{userName}</strong> at {new Date().toLocaleTimeString()}</span>
                </div>
              ) : (
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={onRejectAll}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                  >
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span>Reject — Try Another</span>
                  </button>
                  <button
                    onClick={() => handleApproveOne(swap.partId)}
                    className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 glow-emerald transition"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Approve Substitution</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom action bar */}
      <div className="flex justify-between items-center glass-panel border-white/10 rounded-3xl p-5">
        <div className="text-xs text-slate-400">
          {approvedCount} of {flaggedSwaps.length} swap(s) approved
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRejectAll}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            <XCircle className="h-4 w-4 text-red-400" />
            <span>Reject All & Reset</span>
          </button>

          {!allApproved && (
            <button
              onClick={() => {
                flaggedSwaps.forEach(s => {
                  if (!approvedIds.has(s.partId)) handleApproveOne(s.partId);
                });
              }}
              className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition"
            >
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Approve All Remaining</span>
            </button>
          )}

          {allApproved && (
            <button
              onClick={onApproveAll}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 glow-emerald transition animate-pulse"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Continue to Results →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
