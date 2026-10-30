/**
 * Bridge layer: converts CAD-extracted parts → BOMItem[] (the schema agents consume).
 *
 * Uses keyword matching on part names against the material lookup table,
 * then estimates mass from volume × density.
 */

import type { BOMItem, CADPart } from '../types';
import { inferMaterialFromPartName } from './materialLookup';

/**
 * Convert an array of CAD parts (from STEP parsing) into BOMItem[] that
 * the CircuDesign agent pipeline already consumes.
 */
export function cadPartsToBomItems(parts: CADPart[]): BOMItem[] {
  return parts.map((part, index) => {
    const inferred = inferMaterialFromPartName(part.name);

    // Mass = volume (cm³) × density (g/cm³)
    const massGrams = Math.round(part.estimatedVolumeCm3 * inferred.densityGPerCm3 * 10) / 10;

    // Rough cost estimation based on mass and material category
    const costPerGram = getCostPerGram(inferred.material);
    const unitCostUSD = Math.round(massGrams * costPerGram * 100) / 100;

    return {
      partId: `CAD-${(index + 1).toString().padStart(2, '0')}`,
      name: cleanPartName(part.name),
      category: inferred.category,
      quantity: 1,
      currentMaterial: inferred.material,
      massGrams: Math.max(massGrams, 1), // minimum 1g
      unitCostUSD: Math.max(unitCostUSD, 0.10), // minimum $0.10
      joineryType: inferred.joineryType,
      tensileStrengthMPa: inferred.tensileStrengthMPa,
      maxOperatingTempC: 85, // reasonable default
      recyclablePercent: inferred.recyclablePercent,
      disassemblyTimeSec: getDisassemblyTime(inferred.joineryType),
      carbonFootprintKgCO2PerKg: inferred.carbonFootprintKgCO2PerKg,
    };
  });
}

/**
 * Clean up part names from STEP files (remove OCCT artifacts, underscores, etc.)
 */
function cleanPartName(raw: string): string {
  let name = raw
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove common STEP artifacts like trailing numbers or IDs
  name = name.replace(/\s*\d+\s*$/, '').trim();

  // Capitalize first letter of each word
  name = name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return name || 'Unnamed Part';
}

/** Rough cost per gram by material type */
function getCostPerGram(material: string): number {
  const lower = material.toLowerCase();
  if (lower.includes('titanium')) return 0.15;
  if (lower.includes('stainless')) return 0.008;
  if (lower.includes('steel')) return 0.003;
  if (lower.includes('aluminum')) return 0.012;
  if (lower.includes('copper')) return 0.025;
  if (lower.includes('nylon') || lower.includes('polyamide')) return 0.015;
  if (lower.includes('polycarbonate')) return 0.012;
  if (lower.includes('silicone') || lower.includes('rubber')) return 0.02;
  if (lower.includes('fr-4') || lower.includes('pcb')) return 0.05;
  return 0.008; // generic plastic
}

/** Estimated disassembly time based on joinery type */
function getDisassemblyTime(joineryType: BOMItem['joineryType']): number {
  switch (joineryType) {
    case 'Snap-fit': return 8;
    case 'Threaded Fasteners': return 15;
    case 'Press-fit': return 12;
    case 'Adhesive/Glued': return 45;
    case 'Ultrasonic Weld': return 60;
    case 'Molded insert': return 25;
    default: return 20;
  }
}
