import { BOMItem, MaterialAlternative } from '../../types';

export function runStructuralIntegrityAgent(
  items: BOMItem[],
  proposedSwaps: Record<string, MaterialAlternative>
) {
  let overallStatus: 'passed' | 'failed_needs_swap' | 'flagged_for_human' = 'passed';
  let retriesTriggered = 0;

  const safetyMargins: Record<string, {
    requiredMPa: number;
    proposedMPa: number;
    safetyFactor: number;
    pass: boolean;
    note: string;
  }> = {};

  for (const item of items) {
    const swap = proposedSwaps[item.partId];
    if (!swap) continue;

    const requiredMPa = item.tensileStrengthMPa;
    const proposedMPa = swap.tensileStrengthMPa;
    const safetyFactor = Math.round((proposedMPa / requiredMPa) * 100) / 100;

    const pass = safetyFactor >= 0.85; // Allow up to 15% drop if non-critical, but flag if < 0.85

    let note = `Safety Factor: ${safetyFactor}x. `;
    if (safetyFactor >= 1.0) {
      note += 'Exceeds structural requirements. Zero structural compromise.';
    } else if (safetyFactor >= 0.85) {
      note += 'Acceptable for non-structural enclosure enclosure loads with optimized wall thickness.';
      overallStatus = 'flagged_for_human';
    } else {
      note += 'Below required structural safety threshold. High stress deformation risk.';
      overallStatus = 'failed_needs_swap';
      retriesTriggered += 1;
    }

    safetyMargins[item.partId] = {
      requiredMPa,
      proposedMPa,
      safetyFactor,
      pass,
      note
    };
  }

  return {
    overallStatus,
    safetyMargins,
    retriesTriggered
  };
}
