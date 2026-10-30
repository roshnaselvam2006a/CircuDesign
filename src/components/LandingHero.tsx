import React from 'react';
import { Leaf, Sparkles, ShieldCheck } from 'lucide-react';

interface LandingHeroProps {
  onGetStarted: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted }) => {
  return (
    <div className="space-y-12 animate-fade-in py-8">
      {/* Hero Framing Section */}
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-300">
          <Leaf className="h-4 w-4 text-emerald-400" />
          <span>SDG 12.5 & SDG 9.4 Multi-Agent AI</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Redesign Product BOMs for <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Zero-Waste Circularity</span>
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
          An intelligent multi-agent platform that optimizes bills of materials using RAG material science databases, mechanical yield stress verification, and circular lifecycle optimization.
        </p>

        <div className="pt-4">
          <button
            onClick={onGetStarted}
            className="rounded-2xl border border-emerald-500/50 bg-emerald-500/20 px-8 py-4 text-sm font-bold text-emerald-300 hover:bg-emerald-500/30 transition hover:scale-[1.02] glow-emerald"
          >
            Optimize Your BOM
          </button>
        </div>
      </div>

      {/* Modern, Minimal Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-6">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2 text-center">
          <Sparkles className="h-5 w-5 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-xs text-white">Carbon Optimization</h3>
          <p className="text-[10px] text-slate-400">Suggests eco-efficient biological and recycled alternatives.</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2 text-center">
          <ShieldCheck className="h-5 w-5 text-cyan-400 mx-auto" />
          <h3 className="font-bold text-xs text-white">Structural Integrity</h3>
          <p className="text-[10px] text-slate-400">Verifies yield stress and tensile safety factors under load.</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2 text-center">
          <Leaf className="h-5 w-5 text-teal-400 mx-auto" />
          <h3 className="font-bold text-xs text-white">Circular Lifecycles</h3>
          <p className="text-[10px] text-slate-400">Calculates disassembly ease and product recyclability index.</p>
        </div>
      </div>
    </div>
  );
};
