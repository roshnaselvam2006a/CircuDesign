import { BOMItem } from '../../types';

export function runBomDeconstructionAgent(items: BOMItem[]) {
  const totalParts = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalMassGrams = items.reduce((acc, item) => acc + (item.massGrams * item.quantity), 0);
  const totalCostUSD = items.reduce((acc, item) => acc + (item.unitCostUSD * item.quantity), 0);
  
  // Baseline carbon calculation: mass (kg) * carbon footprint (kg CO2e / kg)
  const baselineCarbonKgCO2 = items.reduce((acc, item) => {
    const massKg = (item.massGrams * item.quantity) / 1000;
    return acc + (massKg * item.carbonFootprintKgCO2PerKg);
  }, 0);

  const gluedCount = items.filter(i => i.joineryType === 'Adhesive/Glued' || i.joineryType === 'Ultrasonic Weld').length;
  const easyToDisassembleCount = items.filter(i => i.joineryType === 'Snap-fit' || i.joineryType === 'Threaded Fasteners' || i.joineryType === 'Press-fit').length;

  const recommendations: string[] = [];
  if (gluedCount > 0) {
    recommendations.push(`Flagged ${gluedCount} glued/welded joint(s). Replace chemical adhesives with mechanical snap-fits or bio-adhesives to improve disassembly score by ~35%.`);
  }
  if (items.some(i => i.currentMaterial.toLowerCase().includes('pvc'))) {
    recommendations.push('High toxic risk detected: Synthetic PVC contains hazardous phthalate plasticizers. Priority replacement needed.');
  }
  if (items.some(i => i.currentMaterial.toLowerCase().includes('carbon fiber'))) {
    recommendations.push('High embodied carbon detected: Virgin thermoset carbon fiber is non-recyclable. Consider flax-fiber bio-epoxy composites.');
  }

  return {
    totalParts,
    totalMassGrams: Math.round(totalMassGrams * 10) / 10,
    totalCostUSD: Math.round(totalCostUSD * 100) / 100,
    baselineCarbonKgCO2: Math.round(baselineCarbonKgCO2 * 100) / 100,
    parts: items,
    joineryAnalysis: {
      easyToDisassembleCount,
      gluedCount,
      recommendations
    }
  };
}
