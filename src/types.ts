export interface BOMItem {
  partId: string;
  name: string;
  category: 'Housing/Enclosure' | 'Structural Frame' | 'Fasteners/Hardware' | 'Electronics/PCB' | 'Flexible/Seals' | 'Thermal/Heat Sink';
  quantity: number;
  currentMaterial: string;
  massGrams: number;
  unitCostUSD: number;
  joineryType: 'Snap-fit' | 'Adhesive/Glued' | 'Molded insert' | 'Threaded Fasteners' | 'Press-fit' | 'Ultrasonic Weld';
  tensileStrengthMPa: number;
  maxOperatingTempC: number;
  recyclablePercent: number;
  disassemblyTimeSec: number;
  carbonFootprintKgCO2PerKg: number;
}

export interface MaterialAlternative {
  id: string;
  name: string;
  category: string;
  carbonFootprintKgCO2PerKg: number;
  recyclabilityScore: number; // 1-100
  tensileStrengthMPa: number;
  costMultiplier: number; // e.g. 0.95 = 5% cheaper, 1.10 = 10% more expensive
  biobasedContentPercent: number;
  toxicityIndex: 'Low (Non-Toxic)' | 'Moderate' | 'High (Hazardous)';
  supplyAvailabilityIndex: 'High' | 'Moderate' | 'Limited (Niche)';
  reasoning: string;
  source?: 'curated' | 'csv' | 'kaggle' | 'web';
  confidence?: number;
  verifiedByStructural?: boolean;
  advantages?: string[];
  tradeoffs?: string[];
}

export interface FlaggedSwap {
  partId: string;
  partName: string;
  currentMaterial: string;
  proposedMaterial: MaterialAlternative;
  riskReason: string;
  tensileStrengthDeltaPercent: number;
  costDeltaPercent: number;
  carbonSavingsPercent: number;
  confidenceScore: number; // 0-100
  userApproved?: boolean;
}

export interface AgentLog {
  id: string;
  agentId: 'bom' | 'material' | 'structural' | 'lifecycle' | 'orchestrator';
  agentName: string;
  timestamp: string;
  status: 'idle' | 'processing' | 'approved' | 'rejected' | 'retrying';
  message: string;
  details?: string;
  confidenceScore?: number;
}

export interface AgentOutputs {
  bomDeconstruction?: {
    totalParts: number;
    totalMassGrams: number;
    totalCostUSD: number;
    baselineCarbonKgCO2: number;
    parts: BOMItem[];
    joineryAnalysis: {
      easyToDisassembleCount: number;
      gluedCount: number;
      recommendations: string[];
    };
  };
  materialScience?: {
    proposedSwaps: Record<string, MaterialAlternative>;
    alternativesResearched: Record<string, MaterialAlternative[]>;
    totalBioBasedIncreasePercent: number;
    ragSourcesUsed: string[];
  };
  structuralIntegrity?: {
    overallStatus: 'passed' | 'failed_needs_swap' | 'flagged_for_human';
    safetyMargins: Record<string, {
      requiredMPa: number;
      proposedMPa: number;
      safetyFactor: number;
      pass: boolean;
      note: string;
    }>;
    retriesTriggered: number;
  };
  circularLifecycle?: {
    disassemblyScore: number; // 1-100
    recyclabilityPercent: number;
    carbonSavingsKgCO2: number;
    carbonSavingsPercent: number;
    toxicityReductionScore: number;
    eolRecoveryPathways: string[];
  };
  orchestrator?: {
    constraintStates: {
      sustainability: boolean;
      structural: boolean;
      cost: boolean;
      supply: boolean;
    };
    iterationsCount: number;
    humanGateRequired: boolean;
    flaggedSwaps: FlaggedSwap[];
    finalVerdict: string;
    executiveSummary: string;
  };
}

export interface PipelineRun {
  id: string;
  timestamp: string;
  title: string;
  inputBomName: string;
  bomData: BOMItem[];
  agentOutputs: AgentOutputs;
  status: 'in_progress' | 'needs_review' | 'completed';
  carbonSavedKg: number;
  carbonSavedPercent: number;
  recyclabilityScore: number;
  disassemblyScore: number;
  userUid: string;
  latencySec?: number;
  costChangePercent?: number;
}

export interface UserAuth {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isGuest: boolean;
}

// ── CAD Integration Types ──

export interface CADPart {
  name: string;
  meshIndices: number[];
  estimatedVolumeCm3: number;
}

export interface ParsedCADModel {
  meshes: any[];   // raw occt-import-js mesh data (positions, normals, indices)
  root: any;       // part tree from occt-import-js
  parts: CADPart[];
}
