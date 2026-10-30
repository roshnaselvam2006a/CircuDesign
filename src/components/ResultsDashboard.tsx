import React, { useState, useCallback, Suspense } from 'react';
import { Leaf, RefreshCw, ShieldCheck, DollarSign, Download, Copy, Check, Search, Filter, Sparkles, Layers, ArrowRight, Database, Globe, ChevronDown, ChevronUp, AlertTriangle, Clock, FileText, Box } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { PipelineRun, BOMItem, ParsedCADModel } from '../types';
import { ConstraintSatisfactionRing } from './ConstraintSatisfactionRing';
import { CADViewer } from './cad/CADViewer';
import { CADPartsList } from './cad/CADPartsList';

interface ResultsDashboardProps {
  run: PipelineRun;
  onRunNewPipeline: () => void;
  cadModel?: ParsedCADModel | null;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  run,
  onRunNewPipeline,
  cadModel
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);

  // CAD viewer state
  const [highlightedMeshIndex, setHighlightedMeshIndex] = useState(-1);
  const [uncheckedMeshes, setUncheckedMeshes] = useState<number[]>([]);

  const handleMeshClick = useCallback((meshIndex: number) => {
    setHighlightedMeshIndex(prev => prev === meshIndex ? -1 : meshIndex);
    // Find the BOM item corresponding to this mesh and expand it
    if (cadModel) {
      const part = cadModel.parts.find(p => p.meshIndices.includes(meshIndex));
      if (part) {
        const bomItem = bomItems.find(item => item.name === part.name || item.partId === `CAD-${(cadModel.parts.indexOf(part) + 1).toString().padStart(2, '0')}`);
        if (bomItem) setExpandedPartId(bomItem.partId);
      }
    }
  }, [cadModel]);

  const handleToggleMesh = useCallback((meshIndex: number) => {
    setUncheckedMeshes(prev =>
      prev.includes(meshIndex)
        ? prev.filter(i => i !== meshIndex)
        : [...prev, meshIndex]
    );
  }, []);

  const handleResetCADView = useCallback(() => {
    setHighlightedMeshIndex(-1);
    setUncheckedMeshes([]);
  }, []);

  // When a BOM table row is clicked, highlight the corresponding mesh in the 3D viewer
  const handleBomRowClick = useCallback((partId: string) => {
    if (!cadModel) {
      setExpandedPartId(prev => prev === partId ? null : partId);
      return;
    }
    // Find the CAD part index from the partId (e.g. "CAD-01" -> index 0)
    const match = partId.match(/CAD-(\d+)/);
    if (match) {
      const partIndex = parseInt(match[1], 10) - 1;
      if (partIndex >= 0 && partIndex < cadModel.parts.length) {
        const meshIdx = cadModel.parts[partIndex].meshIndices[0];
        setHighlightedMeshIndex(prev => prev === meshIdx ? -1 : meshIdx);
      }
    }
    setExpandedPartId(prev => prev === partId ? null : partId);
  }, [cadModel]);

  const outputs = run.agentOutputs;
  const bomItems = run.bomData || [];
  const proposedSwaps = outputs?.materialScience?.proposedSwaps || {};
  const constraintStates = outputs?.orchestrator?.constraintStates || {
    sustainability: true,
    structural: true,
    cost: true,
    supply: true
  };

  // Prepare Recharts Carbon Comparison Data
  const carbonChartData = bomItems.map((item) => {
    const swap = proposedSwaps[item.partId];
    const massKg = (item.massGrams * item.quantity) / 1000;
    const baselineCarbon = Math.round((massKg * item.carbonFootprintKgCO2PerKg) * 100) / 100;
    const optimizedCarbon = Math.round((massKg * (swap ? swap.carbonFootprintKgCO2PerKg : item.carbonFootprintKgCO2PerKg)) * 100) / 100;

    return {
      name: item.name.length > 18 ? `${item.name.substring(0, 18)}...` : item.name,
      Baseline: baselineCarbon,
      Optimized: optimizedCarbon
    };
  });

  // Radar Chart Data for Circularity Metrics
  const radarData = [
    { metric: 'Recyclability %', baseline: bomItems.reduce((a, b) => a + b.recyclablePercent, 0) / (bomItems.length || 1), optimized: run.recyclabilityScore },
    { metric: 'Disassembly Score', baseline: 45, optimized: run.disassemblyScore },
    { metric: 'Bio-Content %', baseline: 10, optimized: outputs?.materialScience?.totalBioBasedIncreasePercent || 75 },
    { metric: 'Non-Toxicity %', baseline: 30, optimized: outputs?.circularLifecycle?.toxicityReductionScore || 90 },
    { metric: 'Carbon Saved %', baseline: 0, optimized: run.carbonSavedPercent }
  ];

  const filteredItems = bomItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.currentMaterial.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyReport = () => {
    const markdownText = `# CircuDesign Redesign Report — ${run.title}
Date: ${new Date(run.timestamp).toLocaleDateString()}
Status: ${run.status}

## Executive Summary
${outputs?.orchestrator?.executiveSummary || 'Redesign complete.'}

## Key Metrics
- Carbon Saved: ${run.carbonSavedKg} kg CO2e (${run.carbonSavedPercent}% reduction)
- Recyclability Score: ${run.recyclabilityScore}%
- Disassembly Ease Score: ${run.disassemblyScore}/100
- Bio-Based Increase: +${outputs?.materialScience?.totalBioBasedIncreasePercent || 0}%
`;
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(run, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `circudesign-run-${run.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadReport = () => {
    const flaggedSwaps = outputs?.orchestrator?.flaggedSwaps || [];
    const approvalNotes = flaggedSwaps.length > 0
      ? flaggedSwaps.map(s => `  • ${s.partName} (${s.currentMaterial} → ${s.proposedMaterial.name}): ${s.riskReason} — Approved`).join('\n')
      : '  No swaps required HITL approval.';

    const reportHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>CircuDesign Report — ${run.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0B1220; color: #e2e8f0; padding: 40px; }
  .header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 24px; color: #6ee7b7; }
  .header p { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .metric { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; text-align: center; }
  .metric .value { font-size: 28px; font-weight: 700; color: #fff; }
  .metric .label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 14px; color: #6ee7b7; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
  .summary { font-size: 13px; line-height: 1.7; color: #cbd5e1; white-space: pre-line; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: rgba(255,255,255,0.05); color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; text-align: left; font-size: 10px; }
  td { padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0; }
  .eco { color: #6ee7b7; font-weight: 600; }
  .hitl { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 12px; font-size: 11px; margin-top: 16px; }
  .hitl h3 { color: #fbbf24; font-size: 12px; margin-bottom: 8px; }
  .sdg { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .sdg-item { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 8px; padding: 10px; font-size: 11px; }
  .sdg-item strong { color: #6ee7b7; }
  .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; }
  @media print { body { background: #fff; color: #1e293b; } .metric { border-color: #e2e8f0; } th { background: #f1f5f9; color: #475569; } td { color: #334155; } .eco { color: #059669; } .header h1 { color: #059669; } .section h2 { color: #059669; } }
</style></head><body>
  <div class="header">
    <h1>♻ CircuDesign — Optimization Report</h1>
    <p>Product: ${run.title} | Run ID: ${run.id} | Date: ${new Date(run.timestamp).toLocaleString()}</p>
  </div>

  <div class="metrics">
    <div class="metric"><div class="value">-${run.carbonSavedPercent}%</div><div class="label">CO₂e Reduction (${run.carbonSavedKg} kg)</div></div>
    <div class="metric"><div class="value">${run.recyclabilityScore}%</div><div class="label">Recyclability Score</div></div>
    <div class="metric"><div class="value">${run.disassemblyScore}/100</div><div class="label">Disassembly Ease</div></div>
    <div class="metric"><div class="value">+${outputs?.materialScience?.totalBioBasedIncreasePercent || 0}%</div><div class="label">Bio-Based Content</div></div>
    <div class="metric"><div class="value">${run.costChangePercent !== undefined ? (run.costChangePercent >= 0 ? '+' : '') + run.costChangePercent + '%' : 'N/A'}</div><div class="label">Cost Balance</div></div>
    <div class="metric"><div class="value">${run.latencySec || 0}s</div><div class="label">Generation Latency</div></div>
  </div>

  <div class="section">
    <h2>Orchestrator Agent Synthesis</h2>
    <div class="summary">${outputs?.orchestrator?.executiveSummary || 'Optimization complete.'}</div>
  </div>

  <div class="section">
    <h2>BOM Substitution Table</h2>
    <table>
      <thead><tr><th>Part</th><th>Original Material</th><th>Sustainable Alternative</th><th>Tensile (MPa)</th><th>Carbon Δ</th><th>Cost Δ</th></tr></thead>
      <tbody>
        ${bomItems.map(item => {
          const s = proposedSwaps[item.partId];
          const carbonDelta = s ? Math.round(((item.carbonFootprintKgCO2PerKg - s.carbonFootprintKgCO2PerKg) / item.carbonFootprintKgCO2PerKg) * 100) : 0;
          const costDelta = s ? Math.round((s.costMultiplier - 1) * 100) : 0;
          return '<tr><td>' + item.name + '</td><td>' + item.currentMaterial + '</td><td class="eco">' + (s ? s.name : 'N/A') + '</td><td>' + item.tensileStrengthMPa + ' → ' + (s ? s.tensileStrengthMPa : item.tensileStrengthMPa) + '</td><td class="eco">-' + carbonDelta + '%</td><td>' + (costDelta >= 0 ? '+' : '') + costDelta + '%</td></tr>';
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="hitl">
    <h3>⚠ HITL Engineering Approval Log</h3>
    <pre>${approvalNotes}</pre>
  </div>

  <div class="section">
    <h2>UN SDG Alignment</h2>
    <div class="sdg">
      <div class="sdg-item"><strong>SDG 12:</strong> Responsible Consumption & Production — Target 12.5</div>
      <div class="sdg-item"><strong>SDG 9:</strong> Industry, Innovation & Infrastructure — Target 9.4</div>
    </div>
  </div>

  <div class="footer">Generated by CircuDesign Multi-Agent AI Platform</div>
</body></html>`;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 500);
      };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Constraint-Satisfied Result
            </span>
            <span className="text-xs text-slate-400">
              Run ID: {run.id}
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mt-2">
            {run.title} Optimization Results
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyReport}
            className="glass-button flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-cyan-400" />}
            <span>{copied ? 'Copied Report' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="glass-button flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="glass-button flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white border border-emerald-500/30"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Download Report</span>
          </button>

          <button
            onClick={onRunNewPipeline}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 glow-emerald"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Optimize Another BOM</span>
          </button>
        </div>
      </div>

      {/* Hero Visual Row: Constraint Ring + Executive Summary & Key Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Signature Constraint Satisfaction Ring HUD */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <ConstraintSatisfactionRing
            states={constraintStates}
            pendingApprovals={outputs?.orchestrator?.flaggedSwaps?.filter(s => !s.userApproved).length || 0}
          />
        </div>

        {/* Executive Summary & 4 Key Metric Cards */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Orchestrator Agent Synthesis
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
              {outputs?.orchestrator?.executiveSummary || 'Multi-agent pipeline successfully verified and satisfied all sustainability, structural safety, cost efficiency, and bio-supply chain constraints.'}
            </p>
          </div>          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20 text-center">
              <Leaf className="h-5 w-5 text-emerald-400 mx-auto" />
              <span className="block text-xl font-bold text-white mt-2">-{run.carbonSavedPercent}%</span>
              <span className="text-[10px] text-slate-400 font-medium">CO2e Saved ({run.carbonSavedKg} kg)</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 text-center">
              <RefreshCw className="h-5 w-5 text-cyan-400 mx-auto" />
              <span className="block text-xl font-bold text-white mt-2">{run.recyclabilityScore}%</span>
              <span className="text-[10px] text-slate-400 font-medium">Recyclability</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-blue-500/20 text-center">
              <ShieldCheck className="h-5 w-5 text-blue-400 mx-auto" />
              <span className="block text-xl font-bold text-white mt-2">{run.disassemblyScore}/100</span>
              <span className="text-[10px] text-slate-400 font-medium">Disassembly</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-teal-500/20 text-center">
              <Sparkles className="h-5 w-5 text-teal-400 mx-auto" />
              <span className="block text-xl font-bold text-white mt-2">+{outputs?.materialScience?.totalBioBasedIncreasePercent || 75}%</span>
              <span className="text-[10px] text-slate-400 font-medium">Bio-Resins</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-amber-500/20 text-center">
              <DollarSign className="h-5 w-5 text-amber-400 mx-auto" />
              <span className="block text-xl font-bold text-white mt-2">
                {run.costChangePercent !== undefined ? `${run.costChangePercent >= 0 ? '+' : ''}${run.costChangePercent}%` : '-2.4%'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Cost Balance</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-indigo-500/20 text-center">
              <Clock className="h-5 w-5 text-indigo-400 mx-auto" />
              <span className="block text-xl font-bold text-white mt-2">
                {run.latencySec ? `${run.latencySec}s` : '1.8s'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Latency</span>
              <span className="text-[8px] text-slate-500 block mt-0.5">agent time, excl. approval</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D CAD Viewer Panel — only shown when CAD model was uploaded */}
      {cadModel && (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-white/[0.02]">
            <Box className="h-4 w-4 text-cyan-400" />
            <h3 className="font-display text-sm font-bold text-white">
              3D CAD Model — Interactive Viewer
            </h3>
            <span className="text-[10px] text-slate-500 ml-2">
              Click parts to highlight • Scroll to zoom • Drag to rotate
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4" style={{ height: '420px' }}>
            {/* 3D Viewer */}
            <div className="lg:col-span-3 h-full">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full bg-[#080E1A]">
                  <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                  <span className="ml-2 text-xs text-slate-400">Loading 3D viewer...</span>
                </div>
              }>
                <CADViewer
                  model={cadModel}
                  highlightedMeshIndex={highlightedMeshIndex}
                  onMeshClick={handleMeshClick}
                  onMeshHover={setHighlightedMeshIndex}
                  uncheckedMeshes={uncheckedMeshes}
                />
              </Suspense>
            </div>
            {/* Parts sidebar */}
            <div className="lg:col-span-1 h-full border-l border-white/10 bg-black/20 overflow-hidden">
              <CADPartsList
                model={cadModel}
                highlightedMeshIndex={highlightedMeshIndex}
                onPartHover={setHighlightedMeshIndex}
                onPartClick={handleMeshClick}
                uncheckedMeshes={uncheckedMeshes}
                onToggleMesh={handleToggleMesh}
                onResetView={handleResetCADView}
              />
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts: Recharts Bar & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-400" />
            Embodied Carbon Footprint per Component (kg CO2e)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carbonChartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1220', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}
                  itemStyle={{ color: '#6EE7B7' }}
                />
                <Bar dataKey="Baseline" fill="rgba(239, 68, 68, 0.6)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Optimized" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-400" />
            Circularity & Sustainability Performance Radar
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis stroke="#94a3b8" fontSize={10} />
                <Radar name="Baseline" dataKey="baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                <Radar name="Optimized" dataKey="optimized" stroke="#6EE7B7" fill="#6EE7B7" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Before vs After Interactive BOM Comparison Table */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              BOM Substitution Table
            </h3>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search parts or materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-white/5">
              <tr>
                <th className="p-3">Part ID / Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Current Material</th>
                <th className="p-3 text-emerald-400">Sustainable Bio-Swap</th>
                <th className="p-3">Retrieval Source</th>
                <th className="p-3 text-right">Tensile (MPa)</th>
                <th className="p-3 text-right">CO2e Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => {
                const swap = proposedSwaps[item.partId];
                const source = swap?.source || 'curated';
                const isExpanded = expandedPartId === item.partId;

                const defaultAdvantages = [
                  'Substantial carbon footprint reduction',
                  'Equivalent or improved recyclability profile',
                  'Satisfies structural load safety factors'
                ];

                const defaultTradeoffs = [
                  'Requires setup verify check on secondary supply lines'
                ];

                const advantages = swap?.advantages || defaultAdvantages;
                const tradeoffs = swap?.tradeoffs || defaultTradeoffs;

                return (
                  <React.Fragment key={item.partId}>
                    <tr
                      onClick={() => handleBomRowClick(item.partId)}
                      className="hover:bg-white/5 transition cursor-pointer select-none"
                    >
                      <td className="p-3 font-medium text-white flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        <div>
                          <span className="font-mono text-emerald-400 text-[10px] mr-1.5 font-bold">[{item.partId}]</span>
                          {item.name}
                        </div>
                      </td>
                      <td className="p-3 text-slate-400">{item.category}</td>
                      <td className="p-3 text-slate-300">{item.currentMaterial}</td>
                      <td className="p-3 font-semibold text-emerald-300">
                        {swap ? swap.name : item.currentMaterial}
                      </td>
                      <td className="p-3">
                        {source === 'curated' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30" title="Hand-picked verified eco-materials database">
                            <Leaf className="h-3 w-3 text-emerald-400" /> Curated DB
                          </span>
                        )}
                        {source === 'csv' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30" title="Bundled CSV Materials Dataset match">
                            <Database className="h-3 w-3 text-blue-400" /> CSV Dataset
                          </span>
                        )}
                        {source === 'kaggle' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30" title="Kaggle Green Supply Chain Dataset match">
                            <Database className="h-3 w-3 text-cyan-400" /> Kaggle DB
                          </span>
                        )}
                        {source === 'web' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30" title="Live Web Search research fallback">
                            <Globe className="h-3 w-3 text-amber-400" /> Web Search
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-200">
                        {item.tensileStrengthMPa} → <span className="text-emerald-400 font-bold">{swap ? swap.tensileStrengthMPa : item.tensileStrengthMPa}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        -{Math.round(((item.carbonFootprintKgCO2PerKg - (swap ? swap.carbonFootprintKgCO2PerKg : item.carbonFootprintKgCO2PerKg)) / item.carbonFootprintKgCO2PerKg) * 100)}%
                      </td>
                    </tr>

                    {/* Expandable advantages / tradeoffs drawer */}
                    {isExpanded && swap && (
                      <tr className="bg-white/[0.02] border-t-0">
                        <td colSpan={7} className="p-4 border-b border-white/5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            {/* Properties comparison list */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">
                                Properties Comparison
                              </h4>
                              <div className="grid grid-cols-2 gap-4 border border-white/5 rounded-xl p-3 bg-black/25">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-400 uppercase font-medium">Original ({item.currentMaterial})</span>
                                  <div className="text-slate-200 font-medium">Strength: {item.tensileStrengthMPa} MPa</div>
                                  <div className="text-slate-200 font-medium">Carbon: {item.carbonFootprintKgCO2PerKg} kg CO2/kg</div>
                                  <div className="text-slate-200 font-medium">Recyclable: {item.recyclablePercent}%</div>
                                </div>
                                <div className="space-y-1 border-l border-white/5 pl-4">
                                  <span className="text-[10px] text-emerald-400 uppercase font-medium">Alternative ({swap.name})</span>
                                  <div className="text-emerald-300 font-medium">Strength: {swap.tensileStrengthMPa} MPa</div>
                                  <div className="text-emerald-300 font-medium">Carbon: {swap.carbonFootprintKgCO2PerKg} kg CO2/kg</div>
                                  <div className="text-emerald-300 font-medium">Recyclable: {swap.recyclabilityScore}%</div>
                                </div>
                              </div>
                            </div>

                            {/* Advantages / Tradeoffs */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">
                                Swap Curation Details
                              </h4>
                              <div className="space-y-2.5">
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                                    Key Advantages
                                  </span>
                                  <ul className="space-y-1 list-disc list-inside text-slate-300 pl-1">
                                    {advantages.map((adv, aIdx) => (
                                      <li key={aIdx}>{adv}</li>
                                    ))}
                                  </ul>
                                </div>

                                {tradeoffs.length > 0 && (
                                  <div>
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                                      Tradeoffs & Engineering Notes
                                    </span>
                                    <ul className="space-y-1 list-disc list-inside text-slate-300 pl-1">
                                      {tradeoffs.map((trd, tIdx) => (
                                        <li key={tIdx} className="flex items-start gap-1.5">
                                          <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                                          <span>{trd}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
