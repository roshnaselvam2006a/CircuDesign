import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { runBomDeconstructionAgent } from '../agents/bomAgent';
import { runMaterialScienceAgent } from '../agents/materialAgent';
import { runStructuralIntegrityAgent } from '../agents/structuralAgent';
import { runCircularLifecycleAgent } from '../agents/lifecycleAgent';
import { runOrchestratorAgent } from '../agents/orchestratorAgent';
import { SAMPLE_BOMS } from '../../data/sampleBoms';
import { PipelineRun, BOMItem } from '../../types';

export const apiRouter = Router();

// In-memory run history store for rapid, seamless session state (persisted per userUid)
const runStore = new Map<string, PipelineRun[]>();

// Programmatic helper to infer missing engineering properties for generated BOMItems
function inferBOMItem(part: { part_name: string; material: string; quantity?: number; weight_g?: number }, index: number): BOMItem {
  const name = part.part_name || `Part ${index + 1}`;
  const material = part.material || 'Virgin ABS';
  const qty = part.quantity || 1;
  const weight = part.weight_g || 100;

  let category: BOMItem['category'] = 'Housing/Enclosure';
  let tensileStrengthMPa = 45;
  let carbonFootprintKgCO2PerKg = 3.8;
  let joineryType: BOMItem['joineryType'] = 'Snap-fit';
  let maxOperatingTempC = 85;
  let recyclablePercent = 30;
  let disassemblyTimeSec = 20;

  const lowerName = name.toLowerCase();
  const lowerMat = material.toLowerCase();

  if (lowerName.includes('frame') || lowerName.includes('bracket') || lowerName.includes('chassis') || lowerName.includes('arm') || lowerName.includes('stand')) {
    category = 'Structural Frame';
    tensileStrengthMPa = 180;
    carbonFootprintKgCO2PerKg = 4.2;
    joineryType = 'Threaded Fasteners';
    maxOperatingTempC = 150;
    recyclablePercent = 70;
    disassemblyTimeSec = 35;
  } else if (lowerName.includes('sink') || lowerName.includes('thermal') || lowerName.includes('radiator')) {
    category = 'Thermal/Heat Sink';
    tensileStrengthMPa = 110;
    carbonFootprintKgCO2PerKg = 8.5;
    joineryType = 'Threaded Fasteners';
    maxOperatingTempC = 200;
    recyclablePercent = 90;
    disassemblyTimeSec = 15;
  } else if (lowerName.includes('pcb') || lowerName.includes('board') || lowerName.includes('circuit') || lowerName.includes('chip') || lowerName.includes('sensor')) {
    category = 'Electronics/PCB';
    tensileStrengthMPa = 250;
    carbonFootprintKgCO2PerKg = 15.0;
    joineryType = 'Threaded Fasteners';
    maxOperatingTempC = 105;
    recyclablePercent = 20;
    disassemblyTimeSec = 60;
  } else if (lowerName.includes('screw') || lowerName.includes('bolt') || lowerName.includes('nut') || lowerName.includes('pin') || lowerName.includes('clip')) {
    category = 'Fasteners/Hardware';
    tensileStrengthMPa = 400;
    carbonFootprintKgCO2PerKg = 2.1;
    joineryType = 'Threaded Fasteners';
    maxOperatingTempC = 300;
    recyclablePercent = 95;
    disassemblyTimeSec = 10;
  } else if (lowerName.includes('seal') || lowerName.includes('gasket') || lowerName.includes('rubber') || lowerMat.includes('silicone') || lowerMat.includes('rubber')) {
    category = 'Flexible/Seals';
    tensileStrengthMPa = 15;
    carbonFootprintKgCO2PerKg = 3.1;
    joineryType = 'Press-fit';
    maxOperatingTempC = 180;
    recyclablePercent = 10;
    disassemblyTimeSec = 5;
  } else if (lowerMat.includes('glass') || lowerMat.includes('lens') || lowerMat.includes('polycarbonate') || lowerMat.includes('pc') || lowerMat.includes('acrylic')) {
    category = 'Housing/Enclosure';
    tensileStrengthMPa = 62;
    carbonFootprintKgCO2PerKg = 6.2;
    joineryType = 'Adhesive/Glued';
    maxOperatingTempC = 110;
    recyclablePercent = 25;
    disassemblyTimeSec = 60;
  } else if (lowerMat.includes('nylon') || lowerMat.includes('pa6') || lowerMat.includes('pa66') || lowerMat.includes('polyamide')) {
    category = 'Structural Frame';
    tensileStrengthMPa = 78;
    carbonFootprintKgCO2PerKg = 7.1;
    joineryType = 'Threaded Fasteners';
    maxOperatingTempC = 130;
    recyclablePercent = 40;
    disassemblyTimeSec = 25;
  } else if (lowerMat.includes('wood') || lowerMat.includes('timber') || lowerMat.includes('oak') || lowerMat.includes('pine') || lowerMat.includes('beech') || lowerMat.includes('maple')) {
    category = 'Structural Frame';
    tensileStrengthMPa = 40;
    carbonFootprintKgCO2PerKg = 0.5;
    joineryType = 'Adhesive/Glued';
    maxOperatingTempC = 60;
    recyclablePercent = 80;
    disassemblyTimeSec = 45;
  }

  // Estimate a reasonable unit cost based on category and weight
  let unitCostUSD = 1.5;
  if (category === 'Structural Frame') unitCostUSD = Math.round((2.5 + (weight / 500)) * 100) / 100;
  else if (category === 'Thermal/Heat Sink') unitCostUSD = Math.round((1.8 + (weight / 200)) * 100) / 100;
  else if (category === 'Electronics/PCB') unitCostUSD = 12.5;
  else unitCostUSD = Math.round((0.5 + (weight / 1000)) * 100) / 100;

  return {
    partId: `P${String(index + 1).padStart(2, '0')}`,
    name,
    category,
    quantity: qty,
    currentMaterial: material,
    massGrams: weight,
    unitCostUSD,
    joineryType,
    tensileStrengthMPa,
    maxOperatingTempC,
    recyclablePercent,
    disassemblyTimeSec,
    carbonFootprintKgCO2PerKg
  };
}

