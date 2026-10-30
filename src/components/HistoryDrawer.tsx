import React from 'react';
import { History, X, Trash2, ArrowRight, Leaf, Calendar, ShieldCheck } from 'lucide-react';
import { PipelineRun } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  runs: PipelineRun[];
  onSelectRun: (run: PipelineRun) => void;
  onDeleteRun: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  runs,
  onSelectRun,
  onDeleteRun
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full glass-panel border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-400" />
              <h3 className="font-display text-lg font-bold text-white">
                Saved Optimization Runs
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List of Runs */}
          <div className="mt-6 space-y-4">
            {runs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Leaf className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs">No saved design runs yet. Select or upload a BOM to start your first optimization.</p>
              </div>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-emerald-500/40 transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display text-sm font-bold text-white group-hover:text-emerald-300">
                        {run.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(run.timestamp).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteRun(run.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete Run"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Run Highlights */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 rounded-xl p-2.5 border border-white/5">
                    <div>
                      <span className="block text-[10px] text-slate-400">Carbon Saved</span>
                      <span className="font-bold text-emerald-400">-{run.carbonSavedPercent}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Recyclability</span>
                      <span className="font-bold text-cyan-400">{run.recyclabilityScore}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectRun(run);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <span>View Optimization Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 text-center text-xs text-slate-400">
          CircuDesign History Store • Firebase Scoped
        </div>
      </div>
    </div>
  );
};
