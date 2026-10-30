/**
 * CAD Parts List sidebar component.
 * Shows extracted parts with checkboxes to show/hide parts,
 * hover-to-highlight, and material/mass info.
 *
 * Ported from rahulworld/3d-cad-models-with-bom SideBar.js → TSX.
 * Styled to match CircuDesign's glass-panel dark aesthetic.
 *
 * Uses PART INDEX (not mesh index) for all interactions,
 * matching the merged-geometry CADViewer.
 */

import React from 'react';
import { Eye, EyeOff, Box, RotateCcw } from 'lucide-react';
import type { ParsedCADModel, CADPart } from '../../types';
import { inferMaterialFromPartName } from '../../cad/materialLookup';

interface CADPartsListProps {
  model: ParsedCADModel;
  highlightedPartIndex: number;
  onPartHover: (partIndex: number) => void;
  onPartClick: (partIndex: number) => void;
  uncheckedParts: number[];
  onTogglePart: (partIndex: number) => void;
  onResetView: () => void;
}

export const CADPartsList: React.FC<CADPartsListProps> = ({
  model,
  highlightedPartIndex,
  onPartHover,
  onPartClick,
  uncheckedParts,
  onTogglePart,
  onResetView,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            CAD Parts ({model.parts.length})
          </span>
        </div>
        <button
          onClick={onResetView}
          className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition border border-white/10"
          title="Reset view"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Parts list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {model.parts.map((part: CADPart, partIndex: number) => {
          const isHighlighted = highlightedPartIndex === partIndex;
          const isHidden = uncheckedParts.includes(partIndex);
          const inferred = inferMaterialFromPartName(part.name);

          // Estimated mass
          const massGrams = Math.round(part.estimatedVolumeCm3 * inferred.densityGPerCm3 * 10) / 10;

          return (
            <div
              key={partIndex}
              className={`group flex items-start gap-2 px-4 py-2.5 border-b border-white/5 cursor-pointer transition-all ${
                isHighlighted
                  ? 'bg-emerald-500/15 border-l-2 border-l-emerald-400'
                  : 'hover:bg-white/5 border-l-2 border-l-transparent'
              } ${isHidden ? 'opacity-40' : ''}`}
              onMouseEnter={() => onPartHover(partIndex)}
              onMouseLeave={() => onPartHover(-1)}
              onClick={() => onPartClick(partIndex)}
            >
              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePart(partIndex);
                }}
                className="mt-0.5 text-slate-400 hover:text-white transition shrink-0"
                title={isHidden ? 'Show part' : 'Hide part'}
              >
                {isHidden ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Part info */}
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold truncate ${
                  isHighlighted ? 'text-emerald-300' : 'text-white'
                }`}>
                  {part.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400">
                    {inferred.material}
                  </span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[10px] text-slate-400">
                    ~{massGrams < 1 ? '<1' : massGrams}g
                  </span>
                </div>
              </div>

              {/* Mesh count badge */}
              <span className="shrink-0 mt-0.5 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 border border-white/5">
                {part.meshIndices.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
