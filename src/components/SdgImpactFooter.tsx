import React from 'react';
import { Leaf, Cpu, Globe2, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface SdgImpactFooterProps {
  carbonSavedKg?: number;
  carbonSavedPercent?: number;
  recyclabilityPercent?: number;
  disassemblyScore?: number;
}

export const SdgImpactFooter: React.FC<SdgImpactFooterProps> = ({
  carbonSavedKg = 14.2,
  carbonSavedPercent = 38,
  recyclabilityPercent = 88,
  disassemblyScore = 85
}) => {
  return (
    <div className="mt-12 glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-emerald-400" />
          <h3 className="font-display text-base font-bold text-white">
            UN Sustainable Development Goals (SDG) Alignment
          </h3>
        </div>
        <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Verified Impact Metrics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SDG 12 Target 12.5 */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-sm text-emerald-300">
              SDG 12: Responsible Consumption & Production
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
              Target 12.5
            </span>
          </div>
          <p className="text-xs text-slate-300">
            By 2030, substantially reduce waste generation through prevention, reduction, recycling, and reuse.
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-emerald-400">
            <span>• Recyclability: {recyclabilityPercent}%</span>
            <span>• Disassembly Index: {disassemblyScore}/100</span>
          </div>
        </div>

        {/* SDG 9 Target 9.4 */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-sm text-blue-300">
              SDG 9: Industry, Innovation & Infrastructure
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
              Target 9.4
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Upgrade infrastructure and retrofit industries to make them sustainable, with increased resource-use efficiency and greater adoption of clean processes.
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-blue-400">
            <span>• Carbon CO2e Saved: {carbonSavedKg} kg (-{carbonSavedPercent}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
