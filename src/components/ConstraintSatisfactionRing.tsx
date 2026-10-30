import React from 'react';
import { Leaf, ShieldCheck, DollarSign, Truck, Sparkles, CheckCircle2 } from 'lucide-react';

interface QuadrantState {
  sustainability: boolean;
  structural: boolean;
  cost: boolean;
  supply: boolean;
}

interface ConstraintSatisfactionRingProps {
  states: QuadrantState;
  size?: number;
  interactive?: boolean;
  pendingApprovals?: number;
}

export const ConstraintSatisfactionRing: React.FC<ConstraintSatisfactionRingProps> = ({
  states,
  size = 280,
  interactive = true,
  pendingApprovals = 0
}) => {
  const satisfiedCount = Object.values(states).filter(Boolean).length;
  const displaySatisfied = pendingApprovals > 0 ? Math.max(satisfiedCount - 1, 0) : satisfiedCount;
  const isAllSatisfied = satisfiedCount === 4 && pendingApprovals === 0;

  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const quadrantLength = circumference / 4;

  const quadrants = [
    {
      key: 'sustainability',
      label: 'Sustainability & CO2e',
      icon: Leaf,
      active: states.sustainability,
      color: '#6EE7B7', // bio-green
      offset: 0,
      description: 'CO2e reduced > 20% & non-toxic resin'
    },
    {
      key: 'structural',
      label: 'Structural Safety',
      icon: ShieldCheck,
      active: states.structural && pendingApprovals === 0,
      color: '#60A5FA', // signal-blue
      offset: quadrantLength,
      description: pendingApprovals > 0 ? `${pendingApprovals} swap(s) awaiting engineer approval` : 'Yield stress & safety factor > 1.15x'
    },
    {
      key: 'cost',
      label: 'Cost Efficiency',
      icon: DollarSign,
      active: states.cost,
      color: '#34D399', // emerald
      offset: quadrantLength * 2,
      description: 'Unit cost delta within target margin'
    },
    {
      key: 'supply',
      label: 'Supply Availability',
      icon: Truck,
      active: states.supply,
      color: '#A7F3D0', // light bio-green
      offset: quadrantLength * 3,
      description: 'High/Moderate bio-resin supply chain'
    }
  ];

  return (
    <div className="relative flex flex-col items-center justify-center p-6 glass-panel rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl">
      {/* HUD Circular Glass Ring Canvas */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Ring Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Quadrant Arc Segments */}
          {quadrants.map((q, idx) => {
            const dashArray = `${quadrantLength - 8} ${circumference - (quadrantLength - 8)}`;
            const dashOffset = -q.offset;
            return (
              <circle
                key={q.key}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={q.active ? q.color : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{
                  filter: q.active ? `drop-shadow(0 0 8px ${q.color})` : 'none'
                }}
              />
            );
          })}
        </svg>

        {/* HUD Center Glass Core */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
            isAllSatisfied
              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300 glow-emerald'
              : pendingApprovals > 0
              ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
              : 'border-white/20 bg-white/5 text-slate-300'
          } transition-all duration-500`}>
            {isAllSatisfied ? (
              <Sparkles className="h-7 w-7 text-emerald-400 animate-pulse" />
            ) : (
              <Leaf className="h-7 w-7 text-emerald-400" />
            )}
          </div>
          <span className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
            {isAllSatisfied ? '4/4' : `${displaySatisfied}/4`}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Constraints
          </span>
          <span className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isAllSatisfied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : pendingApprovals > 0
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
          }`}>
            {isAllSatisfied ? 'Loop Satisfied' : pendingApprovals > 0 ? `${pendingApprovals} Awaiting Approval` : 'Verifying Loop'}
          </span>
        </div>
      </div>

      {/* Quadrant Legend & Live Tooltips */}
      <div className="mt-6 grid grid-cols-2 gap-3 w-full">
        {quadrants.map((q) => {
          const Icon = q.icon;
          return (
            <div
              key={q.key}
              className={`flex items-start gap-2.5 rounded-xl p-2.5 border transition-all ${
                q.active
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/5 bg-white/5 text-slate-400'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${q.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate text-white">{q.label}</span>
                  {q.active && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{q.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