// POST /api/bom/from-description - Generates custom BOM schema from free-text using Groq
apiRouter.post('/bom/from-description', async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ success: false, error: 'Product description is required' });
    }

    const groqKey = process.env.GROQ_API_KEY_BOM;
    if (!groqKey) {
      return res.status(500).json({ success: false, error: 'GROQ_API_KEY_BOM environment variable is not configured' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `You are converting a plain-language product description into a structured Bill of Materials. Given the description below, infer the product's likely parts and materials based on common real-world construction of that product type. Respond ONLY with valid JSON, no preamble, matching this schema:

{
  "parts": [
    { "part_name": "...", "material": "...", "quantity": 1, "weight_g": 0 }
  ]
}

Description: "${description.replace(/"/g, '\\"')}"

Use realistic part breakdowns (e.g. a wooden chair typically has: seat, backrest, legs, frame joints/fasteners). Weight estimates should be reasonable approximations, not exact figures — this is for illustrative comparison, not certified engineering data.`
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned error status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq API returned an empty completion response');
    }

    const parsed = JSON.parse(content);
    if (!parsed || !Array.isArray(parsed.parts)) {
      throw new Error('Invalid JSON response format from Groq');
    }

    const items: BOMItem[] = parsed.parts.map((p: any, idx: number) => inferBOMItem(p, idx));

    return res.json({
      success: true,
      items
    });
  } catch (error: any) {
    console.error('Error generating BOM from description:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate BOM from description'
    });
  }
});

// Gemini AI Client initialization with User-Agent telemetry
let aiClient: GoogleGenAI | undefined;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// POST /api/agent/run - Executes full multi-agent optimization pipeline
apiRouter.post('/agent/run', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { items, bomName, userUid } = req.body;
    const bomItems = items && Array.isArray(items) && items.length > 0 ? items : SAMPLE_BOMS[0].items;
    const title = bomName || 'BOM Optimization Run';
    const uid = userUid || 'guest-session';

    // Agent 1: BOM Deconstruction
    const bomDeconstruction = runBomDeconstructionAgent(bomItems);

    // Agent 2: Material Science
    const materialScience = await runMaterialScienceAgent(bomItems, aiClient);

    // Agent 3: Structural Integrity
    const structuralIntegrity = runStructuralIntegrityAgent(bomItems, materialScience.proposedSwaps);

    // Agent 4: Circular Lifecycle
    const circularLifecycle = runCircularLifecycleAgent(bomItems, materialScience.proposedSwaps);

    // Agent 5: Orchestrator
    const orchestrator = await runOrchestratorAgent(
      bomItems,
      materialScience.proposedSwaps,
      structuralIntegrity,
      circularLifecycle,
      aiClient
    );

    const agentOutputs = {
      bomDeconstruction,
      materialScience,
      structuralIntegrity,
      circularLifecycle,
      orchestrator
    };

    // Calculate cost change percentage
    let totalBaselineCost = 0;
    let totalOptimizedCost = 0;
    for (const item of bomItems) {
      const swap = materialScience.proposedSwaps[item.partId];
      const baselineItemCost = item.unitCostUSD * item.quantity;
      const optimizedItemCost = baselineItemCost * (swap ? swap.costMultiplier : 1.0);
      totalBaselineCost += baselineItemCost;
      totalOptimizedCost += optimizedItemCost;
    }
    const costChangePercent = totalBaselineCost > 0
      ? Math.round(((totalOptimizedCost - totalBaselineCost) / totalBaselineCost) * 1000) / 10
      : 0;

    const latencySec = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));

    const runRecord: PipelineRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      title,
      inputBomName: title,
      bomData: bomItems,
      agentOutputs,
      status: orchestrator.humanGateRequired ? 'needs_review' : 'completed',
      carbonSavedKg: circularLifecycle.carbonSavingsKgCO2,
      carbonSavedPercent: circularLifecycle.carbonSavingsPercent,
      recyclabilityScore: circularLifecycle.recyclabilityPercent,
      disassemblyScore: circularLifecycle.disassemblyScore,
      userUid: uid,
      latencySec,
      costChangePercent
    };

    // Save to user session store
    const userRuns = runStore.get(uid) || [];
    userRuns.unshift(runRecord);
    runStore.set(uid, userRuns);

    return res.json({
      success: true,
      run: runRecord
    });
  } catch (error: any) {
    console.error('Error running agent pipeline:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to run multi-agent pipeline'
    });
  }
});

// GET /api/runs - Retrieve user's run history
apiRouter.get('/runs', (req: Request, res: Response) => {
  const uid = (req.query.userUid as string) || 'guest-session';
  const userRuns = runStore.get(uid) || [];
  return res.json({ runs: userRuns });
});

// DELETE /api/runs/:id - Clear a specific run
apiRouter.delete('/runs/:id', (req: Request, res: Response) => {
  const uid = (req.query.userUid as string) || 'guest-session';
  const runId = req.params.id;
  const userRuns = runStore.get(uid) || [];
  const updated = userRuns.filter(r => r.id !== runId);
  runStore.set(uid, updated);
  return res.json({ success: true });
});
