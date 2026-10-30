import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Layers, ArrowRight, Sparkles, RefreshCw, Box } from 'lucide-react';
import { SAMPLE_BOMS } from '../data/sampleBoms';
import { BOMItem, ParsedCADModel } from '../types';
import { parseStepBuffer } from '../cad/stepParser';
import { cadPartsToBomItems } from '../cad/cadToBom';

interface DashboardProps {
  onSelectSampleBOM: (bom: typeof SAMPLE_BOMS[0]) => void;
  onCustomFileUpload: (items: BOMItem[], fileName: string) => void;
  onCADModelLoaded?: (model: ParsedCADModel) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectSampleBOM,
  onCustomFileUpload,
  onCADModelLoaded
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadTab, setUploadTab] = useState<'csv' | 'cad'>('csv');
  const [isParsingCAD, setIsParsingCAD] = useState(false);
  const [cadError, setCadError] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let items: BOMItem[] = [];
        if (file.name.endsWith('.json')) {
          items = JSON.parse(text);
        } else {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length <= 1) return;

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
          
          const getColIndex = (names: string[]) => {
            return headers.findIndex(h => names.some(name => h.includes(name)));
          };

          const idxPartId = getColIndex(['partid', 'part_id', 'id']);
          const idxName = getColIndex(['partname', 'part_name', 'name']);
          const idxQuantity = getColIndex(['quantity', 'qty', 'quantities']);
          const idxMaterial = getColIndex(['material', 'currentmaterial', 'current_material', 'material_name']);
          const idxMass = getColIndex(['mass', 'weight', 'massgrams', 'mass_grams', 'weight_g']);
          const idxCost = getColIndex(['cost', 'unitcost', 'unit_cost', 'cost_usd']);
          const idxCategory = getColIndex(['category']);
          const idxJoinery = getColIndex(['joinery', 'joinerytype', 'joinery_type']);
          const idxTensile = getColIndex(['tensile', 'strength', 'tensilestrengthmpa', 'tensile_strength']);
          const idxTemp = getColIndex(['temp', 'operatingtemp', 'maxoperatingtempc']);
          const idxRecyclable = getColIndex(['recyclable', 'recyclablepercent', 'recyclable_percent']);
          const idxDisassembly = getColIndex(['disassembly', 'disassemblytime', 'disassemblytimesec']);
          const idxCarbon = getColIndex(['carbon', 'carbonfootprint', 'co2_emissions', 'carbon_footprint']);

          items = lines.slice(1).map((line, idx) => {
            const cols = line.split(',').map(c => c.trim().replace(/["']/g, ''));
            const mat = idxMaterial !== -1 ? cols[idxMaterial] : 'Virgin ABS';
            
            let infCategory: BOMItem['category'] = 'Housing/Enclosure';
            let infTensile = 45;
            let infCarbon = 3.8;
            let infJoinery: BOMItem['joineryType'] = 'Snap-fit';

            const lowerMat = mat.toLowerCase();

            if (lowerMat.includes('steel') || lowerMat.includes('iron') || lowerMat.includes('metal')) {
              infCategory = 'Structural Frame';
              infTensile = 250;
              infCarbon = 8.2;
              infJoinery = 'Threaded Fasteners';
            } else if (lowerMat.includes('aluminum') || lowerMat.includes('aluminium') || lowerMat.includes('copper')) {
              infCategory = 'Thermal/Heat Sink';
              infTensile = 90;
              infCarbon = 12.5;
              infJoinery = 'Threaded Fasteners';
            } else if (lowerMat.includes('rubber') || lowerMat.includes('silicone') || lowerMat.includes('elastomer') || lowerMat.includes('pvc')) {
              infCategory = 'Flexible/Seals';
              infTensile = 15;
              infCarbon = 4.2;
              infJoinery = 'Press-fit';
            } else if (lowerMat.includes('glass') || lowerMat.includes('lens') || lowerMat.includes('polycarbonate') || lowerMat.includes('pc') || lowerMat.includes('acrylic')) {
              infCategory = 'Housing/Enclosure';
              infTensile = 62;
              infCarbon = 6.2;
              infJoinery = 'Adhesive/Glued';
            } else if (lowerMat.includes('nylon') || lowerMat.includes('pa6') || lowerMat.includes('pa66') || lowerMat.includes('polyamide')) {
              infCategory = 'Structural Frame';
              infTensile = 78;
              infCarbon = 7.1;
              infJoinery = 'Threaded Fasteners';
            }

            return {
              partId: (idxPartId !== -1 && cols[idxPartId]) ? cols[idxPartId] : `P${idx + 1}`,
              name: (idxName !== -1 && cols[idxName]) ? cols[idxName] : `Part ${idx + 1}`,
              category: (idxCategory !== -1 && cols[idxCategory]) ? cols[idxCategory] as any : infCategory,
              quantity: (idxQuantity !== -1 && parseInt(cols[idxQuantity])) ? parseInt(cols[idxQuantity]) : 1,
              currentMaterial: mat,
              massGrams: (idxMass !== -1 && parseFloat(cols[idxMass])) ? parseFloat(cols[idxMass]) : 120,
              unitCostUSD: (idxCost !== -1 && parseFloat(cols[idxCost])) ? parseFloat(cols[idxCost]) : 2.50,
              joineryType: (idxJoinery !== -1 && cols[idxJoinery]) ? cols[idxJoinery] as any : infJoinery,
              tensileStrengthMPa: (idxTensile !== -1 && parseFloat(cols[idxTensile])) ? parseFloat(cols[idxTensile]) : infTensile,
              maxOperatingTempC: (idxTemp !== -1 && parseFloat(cols[idxTemp])) ? parseFloat(cols[idxTemp]) : 85,
              recyclablePercent: (idxRecyclable !== -1 && parseFloat(cols[idxRecyclable])) ? parseFloat(cols[idxRecyclable]) : 30,
              disassemblyTimeSec: (idxDisassembly !== -1 && parseFloat(cols[idxDisassembly])) ? parseFloat(cols[idxDisassembly]) : 20,
              carbonFootprintKgCO2PerKg: (idxCarbon !== -1 && parseFloat(cols[idxCarbon])) ? parseFloat(cols[idxCarbon]) : infCarbon
            };
          });
        }
        if (items.length > 0) {
          onCustomFileUpload(items, file.name);
        }
      } catch (err) {
        alert('Could not parse BOM file. Please upload a valid CSV or JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleCADFileUpload = async (file: File) => {
    setIsParsingCAD(true);
    setCadError(null);
    try {
      const buffer = await file.arrayBuffer();
      const model = await parseStepBuffer(buffer);
      const bomItems = cadPartsToBomItems(model.parts);

      if (onCADModelLoaded) {
        onCADModelLoaded(model);
      }

      if (bomItems.length > 0) {
        onCustomFileUpload(bomItems, file.name);
      } else {
        setCadError('No parts found in CAD file.');
      }
    } catch (err) {
      console.error('CAD parse error:', err);
      setCadError(err instanceof Error ? err.message : 'Failed to parse CAD file.');
    } finally {
      setIsParsingCAD(false);
    }
  };

  const handleGenerateBOM = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/bom/from-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      const data = await res.json();
      if (data && data.success && data.items) {
        onCustomFileUpload(data.items, description.trim());
      } else {
        alert(data.error || 'Failed to generate Bill of Materials from description.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error generating BOM description.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in py-4">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="font-display text-2xl font-bold text-white tracking-tight">
          Select Bill of Materials Workspace
        </h2>
        <p className="text-xs text-slate-400">
          Load a preset, upload your spreadsheet, or describe your product to initialize.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Presets Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <h3 className="font-display text-sm font-bold text-white">
                Sample BOM Presets
              </h3>
            </div>
            <div className="space-y-2 pt-2">
              {SAMPLE_BOMS.map((bom) => (
                <button
                  key={bom.id}
                  onClick={() => onSelectSampleBOM(bom)}
                  className="w-full text-left rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 hover:border-emerald-500/40 transition group flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-display text-xs font-bold text-white group-hover:text-emerald-300">
                      {bom.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {bom.items.length} parts
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Card — CSV/JSON + CAD tabs */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display text-sm font-bold text-white">
                  Upload Custom BOM
                </h3>
              </div>
              {/* Tab selector */}
              <div className="mt-2 flex rounded-lg bg-black/30 border border-white/10 p-0.5">
                <button
                  onClick={() => setUploadTab('csv')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-bold transition ${
                    uploadTab === 'csv'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  CSV / JSON
                </button>
                <button
                  onClick={() => setUploadTab('cad')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-bold transition ${
                    uploadTab === 'cad'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Box className="h-3 w-3" />
                  CAD (STEP/STP)
                </button>
              </div>
            </div>

            {/* CSV/JSON tab */}
            {uploadTab === 'csv' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border border-dashed rounded-xl p-6 text-center transition flex-1 flex flex-col items-center justify-center min-h-[140px] ${
                  dragActive ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/15 bg-black/20'
                }`}
              >
                <FileSpreadsheet className="h-8 w-8 text-emerald-400 mb-1.5 opacity-80" />
                <span className="block text-[11px] font-semibold text-slate-200">
                  Drag & Drop file
                </span>
                <span className="block text-[9px] text-slate-500">
                  Supports .csv / .json
                </span>

                <label className="mt-3 inline-block cursor-pointer rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-white/10 border border-white/15">
                  Browse
                  <input
                    type="file"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            )}

            {/* CAD (STEP/STP) tab */}
            {uploadTab === 'cad' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleCADFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border border-dashed rounded-xl p-6 text-center transition flex-1 flex flex-col items-center justify-center min-h-[140px] ${
                  isParsingCAD
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : dragActive
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-white/15 bg-black/20'
                }`}
              >
                {isParsingCAD ? (
                  <>
                    <RefreshCw className="h-8 w-8 text-cyan-400 mb-1.5 animate-spin" />
                    <span className="block text-[11px] font-semibold text-cyan-300">
                      Parsing STEP geometry...
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-1">
                      Loading WASM + extracting part tree
                    </span>
                  </>
                ) : (
                  <>
                    <Box className="h-8 w-8 text-cyan-400 mb-1.5 opacity-80" />
                    <span className="block text-[11px] font-semibold text-slate-200">
                      Drag & Drop CAD file
                    </span>
                    <span className="block text-[9px] text-slate-500">
                      Supports .step / .stp
                    </span>

                    {cadError && (
                      <span className="block text-[10px] text-red-400 mt-1 font-medium">
                        {cadError}
                      </span>
                    )}

                    <label className="mt-3 inline-block cursor-pointer rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-white/10 border border-white/15">
                      Browse
                      <input
                        type="file"
                        accept=".step,.stp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleCADFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Describe Your Product Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <h3 className="font-display text-sm font-bold text-white">
                Describe Your Product
              </h3>
            </div>

            <div className="flex-1 flex flex-col gap-3 pt-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isGenerating}
                placeholder="Describe the product, e.g. 'a wooden office chair with steel frame and foam cushion'"
                className="w-full flex-1 min-h-[100px] text-xs bg-black/35 rounded-xl border border-white/10 p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
              />

              <button
                onClick={handleGenerateBOM}
                disabled={isGenerating || !description.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating BOM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate BOM & Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
